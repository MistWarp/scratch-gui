import {getAllSprites, getAllCostumes, getAllCustomBlocks, getAllSounds} from './vmHelpers.js';
import {evaluateMath, tryUnitConversion} from './mathUtils.js';
import {recentRank, RECENTS_MAX} from './recents.js';

const normalize = value => `${value || ''}`.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isSubsequence = (needle, haystack) => {
    let index = 0;
    for (const character of haystack) {
        if (character === needle[index]) index++;
        if (index === needle.length) return true;
    }
    return false;
};

const scoreText = (value, rawQuery) => {
    const text = normalize(value);
    const query = normalize(rawQuery);
    if (!text || !query) return 0;
    if (text === query) return 4000;
    if (text.startsWith(query)) return 3200 - text.length;

    const words = text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (words.some(word => word.startsWith(query))) return 2600 - text.length;
    if (text.includes(query)) return 2000 - text.length;

    const terms = query.split(/\s+/);
    if (terms.every(term => words.some(word => word.includes(term)))) return 1400 - text.length;
    if (terms.every(term => words.some(word => isSubsequence(term, word)))) return 600 - text.length;

    const initials = words.map(word => word[0]).join('');
    if (initials.length > 1 && initials.startsWith(query)) return 500 - text.length;
    return 0;
};

const recentBoost = (recents, kind, key) => {
    if (!recents || recents.length === 0 || !key) return 0;
    const rank = recentRank(recents, kind, key);
    return rank >= 0 ? (RECENTS_MAX - rank) * 30 : 0;
};

const rankNamed = (items, query, getText, toResult, getBoost) => items.map((item, index) => {
    const base = scoreText(getText(item), query);
    return {
        item,
        index,
        score: base > 0 ? base + (getBoost ? getBoost(item) : 0) : 0
    };
}).filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(result => ({...toResult(result.item), score: result.score}));

const appendSection = (blockList, title, results) => {
    if (results.length === 0) return;
    blockList.push({block: null, isHeader: true, headerText: title});
    blockList.push(...results);
};

const SUGGESTED_ACTION_IDS = ['green-flag', 'open-settings', 'open-extensions', 'open-help'];

const buildEmptyState = (blockList, querier, actions, recents) => {
    const recentResults = [];
    for (const entry of recents) {
        if (recentResults.length >= 8) break;
        if (entry.kind === 'action') {
            const action = actions.find(candidate => candidate.id === entry.key);
            if (action) recentResults.push({block: null, actionData: action, isAction: true});
        } else if (entry.kind === 'block') {
            const results = querier.queryWorkspace(entry.key).results;
            if (results.length > 0) {
                recentResults.push({
                    block: results[0].getBlock(),
                    autocompleteFactory: endOnly => results[0].toText(endOnly)
                });
            }
        }
    }
    appendSection(blockList, 'Recent', recentResults);

    if (recentResults.length < 4) {
        const recentActionIds = new Set(recents.filter(e => e.kind === 'action').map(e => e.key));
        const suggested = SUGGESTED_ACTION_IDS
            .map(id => actions.find(action => action.id === id))
            .filter(action => action && !recentActionIds.has(action.id))
            .map(action => ({block: null, actionData: action, isAction: true}));
        appendSection(blockList, 'Suggested', suggested);
    }
};

/**
 * Search blocks and project assets, returning a short ranked result list.
 * @param {string} searchValue Search value
 * @param {any} querier WorkspaceQuerier instance
 * @param {any[]} blockTypes Indexed block types
 * @param {any} vm VM instance
 * @param {number} previewLimit Maximum block results
 * @param {string} searchMode 'blocks' or 'everything'
 * @param {object} extras Everything-mode extras: {actions, recents}
 * @returns {object} Search results and computed value metadata
 */
const performSearch = (searchValue, querier, blockTypes, vm, previewLimit, searchMode = 'everything', extras = {}) => {
    const query = normalize(searchValue);
    const blockList = [];
    const {actions = [], docs = [], recents = []} = extras;

    if (!query) {
        if (searchMode === 'everything') {
            buildEmptyState(blockList, querier, actions, recents);
        }
        return {
            blockList,
            queryIllegalResult: null,
            limited: false,
            mathResult: null,
            conversionResult: null
        };
    }

    const queryResultObj = querier.queryWorkspace(searchValue);
    const queryResults = queryResultObj.results;
    const entityLimit = Math.max(4, Math.min(8, Math.floor(previewLimit / 4)));
    let limited = queryResultObj.limited || queryResults.length > previewLimit;

    if (searchMode === 'everything') {
        const sprites = rankNamed(
            getAllSprites(vm),
            query,
            item => `${item.name} sprite character`,
            item => ({block: null, spriteData: item, isSprite: true}),
            item => recentBoost(recents, 'asset', `sprite:${item.name}`)
        );
        const costumes = rankNamed(
            getAllCostumes(vm),
            query,
            item => `${item.name} costume image`,
            item => ({block: null, costumeData: item, isCostume: true}),
            item => recentBoost(recents, 'asset', `costume:${item.name}`)
        );
        const sounds = rankNamed(
            getAllSounds(vm),
            query,
            item => `${item.name} sound audio`,
            item => ({block: null, soundData: item, isSound: true}),
            item => recentBoost(recents, 'asset', `sound:${item.name}`)
        );
        const customBlocks = rankNamed(
            getAllCustomBlocks(vm),
            query,
            item => `${item.displayName} ${item.targetName} custom block procedure`,
            item => ({block: null, customBlockData: item, isCustomBlock: true}),
            item => recentBoost(recents, 'asset', `customblock:${item.displayName}`)
        );
        const actionResults = rankNamed(
            actions,
            query,
            item => `${item.label} ${(item.keywords || []).join(' ')}`,
            item => ({block: null, actionData: item, isAction: true}),
            item => recentBoost(recents, 'action', item.id)
        );
        const docsResults = rankNamed(
            docs,
            query,
            item => `${item.label} ${(item.keywords || []).join(' ')}`,
            item => ({block: null, actionData: item, isAction: true}),
            item => recentBoost(recents, 'action', item.id)
        );

        limited = limited || [sprites, costumes, sounds, customBlocks]
            .some(results => results.length > entityLimit);
        appendSection(blockList, 'Sprites', sprites.slice(0, entityLimit));
        appendSection(blockList, 'Costumes', costumes.slice(0, entityLimit));
        appendSection(blockList, 'Sounds', sounds.slice(0, entityLimit));
        appendSection(blockList, 'Custom Blocks', customBlocks.slice(0, entityLimit));
        appendSection(blockList, 'Actions', actionResults.slice(0, entityLimit));
        appendSection(blockList, 'Docs', docsResults.slice(0, entityLimit));
    }

    const blocks = queryResults.map((queryResult, index) => ({
        queryResult,
        index,
        score: (scoreText(queryResult.toText(false), query) || 1) +
            (searchMode === 'everything' ? recentBoost(recents, 'block', queryResult.toText(false)) : 0)
    })).sort((a, b) => b.score - a.score || a.index - b.index)
        .slice(0, previewLimit)
        .map(result => ({
            block: result.queryResult.getBlock(),
            autocompleteFactory: endOnly => result.queryResult.toText(endOnly),
            score: result.score
        }));
    appendSection(blockList, 'Blocks', blocks);

    const mathResult = evaluateMath(searchValue);
    const conversionResult = mathResult === null ? tryUnitConversion(searchValue) : null;

    return {
        blockList,
        queryIllegalResult: queryResultObj.illegalResult,
        limited,
        mathResult,
        conversionResult
    };
};

export {
    performSearch,
    scoreText
};

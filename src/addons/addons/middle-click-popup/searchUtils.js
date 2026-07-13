import {getAllSprites, getAllCostumes, getAllCustomBlocks, getAllSounds} from './vmHelpers.js';
import {evaluateMath, tryUnitConversion} from './mathUtils.js';

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
    return 0;
};

const rankNamed = (items, query, getText, toResult) => items.map((item, index) => ({
    item,
    index,
    score: scoreText(getText(item), query)
})).filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(result => ({...toResult(result.item), score: result.score}));

const appendSection = (blockList, title, results) => {
    if (results.length === 0) return;
    blockList.push({block: null, isHeader: true, headerText: title});
    blockList.push(...results);
};

/**
 * Search blocks and project assets, returning a short ranked result list.
 * @param {string} searchValue Search value
 * @param {any} querier WorkspaceQuerier instance
 * @param {any[]} blockTypes Indexed block types
 * @param {any} vm VM instance
 * @param {number} previewLimit Maximum block results
 * @param {string} searchMode 'blocks' or 'everything'
 * @returns {object} Search results and computed value metadata
 */
const performSearch = (searchValue, querier, blockTypes, vm, previewLimit, searchMode = 'everything') => {
    const query = normalize(searchValue);
    const blockList = [];
    if (!query) {
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
            item => ({block: null, spriteData: item, isSprite: true})
        );
        const costumes = rankNamed(
            getAllCostumes(vm),
            query,
            item => `${item.name} costume image`,
            item => ({block: null, costumeData: item, isCostume: true})
        );
        const sounds = rankNamed(
            getAllSounds(vm),
            query,
            item => `${item.name} sound audio`,
            item => ({block: null, soundData: item, isSound: true})
        );
        const customBlocks = rankNamed(
            getAllCustomBlocks(vm),
            query,
            item => `${item.displayName} ${item.targetName} custom block procedure`,
            item => ({block: null, customBlockData: item, isCustomBlock: true})
        );

        limited = limited || [sprites, costumes, sounds, customBlocks]
            .some(results => results.length > entityLimit);
        appendSection(blockList, 'Sprites', sprites.slice(0, entityLimit));
        appendSection(blockList, 'Costumes', costumes.slice(0, entityLimit));
        appendSection(blockList, 'Sounds', sounds.slice(0, entityLimit));
        appendSection(blockList, 'Custom Blocks', customBlocks.slice(0, entityLimit));
    }

    const blocks = queryResults.map((queryResult, index) => ({
        queryResult,
        index,
        score: scoreText(queryResult.toText(false), query) || 1
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

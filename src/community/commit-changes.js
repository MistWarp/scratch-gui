import {classifyAssetFile} from './asset-media.js';
import {scriptChangeDiff} from './scratchblocks-translate.js';

const FRACTCH_FILE = /\.fractch$/i;
const LONG_DECIMAL = /^-?\d+\.\d{3,}$/;

export const isChangesResponse = data => Boolean(
    data && data.ok !== false && !data.legacy && Array.isArray(data.targets)
);

export const targetDir = target => String(target?.path || '');

export const targetName = target => {
    const dir = targetDir(target);
    if (dir === 'Stage') return 'Stage';
    if (target?.name) return target.name;
    const named = [...(target?.state || []), ...(target?.items || [])]
        .find(entry => entry.kind === 'sprite' && entry.name);
    return named ? named.name : dir;
};

const assetDirOf = path => {
    const parts = String(path || '').split('/');
    return parts.length > 2 && parts[1] === 'assets' ? parts[0] : '';
};

export const fileStatusLabel = status => {
    if (status === 'added') return 'Added';
    if (status === 'removed' || status === 'deleted') return 'Deleted';
    return 'Modified';
};

export const groupChangedFiles = data => {
    const assets = {};
    const others = [];
    for (const file of data?.files || []) {
        const dir = assetDirOf(file.path);
        const entry = {...file, status: fileStatusLabel(file.status)};
        if (dir && classifyAssetFile(file.path) !== 'code') {
            if (!assets[dir]) assets[dir] = [];
            assets[dir].push(entry);
        } else {
            others.push(entry);
        }
    }
    return {assets, others};
};

export const scriptWasMoved = script => script.change === 'moved';

export const hasMarkedLines = diff => String(diff || '').split('\n').some(line => /^[+-]\s/.test(line));

export const plainScriptTitle = title => String(title || '')
    .replace(/\s*::\s*[a-z]+/gi, '')
    .replace(/\[([^\]]*?)(?: v)?\]/g, '$1')
    .trim();

const analyseScripts = scripts => {
    const shown = [];
    let rewritten = 0;
    for (const script of scripts || []) {
        if (scriptWasMoved(script)) {
            shown.push({script, rendered: null});
            continue;
        }
        const rendered = scriptChangeDiff(script.before, script.after);
        if (rendered && script.change === 'changed' && !hasMarkedLines(rendered.diff)) {
            rewritten++;
            continue;
        }
        shown.push({script, rendered});
    }
    return {shown, rewritten};
};

export const assetFileOf = body => {
    const match = String(body || '').match(/\bfile\s+"([^"]+)"/);
    return match ? match[1] : '';
};

const relativeAssetPath = path => String(path || '').split('/').slice(1).join('/');

const emptyTarget = dir => ({path: dir, status: 'modified', files: [], scripts: [], items: [], state: []});

export const summarizeEntries = (entries, others = []) => {
    const scripts = entries.flatMap(entry => entry.scripts.map(item => item.script.change));
    const countOf = change => scripts.filter(value => value === change).length;
    const authored = entries.filter(entry => entry.authored);
    const withState = entries.filter(entry => entry.state.length);
    return {
        sprites: authored.length,
        scriptsChanged: countOf('changed'),
        scriptsAdded: countOf('added'),
        scriptsRemoved: countOf('removed'),
        scriptsMoved: countOf('moved'),
        rewritten: entries.reduce((sum, entry) => sum + entry.rewritten, 0),
        items: entries.flatMap(entry => entry.items),
        files: others.length,
        stateSprites: withState.length,
        stateOnly: !authored.length && !others.length && withState.length > 0,
        tooLarge: entries.some(entry => entry.target.tooLarge)
    };
};

export const analyseChanges = data => {
    const {assets, others: allOthers} = groupChangedFiles(data);
    const others = allOthers.filter(file => file.path !== 'fractch.json');
    const sources = [...(data?.targets || [])];
    const known = new Set(sources.map(targetDir));
    for (const dir of Object.keys(assets).sort()) {
        if (!known.has(dir)) sources.push(emptyTarget(dir));
    }
    const targets = sources.map(target => {
        const dir = targetDir(target);
        const {shown, rewritten} = analyseScripts(target.scripts);
        const assetFiles = assets[dir] || [];
        const items = target.items || [];
        const named = new Set(items.map(item => assetFileOf(item.after || item.before)).filter(Boolean));
        const unnamedAssets = assetFiles.filter(file => !named.has(relativeAssetPath(file.path)));
        const count = shown.length + items.length + unnamedAssets.length;
        return {
            target,
            dir,
            name: targetName(target),
            scripts: shown,
            rewritten,
            items,
            assets: assetFiles,
            state: target.state || [],
            count,
            authored: Boolean(count || assetFiles.length || target.tooLarge)
        };
    });
    const ordered = [...targets].sort((a, b) => Number(b.authored) - Number(a.authored));
    return {targets: ordered, others, summary: summarizeEntries(targets, others)};
};

export const describeTarget = (entry, text) => {
    if (entry.target.tooLarge && !entry.count) return text('Too large to compare');
    if (!entry.authored) return entry.state.length ? text('Saved state only') : text('No block changes');
    return entry.count === 1 ? text('1 change') : text('{value1} changes', {value1: entry.count});
};

export const findTarget = (analysis, dir) => (analysis?.targets || []).find(entry => entry.dir === dir) || null;

export const spriteFractchPath = entry => {
    const files = (entry.target.files || []).filter(path => FRACTCH_FILE.test(path));
    return files.find(path => /\/main\.fractch$/i.test(path)) || files[0] || `${entry.dir}/main.fractch`;
};

const THUMB_TEXT_LIMIT = 40;
const THUMB_TEXT_CONCURRENCY = 6;

export const loadSpriteTexts = async (analysis, readText) => {
    const paths = (analysis?.targets || [])
        .filter(entry => entry.dir && entry.dir !== 'Stage' && entry.target.status !== 'removed')
        .slice(0, THUMB_TEXT_LIMIT)
        .map(spriteFractchPath);
    const texts = {};
    let next = 0;
    const worker = async () => {
        while (next < paths.length) {
            const path = paths[next++];
            try {
                texts[path] = {before: '', after: await readText(path)};
            } catch (error) {
                texts[path] = null;
            }
        }
    };
    await Promise.all(Array.from({length: Math.min(THUMB_TEXT_CONCURRENCY, paths.length)}, worker));
    return Object.fromEntries(Object.entries(texts).filter(([, value]) => value));
};

export const sidebarFilesFor = analysis => (analysis?.targets || []).flatMap(entry => {
    const files = (entry.target.files || []).filter(path => FRACTCH_FILE.test(path));
    const paths = files.length ? files : [`${entry.dir}/main.fractch`];
    return [
        ...paths.map(path => ({path})),
        ...entry.assets.filter(file => file.status !== 'Deleted').map(file => ({path: file.path}))
    ];
});

const roundNumber = value => {
    if (!LONG_DECIMAL.test(value)) return value;
    const rounded = Math.round(Number(value) * 100) / 100;
    return Number.isFinite(rounded) ? String(rounded) : value;
};

export const formatStateValue = value => {
    const text = String(value ?? '');
    if (text.includes(',') && text.split(',').every(part => /^-?\d+(?:\.\d+)?$/.test(part.trim()))) {
        return text.split(',').map(part => roundNumber(part.trim())).join(', ');
    }
    return roundNumber(text.trim());
};

export const itemLines = text => String(text || '').split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim());

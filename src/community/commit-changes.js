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

export const analyseChanges = data => {
    const {assets, others} = groupChangedFiles(data);
    const targets = (data?.targets || []).map(target => {
        const dir = targetDir(target);
        const {shown, rewritten} = analyseScripts(target.scripts);
        const assetFiles = assets[dir] || [];
        const items = target.items || [];
        const count = shown.length + items.length + assetFiles.length;
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
            authored: Boolean(count || target.tooLarge)
        };
    });
    const ordered = [...targets].sort((a, b) => Number(b.authored) - Number(a.authored));
    const totals = data?.totals || {};
    const scripts = totals.scripts || {};
    const assetTotals = totals.assets || {};
    const rewritten = targets.reduce((sum, entry) => sum + entry.rewritten, 0);
    const allItems = targets.flatMap(entry => entry.items);
    return {
        targets: ordered,
        others,
        items: allItems,
        summary: {
            sprites: targets.filter(entry => entry.authored).length,
            scriptsChanged: Math.max(0, (Number(scripts.changed) || 0) - rewritten),
            scriptsAdded: Number(scripts.added) || 0,
            scriptsRemoved: Number(scripts.removed) || 0,
            scriptsMoved: Number(scripts.moved) || 0,
            rewritten,
            assets: (Number(assetTotals.added) || 0) + (Number(assetTotals.removed) || 0) +
                (Number(assetTotals.modified) || 0),
            files: Number(totals.files) || 0,
            state: Number(totals.state) || 0,
            stateSprites: targets.filter(entry => entry.state.length).length,
            stateOnly: Boolean(totals.stateOnly),
            tooLarge: targets.some(entry => entry.target.tooLarge)
        }
    };
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

export const assetFileOf = body => {
    const match = String(body || '').match(/\bfile\s+"([^"]+)"/);
    return match ? match[1] : '';
};

export const itemLines = text => String(text || '').split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim());

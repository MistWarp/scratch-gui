import {parseFractch} from 'fractch/browser';
import {inlineDataToBytes} from './asset-media.js';

const decodeInlineText = inline => {
    const bytes = inlineDataToBytes(inline);
    return bytes ? new TextDecoder().decode(bytes) : null;
};

export const textsFromInspectionFiles = files => {
    const texts = {};
    for (const file of files || []) {
        if (!/\.fractch$/i.test(file?.path || '')) continue;
        const status = String(file?.status || 'modified').toLowerCase();
        const added = status === 'added';
        const removed = status === 'removed' || status === 'deleted';
        const before = decodeInlineText(file.oldData);
        const after = decodeInlineText(file.newData);
        if (added && after === null) continue;
        if (removed && before === null) continue;
        if (!added && !removed && (before === null || after === null)) continue;
        texts[file.path] = {before: before || '', after: after || '', status};
    }
    return texts;
};

const formatValue = value => {
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (value === null || typeof value === 'undefined') return 'empty';
    return JSON.stringify(String(value));
};

const round1 = value => Math.round(Number(value) * 10) / 10;
const round2 = value => Math.round(Number(value) * 100) / 100;
const roundInt = value => Math.round(Number(value));
const EPSILON = 0.01;

export const describeHat = script => {
    const head = script.calls[0];
    if (script.kind === 'def') {
        const name = head?.proccode || head?.ident || 'custom block';
        return `Define "${name}"`;
    }
    if (head?.type !== 'call' || head.callee?.type !== 'opcode') return 'A script';
    const fields = {};
    for (const arg of head.args || []) {
        if (arg.kind === 'keyed' && arg.sep === 'field') fields[arg.key] = arg.value?.name || arg.value?.value;
    }
    switch (head.callee.name) {
    case 'event_whenflagclicked': return 'When green flag clicked';
    case 'event_whenkeypressed': return `When [${fields.KEY_OPTION || 'key'}] key pressed`;
    case 'event_whenthisspriteclicked': return 'When this sprite clicked';
    case 'event_whenstageclicked': return 'When stage clicked';
    case 'event_whenbroadcastreceived': return `When I receive [${fields.BROADCAST_OPTION || 'message'}]`;
    case 'event_whenbackdropswitchesto': return `When backdrop switches to [${fields.BACKDROP || ''}]`;
    case 'event_whengreaterthan':
        return `When [${String(fields.WHENGREATERTHANMENU || 'timer').toLowerCase()}] > (${fields.VALUE || ''})`;
    case 'control_start_as_clone': return 'When I start as a clone';
    default: return 'A script';
    }
};

export const scriptKey = script => {
    const head = script.calls[0];
    if (script.kind === 'def') return `def:${head?.ident || head?.proccode || ''}`;
    if (head?.type === 'call' && head.callee?.type === 'opcode' && head.callee.name.startsWith('event_')) {
        const fields = (head.args || [])
            .filter(arg => arg.kind === 'keyed' && arg.sep === 'field')
            .map(arg => `${arg.key}=${JSON.stringify(arg.value?.name ?? arg.value?.value ?? '')}`);
        return `hat:${head.callee.name}:${fields.join(',')}`;
    }
    return null;
};

const summarizeVariables = (before, after, items, global) => {
    const kindOf = decl => {
        if (!global) return decl.isList ? 'List' : 'Variable';
        return decl.isList ? 'Global list' : 'Global variable';
    };
    const beforeById = new Map(before.varDecls.map(decl => [decl.id || `name:${decl.name}`, decl]));
    const afterById = new Map(after.varDecls.map(decl => [decl.id || `name:${decl.name}`, decl]));
    for (const [key, decl] of afterById) {
        const kind = kindOf(decl);
        const old = beforeById.get(key);
        const prefix = global ? `${kind} ` : '';
        if (!old) {
            items.push({
                type: 'variable',
                name: decl.name,
                change: 'added',
                text: `${kind} "${decl.name}" created with default ${formatValue(decl.value)}`
            });
        } else if (JSON.stringify(old.value) !== JSON.stringify(decl.value)) {
            items.push({
                type: 'variable',
                name: decl.name,
                change: 'changed',
                text: `${prefix}"${decl.name}" now starts at ${formatValue(decl.value)}` +
                    ` instead of ${formatValue(old.value)}`
            });
        } else if (old.name !== decl.name) {
            items.push({
                type: 'variable',
                name: decl.name,
                change: 'changed',
                text: `Renamed "${old.name}" to "${decl.name}"`
            });
        }
    }
    for (const [key, decl] of beforeById) {
        if (!afterById.has(key)) {
            items.push({
                type: 'variable',
                name: decl.name,
                change: 'removed',
                text: `${decl.isList ? 'List' : 'Variable'} "${decl.name}" deleted`
            });
        }
    }
};

const SPRITE_LABELS = {
    layer: 'Layer',
    size: 'Size',
    direction: 'Direction',
    volume: 'Volume',
    rotationStyle: 'Rotation style',
    draggable: 'Draggable',
    tempo: 'Tempo'
};

const summarizeSprite = (before, after, items) => {
    const oldProps = before.spriteProps;
    const newProps = after.spriteProps;
    if (!oldProps && !newProps) return;
    if (!oldProps || !newProps) return;
    if (oldProps.name !== newProps.name) {
        items.push({type: 'sprite', change: 'changed', text: `Renamed "${oldProps.name}" to "${newProps.name}"`});
    }
    const distance = Math.hypot(
        Number(newProps.x || 0) - Number(oldProps.x || 0),
        Number(newProps.y || 0) - Number(oldProps.y || 0)
    );
    if (distance >= EPSILON) {
        items.push({
            type: 'sprite',
            change: 'changed',
            text: `Moved to (${round2(newProps.x)}, ${round2(newProps.y)})`
        });
    }
    const oldVisible = oldProps.visible !== false;
    const newVisible = newProps.visible !== false;
    if (oldProps.visible !== newProps.visible && oldVisible !== newVisible) {
        items.push({type: 'sprite', change: 'changed', text: newVisible ? 'Now shown' : 'Now hidden'});
    }
    for (const key of Object.keys(SPRITE_LABELS)) {
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        if (typeof oldValue === 'number' && typeof newValue === 'number') {
            if (Math.abs(newValue - oldValue) < EPSILON) continue;
            items.push({
                type: 'sprite',
                change: 'changed',
                text: `${SPRITE_LABELS[key]} changed from ${round2(oldValue)} to ${round2(newValue)}`
            });
            continue;
        }
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue) && typeof newValue !== 'undefined') {
            items.push({
                type: 'sprite',
                change: 'changed',
                text: `${SPRITE_LABELS[key]} changed to ${formatValue(newValue)}`
            });
        }
    }
};

const summarizeScripts = (before, after, items) => {
    const matchable = scripts => {
        const counts = new Map();
        const out = [];
        for (const script of scripts) {
            const base = scriptKey(script);
            if (!base) continue;
            const seen = counts.get(base) || 0;
            counts.set(base, seen + 1);
            out.push({script, key: seen ? `${base}#${seen}` : base});
        }
        return out;
    };
    const oldByKey = new Map(matchable(before.scripts).map(entry => [entry.key, entry.script]));
    const newByKey = new Map(matchable(after.scripts).map(entry => [entry.key, entry.script]));
    for (const [key, script] of newByKey) {
        const old = oldByKey.get(key);
        if (!old) continue;
        if (roundInt(old.x) !== roundInt(script.x) || roundInt(old.y) !== roundInt(script.y)) {
            items.push({type: 'script', change: 'changed', text: `${describeHat(script)} moved on the canvas`});
        }
    }
};

const summarizeAssets = (before, after, items) => {
    for (const [kind, label] of [['costumes', 'Costume'], ['sounds', 'Sound']]) {
        const assetKind = kind === 'costumes' ? 'costume' : 'sound';
        const oldByName = new Map((before.assets?.[kind] || []).map(entry => [entry.name, entry]));
        const newByName = new Map((after.assets?.[kind] || []).map(entry => [entry.name, entry]));
        const added = [];
        const removed = [];
        for (const [name, entry] of newByName) {
            if (!oldByName.has(name)) added.push(entry);
            else {
                const old = oldByName.get(name);
                if (old.file !== entry.file) {
                    items.push({
                        type: 'asset',
                        asset: assetKind,
                        change: 'changed',
                        name,
                        text: `${label} "${name}" artwork replaced`
                    });
                } else if (
                    assetKind === 'sound' &&
                    (old.rate !== entry.rate || old.samples !== entry.samples)
                ) {
                    items.push({
                        type: 'asset',
                        asset: assetKind,
                        change: 'changed',
                        name,
                        text: `${label} "${name}" audio updated`
                    });
                }
            }
        }
        for (const [name, entry] of oldByName) {
            if (!newByName.has(name)) removed.push(entry);
        }
        const unmatchedAdded = [];
        for (const entry of added) {
            const matchIndex = removed.findIndex(old => old.file === entry.file);
            if (matchIndex >= 0) {
                const [old] = removed.splice(matchIndex, 1);
                items.push({
                    type: 'asset',
                    asset: assetKind,
                    change: 'renamed',
                    name: entry.name,
                    names: [old.name, entry.name],
                    text: `${label} "${old.name}" renamed to "${entry.name}"`
                });
            } else unmatchedAdded.push(entry);
        }
        for (const entry of unmatchedAdded) {
            items.push({
                type: 'asset',
                asset: assetKind,
                change: 'added',
                name: entry.name,
                text: `${label} "${entry.name}" added`
            });
        }
        for (const entry of removed) {
            items.push({
                type: 'asset',
                asset: assetKind,
                change: 'removed',
                name: entry.name,
                text: `${label} "${entry.name}" removed`
            });
        }
        for (const [name, entry] of newByName) {
            const old = oldByName.get(name);
            const centersKnown = [old?.centerX, old?.centerY, entry.centerX, entry.centerY]
                .every(value => typeof value === 'number');
            const centerMoved = old && centersKnown &&
                (round1(old.centerX) !== round1(entry.centerX) || round1(old.centerY) !== round1(entry.centerY));
            if (centerMoved) {
                items.push({
                    type: 'asset',
                    asset: assetKind,
                    change: 'changed',
                    name,
                    text: `${label} "${name}" rotation center moved`
                });
            }
        }
        const oldCurrent = (before.assets?.[kind] || []).find(entry => entry.current)?.name;
        const newCurrent = (after.assets?.[kind] || []).find(entry => entry.current)?.name;
        if (oldCurrent !== newCurrent && newCurrent) {
            items.push({
                type: 'asset',
                asset: assetKind,
                change: 'changed',
                name: newCurrent,
                names: [oldCurrent, newCurrent].filter(Boolean),
                text: assetKind === 'costume' ?
                    `Switched sprite to costume "${newCurrent}"` :
                    `Now showing sound "${newCurrent}"`
            });
        }
    }
};

const summarizeWatchers = (before, after, items) => {
    const keyOf = watch => `${watch.isList ? 'list' : 'var'}:${watch.name}`;
    const oldByKey = new Map((before.watches || []).map(watch => [keyOf(watch), watch]));
    const newByKey = new Map((after.watches || []).map(watch => [keyOf(watch), watch]));
    for (const [key, watch] of newByKey) {
        const old = oldByKey.get(key);
        if (!old) {
            if (watch.visible) {
                items.push({
                    type: 'watcher',
                    change: 'added',
                    name: watch.name,
                    shown: true,
                    text: `Now showing "${watch.name}" on the stage`
                });
            }
        } else if (old.visible !== watch.visible) {
            items.push({
                type: 'watcher',
                change: 'changed',
                name: watch.name,
                text: watch.visible ?
                    `Now showing "${watch.name}" on the stage` : `Stopped showing "${watch.name}" on the stage`
            });
        }
    }
    for (const [key, watch] of oldByKey) {
        if (!newByKey.has(key) && watch.visible) {
            items.push({
                type: 'watcher',
                change: 'removed',
                name: watch.name,
                text: `Stopped showing "${watch.name}" on the stage`
            });
        }
    }
};

const summarizeExtensions = (before, after, items) => {
    const keyOf = decl => `${decl.id || ''}\n${decl.url || ''}`;
    const oldByKey = new Map((before.uses || []).map(decl => [keyOf(decl), decl]));
    const newByKey = new Map((after.uses || []).map(decl => [keyOf(decl), decl]));
    for (const [key, decl] of newByKey) {
        if (!oldByKey.has(key)) items.push({type: 'extension', change: 'added', id: decl.id, url: decl.url || null});
    }
    for (const [key, decl] of oldByKey) {
        if (!newByKey.has(key)) items.push({type: 'extension', change: 'removed', id: decl.id, url: decl.url || null});
    }
};

export const summarizeFractchChange = (beforeText, afterText, opts = {}) => {
    let before;
    let after;
    try {
        before = parseFractch(beforeText || '');
        after = parseFractch(afterText || '');
    } catch (error) {
        return {variables: [], sprite: [], scripts: [], assets: [], watchers: [], extensions: []};
    }
    const summary = {variables: [], sprite: [], scripts: [], assets: [], watchers: [], extensions: []};
    summarizeVariables(before, after, summary.variables, opts.global);
    summarizeSprite(before, after, summary.sprite);
    summarizeScripts(before, after, summary.scripts);
    summarizeAssets(before, after, summary.assets);
    summarizeWatchers(before, after, summary.watchers);
    summarizeExtensions(before, after, summary.extensions);
    return summary;
};

export const isEmptySummary = summary => (
    !summary || Object.values(summary).every(section => !section.length)
);

export const cancelMovedAssets = summariesByGroup => {
    const collect = change => {
        const found = new Map();
        for (const summary of Object.values(summariesByGroup || {})) {
            for (const item of summary.assets || []) {
                if (item.change !== change || !item.name) continue;
                const key = `${item.asset || ''}:${item.name}`;
                if (!found.has(key)) found.set(key, []);
                found.get(key).push({summary, item});
            }
        }
        return found;
    };
    const added = collect('added');
    const removed = collect('removed');
    for (const [key, adds] of added) {
        const removals = removed.get(key) || [];
        while (adds.length && removals.length) {
            const {summary: addSummary, item: addItem} = adds.shift();
            const {summary: removeSummary, item: removeItem} = removals.shift();
            addSummary.assets = addSummary.assets.filter(entry => entry !== addItem);
            removeSummary.assets = removeSummary.assets.filter(entry => entry !== removeItem);
        }
    }
    for (const [group, summary] of Object.entries(summariesByGroup || {})) {
        if (isEmptySummary(summary)) delete summariesByGroup[group];
    }
    return summariesByGroup;
};

const VAR_DECL_LINE = /^(var|list)\b/;
const SPRITE_DECL_LINE = /^(sprite|stage)\b/;
const WATCH_DECL_LINE = /^watch\b/;
const COSTUME_DECL_LINE = /^costume\b/;
const SOUND_DECL_LINE = /^sound\b/;
const USE_DECL_LINE = /^use\b/;
const SCRIPT_HEADER_LINE = /^(script|when|def)\b/;
const POSITION_SUFFIX = / at -?\d[\d.]*,-?\d[\d.]*\s*\{?\s*$/;

const firstQuoted = text => {
    const match = String(text || '').match(/"([^"]*)"/);
    if (match) return match[1];
    const token = String(text || '').split(/\s+/)[1];
    return token || '';
};

const declName = text => {
    if (/^watch\b/.test(text)) {
        const rest = String(text || '').replace(/^watch\s+(?:var|list)\s+/, '');
        return firstQuoted(rest) || rest.split(/\s+/)[0] || '';
    }
    const rest = String(text || '').replace(/^(?:var|list|costume|sound)\s+/, '');
    if (rest.startsWith('"')) return firstQuoted(rest);
    return rest.split(/\s+/)[0] || '';
};

const stripPosition = text => String(text || '').replace(POSITION_SUFFIX, '');

const useDeclId = text => {
    const match = String(text || '').match(/^use\s+"([^"]*)"/);
    return match ? match[1] : '';
};

export const filterCoveredDiffLines = (lines, summary) => {
    if (isEmptySummary(summary)) return {lines, fullyCovered: false};
    const varNames = new Set((summary.variables || []).map(item => item.name).filter(Boolean));
    const watcherNames = new Set((summary.watchers || []).map(item => item.name).filter(Boolean));
    const assetNames = new Set();
    for (const item of summary.assets || []) {
        if (item.name) assetNames.add(item.name);
        for (const name of item.names || []) assetNames.add(name);
    }
    const extensionIds = new Set((summary.extensions || []).map(item => item.id).filter(Boolean));
    const hasSpriteChanges = (summary.sprite || []).length > 0;
    const hasScriptMoves = (summary.scripts || []).length > 0;

    const changed = (lines || []).map((line, index) => ({line, index}))
        .filter(({line}) => line.type === 'add' || line.type === 'del');
    const covered = new Set();
    const contentOf = line => String(line.content || '').slice(1).trim();

    const useLines = changed.filter(({line}) => USE_DECL_LINE.test(contentOf(line)));
    const openUseAdds = useLines.filter(({line}) => line.type === 'add');
    for (const {line: delLine, index: delIndex} of useLines.filter(({line}) => line.type === 'del')) {
        const matchIndex = openUseAdds.findIndex(({line: addLine}) => contentOf(addLine) === contentOf(delLine));
        if (matchIndex >= 0) {
            covered.add(delIndex);
            covered.add(openUseAdds[matchIndex].index);
            openUseAdds.splice(matchIndex, 1);
        }
    }

    if (hasScriptMoves) {
        const headers = changed.filter(({line}) => SCRIPT_HEADER_LINE.test(contentOf(line)));
        const openAdds = headers.filter(({line}) => line.type === 'add');
        for (const {line: delLine, index: delIndex} of headers.filter(({line}) => line.type === 'del')) {
            const matchIndex = openAdds.findIndex(
                ({line: addLine}) => stripPosition(contentOf(addLine)) === stripPosition(contentOf(delLine))
            );
            if (matchIndex >= 0) {
                covered.add(delIndex);
                covered.add(openAdds[matchIndex].index);
                openAdds.splice(matchIndex, 1);
            }
        }
    }

    for (const {line, index} of changed) {
        if (covered.has(index)) continue;
        const text = contentOf(line);
        if ((VAR_DECL_LINE.test(text) && varNames.has(declName(text))) ||
            (SPRITE_DECL_LINE.test(text) && hasSpriteChanges) ||
            (WATCH_DECL_LINE.test(text) && watcherNames.has(declName(text))) ||
            ((COSTUME_DECL_LINE.test(text) || SOUND_DECL_LINE.test(text)) && assetNames.has(declName(text))) ||
            (USE_DECL_LINE.test(text) && extensionIds.has(useDeclId(text)))) {
            covered.add(index);
        }
    }

    if (!covered.size) return {lines: lines || [], fullyCovered: false};
    const visible = [];
    let current = null;
    const flush = () => {
        if (current && current.kept > 0) visible.push(...current.lines);
        current = null;
    };
    (lines || []).forEach((line, index) => {
        if (line.type === 'hunk') {
            flush();
            current = {lines: [line], kept: 0};
            return;
        }
        if (!current) {
            visible.push(line);
            return;
        }
        if ((line.type === 'add' || line.type === 'del') && covered.has(index)) return;
        if (line.type === 'add' || line.type === 'del') current.kept++;
        current.lines.push(line);
    });
    flush();
    const visibleChanges = visible.some(line => line.type === 'add' || line.type === 'del');
    return {lines: visible, fullyCovered: !visibleChanges};
};

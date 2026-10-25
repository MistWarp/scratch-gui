import {unitKind} from './fractch-adapter.js';
import {fileAt, fileIndent, mainEnd, sameFile, scanRegions} from './file-projection.js';

const DECL_HEAD = /^\s*((?:var|cloud|list|local)\s+[^=;]+?)\s*(?:=|;)/;

const declHead = text => {
    const match = DECL_HEAD.exec(text || '');
    return match ? match[1].replace(/\s+/g, ' ') : null;
};

const sliceUnit = (text, units, key) => {
    const range = units && units[key];
    if (!range || range.to <= range.from) return null;
    return text.slice(range.from, range.to);
};

const mapUnits = (units, changes) => {
    const out = {};
    for (const key of Object.keys(units)) {
        const range = units[key];
        const from = changes.mapPos(range.from, 1);
        const to = Math.max(from, changes.mapPos(range.to, -1));
        out[key] = {from, to};
    }
    return out;
};

const editedUnits = (baseline, doc, units) => {
    const edited = [];
    for (const key of Object.keys(baseline.units)) {
        if (sliceUnit(baseline.text, baseline.units, key) !== sliceUnit(doc, units, key)) edited.push(key);
    }
    return edited;
};

const valueOnlyChange = (key, base, theirs, mine) => unitKind(key) === 'decl' &&
    base !== null && theirs !== null && mine !== null &&
    declHead(base) !== null && declHead(base) === declHead(theirs) && declHead(mine) === declHead(theirs);

const separatorFor = key => (unitKind(key) === 'decl' ? '\n' : '\n\n');

const removalEnd = (text, key, to) => {
    let end = to;
    const limit = unitKind(key) === 'decl' ? 1 : 2;
    for (let i = 0; i < limit && text.charCodeAt(end) === 10; i++) end++;
    return end;
};

const orderedKeys = units => Object.keys(units).sort((a, b) => units[a].from - units[b].from);

const reindent = (text, from, to) => (from === to ? text :
    text.split('\n').map((line, index) => (index && line.startsWith(from) ? to + line.slice(from.length) : line))
        .join('\n'));

const fileFallback = (text, file, theirsText) => {
    if (file) {
        const region = scanRegions(text).find(item => item.name === file);
        if (region) {
            const empty = !/\S/.test(text.slice(region.bodyFrom, region.close));
            const indent = fileIndent(text, file);
            const source = theirsText === null ? '  ' : fileIndent(theirsText, file);
            return {
                from: region.close,
                to: region.close,
                prefix: empty ? indent : `\n${indent}`,
                suffix: '\n',
                reindent: [source, indent]
            };
        }
    }
    const regions = scanRegions(text);
    if (!regions.length) return null;
    const at = mainEnd(text);
    return at ? {from: at, to: at, prefix: '\n\n'} : {from: 0, to: 0, suffix: '\n\n'};
};

const rebase = ({base, theirs, mine}) => {
    const decisions = new Map();
    const conflicts = [];
    const keys = new Set([...Object.keys(base.units), ...Object.keys(theirs.units)]);
    for (const key of keys) {
        const baseText = sliceUnit(base.text, base.units, key);
        const theirsText = sliceUnit(theirs.text, theirs.units, key);
        const inBase = Object.prototype.hasOwnProperty.call(base.units, key);
        if (!inBase) {
            decisions.set(key, {action: 'insert', text: theirsText});
            continue;
        }
        const mineText = sliceUnit(mine.text, mine.units, key);
        const userEdited = mineText !== baseText;
        const blocksEdited = theirsText !== baseText;
        if (!userEdited) {
            decisions.set(key, theirsText === null ? {action: 'remove'} : {action: 'replace', text: theirsText});
        } else if (!blocksEdited || mineText === theirsText || valueOnlyChange(key, baseText, theirsText, mineText)) {
            decisions.set(key, mineText === null ? {action: 'absent'} : {action: 'keep'});
        } else {
            const kind = theirsText === null ? 'deleted' : 'both';
            conflicts.push({key, kind, mine: mineText, theirs: theirsText});
            decisions.set(key, mineText === null ? {action: 'placeholder'} : {action: 'keep'});
        }
    }

    const placed = key => {
        const range = mine.units[key];
        if (!range || range.to <= range.from) return false;
        const decision = decisions.get(key);
        return decision && (decision.action === 'keep' || decision.action === 'replace');
    };
    const edits = [];
    for (const key of Object.keys(mine.units)) {
        const decision = decisions.get(key);
        if (!decision) continue;
        const range = mine.units[key];
        if (decision.action === 'keep') {
            edits.push({from: range.from, to: range.to, text: mine.text.slice(range.from, range.to), key});
        } else if (decision.action === 'replace') {
            edits.push({from: range.from, to: range.to, text: decision.text, key});
        } else if (decision.action === 'remove' && range.to > range.from) {
            edits.push({from: range.from, to: removalEnd(mine.text, key, range.to), text: '', key: null});
        } else if (decision.action === 'placeholder') {
            edits.push({from: range.from, to: range.from, text: '', key});
        }
    }
    const theirsOrder = orderedKeys(theirs.units);
    for (const key of theirsOrder) {
        const decision = decisions.get(key);
        if (!decision || decision.action !== 'insert' || decision.text === null) continue;
        const index = theirsOrder.indexOf(key);
        const file = fileAt(theirs.text, theirs.units[key].from);
        const usable = other => placed(other) && sameFile(fileAt(mine.text, mine.units[other].from), file);
        let anchor = null;
        for (let i = index - 1; i >= 0 && !anchor; i--) {
            if (usable(theirsOrder[i])) anchor = {key: theirsOrder[i], after: true};
        }
        for (let i = index + 1; i < theirsOrder.length && !anchor; i++) {
            if (usable(theirsOrder[i])) anchor = {key: theirsOrder[i], after: false};
        }
        const separator = separatorFor(key);
        if (!anchor && unitKind(key) !== 'decl') {
            const fallback = fileFallback(mine.text, file, theirs.text);
            if (fallback) {
                const {reindent: change, ...spot} = fallback;
                const text = change ? reindent(decision.text, change[0], change[1]) : decision.text;
                edits.push({...spot, text, key, order: 1});
                continue;
            }
        }
        if (anchor && anchor.after) {
            const at = mine.units[anchor.key].to;
            edits.push({from: at, to: at, text: decision.text, key, prefix: separator, order: 1});
        } else if (anchor) {
            const at = mine.units[anchor.key].from;
            edits.push({from: at, to: at, text: decision.text, key, suffix: separator, order: -1});
        } else {
            const atStart = unitKind(key) === 'decl';
            const at = atStart ? 0 : mine.text.replace(/\s+$/, '').length;
            edits.push(atStart ?
                {from: at, to: at, text: decision.text, key, suffix: separator, order: -1} :
                {from: at, to: at, text: decision.text, key, prefix: at ? separator : '', order: 1});
        }
    }
    edits.sort((a, b) => (a.from - b.from) || ((a.order || 0) - (b.order || 0)) || (a.to - b.to));

    let text = '';
    let cursor = 0;
    const units = {};
    for (const edit of edits) {
        if (edit.from < cursor) continue;
        text += mine.text.slice(cursor, edit.from);
        if (edit.prefix) text += edit.prefix;
        if (edit.key) units[edit.key] = {from: text.length, to: text.length + edit.text.length};
        text += edit.text;
        if (edit.suffix) text += edit.suffix;
        cursor = edit.to;
    }
    text += mine.text.slice(cursor);
    return {text, units, conflicts};
};

const shiftUnits = (units, at, removed, added, skip) => {
    const delta = added - removed;
    const out = {};
    for (const key of Object.keys(units)) {
        const range = units[key];
        if (key === skip) continue;
        if (range.from >= at + removed) out[key] = {from: range.from + delta, to: range.to + delta};
        else out[key] = range;
    }
    return out;
};

const resolveConflict = ({text, units, conflicts}, key, choice) => {
    const conflict = conflicts.find(item => item.key === key);
    if (!conflict) return {text, units, conflicts};
    const rest = conflicts.filter(item => item !== conflict);
    if (choice === 'mine') return {text, units, conflicts: rest};
    const range = units[key] || {from: text.length, to: text.length};
    let from = range.from;
    let to = range.to;
    let insert = conflict.theirs === null ? '' : conflict.theirs;
    if (conflict.theirs === null) {
        to = removalEnd(text, key, to);
    } else if (conflict.mine === null) {
        insert = `${insert}${separatorFor(key)}`;
    }
    if (from > text.length) from = text.length;
    const next = text.slice(0, from) + insert + text.slice(to);
    const shifted = shiftUnits(units, from, to - from, insert.length, key);
    if (conflict.theirs !== null) shifted[key] = {from, to: from + conflict.theirs.length};
    return {text: next, units: shifted, conflicts: rest};
};

export {declHead, editedUnits, mapUnits, rebase, resolveConflict, sliceUnit};

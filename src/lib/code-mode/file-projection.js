import {ChangeSet} from '@codemirror/state';

const MAIN_FILE = 'scripts.fractch';
const FILE_EXT = '.fractch';
const DEFAULT_INDENT = '  ';
const RESERVED = new Set(['main', 'index']);
const UNSAFE = /[<>:"|?*]/;
const HEADER = /^region[ \t]+("(?:[^"\\\r\n]|\\.)*")[ \t]*\{[ \t]*\r?$/;
const CLOSER = /^\}[ \t]*\r?$/;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

const hasControl = text => Array.from(text).some(ch => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127);

const isSpace = code => code === 32 || code === 9 || code === 10 || code === 13;

const cleanStem = raw => {
    const text = String(raw || '')
        .replace(/\\/g, '/')
        .replace(/\.fractch$/i, '')
        .replace(/^\/+|\/+$/g, '');
    if (!text || /^[A-Za-z]:\//.test(text)) return null;
    const parts = text.split('/').filter(Boolean);
    if (!parts.length || parts.some(part => part === '.' || part === '..' || part.startsWith('.'))) return null;
    return parts.join('/');
};

const unsafeName = name => hasControl(name) || UNSAFE.test(name);

const nameProblem = (name, others) => {
    if (unsafeName(name)) return {error: 'invalid'};
    const parts = name.split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || part.startsWith('.') ||
        part !== part.trim() || part.endsWith('.'))) {
        return {error: 'invalid'};
    }
    if (cleanStem(name) !== name) return {error: 'invalid'};
    if (RESERVED.has(name.toLowerCase())) return {error: 'reserved'};
    if (parts.some(part => WINDOWS_RESERVED.test(part.split('.')[0]))) return {error: 'reserved'};
    const lower = name.toLowerCase();
    if (others.some(item => item.toLowerCase() === lower)) return {error: 'taken'};
    const folders = new Map();
    for (const item of others) {
        const segments = item.split('/');
        for (let i = 1; i < segments.length; i++) {
            const path = segments.slice(0, i).join('/');
            folders.set(path.toLowerCase(), path);
        }
    }
    for (let i = 1; i < parts.length; i++) {
        const path = parts.slice(0, i).join('/');
        const known = folders.get(path.toLowerCase());
        if (known && known !== path) return {error: 'folderCase', folder: known};
    }
    return null;
};

const unquote = raw => {
    let out = '';
    for (let i = 1; i < raw.length - 1; i++) {
        const ch = raw[i];
        if (ch !== '\\') {
            out += ch;
            continue;
        }
        const next = raw[++i];
        out += {n: '\n', t: '\t', r: '\r'}[next] || next || '';
    }
    return out;
};

const lexLine = (text, start, end, state) => {
    let {raw, block} = state;
    let rawOpen = state.rawOpen;
    let i = start;
    while (i < end) {
        const ch = text.charCodeAt(i);
        if (raw) {
            if (ch === 34 && text.charCodeAt(i + 1) === 34 && text.charCodeAt(i + 2) === 34 && i + 3 <= end) {
                raw = false;
                rawOpen = -1;
                i += 3;
            } else {
                i++;
            }
        } else if (block) {
            if (ch === 42 && text.charCodeAt(i + 1) === 47) {
                block = false;
                i += 2;
            } else {
                i++;
            }
        } else if (ch === 34) {
            if (text.charCodeAt(i + 1) === 34 && text.charCodeAt(i + 2) === 34 && i + 3 <= end) {
                raw = true;
                rawOpen = i;
                i += 3;
            } else {
                i++;
                while (i < end && text.charCodeAt(i) !== 34) i += text.charCodeAt(i) === 92 ? 2 : 1;
                i++;
            }
        } else if (ch === 96) {
            i++;
            while (i < end && text.charCodeAt(i) !== 96) i += text.charCodeAt(i) === 92 ? 2 : 1;
            i++;
        } else if (ch === 47 && text.charCodeAt(i + 1) === 47) {
            i = end;
        } else if (ch === 47 && text.charCodeAt(i + 1) === 42) {
            block = true;
            i += 2;
        } else {
            i++;
        }
    }
    return {raw, block, rawOpen};
};

const lexText = (text, from = 0, to = text.length) => {
    const lines = [];
    let state = {raw: false, block: false, rawOpen: -1};
    let start = from;
    for (;;) {
        const nl = text.indexOf('\n', start);
        const end = nl === -1 || nl >= to ? to : nl;
        lines.push({start, end, next: nl !== -1 && nl < to ? nl + 1 : to, raw: state.raw, block: state.block});
        state = lexLine(text, start, end, state);
        if (end >= to) break;
        start = end + 1;
    }
    return {lines, balanced: !state.raw && !state.block, rawOpen: state.raw ? state.rawOpen : -1};
};

const plainLines = text => {
    const lines = [];
    let start = 0;
    for (;;) {
        const nl = text.indexOf('\n', start);
        const end = nl === -1 ? text.length : nl;
        lines.push({start, end, next: nl === -1 ? text.length : nl + 1, raw: false, block: false});
        if (nl === -1) return lines;
        start = nl + 1;
    }
};

const lineText = (text, line) => text.slice(line.start, line.end);

const headerAt = (text, line) => {
    if (line.raw || line.block) return null;
    return HEADER.exec(lineText(text, line));
};

const blockFrom = (text, lines, i, match, close) => {
    const line = lines[i];
    const end = lines[close];
    const nameFrom = line.start + match[0].indexOf('"');
    return {
        from: line.start,
        nameFrom,
        nameTo: nameFrom + match[1].length,
        bodyFrom: line.next,
        close: end.start,
        to: end.next,
        name: cleanStem(unquote(match[1]))
    };
};

const findBlocks = (text, lines) => {
    const blocks = [];
    for (let i = 0; i < lines.length; i++) {
        const match = headerAt(text, lines[i]);
        if (!match) continue;
        let close = -1;
        for (let j = i + 1; j < lines.length && close === -1; j++) {
            const line = lines[j];
            if (line.raw || line.block) continue;
            const body = lineText(text, line);
            if (CLOSER.test(body)) close = j;
            else if (HEADER.test(body)) break;
        }
        if (close === -1) continue;
        blocks.push(blockFrom(text, lines, i, match, close));
        i = close;
    }
    return blocks;
};

const finishLayout = (text, blocks, prefer) => {
    const accepted = [];
    const byName = new Map();
    for (const block of blocks) {
        if (!block.name) continue;
        const key = block.name.toLowerCase();
        if (!byName.has(key) && nameProblem(block.name, accepted.map(item => item.name))) continue;
        if (byName.has(key)) {
            const current = byName.get(key);
            if (prefer && prefer.get(key) === block.from && prefer.get(key) !== current.from) {
                accepted[accepted.indexOf(current)] = block;
                byName.set(key, block);
            }
            continue;
        }
        byName.set(key, block);
        accepted.push(block);
    }
    return accepted.sort((a, b) => a.from - b.from);
};

const scanFresh = (text, prefer = null) => {
    const lexed = lexText(text);
    const lines = lexed.balanced ? lexed.lines : plainLines(text);
    return {regions: finishLayout(text, findBlocks(text, lines), prefer), balanced: lexed.balanced};
};

const scanMemo = new Map();

const remember = (text, layout) => {
    scanMemo.delete(text);
    scanMemo.set(text, layout);
    while (scanMemo.size > 16) scanMemo.delete(scanMemo.keys().next().value);
    return layout;
};

const pinned = new Map();
const pinnedTexts = new Map();

const pinnedLayout = text => {
    const keys = pinnedTexts.get(text);
    if (!keys) return null;
    let layout = null;
    for (const key of keys) {
        const pin = pinned.get(key);
        if (layout && pin.layout !== layout) return null;
        layout = pin.layout;
    }
    return layout;
};

const layoutOf = source => {
    const text = String(source || '');
    if (scanMemo.has(text)) return scanMemo.get(text);
    return remember(text, pinnedLayout(text) || scanFresh(text));
};

const scanRegions = source => layoutOf(source).regions;

const lineStartAt = (text, pos) => text.lastIndexOf('\n', pos - 1) + 1;

const lineEndAt = (text, pos) => {
    const end = text.indexOf('\n', pos);
    return end === -1 ? text.length : end;
};

const visibleRegions = (text, exclude) => {
    const regions = scanRegions(text);
    return exclude && exclude.size ? regions.filter(region => !exclude.has(region.name)) : regions;
};

const regionFiles = (text, exclude) => visibleRegions(text, exclude).map(region => region.name);

const regionAt = (text, pos, exclude) => visibleRegions(text, exclude)
    .find(region => pos >= region.from && pos < region.to) || null;

const fileAt = (text, pos, exclude) => {
    const region = regionAt(text, pos, exclude);
    return region ? region.name : null;
};

const sameFile = (a, b) => (a || null) === (b || null);

const findRegion = (regions, file) => regions.find(region => region.name === file) || null;

const capIndent = lead => (lead.startsWith('\t') ? '\t' : lead.slice(0, DEFAULT_INDENT.length).replace(/\t.*$/, ''));

const indentUnitOf = text => {
    const match = /\n([ \t]+)\S/.exec(text);
    return match && match[1].startsWith('\t') ? '\t' : DEFAULT_INDENT;
};

const commonIndent = lines => {
    let common = null;
    for (const line of lines) {
        if (line.raw || !line.text.trim()) continue;
        const lead = /^[ \t]*/.exec(line.text)[0];
        if (common === null) {
            common = lead;
            continue;
        }
        let n = 0;
        while (n < common.length && n < lead.length && common[n] === lead[n]) n++;
        common = common.slice(0, n);
    }
    if (common !== null) return capIndent(common);
    const blank = lines.find(line => !line.raw && /^[ \t]+/.test(line.text));
    return blank ? capIndent(/^[ \t]+/.exec(blank.text)[0]) : null;
};

const finish = (projection, text) => {
    let view = '';
    for (const piece of projection.pieces) {
        piece.view = view.length;
        view += text.slice(piece.buf, piece.buf + piece.len);
    }
    projection.text = view;
    return projection;
};

const hiddenRuns = (text, regions) => {
    const runs = [];
    for (const region of regions) {
        const last = runs[runs.length - 1];
        if (last && !/\S/.test(text.slice(last.to, region.from))) {
            last.to = region.to;
            last.regions.push(region);
        } else {
            runs.push({from: region.from, to: region.to, regions: [region]});
        }
    }
    let floor = 0;
    runs.forEach((run, index) => {
        let hiddenFrom = run.from;
        if (run.from > floor && text.charCodeAt(run.from - 1) === 10) {
            hiddenFrom = run.from - 1;
            if (hiddenFrom > floor && text.charCodeAt(hiddenFrom - 1) === 13) hiddenFrom--;
        }
        const next = runs[index + 1];
        const mainAfter = /\S/.test(text.slice(run.to, next ? next.from : text.length));
        const mainBefore = /\S/.test(text.slice(floor, hiddenFrom));
        const keepBreak = mainBefore && mainAfter && text.charCodeAt(run.to - 1) === 10;
        run.hiddenFrom = hiddenFrom;
        run.hiddenTo = keepBreak ? run.to - 1 : run.to;
        run.mainBefore = mainBefore;
        run.mainAfter = mainAfter;
        floor = run.hiddenTo;
    });
    return runs;
};

const projectMain = (text, regions) => {
    const pieces = [];
    let cursor = 0;
    for (const run of hiddenRuns(text, regions)) {
        pieces.push({buf: cursor, len: run.hiddenFrom - cursor, gapAfter: run});
        cursor = run.hiddenTo;
    }
    pieces.push({buf: cursor, len: text.length - cursor});
    return finish({file: null, kind: 'main', source: text, pieces}, text);
};

const protectedBreaks = projection => {
    const out = [];
    projection.pieces.forEach((piece, index) => {
        const before = projection.pieces[index - 1];
        if (before && before.gapAfter && before.gapAfter.hiddenTo < before.gapAfter.to) {
            out.push({at: piece.view, beforeFrom: before.view, afterTo: piece.view + piece.len});
        }
    });
    return out;
};

const covers = (ranges, from, to) => {
    let reach = from;
    for (const range of ranges) {
        if (range.from > reach) break;
        reach = Math.max(reach, range.to);
        if (reach >= to) return true;
    }
    return reach >= to;
};

const guardMainChanges = (projection, changes) => {
    const breaks = protectedBreaks(projection);
    if (!breaks.length) return null;
    const specs = [];
    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        specs.push({from: fromA, to: toA, insert: inserted.toString()});
    });
    const ranges = specs.filter(spec => spec.to > spec.from).sort((a, b) => a.from - b.from);
    let changed = false;
    let out = specs;
    for (const item of breaks) {
        const touches = out.some(spec => spec.from < item.at + 1 && spec.to > item.at);
        const clears = covers(ranges, item.beforeFrom, item.at) || covers(ranges, item.at + 1, item.afterTo);
        if (clears) {
            if (!touches) {
                out = out.concat({from: item.at, to: item.at + 1, insert: ''});
                changed = true;
            }
            continue;
        }
        if (!touches) continue;
        changed = true;
        out = out.flatMap(spec => {
            if (!(spec.from < item.at + 1 && spec.to > item.at)) return [spec];
            const parts = [];
            if (spec.from < item.at) parts.push({from: spec.from, to: item.at, insert: spec.insert});
            if (spec.to > item.at + 1) {
                parts.push({from: item.at + 1, to: spec.to, insert: parts.length ? '' : spec.insert});
            }
            if (!parts.length && spec.insert) parts.push({from: item.at, to: item.at, insert: spec.insert});
            return parts;
        });
    }
    return changed ? ChangeSet.of(out, changes.length) : null;
};

const bodyEnd = (text, region) => {
    let to = region.close - 1;
    if (to > region.bodyFrom && text.charCodeAt(to - 1) === 13) to--;
    return to;
};

const projectRegionOf = (text, region) => {
    const from = region.bodyFrom;
    if (region.close <= from) {
        return finish({
            file: region.name,
            kind: 'region',
            source: text,
            region,
            indent: region.indent || indentUnitOf(text),
            empty: {from},
            lines: [],
            pieces: [{buf: from, len: 0, line: null}]
        }, text);
    }
    const to = bodyEnd(text, region);
    const lexed = lexText(text, from, to);
    const open = lexed.balanced ? lexed.lines.length :
        lexed.lines.findIndex(line => line.start <= lexed.rawOpen && lexed.rawOpen <= line.end);
    const lines = lexed.lines.map((line, index) => ({
        start: line.start,
        end: line.end,
        text: text.slice(line.start, line.end),
        raw: line.raw && index <= open
    }));
    const indent = lexed.balanced ? commonIndent(lines) || region.indent || indentUnitOf(text) :
        region.indent || commonIndent(lines.slice(0, open + 1)) || indentUnitOf(text);
    const pieces = lines.map((line, index) => {
        let k = 0;
        if (!line.raw) {
            while (k < indent.length && k < line.text.length && line.text[k] === indent[k]) k++;
            if (k < indent.length && line.text.trim()) k = 0;
        }
        line.k = k;
        const last = index === lines.length - 1;
        return {buf: line.start + k, len: (last ? line.end : line.end + 1) - line.start - k, line};
    });
    return finish({file: region.name, kind: 'region', source: text, region, indent, lines, pieces}, text);
};

const carryRegion = (text, region, changes) => {
    const from = changes.mapPos(region.from, 1);
    const close = changes.mapPos(region.close, 1);
    if (from !== lineStartAt(text, from) || close !== lineStartAt(text, close) || close <= from) return null;
    const match = HEADER.exec(text.slice(from, lineEndAt(text, from)));
    if (!match || !CLOSER.test(text.slice(close, lineEndAt(text, close)))) return null;
    const headerEnd = lineEndAt(text, from);
    const closeEnd = lineEndAt(text, close);
    const nameFrom = from + match[0].indexOf('"');
    return {
        from,
        nameFrom,
        nameTo: nameFrom + match[1].length,
        bodyFrom: Math.min(headerEnd + 1, text.length),
        close,
        to: closeEnd < text.length ? closeEnd + 1 : closeEnd,
        name: cleanStem(unquote(match[1])),
        indent: region.indent
    };
};

const indentFor = (source, region) => {
    if (region.indent) return region.indent;
    const projection = projectRegionOf(source, region);
    return projection.indent;
};

const rememberEdit = (before, after, changes) => {
    const old = layoutOf(before);
    const fresh = scanFresh(after, new Map(old.regions.map(region => [
        region.name.toLowerCase(),
        changes.mapPos(region.from, 1)
    ])));
    let regions = fresh.regions;
    if (!fresh.balanced) {
        const carried = old.regions.map(region => carryRegion(after, region, changes));
        if (carried.every(Boolean)) regions = finishLayout(after, carried, null);
    }
    regions = regions.map(region => {
        const previous = old.regions.find(item => item.name === region.name);
        if (!previous || region.indent) return region;
        if (previous.indent) return {...region, indent: previous.indent};
        const body = after.slice(region.bodyFrom, region.close);
        if (/\S/.test(body) && lexText(after, region.bodyFrom, region.close).balanced) return region;
        return {...region, indent: indentFor(before, previous)};
    });
    return remember(after, {regions, balanced: fresh.balanced});
};

const projectFile = (source, file, exclude) => {
    const text = String(source || '');
    const regions = visibleRegions(text, exclude);
    if (!file) return projectMain(text, regions);
    const region = findRegion(regions, file);
    return region ? projectRegionOf(text, region) : null;
};

const cache = new Map();

const cachedProjection = (source, file, exclude) => {
    if (exclude && exclude.size) return projectFile(source, file, exclude);
    const text = String(source || '');
    const key = file || '';
    let byFile = cache.get(key);
    if (!byFile) {
        byFile = new Map();
        cache.set(key, byFile);
        if (cache.size > 64) cache.delete(cache.keys().next().value);
    }
    const layout = layoutOf(text);
    const hit = byFile.get(text);
    if (hit && hit.layout === layout) return hit.projection;
    const projection = projectFile(text, file);
    byFile.delete(text);
    byFile.set(text, {layout, projection});
    if (byFile.size > 8) byFile.delete(byFile.keys().next().value);
    return projection;
};

const pieceForView = (projection, pos) => {
    const {pieces} = projection;
    if (projection.kind === 'main') {
        for (const piece of pieces) {
            if (pos <= piece.view + piece.len) return piece;
        }
        return pieces[pieces.length - 1];
    }
    let low = 0;
    let high = pieces.length - 1;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (pieces[mid].view <= pos) low = mid;
        else high = mid - 1;
    }
    return pieces[low];
};

const toBuffer = (projection, pos) => {
    const piece = pieceForView(projection, Math.max(0, Math.min(pos, projection.text.length)));
    return piece.buf + Math.min(piece.len, Math.max(0, pos - piece.view));
};

const pieceForBuffer = (pieces, pos) => {
    let low = 0;
    let high = pieces.length - 1;
    let found = -1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        const start = pieces[mid].line ? pieces[mid].line.start : pieces[mid].buf;
        if (start <= pos) {
            found = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return found;
};

const toFile = (projection, pos, {clamp = false} = {}) => {
    const {pieces} = projection;
    if (projection.kind === 'region') {
        const index = pieceForBuffer(pieces, pos);
        const piece = pieces[index];
        if (piece && pos <= piece.buf + piece.len) return pos < piece.buf ? piece.view : piece.view + (pos - piece.buf);
    } else {
        for (const piece of pieces) {
            if (pos >= piece.buf && pos <= piece.buf + piece.len) return piece.view + (pos - piece.buf);
        }
    }
    if (!clamp) return null;
    let best = 0;
    for (const piece of pieces) {
        if (piece.buf <= pos) best = piece.view + piece.len;
    }
    return best;
};

const containsBuffer = (projection, pos) => toFile(projection, pos) !== null;

const rangeToFile = (projection, from, to) => {
    const start = toFile(projection, from);
    if (start === null) return null;
    const end = toFile(projection, Math.max(from, to));
    if (end !== null) return {from: start, to: Math.max(start, end)};
    const piece = projection.pieces.find(item => from >= item.buf && from <= item.buf + item.len);
    let last = piece;
    if (projection.kind === 'region') {
        for (const item of projection.pieces) {
            if (item.buf <= to) last = item;
        }
    }
    return {from: start, to: Math.max(start, last.view + last.len)};
};

const rawAt = (projection, bufPos) => {
    const {region, source} = projection;
    return lexText(source, region.bodyFrom, Math.max(region.bodyFrom, bufPos)).rawOpen !== -1;
};

const restOfLine = (source, pos) => source.slice(pos, lineEndAt(source, pos)).trim() !== '';

const indentInsert = (projection, bufPos, insert, atLineStart, line, rest) => {
    const {indent} = projection;
    const rawStart = rawAt(projection, bufPos);
    let raw = rawStart;
    let out = '';
    const parts = insert.split('\n');
    parts.forEach((part, index) => {
        if (index > 0) {
            out += '\n';
            if (!raw && (part || (rest && index === parts.length - 1))) out += indent;
        } else if (!raw && part && atLineStart && line && line.k < indent.length) {
            out += indent.slice(line.k);
        }
        out += part;
        const state = lexLine(part, 0, part.length, {raw, block: false, rawOpen: -1});
        raw = state.raw;
    });
    if (projection.empty) {
        if (!out) return out;
        const first = rawStart || !parts[0] ? '' : indent;
        return `${first}${out}\n`;
    }
    return out;
};

const regionSpec = (projection, fromA, toA, insert) => {
    if (!insert && fromA === 0 && toA === projection.text.length && toA > 0) {
        return {from: projection.region.bodyFrom, to: projection.region.close};
    }
    const from = toBuffer(projection, fromA);
    const to = Math.max(from, toBuffer(projection, toA));
    const piece = pieceForView(projection, fromA);
    const atLineStart = Boolean(piece.line) && fromA === piece.view;
    const rest = !projection.empty && to < projection.region.close && restOfLine(projection.source, to);
    return {from, to, insert: insert ? indentInsert(projection, from, insert, atLineStart, piece.line, rest) : ''};
};

const mainSpecs = (projection, fromA, toA, insert) => {
    const specs = [];
    projection.pieces.forEach((piece, index) => {
        const before = projection.pieces[index - 1];
        const guarded = before && before.gapAfter && before.gapAfter.hiddenTo < before.gapAfter.to ? 1 : 0;
        const start = Math.max(fromA, piece.view + guarded);
        const end = Math.min(toA, piece.view + piece.len);
        if (end > start) specs.push({from: piece.buf + (start - piece.view), to: piece.buf + (end - piece.view)});
    });
    if (insert) {
        const at = toBuffer(projection, fromA);
        const piece = pieceForView(projection, fromA);
        const gap = piece.gapAfter && at === piece.buf + piece.len ? piece.gapAfter : null;
        const tight = gap && gap.hiddenFrom === gap.from;
        const source = projection.source;
        if (gap && gap.mainBefore && !gap.mainAfter && insert.startsWith('\n') && /\S/.test(insert) &&
            source.charCodeAt(gap.to - 1) === 10) {
            specs.push({from: gap.to, insert: insert.slice(1)});
        } else if (gap && !gap.mainBefore && gap.mainAfter && gap.hiddenFrom < gap.from && insert.endsWith('\n') &&
            /\S/.test(insert)) {
            specs.push({from: at, insert: insert.slice(0, -1)});
        } else {
            specs.push({from: at, insert: tight ? `${insert}\n` : insert});
        }
    }
    return specs;
};

const changesToBuffer = (projection, changes) => {
    const specs = [];
    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        const insert = inserted.toString();
        if (projection.kind === 'main') specs.push(...mainSpecs(projection, fromA, toA, insert));
        else specs.push(regionSpec(projection, fromA, toA, insert));
    });
    return ChangeSet.of(specs, projection.source.length);
};

const diffChanges = (before, after) => {
    let start = 0;
    const max = Math.min(before.length, after.length);
    while (start < max && before.charCodeAt(start) === after.charCodeAt(start)) start++;
    let end = 0;
    while (end < max - start &&
        before.charCodeAt(before.length - 1 - end) === after.charCodeAt(after.length - 1 - end)) end++;
    return ChangeSet.of([{from: start, to: before.length - end, insert: after.slice(start, after.length - end)}],
        before.length);
};

const applyChanges = (source, changes) => {
    let out = '';
    let cursor = 0;
    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        out += source.slice(cursor, fromA) + inserted.toString();
        cursor = toA;
    });
    return out + source.slice(cursor);
};

const applyEdit = (source, file, viewText, viewChanges, exclude) => {
    const projection = cachedProjection(source, file, exclude);
    if (!projection) return null;
    const changes = viewChanges && viewChanges.length === projection.text.length ?
        viewChanges : diffChanges(projection.text, viewText);
    const bufferChanges = changesToBuffer(projection, changes);
    const text = applyChanges(source, bufferChanges);
    rememberEdit(source, text, bufferChanges);
    return {changes: bufferChanges, text};
};

const unpin = key => {
    const pin = pinned.get(key);
    if (!pin) return;
    pinned.delete(key);
    const keys = pinnedTexts.get(pin.text);
    if (keys) {
        keys.delete(key);
        if (!keys.size) pinnedTexts.delete(pin.text);
    }
};

const pinLayout = (key, source) => {
    const text = String(source || '');
    const layout = layoutOf(text);
    unpin(key);
    pinned.set(key, {text, layout});
    if (!pinnedTexts.has(text)) pinnedTexts.set(text, new Set());
    pinnedTexts.get(text).add(key);
};

const followLayout = (key, source) => {
    const text = String(source || '');
    const pin = pinned.get(key);
    if (pin && pin.text === text) return;
    if (pin && !layoutOf(text).balanced) {
        remember(pin.text, pin.layout);
        rememberEdit(pin.text, text, diffChanges(pin.text, text));
    }
    pinLayout(key, text);
};

const unpinLayouts = (keep = null) => {
    for (const key of Array.from(pinned.keys())) {
        if (!keep || !keep.has(key)) unpin(key);
    }
};

const fileLine = (projection, viewPos) => {
    let line = 1;
    const {text} = projection;
    for (let i = 0; i < viewPos && i < text.length; i++) {
        if (text.charCodeAt(i) === 10) line++;
    }
    return line;
};

const fileColumn = (projection, viewPos) => viewPos - (projection.text.lastIndexOf('\n', viewPos - 1) + 1) + 1;

const baseName = file => (file ? `${file.split('/').pop()}${FILE_EXT}` : MAIN_FILE);

const folderOfFile = file => {
    if (!file) return '';
    const index = file.lastIndexOf('/');
    return index === -1 ? '' : file.slice(0, index);
};

const fileTitle = file => (file ? `${file}${FILE_EXT}` : MAIN_FILE);

const validateFileName = (input, existing = [], current = null) => {
    const raw = String(input || '').trim()
        .replace(/\\/g, '/')
        .replace(/\.fractch$/i, '')
        .replace(/^\/+|\/+$/g, '');
    if (!raw) return {error: 'empty'};
    if (unsafeName(raw)) return {error: 'invalid'};
    const name = raw.split('/').filter(Boolean)
        .join('/');
    const currentLower = current ? current.toLowerCase() : null;
    const problem = nameProblem(name, existing.filter(item => item.toLowerCase() !== currentLower));
    return problem || {name};
};

const editResult = (text, spec) => {
    const changes = ChangeSet.of([spec], text.length);
    const next = applyChanges(text, changes);
    rememberEdit(text, next, changes);
    return {text: next, changes};
};

const addFileText = (source, name) => {
    const text = String(source || '');
    const at = text.replace(/\s+$/, '').length;
    const block = `region ${JSON.stringify(name)} {\n}`;
    const insert = at ? `\n\n${block}` : block;
    return editResult(text, {from: at, insert: text.slice(at) ? insert : `${insert}\n`});
};

const renameFileText = (source, from, to) => {
    const text = String(source || '');
    const region = findRegion(scanRegions(text), from);
    if (!region) return null;
    return editResult(text, {from: region.nameFrom, to: region.nameTo, insert: JSON.stringify(to)});
};

const removeFileText = (source, name) => {
    const text = String(source || '');
    const region = findRegion(scanRegions(text), name);
    if (!region) return null;
    let from = region.from;
    let to = region.to;
    if (from === 0) {
        while (to < text.length && isSpace(text.charCodeAt(to))) to++;
    } else if (!/\S/.test(text.slice(to))) {
        from--;
        if (from > 0 && text.charCodeAt(from - 1) === 13) from--;
        to = text.length;
    } else if (text.charCodeAt(to) === 10) {
        to++;
    } else if (text.charCodeAt(to) === 13 && text.charCodeAt(to + 1) === 10) {
        to += 2;
    }
    return editResult(text, {from, to});
};

const fileHasContent = (source, name) => {
    const projection = projectFile(source, name);
    return Boolean(projection) && /\S/.test(projection.text);
};

const fileIndent = (source, name) => {
    const projection = projectFile(source, name);
    return projection && projection.kind === 'region' ? projection.indent : DEFAULT_INDENT;
};

const mainEnd = source => {
    const text = String(source || '');
    const regions = scanRegions(text);
    const end = regions.length ? regions[0].from : text.length;
    return text.slice(0, end).replace(/\s+$/, '').length;
};

export {
    FILE_EXT,
    MAIN_FILE,
    addFileText,
    applyChanges,
    applyEdit,
    baseName,
    cachedProjection,
    changesToBuffer,
    containsBuffer,
    diffChanges,
    fileAt,
    fileColumn,
    fileHasContent,
    fileIndent,
    fileLine,
    fileTitle,
    folderOfFile,
    followLayout,
    guardMainChanges,
    mainEnd,
    pinLayout,
    projectFile,
    protectedBreaks,
    rangeToFile,
    regionAt,
    regionFiles,
    rememberEdit,
    removeFileText,
    renameFileText,
    sameFile,
    scanRegions,
    toBuffer,
    toFile,
    unpinLayouts,
    validateFileName
};

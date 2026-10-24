import {UNIT_KINDS} from './fractch-adapter.js';

const FIELDS = ['scripts', 'blocks', 'comments', 'declarations', 'regions'];
const UNIT_FIELDS = UNIT_KINDS.map(([, field]) => field);
const START = '\u0000start';
const END = '\u0000end';

const entriesOf = (sourceMap, field) => (sourceMap && sourceMap[field]) || {};

const isBlank = text => !/\S/.test(text);

const fieldOf = key => key.slice(0, key.indexOf('\u0001'));

const unitList = (sourceMap, length) => {
    const list = [];
    for (const field of UNIT_FIELDS) {
        const map = entriesOf(sourceMap, field);
        for (const id of Object.keys(map)) {
            const range = map[id];
            if (range && range.to > range.from) list.push({key: `${field}\u0001${id}`, from: range.from, to: range.to});
        }
    }
    list.sort((a, b) => (a.from - b.from) || (a.to - b.to));
    for (let i = 1; i < list.length; i++) {
        if (list[i].from < list[i - 1].to) return null;
    }
    return [{key: START, from: 0, to: 0}].concat(list, [{key: END, from: length, to: length}]);
};

const inner = list => list.slice(1, -1);

const byKey = list => new Map(list.map(unit => [unit.key, unit]));

const followers = list => {
    const map = new Map();
    for (let i = 0; i < list.length - 1; i++) map.set(list[i].key, list[i + 1].key);
    return map;
};

const sameKeys = (a, b) => FIELDS.every(field => {
    const left = Object.keys(entriesOf(a, field));
    const right = entriesOf(b, field);
    return left.length === Object.keys(right).length &&
        left.every(key => Object.prototype.hasOwnProperty.call(right, key));
});

const regionOf = (sourceMap, unit) => {
    const regions = entriesOf(sourceMap, 'regions');
    for (const name of Object.keys(regions)) {
        const range = regions[name];
        if (unit.from >= range.from && unit.to <= range.to) return name;
    }
    return null;
};

const skeleton = (text, units) => {
    const parts = [];
    for (let i = 1; i < units.length; i++) {
        const gap = text.slice(units[i - 1].to, units[i].from).replace(/\s+/g, ' ')
            .trim();
        if (gap) parts.push(gap);
    }
    return parts.join('\u0001');
};

const indentAt = (text, pos) => {
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const indent = text.slice(lineStart, pos);
    return isBlank(indent) ? indent : '';
};

const lineStarts = text => {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) === 10) starts.push(i + 1);
    }
    return starts;
};

const lineAt = (starts, pos) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (starts[mid] <= pos) low = mid;
        else high = mid - 1;
    }
    return low + 1;
};

const withLines = (sourceMap, text) => {
    const starts = lineStarts(text);
    const out = {version: sourceMap.version || 1};
    for (const field of FIELDS) {
        const map = entriesOf(sourceMap, field);
        out[field] = {};
        for (const id of Object.keys(map)) {
            const range = map[id];
            out[field][id] = {...range, line: lineAt(starts, range.from), endLine: lineAt(starts, range.to)};
        }
    }
    return out;
};

const containing = (units, range) => {
    let low = 1;
    let high = units.length - 2;
    let found = null;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (units[mid].from <= range.from) {
            found = units[mid];
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return found && range.to <= found.to ? found : null;
};

const smallestEnclosing = (map, range, accept) => {
    let best = null;
    for (const id of Object.keys(map)) {
        const other = map[id];
        if (other.from > range.from || other.to < range.to || !accept(id)) continue;
        if (!best || other.to - other.from < best.range.to - best.range.from) best = {id, range: other};
    }
    return best;
};

const createOutput = (formatted, next) => {
    const output = {text: '', segments: [], placed: new Map()};
    output.push = (source, from, to) => {
        const segment = {source, from, to, out: output.text.length};
        output.segments.push(segment);
        output.text += (source === 'formatted' ? formatted.text : next.text).slice(from, to);
        return segment;
    };
    output.literal = value => {
        output.text += value;
    };
    output.unit = (unit, mine) => {
        const segment = mine ? output.push('formatted', mine.from, mine.to) : output.push('next', unit.from, unit.to);
        output.placed.set(unit.key, {unit, mine, segment});
    };
    return output;
};

const unchangedUnit = (context, unit) => {
    const was = context.previousByKey.get(unit.key);
    const mine = context.formattedByKey.get(unit.key);
    if (!was || !mine) return null;
    const before = context.previous.text.slice(was.from, was.to);
    return before === context.next.text.slice(unit.from, unit.to) ? mine : null;
};

const composeCanonicalOrder = context => {
    const {previous, formatted, next, nextUnits, previousByKey, formattedByKey} = context;
    const previousNext = followers(context.previousUnits);
    const formattedNext = followers(context.formattedUnits);
    const output = createOutput(formatted, next);
    for (let i = 0; i < nextUnits.length; i++) {
        const unit = nextUnits[i];
        if (i > 0) {
            const before = nextUnits[i - 1];
            const keepGap = previousNext.get(before.key) === unit.key &&
                formattedNext.get(before.key) === unit.key &&
                previous.text.slice(previousByKey.get(before.key).to, previousByKey.get(unit.key).from) ===
                    next.text.slice(before.to, unit.from);
            if (keepGap) output.push('formatted', formattedByKey.get(before.key).to, formattedByKey.get(unit.key).from);
            else output.push('next', before.to, unit.from);
        }
        if (unit.key !== START && unit.key !== END) output.unit(unit, unchangedUnit(context, unit));
    }
    return output;
};

const planInsertions = (context, present) => {
    const {next} = context;
    const order = inner(context.nextUnits);
    const regions = new Map(order.map(unit => [unit.key, regionOf(next.sourceMap, unit)]));
    const after = new Map();
    const before = new Map();
    const rootOf = new Map();
    const add = (side, key, item) => {
        if (!side.has(key)) side.set(key, []);
        side.get(key).push(item);
    };
    const separator = (first, second, adjacent) => {
        const gap = next.text.slice(first.to, second.from);
        if (adjacent && isBlank(gap)) return gap.replace(/[ \t]*$/, '');
        return fieldOf(first.key) === 'declarations' && fieldOf(second.key) === 'declarations' ? '\n' : '\n\n';
    };
    for (let i = 0; i < order.length; i++) {
        const unit = order[i];
        if (present.has(unit.key)) continue;
        const region = regions.get(unit.key);
        let placed = false;
        for (let j = i - 1; j >= 0 && !placed; j--) {
            const anchor = order[j];
            if (regions.get(anchor.key) !== region || !(present.has(anchor.key) || rootOf.has(anchor.key))) continue;
            const root = rootOf.get(anchor.key) || anchor.key;
            add(after, root, {unit, separator: separator(anchor, unit, j === i - 1)});
            rootOf.set(unit.key, root);
            placed = true;
        }
        for (let j = i + 1; j < order.length && !placed; j++) {
            const anchor = order[j];
            if (regions.get(anchor.key) !== region || !present.has(anchor.key)) continue;
            add(before, anchor.key, {unit, separator: separator(unit, anchor, j === i + 1)});
            placed = true;
        }
        if (!placed) return null;
    }
    return {after, before};
};

const mergeGaps = (text, pieces) => {
    if (pieces.length === 1) return pieces;
    const solid = pieces.filter(([from, to]) => !isBlank(text.slice(from, to)));
    if (solid.length) return solid;
    return pieces[0][0] === 0 ? [pieces[0]] : [pieces[pieces.length - 1]];
};

const composeInPlace = context => {
    const {previous, formatted, next, previousUnits, formattedUnits, nextUnits, previousByKey} = context;
    if (skeleton(previous.text, previousUnits) !== skeleton(next.text, nextUnits)) return null;
    for (const [units, sourceMap] of [[nextUnits, next.sourceMap], [formattedUnits, formatted.sourceMap]]) {
        for (const unit of inner(units)) {
            const was = previousByKey.get(unit.key);
            if (was && regionOf(previous.sourceMap, was) !== regionOf(sourceMap, unit)) return null;
        }
    }
    const nextByKey = byKey(nextUnits);
    const present = new Set(inner(formattedUnits).filter(unit => nextByKey.has(unit.key))
        .map(unit => unit.key));
    const insertions = planInsertions(context, present);
    if (!insertions) return null;
    const output = createOutput(formatted, next);
    const indentOf = key => {
        const mine = context.formattedByKey.get(key);
        return indentAt(formatted.text, mine.from);
    };
    let pieces = [];
    for (let i = 0; i < formattedUnits.length; i++) {
        const unit = formattedUnits[i];
        if (i > 0) pieces.push([formattedUnits[i - 1].to, unit.from]);
        if (unit.key === START) continue;
        if (unit.key !== END && !nextByKey.has(unit.key)) continue;
        for (const [from, to] of mergeGaps(formatted.text, pieces)) output.push('formatted', from, to);
        pieces = [];
        if (unit.key === END) break;
        const indent = indentOf(unit.key);
        for (const item of insertions.before.get(unit.key) || []) {
            output.unit(item.unit, null);
            output.literal(item.separator + indent);
        }
        const fresh = nextByKey.get(unit.key);
        output.unit(fresh, unchangedUnit(context, fresh));
        for (const item of insertions.after.get(unit.key) || []) {
            output.literal(item.separator + indent);
            output.unit(item.unit, null);
        }
    }
    return output;
};

const mapSourceMap = (context, output) => {
    const {formatted, next, nextUnits} = context;
    const mapPoint = (pos, source) => {
        if (typeof pos !== 'number') return null;
        for (const segment of output.segments) {
            if (segment.source === source && pos >= segment.from && pos <= segment.to) {
                return segment.out + pos - segment.from;
            }
        }
        return null;
    };
    const sourceMap = {version: next.sourceMap.version || 1};
    const pending = [];
    for (const field of FIELDS) {
        const map = entriesOf(next.sourceMap, field);
        const mineMap = entriesOf(formatted.sourceMap, field);
        sourceMap[field] = {};
        for (const id of Object.keys(map)) {
            const range = map[id];
            const own = mineMap[id];
            const unit = containing(nextUnits, range);
            if (!unit) {
                const from = mapPoint(own && own.from, 'formatted') ?? mapPoint(range.from, 'next');
                const to = mapPoint(own && own.to, 'formatted') ?? mapPoint(range.to, 'next');
                if (from !== null && to !== null && to >= from) sourceMap[field][id] = {...range, from, to};
                continue;
            }
            const where = output.placed.get(unit.key);
            if (!where.mine) {
                const delta = where.segment.out - unit.from;
                sourceMap[field][id] = {...range, from: range.from + delta, to: range.to + delta};
            } else if (own && own.from >= where.mine.from && own.to <= where.mine.to) {
                const delta = where.segment.out - where.mine.from;
                sourceMap[field][id] = {...range, from: own.from + delta, to: own.to + delta};
            } else {
                pending.push({field, id, range, where});
            }
        }
    }
    for (const {field, id, range, where} of pending) {
        const map = entriesOf(next.sourceMap, field);
        const parent = smallestEnclosing(map, range, other => other !== id && Boolean(sourceMap[field][other]) &&
            map[other].from >= where.unit.from && map[other].to <= where.unit.to);
        const target = parent ? sourceMap[field][parent.id] : {
            from: where.segment.out,
            to: where.segment.out + where.mine.to - where.mine.from
        };
        sourceMap[field][id] = {...range, from: target.from, to: target.to};
    }
    return withLines(sourceMap, output.text);
};

const keepFormatting = ({previous, formatted, next}) => {
    const canonical = {text: next.text, sourceMap: next.sourceMap};
    if (!previous || !formatted) return canonical;
    if (next.text === previous.text && sameKeys(previous.sourceMap, next.sourceMap)) {
        return {text: formatted.text, sourceMap: formatted.sourceMap};
    }
    const nextUnits = unitList(next.sourceMap, next.text.length);
    const previousUnits = unitList(previous.sourceMap, previous.text.length);
    const formattedUnits = unitList(formatted.sourceMap, formatted.text.length);
    if (!nextUnits || !previousUnits || !formattedUnits) return canonical;
    const context = {
        previous,
        formatted,
        next,
        nextUnits,
        previousUnits,
        formattedUnits,
        previousByKey: byKey(previousUnits),
        formattedByKey: byKey(formattedUnits)
    };
    const output = composeInPlace(context) || composeCanonicalOrder(context);
    return {text: output.text, sourceMap: mapSourceMap(context, output)};
};

const fillBlocks = (sourceMap, canonical) => {
    const blocks = {...entriesOf(sourceMap, 'blocks')};
    const canonicalBlocks = entriesOf(canonical, 'blocks');
    const scripts = entriesOf(sourceMap, 'scripts');
    const canonicalScripts = entriesOf(canonical, 'scripts');
    const missing = Object.keys(canonicalBlocks).filter(id => !blocks[id]);
    if (!missing.length) return sourceMap;
    for (const id of missing) {
        const range = canonicalBlocks[id];
        const parent = smallestEnclosing(canonicalBlocks, range, other => other !== id && Boolean(blocks[other]));
        if (parent) {
            blocks[id] = {...blocks[parent.id]};
            continue;
        }
        const script = smallestEnclosing(canonicalScripts, range, other => Boolean(scripts[other]));
        if (script) blocks[id] = {...scripts[script.id]};
    }
    return {...sourceMap, blocks};
};

const remapLocked = (lockedScripts, sourceMap) => (lockedScripts || []).map(item => {
    const range = entriesOf(sourceMap, 'scripts')[item.topId];
    return range ? {...item, from: range.from, to: range.to, line: range.line, endLine: range.endLine} : null;
}).filter(Boolean);

export {fillBlocks, keepFormatting, remapLocked};

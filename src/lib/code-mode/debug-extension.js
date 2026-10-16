import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Circle, Pin} from 'lucide-react';
import {RangeSet, StateEffect, StateField} from '@codemirror/state';
import {Decoration, EditorView, GutterMarker, gutter, hoverTooltip} from '@codemirror/view';

const LOCAL_NAME = /^!local_[A-Za-z0-9]+_(.+)$/;
const IDENTIFIER = /[A-Za-z_]\w*/g;
const VARS_ACCESS = /\bvars\[("(?:[^"\\]|\\.)*")\]/g;
const MAX_ITEMS = 50;
const MAX_TEXT = 200;

const truncate = text => (text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}...` : text);

const formatValue = (value, type) => {
    if (type === 'list') {
        const items = Array.isArray(value) ? value : [];
        const shown = items.slice(0, MAX_ITEMS).map(item => JSON.stringify(String(item)));
        if (items.length > MAX_ITEMS) shown.push('...');
        return truncate(`(${items.length}) [${shown.join(', ')}]`);
    }
    if (typeof value === 'string') return truncate(JSON.stringify(value));
    if (value !== null && typeof value === 'object') {
        try {
            return truncate(JSON.stringify(value));
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
};

const insideString = (line, column) => {
    let open = false;
    for (let i = 0; i < column; i++) {
        if (line[i] === '\\') i++;
        else if (line[i] === '"') open = !open;
    }
    return open;
};

const variableNameAt = (text, offset) => {
    const doc = String(text || '');
    const lineStart = doc.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const nextBreak = doc.indexOf('\n', offset);
    const line = doc.slice(lineStart, nextBreak === -1 ? doc.length : nextBreak);
    const column = offset - lineStart;
    for (const match of line.matchAll(VARS_ACCESS)) {
        if (column >= match.index && column <= match.index + match[0].length) {
            const from = lineStart + match.index;
            try {
                return {name: JSON.parse(match[1]), from, to: from + match[0].length, global: true};
            } catch (e) {
                return null;
            }
        }
    }
    if (insideString(line, column)) return null;
    for (const match of line.matchAll(IDENTIFIER)) {
        const end = match.index + match[0].length;
        if (column < match.index || column > end) continue;
        const before = line[match.index - 1];
        if (before === '.' || before === '@' || /^\s*\(/.test(line.slice(end))) return null;
        return {name: match[0], from: lineStart + match.index, to: lineStart + end, global: false};
    }
    return null;
};

const resolveVariables = (target, symbol, locals) => {
    if (!target || !symbol) return [];
    if (!symbol.global) {
        const local = (locals || []).filter(item => item.name === symbol.name);
        if (local.length) return local.map(item => item.variable);
    }
    return ['', 'list']
        .map(type => target.lookupVariableByNameAndType(symbol.name, type))
        .filter(variable => variable && !LOCAL_NAME.test(variable.name));
};

const displayName = name => {
    const match = LOCAL_NAME.exec(name);
    return match ? match[1] : name;
};

const setBreakpointLinesEffect = StateEffect.define();
const setPausedLineEffect = StateEffect.define();

class BreakpointMarker extends GutterMarker {
    constructor (className) {
        super();
        this.className = className;
    }
    eq (other) {
        return other instanceof BreakpointMarker;
    }
    toDOM () {
        const node = document.createElement('span');
        node.className = this.className;
        node.innerHTML = renderToStaticMarkup(React.createElement(Circle, {
            'size': 10,
            'fill': 'currentColor',
            'aria-hidden': true
        }));
        return node;
    }
}

const lineStarts = (state, positions) => Array.from(new Set(positions
    .filter(pos => typeof pos === 'number')
    .map(pos => state.doc.lineAt(Math.min(pos, state.doc.length)).from)))
    .sort((a, b) => a - b);

const breakpointLinesField = marker => StateField.define({
    create: () => RangeSet.empty,
    update (value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setBreakpointLinesEffect)) {
                return RangeSet.of(lineStarts(tr.state, effect.value).map(at => marker.range(at)));
            }
        }
        return tr.docChanged ? value.map(tr.changes) : value;
    }
});

const pausedLineField = className => StateField.define({
    create: () => Decoration.none,
    update (value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setPausedLineEffect)) {
                if (effect.value === null) return Decoration.none;
                const at = lineStarts(tr.state, [effect.value])[0];
                return Decoration.set([Decoration.line({class: className}).range(at)]);
            }
        }
        return tr.docChanged ? value.map(tr.changes) : value;
    },
    provide: field => EditorView.decorations.from(field)
});

const tooltipDom = (items, options) => {
    const dom = document.createElement('div');
    dom.className = options.classes.watchTooltip || '';
    const rows = items.map(item => {
        const row = document.createElement('div');
        row.className = options.classes.watchTooltipRow || '';
        const name = document.createElement('code');
        name.textContent = item.type === 'list' ? `${item.label} (${options.labels.list})` : item.label;
        const value = document.createElement('span');
        value.className = options.classes.watchTooltipValue || '';
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = options.classes.watchTooltipPin || '';
        pin.title = options.labels.pin;
        pin.setAttribute('aria-label', options.labels.pin);
        pin.innerHTML = renderToStaticMarkup(React.createElement(Pin, {'size': 12, 'aria-hidden': true}));
        pin.addEventListener('mousedown', event => event.preventDefault());
        pin.addEventListener('click', () => item.pin());
        row.append(name, value, pin);
        return {row, value, item};
    });
    const refresh = () => {
        for (const {value, item} of rows) value.textContent = item.read();
    };
    refresh();
    dom.append(...rows.map(entry => entry.row));
    return {dom, refresh};
};

const codeDebugExtension = ({callbacks, classes, labels}) => {
    const options = {classes, labels};
    const marker = new BreakpointMarker(classes.breakpoint || '');
    const lines = breakpointLinesField(marker);
    return [
        lines,
        pausedLineField(classes.pausedLine || ''),
        gutter({
            class: classes.breakpointGutter || '',
            markers: view => view.state.field(lines),
            initialSpacer: () => marker,
            domEventHandlers: {
                mousedown (view, line) {
                    callbacks.current.onToggleBreakpoint(view, line.from);
                    return true;
                }
            }
        }),
        hoverTooltip((view, pos) => {
            const items = callbacks.current.watchItemsAt ? callbacks.current.watchItemsAt(view, pos) : null;
            if (!items || !items.items.length) return null;
            return {
                pos: items.from,
                end: items.to,
                above: true,
                create: () => {
                    const {dom, refresh} = tooltipDom(items.items, options);
                    const timer = setInterval(refresh, 250);
                    return {dom, destroy: () => clearInterval(timer)};
                }
            };
        })
    ];
};

const setBreakpointLines = (view, positions) => {
    if (view) view.dispatch({effects: setBreakpointLinesEffect.of(positions)});
};

const setPausedLine = (view, position) => {
    if (view) view.dispatch({effects: setPausedLineEffect.of(typeof position === 'number' ? position : null)});
};

export {
    codeDebugExtension,
    displayName,
    formatValue,
    resolveVariables,
    setBreakpointLines,
    setPausedLine,
    variableNameAt
};

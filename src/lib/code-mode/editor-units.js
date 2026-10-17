import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Lock, Play} from 'lucide-react';
import {EditorState, RangeSet, StateEffect, StateField} from '@codemirror/state';
import {Decoration, EditorView, GutterMarker, gutter} from '@codemirror/view';

const DRAG_TYPE = 'application/x-mw-explorer';

const setUnitsEffect = StateEffect.define();
const setRunningEffect = StateEffect.define();

const runningField = StateField.define({
    create: () => new Set(),
    update (value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setRunningEffect)) return effect.value;
        }
        return value;
    }
});

const mapUnit = (unit, changes) => {
    const from = changes.mapPos(unit.from, 1);
    const to = Math.max(from, changes.mapPos(unit.to, -1));
    return {...unit, from, to};
};

const unitsField = StateField.define({
    create: () => ({locked: [], runs: []}),
    update (value, tr) {
        for (const effect of tr.effects) {
            if (effect.is(setUnitsEffect)) return effect.value;
        }
        if (!tr.docChanged) return value;
        return {
            locked: value.locked.map(unit => mapUnit(unit, tr.changes)).filter(unit => unit.to > unit.from),
            runs: value.runs.map(unit => mapUnit(unit, tr.changes)).filter(unit => unit.to > unit.from)
        };
    }
});

const lockedFilter = EditorState.changeFilter.of(tr => {
    if (!tr.docChanged) return true;
    const {locked} = tr.startState.field(unitsField);
    if (!locked.length) return true;
    const suppressed = [];
    tr.changes.iterChangedRanges((fromA, toA) => {
        for (const unit of locked) {
            const touches = fromA === toA ?
                fromA > unit.from && fromA < unit.to :
                fromA < unit.to && toA > unit.from;
            const wholeScript = fromA <= unit.from && toA >= unit.to;
            if (touches && !wholeScript) suppressed.push(unit.from, unit.to);
        }
    });
    return suppressed.length ? suppressed : true;
});

const iconMarkup = (Icon, size) => renderToStaticMarkup(React.createElement(Icon, {size, 'aria-hidden': true}));

let lockMarkup = null;
let playMarkup = null;

class RunMarker extends GutterMarker {
    constructor (unit, options, running = false) {
        super();
        this.unit = unit;
        this.options = options;
        this.running = running;
    }
    eq (other) {
        return other instanceof RunMarker && other.unit.topId === this.unit.topId && other.running === this.running;
    }
    toDOM () {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = [this.options.classes.run, this.running ? this.options.classes.running : null]
            .filter(Boolean).join(' ');
        if (this.running) button.dataset.running = 'true';
        button.title = this.running && this.options.labels.running ?
            `${this.options.labels.running}. ${this.options.labels.run}` :
            this.options.labels.run;
        button.setAttribute('aria-label', this.options.labels.run);
        if (!playMarkup) playMarkup = iconMarkup(Play, 11);
        button.innerHTML = playMarkup;
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', event => {
            event.preventDefault();
            this.options.callbacks.current.onRun(this.unit.topId);
        });
        return button;
    }
}

const showLockPopup = (anchor, unit, options) => {
    const popup = document.createElement('div');
    popup.className = options.classes.lockPopup || '';
    popup.setAttribute('role', 'tooltip');
    const reason = document.createElement('span');
    reason.textContent = unit.reason || options.labels.lockedReason;
    const show = document.createElement('button');
    show.type = 'button';
    show.className = options.classes.lockPopupButton || '';
    show.textContent = options.labels.showBlock;
    show.addEventListener('click', () => {
        popup.remove();
        options.callbacks.current.onShowBlock(unit.topId);
    });
    popup.append(reason, show);
    document.body.appendChild(popup);
    const rect = anchor.getBoundingClientRect();
    const width = popup.offsetWidth || 240;
    const height = popup.offsetHeight || 60;
    const left = Math.min(Math.max(8, rect.right + 6), window.innerWidth - width - 8);
    const top = rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4;
    popup.style.left = `${left}px`;
    popup.style.top = `${Math.max(8, top)}px`;
    return popup;
};

class LockMarker extends GutterMarker {
    constructor (unit, options) {
        super();
        this.unit = unit;
        this.options = options;
    }
    eq (other) {
        return other instanceof LockMarker && other.unit.topId === this.unit.topId &&
            other.unit.reason === this.unit.reason;
    }
    toDOM () {
        const holder = document.createElement('span');
        holder.className = this.options.classes.lock || '';
        holder.tabIndex = 0;
        holder.setAttribute('aria-label', this.unit.reason || this.options.labels.lockedReason);
        if (!lockMarkup) lockMarkup = iconMarkup(Lock, 11);
        holder.innerHTML = lockMarkup;
        let popup = null;
        let timer = null;
        const close = () => {
            timer = setTimeout(() => {
                if (popup) popup.remove();
                popup = null;
            }, 250);
        };
        const open = () => {
            clearTimeout(timer);
            if (popup && popup.isConnected) return;
            popup = showLockPopup(holder, this.unit, this.options);
            popup.addEventListener('mouseenter', () => clearTimeout(timer));
            popup.addEventListener('mouseleave', close);
        };
        holder.addEventListener('mouseenter', open);
        holder.addEventListener('focus', open);
        holder.addEventListener('mouseleave', close);
        holder.addEventListener('blur', close);
        return holder;
    }
    destroy () {
        return null;
    }
}

const lineStart = (state, pos) => state.doc.lineAt(Math.min(pos, state.doc.length)).from;

const gutterMarkers = (state, options) => {
    const {locked, runs} = state.field(unitsField);
    const running = state.field(runningField, false) || new Set();
    const markers = [];
    const lockedLines = new Set();
    for (const unit of locked) {
        const at = lineStart(state, unit.from);
        lockedLines.add(at);
        markers.push(new LockMarker(unit, options).range(at));
    }
    for (const unit of runs) {
        const at = lineStart(state, unit.from);
        if (!lockedLines.has(at) && options.canRun()) {
            markers.push(new RunMarker(unit, options, running.has(unit.topId)).range(at));
        }
    }
    return RangeSet.of(markers, true);
};

const lockedLineDecorations = className => EditorView.decorations.compute([unitsField], state => {
    const {locked} = state.field(unitsField);
    const ranges = [];
    for (const unit of locked) {
        const first = state.doc.lineAt(Math.min(unit.from, state.doc.length)).number;
        const last = state.doc.lineAt(Math.min(Math.max(unit.from, unit.to - 1), state.doc.length)).number;
        for (let line = first; line <= last; line++) {
            ranges.push(Decoration.line({class: className}).range(state.doc.line(line).from));
        }
    }
    return Decoration.set(ranges, true);
});

const assetDropHandler = callbacks => EditorView.domEventHandlers({
    dragover (event) {
        const types = Array.from((event.dataTransfer && event.dataTransfer.types) || []);
        if (types.includes(DRAG_TYPE)) {
            event.preventDefault();
            return true;
        }
        return false;
    },
    drop (event, view) {
        const raw = event.dataTransfer && event.dataTransfer.getData(DRAG_TYPE);
        if (!raw) return false;
        let item = null;
        try {
            item = JSON.parse(raw);
        } catch (error) {
            return false;
        }
        const name = callbacks.current.resolveAssetName ? callbacks.current.resolveAssetName(item) : null;
        event.preventDefault();
        if (typeof name !== 'string' || view.state.readOnly) return true;
        const pos = view.posAtCoords({x: event.clientX, y: event.clientY});
        const at = pos === null ? view.state.selection.main.head : pos;
        const insert = JSON.stringify(name);
        view.dispatch({changes: {from: at, insert}, selection: {anchor: at + insert.length}, userEvent: 'input.drop'});
        view.focus();
        return true;
    }
});

const codeUnitsExtension = ({callbacks, classes, labels, canRun}) => {
    const options = {callbacks, classes, labels, canRun: canRun || (() => true)};
    return [
        unitsField,
        runningField,
        lockedFilter,
        gutter({
            class: classes.gutter || '',
            markers: view => gutterMarkers(view.state, options),
            initialSpacer: () => new RunMarker({topId: '', from: 0, to: 0}, options)
        }),
        lockedLineDecorations(classes.lockedLine || ''),
        assetDropHandler(callbacks)
    ];
};

const clampUnits = (units, length) => units
    .map(unit => ({...unit, from: Math.min(unit.from, length), to: Math.min(unit.to, length)}))
    .filter(unit => unit.to > unit.from);

const setUnits = (view, value) => {
    if (!view) return;
    const length = view.state.doc.length;
    view.dispatch({
        effects: setUnitsEffect.of({locked: clampUnits(value.locked, length), runs: clampUnits(value.runs, length)}),
        filter: false
    });
};

const setRunning = (view, topIds) => {
    if (!view) return;
    const current = view.state.field(runningField, false);
    if (!current) return;
    const next = new Set(topIds);
    if (next.size === current.size && Array.from(next).every(id => current.has(id))) return;
    view.dispatch({effects: setRunningEffect.of(next)});
};

const readRunning = view => (view ? view.state.field(runningField, false) : null);

const readUnits = view => (view ? view.state.field(unitsField, false) : null);

export {
    DRAG_TYPE,
    codeUnitsExtension,
    lockedFilter,
    readRunning,
    readUnits,
    setRunning,
    setUnits,
    setUnitsEffect,
    unitsField
};

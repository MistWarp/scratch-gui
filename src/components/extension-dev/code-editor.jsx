/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {Compartment, EditorSelection, EditorState, Prec, Transaction} from '@codemirror/state';
import {
    EditorView,
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection
} from '@codemirror/view';
import {defaultKeymap, history, historyField, historyKeymap, indentWithTab} from '@codemirror/commands';
import {javascript, javascriptLanguage} from '@codemirror/lang-javascript';
import {
    HighlightStyle,
    bracketMatching,
    foldKeymap,
    indentOnInput,
    syntaxHighlighting
} from '@codemirror/language';
import {highlightSelectionMatches, searchKeymap} from '@codemirror/search';
import {autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap} from '@codemirror/autocomplete';
import {lintKeymap, setDiagnostics} from '@codemirror/lint';
import {tags} from '@lezer/highlight';

import {scratchCompletionSource, scratchHoverTooltip} from '../../lib/extension-dev/completions.js';
import {fractchLanguage} from '../../lib/code-mode/fractch-language.js';

import styles from './extension-dev.css';

const editorSetup = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    EditorState.tabSize.of(4),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion({icons: false}),
    rectangularSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab
    ])
];

const editorTheme = EditorView.theme({
    '&': {
        height: '100%',
        fontSize: '13px',
        color: 'var(--text-primary)',
        backgroundColor: 'var(--ui-modal-background)'
    },
    '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        lineHeight: '1.5'
    },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--looks-secondary)'
    },
    '&.cm-focused': {
        outline: 'none'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'color-mix(in srgb, var(--looks-secondary) 28%, transparent)'
    },
    '.cm-gutters': {
        backgroundColor: 'var(--ui-modal-background)',
        color: 'color-mix(in srgb, var(--text-primary) 35%, transparent)',
        border: 'none'
    },
    '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '2.5em',
        padding: '0 1em 0 0.75em'
    },
    '.cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--text-primary) 3%, transparent)'
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: 'var(--text-primary)'
    },
    '.cm-content': {
        caretColor: 'var(--looks-secondary)',
        padding: '0.5rem 0'
    },
    '.cm-line': {
        padding: '0 1rem 0 0.25rem'
    },
    '.cm-tooltip': {
        backgroundColor: 'var(--ui-modal-background)',
        color: 'var(--text-primary)',
        border: '1px solid var(--ui-black-transparent)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
        backgroundColor: 'color-mix(in srgb, var(--looks-secondary) 22%, transparent)',
        color: 'var(--text-primary)'
    },
    '.cm-completionInfo': {
        maxWidth: '22rem',
        padding: '0.5rem 0.65rem',
        lineHeight: '1.4'
    },
    '.cm-panels': {
        backgroundColor: 'var(--ui-secondary)',
        color: 'var(--text-primary)'
    },
    '.cm-panel.cm-search': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 10px',
        borderTop: '1px solid var(--ui-black-transparent)',
        backgroundColor: 'var(--ui-secondary)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '12px'
    },
    '.cm-panel.cm-search br': {
        flexBasis: '100%',
        height: '0',
        margin: 0
    },
    '.cm-panel.cm-search .cm-textfield': {
        flex: '1 1 12rem',
        minWidth: '9rem',
        height: '26px',
        padding: '0 8px',
        border: '1px solid var(--ui-black-transparent)',
        borderRadius: '6px',
        background: 'var(--ui-modal-background)',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '12px'
    },
    '.cm-panel.cm-search .cm-textfield::placeholder': {
        color: 'color-mix(in srgb, var(--text-primary) 45%, transparent)'
    },
    '.cm-panel.cm-search .cm-button': {
        height: '26px',
        padding: '0 10px',
        border: '1px solid var(--ui-black-transparent)',
        borderRadius: '6px',
        background: 'var(--ui-tertiary)',
        backgroundImage: 'none',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '12px',
        cursor: 'pointer'
    },
    '.cm-panel.cm-search .cm-button:hover': {
        background: 'color-mix(in srgb, var(--text-primary) 10%, var(--ui-tertiary))'
    },
    '.cm-panel.cm-search label': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        margin: '0',
        fontSize: '11px',
        whiteSpace: 'nowrap'
    },
    '.cm-panel.cm-search input[type=checkbox]': {
        margin: '0',
        accentColor: 'var(--looks-secondary)'
    },
    '.cm-panel.cm-search [name=close]': {
        position: 'static',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        margin: '0 0 0 auto',
        padding: '0',
        border: 'none',
        borderRadius: '6px',
        background: 'transparent',
        color: 'color-mix(in srgb, var(--text-primary) 65%, transparent)',
        fontFamily: 'inherit',
        fontSize: '18px',
        lineHeight: '1',
        cursor: 'pointer'
    },
    '.cm-panel.cm-search [name=close]:hover': {
        background: 'color-mix(in srgb, var(--text-primary) 10%, transparent)',
        color: 'var(--text-primary)'
    },
    '.cm-searchMatch': {
        backgroundColor: 'color-mix(in srgb, var(--status-warning) 35%, transparent)'
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'var(--ui-tertiary)',
        border: 'none',
        color: 'var(--text-primary)'
    }
});

const highlightStyle = HighlightStyle.define([
    {tag: [tags.keyword, tags.modifier, tags.controlKeyword, tags.operatorKeyword], color: 'var(--mw-code-keyword)'},
    {tag: [tags.string, tags.special(tags.string), tags.regexp], color: 'var(--mw-code-string)'},
    {tag: [tags.number, tags.bool, tags.null, tags.atom], color: 'var(--mw-code-number)'},
    {tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: 'var(--mw-code-comment)'},
    {tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--mw-code-function)'},
    {tag: [tags.definition(tags.variableName), tags.className], color: 'var(--mw-code-definition)'},
    {tag: [tags.propertyName], color: 'var(--mw-code-property)'},
    {tag: [tags.typeName, tags.namespace], color: 'var(--mw-code-type)'},
    {tag: tags.invalid, color: 'var(--status-danger)'}
]);

const languageExtensions = props => {
    if (props.language === 'fractch') {
        const extensions = [fractchLanguage];
        if (props.completion) extensions.push(fractchLanguage.data.of({autocomplete: props.completion}));
        if (props.hover) extensions.push(props.hover);
        return extensions;
    }
    if (props.language === 'text') return [];
    if (props.language === 'json') return [javascript()];
    const completion = typeof props.completion === 'undefined' ? scratchCompletionSource : props.completion;
    const hover = typeof props.hover === 'undefined' ? scratchHoverTooltip : props.hover;
    const extensions = [javascript()];
    if (completion) extensions.push(javascriptLanguage.data.of({autocomplete: completion}));
    if (hover) extensions.push(hover);
    return extensions;
};

const isEditable = props => (typeof props.editable === 'boolean' ? props.editable : !props.readOnly);

const savedStates = new Map();
const MAX_SAVED_STATES = 30;

const saveState = (key, view) => {
    if (!key) return;
    savedStates.delete(key);
    savedStates.set(key, {
        json: view.state.toJSON({history: historyField}),
        scrollTop: view.scrollDOM.scrollTop,
        scrollLeft: view.scrollDOM.scrollLeft
    });
    if (savedStates.size > MAX_SAVED_STATES) savedStates.delete(savedStates.keys().next().value);
};

const forgetEditorState = key => {
    savedStates.delete(key);
};

const offsetForLine = (doc, line, column) => {
    if (!line || line < 1) return 0;
    const safeLine = Math.min(line, doc.lines);
    const info = doc.line(safeLine);
    const col = Math.max(1, column || 1);
    return Math.min(info.from + col - 1, info.to);
};

const toCodeMirrorDiagnostics = (doc, diagnostics, onFix) => diagnostics.map(diagnostic => {
    let from = typeof diagnostic.from === 'number' ?
        diagnostic.from :
        offsetForLine(doc, diagnostic.line, diagnostic.column);
    let to = typeof diagnostic.to === 'number' ? diagnostic.to : from;
    from = Math.max(0, Math.min(from, doc.length));
    to = Math.max(from, Math.min(to, doc.length));
    if (to === from && typeof diagnostic.to !== 'number') {
        const line = doc.lineAt(from);
        to = line.to;
    }
    const result = {
        from,
        to,
        severity: diagnostic.severity === 'error' || diagnostic.severity === 'warning' ? diagnostic.severity : 'info',
        message: diagnostic.message,
        source: diagnostic.code || diagnostic.kind
    };
    if (diagnostic.fix && onFix) {
        result.actions = [{
            name: diagnostic.fix.label,
            apply: () => onFix(diagnostic)
        }];
    }
    return result;
});

const CodeEditor = props => {
    const hostRef = useRef(null);
    const viewRef = useRef(null);
    const readOnlyCompartment = useRef(new Compartment());
    const syncing = useRef(false);
    const historyCompartment = useRef(new Compartment());
    const revision = useRef(props.revision);
    const callbacks = useRef(props);
    callbacks.current = props;

    useEffect(() => {
        const host = hostRef.current;
        const extensions = [
            Prec.highest(keymap.of(props.keymap || [])),
            historyCompartment.current.of(history()),
            editorSetup,
            languageExtensions(props),
            props.extensions || [],
            editorTheme,
            syntaxHighlighting(highlightStyle),
            readOnlyCompartment.current.of([
                EditorState.readOnly.of(props.readOnly),
                EditorView.editable.of(isEditable(props))
            ]),
            EditorView.updateListener.of(update => {
                if (update.docChanged && !syncing.current && callbacks.current.onChange) {
                    callbacks.current.onChange(update.state.doc.toString(), update.changes);
                }
            })
        ];
        const saved = props.stateKey ? savedStates.get(props.stateKey) : null;
        let state = null;
        if (saved && saved.json.doc === props.value) {
            try {
                state = EditorState.fromJSON(saved.json, {extensions}, {history: historyField});
            } catch (e) {
                state = null;
            }
        }
        const view = new EditorView({
            parent: host,
            state: state || EditorState.create({doc: props.value, extensions})
        });
        viewRef.current = view;
        if (state && saved) {
            const win = host.ownerDocument.defaultView || window;
            win.requestAnimationFrame(() => {
                view.scrollDOM.scrollTop = saved.scrollTop;
                view.scrollDOM.scrollLeft = saved.scrollLeft;
            });
        }
        if (callbacks.current.onReady) callbacks.current.onReady(view);
        const key = props.stateKey;
        return () => {
            saveState(key, view);
            view.destroy();
            viewRef.current = null;
        };
    }, [props.documentKey]);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        const next = props.value;
        const replaced = revision.current !== props.revision && !props.quietSync;
        revision.current = props.revision;
        if (current === next) return;
        let start = 0;
        const max = Math.min(current.length, next.length);
        while (start < max && current.charCodeAt(start) === next.charCodeAt(start)) start++;
        let end = 0;
        while (end < max - start &&
            current.charCodeAt(current.length - 1 - end) === next.charCodeAt(next.length - 1 - end)) end++;
        syncing.current = true;
        try {
            view.dispatch({
                changes: {from: start, to: current.length - end, insert: next.slice(start, next.length - end)},
                annotations: replaced || props.quietSync ? Transaction.addToHistory.of(false) : [],
                filter: false
            });
            if (replaced) {
                view.dispatch({effects: historyCompartment.current.reconfigure([])});
                view.dispatch({effects: historyCompartment.current.reconfigure(history())});
            }
        } finally {
            syncing.current = false;
        }
    }, [props.value, props.revision, props.documentKey]);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
            effects: readOnlyCompartment.current.reconfigure([
                EditorState.readOnly.of(props.readOnly),
                EditorView.editable.of(isEditable(props))
            ])
        });
    }, [props.readOnly, props.editable, props.documentKey]);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch(setDiagnostics(view.state, toCodeMirrorDiagnostics(
            view.state.doc,
            props.diagnostics,
            diagnostic => callbacks.current.onFix && callbacks.current.onFix(diagnostic)
        )));
    }, [props.diagnostics, props.documentKey]);

    useEffect(() => {
        const view = viewRef.current;
        const focus = props.focus;
        if (!view || !focus) return;
        const doc = view.state.doc;
        const from = typeof focus.from === 'number' ?
            Math.min(focus.from, doc.length) :
            offsetForLine(doc, focus.line, focus.column);
        const to = typeof focus.to === 'number' ? Math.min(focus.to, doc.length) : from;
        view.dispatch({selection: EditorSelection.range(from, to)});
        const win = view.dom.ownerDocument.defaultView || window;
        let done = false;
        let frame = null;
        let observer = null;
        const stop = () => {
            done = true;
            if (frame !== null) win.cancelAnimationFrame(frame);
            if (observer) observer.disconnect();
        };
        const reveal = () => {
            if (done || !view.dom.isConnected || view.scrollDOM.clientHeight === 0) return;
            stop();
            view.dispatch({effects: EditorView.scrollIntoView(from, {y: 'center'})});
            view.focus();
        };
        frame = win.requestAnimationFrame(() => {
            frame = null;
            reveal();
        });
        const Observer = win.ResizeObserver || (typeof ResizeObserver === 'undefined' ? null : ResizeObserver);
        if (Observer) {
            observer = new Observer(reveal);
            observer.observe(view.scrollDOM);
        }
        reveal();
        return stop;
    }, [props.focus, props.documentKey]);

    return (
        <div
            className={styles.codeEditor}
            data-mw-code-editor="true"
            data-dark={props.dark ? 'true' : 'false'}
            ref={hostRef}
        />
    );
};

CodeEditor.propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    completion: PropTypes.func,
    dark: PropTypes.bool,
    diagnostics: PropTypes.arrayOf(PropTypes.object),
    documentKey: PropTypes.string.isRequired,
    editable: PropTypes.bool,
    extensions: PropTypes.array,
    focus: PropTypes.object,
    // eslint-disable-next-line react/no-unused-prop-types
    hover: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    keymap: PropTypes.arrayOf(PropTypes.object),
    // eslint-disable-next-line react/no-unused-prop-types
    language: PropTypes.oneOf(['javascript', 'fractch', 'json', 'text']),
    // eslint-disable-next-line react/no-unused-prop-types
    onChange: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    onFix: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    onReady: PropTypes.func,
    quietSync: PropTypes.bool,
    readOnly: PropTypes.bool,
    revision: PropTypes.number,
    stateKey: PropTypes.string,
    value: PropTypes.string.isRequired
};

CodeEditor.defaultProps = {
    diagnostics: [],
    language: 'javascript',
    readOnly: false
};

export {forgetEditorState};
export default CodeEditor;

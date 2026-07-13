import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import VM from 'scratch-vm';
import {
    Braces,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    File,
    Folder,
    FilePlus,
    FolderOpen,
    GitCompare,
    GitMerge,
    Pencil,
    Trash2,
    TerminalSquare,
    X
} from 'lucide-react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// eslint-disable-next-line import/no-unresolved, import/default
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker.js';

import '@fontsource/jetbrains-mono/latin-400.css';
import '!!style-loader!css-loader!./code-font.css';

import {Theme} from '../../lib/themes';
import {
    abortEditorMerge,
    applyFractchWorkspace,
    completeEditorMerge,
    deleteWorktreeFile,
    getPendingMerge,
    listWorktreeFiles,
    prepareFractchWorkspace,
    readHeadFile,
    readWorktreeFile,
    writeWorktreeFile
} from '../../lib/git/browser-git';
import {parseConflicts, resolutionText} from '../../lib/git/conflicts';
import {sanitize} from '../../lib/git/fractch-tree';
import {setCodeSearch} from '../../lib/find-bar/api';

import FractchTerminal, {CODE_FONT} from './fractch-terminal.jsx';

import styles from './fractch-workspace.css';

const TEXT_FILE_RE = /(?:\.fractch|\.gitignore|\.(?:css|csv|html|js|json|md|svg|txt|xml|ya?ml))$/i;
const MIN_TERMINAL_HEIGHT = 80;
const MIN_EDITOR_HEIGHT = 120;
const DEFAULT_TERMINAL_HEIGHT = 220;
const MAX_GROUPS = 4;
const MAX_SEARCH_RESULTS = 200;
const SPLIT_DIRECTIONS = ['left', 'right', 'down'];

const compactRows = groups => {
    const rows = [...new Set(groups.map(group => group.row))].sort((a, b) => a - b);
    return groups.map(group => ({...group, row: rows.indexOf(group.row)}));
};

const dropEmptyGroups = groups => {
    const kept = groups.filter(group => group.files.length);
    return compactRows(kept.length ? kept : [{active: null, files: [], id: 1, row: 0}]);
};
let sessionExpandedFolders = {};
const decoder = new TextDecoder();
const encoder = new TextEncoder();

global.MonacoEnvironment = {getWorker: () => new EditorWorker()};

let languageRegistered = false;
const registerFractchLanguage = () => {
    if (languageRegistered) return;
    languageRegistered = true;
    monaco.languages.register({id: 'fractch', extensions: ['.fractch']});
    monaco.languages.setMonarchTokensProvider('fractch', {
        defaultToken: '',
        tokenPostfix: '.fractch',
        keywords: [
            'at', 'broadcast', 'clone', 'comment', 'costume', 'def', 'else', 'forever', 'hidden', 'if',
            'layer', 'list', 'repeat', 'return', 'size', 'sound', 'sprite', 'stage', 'use', 'var', 'warp',
            'watch', 'when', 'while'
        ],
        constants: ['true', 'false', 'null'],
        operators: ['=', '==', '!=', '>', '<', '>=', '<=', '+', '-', '*', '/', '%', '&&', '||', '!'],
        tokenizer: {
            root: [
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
                [/"/, 'string', '@string'],
                [/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i, 'number'],
                [/[{}()[\]]/, '@brackets'],
                [/@[a-zA-Z_]\w*/, 'type.identifier'],
                [/[a-zA-Z_]\w*(?=\s*\()/, 'function'],
                [/[a-zA-Z_]\w*(?=\.)/, 'namespace'],
                [/[a-zA-Z_][\w-]*/, {
                    cases: {
                        '@constants': 'constant',
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }],
                [/[=><!~?:&|+\-*/^%]+/, 'operator'],
                [/[;,.]/, 'delimiter']
            ],
            comment: [
                [/[^/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[/*]/, 'comment']
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape'],
                [/"/, 'string', '@pop']
            ]
        }
    });
};

registerFractchLanguage();

const RESOLVE_COMMAND = 'mistwarp.resolveConflict';

const resolveConflictAt = (model, startLine, choice) => {
    const region = parseConflicts(model.getValue())
        .find(candidate => candidate.startLine === startLine);
    if (!region) return;
    model.pushEditOperations(
        [],
        [{
            range: new monaco.Range(region.startLine, 1, region.endLine, model.getLineMaxColumn(region.endLine)),
            text: resolutionText(region, choice)
        }],
        () => null
    );
};

monaco.editor.registerCommand(RESOLVE_COMMAND, (accessor, uri, startLine, choice) => {
    const model = monaco.editor.getModel(uri);
    if (model) resolveConflictAt(model, startLine, choice);
});

monaco.languages.registerCodeLensProvider('*', {
    provideCodeLenses: model => {
        const lenses = parseConflicts(model.getValue()).flatMap(region => ([
            ['Accept current', 'ours'],
            ['Accept incoming', 'theirs'],
            ['Accept both', 'both']
        ].map(([title, choice]) => ({
            command: {
                arguments: [model.uri, region.startLine, choice],
                id: RESOLVE_COMMAND,
                title
            },
            range: new monaco.Range(region.startLine, 1, region.startLine, 1)
        }))));
        return {dispose: () => {}, lenses};
    },
    resolveCodeLens: (model, lens) => lens
});

const conflictDecorations = model => parseConflicts(model.getValue()).flatMap(region => [
    {
        options: {className: 'mw-conflict-ours', isWholeLine: true},
        range: new monaco.Range(region.startLine, 1, (region.baseLine || region.separatorLine) - 1, 1)
    },
    {
        options: {className: 'mw-conflict-theirs', isWholeLine: true},
        range: new monaco.Range(region.separatorLine, 1, region.endLine, 1)
    }
]);

const languageForFile = filepath => {
    if (/\.fractch$/i.test(filepath)) return 'fractch';
    if (/\.json$/i.test(filepath)) return 'json';
    if (/\.js$/i.test(filepath)) return 'javascript';
    if (/\.css$/i.test(filepath)) return 'css';
    if (/\.html$/i.test(filepath)) return 'html';
    if (/\.md$/i.test(filepath)) return 'markdown';
    if (/\.xml$|\.svg$/i.test(filepath)) return 'xml';
    return 'plaintext';
};

const basename = filepath => filepath.slice(filepath.lastIndexOf('/') + 1);

const tailOf = (filepath, segments) => filepath.split('/').slice(-segments)
    .join('/');

const uniqueTail = (filepath, paths) => {
    const depth = filepath.split('/').length;
    const collides = segments => paths.some(
        other => other !== filepath && tailOf(other, segments) === tailOf(filepath, segments)
    );
    let segments = 1;
    while (segments < depth && collides(segments)) segments++;
    return tailOf(filepath, segments);
};

/**
 * Label every open tab with the shortest unique tail of its path, like VS Code does when two
 * files share a name.
 * @param {Array<string>} paths every open file, across all groups
 * @returns {object} path to label
 */
const tabLabels = paths => Object.fromEntries(
    paths.map(filepath => [filepath, uniqueTail(filepath, paths)])
);

const errorMessage = error => (error && error.message ? error.message : String(error));

const joinPath = (directory, name) => (directory ? `${directory}/${name}` : name);

const dirnameOf = filepath => (filepath.includes('/') ? filepath.slice(0, filepath.lastIndexOf('/')) : '');

const stopEvent = event => event.stopPropagation();

const buildFileTree = paths => {
    const root = {};
    for (const filepath of paths) {
        const parts = filepath.split('/');
        let directory = root;
        parts.forEach((name, index) => {
            const path = parts.slice(0, index + 1).join('/');
            if (!directory[name]) {
                directory[name] = index === parts.length - 1 ?
                    {name, path, type: 'file'} : {children: {}, name, path, type: 'folder'};
            }
            if (directory[name].children) directory = directory[name].children;
        });
    }
    const entries = directory => Object.values(directory)
        .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'folder' ? -1 : 1)))
        .map(entry => (entry.children ? {...entry, children: entries(entry.children)} : entry));
    return entries(root);
};

const Indents = ({depth}) => {
    const indents = [];
    for (let i = 0; i < depth; i++) {
        indents.push(<span
            className={styles.indent}
            key={i}
        />);
    }
    return indents;
};

Indents.propTypes = {
    depth: PropTypes.number.isRequired
};

const FileTree = ({
    activeFile,
    depth,
    dropTarget,
    expandedFolders,
    nodes,
    onContextMenu,
    onDragStart,
    onDragOverFolder,
    onDropOnFolder,
    onOpenFile,
    onToggleFolder
}) => (
    <div className={styles.tree}>
        {nodes.map(node => (node.type === 'folder' ? (
            <div key={node.path}>
                <button
                    className={classNames(styles.folder, {[styles.dropTarget]: dropTarget === node.path})}
                    data-folder={node.path}
                    data-path={node.path}
                    data-type="folder"
                    draggable
                    title={node.path}
                    type="button"
                    onClick={onToggleFolder}
                    onContextMenu={onContextMenu}
                    onDragOver={onDragOverFolder}
                    onDragStart={onDragStart}
                    onDrop={onDropOnFolder}
                >
                    <Indents depth={depth} />
                    {expandedFolders[node.path] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {expandedFolders[node.path] ? <FolderOpen size={14} /> : <Folder size={14} />}
                    <span>{node.name}</span>
                </button>
                {expandedFolders[node.path] ? (
                    <FileTree
                        activeFile={activeFile}
                        depth={depth + 1}
                        dropTarget={dropTarget}
                        expandedFolders={expandedFolders}
                        nodes={node.children}
                        onContextMenu={onContextMenu}
                        onDragOverFolder={onDragOverFolder}
                        onDragStart={onDragStart}
                        onDropOnFolder={onDropOnFolder}
                        onOpenFile={onOpenFile}
                        onToggleFolder={onToggleFolder}
                    />
                ) : null}
            </div>
        ) : (
            <button
                className={classNames(styles.file, {[styles.selected]: node.path === activeFile})}
                data-file={node.path}
                data-path={node.path}
                data-type="file"
                disabled={!TEXT_FILE_RE.test(node.path)}
                draggable
                key={node.path}
                title={node.path}
                type="button"
                onClick={onOpenFile}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
            >
                <Indents depth={depth} />
                {/\.fractch$/i.test(node.path) ? <Braces size={14} /> : <File size={14} />}
                <span>{node.name}</span>
            </button>
        )))}
    </div>
);

FileTree.propTypes = {
    activeFile: PropTypes.string,
    depth: PropTypes.number.isRequired,
    dropTarget: PropTypes.string,
    expandedFolders: PropTypes.objectOf(PropTypes.bool).isRequired,
    nodes: PropTypes.arrayOf(PropTypes.shape({
        children: PropTypes.array,
        name: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired
    })).isRequired,
    onContextMenu: PropTypes.func.isRequired,
    onDragOverFolder: PropTypes.func.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDropOnFolder: PropTypes.func.isRequired,
    onOpenFile: PropTypes.func.isRequired,
    onToggleFolder: PropTypes.func.isRequired
};

const ContextMenu = ({colors, menu, onClose, onCreate, onDelete, onRename}) => {
    const [renaming, setRenaming] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [creating, setCreating] = useState(false);
    const [value, setValue] = useState('');

    const startRename = useCallback(() => {
        setValue(basename(menu.path));
        setRenaming(true);
    }, [menu.path]);

    const startCreate = useCallback(() => {
        setValue('');
        setCreating(true);
    }, []);

    const handleChange = useCallback(event => setValue(event.target.value), []);

    const handleSubmit = useCallback(event => {
        event.preventDefault();
        const name = value.trim();
        if (!name) return;
        if (renaming) onRename(menu, name);
        if (creating) onCreate(menu, name);
        onClose();
    }, [creating, menu, onClose, onCreate, onRename, renaming, value]);

    const handleDelete = useCallback(() => {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        onDelete(menu);
        onClose();
    }, [confirming, menu, onClose, onDelete]);

    return (
        <div
            className={styles.contextMenu}
            role="presentation"
            style={{
                'left': menu.x,
                'top': menu.y,
                '--mw-menu-active-background': colors.contextMenuActiveBackground,
                '--mw-menu-background': colors.contextMenuBackground,
                '--mw-menu-border': colors.contextMenuBorder,
                '--mw-menu-foreground': colors.contextMenuForeground
            }}
            onClick={stopEvent}
            onContextMenu={stopEvent}
        >
            {renaming || creating ? (
                <form onSubmit={handleSubmit}>
                    <input
                        autoFocus
                        className={styles.contextInput}
                        placeholder={creating ? 'name.fractch' : ''}
                        value={value}
                        onChange={handleChange}
                    />
                </form>
            ) : (
                <React.Fragment>
                    <button
                        className={styles.contextItem}
                        type="button"
                        onClick={startCreate}
                    >
                        <FilePlus size={14} />
                        {'New file'}
                    </button>
                    {menu.path ? (
                        <React.Fragment>
                            <button
                                className={styles.contextItem}
                                type="button"
                                onClick={startRename}
                            >
                                <Pencil size={14} />
                                {'Rename'}
                            </button>
                            <button
                                className={classNames(styles.contextItem, {
                                    [styles.danger]: confirming
                                })}
                                type="button"
                                onClick={handleDelete}
                            >
                                <Trash2 size={14} />
                                {confirming ? `Delete ${basename(menu.path)}?` : 'Delete'}
                            </button>
                        </React.Fragment>
                    ) : null}
                </React.Fragment>
            )}
        </div>
    );
};

ContextMenu.propTypes = {
    colors: PropTypes.shape({
        contextMenuActiveBackground: PropTypes.string,
        contextMenuBackground: PropTypes.string,
        contextMenuBorder: PropTypes.string,
        contextMenuForeground: PropTypes.string
    }).isRequired,
    menu: PropTypes.shape({
        path: PropTypes.string,
        type: PropTypes.string,
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired
};

const EditorGroup = ({
    dirtyFiles,
    dragging,
    focused,
    group,
    labels,
    models,
    onClose,
    onCursor,
    onDragEnd,
    onDragStart,
    onDropOnTabs,
    onFocus,
    onRegisterEditor,
    onSave,
    onSelect,
    onSplit
}) => {
    const element = useRef(null);
    const editor = useRef(null);
    const headModel = useRef(null);
    const [splitHover, setSplitHover] = useState(null);
    const [diffMode, setDiffMode] = useState(false);
    const groupId = group.id;

    useEffect(() => {
        const options = {
            automaticLayout: true,
            fontFamily: CODE_FONT,
            fontLigatures: false,
            fontSize: 13,
            minimap: {enabled: false},
            padding: {top: 8},
            scrollBeyondLastLine: false,
            tabSize: 2
        };
        const instance = diffMode ?
            monaco.editor.createDiffEditor(element.current, {...options, renderSideBySide: false}) :
            monaco.editor.create(element.current, {...options, model: null});
        const code = diffMode ? instance.getModifiedEditor() : instance;
        editor.current = instance;
        onRegisterEditor(groupId, code);
        const cursorListener = code.onDidChangeCursorPosition(event => {
            onCursor({column: event.position.column, line: event.position.lineNumber});
        });
        const focusListener = code.onDidFocusEditorText(() => onFocus(groupId));
        code.addAction({
            id: 'mistwarp-save-fractch',
            label: 'Save Fractch file',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => onSave()
        });
        return () => {
            cursorListener.dispose();
            focusListener.dispose();
            instance.dispose();
            editor.current = null;
            onRegisterEditor(groupId, null);
        };
    }, [diffMode, groupId, onCursor, onFocus, onRegisterEditor, onSave]);

    useEffect(() => {
        let cancelled = false;
        const entry = group.active && models.current.get(group.active);
        if (editor.current) {
            if (diffMode && entry) {
                readHeadFile(group.active).then(head => {
                    if (cancelled || !editor.current) return;
                    if (headModel.current) headModel.current.dispose();
                    headModel.current = monaco.editor.createModel(
                        head === null ? '' : head,
                        languageForFile(group.active)
                    );
                    editor.current.setModel({modified: entry.model, original: headModel.current});
                });
            } else if (diffMode) {
                editor.current.setModel(null);
            } else {
                editor.current.setModel(entry ? entry.model : null);
            }
        }
        return () => {
            cancelled = true;
        };
    }, [diffMode, group.active, models]);

    useEffect(() => () => {
        if (headModel.current) headModel.current.dispose();
    }, []);

    useEffect(() => {
        const code = editor.current && (diffMode ? editor.current.getModifiedEditor() : editor.current);
        const model = code && code.getModel();
        if (!code || !model) return () => null;
        let decorations = [];
        const refresh = () => {
            decorations = code.deltaDecorations(decorations, conflictDecorations(model));
        };
        refresh();
        const listener = model.onDidChangeContent(refresh);
        return () => {
            listener.dispose();
            if (!model.isDisposed()) code.deltaDecorations(decorations, []);
        };
    }, [diffMode, group.active, models]);

    const handleToggleDiff = useCallback(() => setDiffMode(value => !value), []);

    const handleTabDragStart = useCallback(event => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', JSON.stringify({
            from: groupId,
            path: event.currentTarget.dataset.file
        }));
        onDragStart();
    }, [groupId, onDragStart]);

    const handleTabsDragOver = useCallback(event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const handleTabsDrop = useCallback(event => {
        event.preventDefault();
        onDropOnTabs(groupId, event.dataTransfer.getData('text/plain'));
    }, [groupId, onDropOnTabs]);

    const handleSplitDragOver = useCallback(event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setSplitHover(event.currentTarget.dataset.direction);
    }, []);

    const handleSplitDragLeave = useCallback(() => setSplitHover(null), []);

    const handleSplitDrop = useCallback(event => {
        event.preventDefault();
        const direction = event.currentTarget.dataset.direction;
        setSplitHover(null);
        onSplit(groupId, event.dataTransfer.getData('text/plain'), direction);
    }, [groupId, onSplit]);

    const handleClickGroup = useCallback(() => onFocus(groupId), [groupId, onFocus]);

    const handleSelectTab = useCallback(
        event => onSelect(groupId, event.currentTarget.dataset.file),
        [groupId, onSelect]
    );

    const handleCloseTab = useCallback(event => {
        event.stopPropagation();
        onClose(groupId, event.currentTarget.parentElement.dataset.file);
    }, [groupId, onClose]);

    return (
        <div
            className={classNames(styles.group, {[styles.focused]: focused})}
            role="presentation"
            onClick={handleClickGroup}
        >
            <div className={styles.tabStrip}>
                <div
                    className={styles.tabStripTabs}
                    onDragOver={handleTabsDragOver}
                    onDrop={handleTabsDrop}
                >
                    {group.files.map(filepath => (
                        <div
                            className={classNames(styles.editorTab, {
                                [styles.active]: filepath === group.active
                            })}
                            data-file={filepath}
                            draggable
                            key={filepath}
                            role="presentation"
                            title={filepath}
                            onClick={handleSelectTab}
                            onDragEnd={onDragEnd}
                            onDragStart={handleTabDragStart}
                        >
                            {/\.fractch$/i.test(filepath) ? <Braces size={14} /> : <File size={14} />}
                            <span className={styles.editorTabName}>
                                {labels[filepath] || basename(filepath)}
                            </span>
                            <button
                                aria-label={`Close ${filepath}`}
                                className={classNames(styles.editorTabClose, {
                                    [styles.dirty]: dirtyFiles.includes(filepath)
                                })}
                                title={`Close ${basename(filepath)}`}
                                type="button"
                                onClick={handleCloseTab}
                            >
                                {dirtyFiles.includes(filepath) ?
                                    <span className={styles.editorTabDot} /> :
                                    <X size={14} />}
                            </button>
                        </div>
                    ))}
                </div>
                <div className={styles.editorActions}>
                    <button
                        aria-pressed={diffMode}
                        className={classNames(styles.actionButton, {[styles.toggled]: diffMode})}
                        disabled={!group.active}
                        title={diffMode ? 'Back to editing' : 'Compare with the last commit'}
                        type="button"
                        onClick={handleToggleDiff}
                    >
                        <GitCompare size={15} />
                    </button>
                </div>
            </div>
            <div className={styles.groupBody}>
                <div
                    className={styles.editor}
                    ref={element}
                    style={group.active ? null : {display: 'none'}}
                />
                {group.active ? null : (
                    <div className={styles.emptyEditor}>{'Select a file to start editing'}</div>
                )}
                {dragging ? SPLIT_DIRECTIONS.map(direction => (
                    <div
                        className={classNames(styles.splitZone, styles[direction], {
                            [styles.hover]: splitHover === direction
                        })}
                        data-direction={direction}
                        key={direction}
                        role="presentation"
                        onDragLeave={handleSplitDragLeave}
                        onDragOver={handleSplitDragOver}
                        onDrop={handleSplitDrop}
                    />
                )) : null}
            </div>
        </div>
    );
};

EditorGroup.propTypes = {
    dirtyFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
    dragging: PropTypes.bool.isRequired,
    focused: PropTypes.bool.isRequired,
    group: PropTypes.shape({
        active: PropTypes.string,
        files: PropTypes.arrayOf(PropTypes.string).isRequired,
        id: PropTypes.number.isRequired,
        row: PropTypes.number
    }).isRequired,
    labels: PropTypes.objectOf(PropTypes.string).isRequired,
    models: PropTypes.shape({current: PropTypes.instanceOf(Map)}).isRequired,
    onClose: PropTypes.func.isRequired,
    onCursor: PropTypes.func.isRequired,
    onDragEnd: PropTypes.func.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDropOnTabs: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onRegisterEditor: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onSplit: PropTypes.func.isRequired
};

const parsePayload = raw => {
    try {
        const payload = JSON.parse(raw);
        return payload && payload.path ? payload : null;
    } catch (e) {
        return null;
    }
};

const FractchWorkspace = ({exitRequested, onExit, theme, vm}) => {
    const editorColumnElement = useRef(null);
    const editors = useRef(new Map());
    const focusedGroupRef = useRef(1);
    const models = useRef(new Map());
    const activeFileRef = useRef(null);
    const dirtyRef = useRef(new Set());
    const saveQueue = useRef(Promise.resolve());
    const terminalHeightRef = useRef(DEFAULT_TERMINAL_HEIGHT);
    const searchMatches = useRef([]);
    const searchIndex = useRef(0);
    const searchDecorations = useRef([]);
    const filesRef = useRef([]);
    const groupsRef = useRef([]);
    const openFileRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [groups, setGroups] = useState([{active: null, files: [], id: 1, row: 0}]);
    const [focusedGroup, setFocusedGroup] = useState(1);
    const [dragging, setDragging] = useState(false);
    const [dropTarget, setDropTarget] = useState(null);
    const [menu, setMenu] = useState(null);
    const [dirtyFiles, setDirtyFiles] = useState([]);
    const [cursor, setCursor] = useState({column: 1, line: 1});
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [terminalVisible, setTerminalVisible] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT);
    const [resizing, setResizing] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(sessionExpandedFolders);
    const [status, setStatus] = useState('Preparing Fractch source…');
    const [merge, setMerge] = useState(getPendingMerge);
    const [error, setError] = useState(null);

    const isDark = theme.isDark();
    const tree = useMemo(() => buildFileTree(files), [files]);
    filesRef.current = files;
    groupsRef.current = groups;
    const activeFile = (groups.find(group => group.id === focusedGroup) || groups[0]).active;

    const markDirty = useCallback(filepath => {
        dirtyRef.current.add(filepath);
        setDirtyFiles([...dirtyRef.current]);
    }, []);

    const markClean = useCallback(filepath => {
        if (!dirtyRef.current.delete(filepath)) return;
        setDirtyFiles([...dirtyRef.current]);
    }, []);

    const applyProject = useCallback(async () => {
        setWorking(true);
        setStatus('Applying project…');
        try {
            await applyFractchWorkspace(vm);
            setError(null);
            setStatus('Project updated');
        } catch (e) {
            setError(errorMessage(e));
            setStatus('Project has errors');
        } finally {
            setWorking(false);
        }
    }, [vm]);

    const saveFile = useCallback((filepath, apply = true) => {
        const entry = filepath && models.current.get(filepath);
        if (!entry) return Promise.resolve();
        const value = entry.model.getValue();
        saveQueue.current = saveQueue.current.then(async () => {
            await writeWorktreeFile(filepath, encoder.encode(value));
            markClean(filepath);
            setStatus(`Saved ${filepath}`);
            setError(null);
            if (apply) await applyProject();
        }).catch(e => {
            setError(errorMessage(e));
            setStatus('Save failed');
        });
        return saveQueue.current;
    }, [applyProject, markClean]);

    const saveActiveFile = useCallback(() => saveFile(activeFileRef.current), [saveFile]);

    const saveDirtyFiles = useCallback(() => {
        const pending = [...dirtyRef.current];
        return Promise.all(pending.map(filepath => saveFile(filepath, false)))
            .then(() => (pending.length ? applyProject() : null));
    }, [applyProject, saveFile]);

    const ensureModel = useCallback(async filepath => {
        const existing = models.current.get(filepath);
        if (existing) return existing;
        const contents = decoder.decode(await readWorktreeFile(filepath));
        const model = monaco.editor.createModel(contents, languageForFile(filepath));
        const listener = model.onDidChangeContent(() => {
            markDirty(filepath);
            setStatus('Unsaved changes');
        });
        const entry = {listener, model};
        models.current.set(filepath, entry);
        return entry;
    }, [markDirty]);

    const openFile = useCallback(async (filepath, groupId) => {
        if (!filepath || !TEXT_FILE_RE.test(filepath)) return;
        try {
            await ensureModel(filepath);
            // A file lives in exactly one tab; opening it again just focuses the tab it is in.
            const existing = groupsRef.current.find(group => group.files.includes(filepath));
            const target = groupId || (existing ? existing.id : focusedGroupRef.current);
            focusedGroupRef.current = target;
            activeFileRef.current = filepath;
            setFocusedGroup(target);
            setGroups(previous => previous.map(group => (group.id === target ? {
                ...group,
                active: filepath,
                files: group.files.includes(filepath) ? group.files : [...group.files, filepath]
            } : group)));
            setError(null);
            const instance = editors.current.get(target);
            if (instance) instance.focus();
        } catch (e) {
            setError(errorMessage(e));
        }
    }, [ensureModel]);

    const closeFile = useCallback((groupId, filepath) => {
        setGroups(previous => {
            const next = previous.map(group => {
                if (group.id !== groupId) return group;
                const index = group.files.indexOf(filepath);
                const remaining = group.files.filter(open => open !== filepath);
                const active = group.active === filepath ?
                    (remaining[Math.min(index, remaining.length - 1)] || null) :
                    group.active;
                return {...group, active, files: remaining};
            });
            return dropEmptyGroups(next);
        });
    }, []);

    const disposeModel = useCallback(filepath => {
        const entry = models.current.get(filepath);
        if (!entry) return;
        entry.listener.dispose();
        entry.model.dispose();
        models.current.delete(filepath);
        setGroups(previous => {
            const next = previous.map(group => {
                const remaining = group.files.filter(open => open !== filepath);
                const active = group.active === filepath ? (remaining[0] || null) : group.active;
                return {...group, active, files: remaining};
            });
            return dropEmptyGroups(next);
        });
    }, []);

    const syncFromWorktree = useCallback(async () => {
        const nextFiles = await listWorktreeFiles();
        setFiles(nextFiles);
        for (const [filepath, entry] of models.current) {
            if (!nextFiles.includes(filepath)) {
                disposeModel(filepath);
                continue;
            }
            if (dirtyRef.current.has(filepath)) continue;
            const contents = decoder.decode(await readWorktreeFile(filepath));
            if (contents !== entry.model.getValue()) {
                entry.model.setValue(contents);
                markClean(filepath);
            }
        }
    }, [disposeModel, markClean]);

    useEffect(() => {
        const openModels = models.current;
        return () => {
            for (const entry of openModels.values()) {
                entry.listener.dispose();
                entry.model.dispose();
            }
            openModels.clear();
        };
    }, []);

    useEffect(() => {
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }, [isDark]);

    useEffect(() => {
        const activeEditor = () => editors.current.get(focusedGroupRef.current);
        const reveal = index => {
            const matches = searchMatches.current;
            const instance = activeEditor();
            if (!matches.length || !instance) return;
            const wrapped = ((index % matches.length) + matches.length) % matches.length;
            searchIndex.current = wrapped;
            instance.setSelection(matches[wrapped].range);
            instance.revealRangeInCenterIfOutsideViewport(matches[wrapped].range);
        };

        const textOf = async filepath => {
            const entry = models.current.get(filepath);
            if (entry) return entry.model.getValue();
            return decoder.decode(await readWorktreeFile(filepath));
        };

        setCodeSearch({
            open: async result => {
                await openFileRef.current(result.filepath);
                const instance = activeEditor();
                if (!instance) return;
                const range = new monaco.Range(result.line, result.column, result.line, result.column);
                instance.setSelection(range);
                instance.revealRangeInCenterIfOutsideViewport(range);
                instance.focus();
            },
            search: (query, caseSensitive) => {
                const instance = activeEditor();
                const model = instance && instance.getModel();
                if (!model) return;
                const matches = query ?
                    model.findMatches(query, true, false, Boolean(caseSensitive), null, false) :
                    [];
                searchMatches.current = matches;
                searchIndex.current = 0;
                searchDecorations.current = instance.deltaDecorations(
                    searchDecorations.current,
                    matches.map(match => ({
                        range: match.range,
                        options: {className: 'findMatch', overviewRuler: null}
                    }))
                );
                if (matches.length) reveal(0);
            },
            searchAll: async (query, caseSensitive) => {
                if (!query) {
                    setStatus('Fractch workspace ready');
                    return [];
                }
                const needle = caseSensitive ? query : query.toLowerCase();
                const results = [];
                let truncated = false;
                for (const filepath of filesRef.current.filter(file => TEXT_FILE_RE.test(file))) {
                    const lines = (await textOf(filepath)).split('\n');
                    for (let index = 0; index < lines.length; index++) {
                        const haystack = caseSensitive ? lines[index] : lines[index].toLowerCase();
                        const column = haystack.indexOf(needle);
                        if (column === -1) continue;
                        if (results.length >= MAX_SEARCH_RESULTS) {
                            truncated = true;
                            break;
                        }
                        results.push({
                            column: column + 1,
                            filepath,
                            line: index + 1,
                            preview: lines[index].trim().slice(0, 120)
                        });
                    }
                    if (truncated) break;
                }
                setStatus(
                    `${results.length}${truncated ? '+' : ''} result${results.length === 1 ? '' : 's'} ` +
                    `for "${query}"`
                );
                return results;
            },
            step: direction => reveal(searchIndex.current + direction)
        });
        return () => setCodeSearch(null);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const prepare = async () => {
            try {
                const pending = getPendingMerge();
                const nextFiles = pending ? await listWorktreeFiles() : await prepareFractchWorkspace(vm);
                if (cancelled) return;
                setFiles(nextFiles);
                if (pending) {
                    for (const filepath of pending.conflicts) {
                        if (cancelled) return;
                        await openFile(filepath);
                    }
                    if (!cancelled) setStatus(`Resolve ${pending.conflicts.length} conflicted file(s)`);
                } else {
                    const firstFile = nextFiles.find(file => /\.fractch$/i.test(file)) ||
                        nextFiles.find(file => TEXT_FILE_RE.test(file));
                    if (firstFile) await openFile(firstFile);
                    if (!cancelled) setStatus('Fractch workspace ready');
                }
            } catch (e) {
                if (!cancelled) setError(errorMessage(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        prepare();
        return () => {
            cancelled = true;
        };
    }, [vm]);


    useEffect(() => {
        const column = editorColumnElement.current;
        const clamp = () => {
            const available = column.getBoundingClientRect().height - MIN_EDITOR_HEIGHT;
            const max = Math.max(MIN_TERMINAL_HEIGHT, available);
            setTerminalHeight(height => Math.min(Math.max(height, MIN_TERMINAL_HEIGHT), max));
        };
        const resizeObserver = new ResizeObserver(clamp);
        resizeObserver.observe(column);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        terminalHeightRef.current = terminalHeight;
    }, [terminalHeight]);

    useEffect(() => {
        const group = groups.find(candidate => candidate.id === focusedGroup);
        if (!group) {
            setFocusedGroup(groups[0].id);
            return;
        }
        focusedGroupRef.current = group.id;
        activeFileRef.current = group.active;
    }, [focusedGroup, groups]);

    const handleOpenFile = useCallback(event => openFile(event.currentTarget.dataset.file), [openFile]);
    const handleSelectTab = useCallback((groupId, filepath) => openFile(filepath, groupId), [openFile]);
    const handleRegisterEditor = useCallback((groupId, instance) => {
        if (instance) {
            editors.current.set(groupId, instance);
        } else {
            editors.current.delete(groupId);
        }
    }, []);
    const handleFocusGroup = useCallback(groupId => setFocusedGroup(groupId), []);
    const handleDragStart = useCallback(() => setDragging(true), []);
    const handleDragEnd = useCallback(() => setDragging(false), []);

    const handleDropOnTabs = useCallback((groupId, raw) => {
        setDragging(false);
        const payload = parsePayload(raw);
        if (!payload) return;
        // A file dragged out of the explorer opens in the pane it was dropped on.
        if (payload.kind === 'explorer') {
            if (payload.type === 'file') openFile(payload.path, groupId);
            return;
        }
        if (payload.from === groupId) return;
        setGroups(previous => {
            const next = previous.map(group => {
                if (group.id === payload.from) {
                    const remaining = group.files.filter(open => open !== payload.path);
                    const active = group.active === payload.path ? (remaining[0] || null) : group.active;
                    return {...group, active, files: remaining};
                }
                if (group.id === groupId) {
                    return {
                        ...group,
                        active: payload.path,
                        files: group.files.includes(payload.path) ? group.files : [...group.files, payload.path]
                    };
                }
                return group;
            });
            return dropEmptyGroups(next);
        });
        focusedGroupRef.current = groupId;
        activeFileRef.current = payload.path;
        setFocusedGroup(groupId);
    }, [openFile]);

    const handleSplit = useCallback((groupId, raw, direction) => {
        setDragging(false);
        const payload = parsePayload(raw);
        if (!payload) return;
        if (payload.kind === 'explorer') {
            if (payload.type === 'file') openFile(payload.path, groupId);
            return;
        }
        setGroups(previous => {
            const source = previous.find(group => group.id === payload.from);
            if (!source) return previous;

            const withoutFile = group => {
                const remaining = group.files.filter(open => open !== payload.path);
                const active = group.active === payload.path ? (remaining[0] || null) : group.active;
                return {...group, active, files: remaining};
            };
            const withFile = group => ({
                ...group,
                active: payload.path,
                files: group.files.includes(payload.path) ? group.files : [...group.files, payload.path]
            });

            if (payload.from !== groupId) {
                focusedGroupRef.current = groupId;
                return dropEmptyGroups(previous.map(group => {
                    if (group.id === payload.from) return withoutFile(group);
                    if (group.id === groupId) return withFile(group);
                    return group;
                }));
            }

            // ponytail: rows of side-by-side groups, capped at MAX_GROUPS. Enough for a grid,
            // without a recursive split tree.
            if (previous.length >= MAX_GROUPS || source.files.length < 2) return previous;
            const id = Math.max(...previous.map(group => group.id)) + 1;
            focusedGroupRef.current = id;

            if (direction === 'down') {
                const next = previous.map(group => {
                    const moved = group.row > source.row ? {...group, row: group.row + 1} : group;
                    return moved.id === payload.from ? withoutFile(moved) : moved;
                });
                return compactRows([
                    ...next,
                    {active: payload.path, files: [payload.path], id, row: source.row + 1}
                ]);
            }

            const created = {active: payload.path, files: [payload.path], id, row: source.row};
            const next = [];
            for (const group of previous) {
                const updated = group.id === payload.from ? withoutFile(group) : group;
                if (group.id === groupId && direction === 'left') next.push(created);
                next.push(updated);
                if (group.id === groupId && direction === 'right') next.push(created);
            }
            return compactRows(next);
        });
        activeFileRef.current = payload.path;
        setFocusedGroup(focusedGroupRef.current);
    }, [openFile]);

    openFileRef.current = openFile;

    const handleWorktreeChanged = useCallback(async () => {
        await syncFromWorktree();
        await applyProject();
    }, [applyProject, syncFromWorktree]);

    const importFiles = useCallback(async (fileList, directory) => {
        setWorking(true);
        try {
            for (const file of fileList) {
                const bytes = new Uint8Array(await file.arrayBuffer());
                await writeWorktreeFile(joinPath(directory, file.name), bytes);
            }
            setStatus(`Added ${fileList.length} file(s)`);
            await handleWorktreeChanged();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [handleWorktreeChanged]);

    const movePath = useCallback(async (source, type, directory) => {
        const parent = source.includes('/') ? source.slice(0, source.lastIndexOf('/')) : '';
        if (parent === directory) return;
        // Moving a folder into itself or one of its own children would delete it as it copies.
        if (type === 'folder' && (directory === source || directory.startsWith(`${source}/`))) return;

        const moving = type === 'folder' ?
            filesRef.current.filter(file => file.startsWith(`${source}/`)) :
            [source];
        if (!moving.length) return;

        setWorking(true);
        try {
            const base = source.includes('/') ? source.slice(0, source.lastIndexOf('/') + 1) : '';
            for (const filepath of moving) {
                const destination = joinPath(directory, filepath.slice(base.length));
                if (destination === filepath) continue;
                await writeWorktreeFile(destination, await readWorktreeFile(filepath));
                await deleteWorktreeFile(filepath);
                if (models.current.has(filepath)) {
                    disposeModel(filepath);
                    await openFile(destination);
                }
            }
            setStatus(`Moved ${source}`);
            await handleWorktreeChanged();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [disposeModel, handleWorktreeChanged, openFile]);

    const handleTreeDragStart = useCallback(event => {
        const {path, type} = event.currentTarget.dataset;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', JSON.stringify({kind: 'explorer', path, type}));
    }, []);

    const handleDragOverFolder = useCallback(event => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget(event.currentTarget.dataset.path || '');
    }, []);

    const handleDragOverRoot = useCallback(event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget('');
    }, []);

    const handleDragLeaveTree = useCallback(() => setDropTarget(null), []);

    const dropInto = useCallback((event, directory) => {
        event.preventDefault();
        event.stopPropagation();
        setDropTarget(null);
        if (event.dataTransfer.files && event.dataTransfer.files.length) {
            importFiles([...event.dataTransfer.files], directory);
            return;
        }
        const payload = parsePayload(event.dataTransfer.getData('text/plain'));
        if (payload && payload.kind === 'explorer') movePath(payload.path, payload.type, directory);
    }, [importFiles, movePath]);

    const handleDropOnFolder = useCallback(
        event => dropInto(event, event.currentTarget.dataset.path),
        [dropInto]
    );

    const handleDropOnRoot = useCallback(event => dropInto(event, ''), [dropInto]);

    const handleContextMenu = useCallback(event => {
        event.preventDefault();
        event.stopPropagation();
        const {path, type} = event.currentTarget.dataset;
        setMenu({path: path || '', type: type || 'root', x: event.clientX, y: event.clientY});
    }, []);

    const handleCloseMenu = useCallback(() => setMenu(null), []);

    const handleCreateFile = useCallback(async (target, name) => {
        const directory = target.type === 'folder' ? target.path : dirnameOf(target.path);
        const filepath = joinPath(directory, name);
        setWorking(true);
        try {
            await writeWorktreeFile(filepath, encoder.encode(''));
            await syncFromWorktree();
            setStatus(`Created ${filepath}`);
            if (TEXT_FILE_RE.test(filepath)) await openFile(filepath);
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [openFile, syncFromWorktree]);

    const handleRename = useCallback(async (target, name) => {
        const destination = joinPath(dirnameOf(target.path), name);
        if (destination === target.path) return;
        setWorking(true);
        try {
            const moving = target.type === 'folder' ?
                filesRef.current.filter(file => file.startsWith(`${target.path}/`)) :
                [target.path];
            for (const filepath of moving) {
                const next = target.type === 'folder' ?
                    joinPath(destination, filepath.slice(target.path.length + 1)) :
                    destination;
                await writeWorktreeFile(next, await readWorktreeFile(filepath));
                await deleteWorktreeFile(filepath);
                if (models.current.has(filepath)) {
                    disposeModel(filepath);
                    await openFile(next);
                }
            }
            setStatus(`Renamed to ${destination}`);
            await handleWorktreeChanged();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [disposeModel, handleWorktreeChanged, openFile]);

    const handleDelete = useCallback(async target => {
        setWorking(true);
        try {
            const removing = target.type === 'folder' ?
                filesRef.current.filter(file => file.startsWith(`${target.path}/`)) :
                [target.path];
            for (const filepath of removing) {
                await deleteWorktreeFile(filepath);
                if (models.current.has(filepath)) disposeModel(filepath);
            }
            setStatus(`Deleted ${target.path}`);
            await handleWorktreeChanged();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [disposeModel, handleWorktreeChanged]);

    useEffect(() => {
        const close = () => setMenu(null);
        if (menu) {
            window.addEventListener('click', close);
            window.addEventListener('blur', close);
        }
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('blur', close);
        };
    }, [menu]);

    const handleCompleteMerge = useCallback(async () => {
        setWorking(true);
        try {
            await saveDirtyFiles();
            await completeEditorMerge({});
            setMerge(null);
            setStatus('Merge committed');
            setError(null);
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [saveDirtyFiles]);

    const handleAbortMerge = useCallback(async () => {
        setWorking(true);
        try {
            await abortEditorMerge();
            setMerge(null);
            await syncFromWorktree();
            await applyProject();
            setStatus('Merge aborted');
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setWorking(false);
        }
    }, [applyProject, syncFromWorktree]);

    const handleDismissError = useCallback(() => setError(null), []);
    const handleToggleTerminal = useCallback(event => {
        event.stopPropagation();
        setTerminalVisible(value => !value);
    }, []);
    const handleToggleFolder = useCallback(event => {
        const folder = event.currentTarget.dataset.folder;
        setExpandedFolders(value => {
            sessionExpandedFolders = {...value, [folder]: !value[folder]};
            return sessionExpandedFolders;
        });
    }, []);

    const handlePanelPointerDown = useCallback(event => {
        if (!terminalVisible || event.button !== 0 || event.target.closest('button')) return;
        event.preventDefault();
        const handle = event.currentTarget;
        const startY = event.clientY;
        const startHeight = terminalHeightRef.current;
        handle.setPointerCapture(event.pointerId);
        setResizing(true);
        const move = moveEvent => {
            const available = editorColumnElement.current.getBoundingClientRect().height - MIN_EDITOR_HEIGHT;
            const max = Math.max(MIN_TERMINAL_HEIGHT, available);
            const next = startHeight + startY - moveEvent.clientY;
            setTerminalHeight(Math.min(Math.max(next, MIN_TERMINAL_HEIGHT), max));
        };
        const stop = () => {
            handle.removeEventListener('pointermove', move);
            handle.removeEventListener('pointerup', stop);
            handle.removeEventListener('pointercancel', stop);
            setResizing(false);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', stop);
        handle.addEventListener('pointercancel', stop);
    }, [terminalVisible]);

    const selectEditedTarget = useCallback(() => {
        const filepath = activeFileRef.current;
        if (!filepath) return;
        const directory = filepath.includes('/') ?
            filepath.slice(0, filepath.indexOf('/')) :
            filepath.replace(/\.[^.]+$/, '');
        const target = vm.runtime.targets.find(
            candidate => candidate.isOriginal && sanitize(candidate.getName()) === directory
        );
        if (target) vm.setEditingTarget(target.id);
    }, [vm]);

    useEffect(() => {
        if (!exitRequested) return;
        const finish = () => {
            selectEditedTarget();
            onExit();
        };
        saveDirtyFiles().then(finish, finish);
    }, [exitRequested, onExit, saveDirtyFiles, selectEditedTarget]);

    const labels = tabLabels([...new Set(groups.flatMap(group => group.files))]);
    const rows = [...new Set(groups.map(group => group.row))].sort((a, b) => a - b);

    return (
        <div className={classNames(styles.workspace, {[styles.resizing]: resizing})}>
            {merge ? (
                <div className={styles.mergeBanner}>
                    <GitMerge size={15} />
                    <span className={styles.mergeMessage}>
                        {`Merging ${merge.theirs} into ${merge.ours}. `}
                        {`Resolve the conflicts in ${merge.conflicts.length} file(s), then commit the merge.`}
                    </span>
                    <button
                        className={styles.actionButton}
                        disabled={working}
                        type="button"
                        onClick={handleCompleteMerge}
                    >
                        {'Commit merge'}
                    </button>
                    <button
                        className={styles.actionButton}
                        disabled={working}
                        type="button"
                        onClick={handleAbortMerge}
                    >
                        {'Abort'}
                    </button>
                </div>
            ) : null}
            <div className={styles.main}>
                <aside
                    aria-label="Project files"
                    className={classNames(styles.sidebar, {[styles.dropTarget]: dropTarget === ''})}
                    data-type="root"
                    onContextMenu={handleContextMenu}
                    onDragLeave={handleDragLeaveTree}
                    onDragOver={handleDragOverRoot}
                    onDrop={handleDropOnRoot}
                >
                    <div className={styles.sidebarTitle}>{'Explorer'}</div>
                    <FileTree
                        activeFile={activeFile}
                        depth={0}
                        dropTarget={dropTarget}
                        expandedFolders={expandedFolders}
                        nodes={tree}
                        onContextMenu={handleContextMenu}
                        onDragOverFolder={handleDragOverFolder}
                        onDragStart={handleTreeDragStart}
                        onDropOnFolder={handleDropOnFolder}
                        onOpenFile={handleOpenFile}
                        onToggleFolder={handleToggleFolder}
                    />
                </aside>
                <div
                    className={styles.editorAndTerminal}
                    ref={editorColumnElement}
                >
                    <div className={styles.groups}>
                        {rows.map(row => (
                            <div
                                className={styles.groupRow}
                                key={row}
                            >
                                {groups.filter(group => group.row === row).map(group => (
                                    <EditorGroup
                                        dirtyFiles={dirtyFiles}
                                        dragging={dragging}
                                        focused={group.id === focusedGroup}
                                        group={group}
                                        key={group.id}
                                        labels={labels}
                                        models={models}
                                        onClose={closeFile}
                                        onCursor={setCursor}
                                        onDragEnd={handleDragEnd}
                                        onDragStart={handleDragStart}
                                        onDropOnTabs={handleDropOnTabs}
                                        onFocus={handleFocusGroup}
                                        onRegisterEditor={handleRegisterEditor}
                                        onSave={saveActiveFile}
                                        onSelect={handleSelectTab}
                                        onSplit={handleSplit}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div
                        className={classNames(styles.panelHeader, {
                            [styles.draggable]: terminalVisible,
                            [styles.open]: terminalVisible
                        })}
                        role="presentation"
                        title={terminalVisible ? 'Drag to resize the terminal' : 'Show the terminal'}
                        onClick={terminalVisible ? null : handleToggleTerminal}
                        onPointerDown={handlePanelPointerDown}
                    >
                        <span>
                            <TerminalSquare size={14} />
                            {' Terminal'}
                        </span>
                        <button
                            aria-label={terminalVisible ? 'Hide terminal' : 'Show terminal'}
                            className={styles.panelToggle}
                            type="button"
                            onClick={handleToggleTerminal}
                        >
                            {terminalVisible ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                    </div>
                    <FractchTerminal
                        className={classNames(styles.terminal, {[styles.hidden]: !terminalVisible})}
                        style={{height: terminalHeight}}
                        themeId={theme.id}
                        vm={vm}
                        onWorktreeChanged={handleWorktreeChanged}
                    />
                </div>
            </div>
            <div className={classNames(styles.statusBar, {[styles.error]: !!error})}>
                {error ? (
                    <React.Fragment>
                        <span className={styles.statusItem}>{error}</span>
                        <button
                            aria-label="Dismiss error"
                            className={styles.panelToggle}
                            type="button"
                            onClick={handleDismissError}
                        >
                            <X size={12} />
                        </button>
                    </React.Fragment>
                ) : null}
                <span className={styles.statusMessage}>{status}</span>
                {activeFile ? (
                    <React.Fragment>
                        <span className={styles.statusItem}>{`Ln ${cursor.line}, Col ${cursor.column}`}</span>
                        <span className={styles.statusItem}>{languageForFile(activeFile)}</span>
                    </React.Fragment>
                ) : null}
            </div>
            {menu ? (
                <ContextMenu
                    colors={theme.getBlockColors()}
                    menu={menu}
                    onClose={handleCloseMenu}
                    onCreate={handleCreateFile}
                    onDelete={handleDelete}
                    onRename={handleRename}
                />
            ) : null}
            {loading ? <div className={styles.loading}>{'Preparing Fractch source…'}</div> : null}
        </div>
    );
};

FractchWorkspace.propTypes = {
    exitRequested: PropTypes.bool,
    onExit: PropTypes.func.isRequired,
    theme: PropTypes.instanceOf(Theme).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default FractchWorkspace;

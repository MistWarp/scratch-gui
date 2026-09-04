import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useState} from 'react';
import {
    ChevronDown, ChevronRight, FileCode2, FileQuestion, Folder, FolderOpen, Search
} from 'lucide-react';
import styles from './FileBrowserTree.module.css';

export const buildProjectFileTree = files => {
    const root = {name: '', path: '', folders: new Map(), files: []};
    for (const file of files) {
        const parts = file.path.split('/');
        let node = root;
        for (const name of parts.slice(0, -1)) {
            const path = node.path ? `${node.path}/${name}` : name;
            if (!node.folders.has(name)) node.folders.set(name, {name, path, folders: new Map(), files: []});
            node = node.folders.get(name);
        }
        node.files.push({...file, name: parts[parts.length - 1]});
    }
    return root;
};

const collectFolderPaths = (node, paths = []) => {
    for (const folder of node.folders.values()) {
        paths.push(folder.path);
        collectFolderPaths(folder, paths);
    }
    return paths;
};

export const initiallyOpenFolders = tree => collectFolderPaths(tree)
    .filter(path => !/(^|\/)assets$/i.test(path));

const parentFolders = path => path.split('/').slice(0, -1).map((_, index, parts) => (
    parts.slice(0, index + 1).join('/')
));

const TreeRows = ({node, openFolders, selectedPath, onToggle, onSelect, showStats}) => (
    <ul className={styles.treeList}>
        {[...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name)).map(folder => {
            const open = openFolders.has(folder.path);
            return (
                <li key={folder.path}>
                    <button type="button" className={styles.folderRow} onClick={() => onToggle(folder.path)}>
                        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        {open ? <FolderOpen size={15} /> : <Folder size={15} />}
                        <span>{folder.name}</span>
                    </button>
                    {open ? (
                        <TreeRows node={folder} {...{openFolders, selectedPath, onToggle, onSelect, showStats}} />
                    ) : null}
                </li>
            );
        })}
        {node.files.sort((a, b) => a.name.localeCompare(b.name)).map(file => (
            <li key={file.path}>
                <button
                    type="button"
                    className={file.path === selectedPath ? styles.fileRowActive : styles.fileRow}
                    onClick={() => onSelect(file.path)}
                    title={file.path}
                >
                    {file.binary ? <FileQuestion size={14} /> : <FileCode2 size={14} />}
                    <span>{file.name}</span>
                    {showStats && !file.binary ? <small><b>+{file.additions}</b><i>-{file.deletions}</i></small> : null}
                </button>
            </li>
        ))}
    </ul>
);

TreeRows.propTypes = {
    node: PropTypes.object.isRequired,
    openFolders: PropTypes.instanceOf(Set).isRequired,
    selectedPath: PropTypes.string.isRequired,
    onToggle: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    showStats: PropTypes.bool.isRequired
};

const FileBrowserTree = ({files, selectedPath, onSelect, showCount, showStats}) => {
    const [query, setQuery] = useState('');
    const completeTree = useMemo(() => buildProjectFileTree(files), [files]);
    const [openFolders, setOpenFolders] = useState(() => new Set(initiallyOpenFolders(completeTree)));
    const filteredFiles = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return needle ? files.filter(file => file.path.toLowerCase().includes(needle)) : files;
    }, [files, query]);
    const tree = useMemo(() => buildProjectFileTree(filteredFiles), [filteredFiles]);
    const visibleFolders = useMemo(() => (
        query.trim() ? new Set(collectFolderPaths(tree)) : openFolders
    ), [openFolders, query, tree]);

    useEffect(() => {
        setOpenFolders(new Set(initiallyOpenFolders(completeTree)));
    }, [completeTree]);

    useEffect(() => {
        if (!selectedPath) return;
        setOpenFolders(current => new Set([...current, ...parentFolders(selectedPath)]));
    }, [selectedPath]);

    const toggleFolder = path => setOpenFolders(current => {
        const next = new Set(current);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
    });

    return (
        <aside className={styles.sidebar}>
            <label className={styles.search}>
                <Search size={15} />
                <input value={query} placeholder="Filter files" onChange={event => setQuery(event.target.value)} />
            </label>
            {showCount ? (
                <div className={styles.fileCount}>
                    {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
                </div>
            ) : null}
            <nav aria-label="Project files">
                <TreeRows
                    node={tree}
                    openFolders={visibleFolders}
                    selectedPath={selectedPath}
                    onToggle={toggleFolder}
                    onSelect={onSelect}
                    showStats={showStats}
                />
            </nav>
        </aside>
    );
};

FileBrowserTree.propTypes = {
    files: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedPath: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
    showCount: PropTypes.bool,
    showStats: PropTypes.bool
};

FileBrowserTree.defaultProps = {
    showCount: false,
    showStats: false
};

export default FileBrowserTree;

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {ChevronDown, ChevronRight, Folder, FolderOpen} from 'lucide-react';
import styles from './assets-modal.css';
import AssetFile, {DRAG_TYPE} from './asset-file.jsx';

const buildTree = (assets, extraFolders = []) => {
    const root = {name: '', path: '', folders: new Map(), files: []};

    const descend = segments => {
        let node = root;
        let path = '';
        for (const segment of segments) {
            path = path ? `${path}/${segment}` : segment;
            if (!node.folders.has(segment)) {
                node.folders.set(segment, {name: segment, path, folders: new Map(), files: []});
            }
            node = node.folders.get(segment);
        }
        return node;
    };

    assets.forEach((asset, index) => {
        const segments = asset.name.split('/');
        const fileName = segments.pop();
        descend(segments).files.push(Object.assign({}, asset, {index, fileName}));
    });

    for (const folder of extraFolders) {
        descend(folder.split('/'));
    }

    return root;
};

class AssetFolder extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDragOver',
            'handleDragLeave',
            'handleDrop',
            'handleClick',
            'handleToggle'
        ]);
        this.state = {
            over: false,
            collapsed: false
        };
    }

    handleDragOver (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.state.over) {
            this.setState({over: true});
        }
    }

    handleDragLeave (e) {
        e.stopPropagation();
        this.setState({over: false});
    }

    handleDrop (e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({over: false});

        const moved = e.dataTransfer.getData(DRAG_TYPE);
        if (moved !== '') {
            this.props.onMove(Number(moved), this.props.node.path);
            return;
        }
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
            this.props.onDropFiles(e.dataTransfer.files, this.props.node.path);
        }
    }

    handleClick (e) {
        e.stopPropagation();
        this.props.onSelect(this.props.node.path);
    }

    handleToggle (e) {
        e.stopPropagation();
        this.setState(state => ({collapsed: !state.collapsed}));
    }

    render () {
        const {node, isRoot} = this.props;
        const folders = Array.from(node.folders.values())
            .sort((a, b) => a.name.localeCompare(b.name));
        const files = node.files.slice()
            .sort((a, b) => a.fileName.localeCompare(b.fileName));

        const children = (
            <React.Fragment>
                {folders.map(child => (
                    <AssetFolder
                        key={child.path}
                        node={child}
                        isRoot={false}
                        selected={this.props.selected}
                        selectedIndex={this.props.selectedIndex}
                        onSelect={this.props.onSelect}
                        onSelectFile={this.props.onSelectFile}
                        onMove={this.props.onMove}
                        onDropFiles={this.props.onDropFiles}
                        onRename={this.props.onRename}
                    />
                ))}
                {files.map(file => (
                    <AssetFile
                        key={file.name}
                        index={file.index}
                        name={file.name}
                        fileName={file.fileName}
                        folder={node.path}
                        dataFormat={file.dataFormat}
                        size={file.size}
                        selected={this.props.selectedIndex === file.index}
                        onSelectFile={this.props.onSelectFile}
                        onRename={this.props.onRename}
                    />
                ))}
            </React.Fragment>
        );

        if (isRoot) {
            return (
                <div
                    className={classNames(styles.tree, {
                        [styles.dropTarget]: this.state.over,
                        [styles.selected]: this.props.selected === ''
                    })}
                    onClick={this.handleClick}
                    onDragOver={this.handleDragOver}
                    onDragLeave={this.handleDragLeave}
                    onDrop={this.handleDrop}
                >
                    {children}
                </div>
            );
        }

        return (
            <div
                className={classNames(styles.folder, {
                    [styles.dropTarget]: this.state.over,
                    [styles.selected]: this.props.selected === node.path
                })}
                onClick={this.handleClick}
                onDragOver={this.handleDragOver}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}
            >
                <div className={styles.folderRow}>
                    <button
                        type="button"
                        className={styles.folderToggle}
                        aria-expanded={!this.state.collapsed}
                        aria-label={`${this.state.collapsed ? 'Expand' : 'Collapse'} ${node.name}`}
                        onClick={this.handleToggle}
                    >
                        {this.state.collapsed ? (
                            <ChevronRight size={14} />
                        ) : (
                            <ChevronDown size={14} />
                        )}
                    </button>
                    <button
                        type="button"
                        className={styles.folderSelect}
                        aria-pressed={this.props.selected === node.path}
                        onClick={this.handleClick}
                    >
                        {this.state.collapsed ? (
                            <Folder
                                className={styles.folderIcon}
                                size={15}
                            />
                        ) : (
                            <FolderOpen
                                className={styles.folderIcon}
                                size={15}
                            />
                        )}
                        <span className={styles.folderName}>{node.name}</span>
                    </button>
                </div>

                {!this.state.collapsed && (
                    <div className={styles.folderChildren}>
                        {children}
                    </div>
                )}
            </div>
        );
    }
}

const nodeShape = PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    folders: PropTypes.instanceOf(Map).isRequired,
    files: PropTypes.array.isRequired
});

AssetFolder.propTypes = {
    node: nodeShape.isRequired,
    isRoot: PropTypes.bool.isRequired,
    selected: PropTypes.string.isRequired,
    selectedIndex: PropTypes.number,
    onSelect: PropTypes.func.isRequired,
    onSelectFile: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onDropFiles: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired
};

export {buildTree, AssetFolder, DRAG_TYPE};

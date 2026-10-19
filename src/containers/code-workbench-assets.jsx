/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {
    AudioWaveform,
    Check,
    Copy,
    Download,
    File as FileIcon,
    FilePlus2,
    FileText,
    FolderOpen,
    FolderPlus,
    History,
    Image as ImageIcon,
    Info,
    Pencil,
    Trash2,
    Upload
} from 'lucide-react';

import TextTab from '../components/code-mode/text-tab.jsx';
import CustomAssetTab from '../components/code-mode/custom-asset-tab.jsx';
import messages from '../components/code-mode/messages.js';
import {showStandardAlert} from '../reducers/alerts.js';
import {ask, promptText} from '../lib/code-mode/code-dialogs.js';
import {
    addAssetFiles,
    assetKind,
    baseName,
    buildAssetTree,
    createTextFile,
    deleteFolder,
    folderOf,
    isInside,
    joinPath,
    languageFor,
    moveFolder,
    readText,
    renameEntry,
    writeText
} from '../lib/code-mode/custom-assets.js';
import {getAssetDraft, setAssetDraft, assetDraftNames} from '../lib/code-mode/text-store.js';
import {baseHash, classifyDraft, loadDraft, scheduleDraftWrite} from '../lib/code-mode/code-drafts.js';
import {customAssetTab, pinTab, pruneTabs, renameTab} from '../lib/code-mode/tabs.js';
import {groupById, mapGroups, setGroupTabs} from '../lib/code-mode/editor-groups.js';
import {getShortcutKey} from '../lib/shortcuts/registry.js';
import formatShortcutDisplay from '../lib/shortcuts/display.js';
import downloadBlob from '../lib/utils/download-blob.js';

const ROOT_KEY = 'folder:assets';
const FOLDER_PREFIX = 'assetFolder:';
const ROW_TYPES = new Set(['assets', 'assetFolder', 'assetFile']);
const FILE_ICONS = {text: FileText, image: ImageIcon, audio: AudioWaveform, binary: FileIcon};

const emptyFolders = new Map();

const lower = name => String(name).toLowerCase();

const cleanPath = value => String(value || '').split('/')
    .map(part => part.trim())
    .filter(Boolean)
    .join('/');

class AssetWorkbench {
    constructor (workbench) {
        this.wb = workbench;
        this.notes = new Map();
        this.stale = new Map();
        this.checked = new Set();
        this.texts = new WeakMap();
        this.handleChange = this.handleChange.bind(this);
        this.reset = this.reset.bind(this);
    }

    get manager () {
        return this.wb.props.vm.runtime.assetManager || null;
    }

    m (descriptor, values) {
        return this.wb.props.intl.formatMessage(descriptor, values);
    }

    attach () {
        if (this.manager) this.manager.on('change', this.handleChange);
        this.wb.props.vm.runtime.on('PROJECT_LOADED', this.reset);
    }

    detach () {
        if (this.manager) this.manager.off('change', this.handleChange);
        this.wb.props.vm.runtime.off('PROJECT_LOADED', this.reset);
    }

    reset () {
        this.notes.clear();
        this.stale.clear();
        this.checked.clear();
    }

    refresh () {
        if (!this.wb.unmounted) this.wb.setState(state => ({assetsVersion: (state.assetsVersion || 0) + 1}));
    }

    handleChange () {
        if (this.batching) return;
        const manager = this.manager;
        for (const name of assetDraftNames()) {
            if (!manager.getAsset(name)) this.dropDraft(name);
        }
        this.wb.updateLayout(layout => mapGroups(layout, group => pruneTabs(group,
            tab => tab.kind !== 'customAsset' || Boolean(manager.getAsset(tab.name)))));
        this.refresh();
    }

    owns (item) {
        return Boolean(item) && ROW_TYPES.has(item.type);
    }

    identity () {
        const controller = this.wb.controller;
        return controller && controller.identity ? controller.identity() : null;
    }

    persist (name, draft) {
        scheduleDraftWrite(this.identity(), {assetName: name}, draft ?
            {text: draft.text, baseHash: baseHash(draft.base)} : null);
    }

    dropDraft (name) {
        setAssetDraft(name, null);
        this.persist(name, null);
    }

    textOf (entry) {
        if (!this.texts.has(entry.asset)) this.texts.set(entry.asset, readText(entry));
        return this.texts.get(entry.asset);
    }

    folderSet () {
        const key = this.wb.state.projectKey;
        if (!emptyFolders.has(key)) emptyFolders.set(key, new Set());
        return emptyFolders.get(key);
    }

    rows () {
        const manager = this.manager;
        if (!manager) return [];
        const wb = this.wb;
        const names = manager.assets.map(entry => entry.name);
        const folders = Array.from(this.folderSet());
        const expanded = wb.isExpanded(ROOT_KEY, true);
        const rows = [{
            key: ROOT_KEY,
            type: 'assets',
            label: this.m(messages.assets),
            depth: 0,
            expandable: true,
            expanded,
            meta: names.length ? String(names.length) : null
        }];
        if (!expanded) return rows;
        if (!names.length && !folders.length) {
            rows.push({
                key: 'assets:empty',
                type: 'empty',
                label: this.m(messages.noAssets),
                depth: 1,
                muted: true,
                parentKey: ROOT_KEY
            });
        }
        const walk = (node, depth, parentKey) => {
            for (const folder of node.folders) {
                const key = `${FOLDER_PREFIX}${lower(folder.path)}`;
                const open = wb.isExpanded(key, false);
                rows.push({
                    key,
                    type: 'assetFolder',
                    label: folder.name,
                    folderPath: folder.path,
                    depth,
                    expandable: true,
                    expanded: open,
                    draggable: true,
                    renamable: true,
                    parentKey
                });
                if (open) walk(folder, depth + 1, key);
            }
            for (const name of node.files) {
                const entry = manager.getAsset(name);
                const kind = assetKind(entry);
                rows.push({
                    key: customAssetTab(name).key,
                    type: 'assetFile',
                    label: baseName(name),
                    assetName: name,
                    tooltip: name,
                    depth,
                    openable: true,
                    draggable: true,
                    renamable: true,
                    icon: FILE_ICONS[kind],
                    thumbnail: kind === 'image' ? manager.getObjectURL(name) || null : null,
                    parentKey
                });
            }
        };
        walk(buildAssetTree(names, folders), 1, ROOT_KEY);
        return rows;
    }

    folderOfRow (row) {
        if (row.type === 'assetFolder') return row.folderPath;
        if (row.type === 'assetFile') return folderOf(row.assetName);
        return '';
    }

    expand (path) {
        const keys = {[ROOT_KEY]: true};
        let current = '';
        for (const part of path ? path.split('/') : []) {
            current = joinPath(current, part);
            keys[`${FOLDER_PREFIX}${lower(current)}`] = true;
        }
        this.wb.setState(state => ({expanded: {...state.expanded, ...keys}}));
    }

    contextMenu (row) {
        if (!this.owns(row)) return null;
        const folder = this.folderOfRow(row);
        const create = [
            {label: this.m(messages.newTextFile), icon: FilePlus2, onClick: () => this.newTextFile(folder)},
            {label: this.m(messages.newFolder), icon: FolderPlus, onClick: () => this.newFolder(folder)},
            {label: this.m(messages.uploadAsset), icon: Upload, onClick: () => this.upload(folder)}
        ];
        const rename = {label: this.m(messages.rename), icon: Pencil, onClick: () => this.wb.handleExplorerRename(row)};
        const remove = {label: this.m(messages.delete), icon: Trash2, onClick: () => this.remove(row)};
        if (row.type === 'assets') return create;
        if (row.type === 'assetFolder') return create.concat({...rename, separator: true}, remove);
        return [
            {label: this.m(messages.open),
                icon: FolderOpen,
                onClick: () => this.wb.openFile(customAssetTab(row.assetName), {preview: false})},
            rename,
            remove,
            {label: this.m(messages.download), icon: Download, onClick: () => this.download(row.assetName)}
        ];
    }

    async newTextFile (folder) {
        const entered = await promptText(this.wb.props.dispatch, {
            title: this.m(messages.newTextFile),
            message: this.m(messages.newTextFileMessage),
            defaultValue: 'untitled.txt'
        });
        const path = cleanPath(joinPath(folder, cleanPath(entered)));
        if (!entered || !path || !this.manager) return;
        const name = createTextFile(this.manager, path);
        if (!name) return;
        this.expand(folderOf(name));
        this.wb.openFile(customAssetTab(name), {preview: false});
    }

    async newFolder (parent) {
        const entered = await promptText(this.wb.props.dispatch, {
            title: this.m(messages.newFolder),
            message: this.m(messages.newFolderMessage),
            defaultValue: ''
        });
        const path = cleanPath(joinPath(parent, cleanPath(entered)));
        if (!path) return;
        this.folderSet().add(path);
        this.expand(path);
    }

    upload (folder) {
        const input = this.wb.fileInput;
        if (!input) return;
        this.wb.pendingUpload = {kind: 'customAsset', folder};
        input.accept = '';
        input.click();
    }

    addFiles (files, folder) {
        const list = Array.from(files || []);
        if (!list.length || !this.manager) return Promise.resolve({added: [], failed: 0});
        return addAssetFiles(this.manager, list, folder).then(result => {
            if (result.failed) this.wb.props.dispatch(showStandardAlert('assetImportError'));
            if (result.added.length) this.expand(folder);
            return result;
        });
    }

    batch (fn) {
        this.batching = true;
        let result;
        try {
            result = fn();
        } finally {
            this.batching = false;
        }
        this.applyRenames(result || {});
        this.handleChange();
    }

    applyRenames (renames) {
        for (const [from, to] of Object.entries(renames)) {
            if (from === to) continue;
            const draft = getAssetDraft(from);
            if (draft) {
                this.dropDraft(from);
                setAssetDraft(to, draft);
                this.persist(to, draft);
            }
            const fromKey = customAssetTab(from).key;
            this.wb.updateLayout(layout => mapGroups(layout, group => renameTab(group, fromKey, customAssetTab(to))));
        }
    }

    renameFolders (from, to) {
        const folders = this.folderSet();
        for (const path of Array.from(folders)) {
            if (lower(path) === lower(from) || isInside(path, from)) {
                folders.delete(path);
                folders.add(`${to}${path.substring(from.length)}`);
            }
        }
    }

    rename (row, value) {
        const manager = this.manager;
        if (!manager) return;
        if (row.type === 'assetFile') {
            this.batch(() => {
                const next = renameEntry(manager, row.assetName, joinPath(folderOf(row.assetName), cleanPath(value)));
                if (next) this.expand(folderOf(next));
                return next ? {[row.assetName]: next} : null;
            });
            return;
        }
        if (row.type === 'assetFolder') {
            const to = cleanPath(joinPath(folderOf(row.folderPath), cleanPath(value)));
            if (!to || isInside(to, row.folderPath)) return;
            this.renameFolders(row.folderPath, to);
            this.batch(() => moveFolder(manager, row.folderPath, to));
            this.expand(to);
        }
    }

    move (source, row) {
        const manager = this.manager;
        if (!manager || !this.owns(row)) return;
        const folder = this.folderOfRow(row);
        if (source.type === 'assetFile') {
            if (lower(folderOf(source.assetName)) === lower(folder)) return;
            this.batch(() => {
                const next = renameEntry(manager, source.assetName, joinPath(folder, baseName(source.assetName)));
                return next ? {[source.assetName]: next} : null;
            });
            this.expand(folder);
            return;
        }
        if (source.type === 'assetFolder') {
            if (!this.canDrop(row, source)) return;
            const to = joinPath(folder, baseName(source.folderPath));
            this.renameFolders(source.folderPath, to);
            this.batch(() => moveFolder(manager, source.folderPath, to));
            this.expand(to);
        }
    }

    canDrop (row, source) {
        if (!this.owns(row)) return false;
        const folder = this.folderOfRow(row);
        if (source.type === 'assetFile') return lower(folderOf(source.assetName)) !== lower(folder);
        if (source.type !== 'assetFolder') return false;
        const from = source.folderPath;
        return lower(folderOf(from)) !== lower(folder) && lower(folder) !== lower(from) && !isInside(folder, from);
    }

    async remove (row) {
        const manager = this.manager;
        if (!manager || (row.type !== 'assetFile' && row.type !== 'assetFolder')) return;
        const folder = row.type === 'assetFolder';
        const count = folder ? manager.assets.filter(entry => isInside(entry.name, row.folderPath)).length : 1;
        const choice = await ask(this.wb.props.dispatch, {
            type: 'confirm',
            title: this.m(messages.deleteAssetTitle, {name: folder ? row.folderPath : row.assetName}),
            message: folder ? this.m(messages.deleteFolderMessage, {count}) : this.m(messages.deleteAssetMessage),
            choices: [{value: 'delete', label: this.m(messages.delete)}]
        });
        if (choice !== 'delete') return;
        if (folder) {
            const folders = this.folderSet();
            for (const path of Array.from(folders)) {
                if (lower(path) === lower(row.folderPath) || isInside(path, row.folderPath)) folders.delete(path);
            }
            deleteFolder(manager, row.folderPath);
            this.refresh();
        } else {
            manager.deleteAssetByName(row.assetName);
        }
    }

    download (name) {
        const entry = this.manager && this.manager.getAsset(name);
        if (entry) downloadBlob(baseName(entry.name), new Blob([entry.asset.data]));
    }

    goTo (symbol, targetId) {
        const manager = this.manager;
        if (symbol.kind === 'assetFolder') {
            const exists = manager && (manager.listFolder(symbol.name).length ||
                manager.assets.some(entry => isInside(entry.name, symbol.name)));
            if (!exists) return this.notFound(symbol, targetId);
            this.expand(symbol.name);
            this.wb.setState({selectedKey: `${FOLDER_PREFIX}${lower(cleanPath(symbol.name))}`});
            return true;
        }
        const entry = manager && manager.getAsset(symbol.name);
        if (!entry) return this.notFound(symbol, targetId);
        this.expand(folderOf(entry.name));
        this.wb.openFile(customAssetTab(entry.name), {preview: false});
        return true;
    }

    notFound (symbol, targetId) {
        this.wb.showMessage(targetId, this.m(messages.noDefinition, {name: symbol.name}));
        return true;
    }

    isDirty (tab) {
        return Boolean(getAssetDraft(tab.name));
    }

    edit (groupId, tab, text) {
        const wb = this.wb;
        const group = groupById(wb.state.layout, groupId);
        if (group && tab.key === group.previewKey) {
            wb.updateLayout(layout => setGroupTabs(layout, groupId, pinTab(groupById(layout, groupId), tab.key)));
        }
        const entry = this.manager && this.manager.getAsset(tab.name);
        if (!entry) return;
        const live = this.textOf(entry);
        const draft = getAssetDraft(entry.name);
        if (this.notes.get(lower(entry.name)) === 'applied') this.notes.delete(lower(entry.name));
        if (text === live) {
            this.dropDraft(entry.name);
            return;
        }
        const next = {text, base: draft ? draft.base : live};
        setAssetDraft(entry.name, next);
        this.persist(entry.name, next);
    }

    apply (tab, {save}) {
        const draft = getAssetDraft(tab.name);
        if (!draft || !this.manager || this.stale.has(lower(tab.name))) {
            if (save) this.wb.save();
            return Promise.resolve(null);
        }
        writeText(this.manager, tab.name, draft.text);
        this.dropDraft(tab.name);
        this.notes.set(lower(tab.name), 'applied');
        this.refresh();
        if (save) this.wb.save();
        return Promise.resolve({status: 'committed'});
    }

    checkPersisted (entry) {
        const key = lower(entry.name);
        const identity = this.identity();
        if (!identity || this.checked.has(key) || getAssetDraft(entry.name)) return;
        this.checked.add(key);
        loadDraft(identity, {assetName: entry.name}).then(draft => {
            const current = this.manager && this.manager.getAsset(entry.name);
            if (!draft || !current || getAssetDraft(current.name)) return;
            const live = this.textOf(current);
            const kind = classifyDraft(draft, live);
            if (kind === 'restore') {
                setAssetDraft(current.name, {text: draft.text, base: live});
                this.notes.set(key, 'restored');
            } else if (kind === 'stale') {
                this.stale.set(key, {baseText: live, text: draft.text});
            }
            this.refresh();
        });
    }

    textMessages (entry, draft, live) {
        const note = this.notes.get(lower(entry.name));
        const items = [];
        if (this.stale.has(lower(entry.name))) {
            items.push({key: 'draft', icon: History, text: this.m(messages.staleDraft)});
        }
        if (draft && draft.base !== live) items.push({key: 'changed', icon: Info, text: this.m(messages.assetChanged)});
        if (note === 'restored' && draft) {
            items.push({key: 'restored', icon: History, text: this.m(messages.restoredDraft)});
        }
        if (note === 'applied' && !draft) items.push({key: 'applied', icon: Check, text: this.m(messages.applied)});
        return items;
    }

    staleOverlay (entry) {
        const key = lower(entry.name);
        const stale = this.stale.get(key);
        if (!stale) return null;
        return {
            title: this.m(messages.staleDraft),
            beforeLabel: this.m(messages.currentFile),
            afterLabel: this.m(messages.yourText),
            sections: [{
                key: 'draft',
                before: stale.baseText,
                after: stale.text,
                actions: [
                    {label: this.m(messages.copy),
                        icon: Copy,
                        primary: true,
                        onClick: () => {
                            if (navigator.clipboard) navigator.clipboard.writeText(stale.text).catch(() => {});
                        }},
                    {label: this.m(messages.discard),
                        icon: Trash2,
                        onClick: () => {
                            this.stale.delete(key);
                            this.persist(entry.name, null);
                            this.refresh();
                        }}
                ]
            }]
        };
    }

    render (tab, resolved, group) {
        const wb = this.wb;
        const entry = resolved.entry;
        const kind = assetKind(entry);
        if (kind !== 'text') {
            return (
                <CustomAssetTab
                    format={entry.asset.dataFormat}
                    key={tab.key}
                    kind={kind}
                    name={entry.name}
                    size={entry.asset.data.length}
                    url={kind === 'binary' ? null : this.manager.getObjectURL(entry.name)}
                    onDownload={() => this.download(entry.name)}
                />
            );
        }
        this.checkPersisted(entry);
        const live = this.textOf(entry);
        const draft = getAssetDraft(entry.name);
        const overlay = this.staleOverlay(entry);
        return (
            <TextTab
                applyDisabled={!draft || Boolean(overlay)}
                applyHint={formatShortcutDisplay(getShortcutKey('applyFile', wb.props.customShortcuts))}
                completion={null}
                dark={wb.props.dark}
                key={tab.key}
                language={languageFor(entry.name)}
                messages={this.textMessages(entry, draft, live)}
                overlay={overlay}
                readOnly={Boolean(overlay)}
                tabKey={`${wb.state.projectKey}:${tab.key}${group.id === 'g0' ? '' : `:${group.id}`}`}
                value={draft ? draft.text : live}
                onApply={() => this.apply(tab, {save: false})}
                onChange={text => this.edit(group.id, tab, text)}
            />
        );
    }
}

export {ROOT_KEY as ASSETS_ROOT_KEY};
export default AssetWorkbench;

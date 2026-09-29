import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import VM from 'scratch-vm';

import BackpackComponent from '../components/backpack/backpack.jsx';
import {
    getBackpackContents,
    saveBackpackObject,
    deleteBackpackObject,
    updateBackpackObject,
    soundPayload,
    costumePayload,
    spritePayload,
    codePayload,
    fetchCode,
    fetchSprite,
    LOCAL_API
} from '../lib/api/backpack';
import DragConstants from '../lib/constants/drag-constants';
import storage from '../lib/persistence/storage';
import {updateCallbacks} from '../lib/shortcuts/event-router.js';
import {placeInViewport} from '../lib/backpack/code-payload.js';
import {describeBlocks, humanizeOpcode, getWorkspaceBlockText} from '../lib/backpack/script-name.js';
import {
    getBackpackLayout,
    setBackpackLayout,
    getBackpackPinned,
    setBackpackPinned,
    getBackpackHeight,
    setBackpackHeight
} from '../lib/backpack/layout.js';
import {ensurePatched, subscribeBlockDrag} from '../lib/backpack/block-drag-hooks.js';
import lazyScratchBlocks from '../lib/tw-lazy-scratch-blocks';
import log from '../lib/utils/log';

const incomingDragTypes = [DragConstants.COSTUME, DragConstants.SOUND, DragConstants.SPRITE];

const STRIP_MIN_HEIGHT = 8.75 * 16;
const STRIP_DEFAULT_HEIGHT = STRIP_MIN_HEIGHT;
const NOTICE_DURATION = 2200;

const messages = defineMessages({
    scriptAutoName: {
        defaultMessage: '{block} · {count, plural, one {# block} other {# blocks}}',
        description: 'Automatic name for a script saved to the backpack, showing its first block and block count',
        id: 'mw.backpack.scriptAutoName'
    },
    scriptAutoNameNoBlock: {
        defaultMessage: 'Script · {count, plural, one {# block} other {# blocks}}',
        description: 'Automatic name for a script saved to the backpack when its first block has no text',
        id: 'mw.backpack.scriptAutoNameNoBlock'
    },
    saved: {
        defaultMessage: 'Saved to backpack.',
        description: 'Confirmation shown after dropping something into the backpack',
        id: 'mw.backpack.savedNotice'
    },
    insertedScript: {
        defaultMessage: 'Script added to {sprite}.',
        description: 'Confirmation shown after a backpack script was added to a sprite',
        id: 'mw.backpack.insertedScript'
    },
    insertedCostume: {
        defaultMessage: 'Costume added to {sprite}.',
        description: 'Confirmation shown after a backpack costume was added to a sprite',
        id: 'mw.backpack.insertedCostume'
    },
    insertedSound: {
        defaultMessage: 'Sound added to {sprite}.',
        description: 'Confirmation shown after a backpack sound was added to a sprite',
        id: 'mw.backpack.insertedSound'
    },
    insertedSprite: {
        defaultMessage: 'Sprite added to the project.',
        description: 'Confirmation shown after a backpack sprite was added to the project',
        id: 'mw.backpack.insertedSprite'
    }
});

const normalizeSearch = value => `${value || ''}`.normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const filterBackpackContents = (contents, value) => {
    const query = normalizeSearch(value).trim();
    if (!query) return contents;

    const terms = query.split(/\s+/);
    const aliases = {
        costume: 'costumes image images',
        script: 'scripts block blocks code',
        sound: 'sounds audio',
        sprite: 'sprites character characters'
    };

    return contents.map((item, index) => {
        const name = normalizeSearch(item.name || item.type || 'script');
        const searchable = `${name} ${item.type} ${aliases[item.type] || ''}`;
        if (!terms.every(term => searchable.includes(term))) return null;

        let score = 3;
        if (name === query) score = 0;
        else if (name.startsWith(query)) score = 1;
        else if (name.split(/\s+/).some(word => word.startsWith(query))) score = 2;
        return {item, index, score};
    }).filter(Boolean)
        .sort((a, b) => a.score - b.score || a.index - b.index)
        .map(result => result.item);
};

const isIncomingAssetDrag = dragInfo => Boolean(
    dragInfo && dragInfo.dragging && incomingDragTypes.includes(dragInfo.dragType)
);

const pointInElement = (element, x, y) => {
    if (!element || !element.isConnected) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

class Backpack extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleDrop',
            'handleToggle',
            'handleOpen',
            'handleClose',
            'handlePinToggle',
            'handleLayoutChange',
            'handleFilterChange',
            'handleDelete',
            'handleInsert',
            'handleRenameStart',
            'handleRenameSubmit',
            'handleRenameCancel',
            'getBackpackAssetURL',
            'getContents',
            'handleBlockDragEnd',
            'handleBlockDragUpdate',
            'handleBlockDragHook',
            'handleResizePointerDown',
            'handleResizePointerMove',
            'handleResizePointerUp',
            'handleGlobalPointerMove',
            'handleDocumentPointerDown',
            'handlePanelKeyDown',
            'setPanelRef',
            'setHandleRef',
            'handleMore',
            'handleSearchChange'
        ]);

        this.dropZones = {panel: null, handle: null};
        this.lastPointer = {x: null, y: null};
        this.resizeSession = null;
        this.contentsRequest = null;
        this.loadAllContents = false;
        this.hasLoaded = false;
        this.dropRequest = null;
        this.deletingItems = new Set();
        this.insertingItems = new Set();
        this.renamingItems = new Set();
        this.pendingBlockDrop = false;
        this.pendingBlockDropTimer = null;
        this.noticeTimer = null;
        this.shortcutTimer = null;
        this.unsubscribeBlockDrag = null;
        this.unmounted = false;

        const layout = getBackpackLayout();
        const pinned = getBackpackPinned();

        this.state = {
            blockDragActive: false,
            blockDragOutsideWorkspace: false,
            blockDragOverBackpack: false,
            assetDragOver: false,
            error: false,
            itemsPerPage: 100,
            moreToLoad: false,
            loading: false,
            expanded: layout === 'drawer' && pinned,
            pinned,
            layout,
            contents: [],
            height: getBackpackHeight(STRIP_MIN_HEIGHT) || STRIP_DEFAULT_HEIGHT,
            searchQuery: '',
            filter: 'all',
            renamingId: null,
            busyId: null,
            notice: null
        };

        if (props.host && !storage._hasAddedBackpackSource && props.host !== LOCAL_API) {
            storage.addWebSource(
                [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
                this.getBackpackAssetURL
            );
            storage._hasAddedBackpackSource = true;
        }
    }
    componentDidMount () {
        this.unmounted = false;
        this.props.vm.addListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
        this.props.vm.addListener('BLOCK_DRAG_UPDATE', this.handleBlockDragUpdate);

        document.addEventListener('pointermove', this.handleGlobalPointerMove);
        document.addEventListener('mousemove', this.handleGlobalPointerMove);
        document.addEventListener('pointerdown', this.handleDocumentPointerDown, true);

        this.unsubscribeBlockDrag = subscribeBlockDrag(this.handleBlockDragHook);
        updateCallbacks({toggleBackpack: this.handleToggle});
        this.shortcutTimer = setTimeout(() => {
            updateCallbacks({toggleBackpack: this.handleToggle});
        }, 0);
        this.getContents();
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        const previous = this.props.dragInfo;
        const next = nextProps.dragInfo;
        if (previous === next) return;

        const wasIncoming = isIncomingAssetDrag(previous);
        const isIncoming = isIncomingAssetDrag(next);

        if (isIncoming && next.currentOffset) {
            const over = this.isPointOverDropZones(next.currentOffset.x, next.currentOffset.y);
            if (over !== this.state.assetDragOver) {
                this.setState({assetDragOver: over});
            }
        }
        if (wasIncoming && !isIncoming && this.state.assetDragOver) {
            this.handleDrop(previous);
            this.setState({assetDragOver: false});
        }
    }
    componentWillUnmount () {
        this.unmounted = true;
        this.props.vm.removeListener('BLOCK_DRAG_END', this.handleBlockDragEnd);
        this.props.vm.removeListener('BLOCK_DRAG_UPDATE', this.handleBlockDragUpdate);

        document.removeEventListener('pointermove', this.handleGlobalPointerMove);
        document.removeEventListener('mousemove', this.handleGlobalPointerMove);
        document.removeEventListener('pointerdown', this.handleDocumentPointerDown, true);

        window.removeEventListener('pointermove', this.handleResizePointerMove);
        window.removeEventListener('pointerup', this.handleResizePointerUp);
        window.removeEventListener('pointercancel', this.handleResizePointerUp);

        if (this.unsubscribeBlockDrag) this.unsubscribeBlockDrag();
        clearTimeout(this.shortcutTimer);
        clearTimeout(this.noticeTimer);
        clearTimeout(this.pendingBlockDropTimer);
        this.setPanelRef(null);
        this.setHandleRef(null);
    }

    setDropZone (name, element) {
        this.dropZones[name] = element;
    }
    setPanelRef (element) {
        this.setDropZone('panel', element);
    }
    setHandleRef (element) {
        this.setDropZone('handle', element);
    }

    isPointOverDropZones (x, y) {
        if (typeof x !== 'number' || typeof y !== 'number') return false;
        return pointInElement(this.dropZones.panel, x, y) || pointInElement(this.dropZones.handle, x, y);
    }
    isPointerOverDropArea () {
        return this.isPointOverDropZones(this.lastPointer.x, this.lastPointer.y);
    }
    isBlockDragActive () {
        return this.state.blockDragActive || this.state.blockDragOutsideWorkspace;
    }
    isDragActive () {
        return this.isBlockDragActive() || isIncomingAssetDrag(this.props.dragInfo);
    }

    handleGlobalPointerMove (e) {
        if (!e) return;
        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
            this.lastPointer = {x: e.clientX, y: e.clientY};
        }
        ensurePatched();

        if (this.isBlockDragActive()) {
            const over = this.isPointerOverDropArea();
            if (over !== this.state.blockDragOverBackpack) {
                this.setState({blockDragOverBackpack: over});
            }
        }
    }
    handleDocumentPointerDown (e) {
        if (this.state.layout !== 'drawer' || !this.state.expanded || this.state.pinned) return;
        const target = e.target;
        if (!(target instanceof Node)) return;
        if (this.dropZones.panel && this.dropZones.panel.contains(target)) return;
        if (this.dropZones.handle && this.dropZones.handle.contains(target)) return;
        if (target.closest && target.closest('.react-contextmenu')) return;
        this.handleClose();
    }
    handlePanelKeyDown (e) {
        if (e.key === 'Escape' && this.state.expanded && !this.state.renamingId) {
            e.stopPropagation();
            this.handleClose();
        }
    }

    getBackpackAssetURL (asset) {
        return `${this.props.host}/${asset.assetId}.${asset.dataFormat}`;
    }
    emitResize () {
        window.dispatchEvent(new Event('resize'));
    }
    setExpanded (expanded) {
        if (expanded === this.state.expanded) return;
        this.setState({expanded, renamingId: null}, this.emitResize);
        if (expanded && !this.hasLoaded) {
            this.getContents();
        }
    }
    handleToggle () {
        this.setExpanded(!this.state.expanded);
    }
    handleOpen () {
        this.setExpanded(true);
    }
    handleClose () {
        this.setExpanded(false);
    }
    handlePinToggle () {
        const pinned = !this.state.pinned;
        setBackpackPinned(pinned);
        this.setState({pinned});
    }
    handleLayoutChange (layout) {
        if (layout === this.state.layout) return;
        setBackpackLayout(layout);
        this.setState({layout, expanded: layout === 'drawer' && this.state.pinned}, this.emitResize);
    }
    handleFilterChange (filter) {
        this.setState({filter});
    }
    showNotice (notice) {
        clearTimeout(this.noticeTimer);
        this.setState({notice});
        this.noticeTimer = setTimeout(() => {
            if (this.unmounted) return;
            this.setState({notice: null});
        }, NOTICE_DURATION);
    }
    handleError (error) {
        if (this.unmounted) return false;
        log.error(error);
        this.setState({
            error: `${error}`,
            loading: false,
            busyId: null
        });
        return false;
    }
    getScriptName (dragPayload, payload) {
        const {opcode, blockCount} = describeBlocks(dragPayload.blockObjects);
        const block = getWorkspaceBlockText(dragPayload.topBlockId) || humanizeOpcode(opcode);
        if (block) {
            return this.props.intl.formatMessage(messages.scriptAutoName, {block, count: blockCount});
        }
        if (blockCount > 0) {
            return this.props.intl.formatMessage(messages.scriptAutoNameNoBlock, {count: blockCount});
        }
        return payload.name;
    }
    handleDrop (dragInfo) {
        if (this.dropRequest) return this.dropRequest;
        let payloader = null;
        let presaveAsset = null;
        switch (dragInfo.dragType) {
        case DragConstants.COSTUME:
            payloader = costumePayload;
            presaveAsset = dragInfo.payload.asset;
            break;
        case DragConstants.SOUND:
            payloader = soundPayload;
            presaveAsset = dragInfo.payload.asset;
            break;
        case DragConstants.SPRITE:
            payloader = spritePayload;
            break;
        case DragConstants.CODE:
            payloader = codePayload;
            break;
        }
        if (!payloader) return Promise.resolve(false);

        this.setState({loading: true, error: false});
        this.dropRequest = payloader(dragInfo.payload, this.props.vm)
            .then(payload => {
                if (dragInfo.dragType === DragConstants.CODE) {
                    payload.name = this.getScriptName(dragInfo.payload, payload);
                }
                if (presaveAsset && !presaveAsset.clean && this.props.host !== LOCAL_API) {
                    return storage.store(
                        presaveAsset.assetType,
                        presaveAsset.dataFormat,
                        presaveAsset.data,
                        presaveAsset.assetId
                    ).then(() => payload);
                }
                return payload;
            })
            .then(payload => saveBackpackObject({
                host: this.props.host,
                token: this.props.token,
                username: this.props.username,
                ...payload
            }))
            .then(item => {
                if (this.unmounted) return false;
                this.setState(oldState => ({
                    loading: false,
                    contents: [item].concat(oldState.contents.filter(existing => existing.id !== item.id))
                }));
                this.showNotice(this.props.intl.formatMessage(messages.saved));
                return true;
            })
            .catch(error => this.handleError(error))
            .then(result => {
                this.dropRequest = null;
                return result;
            });
        return this.dropRequest;
    }
    handleDelete (id) {
        if (this.deletingItems.has(id)) return Promise.resolve(false);
        this.deletingItems.add(id);
        this.setState({loading: true, error: false});
        return deleteBackpackObject({
            host: this.props.host,
            token: this.props.token,
            username: this.props.username,
            id: id
        })
            .then(() => {
                if (this.unmounted) return false;
                this.setState(oldState => ({
                    loading: false,
                    contents: oldState.contents.filter(o => o.id !== id),
                    renamingId: oldState.renamingId === id ? null : oldState.renamingId
                }));
                return true;
            })
            .catch(error => this.handleError(error))
            .then(result => {
                this.deletingItems.delete(id);
                return result;
            });
    }
    findItemById (id) {
        return this.state.contents.find(i => i.id === id);
    }
    getViewport () {
        if (!lazyScratchBlocks.isLoaded()) return null;
        try {
            const workspace = lazyScratchBlocks.get().getMainWorkspace();
            const metrics = workspace && workspace.getMetrics();
            if (!metrics) return null;
            let width = metrics.viewWidth;
            if (this.state.layout === 'drawer' && this.state.expanded && this.dropZones.panel) {
                width -= this.dropZones.panel.getBoundingClientRect().width;
            }
            return {width, height: metrics.viewHeight};
        } catch (e) {
            return null;
        }
    }
    async handleInsert (id) {
        if (this.insertingItems.has(id)) return false;
        const item = this.findItemById(id);
        const vm = this.props.vm;
        const target = vm.editingTarget;
        if (!item || !target) return false;

        this.insertingItems.add(id);
        this.setState({busyId: id, error: false});
        try {
            const targetId = target.id;
            const spriteName = target.sprite ? target.sprite.name : '';
            let notice = null;
            if (item.type === 'script') {
                const payload = await fetchCode(item.bodyUrl);
                const metrics = this.props.workspaceMetrics.targets[targetId];
                placeInViewport(payload, metrics, this.props.isRtl, this.getViewport());
                await vm.shareBlocksToTarget(payload, targetId);
                vm.refreshWorkspace();
                notice = this.props.intl.formatMessage(messages.insertedScript, {sprite: spriteName});
            } else if (item.type === 'costume') {
                await vm.addCostume(item.body, {name: item.name}, targetId);
                notice = this.props.intl.formatMessage(messages.insertedCostume, {sprite: spriteName});
            } else if (item.type === 'sound') {
                await vm.addSound({md5: item.body, name: item.name}, targetId);
                notice = this.props.intl.formatMessage(messages.insertedSound, {sprite: spriteName});
            } else if (item.type === 'sprite') {
                const sprite3Zip = await fetchSprite(item.bodyUrl);
                await vm.addSprite(sprite3Zip);
                const added = vm.editingTarget;
                if (added && added.sprite && item.name && added.sprite.name !== item.name) {
                    vm.renameSprite(added.id, item.name);
                }
                notice = this.props.intl.formatMessage(messages.insertedSprite);
            }
            if (this.unmounted) return false;
            this.setState({busyId: null});
            if (notice) this.showNotice(notice);
            return true;
        } catch (error) {
            return this.handleError(error);
        } finally {
            this.insertingItems.delete(id);
        }
    }
    handleRenameStart (id) {
        if (!this.canRename() || !this.findItemById(id)) return false;
        this.setState({renamingId: id});
        return true;
    }
    handleRenameCancel () {
        this.setState({renamingId: null});
    }
    async handleRenameSubmit (id, value) {
        if (this.state.renamingId === id) {
            this.setState({renamingId: null});
        }
        if (this.renamingItems.has(id)) return false;
        const item = this.findItemById(id);
        if (!item) return false;
        const newName = `${value === null || typeof value === 'undefined' ? '' : value}`.trim();
        if (!newName || newName === item.name) return false;

        this.renamingItems.add(id);
        try {
            this.setState({loading: true, error: false});
            const newItem = await updateBackpackObject({
                host: this.props.host,
                ...item,
                name: newName
            });
            if (this.unmounted) return false;
            this.setState(oldState => ({
                loading: false,
                contents: oldState.contents.map(i => (i.id === id ? newItem : i))
            }));
            return true;
        } catch (error) {
            return this.handleError(error);
        } finally {
            this.renamingItems.delete(id);
        }
    }
    canRename () {
        return this.props.host === LOCAL_API;
    }
    getContents (loadAll = false) {
        if ((!this.props.token || !this.props.username) && this.props.host !== LOCAL_API) return;

        this.loadAllContents = this.loadAllContents || loadAll;
        if (this.contentsRequest) return;

        this.hasLoaded = true;
        this.setState({loading: true, error: false});
        const loaded = this.state.contents.slice();
        const loadPage = () => getBackpackContents({
            host: this.props.host,
            token: this.props.token,
            username: this.props.username,
            offset: loaded.length,
            limit: this.state.itemsPerPage
        }).then(contents => {
            loaded.push(...contents);
            if (this.loadAllContents && contents.length === this.state.itemsPerPage) {
                return loadPage();
            }
            return contents.length === this.state.itemsPerPage;
        });

        this.contentsRequest = loadPage()
            .then(moreToLoad => {
                if (this.unmounted) return false;
                this.setState(oldState => {
                    const loadedIds = new Set(loaded.map(item => item.id));
                    const newerItems = oldState.contents.filter(item => !loadedIds.has(item.id));
                    return {
                        contents: newerItems.concat(loaded),
                        moreToLoad,
                        loading: false
                    };
                });
                return true;
            })
            .catch(error => {
                this.contentsRequest = null;
                this.loadAllContents = false;
                return this.handleError(error);
            })
            .then(() => {
                this.contentsRequest = null;
                this.loadAllContents = false;
            });
    }
    handleBlockDragHook (type) {
        if (this.unmounted) return;
        if (type === 'start') {
            clearTimeout(this.pendingBlockDropTimer);
            this.pendingBlockDrop = false;
            this.setState({blockDragActive: true});
            return;
        }
        this.pendingBlockDrop = this.state.blockDragOverBackpack || this.isPointerOverDropArea();
        clearTimeout(this.pendingBlockDropTimer);
        this.pendingBlockDropTimer = setTimeout(() => {
            this.pendingBlockDrop = false;
        }, 500);
        this.setState({blockDragActive: false});
    }
    handleBlockDragUpdate (isOutsideWorkspace) {
        this.setState({
            blockDragOutsideWorkspace: isOutsideWorkspace,
            blockDragOverBackpack: (isOutsideWorkspace || this.state.blockDragActive) ?
                this.isPointerOverDropArea() : false
        });
    }
    handleBlockDragEnd (blocks, topBlockId) {
        const shouldDrop = this.pendingBlockDrop || this.state.blockDragOverBackpack || this.isPointerOverDropArea();
        this.pendingBlockDrop = false;
        clearTimeout(this.pendingBlockDropTimer);
        if (shouldDrop) {
            this.handleDrop({
                dragType: DragConstants.CODE,
                payload: {
                    blockObjects: this.props.vm.exportStandaloneBlocks(blocks),
                    topBlockId: topBlockId
                }
            });
        }
        this.setState({
            blockDragOverBackpack: false,
            blockDragOutsideWorkspace: false,
            blockDragActive: false
        });
    }

    handleResizePointerDown (e) {
        if (!e) return;
        if (!this.state.expanded) return;
        if (typeof e.preventDefault === 'function') e.preventDefault();

        this.resizeSession = {
            startY: e.clientY,
            startHeight: this.state.height
        };

        window.addEventListener('pointermove', this.handleResizePointerMove);
        window.addEventListener('pointerup', this.handleResizePointerUp);
        window.addEventListener('pointercancel', this.handleResizePointerUp);
    }

    handleResizePointerMove (e) {
        if (!this.resizeSession) return;
        const maxHeight = Math.max(STRIP_MIN_HEIGHT, Math.floor(window.innerHeight * 0.75));
        const delta = this.resizeSession.startY - e.clientY;
        const next = Math.max(
            STRIP_MIN_HEIGHT,
            Math.min(maxHeight, Math.round(this.resizeSession.startHeight + delta))
        );
        if (next !== this.state.height) {
            this.setState({height: next}, this.emitResize);
        }
    }

    handleResizePointerUp () {
        this.resizeSession = null;
        window.removeEventListener('pointermove', this.handleResizePointerMove);
        window.removeEventListener('pointerup', this.handleResizePointerUp);
        window.removeEventListener('pointercancel', this.handleResizePointerUp);
        setBackpackHeight(this.state.height);
    }
    handleMore () {
        this.getContents();
    }
    handleSearchChange (event) {
        const value = event.target.value;
        this.setState({searchQuery: value});
        if (value.trim() && (this.state.moreToLoad || this.contentsRequest)) this.getContents(true);
    }
    getFilteredContents () {
        const byType = this.state.filter === 'all' ?
            this.state.contents :
            this.state.contents.filter(item => item.type === this.state.filter);
        return filterBackpackContents(byType, this.state.searchQuery);
    }
    render () {
        const dragOver = this.state.assetDragOver || this.state.blockDragOverBackpack;
        return (
            <BackpackComponent
                busyId={this.state.busyId}
                canRename={this.canRename()}
                canToggle={Boolean(this.props.host)}
                contents={this.getFilteredContents()}
                dragActive={this.isDragActive()}
                dragOver={dragOver}
                error={this.state.error}
                expanded={this.state.expanded}
                filter={this.state.filter}
                handleRef={this.setHandleRef}
                height={this.state.height}
                layout={this.state.layout}
                loading={this.state.loading && this.state.contents.length === 0}
                notice={this.state.notice}
                panelRef={this.setPanelRef}
                pinned={this.state.pinned}
                renamingId={this.state.renamingId}
                searchQuery={this.state.searchQuery}
                showMore={!this.state.searchQuery && this.state.moreToLoad}
                totalCount={this.state.contents.length}
                onClose={this.handleClose}
                onDelete={this.handleDelete}
                onFilterChange={this.handleFilterChange}
                onInsert={this.handleInsert}
                onLayoutChange={this.handleLayoutChange}
                onMore={this.handleMore}
                onOpen={this.handleOpen}
                onPanelKeyDown={this.handlePanelKeyDown}
                onPinToggle={this.handlePinToggle}
                onRenameCancel={this.handleRenameCancel}
                onRenameStart={this.handleRenameStart}
                onRenameSubmit={this.handleRenameSubmit}
                onResizePointerDown={this.handleResizePointerDown}
                onSearchChange={this.handleSearchChange}
                onToggle={this.handleToggle}
            />
        );
    }
}

Backpack.propTypes = {
    dragInfo: PropTypes.shape({
        currentOffset: PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number
        }),
        dragType: PropTypes.string,
        dragging: PropTypes.bool,
        payload: PropTypes.object
    }),
    host: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    token: PropTypes.string,
    username: PropTypes.string,
    vm: PropTypes.instanceOf(VM),
    workspaceMetrics: PropTypes.shape({
        targets: PropTypes.objectOf(PropTypes.object)
    })
};

Backpack.defaultProps = {
    dragInfo: {dragging: false, currentOffset: null},
    isRtl: false,
    workspaceMetrics: {targets: {}}
};

const getTokenAndUsername = state => {
    if (state.session && state.session.session && state.session.session.user) {
        return {
            token: state.session.session.user.token,
            username: state.session.session.user.username
        };
    }
    const tokenMatches = window.location.href.match(/[?&]token=([^&]*)&?/);
    const usernameMatches = window.location.href.match(/[?&]username=([^&]*)&?/);
    return {
        token: tokenMatches ? tokenMatches[1] : null,
        username: usernameMatches ? usernameMatches[1] : null
    };
};

const mapStateToProps = state => Object.assign(
    {
        dragInfo: state.scratchGui.assetDrag,
        isRtl: state.locales.isRtl,
        vm: state.scratchGui.vm,
        workspaceMetrics: state.scratchGui.workspaceMetrics
    },
    getTokenAndUsername(state)
);

export {Backpack, filterBackpackContents};
export default injectIntl(connect(mapStateToProps)(Backpack));

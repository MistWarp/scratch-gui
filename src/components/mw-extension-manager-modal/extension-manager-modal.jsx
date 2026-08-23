import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {ChevronDown, ChevronUp, GripVertical} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';

import extensionLibrary from '../../lib/libraries/extensions/index.jsx';
import centralDispatch from 'scratch-vm/src/dispatch/central-dispatch';

import styles from './extension-manager-modal.css';

/* eslint-disable react/jsx-no-bind */

const messages = defineMessages({
    title: {
        defaultMessage: 'Extension Manager',
        description: 'Title of modal that appears when opening the Extension Manager',
        id: 'tw.extensionManager.title'
    },
    delete: {
        defaultMessage: 'Delete',
        description: 'Button to delete selected extensions',
        id: 'tw.extensionManager.delete'
    },
    noneLoaded: {
        defaultMessage: 'No extensions loaded',
        description: 'Label shown when no extensions are loaded',
        id: 'tw.extensionManager.noneLoaded'
    },
    oneLoaded: {
        defaultMessage: '1 loaded extension',
        description: 'Label shown when one extension is loaded',
        id: 'tw.extensionManager.oneLoaded'
    },
    manyLoaded: {
        defaultMessage: '{count} loaded extensions',
        description: 'Label shown when multiple extensions are loaded',
        id: 'tw.extensionManager.manyLoaded'
    },
    reorderHint: {
        defaultMessage: 'Drag extensions or use the arrow buttons to change their order in the block palette.',
        description: 'Help text for reordering extension categories',
        id: 'tw.extensionManager.reorderHint'
    },
    moveUp: {
        defaultMessage: 'Move up',
        description: 'Button to move an extension category up',
        id: 'tw.extensionManager.moveUp'
    },
    moveDown: {
        defaultMessage: 'Move down',
        description: 'Button to move an extension category down',
        id: 'tw.extensionManager.moveDown'
    },
    reorderError: {
        defaultMessage: 'The extension order could not be changed. Please try again.',
        description: 'Message shown when reordering extension categories fails',
        id: 'tw.extensionManager.reorderError'
    }
});

export const reorderItems = (items, fromIndex, toIndex) => {
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return items;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
};

export const ExtensionManagerModal = props => {
    const [selected, setSelected] = useState([]);
    const [dragIndex, setDragIndex] = useState(null);
    const [reordering, setReordering] = useState(false);
    const [reorderError, setReorderError] = useState(false);
    const reorderInProgress = useRef(false);

    const [blockIconURIs, setBlockIconURIs] = useState({});

    const extensionLibraryById = useMemo(() => new Map(extensionLibrary.map(i => [i.extensionId, i])), []);

    const getExtensionIconURL = useCallback(extensionId => {
        const libraryItem = extensionLibraryById.get(extensionId);
        if (libraryItem) return libraryItem.insetIconURL || libraryItem.iconURL;
        return blockIconURIs[extensionId] || null;
    }, [extensionLibraryById, blockIconURIs]);

    const getExtensionName = useCallback(extensionId => {
        const libraryItem = extensionLibraryById.get(extensionId);
        if (libraryItem) return libraryItem.name;
        return extensionId;
    }, [extensionLibraryById, props.vm]);

    const readExtensionIds = useCallback(() => {
        const map = props.vm?.extensionManager?._loadedExtensions;
        if (!map) return [];
        const ids = Array.from(map.keys());
        return ids;
    }, [props.vm]);

    const initialExtensions = useMemo(() => {
        if (!props.vm || !props.vm.extensionManager) return [];
        return Array.from(props.vm.extensionManager._loadedExtensions.keys());
    }, [props.vm]);

    const [extensionIds, setExtensionIds] = useState(initialExtensions);

    useEffect(() => {
        const map = props.vm?.extensionManager?._loadedExtensions;
        if (!map) return;

        let cancelled = false;
        const idsToFetch = extensionIds.filter(id => (
            !extensionLibraryById.has(id) &&
            !blockIconURIs[id] &&
            map.has(id)
        ));
        if (idsToFetch.length === 0) return;

        idsToFetch.forEach(id => {
            const serviceName = map.get(id);
            centralDispatch.call(serviceName, 'getInfo')
                .then(info => {
                    const uri = info && info.blockIconURI;
                    if (!uri || cancelled) return;
                    setBlockIconURIs(prev => (prev[id] ? prev : {...prev, [id]: uri}));
                })
                .catch(() => {
                    // ignore
                });
        });

        return () => {
            cancelled = true;
        };
    }, [props.vm, extensionIds, extensionLibraryById, blockIconURIs]);

    const updateExtensionIds = useCallback(() => {
        setExtensionIds(readExtensionIds());
    }, [readExtensionIds]);

    useEffect(() => {
        updateExtensionIds();

        const vm = props.vm;
        if (!vm) return;

        const onAdded = extensionObject => {
            const id = extensionObject && extensionObject.id;
            if (!id) return;

            setExtensionIds(old => (old.includes(id) ? old : [...old, id]));
        };
        const onRemoved = extensionObject => {
            const id = extensionObject && extensionObject.id;
            if (!id) return;

            setExtensionIds(old => old.filter(i => i !== id));
            setSelected(old => old.filter(i => i !== id));
        };
        const onReordered = info => {
            if (info && Array.isArray(info.ids)) {
                setExtensionIds(info.ids);
                return;
            }
            updateExtensionIds();
        };

        vm.on('EXTENSION_ADDED', onAdded);
        vm.on('EXTENSION_REMOVED', onRemoved);
        vm.on('EXTENSIONS_REORDERED', onReordered);
        if (vm.runtime) {
            vm.runtime.on('PROJECT_LOADED', updateExtensionIds);
        }

        return () => {
            vm.off('EXTENSION_ADDED', onAdded);
            vm.off('EXTENSION_REMOVED', onRemoved);
            vm.off('EXTENSIONS_REORDERED', onReordered);
            if (vm.runtime) {
                vm.runtime.off('PROJECT_LOADED', updateExtensionIds);
            }
        };
    }, [props.vm, updateExtensionIds]);

    useEffect(() => {
        const loaded = new Set(extensionIds);
        setSelected(prev => prev.filter(id => loaded.has(id)));
    }, [extensionIds]);

    const loadedAmountText = (() => {
        if (extensionIds.length === 0) {
            return props.intl.formatMessage(messages.noneLoaded);
        }
        if (extensionIds.length === 1) {
            return props.intl.formatMessage(messages.oneLoaded);
        }
        return props.intl.formatMessage(messages.manyLoaded, {count: extensionIds.length});
    })();

    const updateSelection = e => {
        const {value, checked} = e.target;
        setSelected(old => {
            if (checked) return [...old, value];
            return old.filter(i => i !== value);
        });
    };

    const stopDragAndClickBubbling = e => {
        e.stopPropagation();
    };

    const reorderExtension = async (fromIndex, toIndex) => {
        if (reorderInProgress.current || fromIndex === toIndex) return;
        const manager = props.vm && props.vm.extensionManager;
        if (!manager || typeof manager.reorderExtension !== 'function') return;
        if (fromIndex < 0 || fromIndex >= extensionIds.length || toIndex < 0 || toIndex >= extensionIds.length) return;

        reorderInProgress.current = true;
        setReordering(true);
        setReorderError(false);
        setExtensionIds(old => reorderItems(old, fromIndex, toIndex));
        try {
            await manager.reorderExtension(fromIndex, toIndex);
            updateExtensionIds();
        } catch (error) {
            updateExtensionIds();
            setReorderError(true);
        } finally {
            // This ref is the single-flight lock for the operation above.
            // eslint-disable-next-line require-atomic-updates
            reorderInProgress.current = false;
            setReordering(false);
        }
    };

    const handleMoveClick = e => {
        e.stopPropagation();
        const fromIndex = Number(e.currentTarget.dataset.index);
        const offset = Number(e.currentTarget.dataset.offset);
        reorderExtension(fromIndex, fromIndex + offset);
    };

    const removeSelected = () => {
        if (!props.vm || !props.vm.extensionManager) return;
        if (typeof props.vm.extensionManager.removeExtension !== 'function') return;

        const selectedSet = new Set(selected);
        const successfullyRemoved = new Set();
        for (const extensionId of selectedSet) {
            const removed = props.vm.extensionManager.removeExtension(extensionId);
            if (removed) {
                successfullyRemoved.add(extensionId);
            }
        }

        if (successfullyRemoved.size > 0) {
            setExtensionIds(old => old.filter(i => !successfullyRemoved.has(i)));
        }

        setSelected([]);

        updateExtensionIds();
    };

    const handleDragStart = e => {
        const index = Number(e.currentTarget.dataset.index);
        setDragIndex(index);

        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            try {
                e.dataTransfer.setData('text/plain', String(index));
            } catch (err) {
                // ignore
            }
        }
    };

    const handleDrop = e => {
        const index = Number(e.currentTarget.dataset.index);
        let fromIndex = dragIndex;
        if (e.dataTransfer) {
            const raw = e.dataTransfer.getData('text/plain');
            const parsed = raw === '' ? NaN : Number(raw);
            if (!Number.isNaN(parsed)) {
                fromIndex = parsed;
            }
        }

        if (fromIndex === null || fromIndex === index) return;
        setDragIndex(null);
        reorderExtension(fromIndex, index);
    };

    const handleDragOver = e => {
        e.preventDefault();
    };

    const handleDragEnd = () => {
        setDragIndex(null);
    };

    return (
        <Modal
            className={styles.modalContent}
            onRequestClose={props.onClose}
            contentLabel={props.intl.formatMessage(messages.title)}
            id="extensionManagerModal"
        >
            <Box className={styles.body}>
                <p className={styles.loadedAmount}>{loadedAmountText}</p>
                {extensionIds.length > 1 ? (
                    <p className={styles.reorderHint}>{props.intl.formatMessage(messages.reorderHint)}</p>
                ) : null}
                {reorderError ? (
                    <p className={styles.reorderError}>{props.intl.formatMessage(messages.reorderError)}</p>
                ) : null}

                {extensionIds.map((extensionId, index) => (
                    <div
                        className={styles.extensionCard}
                        key={extensionId}
                        draggable={props.draggable && !reordering}
                        data-index={index}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className={styles.extensionInfo}>
                            <GripVertical
                                className={styles.dragHandle}
                                size={18}
                            />
                            {getExtensionIconURL(extensionId) ? (
                                <img
                                    className={styles.extensionIcon}
                                    src={getExtensionIconURL(extensionId)}
                                    alt=""
                                    aria-hidden="true"
                                    draggable={false}
                                />
                            ) : null}
                            <p className={styles.extensionName}>{getExtensionName(extensionId)}</p>
                        </div>

                        <div
                            className={styles.extensionActions}
                            onClick={stopDragAndClickBubbling}
                            onMouseDown={stopDragAndClickBubbling}
                            onDragStart={stopDragAndClickBubbling}
                        >
                            <button
                                aria-label={props.intl.formatMessage(messages.moveUp)}
                                className={styles.reorderButton}
                                data-index={index}
                                data-offset={-1}
                                disabled={index === 0 || reordering}
                                title={props.intl.formatMessage(messages.moveUp)}
                                type="button"
                                onClick={handleMoveClick}
                            >
                                <ChevronUp size={17} />
                            </button>
                            <button
                                aria-label={props.intl.formatMessage(messages.moveDown)}
                                className={styles.reorderButton}
                                data-index={index}
                                data-offset={1}
                                disabled={index === extensionIds.length - 1 || reordering}
                                title={props.intl.formatMessage(messages.moveDown)}
                                type="button"
                                onClick={handleMoveClick}
                            >
                                <ChevronDown size={17} />
                            </button>
                            <FancyCheckbox
                                className={styles.checkboxOption}
                                checked={selected.includes(extensionId)}
                                onChange={updateSelection}
                                value={extensionId}
                                draggable={false}
                            />
                        </div>
                    </div>
                ))}

                {extensionIds.length > 0 ? (
                    <Box className={styles.multiSelectRow}>
                        <button
                            type="button"
                            className={styles.multiSelectDelete}
                            onClick={removeSelected}
                            disabled={selected.length === 0}
                        >
                            {props.intl.formatMessage(messages.delete)}
                        </button>
                    </Box>
                ) : null}
            </Box>
        </Modal>
    );
};

ExtensionManagerModal.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.shape({
        on: PropTypes.func,
        off: PropTypes.func,
        runtime: PropTypes.shape({
            on: PropTypes.func,
            off: PropTypes.func
        }),
        extensionManager: PropTypes.shape({
            _loadedExtensions: PropTypes.instanceOf(Map),
            removeExtension: PropTypes.func,
            reorderExtension: PropTypes.func
        })
    }),
    draggable: PropTypes.bool
};

ExtensionManagerModal.defaultProps = {
    draggable: true
};

export default injectIntl(ExtensionManagerModal);

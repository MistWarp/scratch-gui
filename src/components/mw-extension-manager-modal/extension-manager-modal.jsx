import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

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
    }
});

const ExtensionManagerModal = props => {
    const [selected, setSelected] = useState([]);
    const [dragIndex, setDragIndex] = useState(null);

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
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) {
                fromIndex = parsed;
            }
        }

        if (fromIndex === null || fromIndex === index) return;

        setExtensionIds(old => {
            const next = [...old];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(index, 0, moved);
            return next;
        });
        setDragIndex(null);

        if (props.vm && props.vm.extensionManager && typeof props.vm.extensionManager.reorderExtension === 'function') {
            props.vm.extensionManager.reorderExtension(fromIndex, index);
            updateExtensionIds();
        }
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

                {extensionIds.map((extensionId, index) => (
                    <div
                        className={styles.extensionCard}
                        key={extensionId}
                        draggable={props.draggable}
                        data-index={index}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className={styles.extensionInfo}>
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

                        <FancyCheckbox
                            className={styles.checkboxOption}
                            checked={selected.includes(extensionId)}
                            onChange={updateSelection}
                            value={extensionId}
                            draggable={false}
                            onClick={stopDragAndClickBubbling}
                            onMouseDown={stopDragAndClickBubbling}
                            onDragStart={stopDragAndClickBubbling}
                        />
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

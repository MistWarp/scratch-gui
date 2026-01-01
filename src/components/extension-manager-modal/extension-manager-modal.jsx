import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';

import extensionLibrary from '../../lib/libraries/extensions/index.jsx';
import centralDispatch from 'scratch-vm/src/dispatch/central-dispatch';

import styles from './extension-manager-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Extension Manager',
        description: 'Title of modal that appears when opening the Extension Manager',
        id: 'tw.extensionManager.title'
    }
});

const ExtensionManagerModal = props => {
    const [loadedExtensions, setLoadedExtensions] = useState([]);
    const [multiSelect, setMultiSelect] = useState(false);
    const [selectedExtensions, setSelectedExtensions] = useState([]);
    const [draggingIndex, setDraggingIndex] = useState(null);

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

    const readLoadedExtensions = useCallback(() => {
        const map = props.vm?.extensionManager?._loadedExtensions;
        if (!map) return [];
        return Array.from(map.entries());
    }, [props.vm]);

    const updateLoadedExtensions = useCallback(() => {
        setLoadedExtensions(readLoadedExtensions());
    }, [readLoadedExtensions]);

    useEffect(() => {
        updateLoadedExtensions();

        const vm = props.vm;
        if (!vm) return;

        vm.on('EXTENSION_ADDED', updateLoadedExtensions);
        vm.on('BLOCKSINFO_UPDATE', updateLoadedExtensions);
        if (vm.runtime) {
            vm.runtime.on('PROJECT_LOADED', updateLoadedExtensions);
        }

        return () => {
            vm.off('EXTENSION_ADDED', updateLoadedExtensions);
            vm.off('BLOCKSINFO_UPDATE', updateLoadedExtensions);
            if (vm.runtime) {
                vm.runtime.off('PROJECT_LOADED', updateLoadedExtensions);
            }
        };
    }, [props.vm, updateLoadedExtensions]);

    useEffect(() => {
        const map = props.vm?.extensionManager?._loadedExtensions;
        if (!map) return;

        let cancelled = false;
        const idsToFetch = loadedExtensions
            .map(([id]) => id)
            .filter(id => !extensionLibraryById.has(id) && !blockIconURIs[id] && map.has(id));
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
    }, [props.vm, loadedExtensions, extensionLibraryById, blockIconURIs]);

    useEffect(() => {
        const loadedIds = new Set(loadedExtensions.map(([id]) => id));
        setSelectedExtensions(prev => prev.filter(id => loadedIds.has(id)));
    }, [loadedExtensions]);

    const loadedAmountText = useMemo(() => {
        if (loadedExtensions.length === 0) return 'No extensions loaded';
        if (loadedExtensions.length === 1) return '1 loaded extension';
        return `${loadedExtensions.length} loaded extensions`;
    }, [loadedExtensions]);

    const removeExtension = useCallback(async extensionId => {
        const em = props.vm?.extensionManager;
        if (!em || typeof em.removeExtension !== 'function') return;
        await em.removeExtension(extensionId);
        updateLoadedExtensions();
    }, [props.vm, updateLoadedExtensions]);

    const handleRemoveExtensionClick = useCallback(e => {
        const extensionId = e.currentTarget.dataset.extensionId;
        if (!extensionId) return;
        removeExtension(extensionId);
    }, [removeExtension]);

    const removeExtensions = useCallback(async extensionIds => {
        const em = props.vm?.extensionManager;
        if (!em || typeof em.removeExtension !== 'function') return;

        for (const id of extensionIds) {
            await em.removeExtension(id);
        }

        setMultiSelect(false);
        setSelectedExtensions([]);
        updateLoadedExtensions();
    }, [props.vm, updateLoadedExtensions]);

    const changeMultiSelectState = useCallback(() => {
        setMultiSelect(prev => {
            const next = !prev;
            if (!next) {
                setSelectedExtensions([]);
            }
            return next;
        });
    }, []);

    const updateExtensionList = useCallback(e => {
        const extensionId = e.target.value;
        const checked = e.target.checked;
        setSelectedExtensions(prev => {
            if (checked) {
                if (prev.includes(extensionId)) return prev;
                return [...prev, extensionId];
            }
            return prev.filter(id => id !== extensionId);
        });
    }, []);

    const handleDragStart = useCallback(index => {
        setDraggingIndex(index);
    }, []);

    const handleDragStartFromEvent = useCallback(e => {
        const {index} = e.currentTarget.dataset;
        if (typeof index === 'undefined') return;
        handleDragStart(Number(index));
    }, [handleDragStart]);

    const handleDragEnd = useCallback(() => {
        setDraggingIndex(null);
    }, []);

    const handleDragOver = useCallback(e => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(async index => {
        if (draggingIndex === null || draggingIndex === index) return;
        const em = props.vm?.extensionManager;
        if (!em || typeof em.reorderExtension !== 'function') return;

        await em.reorderExtension(draggingIndex, index);
        setDraggingIndex(null);
        updateLoadedExtensions();
    }, [draggingIndex, props.vm, updateLoadedExtensions]);

    const handleDropFromEvent = useCallback(e => {
        const {index} = e.currentTarget.dataset;
        if (typeof index === 'undefined') return;
        handleDrop(Number(index));
    }, [handleDrop]);

    const handleRemoveSelectedClick = useCallback(() => {
        removeExtensions(selectedExtensions);
    }, [removeExtensions, selectedExtensions]);

    return (
        <Modal
            className={styles.modalContent}
            onRequestClose={props.onClose}
            contentLabel={props.intl.formatMessage(messages.title)}
            id="extensionManagerModal"
        >
            <Box className={styles.body}>
                <p>{loadedAmountText}</p>
                {loadedExtensions.map((extension, index) => (
                    <div
                        className={styles.extensionCard}
                        key={index}
                        data-index={index}
                        draggable={!multiSelect}
                        onDragStart={handleDragStartFromEvent}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDropFromEvent}
                    >
                        <div className={styles.extensionInfo}>
                            {getExtensionIconURL(extension[0]) ? (
                                <img
                                    className={styles.extensionIcon}
                                    src={getExtensionIconURL(extension[0])}
                                    alt=""
                                    aria-hidden="true"
                                    draggable={false}
                                />
                            ) : null}
                            <p className={styles.extensionName}>{getExtensionName(extension[0])}</p>
                        </div>
                        {multiSelect ? (
                            <FancyCheckbox
                                className={styles.checkboxOption}
                                onChange={updateExtensionList}
                                value={extension[0]}
                                checked={selectedExtensions.includes(extension[0])}
                            />
                        ) : (
                            <button
                                className={styles.deleteOption}
                                aria-label={`Remove ${extension[0]}`}
                                data-extension-id={extension[0]}
                                onClick={handleRemoveExtensionClick}
                                type="button"
                            />
                        )}
                    </div>
                ))}

                {loadedExtensions.length !== 0 && !multiSelect && (
                    <Box className={styles.multiSelectRow}>
                        <button
                            className={styles.multiSelectNormal}
                            onClick={changeMultiSelectState}
                            type="button"
                        >
                            {'Select Multiple'}
                        </button>
                    </Box>
                )}

                {multiSelect && (
                    <Box className={styles.multiSelectRow}>
                        <button
                            className={styles.multiSelectNormal}
                            onClick={changeMultiSelectState}
                            type="button"
                        >
                            {'Cancel'}
                        </button>
                        <button
                            className={styles.multiSelectDelete}
                            onClick={handleRemoveSelectedClick}
                            disabled={selectedExtensions.length === 0}
                            type="button"
                        >
                            {'Delete'}
                        </button>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};

ExtensionManagerModal.propTypes = {
    intl: intlShape.isRequired,
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.shape({
        on: PropTypes.func,
        off: PropTypes.func,
        runtime: PropTypes.shape({
            on: PropTypes.func,
            off: PropTypes.func
        }),
        extensionManager: PropTypes.shape({
            _loadedExtensions: PropTypes.object,
            removeExtension: PropTypes.func,
            reorderExtension: PropTypes.func
        })
    })
};

export default injectIntl(ExtensionManagerModal);

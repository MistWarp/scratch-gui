import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Cloud,
    Database,
    Eye,
    EyeOff,
    List,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Variable,
    X
} from 'lucide-react';

import Modal from '../../containers/windowed-modal.jsx';
import SelectMenu from '../../community/components/ui/SelectMenu.jsx';
import {
    ModalSidebar,
    ModalSidebarContent,
    ModalSidebarFooter,
    ModalSidebarItem,
    ModalSidebarLayout
} from '../modal-sidebar/modal-sidebar.jsx';
import lazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks.js';
import {getSetting, onSettingChanged} from '../../lib/variable-manager/settings.js';
import {
    collectVariables,
    createVariable,
    deleteVariable,
    formatValuePreview,
    getOriginalTargets,
    monitorVisible,
    renameVariable,
    setMonitorVisible,
    setVariableValue
} from '../../lib/variable-manager/model.js';

import styles from './variable-manager.module.css';

/* eslint-disable react/jsx-no-bind */

const PAGE_SIZE = 50;

const messages = defineMessages({
    title: {
        id: 'mw.variableManager.title',
        defaultMessage: 'Variable Manager'
    },
    search: {
        id: 'mw.variableManager.search',
        defaultMessage: 'Search names and values'
    },
    selectedSprite: {
        id: 'mw.variableManager.selectedSprite',
        defaultMessage: 'Editing data for'
    },
    all: {
        id: 'mw.variableManager.filter.all',
        defaultMessage: 'All'
    },
    variables: {
        id: 'mw.variableManager.filter.variables',
        defaultMessage: 'Variables'
    },
    lists: {
        id: 'mw.variableManager.filter.lists',
        defaultMessage: 'Lists'
    },
    cloud: {
        id: 'mw.variableManager.filter.cloud',
        defaultMessage: 'Cloud'
    },
    global: {
        id: 'mw.variableManager.scope.global',
        defaultMessage: 'For all sprites'
    },
    local: {
        id: 'mw.variableManager.scope.local',
        defaultMessage: 'For this sprite'
    },
    addData: {
        id: 'mw.variableManager.addData',
        defaultMessage: 'New data'
    },
    empty: {
        id: 'mw.variableManager.empty',
        defaultMessage: 'No matching data'
    },
    emptyHelp: {
        id: 'mw.variableManager.emptyHelp',
        defaultMessage: 'Try another filter, or create a variable or list.'
    },
    select: {
        id: 'mw.variableManager.select',
        defaultMessage: 'Select something to inspect'
    },
    selectHelp: {
        id: 'mw.variableManager.selectHelp',
        defaultMessage: 'Choose a variable or list to edit its name, value, items, and stage monitor.'
    },
    name: {
        id: 'mw.variableManager.name',
        defaultMessage: 'Name'
    },
    value: {
        id: 'mw.variableManager.value',
        defaultMessage: 'Value'
    },
    uses: {
        id: 'mw.variableManager.uses',
        defaultMessage: '{count, plural, one {# block use} other {# block uses}}'
    },
    monitor: {
        id: 'mw.variableManager.monitor',
        defaultMessage: 'Show monitor on stage'
    },
    monitorUnavailable: {
        id: 'mw.variableManager.monitorUnavailable',
        defaultMessage: 'Open the Variables category once before changing this monitor.'
    },
    save: {
        id: 'mw.variableManager.save',
        defaultMessage: 'Save'
    },
    delete: {
        id: 'mw.variableManager.delete',
        defaultMessage: 'Delete'
    },
    addItem: {
        id: 'mw.variableManager.addItem',
        defaultMessage: 'Add item'
    },
    clearList: {
        id: 'mw.variableManager.clearList',
        defaultMessage: 'Clear list'
    },
    newTitle: {
        id: 'mw.variableManager.newTitle',
        defaultMessage: 'Create project data'
    },
    create: {
        id: 'mw.variableManager.create',
        defaultMessage: 'Create'
    },
    cancel: {
        id: 'mw.variableManager.cancel',
        defaultMessage: 'Cancel'
    },
    type: {
        id: 'mw.variableManager.type',
        defaultMessage: 'Type'
    },
    scope: {
        id: 'mw.variableManager.scope',
        defaultMessage: 'Available to'
    },
    cloudOption: {
        id: 'mw.variableManager.cloudOption',
        defaultMessage: 'Cloud variable'
    },
    variableType: {
        id: 'mw.variableManager.variableType',
        defaultMessage: 'Variable'
    },
    listType: {
        id: 'mw.variableManager.listType',
        defaultMessage: 'List'
    },
    refresh: {
        id: 'mw.variableManager.refresh',
        defaultMessage: 'Refresh data'
    },
    deleteConfirm: {
        id: 'mw.variableManager.deleteConfirm',
        defaultMessage: 'Delete "{name}"? Blocks using it may also be removed.'
    },
    clearConfirm: {
        id: 'mw.variableManager.clearConfirm',
        defaultMessage: 'Remove every item from "{name}"?'
    },
    itemNumber: {
        id: 'mw.variableManager.itemNumber',
        defaultMessage: 'Item {index}'
    },
    showingItems: {
        id: 'mw.variableManager.showingItems',
        defaultMessage: '{start}-{end} of {count}'
    }
});

const CreatePanel = ({canCreateCloud, hasLocalTarget, intl, onCancel, onCreate}) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('variable');
    const [scope, setScope] = useState(hasLocalTarget ? 'local' : 'global');
    const [cloud, setCloud] = useState(false);
    const [error, setError] = useState('');
    const nameRef = useRef(null);

    useEffect(() => {
        if (nameRef.current) nameRef.current.focus();
    }, []);

    const submit = event => {
        event.preventDefault();
        try {
            onCreate({name, type, scope, cloud});
        } catch (e) {
            setError(e.message);
        }
    };

    const updateType = next => {
        setType(next);
        if (next === 'list') setCloud(false);
    };

    const updateScope = next => {
        setScope(next);
        if (next === 'local') setCloud(false);
    };

    return (
        <form
            className={styles.createPanel}
            onSubmit={submit}
        >
            <div className={styles.createHeader}>
                <div>
                    <h1>{intl.formatMessage(messages.newTitle)}</h1>
                    <p>{'Variables store one value. Lists keep an ordered collection.'}</p>
                </div>
            </div>
            <label className={styles.field}>
                <span>{intl.formatMessage(messages.name)}</span>
                <input
                    ref={nameRef}
                    value={name}
                    onChange={event => setName(event.target.value)}
                />
            </label>
            <div className={styles.createGrid}>
                <div className={styles.field}>
                    <span>{intl.formatMessage(messages.type)}</span>
                    <SelectMenu
                        align="left"
                        ariaLabel={intl.formatMessage(messages.type)}
                        className={styles.mistwarpSelect}
                        compact
                        options={[
                            {value: 'variable', label: intl.formatMessage(messages.variableType)},
                            {value: 'list', label: intl.formatMessage(messages.listType)}
                        ]}
                        value={type}
                        onChange={updateType}
                        width="100%"
                    />
                </div>
                <div className={styles.field}>
                    <span>{intl.formatMessage(messages.scope)}</span>
                    <SelectMenu
                        align="left"
                        ariaLabel={intl.formatMessage(messages.scope)}
                        className={styles.mistwarpSelect}
                        compact
                        options={[
                            ...(hasLocalTarget ? [{
                                value: 'local',
                                label: intl.formatMessage(messages.local)
                            }] : []),
                            {value: 'global', label: intl.formatMessage(messages.global)}
                        ]}
                        value={scope}
                        onChange={updateScope}
                        width="100%"
                    />
                </div>
            </div>
            <label className={styles.checkRow}>
                <input
                    checked={cloud}
                    disabled={!canCreateCloud || scope !== 'global' || type !== 'variable'}
                    type="checkbox"
                    onChange={event => setCloud(event.target.checked)}
                />
                <Cloud size={16} />
                <span>{intl.formatMessage(messages.cloudOption)}</span>
            </label>
            {error && <div
                className={styles.error}
                role="alert"
            >{error}</div>}
            <div className={styles.createActions}>
                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onCancel}
                >
                    {intl.formatMessage(messages.cancel)}
                </button>
                <button
                    type="submit"
                    className={styles.primaryButton}
                >
                    <Plus size={16} />
                    {intl.formatMessage(messages.create)}
                </button>
            </div>
        </form>
    );
};

CreatePanel.propTypes = {
    canCreateCloud: PropTypes.bool,
    hasLocalTarget: PropTypes.bool,
    intl: PropTypes.shape({formatMessage: PropTypes.func.isRequired}),
    onCancel: PropTypes.func,
    onCreate: PropTypes.func
};

const ListEditor = ({intl, maxLength, onChange, record}) => {
    const [items, setItems] = useState(() => (Array.isArray(record.value) ? record.value.map(String) : []));
    const [page, setPage] = useState(0);
    const [error, setError] = useState('');
    const editing = useRef(false);

    useEffect(() => {
        if (editing.current) return;
        setItems(Array.isArray(record.value) ? record.value.map(String) : []);
        setPage(0);
        setError('');
    }, [record.id, record.value]);

    const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount - 1);
    const start = safePage * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    const commit = next => {
        const totalLength = next.reduce((sum, item) => sum + String(item).length, 0);
        if (totalLength > maxLength) {
            setError(`This list is larger than the ${maxLength.toLocaleString()} character editing limit.`);
            return false;
        }
        setItems(next);
        setError('');
        onChange(next);
        return true;
    };

    const updateItem = event => {
        const index = Number(event.currentTarget.dataset.index);
        const next = items.slice();
        next[index] = event.currentTarget.value;
        commit(next);
    };

    const finishItem = () => {
        editing.current = false;
    };

    const handleItemKeyDown = event => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
            setItems(Array.isArray(record.value) ? record.value.map(String) : []);
            event.currentTarget.blur();
        }
    };

    const removeItem = event => {
        const index = Number(event.currentTarget.dataset.index);
        const next = items.filter((_, itemIndex) => itemIndex !== index);
        commit(next);
        if (start >= next.length && safePage > 0) setPage(safePage - 1);
    };

    const addItem = () => {
        const next = [...items, ''];
        if (commit(next)) setPage(Math.floor((next.length - 1) / PAGE_SIZE));
    };

    const clear = () => {
        // eslint-disable-next-line no-alert
        if (window.confirm(intl.formatMessage(messages.clearConfirm, {name: record.name}))) {
            commit([]);
            setPage(0);
        }
    };

    return (
        <div className={styles.listEditor}>
            <div className={styles.listToolbar}>
                <span>
                    {items.length ? intl.formatMessage(messages.showingItems, {
                        start: start + 1,
                        end: Math.min(start + PAGE_SIZE, items.length),
                        count: items.length
                    }) : 'Empty list'}
                </span>
                <div>
                    <button
                        type="button"
                        className={styles.smallButton}
                        onClick={addItem}
                    >
                        <Plus size={14} />
                        {intl.formatMessage(messages.addItem)}
                    </button>
                    <button
                        type="button"
                        className={styles.smallDangerButton}
                        disabled={!items.length}
                        onClick={clear}
                    >
                        {intl.formatMessage(messages.clearList)}
                    </button>
                </div>
            </div>
            {error && <div
                className={styles.error}
                role="alert"
            >{error}</div>}
            <div className={styles.listItems}>
                {pageItems.map((item, offset) => {
                    const index = start + offset;
                    return (
                        <div
                            className={styles.listItem}
                            key={index}
                        >
                            <span>{index + 1}</span>
                            <input
                                aria-label={intl.formatMessage(messages.itemNumber, {index: index + 1})}
                                data-index={index}
                                value={item}
                                onBlur={finishItem}
                                onChange={updateItem}
                                onFocus={() => {
                                    editing.current = true;
                                }}
                                onKeyDown={handleItemKeyDown}
                            />
                            <button
                                type="button"
                                aria-label={`Delete item ${index + 1}`}
                                className={styles.iconButton}
                                data-index={index}
                                onClick={removeItem}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    );
                })}
                {!items.length && (
                    <button
                        type="button"
                        className={styles.emptyListButton}
                        onClick={addItem}
                    >
                        <Plus size={18} />
                        {'Add the first item'}
                    </button>
                )}
            </div>
            {pageCount > 1 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        aria-label="Previous list page"
                        disabled={safePage === 0}
                        onClick={() => setPage(safePage - 1)}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span>{safePage + 1} {' / '} {pageCount}</span>
                    <button
                        type="button"
                        aria-label="Next list page"
                        disabled={safePage >= pageCount - 1}
                        onClick={() => setPage(safePage + 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

ListEditor.propTypes = {
    intl: PropTypes.shape({formatMessage: PropTypes.func.isRequired}),
    maxLength: PropTypes.number,
    onChange: PropTypes.func,
    record: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        value: PropTypes.array
    })
};

const DetailPanel = ({intl, onDelete, onMonitorChange, onRename, onValueChange, record}) => {
    const [name, setName] = useState(record.name);
    const [value, setValue] = useState(String(record.value));
    const [error, setError] = useState('');
    const editingValue = useRef(false);

    useEffect(() => {
        setName(record.name);
        if (!editingValue.current) setValue(record.type === 'list' ? '' : String(record.value));
        setError('');
    }, [record.id, record.name, record.value, record.type]);

    const saveName = () => {
        try {
            const saved = onRename(record, name);
            setName(saved);
            setError('');
        } catch (e) {
            setError(e.message);
        }
    };

    const saveValue = () => {
        editingValue.current = false;
        try {
            onValueChange(record, value);
            setError('');
        } catch (e) {
            setError(e.message);
        }
    };

    const handleNameKey = event => {
        if (event.key === 'Enter') saveName();
        if (event.key === 'Escape') setName(record.name);
    };

    const handleValueKey = event => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') saveValue();
    };

    const requestDelete = () => {
        // Blockly provides its own usage-aware confirmation when more than one
        // block references the variable. Avoid making the user confirm twice.
        if (record.usageCount > 1) {
            onDelete(record);
            return;
        }
        // eslint-disable-next-line no-alert
        if (window.confirm(intl.formatMessage(messages.deleteConfirm, {name: record.name}))) {
            onDelete(record);
        }
    };

    const TypeIcon = record.isCloud ? Cloud : record.type === 'list' ? List : Variable;
    const monitorAvailable = !!record.monitorAvailable;

    return (
        <section
            className={styles.detail}
            aria-label={`${record.name} details`}
        >
            <div className={styles.detailHeading}>
                <div
                    className={styles.detailIcon}
                    data-kind={record.isCloud ? 'cloud' : record.type}
                >
                    <TypeIcon size={22} />
                </div>
                <div>
                    <h2>{record.name}</h2>
                    <p>
                        {record.scope === 'global' ? intl.formatMessage(messages.global) : record.targetName}
                        {' · '}
                        {intl.formatMessage(messages.uses, {count: record.usageCount})}
                    </p>
                </div>
            </div>

            <label className={styles.field}>
                <span>{intl.formatMessage(messages.name)}</span>
                <div className={styles.inputAction}>
                    <input
                        value={name}
                        onBlur={saveName}
                        onChange={event => setName(event.target.value)}
                        onKeyDown={handleNameKey}
                    />
                    <button
                        type="button"
                        aria-label="Save name"
                        onClick={saveName}
                    >
                        <Check size={16} />
                    </button>
                </div>
            </label>

            {error && <div
                className={styles.error}
                role="alert"
            >{error}</div>}

            {record.type === 'list' ? (
                <ListEditor
                    intl={intl}
                    maxLength={getSetting('list_max_length')}
                    record={record}
                    onChange={items => onValueChange(record, items)}
                />
            ) : (
                <label className={styles.field}>
                    <span>{intl.formatMessage(messages.value)}</span>
                    <textarea
                        className={styles.valueEditor}
                        value={value}
                        onBlur={saveValue}
                        onChange={event => setValue(event.target.value)}
                        onFocus={() => {
                            editingValue.current = true;
                        }}
                        onKeyDown={handleValueKey}
                    />
                    <span className={styles.fieldHelp}>{'Press Ctrl+Enter to save.'}</span>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={saveValue}
                    >
                        {intl.formatMessage(messages.save)}
                    </button>
                </label>
            )}

            <div className={styles.detailFooter}>
                <label
                    className={monitorAvailable ? styles.monitorToggle : styles.monitorToggleDisabled}
                    title={monitorAvailable ? '' : intl.formatMessage(messages.monitorUnavailable)}
                >
                    <input
                        checked={record.monitorVisible}
                        disabled={!monitorAvailable}
                        type="checkbox"
                        onChange={event => onMonitorChange(record, event.target.checked)}
                    />
                    {record.monitorVisible ? <Eye size={17} /> : <EyeOff size={17} />}
                    <span>{intl.formatMessage(messages.monitor)}</span>
                </label>
                <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={requestDelete}
                >
                    <Trash2 size={16} />
                    {intl.formatMessage(messages.delete)}
                </button>
            </div>
        </section>
    );
};

DetailPanel.propTypes = {
    intl: PropTypes.shape({formatMessage: PropTypes.func.isRequired}),
    onDelete: PropTypes.func,
    onMonitorChange: PropTypes.func,
    onRename: PropTypes.func,
    onValueChange: PropTypes.func,
    record: PropTypes.shape({
        id: PropTypes.string,
        isCloud: PropTypes.bool,
        monitorAvailable: PropTypes.bool,
        monitorVisible: PropTypes.bool,
        name: PropTypes.string,
        scope: PropTypes.string,
        targetName: PropTypes.string,
        type: PropTypes.string,
        usageCount: PropTypes.number,
        value: PropTypes.any
    })
};

const VariableManager = props => {
    const {intl, vm} = props;
    const [workspace, setWorkspace] = useState(null);
    const [records, setRecords] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState(() => getSetting('default_filter'));
    const [scope, setScope] = useState('all');
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const [mobileView, setMobileView] = useState('list');

    const refresh = useCallback(() => {
        const next = collectVariables(vm).map(record => ({
            ...record,
            monitorAvailable: !!(vm.runtime.monitorBlocks && vm.runtime.monitorBlocks._blocks &&
                vm.runtime.monitorBlocks._blocks[record.id])
        }));
        setRecords(next);
        setSelectedId(current => (current && next.some(record => record.id === current) ? current : null));
    }, [vm]);

    const refreshValues = useCallback(() => {
        setRecords(current => current.map(record => {
            const target = vm.runtime.getTargetById(record.targetId);
            const variable = target && target.variables && target.variables[record.id];
            if (!variable) return record;
            const nextMonitorVisible = monitorVisible(vm, record.id);
            const valueUnchanged = Array.isArray(variable.value) && Array.isArray(record.value) ?
                variable.value.length === record.value.length &&
                    variable.value.every((value, index) => value === record.value[index]) :
                variable.value === record.value;
            if (valueUnchanged && nextMonitorVisible === record.monitorVisible) return record;
            return {
                ...record,
                value: Array.isArray(variable.value) ? variable.value.slice() : variable.value,
                monitorVisible: nextMonitorVisible
            };
        }));
    }, [vm]);

    useEffect(() => {
        let cancelled = false;
        lazyScratchBlocks.load().then(() => {
            if (cancelled) return;
            const ScratchBlocks = lazyScratchBlocks.get();
            setWorkspace(ScratchBlocks.getMainWorkspace());
            refresh();
        });
        return () => {
            cancelled = true;
        };
    }, [refresh]);

    useEffect(() => {
        const onChange = () => refresh();
        vm.on('PROJECT_CHANGED', onChange);
        vm.on('workspaceUpdate', onChange);
        vm.runtime.on('PROJECT_LOADED', onChange);
        vm.runtime.on('TARGETS_UPDATE', onChange);
        const removeSettingsListener = onSettingChanged(() => refresh());
        const interval = window.setInterval(() => {
            if (getSetting('live_update')) refreshValues();
        }, Math.max(100, getSetting('update_throttle')));
        return () => {
            vm.removeListener('PROJECT_CHANGED', onChange);
            vm.removeListener('workspaceUpdate', onChange);
            vm.runtime.off('PROJECT_LOADED', onChange);
            vm.runtime.off('TARGETS_UPDATE', onChange);
            removeSettingsListener();
            window.clearInterval(interval);
        };
    }, [vm, refresh, refreshValues]);

    const targets = useMemo(() => getOriginalTargets(vm), [vm, records]);
    const editingTarget = vm.runtime.getEditingTarget();
    const selected = records.find(record => record.id === selectedId) || null;
    const counts = useMemo(() => ({
        all: records.length,
        variables: records.filter(record => record.type === 'variable' && !record.isCloud).length,
        lists: records.filter(record => record.type === 'list').length,
        cloud: records.filter(record => record.isCloud).length
    }), [records]);

    const visibleRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return records.filter(record => {
            if (scope !== 'all' && record.scope !== scope) return false;
            if (filter === 'variables' && (record.type !== 'variable' || record.isCloud)) return false;
            if (filter === 'lists' && record.type !== 'list') return false;
            if (filter === 'cloud' && !record.isCloud) return false;
            if (!normalizedQuery) return true;
            const value = Array.isArray(record.value) ? record.value.join(' ') : String(record.value);
            return record.name.toLocaleLowerCase().includes(normalizedQuery) ||
                value.toLocaleLowerCase().includes(normalizedQuery);
        });
    }, [records, scope, filter, query]);

    const handleFilter = event => {
        setFilter(event.currentTarget.value);
        setMobileView('content');
    };
    const handleScope = value => setScope(value);
    const handleTarget = targetId => {
        vm.setEditingTarget(targetId);
        setSelectedId(null);
        window.setTimeout(refresh, 0);
    };

    const handleCreate = values => {
        // A global name must not collide with a same-type variable owned by a
        // different sprite, even though those locals are not in the current view.
        const validationRecords = values.scope === 'global' ?
            getOriginalTargets(vm).flatMap(target => Object.values(target.variables || {}).map(variable => ({
                id: variable.id,
                name: variable.name,
                scope: 'global',
                type: variable.type === 'list' ? 'list' : 'variable'
            }))) : records;
        const model = createVariable(workspace, validationRecords, values);
        setCreating(false);
        setMobileView('content');
        window.setTimeout(() => {
            refresh();
            if (model && model.getId) setSelectedId(model.getId());
        }, 0);
    };

    const handleRename = (record, name) => {
        const saved = renameVariable(workspace, records, record, name);
        window.setTimeout(refresh, 0);
        return saved;
    };

    const handleValueChange = (record, value) => {
        setVariableValue(vm, record, value);
        refresh();
    };

    const handleDelete = record => {
        deleteVariable(workspace, record.id);
        setSelectedId(null);
        window.setTimeout(refresh, 0);
    };

    const handleMonitorChange = (record, visible) => {
        setMonitorVisible(vm, record, visible);
        refresh();
    };

    const availableWidth = Math.max(360, window.innerWidth - 32);
    const availableHeight = Math.max(420, window.innerHeight - 32);
    const categories = [
        {id: 'all', label: intl.formatMessage(messages.all), icon: Database, count: counts.all},
        {id: 'variables', label: intl.formatMessage(messages.variables), icon: Variable, count: counts.variables},
        {id: 'lists', label: intl.formatMessage(messages.lists), icon: List, count: counts.lists},
        {id: 'cloud', label: intl.formatMessage(messages.cloud), icon: Cloud, count: counts.cloud}
    ];
    const currentCategory = categories.find(category => category.id === filter) || categories[0];
    const targetOptions = targets.map(target => ({
        value: target.id,
        label: target.isStage ? 'Stage' : target.getName()
    }));
    const scopeOptions = [
        {value: 'all', label: intl.formatMessage(messages.all)},
        {value: 'global', label: intl.formatMessage(messages.global)},
        ...(!editingTarget || editingTarget.isStage ? [] : [{
            value: 'local',
            label: intl.formatMessage(messages.local)
        }])
    ];

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={intl.formatMessage(messages.title)}
            height={Math.min(560, availableHeight)}
            id="variableManagerModal"
            isRtl={props.isRtl}
            maxHeight={availableHeight}
            maxWidth={availableWidth}
            minHeight={Math.min(420, availableHeight)}
            minWidth={Math.min(640, availableWidth)}
            visible={props.visible}
            width={Math.min(880, availableWidth)}
            onRequestClose={props.onRequestClose}
        >
            <ModalSidebarLayout mobileView={mobileView}>
                <ModalSidebar
                    ariaLabel="Variable Manager sections"
                    width="narrow"
                    header={
                        <div className={styles.sidebarHeader}>
                            <div className={styles.targetPicker}>
                                <span>{intl.formatMessage(messages.selectedSprite)}</span>
                                <SelectMenu
                                    align="left"
                                    ariaLabel={intl.formatMessage(messages.selectedSprite)}
                                    className={styles.mistwarpSelect}
                                    compact
                                    options={targetOptions}
                                    value={editingTarget ? editingTarget.id : ''}
                                    onChange={handleTarget}
                                    width="100%"
                                />
                            </div>
                        </div>
                    }
                    footer={
                        <ModalSidebarFooter>
                            <button
                                type="button"
                                className={styles.sidebarRefresh}
                                onClick={refresh}
                            >
                                <RefreshCw size={15} />
                                {intl.formatMessage(messages.refresh)}
                            </button>
                        </ModalSidebarFooter>
                    }
                >
                    {categories.map(category => (
                        <ModalSidebarItem
                            count={category.count}
                            icon={category.icon}
                            key={category.id}
                            label={category.label}
                            selected={!creating && filter === category.id}
                            value={category.id}
                            onClick={handleFilter}
                        />
                    ))}
                </ModalSidebar>
                <ModalSidebarContent className={styles.contentArea}>
                    <button
                        type="button"
                        className={styles.mobileBackButton}
                        onClick={() => setMobileView('list')}
                    >
                        <ChevronLeft size={18} />
                        {intl.formatMessage(messages.title)}
                    </button>
                    {creating ? (
                        <CreatePanel
                            canCreateCloud={vm.runtime.canAddCloudVariable ? vm.runtime.canAddCloudVariable() : false}
                            hasLocalTarget={!!editingTarget && !editingTarget.isStage}
                            intl={intl}
                            onCancel={() => setCreating(false)}
                            onCreate={handleCreate}
                        />
                    ) : (
                        <React.Fragment>
                            <header className={styles.pageHeader}>
                                <div>
                                    <h1>{currentCategory.label}</h1>
                                    <p>
                                        {`${visibleRecords.length} ${visibleRecords.length === 1 ? 'item' : 'items'}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={styles.primaryButton}
                                    onClick={() => {
                                        setCreating(true);
                                        setMobileView('content');
                                    }}
                                >
                                    <Plus size={16} />
                                    {intl.formatMessage(messages.addData)}
                                </button>
                            </header>
                            <div className={styles.toolbar}>
                                <label className={styles.search}>
                                    <Search size={16} />
                                    <input
                                        aria-label={intl.formatMessage(messages.search)}
                                        placeholder={intl.formatMessage(messages.search)}
                                        value={query}
                                        onChange={event => setQuery(event.target.value)}
                                    />
                                    {query && (
                                        <button
                                            type="button"
                                            aria-label="Clear search"
                                            onClick={() => setQuery('')}
                                        >
                                            <X size={15} />
                                        </button>
                                    )}
                                </label>
                                <SelectMenu
                                    align="right"
                                    ariaLabel="Filter by scope"
                                    className={`${styles.mistwarpSelect} ${styles.scopeFilter}`}
                                    compact
                                    options={scopeOptions}
                                    value={scope}
                                    onChange={handleScope}
                                    width="100%"
                                />
                            </div>
                            <div className={styles.workspace}>
                                <div
                                    className={styles.dataList}
                                    role="listbox"
                                    aria-label="Project variables and lists"
                                >
                                    {visibleRecords.map(record => {
                                        const Icon = record.isCloud ? Cloud : record.type === 'list' ? List : Variable;
                                        return (
                                            <button
                                                type="button"
                                                aria-selected={record.id === selectedId}
                                                className={record.id === selectedId ?
                                                    styles.dataRowSelected : styles.dataRow}
                                                key={record.id}
                                                role="option"
                                                onClick={() => setSelectedId(record.id)}
                                            >
                                                <Icon
                                                    className={styles.rowIcon}
                                                    data-kind={record.isCloud ? 'cloud' : record.type}
                                                    size={17}
                                                />
                                                <span className={styles.rowContent}>
                                                    <span className={styles.rowTop}>
                                                        <strong>{record.name}</strong>
                                                        <span>{record.scope === 'global' ?
                                                            'Global' : record.targetName}</span>
                                                    </span>
                                                    <span className={styles.rowPreview}>
                                                        {formatValuePreview(record)}
                                                    </span>
                                                </span>
                                                {record.monitorVisible && <Eye
                                                    className={styles.rowMonitor}
                                                    size={14}
                                                />}
                                            </button>
                                        );
                                    })}
                                    {!visibleRecords.length && (
                                        <div className={styles.emptyState}>
                                            <Database size={28} />
                                            <strong>{intl.formatMessage(messages.empty)}</strong>
                                            <span>{intl.formatMessage(messages.emptyHelp)}</span>
                                            <button
                                                type="button"
                                                className={styles.secondaryButton}
                                                onClick={() => setCreating(true)}
                                            >
                                                {intl.formatMessage(messages.addData)}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {selected ? (
                                    <DetailPanel
                                        intl={intl}
                                        record={selected}
                                        records={records}
                                        onDelete={handleDelete}
                                        onMonitorChange={handleMonitorChange}
                                        onRename={handleRename}
                                        onValueChange={handleValueChange}
                                    />
                                ) : (
                                    <div className={styles.noSelection}>
                                        <Database size={30} />
                                        <strong>{intl.formatMessage(messages.select)}</strong>
                                        <p>{intl.formatMessage(messages.selectHelp)}</p>
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    )}
                </ModalSidebarContent>
            </ModalSidebarLayout>
        </Modal>
    );
};

VariableManager.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

export {VariableManager, CreatePanel, DetailPanel, ListEditor, messages};
export default injectIntl(VariableManager);

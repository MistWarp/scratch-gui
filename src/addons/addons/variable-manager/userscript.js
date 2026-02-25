import icon from './icon.svg';
import WindowManager from '../../window-system/window-manager.js';

// Lucide icons as SVG strings
const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

const X_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

const VARIABLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;

const LIST_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`;

const CLOUD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>`;

const EYE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.41 0 .83-.02 1.24-.05"/><path d="m2 2 20 20"/></svg>`;

const SPRITE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>`;

const STAGE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;

const FILTER_ALL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 7h8"/><path d="M3 7h2"/><path d="M7 11h2"/><path d="M3 11h2"/><path d="M5 15h2"/><path d="M3 15h2"/><path d="M17 11h4"/><path d="M11 15h4"/><path d="M15 19h2"/></svg>`;

const FILTER_VAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;

const FILTER_LIST_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`;

const FILTER_CLOUD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-11a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.9-1V7a3 3 0 0 1 5.93-.72"/></svg>`;

const EMPTY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`;

/**
 * Variable Manager addon - completely redesigned
 */
export default async function ({addon, console, msg}) {
    const vm = addon.tab.traps.vm;

    // State
    let localVariables = [];
    let globalVariables = [];
    let allVariables = [];
    let preventUpdate = false;
    let updateScheduled = false;
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 50;

    let variableManagerWindow = null;
    let currentFilter = 'all'; // 'all', 'variables', 'lists', 'cloud'
    let currentSearch = '';
    let selectedVariable = null;

    // Create the main manager container
    const manager = document.createElement('div');
    manager.className = 'sa-var-manager';
    manager.setAttribute('role', 'main');
    manager.setAttribute('aria-label', 'Variable Manager');

    // Top bar with search and filters
    const topbar = document.createElement('div');
    topbar.className = 'sa-var-manager-topbar';

    // Search and filter row
    const filtersRow = document.createElement('div');
    filtersRow.className = 'sa-var-manager-filters';

    // Search wrapper
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'sa-var-manager-search-wrapper';

    const searchIcon = document.createElement('div');
    searchIcon.className = 'sa-var-manager-search-icon';
    searchIcon.innerHTML = SEARCH_ICON;

    const searchBox = document.createElement('input');
    searchBox.placeholder = 'Search...';
    searchBox.className = 'sa-var-manager-searchbox';
    searchBox.type = 'text';
    searchBox.setAttribute('aria-label', 'Search variables and lists');

    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.className = 'sa-var-manager-clear-search';
    clearSearchBtn.innerHTML = X_ICON;
    clearSearchBtn.title = 'Clear search';
    clearSearchBtn.style.display = 'none';
    clearSearchBtn.setAttribute('aria-label', 'Clear search');

    searchWrapper.appendChild(searchIcon);
    searchWrapper.appendChild(searchBox);
    searchWrapper.appendChild(clearSearchBtn);

    // Filter tabs
    const filterTabs = document.createElement('div');
    filterTabs.className = 'sa-var-manager-filters-tabs';

    const createFilterTab = (filter, icon, label) => {
        const tab = document.createElement('button');
        tab.className = 'sa-var-manager-filter-tab';
        tab.dataset.filter = filter;
        tab.innerHTML = `${icon}<span>${label}</span><span class="sa-var-manager-filter-count">0</span>`;
        tab.setAttribute('aria-label', `Filter by ${label}`);
        tab.setAttribute('role', 'button');
        tab.setAttribute('tabindex', '0');

        tab.addEventListener('click', () => setFilter(filter));

        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFilter(filter);
            }
        });

        return tab;
    };

    const allFilterTab = createFilterTab('all', FILTER_ALL_ICON, 'All');
    const varFilterTab = createFilterTab('variables', FILTER_VAR_ICON, 'Vars');
    const listFilterTab = createFilterTab('lists', FILTER_LIST_ICON, 'Lists');
    const cloudFilterTab = createFilterTab('cloud', FILTER_CLOUD_ICON, 'Cloud');

    filterTabs.append(allFilterTab, varFilterTab, listFilterTab, cloudFilterTab);

    filtersRow.append(searchWrapper, filterTabs);
    topbar.appendChild(filtersRow);

    // Stats bar
    const statsBar = document.createElement('div');
    statsBar.className = 'sa-var-manager-stats';

    const createStat = (icon, value) => {
        const stat = document.createElement('div');
        stat.className = 'sa-var-manager-stat';
        stat.innerHTML = `${icon}<span class="sa-var-manager-stat-value">${value}</span>`;
        return stat;
    };

    const statsVariables = createStat(VARIABLE_ICON, '0');
    const statsLists = createStat(LIST_ICON, '0');
    const statsCloud = createStat(CLOUD_ICON, '0');

    statsBar.append(statsVariables, statsLists, statsCloud);
    topbar.appendChild(statsBar);

    manager.appendChild(topbar);

    // Content area
    const content = document.createElement('div');
    content.className = 'sa-var-manager-content';
    manager.appendChild(content);

    // Empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'sa-var-manager-empty';
    emptyState.innerHTML = `
        <div class="sa-var-manager-empty-icon">${EMPTY_ICON}</div>
        <div class="sa-var-manager-empty-text">No variables found</div>
        <div class="sa-var-manager-empty-subtext">Try clearing your search or filters</div>
    `;
    emptyState.style.display = 'none';
    content.appendChild(emptyState);

    // Local section
    const localSection = document.createElement('div');
    localSection.className = 'sa-var-manager-section';
    localSection.innerHTML = `
        <div class="sa-var-manager-section-header">
            ${SPRITE_ICON}
            <span>For this Sprite</span>
            <span class="sa-var-manager-section-count">0</span>
        </div>
        <div class="sa-var-manager-list"></div>
    `;
    content.appendChild(localSection);

    const localList = localSection.querySelector('.sa-var-manager-list');
    const localCount = localSection.querySelector('.sa-var-manager-section-count');

    // Global section
    const globalSection = document.createElement('div');
    globalSection.className = 'sa-var-manager-section';
    globalSection.innerHTML = `
        <div class="sa-var-manager-section-header">
            ${STAGE_ICON}
            <span>For All Sprites</span>
            <span class="sa-var-manager-section-count">0</span>
        </div>
        <div class="sa-var-manager-list"></div>
    `;
    content.appendChild(globalSection);

    const globalList = globalSection.querySelector('.sa-var-manager-list');
    const globalCount = globalSection.querySelector('.sa-var-manager-section-count');

    // Helper functions
    const updateStats = () => {
        const variables = allVariables.filter(v => v.type === 'variable').length;
        const lists = allVariables.filter(v => v.type === 'list').length;
        const clouds = allVariables.filter(v => v.isCloud).length;

        statsVariables.querySelector('.sa-var-manager-stat-value').textContent = variables;
        statsLists.querySelector('.sa-var-manager-stat-value').textContent = lists;
        statsCloud.querySelector('.sa-var-manager-stat-value').textContent = clouds;

        // Update filter counts
        allFilterTab.querySelector('.sa-var-manager-filter-count').textContent = allVariables.length;
        varFilterTab.querySelector('.sa-var-manager-filter-count').textContent = variables;
        listFilterTab.querySelector('.sa-var-manager-filter-count').textContent = lists;
        cloudFilterTab.querySelector('.sa-var-manager-filter-count').textContent = clouds;
    };

    const setFilter = (filter) => {
        currentFilter = filter;

        filterTabs.querySelectorAll('.sa-var-manager-filter-tab').forEach(tab => {
            tab.classList.toggle('sa-var-manager-filter-active', tab.dataset.filter === filter);
        });

        applyFilters();
    };

    const applyFilters = () => {
        const searchLower = currentSearch.toLowerCase();

        allVariables.forEach(v => {
            const matchesSearch = !searchLower || 
                v.name.toLowerCase().includes(searchLower) ||
                v.value?.toString().toLowerCase().includes(searchLower);

            let matchesFilter = true;
            if (currentFilter === 'variables') {
                matchesFilter = v.type === 'variable';
            } else if (currentFilter === 'lists') {
                matchesFilter = v.type === 'list';
            } else if (currentFilter === 'cloud') {
                matchesFilter = v.isCloud;
            }

            const visible = matchesSearch && matchesFilter;
            v.setVisible(visible);
        });

        updateSectionVisibility();
    };

    const updateSectionVisibility = () => {
        const visibleLocals = localVariables.filter(v => v.visible);
        const visibleGlobals = globalVariables.filter(v => v.visible);

        localSection.style.display = visibleLocals.length > 0 ? 'block' : 'none';
        globalSection.style.display = visibleGlobals.length > 0 ? 'block' : 'none';

        localCount.textContent = visibleLocals.length;
        globalCount.textContent = visibleGlobals.length;

        const hasVisible = visibleLocals.length > 0 || visibleGlobals.length > 0;
        emptyState.style.display = hasVisible ? 'none' : 'flex';
    };

    // Search functionality
    let searchTimeout;
    const performSearch = (searchTerm) => {
        currentSearch = searchTerm;
        clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';
        applyFilters();
    };

    searchBox.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(e.target.value), 100);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchBox.value = '';
        performSearch('');
        searchBox.focus();
    });

    searchBox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchBox.value) {
                clearSearchBtn.click();
            } else {
                hideVariableManager();
            }
            e.preventDefault();
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusFirstVisibleVariable();
        }
    });

    const focusFirstVisibleVariable = () => {
        const firstVisible = allVariables.find(v => v.visible && v.input);
        if (firstVisible && firstVisible.input) {
            firstVisible.input.focus();
            selectedVariable = firstVisible;
        }
    };

    // WrappedVariable class - completely redesigned
    class WrappedVariable {
        constructor(scratchVariable, target) {
            this.scratchVariable = scratchVariable;
            this.target = target;
            this.type = scratchVariable.type === 'list' ? 'list' : 'variable';
            this.isCloud = scratchVariable.isCloud || false;
            this.name = scratchVariable.name;
            this.id = scratchVariable.id;
            this.visible = true;
            this.ignoreTooBig = false;
            this.lastValue = null;

            this.buildDOM();
        }

        buildDOM() {
            this.card = document.createElement('div');
            this.card.className = 'sa-var-manager-card';
            this.card.dataset.variableId = this.id;

            const icon = document.createElement('div');
            icon.className = 'sa-var-manager-card-icon';
            icon.dataset.type = this.isCloud ? 'cloud' : this.type;

            if (this.isCloud) {
                icon.innerHTML = CLOUD_ICON;
            } else if (this.type === 'list') {
                icon.innerHTML = LIST_ICON;
            } else {
                icon.innerHTML = VARIABLE_ICON;
            }

            const body = document.createElement('div');
            body.className = 'sa-var-manager-card-body';

            const header = document.createElement('div');
            header.className = 'sa-var-manager-card-header';

            const nameInput = document.createElement('input');
            nameInput.className = 'sa-var-manager-name-input';
            nameInput.value = this.name;
            nameInput.setAttribute('aria-label', `${this.type} name`);
            this.nameInput = nameInput;

            const badges = document.createElement('div');
            badges.className = 'sa-var-manager-card-badges';

            if (this.type === 'list') {
                const listBadge = document.createElement('div');
                listBadge.className = 'sa-var-manager-badge';
                listBadge.dataset.badge = 'list';
                listBadge.innerHTML = `${LIST_ICON}<span>List</span>`;
                badges.appendChild(listBadge);
            }

            if (this.isCloud) {
                const cloudBadge = document.createElement('div');
                cloudBadge.className = 'sa-var-manager-badge';
                cloudBadge.dataset.badge = 'cloud';
                cloudBadge.innerHTML = `${CLOUD_ICON}<span>Cloud</span>`;
                badges.appendChild(cloudBadge);
            }

            header.append(nameInput, badges);

            const valueWrapper = document.createElement('div');
            valueWrapper.className = 'sa-var-manager-value-wrapper';

            const valueInput = document.createElement('textarea');
            valueInput.className = 'sa-var-manager-value-input';
            valueInput.setAttribute('aria-label', `${this.name} value`);
            this.input = valueInput;

            const tooBig = document.createElement('button');
            tooBig.className = 'sa-var-manager-too-big';
            tooBig.textContent = 'Variable too large to display';
            tooBig.addEventListener('click', () => {
                this.ignoreTooBig = true;
                this.updateValue(true);
            });
            this.tooBig = tooBig;

            valueWrapper.append(valueInput, tooBig);

            body.append(header, valueWrapper);

            this.card.append(icon, body);

            this.setupEventListeners();
        }

        setupEventListeners() {
            const workspace = () => Blockly.getMainWorkspace();

            // Name input handling
            const onNameBlur = () => {
                const newName = this.nameInput.value.trim();
                if (newName === this.name) return;

                const CLOUD_PREFIX = '☁ ';
                let processedName = newName;

                if (this.isCloud) {
                    if (!processedName.startsWith('☁')) {
                        processedName = CLOUD_PREFIX + processedName;
                    } else if (!processedName.startsWith(CLOUD_PREFIX)) {
                        processedName = CLOUD_PREFIX + processedName.substring(1);
                    }
                }

                if (!processedName.trim()) {
                    this.showError(this.nameInput);
                    return;
                }

                let nameAlreadyUsed = false;
                try {
                    const w = workspace();
                    if (this.target.isStage) {
                        const existingNames = vm.runtime.getAllVarNamesOfType(this.scratchVariable.type);
                        nameAlreadyUsed = existingNames.includes(processedName);
                    } else if (w) {
                        nameAlreadyUsed = !!w.getVariable(processedName, this.scratchVariable.type);
                    }
                } catch (e) {
                    console.error('Error checking variable name:', e);
                }

                if (nameAlreadyUsed) {
                    this.showError(this.nameInput);
                    return;
                }

                try {
                    const w = workspace();
                    if (w) {
                        w.renameVariableById(this.id, processedName);
                    }
                    this.name = processedName;
                    if (this.nameInput.value !== processedName) {
                        this.nameInput.value = processedName;
                    }
                } catch (e) {
                    console.error('Error renaming variable:', e);
                    this.showError(this.nameInput);
                }
            };

            this.nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.nameInput.blur();
                }
                if (e.key === 'Escape') {
                    this.nameInput.value = this.name;
                    e.preventDefault();
                    this.nameInput.blur();
                }
            });

            this.nameInput.addEventListener('focus', () => {
                preventUpdate = true;
                manager.classList.add('freeze');
                this.nameInput.select();
            });

            this.nameInput.addEventListener('blur', onNameBlur);

            // Value input handling
            const onValueBlur = () => {
                try {
                    const newValue = this.scratchVariable.type === 'list' 
                        ? this.input.value.split('\n').filter(line => line !== '')
                        : this.input.value;
                    vm.setVariableValue(this.target.id, this.id, newValue);
                    this.input.classList.remove('sa-var-manager-error');
                } catch (e) {
                    console.error('Error setting variable value:', e);
                    this.showError(this.input);
                }
            };

            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'a' && (e.ctrlKey || e.metaKey)) return; // Allow Ctrl+A

                if (e.key === 'Escape') {
                    this.updateValue(true);
                    e.preventDefault();
                    this.input.blur();
                }

                // Tab navigation
                if (e.key === 'Tab') {
                    const currentIndex = allVariables.indexOf(selectedVariable);
                    if (e.shiftKey && currentIndex > 0) {
                        e.preventDefault();
                        const prev = allVariables.slice(0, currentIndex).reverse().find(v => v.visible);
                        if (prev && prev.input) {
                            prev.input.focus();
                            selectedVariable = prev;
                        }
                    } else if (!e.shiftKey && currentIndex < allVariables.length - 1) {
                        e.preventDefault();
                        const next = allVariables.slice(currentIndex + 1).find(v => v.visible);
                        if (next && next.input) {
                            next.input.focus();
                            selectedVariable = next;
                        }
                    }
                }
            });

            this.input.addEventListener('focus', () => {
                preventUpdate = true;
                manager.classList.add('freeze');
                selectedVariable = this;
                if (this.scratchVariable.type !== 'list') {
                    this.input.select();
                } else {
                    this.input.setSelectionRange(0, 0);
                }
            });

            this.input.addEventListener('blur', onValueBlur);

            this.input.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        showError(element) {
            element.classList.add('sa-var-manager-error');
            setTimeout(() => element.classList.remove('sa-var-manager-error'), 1000);
        }

        updateValue(force) {
            if (!this.visible && !force) return;

            let value;
            let maxSafeLength;

            if (this.type === 'list') {
                value = this.scratchVariable.value.join('\n');
                maxSafeLength = 5000000;
            } else {
                value = String(this.scratchVariable.value);
                maxSafeLength = 1000000;
            }

            if (!force && this.lastValue === value) return;
            this.lastValue = value;

            if (!this.ignoreTooBig && value.length > maxSafeLength) {
                this.card.dataset.tooBig = 'true';
                return;
            }

            this.card.dataset.tooBig = 'false';
            if (this.input.value !== value) {
                this.input.value = value;
                if (this.type === 'list') {
                    this.input.style.height = 'auto';
                    const height = Math.min(200, this.input.scrollHeight);
                    if (height > 0) {
                        this.input.style.height = `${height}px`;
                    }
                }
            }
        }

        setVisible(visible) {
            if (this.visible === visible) return;
            this.visible = visible;
            this.card.style.display = visible ? 'flex' : 'none';
            if (visible) {
                this.updateValue(true);
            }
        }
    }

    // Update scheduling
    const scheduleUpdate = () => {
        if (updateScheduled) return;
        if (!variableManagerWindow || preventUpdate || !variableManagerWindow.isVisible) return;

        updateScheduled = true;
        requestAnimationFrame(() => {
            const now = Date.now();
            if (now - lastUpdateTime < UPDATE_THROTTLE) {
                setTimeout(() => {
                    updateScheduled = false;
                    scheduleUpdate();
                }, UPDATE_THROTTLE - (now - lastUpdateTime));
                return;
            }

            quickReload();
            lastUpdateTime = now;
            updateScheduled = false;
        });
    };

    const quickReload = () => {
        if (!variableManagerWindow || preventUpdate || !variableManagerWindow.isVisible) return;

        allVariables.forEach(v => v.updateValue());
    };

    const fullReload = () => {
        if (!variableManagerWindow || preventUpdate || !variableManagerWindow.isVisible) return;

        const editingTarget = vm.runtime.getEditingTarget();
        const stage = vm.runtime.getTargetForStage();

        // Clean up old variables
        localVariables.forEach(v => v.card.remove());
        globalVariables.forEach(v => v.card.remove());

        localVariables = editingTarget.isStage
            ? []
            : Object.values(editingTarget.variables)
                .filter(i => i.type === '' || i.type === 'list')
                .map(i => new WrappedVariable(i, editingTarget));

        globalVariables = Object.values(stage.variables)
            .filter(i => i.type === '' || i.type === 'list')
            .map(i => new WrappedVariable(i, stage));

        allVariables = [...localVariables, ...globalVariables];

        // Append to lists
        localList.append(...localVariables.map(v => v.card));
        globalList.append(...globalVariables.map(v => v.card));

        applyFilters();
        updateStats();
    };

    // Window management
    const toggleVariableManager = () => {
        if (variableManagerWindow && variableManagerWindow.isVisible) {
            hideVariableManager();
        } else {
            showVariableManager();
        }
    };

    const showVariableManager = () => {
        if (variableManagerWindow) {
            variableManagerWindow.show().bringToFront();
            return;
        }

        const initialX = Math.max(24, Math.min(window.innerWidth - 474, 50));
        const initialY = Math.max(24, Math.min(window.innerHeight - 574, 50));

        variableManagerWindow = WindowManager.createWindow({
            id: 'variable-manager',
            title: msg('variables'),
            width: 650,
            height: 600,
            minWidth: 500,
            minHeight: 400,
            maxWidth: Math.min(window.innerWidth * 0.9, 1400),
            maxHeight: Math.min(window.innerHeight * 0.9, 1000),
            className: 'sa-variable-manager-window',
            x: initialX,
            y: initialY,
            onClose: () => {
                variableManagerWindow = null;
                cleanup();
            }
        });

        // Try to position near debugger
        const debuggerEl = document.querySelector('.sa-debugger-window');
        if (debuggerEl) {
            try {
                const debuggerRect = debuggerEl.getBoundingClientRect();
                const margin = 10;

                if (debuggerRect.left > 460) {
                    variableManagerWindow.x = Math.max(margin, debuggerRect.left - 460 - margin);
                } else {
                    variableManagerWindow.x = Math.min(window.innerWidth - 460 - margin, debuggerRect.right + margin);
                }
                variableManagerWindow.y = Math.max(margin, debuggerRect.top);
            } catch (e) {
                // Use default position
            }
        }

        variableManagerWindow.setContent(manager);
        variableManagerWindow.show();

        setTimeout(() => {
            searchBox.focus();
            fullReload();
        }, 50);
    };

    const hideVariableManager = () => {
        if (variableManagerWindow) {
            variableManagerWindow.close();
        }
    };

    // Cleanup
    const cleanup = () => {
        localVariables.forEach(v => v.card.remove());
        globalVariables.forEach(v => v.card.remove());
        localVariables = [];
        globalVariables = [];
        allVariables = [];
        selectedVariable = null;
    };

    // Keyboard shortcuts
    const handleKeyboardShortcuts = (e) => {
        if (!variableManagerWindow || !variableManagerWindow.isVisible) return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchBox.focus();
            searchBox.select();
        }

        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            hideVariableManager();
        }

        if (e.key === 'Escape') {
            if (document.activeElement === searchBox && searchBox.value) {
                clearSearchBtn.click();
            } else {
                hideVariableManager();
            }
        }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Event hooks
    vm.runtime.on('PROJECT_LOADED', () => {
        if (variableManagerWindow?.isVisible) fullReload();
    });

    vm.runtime.on('TOOLBOX_EXTENSIONS_NEED_UPDATE', () => {
        if (variableManagerWindow?.isVisible) fullReload();
    });

    let stepHookInstalled = false;

    const installStepHook = () => {
        if (stepHookInstalled) return;
        stepHookInstalled = true;

        const oldStep = vm.runtime._step;
        vm.runtime._step = function (...args) {
            const ret = oldStep.call(this, ...args);
            try {
                scheduleUpdate();
            } catch (e) {
                console.error(e);
            }
            return ret;
        };
    };

    installStepHook();

    addon.self.addEventListener('disabled', () => {
        document.removeEventListener('keydown', handleKeyboardShortcuts);
        hideVariableManager();
        cleanup();
    });

    addon.self.addEventListener('reenabled', () => {
        if (variableManagerWindow) fullReload();
    });

    // Expose toggle function
    window.__mistwarpVariableManagerToggle = toggleVariableManager;

    // Create button
    const buttonOuter = document.createElement('div');
    buttonOuter.className = 'sa-variable-manager-container';
    const button = document.createElement('div');
    button.className = addon.tab.scratchClass('button_outlined-button', 'stage-header_stage-button');

    const buttonContent = document.createElement('div');
    buttonContent.className = addon.tab.scratchClass('button_content');
    const buttonImage = document.createElement('svg');
    buttonImage.className = addon.tab.scratchClass('stage-header_stage-button-icon');
    buttonImage.draggable = false;
    buttonImage.innerHTML = addon.self.getResource('/icon.svg');
    buttonContent.appendChild(buttonImage);
    button.appendChild(buttonContent);
    buttonOuter.appendChild(button);

    const preventSelection = (e) => e.preventDefault();
    button.addEventListener('mousedown', preventSelection);
    button.addEventListener('selectstart', preventSelection);

    button.addEventListener('click', toggleVariableManager);

    // Global keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V' && !e.repeat) {
            e.preventDefault();
            toggleVariableManager();
        }
    });

    // Add to stage header
    while (true) {
        await addon.tab.waitForElement(
            '[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]',
            {
                markAsSeen: true,
                reduxEvents: [
                    'scratch-gui/mode/SET_PLAYER',
                    'scratch-gui/mode/SET_FULL_SCREEN',
                    'fontsLoaded/SET_FONTS_LOADED',
                    'scratch-gui/locales/SELECT_LOCALE'
                ],
                reduxCondition: state => !state.scratchGui.mode.isPlayerOnly
            }
        );

        if (addon.tab.editorMode === 'editor') {
            addon.tab.appendToSharedSpace({
                space: 'stageHeader',
                element: buttonOuter,
                order: 2
            });
        } else {
            buttonOuter.remove();
            hideVariableManager();
        }
    }
}

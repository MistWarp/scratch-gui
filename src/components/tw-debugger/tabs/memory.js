import Chart from '../../../addons/libraries/thirdparty/cs/chart.min.js';
import {getSetting} from '../../../lib/debugger/settings.js';
import memoryIcon from '../icons/memory.svg';
import clearIcon from '../icons/clear.svg';

const MAX_VARIABLE_ROWS = 300;

const createMemoryTab = controller => {
    const vm = controller.vm;
    const engine = controller.engine;

    const fancyGraphs = getSetting('fancy_graphs');
    const lineWidth = 2;
    const themeColor = (name, fallback) =>
        getComputedStyle(document.documentElement).getPropertyValue(name)
            .trim() || fallback;
    const accentColor = themeColor('--looks-secondary', '#4c97ff');
    const gridColor = 'rgba(128, 128, 128, 0.15)';
    const tickColor = 'rgba(128, 128, 128, 0.8)';
    const lineColor = accentColor;

    const content = document.createElement('div');
    content.className = 'sa-memory-tab-content';

    const createChart = ({title}) => {
        const card = document.createElement('div');
        card.className = 'sa-debugger-chart-card';
        const header = document.createElement('div');
        header.className = 'sa-debugger-chart-header';
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        const valueElement = document.createElement('span');
        valueElement.className = 'sa-debugger-chart-value';
        header.append(titleElement, valueElement);
        const body = document.createElement('div');
        body.className = 'sa-debugger-chart-body';
        const canvas = document.createElement('canvas');
        canvas.className = 'sa-debugger-chart';
        body.appendChild(canvas);
        card.append(header, body);
        return {
            card,
            canvas,
            setValue: text => {
                valueElement.textContent = text;
            }
        };
    };

    const commonScales = () => ({
        y: {
            min: 0,
            grid: {color: gridColor},
            ticks: {color: tickColor, font: {size: 10}}
        },
        x: {
            grid: {display: false},
            ticks: {display: false}
        }
    });

    const createInfoCard = ({title, className = ''}) => {
        const card = document.createElement('div');
        card.className = `sa-memory-info-card ${className}`;
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.className = 'sa-memory-info-title';
        const valueElement = document.createElement('div');
        valueElement.textContent = '0';
        valueElement.className = 'sa-memory-info-value';
        card.appendChild(titleElement);
        card.appendChild(valueElement);
        return {
            element: card,
            updateValue: value => {
                valueElement.textContent = value;
            }
        };
    };

    const now = () => performance.now();
    const NUMBER_OF_POINTS = 20;
    const labels = Array.from(Array(NUMBER_OF_POINTS).keys()).reverse();
    const datasetOptions = () => ([{
        data: Array(NUMBER_OF_POINTS).fill(-1),
        borderWidth: lineWidth,
        fill: fancyGraphs,
        backgroundColor: 'rgba(128, 128, 128, 0.08)',
        borderColor: lineColor,
        pointRadius: 0,
        tension: 0.3
    }]);

    const infoSection = document.createElement('div');
    infoSection.className = 'sa-memory-info-section';

    const clonesCard = createInfoCard({title: 'Clones', className: 'sa-memory-clones'});
    const variablesCard = createInfoCard({title: 'Variables', className: 'sa-memory-variables'});
    const variableDataCard = createInfoCard({title: 'Variable chars', className: 'sa-memory-variable-data'});
    const listsCard = createInfoCard({title: 'Lists', className: 'sa-memory-lists'});
    const listItemsCard = createInfoCard({title: 'List items', className: 'sa-memory-list-items'});

    infoSection.append(
        clonesCard.element,
        variablesCard.element,
        variableDataCard.element,
        listsCard.element,
        listItemsCard.element
    );

    const variableDataElements = createChart({title: 'Variable data size'});
    const variableDataScales = commonScales();
    variableDataScales.y.suggestedMax = 1000;
    const variableDataChart = new Chart(variableDataElements.canvas.getContext('2d'), {
        type: 'line',
        data: {labels, datasets: datasetOptions()},
        options: {
            animation: fancyGraphs,
            maintainAspectRatio: false,
            scales: variableDataScales,
            plugins: {
                legend: {display: false},
                tooltip: {callbacks: {label: context => `${context.parsed.y} chars`}}
            }
        }
    });

    const listItemsElements = createChart({title: 'List items'});
    const listItemsScales = commonScales();
    listItemsScales.y.suggestedMax = 1000;
    const listItemsChart = new Chart(listItemsElements.canvas.getContext('2d'), {
        type: 'line',
        data: {labels, datasets: datasetOptions()},
        options: {
            animation: fancyGraphs,
            maintainAspectRatio: false,
            scales: listItemsScales,
            plugins: {
                legend: {display: false},
                tooltip: {callbacks: {label: context => `${context.parsed.y} items`}}
            }
        }
    });

    const variablesHeader = document.createElement('h2');
    variablesHeader.className = 'sa-memory-section-title';
    variablesHeader.textContent = 'Variables';
    const variablesList = document.createElement('div');
    variablesList.className = 'sa-memory-variables-list';

    content.append(
        infoSection,
        variableDataElements.card,
        listItemsElements.card,
        variablesHeader,
        variablesList
    );

    const getStats = () => {
        let variableCount = 0;
        let variableChars = 0;
        let listCount = 0;
        let listItems = 0;
        for (const target of vm.runtime.targets) {
            const variableMap = target.variables;
            for (const variableId in variableMap) {
                const variable = variableMap[variableId];
                if (variable.type === '') {
                    if (target.isOriginal) variableCount++;
                    if (typeof variable.value === 'string') variableChars += variable.value.length;
                } else if (variable.type === 'list') {
                    if (target.isOriginal) listCount++;
                    if (Array.isArray(variable.value)) listItems += variable.value.length;
                }
            }
        }
        return {
            cloneCount: vm.runtime._cloneCounter,
            variableCount,
            variableChars,
            listCount,
            listItems
        };
    };

    const renderVariables = () => {
        const fragment = document.createDocumentFragment();
        let count = 0;
        for (const target of vm.runtime.targets) {
            if (!target.isOriginal) continue;
            const variableMap = target.variables;
            for (const variableId in variableMap) {
                if (count >= MAX_VARIABLE_ROWS) break;
                const variable = variableMap[variableId];
                if (variable.type !== '' && variable.type !== 'list') continue;

                const row = document.createElement('div');
                row.className = 'sa-memory-variable-row';

                const scope = document.createElement('span');
                scope.className = 'sa-memory-variable-scope';
                scope.textContent = target.isStage ? 'Stage' : target.getName();
                row.appendChild(scope);

                const name = document.createElement('span');
                name.className = 'sa-memory-variable-name';
                name.textContent = variable.name;
                row.appendChild(name);

                const value = document.createElement('span');
                value.className = 'sa-memory-variable-value';
                if (variable.type === 'list') {
                    row.classList.add('sa-memory-variable-list');
                    const items = Array.isArray(variable.value) ? variable.value : [];
                    value.textContent = `[${items.length}] ${items.slice(0, 8).join(', ')}`;
                } else {
                    value.textContent = String(variable.value);
                }
                value.title = value.textContent;
                row.appendChild(value);

                fragment.appendChild(row);
                count++;
            }
        }
        variablesList.textContent = '';
        if (count === 0) {
            const empty = document.createElement('div');
            empty.className = 'sa-memory-variables-empty';
            empty.textContent = 'No variables';
            variablesList.appendChild(empty);
        } else {
            variablesList.appendChild(fragment);
        }
    };

    const updateInfo = () => {
        const stats = getStats();
        clonesCard.updateValue(stats.cloneCount);
        variablesCard.updateValue(stats.variableCount);
        variableDataCard.updateValue(stats.variableChars);
        listsCard.updateValue(stats.listCount);
        listItemsCard.updateValue(stats.listItems);

        clonesCard.element.classList.toggle('sa-memory-warning', stats.cloneCount > 250);
        clonesCard.element.classList.toggle('sa-memory-critical', stats.cloneCount >= 300);
        listItemsCard.element.classList.toggle('sa-memory-warning', stats.listItems > 5000);
        listItemsCard.element.classList.toggle('sa-memory-critical', stats.listItems > 10000);
        return stats;
    };

    let lastMemoryTime = now() + 3000;
    let isVisible = false;

    controller.addAfterStepCallback(() => {
        if (engine.isPaused() || !isVisible) {
            return;
        }
        const time = now();
        if (time - lastMemoryTime > 1000) {
            lastMemoryTime = time;
            const stats = updateInfo();
            renderVariables();

            const variableDataData = variableDataChart.data.datasets[0].data;
            variableDataData.shift();
            variableDataData.push(stats.variableChars);
            variableDataElements.setValue(`${stats.variableChars}`);

            const listItemsData = listItemsChart.data.datasets[0].data;
            listItemsData.shift();
            listItemsData.push(stats.listItems);
            listItemsElements.setValue(`${stats.listItems}`);

            const maxVariableData = Math.max(...variableDataData.filter(x => x >= 0));
            variableDataChart.options.scales.y.suggestedMax = Math.max(1000, maxVariableData * 1.2);
            const maxListItems = Math.max(...listItemsData.filter(x => x >= 0));
            listItemsChart.options.scales.y.suggestedMax = Math.max(1000, maxListItems * 1.2);

            variableDataChart.update();
            listItemsChart.update();
        } else {
            updateInfo();
        }
    });

    let pauseTime = 0;
    engine.onPauseChanged(paused => {
        if (paused) {
            pauseTime = now();
        } else {
            lastMemoryTime += now() - pauseTime;
        }
    });

    const clearButton = {
        label: 'Clear charts',
        icon: clearIcon,
        onClick: () => {
            variableDataChart.data.datasets[0].data.fill(-1);
            listItemsChart.data.datasets[0].data.fill(-1);
            if (isVisible) {
                variableDataChart.update();
                listItemsChart.update();
            }
        }
    };

    return {
        id: 'memory',
        label: 'Memory',
        icon: memoryIcon,
        content,
        buttons: [clearButton],
        show: () => {
            isVisible = true;
            updateInfo();
            renderVariables();
        },
        hide: () => {
            isVisible = false;
        },
        destroy: () => {
            variableDataChart.destroy();
            listItemsChart.destroy();
        }
    };
};

export default createMemoryTab;

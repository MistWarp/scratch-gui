import Chart from '../../../addons/libraries/thirdparty/cs/chart.min.js';
import {getSetting} from '../../../lib/debugger/settings.js';
import performanceIcon from '../icons/performance.svg';

const createPerformanceTab = controller => {
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
    content.className = 'sa-performance-tab-content';

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

    const now = () => performance.now();
    const getMaxFps = () => (vm.runtime.frameLoop.framerate === 0 ? 60 : vm.runtime.frameLoop.framerate);

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

    const fpsElements = createChart({title: 'Frames per second'});
    const fpsScales = commonScales();
    fpsScales.y.suggestedMax = getMaxFps();
    const fpsChart = new Chart(fpsElements.canvas.getContext('2d'), {
        type: 'line',
        data: {labels, datasets: datasetOptions()},
        options: {
            animation: fancyGraphs,
            maintainAspectRatio: false,
            scales: fpsScales,
            plugins: {
                legend: {display: false},
                tooltip: {callbacks: {label: context => `${context.parsed.y} FPS`}}
            }
        }
    });

    const clonesElements = createChart({title: 'Clones'});
    const clonesScales = commonScales();
    clonesScales.y.suggestedMax = 300;
    const clonesChart = new Chart(clonesElements.canvas.getContext('2d'), {
        type: 'line',
        data: {labels, datasets: datasetOptions()},
        options: {
            animation: fancyGraphs,
            maintainAspectRatio: false,
            scales: clonesScales,
            plugins: {
                legend: {display: false},
                tooltip: {callbacks: {label: context => `${context.parsed.y} clones`}}
            }
        }
    });

    content.appendChild(fpsElements.card);
    content.appendChild(clonesElements.card);

    const renderTimes = [];
    let lastFpsTime = now() + 3000;
    let isVisible = false;

    controller.addAfterStepCallback(() => {
        if (engine.isPaused() || !isVisible) {
            return;
        }

        const time = now();
        while (renderTimes.length > 0 && renderTimes[0] <= time - 1000) renderTimes.shift();
        renderTimes.push(time);

        if (time - lastFpsTime > 1000) {
            lastFpsTime = time;

            const maxFps = getMaxFps();
            const fpsData = fpsChart.data.datasets[0].data;
            fpsData.shift();
            fpsData.push(Math.min(renderTimes.length, maxFps));
            fpsChart.options.scales.y.suggestedMax = maxFps;

            const clonesData = clonesChart.data.datasets[0].data;
            clonesData.shift();
            clonesData.push(vm.runtime._cloneCounter);

            fpsElements.setValue(`${Math.min(renderTimes.length, maxFps)} / ${maxFps} FPS`);
            clonesElements.setValue(`${vm.runtime._cloneCounter}`);

            fpsChart.update();
            clonesChart.update();
        }
    });

    let pauseTime = 0;
    engine.onPauseChanged(paused => {
        if (paused) {
            pauseTime = now();
        } else {
            const dt = now() - pauseTime;
            lastFpsTime += dt;
            for (let i = 0; i < renderTimes.length; i++) {
                renderTimes[i] += dt;
            }
        }
    });

    return {
        id: 'performance',
        label: 'Performance',
        icon: performanceIcon,
        content,
        buttons: [],
        show: () => {
            isVisible = true;
        },
        hide: () => {
            isVisible = false;
        },
        destroy: () => {
            fpsChart.destroy();
            clonesChart.destroy();
        }
    };
};

export default createPerformanceTab;

import { onPauseChanged, isPaused } from "./module.js";
import "../../libraries/thirdparty/cs/chart.min.js";

export default async function createPerformanceTab({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  // In optimized graphs everything still looks good
  const fancyGraphs = addon.settings.get("fancy_graphs");
  const lineWidth = 2;
  const themeColor = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const accentColor = themeColor("--looks-secondary", "#4c97ff");
  const gridColor = "rgba(128, 128, 128, 0.15)";
  const tickColor = "rgba(128, 128, 128, 0.8)";
  const lineColor = accentColor;

  const tab = debug.createHeaderTab({
    text: msg("tab-performance"),
    icon: addon.self.getResource("/icons/performance.svg") /* rewritten by pull.js */,
  });

  const content = Object.assign(document.createElement("div"), {
    className: "sa-performance-tab-content",
  });

  const createChart = ({ title }) => {
    const card = Object.assign(document.createElement("div"), {
      className: "sa-debugger-chart-card",
    });
    const header = Object.assign(document.createElement("div"), {
      className: "sa-debugger-chart-header",
    });
    const titleElement = Object.assign(document.createElement("h2"), {
      textContent: title || "Chart",
    });
    const valueElement = Object.assign(document.createElement("span"), {
      className: "sa-debugger-chart-value",
      textContent: "",
    });
    header.append(titleElement, valueElement);
    const body = Object.assign(document.createElement("div"), {
      className: "sa-debugger-chart-body",
    });
    const canvas = Object.assign(document.createElement("canvas"), {
      className: "sa-debugger-chart",
    });
    body.appendChild(canvas);
    card.append(header, body);
    return {
      card,
      canvas,
      setValue: (text) => {
        valueElement.textContent = text;
      },
    };
  };

  const commonScales = () => ({
    y: {
      min: 0,
      grid: { color: gridColor },
      ticks: { color: tickColor, font: { size: 10 } },
    },
    x: {
      grid: { display: false },
      ticks: { display: false },
    },
  });

  const now = () => performance.now();

  // We'll guess that requestAnimationFrame is probably 60, but even if it's not, it's not a big deal.
  const getMaxFps = () => vm.runtime.frameLoop.framerate === 0 ? 60 : vm.runtime.frameLoop.framerate;

  const NUMBER_OF_POINTS = 20;
  // An array like [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  const labels = Array.from(Array(NUMBER_OF_POINTS).keys()).reverse();

  const fpsElements = createChart({
    title: msg("performance-framerate-title"),
  });
  const fpsScales = commonScales();
  fpsScales.y.suggestedMax = getMaxFps();
  const fpsChart = new Chart(fpsElements.canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: Array(NUMBER_OF_POINTS).fill(-1),
          borderWidth: lineWidth,
          fill: fancyGraphs,
          backgroundColor: "rgba(128, 128, 128, 0.08)",
          borderColor: lineColor,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    },
    options: {
      animation: fancyGraphs,
      maintainAspectRatio: false,
      scales: fpsScales,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => msg("performance-framerate-graph-tooltip", { fps: context.parsed.y }),
          },
        },
      },
    },
  });

  const clonesElements = createChart({
    title: msg("performance-clonecount-title"),
  });
  const clonesScales = commonScales();
  clonesScales.y.suggestedMax = 300;
  const performanceClonesChart = new Chart(clonesElements.canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: Array(NUMBER_OF_POINTS).fill(-1),
          borderWidth: lineWidth,
          fill: fancyGraphs,
          backgroundColor: "rgba(128, 128, 128, 0.08)",
          borderColor: lineColor,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    },
    options: {
      animation: fancyGraphs,
      maintainAspectRatio: false,
      scales: clonesScales,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => msg("performance-clonecount-graph-tooltip", { clones: context.parsed.y }),
          },
        },
      },
    },
  });

  // Holds the times of each frame drawn in the last second.
  // The length of this list is effectively the FPS.
  const renderTimes = [];

  // The last time we pushed a new datapoint to the graph
  let lastFpsTime = now() + 3000;

  debug.addAfterStepCallback(() => {
    if (isPaused()) {
      return;
    }
    
    // Only run chart updates when the performance tab is visible
    if (!isVisible) {
      return;
    }
    
    const time = now();

    // Remove all frame times older than 1 second in renderTimes
    while (renderTimes.length > 0 && renderTimes[0] <= time - 1000) renderTimes.shift();
    renderTimes.push(time);

    if (time - lastFpsTime > 1000) {
      lastFpsTime = time;

      const maxFps = getMaxFps();
      const fpsData = fpsChart.data.datasets[0].data;
      fpsData.shift();
      fpsData.push(Math.min(renderTimes.length, maxFps));
      // Incase we switch between 30FPS and 60FPS, update the max height of the chart.
      fpsChart.options.scales.y.suggestedMax = maxFps;

      const clonesData = performanceClonesChart.data.datasets[0].data;
      clonesData.shift();
      clonesData.push(vm.runtime._cloneCounter);

      fpsElements.setValue(`${Math.min(renderTimes.length, maxFps)} / ${maxFps} FPS`);
      clonesElements.setValue(`${vm.runtime._cloneCounter}`);

      fpsChart.update();
      performanceClonesChart.update();
    }
  });

  content.appendChild(fpsElements.card);
  content.appendChild(clonesElements.card);

  let pauseTime = 0;
  onPauseChanged((paused) => {
    if (paused) {
      pauseTime = now();
    } else {
      const dt = now() - pauseTime;
      lastFpsTime += dt;
      for (var i = 0; i < renderTimes.length; i++) {
        renderTimes[i] += dt;
      }
    }
  });

  let isVisible = false;
  const show = () => {
    isVisible = true;
  };
  const hide = () => {
    isVisible = false;
  };

  return {
    tab,
    content,
    buttons: [],
    show,
    hide,
  };
}

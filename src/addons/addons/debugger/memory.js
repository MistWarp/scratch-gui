import { onPauseChanged, isPaused } from "./module.js";
import "../../libraries/thirdparty/cs/chart.min.js";

export default async function createMemoryTab({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  // In optimized graphs everything still looks good
  const fancyGraphs = addon.settings.get("fancy_graphs");
  const lineWidth = fancyGraphs ? 1 : 2;
  const lineColor = fancyGraphs ? "hsla(203, 85%, 40%, 0.5)" : "hsla(203, 85%, 40%, 1)";

  const tab = debug.createHeaderTab({
    text: msg("tab-memory"),
    icon: addon.self.getResource("/icons/memory.svg") /* rewritten by pull.js */,
  });

  const content = Object.assign(document.createElement("div"), {
    className: "sa-memory-tab-content",
  });

  const createChart = ({ title, unit = "" }) => {
    const titleElement = Object.assign(document.createElement("h2"), {
      textContent: title || "Chart",
    });
    const canvas = Object.assign(document.createElement("canvas"), {
      className: "sa-debugger-chart",
    });
    return {
      title: titleElement,
      canvas,
      unit,
    };
  };

  const createInfoCard = ({ title, value, unit = "", className = "" }) => {
    const card = Object.assign(document.createElement("div"), {
      className: `sa-memory-info-card ${className}`,
    });
    
    const titleElement = Object.assign(document.createElement("h3"), {
      textContent: title || "Info",
      className: "sa-memory-info-title",
    });
    
    const valueElement = Object.assign(document.createElement("div"), {
      textContent: `${value}${unit}`,
      className: "sa-memory-info-value",
    });
    
    card.appendChild(titleElement);
    card.appendChild(valueElement);
    
    return {
      element: card,
      updateValue: (newValue) => {
        valueElement.textContent = `${newValue}${unit}`;
      },
    };
  };

  const now = () => performance.now();
  const NUMBER_OF_POINTS = 20;
  const labels = Array.from(Array(NUMBER_OF_POINTS).keys()).reverse();

  // Create info cards section
  const infoSection = Object.assign(document.createElement("div"), {
    className: "sa-memory-info-section",
  });

  const clonesCard = createInfoCard({
    title: msg("memory-clones-current"),
    value: "0",
    className: "sa-memory-clones",
  });

  const variablesCard = createInfoCard({
    title: msg("memory-variables-total"),
    value: "0",
    className: "sa-memory-variables",
  });

  const variableDataCard = createInfoCard({
    title: msg("memory-variable-data-total"),
    value: "0",
    unit: " chars",
    className: "sa-memory-variable-data",
  });

  const listsCard = createInfoCard({
    title: msg("memory-lists-total"),
    value: "0",
    className: "sa-memory-lists",
  });

  const listItemsCard = createInfoCard({
    title: msg("memory-list-items-total"),
    value: "0",
    className: "sa-memory-list-items",
  });

  infoSection.appendChild(clonesCard.element);
  infoSection.appendChild(variablesCard.element);
  infoSection.appendChild(variableDataCard.element);
  infoSection.appendChild(listsCard.element);
  infoSection.appendChild(listItemsCard.element);

  // Variable data size over time chart
  const variableDataElements = createChart({
    title: msg("memory-variable-data-chart-title"),
  });
  const variableDataChart = new Chart(variableDataElements.canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: Array(NUMBER_OF_POINTS).fill(-1),
          borderWidth: lineWidth,
          fill: fancyGraphs,
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--control-primary') || "#ff6680",
          borderColor: lineColor,
        },
      ],
    },
    options: {
      animation: fancyGraphs,
      scales: {
        y: {
          suggestedMax: 1000,
          min: 0,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => msg("memory-variable-data-chart-tooltip", { chars: context.parsed.y }),
          },
        },
      },
    },
  });

  // List items count over time chart
  const listItemsElements = createChart({
    title: msg("memory-list-items-chart-title"),
  });
  const listItemsChart = new Chart(listItemsElements.canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: Array(NUMBER_OF_POINTS).fill(-1),
          borderWidth: lineWidth,
          fill: fancyGraphs,
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--data-primary') || "#ff8c1a",
          borderColor: lineColor,
        },
      ],
    },
    options: {
      animation: fancyGraphs,
      scales: {
        y: {
          suggestedMax: 1000,
          min: 0,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => msg("memory-list-items-chart-tooltip", { items: context.parsed.y }),
          },
        },
      },
    },
  });

  // Utility functions for memory tracking
  const getVariableCount = () => {
    let count = 0;
    for (const target of vm.runtime.targets) {
      if (!target.isOriginal) continue;
      const variableMap = target.variables;
      for (const variableId in variableMap) {
        const variable = variableMap[variableId];
        if (variable.type === '') count++;
      }
    }
    return count;
  };

  const getVariableDataSize = () => {
    let totalChars = 0;
    for (const target of vm.runtime.targets) {
      const variableMap = target.variables;
      for (const variableId in variableMap) {
        const variable = variableMap[variableId];
        if (variable.type === '') {
          const value = variable.value;
          if (typeof value === 'string') totalChars += value.length;
        }
      }
    }
    return totalChars;
  };

  const getListCount = () => {
    let count = 0;
    for (const target of vm.runtime.targets) {
      if (!target.isOriginal) continue;
      const variableMap = target.variables;
      for (const variableId in variableMap) {
        const variable = variableMap[variableId];
        if (variable.type === 'list') count++;
      }
    }
    return count;
  };

  const getListItemsCount = () => {
    let count = 0;
    for (const target of vm.runtime.targets) {
      const variableMap = target.variables;
      for (const variableId in variableMap) {
        const variable = variableMap[variableId];
        if (variable.type === 'list' && Array.isArray(variable.value)) count += variable.value.length;
      }
    }
    return count;
  };
  const updateMemoryInfo = () => {
    const cloneCount = vm.runtime._cloneCounter;
    const variableCount = getVariableCount();
    const variableDataSize = getVariableDataSize();
    const listCount = getListCount();
    const listItemsCount = getListItemsCount();

    clonesCard.updateValue(cloneCount);
    variablesCard.updateValue(variableCount);
    variableDataCard.updateValue(variableDataSize);
    listsCard.updateValue(listCount);
    listItemsCard.updateValue(listItemsCount);
    
    // Add visual warnings for high resource usage
    clonesCard.element.classList.toggle('sa-memory-warning', cloneCount > 250);
    clonesCard.element.classList.toggle('sa-memory-critical', cloneCount >= 300);

    variablesCard.element.classList.toggle('sa-memory-warning', variableCount > 500);
    variablesCard.element.classList.toggle('sa-memory-critical', variableCount > 1000);
    
    listItemsCard.element.classList.toggle('sa-memory-warning', listItemsCount > 5000);
    listItemsCard.element.classList.toggle('sa-memory-critical', listItemsCount > 10000);

    return {
      cloneCount,
      variableCount,
      variableDataSize,
      listItemsCount,
    };
  };

  // The last time we pushed a new datapoint to the graph
  let lastMemoryTime = now() + 3000;

  debug.addAfterStepCallback(() => {
    if (isPaused()) {
      return;
    }
    
    // Only run expensive operations when the memory tab is visible
    if (!isVisible) {
      return;
    }
    
    const time = now();

    if (time - lastMemoryTime > 1000) {
      lastMemoryTime = time;

      const memoryData = updateMemoryInfo();

      // Update variable data chart
      const variableDataData = variableDataChart.data.datasets[0].data;
      variableDataData.shift();
      variableDataData.push(memoryData.variableDataSize);

      // Update list items chart
      const listItemsData = listItemsChart.data.datasets[0].data;
      listItemsData.shift();
      listItemsData.push(memoryData.listItemsCount);

      // Auto-scale charts based on data
      const maxVariableData = Math.max(...variableDataData.filter(x => x >= 0));
      variableDataChart.options.scales.y.suggestedMax = Math.max(1000, maxVariableData * 1.2);

      const maxListItems = Math.max(...listItemsData.filter(x => x >= 0));
      listItemsChart.options.scales.y.suggestedMax = Math.max(1000, maxListItems * 1.2);

      variableDataChart.update();
      listItemsChart.update();
    } else {
      // Still update the info cards more frequently for real-time feedback
      updateMemoryInfo();
    }
  });

  // Add clear button for memory statistics
  const clearButton = debug.createHeaderButton({
    text: msg("memory-clear-charts"),
    icon: addon.self.getResource("/icons/clear.svg") /* rewritten by pull.js */,
  });
  clearButton.element.classList.add("sa-memory-clear-button");
  clearButton.element.addEventListener("click", () => {
    // Clear all chart data
    variableDataChart.data.datasets[0].data.fill(-1);
    listItemsChart.data.datasets[0].data.fill(-1);
    
    if (isVisible) {
      variableDataChart.update();
      listItemsChart.update();
    }
  });

  // Build the content
  content.appendChild(infoSection);
  content.appendChild(variableDataElements.title);
  content.appendChild(variableDataElements.canvas);
  content.appendChild(listItemsElements.title);
  content.appendChild(listItemsElements.canvas);

  let pauseTime = 0;
  onPauseChanged((paused) => {
    if (paused) {
      pauseTime = now();
    } else {
      const dt = now() - pauseTime;
      lastMemoryTime += dt;
    }
  });

  let isVisible = false;
  const show = () => {
    isVisible = true;
    updateMemoryInfo(); // Immediate update when tab becomes visible
  };
  const hide = () => {
    isVisible = false;
  };

  return {
    tab,
    content,
    buttons: [clearButton],
    show,
    hide,
  };
}

export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  let localVariables = [];
  let globalVariables = [];
  let preventUpdate = false;
  let updateScheduled = false;
  let lastUpdateTime = 0;
  const UPDATE_THROTTLE = 100; // ms
  let variableManagerVisible = false;

  // Create the Variable Manager interface
  const manager = document.createElement("div");
  manager.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-var-manager");

  // Create header with search and controls
  const header = document.createElement("div");
  header.className = "sa-var-manager-header";

  const searchContainer = document.createElement("div");
  searchContainer.className = "sa-var-manager-search-container";

  const searchBox = document.createElement("input");
  searchBox.placeholder = msg("search");
  searchBox.className = addon.tab.scratchClass("input_input-form", { others: "sa-var-manager-searchbox" });
  searchBox.type = "text";

  const clearSearchBtn = document.createElement("button");
  clearSearchBtn.className = "sa-var-manager-clear-search";
  clearSearchBtn.innerHTML = "×";
  clearSearchBtn.title = "Clear search";
  clearSearchBtn.style.display = "none";

  // Improved search with debouncing
  let searchTimeout;
  const performSearch = (searchTerm) => {
    for (const variable of localVariables) {
      variable.handleSearch(searchTerm);
    }
    for (const variable of globalVariables) {
      variable.handleSearch(searchTerm);
    }
    updateHeadingVisibility();
    clearSearchBtn.style.display = searchTerm ? "block" : "none";
  };

  searchBox.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 150);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchBox.value = "";
    performSearch("");
    searchBox.focus();
  });

  searchContainer.appendChild(searchBox);
  searchContainer.appendChild(clearSearchBtn);
  header.appendChild(searchContainer);

  const statsContainer = document.createElement("div");
  statsContainer.className = "sa-var-manager-stats";
  header.appendChild(statsContainer);

  manager.appendChild(header);

  const localVars = document.createElement("div");
  localVars.className = "sa-var-manager-section";
  const localHeading = document.createElement("div");
  const localList = document.createElement("table");
  localHeading.className = "sa-var-manager-heading";
  localHeading.innerHTML = `
    <span>${msg("for-this-sprite")}</span>
    <span class="sa-var-manager-count" data-section="local">0</span>
  `;
  localList.className = "sa-var-manager-table";
  localVars.appendChild(localHeading);
  localVars.appendChild(localList);

  const globalVars = document.createElement("div");
  globalVars.className = "sa-var-manager-section";
  const globalHeading = document.createElement("div");
  const globalList = document.createElement("table");
  globalHeading.className = "sa-var-manager-heading";
  globalHeading.innerHTML = `
    <span>${msg("for-all-sprites")}</span>
    <span class="sa-var-manager-count" data-section="global">0</span>
  `;
  globalList.className = "sa-var-manager-table";
  globalVars.appendChild(globalHeading);
  globalVars.appendChild(globalList);

  const content = document.createElement("div");
  content.className = "sa-var-manager-content";
  content.appendChild(localVars);
  content.appendChild(globalVars);
  manager.appendChild(content);

  // Enhanced heading visibility with counts
  function updateHeadingVisibility() {
    let filteredLocals = localVariables.filter((v) => v.row.style.display !== "none");
    let filteredGlobals = globalVariables.filter((v) => v.row.style.display !== "none");
    
    localHeading.style.display = filteredLocals.length === 0 ? "none" : "";
    globalHeading.style.display = filteredGlobals.length === 0 ? "none" : "";
    
    // Update counts
    const localCount = document.querySelector('[data-section="local"]');
    const globalCount = document.querySelector('[data-section="global"]');
    if (localCount) localCount.textContent = filteredLocals.length;
    if (globalCount) globalCount.textContent = filteredGlobals.length;
    
    // Update stats
    updateStats();
  }

  function updateStats() {
    const totalVars = localVariables.length + globalVariables.length;
    const totalLists = localVariables.filter(v => v.scratchVariable.type === "list").length + 
                      globalVariables.filter(v => v.scratchVariable.type === "list").length;
    
    statsContainer.innerHTML = `
      <span>Variables: ${totalVars - totalLists}</span>
      <span>Lists: ${totalLists}</span>
    `;
  }

  const rowToVariableMap = new WeakMap();
  const observer = new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        const variable = rowToVariableMap.get(change.target);
        variable?.setVisible(change.isIntersecting);
      }
    },
    {
      rootMargin: "100px",
    }
  );

  // Add keyboard shortcut to open variable manager
  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+V to open variable manager
      if (e.ctrlKey && e.shiftKey && e.key === 'V' && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        toggleVariableManager();
      }
    });
  }

  function toggleVariableManager() {
    if (variableManagerVisible) {
      hideVariableManager();
    } else {
      showVariableManager();
    }
  }

  function showVariableManager() {
    // Create modal-like overlay
    if (document.querySelector('.sa-var-manager-overlay')) return;
    
    const overlay = document.createElement("div");
    overlay.className = "sa-var-manager-overlay";
    
    const modal = document.createElement("div");
    modal.className = "sa-var-manager-modal";
    
    // Position next to debugger if it exists
    const debuggerEl = document.querySelector('.sa-debugger-interface, [class*="debugger"]');
    if (debuggerEl) {
      const debuggerRect = debuggerEl.getBoundingClientRect();
      modal.style.top = debuggerRect.top + 'px';
      modal.style.right = (window.innerWidth - debuggerRect.left + 10) + 'px';
    }
    
    const header = document.createElement("div");
    header.className = "sa-var-manager-modal-header";
    
    const title = document.createElement("h2");
    title.textContent = msg("variables");
    title.className = "sa-var-manager-modal-title";
    
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.className = "sa-var-manager-close-btn";
    closeBtn.addEventListener("click", hideVariableManager);
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(manager);
    
    // Add resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "sa-var-manager-resize-handle";
    modal.appendChild(resizeHandle);
    
    overlay.appendChild(modal);
    
    // Make draggable
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener("mousedown", (e) => {
      if (e.target === closeBtn) return;
      isDragging = true;
      dragOffset.x = e.clientX - modal.offsetLeft;
      dragOffset.y = e.clientY - modal.offsetTop;
      modal.style.position = "fixed";
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", stopDrag);
      e.preventDefault();
    });
    
    function handleDrag(e) {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - modal.offsetWidth;
      const maxY = window.innerHeight - modal.offsetHeight;
      
      modal.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      modal.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      modal.style.right = 'auto';
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
    }
    
    // Make resizable
    let isResizing = false;
    let startSize = { width: 0, height: 0 };
    let startMouse = { x: 0, y: 0 };
    
    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      startSize.width = parseInt(window.getComputedStyle(modal).width);
      startSize.height = parseInt(window.getComputedStyle(modal).height);
      startMouse.x = e.clientX;
      startMouse.y = e.clientY;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      e.preventDefault();
    });
    
    function handleResize(e) {
      if (!isResizing) return;
      const newWidth = startSize.width + (e.clientX - startMouse.x);
      const newHeight = startSize.height + (e.clientY - startMouse.y);
      
      modal.style.width = Math.max(300, Math.min(newWidth, 800)) + 'px';
      modal.style.height = Math.max(300, Math.min(newHeight, window.innerHeight * 0.8)) + 'px';
    }
    
    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    }
    
    // Close on Escape key
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        hideVariableManager();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);
    
    document.body.appendChild(overlay);
    variableManagerVisible = true;
    fullReload();
  }

  function hideVariableManager() {
    const overlay = document.querySelector('.sa-var-manager-overlay');
    if (overlay) {
      overlay.remove();
      variableManagerVisible = false;
      cleanup();
    }
  }

  class WrappedVariable {
    constructor(scratchVariable, target) {
      this.scratchVariable = scratchVariable;
      this.target = target;
      this.visible = false;
      this.ignoreTooBig = false;
      this.lastValue = null;
      this.buildDOM();
    }

    updateValue(force) {
      if (!this.visible && !force) return;

      let newValue;
      let maxSafeLength;
      if (this.scratchVariable.type === "list") {
        newValue = this.scratchVariable.value.join("\n");
        maxSafeLength = 5000000;
      } else {
        newValue = this.scratchVariable.value;
        maxSafeLength = 1000000;
      }

      // Performance: only update if value actually changed
      if (!force && this.lastValue === newValue) return;
      this.lastValue = newValue;

      if (!this.ignoreTooBig && newValue.length > maxSafeLength) {
        this.input.value = "";
        this.row.dataset.tooBig = true;
        return;
      }

      this.row.dataset.tooBig = false;
      if (newValue !== this.input.value) {
        this.input.disabled = false;
        this.input.value = newValue;
        
        // Update visual indicators
        this.updateVisualState();
      }
    }

    updateVisualState() {
      // Add visual indicators for variable types
      this.row.dataset.variableType = this.scratchVariable.type || "variable";
      this.row.dataset.isCloud = this.scratchVariable.isCloud || false;
      
      if (this.scratchVariable.type === "list") {
        const itemCount = Array.isArray(this.scratchVariable.value) ? this.scratchVariable.value.length : 0;
        this.row.dataset.listItems = itemCount;
      }
    }

    handleSearch(search) {
      if (!search) {
        this.row.style.display = "";
        this.updateValue(true);
        return;
      }
      
      const searchLower = search.toLowerCase();
      const nameMatches = this.scratchVariable.name.toLowerCase().includes(searchLower);
      const valueMatches = this.scratchVariable.value.toString().toLowerCase().includes(searchLower);
      
      if (nameMatches || valueMatches) {
        this.row.style.display = "";
        this.updateValue(true);
      } else {
        this.row.style.display = "none";
      }
    }

    resizeInputIfList() {
      if (this.scratchVariable.type === "list") {
        this.input.style.height = "auto";
        const height = Math.min(1000, this.input.scrollHeight);
        if (height > 0) {
          this.input.style.height = height + "px";
        }
      }
    }

    setVisible(visible) {
      if (this.visible === visible) return;
      this.visible = visible;
      if (visible) {
        this.updateValue();
      }
    }

    buildDOM() {
      const id = `sa-variable-manager-${this.scratchVariable.id}`;

      const row = document.createElement("tr");
      this.row = row;
      row.className = "sa-var-manager-row";
      
      const labelCell = document.createElement("td");
      labelCell.className = "sa-var-manager-name";

      // Enhanced label with icon and type indicator
      const labelContainer = document.createElement("div");
      labelContainer.className = "sa-var-manager-label-container";

      const typeIcon = document.createElement("span");
      typeIcon.className = "sa-var-manager-type-icon";
      typeIcon.textContent = this.scratchVariable.type === "list" ? "📋" : 
                           this.scratchVariable.isCloud ? "☁️" : "📝";

      const label = document.createElement("input");
      label.value = this.scratchVariable.name;
      label.className = "sa-var-manager-name-input";
      label.htmlFor = id;
      
      const onLabelOut = (e) => {
        e.preventDefault();
        const workspace = Blockly.getMainWorkspace();

        let newName = label.value.trim();
        if (newName === this.scratchVariable.name) {
          return;
        }

        const CLOUD_SYMBOL = "☁";
        const CLOUD_PREFIX = CLOUD_SYMBOL + " ";
        if (this.scratchVariable.isCloud) {
          if (newName.startsWith(CLOUD_SYMBOL)) {
            if (!newName.startsWith(CLOUD_PREFIX)) {
              newName = newName.substring(0, 1) + " " + newName.substring(1);
            }
          } else {
            newName = CLOUD_PREFIX + newName;
          }
        }

        let nameAlreadyUsed = false;
        if (this.target.isStage) {
          const existingNames = vm.runtime.getAllVarNamesOfType(this.scratchVariable.type);
          nameAlreadyUsed = existingNames.includes(newName);
        } else {
          nameAlreadyUsed = !!workspace.getVariable(newName, this.scratchVariable.type);
        }

        const isEmpty = !newName.trim();
        if (isEmpty || nameAlreadyUsed) {
          label.value = this.scratchVariable.name;
          // Show error feedback
          label.classList.add("sa-var-manager-error");
          setTimeout(() => label.classList.remove("sa-var-manager-error"), 1000);
        } else {
          workspace.renameVariableById(this.scratchVariable.id, newName);
          if (label.value !== newName) {
            label.value = newName;
          }
        }
      };

      label.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          label.value = this.scratchVariable.name;
          e.target.blur();
        }
      });
      label.addEventListener("focusout", onLabelOut);

      label.addEventListener("focus", (e) => {
        preventUpdate = true;
        manager.classList.add("freeze");
      });

      label.addEventListener("blur", (e) => {
        preventUpdate = false;
        manager.classList.remove("freeze");
      });

      labelContainer.appendChild(typeIcon);
      labelContainer.appendChild(label);
      labelCell.appendChild(labelContainer);

      rowToVariableMap.set(row, this);
      observer.observe(row);

      const valueCell = document.createElement("td");
      valueCell.className = "sa-var-manager-value";

      const tooBigElement = document.createElement("button");
      this.tooBigElement = tooBigElement;
      tooBigElement.textContent = msg("too-big");
      tooBigElement.className = "sa-var-manager-too-big";
      tooBigElement.addEventListener("click", () => {
        this.ignoreTooBig = true;
        this.updateValue(true);
      });

      let input;
      if (this.scratchVariable.type === "list") {
        input = document.createElement("textarea");
        input.placeholder = "Enter list items (one per line)";
      } else {
        input = document.createElement("input");
        input.placeholder = "Enter value";
      }
      input.className = "sa-var-manager-value-input";
      input.id = id;
      this.input = input;

      this.updateValue(true);
      this.updateVisualState();
      
      if (this.scratchVariable.type === "list") {
        this.input.addEventListener("input", () => this.resizeInputIfList(), false);
      }

      const onInputOut = (e) => {
        e.preventDefault();
        try {
          if (this.scratchVariable.type === "list") {
            const newValue = input.value.split("\n");
            vm.setVariableValue(this.target.id, this.scratchVariable.id, newValue);
          } else {
            vm.setVariableValue(this.target.id, this.scratchVariable.id, input.value);
          }
          input.classList.remove("sa-var-manager-error");
        } catch (error) {
          console.error("Error setting variable value:", error);
          input.classList.add("sa-var-manager-error");
          setTimeout(() => input.classList.remove("sa-var-manager-error"), 1000);
        }
        input.blur();
      };

      input.addEventListener("keydown", (e) => {
        if (e.target.nodeName === "INPUT" && e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          this.updateValue(true);
          e.target.blur();
        }
      });
      input.addEventListener("focusout", onInputOut);

      input.addEventListener("focus", (e) => {
        preventUpdate = true;
        manager.classList.add("freeze");
      });

      input.addEventListener("blur", (e) => {
        preventUpdate = false;
        manager.classList.remove("freeze");
      });

      valueCell.appendChild(input);
      valueCell.appendChild(tooBigElement);
      row.appendChild(labelCell);
      row.appendChild(valueCell);

      this.handleSearch(searchBox.value);
    }
  }

  // Improved performance with throttling and batch updates
  function scheduleUpdate() {
    if (updateScheduled) return;
    if (!variableManagerVisible || preventUpdate) return;
    
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
  }

  function fullReload() {
    if (!variableManagerVisible || preventUpdate) return;

    const editingTarget = vm.runtime.getEditingTarget();
    const stage = vm.runtime.getTargetForStage();
    
    // Clean up old observers
    for (const variable of [...localVariables, ...globalVariables]) {
      observer.unobserve(variable.row);
    }
    
    localVariables = editingTarget.isStage
      ? []
      : Object.values(editingTarget.variables)
          .filter((i) => i.type === "" || i.type === "list")
          .map((i) => new WrappedVariable(i, editingTarget));
    globalVariables = Object.values(stage.variables)
      .filter((i) => i.type === "" || i.type === "list")
      .map((i) => new WrappedVariable(i, stage));

    updateHeadingVisibility();

    // Use DocumentFragment for batch DOM operations
    const localFragment = document.createDocumentFragment();
    const globalFragment = document.createDocumentFragment();

    while (localList.firstChild) {
      localList.removeChild(localList.firstChild);
    }
    while (globalList.firstChild) {
      globalList.removeChild(globalList.firstChild);
    }

    for (const variable of localVariables) {
      localFragment.appendChild(variable.row);
      variable.resizeInputIfList();
    }
    for (const variable of globalVariables) {
      globalFragment.appendChild(variable.row);
      variable.resizeInputIfList();
    }
    
    localList.appendChild(localFragment);
    globalList.appendChild(globalFragment);
  }

  function quickReload() {
    if (!variableManagerVisible || preventUpdate) return;

    for (const variable of localVariables) {
      variable.updateValue();
    }
    for (const variable of globalVariables) {
      variable.updateValue();
    }
  }

  function cleanup() {
    localVariables = [];
    globalVariables = [];
    
    // Clean up observers
    for (const variable of [...localVariables, ...globalVariables]) {
      if (variable.row) {
        observer.unobserve(variable.row);
      }
    }
  }

  // Keyboard shortcuts
  const handleKeyboardShortcuts = (e) => {
    // Only handle shortcuts when variable manager is visible
    if (!variableManagerVisible) return;
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchBox.focus();
      searchBox.select();
    }
    
    // Escape to clear search or close modal
    if (e.key === 'Escape') {
      if (document.activeElement === searchBox && searchBox.value) {
        clearSearchBtn.click();
      } else {
        hideVariableManager();
      }
    }
  };

  document.addEventListener('keydown', handleKeyboardShortcuts);

  // Cleanup on addon disable
  addon.self.addEventListener("disabled", () => {
    document.removeEventListener('keydown', handleKeyboardShortcuts);
    hideVariableManager();
    removeStepHook();
    cleanup();
  });

  addon.tab.redux.initialize();

  // Improved event handling with throttling
  vm.runtime.on("PROJECT_LOADED", () => {
    try {
      if (variableManagerVisible) fullReload();
    } catch (e) {
      console.error(e);
    }
  });
  
  vm.runtime.on("TOOLBOX_EXTENSIONS_NEED_UPDATE", () => {
    try {
      if (variableManagerVisible) fullReload();
    } catch (e) {
      console.error(e);
    }
  });

  // Replace inefficient runtime step hook with more targeted events
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

  const removeStepHook = () => {
    stepHookInstalled = false;
    // Note: We can't easily restore the original _step function,
    // but the scheduleUpdate will handle inactive tabs gracefully
  };

  addon.self.addEventListener("reenabled", () => {
    installStepHook();
  });

  // Initialize step hook
  installStepHook();

  // Create the Variable Manager button in the stage header
  const variableManagerButtonOuter = document.createElement("div");
  variableManagerButtonOuter.className = "sa-variable-manager-container";
  const variableManagerButton = document.createElement("div");
  variableManagerButton.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const variableManagerButtonContent = document.createElement("div");
  variableManagerButtonContent.className = addon.tab.scratchClass("button_content");
  const variableManagerButtonImage = document.createElement("img");
  variableManagerButtonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  variableManagerButtonImage.draggable = false;
  variableManagerButtonImage.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgNEgxN1Y2SDNWNFpNMyA5SDE3VjExSDNWOVpNMyAxNEgxN1YxNkgzVjE0WiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPgo=";
  variableManagerButtonContent.appendChild(variableManagerButtonImage);
  variableManagerButton.appendChild(variableManagerButtonContent);
  variableManagerButtonOuter.appendChild(variableManagerButton);
  variableManagerButton.addEventListener("click", () => toggleVariableManager());

  // Add keyboard shortcut (Ctrl+Shift+V)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "V" && !e.repeat) {
      e.preventDefault();
      toggleVariableManager();
    }
  });

  // Wait for the stage header to load and add our button next to the debugger
  while (true) {
    const stageHeader = await addon.tab.waitForElement(
      '[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]',
      {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "scratch-gui/mode/SET_FULL_SCREEN",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      }
    );
    
    if (addon.tab.editorMode === "editor") {
      // Add next to debugger with order 1 (debugger uses order 0)
      addon.tab.appendToSharedSpace({ 
        space: "stageHeader", 
        element: variableManagerButtonOuter, 
        order: 1 
      });
    } else {
      variableManagerButtonOuter.remove();
      hideVariableManager();
    }
  }
}

import icon from './icon.svg';
import WindowManager from '../../window-system/window-manager.js';

export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  let localVariables = [];
  let globalVariables = [];
  let preventUpdate = false;
  let updateScheduled = false;
  let lastUpdateTime = 0;
  const UPDATE_THROTTLE = 50; // Reduced for better responsiveness
  let variableManagerWindow = null;
  let currentFilter = '';
  let selectedVariable = null; // For keyboard navigation
  let variableGroups = new Map(); // For grouping variables by type

  // Create the Variable Manager interface
  const manager = document.createElement("div");
  manager.className = "sa-var-manager";
  manager.setAttribute('role', 'main');
  manager.setAttribute('aria-label', 'Variable Manager');
  manager.setAttribute('tabindex', '-1');

  // Create header with search and controls
  const header = document.createElement("div");
  header.className = "sa-var-manager-header";

  const searchContainer = document.createElement("div");
  searchContainer.className = "sa-var-manager-search-container";

  const searchBox = document.createElement("input");
  searchBox.placeholder = msg("search") + " (Ctrl+F)";
  searchBox.className = addon.tab.scratchClass("input_input-form", { others: "sa-var-manager-searchbox" });
  searchBox.type = "text";
  searchBox.setAttribute('aria-label', 'Search variables and lists');

  const clearSearchBtn = document.createElement("button");
  clearSearchBtn.className = "sa-var-manager-clear-search";
  clearSearchBtn.innerHTML = "×";
  clearSearchBtn.title = "Clear search (Escape)";
  clearSearchBtn.style.display = "none";
  clearSearchBtn.setAttribute('aria-label', 'Clear search');

  // Enhanced search with debouncing and better performance
  let searchTimeout;
  const performSearch = (searchTerm) => {
    currentFilter = searchTerm.toLowerCase();
    
    // Batch DOM updates
    requestAnimationFrame(() => {
      for (const variable of localVariables) {
        variable.handleSearch(currentFilter);
      }
      for (const variable of globalVariables) {
        variable.handleSearch(currentFilter);
      }
      updateHeadingVisibility();
      clearSearchBtn.style.display = searchTerm ? "flex" : "none";
      
      // Update accessibility
      const resultsCount = getVisibleVariableCount();
      searchBox.setAttribute('aria-describedby', 'search-results');
      if (!document.getElementById('search-results')) {
        const resultsAnnouncer = document.createElement('div');
        resultsAnnouncer.id = 'search-results';
        resultsAnnouncer.setAttribute('aria-live', 'polite');
        resultsAnnouncer.style.position = 'absolute';
        resultsAnnouncer.style.left = '-10000px';
        manager.appendChild(resultsAnnouncer);
      }
      document.getElementById('search-results').textContent = 
        `Found ${resultsCount} variables matching "${searchTerm}"`;
    });
  };

  // Optimized search with better debouncing
  searchBox.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 100);
  });

  clearSearchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    searchBox.value = "";
    performSearch("");
    searchBox.focus();
  });

  // Add keyboard shortcuts for search
  searchBox.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (searchBox.value) {
        clearSearchBtn.click();
      } else {
        hideVariableManager();
      }
      e.preventDefault();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusFirstVisibleVariable();
    }
  });

  searchContainer.appendChild(searchBox);
  searchContainer.appendChild(clearSearchBtn);
  header.appendChild(searchContainer);

  // Enhanced stats display with better formatting
  const statsContainer = document.createElement("div");
  statsContainer.className = "sa-var-manager-stats";
  statsContainer.setAttribute('aria-live', 'polite');
  header.appendChild(statsContainer);

  manager.appendChild(header);

  // Helper functions for better UX
  function getVisibleVariableCount() {
    const visibleLocal = localVariables.filter(v => v.row.style.display !== "none");
    const visibleGlobal = globalVariables.filter(v => v.row.style.display !== "none");
    return visibleLocal.length + visibleGlobal.length;
  }

  function focusFirstVisibleVariable() {
    const allVariables = [...localVariables, ...globalVariables];
    const firstVisible = allVariables.find(v => v.row.style.display !== "none");
    if (firstVisible && firstVisible.input) {
      firstVisible.input.focus();
      selectedVariable = firstVisible;
    }
  }

  function announceVariableChange(variableName, oldValue, newValue) {
    // Create accessible announcements for variable changes
    if (!document.getElementById('variable-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'variable-announcer';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      manager.appendChild(announcer);
    }
    const announcer = document.getElementById('variable-announcer');
    announcer.textContent = `${variableName} changed from ${oldValue} to ${newValue}`;
  }

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
    if (variableManagerWindow && variableManagerWindow.isVisible) {
      hideVariableManager();
    } else {
      showVariableManager();
    }
  }

  function showVariableManager() {
    if (variableManagerWindow) {
      variableManagerWindow.show().bringToFront();
      return;
    }
    
    // Create window using window system
    variableManagerWindow = WindowManager.createWindow({
      id: 'variable-manager',
      title: msg("variables"),
      width: 450,
      height: 550,
      minWidth: 380,
      minHeight: 320,
      maxWidth: 1200,
      maxHeight: 900,
      className: 'sa-variable-manager-window',
      onClose: () => {
        variableManagerWindow = null;
        cleanup();
      },
      onResize: () => {
        // Trigger resize event for internal components
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
        });
      }
    });
    
    // Position near debugger if it exists
    const debuggerEl = document.querySelector('.sa-debugger-interface, [class*="debugger"]');
    if (debuggerEl) {
      const debuggerRect = debuggerEl.getBoundingClientRect();
      const modalWidth = 450;
      
      // Check if there's space to the left of debugger
      if (debuggerRect.left > modalWidth + 20) {
        variableManagerWindow.x = Math.max(10, debuggerRect.left - modalWidth - 10);
        variableManagerWindow.y = Math.max(10, debuggerRect.top);
      } else {
        // Position to the right
        variableManagerWindow.x = Math.min(window.innerWidth - modalWidth - 20, debuggerRect.right + 10);
        variableManagerWindow.y = Math.max(10, debuggerRect.top);
      }
      
      variableManagerWindow.element.style.left = `${variableManagerWindow.x}px`;
      variableManagerWindow.element.style.top = `${variableManagerWindow.y}px`;
    }
    
    // Set the content to our manager element
    variableManagerWindow.setContent(manager);
    
    // Show the window
    variableManagerWindow.show();
    
    // Enhanced positioning logic
    const positionModal = () => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Set consistent positioning mode
      modal.style.position = "fixed";
      modal.style.transform = "none";
      modal.style.right = "auto";
      modal.style.bottom = "auto";
      
      // Try to position next to debugger if it exists
      const debuggerEl = document.querySelector('.sa-debugger-interface, [class*="debugger"]');
      if (debuggerEl) {
        const debuggerRect = debuggerEl.getBoundingClientRect();
        const modalWidth = 450; // Default width
        const modalHeight = 550; // Default height
        
        // Check if there's space to the left of debugger
        if (debuggerRect.left > modalWidth + 20) {
          modal.style.top = Math.max(10, debuggerRect.top) + 'px';
          modal.style.left = Math.max(10, debuggerRect.left - modalWidth - 10) + 'px';
        } else {
          // Position to the right
          modal.style.top = Math.max(10, debuggerRect.top) + 'px';
          modal.style.left = Math.min(viewport.width - modalWidth - 20, debuggerRect.right + 10) + 'px';
        }
      } else {
        // Position in top-right area if no debugger
        const modalWidth = 450;
        modal.style.top = '80px';
        modal.style.left = Math.max(20, viewport.width - modalWidth - 20) + 'px';
      }
      
      // Final bounds check to ensure it's fully visible
      setTimeout(() => {
        const modalRect = modal.getBoundingClientRect();
        let newLeft = parseInt(modal.style.left);
        let newTop = parseInt(modal.style.top);
        
        if (modalRect.right > viewport.width - 10) {
          newLeft = viewport.width - modalRect.width - 10;
        }
        if (modalRect.bottom > viewport.height - 10) {
          newTop = viewport.height - modalRect.height - 10;
        }
        if (newLeft < 10) newLeft = 10;
        if (newTop < 10) newTop = 10;
        
        modal.style.left = newLeft + 'px';
        modal.style.top = newTop + 'px';
      }, 0);
    };
    
    const header = document.createElement("div");
    header.className = "sa-var-manager-modal-header";
    
    const title = document.createElement("h2");
    title.textContent = msg("variables");
    title.className = "sa-var-manager-modal-title";
    
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.className = "sa-var-manager-close-btn";
    closeBtn.setAttribute('aria-label', 'Close Variable Manager');
    closeBtn.addEventListener("click", hideVariableManager);
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(manager);
    
    // Add resize handle
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "sa-var-manager-resize-handle";
    resizeHandle.setAttribute('aria-label', 'Resize Variable Manager');
    modal.appendChild(resizeHandle);
    
    overlay.appendChild(modal);
    
    // Position the modal after adding to DOM
    document.body.appendChild(overlay);
    positionModal();
    
    // Reposition on window resize (but not during manual resize)
    const handleWindowResize = () => {
      if (!isResizing) {
        positionModal();
      }
    };
    window.addEventListener('resize', handleWindowResize);
    
    // Enhanced dragging functionality
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener("mousedown", (e) => {
      if (e.target === closeBtn) return;
      isDragging = true;
      
      // Get current computed position
      const rect = modal.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      // Ensure consistent positioning
      modal.style.position = "fixed";
      modal.style.transform = "none";
      modal.style.right = "auto";
      modal.style.bottom = "auto";
      modal.style.left = rect.left + 'px';
      modal.style.top = rect.top + 'px';
      
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", stopDrag);
      e.preventDefault();
      
      // Add visual feedback
      modal.style.cursor = "grabbing";
      header.style.cursor = "grabbing";
    });
    
    function handleDrag(e) {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds with some padding
      const padding = 10;
      const maxX = window.innerWidth - modal.offsetWidth - padding;
      const maxY = window.innerHeight - modal.offsetHeight - padding;
      
      modal.style.left = Math.max(padding, Math.min(newX, maxX)) + 'px';
      modal.style.top = Math.max(padding, Math.min(newY, maxY)) + 'px';
      modal.style.right = 'auto';
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
      
      // Remove visual feedback
      modal.style.cursor = "";
      header.style.cursor = "grab";
    }
    
    // Enhanced resizing functionality with proper minimum width
    let isResizing = false;
    let startSize = { width: 0, height: 0 };
    let startPosition = { left: 0, top: 0 };
    let startMouse = { x: 0, y: 0 };
    
    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isResizing = true;
      
      // First ensure consistent positioning mode
      modal.style.position = "fixed";
      modal.style.transform = "none";
      modal.style.right = "auto";
      modal.style.bottom = "auto";
      
      // Capture the CURRENT actual position from computed styles
      const computedStyle = window.getComputedStyle(modal);
      const modalRect = modal.getBoundingClientRect();
      
      startSize.width = modalRect.width;
      startSize.height = modalRect.height;
      
      // Use the current computed left/top values, or fallback to getBoundingClientRect
      const currentLeft = parseInt(computedStyle.left) || modalRect.left;
      const currentTop = parseInt(computedStyle.top) || modalRect.top;
      
      startPosition.left = currentLeft;
      startPosition.top = currentTop;
      startMouse.x = e.clientX;
      startMouse.y = e.clientY;
      
      // Explicitly set the current position to lock it in place
      modal.style.left = startPosition.left + 'px';
      modal.style.top = startPosition.top + 'px';
      
      console.log('Resize start - Position:', startPosition.left, startPosition.top);
      
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      
      // Add visual feedback
      document.body.style.cursor = "nw-resize";
      document.body.style.userSelect = "none";
      resizeHandle.style.opacity = "1";
    });
    
    function handleResize(e) {
      if (!isResizing) return;
      
      e.preventDefault();
      
      const deltaX = e.clientX - startMouse.x;
      const deltaY = e.clientY - startMouse.y;
      
      const newWidth = startSize.width + deltaX;
      const newHeight = startSize.height + deltaY;
      
      // Enhanced constraints with better minimum width
      const minWidth = 380; // Increased minimum width for better usability
      const minHeight = 320; // Slightly increased minimum height
      const maxWidth = Math.min(1200, window.innerWidth - 40);
      const maxHeight = Math.min(window.innerHeight - 40, 900);
      
      const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      
      // Apply size changes without moving the modal
      modal.style.width = constrainedWidth + 'px';
      modal.style.height = constrainedHeight + 'px';
      
      // Keep the exact starting position - don't move the modal during resize
      modal.style.left = startPosition.left + 'px';
      modal.style.top = startPosition.top + 'px';
      
      // Debug: log current position to see if something else is changing it
      console.log('Resizing - Setting position to:', startPosition.left, startPosition.top, 'Actual position:', modal.style.left, modal.style.top);
      
      // Trigger a resize event for any internal components that need to adjust
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }
    
    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      
      // Final clamp to ensure size constraints are respected
      const currentRect = modal.getBoundingClientRect();
      const minWidth = 380;
      const minHeight = 320;
      const maxWidth = Math.min(1200, window.innerWidth - 40);
      const maxHeight = Math.min(window.innerHeight - 40, 900);
      
      const finalWidth = Math.max(minWidth, Math.min(currentRect.width, maxWidth));
      const finalHeight = Math.max(minHeight, Math.min(currentRect.height, maxHeight));
      
      // Apply final size constraints
      modal.style.width = finalWidth + 'px';
      modal.style.height = finalHeight + 'px';
      
      // Ensure position is still maintained after final size adjustment
      modal.style.left = startPosition.left + 'px';
      modal.style.top = startPosition.top + 'px';
      
      // Remove visual feedback
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      resizeHandle.style.opacity = "";
      
      console.log('Resize ended - Final size:', finalWidth, finalHeight, 'Position:', startPosition.left, startPosition.top);
    }
    
    // Enhanced escape key handling with better UX
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        // If search has content, clear it first
        if (searchBox.value) {
          searchBox.value = "";
          performSearch("");
          searchBox.focus();
        } else {
          hideVariableManager();
        }
        e.preventDefault();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    
    // Add global keyboard shortcuts for better UX
    const modalKeyHandler = (e) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchBox.focus();
        searchBox.select();
        return;
      }
      
      // Arrow keys for navigation between variables
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.classList.contains('sa-var-manager-name-input') || 
                             activeElement.classList.contains('sa-var-manager-value-input'))) {
          e.preventDefault();
          navigateVariables(e.key === 'ArrowDown' ? 1 : -1);
        }
      }
      
      // Tab for better navigation
      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
          'input, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    function navigateVariables(direction) {
      const allInputs = Array.from(modal.querySelectorAll('.sa-var-manager-name-input, .sa-var-manager-value-input'))
        .filter(input => input.closest('.sa-var-manager-row').style.display !== 'none');
      
      const currentIndex = allInputs.indexOf(document.activeElement);
      if (currentIndex !== -1) {
        const nextIndex = Math.max(0, Math.min(allInputs.length - 1, currentIndex + direction));
        allInputs[nextIndex].focus();
        allInputs[nextIndex].select();
      }
    }
    
    document.addEventListener("keydown", escapeHandler);
    document.addEventListener("keydown", modalKeyHandler);
    
    // Cleanup function for event listeners
    const cleanup = () => {
      document.removeEventListener("keydown", escapeHandler);
      document.removeEventListener("keydown", modalKeyHandler);
      window.removeEventListener('resize', positionModal);
    };
    
    // Store cleanup function for later use
    overlay.cleanup = cleanup;
    
    // Focus management - focus the search box initially
    setTimeout(() => {
      const searchBox = manager.querySelector('.sa-var-manager-searchbox');
      if (searchBox) {
        searchBox.focus();
      }
      fullReload();
    }, 100);
  }

  function hideVariableManager() {
    if (variableManagerWindow) {
      variableManagerWindow.close();
    }
  }

  // Cleanup function for event listeners
  function cleanup() {
    // Remove any global event listeners if needed
    // This will be called when the window is closed
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
    if (!variableManagerWindow || preventUpdate) return;
    
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
    if (!variableManagerWindow || preventUpdate) return;

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
    if (!variableManagerWindow || preventUpdate) return;

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
    if (!variableManagerWindow) return;
    
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
      if (variableManagerWindow) fullReload();
    } catch (e) {
      console.error(e);
    }
  });
  
  vm.runtime.on("TOOLBOX_EXTENSIONS_NEED_UPDATE", () => {
    try {
      if (variableManagerWindow) fullReload();
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
  variableManagerButtonImage.src = icon;
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

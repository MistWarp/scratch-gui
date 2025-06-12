export default async function ({ addon, console, msg }) {
  // DISABLED: Autosave functionality has been moved to the File menu
  // This addon is now handled by the MenuBar component directly
  console.log("Autosave addon disabled - functionality moved to File menu");
  return;
  
  const vm = addon.tab.traps.vm;
  
  let autosaveInterval = null;
  let lastSaveTime = 0;
  let isAutosaveEnabled = addon.settings.get("enabled");
  let intervalMinutes = addon.settings.get("interval");
  let showNotifications = addon.settings.get("showNotifications");
  let saveOnlyWhenChanged = addon.settings.get("saveOnlyWhenChanged");

  // Import dropdown caret icon used by other menus
  const dropdownCaretSvg = await import('../../../components/menu-bar/dropdown-caret.svg');

  // Create autosave menu button following the same pattern as File/Edit menus
  const autosaveMenuContainer = document.createElement('div');
  autosaveMenuContainer.className = addon.tab.scratchClass('menu-bar_menu-bar-item', 'menu-bar_hoverable') + ' sa-autosave-menu-container';

  // Add autosave icon (floppy disk)
  const autosaveIcon = document.createElement('span');
  autosaveIcon.className = 'sa-autosave-icon';
  autosaveIcon.textContent = '💾';
  autosaveIcon.style.fontSize = '16px';
  autosaveIcon.style.display = 'inline-block';
  autosaveIcon.style.width = '20px';
  autosaveIcon.style.height = '20px';
  autosaveIcon.style.textAlign = 'center';
  autosaveIcon.style.lineHeight = '20px';

  // Add menu label
  const autosaveLabel = document.createElement('span');
  autosaveLabel.className = addon.tab.scratchClass('menu-bar_collapsible-label');
  autosaveLabel.textContent = msg('autosave');

  // Add dropdown caret
  const autosaveCaret = document.createElement('img');
  autosaveCaret.src = dropdownCaretSvg.default || dropdownCaretSvg;
  autosaveCaret.draggable = false;
  autosaveCaret.width = 8;
  autosaveCaret.height = 5;

  autosaveMenuContainer.appendChild(autosaveIcon);
  autosaveMenuContainer.appendChild(autosaveLabel);
  autosaveMenuContainer.appendChild(autosaveCaret);

  // Create dropdown menu
  const autosaveDropdown = document.createElement('div');
  autosaveDropdown.className = addon.tab.scratchClass('menu-bar_menu-bar-menu') + ' sa-autosave-dropdown';
  autosaveDropdown.style.display = 'none';

  // Create menu content container
  const autosaveMenuContent = document.createElement('ul');
  autosaveMenuContent.className = addon.tab.scratchClass('menu_menu', 'menu_right');
  autosaveDropdown.appendChild(autosaveMenuContent);

  // Create menu wrapper
  const autosaveMenuWrapper = document.createElement('div');
  autosaveMenuWrapper.className = 'sa-autosave-wrapper';
  autosaveMenuWrapper.appendChild(autosaveMenuContainer);
  autosaveMenuWrapper.appendChild(autosaveDropdown);

  addon.tab.displayNoneWhileDisabled(autosaveMenuWrapper, { display: "flex" });

  // Menu state
  let isMenuOpen = false;

  // Menu interaction handlers
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    autosaveDropdown.style.display = isMenuOpen ? 'block' : 'none';
    autosaveMenuContainer.classList.toggle('active', isMenuOpen);
    
    if (isMenuOpen) {
      updateMenuItems();
      document.addEventListener('click', handleOutsideClick, true);
    } else {
      document.removeEventListener('click', handleOutsideClick, true);
    }
  }

  function handleOutsideClick(e) {
    if (!autosaveMenuWrapper.contains(e.target)) {
      closeMenu();
    }
  }

  function closeMenu() {
    isMenuOpen = false;
    autosaveDropdown.style.display = 'none';
    autosaveMenuContainer.classList.remove('active');
    document.removeEventListener('click', handleOutsideClick, true);
  }

  // Add click handler for menu toggle
  autosaveMenuContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMenu();
  });

  // Update menu items
  function updateMenuItems() {
    autosaveMenuContent.innerHTML = '';

    // Status/toggle item
    const statusItem = document.createElement('li');
    statusItem.className = addon.tab.scratchClass('menu_menu-item', 'menu_hoverable') + ' sa-autosave-menu-item';
    
    const statusContent = document.createElement('div');
    statusContent.className = 'sa-autosave-status-content';
    
    const statusIcon = document.createElement('span');
    statusIcon.className = 'sa-autosave-status-icon';
    statusIcon.textContent = isAutosaveEnabled ? '✅' : '⏸️';
    
    const statusText = document.createElement('span');
    statusText.className = 'sa-autosave-status-text';
    statusText.textContent = isAutosaveEnabled 
      ? msg("autosave-enabled", { interval: intervalMinutes })
      : msg("autosave-disabled");
    
    if (lastSaveTime > 0 && isAutosaveEnabled) {
      const saveDate = new Date(lastSaveTime);
      const timeString = saveDate.toLocaleTimeString();
      statusText.textContent += ` (${msg("last-saved")}: ${timeString})`;
    }
    
    statusContent.appendChild(statusIcon);
    statusContent.appendChild(statusText);
    statusItem.appendChild(statusContent);
    
    statusItem.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAutosave();
      closeMenu();
    });
    
    autosaveMenuContent.appendChild(statusItem);

    // Manual save item
    const manualSaveItem = document.createElement('li');
    manualSaveItem.className = addon.tab.scratchClass('menu_menu-item', 'menu_hoverable') + ' sa-autosave-manual-item';
    manualSaveItem.textContent = msg("manual-save");
    manualSaveItem.addEventListener('click', async (e) => {
      e.stopPropagation();
      await performAutosave();
      closeMenu();
    });
    
    autosaveMenuContent.appendChild(manualSaveItem);
  }

  function toggleAutosave() {
    isAutosaveEnabled = !isAutosaveEnabled;
    addon.settings.set("enabled", isAutosaveEnabled);
    updateSettings();
  }

  // Show notification using proper positioning
  function showNotification(messageKey, ...args) {
    if (!showNotifications) return;
    
    // Create notification with proper styling
    const notification = document.createElement("div");
    notification.className = "sa-autosave-notification";
    notification.textContent = msg(messageKey, ...args);
    
    // Add specific styling based on message type
    if (messageKey.includes("success")) {
      notification.classList.add("sa-autosave-success");
    } else if (messageKey.includes("error")) {
      notification.classList.add("sa-autosave-error");
    } else if (messageKey.includes("saving")) {
      notification.classList.add("sa-autosave-saving");
    }
    
    // Position the notification properly
    notification.style.position = "fixed";
    notification.style.top = "80px";
    notification.style.right = "20px";
    notification.style.zIndex = "10000";
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    notification.style.transition = "all 0.3s ease";
    
    document.body.appendChild(notification);
    
    // Make it visible with animation
    requestAnimationFrame(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    });
    
    // Auto-remove after duration
    const duration = messageKey.includes("saving") ? 2000 : 4000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, duration);
  }

  // Check if project has changed since last save
  function hasProjectChanged() {
    if (!saveOnlyWhenChanged) return true;
    
    try {
      const state = addon.tab.redux.state;
      return state.scratchGui.projectChanged;
    } catch (e) {
      console.warn("Failed to check project changed state:", e);
      return true;
    }
  }

  // Generate filename with timestamp
  function generateAutosaveFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    try {
      const state = addon.tab.redux.state;
      const projectTitle = state.scratchGui.projectTitle || "Untitled";
      return `${projectTitle}_autosave_${timestamp}.sb3`;
    } catch (e) {
      return `Scratch_Project_autosave_${timestamp}.sb3`;
    }
  }

  // Perform autosave
  async function performAutosave() {
    if (!isAutosaveEnabled) return;
    
    try {
      if (!vm.runtime || !vm.runtime.targets || vm.runtime.targets.length === 0) {
        console.log("Autosave: No project loaded, skipping save");
        showNotification("autosave-no-project");
        return;
      }

      if (!hasProjectChanged()) {
        console.log("Autosave: Project unchanged, skipping save");
        showNotification("autosave-unchanged");
        return;
      }

      console.log("Autosave: Starting automatic save...");
      showNotification("autosave-saving");

      const projectBlob = await vm.saveProjectSb3();
      const filename = generateAutosaveFilename();
      const url = URL.createObjectURL(projectBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = "none";
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      lastSaveTime = Date.now();
      if (isMenuOpen) {
        updateMenuItems();
      }
      
      showNotification("autosave-success", { filename: filename });
      console.log(`Autosave: Successfully saved project as ${filename}`);
      
    } catch (error) {
      console.error("Autosave: Failed to save project:", error);
      showNotification("autosave-error");
    }
  }

  // Start autosave timer
  function startAutosave() {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
    }
    
    if (!isAutosaveEnabled) return;
    
    const intervalMs = intervalMinutes * 60 * 1000;
    autosaveInterval = setInterval(performAutosave, intervalMs);
    console.log(`%cAutosave: Started with ${intervalMinutes} minute interval`, 'color: #4caf50; font-weight: bold;');
    
    if (showNotifications) {
      showNotification("autosave-started", { interval: intervalMinutes });
    }
  }

  // Stop autosave timer
  function stopAutosave() {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
      autosaveInterval = null;
    }
    console.log("Autosave: Stopped");
  }

  // Handle settings changes
  function updateSettings() {
    const wasEnabled = isAutosaveEnabled;
    isAutosaveEnabled = addon.settings.get("enabled");
    intervalMinutes = addon.settings.get("interval");
    showNotifications = addon.settings.get("showNotifications");
    saveOnlyWhenChanged = addon.settings.get("saveOnlyWhenChanged");
    
    if (isMenuOpen) {
      updateMenuItems();
    }
    
    if (isAutosaveEnabled && (!wasEnabled || autosaveInterval === null)) {
      startAutosave();
    } else if (!isAutosaveEnabled && wasEnabled) {
      stopAutosave();
    } else if (isAutosaveEnabled && autosaveInterval) {
      startAutosave();
    }
  }

  // Manual save when clicking menu item
  autosaveMenuItem.addEventListener("click", async () => {
    if (isAutosaveEnabled) {
      await performAutosave();
    } else {
      showNotification("autosave-manual-disabled");
    }
  });

  // Listen for settings changes
  addon.settings.addEventListener("change", updateSettings);

  // Listen for project changes to update save status
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/project-changed/SET_PROJECT_CHANGED") {
      // Project changed, we could update display here if needed
    }
  });

  // Wait for VM to be ready
  if (vm.runtime && vm.runtime.targets && vm.runtime.targets.length > 0) {
    updateMenuDisplay();
    if (isAutosaveEnabled) {
      startAutosave();
    }
  } else {
    vm.runtime.once("PROJECT_LOADED", () => {
      updateMenuDisplay();
      if (isAutosaveEnabled) {
        startAutosave();
      }
    });
  }

  // Add menu item to File menu
  async function addToFileMenu() {
    while (true) {
      try {
        // Wait for the File menu to be available
        const fileMenu = await addon.tab.waitForElement('[class*="menu-bar_menu-bar-menu"] [class*="menu_menu"]', {
          markAsSeen: true,
          reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
          reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        });

        if (addon.self.disabled) {
          continue;
        }

        // Check if we're looking at the File menu specifically
        const menuBarItem = fileMenu.closest('[class*="menu-bar_menu-bar-item"]');
        if (!menuBarItem) continue;
        
        // Look for File menu indicator (could be text "File" or file icon)
        const hasFileText = menuBarItem.textContent.includes('File') || 
                           menuBarItem.querySelector('img[alt*="File"]') ||
                           menuBarItem.querySelector('[class*="file"]');
        
        if (!hasFileText) continue;

        // Find a good insertion point - after Load or Save items
        const menuItems = fileMenu.querySelectorAll('li[class*="menu_menu-item"]');
        let insertAfter = null;
        
        // Look for save-related or load-related items to insert after
        for (const item of menuItems) {
          const text = item.textContent.toLowerCase();
          if (text.includes('save') || text.includes('load') || text.includes('download')) {
            insertAfter = item;
          }
        }
        
        // Insert the autosave menu item
        if (insertAfter && insertAfter.nextSibling) {
          fileMenu.insertBefore(autosaveMenuItem, insertAfter.nextSibling);
        } else if (insertAfter) {
          insertAfter.parentNode.appendChild(autosaveMenuItem);
        } else {
          // Fallback: add at the beginning
          if (fileMenu.firstChild) {
            fileMenu.insertBefore(autosaveMenuItem, fileMenu.firstChild);
          } else {
            fileMenu.appendChild(autosaveMenuItem);
          }
        }
        
        console.log("Autosave: Successfully added to File menu");
        updateMenuDisplay();
        break;
        
      } catch (error) {
        console.error("Autosave: Error adding to File menu:", error);
        // Continue the loop to try again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Start trying to add to File menu
  addToFileMenu();
}

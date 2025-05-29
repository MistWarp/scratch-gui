export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  
  let autosaveInterval = null;
  let lastSaveTime = 0;
  let isAutosaveEnabled = addon.settings.get("enabled");
  let intervalMinutes = addon.settings.get("interval");
  let showNotifications = addon.settings.get("showNotifications");
  let saveOnlyWhenChanged = addon.settings.get("saveOnlyWhenChanged");

  // Create autosave button in stage header
  const autosaveButton = document.createElement("div");
  autosaveButton.className = "sa-autosave-container";
  
  const button = document.createElement("div");
  button.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  
  const buttonContent = document.createElement("div");
  buttonContent.className = addon.tab.scratchClass("button_content");
  
  const buttonIcon = document.createElement("img");
  buttonIcon.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  buttonIcon.draggable = false;
  buttonIcon.src = addon.self.getResource("/autosave-icon.svg") /* rewritten by pull.js */;
  buttonIcon.title = msg("autosave-tooltip");
  
  const statusIndicator = document.createElement("div");
  statusIndicator.className = "sa-autosave-indicator";
  
  buttonContent.appendChild(buttonIcon);
  button.appendChild(buttonContent);
  button.appendChild(statusIndicator);
  autosaveButton.appendChild(button);
  
  addon.tab.displayNoneWhileDisabled(autosaveButton, { display: "flex" });

  // Update status indicator
  function updateStatusIndicator() {
    statusIndicator.className = "sa-autosave-indicator";
    if (isAutosaveEnabled) {
      statusIndicator.classList.add("sa-autosave-enabled");
      buttonIcon.title = msg("autosave-enabled", { interval: intervalMinutes });
    } else {
      statusIndicator.classList.add("sa-autosave-disabled");
      buttonIcon.title = msg("autosave-disabled");
    }
  }

  // Show notification
  function showNotification(messageKey, ...args) {
    if (!showNotifications) return;
    
    // Use the same notification system as other addons
    const notification = document.createElement("div");
    notification.className = "sa-autosave-notification";
    notification.textContent = msg(messageKey, ...args);
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Check if project has changed since last save
  function hasProjectChanged() {
    if (!saveOnlyWhenChanged) return true;
    
    try {
      // Access Redux state to check if project has changed
      const state = addon.tab.redux.state;
      return state.scratchGui.projectChanged;
    } catch (e) {
      console.warn("Failed to check project changed state:", e);
      return true; // Default to saving if we can't check
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
      // Check if we can save (project is loaded and has content)
      if (!vm.runtime || !vm.runtime.targets || vm.runtime.targets.length === 0) {
        console.log("Autosave: No project loaded, skipping save");
        return;
      }

      // Check if project has changed
      if (!hasProjectChanged()) {
        console.log("Autosave: Project unchanged, skipping save");
        return;
      }

      console.log("Autosave: Starting automatic save...");
      statusIndicator.classList.add("sa-autosave-saving");

      // Get project data as blob
      const projectBlob = await vm.saveProjectSb3();
      
      // Create download link and trigger download
      const filename = generateAutosaveFilename();
      const url = URL.createObjectURL(projectBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = "none";
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      lastSaveTime = Date.now();
      statusIndicator.classList.remove("sa-autosave-saving");
      
      showNotification("autosave-success", filename);
      console.log(`Autosave: Successfully saved project as ${filename}`);
      
    } catch (error) {
      console.error("Autosave: Failed to save project:", error);
      statusIndicator.classList.remove("sa-autosave-saving");
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
    console.log(`Autosave: Started with ${intervalMinutes} minute interval`);
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
    
    updateStatusIndicator();
    
    if (isAutosaveEnabled && (!wasEnabled || autosaveInterval === null)) {
      startAutosave();
    } else if (!isAutosaveEnabled && wasEnabled) {
      stopAutosave();
    } else if (isAutosaveEnabled && autosaveInterval) {
      // Restart with new interval
      startAutosave();
    }
  }

  // Manual save button click
  button.addEventListener("click", async () => {
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
      // Project changed, update our internal tracking if needed
    }
  });

  // Wait for VM to be ready
  if (vm.runtime && vm.runtime.targets && vm.runtime.targets.length > 0) {
    updateStatusIndicator();
    if (isAutosaveEnabled) {
      startAutosave();
    }
  } else {
    vm.runtime.once("PROJECT_LOADED", () => {
      updateStatusIndicator();
      if (isAutosaveEnabled) {
        startAutosave();
      }
    });
  }

  // Add to stage header when in editor mode
  const addToStageHeader = () => {
    if (addon.tab.editorMode === "editor") {
      addon.tab.appendToSharedSpace({ 
        space: "stageHeader", 
        element: autosaveButton, 
        order: 1 
      });
    } else {
      autosaveButton.remove();
    }
  };

  // Wait for stage header and add button
  while (true) {
    await addon.tab.waitForElement('[class*="stage-header_stage-header-wrapper"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    addToStageHeader();
  }
}

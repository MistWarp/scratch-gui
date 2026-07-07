(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-autosave"],{

/***/ "./node_modules/css-loader/index.js?!./node_modules/postcss-loader/src/index.js?!./src/addons/addons/autosave/style.css":
/*!*****************************************************************************************************************************!*\
  !*** ./node_modules/css-loader??ref--5-1!./node_modules/postcss-loader/src??postcss!./src/addons/addons/autosave/style.css ***!
  \*****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Autosave addon styles */\n\n/* Menu item styles */\n\n.style_sa-autosave-menu-item_1Lf7v {\n  cursor: pointer;\n}\n\n.style_sa-autosave-menu-content_Pxm82 {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.style_sa-autosave-status-icon_vN6n1 {\n  font-size: 14px;\n  line-height: 1;\n}\n\n.style_sa-autosave-status-icon_vN6n1.style_enabled_1eaxt {\n  color: #4caf50;\n}\n\n.style_sa-autosave-status-icon_vN6n1.style_disabled_27tZn {\n  color: #f44336;\n}\n\n.style_sa-autosave-menu-text_3SyEL {\n  flex: 1;\n}\n\n/* Notification styles */\n\n.style_sa-autosave-notification_1sH5k {\n  position: fixed;\n  top: 80px;\n  right: 20px;\n  background-color: #333;\n  color: white;\n  padding: 12px 20px;\n  border-radius: 8px;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);\n  z-index: 10000;\n  font-size: 14px;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  max-width: 320px;\n  word-wrap: break-word;\n  border-left: 4px solid #4caf50;\n  transition: all 0.3s ease;\n  opacity: 0;\n  transform: translateX(100%);\n}\n\n.style_sa-autosave-notification_1sH5k.style_sa-autosave-success_eDE4i {\n  border-left-color: #4caf50;\n}\n\n.style_sa-autosave-notification_1sH5k.style_sa-autosave-error_3fTBM {\n  border-left-color: #f44336;\n  background-color: #5d2f2f;\n}\n\n.style_sa-autosave-notification_1sH5k.style_sa-autosave-saving_JVHtP {\n  border-left-color: #ff9800;\n  background-color: #3d3d3d;\n}\n\n/* Dark theme support */\n\n[theme=\"dark\"] .style_sa-autosave-notification_1sH5k {\n  background-color: #424242;\n  color: #ffffff;\n}\n\n/* High contrast theme support */\n\n[theme=\"high-contrast\"] .style_sa-autosave-notification_1sH5k {\n  background-color: #000000;\n  color: #ffffff;\n  border: 2px solid #ffffff;\n}\n\n/* Responsive design for smaller screens */\n\n@media (max-width: 768px) {\n  .style_sa-autosave-notification_1sH5k {\n    top: 10px;\n    right: 10px;\n    left: 10px;\n    max-width: none;\n    font-size: 13px;\n    padding: 10px 16px;\n  }\n}\n", ""]);

// exports
exports.locals = {
	"sa-autosave-menu-item": "style_sa-autosave-menu-item_1Lf7v",
	"saAutosaveMenuItem": "style_sa-autosave-menu-item_1Lf7v",
	"sa-autosave-menu-content": "style_sa-autosave-menu-content_Pxm82",
	"saAutosaveMenuContent": "style_sa-autosave-menu-content_Pxm82",
	"sa-autosave-status-icon": "style_sa-autosave-status-icon_vN6n1",
	"saAutosaveStatusIcon": "style_sa-autosave-status-icon_vN6n1",
	"enabled": "style_enabled_1eaxt",
	"disabled": "style_disabled_27tZn",
	"sa-autosave-menu-text": "style_sa-autosave-menu-text_3SyEL",
	"saAutosaveMenuText": "style_sa-autosave-menu-text_3SyEL",
	"sa-autosave-notification": "style_sa-autosave-notification_1sH5k",
	"saAutosaveNotification": "style_sa-autosave-notification_1sH5k",
	"sa-autosave-success": "style_sa-autosave-success_eDE4i",
	"saAutosaveSuccess": "style_sa-autosave-success_eDE4i",
	"sa-autosave-error": "style_sa-autosave-error_3fTBM",
	"saAutosaveError": "style_sa-autosave-error_3fTBM",
	"sa-autosave-saving": "style_sa-autosave-saving_JVHtP",
	"saAutosaveSaving": "style_sa-autosave-saving_JVHtP"
};

/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/autosave/autosave-icon.svg":
/*!********************************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/autosave/autosave-icon.svg ***!
  \********************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTkgMTJ2N0g1di03TTEyIDE1bDAtNk05IDEybDMtMyAzIDMiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogIDxwYXRoIGQ9Ik0zIDdoMTh2MmMwIDEtMSAyLTIgMkg1Yy0xIDAtMi0xLTItMlY3eiIgZmlsbD0iY3VycmVudENvbG9yIiBvcGFjaXR5PSIwLjIiLz4KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjYiIHI9IjMiIGZpbGw9IiM0Y2FmNTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4K");

/***/ }),

/***/ "./src/addons/addons/autosave/_runtime_entry.js":
/*!******************************************************!*\
  !*** ./src/addons/addons/autosave/_runtime_entry.js ***!
  \******************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/autosave/userscript.js");
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./style.css */ "./src/addons/addons/autosave/style.css");
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_style_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _url_loader_autosave_icon_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! url-loader!./autosave-icon.svg */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/autosave/autosave-icon.svg");
/* generated by pull.js */



const resources = {
  "userscript.js": _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  "style.css": _style_css__WEBPACK_IMPORTED_MODULE_1___default.a,
  "autosave-icon.svg": _url_loader_autosave_icon_svg__WEBPACK_IMPORTED_MODULE_2__["default"]
};

/***/ }),

/***/ "./src/addons/addons/autosave/style.css":
/*!**********************************************!*\
  !*** ./src/addons/addons/autosave/style.css ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(/*! !../../../../node_modules/css-loader??ref--5-1!../../../../node_modules/postcss-loader/src??postcss!./style.css */ "./node_modules/css-loader/index.js?!./node_modules/postcss-loader/src/index.js?!./src/addons/addons/autosave/style.css");

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! ../../../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./src/addons/addons/autosave/userscript.js":
/*!**************************************************!*\
  !*** ./src/addons/addons/autosave/userscript.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (async function (_ref) {
  let addon = _ref.addon,
    console = _ref.console,
    msg = _ref.msg;
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
  const dropdownCaretSvg = await __webpack_require__.e(/*! import() */ 0).then(__webpack_require__.t.bind(null, /*! ../../../components/menu-bar/dropdown-caret.svg */ "./src/components/menu-bar/dropdown-caret.svg", 7));

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
  addon.tab.displayNoneWhileDisabled(autosaveMenuWrapper, {
    display: "flex"
  });

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
  autosaveMenuContainer.addEventListener('click', e => {
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
    statusText.textContent = isAutosaveEnabled ? msg("autosave-enabled", {
      interval: intervalMinutes
    }) : msg("autosave-disabled");
    if (lastSaveTime > 0 && isAutosaveEnabled) {
      const saveDate = new Date(lastSaveTime);
      const timeString = saveDate.toLocaleTimeString();
      statusText.textContent += " (".concat(msg("last-saved"), ": ").concat(timeString, ")");
    }
    statusContent.appendChild(statusIcon);
    statusContent.appendChild(statusText);
    statusItem.appendChild(statusContent);
    statusItem.addEventListener('click', e => {
      e.stopPropagation();
      toggleAutosave();
      closeMenu();
    });
    autosaveMenuContent.appendChild(statusItem);

    // Manual save item
    const manualSaveItem = document.createElement('li');
    manualSaveItem.className = addon.tab.scratchClass('menu_menu-item', 'menu_hoverable') + ' sa-autosave-manual-item';
    manualSaveItem.textContent = msg("manual-save");
    manualSaveItem.addEventListener('click', async e => {
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
  function showNotification(messageKey) {
    if (!showNotifications) return;

    // Create notification with proper styling
    const notification = document.createElement("div");
    notification.className = "sa-autosave-notification";
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
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
      return "".concat(projectTitle, "_autosave_").concat(timestamp, ".sb3");
    } catch (e) {
      return "Scratch_Project_autosave_".concat(timestamp, ".sb3");
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
      showNotification("autosave-success", {
        filename: filename
      });
      console.log("Autosave: Successfully saved project as ".concat(filename));
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
    console.log("%cAutosave: Started with ".concat(intervalMinutes, " minute interval"), 'color: #4caf50; font-weight: bold;');
    if (showNotifications) {
      showNotification("autosave-started", {
        interval: intervalMinutes
      });
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
  addon.tab.redux.addEventListener("statechanged", e => {
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
          reduxCondition: state => !state.scratchGui.mode.isPlayerOnly
        });
        if (addon.self.disabled) {
          continue;
        }

        // Check if we're looking at the File menu specifically
        const menuBarItem = fileMenu.closest('[class*="menu-bar_menu-bar-item"]');
        if (!menuBarItem) continue;

        // Look for File menu indicator (could be text "File" or file icon)
        const hasFileText = menuBarItem.textContent.includes('File') || menuBarItem.querySelector('img[alt*="File"]') || menuBarItem.querySelector('[class*="file"]');
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
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-autosave.js.map
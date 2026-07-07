(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-fullscreen"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/hideOverflow.css":
/*!*********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/fullscreen/hideOverflow.css ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".sa-fullscreen.sa-body-editor {\n  overflow: hidden !important;\n}\n\n.sa-fullscreen.sa-body-editor [class*=\"menu-bar_menu-bar\"] {\n  display: none !important;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/hideToolbar.css":
/*!********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/fullscreen/hideToolbar.css ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "[class*=\"stage-wrapper_full-screen\"] {\n  top: 0rem !important;\n}\n\n[class*=\"stage-header_stage-header-wrapper-overlay\"] {\n  display: block;\n  top: var(--sa-menu-bar-height, 0px) !important;\n  transform: translateY(calc(-101% - var(--sa-menu-bar-height, 0px)));\n  transition: transform 0.3s;\n}\n\n.phantom-header {\n  position: fixed;\n  top: 0px;\n  left: 0px;\n  right: 0px;\n  height: 8px;\n  display: block;\n  z-index: 5000;\n}\n\n.stage-header-hover {\n  transform: translateY(0%);\n  transition: transform 0.3s 0.25s;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/removeBorder.css":
/*!*********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/fullscreen/removeBorder.css ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_full-screen\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_green-flag-overlay-wrapper\"] {\n  border: 0 !important;\n  border-radius: 0 !important;\n}\n\n[class*=\"stage_stage-overlays_\"][class*=\"stage_full-screen_\"] {\n  top: 0;\n  left: 0;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/resizeWindow.css":
/*!*********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/fullscreen/resizeWindow.css ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "[class*=\"stage-wrapper_full-screen\"] [class*=\"stage-wrapper_stage-canvas-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_stage\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage-header_stage-menu-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] canvas {\n  width: min(calc((100vh - 44px) * var(--sa-fullscreen-width) / var(--sa-fullscreen-height)), 100vw) !important;\n}\n\n[class*=\"stage-header_stage-header-wrapper-overlay\"] {\n  top: var(--sa-menu-bar-height, 0px) !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] {\n  top: calc(var(--sa-menu-bar-height, 0px) + 44px) !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage-wrapper_stage-canvas-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_stage\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_green-flag-overlay-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] canvas {\n  height: min(calc(100vh - 44px), calc(100vw * var(--sa-fullscreen-height) / var(--sa-fullscreen-width))) !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] {\n  padding: 0rem !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] [class*=\"monitor-list_monitor-list\"] {\n  overflow: visible;\n}\n\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_question-wrapper\"] {\n  width: auto !important;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/resizeWindow_noToolbar.css":
/*!*******************************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/fullscreen/resizeWindow_noToolbar.css ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "[class*=\"stage-wrapper_full-screen\"] [class*=\"stage-wrapper_stage-canvas-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_stage\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage-header_stage-menu-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] canvas {\n  width: min(calc(100vh * var(--sa-fullscreen-width) / var(--sa-fullscreen-height)), 100vw) !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage-wrapper_stage-canvas-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_stage\"],\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_green-flag-overlay-wrapper\"],\n[class*=\"stage-wrapper_full-screen\"] canvas {\n  height: min(100vh, calc(100vw * var(--sa-fullscreen-height) / var(--sa-fullscreen-width))) !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] {\n  padding: 0rem !important;\n}\n\n[class*=\"stage-wrapper_full-screen\"] [class*=\"monitor-list_monitor-list\"] {\n  overflow: visible;\n}\n\n[class*=\"stage-wrapper_full-screen\"] [class*=\"stage_question-wrapper\"] {\n  width: auto !important;\n}\n", ""]);

// exports


/***/ }),

/***/ "./src/addons/addons/fullscreen/_runtime_entry.js":
/*!********************************************************!*\
  !*** ./src/addons/addons/fullscreen/_runtime_entry.js ***!
  \********************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/fullscreen/userscript.js");
/* harmony import */ var _css_loader_hideOverflow_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./hideOverflow.css */ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/hideOverflow.css");
/* harmony import */ var _css_loader_hideOverflow_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_hideOverflow_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _css_loader_removeBorder_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! css-loader!./removeBorder.css */ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/removeBorder.css");
/* harmony import */ var _css_loader_removeBorder_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_css_loader_removeBorder_css__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _css_loader_resizeWindow_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! css-loader!./resizeWindow.css */ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/resizeWindow.css");
/* harmony import */ var _css_loader_resizeWindow_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_css_loader_resizeWindow_css__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _css_loader_resizeWindow_noToolbar_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! css-loader!./resizeWindow_noToolbar.css */ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/resizeWindow_noToolbar.css");
/* harmony import */ var _css_loader_resizeWindow_noToolbar_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_css_loader_resizeWindow_noToolbar_css__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _css_loader_hideToolbar_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! css-loader!./hideToolbar.css */ "./node_modules/css-loader/index.js!./src/addons/addons/fullscreen/hideToolbar.css");
/* harmony import */ var _css_loader_hideToolbar_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_css_loader_hideToolbar_css__WEBPACK_IMPORTED_MODULE_5__);
/* generated by pull.js */






const resources = {
  "userscript.js": _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  "hideOverflow.css": _css_loader_hideOverflow_css__WEBPACK_IMPORTED_MODULE_1___default.a,
  "removeBorder.css": _css_loader_removeBorder_css__WEBPACK_IMPORTED_MODULE_2___default.a,
  "resizeWindow.css": _css_loader_resizeWindow_css__WEBPACK_IMPORTED_MODULE_3___default.a,
  "resizeWindow_noToolbar.css": _css_loader_resizeWindow_noToolbar_css__WEBPACK_IMPORTED_MODULE_4___default.a,
  "hideToolbar.css": _css_loader_hideToolbar_css__WEBPACK_IMPORTED_MODULE_5___default.a
};

/***/ }),

/***/ "./src/addons/addons/fullscreen/userscript.js":
/*!****************************************************!*\
  !*** ./src/addons/addons/fullscreen/userscript.js ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * Used for the automatic browser full screen setting
 * and for hiding the scrollbar in full screen.
 */
/* harmony default export */ __webpack_exports__["default"] = (async function (_ref) {
  let addon = _ref.addon,
    console = _ref.console;
  const vm = addon.tab.traps.vm;
  const updateLayoutVars = () => {
    document.documentElement.style.setProperty('--sa-fullscreen-width', vm.runtime.stageWidth);
    document.documentElement.style.setProperty('--sa-fullscreen-height', vm.runtime.stageHeight);
    const menuBar = document.querySelector('[class*="menu-bar_menu-bar"]');
    const menuBarHeight = menuBar ? menuBar.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--sa-menu-bar-height', "".concat(menuBarHeight, "px"));
  };
  updateLayoutVars();
  vm.on('STAGE_SIZE_CHANGED', updateLayoutVars);

  // In Electron, after running requestFullscreen() a resize event can be fired before
  // document.fullscreenElement is updated. We want to ignore that event.
  let isEnteringFullscreen = false;

  // "Browser fullscreen" is defined as the mode that hides the browser UI.
  function updateBrowserFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If Scratch fullscreen is enabled, then browser fullscreen should also
      // be enabled, and vice versa for disabling.
      if (addon.tab.redux.state.scratchGui.mode.isFullScreen && document.fullscreenElement === null) {
        isEnteringFullscreen = true;
        document.documentElement.requestFullscreen().then(() => {
          isEnteringFullscreen = false;
        }).catch(err => {
          console.error(err);
          isEnteringFullscreen = false;
        });
      } else if (!addon.tab.redux.state.scratchGui.mode.isFullScreen && document.fullscreenElement !== null) {
        document.exitFullscreen();
      }
    }
  }

  // "Scratch fullscreen" is defined as the mode normally toggled by the
  // rightmost button above the stage.
  function updateScratchFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If browser fullscreen is disabled, then Scratch fullscreen should also
      // be disabled.
      if (document.fullscreenElement === null && addon.tab.redux.state.scratchGui.mode.isFullScreen) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/mode/SET_FULL_SCREEN",
          isFullScreen: false
        });
      }
    }
  }

  // The "phantom header" is a small strip at the top of the page that
  // brings the header into view when hovered.
  let phantomHeader = null;
  let hoverHeader = null;
  let hoverCanvas = null;
  let hoverListenersAttached = false;
  let onBodyMouseLeave = null;
  let onBodyMouseEnter = null;
  const detachHoverListeners = () => {
    if (hoverListenersAttached) {
      document.body.removeEventListener("mouseleave", onBodyMouseLeave);
      document.body.removeEventListener("mouseenter", onBodyMouseEnter);
      hoverListenersAttached = false;
    }
  };
  const removePhantomHeader = async () => {
    const header = hoverHeader || (await addon.tab.waitForElement('[class*="stage-header_stage-header-wrapper"]'));
    // Ensure hidden state when not in hover mode
    header.classList.remove("stage-header-hover");
    if (header.parentElement && header.parentElement.classList.contains("phantom-header")) {
      const phantom = header.parentElement;
      phantom.parentElement.appendChild(header);
      phantom.remove();
    }
    phantomHeader = null;
  };
  async function updatePhantomHeader() {
    if (!addon.self.disabled && addon.tab.redux.state.scratchGui.mode.isFullScreen && addon.settings.get("toolbar") === "hover") {
      hoverCanvas = hoverCanvas || (await addon.tab.waitForElement('[class*="stage_full-screen"] canvas'));
      hoverHeader = hoverHeader || (await addon.tab.waitForElement('[class^="stage-header_stage-header-wrapper"]'));

      // Create phantom header exactly once.
      if (!hoverHeader.parentElement.classList.contains("phantom-header")) {
        phantomHeader = hoverHeader.parentElement.appendChild(document.createElement("div"));
        phantomHeader.classList.add("phantom-header");

        // Make the header a child of the phantom, so that mouseleave will trigger when the
        // mouse leaves the header OR the phantom header.
        phantomHeader.appendChild(hoverHeader);
        phantomHeader.addEventListener("mouseenter", () => {
          if (addon.settings.get("toolbar") === "hover" && addon.tab.redux.state.scratchGui.mode.isFullScreen && !addon.self.disabled) {
            hoverHeader.classList.add("stage-header-hover");
          }
        });
        phantomHeader.addEventListener("mouseleave", () => {
          hoverHeader.classList.remove("stage-header-hover");
        });

        // Pass click events on the phantom header onto the project player, essentially making it click-through
        ["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend", "wheel"].forEach(eventName => {
          phantomHeader.addEventListener(eventName, e => {
            if (e.target.classList.contains("phantom-header")) {
              hoverCanvas.dispatchEvent(new e.constructor(e.type, e));
            }
          });
        });
      } else {
        phantomHeader = hoverHeader.parentElement;
      }

      // Listen for when the mouse moves above the page (helps to show header when not in browser full screen mode)
      if (!hoverListenersAttached) {
        onBodyMouseLeave = e => {
          if (e.clientY < 8 && addon.settings.get("toolbar") === "hover" && addon.tab.redux.state.scratchGui.mode.isFullScreen && !addon.self.disabled) {
            hoverHeader.classList.add("stage-header-hover");
          }
        };
        onBodyMouseEnter = () => {
          if (hoverHeader) {
            hoverHeader.classList.remove("stage-header-hover");
          }
        };
        document.body.addEventListener("mouseleave", onBodyMouseLeave);
        document.body.addEventListener("mouseenter", onBodyMouseEnter);
        hoverListenersAttached = true;
      }
    } else {
      detachHoverListeners();
      await removePhantomHeader();
    }
  }
  updatePhantomHeader();
  async function setPageScrollbar() {
    const body = await addon.tab.waitForElement(".sa-body-editor");
    if (addon.tab.redux.state.scratchGui.mode.isFullScreen) {
      body.classList.add("sa-fullscreen");
    } else {
      body.classList.remove("sa-fullscreen");
    }
  }

  // Properly resize the canvas and scale variable monitors on stage resize.
  let monitorScaler, resizeObserver, stage;
  async function initScaler() {
    monitorScaler = await addon.tab.waitForElement("[class*=monitor-list_monitor-list-scaler]");
    stage = await addon.tab.waitForElement('[class*="stage-wrapper_full-screen"] [class*="stage_stage"] canvas');
    resizeObserver = new ResizeObserver(() => {
      const stageSize = stage.getBoundingClientRect();
      // When switching between project page and editor, the canvas
      // is removed from the DOM and inserted again in a different place.
      // This causes the size to be reported as 0x0.
      if (!stageSize.width || !stageSize.height) return;
      // Width and height attributes of the canvas need to match the actual size.
      const renderer = addon.tab.traps.vm.runtime.renderer;
      if (renderer) renderer.resize(stageSize.width, stageSize.height);
      // Scratch uses the `transform` CSS property on a stage overlay element
      // to control the scaling of variable monitors.
      const scale = stageSize.width / vm.runtime.stageWidth;
      monitorScaler.style.transform = "scale(".concat(scale, ", ").concat(scale, ")");
    });
    resizeObserver.observe(stage);
  }
  initScaler();

  // Running this on page load handles the case of the project initially
  // loading in Scratch fullscreen mode.
  setPageScrollbar().then(updateLayoutVars);
  updateBrowserFullscreen();

  // Changing to or from Scratch fullscreen is signified by a state change
  // (URL change doesn't work when editing project without project page)
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", e => {
    if (e.detail.action.type === "scratch-gui/mode/SET_FULL_SCREEN") {
      initScaler();
      updateBrowserFullscreen();
      setPageScrollbar().then(updateLayoutVars);
      updatePhantomHeader();
    }
  });
  // Changing to or from browser fullscreen is signified by a window resize.
  window.addEventListener("resize", () => {
    if (!isEnteringFullscreen) {
      updateLayoutVars();
      updateScratchFullscreen();
    }
  });
  // Handles the case of F11 full screen AND document full screen being enabled
  // at the same time.
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === null && addon.tab.redux.state.scratchGui.mode.isFullScreen) {
      addon.tab.redux.dispatch({
        type: "scratch-gui/mode/SET_FULL_SCREEN",
        isFullScreen: false
      });
    }
  });

  // These handle the case of the user already being in Scratch fullscreen
  // (without being in browser fullscreen) when the addon or sync option are
  // dynamically enabled.
  addon.settings.addEventListener("change", () => {
    updateBrowserFullscreen();
    updateLayoutVars();
    updatePhantomHeader();
  });
  addon.self.addEventListener("disabled", () => {
    if (resizeObserver) resizeObserver.disconnect();
    detachHoverListeners();
    updatePhantomHeader();
  });
  addon.self.addEventListener("reenabled", () => {
    if (resizeObserver && stage) resizeObserver.observe(stage);
    updateBrowserFullscreen();
    updatePhantomHeader();
  });
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-fullscreen.js.map
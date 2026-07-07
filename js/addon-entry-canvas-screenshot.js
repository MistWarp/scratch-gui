(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-canvas-screenshot"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/canvas-screenshot/style.css":
/*!*********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/canvas-screenshot/style.css ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "[dir=\"ltr\"] .sa-screenshot-container {\n  margin-right: 0.2rem;\n}\n\n[dir=\"rtl\"] .sa-screenshot-container {\n  margin-left: 0.2rem;\n}\n\n.sa-small-stage [class*=\"gui_body-wrapper_\"]:not(.sa-stage-hidden) .sa-screenshot-container {\n  display: none !important;\n}\n\n.sa-screenshot-container [class*=\"button_content_\"] {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n}\n\n.sa-screenshot-container [class*=\"stage-header_stage-button-icon\"] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n}\n\n.sa-screenshot-container [class*=\"stage-header_stage-button-icon\"] svg {\n  width: 100%;\n  height: 100%;\n}\n\n.sa-screenshot-preview {\n  pointer-events: none;\n  user-select: none;\n  position: fixed;\n  bottom: 20px;\n  right: 20px;\n  width: 220px;\n  background: var(--ui-modal-background, var(--ui-primary, #fff));\n  border: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));\n  border-radius: 12px;\n  padding: 6px;\n  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08);\n  z-index: 10000;\n  opacity: 0;\n  transform: translateY(10px) scale(0.96);\n  transition: opacity 0.25s ease, transform 0.25s ease;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n}\n\n.sa-screenshot-preview-image {\n  height: 140px;\n  border-radius: 8px;\n  overflow: hidden;\n  background: var(--ui-black-transparent, rgba(0, 0, 0, 0.06));\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.sa-screenshot-preview img {\n  max-width: 100%;\n  max-height: 100%;\n  object-fit: contain;\n  display: block;\n}\n\n.sa-screenshot-preview-caption {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.375rem;\n  padding: 0.5rem 0.25rem 0.25rem;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  color: var(--text-primary, #575e75);\n}\n\n.sa-screenshot-preview-visible {\n  opacity: 1;\n  transform: translateY(0) scale(1);\n}\n\n@keyframes sa-screenshot-flash {\n  0% { opacity: 1; }\n  50% { opacity: 0.7; }\n  100% { opacity: 1; }\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/canvas-screenshot/icons/camera.svg":
/*!****************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/canvas-screenshot/icons/camera.svg ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-camera-icon lucide-camera\"><path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/></svg>"

/***/ }),

/***/ "./src/addons/addons/canvas-screenshot/_runtime_entry.js":
/*!***************************************************************!*\
  !*** ./src/addons/addons/canvas-screenshot/_runtime_entry.js ***!
  \***************************************************************/
/*! exports provided: resources, l10n */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l10n", function() { return l10n; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/canvas-screenshot/userscript.js");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./style.css */ "./node_modules/css-loader/index.js!./src/addons/addons/canvas-screenshot/style.css");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _raw_loader_icons_camera_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !raw-loader!./icons/camera.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/canvas-screenshot/icons/camera.svg");
/* harmony import */ var _raw_loader_icons_camera_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_icons_camera_svg__WEBPACK_IMPORTED_MODULE_2__);
/* generated by pull.js */



const resources = {
  'userscript.js': _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  'style.css': _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default.a,
  'icons/camera.svg': _raw_loader_icons_camera_svg__WEBPACK_IMPORTED_MODULE_2___default.a
};
const l10n = {
  en: {
    'screenshot-taken': 'Screenshot copied to clipboard!',
    'screenshot-error': 'Error taking screenshot',
    'screenshot-fallback': 'Screenshot downloaded (clipboard not supported)'
  }
};

/***/ }),

/***/ "./src/addons/addons/canvas-screenshot/userscript.js":
/*!***********************************************************!*\
  !*** ./src/addons/addons/canvas-screenshot/userscript.js ***!
  \***********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * Canvas Screenshot addon main script
 * @param {object} param0 Scratch addon parameters
 */
/* harmony default export */ __webpack_exports__["default"] = (async function (_ref) {
  let addon = _ref.addon,
    msg = _ref.msg;
  const vm = addon.tab.traps.vm;
  await new Promise(resolve => {
    if (vm.editingTarget) {
      return resolve();
    }
    vm.runtime.once('PROJECT_LOADED', () => {
      resolve();
    });
  });
  const screenshotButtonOuter = document.createElement('div');
  screenshotButtonOuter.className = 'sa-screenshot-container';
  const screenshotButton = document.createElement('div');
  screenshotButton.className = addon.tab.scratchClass('button_outlined-button', 'stage-header_stage-button');
  const screenshotButtonContent = document.createElement('div');
  screenshotButtonContent.className = addon.tab.scratchClass('button_content');
  const screenshotButtonImage = document.createElement('svg');
  screenshotButtonImage.className = addon.tab.scratchClass('stage-header_stage-button-icon');
  screenshotButtonImage.draggable = false;
  const iconSrc = addon.self.getResource('/icons/camera.svg');
  screenshotButtonImage.innerHTML = iconSrc;
  screenshotButtonContent.appendChild(screenshotButtonImage);
  screenshotButton.appendChild(screenshotButtonContent);
  screenshotButtonOuter.appendChild(screenshotButton);
  const playSoundEffect = () => {
    const soundUrl = addon.settings.get('sound_url');
    if (soundUrl) {
      try {
        const audio = new Audio(soundUrl);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (err) {
        // Audio creation failed - ignore silently
      }
    }
  };
  const showPreview = dataUrl => {
    if (!addon.settings.get('show_notifications')) return;
    if (!dataUrl) return;
    const preview = document.createElement('div');
    preview.className = 'sa-screenshot-preview';
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'sa-screenshot-preview-image';
    const image = document.createElement('img');
    image.src = dataUrl;
    imageWrapper.appendChild(image);
    const caption = document.createElement('div');
    caption.className = 'sa-screenshot-preview-caption';
    caption.textContent = msg('screenshot-taken');
    preview.append(imageWrapper, caption);
    document.body.appendChild(preview);
    setTimeout(() => preview.classList.add('sa-screenshot-preview-visible'), 100);
    setTimeout(() => {
      preview.classList.remove('sa-screenshot-preview-visible');
      setTimeout(() => {
        if (preview.parentNode) {
          preview.parentNode.removeChild(preview);
        }
      }, 300);
    }, 3000);
  };
  const takeScreenshot = async () => {
    try {
      const renderer = vm.renderer;
      if (!renderer) {
        showNotification(msg('screenshot-error'), 'error');
        return;
      }

      // Use Scratch's built-in snapshot method
      const snapshotPromise = new Promise(resolve => {
        renderer.requestSnapshot(uri => {
          resolve(uri);
        });
      });
      const dataUrl = await snapshotPromise;
      if (!dataUrl) {
        showPreview(null);
        return;
      }

      // Convert data URL to blob for clipboard
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        return;
      }

      // Copy to clipboard if supported
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({
            'image/png': blob
          })]);
          showPreview(dataUrl);
          playSoundEffect();
        } catch (err) {}
      } else {
        showPreview(dataUrl);
        playSoundEffect();
      }
    } catch (err) {
      showNotification(msg('screenshot-error'), 'error');
    }
  };

  // Add click event listener
  screenshotButton.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    takeScreenshot();
  });

  // Function to manage button visibility
  const updateButtonVisibility = () => {
    if (addon.tab.editorMode === 'editor') {
      // Add next to debugger with order 1 (debugger has order 0)
      try {
        addon.tab.appendToSharedSpace({
          space: 'stageHeader',
          element: screenshotButtonOuter,
          order: 1
        });
      } catch (err) {
        // Failed to add button - ignore silently
      }
    } else if (screenshotButtonOuter.parentNode) {
      screenshotButtonOuter.remove();
    }
  };

  // Wait for stage header and manage button visibility
  while (true) {
    try {
      await addon.tab.waitForElement('[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]', {
        markAsSeen: true,
        reduxEvents: ['scratch-gui/mode/SET_PLAYER', 'scratch-gui/mode/SET_FULL_SCREEN', 'fontsLoaded/SET_FONTS_LOADED', 'scratch-gui/locales/SELECT_LOCALE']
      });
      updateButtonVisibility();

      // Add a delay to avoid excessive processing
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-canvas-screenshot.js.map
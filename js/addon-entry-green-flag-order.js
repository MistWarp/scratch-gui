(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-green-flag-order"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/green-flag-order/style.css":
/*!********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/green-flag-order/style.css ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Green flag execution order addon styles */\n\n.sa-green-flag-order-badge {\n  /* Ensure badge appears above other elements */\n  z-index: 10;\n  pointer-events: none;\n  \n  /* Smooth transitions when badges update */\n  transition: opacity 0.2s ease;\n}\n\n.sa-green-flag-order-badge:hover {\n  opacity: 0.9;\n}\n\n/* Style for the badge background shapes */\n.sa-green-flag-order-badge circle,\n.sa-green-flag-order-badge rect {\n  /* Add subtle shadow effect */\n  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.2));\n}\n\n/* Ensure text is always readable */\n.sa-green-flag-order-badge text {\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none;\n}\n", ""]);

// exports


/***/ }),

/***/ "./src/addons/addons/green-flag-order/_runtime_entry.js":
/*!**************************************************************!*\
  !*** ./src/addons/addons/green-flag-order/_runtime_entry.js ***!
  \**************************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/green-flag-order/userscript.js");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./style.css */ "./node_modules/css-loader/index.js!./src/addons/addons/green-flag-order/style.css");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__);


const resources = {
  "userscript.js": _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  "style.css": _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default.a
};

/***/ }),

/***/ "./src/addons/addons/green-flag-order/userscript.js":
/*!**********************************************************!*\
  !*** ./src/addons/addons/green-flag-order/userscript.js ***!
  \**********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (async function (_ref) {
  let addon = _ref.addon,
    console = _ref.console,
    msg = _ref.msg;
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  let executionOrderCache = new Map();
  let isCalculating = false;

  // Calculate the execution order of green flag scripts
  // This mirrors the logic in runtime.startHats() and allScriptsByOpcodeDo()
  function calculateGreenFlagOrder() {
    if (isCalculating) return executionOrderCache;
    isCalculating = true;
    try {
      const newCache = new Map();
      let globalOrder = 1;

      // Get all executable targets in reverse order (how runtime processes them)
      const targets = vm.runtime.executableTargets || vm.runtime.targets;
      if (!targets) return new Map();

      // Process targets in reverse order (stage last, sprites in reverse layer order)
      // This matches the logic in runtime.allScriptsByOpcodeDo()
      for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        if (!target || !target.blocks) continue;

        // Get all top-level blocks (scripts) for this target
        const scripts = target.blocks.getScripts();
        if (!scripts) continue;

        // Find green flag scripts in this target
        for (const scriptId of scripts) {
          const topBlock = target.blocks.getBlock(scriptId);
          if (topBlock && topBlock.opcode === 'event_whenflagclicked') {
            newCache.set("".concat(target.id, "-").concat(scriptId), globalOrder++);
          }
        }
      }
      executionOrderCache = newCache;
      return newCache;
    } catch (error) {
      console.warn('Error calculating green flag order:', error);
      return new Map();
    } finally {
      isCalculating = false;
    }
  }

  // Add order badge to a green flag block
  function addOrderBadge(block, order) {
    // Remove existing badge if any
    removeOrderBadge(block);
    const svgRoot = block.getSvgRoot();
    if (!svgRoot) return;

    // Create badge group
    const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badgeGroup.classList.add('sa-green-flag-order-badge');
    const badgeStyle = addon.settings.get('badge_style');
    const badgeColor = addon.settings.get('badge_color');
    const textColor = addon.settings.get('text_color');

    // Create badge background
    let badgeShape;
    if (badgeStyle === 'square') {
      badgeShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      badgeShape.setAttribute('width', '20');
      badgeShape.setAttribute('height', '20');
      badgeShape.setAttribute('x', '-10');
      badgeShape.setAttribute('y', '-10');
      badgeShape.setAttribute('rx', '3');
    } else {
      badgeShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badgeShape.setAttribute('r', '12');
    }
    badgeShape.setAttribute('fill', badgeColor);
    badgeShape.setAttribute('stroke', '#333');
    badgeShape.setAttribute('stroke-width', '1');
    badgeGroup.appendChild(badgeShape);

    // Create order text
    const orderText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    orderText.setAttribute('x', '0');
    orderText.setAttribute('y', '0');
    orderText.setAttribute('text-anchor', 'middle');
    orderText.setAttribute('dominant-baseline', 'central');
    orderText.setAttribute('font-family', 'Arial, sans-serif');
    orderText.setAttribute('font-size', '12');
    orderText.setAttribute('font-weight', 'bold');
    orderText.setAttribute('fill', textColor);
    orderText.textContent = order.toString();
    badgeGroup.appendChild(orderText);

    // Position badge in top-right corner of block
    try {
      const blockBounds = block.getBoundingRectangle();
      let badgeX = 50; // fallback position
      let badgeY = -15;
      if (blockBounds && typeof blockBounds.width === 'number' && !isNaN(blockBounds.width)) {
        badgeX = 15;
      } else {
        // Try alternative method to get block width
        const blockSvg = block.getSvgRoot();
        if (blockSvg) {
          const bbox = blockSvg.getBBox();
          if (bbox && typeof bbox.width === 'number' && !isNaN(bbox.width)) {
            badgeX = 15;
          }
        }
      }
      badgeGroup.setAttribute('transform', "translate(".concat(badgeX, ", ").concat(badgeY, ")"));
    } catch (error) {
      // Fallback positioning if all methods fail
      badgeGroup.setAttribute('transform', 'translate(50, 15)');
      console.warn('Could not determine block bounds for badge positioning:', error);
    }

    // Add to block's SVG
    svgRoot.appendChild(badgeGroup);
  }

  // Remove order badge from a block
  function removeOrderBadge(block) {
    const svgRoot = block.getSvgRoot();
    if (!svgRoot) return;
    const existingBadge = svgRoot.querySelector('.sa-green-flag-order-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
  }

  // Update all green flag blocks with their execution order
  function updateAllGreenFlagBlocks() {
    try {
      // Check if we have the required APIs
      if (!vm || !vm.runtime || !ScratchBlocks) return;
      const executionOrder = calculateGreenFlagOrder();

      // Get all blocks in the workspace
      const workspace = ScratchBlocks.getMainWorkspace();
      if (!workspace || !workspace.getAllBlocks) return;
      const allBlocks = workspace.getAllBlocks();
      if (!allBlocks) return;
      for (const block of allBlocks) {
        if (block.type === 'event_whenflagclicked') {
          // Find which target this block belongs to by checking all targets
          let blockTargetId = null;
          const targets = vm.runtime.targets || [];
          for (const target of targets) {
            if (target && target.blocks && target.blocks.getBlock && target.blocks.getBlock(block.id)) {
              blockTargetId = target.id;
              break;
            }
          }
          if (blockTargetId) {
            const orderKey = "".concat(blockTargetId, "-").concat(block.id);
            if (executionOrder.has(orderKey)) {
              addOrderBadge(block, executionOrder.get(orderKey));
            } else {
              removeOrderBadge(block);
            }
          }
        } else {
          // Remove badges from non-green-flag blocks
          removeOrderBadge(block);
        }
      }
    } catch (error) {
      console.warn('Error updating green flag blocks:', error);
    }
  }

  // Clear execution order cache when workspace changes
  function clearCache() {
    executionOrderCache.clear();
  }

  // Hook into block rendering to add badges
  const originalRender = ScratchBlocks.BlockSvg.prototype.render;
  ScratchBlocks.BlockSvg.prototype.render = function (opt_bubble) {
    const result = originalRender.call(this, opt_bubble);

    // Only process green flag blocks and only if we're not in the flyout
    if (!this.isInFlyout && this.type === 'event_whenflagclicked') {
      // Delay to ensure block is fully rendered
      setTimeout(() => {
        if (!addon.self.disabled) {
          updateAllGreenFlagBlocks();
        }
      }, 10);
    }
    return result;
  };

  // Listen for workspace changes that might affect execution order
  if (vm && vm.runtime) {
    vm.runtime.on('TARGETS_UPDATE', clearCache);
    vm.runtime.on('PROJECT_LOADED', () => {
      clearCache();
      setTimeout(updateAllGreenFlagBlocks, 100);
    });
  }

  // Listen for target changes (switching sprites)
  if (vm && vm.setEditingTarget) {
    const originalSetEditingTarget = vm.setEditingTarget;
    vm.setEditingTarget = function (targetId) {
      const result = originalSetEditingTarget.call(this, targetId);
      clearCache();
      setTimeout(updateAllGreenFlagBlocks, 50);
      return result;
    };
  }

  // Listen for setting changes
  addon.settings.addEventListener('change', () => {
    clearCache();
    updateAllGreenFlagBlocks();
  });

  // Clean up when disabled
  addon.self.addEventListener('disabled', () => {
    try {
      const workspace = ScratchBlocks && ScratchBlocks.getMainWorkspace ? ScratchBlocks.getMainWorkspace() : null;
      if (workspace && workspace.getAllBlocks) {
        const allBlocks = workspace.getAllBlocks();
        if (allBlocks) {
          for (const block of allBlocks) {
            removeOrderBadge(block);
          }
        }
      }
      clearCache();
    } catch (error) {
      console.warn('Error cleaning up green flag order addon:', error);
    }
  });

  // Initial update
  if (vm && vm.editingTarget) {
    addon.tab.waitForElement('[class*="gui_workspace-wrapper"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: state => !state.scratchGui.mode.isPlayerOnly
    }).then(() => {
      setTimeout(updateAllGreenFlagBlocks, 200);
    });
  }
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-green-flag-order.js.map
(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-sprite-folders"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/sprite-folders/style.css":
/*!******************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/sprite-folders/style.css ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".sa-file-list-container {\n    width: 100%;\n    display: flex;\n    flex-direction: column;\n    min-height: 100%;\n}\n\n.sa-file-list-toolbar {\n    display: flex;\n    gap: 4px;\n    padding: 8px;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n    background: rgba(255, 255, 255, 0.02);\n}\n\n.sa-toolbar-button {\n    padding: 8px;\n    color: #cccccc;\n    background: rgba(255, 255, 255, 0.05);\n    border: 1px solid rgba(255, 255, 255, 0.1);\n    border-radius: 3px;\n    cursor: pointer;\n    transition: all 0.2s ease;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.sa-toolbar-icon {\n    width: 16px;\n    height: 16px;\n    display: inline-block;\n}\n\n.sa-toolbar-icon svg {\n    width: 100%;\n    height: 100%;\n    stroke: #cccccc;\n}\n\n.sa-toolbar-button:hover {\n    background: rgba(255, 255, 255, 0.1);\n    border-color: rgba(255, 255, 255, 0.2);\n}\n\n.sa-toolbar-button:active {\n    background: rgba(255, 255, 255, 0.15);\n}\n\n.sa-folder-context-menu {\n    position: fixed;\n    min-width: 120px;\n    background: #252526;\n    border: 1px solid rgba(255, 255, 255, 0.1);\n    border-radius: 4px;\n    padding: 4px 0;\n    z-index: 10000;\n    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n}\n\n.sa-context-menu-item {\n    padding: 6px 12px;\n    font-size: 12px;\n    color: #cccccc;\n    cursor: pointer;\n    transition: background 0.1s ease;\n}\n\n.sa-context-menu-item:hover {\n    background: rgba(255, 255, 255, 0.1);\n}\n\n.sa-context-menu-danger {\n    color: #ff5f5f;\n}\n\n.sa-context-menu-danger:hover {\n    background: rgba(255, 0, 0, 0.2);\n}\n\n.sa-file-list {\n    flex: 1;\n    display: flex;\n    flex-direction: column;\n    overflow-y: auto;\n    overflow-x: hidden;\n}\n\n.sa-folder-item {\n    display: flex;\n    align-items: center;\n    padding: 4px 8px;\n    cursor: pointer;\n    user-select: none;\n    font-size: 13px;\n    color: #cccccc;\n    transition: background 0.1s ease;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n\n.sa-folder-item:hover {\n    background: rgba(255, 255, 255, 0.05);\n}\n\n.sa-folder-item.expanded {\n    background: rgba(255, 255, 255, 0.02);\n}\n\n.sa-folder-item.expanded:hover {\n    background: rgba(255, 255, 255, 0.05);\n}\n\n.sa-folder-item.drag-over {\n    background: rgba(0, 122, 255, 0.2);\n    border-color: rgba(0, 122, 255, 0.4);\n}\n\n.sa-folder-icon {\n    margin-right: 6px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    color: #858585;\n    flex-shrink: 0;\n    width: 16px;\n    height: 16px;\n}\n\n.sa-folder-icon svg {\n    width: 100%;\n    height: 100%;\n}\n\n.sa-folder-name {\n    flex: 1;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n\n/* Hide original sprite items when our list is active */\n[class*=\"sprite-selector_items-wrapper\"] {\n    position: relative;\n}\n\n[class*=\"sprite-selector_items-wrapper\"] > [class*=\"sprite-selector_sprite-wrapper\"] {\n    display: none !important;\n}\n\n.sa-file-list-item {\n    display: flex;\n    align-items: center;\n    padding: 4px 8px;\n    cursor: pointer;\n    user-select: none;\n    font-size: 13px;\n    color: #cccccc;\n    transition: background 0.1s ease;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n\n.sa-file-list-item:hover {\n    background: rgba(255, 255, 255, 0.05);\n}\n\n.sa-file-list-item.selected {\n    background: rgba(0, 122, 255, 0.2);\n}\n\n.sa-file-list-item.selected:hover {\n    background: rgba(0, 122, 255, 0.25);\n}\n\n.sa-file-list-item.dragging {\n    opacity: 0.5;\n}\n\n.sa-file-icon-container {\n    width: 32px;\n    height: 32px;\n    margin-right: 8px;\n    flex-shrink: 0;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.sa-file-icon {\n    width: 100%;\n    height: 100%;\n    object-fit: contain;\n    border-radius: 4px;\n    background: rgba(255, 255, 255, 0.05);\n}\n\n.sa-file-name {\n    flex: 1;\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n}\n\n.sa-file-list::-webkit-scrollbar {\n    width: 8px;\n}\n\n.sa-file-list::-webkit-scrollbar-track {\n    background: transparent;\n}\n\n.sa-file-list::-webkit-scrollbar-thumb {\n    background: rgba(124, 124, 124, 0.3);\n    border-radius: 4px;\n}\n\n.sa-file-list::-webkit-scrollbar-thumb:hover {\n    background: rgba(124, 124, 124, 0.5);\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/collapse.svg":
/*!****************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/collapse.svg ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-list-chevrons-down-up-icon lucide-list-chevrons-down-up\"><path d=\"M3 5h8\"/><path d=\"M3 12h8\"/><path d=\"M3 19h8\"/><path d=\"m15 5 3 3 3-3\"/><path d=\"m15 19 3-3 3 3\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/expand.svg":
/*!**************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/expand.svg ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-list-chevrons-up-down-icon lucide-list-chevrons-up-down\"><path d=\"M3 5h8\"/><path d=\"M3 12h8\"/><path d=\"M3 19h8\"/><path d=\"m15 8 3-3 3 3\"/><path d=\"m15 16 3 3 3-3\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/file.svg":
/*!************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/file.svg ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-file-icon lucide-file\"><path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"/><path d=\"M14 2v5a1 1 0 0 0 1 1h5\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/folder-open.svg":
/*!*******************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/folder-open.svg ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-folder-open-icon lucide-folder-open\"><path d=\"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/folder.svg":
/*!**************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/folder.svg ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-folder-icon lucide-folder\"><path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/new-folder.svg":
/*!******************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/new-folder.svg ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-folder-plus-icon lucide-folder-plus\"><path d=\"M12 10v6\"/><path d=\"M9 13h6\"/><path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/stage.svg":
/*!*************************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/sprite-folders/assets/stage.svg ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-images-icon lucide-images\"><path d=\"m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16\"/><path d=\"M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2\"/><circle cx=\"13\" cy=\"7\" r=\"1\" fill=\"currentColor\"/><rect x=\"8\" y=\"2\" width=\"14\" height=\"14\" rx=\"2\"/></svg>"

/***/ }),

/***/ "./src/addons/addons/sprite-folders/_runtime_entry.js":
/*!************************************************************!*\
  !*** ./src/addons/addons/sprite-folders/_runtime_entry.js ***!
  \************************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/sprite-folders/userscript.js");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./style.css */ "./node_modules/css-loader/index.js!./src/addons/addons/sprite-folders/style.css");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _raw_loader_assets_folder_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! raw-loader!./assets/folder.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/folder.svg");
/* harmony import */ var _raw_loader_assets_folder_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_folder_svg__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _raw_loader_assets_folder_open_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! raw-loader!./assets/folder-open.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/folder-open.svg");
/* harmony import */ var _raw_loader_assets_folder_open_svg__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_folder_open_svg__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _raw_loader_assets_file_svg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! raw-loader!./assets/file.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/file.svg");
/* harmony import */ var _raw_loader_assets_file_svg__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_file_svg__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _raw_loader_assets_stage_svg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! raw-loader!./assets/stage.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/stage.svg");
/* harmony import */ var _raw_loader_assets_stage_svg__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_stage_svg__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _raw_loader_assets_expand_svg__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! raw-loader!./assets/expand.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/expand.svg");
/* harmony import */ var _raw_loader_assets_expand_svg__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_expand_svg__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _raw_loader_assets_collapse_svg__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! raw-loader!./assets/collapse.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/collapse.svg");
/* harmony import */ var _raw_loader_assets_collapse_svg__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_collapse_svg__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _raw_loader_assets_new_folder_svg__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! raw-loader!./assets/new-folder.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/sprite-folders/assets/new-folder.svg");
/* harmony import */ var _raw_loader_assets_new_folder_svg__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_assets_new_folder_svg__WEBPACK_IMPORTED_MODULE_8__);









const resources = {
  'userscript.js': _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  'style.css': _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default.a,
  'assets/folder.svg': _raw_loader_assets_folder_svg__WEBPACK_IMPORTED_MODULE_2___default.a,
  'assets/folder-open.svg': _raw_loader_assets_folder_open_svg__WEBPACK_IMPORTED_MODULE_3___default.a,
  'assets/file.svg': _raw_loader_assets_file_svg__WEBPACK_IMPORTED_MODULE_4___default.a,
  'assets/stage.svg': _raw_loader_assets_stage_svg__WEBPACK_IMPORTED_MODULE_5___default.a,
  'assets/expand.svg': _raw_loader_assets_expand_svg__WEBPACK_IMPORTED_MODULE_6___default.a,
  'assets/collapse.svg': _raw_loader_assets_collapse_svg__WEBPACK_IMPORTED_MODULE_7___default.a,
  'assets/new-folder.svg': _raw_loader_assets_new_folder_svg__WEBPACK_IMPORTED_MODULE_8___default.a
};

/***/ }),

/***/ "./src/addons/addons/sprite-folders/userscript.js":
/*!********************************************************!*\
  !*** ./src/addons/addons/sprite-folders/userscript.js ***!
  \********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (async _ref => {
  let addon = _ref.addon,
    console = _ref.console,
    msg = _ref.msg;
  const DIVIDER = '//';
  function getFolderFromName(name) {
    if (!name || typeof name !== 'string') return null;
    const idx = name.indexOf(DIVIDER);
    if (idx === -1 || idx === 0) return null;
    return name.substr(0, idx);
  }
  function getNameWithoutFolder(name) {
    if (!name || typeof name !== 'string') return name;
    const idx = name.indexOf(DIVIDER);
    if (idx === -1 || idx === 0) return name;
    return name.substr(idx + DIVIDER.length);
  }
  function setFolderOfName(name, folder) {
    const basename = getNameWithoutFolder(name);
    if (folder) {
      return "".concat(folder).concat(DIVIDER).concat(basename);
    }
    return basename;
  }
  let vm;
  let expandedFolders = new Set();
  let emptyFolders = new Set();
  let draggedSprite = null;
  let draggedOverFolder = null;

  // Cache for loaded SVGs
  const svgCache = new Map();
  async function loadSVG(name) {
    if (svgCache.has(name)) {
      return svgCache.get(name);
    }
    try {
      const svgContent = await addon.self.getResource("/assets/".concat(name, ".svg"));
      if (svgContent) {
        svgCache.set(name, svgContent);
        return svgContent;
      }
    } catch (e) {
      console.warn("Failed to load SVG ".concat(name, ":"), e);
    }
    return '';
  }
  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'sa-file-list-toolbar';
    const btnExpand = createToolbarButton('expand', 'Expand All', () => expandAllFolders());
    const btnCollapse = createToolbarButton('collapse', 'Collapse All', () => collapseAllFolders());
    const btnAddFolder = createToolbarButton('new-folder', 'New Folder', () => createNewFolder());
    toolbar.appendChild(btnExpand);
    toolbar.appendChild(btnCollapse);
    toolbar.appendChild(btnAddFolder);
    return toolbar;
  }
  function createToolbarButton(iconName, title, onClick) {
    const btn = document.createElement('button');
    btn.className = 'sa-toolbar-button';
    btn.title = title;
    btn.addEventListener('click', onClick);
    const icon = document.createElement('span');
    icon.className = 'sa-toolbar-icon';
    loadSVG(iconName).then(svgContent => {
      if (svgContent) {
        icon.innerHTML = svgContent;
        icon.style.display = 'inline-block';
      }
    });
    btn.appendChild(icon);
    return btn;
  }
  function expandAllFolders() {
    const currentFolders = new Set();
    vm.runtime.targets.forEach(t => {
      var _t$sprite;
      const name = t.name || ((_t$sprite = t.sprite) === null || _t$sprite === void 0 ? void 0 : _t$sprite.name);
      if (name) {
        const folder = getFolderFromName(name);
        if (folder) currentFolders.add(folder);
      }
    });
    expandedFolders = currentFolders;
    renderFileList();
  }
  function collapseAllFolders() {
    expandedFolders.clear();
    renderFileList();
  }
  function createNewFolder() {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    // Check if folder already exists
    const existingWithSprites = vm.runtime.targets.some(t => {
      var _t$sprite2;
      const name = t.name || ((_t$sprite2 = t.sprite) === null || _t$sprite2 === void 0 ? void 0 : _t$sprite2.name);
      return name && getFolderFromName(name) === folderName;
    });
    if (existingWithSprites || emptyFolders.has(folderName)) {
      alert('Folder already exists!');
      return;
    }
    emptyFolders.add(folderName);
    expandedFolders.add(folderName);
    renderFileList();
  }
  function renameFolder(oldFolderName) {
    const newFolderName = prompt("Rename folder \"".concat(oldFolderName, "\" to:"), oldFolderName);
    if (!newFolderName || newFolderName === oldFolderName) return;
    const hasSprites = vm.runtime.targets.some(t => {
      var _t$sprite3;
      const name = t.name || ((_t$sprite3 = t.sprite) === null || _t$sprite3 === void 0 ? void 0 : _t$sprite3.name);
      return name && getFolderFromName(name) === oldFolderName;
    });

    // Handle empty folders (UI-only)
    if (!hasSprites && emptyFolders.has(oldFolderName)) {
      emptyFolders.delete(oldFolderName);
      emptyFolders.add(newFolderName);
      if (expandedFolders.has(oldFolderName)) {
        expandedFolders.delete(oldFolderName);
        expandedFolders.add(newFolderName);
      }
      renderFileList();
      return;
    }

    // Handle folders with sprites
    const targets = vm.runtime.targets.filter(t => {
      var _t$sprite4;
      const name = t.name || ((_t$sprite4 = t.sprite) === null || _t$sprite4 === void 0 ? void 0 : _t$sprite4.name);
      if (!name) return false;
      return getFolderFromName(name) === oldFolderName;
    });
    targets.forEach(target => {
      var _target$sprite;
      const oldName = target.name || ((_target$sprite = target.sprite) === null || _target$sprite === void 0 ? void 0 : _target$sprite.name);
      const newName = setFolderOfName(oldName, newFolderName);
      vm.renameSprite(target.id, newName);
    });
    renderFileList();
  }
  function deleteFolder(folderName) {
    const hasSprites = vm.runtime.targets.some(t => {
      var _t$sprite5;
      const name = t.name || ((_t$sprite5 = t.sprite) === null || _t$sprite5 === void 0 ? void 0 : _t$sprite5.name);
      return name && getFolderFromName(name) === folderName;
    });
    if (hasSprites) {
      if (!confirm("Delete folder \"".concat(folderName, "\" and all its sprites?"))) return;
      const targets = vm.runtime.targets.filter(t => {
        var _t$sprite6;
        const name = t.name || ((_t$sprite6 = t.sprite) === null || _t$sprite6 === void 0 ? void 0 : _t$sprite6.name);
        if (!name) return false;
        return getFolderFromName(name) === folderName;
      });
      targets.forEach(target => {
        vm.deleteSprite(target.id);
      });
    } else {
      if (!confirm("Remove empty folder \"".concat(folderName, "\" from the list?"))) return;
      emptyFolders.delete(folderName);
    }
    expandedFolders.delete(folderName);
    renderFileList();
  }
  async function getSpriteImage(sprite) {
    // Runtime targets have a .sprite property that contains the costume info
    const actualSprite = sprite.sprite || sprite;

    // Get the current costume from the sprite's costume array
    const costumes = actualSprite.costumes;
    if (costumes && costumes.length > 0) {
      // Use currentCostumeIndex if available
      const index = actualSprite.currentCostumeIndex || 0;
      const costume = costumes[Math.min(index, costumes.length - 1)];
      if (costume && costume.asset) {
        try {
          const dataUri = await costume.asset.encodeDataURI();
          if (dataUri) return dataUri;
        } catch (e) {}

        // Fallback to asset URL
        if (costume.asset.assetId) {
          const url = "https://assets.scratch.mit.edu/internalapi/asset/".concat(costume.asset.assetId, ".").concat(costume.dataFormat || 'png', "/get/");
          return url;
        }
        if (costume.md5ext) {
          return "https://assets.scratch.mit.edu/internalapi/asset/".concat(costume.md5ext, "/get/");
        }
      }
    }
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }
  function getSpriteDisplayName(sprite) {
    var _sprite$sprite;
    const spriteName = sprite.name || ((_sprite$sprite = sprite.sprite) === null || _sprite$sprite === void 0 ? void 0 : _sprite$sprite.name) || 'Untitled';
    const folder = getFolderFromName(spriteName);
    return folder ? getNameWithoutFolder(spriteName) : spriteName;
  }
  function sortSpritesAlphabetically(sprites) {
    return sprites.sort((a, b) => {
      const nameA = getSpriteDisplayName(a).toLowerCase();
      const nameB = getSpriteDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }
  let spriteItemIcons = new Map();
  function updateSpriteIcon(sprite) {
    const icon = spriteItemIcons.get(sprite.id);
    if (!icon) return;
    const actualSprite = sprite.sprite || sprite;
    const costumes = actualSprite.costumes;
    if (costumes && costumes.length > 0) {
      const index = actualSprite.currentCostumeIndex || 0;
      const costume = costumes[Math.min(index, costumes.length - 1)];
      if (costume && costume.asset) {
        costume.asset.encodeDataURI().then(dataUri => {
          if (dataUri && icon.parentNode) {
            icon.src = dataUri;
          }
        }).catch(() => {
          const url = "https://assets.scratch.mit.edu/internalapi/asset/".concat(costume.asset.assetId, ".").concat(costume.dataFormat || 'png', "/get/");
          if (icon.parentNode) {
            icon.src = url;
          }
        });
      }
    }
  }
  function renderFileList() {
    const container = document.querySelector('[class*="sprite-selector_items-wrapper"]');
    if (!container || !vm || !vm.runtime || !vm.runtime.targets) return;
    const existingContainer = container.querySelector('.sa-file-list-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    spriteItemIcons.clear();
    const listContainer = document.createElement('div');
    listContainer.className = 'sa-file-list-container';
    const toolbar = createToolbar();
    listContainer.appendChild(toolbar);
    const fileList = document.createElement('div');
    fileList.className = 'sa-file-list';
    const sprites = vm.runtime.targets.filter(t => !t.isStage && t.id);

    // Group sprites by folder
    const grouped = {};
    sprites.forEach(sprite => {
      var _sprite$sprite2;
      const spriteName = sprite.name || ((_sprite$sprite2 = sprite.sprite) === null || _sprite$sprite2 === void 0 ? void 0 : _sprite$sprite2.name);
      if (!spriteName) return;
      const folder = getFolderFromName(spriteName);
      if (folder) {
        if (!grouped[folder]) {
          grouped[folder] = [];
        }
        grouped[folder].push(sprite);
      }
    });

    // Sprites without folders
    const nonFolderSprites = sprites.filter(sprite => {
      var _sprite$sprite3;
      const spriteName = sprite.name || ((_sprite$sprite3 = sprite.sprite) === null || _sprite$sprite3 === void 0 ? void 0 : _sprite$sprite3.name);
      return !spriteName || !getFolderFromName(spriteName);
    });

    // Get all folder folders (both with sprites and empty)
    const allFolders = new Set([...Object.keys(grouped), ...emptyFolders]);

    // Sort folders alphabetically
    const sortedFolders = Array.from(allFolders).sort();

    // Render folders first
    sortedFolders.forEach(folder => {
      const folderItem = createFolderItem(folder, 0);
      fileList.appendChild(folderItem);
      if (expandedFolders.has(folder) && grouped[folder]) {
        // Sort sprites within this folder alphabetically
        const sortedSprites = sortSpritesAlphabetically(grouped[folder]);
        sortedSprites.forEach(sprite => {
          fileList.appendChild(createListItem(sprite, 1, fileList, container));
        });
      }
    });

    // Render non-folder sprites at the bottom, sorted alphabetically
    const sortedNonFolderSprites = sortSpritesAlphabetically(nonFolderSprites);
    sortedNonFolderSprites.forEach(sprite => {
      fileList.appendChild(createListItem(sprite, 0, fileList, container));
    });
    listContainer.appendChild(fileList);
    const originalContent = container.querySelector('[class*="sprite-selector_sprite-wrapper"]');
    if (originalContent) {
      originalContent.style.display = 'none';
    }
    container.appendChild(listContainer);
  }
  function createListItem(sprite) {
    var _sprite$sprite4;
    let level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    let fileList = arguments.length > 2 ? arguments[2] : undefined;
    let container = arguments.length > 3 ? arguments[3] : undefined;
    const item = document.createElement('div');
    const isSelected = vm && vm.editingTarget && sprite.id === vm.editingTarget.id;
    item.className = "sa-file-list-item ".concat(isSelected ? 'selected' : '');
    item.dataset.spriteId = sprite.id;
    item.style.paddingLeft = "".concat(level * 16 + 8, "px");
    item.draggable = true;
    const iconContainer = document.createElement('span');
    iconContainer.className = 'sa-file-icon-container';
    const icon = document.createElement('img');
    icon.className = 'sa-file-icon';
    icon.alt = '';
    spriteItemIcons.set(sprite.id, icon);
    getSpriteImage(sprite).then(src => {
      if (icon.parentNode) {
        icon.src = src;
        icon.addEventListener('error', () => {
          console.error('Failed to load sprite image:', sprite.name, src);
        });
      }
    });
    iconContainer.appendChild(icon);
    const name = document.createElement('span');
    name.className = 'sa-file-name';
    const spriteName = sprite.name || ((_sprite$sprite4 = sprite.sprite) === null || _sprite$sprite4 === void 0 ? void 0 : _sprite$sprite4.name) || 'Untitled';
    const folder = getFolderFromName(spriteName);
    name.textContent = folder ? getNameWithoutFolder(spriteName) : spriteName;
    item.appendChild(iconContainer);
    item.appendChild(name);
    item.addEventListener('click', () => selectSprite(sprite));

    // Right-click to show context menu
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();

      // Select the sprite first
      selectSprite(sprite);
      showSpriteContextMenu(e, sprite, container);
    });

    // Drag events
    item.addEventListener('dragstart', e => {
      draggedSprite = sprite;
      selectSprite(sprite);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      draggedSprite = null;
      item.classList.remove('dragging');
      if (draggedOverFolder) {
        draggedOverFolder.classList.remove('drag-over');
        draggedOverFolder = null;
      }
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    return item;
  }
  function createFolderItem(foldername) {
    let level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    const isExpanded = expandedFolders.has(foldername);
    const item = document.createElement('div');
    item.className = "sa-folder-item ".concat(isExpanded ? 'expanded' : '');
    item.style.paddingLeft = "".concat(level * 16 + 8, "px");

    // Folder icon
    const folderIconWrapper = document.createElement('span');
    folderIconWrapper.className = 'sa-folder-icon';
    item.appendChild(folderIconWrapper);
    loadSVG(isExpanded ? 'folder-open' : 'folder').then(svgContent => {
      if (svgContent) {
        folderIconWrapper.innerHTML = svgContent;
        folderIconWrapper.style.display = 'inline-flex';
      }
    });
    const name = document.createElement('span');
    name.className = 'sa-folder-name';
    name.textContent = foldername;
    item.appendChild(name);
    item.addEventListener('click', () => toggleFolder(foldername));

    // Folder right-click menu
    item.addEventListener('contextmenu', e => {
      e.preventDefault();
      showFolderContextMenu(e, foldername);
    });

    // Drop events for folders
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (!isExpanded) {
        e.dataTransfer.dropEffect = 'move';
      }
    });
    item.addEventListener('dragenter', e => {
      var _draggedSprite$sprite;
      e.preventDefault();
      if (draggedSprite && getFolderFromName(draggedSprite.name || ((_draggedSprite$sprite = draggedSprite.sprite) === null || _draggedSprite$sprite === void 0 ? void 0 : _draggedSprite$sprite.name)) !== foldername) {
        item.classList.add('drag-over');
        draggedOverFolder = item;
      }
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (draggedSprite) {
        var _draggedSprite$sprite2;
        const spriteName = draggedSprite.name || ((_draggedSprite$sprite2 = draggedSprite.sprite) === null || _draggedSprite$sprite2 === void 0 ? void 0 : _draggedSprite$sprite2.name);
        const currentFolder = getFolderFromName(spriteName);
        if (currentFolder !== foldername) {
          const newName = setFolderOfName(spriteName, foldername);
          vm.renameSprite(draggedSprite.id, newName);

          // If folder was empty, it's no longer empty
          if (emptyFolders.has(foldername)) {
            emptyFolders.delete(foldername);
          }
          setTimeout(() => renderFileList(), 100);
        }
      }
    });
    return item;
  }
  function showFolderContextMenu(e, foldername) {
    const menu = document.createElement('div');
    menu.className = 'sa-folder-context-menu';
    menu.style.left = "".concat(e.clientX, "px");
    menu.style.top = "".concat(e.clientY, "px");
    const hasSprites = vm.runtime.targets.some(t => {
      var _t$sprite7;
      const name = t.name || ((_t$sprite7 = t.sprite) === null || _t$sprite7 === void 0 ? void 0 : _t$sprite7.name);
      return name && getFolderFromName(name) === foldername;
    });
    const btnRename = document.createElement('div');
    btnRename.className = 'sa-context-menu-item';
    btnRename.textContent = 'Rename';
    btnRename.addEventListener('click', () => {
      menu.remove();
      renameFolder(foldername);
    });
    const btnDelete = document.createElement('div');
    btnDelete.className = 'sa-context-menu-item';
    btnDelete.textContent = hasSprites ? 'Delete' : 'Remove Folder';
    btnDelete.addEventListener('click', () => {
      menu.remove();
      deleteFolder(foldername);
    });
    menu.appendChild(btnRename);
    menu.appendChild(btnDelete);
    document.body.appendChild(menu);
    const closeMenu = e2 => {
      if (!menu.contains(e2.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }
  function showSpriteContextMenu(e, sprite, container) {
    const menu = document.createElement('div');
    menu.className = 'sa-folder-context-menu';
    menu.style.left = "".concat(e.clientX, "px");
    menu.style.top = "".concat(e.clientY, "px");
    const duplicateBtn = document.createElement('div');
    duplicateBtn.className = 'sa-context-menu-item';
    duplicateBtn.textContent = 'Duplicate';
    duplicateBtn.addEventListener('click', () => {
      menu.remove();
      vm.duplicateSprite(sprite.id);
    });
    const exportBtn = document.createElement('div');
    exportBtn.className = 'sa-context-menu-item';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => {
      menu.remove();
      // Find the original wrapper and call its export handler
      const originalWrappers = container.querySelectorAll('[class*="sprite-selector_sprite-wrapper"]');
      for (const wrapper of originalWrappers) {
        const reactKey = Object.keys(wrapper).find(key => key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber'));
        if (reactKey) {
          var _fiber$return, _fiber$return$return;
          const fiber = wrapper[reactKey];
          const stateNode = fiber === null || fiber === void 0 ? void 0 : (_fiber$return = fiber.return) === null || _fiber$return === void 0 ? void 0 : (_fiber$return$return = _fiber$return.return) === null || _fiber$return$return === void 0 ? void 0 : _fiber$return$return.stateNode;
          const props = (stateNode === null || stateNode === void 0 ? void 0 : stateNode.props) || (fiber === null || fiber === void 0 ? void 0 : fiber.memoizedProps);
          if (props && props.id === sprite.id && props.onExportButtonClick) {
            props.onExportButtonClick();
            return;
          }
        }
      }
    });
    const renameBtn = document.createElement('div');
    renameBtn.className = 'sa-context-menu-item';
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', () => {
      var _sprite$sprite5, _sprite$sprite6;
      menu.remove();
      const newName = prompt('Rename sprite:', sprite.name || ((_sprite$sprite5 = sprite.sprite) === null || _sprite$sprite5 === void 0 ? void 0 : _sprite$sprite5.name));
      if (newName && newName !== (sprite.name || ((_sprite$sprite6 = sprite.sprite) === null || _sprite$sprite6 === void 0 ? void 0 : _sprite$sprite6.name))) {
        vm.renameSprite(sprite.id, newName);
      }
    });
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'sa-context-menu-item sa-context-menu-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this sprite?')) {
        menu.remove();
        vm.deleteSprite(sprite.id);
      }
    });
    menu.appendChild(duplicateBtn);
    menu.appendChild(exportBtn);
    menu.appendChild(renameBtn);
    menu.appendChild(deleteBtn);
    document.body.appendChild(menu);
    const closeMenu = e2 => {
      if (!menu.contains(e2.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  }
  function toggleFolder(foldername) {
    if (expandedFolders.has(foldername)) {
      expandedFolders.delete(foldername);
    } else {
      expandedFolders.add(foldername);
    }
    renderFileList();
  }
  function selectSprite(sprite) {
    if (!vm || !vm.setEditingTarget) return;
    vm.setEditingTarget(sprite.id);
  }
  function updateSelection() {
    if (!vm || !vm.editingTarget || !vm.editingTarget.id) return;
    const items = document.querySelectorAll('.sa-file-list-item');
    items.forEach(item => {
      const spriteId = item.dataset.spriteId;
      if (spriteId === vm.editingTarget.id) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
  function autoExpandCurrentFolder() {
    var _currentSprite$sprite;
    if (!vm || !vm.editingTarget) return;
    const currentSprite = vm.editingTarget;
    if (!currentSprite || currentSprite.isStage) return;
    const spriteName = currentSprite.name || ((_currentSprite$sprite = currentSprite.sprite) === null || _currentSprite$sprite === void 0 ? void 0 : _currentSprite$sprite.name);
    if (!spriteName) return;
    const folder = getFolderFromName(spriteName);
    if (folder && !expandedFolders.has(folder)) {
      expandedFolders.add(folder);
      renderFileList();
    }
  }
  function observeSpriteList() {
    let renderTimeout = null;
    let updateTimeout = null;
    const observer = new MutationObserver(mutations => {
      let spriteItemsChanged = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.toString().includes('sprite-selector_sprite-wrapper')) {
              spriteItemsChanged = true;
            }
          }
        });
      });
      const listContainer = container === null || container === void 0 ? void 0 : container.querySelector('.sa-file-list-container');

      // Hide any new original sprite items that appear
      const originalItems = container === null || container === void 0 ? void 0 : container.querySelectorAll('[class*="sprite-selector_sprite-wrapper"]');
      if (originalItems) {
        originalItems.forEach(item => {
          if (item.style.display !== 'none') {
            item.style.display = 'none';
          }
        });
      }

      // Check if our container exists, if not render it
      if (!listContainer || spriteItemsChanged) {
        if (!renderTimeout) {
          renderTimeout = setTimeout(() => {
            renderFileList();
            renderTimeout = null;
          }, 50);
        }
        return;
      }

      // Debounce updateSelection to avoid excessive calls
      if (!updateTimeout) {
        updateTimeout = setTimeout(() => {
          updateSelection();
          updateTimeout = null;
        }, 50);
      }
    });
    const container = document.querySelector('[class*="sprite-selector_items-wrapper"]');
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }
  vm = addon.tab.traps.vm;

  // Wait for both the container and sprites to be available
  const container = await addon.tab.waitForElement('[class*="sprite-selector_items-wrapper"]');

  // Initial render after ensuring sprites are loaded
  function initialRender() {
    if (vm && vm.runtime && vm.runtime.targets && vm.runtime.targets.length > 0) {
      if (vm.editingTarget) {
        autoExpandCurrentFolder();
      }
      renderFileList();
    } else {
      // If sprites aren't loaded yet, try again after a short delay
      setTimeout(initialRender, 100);
    }
  }
  initialRender();
  observeSpriteList();

  // Listen for sprite updates
  vm.runtime.on('targetsUpdate', () => {
    setTimeout(() => {
      // Update icons for sprites whose costumes have changed before re-rendering
      vm.runtime.targets.forEach(target => {
        if (!target.isStage && target.id) {
          updateSpriteIcon(target);
        }
      });
      renderFileList();
      updateSelection();
    }, 100);
  });
  vm.runtime.on('targetChanged', () => {
    updateSelection();
    autoExpandCurrentFolder();
  });
  vm.on('SCRIPT_CHANGED', () => {
    updateSelection();
  });
  let visualUpdateTimeout = null;
  vm.on('VISUAL_CHANGED', () => {
    updateSelection();
    // Debounce and re-render the entire list when visuals change
    if (visualUpdateTimeout) clearTimeout(visualUpdateTimeout);
    visualUpdateTimeout = setTimeout(() => {
      renderFileList();
      visualUpdateTimeout = null;
    }, 100);
  });
  vm.on('PROJECT_CHANGED', () => {
    renderFileList();
    updateSelection();
  });

  // Listen for sprite addition (VM event when new sprite is created)
  const originalInstallTargets = vm.installTargets.bind(vm);
  vm.installTargets = function () {
    return originalInstallTargets(...arguments).then(() => {
      setTimeout(() => {
        renderFileList();
        updateSelection();
      }, 100);
    });
  };

  // Also listen for project loaded events
  vm.on('PROJECT_LOADED', () => {
    setTimeout(() => {
      renderFileList();
      if (vm.editingTarget) {
        autoExpandCurrentFolder();
      }
    }, 500);
  });
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-sprite-folders.js.map
(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-variable-manager"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/variable-manager/style.css":
/*!********************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/variable-manager/style.css ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".mw-vm {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  overflow: hidden;\n  background: transparent;\n  color: var(--text-primary);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  -webkit-font-smoothing: antialiased;\n  box-sizing: border-box;\n}\n\n.mw-vm *,\n.mw-vm *::before,\n.mw-vm *::after {\n  box-sizing: border-box;\n}\n\n.mw-vm [hidden] {\n  display: none !important;\n}\n\n/* Header ---------------------------------------------------------------- */\n.mw-vm-header {\n  display: flex;\n  flex-direction: column;\n  gap: 0.5rem;\n  padding: 0.75rem;\n  border-bottom: 1px solid var(--ui-black-transparent);\n  flex-shrink: 0;\n}\n\n.mw-vm-search-wrap {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n\n.mw-vm-search-icon {\n  position: absolute;\n  left: 0.6rem;\n  width: 0.9rem;\n  height: 0.9rem;\n  opacity: 0.5;\n  pointer-events: none;\n  display: flex;\n}\n\n.mw-vm-search-icon svg,\n.mw-vm-search-clear svg,\n.mw-vm-seg-icon svg,\n.mw-vm-tool svg,\n.mw-vm-section-icon svg,\n.mw-vm-icon svg,\n.mw-vm-empty-icon svg {\n  width: 100%;\n  height: 100%;\n}\n\n.mw-vm-search {\n  width: 100%;\n  height: 2rem;\n  padding: 0 2rem;\n  border: 1px solid var(--ui-black-transparent);\n  border-radius: 8px;\n  background: var(--input-background);\n  color: var(--text-primary);\n  font-family: inherit;\n  font-size: 0.8125rem;\n  outline: none;\n  transition: border-color 0.15s ease, box-shadow 0.15s ease;\n}\n\n.mw-vm-search:focus {\n  border-color: var(--looks-secondary);\n  box-shadow: 0 0 0 2px var(--looks-transparent);\n}\n\n.mw-vm-search::placeholder {\n  color: var(--text-primary);\n  opacity: 0.5;\n}\n\n.mw-vm-search-clear {\n  position: absolute;\n  right: 0.4rem;\n  width: 1.2rem;\n  height: 1.2rem;\n  padding: 0.25rem;\n  border: 0;\n  border-radius: 50%;\n  background: transparent;\n  color: var(--text-primary);\n  opacity: 0.6;\n  cursor: pointer;\n  display: flex;\n  transition: opacity 0.15s ease, background-color 0.15s ease;\n}\n\n.mw-vm-search-clear:hover {\n  opacity: 1;\n  background: var(--ui-black-transparent);\n}\n\n.mw-vm-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 0.5rem;\n}\n\n.mw-vm-segment {\n  display: inline-flex;\n  gap: 2px;\n  padding: 2px;\n  background: var(--ui-black-transparent);\n  border-radius: 8px;\n}\n\n.mw-vm-seg {\n  display: flex;\n  align-items: center;\n  gap: 0.35rem;\n  padding: 0.3rem 0.55rem;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--text-primary);\n  font-family: inherit;\n  font-size: 0.75rem;\n  font-weight: 600;\n  font-variant-numeric: tabular-nums;\n  cursor: pointer;\n  opacity: 0.7;\n  transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;\n}\n\n.mw-vm-seg:hover {\n  opacity: 1;\n}\n\n.mw-vm-seg-active {\n  background: var(--looks-secondary);\n  color: #fff;\n  opacity: 1;\n}\n\n.mw-vm-seg-icon {\n  width: 0.85rem;\n  height: 0.85rem;\n  display: flex;\n}\n\n.mw-vm-seg-count {\n  opacity: 0.75;\n}\n\n.mw-vm-tool {\n  width: 2rem;\n  height: 2rem;\n  padding: 0.45rem;\n  border: 1px solid var(--ui-black-transparent);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--text-primary);\n  cursor: pointer;\n  opacity: 0.75;\n  flex-shrink: 0;\n  display: flex;\n  transition: opacity 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;\n}\n\n.mw-vm-tool:hover {\n  opacity: 1;\n  border-color: var(--looks-secondary);\n  color: var(--looks-secondary);\n}\n\n.mw-vm-tool:active {\n  background: var(--ui-black-transparent);\n}\n\n/* Content --------------------------------------------------------------- */\n.mw-vm-content {\n  flex: 1;\n  min-height: 0;\n  overflow-y: auto;\n  overflow-x: hidden;\n  padding: 0.25rem 0.5rem 0.75rem;\n}\n\n.mw-vm-section-head {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  display: flex;\n  align-items: center;\n  gap: 0.4rem;\n  padding: 0.75rem 0.5rem 0.4rem;\n  font-size: 0.65rem;\n  font-weight: 700;\n  letter-spacing: 0.06em;\n  text-transform: uppercase;\n  opacity: 0.6;\n  background: var(--ui-modal-background, var(--ui-primary));\n}\n\n.mw-vm-section-icon {\n  width: 0.8rem;\n  height: 0.8rem;\n  display: flex;\n}\n\n.mw-vm-section-title {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.mw-vm-section-count {\n  font-variant-numeric: tabular-nums;\n}\n\n.mw-vm-list {\n  display: flex;\n  flex-direction: column;\n  gap: 1px;\n}\n\n/* Row ------------------------------------------------------------------- */\n.mw-vm-row {\n  display: flex;\n  align-items: flex-start;\n  gap: 0.5rem;\n  padding: 0.4rem 0.5rem;\n  border-radius: 8px;\n  transition: background-color 0.12s ease;\n}\n\n.mw-vm-row:hover {\n  background: var(--ui-black-transparent);\n}\n\n.mw-vm-icon {\n  flex-shrink: 0;\n  width: 0.9rem;\n  height: 0.9rem;\n  margin-top: 0.3rem;\n  display: flex;\n}\n\n.mw-vm-row[data-kind=\"variable\"] .mw-vm-icon {\n  color: var(--data-primary, #ff8c1a);\n}\n\n.mw-vm-row[data-kind=\"list\"] .mw-vm-icon {\n  color: var(--red-primary, #fc662c);\n}\n\n.mw-vm-row[data-kind=\"cloud\"] .mw-vm-icon {\n  color: var(--looks-secondary);\n}\n\n.mw-vm-name-cell {\n  display: flex;\n  align-items: center;\n  gap: 0.3rem;\n  flex: 0 0 36%;\n  min-width: 5.5rem;\n  padding-top: 0.15rem;\n}\n\n.mw-vm-name {\n  flex: 1;\n  min-width: 0;\n  padding: 0.25rem 0.4rem;\n  border: 1px solid transparent;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--text-primary);\n  font-family: inherit;\n  font-size: 0.8125rem;\n  font-weight: 600;\n  outline: none;\n  transition: background-color 0.15s ease, border-color 0.15s ease;\n}\n\n.mw-vm-name:hover {\n  background: var(--ui-black-transparent);\n}\n\n.mw-vm-name:focus {\n  background: var(--input-background);\n  border-color: var(--looks-secondary);\n}\n\n.mw-vm-badge {\n  flex-shrink: 0;\n  padding: 0.05rem 0.35rem;\n  border: 1px solid var(--ui-black-transparent);\n  border-radius: 999px;\n  font-size: 0.5625rem;\n  font-weight: 700;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  opacity: 0.7;\n}\n\n.mw-vm-badge[data-badge=\"cloud\"] {\n  color: var(--looks-secondary);\n  border-color: var(--looks-secondary);\n  opacity: 1;\n}\n\n.mw-vm-value-cell {\n  flex: 1;\n  min-width: 0;\n}\n\n.mw-vm-value {\n  width: 100%;\n  min-height: 1.75rem;\n  padding: 0.3rem 0.45rem;\n  border: 1px solid var(--ui-black-transparent);\n  border-radius: 6px;\n  background: var(--input-background);\n  color: var(--text-primary);\n  font-family: \"SF Mono\", \"Monaco\", \"Inconsolata\", \"Fira Code\", monospace;\n  font-size: 0.75rem;\n  line-height: 1.5;\n  outline: none;\n  resize: vertical;\n  transition: border-color 0.15s ease, box-shadow 0.15s ease;\n}\n\n.mw-vm-value:focus {\n  border-color: var(--looks-secondary);\n  box-shadow: 0 0 0 2px var(--looks-transparent);\n}\n\ntextarea.mw-vm-value {\n  display: block;\n  overflow: hidden;\n}\n\n.mw-vm-big {\n  display: none;\n  width: 100%;\n  padding: 0.3rem 0.45rem;\n  border: 1px dashed var(--ui-black-transparent);\n  border-radius: 6px;\n  background: transparent;\n  color: var(--text-primary);\n  font-family: inherit;\n  font-size: 0.75rem;\n  font-style: italic;\n  opacity: 0.7;\n  cursor: pointer;\n  transition: border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;\n}\n\n.mw-vm-big:hover {\n  border-color: var(--looks-secondary);\n  color: var(--looks-secondary);\n  opacity: 1;\n}\n\n.mw-vm-row[data-big=\"true\"] .mw-vm-value {\n  display: none;\n}\n\n.mw-vm-row[data-big=\"true\"] .mw-vm-big {\n  display: block;\n}\n\n.mw-vm-error {\n  border-color: var(--error-primary) !important;\n  background: var(--error-transparent) !important;\n  animation: mw-vm-shake 0.3s ease;\n}\n\n@keyframes mw-vm-shake {\n  0%, 100% { transform: translateX(0); }\n  25% { transform: translateX(-3px); }\n  75% { transform: translateX(3px); }\n}\n\n/* Freeze while editing so live updates don't fight the user */\n.mw-vm-frozen .mw-vm-value:not(:focus),\n.mw-vm-frozen .mw-vm-name:not(:focus) {\n  opacity: 0.5;\n}\n\n/* Empty state ----------------------------------------------------------- */\n.mw-vm-empty {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 0.35rem;\n  padding: 3rem 1.25rem;\n  text-align: center;\n}\n\n.mw-vm-empty-icon {\n  width: 2.25rem;\n  height: 2.25rem;\n  opacity: 0.35;\n  display: flex;\n}\n\n.mw-vm-empty-title {\n  font-size: 0.85rem;\n  font-weight: 600;\n}\n\n.mw-vm-empty-sub {\n  font-size: 0.72rem;\n  opacity: 0.6;\n}\n\n/* Scrollbar ------------------------------------------------------------- */\n.mw-vm-content::-webkit-scrollbar {\n  width: 8px;\n}\n\n.mw-vm-content::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n.mw-vm-content::-webkit-scrollbar-thumb {\n  background-color: var(--ui-black-transparent);\n  border-radius: 8px;\n  border: 2px solid transparent;\n  background-clip: content-box;\n}\n\n/* Narrow window: stack name over value */\n@media (max-width: 520px) {\n  .mw-vm-row {\n    flex-wrap: wrap;\n  }\n\n  .mw-vm-name-cell {\n    flex-basis: calc(100% - 1.4rem);\n  }\n\n  .mw-vm-value-cell {\n    flex-basis: 100%;\n    margin-left: 1.4rem;\n  }\n}\n\n/* Stage header button integration -------------------------------------- */\n.sa-variable-manager-container,\n.sa-variable-manager-container * {\n  user-select: none;\n  -webkit-user-select: none;\n}\n\n[dir=\"ltr\"] .sa-variable-manager-container {\n  margin-right: 0.5rem;\n}\n\n[dir=\"rtl\"] .sa-variable-manager-container {\n  margin-left: 0.5rem;\n}\n\n.sa-small-stage [class*=\"gui_body-wrapper_\"]:not(.sa-stage-hidden) .sa-variable-manager-container {\n  display: none !important;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/addons/addons/variable-manager/icon.svg":
/*!*******************************************************************************!*\
  !*** ./node_modules/raw-loader!./src/addons/addons/variable-manager/icon.svg ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-variable-icon lucide-variable\"><path d=\"M8 21s-4-3-4-9 4-9 4-9\"/><path d=\"M16 3s4 3 4 9-4 9-4 9\"/><line x1=\"15\" x2=\"9\" y1=\"9\" y2=\"15\"/><line x1=\"9\" x2=\"15\" y1=\"9\" y2=\"15\"/></svg>"

/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/variable-manager/search.svg":
/*!*********************************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/variable-manager/search.svg ***!
  \*********************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0E2LjQ3MSA2LjQ3MSAwIDAgMCAxNiA5LjUgNi41IDYuNSAwIDEgMCA5LjUgMTZjMS42MSAwIDMuMDktLjU5IDQuMjMtMS41N2wuMjcuMjh2Ljc5bDUgNC45OUwyMC40OSAxOWwtNC45OS01em0tNiAwQzcuMDEgMTQgNSAxMS45OSA1IDkuNVM3LjAxIDUgOS41IDUgMTQgNy4wMSAxNCA5LjUgMTEuOTkgMTQgOS41IDE0eiIgZmlsbD0iI0QzRDNEMyIvPjxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz48L3N2Zz4=");

/***/ }),

/***/ "./src/addons/addons/variable-manager/_runtime_entry.js":
/*!**************************************************************!*\
  !*** ./src/addons/addons/variable-manager/_runtime_entry.js ***!
  \**************************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/variable-manager/userscript.js");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./style.css */ "./node_modules/css-loader/index.js!./src/addons/addons/variable-manager/style.css");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _raw_loader_icon_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !raw-loader!./icon.svg */ "./node_modules/raw-loader/index.js!./src/addons/addons/variable-manager/icon.svg");
/* harmony import */ var _raw_loader_icon_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_icon_svg__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _url_loader_search_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! url-loader!./search.svg */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/variable-manager/search.svg");
/* generated by pull.js */




const resources = {
  'userscript.js': _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  'style.css': _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default.a,
  'icon.svg': _raw_loader_icon_svg__WEBPACK_IMPORTED_MODULE_2___default.a,
  'search.svg': _url_loader_search_svg__WEBPACK_IMPORTED_MODULE_3__["default"]
};

/***/ }),

/***/ "./src/addons/addons/variable-manager/userscript.js":
/*!**********************************************************!*\
  !*** ./src/addons/addons/variable-manager/userscript.js ***!
  \**********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _window_system_window_manager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../window-system/window-manager.js */ "./src/addons/window-system/window-manager.js");
/* harmony import */ var _lib_variable_manager_settings_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../lib/variable-manager/settings.js */ "./src/lib/variable-manager/settings.js");


const svg = paths => "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" " + "stroke-linecap=\"round\" stroke-linejoin=\"round\">".concat(paths, "</svg>");
const ICONS = {
  search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  clear: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  variable: svg('<path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/>' + '<line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>'),
  list: svg('<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/>' + '<line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/>' + '<line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>'),
  cloud: svg('<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/>' + '<path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>'),
  all: svg('<path d="M11 7h8"/><path d="M3 7h2"/><path d="M7 11h2"/><path d="M3 11h2"/>' + '<path d="M5 15h2"/><path d="M3 15h2"/><path d="M17 11h4"/><path d="M11 15h4"/><path d="M15 19h2"/>'),
  sprite: svg('<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" x2="12" y1="22" y2="12"/>'),
  stage: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>'),
  refresh: svg('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>' + '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
  empty: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/>' + '<path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>')
};
const FILTERS = [{
  id: 'all',
  icon: ICONS.all,
  label: 'All'
}, {
  id: 'variables',
  icon: ICONS.variable,
  label: 'Vars'
}, {
  id: 'lists',
  icon: ICONS.list,
  label: 'Lists'
}, {
  id: 'cloud',
  icon: ICONS.cloud,
  label: 'Cloud'
}];
const el = function el(tag) {
  let props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const node = document.createElement(tag);
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (key === 'class') {
      node.className = value;
    } else if (key === 'html') {
      node.innerHTML = value;
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in node) {
      node[key] = value;
    } else {
      node.setAttribute(key, value);
    }
  }
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }
  for (const child of children) {
    if (child === null || child === false) continue;
    node.append(child);
  }
  return node;
};
/* harmony default export */ __webpack_exports__["default"] = (async function (_ref) {
  let addon = _ref.addon,
    console = _ref.console,
    msg = _ref.msg;
  const vm = addon.tab.traps.vm;
  const settings = {
    defaultFilter: () => Object(_lib_variable_manager_settings_js__WEBPACK_IMPORTED_MODULE_1__["getSetting"])('default_filter'),
    liveUpdate: () => Object(_lib_variable_manager_settings_js__WEBPACK_IMPORTED_MODULE_1__["getSetting"])('live_update'),
    throttle: () => Object(_lib_variable_manager_settings_js__WEBPACK_IMPORTED_MODULE_1__["getSetting"])('update_throttle'),
    maxLength: type => Object(_lib_variable_manager_settings_js__WEBPACK_IMPORTED_MODULE_1__["getSetting"])(type === 'list' ? 'list_max_length' : 'variable_max_length')
  };
  let rows = [];
  let localRows = [];
  let globalRows = [];
  let filter = settings.defaultFilter();
  let search = '';
  let frozen = false;
  let win = null;
  let updateQueued = false;
  let lastUpdate = 0;

  // --- A single variable/list row -------------------------------------
  class VariableRow {
    constructor(scratchVariable, target) {
      this.scratchVariable = scratchVariable;
      this.target = target;
      this.type = scratchVariable.type === 'list' ? 'list' : 'variable';
      this.isCloud = !!scratchVariable.isCloud;
      this.name = scratchVariable.name;
      this.id = scratchVariable.id;
      this.visible = true;
      this.showBig = false;
      this.lastValue = null;
      this.build();
    }
    get kind() {
      return this.isCloud ? 'cloud' : this.type;
    }
    build() {
      this.nameInput = el('input', {
        class: 'mw-vm-name',
        value: this.name,
        spellcheck: false,
        'aria-label': "".concat(this.type, " name")
      });
      this.valueInput = el(this.type === 'list' ? 'textarea' : 'input', {
        class: 'mw-vm-value',
        spellcheck: false,
        'aria-label': "".concat(this.name, " value")
      });
      this.bigButton = el('button', {
        class: 'mw-vm-big',
        type: 'button',
        onclick: () => {
          this.showBig = true;
          this.refreshValue(true);
        }
      }, msg('too-big'));
      const badge = this.isCloud || this.type === 'list' ? el('span', {
        class: 'mw-vm-badge',
        dataset: {
          badge: this.kind
        }
      }, this.isCloud ? 'Cloud' : 'List') : null;
      this.row = el('div', {
        class: 'mw-vm-row',
        dataset: {
          kind: this.kind
        }
      }, el('span', {
        class: 'mw-vm-icon',
        html: ICONS[this.kind]
      }), el('div', {
        class: 'mw-vm-name-cell'
      }, this.nameInput, badge), el('div', {
        class: 'mw-vm-value-cell'
      }, this.valueInput, this.bigButton));
      this.bindEvents();
    }
    bindEvents() {
      this.nameInput.addEventListener('focus', () => {
        freeze(true);
        this.nameInput.select();
      });
      this.nameInput.addEventListener('blur', () => this.commitName());
      this.nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nameInput.blur();
        } else if (e.key === 'Escape') {
          this.nameInput.value = this.name;
          this.nameInput.blur();
        }
      });
      this.valueInput.addEventListener('focus', () => {
        freeze(true);
        if (this.type === 'list') {
          this.valueInput.setSelectionRange(0, 0);
        } else {
          this.valueInput.select();
        }
      });
      this.valueInput.addEventListener('blur', () => this.commitValue());
      this.valueInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.refreshValue(true);
          this.valueInput.blur();
        }
      });
    }
    commitName() {
      freeze(false);
      let next = this.nameInput.value.trim();
      if (next === this.name) return;
      if (this.isCloud && !next.startsWith('☁')) {
        next = "\u2601 ".concat(next);
      }
      if (!next) {
        this.flashError(this.nameInput);
        this.nameInput.value = this.name;
        return;
      }
      const workspace = Blockly.getMainWorkspace();
      let taken = false;
      try {
        if (this.target.isStage) {
          taken = vm.runtime.getAllVarNamesOfType(this.scratchVariable.type).includes(next);
        } else if (workspace) {
          taken = !!workspace.getVariable(next, this.scratchVariable.type);
        }
      } catch (e) {
        console.error('variable-manager: name check failed', e);
      }
      if (taken) {
        this.flashError(this.nameInput);
        this.nameInput.value = this.name;
        return;
      }
      try {
        if (workspace) workspace.renameVariableById(this.id, next);
        this.name = next;
        this.nameInput.value = next;
      } catch (e) {
        console.error('variable-manager: rename failed', e);
        this.flashError(this.nameInput);
        this.nameInput.value = this.name;
      }
    }
    commitValue() {
      freeze(false);
      try {
        const next = this.type === 'list' ? this.valueInput.value.split('\n').filter(line => line !== '') : this.valueInput.value;
        vm.setVariableValue(this.target.id, this.id, next);
        this.valueInput.classList.remove('mw-vm-error');
      } catch (e) {
        console.error('variable-manager: set value failed', e);
        this.flashError(this.valueInput);
      }
    }
    flashError(element) {
      element.classList.add('mw-vm-error');
      setTimeout(() => element.classList.remove('mw-vm-error'), 800);
    }
    matches(query, activeFilter) {
      if (activeFilter === 'variables' && this.type !== 'variable') return false;
      if (activeFilter === 'lists' && this.type !== 'list') return false;
      if (activeFilter === 'cloud' && !this.isCloud) return false;
      if (!query) return true;
      const value = String(this.scratchVariable.value);
      return this.name.toLowerCase().includes(query) || value.toLowerCase().includes(query);
    }
    refreshValue(force) {
      if (!this.visible && !force) return;
      const value = this.type === 'list' ? this.scratchVariable.value.join('\n') : String(this.scratchVariable.value);
      if (!force && value === this.lastValue) return;
      this.lastValue = value;
      const tooBig = !this.showBig && value.length > settings.maxLength(this.type);
      this.row.dataset.big = tooBig ? 'true' : 'false';
      if (tooBig) return;
      if (this.valueInput.value !== value) {
        this.valueInput.value = value;
      }
      if (this.type === 'list') {
        this.valueInput.style.height = 'auto';
        this.valueInput.style.height = "".concat(Math.min(220, this.valueInput.scrollHeight), "px");
      }
    }
    setVisible(visible) {
      if (this.visible === visible) return;
      this.visible = visible;
      this.row.hidden = !visible;
      if (visible) this.refreshValue(true);
    }
    destroy() {
      this.row.remove();
    }
  }

  // --- DOM scaffold ---------------------------------------------------
  const searchInput = el('input', {
    class: 'mw-vm-search',
    type: 'text',
    placeholder: "".concat(msg('search'), "\u2026"),
    'aria-label': msg('search')
  });
  const clearButton = el('button', {
    class: 'mw-vm-search-clear',
    type: 'button',
    title: 'Clear',
    hidden: true,
    html: ICONS.clear,
    onclick: () => {
      searchInput.value = '';
      applySearch('');
      searchInput.focus();
    }
  });
  const filterButtons = {};
  const segment = el('div', {
    class: 'mw-vm-segment',
    role: 'tablist'
  });
  for (const def of FILTERS) {
    const count = el('span', {
      class: 'mw-vm-seg-count'
    }, '0');
    const button = el('button', {
      class: 'mw-vm-seg',
      type: 'button',
      role: 'tab',
      title: def.label,
      dataset: {
        filter: def.id
      },
      onclick: () => setFilter(def.id)
    }, el('span', {
      class: 'mw-vm-seg-icon',
      html: def.icon
    }), count);
    filterButtons[def.id] = {
      button,
      count
    };
    segment.append(button);
  }
  const refreshButton = el('button', {
    class: 'mw-vm-tool',
    type: 'button',
    title: 'Refresh',
    html: ICONS.refresh,
    onclick: () => reload()
  });
  const header = el('div', {
    class: 'mw-vm-header'
  }, el('div', {
    class: 'mw-vm-search-wrap'
  }, el('span', {
    class: 'mw-vm-search-icon',
    html: ICONS.search
  }), searchInput, clearButton), el('div', {
    class: 'mw-vm-toolbar'
  }, segment, refreshButton));
  const makeSection = (icon, label) => {
    const countEl = el('span', {
      class: 'mw-vm-section-count'
    }, '0');
    const list = el('div', {
      class: 'mw-vm-list'
    });
    const section = el('div', {
      class: 'mw-vm-section',
      hidden: true
    }, el('div', {
      class: 'mw-vm-section-head'
    }, el('span', {
      class: 'mw-vm-section-icon',
      html: icon
    }), el('span', {
      class: 'mw-vm-section-title'
    }, label), countEl), list);
    return {
      section,
      list,
      countEl
    };
  };
  const localSection = makeSection(ICONS.sprite, msg('for-this-sprite'));
  const globalSection = makeSection(ICONS.stage, msg('for-all-sprites'));
  const emptyState = el('div', {
    class: 'mw-vm-empty',
    hidden: true
  }, el('span', {
    class: 'mw-vm-empty-icon',
    html: ICONS.empty
  }), el('div', {
    class: 'mw-vm-empty-title'
  }, 'Nothing to show'), el('div', {
    class: 'mw-vm-empty-sub'
  }, 'Try a different search or filter'));
  const content = el('div', {
    class: 'mw-vm-content'
  }, emptyState, localSection.section, globalSection.section);
  const root = el('div', {
    class: 'mw-vm',
    role: 'main',
    'aria-label': 'Variable Manager'
  }, header, content);

  // --- Filtering / search ---------------------------------------------
  const freeze = value => {
    frozen = value;
    root.classList.toggle('mw-vm-frozen', value);
  };
  const updateCounts = () => {
    const totals = {
      all: rows.length,
      variables: 0,
      lists: 0,
      cloud: 0
    };
    for (const row of rows) {
      if (row.type === 'variable') totals.variables++;
      if (row.type === 'list') totals.lists++;
      if (row.isCloud) totals.cloud++;
    }
    for (const def of FILTERS) {
      filterButtons[def.id].count.textContent = totals[def.id];
    }
  };
  const applyFilters = () => {
    const query = search.toLowerCase();
    for (const row of rows) {
      row.setVisible(row.matches(query, filter));
    }
    const visibleLocal = localRows.filter(row => row.visible).length;
    const visibleGlobal = globalRows.filter(row => row.visible).length;
    localSection.section.hidden = visibleLocal === 0;
    globalSection.section.hidden = visibleGlobal === 0;
    localSection.countEl.textContent = visibleLocal;
    globalSection.countEl.textContent = visibleGlobal;
    emptyState.hidden = visibleLocal + visibleGlobal > 0;
  };
  const setFilter = next => {
    filter = next;
    for (const def of FILTERS) {
      filterButtons[def.id].button.classList.toggle('mw-vm-seg-active', def.id === next);
    }
    applyFilters();
  };
  const applySearch = query => {
    search = query;
    clearButton.hidden = !query;
    applyFilters();
  };
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => applySearch(searchInput.value), 90);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (searchInput.value) clearButton.click();else hide();
    }
  });

  // --- Data loading ---------------------------------------------------
  const collectRows = target => Object.values(target.variables).filter(variable => variable.type === '' || variable.type === 'list').map(variable => new VariableRow(variable, target));
  const reload = () => {
    if (!win || !win.isVisible) return;
    rows.forEach(row => row.destroy());
    const editingTarget = vm.runtime.getEditingTarget();
    const stage = vm.runtime.getTargetForStage();
    localRows = editingTarget && !editingTarget.isStage ? collectRows(editingTarget) : [];
    globalRows = stage ? collectRows(stage) : [];
    rows = [...localRows, ...globalRows];
    localSection.list.replaceChildren(...localRows.map(row => row.row));
    globalSection.list.replaceChildren(...globalRows.map(row => row.row));
    rows.forEach(row => row.refreshValue(true));
    updateCounts();
    setFilter(filter);
  };
  const refreshValues = () => {
    if (!win || !win.isVisible || frozen) return;
    rows.forEach(row => row.refreshValue(false));
  };
  const scheduleUpdate = () => {
    if (updateQueued || !win || !win.isVisible || frozen) return;
    if (!settings.liveUpdate()) return;
    updateQueued = true;
    requestAnimationFrame(() => {
      const throttle = settings.throttle();
      const elapsed = Date.now() - lastUpdate;
      if (elapsed < throttle) {
        setTimeout(() => {
          updateQueued = false;
          scheduleUpdate();
        }, throttle - elapsed);
        return;
      }
      refreshValues();
      lastUpdate = Date.now();
      updateQueued = false;
    });
  };

  // --- Window ---------------------------------------------------------
  const show = () => {
    if (win) {
      win.show().bringToFront();
      reload();
      return;
    }
    win = _window_system_window_manager_js__WEBPACK_IMPORTED_MODULE_0__["default"].createWindow({
      id: 'variable-manager',
      title: msg('variables'),
      width: 640,
      height: 600,
      minWidth: 460,
      minHeight: 360,
      maxWidth: Math.min(window.innerWidth * 0.9, 1400),
      maxHeight: Math.min(window.innerHeight * 0.9, 1000),
      className: 'sa-variable-manager-window',
      x: Math.max(24, Math.min(window.innerWidth - 664, 60)),
      y: Math.max(24, Math.min(window.innerHeight - 624, 60)),
      onClose: () => {
        win = null;
        rows.forEach(row => row.destroy());
        rows = localRows = globalRows = [];
      }
    });
    win.setContent(root);
    win.show();
    setTimeout(() => {
      filter = settings.defaultFilter();
      reload();
      searchInput.focus();
    }, 40);
  };
  const hide = () => {
    if (win) win.close();
  };
  const toggle = () => {
    if (win && win.isVisible) hide();else show();
  };
  window.__mistwarpVariableManagerToggle = toggle;

  // --- Settings reactions ---------------------------------------------
  const removeSettingsListener = Object(_lib_variable_manager_settings_js__WEBPACK_IMPORTED_MODULE_1__["onSettingChanged"])(event => {
    if (event.settingId === 'default_filter' && (!win || !win.isVisible)) {
      filter = event.value;
    } else if (event.settingId === 'live_update' && event.value) {
      scheduleUpdate();
    } else if ((event.settingId === 'variable_max_length' || event.settingId === 'list_max_length') && win && win.isVisible) {
      rows.forEach(row => row.refreshValue(true));
    }
  });

  // --- Runtime hooks --------------------------------------------------
  const onProjectChange = () => {
    if (win && win.isVisible) reload();
  };
  vm.runtime.on('PROJECT_LOADED', onProjectChange);
  vm.runtime.on('TOOLBOX_EXTENSIONS_NEED_UPDATE', onProjectChange);
  const originalStep = vm.runtime._step;
  vm.runtime._step = function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    const result = originalStep.apply(this, args);
    try {
      scheduleUpdate();
    } catch (e) {
      console.error('variable-manager: update failed', e);
    }
    return result;
  };
  const onGlobalKey = e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'V' || e.key === 'v') && !e.repeat) {
      e.preventDefault();
      toggle();
    } else if (win && win.isVisible && (e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  };
  document.addEventListener('keydown', onGlobalKey);
  addon.self.addEventListener('disabled', () => {
    document.removeEventListener('keydown', onGlobalKey);
    removeSettingsListener();
    hide();
  });
  addon.self.addEventListener('reenabled', () => {
    if (win && win.isVisible) reload();
  });

  // --- Stage header button --------------------------------------------
  const buttonWrap = el('div', {
    class: 'sa-variable-manager-container'
  });
  const button = el('div', {
    class: addon.tab.scratchClass('button_outlined-button', 'stage-header_stage-button'),
    onclick: toggle,
    onmousedown: e => e.preventDefault()
  });
  const buttonContent = el('div', {
    class: addon.tab.scratchClass('button_content')
  });
  const buttonIcon = document.createElement('svg');
  buttonIcon.className = addon.tab.scratchClass('stage-header_stage-button-icon');
  buttonIcon.draggable = false;
  buttonIcon.innerHTML = addon.self.getResource('/icon.svg');
  buttonContent.append(buttonIcon);
  button.append(buttonContent);
  buttonWrap.append(button);
  while (true) {
    await addon.tab.waitForElement('[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]', {
      markAsSeen: true,
      reduxEvents: ['scratch-gui/mode/SET_PLAYER', 'scratch-gui/mode/SET_FULL_SCREEN', 'fontsLoaded/SET_FONTS_LOADED', 'scratch-gui/locales/SELECT_LOCALE'],
      reduxCondition: state => !state.scratchGui.mode.isPlayerOnly
    });
    if (addon.tab.editorMode === 'editor') {
      addon.tab.appendToSharedSpace({
        space: 'stageHeader',
        element: buttonWrap,
        order: 2
      });
    } else {
      buttonWrap.remove();
      hide();
    }
  }
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-variable-manager.js.map
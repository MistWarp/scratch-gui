(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-gamepad"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/gamepad/gamepadlib.css":
/*!****************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/gamepad/gamepadlib.css ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var escape = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/url/escape.js */ "./node_modules/css-loader/lib/url/escape.js");
exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, ".gamepadlib-selector {\n  width: 100%;\n  margin-bottom: 3px;\n}\n\n.gamepadlib-content {\n  display: flex;\n  flex-direction: row;\n  flex-wrap: wrap;\n}\n.gamepadlib-content-buttons {\n  padding-right: 10px;\n}\n\n.gamepadlib-mapping {\n  display: flex;\n  align-items: center;\n  margin-bottom: 3px;\n}\n.gamepadlib-mapping-label {\n  width: 100px;\n  text-align: center;\n}\n.gamepadlib-keyinput {\n  text-align: center;\n  width: 75px;\n  height: 25px;\n  border-radius: 0;\n  border: 1px solid var(--ui-black-transparent);\n  background: var(--input-background);\n  color: var(--text-primary);\n  box-sizing: border-box;\n  padding: 0;\n  margin: 0;\n}\n.gamepadlib-mapping[data-value=\"1\"] .gamepadlib-keyinput {\n  background: yellow;\n  color: var(--text-primary-default);\n}\n.gamepadlib-keyinput[data-accepting-input=\"true\"] {\n  background: var(--badge-background);\n}\n.gamepadlib-keyinput[data-empty=\"true\"]:not([data-accepting-input=\"true\"]) {\n  color: #aaa;\n  font-style: italic;\n}\n\n.gamepadlib-axis {\n  margin-bottom: 8px;\n  text-align: center;\n}\n.gamepadlib-axis-circle {\n  position: relative;\n  width: 150px;\n  height: 150px;\n  border: 1px solid var(--ui-black-transparent);\n  overflow: hidden;\n}\n.gamepadlib-axis-dot {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  background-image: url(" + escape(__webpack_require__(/*! ./dot.svg */ "./src/addons/addons/gamepad/dot.svg")) + ");\n  width: 8px;\n  height: 8px;\n  transform: translate(-50%, -50%);\n  pointer-events: none;\n}\n.gamepadlib-axis-mapping {\n  width: 100%;\n}\n\n.gamepadlib-axis-circle-overlay {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n}\n.gamepadlib-axis-circle-overlay > .gamepadlib-axis-mapper {\n  position: absolute;\n}\n.gamepadlib-axis-circle-overlay > .gamepadlib-axis-mapper:nth-of-type(1) {\n  left: 50%;\n  top: 0;\n  transform: translateX(-50%);\n}\n.gamepadlib-axis-circle-overlay > .gamepadlib-axis-mapper:nth-of-type(2) {\n  left: 0;\n  top: 50%;\n  transform: translateY(-50%);\n}\n.gamepadlib-axis-circle-overlay > .gamepadlib-axis-mapper:nth-of-type(3) {\n  right: 0;\n  top: 50%;\n  transform: translateY(-50%);\n}\n.gamepadlib-axis-circle-overlay > .gamepadlib-axis-mapper:nth-of-type(4) {\n  left: 50%;\n  bottom: 0;\n  transform: translateX(-50%);\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/gamepad/style.css":
/*!***********************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/gamepad/style.css ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "[dir=\"ltr\"] .sa-gamepad-container {\n  margin-right: 0.2rem;\n}\n[dir=\"rtl\"] .sa-gamepad-container {\n  margin-left: 0.2rem;\n}\n\n.sa-gamepad-popup-outer {\n  /* above fullscreen */\n  z-index: 99999;\n}\n.sa-gamepad-popup {\n  box-sizing: border-box;\n  width: 700px;\n  max-height: min(800px, 85vh);\n  height: 100%;\n  max-width: 85%;\n  margin: 50px auto;\n  display: flex;\n  flex-direction: column;\n}\n.sa-gamepad-popup-content {\n  padding: 1.5rem 2.25rem;\n  height: 100%;\n  overflow-y: auto;\n}\n\n.sa-gamepad-popup [class*=\"modal_header-item-title\"] {\n  margin: 0 -20rem 0 0;\n}\n\n.sa-gamepad-cursor {\n  position: absolute;\n  top: 0;\n  left: 0;\n  z-index: 9999;\n  user-select: none;\n  pointer-events: none;\n  will-change: transform;\n  image-rendering: optimizeSpeed;\n  image-rendering: crisp-edges;\n  image-rendering: pixelated;\n}\n.sa-gamepad-cursor-down {\n  filter: invert(100%);\n}\n\n.sa-small-stage [class*=\"gui_body-wrapper_\"]:not(.sa-stage-hidden) .sa-gamepad-container {\n  display: none !important;\n}\n\n.sa-gamepad-hide-cursor [class^=\"stage_stage_\"] {\n  cursor: none;\n}\n\n.sa-gamepad-browser-support-warning {\n  font-weight: bold;\n  margin-bottom: 10px;\n}\n\n.sa-gamepad-extra-options {\n  display: none;\n}\n.sa-gamepad-has-controller .sa-gamepad-extra-options {\n  display: block;\n}\n\n.sa-gamepad-store-settings {\n  display: block;\n}\n.sa-gamepad-store-settings > input {\n  margin-right: 4px;\n}\n\n.sa-gamepad-reset-button {\n  margin: 8px 8px 8px 0;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/active.png":
/*!************************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/active.png ***!
  \************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGAQMAAADaAn0LAAAABlBMVEX///8AAABVwtN+AAAADklEQVQI12MAAQMgBAIAAkwAYUis6mUAAAAASUVORK5CYII=");

/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/close.svg":
/*!***********************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/close.svg ***!
  \***********************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/svg+xml;base64,PHN2ZyBkYXRhLW5hbWU9IkxheWVyIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDcuNDggNy40OCI+PHBhdGggZD0iTTMuNzQgNi40OFYxTTEgMy43NGg1LjQ4IiBzdHlsZT0iZmlsbDpub25lO3N0cm9rZTojZmZmO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6MnB4Ii8+PC9zdmc+");

/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/cursor.png":
/*!************************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/cursor.png ***!
  \************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGAQMAAADaAn0LAAAABlBMVEUAAAD///+l2Z/dAAAADklEQVQI12MAAQMgBAIAAkwAYUis6mUAAAAASUVORK5CYII=");

/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/dot.svg":
/*!*********************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/dot.svg ***!
  \*********************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHZpZXdCb3g9IjAgMCAyLjExNyAyLjExNyI+PGNpcmNsZSBjeD0iMS4wNTgiIGN5PSIxLjA1OCIgcj0iMS4wNTgiIGZpbGw9InJlZCIvPjwvc3ZnPg==");

/***/ }),

/***/ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/gamepad.svg":
/*!*************************************************************************************!*\
  !*** ./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/gamepad.svg ***!
  \*************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIiB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgc3R5bGU9Ii1tcy10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0iIzU3NWU3NSIgZD0iTTM2OCAxNjhoLTk2di02NGgxNzZhMjQuMDI3IDI0LjAyNyAwIDAgMCAyNC0yNFYxNmgtMzJ2NTZIMjY0YTI0LjAyNyAyNC4wMjcgMCAwIDAtMjQgMjR2NzJoLTk2QTEyOC4xNDUgMTI4LjE0NSAwIDAgMCAxNiAyOTZ2MTAwLjk1M0E5MS4xNSA5MS4xNSAwIDAgMCAxMDcuMDQ3IDQ4OGgxLjhhOTAuODA3IDkwLjgwNyAwIDAgMCA2OS45NTMtMzIuNzZMMjMxLjUgMzkyaDQ4LjYyOGw1Mi42NjYgNjguNDY1QTkxLjA0NiA5MS4wNDYgMCAwIDAgNDk2IDQwNC45NTNWMjk2YTEyOC4xNDUgMTI4LjE0NSAwIDAgMC0xMjgtMTI4em05NiAyMzYuOTUzYTU5LjA0NyA1OS4wNDcgMCAwIDEtMTA1Ljg0OSAzNkwyOTUuODc4IDM2MGgtNzkuMzcybC02Mi4yOTQgNzQuNzU0QTU4Ljg5MyA1OC44OTMgMCAwIDEgMTA4Ljg1IDQ1NmgtMS44QTU5LjExMyA1OS4xMTMgMCAwIDEgNDggMzk2Ljk1M1YyOTZhOTYuMTA4IDk2LjEwOCAwIDAgMSA5Ni05NmgyMjRhOTYuMTA4IDk2LjEwOCAwIDAgMSA5NiA5NnoiLz48cGF0aCBmaWxsPSIjNTc1ZTc1IiBkPSJNMzYwIDI0OGgzMnYzMmgtMzJ6bTAgODBoMzJ2MzJoLTMyem0tNDAtNDBoMzJ2MzJoLTMyem04MCAwaDMydjMyaC0zMnptLTI0OC00MGgtMzJ2NDBIODB2MzJoNDB2NDBoMzJ2LTQwaDQwdi0zMmgtNDB2LTQweiIvPjwvc3ZnPg==");

/***/ }),

/***/ "./src/addons/addons/gamepad/_runtime_entry.js":
/*!*****************************************************!*\
  !*** ./src/addons/addons/gamepad/_runtime_entry.js ***!
  \*****************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/gamepad/userscript.js");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./style.css */ "./node_modules/css-loader/index.js!./src/addons/addons/gamepad/style.css");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _css_loader_gamepadlib_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! css-loader!./gamepadlib.css */ "./node_modules/css-loader/index.js!./src/addons/addons/gamepad/gamepadlib.css");
/* harmony import */ var _css_loader_gamepadlib_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_css_loader_gamepadlib_css__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _url_loader_active_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! url-loader!./active.png */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/active.png");
/* harmony import */ var _url_loader_close_svg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! url-loader!./close.svg */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/close.svg");
/* harmony import */ var _url_loader_cursor_png__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! url-loader!./cursor.png */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/cursor.png");
/* harmony import */ var _url_loader_dot_svg__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! url-loader!./dot.svg */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/dot.svg");
/* harmony import */ var _url_loader_gamepad_svg__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! url-loader!./gamepad.svg */ "./node_modules/url-loader/dist/cjs.js!./src/addons/addons/gamepad/gamepad.svg");
/* generated by pull.js */








const resources = {
  "userscript.js": _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  "style.css": _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default.a,
  "gamepadlib.css": _css_loader_gamepadlib_css__WEBPACK_IMPORTED_MODULE_2___default.a,
  "active.png": _url_loader_active_png__WEBPACK_IMPORTED_MODULE_3__["default"],
  "close.svg": _url_loader_close_svg__WEBPACK_IMPORTED_MODULE_4__["default"],
  "cursor.png": _url_loader_cursor_png__WEBPACK_IMPORTED_MODULE_5__["default"],
  "dot.svg": _url_loader_dot_svg__WEBPACK_IMPORTED_MODULE_6__["default"],
  "gamepad.svg": _url_loader_gamepad_svg__WEBPACK_IMPORTED_MODULE_7__["default"]
};

/***/ }),

/***/ "./src/addons/addons/gamepad/dot.svg":
/*!*******************************************!*\
  !*** ./src/addons/addons/gamepad/dot.svg ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHZpZXdCb3g9IjAgMCAyLjExNyAyLjExNyI+PGNpcmNsZSBjeD0iMS4wNTgiIGN5PSIxLjA1OCIgcj0iMS4wNTgiIGZpbGw9InJlZCIvPjwvc3ZnPg=="

/***/ }),

/***/ "./src/addons/addons/gamepad/gamepadlib.js":
/*!*************************************************!*\
  !*** ./src/addons/addons/gamepad/gamepadlib.js ***!
  \*************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _event_target_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../event-target.js */ "./src/addons/event-target.js");
 /* inserted by pull.js */

let console = window.console;

/*
Mapping types:

type: "key" maps a button to a keyboard key
All key names will be interpreted as a KeyboardEvent.key value (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)
high: "KeyName" is the name of the key to dispatch when a button reads a HIGH value
low: "KeyName" is the name of the key to dispatch when a button reads a LOW value
deadZone: 0.5 controls the minimum value necessary to be read in either + or - to trigger either high or low
The high/low distinction is necessary for axes. Buttons will only use high

type: "mousedown" maps a button to control whether the mouse is down or not
deadZone: 0.5 controls the minimum value to trigger a mousedown
button: 0, 1, 2, etc. controls which button to press

type: "virtual_cursor" maps a button to control the "virtual cursor"
deadZone: 0.5 again controls the minimum value to trigger a movement
sensitivity: 10 controls the speed
high: "+y"/"-y"/"+x"/"-x" defines what happens when an axis reads high
low: "+y"/"-y"/"+x"/"-x" defines what happens when an axis reads low
+y increases y, -y decreases y, +x increases x, -x decreases x.
*/

const defaultAxesMappings = {
  arrows: [{
    type: "key",
    high: "ArrowRight",
    low: "ArrowLeft",
    deadZone: 0.5
  }, {
    type: "key",
    high: "ArrowDown",
    low: "ArrowUp",
    deadZone: 0.5
  }],
  wasd: [{
    type: "key",
    high: "d",
    low: "a",
    deadZone: 0.5
  }, {
    type: "key",
    high: "s",
    low: "w",
    deadZone: 0.5
  }],
  cursor: [{
    type: "virtual_cursor",
    high: "+x",
    low: "-x",
    sensitivity: 0.6,
    deadZone: 0.2
  }, {
    type: "virtual_cursor",
    high: "-y",
    low: "+y",
    sensitivity: 0.6,
    deadZone: 0.2
  }]
};
const emptyMapping = () => ({
  type: "key",
  high: null,
  low: null
});
const transformAndCopyMapping = mapping => {
  if (typeof mapping !== "object" || !mapping) {
    console.warn("invalid mapping", mapping);
    return emptyMapping();
  }
  const copy = Object.assign({}, mapping);
  if (copy.type === "key") {
    if (typeof copy.deadZone === "undefined") {
      copy.deadZone = 0.5;
    }
    if (typeof copy.high === "undefined") {
      copy.high = "";
    }
    if (typeof copy.low === "undefined") {
      copy.low = "";
    }
  } else if (copy.type === "mousedown") {
    if (typeof copy.deadZone === "undefined") {
      copy.deadZone = 0.5;
    }
    if (typeof copy.button === "undefined") {
      copy.button = 0;
    }
  } else if (copy.type === "virtual_cursor") {
    if (typeof copy.high === "undefined") {
      copy.high = "";
    }
    if (typeof copy.low === "undefined") {
      copy.low = "";
    }
    if (typeof copy.sensitivity === "undefined") {
      copy.sensitivity = 10;
    }
    if (typeof copy.deadZone === "undefined") {
      copy.deadZone = 0.5;
    }
  } else {
    console.warn("unknown mapping type", copy.type);
    return emptyMapping();
  }
  return copy;
};
const prepareMappingForExport = mapping => Object.assign({}, mapping);
const prepareAxisMappingForExport = prepareMappingForExport;
const prepareButtonMappingForExport = mapping => {
  const copy = prepareMappingForExport(mapping);
  delete copy.deadZone;
  delete copy.low;
  return copy;
};
const padWithEmptyMappings = (array, length) => {
  // Keep adding empty mappings until the list is full
  while (array.length < length) {
    array.push(emptyMapping());
  }
  // In case the input array is longer than the desired length
  array.length = length;
  return array;
};
const createEmptyMappingList = length => padWithEmptyMappings([], length);
const getMovementConfiguration = usedKeys => ({
  usesArrows: usedKeys.has("ArrowUp") || usedKeys.has("ArrowDown") || usedKeys.has("ArrowRight") || usedKeys.has("ArrowLeft"),
  usesWASD: usedKeys.has("w") && usedKeys.has("s") || usedKeys.has("a") && usedKeys.has("d")
});
const getGamepadId = gamepad => "".concat(gamepad.id, " (").concat(gamepad.index, ")");
class GamepadData {
  /**
   * @param {Gamepad} gamepad Source Gamepad
   * @param {GamepadLib} gamepadLib Parent GamepadLib
   */
  constructor(gamepad, gamepadLib) {
    this.gamepad = gamepad;
    this.gamepadLib = gamepadLib;
    this.resetMappings();
  }
  resetMappings() {
    this.hints = this.gamepadLib.getHints();
    this.buttonMappings = this.getDefaultButtonMappings().map(transformAndCopyMapping);
    this.axesMappings = this.getDefaultAxisMappings().map(transformAndCopyMapping);
  }
  clearMappings() {
    this.buttonMappings = createEmptyMappingList(this.gamepad.buttons.length);
    this.axesMappings = createEmptyMappingList(this.gamepad.axes.length);
  }
  getDefaultButtonMappings() {
    let buttons;
    if (this.hints.importedSettings) {
      buttons = this.hints.importedSettings.buttons;
    } else {
      const usedKeys = this.hints.usedKeys;
      const alreadyUsedKeys = new Set();
      const {
        usesArrows,
        usesWASD
      } = getMovementConfiguration(usedKeys);
      if (usesWASD) {
        alreadyUsedKeys.add("w");
        alreadyUsedKeys.add("a");
        alreadyUsedKeys.add("s");
        alreadyUsedKeys.add("d");
      }
      const possiblePauseKeys = [
      // Restart keys, pause keys, other potentially dangerous keys
      "p", "q", "r"];
      const possibleActionKeys = [" ", "Enter", "e", "f", "z", "x", "c", ...Array.from(usedKeys).filter(i => i.length === 1 && !possiblePauseKeys.includes(i))];
      const findKey = keys => {
        for (const key of keys) {
          if (usedKeys.has(key) && !alreadyUsedKeys.has(key)) {
            alreadyUsedKeys.add(key);
            return key;
          }
        }
        return null;
      };
      const getPrimaryAction = () => {
        if (usesArrows && usedKeys.has("ArrowUp")) {
          return "ArrowUp";
        }
        if (usesWASD && usedKeys.has("w")) {
          return "w";
        }
        return findKey(possibleActionKeys);
      };
      const getSecondaryAction = () => findKey(possibleActionKeys);
      const getPauseKey = () => findKey(possiblePauseKeys);
      const getUp = () => {
        if (usesArrows || !usesWASD) return "ArrowUp";
        return "w";
      };
      const getDown = () => {
        if (usesArrows || !usesWASD) return "ArrowDown";
        return "s";
      };
      const getRight = () => {
        if (usesArrows || !usesWASD) return "ArrowRight";
        return "d";
      };
      const getLeft = () => {
        if (usesArrows || !usesWASD) return "ArrowLeft";
        return "a";
      };
      const action1 = getPrimaryAction();
      let action2 = getSecondaryAction();
      let action3 = getSecondaryAction();
      let action4 = getSecondaryAction();
      // When only 1 or 2 action keys are detected, bind the other buttons to the same things.
      if (action1 && !action2 && !action3 && !action4) {
        action2 = action1;
        action3 = action1;
        action4 = action1;
      }
      if (action1 && action2 && !action3 && !action4) {
        action3 = action1;
        action4 = action2;
      }

      // Set indices "manually" because we don't evaluate them in order.
      buttons = [];
      buttons[0] = {
        /*
        Xbox: A
        SNES-like: B
        */
        type: "key",
        high: action1
      };
      buttons[1] = {
        /*
        Xbox: B
        SNES-like: A
        */
        type: "key",
        high: action2
      };
      buttons[2] = {
        /*
        Xbox: X
        SNES-like: Y
        */
        type: "key",
        high: action3
      };
      buttons[3] = {
        /*
        Xbox: Y
        SNES-like: X
        */
        type: "key",
        high: action4
      };
      buttons[4] = {
        /*
        Xbox: LB
        SNES-like: Left trigger
        */
        type: "mousedown"
      };
      buttons[5] = {
        /*
        Xbox: RB
        */
        type: "mousedown"
      };
      buttons[6] = {
        /*
        Xbox: LT
        */
        type: "mousedown"
      };
      buttons[7] = {
        /*
        Xbox: RT
        SNES-like: Right trigger
        */
        type: "mousedown"
      };
      buttons[9] = {
        /*
        Xbox: Menu
        SNES-like: Start
        */
        type: "key",
        high: getPauseKey()
      };
      buttons[8] = {
        /*
        Xbox: Change view
        SNES-like: Select
        */
        type: "key",
        high: getPauseKey()
      };
      // Xbox: Left analog press
      buttons[10] = emptyMapping();
      // Xbox: Right analog press
      buttons[11] = emptyMapping();
      buttons[12] = {
        /*
        Xbox: D-pad up
        */
        type: "key",
        high: getUp()
      };
      buttons[13] = {
        /*
        Xbox: D-pad down
        */
        type: "key",
        high: getDown()
      };
      buttons[14] = {
        /*
        Xbox: D-pad left
        */
        type: "key",
        high: getLeft()
      };
      buttons[15] = {
        /*
        Xbox: D-pad right
        */
        type: "key",
        high: getRight()
      };
    }
    return padWithEmptyMappings(buttons, this.gamepad.buttons.length);
  }
  getDefaultAxisMappings() {
    let axes = [];
    if (this.hints.importedSettings) {
      axes = this.hints.importedSettings.axes;
    } else {
      // Only return default axis mappings when there are 4 axes, like an xbox controller
      // If there isn't exactly 4, we can't really predict what the axes mean
      // Some controllers map the dpad to *both* buttons and axes at the same time, which would cause conflicts.
      if (this.gamepad.axes.length === 4) {
        const usedKeys = this.hints.usedKeys;
        const {
          usesArrows,
          usesWASD
        } = getMovementConfiguration(usedKeys);
        if (usesWASD) {
          axes.push(defaultAxesMappings.wasd[0]);
          axes.push(defaultAxesMappings.wasd[1]);
        } else if (usesArrows) {
          axes.push(defaultAxesMappings.arrows[0]);
          axes.push(defaultAxesMappings.arrows[1]);
        } else {
          axes.push(defaultAxesMappings.cursor[0]);
          axes.push(defaultAxesMappings.cursor[1]);
        }
        axes.push(defaultAxesMappings.cursor[0]);
        axes.push(defaultAxesMappings.cursor[1]);
      }
    }
    return padWithEmptyMappings(axes, this.gamepad.axes.length);
  }
}
const defaultHints = () => ({
  usedKeys: new Set(),
  importedSettings: null,
  generated: false
});
class GamepadLib extends _event_target_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
  constructor() {
    super();

    /** @type {Map<string, GamepadData>} */
    this.gamepads = new Map();
    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.update = this.update.bind(this);
    this.animationFrame = null;
    this.currentTime = null;
    this.deltaTime = 0;
    this.virtualCursor = {
      x: 0,
      y: 0,
      maxX: Infinity,
      minX: -Infinity,
      maxY: Infinity,
      minY: -Infinity,
      modified: false
    };
    this._editor = null;
    this.connectCallbacks = [];
    this.keysPressedThisFrame = new Set();
    this.oldKeysPressed = new Set();
    this.mouseButtonsPressedThisFrame = new Set();
    this.oldMouseDown = new Set();
    this.addEventHandlers();
  }
  addEventHandlers() {
    window.addEventListener("gamepadconnected", this.handleConnect);
    window.addEventListener("gamepaddisconnected", this.handleDisconnect);
  }
  removeEventHandlers() {
    window.removeEventListener("gamepadconnected", this.handleConnect);
    window.removeEventListener("gamepaddisconnected", this.handleDisconnect);
  }
  gamepadConnected() {
    if (this.gamepads.size > 0) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.connectCallbacks.push(resolve);
    });
  }
  getHints() {
    return Object.assign(defaultHints(), this.getUserHints());
  }
  getUserHints() {
    // to be overridden by users
    return {};
  }
  resetControls() {
    for (const gamepad of this.gamepads.values()) {
      gamepad.resetMappings();
    }
  }
  clearControls() {
    for (const gamepad of this.gamepads.values()) {
      gamepad.clearMappings();
    }
  }
  handleConnect(e) {
    for (const callback of this.connectCallbacks) {
      callback();
    }
    this.connectCallbacks = [];
    const gamepad = e.gamepad;
    const id = getGamepadId(gamepad);
    /* eslint-disable */
    console.log(...oo_oo("276984822_487_4_487_37_4", "connected", gamepad));
    const gamepadData = new GamepadData(gamepad, this);
    this.gamepads.set(id, gamepadData);
    if (this.animationFrame === null) {
      this.animationFrame = requestAnimationFrame(this.update);
    }
    this.dispatchEvent(new CustomEvent("gamepadconnected", {
      detail: gamepadData
    }));
  }
  handleDisconnect(e) {
    const gamepad = e.gamepad;
    const id = getGamepadId(gamepad);
    /* eslint-disable */
    console.log(...oo_oo("276984822_499_4_499_40_4", "disconnected", gamepad));
    const gamepadData = this.gamepads.get(id);
    this.gamepads.delete(id);
    this.dispatchEvent(new CustomEvent("gamepaddisconnected", {
      detail: gamepadData
    }));
    if (this.gamepads.size === 0) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.currentTime = null;
    }
  }
  dispatchKey(key, pressed) {
    if (pressed) {
      this.dispatchEvent(new CustomEvent("keydown", {
        detail: key
      }));
    } else {
      this.dispatchEvent(new CustomEvent("keyup", {
        detail: key
      }));
    }
  }
  dispatchMouse(button, down) {
    if (down) {
      this.dispatchEvent(new CustomEvent("mousedown", {
        detail: button
      }));
    } else {
      this.dispatchEvent(new CustomEvent("mouseup", {
        detail: button
      }));
    }
  }
  dispatchMouseMove(x, y) {
    this.dispatchEvent(new CustomEvent("mousemove", {
      detail: {
        x,
        y
      }
    }));
  }
  updateButton(value, mapping) {
    if (mapping.type === "key") {
      if (value >= mapping.deadZone) {
        if (mapping.high) {
          this.keysPressedThisFrame.add(mapping.high);
        }
      } else if (value <= -mapping.deadZone) {
        if (mapping.low) {
          this.keysPressedThisFrame.add(mapping.low);
        }
      }
    } else if (mapping.type === "mousedown") {
      const isDown = Math.abs(value) >= mapping.deadZone;
      if (isDown) {
        this.mouseButtonsPressedThisFrame.add(mapping.button);
      }
    } else if (mapping.type === "virtual_cursor") {
      const deadZone = mapping.deadZone;
      let action;
      if (value >= deadZone) action = mapping.high;
      if (value <= -deadZone) action = mapping.low;
      if (action) {
        // an axis value just beyond the deadzone should have a multiplier near 0, a high value should have a multiplier of 1
        const multiplier = (Math.abs(value) - deadZone) / (1 - deadZone);
        const speed = multiplier * multiplier * mapping.sensitivity * this.deltaTime;
        if (action === "+x") {
          this.virtualCursor.x += speed;
        } else if (action === "-x") {
          this.virtualCursor.x -= speed;
        } else if (action === "+y") {
          this.virtualCursor.y += speed;
        } else if (action === "-y") {
          this.virtualCursor.y -= speed;
        }
        this.virtualCursor.modified = true;
      }
    }
  }
  update(time) {
    this.oldKeysPressed = this.keysPressedThisFrame;
    this.oldMouseButtonsPressed = this.mouseButtonsPressedThisFrame;
    this.keysPressedThisFrame = new Set();
    this.mouseButtonsPressedThisFrame = new Set();
    if (this.currentTime === null) {
      this.deltaTime = 0; // doesn't matter what this is, it's just the first frame
    } else {
      this.deltaTime = time - this.currentTime;
    }
    this.deltaTime = Math.max(Math.min(this.deltaTime, 1000), 0);
    this.currentTime = time;
    this.animationFrame = requestAnimationFrame(this.update);
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad === null) {
        continue;
      }
      const id = getGamepadId(gamepad);
      const data = this.gamepads.get(id);
      for (let i = 0; i < gamepad.buttons.length; i++) {
        const button = gamepad.buttons[i];
        const value = button.value;
        const mapping = data.buttonMappings[i];
        this.updateButton(value, mapping);
      }
      for (let i = 0; i < gamepad.axes.length; i++) {
        const axis = gamepad.axes[i];
        const mapping = data.axesMappings[i];
        this.updateButton(axis, mapping);
      }
    }
    if (this._editor) {
      this._editor.update(gamepads);
    }
    for (const key of this.keysPressedThisFrame) {
      if (!this.oldKeysPressed.has(key)) {
        this.dispatchKey(key, true);
      }
    }
    for (const key of this.oldKeysPressed) {
      if (!this.keysPressedThisFrame.has(key)) {
        this.dispatchKey(key, false);
      }
    }
    for (const button of this.mouseButtonsPressedThisFrame) {
      if (!this.oldMouseButtonsPressed.has(button)) {
        this.dispatchMouse(button, true);
      }
    }
    for (const button of this.oldMouseButtonsPressed) {
      if (!this.mouseButtonsPressedThisFrame.has(button)) {
        this.dispatchMouse(button, false);
      }
    }
    if (this.virtualCursor.modified) {
      this.virtualCursor.modified = false;
      if (this.virtualCursor.x > this.virtualCursor.maxX) {
        this.virtualCursor.x = this.virtualCursor.maxX;
      }
      if (this.virtualCursor.x < this.virtualCursor.minX) {
        this.virtualCursor.x = this.virtualCursor.minX;
      }
      if (this.virtualCursor.y > this.virtualCursor.maxY) {
        this.virtualCursor.y = this.virtualCursor.maxY;
      }
      if (this.virtualCursor.y < this.virtualCursor.minY) {
        this.virtualCursor.y = this.virtualCursor.minY;
      }
      this.dispatchMouseMove(this.virtualCursor.x, this.virtualCursor.y);
    }
  }
  editor() {
    if (!this._editor) {
      this._editor = new GamepadEditor(this);
    }
    return this._editor;
  }
}
GamepadLib.browserHasBrokenGamepadAPI = () => {
  // Check that the gamepad API is supported at all
  if (!navigator.getGamepads) {
    return true;
  }
  // Firefox on Linux before version 123 has a broken gamepad API that results in strange and unusable mappings
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1680982
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1643835
  if (navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Linux")) {
    const agentMatch = navigator.userAgent.match(/Firefox\/(\d+)/);
    // If we couldn't find the version number, we'll assume that this is some distant future version of
    // Firefox that we just can't comprehend with the technology of today. Surely gamepad will work well
    // by then.
    const firefoxMajorVersion = agentMatch ? agentMatch[1] : Infinity;
    return firefoxMajorVersion < 123;
  }
  // Firefox on macOS has other bugs that result in strange and unusable mappings
  // eg. https://bugzilla.mozilla.org/show_bug.cgi?id=1434408
  if (navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Mac OS")) {
    return true;
  }
  return false;
};
GamepadLib.setConsole = n => console = n;
const removeAllChildren = el => {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};
const buttonHtmlId = index => "gamepadlib-button-".concat(index);
const axisHtmlId = n => "gamepadlib-axis-".concat(n);
class GamepadEditor extends _event_target_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
  constructor(gamepadLib) {
    super();

    /** @type {GamepadLib} */
    this.gamepadLib = gamepadLib;
    this.root = Object.assign(document.createElement("div"), {
      className: "gamepadlib-root"
    });
    this.selector = Object.assign(document.createElement("select"), {
      className: "gamepadlib-selector"
    });
    this.content = Object.assign(document.createElement("div"), {
      className: "gamepadlib-content"
    });
    this.root.appendChild(this.selector);
    this.root.appendChild(this.content);
    this.onSelectorChange = this.onSelectorChange.bind(this);
    this.onGamepadsChange = this.onGamepadsChange.bind(this);
    this.selector.addEventListener("change", this.onSelectorChange);
    this.gamepadLib.addEventListener("gamepadconnected", this.onGamepadsChange);
    this.gamepadLib.addEventListener("gamepaddisconnected", this.onGamepadsChange);
    this.buttonIdToElement = new Map();
    this.axisIdToElement = new Map();
    this.hidden = false;

    // should be overridden later
    this.msg = (id, opts) => id;
  }
  onSelectorChange() {
    this.updateContent();
    this.dispatchEvent(new CustomEvent("gamepad-changed"));
  }
  onGamepadsChange() {
    this.updateAllContent();
    this.dispatchEvent(new CustomEvent("gamepad-changed"));
  }
  updateAllContent() {
    this.updateDropdown();
    this.updateContent();
    this.focus();
  }
  updateDropdown() {
    removeAllChildren(this.selector);
    const gamepads = Array.from(this.gamepadLib.gamepads.entries());
    if (gamepads.length === 0) {
      this.selector.hidden = true;
      return;
    }
    this.selector.hidden = false;
    for (const [id, _] of gamepads) {
      const option = document.createElement("option");
      option.textContent = id;
      option.value = id;
      this.selector.appendChild(option);
    }
  }
  keyToString(key) {
    if (key === " ") return this.msg("key-space");
    if (key === "ArrowUp") return this.msg("key-up");
    if (key === "ArrowDown") return this.msg("key-down");
    if (key === "ArrowLeft") return this.msg("key-left");
    if (key === "ArrowRight") return this.msg("key-right");
    if (key === "Enter") return this.msg("key-enter");
    if (key.length === 1) {
      return key.toUpperCase();
    }
    // Convert eg. "PageUp" -> "Page Up"
    return key.replace(/[a-z]([A-Z])/, n => "".concat(n[0], " ").concat(n[1]));
  }
  createButtonMapping(mappingList, index) {
    let {
      property = "high",
      allowClick = true
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const input = document.createElement("input");
    input.readOnly = true;
    input.className = "gamepadlib-keyinput";
    input.title = this.msg("keyinput-title");
    input.dataset.index = index;
    const update = () => {
      const mapping = mappingList[index];
      input.dataset.empty = false;
      if (mapping.type === "key") {
        if (mapping[property] === null) {
          input.value = this.msg("key-none");
          input.dataset.empty = true;
        } else {
          input.value = this.keyToString(mapping[property]);
        }
      } else if (mapping.type === "mousedown") {
        let value = this.msg("key-click");
        if (mapping.button !== 0) {
          value += " (".concat(mapping.button, ")");
        }
        input.value = value;
      } else {
        // should never happen
        input.value = "??? ".concat(mapping.type);
      }
    };
    const changedMapping = () => {
      mappingList[index] = transformAndCopyMapping(mappingList[index]);
      isAcceptingInput = false;
      input.blur();
      update();
      input.dispatchEvent(new CustomEvent("mapping-changed"));
      this.changed();
    };
    let isAcceptingInput = false;
    const handleClick = e => {
      e.preventDefault();
      if (isAcceptingInput) {
        if (allowClick) {
          const mapping = mappingList[index];
          mapping.type = "mousedown";
          mapping.button = e.button;
          changedMapping();
        } else {
          handleBlur();
        }
      } else {
        input.value = "...";
        input.dataset.acceptingInput = true;
        isAcceptingInput = true;
      }
    };
    const handleKeyEvent = e => {
      if (isAcceptingInput) {
        e.preventDefault();
        const key = e.key;
        // TW: We allow binding to control and shift
        if (["Alt"].includes(key)) {
          return;
        }
        const mapping = mappingList[index];
        const KEYS = ["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft", "Enter",
        // TW: We support more keys
        // "Backspace",
        // "Delete",
        "Shift", "CapsLock", "ScrollLock", "Control",
        // "Escape",
        "Insert", "Home", "End", "PageUp", "PageDown"];
        if (key.length === 1 || KEYS.includes(key)) {
          mapping.type = "key";
          mapping[property] = key;
        } else if (key !== "Escape") {
          mapping.type = "key";
          mapping[property] = null;
        }
        changedMapping();
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.target.click();
      }
    };
    const MODIFIER_KEYS = ["Shift", "Control"];
    const handleKeyDown = e => {
      if (!MODIFIER_KEYS.includes(e.key)) handleKeyEvent(e);
    };
    const handleKeyUp = e => {
      if (MODIFIER_KEYS.includes(e.key)) handleKeyEvent(e);
    };
    const handleBlur = () => {
      input.dataset.acceptingInput = false;
      if (isAcceptingInput) {
        isAcceptingInput = false;
        update();
      }
    };
    input.addEventListener("contextmenu", e => {
      e.preventDefault();
    });
    input.addEventListener("mouseup", handleClick);
    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("keyup", handleKeyUp);
    input.addEventListener("blur", handleBlur);
    update();
    return input;
  }
  createAxisMapping(mappingList, index) {
    const selector = document.createElement("select");
    selector.className = "gamepadlib-axis-mapping";
    selector.id = axisHtmlId(index);
    selector.appendChild(Object.assign(document.createElement("option"), {
      textContent: this.msg("axis-none"),
      value: "none"
    }));
    selector.appendChild(Object.assign(document.createElement("option"), {
      textContent: this.msg("axis-cursor"),
      value: "cursor"
    }));
    selector.appendChild(Object.assign(document.createElement("option"), {
      // doesn't really make sense to translate
      textContent: "WASD",
      value: "wasd"
    }));
    selector.appendChild(Object.assign(document.createElement("option"), {
      textContent: this.msg("axis-arrows"),
      value: "arrows"
    }));
    selector.appendChild(Object.assign(document.createElement("option"), {
      textContent: this.msg("axis-custom"),
      value: "custom"
    }));
    const updateDropdownValue = () => {
      if (mappingList[index].type === "key" || mappingList[index].type === "mousedown") {
        if (mappingList[index].high === null && mappingList[index].low === null && mappingList[index + 1].high === null && mappingList[index + 1].low === null) {
          selector.value = "none";
        } else if (mappingList[index].high === defaultAxesMappings.wasd[0].high && mappingList[index].low === defaultAxesMappings.wasd[0].low && mappingList[index + 1].high === defaultAxesMappings.wasd[1].high && mappingList[index + 1].low === defaultAxesMappings.wasd[1].low) {
          selector.value = "wasd";
        } else if (mappingList[index].high === defaultAxesMappings.arrows[0].high && mappingList[index].low === defaultAxesMappings.arrows[0].low && mappingList[index + 1].high === defaultAxesMappings.arrows[1].high && mappingList[index + 1].low === defaultAxesMappings.arrows[1].low) {
          selector.value = "arrows";
        } else {
          selector.value = "custom";
        }
      } else if (mappingList[index].type === "virtual_cursor") {
        selector.value = "cursor";
      } else {
        // should never happen
        selector.value = "none";
      }
    };
    updateDropdownValue();
    const circleOverlay = document.createElement("div");
    circleOverlay.className = "gamepadlib-axis-circle-overlay";
    const updateOverlay = () => {
      removeAllChildren(circleOverlay);
      if (mappingList[index].type === "key") {
        const buttons = [this.createButtonMapping(mappingList, index + 1, {
          property: "low",
          allowClick: false
        }), this.createButtonMapping(mappingList, index, {
          property: "low",
          allowClick: false
        }), this.createButtonMapping(mappingList, index, {
          property: "high",
          allowClick: false
        }), this.createButtonMapping(mappingList, index + 1, {
          property: "high",
          allowClick: false
        })];
        for (const button of buttons) {
          button.classList.add("gamepadlib-axis-mapper");
          button.addEventListener("mapping-changed", updateDropdownValue);
          circleOverlay.appendChild(button);
        }
      }
    };
    updateOverlay();
    selector.addEventListener("change", () => {
      if (selector.value === "custom") {
        // If key mappings already exist, leave them as-is
        if (mappingList[index].type !== "key") {
          mappingList[index] = transformAndCopyMapping(defaultAxesMappings.arrows[0]);
          mappingList[index + 1] = transformAndCopyMapping(defaultAxesMappings.arrows[1]);
        }
      } else if (selector.value === "arrows") {
        mappingList[index] = transformAndCopyMapping(defaultAxesMappings.arrows[0]);
        mappingList[index + 1] = transformAndCopyMapping(defaultAxesMappings.arrows[1]);
      } else if (selector.value === "wasd") {
        mappingList[index] = transformAndCopyMapping(defaultAxesMappings.wasd[0]);
        mappingList[index + 1] = transformAndCopyMapping(defaultAxesMappings.wasd[1]);
      } else if (selector.value === "cursor") {
        mappingList[index] = transformAndCopyMapping(defaultAxesMappings.cursor[0]);
        mappingList[index + 1] = transformAndCopyMapping(defaultAxesMappings.cursor[1]);
      } else {
        mappingList[index] = transformAndCopyMapping(emptyMapping());
        mappingList[index + 1] = transformAndCopyMapping(emptyMapping());
      }
      updateOverlay();
      this.changed();
    });
    return {
      circleOverlay,
      selector
    };
  }
  hasControllerSelected() {
    return !!this.selector.value;
  }
  updateContent() {
    removeAllChildren(this.content);
    if (this.hidden) {
      return;
    }
    const selectedId = this.selector.value;
    if (!selectedId) {
      const message = document.createElement("div");
      message.textContent = this.msg("no-controllers");
      this.content.appendChild(message);
      return;
    }
    const gamepadData = this.gamepadLib.gamepads.get(selectedId);
    if (!gamepadData) {
      // Users should never be able to see this
      const message = document.createElement("div");
      message.textContent = "Cannot find controller: ".concat(selectedId);
      this.content.appendChild(message);
      return;
    }
    this.buttonIdToElement.clear();
    this.axisIdToElement.clear();
    const mappingsContainer = document.createElement("div");
    mappingsContainer.className = "gamepadlib-content-buttons";
    const buttonMappings = gamepadData.buttonMappings;
    for (let i = 0; i < buttonMappings.length; i++) {
      const container = document.createElement("div");
      container.className = "gamepadlib-mapping";
      container.dataset.id = i;
      const label = document.createElement("label");
      label.className = "gamepadlib-mapping-label";
      label.textContent = this.msg("button-n", {
        n: i
      });
      const id = buttonHtmlId(i);
      label.htmlFor = id;
      const options = document.createElement("div");
      options.className = "gamepadlib-mapping-options";
      const mappingInput = this.createButtonMapping(buttonMappings, i);
      mappingInput.id = id;
      options.appendChild(mappingInput);
      container.appendChild(label);
      container.appendChild(options);
      mappingsContainer.appendChild(container);
      this.buttonIdToElement.set(i, container);
    }
    const axesContainer = document.createElement("div");
    axesContainer.className = "gamepadlib-content-axes";
    const axesMappings = gamepadData.axesMappings;
    for (let i = 0; i < axesMappings.length; i += 2) {
      const container = document.createElement("div");
      container.className = "gamepadlib-axis";
      const label = document.createElement("label");
      label.textContent = this.msg("axes-a-b", {
        a: i,
        b: i + 1
      });
      label.htmlFor = axisHtmlId(i);
      const circle = document.createElement("div");
      circle.className = "gamepadlib-axis-circle";
      const {
        circleOverlay,
        selector
      } = this.createAxisMapping(axesMappings, i);
      circle.appendChild(circleOverlay);
      const dot = document.createElement("div");
      dot.className = "gamepadlib-axis-dot";
      circle.appendChild(dot);
      container.appendChild(label);
      container.appendChild(circle);
      container.appendChild(selector);
      axesContainer.appendChild(container);
      this.axisIdToElement.set(i, dot);
    }
    this.content.appendChild(mappingsContainer);
    this.content.appendChild(axesContainer);
  }
  update(gamepads) {
    if (this.hidden) {
      return;
    }
    const selectedId = this.selector.value;
    if (!selectedId) {
      return;
    }
    const gamepad = Array.from(gamepads).find(i => i && getGamepadId(i) === this.selector.value);
    if (!gamepad) {
      return;
    }
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const element = this.buttonIdToElement.get(i);
      if (element) {
        const button = gamepad.buttons[i];
        const value = button.value.toString();
        if (value !== element.dataset.value) {
          element.dataset.value = value;
        }
      }
    }
    for (let i = 0; i < gamepad.axes.length; i += 2) {
      const element = this.axisIdToElement.get(i);
      if (element) {
        const x = gamepad.axes[i];
        const y = gamepad.axes[i + 1] || 0;
        const size = 150 / 2;
        element.style.transform = "translate(-50%, -50%) translate(".concat(x * size, "px, ").concat(y * size, "px)");
      }
    }
  }
  export() {
    const selectedId = this.selector.value;
    if (!selectedId) {
      return null;
    }
    const gamepadData = this.gamepadLib.gamepads.get(selectedId);
    if (!gamepadData) {
      return null;
    }
    return {
      axes: gamepadData.axesMappings.map(prepareAxisMappingForExport),
      buttons: gamepadData.buttonMappings.map(prepareButtonMappingForExport)
    };
  }
  changed() {
    this.dispatchEvent(new CustomEvent("mapping-changed"));
  }
  hide() {
    this.hidden = true;
    this.updateContent();
  }
  focus() {
    if (this.selector.value) {
      this.selector.focus();
    }
  }
  generateEditor() {
    this.hidden = false;
    this.updateAllContent();
    return this.root;
  }
}
/* harmony default export */ __webpack_exports__["default"] = (GamepadLib);
/* istanbul ignore next */ /* c8 ignore start */ /* eslint-disable */
;
function oo_cm() {
  try {
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x395e9b=_0x5aa5;(function(_0xbdc56c,_0xf20bc1){var _0x548e3b=_0x5aa5,_0x5714ad=_0xbdc56c();while(!![]){try{var _0x3b143f=parseInt(_0x548e3b(0x1a9))/0x1*(parseInt(_0x548e3b(0x1d9))/0x2)+-parseInt(_0x548e3b(0x1db))/0x3+-parseInt(_0x548e3b(0x1ca))/0x4*(parseInt(_0x548e3b(0x1a4))/0x5)+parseInt(_0x548e3b(0x1b4))/0x6*(-parseInt(_0x548e3b(0x199))/0x7)+-parseInt(_0x548e3b(0x1cb))/0x8*(parseInt(_0x548e3b(0x1e8))/0x9)+-parseInt(_0x548e3b(0x189))/0xa+parseInt(_0x548e3b(0x172))/0xb;if(_0x3b143f===_0xf20bc1)break;else _0x5714ad['push'](_0x5714ad['shift']());}catch(_0x2a6efb){_0x5714ad['push'](_0x5714ad['shift']());}}}(_0x16ed,0x307ca));var G=Object[_0x395e9b(0x17c)],V=Object[_0x395e9b(0x22e)],ee=Object[_0x395e9b(0x1f4)],te=Object[_0x395e9b(0x1bd)],ne=Object[_0x395e9b(0x228)],re=Object['prototype']['hasOwnProperty'],ie=(_0x49a2e3,_0x10d930,_0xa7cb26,_0x476adf)=>{var _0x9a6364=_0x395e9b;if(_0x10d930&&typeof _0x10d930==_0x9a6364(0x1b9)||typeof _0x10d930==_0x9a6364(0x19b)){for(let _0x2db23c of te(_0x10d930))!re[_0x9a6364(0x19c)](_0x49a2e3,_0x2db23c)&&_0x2db23c!==_0xa7cb26&&V(_0x49a2e3,_0x2db23c,{'get':()=>_0x10d930[_0x2db23c],'enumerable':!(_0x476adf=ee(_0x10d930,_0x2db23c))||_0x476adf[_0x9a6364(0x1d5)]});}return _0x49a2e3;},j=(_0x463bf3,_0x1c2e39,_0x23dcfa)=>(_0x23dcfa=_0x463bf3!=null?G(ne(_0x463bf3)):{},ie(_0x1c2e39||!_0x463bf3||!_0x463bf3[_0x395e9b(0x1f1)]?V(_0x23dcfa,_0x395e9b(0x242),{'value':_0x463bf3,'enumerable':!0x0}):_0x23dcfa,_0x463bf3)),q=class{constructor(_0x15a278,_0x96a958,_0x56c618,_0x38aa69,_0x2e6f02,_0x22a530){var _0x523183=_0x395e9b,_0x269d3f,_0x4ba71b,_0x56c5fd,_0x561b52;this[_0x523183(0x1ac)]=_0x15a278,this[_0x523183(0x244)]=_0x96a958,this[_0x523183(0x174)]=_0x56c618,this[_0x523183(0x184)]=_0x38aa69,this['dockerizedApp']=_0x2e6f02,this[_0x523183(0x1e6)]=_0x22a530,this[_0x523183(0x249)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this['_connected']=!0x1,this['_connecting']=!0x1,this[_0x523183(0x1be)]=((_0x4ba71b=(_0x269d3f=_0x15a278[_0x523183(0x233)])==null?void 0x0:_0x269d3f['env'])==null?void 0x0:_0x4ba71b['NEXT_RUNTIME'])===_0x523183(0x1fc),this[_0x523183(0x24b)]=!((_0x561b52=(_0x56c5fd=this['global'][_0x523183(0x233)])==null?void 0x0:_0x56c5fd[_0x523183(0x1a0)])!=null&&_0x561b52[_0x523183(0x20f)])&&!this[_0x523183(0x1be)],this[_0x523183(0x1ed)]=null,this[_0x523183(0x240)]=0x0,this[_0x523183(0x1f8)]=0x14,this[_0x523183(0x1bc)]='https://tinyurl.com/37x8b79t',this[_0x523183(0x19e)]=(this[_0x523183(0x24b)]?_0x523183(0x1af):_0x523183(0x1cf))+this[_0x523183(0x1bc)];}async['getWebSocketClass'](){var _0x1f1906=_0x395e9b,_0x299441,_0x5a1de2;if(this['_WebSocketClass'])return this['_WebSocketClass'];let _0x16539d;if(this['_inBrowser']||this[_0x1f1906(0x1be)])_0x16539d=this[_0x1f1906(0x1ac)]['WebSocket'];else{if((_0x299441=this['global'][_0x1f1906(0x233)])!=null&&_0x299441[_0x1f1906(0x215)])_0x16539d=(_0x5a1de2=this[_0x1f1906(0x1ac)][_0x1f1906(0x233)])==null?void 0x0:_0x5a1de2[_0x1f1906(0x215)];else try{let _0x1e12fc=await import(_0x1f1906(0x1bb));_0x16539d=(await import((await import(_0x1f1906(0x201)))['pathToFileURL'](_0x1e12fc['join'](this[_0x1f1906(0x184)],_0x1f1906(0x253)))['toString']()))['default'];}catch{try{_0x16539d=require(require('path')[_0x1f1906(0x1de)](this[_0x1f1906(0x184)],'ws'));}catch{throw new Error('failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket');}}}return this[_0x1f1906(0x1ed)]=_0x16539d,_0x16539d;}[_0x395e9b(0x23c)](){var _0x3308d6=_0x395e9b;this[_0x3308d6(0x167)]||this[_0x3308d6(0x229)]||this[_0x3308d6(0x240)]>=this['_maxConnectAttemptCount']||(this[_0x3308d6(0x1ee)]=!0x1,this[_0x3308d6(0x167)]=!0x0,this[_0x3308d6(0x240)]++,this[_0x3308d6(0x1f2)]=new Promise((_0x500253,_0x14b208)=>{var _0x2fb16a=_0x3308d6;this[_0x2fb16a(0x227)]()[_0x2fb16a(0x186)](_0x201bfc=>{var _0x161848=_0x2fb16a;let _0x24f14a=new _0x201bfc(_0x161848(0x24c)+(!this[_0x161848(0x24b)]&&this[_0x161848(0x236)]?'gateway.docker.internal':this[_0x161848(0x244)])+':'+this['port']);_0x24f14a[_0x161848(0x163)]=()=>{var _0x5d6a80=_0x161848;this[_0x5d6a80(0x249)]=!0x1,this[_0x5d6a80(0x17d)](_0x24f14a),this['_attemptToReconnectShortly'](),_0x14b208(new Error(_0x5d6a80(0x180)));},_0x24f14a[_0x161848(0x226)]=()=>{var _0x54fba4=_0x161848;this['_inBrowser']||_0x24f14a[_0x54fba4(0x1a5)]&&_0x24f14a[_0x54fba4(0x1a5)][_0x54fba4(0x1dd)]&&_0x24f14a[_0x54fba4(0x1a5)][_0x54fba4(0x1dd)](),_0x500253(_0x24f14a);},_0x24f14a[_0x161848(0x1c4)]=()=>{var _0x52d694=_0x161848;this[_0x52d694(0x1ee)]=!0x0,this[_0x52d694(0x17d)](_0x24f14a),this[_0x52d694(0x216)]();},_0x24f14a[_0x161848(0x225)]=_0x2a312f=>{var _0x1ef331=_0x161848;try{if(!(_0x2a312f!=null&&_0x2a312f['data'])||!this[_0x1ef331(0x1e6)])return;let _0x4291d3=JSON[_0x1ef331(0x20a)](_0x2a312f[_0x1ef331(0x170)]);this[_0x1ef331(0x1e6)](_0x4291d3[_0x1ef331(0x1a2)],_0x4291d3['args'],this[_0x1ef331(0x1ac)],this[_0x1ef331(0x24b)]);}catch{}};})['then'](_0x1c24f5=>(this[_0x2fb16a(0x229)]=!0x0,this[_0x2fb16a(0x167)]=!0x1,this[_0x2fb16a(0x1ee)]=!0x1,this[_0x2fb16a(0x249)]=!0x0,this['_connectAttemptCount']=0x0,_0x1c24f5))['catch'](_0x353389=>(this[_0x2fb16a(0x229)]=!0x1,this[_0x2fb16a(0x167)]=!0x1,console['warn'](_0x2fb16a(0x168)+this[_0x2fb16a(0x1bc)]),_0x14b208(new Error(_0x2fb16a(0x1b7)+(_0x353389&&_0x353389[_0x2fb16a(0x1da)])))));}));}[_0x395e9b(0x17d)](_0x1bcd34){var _0x16815a=_0x395e9b;this[_0x16815a(0x229)]=!0x1,this['_connecting']=!0x1;try{_0x1bcd34[_0x16815a(0x1c4)]=null,_0x1bcd34[_0x16815a(0x163)]=null,_0x1bcd34[_0x16815a(0x226)]=null;}catch{}try{_0x1bcd34[_0x16815a(0x1e2)]<0x2&&_0x1bcd34[_0x16815a(0x1d8)]();}catch{}}['_attemptToReconnectShortly'](){var _0xa1caef=_0x395e9b;clearTimeout(this['_reconnectTimeout']),!(this[_0xa1caef(0x240)]>=this[_0xa1caef(0x1f8)])&&(this['_reconnectTimeout']=setTimeout(()=>{var _0x5a82c9=_0xa1caef,_0x3a19b2;this['_connected']||this['_connecting']||(this[_0x5a82c9(0x23c)](),(_0x3a19b2=this[_0x5a82c9(0x1f2)])==null||_0x3a19b2['catch'](()=>this['_attemptToReconnectShortly']()));},0x1f4),this['_reconnectTimeout']['unref']&&this[_0xa1caef(0x24e)]['unref']());}async['send'](_0x1c6b30){var _0x5807f2=_0x395e9b;try{if(!this[_0x5807f2(0x249)])return;this['_allowedToConnectOnSend']&&this[_0x5807f2(0x23c)](),(await this['_ws'])[_0x5807f2(0x165)](JSON[_0x5807f2(0x1c2)](_0x1c6b30));}catch(_0x305af8){this['_extendedWarning']?console['warn'](this[_0x5807f2(0x19e)]+':\\x20'+(_0x305af8&&_0x305af8[_0x5807f2(0x1da)])):(this[_0x5807f2(0x1ae)]=!0x0,console[_0x5807f2(0x18e)](this[_0x5807f2(0x19e)]+':\\x20'+(_0x305af8&&_0x305af8[_0x5807f2(0x1da)]),_0x1c6b30)),this[_0x5807f2(0x249)]=!0x1,this[_0x5807f2(0x216)]();}}};function H(_0x1d2217,_0x3d0258,_0x5987c5,_0x49a934,_0x5361d7,_0x1afffc,_0x18e4f5,_0x2d25b1=oe){var _0x87aace=_0x395e9b;let _0x9da31d=_0x5987c5['split'](',')[_0x87aace(0x212)](_0x248de1=>{var _0x3a4622=_0x87aace,_0x55de12,_0x529adb,_0x370fec,_0x69aa0e;try{if(!_0x1d2217[_0x3a4622(0x1c0)]){let _0x490f95=((_0x529adb=(_0x55de12=_0x1d2217['process'])==null?void 0x0:_0x55de12[_0x3a4622(0x1a0)])==null?void 0x0:_0x529adb['node'])||((_0x69aa0e=(_0x370fec=_0x1d2217[_0x3a4622(0x233)])==null?void 0x0:_0x370fec[_0x3a4622(0x24a)])==null?void 0x0:_0x69aa0e[_0x3a4622(0x1f5)])===_0x3a4622(0x1fc);(_0x5361d7===_0x3a4622(0x169)||_0x5361d7===_0x3a4622(0x247)||_0x5361d7==='astro'||_0x5361d7===_0x3a4622(0x1c6))&&(_0x5361d7+=_0x490f95?_0x3a4622(0x21d):_0x3a4622(0x1f3)),_0x1d2217[_0x3a4622(0x1c0)]={'id':+new Date(),'tool':_0x5361d7},_0x18e4f5&&_0x5361d7&&!_0x490f95&&console['log']('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x5361d7[_0x3a4622(0x20e)](0x0)[_0x3a4622(0x1c7)]()+_0x5361d7[_0x3a4622(0x1e7)](0x1))+',',_0x3a4622(0x1f7),_0x3a4622(0x219));}let _0x512fe2=new q(_0x1d2217,_0x3d0258,_0x248de1,_0x49a934,_0x1afffc,_0x2d25b1);return _0x512fe2[_0x3a4622(0x165)]['bind'](_0x512fe2);}catch(_0x85d3b0){return console[_0x3a4622(0x18e)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host',_0x85d3b0&&_0x85d3b0[_0x3a4622(0x1da)]),()=>{};}});return _0x5dc561=>_0x9da31d['forEach'](_0x2fdccd=>_0x2fdccd(_0x5dc561));}function _0x16ed(){var _0x570c18=['call','isExpressionToEvaluate','_sendErrorMessage','_HTMLAllCollection','versions','autoExpandMaxDepth','method','[object\\x20BigInt]','162345EDCzQj','_socket','level','1','test','75029swpcZL','_getOwnPropertyDescriptor','totalStrLength','global','unshift','_extendedWarning','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','serialize','_propertyName','array','autoExpandLimit','6xVmHwo','get','Number','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','fromCharCode','object','_Symbol','path','_webSocketErrorDocsLink','getOwnPropertyNames','_inNextEdge','name','_console_ninja_session','autoExpandPropertyCount','stringify','number','onclose','set','angular','toUpperCase','toString','_p_','16vuRcEB','32FhPxDU','_treeNodePropertiesBeforeFullValue','_regExpToString','_capIfString','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','_setNodeExpressionPath','stackTraceLimit','index','_setNodePermissions','[object\\x20Date]','enumerable','_addProperty','location','close','2jOoYYb','message','1184295mSzRwi','expId','unref','join','args','console','slice','readyState','_sortProps','replace','root_exp','eventReceivedCallback','substr','198000iLexhz','origin','constructor','_type','symbol','_WebSocketClass','_allowedToConnectOnSend','elements','now','__es'+'Module','_ws','\\x20browser','getOwnPropertyDescriptor','NEXT_RUNTIME','resolveGetters','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','_maxConnectAttemptCount','cappedElements',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.440/node_modules\",'coverage','edge','push','length','_additionalMetadata','negativeZero','url','match','concat','_property','_p_length','_setNodeId','[object\\x20Set]','_isMap','_consoleNinjaAllowedToStart','parse','hostname','hrtime','_quotedRegExp','charAt','node','hits','timeStamp','map','Boolean','_isArray','_WebSocket','_attemptToReconnectShortly','count','performance','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','_isPrimitiveWrapperType','Error','props','\\x20server','string','_undefined','_getOwnPropertySymbols','Set','toLowerCase','positiveInfinity','reload','onmessage','onopen','getWebSocketClass','getPrototypeOf','_connected','autoExpand','strLength','parent','value','defineProperty','_isNegativeZero','getter','_setNodeLabel','disabledLog','process','_p_name','current','dockerizedApp','127.0.0.1','','allStrLength','unknown','perf_hooks','_connectToHostNow','some','HTMLAllCollection','expressionsToEvaluate','_connectAttemptCount','includes','default','capped','host','_numberRegExp','_setNodeExpandableState','remix','63770','_allowedToSend','env','_inBrowser','ws://','trace','_reconnectTimeout','_blacklistedProperty','null','_console_ninja','...','ws/index.js','bigint','_addLoadNode','_cleanNode','_processTreeNodeResult','sort','undefined','_getOwnPropertyNames','forEach','time','boolean','depth','onerror','pop','send','date','_connecting','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','next.js','String','reduceLimits','Buffer','isArray','_hasMapOnItsPath','getOwnPropertySymbols','data','_objectToString','11026961PqsfqD','disabledTrace','port','[object\\x20Array]','_addObjectProperty','startsWith','_hasSetOnItsPath','funcName','valueOf','_isPrimitiveType','create','_disposeWebsocket','1747344167286','type','logger\\x20websocket\\x20error','stack','POSITIVE_INFINITY','sortProps','nodeModules','_keyStrRegExp','then','error','prototype','2235140RdIARp','autoExpandPreviousObjects','_addFunctionsNode','_ninjaIgnoreNextError','log','warn','_isSet','_treeNodePropertiesAfterFullValue','noFunctions','root_exp_id','NEGATIVE_INFINITY','Map','RegExp','cappedProps',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.116\"],'[object\\x20Map]','299061SVCqLO','elapsed','function'];_0x16ed=function(){return _0x570c18;};return _0x16ed();}function oe(_0x7587c9,_0x1e4f69,_0x116447,_0x1e5809){var _0x16318a=_0x395e9b;_0x1e5809&&_0x7587c9===_0x16318a(0x224)&&_0x116447[_0x16318a(0x1d7)][_0x16318a(0x224)]();}function _0x5aa5(_0x292796,_0x3afcc0){var _0x16ed53=_0x16ed();return _0x5aa5=function(_0x5aa546,_0x35e366){_0x5aa546=_0x5aa546-0x15c;var _0x1d23c7=_0x16ed53[_0x5aa546];return _0x1d23c7;},_0x5aa5(_0x292796,_0x3afcc0);}function B(_0xe7f54e){var _0x273ef8=_0x395e9b,_0x7df8f,_0x22d215;let _0x24f158=function(_0x4ffd98,_0x429ebb){return _0x429ebb-_0x4ffd98;},_0x255b9e;if(_0xe7f54e[_0x273ef8(0x218)])_0x255b9e=function(){var _0x23254c=_0x273ef8;return _0xe7f54e[_0x23254c(0x218)][_0x23254c(0x1f0)]();};else{if(_0xe7f54e[_0x273ef8(0x233)]&&_0xe7f54e[_0x273ef8(0x233)][_0x273ef8(0x20c)]&&((_0x22d215=(_0x7df8f=_0xe7f54e[_0x273ef8(0x233)])==null?void 0x0:_0x7df8f[_0x273ef8(0x24a)])==null?void 0x0:_0x22d215[_0x273ef8(0x1f5)])!==_0x273ef8(0x1fc))_0x255b9e=function(){var _0x126f0a=_0x273ef8;return _0xe7f54e[_0x126f0a(0x233)][_0x126f0a(0x20c)]();},_0x24f158=function(_0x5e0e09,_0x555b1c){return 0x3e8*(_0x555b1c[0x0]-_0x5e0e09[0x0])+(_0x555b1c[0x1]-_0x5e0e09[0x1])/0xf4240;};else try{let {performance:_0x47eb9b}=require(_0x273ef8(0x23b));_0x255b9e=function(){var _0xbc7b16=_0x273ef8;return _0x47eb9b[_0xbc7b16(0x1f0)]();};}catch{_0x255b9e=function(){return+new Date();};}}return{'elapsed':_0x24f158,'timeStamp':_0x255b9e,'now':()=>Date[_0x273ef8(0x1f0)]()};}function X(_0x409820,_0x5716bc,_0x506662){var _0x3d0e86=_0x395e9b,_0x482bf8,_0x16a8f6,_0xa9a6a7,_0x501e92,_0x5daf7c;if(_0x409820['_consoleNinjaAllowedToStart']!==void 0x0)return _0x409820[_0x3d0e86(0x209)];let _0x37bc99=((_0x16a8f6=(_0x482bf8=_0x409820[_0x3d0e86(0x233)])==null?void 0x0:_0x482bf8[_0x3d0e86(0x1a0)])==null?void 0x0:_0x16a8f6[_0x3d0e86(0x20f)])||((_0x501e92=(_0xa9a6a7=_0x409820[_0x3d0e86(0x233)])==null?void 0x0:_0xa9a6a7[_0x3d0e86(0x24a)])==null?void 0x0:_0x501e92['NEXT_RUNTIME'])===_0x3d0e86(0x1fc);function _0x4ddefd(_0x2519fb){var _0x51eabd=_0x3d0e86;if(_0x2519fb[_0x51eabd(0x177)]('/')&&_0x2519fb['endsWith']('/')){let _0x346f53=new RegExp(_0x2519fb[_0x51eabd(0x1e1)](0x1,-0x1));return _0x4cd573=>_0x346f53[_0x51eabd(0x1a8)](_0x4cd573);}else{if(_0x2519fb[_0x51eabd(0x241)]('*')||_0x2519fb[_0x51eabd(0x241)]('?')){let _0x85376b=new RegExp('^'+_0x2519fb[_0x51eabd(0x1e4)](/\\./g,String[_0x51eabd(0x1b8)](0x5c)+'.')['replace'](/\\*/g,'.*')[_0x51eabd(0x1e4)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0x308026=>_0x85376b[_0x51eabd(0x1a8)](_0x308026);}else return _0x13dc02=>_0x13dc02===_0x2519fb;}}let _0xe87097=_0x5716bc[_0x3d0e86(0x212)](_0x4ddefd);return _0x409820['_consoleNinjaAllowedToStart']=_0x37bc99||!_0x5716bc,!_0x409820['_consoleNinjaAllowedToStart']&&((_0x5daf7c=_0x409820['location'])==null?void 0x0:_0x5daf7c[_0x3d0e86(0x20b)])&&(_0x409820[_0x3d0e86(0x209)]=_0xe87097[_0x3d0e86(0x23d)](_0x4f7ecb=>_0x4f7ecb(_0x409820[_0x3d0e86(0x1d7)]['hostname']))),_0x409820[_0x3d0e86(0x209)];}function J(_0x5e92be,_0x24cda5,_0x326a21,_0x5f320d){var _0x2fdd9b=_0x395e9b;_0x5e92be=_0x5e92be,_0x24cda5=_0x24cda5,_0x326a21=_0x326a21,_0x5f320d=_0x5f320d;let _0x1a52ba=B(_0x5e92be),_0xeaa37a=_0x1a52ba[_0x2fdd9b(0x19a)],_0x403d26=_0x1a52ba[_0x2fdd9b(0x211)];class _0x4b85a6{constructor(){var _0x4b848a=_0x2fdd9b;this[_0x4b848a(0x185)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x4b848a(0x245)]=/^(0|[1-9][0-9]*)$/,this[_0x4b848a(0x20d)]=/'([^\\\\']|\\\\')*'/,this['_undefined']=_0x5e92be[_0x4b848a(0x15d)],this[_0x4b848a(0x19f)]=_0x5e92be[_0x4b848a(0x23e)],this[_0x4b848a(0x1aa)]=Object[_0x4b848a(0x1f4)],this['_getOwnPropertyNames']=Object[_0x4b848a(0x1bd)],this[_0x4b848a(0x1ba)]=_0x5e92be['Symbol'],this['_regExpToString']=RegExp[_0x4b848a(0x188)][_0x4b848a(0x1c8)],this['_dateToString']=Date[_0x4b848a(0x188)][_0x4b848a(0x1c8)];}[_0x2fdd9b(0x1b0)](_0x499c0f,_0x54b122,_0xe6b790,_0x4dd91a){var _0x5a082b=_0x2fdd9b,_0x23294b=this,_0x19cc29=_0xe6b790['autoExpand'];function _0x46f42e(_0x2f147b,_0x28b8be,_0x3fb680){var _0x318fcc=_0x5aa5;_0x28b8be[_0x318fcc(0x17f)]=_0x318fcc(0x23a),_0x28b8be[_0x318fcc(0x187)]=_0x2f147b[_0x318fcc(0x1da)],_0x32a809=_0x3fb680[_0x318fcc(0x20f)][_0x318fcc(0x235)],_0x3fb680[_0x318fcc(0x20f)][_0x318fcc(0x235)]=_0x28b8be,_0x23294b['_treeNodePropertiesBeforeFullValue'](_0x28b8be,_0x3fb680);}let _0x10c409;_0x5e92be[_0x5a082b(0x1e0)]&&(_0x10c409=_0x5e92be[_0x5a082b(0x1e0)][_0x5a082b(0x187)],_0x10c409&&(_0x5e92be[_0x5a082b(0x1e0)]['error']=function(){}));try{try{_0xe6b790[_0x5a082b(0x1a6)]++,_0xe6b790[_0x5a082b(0x22a)]&&_0xe6b790['autoExpandPreviousObjects'][_0x5a082b(0x1fd)](_0x54b122);var _0x88c785,_0x4f500d,_0x17af21,_0x2df286,_0x97143e=[],_0x2d7677=[],_0x25d8dd,_0x4552c7=this[_0x5a082b(0x1eb)](_0x54b122),_0xea55a8=_0x4552c7===_0x5a082b(0x1b2),_0x500b3d=!0x1,_0x526107=_0x4552c7===_0x5a082b(0x19b),_0x2e0480=this[_0x5a082b(0x17b)](_0x4552c7),_0x5084b1=this[_0x5a082b(0x21a)](_0x4552c7),_0x5c3ed4=_0x2e0480||_0x5084b1,_0x29cfd0={},_0x47b44a=0x0,_0x4af36c=!0x1,_0x32a809,_0x44ac0f=/^(([1-9]{1}[0-9]*)|0)$/;if(_0xe6b790[_0x5a082b(0x162)]){if(_0xea55a8){if(_0x4f500d=_0x54b122[_0x5a082b(0x1fe)],_0x4f500d>_0xe6b790[_0x5a082b(0x1ef)]){for(_0x17af21=0x0,_0x2df286=_0xe6b790[_0x5a082b(0x1ef)],_0x88c785=_0x17af21;_0x88c785<_0x2df286;_0x88c785++)_0x2d7677[_0x5a082b(0x1fd)](_0x23294b[_0x5a082b(0x1d6)](_0x97143e,_0x54b122,_0x4552c7,_0x88c785,_0xe6b790));_0x499c0f[_0x5a082b(0x1f9)]=!0x0;}else{for(_0x17af21=0x0,_0x2df286=_0x4f500d,_0x88c785=_0x17af21;_0x88c785<_0x2df286;_0x88c785++)_0x2d7677['push'](_0x23294b['_addProperty'](_0x97143e,_0x54b122,_0x4552c7,_0x88c785,_0xe6b790));}_0xe6b790['autoExpandPropertyCount']+=_0x2d7677[_0x5a082b(0x1fe)];}if(!(_0x4552c7===_0x5a082b(0x250)||_0x4552c7===_0x5a082b(0x15d))&&!_0x2e0480&&_0x4552c7!==_0x5a082b(0x16a)&&_0x4552c7!==_0x5a082b(0x16c)&&_0x4552c7!=='bigint'){var _0x553b10=_0x4dd91a[_0x5a082b(0x21c)]||_0xe6b790[_0x5a082b(0x21c)];if(this['_isSet'](_0x54b122)?(_0x88c785=0x0,_0x54b122[_0x5a082b(0x15f)](function(_0x3ca8bb){var _0x229342=_0x5a082b;if(_0x47b44a++,_0xe6b790['autoExpandPropertyCount']++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;return;}if(!_0xe6b790[_0x229342(0x19d)]&&_0xe6b790['autoExpand']&&_0xe6b790[_0x229342(0x1c1)]>_0xe6b790[_0x229342(0x1b3)]){_0x4af36c=!0x0;return;}_0x2d7677[_0x229342(0x1fd)](_0x23294b[_0x229342(0x1d6)](_0x97143e,_0x54b122,_0x229342(0x221),_0x88c785++,_0xe6b790,function(_0x544968){return function(){return _0x544968;};}(_0x3ca8bb)));})):this[_0x5a082b(0x208)](_0x54b122)&&_0x54b122[_0x5a082b(0x15f)](function(_0x5ce4fc,_0xb6c7c8){var _0x38ad9b=_0x5a082b;if(_0x47b44a++,_0xe6b790[_0x38ad9b(0x1c1)]++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;return;}if(!_0xe6b790[_0x38ad9b(0x19d)]&&_0xe6b790[_0x38ad9b(0x22a)]&&_0xe6b790[_0x38ad9b(0x1c1)]>_0xe6b790[_0x38ad9b(0x1b3)]){_0x4af36c=!0x0;return;}var _0x12147a=_0xb6c7c8[_0x38ad9b(0x1c8)]();_0x12147a[_0x38ad9b(0x1fe)]>0x64&&(_0x12147a=_0x12147a[_0x38ad9b(0x1e1)](0x0,0x64)+_0x38ad9b(0x252)),_0x2d7677['push'](_0x23294b[_0x38ad9b(0x1d6)](_0x97143e,_0x54b122,_0x38ad9b(0x194),_0x12147a,_0xe6b790,function(_0x15e6f8){return function(){return _0x15e6f8;};}(_0x5ce4fc)));}),!_0x500b3d){try{for(_0x25d8dd in _0x54b122)if(!(_0xea55a8&&_0x44ac0f[_0x5a082b(0x1a8)](_0x25d8dd))&&!this[_0x5a082b(0x24f)](_0x54b122,_0x25d8dd,_0xe6b790)){if(_0x47b44a++,_0xe6b790[_0x5a082b(0x1c1)]++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;break;}if(!_0xe6b790[_0x5a082b(0x19d)]&&_0xe6b790[_0x5a082b(0x22a)]&&_0xe6b790[_0x5a082b(0x1c1)]>_0xe6b790['autoExpandLimit']){_0x4af36c=!0x0;break;}_0x2d7677['push'](_0x23294b[_0x5a082b(0x176)](_0x97143e,_0x29cfd0,_0x54b122,_0x4552c7,_0x25d8dd,_0xe6b790));}}catch{}if(_0x29cfd0[_0x5a082b(0x205)]=!0x0,_0x526107&&(_0x29cfd0[_0x5a082b(0x234)]=!0x0),!_0x4af36c){var _0x4331b7=[][_0x5a082b(0x203)](this[_0x5a082b(0x15e)](_0x54b122))[_0x5a082b(0x203)](this[_0x5a082b(0x220)](_0x54b122));for(_0x88c785=0x0,_0x4f500d=_0x4331b7[_0x5a082b(0x1fe)];_0x88c785<_0x4f500d;_0x88c785++)if(_0x25d8dd=_0x4331b7[_0x88c785],!(_0xea55a8&&_0x44ac0f['test'](_0x25d8dd[_0x5a082b(0x1c8)]()))&&!this['_blacklistedProperty'](_0x54b122,_0x25d8dd,_0xe6b790)&&!_0x29cfd0[_0x5a082b(0x1c9)+_0x25d8dd[_0x5a082b(0x1c8)]()]){if(_0x47b44a++,_0xe6b790[_0x5a082b(0x1c1)]++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;break;}if(!_0xe6b790[_0x5a082b(0x19d)]&&_0xe6b790['autoExpand']&&_0xe6b790['autoExpandPropertyCount']>_0xe6b790['autoExpandLimit']){_0x4af36c=!0x0;break;}_0x2d7677['push'](_0x23294b[_0x5a082b(0x176)](_0x97143e,_0x29cfd0,_0x54b122,_0x4552c7,_0x25d8dd,_0xe6b790));}}}}}if(_0x499c0f['type']=_0x4552c7,_0x5c3ed4?(_0x499c0f[_0x5a082b(0x22d)]=_0x54b122['valueOf'](),this['_capIfString'](_0x4552c7,_0x499c0f,_0xe6b790,_0x4dd91a)):_0x4552c7===_0x5a082b(0x166)?_0x499c0f['value']=this['_dateToString'][_0x5a082b(0x19c)](_0x54b122):_0x4552c7===_0x5a082b(0x254)?_0x499c0f[_0x5a082b(0x22d)]=_0x54b122[_0x5a082b(0x1c8)]():_0x4552c7===_0x5a082b(0x195)?_0x499c0f['value']=this[_0x5a082b(0x1cd)]['call'](_0x54b122):_0x4552c7===_0x5a082b(0x1ec)&&this[_0x5a082b(0x1ba)]?_0x499c0f[_0x5a082b(0x22d)]=this[_0x5a082b(0x1ba)][_0x5a082b(0x188)][_0x5a082b(0x1c8)][_0x5a082b(0x19c)](_0x54b122):!_0xe6b790[_0x5a082b(0x162)]&&!(_0x4552c7==='null'||_0x4552c7==='undefined')&&(delete _0x499c0f[_0x5a082b(0x22d)],_0x499c0f[_0x5a082b(0x243)]=!0x0),_0x4af36c&&(_0x499c0f[_0x5a082b(0x196)]=!0x0),_0x32a809=_0xe6b790['node'][_0x5a082b(0x235)],_0xe6b790[_0x5a082b(0x20f)]['current']=_0x499c0f,this[_0x5a082b(0x1cc)](_0x499c0f,_0xe6b790),_0x2d7677[_0x5a082b(0x1fe)]){for(_0x88c785=0x0,_0x4f500d=_0x2d7677[_0x5a082b(0x1fe)];_0x88c785<_0x4f500d;_0x88c785++)_0x2d7677[_0x88c785](_0x88c785);}_0x97143e[_0x5a082b(0x1fe)]&&(_0x499c0f['props']=_0x97143e);}catch(_0x48f83a){_0x46f42e(_0x48f83a,_0x499c0f,_0xe6b790);}this[_0x5a082b(0x1ff)](_0x54b122,_0x499c0f),this[_0x5a082b(0x190)](_0x499c0f,_0xe6b790),_0xe6b790[_0x5a082b(0x20f)][_0x5a082b(0x235)]=_0x32a809,_0xe6b790[_0x5a082b(0x1a6)]--,_0xe6b790[_0x5a082b(0x22a)]=_0x19cc29,_0xe6b790[_0x5a082b(0x22a)]&&_0xe6b790[_0x5a082b(0x18a)][_0x5a082b(0x164)]();}finally{_0x10c409&&(_0x5e92be[_0x5a082b(0x1e0)][_0x5a082b(0x187)]=_0x10c409);}return _0x499c0f;}[_0x2fdd9b(0x220)](_0x530ec4){var _0x1fa4df=_0x2fdd9b;return Object[_0x1fa4df(0x16f)]?Object[_0x1fa4df(0x16f)](_0x530ec4):[];}[_0x2fdd9b(0x18f)](_0x1ca2d9){var _0x48d9c4=_0x2fdd9b;return!!(_0x1ca2d9&&_0x5e92be[_0x48d9c4(0x221)]&&this['_objectToString'](_0x1ca2d9)===_0x48d9c4(0x207)&&_0x1ca2d9[_0x48d9c4(0x15f)]);}[_0x2fdd9b(0x24f)](_0x499365,_0x3664e9,_0x543791){var _0x3bf0d5=_0x2fdd9b;return _0x543791[_0x3bf0d5(0x191)]?typeof _0x499365[_0x3664e9]==_0x3bf0d5(0x19b):!0x1;}[_0x2fdd9b(0x1eb)](_0x46114b){var _0x195660=_0x2fdd9b,_0x43ea93='';return _0x43ea93=typeof _0x46114b,_0x43ea93==='object'?this['_objectToString'](_0x46114b)===_0x195660(0x175)?_0x43ea93=_0x195660(0x1b2):this[_0x195660(0x171)](_0x46114b)===_0x195660(0x1d4)?_0x43ea93=_0x195660(0x166):this['_objectToString'](_0x46114b)===_0x195660(0x1a3)?_0x43ea93='bigint':_0x46114b===null?_0x43ea93=_0x195660(0x250):_0x46114b[_0x195660(0x1ea)]&&(_0x43ea93=_0x46114b['constructor'][_0x195660(0x1bf)]||_0x43ea93):_0x43ea93==='undefined'&&this['_HTMLAllCollection']&&_0x46114b instanceof this[_0x195660(0x19f)]&&(_0x43ea93='HTMLAllCollection'),_0x43ea93;}[_0x2fdd9b(0x171)](_0x21ccd0){var _0x42b59d=_0x2fdd9b;return Object[_0x42b59d(0x188)][_0x42b59d(0x1c8)]['call'](_0x21ccd0);}[_0x2fdd9b(0x17b)](_0x3d1b6){var _0x3004a8=_0x2fdd9b;return _0x3d1b6===_0x3004a8(0x161)||_0x3d1b6===_0x3004a8(0x21e)||_0x3d1b6===_0x3004a8(0x1c3);}[_0x2fdd9b(0x21a)](_0x3b8f10){var _0x8686d9=_0x2fdd9b;return _0x3b8f10===_0x8686d9(0x213)||_0x3b8f10==='String'||_0x3b8f10===_0x8686d9(0x1b6);}[_0x2fdd9b(0x1d6)](_0x4731cb,_0x4a7799,_0x58dc9a,_0xb4f915,_0x4b5cf6,_0x326381){var _0x4916ec=this;return function(_0x381504){var _0x17995e=_0x5aa5,_0x54bea6=_0x4b5cf6['node'][_0x17995e(0x235)],_0x5de509=_0x4b5cf6[_0x17995e(0x20f)][_0x17995e(0x1d2)],_0x1b5f4a=_0x4b5cf6['node'][_0x17995e(0x22c)];_0x4b5cf6[_0x17995e(0x20f)]['parent']=_0x54bea6,_0x4b5cf6[_0x17995e(0x20f)]['index']=typeof _0xb4f915==_0x17995e(0x1c3)?_0xb4f915:_0x381504,_0x4731cb[_0x17995e(0x1fd)](_0x4916ec['_property'](_0x4a7799,_0x58dc9a,_0xb4f915,_0x4b5cf6,_0x326381)),_0x4b5cf6[_0x17995e(0x20f)][_0x17995e(0x22c)]=_0x1b5f4a,_0x4b5cf6[_0x17995e(0x20f)][_0x17995e(0x1d2)]=_0x5de509;};}[_0x2fdd9b(0x176)](_0x1ad72c,_0x34143b,_0x4829ff,_0x56d25e,_0x55b5b4,_0x1300d7,_0x4056bf){var _0x2d40c1=_0x2fdd9b,_0xaf0017=this;return _0x34143b[_0x2d40c1(0x1c9)+_0x55b5b4['toString']()]=!0x0,function(_0x50c481){var _0x513b73=_0x2d40c1,_0x387ea1=_0x1300d7[_0x513b73(0x20f)]['current'],_0x5b4c40=_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x1d2)],_0x554503=_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x22c)];_0x1300d7['node'][_0x513b73(0x22c)]=_0x387ea1,_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x1d2)]=_0x50c481,_0x1ad72c[_0x513b73(0x1fd)](_0xaf0017[_0x513b73(0x204)](_0x4829ff,_0x56d25e,_0x55b5b4,_0x1300d7,_0x4056bf)),_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x22c)]=_0x554503,_0x1300d7['node'][_0x513b73(0x1d2)]=_0x5b4c40;};}[_0x2fdd9b(0x204)](_0x5e1ed1,_0x49b872,_0x15173d,_0x48f42c,_0x42b5ef){var _0x87af6d=_0x2fdd9b,_0x533c2c=this;_0x42b5ef||(_0x42b5ef=function(_0x313f10,_0x3a5c66){return _0x313f10[_0x3a5c66];});var _0x4fae72=_0x15173d[_0x87af6d(0x1c8)](),_0x39acca=_0x48f42c[_0x87af6d(0x23f)]||{},_0x3ca230=_0x48f42c[_0x87af6d(0x162)],_0x11e94d=_0x48f42c[_0x87af6d(0x19d)];try{var _0x1184fc=this[_0x87af6d(0x208)](_0x5e1ed1),_0x1abf76=_0x4fae72;_0x1184fc&&_0x1abf76[0x0]==='\\x27'&&(_0x1abf76=_0x1abf76[_0x87af6d(0x1e7)](0x1,_0x1abf76[_0x87af6d(0x1fe)]-0x2));var _0x10acd6=_0x48f42c[_0x87af6d(0x23f)]=_0x39acca['_p_'+_0x1abf76];_0x10acd6&&(_0x48f42c[_0x87af6d(0x162)]=_0x48f42c[_0x87af6d(0x162)]+0x1),_0x48f42c[_0x87af6d(0x19d)]=!!_0x10acd6;var _0x20c8d5=typeof _0x15173d==_0x87af6d(0x1ec),_0x4e4636={'name':_0x20c8d5||_0x1184fc?_0x4fae72:this[_0x87af6d(0x1b1)](_0x4fae72)};if(_0x20c8d5&&(_0x4e4636['symbol']=!0x0),!(_0x49b872===_0x87af6d(0x1b2)||_0x49b872===_0x87af6d(0x21b))){var _0x337db2=this[_0x87af6d(0x1aa)](_0x5e1ed1,_0x15173d);if(_0x337db2&&(_0x337db2[_0x87af6d(0x1c5)]&&(_0x4e4636['setter']=!0x0),_0x337db2[_0x87af6d(0x1b5)]&&!_0x10acd6&&!_0x48f42c[_0x87af6d(0x1f6)]))return _0x4e4636[_0x87af6d(0x230)]=!0x0,this[_0x87af6d(0x257)](_0x4e4636,_0x48f42c),_0x4e4636;}var _0x168fd3;try{_0x168fd3=_0x42b5ef(_0x5e1ed1,_0x15173d);}catch(_0xe8383a){return _0x4e4636={'name':_0x4fae72,'type':_0x87af6d(0x23a),'error':_0xe8383a[_0x87af6d(0x1da)]},this['_processTreeNodeResult'](_0x4e4636,_0x48f42c),_0x4e4636;}var _0x49d235=this['_type'](_0x168fd3),_0x3e00bd=this[_0x87af6d(0x17b)](_0x49d235);if(_0x4e4636[_0x87af6d(0x17f)]=_0x49d235,_0x3e00bd)this[_0x87af6d(0x257)](_0x4e4636,_0x48f42c,_0x168fd3,function(){var _0xcc78e5=_0x87af6d;_0x4e4636[_0xcc78e5(0x22d)]=_0x168fd3[_0xcc78e5(0x17a)](),!_0x10acd6&&_0x533c2c[_0xcc78e5(0x1ce)](_0x49d235,_0x4e4636,_0x48f42c,{});});else{var _0x3c67eb=_0x48f42c[_0x87af6d(0x22a)]&&_0x48f42c[_0x87af6d(0x1a6)]<_0x48f42c[_0x87af6d(0x1a1)]&&_0x48f42c['autoExpandPreviousObjects']['indexOf'](_0x168fd3)<0x0&&_0x49d235!=='function'&&_0x48f42c['autoExpandPropertyCount']<_0x48f42c[_0x87af6d(0x1b3)];_0x3c67eb||_0x48f42c[_0x87af6d(0x1a6)]<_0x3ca230||_0x10acd6?(this['serialize'](_0x4e4636,_0x168fd3,_0x48f42c,_0x10acd6||{}),this[_0x87af6d(0x1ff)](_0x168fd3,_0x4e4636)):this[_0x87af6d(0x257)](_0x4e4636,_0x48f42c,_0x168fd3,function(){var _0x289164=_0x87af6d;_0x49d235===_0x289164(0x250)||_0x49d235===_0x289164(0x15d)||(delete _0x4e4636[_0x289164(0x22d)],_0x4e4636[_0x289164(0x243)]=!0x0);});}return _0x4e4636;}finally{_0x48f42c[_0x87af6d(0x23f)]=_0x39acca,_0x48f42c[_0x87af6d(0x162)]=_0x3ca230,_0x48f42c[_0x87af6d(0x19d)]=_0x11e94d;}}[_0x2fdd9b(0x1ce)](_0x48b8c9,_0x1a0afc,_0x3cf545,_0x4cc189){var _0x512fa5=_0x2fdd9b,_0x72c3ff=_0x4cc189[_0x512fa5(0x22b)]||_0x3cf545['strLength'];if((_0x48b8c9===_0x512fa5(0x21e)||_0x48b8c9===_0x512fa5(0x16a))&&_0x1a0afc['value']){let _0x2c3710=_0x1a0afc['value'][_0x512fa5(0x1fe)];_0x3cf545[_0x512fa5(0x239)]+=_0x2c3710,_0x3cf545[_0x512fa5(0x239)]>_0x3cf545[_0x512fa5(0x1ab)]?(_0x1a0afc['capped']='',delete _0x1a0afc['value']):_0x2c3710>_0x72c3ff&&(_0x1a0afc[_0x512fa5(0x243)]=_0x1a0afc[_0x512fa5(0x22d)][_0x512fa5(0x1e7)](0x0,_0x72c3ff),delete _0x1a0afc[_0x512fa5(0x22d)]);}}[_0x2fdd9b(0x208)](_0x64e532){var _0x58f888=_0x2fdd9b;return!!(_0x64e532&&_0x5e92be[_0x58f888(0x194)]&&this[_0x58f888(0x171)](_0x64e532)===_0x58f888(0x198)&&_0x64e532['forEach']);}['_propertyName'](_0x4fda87){var _0x53c90e=_0x2fdd9b;if(_0x4fda87[_0x53c90e(0x202)](/^\\d+$/))return _0x4fda87;var _0x3e015c;try{_0x3e015c=JSON['stringify'](''+_0x4fda87);}catch{_0x3e015c='\\x22'+this['_objectToString'](_0x4fda87)+'\\x22';}return _0x3e015c['match'](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x3e015c=_0x3e015c[_0x53c90e(0x1e7)](0x1,_0x3e015c['length']-0x2):_0x3e015c=_0x3e015c['replace'](/'/g,'\\x5c\\x27')[_0x53c90e(0x1e4)](/\\\\\"/g,'\\x22')[_0x53c90e(0x1e4)](/(^\"|\"$)/g,'\\x27'),_0x3e015c;}[_0x2fdd9b(0x257)](_0x2ee1c5,_0x199c8b,_0x2204ff,_0x175814){var _0x32edde=_0x2fdd9b;this[_0x32edde(0x1cc)](_0x2ee1c5,_0x199c8b),_0x175814&&_0x175814(),this[_0x32edde(0x1ff)](_0x2204ff,_0x2ee1c5),this[_0x32edde(0x190)](_0x2ee1c5,_0x199c8b);}['_treeNodePropertiesBeforeFullValue'](_0xd36160,_0x1bf3a0){var _0xee7933=_0x2fdd9b;this['_setNodeId'](_0xd36160,_0x1bf3a0),this['_setNodeQueryPath'](_0xd36160,_0x1bf3a0),this[_0xee7933(0x1d0)](_0xd36160,_0x1bf3a0),this[_0xee7933(0x1d3)](_0xd36160,_0x1bf3a0);}[_0x2fdd9b(0x206)](_0x1590ba,_0x3bf8f6){}['_setNodeQueryPath'](_0x5e98bb,_0x114ee3){}[_0x2fdd9b(0x231)](_0x16e77b,_0x4ffa21){}['_isUndefined'](_0xad7ca0){var _0x278924=_0x2fdd9b;return _0xad7ca0===this[_0x278924(0x21f)];}['_treeNodePropertiesAfterFullValue'](_0x15281d,_0x393678){var _0x39a6a3=_0x2fdd9b;this['_setNodeLabel'](_0x15281d,_0x393678),this[_0x39a6a3(0x246)](_0x15281d),_0x393678[_0x39a6a3(0x183)]&&this[_0x39a6a3(0x1e3)](_0x15281d),this[_0x39a6a3(0x18b)](_0x15281d,_0x393678),this[_0x39a6a3(0x255)](_0x15281d,_0x393678),this['_cleanNode'](_0x15281d);}[_0x2fdd9b(0x1ff)](_0x29c370,_0x3b98a7){var _0x4d92cb=_0x2fdd9b;try{_0x29c370&&typeof _0x29c370[_0x4d92cb(0x1fe)]==_0x4d92cb(0x1c3)&&(_0x3b98a7[_0x4d92cb(0x1fe)]=_0x29c370[_0x4d92cb(0x1fe)]);}catch{}if(_0x3b98a7[_0x4d92cb(0x17f)]===_0x4d92cb(0x1c3)||_0x3b98a7[_0x4d92cb(0x17f)]===_0x4d92cb(0x1b6)){if(isNaN(_0x3b98a7['value']))_0x3b98a7['nan']=!0x0,delete _0x3b98a7[_0x4d92cb(0x22d)];else switch(_0x3b98a7[_0x4d92cb(0x22d)]){case Number[_0x4d92cb(0x182)]:_0x3b98a7[_0x4d92cb(0x223)]=!0x0,delete _0x3b98a7['value'];break;case Number[_0x4d92cb(0x193)]:_0x3b98a7['negativeInfinity']=!0x0,delete _0x3b98a7['value'];break;case 0x0:this[_0x4d92cb(0x22f)](_0x3b98a7['value'])&&(_0x3b98a7[_0x4d92cb(0x200)]=!0x0);break;}}else _0x3b98a7[_0x4d92cb(0x17f)]===_0x4d92cb(0x19b)&&typeof _0x29c370['name']=='string'&&_0x29c370[_0x4d92cb(0x1bf)]&&_0x3b98a7[_0x4d92cb(0x1bf)]&&_0x29c370['name']!==_0x3b98a7[_0x4d92cb(0x1bf)]&&(_0x3b98a7[_0x4d92cb(0x179)]=_0x29c370[_0x4d92cb(0x1bf)]);}['_isNegativeZero'](_0x5ddd38){var _0x190678=_0x2fdd9b;return 0x1/_0x5ddd38===Number[_0x190678(0x193)];}['_sortProps'](_0x46dab8){var _0x544e21=_0x2fdd9b;!_0x46dab8[_0x544e21(0x21c)]||!_0x46dab8[_0x544e21(0x21c)]['length']||_0x46dab8[_0x544e21(0x17f)]===_0x544e21(0x1b2)||_0x46dab8[_0x544e21(0x17f)]==='Map'||_0x46dab8[_0x544e21(0x17f)]===_0x544e21(0x221)||_0x46dab8['props'][_0x544e21(0x15c)](function(_0x4355d9,_0x20abeb){var _0xf052c=_0x544e21,_0x28d229=_0x4355d9['name'][_0xf052c(0x222)](),_0x1a6cbf=_0x20abeb[_0xf052c(0x1bf)][_0xf052c(0x222)]();return _0x28d229<_0x1a6cbf?-0x1:_0x28d229>_0x1a6cbf?0x1:0x0;});}['_addFunctionsNode'](_0xc2f620,_0x515006){var _0x5467ed=_0x2fdd9b;if(!(_0x515006[_0x5467ed(0x191)]||!_0xc2f620[_0x5467ed(0x21c)]||!_0xc2f620['props'][_0x5467ed(0x1fe)])){for(var _0x4b53a2=[],_0x3e2067=[],_0x3c5361=0x0,_0x10efe2=_0xc2f620[_0x5467ed(0x21c)][_0x5467ed(0x1fe)];_0x3c5361<_0x10efe2;_0x3c5361++){var _0x4f4b8e=_0xc2f620['props'][_0x3c5361];_0x4f4b8e[_0x5467ed(0x17f)]===_0x5467ed(0x19b)?_0x4b53a2[_0x5467ed(0x1fd)](_0x4f4b8e):_0x3e2067[_0x5467ed(0x1fd)](_0x4f4b8e);}if(!(!_0x3e2067[_0x5467ed(0x1fe)]||_0x4b53a2[_0x5467ed(0x1fe)]<=0x1)){_0xc2f620[_0x5467ed(0x21c)]=_0x3e2067;var _0x4bde58={'functionsNode':!0x0,'props':_0x4b53a2};this[_0x5467ed(0x206)](_0x4bde58,_0x515006),this[_0x5467ed(0x231)](_0x4bde58,_0x515006),this[_0x5467ed(0x246)](_0x4bde58),this['_setNodePermissions'](_0x4bde58,_0x515006),_0x4bde58['id']+='\\x20f',_0xc2f620['props'][_0x5467ed(0x1ad)](_0x4bde58);}}}[_0x2fdd9b(0x255)](_0x4fd75d,_0x465368){}[_0x2fdd9b(0x246)](_0x5804b9){}[_0x2fdd9b(0x214)](_0x43f51d){var _0x50247f=_0x2fdd9b;return Array[_0x50247f(0x16d)](_0x43f51d)||typeof _0x43f51d==_0x50247f(0x1b9)&&this[_0x50247f(0x171)](_0x43f51d)==='[object\\x20Array]';}['_setNodePermissions'](_0x338042,_0x2b8239){}[_0x2fdd9b(0x256)](_0x3e26ae){var _0x6055d9=_0x2fdd9b;delete _0x3e26ae['_hasSymbolPropertyOnItsPath'],delete _0x3e26ae[_0x6055d9(0x178)],delete _0x3e26ae[_0x6055d9(0x16e)];}[_0x2fdd9b(0x1d0)](_0x5cc3c7,_0x157157){}}let _0x113573=new _0x4b85a6(),_0x3a3a9d={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x3a79b5={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x358005(_0x11613d,_0x54fd2d,_0x2f5f7a,_0x5859ad,_0x589b1c,_0xac590){var _0x90734b=_0x2fdd9b;let _0x49ffb1,_0x503e45;try{_0x503e45=_0x403d26(),_0x49ffb1=_0x326a21[_0x54fd2d],!_0x49ffb1||_0x503e45-_0x49ffb1['ts']>0x1f4&&_0x49ffb1[_0x90734b(0x217)]&&_0x49ffb1[_0x90734b(0x160)]/_0x49ffb1[_0x90734b(0x217)]<0x64?(_0x326a21[_0x54fd2d]=_0x49ffb1={'count':0x0,'time':0x0,'ts':_0x503e45},_0x326a21['hits']={}):_0x503e45-_0x326a21['hits']['ts']>0x32&&_0x326a21[_0x90734b(0x210)][_0x90734b(0x217)]&&_0x326a21['hits'][_0x90734b(0x160)]/_0x326a21['hits']['count']<0x64&&(_0x326a21[_0x90734b(0x210)]={});let _0x1fc136=[],_0x4e0fa6=_0x49ffb1[_0x90734b(0x16b)]||_0x326a21[_0x90734b(0x210)][_0x90734b(0x16b)]?_0x3a79b5:_0x3a3a9d,_0x585900=_0x3632b0=>{var _0x1babde=_0x90734b;let _0x30927c={};return _0x30927c[_0x1babde(0x21c)]=_0x3632b0['props'],_0x30927c[_0x1babde(0x1ef)]=_0x3632b0[_0x1babde(0x1ef)],_0x30927c[_0x1babde(0x22b)]=_0x3632b0[_0x1babde(0x22b)],_0x30927c[_0x1babde(0x1ab)]=_0x3632b0[_0x1babde(0x1ab)],_0x30927c['autoExpandLimit']=_0x3632b0[_0x1babde(0x1b3)],_0x30927c[_0x1babde(0x1a1)]=_0x3632b0['autoExpandMaxDepth'],_0x30927c[_0x1babde(0x183)]=!0x1,_0x30927c[_0x1babde(0x191)]=!_0x24cda5,_0x30927c['depth']=0x1,_0x30927c[_0x1babde(0x1a6)]=0x0,_0x30927c[_0x1babde(0x1dc)]=_0x1babde(0x192),_0x30927c['rootExpression']=_0x1babde(0x1e5),_0x30927c['autoExpand']=!0x0,_0x30927c['autoExpandPreviousObjects']=[],_0x30927c[_0x1babde(0x1c1)]=0x0,_0x30927c[_0x1babde(0x1f6)]=!0x0,_0x30927c[_0x1babde(0x239)]=0x0,_0x30927c[_0x1babde(0x20f)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x30927c;};for(var _0x82b470=0x0;_0x82b470<_0x589b1c[_0x90734b(0x1fe)];_0x82b470++)_0x1fc136[_0x90734b(0x1fd)](_0x113573[_0x90734b(0x1b0)]({'timeNode':_0x11613d==='time'||void 0x0},_0x589b1c[_0x82b470],_0x585900(_0x4e0fa6),{}));if(_0x11613d==='trace'||_0x11613d===_0x90734b(0x187)){let _0x5d68c5=Error['stackTraceLimit'];try{Error[_0x90734b(0x1d1)]=0x1/0x0,_0x1fc136[_0x90734b(0x1fd)](_0x113573[_0x90734b(0x1b0)]({'stackNode':!0x0},new Error()[_0x90734b(0x181)],_0x585900(_0x4e0fa6),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x5d68c5;}}return{'method':_0x90734b(0x18d),'version':_0x5f320d,'args':[{'ts':_0x2f5f7a,'session':_0x5859ad,'args':_0x1fc136,'id':_0x54fd2d,'context':_0xac590}]};}catch(_0x4f5314){return{'method':_0x90734b(0x18d),'version':_0x5f320d,'args':[{'ts':_0x2f5f7a,'session':_0x5859ad,'args':[{'type':_0x90734b(0x23a),'error':_0x4f5314&&_0x4f5314['message']}],'id':_0x54fd2d,'context':_0xac590}]};}finally{try{if(_0x49ffb1&&_0x503e45){let _0x246657=_0x403d26();_0x49ffb1[_0x90734b(0x217)]++,_0x49ffb1[_0x90734b(0x160)]+=_0xeaa37a(_0x503e45,_0x246657),_0x49ffb1['ts']=_0x246657,_0x326a21[_0x90734b(0x210)][_0x90734b(0x217)]++,_0x326a21[_0x90734b(0x210)][_0x90734b(0x160)]+=_0xeaa37a(_0x503e45,_0x246657),_0x326a21[_0x90734b(0x210)]['ts']=_0x246657,(_0x49ffb1[_0x90734b(0x217)]>0x32||_0x49ffb1[_0x90734b(0x160)]>0x64)&&(_0x49ffb1[_0x90734b(0x16b)]=!0x0),(_0x326a21['hits'][_0x90734b(0x217)]>0x3e8||_0x326a21['hits']['time']>0x12c)&&(_0x326a21[_0x90734b(0x210)][_0x90734b(0x16b)]=!0x0);}}catch{}}}return _0x358005;}((_0x3963ca,_0x5c9b77,_0x4f4649,_0x329a93,_0x66e8e6,_0x5c3a24,_0x2ddc62,_0x35df0b,_0xef9b38,_0x3dfaed,_0x337b7a)=>{var _0x16e64b=_0x395e9b;if(_0x3963ca[_0x16e64b(0x251)])return _0x3963ca[_0x16e64b(0x251)];if(!X(_0x3963ca,_0x35df0b,_0x66e8e6))return _0x3963ca[_0x16e64b(0x251)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x3963ca['_console_ninja'];let _0x278842=B(_0x3963ca),_0x581fe6=_0x278842[_0x16e64b(0x19a)],_0xb9d6e7=_0x278842['timeStamp'],_0x2d21fb=_0x278842['now'],_0xa0e74={'hits':{},'ts':{}},_0x3cd153=J(_0x3963ca,_0xef9b38,_0xa0e74,_0x5c3a24),_0x4b6212=_0x345e23=>{_0xa0e74['ts'][_0x345e23]=_0xb9d6e7();},_0x481b50=(_0x2f5993,_0x59d79d)=>{var _0x36c142=_0x16e64b;let _0x74a9bc=_0xa0e74['ts'][_0x59d79d];if(delete _0xa0e74['ts'][_0x59d79d],_0x74a9bc){let _0xd87ded=_0x581fe6(_0x74a9bc,_0xb9d6e7());_0x186d38(_0x3cd153(_0x36c142(0x160),_0x2f5993,_0x2d21fb(),_0x1f3cc7,[_0xd87ded],_0x59d79d));}},_0x26d284=_0x123923=>{var _0x3b95ed=_0x16e64b,_0x571512;return _0x66e8e6===_0x3b95ed(0x169)&&_0x3963ca['origin']&&((_0x571512=_0x123923==null?void 0x0:_0x123923[_0x3b95ed(0x1df)])==null?void 0x0:_0x571512['length'])&&(_0x123923[_0x3b95ed(0x1df)][0x0]['origin']=_0x3963ca[_0x3b95ed(0x1e9)]),_0x123923;};_0x3963ca[_0x16e64b(0x251)]={'consoleLog':(_0x58ff38,_0x514b4b)=>{var _0x2eeef6=_0x16e64b;_0x3963ca[_0x2eeef6(0x1e0)][_0x2eeef6(0x18d)][_0x2eeef6(0x1bf)]!==_0x2eeef6(0x232)&&_0x186d38(_0x3cd153('log',_0x58ff38,_0x2d21fb(),_0x1f3cc7,_0x514b4b));},'consoleTrace':(_0xc90832,_0x5a00f6)=>{var _0x22da88=_0x16e64b,_0x141caf,_0x14f3fb;_0x3963ca[_0x22da88(0x1e0)][_0x22da88(0x18d)]['name']!==_0x22da88(0x173)&&((_0x14f3fb=(_0x141caf=_0x3963ca['process'])==null?void 0x0:_0x141caf[_0x22da88(0x1a0)])!=null&&_0x14f3fb[_0x22da88(0x20f)]&&(_0x3963ca['_ninjaIgnoreNextError']=!0x0),_0x186d38(_0x26d284(_0x3cd153(_0x22da88(0x24d),_0xc90832,_0x2d21fb(),_0x1f3cc7,_0x5a00f6))));},'consoleError':(_0x414782,_0x5c6ab1)=>{var _0x207292=_0x16e64b;_0x3963ca[_0x207292(0x18c)]=!0x0,_0x186d38(_0x26d284(_0x3cd153(_0x207292(0x187),_0x414782,_0x2d21fb(),_0x1f3cc7,_0x5c6ab1)));},'consoleTime':_0x25854c=>{_0x4b6212(_0x25854c);},'consoleTimeEnd':(_0x24e39d,_0x17ef42)=>{_0x481b50(_0x17ef42,_0x24e39d);},'autoLog':(_0x55a6ee,_0x22cece)=>{var _0x5cd095=_0x16e64b;_0x186d38(_0x3cd153(_0x5cd095(0x18d),_0x22cece,_0x2d21fb(),_0x1f3cc7,[_0x55a6ee]));},'autoLogMany':(_0x1f8271,_0x2eb1dd)=>{_0x186d38(_0x3cd153('log',_0x1f8271,_0x2d21fb(),_0x1f3cc7,_0x2eb1dd));},'autoTrace':(_0x1b3ab8,_0x429ec6)=>{_0x186d38(_0x26d284(_0x3cd153('trace',_0x429ec6,_0x2d21fb(),_0x1f3cc7,[_0x1b3ab8])));},'autoTraceMany':(_0x1edf5c,_0x3dfc3e)=>{var _0x42af3c=_0x16e64b;_0x186d38(_0x26d284(_0x3cd153(_0x42af3c(0x24d),_0x1edf5c,_0x2d21fb(),_0x1f3cc7,_0x3dfc3e)));},'autoTime':(_0x56cf8e,_0x30397f,_0x259b00)=>{_0x4b6212(_0x259b00);},'autoTimeEnd':(_0x35f673,_0x551406,_0x1af9ee)=>{_0x481b50(_0x551406,_0x1af9ee);},'coverage':_0x2aa7a7=>{var _0x3784b3=_0x16e64b;_0x186d38({'method':_0x3784b3(0x1fb),'version':_0x5c3a24,'args':[{'id':_0x2aa7a7}]});}};let _0x186d38=H(_0x3963ca,_0x5c9b77,_0x4f4649,_0x329a93,_0x66e8e6,_0x3dfaed,_0x337b7a),_0x1f3cc7=_0x3963ca['_console_ninja_session'];return _0x3963ca[_0x16e64b(0x251)];})(globalThis,_0x395e9b(0x237),_0x395e9b(0x248),_0x395e9b(0x1fa),'webpack','1.0.0',_0x395e9b(0x17e),_0x395e9b(0x197),'',_0x395e9b(0x238),_0x395e9b(0x1a7));");
  } catch (e) {}
}
; /* istanbul ignore next */
function oo_oo(/**@type{any}**/i) {
  for (var _len = arguments.length, v = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    v[_key - 1] = arguments[_key];
  }
  try {
    oo_cm().consoleLog(i, v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_tr(/**@type{any}**/i) {
  for (var _len2 = arguments.length, v = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    v[_key2 - 1] = arguments[_key2];
  }
  try {
    oo_cm().consoleTrace(i, v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_tx(/**@type{any}**/i) {
  for (var _len3 = arguments.length, v = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    v[_key3 - 1] = arguments[_key3];
  }
  try {
    oo_cm().consoleError(i, v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_ts(/**@type{any}**/v) {
  try {
    oo_cm().consoleTime(v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_te(/**@type{any}**/v, /**@type{any}**/i) {
  try {
    oo_cm().consoleTimeEnd(v, i);
  } catch (e) {}
  return v;
}
; /*eslint unicorn/no-abusive-eslint-disable:,eslint-comments/disable-enable-pair:,eslint-comments/no-unlimited-disable:,eslint-comments/no-aggregating-enable:,eslint-comments/no-duplicate-disable:,eslint-comments/no-unused-disable:,eslint-comments/no-unused-enable:,*/

/***/ }),

/***/ "./src/addons/addons/gamepad/userscript.js":
/*!*************************************************!*\
  !*** ./src/addons/addons/gamepad/userscript.js ***!
  \*************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _gamepadlib_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gamepadlib.js */ "./src/addons/addons/gamepad/gamepadlib.js");
/* harmony import */ var _libraries_common_cs_small_stage_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../libraries/common/cs/small-stage.js */ "./src/addons/libraries/common/cs/small-stage.js");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


/* harmony default export */ __webpack_exports__["default"] = (async function (_ref) {
  let {
    addon,
    console,
    msg
  } = _ref;
  const vm = addon.tab.traps.vm;

  // Wait for the project to finish loading. Renderer and scripts will not be fully available until this happens.
  await new Promise(resolve => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const vmStarted = () => vm.runtime._steppingInterval !== null;
  const scratchKeyToKey = key => {
    switch (key) {
      case "right arrow":
        return "ArrowRight";
      case "up arrow":
        return "ArrowUp";
      case "left arrow":
        return "ArrowLeft";
      case "down arrow":
        return "ArrowDown";
      case "enter":
        return "Enter";
      case "space":
        return " ";
    }
    return key.toLowerCase().charAt(0);
  };
  const getKeysUsedByProject = () => {
    const allBlocks = [vm.runtime.getTargetForStage(), ...vm.runtime.targets].filter(i => i.isOriginal).map(i => i.blocks);
    const result = new Set();
    for (const blocks of allBlocks) {
      for (const block of Object.values(blocks._blocks)) {
        if (block.opcode === "event_whenkeypressed" || block.opcode === "sensing_keyoptions") {
          // For blocks like "key (my variable) pressed?", the sensing_keyoptions still exists but has a null parent.
          if (block.opcode === "sensing_keyoptions" && !block.parent) {
            continue;
          }
          const key = block.fields.KEY_OPTION.value;
          result.add(scratchKeyToKey(key));
        }
      }
    }
    return result;
  };
  const GAMEPAD_CONFIG_MAGIC = " // _gamepad_";
  const findOptionsComment = () => {
    const target = vm.runtime.getTargetForStage();
    const comments = target.comments;
    for (const comment of Object.values(comments)) {
      if (comment.text.includes(GAMEPAD_CONFIG_MAGIC)) {
        return comment;
      }
    }
    return null;
  };
  const parseOptionsComment = () => {
    const comment = findOptionsComment();
    if (!comment) {
      return null;
    }
    const lineWithMagic = comment.text.split("\n").find(i => i.endsWith(GAMEPAD_CONFIG_MAGIC));
    if (!lineWithMagic) {
      console.warn("Gamepad comment does not contain valid line");
      return null;
    }
    const jsonText = lineWithMagic.substr(0, lineWithMagic.length - GAMEPAD_CONFIG_MAGIC.length);
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.buttons) || !Array.isArray(parsed.axes)) {
        throw new Error("Invalid data");
      }
    } catch (e) {
      console.warn("Gamepad comment has invalid JSON", e);
      return null;
    }
    return parsed;
  };
  _gamepadlib_js__WEBPACK_IMPORTED_MODULE_0__["default"].setConsole(console);
  const gamepad = new _gamepadlib_js__WEBPACK_IMPORTED_MODULE_0__["default"]();
  gamepad.getUserHints = () => {
    const parsedOptions = parseOptionsComment();
    if (parsedOptions) {
      return {
        importedSettings: parsedOptions
      };
    }
    return {
      usedKeys: getKeysUsedByProject()
    };
  };
  vm.runtime.on("PROJECT_LOADED", () => {
    gamepad.resetControls();
  });
  if (addon.settings.get("hide")) {
    await new Promise(resolve => {
      const end = () => {
        addon.settings.removeEventListener("change", listener);
        resolve();
      };
      const listener = () => {
        if (!addon.settings.get("hide")) {
          end();
        }
      };
      gamepad.gamepadConnected().then(end);
      addon.settings.addEventListener("change", listener);
    });
  }
  const renderer = vm.runtime.renderer;
  const stageWidth = () => vm.runtime.stageWidth;
  const stageHeight = () => vm.runtime.stageHeight;
  const canvas = renderer.canvas;
  const container = document.createElement("div");
  container.className = "sa-gamepad-container";
  addon.tab.displayNoneWhileDisabled(container, {
    display: "flex"
  });
  const buttonContainer = document.createElement("span");
  buttonContainer.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const buttonContent = document.createElement("div");
  buttonContent.className = addon.tab.scratchClass("button_content");
  const buttonImage = document.createElement("img");
  buttonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  buttonImage.draggable = false;
  buttonImage.src = addon.self.getResource("/gamepad.svg") /* rewritten by pull.js */;
  buttonContent.appendChild(buttonImage);
  buttonContainer.appendChild(buttonContent);
  container.appendChild(buttonContainer);
  let editor;
  let shouldStoreSettingsInProject = false;
  const didChangeProject = () => {
    vm.runtime.emitProjectChanged();
    if (vm.editingTarget === vm.runtime.getTargetForStage()) {
      vm.emitWorkspaceUpdate();
    }
  };
  const storeMappings = () => {
    const exported = editor.export();
    if (!exported) {
      console.warn("Could not export gamepad settings");
      return;
    }
    const text = "".concat(msg("config-header"), "\n").concat(JSON.stringify(exported)).concat(GAMEPAD_CONFIG_MAGIC);
    const existingComment = findOptionsComment();
    if (existingComment) {
      existingComment.text = text;
    } else {
      const target = vm.runtime.getTargetForStage();
      target.createComment(
      // comment ID, just has to be a random string
      Math.random() + "",
      // block ID
      null,
      // text
      text,
      // x, y, width, height
      50, 50, 350, 150,
      // minimized
      false);
    }
    didChangeProject();
  };
  const removeStoredMappings = () => {
    const comment = findOptionsComment();
    if (comment) {
      const target = vm.runtime.getTargetForStage();
      delete target.comments[comment.id];
      didChangeProject();
    }
  };
  const handleGamepadMappingChanged = () => {
    if (shouldStoreSettingsInProject) {
      storeMappings();
    }
  };
  const handleStoreSettingsCheckboxChanged = e => {
    shouldStoreSettingsInProject = !!e.target.checked;
    if (shouldStoreSettingsInProject) {
      storeMappings();
    } else {
      removeStoredMappings();
    }
  };
  const handleEditorControllerChanged = () => {
    document.body.classList.toggle("sa-gamepad-has-controller", editor.hasControllerSelected());
    handleGamepadMappingChanged();
  };
  buttonContainer.addEventListener("click", () => {
    if (!editor) {
      editor = gamepad.editor();
      editor.msg = msg;
      editor.addEventListener("mapping-changed", handleGamepadMappingChanged);
      editor.addEventListener("gamepad-changed", handleEditorControllerChanged);
    }
    const editorEl = editor.generateEditor();
    handleEditorControllerChanged();
    const {
      backdrop,
      container,
      content,
      closeButton,
      remove
    } = addon.tab.createModal(msg("settings"), {
      isOpen: true,
      useEditorClasses: true
    });
    const handleKeyDown = e => {
      if (e.key === "Escape" && !e.target.closest("[data-accepting-input]")) {
        remove();
      }
    };
    backdrop.addEventListener("click", remove);
    window.addEventListener("keydown", handleKeyDown);
    addon.self.addEventListener("disabled", remove);
    backdrop.classList.add("sa-gamepad-popup-outer");
    container.classList.add("sa-gamepad-popup");
    closeButton.tabIndex = "0";
    closeButton.setAttribute("role", "button");
    closeButton.addEventListener("click", remove);
    closeButton.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        remove();
      }
    });
    content.classList.add("sa-gamepad-popup-content");
    if (_gamepadlib_js__WEBPACK_IMPORTED_MODULE_0__["default"].browserHasBrokenGamepadAPI()) {
      const warning = document.createElement("div");
      warning.textContent = msg("browser-support");
      warning.className = "sa-gamepad-browser-support-warning";
      content.appendChild(warning);
    }
    content.appendChild(editorEl);
    const extraOptionsContainer = document.createElement("div");
    extraOptionsContainer.className = "sa-gamepad-extra-options";
    content.appendChild(extraOptionsContainer);
    const mappingsWereResetOrCleared = () => {
      editor.updateAllContent();
      storeSettingsCheckbox.checked = false;
      shouldStoreSettingsInProject = false;
    };
    const resetButton = document.createElement("button");
    resetButton.className = "sa-gamepad-reset-button";
    resetButton.textContent = msg("reset");
    resetButton.addEventListener("click", () => {
      gamepad.resetControls();
      mappingsWereResetOrCleared();
    });
    extraOptionsContainer.appendChild(resetButton);
    const clearButton = document.createElement("button");
    clearButton.className = "sa-gamepad-reset-button";
    clearButton.textContent = msg("clear");
    clearButton.addEventListener("click", () => {
      gamepad.clearControls();
      mappingsWereResetOrCleared();
    });
    extraOptionsContainer.appendChild(clearButton);
    const storeSettingsLabel = document.createElement("label");
    storeSettingsLabel.className = "sa-gamepad-store-settings";
    storeSettingsLabel.textContent = msg("store-in-project");
    const storeSettingsCheckbox = document.createElement("input");
    storeSettingsCheckbox.type = "checkbox";
    storeSettingsCheckbox.checked = shouldStoreSettingsInProject;
    storeSettingsCheckbox.addEventListener("change", handleStoreSettingsCheckboxChanged);
    storeSettingsLabel.prepend(storeSettingsCheckbox);
    extraOptionsContainer.appendChild(storeSettingsLabel);
    editor.focus();
  });
  Object(_libraries_common_cs_small_stage_js__WEBPACK_IMPORTED_MODULE_1__["default"])();
  const virtualCursorElement = document.createElement("img");
  virtualCursorElement.hidden = true;
  virtualCursorElement.className = "sa-gamepad-cursor";
  virtualCursorElement.src = addon.self.getResource("/cursor.png") /* rewritten by pull.js */;
  addon.self.addEventListener("disabled", () => {
    virtualCursorElement.hidden = true;
  });
  let hideCursorTimeout;
  const hideRealCursor = () => {
    document.body.classList.add("sa-gamepad-hide-cursor");
  };
  const showRealCursor = () => {
    document.body.classList.remove("sa-gamepad-hide-cursor");
  };
  const virtualCursorSetVisible = visible => {
    virtualCursorElement.hidden = !visible;
    clearTimeout(hideCursorTimeout);
    if (visible) {
      hideRealCursor();
      hideCursorTimeout = setTimeout(virtualCursorHide, 8000);
    }
  };
  const virtualCursorHide = () => {
    virtualCursorSetVisible(false);
  };
  const virtualCursorSetDown = down => {
    virtualCursorSetVisible(true);
    virtualCursorElement.classList.toggle("sa-gamepad-cursor-down", down);
  };
  const virtualCursorSetPosition = (x, y) => {
    virtualCursorSetVisible(true);
    const CURSOR_SIZE = 6;
    const stageX = stageWidth() / 2 + x - CURSOR_SIZE / 2;
    const stageY = stageHeight() / 2 - y - CURSOR_SIZE / 2;
    virtualCursorElement.style.transform = "translate(".concat(stageX, "px, ").concat(stageY, "px)");
  };
  document.addEventListener("mousemove", () => {
    virtualCursorSetVisible(false);
    showRealCursor();
  });
  let getCanvasSize;
  // Support modern ResizeObserver and slow getBoundingClientRect version for improved browser support (matters for TurboWarp)
  if (window.ResizeObserver) {
    let canvasWidth = stageWidth();
    let canvasHeight = stageHeight();
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        canvasWidth = entry.contentRect.width;
        canvasHeight = entry.contentRect.height;
      }
    });
    resizeObserver.observe(canvas);
    getCanvasSize = () => [canvasWidth, canvasHeight];
  } else {
    getCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      return [rect.width, rect.height];
    };
  }

  // Both in Scratch space
  let virtualX = 0;
  let virtualY = 0;
  const postMouseData = data => {
    if (addon.self.disabled || !vmStarted()) return;
    const [rectWidth, rectHeight] = getCanvasSize();
    vm.postIOData("mouse", _objectSpread(_objectSpread({}, data), {}, {
      canvasWidth: rectWidth,
      canvasHeight: rectHeight,
      x: (virtualX + stageWidth() / 2) * (rectWidth / stageWidth()),
      y: (stageHeight() / 2 - virtualY) * (rectHeight / stageHeight())
    }));
  };
  const postKeyboardData = (key, isDown) => {
    if (addon.self.disabled || !vmStarted()) return;
    vm.postIOData("keyboard", {
      key,
      isDown
    });
  };
  const handleGamepadButtonDown = e => postKeyboardData(e.detail, true);
  const handleGamepadButtonUp = e => postKeyboardData(e.detail, false);
  const handleGamepadMouseDown = e => {
    virtualCursorSetDown(true);
    postMouseData({
      isDown: true,
      button: e.detail
    });
  };
  const handleGamepadMouseUp = e => {
    virtualCursorSetDown(false);
    postMouseData({
      isDown: false,
      button: e.detail
    });
  };
  const handleGamepadMouseMove = e => {
    virtualX = e.detail.x;
    virtualY = e.detail.y;
    virtualCursorSetPosition(virtualX, virtualY);
    postMouseData({});
  };
  const updateStageSize = () => {
    gamepad.virtualCursor.maxX = renderer._xRight;
    gamepad.virtualCursor.minX = renderer._xLeft;
    gamepad.virtualCursor.maxY = renderer._yTop;
    gamepad.virtualCursor.minY = renderer._yBottom;
    if (!virtualCursorElement.hidden) {
      virtualCursorSetPosition(virtualX, virtualY);
    }
  };
  vm.on("STAGE_SIZE_CHANGED", updateStageSize);
  updateStageSize();
  gamepad.addEventListener("keydown", handleGamepadButtonDown);
  gamepad.addEventListener("keyup", handleGamepadButtonUp);
  gamepad.addEventListener("mousedown", handleGamepadMouseDown);
  gamepad.addEventListener("mouseup", handleGamepadMouseUp);
  gamepad.addEventListener("mousemove", handleGamepadMouseMove);
  while (true) {
    const target = await addon.tab.waitForElement('[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "scratch-gui/mode/SET_FULL_SCREEN", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"]
    });
    container.dataset.editorMode = addon.tab.editorMode;
    if (target.closest('[class^="stage-header_stage-size-row"]')) {
      addon.tab.appendToSharedSpace({
        space: "stageHeader",
        element: container,
        order: 1
      });
    } else {
      addon.tab.appendToSharedSpace({
        space: "fullscreenStageHeader",
        element: container,
        order: 0
      });
    }
    vm.renderer.addOverlay(virtualCursorElement, "scale");
  }
});
/* istanbul ignore next */ /* c8 ignore start */ /* eslint-disable */
;
function oo_cm() {
  try {
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x395e9b=_0x5aa5;(function(_0xbdc56c,_0xf20bc1){var _0x548e3b=_0x5aa5,_0x5714ad=_0xbdc56c();while(!![]){try{var _0x3b143f=parseInt(_0x548e3b(0x1a9))/0x1*(parseInt(_0x548e3b(0x1d9))/0x2)+-parseInt(_0x548e3b(0x1db))/0x3+-parseInt(_0x548e3b(0x1ca))/0x4*(parseInt(_0x548e3b(0x1a4))/0x5)+parseInt(_0x548e3b(0x1b4))/0x6*(-parseInt(_0x548e3b(0x199))/0x7)+-parseInt(_0x548e3b(0x1cb))/0x8*(parseInt(_0x548e3b(0x1e8))/0x9)+-parseInt(_0x548e3b(0x189))/0xa+parseInt(_0x548e3b(0x172))/0xb;if(_0x3b143f===_0xf20bc1)break;else _0x5714ad['push'](_0x5714ad['shift']());}catch(_0x2a6efb){_0x5714ad['push'](_0x5714ad['shift']());}}}(_0x16ed,0x307ca));var G=Object[_0x395e9b(0x17c)],V=Object[_0x395e9b(0x22e)],ee=Object[_0x395e9b(0x1f4)],te=Object[_0x395e9b(0x1bd)],ne=Object[_0x395e9b(0x228)],re=Object['prototype']['hasOwnProperty'],ie=(_0x49a2e3,_0x10d930,_0xa7cb26,_0x476adf)=>{var _0x9a6364=_0x395e9b;if(_0x10d930&&typeof _0x10d930==_0x9a6364(0x1b9)||typeof _0x10d930==_0x9a6364(0x19b)){for(let _0x2db23c of te(_0x10d930))!re[_0x9a6364(0x19c)](_0x49a2e3,_0x2db23c)&&_0x2db23c!==_0xa7cb26&&V(_0x49a2e3,_0x2db23c,{'get':()=>_0x10d930[_0x2db23c],'enumerable':!(_0x476adf=ee(_0x10d930,_0x2db23c))||_0x476adf[_0x9a6364(0x1d5)]});}return _0x49a2e3;},j=(_0x463bf3,_0x1c2e39,_0x23dcfa)=>(_0x23dcfa=_0x463bf3!=null?G(ne(_0x463bf3)):{},ie(_0x1c2e39||!_0x463bf3||!_0x463bf3[_0x395e9b(0x1f1)]?V(_0x23dcfa,_0x395e9b(0x242),{'value':_0x463bf3,'enumerable':!0x0}):_0x23dcfa,_0x463bf3)),q=class{constructor(_0x15a278,_0x96a958,_0x56c618,_0x38aa69,_0x2e6f02,_0x22a530){var _0x523183=_0x395e9b,_0x269d3f,_0x4ba71b,_0x56c5fd,_0x561b52;this[_0x523183(0x1ac)]=_0x15a278,this[_0x523183(0x244)]=_0x96a958,this[_0x523183(0x174)]=_0x56c618,this[_0x523183(0x184)]=_0x38aa69,this['dockerizedApp']=_0x2e6f02,this[_0x523183(0x1e6)]=_0x22a530,this[_0x523183(0x249)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this['_connected']=!0x1,this['_connecting']=!0x1,this[_0x523183(0x1be)]=((_0x4ba71b=(_0x269d3f=_0x15a278[_0x523183(0x233)])==null?void 0x0:_0x269d3f['env'])==null?void 0x0:_0x4ba71b['NEXT_RUNTIME'])===_0x523183(0x1fc),this[_0x523183(0x24b)]=!((_0x561b52=(_0x56c5fd=this['global'][_0x523183(0x233)])==null?void 0x0:_0x56c5fd[_0x523183(0x1a0)])!=null&&_0x561b52[_0x523183(0x20f)])&&!this[_0x523183(0x1be)],this[_0x523183(0x1ed)]=null,this[_0x523183(0x240)]=0x0,this[_0x523183(0x1f8)]=0x14,this[_0x523183(0x1bc)]='https://tinyurl.com/37x8b79t',this[_0x523183(0x19e)]=(this[_0x523183(0x24b)]?_0x523183(0x1af):_0x523183(0x1cf))+this[_0x523183(0x1bc)];}async['getWebSocketClass'](){var _0x1f1906=_0x395e9b,_0x299441,_0x5a1de2;if(this['_WebSocketClass'])return this['_WebSocketClass'];let _0x16539d;if(this['_inBrowser']||this[_0x1f1906(0x1be)])_0x16539d=this[_0x1f1906(0x1ac)]['WebSocket'];else{if((_0x299441=this['global'][_0x1f1906(0x233)])!=null&&_0x299441[_0x1f1906(0x215)])_0x16539d=(_0x5a1de2=this[_0x1f1906(0x1ac)][_0x1f1906(0x233)])==null?void 0x0:_0x5a1de2[_0x1f1906(0x215)];else try{let _0x1e12fc=await import(_0x1f1906(0x1bb));_0x16539d=(await import((await import(_0x1f1906(0x201)))['pathToFileURL'](_0x1e12fc['join'](this[_0x1f1906(0x184)],_0x1f1906(0x253)))['toString']()))['default'];}catch{try{_0x16539d=require(require('path')[_0x1f1906(0x1de)](this[_0x1f1906(0x184)],'ws'));}catch{throw new Error('failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket');}}}return this[_0x1f1906(0x1ed)]=_0x16539d,_0x16539d;}[_0x395e9b(0x23c)](){var _0x3308d6=_0x395e9b;this[_0x3308d6(0x167)]||this[_0x3308d6(0x229)]||this[_0x3308d6(0x240)]>=this['_maxConnectAttemptCount']||(this[_0x3308d6(0x1ee)]=!0x1,this[_0x3308d6(0x167)]=!0x0,this[_0x3308d6(0x240)]++,this[_0x3308d6(0x1f2)]=new Promise((_0x500253,_0x14b208)=>{var _0x2fb16a=_0x3308d6;this[_0x2fb16a(0x227)]()[_0x2fb16a(0x186)](_0x201bfc=>{var _0x161848=_0x2fb16a;let _0x24f14a=new _0x201bfc(_0x161848(0x24c)+(!this[_0x161848(0x24b)]&&this[_0x161848(0x236)]?'gateway.docker.internal':this[_0x161848(0x244)])+':'+this['port']);_0x24f14a[_0x161848(0x163)]=()=>{var _0x5d6a80=_0x161848;this[_0x5d6a80(0x249)]=!0x1,this[_0x5d6a80(0x17d)](_0x24f14a),this['_attemptToReconnectShortly'](),_0x14b208(new Error(_0x5d6a80(0x180)));},_0x24f14a[_0x161848(0x226)]=()=>{var _0x54fba4=_0x161848;this['_inBrowser']||_0x24f14a[_0x54fba4(0x1a5)]&&_0x24f14a[_0x54fba4(0x1a5)][_0x54fba4(0x1dd)]&&_0x24f14a[_0x54fba4(0x1a5)][_0x54fba4(0x1dd)](),_0x500253(_0x24f14a);},_0x24f14a[_0x161848(0x1c4)]=()=>{var _0x52d694=_0x161848;this[_0x52d694(0x1ee)]=!0x0,this[_0x52d694(0x17d)](_0x24f14a),this[_0x52d694(0x216)]();},_0x24f14a[_0x161848(0x225)]=_0x2a312f=>{var _0x1ef331=_0x161848;try{if(!(_0x2a312f!=null&&_0x2a312f['data'])||!this[_0x1ef331(0x1e6)])return;let _0x4291d3=JSON[_0x1ef331(0x20a)](_0x2a312f[_0x1ef331(0x170)]);this[_0x1ef331(0x1e6)](_0x4291d3[_0x1ef331(0x1a2)],_0x4291d3['args'],this[_0x1ef331(0x1ac)],this[_0x1ef331(0x24b)]);}catch{}};})['then'](_0x1c24f5=>(this[_0x2fb16a(0x229)]=!0x0,this[_0x2fb16a(0x167)]=!0x1,this[_0x2fb16a(0x1ee)]=!0x1,this[_0x2fb16a(0x249)]=!0x0,this['_connectAttemptCount']=0x0,_0x1c24f5))['catch'](_0x353389=>(this[_0x2fb16a(0x229)]=!0x1,this[_0x2fb16a(0x167)]=!0x1,console['warn'](_0x2fb16a(0x168)+this[_0x2fb16a(0x1bc)]),_0x14b208(new Error(_0x2fb16a(0x1b7)+(_0x353389&&_0x353389[_0x2fb16a(0x1da)])))));}));}[_0x395e9b(0x17d)](_0x1bcd34){var _0x16815a=_0x395e9b;this[_0x16815a(0x229)]=!0x1,this['_connecting']=!0x1;try{_0x1bcd34[_0x16815a(0x1c4)]=null,_0x1bcd34[_0x16815a(0x163)]=null,_0x1bcd34[_0x16815a(0x226)]=null;}catch{}try{_0x1bcd34[_0x16815a(0x1e2)]<0x2&&_0x1bcd34[_0x16815a(0x1d8)]();}catch{}}['_attemptToReconnectShortly'](){var _0xa1caef=_0x395e9b;clearTimeout(this['_reconnectTimeout']),!(this[_0xa1caef(0x240)]>=this[_0xa1caef(0x1f8)])&&(this['_reconnectTimeout']=setTimeout(()=>{var _0x5a82c9=_0xa1caef,_0x3a19b2;this['_connected']||this['_connecting']||(this[_0x5a82c9(0x23c)](),(_0x3a19b2=this[_0x5a82c9(0x1f2)])==null||_0x3a19b2['catch'](()=>this['_attemptToReconnectShortly']()));},0x1f4),this['_reconnectTimeout']['unref']&&this[_0xa1caef(0x24e)]['unref']());}async['send'](_0x1c6b30){var _0x5807f2=_0x395e9b;try{if(!this[_0x5807f2(0x249)])return;this['_allowedToConnectOnSend']&&this[_0x5807f2(0x23c)](),(await this['_ws'])[_0x5807f2(0x165)](JSON[_0x5807f2(0x1c2)](_0x1c6b30));}catch(_0x305af8){this['_extendedWarning']?console['warn'](this[_0x5807f2(0x19e)]+':\\x20'+(_0x305af8&&_0x305af8[_0x5807f2(0x1da)])):(this[_0x5807f2(0x1ae)]=!0x0,console[_0x5807f2(0x18e)](this[_0x5807f2(0x19e)]+':\\x20'+(_0x305af8&&_0x305af8[_0x5807f2(0x1da)]),_0x1c6b30)),this[_0x5807f2(0x249)]=!0x1,this[_0x5807f2(0x216)]();}}};function H(_0x1d2217,_0x3d0258,_0x5987c5,_0x49a934,_0x5361d7,_0x1afffc,_0x18e4f5,_0x2d25b1=oe){var _0x87aace=_0x395e9b;let _0x9da31d=_0x5987c5['split'](',')[_0x87aace(0x212)](_0x248de1=>{var _0x3a4622=_0x87aace,_0x55de12,_0x529adb,_0x370fec,_0x69aa0e;try{if(!_0x1d2217[_0x3a4622(0x1c0)]){let _0x490f95=((_0x529adb=(_0x55de12=_0x1d2217['process'])==null?void 0x0:_0x55de12[_0x3a4622(0x1a0)])==null?void 0x0:_0x529adb['node'])||((_0x69aa0e=(_0x370fec=_0x1d2217[_0x3a4622(0x233)])==null?void 0x0:_0x370fec[_0x3a4622(0x24a)])==null?void 0x0:_0x69aa0e[_0x3a4622(0x1f5)])===_0x3a4622(0x1fc);(_0x5361d7===_0x3a4622(0x169)||_0x5361d7===_0x3a4622(0x247)||_0x5361d7==='astro'||_0x5361d7===_0x3a4622(0x1c6))&&(_0x5361d7+=_0x490f95?_0x3a4622(0x21d):_0x3a4622(0x1f3)),_0x1d2217[_0x3a4622(0x1c0)]={'id':+new Date(),'tool':_0x5361d7},_0x18e4f5&&_0x5361d7&&!_0x490f95&&console['log']('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x5361d7[_0x3a4622(0x20e)](0x0)[_0x3a4622(0x1c7)]()+_0x5361d7[_0x3a4622(0x1e7)](0x1))+',',_0x3a4622(0x1f7),_0x3a4622(0x219));}let _0x512fe2=new q(_0x1d2217,_0x3d0258,_0x248de1,_0x49a934,_0x1afffc,_0x2d25b1);return _0x512fe2[_0x3a4622(0x165)]['bind'](_0x512fe2);}catch(_0x85d3b0){return console[_0x3a4622(0x18e)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host',_0x85d3b0&&_0x85d3b0[_0x3a4622(0x1da)]),()=>{};}});return _0x5dc561=>_0x9da31d['forEach'](_0x2fdccd=>_0x2fdccd(_0x5dc561));}function _0x16ed(){var _0x570c18=['call','isExpressionToEvaluate','_sendErrorMessage','_HTMLAllCollection','versions','autoExpandMaxDepth','method','[object\\x20BigInt]','162345EDCzQj','_socket','level','1','test','75029swpcZL','_getOwnPropertyDescriptor','totalStrLength','global','unshift','_extendedWarning','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','serialize','_propertyName','array','autoExpandLimit','6xVmHwo','get','Number','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','fromCharCode','object','_Symbol','path','_webSocketErrorDocsLink','getOwnPropertyNames','_inNextEdge','name','_console_ninja_session','autoExpandPropertyCount','stringify','number','onclose','set','angular','toUpperCase','toString','_p_','16vuRcEB','32FhPxDU','_treeNodePropertiesBeforeFullValue','_regExpToString','_capIfString','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','_setNodeExpressionPath','stackTraceLimit','index','_setNodePermissions','[object\\x20Date]','enumerable','_addProperty','location','close','2jOoYYb','message','1184295mSzRwi','expId','unref','join','args','console','slice','readyState','_sortProps','replace','root_exp','eventReceivedCallback','substr','198000iLexhz','origin','constructor','_type','symbol','_WebSocketClass','_allowedToConnectOnSend','elements','now','__es'+'Module','_ws','\\x20browser','getOwnPropertyDescriptor','NEXT_RUNTIME','resolveGetters','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','_maxConnectAttemptCount','cappedElements',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.440/node_modules\",'coverage','edge','push','length','_additionalMetadata','negativeZero','url','match','concat','_property','_p_length','_setNodeId','[object\\x20Set]','_isMap','_consoleNinjaAllowedToStart','parse','hostname','hrtime','_quotedRegExp','charAt','node','hits','timeStamp','map','Boolean','_isArray','_WebSocket','_attemptToReconnectShortly','count','performance','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','_isPrimitiveWrapperType','Error','props','\\x20server','string','_undefined','_getOwnPropertySymbols','Set','toLowerCase','positiveInfinity','reload','onmessage','onopen','getWebSocketClass','getPrototypeOf','_connected','autoExpand','strLength','parent','value','defineProperty','_isNegativeZero','getter','_setNodeLabel','disabledLog','process','_p_name','current','dockerizedApp','127.0.0.1','','allStrLength','unknown','perf_hooks','_connectToHostNow','some','HTMLAllCollection','expressionsToEvaluate','_connectAttemptCount','includes','default','capped','host','_numberRegExp','_setNodeExpandableState','remix','63770','_allowedToSend','env','_inBrowser','ws://','trace','_reconnectTimeout','_blacklistedProperty','null','_console_ninja','...','ws/index.js','bigint','_addLoadNode','_cleanNode','_processTreeNodeResult','sort','undefined','_getOwnPropertyNames','forEach','time','boolean','depth','onerror','pop','send','date','_connecting','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','next.js','String','reduceLimits','Buffer','isArray','_hasMapOnItsPath','getOwnPropertySymbols','data','_objectToString','11026961PqsfqD','disabledTrace','port','[object\\x20Array]','_addObjectProperty','startsWith','_hasSetOnItsPath','funcName','valueOf','_isPrimitiveType','create','_disposeWebsocket','1747344167286','type','logger\\x20websocket\\x20error','stack','POSITIVE_INFINITY','sortProps','nodeModules','_keyStrRegExp','then','error','prototype','2235140RdIARp','autoExpandPreviousObjects','_addFunctionsNode','_ninjaIgnoreNextError','log','warn','_isSet','_treeNodePropertiesAfterFullValue','noFunctions','root_exp_id','NEGATIVE_INFINITY','Map','RegExp','cappedProps',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.116\"],'[object\\x20Map]','299061SVCqLO','elapsed','function'];_0x16ed=function(){return _0x570c18;};return _0x16ed();}function oe(_0x7587c9,_0x1e4f69,_0x116447,_0x1e5809){var _0x16318a=_0x395e9b;_0x1e5809&&_0x7587c9===_0x16318a(0x224)&&_0x116447[_0x16318a(0x1d7)][_0x16318a(0x224)]();}function _0x5aa5(_0x292796,_0x3afcc0){var _0x16ed53=_0x16ed();return _0x5aa5=function(_0x5aa546,_0x35e366){_0x5aa546=_0x5aa546-0x15c;var _0x1d23c7=_0x16ed53[_0x5aa546];return _0x1d23c7;},_0x5aa5(_0x292796,_0x3afcc0);}function B(_0xe7f54e){var _0x273ef8=_0x395e9b,_0x7df8f,_0x22d215;let _0x24f158=function(_0x4ffd98,_0x429ebb){return _0x429ebb-_0x4ffd98;},_0x255b9e;if(_0xe7f54e[_0x273ef8(0x218)])_0x255b9e=function(){var _0x23254c=_0x273ef8;return _0xe7f54e[_0x23254c(0x218)][_0x23254c(0x1f0)]();};else{if(_0xe7f54e[_0x273ef8(0x233)]&&_0xe7f54e[_0x273ef8(0x233)][_0x273ef8(0x20c)]&&((_0x22d215=(_0x7df8f=_0xe7f54e[_0x273ef8(0x233)])==null?void 0x0:_0x7df8f[_0x273ef8(0x24a)])==null?void 0x0:_0x22d215[_0x273ef8(0x1f5)])!==_0x273ef8(0x1fc))_0x255b9e=function(){var _0x126f0a=_0x273ef8;return _0xe7f54e[_0x126f0a(0x233)][_0x126f0a(0x20c)]();},_0x24f158=function(_0x5e0e09,_0x555b1c){return 0x3e8*(_0x555b1c[0x0]-_0x5e0e09[0x0])+(_0x555b1c[0x1]-_0x5e0e09[0x1])/0xf4240;};else try{let {performance:_0x47eb9b}=require(_0x273ef8(0x23b));_0x255b9e=function(){var _0xbc7b16=_0x273ef8;return _0x47eb9b[_0xbc7b16(0x1f0)]();};}catch{_0x255b9e=function(){return+new Date();};}}return{'elapsed':_0x24f158,'timeStamp':_0x255b9e,'now':()=>Date[_0x273ef8(0x1f0)]()};}function X(_0x409820,_0x5716bc,_0x506662){var _0x3d0e86=_0x395e9b,_0x482bf8,_0x16a8f6,_0xa9a6a7,_0x501e92,_0x5daf7c;if(_0x409820['_consoleNinjaAllowedToStart']!==void 0x0)return _0x409820[_0x3d0e86(0x209)];let _0x37bc99=((_0x16a8f6=(_0x482bf8=_0x409820[_0x3d0e86(0x233)])==null?void 0x0:_0x482bf8[_0x3d0e86(0x1a0)])==null?void 0x0:_0x16a8f6[_0x3d0e86(0x20f)])||((_0x501e92=(_0xa9a6a7=_0x409820[_0x3d0e86(0x233)])==null?void 0x0:_0xa9a6a7[_0x3d0e86(0x24a)])==null?void 0x0:_0x501e92['NEXT_RUNTIME'])===_0x3d0e86(0x1fc);function _0x4ddefd(_0x2519fb){var _0x51eabd=_0x3d0e86;if(_0x2519fb[_0x51eabd(0x177)]('/')&&_0x2519fb['endsWith']('/')){let _0x346f53=new RegExp(_0x2519fb[_0x51eabd(0x1e1)](0x1,-0x1));return _0x4cd573=>_0x346f53[_0x51eabd(0x1a8)](_0x4cd573);}else{if(_0x2519fb[_0x51eabd(0x241)]('*')||_0x2519fb[_0x51eabd(0x241)]('?')){let _0x85376b=new RegExp('^'+_0x2519fb[_0x51eabd(0x1e4)](/\\./g,String[_0x51eabd(0x1b8)](0x5c)+'.')['replace'](/\\*/g,'.*')[_0x51eabd(0x1e4)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0x308026=>_0x85376b[_0x51eabd(0x1a8)](_0x308026);}else return _0x13dc02=>_0x13dc02===_0x2519fb;}}let _0xe87097=_0x5716bc[_0x3d0e86(0x212)](_0x4ddefd);return _0x409820['_consoleNinjaAllowedToStart']=_0x37bc99||!_0x5716bc,!_0x409820['_consoleNinjaAllowedToStart']&&((_0x5daf7c=_0x409820['location'])==null?void 0x0:_0x5daf7c[_0x3d0e86(0x20b)])&&(_0x409820[_0x3d0e86(0x209)]=_0xe87097[_0x3d0e86(0x23d)](_0x4f7ecb=>_0x4f7ecb(_0x409820[_0x3d0e86(0x1d7)]['hostname']))),_0x409820[_0x3d0e86(0x209)];}function J(_0x5e92be,_0x24cda5,_0x326a21,_0x5f320d){var _0x2fdd9b=_0x395e9b;_0x5e92be=_0x5e92be,_0x24cda5=_0x24cda5,_0x326a21=_0x326a21,_0x5f320d=_0x5f320d;let _0x1a52ba=B(_0x5e92be),_0xeaa37a=_0x1a52ba[_0x2fdd9b(0x19a)],_0x403d26=_0x1a52ba[_0x2fdd9b(0x211)];class _0x4b85a6{constructor(){var _0x4b848a=_0x2fdd9b;this[_0x4b848a(0x185)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x4b848a(0x245)]=/^(0|[1-9][0-9]*)$/,this[_0x4b848a(0x20d)]=/'([^\\\\']|\\\\')*'/,this['_undefined']=_0x5e92be[_0x4b848a(0x15d)],this[_0x4b848a(0x19f)]=_0x5e92be[_0x4b848a(0x23e)],this[_0x4b848a(0x1aa)]=Object[_0x4b848a(0x1f4)],this['_getOwnPropertyNames']=Object[_0x4b848a(0x1bd)],this[_0x4b848a(0x1ba)]=_0x5e92be['Symbol'],this['_regExpToString']=RegExp[_0x4b848a(0x188)][_0x4b848a(0x1c8)],this['_dateToString']=Date[_0x4b848a(0x188)][_0x4b848a(0x1c8)];}[_0x2fdd9b(0x1b0)](_0x499c0f,_0x54b122,_0xe6b790,_0x4dd91a){var _0x5a082b=_0x2fdd9b,_0x23294b=this,_0x19cc29=_0xe6b790['autoExpand'];function _0x46f42e(_0x2f147b,_0x28b8be,_0x3fb680){var _0x318fcc=_0x5aa5;_0x28b8be[_0x318fcc(0x17f)]=_0x318fcc(0x23a),_0x28b8be[_0x318fcc(0x187)]=_0x2f147b[_0x318fcc(0x1da)],_0x32a809=_0x3fb680[_0x318fcc(0x20f)][_0x318fcc(0x235)],_0x3fb680[_0x318fcc(0x20f)][_0x318fcc(0x235)]=_0x28b8be,_0x23294b['_treeNodePropertiesBeforeFullValue'](_0x28b8be,_0x3fb680);}let _0x10c409;_0x5e92be[_0x5a082b(0x1e0)]&&(_0x10c409=_0x5e92be[_0x5a082b(0x1e0)][_0x5a082b(0x187)],_0x10c409&&(_0x5e92be[_0x5a082b(0x1e0)]['error']=function(){}));try{try{_0xe6b790[_0x5a082b(0x1a6)]++,_0xe6b790[_0x5a082b(0x22a)]&&_0xe6b790['autoExpandPreviousObjects'][_0x5a082b(0x1fd)](_0x54b122);var _0x88c785,_0x4f500d,_0x17af21,_0x2df286,_0x97143e=[],_0x2d7677=[],_0x25d8dd,_0x4552c7=this[_0x5a082b(0x1eb)](_0x54b122),_0xea55a8=_0x4552c7===_0x5a082b(0x1b2),_0x500b3d=!0x1,_0x526107=_0x4552c7===_0x5a082b(0x19b),_0x2e0480=this[_0x5a082b(0x17b)](_0x4552c7),_0x5084b1=this[_0x5a082b(0x21a)](_0x4552c7),_0x5c3ed4=_0x2e0480||_0x5084b1,_0x29cfd0={},_0x47b44a=0x0,_0x4af36c=!0x1,_0x32a809,_0x44ac0f=/^(([1-9]{1}[0-9]*)|0)$/;if(_0xe6b790[_0x5a082b(0x162)]){if(_0xea55a8){if(_0x4f500d=_0x54b122[_0x5a082b(0x1fe)],_0x4f500d>_0xe6b790[_0x5a082b(0x1ef)]){for(_0x17af21=0x0,_0x2df286=_0xe6b790[_0x5a082b(0x1ef)],_0x88c785=_0x17af21;_0x88c785<_0x2df286;_0x88c785++)_0x2d7677[_0x5a082b(0x1fd)](_0x23294b[_0x5a082b(0x1d6)](_0x97143e,_0x54b122,_0x4552c7,_0x88c785,_0xe6b790));_0x499c0f[_0x5a082b(0x1f9)]=!0x0;}else{for(_0x17af21=0x0,_0x2df286=_0x4f500d,_0x88c785=_0x17af21;_0x88c785<_0x2df286;_0x88c785++)_0x2d7677['push'](_0x23294b['_addProperty'](_0x97143e,_0x54b122,_0x4552c7,_0x88c785,_0xe6b790));}_0xe6b790['autoExpandPropertyCount']+=_0x2d7677[_0x5a082b(0x1fe)];}if(!(_0x4552c7===_0x5a082b(0x250)||_0x4552c7===_0x5a082b(0x15d))&&!_0x2e0480&&_0x4552c7!==_0x5a082b(0x16a)&&_0x4552c7!==_0x5a082b(0x16c)&&_0x4552c7!=='bigint'){var _0x553b10=_0x4dd91a[_0x5a082b(0x21c)]||_0xe6b790[_0x5a082b(0x21c)];if(this['_isSet'](_0x54b122)?(_0x88c785=0x0,_0x54b122[_0x5a082b(0x15f)](function(_0x3ca8bb){var _0x229342=_0x5a082b;if(_0x47b44a++,_0xe6b790['autoExpandPropertyCount']++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;return;}if(!_0xe6b790[_0x229342(0x19d)]&&_0xe6b790['autoExpand']&&_0xe6b790[_0x229342(0x1c1)]>_0xe6b790[_0x229342(0x1b3)]){_0x4af36c=!0x0;return;}_0x2d7677[_0x229342(0x1fd)](_0x23294b[_0x229342(0x1d6)](_0x97143e,_0x54b122,_0x229342(0x221),_0x88c785++,_0xe6b790,function(_0x544968){return function(){return _0x544968;};}(_0x3ca8bb)));})):this[_0x5a082b(0x208)](_0x54b122)&&_0x54b122[_0x5a082b(0x15f)](function(_0x5ce4fc,_0xb6c7c8){var _0x38ad9b=_0x5a082b;if(_0x47b44a++,_0xe6b790[_0x38ad9b(0x1c1)]++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;return;}if(!_0xe6b790[_0x38ad9b(0x19d)]&&_0xe6b790[_0x38ad9b(0x22a)]&&_0xe6b790[_0x38ad9b(0x1c1)]>_0xe6b790[_0x38ad9b(0x1b3)]){_0x4af36c=!0x0;return;}var _0x12147a=_0xb6c7c8[_0x38ad9b(0x1c8)]();_0x12147a[_0x38ad9b(0x1fe)]>0x64&&(_0x12147a=_0x12147a[_0x38ad9b(0x1e1)](0x0,0x64)+_0x38ad9b(0x252)),_0x2d7677['push'](_0x23294b[_0x38ad9b(0x1d6)](_0x97143e,_0x54b122,_0x38ad9b(0x194),_0x12147a,_0xe6b790,function(_0x15e6f8){return function(){return _0x15e6f8;};}(_0x5ce4fc)));}),!_0x500b3d){try{for(_0x25d8dd in _0x54b122)if(!(_0xea55a8&&_0x44ac0f[_0x5a082b(0x1a8)](_0x25d8dd))&&!this[_0x5a082b(0x24f)](_0x54b122,_0x25d8dd,_0xe6b790)){if(_0x47b44a++,_0xe6b790[_0x5a082b(0x1c1)]++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;break;}if(!_0xe6b790[_0x5a082b(0x19d)]&&_0xe6b790[_0x5a082b(0x22a)]&&_0xe6b790[_0x5a082b(0x1c1)]>_0xe6b790['autoExpandLimit']){_0x4af36c=!0x0;break;}_0x2d7677['push'](_0x23294b[_0x5a082b(0x176)](_0x97143e,_0x29cfd0,_0x54b122,_0x4552c7,_0x25d8dd,_0xe6b790));}}catch{}if(_0x29cfd0[_0x5a082b(0x205)]=!0x0,_0x526107&&(_0x29cfd0[_0x5a082b(0x234)]=!0x0),!_0x4af36c){var _0x4331b7=[][_0x5a082b(0x203)](this[_0x5a082b(0x15e)](_0x54b122))[_0x5a082b(0x203)](this[_0x5a082b(0x220)](_0x54b122));for(_0x88c785=0x0,_0x4f500d=_0x4331b7[_0x5a082b(0x1fe)];_0x88c785<_0x4f500d;_0x88c785++)if(_0x25d8dd=_0x4331b7[_0x88c785],!(_0xea55a8&&_0x44ac0f['test'](_0x25d8dd[_0x5a082b(0x1c8)]()))&&!this['_blacklistedProperty'](_0x54b122,_0x25d8dd,_0xe6b790)&&!_0x29cfd0[_0x5a082b(0x1c9)+_0x25d8dd[_0x5a082b(0x1c8)]()]){if(_0x47b44a++,_0xe6b790[_0x5a082b(0x1c1)]++,_0x47b44a>_0x553b10){_0x4af36c=!0x0;break;}if(!_0xe6b790[_0x5a082b(0x19d)]&&_0xe6b790['autoExpand']&&_0xe6b790['autoExpandPropertyCount']>_0xe6b790['autoExpandLimit']){_0x4af36c=!0x0;break;}_0x2d7677['push'](_0x23294b[_0x5a082b(0x176)](_0x97143e,_0x29cfd0,_0x54b122,_0x4552c7,_0x25d8dd,_0xe6b790));}}}}}if(_0x499c0f['type']=_0x4552c7,_0x5c3ed4?(_0x499c0f[_0x5a082b(0x22d)]=_0x54b122['valueOf'](),this['_capIfString'](_0x4552c7,_0x499c0f,_0xe6b790,_0x4dd91a)):_0x4552c7===_0x5a082b(0x166)?_0x499c0f['value']=this['_dateToString'][_0x5a082b(0x19c)](_0x54b122):_0x4552c7===_0x5a082b(0x254)?_0x499c0f[_0x5a082b(0x22d)]=_0x54b122[_0x5a082b(0x1c8)]():_0x4552c7===_0x5a082b(0x195)?_0x499c0f['value']=this[_0x5a082b(0x1cd)]['call'](_0x54b122):_0x4552c7===_0x5a082b(0x1ec)&&this[_0x5a082b(0x1ba)]?_0x499c0f[_0x5a082b(0x22d)]=this[_0x5a082b(0x1ba)][_0x5a082b(0x188)][_0x5a082b(0x1c8)][_0x5a082b(0x19c)](_0x54b122):!_0xe6b790[_0x5a082b(0x162)]&&!(_0x4552c7==='null'||_0x4552c7==='undefined')&&(delete _0x499c0f[_0x5a082b(0x22d)],_0x499c0f[_0x5a082b(0x243)]=!0x0),_0x4af36c&&(_0x499c0f[_0x5a082b(0x196)]=!0x0),_0x32a809=_0xe6b790['node'][_0x5a082b(0x235)],_0xe6b790[_0x5a082b(0x20f)]['current']=_0x499c0f,this[_0x5a082b(0x1cc)](_0x499c0f,_0xe6b790),_0x2d7677[_0x5a082b(0x1fe)]){for(_0x88c785=0x0,_0x4f500d=_0x2d7677[_0x5a082b(0x1fe)];_0x88c785<_0x4f500d;_0x88c785++)_0x2d7677[_0x88c785](_0x88c785);}_0x97143e[_0x5a082b(0x1fe)]&&(_0x499c0f['props']=_0x97143e);}catch(_0x48f83a){_0x46f42e(_0x48f83a,_0x499c0f,_0xe6b790);}this[_0x5a082b(0x1ff)](_0x54b122,_0x499c0f),this[_0x5a082b(0x190)](_0x499c0f,_0xe6b790),_0xe6b790[_0x5a082b(0x20f)][_0x5a082b(0x235)]=_0x32a809,_0xe6b790[_0x5a082b(0x1a6)]--,_0xe6b790[_0x5a082b(0x22a)]=_0x19cc29,_0xe6b790[_0x5a082b(0x22a)]&&_0xe6b790[_0x5a082b(0x18a)][_0x5a082b(0x164)]();}finally{_0x10c409&&(_0x5e92be[_0x5a082b(0x1e0)][_0x5a082b(0x187)]=_0x10c409);}return _0x499c0f;}[_0x2fdd9b(0x220)](_0x530ec4){var _0x1fa4df=_0x2fdd9b;return Object[_0x1fa4df(0x16f)]?Object[_0x1fa4df(0x16f)](_0x530ec4):[];}[_0x2fdd9b(0x18f)](_0x1ca2d9){var _0x48d9c4=_0x2fdd9b;return!!(_0x1ca2d9&&_0x5e92be[_0x48d9c4(0x221)]&&this['_objectToString'](_0x1ca2d9)===_0x48d9c4(0x207)&&_0x1ca2d9[_0x48d9c4(0x15f)]);}[_0x2fdd9b(0x24f)](_0x499365,_0x3664e9,_0x543791){var _0x3bf0d5=_0x2fdd9b;return _0x543791[_0x3bf0d5(0x191)]?typeof _0x499365[_0x3664e9]==_0x3bf0d5(0x19b):!0x1;}[_0x2fdd9b(0x1eb)](_0x46114b){var _0x195660=_0x2fdd9b,_0x43ea93='';return _0x43ea93=typeof _0x46114b,_0x43ea93==='object'?this['_objectToString'](_0x46114b)===_0x195660(0x175)?_0x43ea93=_0x195660(0x1b2):this[_0x195660(0x171)](_0x46114b)===_0x195660(0x1d4)?_0x43ea93=_0x195660(0x166):this['_objectToString'](_0x46114b)===_0x195660(0x1a3)?_0x43ea93='bigint':_0x46114b===null?_0x43ea93=_0x195660(0x250):_0x46114b[_0x195660(0x1ea)]&&(_0x43ea93=_0x46114b['constructor'][_0x195660(0x1bf)]||_0x43ea93):_0x43ea93==='undefined'&&this['_HTMLAllCollection']&&_0x46114b instanceof this[_0x195660(0x19f)]&&(_0x43ea93='HTMLAllCollection'),_0x43ea93;}[_0x2fdd9b(0x171)](_0x21ccd0){var _0x42b59d=_0x2fdd9b;return Object[_0x42b59d(0x188)][_0x42b59d(0x1c8)]['call'](_0x21ccd0);}[_0x2fdd9b(0x17b)](_0x3d1b6){var _0x3004a8=_0x2fdd9b;return _0x3d1b6===_0x3004a8(0x161)||_0x3d1b6===_0x3004a8(0x21e)||_0x3d1b6===_0x3004a8(0x1c3);}[_0x2fdd9b(0x21a)](_0x3b8f10){var _0x8686d9=_0x2fdd9b;return _0x3b8f10===_0x8686d9(0x213)||_0x3b8f10==='String'||_0x3b8f10===_0x8686d9(0x1b6);}[_0x2fdd9b(0x1d6)](_0x4731cb,_0x4a7799,_0x58dc9a,_0xb4f915,_0x4b5cf6,_0x326381){var _0x4916ec=this;return function(_0x381504){var _0x17995e=_0x5aa5,_0x54bea6=_0x4b5cf6['node'][_0x17995e(0x235)],_0x5de509=_0x4b5cf6[_0x17995e(0x20f)][_0x17995e(0x1d2)],_0x1b5f4a=_0x4b5cf6['node'][_0x17995e(0x22c)];_0x4b5cf6[_0x17995e(0x20f)]['parent']=_0x54bea6,_0x4b5cf6[_0x17995e(0x20f)]['index']=typeof _0xb4f915==_0x17995e(0x1c3)?_0xb4f915:_0x381504,_0x4731cb[_0x17995e(0x1fd)](_0x4916ec['_property'](_0x4a7799,_0x58dc9a,_0xb4f915,_0x4b5cf6,_0x326381)),_0x4b5cf6[_0x17995e(0x20f)][_0x17995e(0x22c)]=_0x1b5f4a,_0x4b5cf6[_0x17995e(0x20f)][_0x17995e(0x1d2)]=_0x5de509;};}[_0x2fdd9b(0x176)](_0x1ad72c,_0x34143b,_0x4829ff,_0x56d25e,_0x55b5b4,_0x1300d7,_0x4056bf){var _0x2d40c1=_0x2fdd9b,_0xaf0017=this;return _0x34143b[_0x2d40c1(0x1c9)+_0x55b5b4['toString']()]=!0x0,function(_0x50c481){var _0x513b73=_0x2d40c1,_0x387ea1=_0x1300d7[_0x513b73(0x20f)]['current'],_0x5b4c40=_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x1d2)],_0x554503=_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x22c)];_0x1300d7['node'][_0x513b73(0x22c)]=_0x387ea1,_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x1d2)]=_0x50c481,_0x1ad72c[_0x513b73(0x1fd)](_0xaf0017[_0x513b73(0x204)](_0x4829ff,_0x56d25e,_0x55b5b4,_0x1300d7,_0x4056bf)),_0x1300d7[_0x513b73(0x20f)][_0x513b73(0x22c)]=_0x554503,_0x1300d7['node'][_0x513b73(0x1d2)]=_0x5b4c40;};}[_0x2fdd9b(0x204)](_0x5e1ed1,_0x49b872,_0x15173d,_0x48f42c,_0x42b5ef){var _0x87af6d=_0x2fdd9b,_0x533c2c=this;_0x42b5ef||(_0x42b5ef=function(_0x313f10,_0x3a5c66){return _0x313f10[_0x3a5c66];});var _0x4fae72=_0x15173d[_0x87af6d(0x1c8)](),_0x39acca=_0x48f42c[_0x87af6d(0x23f)]||{},_0x3ca230=_0x48f42c[_0x87af6d(0x162)],_0x11e94d=_0x48f42c[_0x87af6d(0x19d)];try{var _0x1184fc=this[_0x87af6d(0x208)](_0x5e1ed1),_0x1abf76=_0x4fae72;_0x1184fc&&_0x1abf76[0x0]==='\\x27'&&(_0x1abf76=_0x1abf76[_0x87af6d(0x1e7)](0x1,_0x1abf76[_0x87af6d(0x1fe)]-0x2));var _0x10acd6=_0x48f42c[_0x87af6d(0x23f)]=_0x39acca['_p_'+_0x1abf76];_0x10acd6&&(_0x48f42c[_0x87af6d(0x162)]=_0x48f42c[_0x87af6d(0x162)]+0x1),_0x48f42c[_0x87af6d(0x19d)]=!!_0x10acd6;var _0x20c8d5=typeof _0x15173d==_0x87af6d(0x1ec),_0x4e4636={'name':_0x20c8d5||_0x1184fc?_0x4fae72:this[_0x87af6d(0x1b1)](_0x4fae72)};if(_0x20c8d5&&(_0x4e4636['symbol']=!0x0),!(_0x49b872===_0x87af6d(0x1b2)||_0x49b872===_0x87af6d(0x21b))){var _0x337db2=this[_0x87af6d(0x1aa)](_0x5e1ed1,_0x15173d);if(_0x337db2&&(_0x337db2[_0x87af6d(0x1c5)]&&(_0x4e4636['setter']=!0x0),_0x337db2[_0x87af6d(0x1b5)]&&!_0x10acd6&&!_0x48f42c[_0x87af6d(0x1f6)]))return _0x4e4636[_0x87af6d(0x230)]=!0x0,this[_0x87af6d(0x257)](_0x4e4636,_0x48f42c),_0x4e4636;}var _0x168fd3;try{_0x168fd3=_0x42b5ef(_0x5e1ed1,_0x15173d);}catch(_0xe8383a){return _0x4e4636={'name':_0x4fae72,'type':_0x87af6d(0x23a),'error':_0xe8383a[_0x87af6d(0x1da)]},this['_processTreeNodeResult'](_0x4e4636,_0x48f42c),_0x4e4636;}var _0x49d235=this['_type'](_0x168fd3),_0x3e00bd=this[_0x87af6d(0x17b)](_0x49d235);if(_0x4e4636[_0x87af6d(0x17f)]=_0x49d235,_0x3e00bd)this[_0x87af6d(0x257)](_0x4e4636,_0x48f42c,_0x168fd3,function(){var _0xcc78e5=_0x87af6d;_0x4e4636[_0xcc78e5(0x22d)]=_0x168fd3[_0xcc78e5(0x17a)](),!_0x10acd6&&_0x533c2c[_0xcc78e5(0x1ce)](_0x49d235,_0x4e4636,_0x48f42c,{});});else{var _0x3c67eb=_0x48f42c[_0x87af6d(0x22a)]&&_0x48f42c[_0x87af6d(0x1a6)]<_0x48f42c[_0x87af6d(0x1a1)]&&_0x48f42c['autoExpandPreviousObjects']['indexOf'](_0x168fd3)<0x0&&_0x49d235!=='function'&&_0x48f42c['autoExpandPropertyCount']<_0x48f42c[_0x87af6d(0x1b3)];_0x3c67eb||_0x48f42c[_0x87af6d(0x1a6)]<_0x3ca230||_0x10acd6?(this['serialize'](_0x4e4636,_0x168fd3,_0x48f42c,_0x10acd6||{}),this[_0x87af6d(0x1ff)](_0x168fd3,_0x4e4636)):this[_0x87af6d(0x257)](_0x4e4636,_0x48f42c,_0x168fd3,function(){var _0x289164=_0x87af6d;_0x49d235===_0x289164(0x250)||_0x49d235===_0x289164(0x15d)||(delete _0x4e4636[_0x289164(0x22d)],_0x4e4636[_0x289164(0x243)]=!0x0);});}return _0x4e4636;}finally{_0x48f42c[_0x87af6d(0x23f)]=_0x39acca,_0x48f42c[_0x87af6d(0x162)]=_0x3ca230,_0x48f42c[_0x87af6d(0x19d)]=_0x11e94d;}}[_0x2fdd9b(0x1ce)](_0x48b8c9,_0x1a0afc,_0x3cf545,_0x4cc189){var _0x512fa5=_0x2fdd9b,_0x72c3ff=_0x4cc189[_0x512fa5(0x22b)]||_0x3cf545['strLength'];if((_0x48b8c9===_0x512fa5(0x21e)||_0x48b8c9===_0x512fa5(0x16a))&&_0x1a0afc['value']){let _0x2c3710=_0x1a0afc['value'][_0x512fa5(0x1fe)];_0x3cf545[_0x512fa5(0x239)]+=_0x2c3710,_0x3cf545[_0x512fa5(0x239)]>_0x3cf545[_0x512fa5(0x1ab)]?(_0x1a0afc['capped']='',delete _0x1a0afc['value']):_0x2c3710>_0x72c3ff&&(_0x1a0afc[_0x512fa5(0x243)]=_0x1a0afc[_0x512fa5(0x22d)][_0x512fa5(0x1e7)](0x0,_0x72c3ff),delete _0x1a0afc[_0x512fa5(0x22d)]);}}[_0x2fdd9b(0x208)](_0x64e532){var _0x58f888=_0x2fdd9b;return!!(_0x64e532&&_0x5e92be[_0x58f888(0x194)]&&this[_0x58f888(0x171)](_0x64e532)===_0x58f888(0x198)&&_0x64e532['forEach']);}['_propertyName'](_0x4fda87){var _0x53c90e=_0x2fdd9b;if(_0x4fda87[_0x53c90e(0x202)](/^\\d+$/))return _0x4fda87;var _0x3e015c;try{_0x3e015c=JSON['stringify'](''+_0x4fda87);}catch{_0x3e015c='\\x22'+this['_objectToString'](_0x4fda87)+'\\x22';}return _0x3e015c['match'](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x3e015c=_0x3e015c[_0x53c90e(0x1e7)](0x1,_0x3e015c['length']-0x2):_0x3e015c=_0x3e015c['replace'](/'/g,'\\x5c\\x27')[_0x53c90e(0x1e4)](/\\\\\"/g,'\\x22')[_0x53c90e(0x1e4)](/(^\"|\"$)/g,'\\x27'),_0x3e015c;}[_0x2fdd9b(0x257)](_0x2ee1c5,_0x199c8b,_0x2204ff,_0x175814){var _0x32edde=_0x2fdd9b;this[_0x32edde(0x1cc)](_0x2ee1c5,_0x199c8b),_0x175814&&_0x175814(),this[_0x32edde(0x1ff)](_0x2204ff,_0x2ee1c5),this[_0x32edde(0x190)](_0x2ee1c5,_0x199c8b);}['_treeNodePropertiesBeforeFullValue'](_0xd36160,_0x1bf3a0){var _0xee7933=_0x2fdd9b;this['_setNodeId'](_0xd36160,_0x1bf3a0),this['_setNodeQueryPath'](_0xd36160,_0x1bf3a0),this[_0xee7933(0x1d0)](_0xd36160,_0x1bf3a0),this[_0xee7933(0x1d3)](_0xd36160,_0x1bf3a0);}[_0x2fdd9b(0x206)](_0x1590ba,_0x3bf8f6){}['_setNodeQueryPath'](_0x5e98bb,_0x114ee3){}[_0x2fdd9b(0x231)](_0x16e77b,_0x4ffa21){}['_isUndefined'](_0xad7ca0){var _0x278924=_0x2fdd9b;return _0xad7ca0===this[_0x278924(0x21f)];}['_treeNodePropertiesAfterFullValue'](_0x15281d,_0x393678){var _0x39a6a3=_0x2fdd9b;this['_setNodeLabel'](_0x15281d,_0x393678),this[_0x39a6a3(0x246)](_0x15281d),_0x393678[_0x39a6a3(0x183)]&&this[_0x39a6a3(0x1e3)](_0x15281d),this[_0x39a6a3(0x18b)](_0x15281d,_0x393678),this[_0x39a6a3(0x255)](_0x15281d,_0x393678),this['_cleanNode'](_0x15281d);}[_0x2fdd9b(0x1ff)](_0x29c370,_0x3b98a7){var _0x4d92cb=_0x2fdd9b;try{_0x29c370&&typeof _0x29c370[_0x4d92cb(0x1fe)]==_0x4d92cb(0x1c3)&&(_0x3b98a7[_0x4d92cb(0x1fe)]=_0x29c370[_0x4d92cb(0x1fe)]);}catch{}if(_0x3b98a7[_0x4d92cb(0x17f)]===_0x4d92cb(0x1c3)||_0x3b98a7[_0x4d92cb(0x17f)]===_0x4d92cb(0x1b6)){if(isNaN(_0x3b98a7['value']))_0x3b98a7['nan']=!0x0,delete _0x3b98a7[_0x4d92cb(0x22d)];else switch(_0x3b98a7[_0x4d92cb(0x22d)]){case Number[_0x4d92cb(0x182)]:_0x3b98a7[_0x4d92cb(0x223)]=!0x0,delete _0x3b98a7['value'];break;case Number[_0x4d92cb(0x193)]:_0x3b98a7['negativeInfinity']=!0x0,delete _0x3b98a7['value'];break;case 0x0:this[_0x4d92cb(0x22f)](_0x3b98a7['value'])&&(_0x3b98a7[_0x4d92cb(0x200)]=!0x0);break;}}else _0x3b98a7[_0x4d92cb(0x17f)]===_0x4d92cb(0x19b)&&typeof _0x29c370['name']=='string'&&_0x29c370[_0x4d92cb(0x1bf)]&&_0x3b98a7[_0x4d92cb(0x1bf)]&&_0x29c370['name']!==_0x3b98a7[_0x4d92cb(0x1bf)]&&(_0x3b98a7[_0x4d92cb(0x179)]=_0x29c370[_0x4d92cb(0x1bf)]);}['_isNegativeZero'](_0x5ddd38){var _0x190678=_0x2fdd9b;return 0x1/_0x5ddd38===Number[_0x190678(0x193)];}['_sortProps'](_0x46dab8){var _0x544e21=_0x2fdd9b;!_0x46dab8[_0x544e21(0x21c)]||!_0x46dab8[_0x544e21(0x21c)]['length']||_0x46dab8[_0x544e21(0x17f)]===_0x544e21(0x1b2)||_0x46dab8[_0x544e21(0x17f)]==='Map'||_0x46dab8[_0x544e21(0x17f)]===_0x544e21(0x221)||_0x46dab8['props'][_0x544e21(0x15c)](function(_0x4355d9,_0x20abeb){var _0xf052c=_0x544e21,_0x28d229=_0x4355d9['name'][_0xf052c(0x222)](),_0x1a6cbf=_0x20abeb[_0xf052c(0x1bf)][_0xf052c(0x222)]();return _0x28d229<_0x1a6cbf?-0x1:_0x28d229>_0x1a6cbf?0x1:0x0;});}['_addFunctionsNode'](_0xc2f620,_0x515006){var _0x5467ed=_0x2fdd9b;if(!(_0x515006[_0x5467ed(0x191)]||!_0xc2f620[_0x5467ed(0x21c)]||!_0xc2f620['props'][_0x5467ed(0x1fe)])){for(var _0x4b53a2=[],_0x3e2067=[],_0x3c5361=0x0,_0x10efe2=_0xc2f620[_0x5467ed(0x21c)][_0x5467ed(0x1fe)];_0x3c5361<_0x10efe2;_0x3c5361++){var _0x4f4b8e=_0xc2f620['props'][_0x3c5361];_0x4f4b8e[_0x5467ed(0x17f)]===_0x5467ed(0x19b)?_0x4b53a2[_0x5467ed(0x1fd)](_0x4f4b8e):_0x3e2067[_0x5467ed(0x1fd)](_0x4f4b8e);}if(!(!_0x3e2067[_0x5467ed(0x1fe)]||_0x4b53a2[_0x5467ed(0x1fe)]<=0x1)){_0xc2f620[_0x5467ed(0x21c)]=_0x3e2067;var _0x4bde58={'functionsNode':!0x0,'props':_0x4b53a2};this[_0x5467ed(0x206)](_0x4bde58,_0x515006),this[_0x5467ed(0x231)](_0x4bde58,_0x515006),this[_0x5467ed(0x246)](_0x4bde58),this['_setNodePermissions'](_0x4bde58,_0x515006),_0x4bde58['id']+='\\x20f',_0xc2f620['props'][_0x5467ed(0x1ad)](_0x4bde58);}}}[_0x2fdd9b(0x255)](_0x4fd75d,_0x465368){}[_0x2fdd9b(0x246)](_0x5804b9){}[_0x2fdd9b(0x214)](_0x43f51d){var _0x50247f=_0x2fdd9b;return Array[_0x50247f(0x16d)](_0x43f51d)||typeof _0x43f51d==_0x50247f(0x1b9)&&this[_0x50247f(0x171)](_0x43f51d)==='[object\\x20Array]';}['_setNodePermissions'](_0x338042,_0x2b8239){}[_0x2fdd9b(0x256)](_0x3e26ae){var _0x6055d9=_0x2fdd9b;delete _0x3e26ae['_hasSymbolPropertyOnItsPath'],delete _0x3e26ae[_0x6055d9(0x178)],delete _0x3e26ae[_0x6055d9(0x16e)];}[_0x2fdd9b(0x1d0)](_0x5cc3c7,_0x157157){}}let _0x113573=new _0x4b85a6(),_0x3a3a9d={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x3a79b5={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x358005(_0x11613d,_0x54fd2d,_0x2f5f7a,_0x5859ad,_0x589b1c,_0xac590){var _0x90734b=_0x2fdd9b;let _0x49ffb1,_0x503e45;try{_0x503e45=_0x403d26(),_0x49ffb1=_0x326a21[_0x54fd2d],!_0x49ffb1||_0x503e45-_0x49ffb1['ts']>0x1f4&&_0x49ffb1[_0x90734b(0x217)]&&_0x49ffb1[_0x90734b(0x160)]/_0x49ffb1[_0x90734b(0x217)]<0x64?(_0x326a21[_0x54fd2d]=_0x49ffb1={'count':0x0,'time':0x0,'ts':_0x503e45},_0x326a21['hits']={}):_0x503e45-_0x326a21['hits']['ts']>0x32&&_0x326a21[_0x90734b(0x210)][_0x90734b(0x217)]&&_0x326a21['hits'][_0x90734b(0x160)]/_0x326a21['hits']['count']<0x64&&(_0x326a21[_0x90734b(0x210)]={});let _0x1fc136=[],_0x4e0fa6=_0x49ffb1[_0x90734b(0x16b)]||_0x326a21[_0x90734b(0x210)][_0x90734b(0x16b)]?_0x3a79b5:_0x3a3a9d,_0x585900=_0x3632b0=>{var _0x1babde=_0x90734b;let _0x30927c={};return _0x30927c[_0x1babde(0x21c)]=_0x3632b0['props'],_0x30927c[_0x1babde(0x1ef)]=_0x3632b0[_0x1babde(0x1ef)],_0x30927c[_0x1babde(0x22b)]=_0x3632b0[_0x1babde(0x22b)],_0x30927c[_0x1babde(0x1ab)]=_0x3632b0[_0x1babde(0x1ab)],_0x30927c['autoExpandLimit']=_0x3632b0[_0x1babde(0x1b3)],_0x30927c[_0x1babde(0x1a1)]=_0x3632b0['autoExpandMaxDepth'],_0x30927c[_0x1babde(0x183)]=!0x1,_0x30927c[_0x1babde(0x191)]=!_0x24cda5,_0x30927c['depth']=0x1,_0x30927c[_0x1babde(0x1a6)]=0x0,_0x30927c[_0x1babde(0x1dc)]=_0x1babde(0x192),_0x30927c['rootExpression']=_0x1babde(0x1e5),_0x30927c['autoExpand']=!0x0,_0x30927c['autoExpandPreviousObjects']=[],_0x30927c[_0x1babde(0x1c1)]=0x0,_0x30927c[_0x1babde(0x1f6)]=!0x0,_0x30927c[_0x1babde(0x239)]=0x0,_0x30927c[_0x1babde(0x20f)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x30927c;};for(var _0x82b470=0x0;_0x82b470<_0x589b1c[_0x90734b(0x1fe)];_0x82b470++)_0x1fc136[_0x90734b(0x1fd)](_0x113573[_0x90734b(0x1b0)]({'timeNode':_0x11613d==='time'||void 0x0},_0x589b1c[_0x82b470],_0x585900(_0x4e0fa6),{}));if(_0x11613d==='trace'||_0x11613d===_0x90734b(0x187)){let _0x5d68c5=Error['stackTraceLimit'];try{Error[_0x90734b(0x1d1)]=0x1/0x0,_0x1fc136[_0x90734b(0x1fd)](_0x113573[_0x90734b(0x1b0)]({'stackNode':!0x0},new Error()[_0x90734b(0x181)],_0x585900(_0x4e0fa6),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x5d68c5;}}return{'method':_0x90734b(0x18d),'version':_0x5f320d,'args':[{'ts':_0x2f5f7a,'session':_0x5859ad,'args':_0x1fc136,'id':_0x54fd2d,'context':_0xac590}]};}catch(_0x4f5314){return{'method':_0x90734b(0x18d),'version':_0x5f320d,'args':[{'ts':_0x2f5f7a,'session':_0x5859ad,'args':[{'type':_0x90734b(0x23a),'error':_0x4f5314&&_0x4f5314['message']}],'id':_0x54fd2d,'context':_0xac590}]};}finally{try{if(_0x49ffb1&&_0x503e45){let _0x246657=_0x403d26();_0x49ffb1[_0x90734b(0x217)]++,_0x49ffb1[_0x90734b(0x160)]+=_0xeaa37a(_0x503e45,_0x246657),_0x49ffb1['ts']=_0x246657,_0x326a21[_0x90734b(0x210)][_0x90734b(0x217)]++,_0x326a21[_0x90734b(0x210)][_0x90734b(0x160)]+=_0xeaa37a(_0x503e45,_0x246657),_0x326a21[_0x90734b(0x210)]['ts']=_0x246657,(_0x49ffb1[_0x90734b(0x217)]>0x32||_0x49ffb1[_0x90734b(0x160)]>0x64)&&(_0x49ffb1[_0x90734b(0x16b)]=!0x0),(_0x326a21['hits'][_0x90734b(0x217)]>0x3e8||_0x326a21['hits']['time']>0x12c)&&(_0x326a21[_0x90734b(0x210)][_0x90734b(0x16b)]=!0x0);}}catch{}}}return _0x358005;}((_0x3963ca,_0x5c9b77,_0x4f4649,_0x329a93,_0x66e8e6,_0x5c3a24,_0x2ddc62,_0x35df0b,_0xef9b38,_0x3dfaed,_0x337b7a)=>{var _0x16e64b=_0x395e9b;if(_0x3963ca[_0x16e64b(0x251)])return _0x3963ca[_0x16e64b(0x251)];if(!X(_0x3963ca,_0x35df0b,_0x66e8e6))return _0x3963ca[_0x16e64b(0x251)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x3963ca['_console_ninja'];let _0x278842=B(_0x3963ca),_0x581fe6=_0x278842[_0x16e64b(0x19a)],_0xb9d6e7=_0x278842['timeStamp'],_0x2d21fb=_0x278842['now'],_0xa0e74={'hits':{},'ts':{}},_0x3cd153=J(_0x3963ca,_0xef9b38,_0xa0e74,_0x5c3a24),_0x4b6212=_0x345e23=>{_0xa0e74['ts'][_0x345e23]=_0xb9d6e7();},_0x481b50=(_0x2f5993,_0x59d79d)=>{var _0x36c142=_0x16e64b;let _0x74a9bc=_0xa0e74['ts'][_0x59d79d];if(delete _0xa0e74['ts'][_0x59d79d],_0x74a9bc){let _0xd87ded=_0x581fe6(_0x74a9bc,_0xb9d6e7());_0x186d38(_0x3cd153(_0x36c142(0x160),_0x2f5993,_0x2d21fb(),_0x1f3cc7,[_0xd87ded],_0x59d79d));}},_0x26d284=_0x123923=>{var _0x3b95ed=_0x16e64b,_0x571512;return _0x66e8e6===_0x3b95ed(0x169)&&_0x3963ca['origin']&&((_0x571512=_0x123923==null?void 0x0:_0x123923[_0x3b95ed(0x1df)])==null?void 0x0:_0x571512['length'])&&(_0x123923[_0x3b95ed(0x1df)][0x0]['origin']=_0x3963ca[_0x3b95ed(0x1e9)]),_0x123923;};_0x3963ca[_0x16e64b(0x251)]={'consoleLog':(_0x58ff38,_0x514b4b)=>{var _0x2eeef6=_0x16e64b;_0x3963ca[_0x2eeef6(0x1e0)][_0x2eeef6(0x18d)][_0x2eeef6(0x1bf)]!==_0x2eeef6(0x232)&&_0x186d38(_0x3cd153('log',_0x58ff38,_0x2d21fb(),_0x1f3cc7,_0x514b4b));},'consoleTrace':(_0xc90832,_0x5a00f6)=>{var _0x22da88=_0x16e64b,_0x141caf,_0x14f3fb;_0x3963ca[_0x22da88(0x1e0)][_0x22da88(0x18d)]['name']!==_0x22da88(0x173)&&((_0x14f3fb=(_0x141caf=_0x3963ca['process'])==null?void 0x0:_0x141caf[_0x22da88(0x1a0)])!=null&&_0x14f3fb[_0x22da88(0x20f)]&&(_0x3963ca['_ninjaIgnoreNextError']=!0x0),_0x186d38(_0x26d284(_0x3cd153(_0x22da88(0x24d),_0xc90832,_0x2d21fb(),_0x1f3cc7,_0x5a00f6))));},'consoleError':(_0x414782,_0x5c6ab1)=>{var _0x207292=_0x16e64b;_0x3963ca[_0x207292(0x18c)]=!0x0,_0x186d38(_0x26d284(_0x3cd153(_0x207292(0x187),_0x414782,_0x2d21fb(),_0x1f3cc7,_0x5c6ab1)));},'consoleTime':_0x25854c=>{_0x4b6212(_0x25854c);},'consoleTimeEnd':(_0x24e39d,_0x17ef42)=>{_0x481b50(_0x17ef42,_0x24e39d);},'autoLog':(_0x55a6ee,_0x22cece)=>{var _0x5cd095=_0x16e64b;_0x186d38(_0x3cd153(_0x5cd095(0x18d),_0x22cece,_0x2d21fb(),_0x1f3cc7,[_0x55a6ee]));},'autoLogMany':(_0x1f8271,_0x2eb1dd)=>{_0x186d38(_0x3cd153('log',_0x1f8271,_0x2d21fb(),_0x1f3cc7,_0x2eb1dd));},'autoTrace':(_0x1b3ab8,_0x429ec6)=>{_0x186d38(_0x26d284(_0x3cd153('trace',_0x429ec6,_0x2d21fb(),_0x1f3cc7,[_0x1b3ab8])));},'autoTraceMany':(_0x1edf5c,_0x3dfc3e)=>{var _0x42af3c=_0x16e64b;_0x186d38(_0x26d284(_0x3cd153(_0x42af3c(0x24d),_0x1edf5c,_0x2d21fb(),_0x1f3cc7,_0x3dfc3e)));},'autoTime':(_0x56cf8e,_0x30397f,_0x259b00)=>{_0x4b6212(_0x259b00);},'autoTimeEnd':(_0x35f673,_0x551406,_0x1af9ee)=>{_0x481b50(_0x551406,_0x1af9ee);},'coverage':_0x2aa7a7=>{var _0x3784b3=_0x16e64b;_0x186d38({'method':_0x3784b3(0x1fb),'version':_0x5c3a24,'args':[{'id':_0x2aa7a7}]});}};let _0x186d38=H(_0x3963ca,_0x5c9b77,_0x4f4649,_0x329a93,_0x66e8e6,_0x3dfaed,_0x337b7a),_0x1f3cc7=_0x3963ca['_console_ninja_session'];return _0x3963ca[_0x16e64b(0x251)];})(globalThis,_0x395e9b(0x237),_0x395e9b(0x248),_0x395e9b(0x1fa),'webpack','1.0.0',_0x395e9b(0x17e),_0x395e9b(0x197),'',_0x395e9b(0x238),_0x395e9b(0x1a7));");
  } catch (e) {}
}
; /* istanbul ignore next */
function oo_oo(/**@type{any}**/i) {
  for (var _len = arguments.length, v = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    v[_key - 1] = arguments[_key];
  }
  try {
    oo_cm().consoleLog(i, v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_tr(/**@type{any}**/i) {
  for (var _len2 = arguments.length, v = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    v[_key2 - 1] = arguments[_key2];
  }
  try {
    oo_cm().consoleTrace(i, v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_tx(/**@type{any}**/i) {
  for (var _len3 = arguments.length, v = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    v[_key3 - 1] = arguments[_key3];
  }
  try {
    oo_cm().consoleError(i, v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_ts(/**@type{any}**/v) {
  try {
    oo_cm().consoleTime(v);
  } catch (e) {}
  return v;
}
; /* istanbul ignore next */
function oo_te(/**@type{any}**/v, /**@type{any}**/i) {
  try {
    oo_cm().consoleTimeEnd(v, i);
  } catch (e) {}
  return v;
}
; /*eslint unicorn/no-abusive-eslint-disable:,eslint-comments/disable-enable-pair:,eslint-comments/no-unlimited-disable:,eslint-comments/no-aggregating-enable:,eslint-comments/no-duplicate-disable:,eslint-comments/no-unused-disable:,eslint-comments/no-unused-enable:,*/

/***/ }),

/***/ "./src/addons/libraries/common/cs/small-stage.js":
/*!*******************************************************!*\
  !*** ./src/addons/libraries/common/cs/small-stage.js ***!
  \*******************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return addSmallStageClass; });
function addSmallStageClass() {
  // TW: no-op; sa-small-stage class is handled by scratch-gui
}

/***/ })

}]);
//# sourceMappingURL=addon-entry-gamepad.js.map
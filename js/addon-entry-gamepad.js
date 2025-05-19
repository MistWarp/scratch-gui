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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x4babf5=_0x2e24;(function(_0x43b7ab,_0x2306f6){var _0x2c63e6=_0x2e24,_0x26abad=_0x43b7ab();while(!![]){try{var _0x43ba9c=-parseInt(_0x2c63e6(0x255))/0x1*(parseInt(_0x2c63e6(0x268))/0x2)+parseInt(_0x2c63e6(0x29a))/0x3+parseInt(_0x2c63e6(0x21e))/0x4*(parseInt(_0x2c63e6(0x1a0))/0x5)+parseInt(_0x2c63e6(0x232))/0x6*(-parseInt(_0x2c63e6(0x228))/0x7)+parseInt(_0x2c63e6(0x220))/0x8+-parseInt(_0x2c63e6(0x1ed))/0x9*(parseInt(_0x2c63e6(0x25e))/0xa)+-parseInt(_0x2c63e6(0x22e))/0xb*(parseInt(_0x2c63e6(0x1d2))/0xc);if(_0x43ba9c===_0x2306f6)break;else _0x26abad['push'](_0x26abad['shift']());}catch(_0x1eb65b){_0x26abad['push'](_0x26abad['shift']());}}}(_0x242e,0x5877c));function _0x2e24(_0x267c0,_0x5ed4e4){var _0x242e53=_0x242e();return _0x2e24=function(_0x2e2404,_0x2f3579){_0x2e2404=_0x2e2404-0x19b;var _0x211a62=_0x242e53[_0x2e2404];return _0x211a62;},_0x2e24(_0x267c0,_0x5ed4e4);}var G=Object[_0x4babf5(0x294)],V=Object[_0x4babf5(0x1d5)],ee=Object[_0x4babf5(0x28b)],te=Object[_0x4babf5(0x1d3)],ne=Object[_0x4babf5(0x1da)],re=Object[_0x4babf5(0x287)][_0x4babf5(0x26d)],ie=(_0x5545b5,_0x594050,_0x5aa39b,_0x998214)=>{var _0x48cec2=_0x4babf5;if(_0x594050&&typeof _0x594050==_0x48cec2(0x263)||typeof _0x594050=='function'){for(let _0x1de4c1 of te(_0x594050))!re[_0x48cec2(0x1cb)](_0x5545b5,_0x1de4c1)&&_0x1de4c1!==_0x5aa39b&&V(_0x5545b5,_0x1de4c1,{'get':()=>_0x594050[_0x1de4c1],'enumerable':!(_0x998214=ee(_0x594050,_0x1de4c1))||_0x998214[_0x48cec2(0x284)]});}return _0x5545b5;},j=(_0x1c0ef2,_0x40cd19,_0x3739ee)=>(_0x3739ee=_0x1c0ef2!=null?G(ne(_0x1c0ef2)):{},ie(_0x40cd19||!_0x1c0ef2||!_0x1c0ef2[_0x4babf5(0x248)]?V(_0x3739ee,_0x4babf5(0x244),{'value':_0x1c0ef2,'enumerable':!0x0}):_0x3739ee,_0x1c0ef2)),q=class{constructor(_0x255676,_0x4996bb,_0x2d2645,_0x3e25fe,_0x5763d6,_0x44b5cf){var _0x14f935=_0x4babf5,_0x31996b,_0x5e54e0,_0x5ef214,_0x3a6b3f;this[_0x14f935(0x286)]=_0x255676,this['host']=_0x4996bb,this[_0x14f935(0x1cd)]=_0x2d2645,this['nodeModules']=_0x3e25fe,this[_0x14f935(0x1b2)]=_0x5763d6,this[_0x14f935(0x26a)]=_0x44b5cf,this[_0x14f935(0x1ec)]=!0x0,this[_0x14f935(0x28c)]=!0x0,this[_0x14f935(0x20c)]=!0x1,this['_connecting']=!0x1,this[_0x14f935(0x227)]=((_0x5e54e0=(_0x31996b=_0x255676[_0x14f935(0x233)])==null?void 0x0:_0x31996b[_0x14f935(0x23e)])==null?void 0x0:_0x5e54e0['NEXT_RUNTIME'])===_0x14f935(0x202),this[_0x14f935(0x288)]=!((_0x3a6b3f=(_0x5ef214=this[_0x14f935(0x286)]['process'])==null?void 0x0:_0x5ef214[_0x14f935(0x1f4)])!=null&&_0x3a6b3f[_0x14f935(0x24b)])&&!this[_0x14f935(0x227)],this['_WebSocketClass']=null,this[_0x14f935(0x23f)]=0x0,this[_0x14f935(0x221)]=0x14,this[_0x14f935(0x1fa)]='https://tinyurl.com/37x8b79t',this[_0x14f935(0x1dd)]=(this['_inBrowser']?_0x14f935(0x1e5):_0x14f935(0x27d))+this['_webSocketErrorDocsLink'];}async[_0x4babf5(0x242)](){var _0x207616=_0x4babf5,_0x778fb,_0x15876f;if(this['_WebSocketClass'])return this[_0x207616(0x215)];let _0xa6b251;if(this[_0x207616(0x288)]||this[_0x207616(0x227)])_0xa6b251=this[_0x207616(0x286)]['WebSocket'];else{if((_0x778fb=this[_0x207616(0x286)][_0x207616(0x233)])!=null&&_0x778fb['_WebSocket'])_0xa6b251=(_0x15876f=this[_0x207616(0x286)]['process'])==null?void 0x0:_0x15876f[_0x207616(0x25d)];else try{let _0x450554=await import(_0x207616(0x250));_0xa6b251=(await import((await import(_0x207616(0x1b7)))[_0x207616(0x1c2)](_0x450554['join'](this[_0x207616(0x236)],'ws/index.js'))['toString']()))[_0x207616(0x244)];}catch{try{_0xa6b251=require(require('path')[_0x207616(0x217)](this[_0x207616(0x236)],'ws'));}catch{throw new Error(_0x207616(0x285));}}}return this[_0x207616(0x215)]=_0xa6b251,_0xa6b251;}['_connectToHostNow'](){var _0x57817c=_0x4babf5;this[_0x57817c(0x1b1)]||this['_connected']||this[_0x57817c(0x23f)]>=this[_0x57817c(0x221)]||(this[_0x57817c(0x28c)]=!0x1,this['_connecting']=!0x0,this[_0x57817c(0x23f)]++,this['_ws']=new Promise((_0x3ed910,_0x57f248)=>{var _0x112be3=_0x57817c;this['getWebSocketClass']()['then'](_0x4345a2=>{var _0x23015c=_0x2e24;let _0x50316d=new _0x4345a2(_0x23015c(0x20a)+(!this['_inBrowser']&&this[_0x23015c(0x1b2)]?_0x23015c(0x1a3):this[_0x23015c(0x254)])+':'+this['port']);_0x50316d['onerror']=()=>{var _0x480575=_0x23015c;this[_0x480575(0x1ec)]=!0x1,this[_0x480575(0x22f)](_0x50316d),this['_attemptToReconnectShortly'](),_0x57f248(new Error(_0x480575(0x26b)));},_0x50316d[_0x23015c(0x283)]=()=>{var _0x35d164=_0x23015c;this['_inBrowser']||_0x50316d[_0x35d164(0x1a4)]&&_0x50316d[_0x35d164(0x1a4)][_0x35d164(0x226)]&&_0x50316d['_socket']['unref'](),_0x3ed910(_0x50316d);},_0x50316d[_0x23015c(0x1e3)]=()=>{var _0x46e4db=_0x23015c;this['_allowedToConnectOnSend']=!0x0,this[_0x46e4db(0x22f)](_0x50316d),this[_0x46e4db(0x1e4)]();},_0x50316d[_0x23015c(0x1a8)]=_0xddea9a=>{var _0x3639cf=_0x23015c;try{if(!(_0xddea9a!=null&&_0xddea9a[_0x3639cf(0x1db)])||!this[_0x3639cf(0x26a)])return;let _0x497354=JSON['parse'](_0xddea9a['data']);this['eventReceivedCallback'](_0x497354[_0x3639cf(0x25b)],_0x497354[_0x3639cf(0x204)],this['global'],this[_0x3639cf(0x288)]);}catch{}};})[_0x112be3(0x1c1)](_0x265c9b=>(this[_0x112be3(0x20c)]=!0x0,this[_0x112be3(0x1b1)]=!0x1,this['_allowedToConnectOnSend']=!0x1,this[_0x112be3(0x1ec)]=!0x0,this['_connectAttemptCount']=0x0,_0x265c9b))[_0x112be3(0x1b3)](_0x15de28=>(this['_connected']=!0x1,this['_connecting']=!0x1,console[_0x112be3(0x245)](_0x112be3(0x241)+this[_0x112be3(0x1fa)]),_0x57f248(new Error(_0x112be3(0x290)+(_0x15de28&&_0x15de28[_0x112be3(0x206)])))));}));}[_0x4babf5(0x22f)](_0x156a98){var _0x30c7b4=_0x4babf5;this[_0x30c7b4(0x20c)]=!0x1,this['_connecting']=!0x1;try{_0x156a98[_0x30c7b4(0x1e3)]=null,_0x156a98[_0x30c7b4(0x20b)]=null,_0x156a98[_0x30c7b4(0x283)]=null;}catch{}try{_0x156a98[_0x30c7b4(0x1ef)]<0x2&&_0x156a98[_0x30c7b4(0x20d)]();}catch{}}[_0x4babf5(0x1e4)](){var _0x2f4378=_0x4babf5;clearTimeout(this['_reconnectTimeout']),!(this[_0x2f4378(0x23f)]>=this[_0x2f4378(0x221)])&&(this[_0x2f4378(0x26f)]=setTimeout(()=>{var _0x31dea2=_0x2f4378,_0x3b589a;this[_0x31dea2(0x20c)]||this['_connecting']||(this[_0x31dea2(0x25a)](),(_0x3b589a=this[_0x31dea2(0x281)])==null||_0x3b589a['catch'](()=>this['_attemptToReconnectShortly']()));},0x1f4),this['_reconnectTimeout']['unref']&&this[_0x2f4378(0x26f)][_0x2f4378(0x226)]());}async[_0x4babf5(0x1f7)](_0x168b05){var _0x28c607=_0x4babf5;try{if(!this['_allowedToSend'])return;this[_0x28c607(0x28c)]&&this[_0x28c607(0x25a)](),(await this[_0x28c607(0x281)])[_0x28c607(0x1f7)](JSON['stringify'](_0x168b05));}catch(_0x1bb678){this[_0x28c607(0x1ac)]?console[_0x28c607(0x245)](this[_0x28c607(0x1dd)]+':\\x20'+(_0x1bb678&&_0x1bb678['message'])):(this[_0x28c607(0x1ac)]=!0x0,console[_0x28c607(0x245)](this[_0x28c607(0x1dd)]+':\\x20'+(_0x1bb678&&_0x1bb678['message']),_0x168b05)),this[_0x28c607(0x1ec)]=!0x1,this[_0x28c607(0x1e4)]();}}};function H(_0x547c5b,_0x2ed3b0,_0x4756b8,_0x57c8cf,_0x553f24,_0x42866c,_0x39be34,_0x515932=oe){var _0x1758f4=_0x4babf5;let _0x47decd=_0x4756b8[_0x1758f4(0x271)](',')[_0x1758f4(0x279)](_0x5c79d8=>{var _0x4a938f=_0x1758f4,_0x61bbf1,_0x30bc77,_0x24ecc0,_0x4cde0f;try{if(!_0x547c5b[_0x4a938f(0x214)]){let _0x51f9a7=((_0x30bc77=(_0x61bbf1=_0x547c5b[_0x4a938f(0x233)])==null?void 0x0:_0x61bbf1[_0x4a938f(0x1f4)])==null?void 0x0:_0x30bc77[_0x4a938f(0x24b)])||((_0x4cde0f=(_0x24ecc0=_0x547c5b['process'])==null?void 0x0:_0x24ecc0['env'])==null?void 0x0:_0x4cde0f['NEXT_RUNTIME'])===_0x4a938f(0x202);(_0x553f24===_0x4a938f(0x1ff)||_0x553f24===_0x4a938f(0x23c)||_0x553f24===_0x4a938f(0x201)||_0x553f24===_0x4a938f(0x1b9))&&(_0x553f24+=_0x51f9a7?_0x4a938f(0x21b):'\\x20browser'),_0x547c5b[_0x4a938f(0x214)]={'id':+new Date(),'tool':_0x553f24},_0x39be34&&_0x553f24&&!_0x51f9a7&&console[_0x4a938f(0x1c3)](_0x4a938f(0x1ad)+(_0x553f24[_0x4a938f(0x237)](0x0)[_0x4a938f(0x27f)]()+_0x553f24[_0x4a938f(0x252)](0x1))+',',_0x4a938f(0x280),'see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.');}let _0x293357=new q(_0x547c5b,_0x2ed3b0,_0x5c79d8,_0x57c8cf,_0x42866c,_0x515932);return _0x293357[_0x4a938f(0x1f7)]['bind'](_0x293357);}catch(_0x26b470){return console[_0x4a938f(0x245)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host',_0x26b470&&_0x26b470[_0x4a938f(0x206)]),()=>{};}});return _0x5a8c4c=>_0x47decd[_0x1758f4(0x216)](_0x5e27ed=>_0x5e27ed(_0x5a8c4c));}function oe(_0x544b5f,_0x59dcc8,_0xe24a9e,_0x36ad86){var _0x9b7437=_0x4babf5;_0x36ad86&&_0x544b5f===_0x9b7437(0x1d1)&&_0xe24a9e[_0x9b7437(0x1f1)][_0x9b7437(0x1d1)]();}function B(_0x450b23){var _0x24947d=_0x4babf5,_0x2440b4,_0x1c8b7d;let _0x5b40fd=function(_0x503b60,_0x49e00b){return _0x49e00b-_0x503b60;},_0x1da6bd;if(_0x450b23[_0x24947d(0x1bb)])_0x1da6bd=function(){var _0x3c4d5c=_0x24947d;return _0x450b23[_0x3c4d5c(0x1bb)][_0x3c4d5c(0x299)]();};else{if(_0x450b23['process']&&_0x450b23[_0x24947d(0x233)][_0x24947d(0x28f)]&&((_0x1c8b7d=(_0x2440b4=_0x450b23[_0x24947d(0x233)])==null?void 0x0:_0x2440b4[_0x24947d(0x23e)])==null?void 0x0:_0x1c8b7d[_0x24947d(0x261)])!==_0x24947d(0x202))_0x1da6bd=function(){var _0x594f94=_0x24947d;return _0x450b23[_0x594f94(0x233)][_0x594f94(0x28f)]();},_0x5b40fd=function(_0x2b27aa,_0x24991e){return 0x3e8*(_0x24991e[0x0]-_0x2b27aa[0x0])+(_0x24991e[0x1]-_0x2b27aa[0x1])/0xf4240;};else try{let {performance:_0x1b5641}=require(_0x24947d(0x1be));_0x1da6bd=function(){var _0x252eae=_0x24947d;return _0x1b5641[_0x252eae(0x299)]();};}catch{_0x1da6bd=function(){return+new Date();};}}return{'elapsed':_0x5b40fd,'timeStamp':_0x1da6bd,'now':()=>Date[_0x24947d(0x299)]()};}function X(_0x4d6b22,_0x2bd6aa,_0x129dac){var _0x42aa7a=_0x4babf5,_0x2d9edc,_0x50172d,_0x12ca05,_0x43db4d,_0x122d93;if(_0x4d6b22[_0x42aa7a(0x1f8)]!==void 0x0)return _0x4d6b22[_0x42aa7a(0x1f8)];let _0x17ed2b=((_0x50172d=(_0x2d9edc=_0x4d6b22[_0x42aa7a(0x233)])==null?void 0x0:_0x2d9edc[_0x42aa7a(0x1f4)])==null?void 0x0:_0x50172d[_0x42aa7a(0x24b)])||((_0x43db4d=(_0x12ca05=_0x4d6b22[_0x42aa7a(0x233)])==null?void 0x0:_0x12ca05['env'])==null?void 0x0:_0x43db4d[_0x42aa7a(0x261)])===_0x42aa7a(0x202);function _0x5392ad(_0xcc073c){var _0x32b9b7=_0x42aa7a;if(_0xcc073c['startsWith']('/')&&_0xcc073c[_0x32b9b7(0x24c)]('/')){let _0x5da9e=new RegExp(_0xcc073c[_0x32b9b7(0x1f2)](0x1,-0x1));return _0x5b95b6=>_0x5da9e[_0x32b9b7(0x19d)](_0x5b95b6);}else{if(_0xcc073c[_0x32b9b7(0x1f9)]('*')||_0xcc073c[_0x32b9b7(0x1f9)]('?')){let _0x29c2fc=new RegExp('^'+_0xcc073c['replace'](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x32b9b7(0x1c9)](/\\*/g,'.*')[_0x32b9b7(0x1c9)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0x4feb20=>_0x29c2fc[_0x32b9b7(0x19d)](_0x4feb20);}else return _0x3b802d=>_0x3b802d===_0xcc073c;}}let _0x562f01=_0x2bd6aa['map'](_0x5392ad);return _0x4d6b22['_consoleNinjaAllowedToStart']=_0x17ed2b||!_0x2bd6aa,!_0x4d6b22[_0x42aa7a(0x1f8)]&&((_0x122d93=_0x4d6b22['location'])==null?void 0x0:_0x122d93[_0x42aa7a(0x218)])&&(_0x4d6b22[_0x42aa7a(0x1f8)]=_0x562f01[_0x42aa7a(0x1f6)](_0x4adea4=>_0x4adea4(_0x4d6b22['location'][_0x42aa7a(0x218)]))),_0x4d6b22[_0x42aa7a(0x1f8)];}function J(_0x2c74a1,_0x27df16,_0x5ab174,_0x104ce9){var _0x232a7a=_0x4babf5;_0x2c74a1=_0x2c74a1,_0x27df16=_0x27df16,_0x5ab174=_0x5ab174,_0x104ce9=_0x104ce9;let _0x635afe=B(_0x2c74a1),_0x529ec8=_0x635afe['elapsed'],_0xa56f56=_0x635afe['timeStamp'];class _0x28a98e{constructor(){var _0x1eb81d=_0x2e24;this['_keyStrRegExp']=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this[_0x1eb81d(0x19f)]=/'([^\\\\']|\\\\')*'/,this['_undefined']=_0x2c74a1[_0x1eb81d(0x1cc)],this['_HTMLAllCollection']=_0x2c74a1['HTMLAllCollection'],this[_0x1eb81d(0x222)]=Object[_0x1eb81d(0x28b)],this[_0x1eb81d(0x1dc)]=Object[_0x1eb81d(0x1d3)],this[_0x1eb81d(0x1d0)]=_0x2c74a1[_0x1eb81d(0x230)],this[_0x1eb81d(0x19b)]=RegExp[_0x1eb81d(0x287)]['toString'],this[_0x1eb81d(0x1cf)]=Date[_0x1eb81d(0x287)]['toString'];}[_0x232a7a(0x1af)](_0x49ae04,_0x9da90c,_0x1d83d9,_0x4be738){var _0x4b2d05=_0x232a7a,_0x1bc91c=this,_0x45edbb=_0x1d83d9['autoExpand'];function _0x1f691c(_0x5596ae,_0x7d6e42,_0x320337){var _0x3dc413=_0x2e24;_0x7d6e42[_0x3dc413(0x1b0)]=_0x3dc413(0x1e2),_0x7d6e42['error']=_0x5596ae[_0x3dc413(0x206)],_0x280a34=_0x320337[_0x3dc413(0x24b)][_0x3dc413(0x277)],_0x320337[_0x3dc413(0x24b)][_0x3dc413(0x277)]=_0x7d6e42,_0x1bc91c[_0x3dc413(0x219)](_0x7d6e42,_0x320337);}let _0x248a37;_0x2c74a1[_0x4b2d05(0x251)]&&(_0x248a37=_0x2c74a1[_0x4b2d05(0x251)][_0x4b2d05(0x1bf)],_0x248a37&&(_0x2c74a1['console']['error']=function(){}));try{try{_0x1d83d9[_0x4b2d05(0x1b8)]++,_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9['autoExpandPreviousObjects'][_0x4b2d05(0x275)](_0x9da90c);var _0x8681a1,_0x8643d3,_0x5488bd,_0x18dfb8,_0x2eacc1=[],_0x1419da=[],_0x4941cc,_0x1137d9=this['_type'](_0x9da90c),_0xdc93f7=_0x1137d9===_0x4b2d05(0x1aa),_0x2d331a=!0x1,_0x278cfd=_0x1137d9==='function',_0x2053cf=this['_isPrimitiveType'](_0x1137d9),_0x4b4beb=this[_0x4b2d05(0x1b5)](_0x1137d9),_0x5da180=_0x2053cf||_0x4b4beb,_0x197782={},_0x4702db=0x0,_0x5ef613=!0x1,_0x280a34,_0x39603b=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x1d83d9[_0x4b2d05(0x1d9)]){if(_0xdc93f7){if(_0x8643d3=_0x9da90c[_0x4b2d05(0x1ea)],_0x8643d3>_0x1d83d9[_0x4b2d05(0x1df)]){for(_0x5488bd=0x0,_0x18dfb8=_0x1d83d9[_0x4b2d05(0x1df)],_0x8681a1=_0x5488bd;_0x8681a1<_0x18dfb8;_0x8681a1++)_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x238)](_0x2eacc1,_0x9da90c,_0x1137d9,_0x8681a1,_0x1d83d9));_0x49ae04[_0x4b2d05(0x1c4)]=!0x0;}else{for(_0x5488bd=0x0,_0x18dfb8=_0x8643d3,_0x8681a1=_0x5488bd;_0x8681a1<_0x18dfb8;_0x8681a1++)_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x238)](_0x2eacc1,_0x9da90c,_0x1137d9,_0x8681a1,_0x1d83d9));}_0x1d83d9[_0x4b2d05(0x209)]+=_0x1419da[_0x4b2d05(0x1ea)];}if(!(_0x1137d9===_0x4b2d05(0x235)||_0x1137d9===_0x4b2d05(0x1cc))&&!_0x2053cf&&_0x1137d9!==_0x4b2d05(0x203)&&_0x1137d9!==_0x4b2d05(0x1ce)&&_0x1137d9!==_0x4b2d05(0x1d7)){var _0x1022d4=_0x4be738[_0x4b2d05(0x256)]||_0x1d83d9[_0x4b2d05(0x256)];if(this[_0x4b2d05(0x26c)](_0x9da90c)?(_0x8681a1=0x0,_0x9da90c['forEach'](function(_0x250128){var _0x1f5bba=_0x4b2d05;if(_0x4702db++,_0x1d83d9[_0x1f5bba(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;return;}if(!_0x1d83d9['isExpressionToEvaluate']&&_0x1d83d9[_0x1f5bba(0x246)]&&_0x1d83d9[_0x1f5bba(0x209)]>_0x1d83d9[_0x1f5bba(0x259)]){_0x5ef613=!0x0;return;}_0x1419da[_0x1f5bba(0x275)](_0x1bc91c[_0x1f5bba(0x238)](_0x2eacc1,_0x9da90c,_0x1f5bba(0x1bc),_0x8681a1++,_0x1d83d9,function(_0x5d627b){return function(){return _0x5d627b;};}(_0x250128)));})):this[_0x4b2d05(0x270)](_0x9da90c)&&_0x9da90c[_0x4b2d05(0x216)](function(_0x37e522,_0x19f7fc){var _0x3d34f6=_0x4b2d05;if(_0x4702db++,_0x1d83d9[_0x3d34f6(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;return;}if(!_0x1d83d9[_0x3d34f6(0x213)]&&_0x1d83d9[_0x3d34f6(0x246)]&&_0x1d83d9[_0x3d34f6(0x209)]>_0x1d83d9[_0x3d34f6(0x259)]){_0x5ef613=!0x0;return;}var _0x15e54a=_0x19f7fc[_0x3d34f6(0x1fd)]();_0x15e54a[_0x3d34f6(0x1ea)]>0x64&&(_0x15e54a=_0x15e54a[_0x3d34f6(0x1f2)](0x0,0x64)+_0x3d34f6(0x1ca)),_0x1419da[_0x3d34f6(0x275)](_0x1bc91c['_addProperty'](_0x2eacc1,_0x9da90c,_0x3d34f6(0x267),_0x15e54a,_0x1d83d9,function(_0x1b37ca){return function(){return _0x1b37ca;};}(_0x37e522)));}),!_0x2d331a){try{for(_0x4941cc in _0x9da90c)if(!(_0xdc93f7&&_0x39603b[_0x4b2d05(0x19d)](_0x4941cc))&&!this[_0x4b2d05(0x292)](_0x9da90c,_0x4941cc,_0x1d83d9)){if(_0x4702db++,_0x1d83d9[_0x4b2d05(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;break;}if(!_0x1d83d9['isExpressionToEvaluate']&&_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9[_0x4b2d05(0x209)]>_0x1d83d9[_0x4b2d05(0x259)]){_0x5ef613=!0x0;break;}_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x1d8)](_0x2eacc1,_0x197782,_0x9da90c,_0x1137d9,_0x4941cc,_0x1d83d9));}}catch{}if(_0x197782[_0x4b2d05(0x1fb)]=!0x0,_0x278cfd&&(_0x197782[_0x4b2d05(0x27b)]=!0x0),!_0x5ef613){var _0x1d0e8b=[]['concat'](this[_0x4b2d05(0x1dc)](_0x9da90c))[_0x4b2d05(0x1e7)](this[_0x4b2d05(0x19c)](_0x9da90c));for(_0x8681a1=0x0,_0x8643d3=_0x1d0e8b['length'];_0x8681a1<_0x8643d3;_0x8681a1++)if(_0x4941cc=_0x1d0e8b[_0x8681a1],!(_0xdc93f7&&_0x39603b[_0x4b2d05(0x19d)](_0x4941cc['toString']()))&&!this[_0x4b2d05(0x292)](_0x9da90c,_0x4941cc,_0x1d83d9)&&!_0x197782['_p_'+_0x4941cc[_0x4b2d05(0x1fd)]()]){if(_0x4702db++,_0x1d83d9[_0x4b2d05(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;break;}if(!_0x1d83d9[_0x4b2d05(0x213)]&&_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9[_0x4b2d05(0x209)]>_0x1d83d9[_0x4b2d05(0x259)]){_0x5ef613=!0x0;break;}_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x1d8)](_0x2eacc1,_0x197782,_0x9da90c,_0x1137d9,_0x4941cc,_0x1d83d9));}}}}}if(_0x49ae04['type']=_0x1137d9,_0x5da180?(_0x49ae04['value']=_0x9da90c[_0x4b2d05(0x1c6)](),this[_0x4b2d05(0x243)](_0x1137d9,_0x49ae04,_0x1d83d9,_0x4be738)):_0x1137d9===_0x4b2d05(0x1e9)?_0x49ae04[_0x4b2d05(0x295)]=this[_0x4b2d05(0x1cf)][_0x4b2d05(0x1cb)](_0x9da90c):_0x1137d9===_0x4b2d05(0x1d7)?_0x49ae04[_0x4b2d05(0x295)]=_0x9da90c[_0x4b2d05(0x1fd)]():_0x1137d9===_0x4b2d05(0x260)?_0x49ae04[_0x4b2d05(0x295)]=this[_0x4b2d05(0x19b)]['call'](_0x9da90c):_0x1137d9===_0x4b2d05(0x274)&&this['_Symbol']?_0x49ae04[_0x4b2d05(0x295)]=this[_0x4b2d05(0x1d0)]['prototype'][_0x4b2d05(0x1fd)]['call'](_0x9da90c):!_0x1d83d9['depth']&&!(_0x1137d9===_0x4b2d05(0x235)||_0x1137d9===_0x4b2d05(0x1cc))&&(delete _0x49ae04[_0x4b2d05(0x295)],_0x49ae04['capped']=!0x0),_0x5ef613&&(_0x49ae04[_0x4b2d05(0x20e)]=!0x0),_0x280a34=_0x1d83d9[_0x4b2d05(0x24b)][_0x4b2d05(0x277)],_0x1d83d9[_0x4b2d05(0x24b)][_0x4b2d05(0x277)]=_0x49ae04,this[_0x4b2d05(0x219)](_0x49ae04,_0x1d83d9),_0x1419da['length']){for(_0x8681a1=0x0,_0x8643d3=_0x1419da[_0x4b2d05(0x1ea)];_0x8681a1<_0x8643d3;_0x8681a1++)_0x1419da[_0x8681a1](_0x8681a1);}_0x2eacc1[_0x4b2d05(0x1ea)]&&(_0x49ae04[_0x4b2d05(0x256)]=_0x2eacc1);}catch(_0x44201b){_0x1f691c(_0x44201b,_0x49ae04,_0x1d83d9);}this[_0x4b2d05(0x225)](_0x9da90c,_0x49ae04),this[_0x4b2d05(0x253)](_0x49ae04,_0x1d83d9),_0x1d83d9[_0x4b2d05(0x24b)][_0x4b2d05(0x277)]=_0x280a34,_0x1d83d9[_0x4b2d05(0x1b8)]--,_0x1d83d9[_0x4b2d05(0x246)]=_0x45edbb,_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9[_0x4b2d05(0x27c)][_0x4b2d05(0x1a1)]();}finally{_0x248a37&&(_0x2c74a1[_0x4b2d05(0x251)][_0x4b2d05(0x1bf)]=_0x248a37);}return _0x49ae04;}[_0x232a7a(0x19c)](_0x542f92){var _0x54ad8f=_0x232a7a;return Object[_0x54ad8f(0x234)]?Object[_0x54ad8f(0x234)](_0x542f92):[];}[_0x232a7a(0x26c)](_0x38ae69){var _0x39bc01=_0x232a7a;return!!(_0x38ae69&&_0x2c74a1[_0x39bc01(0x1bc)]&&this['_objectToString'](_0x38ae69)===_0x39bc01(0x296)&&_0x38ae69[_0x39bc01(0x216)]);}[_0x232a7a(0x292)](_0x15a428,_0xa9f49c,_0x27da54){var _0x17835f=_0x232a7a;return _0x27da54[_0x17835f(0x23b)]?typeof _0x15a428[_0xa9f49c]==_0x17835f(0x23d):!0x1;}[_0x232a7a(0x24e)](_0xdeb2fd){var _0x38e0e7=_0x232a7a,_0x127a0c='';return _0x127a0c=typeof _0xdeb2fd,_0x127a0c===_0x38e0e7(0x263)?this[_0x38e0e7(0x262)](_0xdeb2fd)==='[object\\x20Array]'?_0x127a0c=_0x38e0e7(0x1aa):this['_objectToString'](_0xdeb2fd)===_0x38e0e7(0x27e)?_0x127a0c=_0x38e0e7(0x1e9):this['_objectToString'](_0xdeb2fd)===_0x38e0e7(0x20f)?_0x127a0c=_0x38e0e7(0x1d7):_0xdeb2fd===null?_0x127a0c=_0x38e0e7(0x235):_0xdeb2fd[_0x38e0e7(0x1f5)]&&(_0x127a0c=_0xdeb2fd[_0x38e0e7(0x1f5)][_0x38e0e7(0x25f)]||_0x127a0c):_0x127a0c===_0x38e0e7(0x1cc)&&this[_0x38e0e7(0x1ba)]&&_0xdeb2fd instanceof this[_0x38e0e7(0x1ba)]&&(_0x127a0c=_0x38e0e7(0x28a)),_0x127a0c;}['_objectToString'](_0x3f2ab7){var _0x259490=_0x232a7a;return Object[_0x259490(0x287)]['toString'][_0x259490(0x1cb)](_0x3f2ab7);}[_0x232a7a(0x1ae)](_0x36e2ac){var _0x1c3f76=_0x232a7a;return _0x36e2ac===_0x1c3f76(0x276)||_0x36e2ac===_0x1c3f76(0x21a)||_0x36e2ac===_0x1c3f76(0x1bd);}[_0x232a7a(0x1b5)](_0x5c4339){var _0x4a8759=_0x232a7a;return _0x5c4339==='Boolean'||_0x5c4339==='String'||_0x5c4339===_0x4a8759(0x1a9);}[_0x232a7a(0x238)](_0x117932,_0x4d208e,_0x419681,_0x55bef0,_0x2d79e0,_0x46117c){var _0x55195f=this;return function(_0x43fd0d){var _0x3d27bf=_0x2e24,_0x354a1c=_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x277)],_0x2f177f=_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x1e6)],_0x2e8669=_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x22b)];_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x22b)]=_0x354a1c,_0x2d79e0['node']['index']=typeof _0x55bef0=='number'?_0x55bef0:_0x43fd0d,_0x117932[_0x3d27bf(0x275)](_0x55195f[_0x3d27bf(0x28d)](_0x4d208e,_0x419681,_0x55bef0,_0x2d79e0,_0x46117c)),_0x2d79e0['node'][_0x3d27bf(0x22b)]=_0x2e8669,_0x2d79e0['node'][_0x3d27bf(0x1e6)]=_0x2f177f;};}[_0x232a7a(0x1d8)](_0x1efc2f,_0x6214a1,_0x3fb851,_0xcf466f,_0x2a14b4,_0x2b4d6c,_0x2c80ff){var _0x195935=_0x232a7a,_0x29d0e3=this;return _0x6214a1[_0x195935(0x21d)+_0x2a14b4[_0x195935(0x1fd)]()]=!0x0,function(_0x414af4){var _0x560aa6=_0x195935,_0x5934da=_0x2b4d6c[_0x560aa6(0x24b)]['current'],_0x2de0c5=_0x2b4d6c[_0x560aa6(0x24b)][_0x560aa6(0x1e6)],_0x484668=_0x2b4d6c['node'][_0x560aa6(0x22b)];_0x2b4d6c[_0x560aa6(0x24b)][_0x560aa6(0x22b)]=_0x5934da,_0x2b4d6c['node'][_0x560aa6(0x1e6)]=_0x414af4,_0x1efc2f[_0x560aa6(0x275)](_0x29d0e3['_property'](_0x3fb851,_0xcf466f,_0x2a14b4,_0x2b4d6c,_0x2c80ff)),_0x2b4d6c['node']['parent']=_0x484668,_0x2b4d6c[_0x560aa6(0x24b)][_0x560aa6(0x1e6)]=_0x2de0c5;};}[_0x232a7a(0x28d)](_0x4458bd,_0x267de1,_0x35ed86,_0x2cf676,_0x26ade6){var _0x3e4ffa=_0x232a7a,_0x38e5ec=this;_0x26ade6||(_0x26ade6=function(_0x1fbec3,_0x3c9be6){return _0x1fbec3[_0x3c9be6];});var _0x3e7132=_0x35ed86[_0x3e4ffa(0x1fd)](),_0x35c3fe=_0x2cf676[_0x3e4ffa(0x282)]||{},_0x7ee7ab=_0x2cf676[_0x3e4ffa(0x1d9)],_0x3e4608=_0x2cf676[_0x3e4ffa(0x213)];try{var _0xd9fb34=this[_0x3e4ffa(0x270)](_0x4458bd),_0x41a561=_0x3e7132;_0xd9fb34&&_0x41a561[0x0]==='\\x27'&&(_0x41a561=_0x41a561[_0x3e4ffa(0x252)](0x1,_0x41a561[_0x3e4ffa(0x1ea)]-0x2));var _0x8bcab3=_0x2cf676['expressionsToEvaluate']=_0x35c3fe[_0x3e4ffa(0x21d)+_0x41a561];_0x8bcab3&&(_0x2cf676[_0x3e4ffa(0x1d9)]=_0x2cf676[_0x3e4ffa(0x1d9)]+0x1),_0x2cf676[_0x3e4ffa(0x213)]=!!_0x8bcab3;var _0x454b5f=typeof _0x35ed86==_0x3e4ffa(0x274),_0x273190={'name':_0x454b5f||_0xd9fb34?_0x3e7132:this[_0x3e4ffa(0x297)](_0x3e7132)};if(_0x454b5f&&(_0x273190[_0x3e4ffa(0x274)]=!0x0),!(_0x267de1===_0x3e4ffa(0x1aa)||_0x267de1===_0x3e4ffa(0x266))){var _0x10baf4=this[_0x3e4ffa(0x222)](_0x4458bd,_0x35ed86);if(_0x10baf4&&(_0x10baf4['set']&&(_0x273190[_0x3e4ffa(0x21f)]=!0x0),_0x10baf4[_0x3e4ffa(0x1eb)]&&!_0x8bcab3&&!_0x2cf676[_0x3e4ffa(0x272)]))return _0x273190[_0x3e4ffa(0x229)]=!0x0,this[_0x3e4ffa(0x1f0)](_0x273190,_0x2cf676),_0x273190;}var _0x58380d;try{_0x58380d=_0x26ade6(_0x4458bd,_0x35ed86);}catch(_0x153e11){return _0x273190={'name':_0x3e7132,'type':_0x3e4ffa(0x1e2),'error':_0x153e11[_0x3e4ffa(0x206)]},this[_0x3e4ffa(0x1f0)](_0x273190,_0x2cf676),_0x273190;}var _0x424a9b=this[_0x3e4ffa(0x24e)](_0x58380d),_0x71c036=this[_0x3e4ffa(0x1ae)](_0x424a9b);if(_0x273190[_0x3e4ffa(0x1b0)]=_0x424a9b,_0x71c036)this['_processTreeNodeResult'](_0x273190,_0x2cf676,_0x58380d,function(){var _0xe7ff01=_0x3e4ffa;_0x273190[_0xe7ff01(0x295)]=_0x58380d[_0xe7ff01(0x1c6)](),!_0x8bcab3&&_0x38e5ec[_0xe7ff01(0x243)](_0x424a9b,_0x273190,_0x2cf676,{});});else{var _0x147bd1=_0x2cf676[_0x3e4ffa(0x246)]&&_0x2cf676[_0x3e4ffa(0x1b8)]<_0x2cf676[_0x3e4ffa(0x258)]&&_0x2cf676[_0x3e4ffa(0x27c)][_0x3e4ffa(0x257)](_0x58380d)<0x0&&_0x424a9b!==_0x3e4ffa(0x23d)&&_0x2cf676[_0x3e4ffa(0x209)]<_0x2cf676[_0x3e4ffa(0x259)];_0x147bd1||_0x2cf676[_0x3e4ffa(0x1b8)]<_0x7ee7ab||_0x8bcab3?(this[_0x3e4ffa(0x1af)](_0x273190,_0x58380d,_0x2cf676,_0x8bcab3||{}),this[_0x3e4ffa(0x225)](_0x58380d,_0x273190)):this[_0x3e4ffa(0x1f0)](_0x273190,_0x2cf676,_0x58380d,function(){var _0x2cc01=_0x3e4ffa;_0x424a9b===_0x2cc01(0x235)||_0x424a9b==='undefined'||(delete _0x273190['value'],_0x273190['capped']=!0x0);});}return _0x273190;}finally{_0x2cf676['expressionsToEvaluate']=_0x35c3fe,_0x2cf676[_0x3e4ffa(0x1d9)]=_0x7ee7ab,_0x2cf676['isExpressionToEvaluate']=_0x3e4608;}}[_0x232a7a(0x243)](_0x45851a,_0x565654,_0x21786e,_0x752dc3){var _0x12df4b=_0x232a7a,_0x33696a=_0x752dc3[_0x12df4b(0x208)]||_0x21786e[_0x12df4b(0x208)];if((_0x45851a===_0x12df4b(0x21a)||_0x45851a===_0x12df4b(0x203))&&_0x565654[_0x12df4b(0x295)]){let _0x2f154e=_0x565654[_0x12df4b(0x295)][_0x12df4b(0x1ea)];_0x21786e[_0x12df4b(0x1e1)]+=_0x2f154e,_0x21786e['allStrLength']>_0x21786e['totalStrLength']?(_0x565654[_0x12df4b(0x1f3)]='',delete _0x565654[_0x12df4b(0x295)]):_0x2f154e>_0x33696a&&(_0x565654[_0x12df4b(0x1f3)]=_0x565654[_0x12df4b(0x295)]['substr'](0x0,_0x33696a),delete _0x565654[_0x12df4b(0x295)]);}}[_0x232a7a(0x270)](_0xc2a3bd){var _0x44e1d2=_0x232a7a;return!!(_0xc2a3bd&&_0x2c74a1[_0x44e1d2(0x267)]&&this[_0x44e1d2(0x262)](_0xc2a3bd)===_0x44e1d2(0x24d)&&_0xc2a3bd[_0x44e1d2(0x216)]);}[_0x232a7a(0x297)](_0x1589a5){var _0x373aa8=_0x232a7a;if(_0x1589a5[_0x373aa8(0x231)](/^\\d+$/))return _0x1589a5;var _0x139d00;try{_0x139d00=JSON['stringify'](''+_0x1589a5);}catch{_0x139d00='\\x22'+this[_0x373aa8(0x262)](_0x1589a5)+'\\x22';}return _0x139d00[_0x373aa8(0x231)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x139d00=_0x139d00['substr'](0x1,_0x139d00[_0x373aa8(0x1ea)]-0x2):_0x139d00=_0x139d00[_0x373aa8(0x1c9)](/'/g,'\\x5c\\x27')['replace'](/\\\\\"/g,'\\x22')[_0x373aa8(0x1c9)](/(^\"|\"$)/g,'\\x27'),_0x139d00;}[_0x232a7a(0x1f0)](_0x4a452f,_0x113a40,_0x47b3af,_0x5e01e9){var _0x485570=_0x232a7a;this[_0x485570(0x219)](_0x4a452f,_0x113a40),_0x5e01e9&&_0x5e01e9(),this['_additionalMetadata'](_0x47b3af,_0x4a452f),this['_treeNodePropertiesAfterFullValue'](_0x4a452f,_0x113a40);}[_0x232a7a(0x219)](_0x8282fe,_0x1742cb){var _0x385817=_0x232a7a;this[_0x385817(0x249)](_0x8282fe,_0x1742cb),this['_setNodeQueryPath'](_0x8282fe,_0x1742cb),this[_0x385817(0x19e)](_0x8282fe,_0x1742cb),this[_0x385817(0x212)](_0x8282fe,_0x1742cb);}[_0x232a7a(0x249)](_0xb6d5ef,_0x19e3e3){}[_0x232a7a(0x26e)](_0x236d15,_0x5215e4){}['_setNodeLabel'](_0x1246a6,_0xeac755){}[_0x232a7a(0x278)](_0x491756){var _0x18ccfb=_0x232a7a;return _0x491756===this[_0x18ccfb(0x28e)];}[_0x232a7a(0x253)](_0x5a9d3c,_0x11fa46){var _0x2d59cb=_0x232a7a;this[_0x2d59cb(0x1a5)](_0x5a9d3c,_0x11fa46),this[_0x2d59cb(0x1b4)](_0x5a9d3c),_0x11fa46[_0x2d59cb(0x1d6)]&&this[_0x2d59cb(0x1b6)](_0x5a9d3c),this[_0x2d59cb(0x1a2)](_0x5a9d3c,_0x11fa46),this['_addLoadNode'](_0x5a9d3c,_0x11fa46),this[_0x2d59cb(0x24f)](_0x5a9d3c);}[_0x232a7a(0x225)](_0x232826,_0x4b9f58){var _0x3082b7=_0x232a7a;try{_0x232826&&typeof _0x232826[_0x3082b7(0x1ea)]=='number'&&(_0x4b9f58[_0x3082b7(0x1ea)]=_0x232826[_0x3082b7(0x1ea)]);}catch{}if(_0x4b9f58[_0x3082b7(0x1b0)]===_0x3082b7(0x1bd)||_0x4b9f58[_0x3082b7(0x1b0)]==='Number'){if(isNaN(_0x4b9f58[_0x3082b7(0x295)]))_0x4b9f58[_0x3082b7(0x207)]=!0x0,delete _0x4b9f58['value'];else switch(_0x4b9f58[_0x3082b7(0x295)]){case Number[_0x3082b7(0x205)]:_0x4b9f58[_0x3082b7(0x1e0)]=!0x0,delete _0x4b9f58['value'];break;case Number[_0x3082b7(0x22d)]:_0x4b9f58[_0x3082b7(0x23a)]=!0x0,delete _0x4b9f58[_0x3082b7(0x295)];break;case 0x0:this[_0x3082b7(0x1c8)](_0x4b9f58['value'])&&(_0x4b9f58[_0x3082b7(0x273)]=!0x0);break;}}else _0x4b9f58[_0x3082b7(0x1b0)]===_0x3082b7(0x23d)&&typeof _0x232826[_0x3082b7(0x25f)]==_0x3082b7(0x21a)&&_0x232826[_0x3082b7(0x25f)]&&_0x4b9f58['name']&&_0x232826['name']!==_0x4b9f58[_0x3082b7(0x25f)]&&(_0x4b9f58['funcName']=_0x232826[_0x3082b7(0x25f)]);}[_0x232a7a(0x1c8)](_0x23999d){var _0x589ffd=_0x232a7a;return 0x1/_0x23999d===Number[_0x589ffd(0x22d)];}[_0x232a7a(0x1b6)](_0x1c992d){var _0x19fa7d=_0x232a7a;!_0x1c992d['props']||!_0x1c992d['props'][_0x19fa7d(0x1ea)]||_0x1c992d[_0x19fa7d(0x1b0)]==='array'||_0x1c992d['type']===_0x19fa7d(0x267)||_0x1c992d[_0x19fa7d(0x1b0)]===_0x19fa7d(0x1bc)||_0x1c992d[_0x19fa7d(0x256)][_0x19fa7d(0x293)](function(_0x107d4f,_0x34b1ba){var _0x2f7eea=_0x19fa7d,_0x541262=_0x107d4f['name'][_0x2f7eea(0x1a6)](),_0x2d39c7=_0x34b1ba[_0x2f7eea(0x25f)][_0x2f7eea(0x1a6)]();return _0x541262<_0x2d39c7?-0x1:_0x541262>_0x2d39c7?0x1:0x0;});}['_addFunctionsNode'](_0x2b9ea1,_0x22d5bb){var _0x44ec76=_0x232a7a;if(!(_0x22d5bb[_0x44ec76(0x23b)]||!_0x2b9ea1[_0x44ec76(0x256)]||!_0x2b9ea1[_0x44ec76(0x256)]['length'])){for(var _0x359fac=[],_0x371dac=[],_0x5d4817=0x0,_0x3e36f0=_0x2b9ea1[_0x44ec76(0x256)][_0x44ec76(0x1ea)];_0x5d4817<_0x3e36f0;_0x5d4817++){var _0x5f8c99=_0x2b9ea1[_0x44ec76(0x256)][_0x5d4817];_0x5f8c99[_0x44ec76(0x1b0)]===_0x44ec76(0x23d)?_0x359fac[_0x44ec76(0x275)](_0x5f8c99):_0x371dac[_0x44ec76(0x275)](_0x5f8c99);}if(!(!_0x371dac[_0x44ec76(0x1ea)]||_0x359fac['length']<=0x1)){_0x2b9ea1[_0x44ec76(0x256)]=_0x371dac;var _0x45220f={'functionsNode':!0x0,'props':_0x359fac};this[_0x44ec76(0x249)](_0x45220f,_0x22d5bb),this[_0x44ec76(0x1a5)](_0x45220f,_0x22d5bb),this[_0x44ec76(0x1b4)](_0x45220f),this[_0x44ec76(0x212)](_0x45220f,_0x22d5bb),_0x45220f['id']+='\\x20f',_0x2b9ea1[_0x44ec76(0x256)]['unshift'](_0x45220f);}}}[_0x232a7a(0x22c)](_0x49e57e,_0x13ed5c){}[_0x232a7a(0x1b4)](_0x371327){}['_isArray'](_0x48cadd){var _0x34d01a=_0x232a7a;return Array['isArray'](_0x48cadd)||typeof _0x48cadd==_0x34d01a(0x263)&&this[_0x34d01a(0x262)](_0x48cadd)===_0x34d01a(0x210);}[_0x232a7a(0x212)](_0x9d6136,_0x2c5978){}['_cleanNode'](_0x595985){var _0x4f2455=_0x232a7a;delete _0x595985[_0x4f2455(0x27a)],delete _0x595985['_hasSetOnItsPath'],delete _0x595985[_0x4f2455(0x1d4)];}[_0x232a7a(0x19e)](_0x3370b0,_0x8723a6){}}let _0x55fdf5=new _0x28a98e(),_0x3e4609={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x28f4a9={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x11b35a(_0x4aac6a,_0x3d4820,_0x5c9507,_0x40f69e,_0x23b05b,_0x589616){var _0x298f49=_0x232a7a;let _0x3689d0,_0x539091;try{_0x539091=_0xa56f56(),_0x3689d0=_0x5ab174[_0x3d4820],!_0x3689d0||_0x539091-_0x3689d0['ts']>0x1f4&&_0x3689d0[_0x298f49(0x1c7)]&&_0x3689d0[_0x298f49(0x291)]/_0x3689d0[_0x298f49(0x1c7)]<0x64?(_0x5ab174[_0x3d4820]=_0x3689d0={'count':0x0,'time':0x0,'ts':_0x539091},_0x5ab174[_0x298f49(0x1a7)]={}):_0x539091-_0x5ab174[_0x298f49(0x1a7)]['ts']>0x32&&_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x1c7)]&&_0x5ab174['hits'][_0x298f49(0x291)]/_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x1c7)]<0x64&&(_0x5ab174['hits']={});let _0x2e678e=[],_0x519301=_0x3689d0['reduceLimits']||_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x298)]?_0x28f4a9:_0x3e4609,_0x573693=_0x1b2838=>{var _0x2d17bd=_0x298f49;let _0x27baa3={};return _0x27baa3[_0x2d17bd(0x256)]=_0x1b2838['props'],_0x27baa3[_0x2d17bd(0x1df)]=_0x1b2838[_0x2d17bd(0x1df)],_0x27baa3[_0x2d17bd(0x208)]=_0x1b2838[_0x2d17bd(0x208)],_0x27baa3[_0x2d17bd(0x1de)]=_0x1b2838[_0x2d17bd(0x1de)],_0x27baa3[_0x2d17bd(0x259)]=_0x1b2838[_0x2d17bd(0x259)],_0x27baa3[_0x2d17bd(0x258)]=_0x1b2838[_0x2d17bd(0x258)],_0x27baa3[_0x2d17bd(0x1d6)]=!0x1,_0x27baa3[_0x2d17bd(0x23b)]=!_0x27df16,_0x27baa3[_0x2d17bd(0x1d9)]=0x1,_0x27baa3[_0x2d17bd(0x1b8)]=0x0,_0x27baa3[_0x2d17bd(0x1fe)]=_0x2d17bd(0x224),_0x27baa3[_0x2d17bd(0x1c0)]=_0x2d17bd(0x269),_0x27baa3[_0x2d17bd(0x246)]=!0x0,_0x27baa3['autoExpandPreviousObjects']=[],_0x27baa3[_0x2d17bd(0x209)]=0x0,_0x27baa3[_0x2d17bd(0x272)]=!0x0,_0x27baa3[_0x2d17bd(0x1e1)]=0x0,_0x27baa3[_0x2d17bd(0x24b)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x27baa3;};for(var _0x4c2602=0x0;_0x4c2602<_0x23b05b[_0x298f49(0x1ea)];_0x4c2602++)_0x2e678e[_0x298f49(0x275)](_0x55fdf5[_0x298f49(0x1af)]({'timeNode':_0x4aac6a==='time'||void 0x0},_0x23b05b[_0x4c2602],_0x573693(_0x519301),{}));if(_0x4aac6a==='trace'||_0x4aac6a==='error'){let _0x875231=Error[_0x298f49(0x1e8)];try{Error[_0x298f49(0x1e8)]=0x1/0x0,_0x2e678e[_0x298f49(0x275)](_0x55fdf5[_0x298f49(0x1af)]({'stackNode':!0x0},new Error()[_0x298f49(0x24a)],_0x573693(_0x519301),{'strLength':0x1/0x0}));}finally{Error[_0x298f49(0x1e8)]=_0x875231;}}return{'method':_0x298f49(0x1c3),'version':_0x104ce9,'args':[{'ts':_0x5c9507,'session':_0x40f69e,'args':_0x2e678e,'id':_0x3d4820,'context':_0x589616}]};}catch(_0x2a3019){return{'method':_0x298f49(0x1c3),'version':_0x104ce9,'args':[{'ts':_0x5c9507,'session':_0x40f69e,'args':[{'type':_0x298f49(0x1e2),'error':_0x2a3019&&_0x2a3019[_0x298f49(0x206)]}],'id':_0x3d4820,'context':_0x589616}]};}finally{try{if(_0x3689d0&&_0x539091){let _0x4bf5ed=_0xa56f56();_0x3689d0[_0x298f49(0x1c7)]++,_0x3689d0[_0x298f49(0x291)]+=_0x529ec8(_0x539091,_0x4bf5ed),_0x3689d0['ts']=_0x4bf5ed,_0x5ab174['hits'][_0x298f49(0x1c7)]++,_0x5ab174['hits'][_0x298f49(0x291)]+=_0x529ec8(_0x539091,_0x4bf5ed),_0x5ab174[_0x298f49(0x1a7)]['ts']=_0x4bf5ed,(_0x3689d0['count']>0x32||_0x3689d0[_0x298f49(0x291)]>0x64)&&(_0x3689d0['reduceLimits']=!0x0),(_0x5ab174[_0x298f49(0x1a7)]['count']>0x3e8||_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x291)]>0x12c)&&(_0x5ab174['hits'][_0x298f49(0x298)]=!0x0);}}catch{}}}return _0x11b35a;}((_0x4712fb,_0x15d38b,_0x573e79,_0x3dc472,_0x44cb13,_0x287b69,_0x304ca3,_0x5598ad,_0x5918eb,_0x3f4700,_0x4c4a2f)=>{var _0xdcec52=_0x4babf5;if(_0x4712fb[_0xdcec52(0x1c5)])return _0x4712fb[_0xdcec52(0x1c5)];if(!X(_0x4712fb,_0x5598ad,_0x44cb13))return _0x4712fb[_0xdcec52(0x1c5)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x4712fb[_0xdcec52(0x1c5)];let _0x17370c=B(_0x4712fb),_0x1242b1=_0x17370c[_0xdcec52(0x289)],_0x1edf02=_0x17370c[_0xdcec52(0x1ab)],_0x5d1b43=_0x17370c[_0xdcec52(0x299)],_0x86f1d={'hits':{},'ts':{}},_0x256215=J(_0x4712fb,_0x5918eb,_0x86f1d,_0x287b69),_0x1b6b47=_0x5d4746=>{_0x86f1d['ts'][_0x5d4746]=_0x1edf02();},_0x453cdc=(_0x4686cc,_0x3554e1)=>{var _0x36c3de=_0xdcec52;let _0x94fd40=_0x86f1d['ts'][_0x3554e1];if(delete _0x86f1d['ts'][_0x3554e1],_0x94fd40){let _0x1c92c7=_0x1242b1(_0x94fd40,_0x1edf02());_0x5f21dd(_0x256215(_0x36c3de(0x291),_0x4686cc,_0x5d1b43(),_0x23d25d,[_0x1c92c7],_0x3554e1));}},_0x15a35c=_0x604a02=>{var _0x2e3ab8=_0xdcec52,_0x3a1412;return _0x44cb13===_0x2e3ab8(0x1ff)&&_0x4712fb[_0x2e3ab8(0x21c)]&&((_0x3a1412=_0x604a02==null?void 0x0:_0x604a02['args'])==null?void 0x0:_0x3a1412['length'])&&(_0x604a02[_0x2e3ab8(0x204)][0x0][_0x2e3ab8(0x21c)]=_0x4712fb[_0x2e3ab8(0x21c)]),_0x604a02;};_0x4712fb[_0xdcec52(0x1c5)]={'consoleLog':(_0x1aee00,_0x5191cc)=>{var _0xc04f30=_0xdcec52;_0x4712fb['console'][_0xc04f30(0x1c3)][_0xc04f30(0x25f)]!==_0xc04f30(0x247)&&_0x5f21dd(_0x256215(_0xc04f30(0x1c3),_0x1aee00,_0x5d1b43(),_0x23d25d,_0x5191cc));},'consoleTrace':(_0xb7ebb7,_0x174720)=>{var _0x5cd7c2=_0xdcec52,_0x17e996,_0x165b65;_0x4712fb[_0x5cd7c2(0x251)]['log'][_0x5cd7c2(0x25f)]!==_0x5cd7c2(0x25c)&&((_0x165b65=(_0x17e996=_0x4712fb[_0x5cd7c2(0x233)])==null?void 0x0:_0x17e996[_0x5cd7c2(0x1f4)])!=null&&_0x165b65['node']&&(_0x4712fb[_0x5cd7c2(0x223)]=!0x0),_0x5f21dd(_0x15a35c(_0x256215(_0x5cd7c2(0x240),_0xb7ebb7,_0x5d1b43(),_0x23d25d,_0x174720))));},'consoleError':(_0x34186b,_0x3d1f65)=>{var _0x2d72e3=_0xdcec52;_0x4712fb[_0x2d72e3(0x223)]=!0x0,_0x5f21dd(_0x15a35c(_0x256215(_0x2d72e3(0x1bf),_0x34186b,_0x5d1b43(),_0x23d25d,_0x3d1f65)));},'consoleTime':_0x7e3406=>{_0x1b6b47(_0x7e3406);},'consoleTimeEnd':(_0x23e9dd,_0x4e8f0f)=>{_0x453cdc(_0x4e8f0f,_0x23e9dd);},'autoLog':(_0x3e09b7,_0x1b7b58)=>{_0x5f21dd(_0x256215('log',_0x1b7b58,_0x5d1b43(),_0x23d25d,[_0x3e09b7]));},'autoLogMany':(_0xc4762b,_0x19d9b7)=>{var _0x3b229b=_0xdcec52;_0x5f21dd(_0x256215(_0x3b229b(0x1c3),_0xc4762b,_0x5d1b43(),_0x23d25d,_0x19d9b7));},'autoTrace':(_0x5ceb2e,_0x1b9c49)=>{var _0x3cf979=_0xdcec52;_0x5f21dd(_0x15a35c(_0x256215(_0x3cf979(0x240),_0x1b9c49,_0x5d1b43(),_0x23d25d,[_0x5ceb2e])));},'autoTraceMany':(_0x59427f,_0x8c92df)=>{var _0xc6f7fd=_0xdcec52;_0x5f21dd(_0x15a35c(_0x256215(_0xc6f7fd(0x240),_0x59427f,_0x5d1b43(),_0x23d25d,_0x8c92df)));},'autoTime':(_0x464fb9,_0x1ad9c7,_0x5195c6)=>{_0x1b6b47(_0x5195c6);},'autoTimeEnd':(_0x44b889,_0x44dc9f,_0x22a3b4)=>{_0x453cdc(_0x44dc9f,_0x22a3b4);},'coverage':_0x36b849=>{_0x5f21dd({'method':'coverage','version':_0x287b69,'args':[{'id':_0x36b849}]});}};let _0x5f21dd=H(_0x4712fb,_0x15d38b,_0x573e79,_0x3dc472,_0x44cb13,_0x3f4700,_0x4c4a2f),_0x23d25d=_0x4712fb[_0xdcec52(0x214)];return _0x4712fb[_0xdcec52(0x1c5)];})(globalThis,'127.0.0.1',_0x4babf5(0x22a),_0x4babf5(0x265),'webpack',_0x4babf5(0x211),_0x4babf5(0x1ee),_0x4babf5(0x264),_0x4babf5(0x239),_0x4babf5(0x1fc),_0x4babf5(0x200));function _0x242e(){var _0x66c921=['disabledLog','__es'+'Module','_setNodeId','stack','node','endsWith','[object\\x20Map]','_type','_cleanNode','path','console','substr','_treeNodePropertiesAfterFullValue','host','69jTMDTX','props','indexOf','autoExpandMaxDepth','autoExpandLimit','_connectToHostNow','method','disabledTrace','_WebSocket','77210mTCgAf','name','RegExp','NEXT_RUNTIME','_objectToString','object',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.172\"],\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.442/node_modules\",'Error','Map','20126pOZtYU','root_exp','eventReceivedCallback','logger\\x20websocket\\x20error','_isSet','hasOwnProperty','_setNodeQueryPath','_reconnectTimeout','_isMap','split','resolveGetters','negativeZero','symbol','push','boolean','current','_isUndefined','map','_hasSymbolPropertyOnItsPath','_p_name','autoExpandPreviousObjects','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','[object\\x20Date]','toUpperCase','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','_ws','expressionsToEvaluate','onopen','enumerable','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','global','prototype','_inBrowser','elapsed','HTMLAllCollection','getOwnPropertyDescriptor','_allowedToConnectOnSend','_property','_undefined','hrtime','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','time','_blacklistedProperty','sort','create','value','[object\\x20Set]','_propertyName','reduceLimits','now','1802160KVdQmP','_regExpToString','_getOwnPropertySymbols','test','_setNodeExpressionPath','_quotedRegExp','827665bZwWik','pop','_addFunctionsNode','gateway.docker.internal','_socket','_setNodeLabel','toLowerCase','hits','onmessage','Number','array','timeStamp','_extendedWarning','%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','_isPrimitiveType','serialize','type','_connecting','dockerizedApp','catch','_setNodeExpandableState','_isPrimitiveWrapperType','_sortProps','url','level','angular','_HTMLAllCollection','performance','Set','number','perf_hooks','error','rootExpression','then','pathToFileURL','log','cappedElements','_console_ninja','valueOf','count','_isNegativeZero','replace','...','call','undefined','port','Buffer','_dateToString','_Symbol','reload','27996YSOPnG','getOwnPropertyNames','_hasMapOnItsPath','defineProperty','sortProps','bigint','_addObjectProperty','depth','getPrototypeOf','data','_getOwnPropertyNames','_sendErrorMessage','totalStrLength','elements','positiveInfinity','allStrLength','unknown','onclose','_attemptToReconnectShortly','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','index','concat','stackTraceLimit','date','length','get','_allowedToSend','18TnDNBF','1747641562748','readyState','_processTreeNodeResult','location','slice','capped','versions','constructor','some','send','_consoleNinjaAllowedToStart','includes','_webSocketErrorDocsLink','_p_length','','toString','expId','next.js','1','astro','edge','String','args','POSITIVE_INFINITY','message','nan','strLength','autoExpandPropertyCount','ws://','onerror','_connected','close','cappedProps','[object\\x20BigInt]','[object\\x20Array]','1.0.0','_setNodePermissions','isExpressionToEvaluate','_console_ninja_session','_WebSocketClass','forEach','join','hostname','_treeNodePropertiesBeforeFullValue','string','\\x20server','origin','_p_','8colGMA','setter','4100928tPJhnK','_maxConnectAttemptCount','_getOwnPropertyDescriptor','_ninjaIgnoreNextError','root_exp_id','_additionalMetadata','unref','_inNextEdge','7sRQumr','getter','63770','parent','_addLoadNode','NEGATIVE_INFINITY','1166aHrZOL','_disposeWebsocket','Symbol','match','749706phyDaI','process','getOwnPropertySymbols','null','nodeModules','charAt','_addProperty','','negativeInfinity','noFunctions','remix','function','env','_connectAttemptCount','trace','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','getWebSocketClass','_capIfString','default','warn','autoExpand'];_0x242e=function(){return _0x66c921;};return _0x242e();}");
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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x4babf5=_0x2e24;(function(_0x43b7ab,_0x2306f6){var _0x2c63e6=_0x2e24,_0x26abad=_0x43b7ab();while(!![]){try{var _0x43ba9c=-parseInt(_0x2c63e6(0x255))/0x1*(parseInt(_0x2c63e6(0x268))/0x2)+parseInt(_0x2c63e6(0x29a))/0x3+parseInt(_0x2c63e6(0x21e))/0x4*(parseInt(_0x2c63e6(0x1a0))/0x5)+parseInt(_0x2c63e6(0x232))/0x6*(-parseInt(_0x2c63e6(0x228))/0x7)+parseInt(_0x2c63e6(0x220))/0x8+-parseInt(_0x2c63e6(0x1ed))/0x9*(parseInt(_0x2c63e6(0x25e))/0xa)+-parseInt(_0x2c63e6(0x22e))/0xb*(parseInt(_0x2c63e6(0x1d2))/0xc);if(_0x43ba9c===_0x2306f6)break;else _0x26abad['push'](_0x26abad['shift']());}catch(_0x1eb65b){_0x26abad['push'](_0x26abad['shift']());}}}(_0x242e,0x5877c));function _0x2e24(_0x267c0,_0x5ed4e4){var _0x242e53=_0x242e();return _0x2e24=function(_0x2e2404,_0x2f3579){_0x2e2404=_0x2e2404-0x19b;var _0x211a62=_0x242e53[_0x2e2404];return _0x211a62;},_0x2e24(_0x267c0,_0x5ed4e4);}var G=Object[_0x4babf5(0x294)],V=Object[_0x4babf5(0x1d5)],ee=Object[_0x4babf5(0x28b)],te=Object[_0x4babf5(0x1d3)],ne=Object[_0x4babf5(0x1da)],re=Object[_0x4babf5(0x287)][_0x4babf5(0x26d)],ie=(_0x5545b5,_0x594050,_0x5aa39b,_0x998214)=>{var _0x48cec2=_0x4babf5;if(_0x594050&&typeof _0x594050==_0x48cec2(0x263)||typeof _0x594050=='function'){for(let _0x1de4c1 of te(_0x594050))!re[_0x48cec2(0x1cb)](_0x5545b5,_0x1de4c1)&&_0x1de4c1!==_0x5aa39b&&V(_0x5545b5,_0x1de4c1,{'get':()=>_0x594050[_0x1de4c1],'enumerable':!(_0x998214=ee(_0x594050,_0x1de4c1))||_0x998214[_0x48cec2(0x284)]});}return _0x5545b5;},j=(_0x1c0ef2,_0x40cd19,_0x3739ee)=>(_0x3739ee=_0x1c0ef2!=null?G(ne(_0x1c0ef2)):{},ie(_0x40cd19||!_0x1c0ef2||!_0x1c0ef2[_0x4babf5(0x248)]?V(_0x3739ee,_0x4babf5(0x244),{'value':_0x1c0ef2,'enumerable':!0x0}):_0x3739ee,_0x1c0ef2)),q=class{constructor(_0x255676,_0x4996bb,_0x2d2645,_0x3e25fe,_0x5763d6,_0x44b5cf){var _0x14f935=_0x4babf5,_0x31996b,_0x5e54e0,_0x5ef214,_0x3a6b3f;this[_0x14f935(0x286)]=_0x255676,this['host']=_0x4996bb,this[_0x14f935(0x1cd)]=_0x2d2645,this['nodeModules']=_0x3e25fe,this[_0x14f935(0x1b2)]=_0x5763d6,this[_0x14f935(0x26a)]=_0x44b5cf,this[_0x14f935(0x1ec)]=!0x0,this[_0x14f935(0x28c)]=!0x0,this[_0x14f935(0x20c)]=!0x1,this['_connecting']=!0x1,this[_0x14f935(0x227)]=((_0x5e54e0=(_0x31996b=_0x255676[_0x14f935(0x233)])==null?void 0x0:_0x31996b[_0x14f935(0x23e)])==null?void 0x0:_0x5e54e0['NEXT_RUNTIME'])===_0x14f935(0x202),this[_0x14f935(0x288)]=!((_0x3a6b3f=(_0x5ef214=this[_0x14f935(0x286)]['process'])==null?void 0x0:_0x5ef214[_0x14f935(0x1f4)])!=null&&_0x3a6b3f[_0x14f935(0x24b)])&&!this[_0x14f935(0x227)],this['_WebSocketClass']=null,this[_0x14f935(0x23f)]=0x0,this[_0x14f935(0x221)]=0x14,this[_0x14f935(0x1fa)]='https://tinyurl.com/37x8b79t',this[_0x14f935(0x1dd)]=(this['_inBrowser']?_0x14f935(0x1e5):_0x14f935(0x27d))+this['_webSocketErrorDocsLink'];}async[_0x4babf5(0x242)](){var _0x207616=_0x4babf5,_0x778fb,_0x15876f;if(this['_WebSocketClass'])return this[_0x207616(0x215)];let _0xa6b251;if(this[_0x207616(0x288)]||this[_0x207616(0x227)])_0xa6b251=this[_0x207616(0x286)]['WebSocket'];else{if((_0x778fb=this[_0x207616(0x286)][_0x207616(0x233)])!=null&&_0x778fb['_WebSocket'])_0xa6b251=(_0x15876f=this[_0x207616(0x286)]['process'])==null?void 0x0:_0x15876f[_0x207616(0x25d)];else try{let _0x450554=await import(_0x207616(0x250));_0xa6b251=(await import((await import(_0x207616(0x1b7)))[_0x207616(0x1c2)](_0x450554['join'](this[_0x207616(0x236)],'ws/index.js'))['toString']()))[_0x207616(0x244)];}catch{try{_0xa6b251=require(require('path')[_0x207616(0x217)](this[_0x207616(0x236)],'ws'));}catch{throw new Error(_0x207616(0x285));}}}return this[_0x207616(0x215)]=_0xa6b251,_0xa6b251;}['_connectToHostNow'](){var _0x57817c=_0x4babf5;this[_0x57817c(0x1b1)]||this['_connected']||this[_0x57817c(0x23f)]>=this[_0x57817c(0x221)]||(this[_0x57817c(0x28c)]=!0x1,this['_connecting']=!0x0,this[_0x57817c(0x23f)]++,this['_ws']=new Promise((_0x3ed910,_0x57f248)=>{var _0x112be3=_0x57817c;this['getWebSocketClass']()['then'](_0x4345a2=>{var _0x23015c=_0x2e24;let _0x50316d=new _0x4345a2(_0x23015c(0x20a)+(!this['_inBrowser']&&this[_0x23015c(0x1b2)]?_0x23015c(0x1a3):this[_0x23015c(0x254)])+':'+this['port']);_0x50316d['onerror']=()=>{var _0x480575=_0x23015c;this[_0x480575(0x1ec)]=!0x1,this[_0x480575(0x22f)](_0x50316d),this['_attemptToReconnectShortly'](),_0x57f248(new Error(_0x480575(0x26b)));},_0x50316d[_0x23015c(0x283)]=()=>{var _0x35d164=_0x23015c;this['_inBrowser']||_0x50316d[_0x35d164(0x1a4)]&&_0x50316d[_0x35d164(0x1a4)][_0x35d164(0x226)]&&_0x50316d['_socket']['unref'](),_0x3ed910(_0x50316d);},_0x50316d[_0x23015c(0x1e3)]=()=>{var _0x46e4db=_0x23015c;this['_allowedToConnectOnSend']=!0x0,this[_0x46e4db(0x22f)](_0x50316d),this[_0x46e4db(0x1e4)]();},_0x50316d[_0x23015c(0x1a8)]=_0xddea9a=>{var _0x3639cf=_0x23015c;try{if(!(_0xddea9a!=null&&_0xddea9a[_0x3639cf(0x1db)])||!this[_0x3639cf(0x26a)])return;let _0x497354=JSON['parse'](_0xddea9a['data']);this['eventReceivedCallback'](_0x497354[_0x3639cf(0x25b)],_0x497354[_0x3639cf(0x204)],this['global'],this[_0x3639cf(0x288)]);}catch{}};})[_0x112be3(0x1c1)](_0x265c9b=>(this[_0x112be3(0x20c)]=!0x0,this[_0x112be3(0x1b1)]=!0x1,this['_allowedToConnectOnSend']=!0x1,this[_0x112be3(0x1ec)]=!0x0,this['_connectAttemptCount']=0x0,_0x265c9b))[_0x112be3(0x1b3)](_0x15de28=>(this['_connected']=!0x1,this['_connecting']=!0x1,console[_0x112be3(0x245)](_0x112be3(0x241)+this[_0x112be3(0x1fa)]),_0x57f248(new Error(_0x112be3(0x290)+(_0x15de28&&_0x15de28[_0x112be3(0x206)])))));}));}[_0x4babf5(0x22f)](_0x156a98){var _0x30c7b4=_0x4babf5;this[_0x30c7b4(0x20c)]=!0x1,this['_connecting']=!0x1;try{_0x156a98[_0x30c7b4(0x1e3)]=null,_0x156a98[_0x30c7b4(0x20b)]=null,_0x156a98[_0x30c7b4(0x283)]=null;}catch{}try{_0x156a98[_0x30c7b4(0x1ef)]<0x2&&_0x156a98[_0x30c7b4(0x20d)]();}catch{}}[_0x4babf5(0x1e4)](){var _0x2f4378=_0x4babf5;clearTimeout(this['_reconnectTimeout']),!(this[_0x2f4378(0x23f)]>=this[_0x2f4378(0x221)])&&(this[_0x2f4378(0x26f)]=setTimeout(()=>{var _0x31dea2=_0x2f4378,_0x3b589a;this[_0x31dea2(0x20c)]||this['_connecting']||(this[_0x31dea2(0x25a)](),(_0x3b589a=this[_0x31dea2(0x281)])==null||_0x3b589a['catch'](()=>this['_attemptToReconnectShortly']()));},0x1f4),this['_reconnectTimeout']['unref']&&this[_0x2f4378(0x26f)][_0x2f4378(0x226)]());}async[_0x4babf5(0x1f7)](_0x168b05){var _0x28c607=_0x4babf5;try{if(!this['_allowedToSend'])return;this[_0x28c607(0x28c)]&&this[_0x28c607(0x25a)](),(await this[_0x28c607(0x281)])[_0x28c607(0x1f7)](JSON['stringify'](_0x168b05));}catch(_0x1bb678){this[_0x28c607(0x1ac)]?console[_0x28c607(0x245)](this[_0x28c607(0x1dd)]+':\\x20'+(_0x1bb678&&_0x1bb678['message'])):(this[_0x28c607(0x1ac)]=!0x0,console[_0x28c607(0x245)](this[_0x28c607(0x1dd)]+':\\x20'+(_0x1bb678&&_0x1bb678['message']),_0x168b05)),this[_0x28c607(0x1ec)]=!0x1,this[_0x28c607(0x1e4)]();}}};function H(_0x547c5b,_0x2ed3b0,_0x4756b8,_0x57c8cf,_0x553f24,_0x42866c,_0x39be34,_0x515932=oe){var _0x1758f4=_0x4babf5;let _0x47decd=_0x4756b8[_0x1758f4(0x271)](',')[_0x1758f4(0x279)](_0x5c79d8=>{var _0x4a938f=_0x1758f4,_0x61bbf1,_0x30bc77,_0x24ecc0,_0x4cde0f;try{if(!_0x547c5b[_0x4a938f(0x214)]){let _0x51f9a7=((_0x30bc77=(_0x61bbf1=_0x547c5b[_0x4a938f(0x233)])==null?void 0x0:_0x61bbf1[_0x4a938f(0x1f4)])==null?void 0x0:_0x30bc77[_0x4a938f(0x24b)])||((_0x4cde0f=(_0x24ecc0=_0x547c5b['process'])==null?void 0x0:_0x24ecc0['env'])==null?void 0x0:_0x4cde0f['NEXT_RUNTIME'])===_0x4a938f(0x202);(_0x553f24===_0x4a938f(0x1ff)||_0x553f24===_0x4a938f(0x23c)||_0x553f24===_0x4a938f(0x201)||_0x553f24===_0x4a938f(0x1b9))&&(_0x553f24+=_0x51f9a7?_0x4a938f(0x21b):'\\x20browser'),_0x547c5b[_0x4a938f(0x214)]={'id':+new Date(),'tool':_0x553f24},_0x39be34&&_0x553f24&&!_0x51f9a7&&console[_0x4a938f(0x1c3)](_0x4a938f(0x1ad)+(_0x553f24[_0x4a938f(0x237)](0x0)[_0x4a938f(0x27f)]()+_0x553f24[_0x4a938f(0x252)](0x1))+',',_0x4a938f(0x280),'see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.');}let _0x293357=new q(_0x547c5b,_0x2ed3b0,_0x5c79d8,_0x57c8cf,_0x42866c,_0x515932);return _0x293357[_0x4a938f(0x1f7)]['bind'](_0x293357);}catch(_0x26b470){return console[_0x4a938f(0x245)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host',_0x26b470&&_0x26b470[_0x4a938f(0x206)]),()=>{};}});return _0x5a8c4c=>_0x47decd[_0x1758f4(0x216)](_0x5e27ed=>_0x5e27ed(_0x5a8c4c));}function oe(_0x544b5f,_0x59dcc8,_0xe24a9e,_0x36ad86){var _0x9b7437=_0x4babf5;_0x36ad86&&_0x544b5f===_0x9b7437(0x1d1)&&_0xe24a9e[_0x9b7437(0x1f1)][_0x9b7437(0x1d1)]();}function B(_0x450b23){var _0x24947d=_0x4babf5,_0x2440b4,_0x1c8b7d;let _0x5b40fd=function(_0x503b60,_0x49e00b){return _0x49e00b-_0x503b60;},_0x1da6bd;if(_0x450b23[_0x24947d(0x1bb)])_0x1da6bd=function(){var _0x3c4d5c=_0x24947d;return _0x450b23[_0x3c4d5c(0x1bb)][_0x3c4d5c(0x299)]();};else{if(_0x450b23['process']&&_0x450b23[_0x24947d(0x233)][_0x24947d(0x28f)]&&((_0x1c8b7d=(_0x2440b4=_0x450b23[_0x24947d(0x233)])==null?void 0x0:_0x2440b4[_0x24947d(0x23e)])==null?void 0x0:_0x1c8b7d[_0x24947d(0x261)])!==_0x24947d(0x202))_0x1da6bd=function(){var _0x594f94=_0x24947d;return _0x450b23[_0x594f94(0x233)][_0x594f94(0x28f)]();},_0x5b40fd=function(_0x2b27aa,_0x24991e){return 0x3e8*(_0x24991e[0x0]-_0x2b27aa[0x0])+(_0x24991e[0x1]-_0x2b27aa[0x1])/0xf4240;};else try{let {performance:_0x1b5641}=require(_0x24947d(0x1be));_0x1da6bd=function(){var _0x252eae=_0x24947d;return _0x1b5641[_0x252eae(0x299)]();};}catch{_0x1da6bd=function(){return+new Date();};}}return{'elapsed':_0x5b40fd,'timeStamp':_0x1da6bd,'now':()=>Date[_0x24947d(0x299)]()};}function X(_0x4d6b22,_0x2bd6aa,_0x129dac){var _0x42aa7a=_0x4babf5,_0x2d9edc,_0x50172d,_0x12ca05,_0x43db4d,_0x122d93;if(_0x4d6b22[_0x42aa7a(0x1f8)]!==void 0x0)return _0x4d6b22[_0x42aa7a(0x1f8)];let _0x17ed2b=((_0x50172d=(_0x2d9edc=_0x4d6b22[_0x42aa7a(0x233)])==null?void 0x0:_0x2d9edc[_0x42aa7a(0x1f4)])==null?void 0x0:_0x50172d[_0x42aa7a(0x24b)])||((_0x43db4d=(_0x12ca05=_0x4d6b22[_0x42aa7a(0x233)])==null?void 0x0:_0x12ca05['env'])==null?void 0x0:_0x43db4d[_0x42aa7a(0x261)])===_0x42aa7a(0x202);function _0x5392ad(_0xcc073c){var _0x32b9b7=_0x42aa7a;if(_0xcc073c['startsWith']('/')&&_0xcc073c[_0x32b9b7(0x24c)]('/')){let _0x5da9e=new RegExp(_0xcc073c[_0x32b9b7(0x1f2)](0x1,-0x1));return _0x5b95b6=>_0x5da9e[_0x32b9b7(0x19d)](_0x5b95b6);}else{if(_0xcc073c[_0x32b9b7(0x1f9)]('*')||_0xcc073c[_0x32b9b7(0x1f9)]('?')){let _0x29c2fc=new RegExp('^'+_0xcc073c['replace'](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x32b9b7(0x1c9)](/\\*/g,'.*')[_0x32b9b7(0x1c9)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0x4feb20=>_0x29c2fc[_0x32b9b7(0x19d)](_0x4feb20);}else return _0x3b802d=>_0x3b802d===_0xcc073c;}}let _0x562f01=_0x2bd6aa['map'](_0x5392ad);return _0x4d6b22['_consoleNinjaAllowedToStart']=_0x17ed2b||!_0x2bd6aa,!_0x4d6b22[_0x42aa7a(0x1f8)]&&((_0x122d93=_0x4d6b22['location'])==null?void 0x0:_0x122d93[_0x42aa7a(0x218)])&&(_0x4d6b22[_0x42aa7a(0x1f8)]=_0x562f01[_0x42aa7a(0x1f6)](_0x4adea4=>_0x4adea4(_0x4d6b22['location'][_0x42aa7a(0x218)]))),_0x4d6b22[_0x42aa7a(0x1f8)];}function J(_0x2c74a1,_0x27df16,_0x5ab174,_0x104ce9){var _0x232a7a=_0x4babf5;_0x2c74a1=_0x2c74a1,_0x27df16=_0x27df16,_0x5ab174=_0x5ab174,_0x104ce9=_0x104ce9;let _0x635afe=B(_0x2c74a1),_0x529ec8=_0x635afe['elapsed'],_0xa56f56=_0x635afe['timeStamp'];class _0x28a98e{constructor(){var _0x1eb81d=_0x2e24;this['_keyStrRegExp']=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this[_0x1eb81d(0x19f)]=/'([^\\\\']|\\\\')*'/,this['_undefined']=_0x2c74a1[_0x1eb81d(0x1cc)],this['_HTMLAllCollection']=_0x2c74a1['HTMLAllCollection'],this[_0x1eb81d(0x222)]=Object[_0x1eb81d(0x28b)],this[_0x1eb81d(0x1dc)]=Object[_0x1eb81d(0x1d3)],this[_0x1eb81d(0x1d0)]=_0x2c74a1[_0x1eb81d(0x230)],this[_0x1eb81d(0x19b)]=RegExp[_0x1eb81d(0x287)]['toString'],this[_0x1eb81d(0x1cf)]=Date[_0x1eb81d(0x287)]['toString'];}[_0x232a7a(0x1af)](_0x49ae04,_0x9da90c,_0x1d83d9,_0x4be738){var _0x4b2d05=_0x232a7a,_0x1bc91c=this,_0x45edbb=_0x1d83d9['autoExpand'];function _0x1f691c(_0x5596ae,_0x7d6e42,_0x320337){var _0x3dc413=_0x2e24;_0x7d6e42[_0x3dc413(0x1b0)]=_0x3dc413(0x1e2),_0x7d6e42['error']=_0x5596ae[_0x3dc413(0x206)],_0x280a34=_0x320337[_0x3dc413(0x24b)][_0x3dc413(0x277)],_0x320337[_0x3dc413(0x24b)][_0x3dc413(0x277)]=_0x7d6e42,_0x1bc91c[_0x3dc413(0x219)](_0x7d6e42,_0x320337);}let _0x248a37;_0x2c74a1[_0x4b2d05(0x251)]&&(_0x248a37=_0x2c74a1[_0x4b2d05(0x251)][_0x4b2d05(0x1bf)],_0x248a37&&(_0x2c74a1['console']['error']=function(){}));try{try{_0x1d83d9[_0x4b2d05(0x1b8)]++,_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9['autoExpandPreviousObjects'][_0x4b2d05(0x275)](_0x9da90c);var _0x8681a1,_0x8643d3,_0x5488bd,_0x18dfb8,_0x2eacc1=[],_0x1419da=[],_0x4941cc,_0x1137d9=this['_type'](_0x9da90c),_0xdc93f7=_0x1137d9===_0x4b2d05(0x1aa),_0x2d331a=!0x1,_0x278cfd=_0x1137d9==='function',_0x2053cf=this['_isPrimitiveType'](_0x1137d9),_0x4b4beb=this[_0x4b2d05(0x1b5)](_0x1137d9),_0x5da180=_0x2053cf||_0x4b4beb,_0x197782={},_0x4702db=0x0,_0x5ef613=!0x1,_0x280a34,_0x39603b=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x1d83d9[_0x4b2d05(0x1d9)]){if(_0xdc93f7){if(_0x8643d3=_0x9da90c[_0x4b2d05(0x1ea)],_0x8643d3>_0x1d83d9[_0x4b2d05(0x1df)]){for(_0x5488bd=0x0,_0x18dfb8=_0x1d83d9[_0x4b2d05(0x1df)],_0x8681a1=_0x5488bd;_0x8681a1<_0x18dfb8;_0x8681a1++)_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x238)](_0x2eacc1,_0x9da90c,_0x1137d9,_0x8681a1,_0x1d83d9));_0x49ae04[_0x4b2d05(0x1c4)]=!0x0;}else{for(_0x5488bd=0x0,_0x18dfb8=_0x8643d3,_0x8681a1=_0x5488bd;_0x8681a1<_0x18dfb8;_0x8681a1++)_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x238)](_0x2eacc1,_0x9da90c,_0x1137d9,_0x8681a1,_0x1d83d9));}_0x1d83d9[_0x4b2d05(0x209)]+=_0x1419da[_0x4b2d05(0x1ea)];}if(!(_0x1137d9===_0x4b2d05(0x235)||_0x1137d9===_0x4b2d05(0x1cc))&&!_0x2053cf&&_0x1137d9!==_0x4b2d05(0x203)&&_0x1137d9!==_0x4b2d05(0x1ce)&&_0x1137d9!==_0x4b2d05(0x1d7)){var _0x1022d4=_0x4be738[_0x4b2d05(0x256)]||_0x1d83d9[_0x4b2d05(0x256)];if(this[_0x4b2d05(0x26c)](_0x9da90c)?(_0x8681a1=0x0,_0x9da90c['forEach'](function(_0x250128){var _0x1f5bba=_0x4b2d05;if(_0x4702db++,_0x1d83d9[_0x1f5bba(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;return;}if(!_0x1d83d9['isExpressionToEvaluate']&&_0x1d83d9[_0x1f5bba(0x246)]&&_0x1d83d9[_0x1f5bba(0x209)]>_0x1d83d9[_0x1f5bba(0x259)]){_0x5ef613=!0x0;return;}_0x1419da[_0x1f5bba(0x275)](_0x1bc91c[_0x1f5bba(0x238)](_0x2eacc1,_0x9da90c,_0x1f5bba(0x1bc),_0x8681a1++,_0x1d83d9,function(_0x5d627b){return function(){return _0x5d627b;};}(_0x250128)));})):this[_0x4b2d05(0x270)](_0x9da90c)&&_0x9da90c[_0x4b2d05(0x216)](function(_0x37e522,_0x19f7fc){var _0x3d34f6=_0x4b2d05;if(_0x4702db++,_0x1d83d9[_0x3d34f6(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;return;}if(!_0x1d83d9[_0x3d34f6(0x213)]&&_0x1d83d9[_0x3d34f6(0x246)]&&_0x1d83d9[_0x3d34f6(0x209)]>_0x1d83d9[_0x3d34f6(0x259)]){_0x5ef613=!0x0;return;}var _0x15e54a=_0x19f7fc[_0x3d34f6(0x1fd)]();_0x15e54a[_0x3d34f6(0x1ea)]>0x64&&(_0x15e54a=_0x15e54a[_0x3d34f6(0x1f2)](0x0,0x64)+_0x3d34f6(0x1ca)),_0x1419da[_0x3d34f6(0x275)](_0x1bc91c['_addProperty'](_0x2eacc1,_0x9da90c,_0x3d34f6(0x267),_0x15e54a,_0x1d83d9,function(_0x1b37ca){return function(){return _0x1b37ca;};}(_0x37e522)));}),!_0x2d331a){try{for(_0x4941cc in _0x9da90c)if(!(_0xdc93f7&&_0x39603b[_0x4b2d05(0x19d)](_0x4941cc))&&!this[_0x4b2d05(0x292)](_0x9da90c,_0x4941cc,_0x1d83d9)){if(_0x4702db++,_0x1d83d9[_0x4b2d05(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;break;}if(!_0x1d83d9['isExpressionToEvaluate']&&_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9[_0x4b2d05(0x209)]>_0x1d83d9[_0x4b2d05(0x259)]){_0x5ef613=!0x0;break;}_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x1d8)](_0x2eacc1,_0x197782,_0x9da90c,_0x1137d9,_0x4941cc,_0x1d83d9));}}catch{}if(_0x197782[_0x4b2d05(0x1fb)]=!0x0,_0x278cfd&&(_0x197782[_0x4b2d05(0x27b)]=!0x0),!_0x5ef613){var _0x1d0e8b=[]['concat'](this[_0x4b2d05(0x1dc)](_0x9da90c))[_0x4b2d05(0x1e7)](this[_0x4b2d05(0x19c)](_0x9da90c));for(_0x8681a1=0x0,_0x8643d3=_0x1d0e8b['length'];_0x8681a1<_0x8643d3;_0x8681a1++)if(_0x4941cc=_0x1d0e8b[_0x8681a1],!(_0xdc93f7&&_0x39603b[_0x4b2d05(0x19d)](_0x4941cc['toString']()))&&!this[_0x4b2d05(0x292)](_0x9da90c,_0x4941cc,_0x1d83d9)&&!_0x197782['_p_'+_0x4941cc[_0x4b2d05(0x1fd)]()]){if(_0x4702db++,_0x1d83d9[_0x4b2d05(0x209)]++,_0x4702db>_0x1022d4){_0x5ef613=!0x0;break;}if(!_0x1d83d9[_0x4b2d05(0x213)]&&_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9[_0x4b2d05(0x209)]>_0x1d83d9[_0x4b2d05(0x259)]){_0x5ef613=!0x0;break;}_0x1419da[_0x4b2d05(0x275)](_0x1bc91c[_0x4b2d05(0x1d8)](_0x2eacc1,_0x197782,_0x9da90c,_0x1137d9,_0x4941cc,_0x1d83d9));}}}}}if(_0x49ae04['type']=_0x1137d9,_0x5da180?(_0x49ae04['value']=_0x9da90c[_0x4b2d05(0x1c6)](),this[_0x4b2d05(0x243)](_0x1137d9,_0x49ae04,_0x1d83d9,_0x4be738)):_0x1137d9===_0x4b2d05(0x1e9)?_0x49ae04[_0x4b2d05(0x295)]=this[_0x4b2d05(0x1cf)][_0x4b2d05(0x1cb)](_0x9da90c):_0x1137d9===_0x4b2d05(0x1d7)?_0x49ae04[_0x4b2d05(0x295)]=_0x9da90c[_0x4b2d05(0x1fd)]():_0x1137d9===_0x4b2d05(0x260)?_0x49ae04[_0x4b2d05(0x295)]=this[_0x4b2d05(0x19b)]['call'](_0x9da90c):_0x1137d9===_0x4b2d05(0x274)&&this['_Symbol']?_0x49ae04[_0x4b2d05(0x295)]=this[_0x4b2d05(0x1d0)]['prototype'][_0x4b2d05(0x1fd)]['call'](_0x9da90c):!_0x1d83d9['depth']&&!(_0x1137d9===_0x4b2d05(0x235)||_0x1137d9===_0x4b2d05(0x1cc))&&(delete _0x49ae04[_0x4b2d05(0x295)],_0x49ae04['capped']=!0x0),_0x5ef613&&(_0x49ae04[_0x4b2d05(0x20e)]=!0x0),_0x280a34=_0x1d83d9[_0x4b2d05(0x24b)][_0x4b2d05(0x277)],_0x1d83d9[_0x4b2d05(0x24b)][_0x4b2d05(0x277)]=_0x49ae04,this[_0x4b2d05(0x219)](_0x49ae04,_0x1d83d9),_0x1419da['length']){for(_0x8681a1=0x0,_0x8643d3=_0x1419da[_0x4b2d05(0x1ea)];_0x8681a1<_0x8643d3;_0x8681a1++)_0x1419da[_0x8681a1](_0x8681a1);}_0x2eacc1[_0x4b2d05(0x1ea)]&&(_0x49ae04[_0x4b2d05(0x256)]=_0x2eacc1);}catch(_0x44201b){_0x1f691c(_0x44201b,_0x49ae04,_0x1d83d9);}this[_0x4b2d05(0x225)](_0x9da90c,_0x49ae04),this[_0x4b2d05(0x253)](_0x49ae04,_0x1d83d9),_0x1d83d9[_0x4b2d05(0x24b)][_0x4b2d05(0x277)]=_0x280a34,_0x1d83d9[_0x4b2d05(0x1b8)]--,_0x1d83d9[_0x4b2d05(0x246)]=_0x45edbb,_0x1d83d9[_0x4b2d05(0x246)]&&_0x1d83d9[_0x4b2d05(0x27c)][_0x4b2d05(0x1a1)]();}finally{_0x248a37&&(_0x2c74a1[_0x4b2d05(0x251)][_0x4b2d05(0x1bf)]=_0x248a37);}return _0x49ae04;}[_0x232a7a(0x19c)](_0x542f92){var _0x54ad8f=_0x232a7a;return Object[_0x54ad8f(0x234)]?Object[_0x54ad8f(0x234)](_0x542f92):[];}[_0x232a7a(0x26c)](_0x38ae69){var _0x39bc01=_0x232a7a;return!!(_0x38ae69&&_0x2c74a1[_0x39bc01(0x1bc)]&&this['_objectToString'](_0x38ae69)===_0x39bc01(0x296)&&_0x38ae69[_0x39bc01(0x216)]);}[_0x232a7a(0x292)](_0x15a428,_0xa9f49c,_0x27da54){var _0x17835f=_0x232a7a;return _0x27da54[_0x17835f(0x23b)]?typeof _0x15a428[_0xa9f49c]==_0x17835f(0x23d):!0x1;}[_0x232a7a(0x24e)](_0xdeb2fd){var _0x38e0e7=_0x232a7a,_0x127a0c='';return _0x127a0c=typeof _0xdeb2fd,_0x127a0c===_0x38e0e7(0x263)?this[_0x38e0e7(0x262)](_0xdeb2fd)==='[object\\x20Array]'?_0x127a0c=_0x38e0e7(0x1aa):this['_objectToString'](_0xdeb2fd)===_0x38e0e7(0x27e)?_0x127a0c=_0x38e0e7(0x1e9):this['_objectToString'](_0xdeb2fd)===_0x38e0e7(0x20f)?_0x127a0c=_0x38e0e7(0x1d7):_0xdeb2fd===null?_0x127a0c=_0x38e0e7(0x235):_0xdeb2fd[_0x38e0e7(0x1f5)]&&(_0x127a0c=_0xdeb2fd[_0x38e0e7(0x1f5)][_0x38e0e7(0x25f)]||_0x127a0c):_0x127a0c===_0x38e0e7(0x1cc)&&this[_0x38e0e7(0x1ba)]&&_0xdeb2fd instanceof this[_0x38e0e7(0x1ba)]&&(_0x127a0c=_0x38e0e7(0x28a)),_0x127a0c;}['_objectToString'](_0x3f2ab7){var _0x259490=_0x232a7a;return Object[_0x259490(0x287)]['toString'][_0x259490(0x1cb)](_0x3f2ab7);}[_0x232a7a(0x1ae)](_0x36e2ac){var _0x1c3f76=_0x232a7a;return _0x36e2ac===_0x1c3f76(0x276)||_0x36e2ac===_0x1c3f76(0x21a)||_0x36e2ac===_0x1c3f76(0x1bd);}[_0x232a7a(0x1b5)](_0x5c4339){var _0x4a8759=_0x232a7a;return _0x5c4339==='Boolean'||_0x5c4339==='String'||_0x5c4339===_0x4a8759(0x1a9);}[_0x232a7a(0x238)](_0x117932,_0x4d208e,_0x419681,_0x55bef0,_0x2d79e0,_0x46117c){var _0x55195f=this;return function(_0x43fd0d){var _0x3d27bf=_0x2e24,_0x354a1c=_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x277)],_0x2f177f=_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x1e6)],_0x2e8669=_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x22b)];_0x2d79e0[_0x3d27bf(0x24b)][_0x3d27bf(0x22b)]=_0x354a1c,_0x2d79e0['node']['index']=typeof _0x55bef0=='number'?_0x55bef0:_0x43fd0d,_0x117932[_0x3d27bf(0x275)](_0x55195f[_0x3d27bf(0x28d)](_0x4d208e,_0x419681,_0x55bef0,_0x2d79e0,_0x46117c)),_0x2d79e0['node'][_0x3d27bf(0x22b)]=_0x2e8669,_0x2d79e0['node'][_0x3d27bf(0x1e6)]=_0x2f177f;};}[_0x232a7a(0x1d8)](_0x1efc2f,_0x6214a1,_0x3fb851,_0xcf466f,_0x2a14b4,_0x2b4d6c,_0x2c80ff){var _0x195935=_0x232a7a,_0x29d0e3=this;return _0x6214a1[_0x195935(0x21d)+_0x2a14b4[_0x195935(0x1fd)]()]=!0x0,function(_0x414af4){var _0x560aa6=_0x195935,_0x5934da=_0x2b4d6c[_0x560aa6(0x24b)]['current'],_0x2de0c5=_0x2b4d6c[_0x560aa6(0x24b)][_0x560aa6(0x1e6)],_0x484668=_0x2b4d6c['node'][_0x560aa6(0x22b)];_0x2b4d6c[_0x560aa6(0x24b)][_0x560aa6(0x22b)]=_0x5934da,_0x2b4d6c['node'][_0x560aa6(0x1e6)]=_0x414af4,_0x1efc2f[_0x560aa6(0x275)](_0x29d0e3['_property'](_0x3fb851,_0xcf466f,_0x2a14b4,_0x2b4d6c,_0x2c80ff)),_0x2b4d6c['node']['parent']=_0x484668,_0x2b4d6c[_0x560aa6(0x24b)][_0x560aa6(0x1e6)]=_0x2de0c5;};}[_0x232a7a(0x28d)](_0x4458bd,_0x267de1,_0x35ed86,_0x2cf676,_0x26ade6){var _0x3e4ffa=_0x232a7a,_0x38e5ec=this;_0x26ade6||(_0x26ade6=function(_0x1fbec3,_0x3c9be6){return _0x1fbec3[_0x3c9be6];});var _0x3e7132=_0x35ed86[_0x3e4ffa(0x1fd)](),_0x35c3fe=_0x2cf676[_0x3e4ffa(0x282)]||{},_0x7ee7ab=_0x2cf676[_0x3e4ffa(0x1d9)],_0x3e4608=_0x2cf676[_0x3e4ffa(0x213)];try{var _0xd9fb34=this[_0x3e4ffa(0x270)](_0x4458bd),_0x41a561=_0x3e7132;_0xd9fb34&&_0x41a561[0x0]==='\\x27'&&(_0x41a561=_0x41a561[_0x3e4ffa(0x252)](0x1,_0x41a561[_0x3e4ffa(0x1ea)]-0x2));var _0x8bcab3=_0x2cf676['expressionsToEvaluate']=_0x35c3fe[_0x3e4ffa(0x21d)+_0x41a561];_0x8bcab3&&(_0x2cf676[_0x3e4ffa(0x1d9)]=_0x2cf676[_0x3e4ffa(0x1d9)]+0x1),_0x2cf676[_0x3e4ffa(0x213)]=!!_0x8bcab3;var _0x454b5f=typeof _0x35ed86==_0x3e4ffa(0x274),_0x273190={'name':_0x454b5f||_0xd9fb34?_0x3e7132:this[_0x3e4ffa(0x297)](_0x3e7132)};if(_0x454b5f&&(_0x273190[_0x3e4ffa(0x274)]=!0x0),!(_0x267de1===_0x3e4ffa(0x1aa)||_0x267de1===_0x3e4ffa(0x266))){var _0x10baf4=this[_0x3e4ffa(0x222)](_0x4458bd,_0x35ed86);if(_0x10baf4&&(_0x10baf4['set']&&(_0x273190[_0x3e4ffa(0x21f)]=!0x0),_0x10baf4[_0x3e4ffa(0x1eb)]&&!_0x8bcab3&&!_0x2cf676[_0x3e4ffa(0x272)]))return _0x273190[_0x3e4ffa(0x229)]=!0x0,this[_0x3e4ffa(0x1f0)](_0x273190,_0x2cf676),_0x273190;}var _0x58380d;try{_0x58380d=_0x26ade6(_0x4458bd,_0x35ed86);}catch(_0x153e11){return _0x273190={'name':_0x3e7132,'type':_0x3e4ffa(0x1e2),'error':_0x153e11[_0x3e4ffa(0x206)]},this[_0x3e4ffa(0x1f0)](_0x273190,_0x2cf676),_0x273190;}var _0x424a9b=this[_0x3e4ffa(0x24e)](_0x58380d),_0x71c036=this[_0x3e4ffa(0x1ae)](_0x424a9b);if(_0x273190[_0x3e4ffa(0x1b0)]=_0x424a9b,_0x71c036)this['_processTreeNodeResult'](_0x273190,_0x2cf676,_0x58380d,function(){var _0xe7ff01=_0x3e4ffa;_0x273190[_0xe7ff01(0x295)]=_0x58380d[_0xe7ff01(0x1c6)](),!_0x8bcab3&&_0x38e5ec[_0xe7ff01(0x243)](_0x424a9b,_0x273190,_0x2cf676,{});});else{var _0x147bd1=_0x2cf676[_0x3e4ffa(0x246)]&&_0x2cf676[_0x3e4ffa(0x1b8)]<_0x2cf676[_0x3e4ffa(0x258)]&&_0x2cf676[_0x3e4ffa(0x27c)][_0x3e4ffa(0x257)](_0x58380d)<0x0&&_0x424a9b!==_0x3e4ffa(0x23d)&&_0x2cf676[_0x3e4ffa(0x209)]<_0x2cf676[_0x3e4ffa(0x259)];_0x147bd1||_0x2cf676[_0x3e4ffa(0x1b8)]<_0x7ee7ab||_0x8bcab3?(this[_0x3e4ffa(0x1af)](_0x273190,_0x58380d,_0x2cf676,_0x8bcab3||{}),this[_0x3e4ffa(0x225)](_0x58380d,_0x273190)):this[_0x3e4ffa(0x1f0)](_0x273190,_0x2cf676,_0x58380d,function(){var _0x2cc01=_0x3e4ffa;_0x424a9b===_0x2cc01(0x235)||_0x424a9b==='undefined'||(delete _0x273190['value'],_0x273190['capped']=!0x0);});}return _0x273190;}finally{_0x2cf676['expressionsToEvaluate']=_0x35c3fe,_0x2cf676[_0x3e4ffa(0x1d9)]=_0x7ee7ab,_0x2cf676['isExpressionToEvaluate']=_0x3e4608;}}[_0x232a7a(0x243)](_0x45851a,_0x565654,_0x21786e,_0x752dc3){var _0x12df4b=_0x232a7a,_0x33696a=_0x752dc3[_0x12df4b(0x208)]||_0x21786e[_0x12df4b(0x208)];if((_0x45851a===_0x12df4b(0x21a)||_0x45851a===_0x12df4b(0x203))&&_0x565654[_0x12df4b(0x295)]){let _0x2f154e=_0x565654[_0x12df4b(0x295)][_0x12df4b(0x1ea)];_0x21786e[_0x12df4b(0x1e1)]+=_0x2f154e,_0x21786e['allStrLength']>_0x21786e['totalStrLength']?(_0x565654[_0x12df4b(0x1f3)]='',delete _0x565654[_0x12df4b(0x295)]):_0x2f154e>_0x33696a&&(_0x565654[_0x12df4b(0x1f3)]=_0x565654[_0x12df4b(0x295)]['substr'](0x0,_0x33696a),delete _0x565654[_0x12df4b(0x295)]);}}[_0x232a7a(0x270)](_0xc2a3bd){var _0x44e1d2=_0x232a7a;return!!(_0xc2a3bd&&_0x2c74a1[_0x44e1d2(0x267)]&&this[_0x44e1d2(0x262)](_0xc2a3bd)===_0x44e1d2(0x24d)&&_0xc2a3bd[_0x44e1d2(0x216)]);}[_0x232a7a(0x297)](_0x1589a5){var _0x373aa8=_0x232a7a;if(_0x1589a5[_0x373aa8(0x231)](/^\\d+$/))return _0x1589a5;var _0x139d00;try{_0x139d00=JSON['stringify'](''+_0x1589a5);}catch{_0x139d00='\\x22'+this[_0x373aa8(0x262)](_0x1589a5)+'\\x22';}return _0x139d00[_0x373aa8(0x231)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x139d00=_0x139d00['substr'](0x1,_0x139d00[_0x373aa8(0x1ea)]-0x2):_0x139d00=_0x139d00[_0x373aa8(0x1c9)](/'/g,'\\x5c\\x27')['replace'](/\\\\\"/g,'\\x22')[_0x373aa8(0x1c9)](/(^\"|\"$)/g,'\\x27'),_0x139d00;}[_0x232a7a(0x1f0)](_0x4a452f,_0x113a40,_0x47b3af,_0x5e01e9){var _0x485570=_0x232a7a;this[_0x485570(0x219)](_0x4a452f,_0x113a40),_0x5e01e9&&_0x5e01e9(),this['_additionalMetadata'](_0x47b3af,_0x4a452f),this['_treeNodePropertiesAfterFullValue'](_0x4a452f,_0x113a40);}[_0x232a7a(0x219)](_0x8282fe,_0x1742cb){var _0x385817=_0x232a7a;this[_0x385817(0x249)](_0x8282fe,_0x1742cb),this['_setNodeQueryPath'](_0x8282fe,_0x1742cb),this[_0x385817(0x19e)](_0x8282fe,_0x1742cb),this[_0x385817(0x212)](_0x8282fe,_0x1742cb);}[_0x232a7a(0x249)](_0xb6d5ef,_0x19e3e3){}[_0x232a7a(0x26e)](_0x236d15,_0x5215e4){}['_setNodeLabel'](_0x1246a6,_0xeac755){}[_0x232a7a(0x278)](_0x491756){var _0x18ccfb=_0x232a7a;return _0x491756===this[_0x18ccfb(0x28e)];}[_0x232a7a(0x253)](_0x5a9d3c,_0x11fa46){var _0x2d59cb=_0x232a7a;this[_0x2d59cb(0x1a5)](_0x5a9d3c,_0x11fa46),this[_0x2d59cb(0x1b4)](_0x5a9d3c),_0x11fa46[_0x2d59cb(0x1d6)]&&this[_0x2d59cb(0x1b6)](_0x5a9d3c),this[_0x2d59cb(0x1a2)](_0x5a9d3c,_0x11fa46),this['_addLoadNode'](_0x5a9d3c,_0x11fa46),this[_0x2d59cb(0x24f)](_0x5a9d3c);}[_0x232a7a(0x225)](_0x232826,_0x4b9f58){var _0x3082b7=_0x232a7a;try{_0x232826&&typeof _0x232826[_0x3082b7(0x1ea)]=='number'&&(_0x4b9f58[_0x3082b7(0x1ea)]=_0x232826[_0x3082b7(0x1ea)]);}catch{}if(_0x4b9f58[_0x3082b7(0x1b0)]===_0x3082b7(0x1bd)||_0x4b9f58[_0x3082b7(0x1b0)]==='Number'){if(isNaN(_0x4b9f58[_0x3082b7(0x295)]))_0x4b9f58[_0x3082b7(0x207)]=!0x0,delete _0x4b9f58['value'];else switch(_0x4b9f58[_0x3082b7(0x295)]){case Number[_0x3082b7(0x205)]:_0x4b9f58[_0x3082b7(0x1e0)]=!0x0,delete _0x4b9f58['value'];break;case Number[_0x3082b7(0x22d)]:_0x4b9f58[_0x3082b7(0x23a)]=!0x0,delete _0x4b9f58[_0x3082b7(0x295)];break;case 0x0:this[_0x3082b7(0x1c8)](_0x4b9f58['value'])&&(_0x4b9f58[_0x3082b7(0x273)]=!0x0);break;}}else _0x4b9f58[_0x3082b7(0x1b0)]===_0x3082b7(0x23d)&&typeof _0x232826[_0x3082b7(0x25f)]==_0x3082b7(0x21a)&&_0x232826[_0x3082b7(0x25f)]&&_0x4b9f58['name']&&_0x232826['name']!==_0x4b9f58[_0x3082b7(0x25f)]&&(_0x4b9f58['funcName']=_0x232826[_0x3082b7(0x25f)]);}[_0x232a7a(0x1c8)](_0x23999d){var _0x589ffd=_0x232a7a;return 0x1/_0x23999d===Number[_0x589ffd(0x22d)];}[_0x232a7a(0x1b6)](_0x1c992d){var _0x19fa7d=_0x232a7a;!_0x1c992d['props']||!_0x1c992d['props'][_0x19fa7d(0x1ea)]||_0x1c992d[_0x19fa7d(0x1b0)]==='array'||_0x1c992d['type']===_0x19fa7d(0x267)||_0x1c992d[_0x19fa7d(0x1b0)]===_0x19fa7d(0x1bc)||_0x1c992d[_0x19fa7d(0x256)][_0x19fa7d(0x293)](function(_0x107d4f,_0x34b1ba){var _0x2f7eea=_0x19fa7d,_0x541262=_0x107d4f['name'][_0x2f7eea(0x1a6)](),_0x2d39c7=_0x34b1ba[_0x2f7eea(0x25f)][_0x2f7eea(0x1a6)]();return _0x541262<_0x2d39c7?-0x1:_0x541262>_0x2d39c7?0x1:0x0;});}['_addFunctionsNode'](_0x2b9ea1,_0x22d5bb){var _0x44ec76=_0x232a7a;if(!(_0x22d5bb[_0x44ec76(0x23b)]||!_0x2b9ea1[_0x44ec76(0x256)]||!_0x2b9ea1[_0x44ec76(0x256)]['length'])){for(var _0x359fac=[],_0x371dac=[],_0x5d4817=0x0,_0x3e36f0=_0x2b9ea1[_0x44ec76(0x256)][_0x44ec76(0x1ea)];_0x5d4817<_0x3e36f0;_0x5d4817++){var _0x5f8c99=_0x2b9ea1[_0x44ec76(0x256)][_0x5d4817];_0x5f8c99[_0x44ec76(0x1b0)]===_0x44ec76(0x23d)?_0x359fac[_0x44ec76(0x275)](_0x5f8c99):_0x371dac[_0x44ec76(0x275)](_0x5f8c99);}if(!(!_0x371dac[_0x44ec76(0x1ea)]||_0x359fac['length']<=0x1)){_0x2b9ea1[_0x44ec76(0x256)]=_0x371dac;var _0x45220f={'functionsNode':!0x0,'props':_0x359fac};this[_0x44ec76(0x249)](_0x45220f,_0x22d5bb),this[_0x44ec76(0x1a5)](_0x45220f,_0x22d5bb),this[_0x44ec76(0x1b4)](_0x45220f),this[_0x44ec76(0x212)](_0x45220f,_0x22d5bb),_0x45220f['id']+='\\x20f',_0x2b9ea1[_0x44ec76(0x256)]['unshift'](_0x45220f);}}}[_0x232a7a(0x22c)](_0x49e57e,_0x13ed5c){}[_0x232a7a(0x1b4)](_0x371327){}['_isArray'](_0x48cadd){var _0x34d01a=_0x232a7a;return Array['isArray'](_0x48cadd)||typeof _0x48cadd==_0x34d01a(0x263)&&this[_0x34d01a(0x262)](_0x48cadd)===_0x34d01a(0x210);}[_0x232a7a(0x212)](_0x9d6136,_0x2c5978){}['_cleanNode'](_0x595985){var _0x4f2455=_0x232a7a;delete _0x595985[_0x4f2455(0x27a)],delete _0x595985['_hasSetOnItsPath'],delete _0x595985[_0x4f2455(0x1d4)];}[_0x232a7a(0x19e)](_0x3370b0,_0x8723a6){}}let _0x55fdf5=new _0x28a98e(),_0x3e4609={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x28f4a9={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x11b35a(_0x4aac6a,_0x3d4820,_0x5c9507,_0x40f69e,_0x23b05b,_0x589616){var _0x298f49=_0x232a7a;let _0x3689d0,_0x539091;try{_0x539091=_0xa56f56(),_0x3689d0=_0x5ab174[_0x3d4820],!_0x3689d0||_0x539091-_0x3689d0['ts']>0x1f4&&_0x3689d0[_0x298f49(0x1c7)]&&_0x3689d0[_0x298f49(0x291)]/_0x3689d0[_0x298f49(0x1c7)]<0x64?(_0x5ab174[_0x3d4820]=_0x3689d0={'count':0x0,'time':0x0,'ts':_0x539091},_0x5ab174[_0x298f49(0x1a7)]={}):_0x539091-_0x5ab174[_0x298f49(0x1a7)]['ts']>0x32&&_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x1c7)]&&_0x5ab174['hits'][_0x298f49(0x291)]/_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x1c7)]<0x64&&(_0x5ab174['hits']={});let _0x2e678e=[],_0x519301=_0x3689d0['reduceLimits']||_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x298)]?_0x28f4a9:_0x3e4609,_0x573693=_0x1b2838=>{var _0x2d17bd=_0x298f49;let _0x27baa3={};return _0x27baa3[_0x2d17bd(0x256)]=_0x1b2838['props'],_0x27baa3[_0x2d17bd(0x1df)]=_0x1b2838[_0x2d17bd(0x1df)],_0x27baa3[_0x2d17bd(0x208)]=_0x1b2838[_0x2d17bd(0x208)],_0x27baa3[_0x2d17bd(0x1de)]=_0x1b2838[_0x2d17bd(0x1de)],_0x27baa3[_0x2d17bd(0x259)]=_0x1b2838[_0x2d17bd(0x259)],_0x27baa3[_0x2d17bd(0x258)]=_0x1b2838[_0x2d17bd(0x258)],_0x27baa3[_0x2d17bd(0x1d6)]=!0x1,_0x27baa3[_0x2d17bd(0x23b)]=!_0x27df16,_0x27baa3[_0x2d17bd(0x1d9)]=0x1,_0x27baa3[_0x2d17bd(0x1b8)]=0x0,_0x27baa3[_0x2d17bd(0x1fe)]=_0x2d17bd(0x224),_0x27baa3[_0x2d17bd(0x1c0)]=_0x2d17bd(0x269),_0x27baa3[_0x2d17bd(0x246)]=!0x0,_0x27baa3['autoExpandPreviousObjects']=[],_0x27baa3[_0x2d17bd(0x209)]=0x0,_0x27baa3[_0x2d17bd(0x272)]=!0x0,_0x27baa3[_0x2d17bd(0x1e1)]=0x0,_0x27baa3[_0x2d17bd(0x24b)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x27baa3;};for(var _0x4c2602=0x0;_0x4c2602<_0x23b05b[_0x298f49(0x1ea)];_0x4c2602++)_0x2e678e[_0x298f49(0x275)](_0x55fdf5[_0x298f49(0x1af)]({'timeNode':_0x4aac6a==='time'||void 0x0},_0x23b05b[_0x4c2602],_0x573693(_0x519301),{}));if(_0x4aac6a==='trace'||_0x4aac6a==='error'){let _0x875231=Error[_0x298f49(0x1e8)];try{Error[_0x298f49(0x1e8)]=0x1/0x0,_0x2e678e[_0x298f49(0x275)](_0x55fdf5[_0x298f49(0x1af)]({'stackNode':!0x0},new Error()[_0x298f49(0x24a)],_0x573693(_0x519301),{'strLength':0x1/0x0}));}finally{Error[_0x298f49(0x1e8)]=_0x875231;}}return{'method':_0x298f49(0x1c3),'version':_0x104ce9,'args':[{'ts':_0x5c9507,'session':_0x40f69e,'args':_0x2e678e,'id':_0x3d4820,'context':_0x589616}]};}catch(_0x2a3019){return{'method':_0x298f49(0x1c3),'version':_0x104ce9,'args':[{'ts':_0x5c9507,'session':_0x40f69e,'args':[{'type':_0x298f49(0x1e2),'error':_0x2a3019&&_0x2a3019[_0x298f49(0x206)]}],'id':_0x3d4820,'context':_0x589616}]};}finally{try{if(_0x3689d0&&_0x539091){let _0x4bf5ed=_0xa56f56();_0x3689d0[_0x298f49(0x1c7)]++,_0x3689d0[_0x298f49(0x291)]+=_0x529ec8(_0x539091,_0x4bf5ed),_0x3689d0['ts']=_0x4bf5ed,_0x5ab174['hits'][_0x298f49(0x1c7)]++,_0x5ab174['hits'][_0x298f49(0x291)]+=_0x529ec8(_0x539091,_0x4bf5ed),_0x5ab174[_0x298f49(0x1a7)]['ts']=_0x4bf5ed,(_0x3689d0['count']>0x32||_0x3689d0[_0x298f49(0x291)]>0x64)&&(_0x3689d0['reduceLimits']=!0x0),(_0x5ab174[_0x298f49(0x1a7)]['count']>0x3e8||_0x5ab174[_0x298f49(0x1a7)][_0x298f49(0x291)]>0x12c)&&(_0x5ab174['hits'][_0x298f49(0x298)]=!0x0);}}catch{}}}return _0x11b35a;}((_0x4712fb,_0x15d38b,_0x573e79,_0x3dc472,_0x44cb13,_0x287b69,_0x304ca3,_0x5598ad,_0x5918eb,_0x3f4700,_0x4c4a2f)=>{var _0xdcec52=_0x4babf5;if(_0x4712fb[_0xdcec52(0x1c5)])return _0x4712fb[_0xdcec52(0x1c5)];if(!X(_0x4712fb,_0x5598ad,_0x44cb13))return _0x4712fb[_0xdcec52(0x1c5)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x4712fb[_0xdcec52(0x1c5)];let _0x17370c=B(_0x4712fb),_0x1242b1=_0x17370c[_0xdcec52(0x289)],_0x1edf02=_0x17370c[_0xdcec52(0x1ab)],_0x5d1b43=_0x17370c[_0xdcec52(0x299)],_0x86f1d={'hits':{},'ts':{}},_0x256215=J(_0x4712fb,_0x5918eb,_0x86f1d,_0x287b69),_0x1b6b47=_0x5d4746=>{_0x86f1d['ts'][_0x5d4746]=_0x1edf02();},_0x453cdc=(_0x4686cc,_0x3554e1)=>{var _0x36c3de=_0xdcec52;let _0x94fd40=_0x86f1d['ts'][_0x3554e1];if(delete _0x86f1d['ts'][_0x3554e1],_0x94fd40){let _0x1c92c7=_0x1242b1(_0x94fd40,_0x1edf02());_0x5f21dd(_0x256215(_0x36c3de(0x291),_0x4686cc,_0x5d1b43(),_0x23d25d,[_0x1c92c7],_0x3554e1));}},_0x15a35c=_0x604a02=>{var _0x2e3ab8=_0xdcec52,_0x3a1412;return _0x44cb13===_0x2e3ab8(0x1ff)&&_0x4712fb[_0x2e3ab8(0x21c)]&&((_0x3a1412=_0x604a02==null?void 0x0:_0x604a02['args'])==null?void 0x0:_0x3a1412['length'])&&(_0x604a02[_0x2e3ab8(0x204)][0x0][_0x2e3ab8(0x21c)]=_0x4712fb[_0x2e3ab8(0x21c)]),_0x604a02;};_0x4712fb[_0xdcec52(0x1c5)]={'consoleLog':(_0x1aee00,_0x5191cc)=>{var _0xc04f30=_0xdcec52;_0x4712fb['console'][_0xc04f30(0x1c3)][_0xc04f30(0x25f)]!==_0xc04f30(0x247)&&_0x5f21dd(_0x256215(_0xc04f30(0x1c3),_0x1aee00,_0x5d1b43(),_0x23d25d,_0x5191cc));},'consoleTrace':(_0xb7ebb7,_0x174720)=>{var _0x5cd7c2=_0xdcec52,_0x17e996,_0x165b65;_0x4712fb[_0x5cd7c2(0x251)]['log'][_0x5cd7c2(0x25f)]!==_0x5cd7c2(0x25c)&&((_0x165b65=(_0x17e996=_0x4712fb[_0x5cd7c2(0x233)])==null?void 0x0:_0x17e996[_0x5cd7c2(0x1f4)])!=null&&_0x165b65['node']&&(_0x4712fb[_0x5cd7c2(0x223)]=!0x0),_0x5f21dd(_0x15a35c(_0x256215(_0x5cd7c2(0x240),_0xb7ebb7,_0x5d1b43(),_0x23d25d,_0x174720))));},'consoleError':(_0x34186b,_0x3d1f65)=>{var _0x2d72e3=_0xdcec52;_0x4712fb[_0x2d72e3(0x223)]=!0x0,_0x5f21dd(_0x15a35c(_0x256215(_0x2d72e3(0x1bf),_0x34186b,_0x5d1b43(),_0x23d25d,_0x3d1f65)));},'consoleTime':_0x7e3406=>{_0x1b6b47(_0x7e3406);},'consoleTimeEnd':(_0x23e9dd,_0x4e8f0f)=>{_0x453cdc(_0x4e8f0f,_0x23e9dd);},'autoLog':(_0x3e09b7,_0x1b7b58)=>{_0x5f21dd(_0x256215('log',_0x1b7b58,_0x5d1b43(),_0x23d25d,[_0x3e09b7]));},'autoLogMany':(_0xc4762b,_0x19d9b7)=>{var _0x3b229b=_0xdcec52;_0x5f21dd(_0x256215(_0x3b229b(0x1c3),_0xc4762b,_0x5d1b43(),_0x23d25d,_0x19d9b7));},'autoTrace':(_0x5ceb2e,_0x1b9c49)=>{var _0x3cf979=_0xdcec52;_0x5f21dd(_0x15a35c(_0x256215(_0x3cf979(0x240),_0x1b9c49,_0x5d1b43(),_0x23d25d,[_0x5ceb2e])));},'autoTraceMany':(_0x59427f,_0x8c92df)=>{var _0xc6f7fd=_0xdcec52;_0x5f21dd(_0x15a35c(_0x256215(_0xc6f7fd(0x240),_0x59427f,_0x5d1b43(),_0x23d25d,_0x8c92df)));},'autoTime':(_0x464fb9,_0x1ad9c7,_0x5195c6)=>{_0x1b6b47(_0x5195c6);},'autoTimeEnd':(_0x44b889,_0x44dc9f,_0x22a3b4)=>{_0x453cdc(_0x44dc9f,_0x22a3b4);},'coverage':_0x36b849=>{_0x5f21dd({'method':'coverage','version':_0x287b69,'args':[{'id':_0x36b849}]});}};let _0x5f21dd=H(_0x4712fb,_0x15d38b,_0x573e79,_0x3dc472,_0x44cb13,_0x3f4700,_0x4c4a2f),_0x23d25d=_0x4712fb[_0xdcec52(0x214)];return _0x4712fb[_0xdcec52(0x1c5)];})(globalThis,'127.0.0.1',_0x4babf5(0x22a),_0x4babf5(0x265),'webpack',_0x4babf5(0x211),_0x4babf5(0x1ee),_0x4babf5(0x264),_0x4babf5(0x239),_0x4babf5(0x1fc),_0x4babf5(0x200));function _0x242e(){var _0x66c921=['disabledLog','__es'+'Module','_setNodeId','stack','node','endsWith','[object\\x20Map]','_type','_cleanNode','path','console','substr','_treeNodePropertiesAfterFullValue','host','69jTMDTX','props','indexOf','autoExpandMaxDepth','autoExpandLimit','_connectToHostNow','method','disabledTrace','_WebSocket','77210mTCgAf','name','RegExp','NEXT_RUNTIME','_objectToString','object',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.172\"],\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.442/node_modules\",'Error','Map','20126pOZtYU','root_exp','eventReceivedCallback','logger\\x20websocket\\x20error','_isSet','hasOwnProperty','_setNodeQueryPath','_reconnectTimeout','_isMap','split','resolveGetters','negativeZero','symbol','push','boolean','current','_isUndefined','map','_hasSymbolPropertyOnItsPath','_p_name','autoExpandPreviousObjects','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','[object\\x20Date]','toUpperCase','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','_ws','expressionsToEvaluate','onopen','enumerable','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','global','prototype','_inBrowser','elapsed','HTMLAllCollection','getOwnPropertyDescriptor','_allowedToConnectOnSend','_property','_undefined','hrtime','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','time','_blacklistedProperty','sort','create','value','[object\\x20Set]','_propertyName','reduceLimits','now','1802160KVdQmP','_regExpToString','_getOwnPropertySymbols','test','_setNodeExpressionPath','_quotedRegExp','827665bZwWik','pop','_addFunctionsNode','gateway.docker.internal','_socket','_setNodeLabel','toLowerCase','hits','onmessage','Number','array','timeStamp','_extendedWarning','%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','_isPrimitiveType','serialize','type','_connecting','dockerizedApp','catch','_setNodeExpandableState','_isPrimitiveWrapperType','_sortProps','url','level','angular','_HTMLAllCollection','performance','Set','number','perf_hooks','error','rootExpression','then','pathToFileURL','log','cappedElements','_console_ninja','valueOf','count','_isNegativeZero','replace','...','call','undefined','port','Buffer','_dateToString','_Symbol','reload','27996YSOPnG','getOwnPropertyNames','_hasMapOnItsPath','defineProperty','sortProps','bigint','_addObjectProperty','depth','getPrototypeOf','data','_getOwnPropertyNames','_sendErrorMessage','totalStrLength','elements','positiveInfinity','allStrLength','unknown','onclose','_attemptToReconnectShortly','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','index','concat','stackTraceLimit','date','length','get','_allowedToSend','18TnDNBF','1747641562748','readyState','_processTreeNodeResult','location','slice','capped','versions','constructor','some','send','_consoleNinjaAllowedToStart','includes','_webSocketErrorDocsLink','_p_length','','toString','expId','next.js','1','astro','edge','String','args','POSITIVE_INFINITY','message','nan','strLength','autoExpandPropertyCount','ws://','onerror','_connected','close','cappedProps','[object\\x20BigInt]','[object\\x20Array]','1.0.0','_setNodePermissions','isExpressionToEvaluate','_console_ninja_session','_WebSocketClass','forEach','join','hostname','_treeNodePropertiesBeforeFullValue','string','\\x20server','origin','_p_','8colGMA','setter','4100928tPJhnK','_maxConnectAttemptCount','_getOwnPropertyDescriptor','_ninjaIgnoreNextError','root_exp_id','_additionalMetadata','unref','_inNextEdge','7sRQumr','getter','63770','parent','_addLoadNode','NEGATIVE_INFINITY','1166aHrZOL','_disposeWebsocket','Symbol','match','749706phyDaI','process','getOwnPropertySymbols','null','nodeModules','charAt','_addProperty','','negativeInfinity','noFunctions','remix','function','env','_connectAttemptCount','trace','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','getWebSocketClass','_capIfString','default','warn','autoExpand'];_0x242e=function(){return _0x66c921;};return _0x242e();}");
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
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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x3ec852=_0x354e;(function(_0x1d3b82,_0x4b4e3f){var _0xde2504=_0x354e,_0xa41f60=_0x1d3b82();while(!![]){try{var _0x216156=-parseInt(_0xde2504(0x228))/0x1*(-parseInt(_0xde2504(0x1de))/0x2)+parseInt(_0xde2504(0x21e))/0x3*(parseInt(_0xde2504(0x270))/0x4)+-parseInt(_0xde2504(0x25f))/0x5*(parseInt(_0xde2504(0x290))/0x6)+-parseInt(_0xde2504(0x20e))/0x7*(-parseInt(_0xde2504(0x1e6))/0x8)+-parseInt(_0xde2504(0x1e1))/0x9*(-parseInt(_0xde2504(0x245))/0xa)+-parseInt(_0xde2504(0x1c3))/0xb+-parseInt(_0xde2504(0x261))/0xc;if(_0x216156===_0x4b4e3f)break;else _0xa41f60['push'](_0xa41f60['shift']());}catch(_0x4bb7a8){_0xa41f60['push'](_0xa41f60['shift']());}}}(_0xa4e2,0xc5ada));function _0x354e(_0x131f29,_0x3d7be2){var _0xa4e21e=_0xa4e2();return _0x354e=function(_0x354ea2,_0x3e54af){_0x354ea2=_0x354ea2-0x1a2;var _0x228cf7=_0xa4e21e[_0x354ea2];return _0x228cf7;},_0x354e(_0x131f29,_0x3d7be2);}var G=Object[_0x3ec852(0x205)],V=Object[_0x3ec852(0x1a8)],ee=Object[_0x3ec852(0x25c)],te=Object[_0x3ec852(0x27e)],ne=Object[_0x3ec852(0x20a)],re=Object[_0x3ec852(0x254)][_0x3ec852(0x209)],ie=(_0x4554d2,_0x125af2,_0x537847,_0x34abab)=>{var _0x348090=_0x3ec852;if(_0x125af2&&typeof _0x125af2==_0x348090(0x27d)||typeof _0x125af2==_0x348090(0x1ee)){for(let _0x3eaef0 of te(_0x125af2))!re['call'](_0x4554d2,_0x3eaef0)&&_0x3eaef0!==_0x537847&&V(_0x4554d2,_0x3eaef0,{'get':()=>_0x125af2[_0x3eaef0],'enumerable':!(_0x34abab=ee(_0x125af2,_0x3eaef0))||_0x34abab[_0x348090(0x286)]});}return _0x4554d2;},j=(_0x42f84b,_0x3fd4f4,_0x320463)=>(_0x320463=_0x42f84b!=null?G(ne(_0x42f84b)):{},ie(_0x3fd4f4||!_0x42f84b||!_0x42f84b[_0x3ec852(0x233)]?V(_0x320463,'default',{'value':_0x42f84b,'enumerable':!0x0}):_0x320463,_0x42f84b)),q=class{constructor(_0x22dd0d,_0x1caeb0,_0x32d725,_0x3a5306,_0x18d716,_0x51ba4f){var _0x31a98b=_0x3ec852,_0x5987ac,_0x1b991a,_0x469238,_0xff1fe0;this[_0x31a98b(0x217)]=_0x22dd0d,this['host']=_0x1caeb0,this[_0x31a98b(0x1d8)]=_0x32d725,this[_0x31a98b(0x1b4)]=_0x3a5306,this['dockerizedApp']=_0x18d716,this[_0x31a98b(0x200)]=_0x51ba4f,this[_0x31a98b(0x260)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this['_connected']=!0x1,this['_connecting']=!0x1,this['_inNextEdge']=((_0x1b991a=(_0x5987ac=_0x22dd0d[_0x31a98b(0x271)])==null?void 0x0:_0x5987ac[_0x31a98b(0x22a)])==null?void 0x0:_0x1b991a[_0x31a98b(0x26c)])==='edge',this[_0x31a98b(0x29a)]=!((_0xff1fe0=(_0x469238=this[_0x31a98b(0x217)][_0x31a98b(0x271)])==null?void 0x0:_0x469238[_0x31a98b(0x239)])!=null&&_0xff1fe0[_0x31a98b(0x26e)])&&!this[_0x31a98b(0x1b7)],this['_WebSocketClass']=null,this[_0x31a98b(0x20c)]=0x0,this[_0x31a98b(0x255)]=0x14,this[_0x31a98b(0x27a)]=_0x31a98b(0x1db),this[_0x31a98b(0x225)]=(this['_inBrowser']?_0x31a98b(0x23e):_0x31a98b(0x1f3))+this['_webSocketErrorDocsLink'];}async[_0x3ec852(0x210)](){var _0x1d2426=_0x3ec852,_0x40e0b4,_0x59a6a2;if(this[_0x1d2426(0x1ca)])return this[_0x1d2426(0x1ca)];let _0x496ffd;if(this['_inBrowser']||this[_0x1d2426(0x1b7)])_0x496ffd=this[_0x1d2426(0x217)]['WebSocket'];else{if((_0x40e0b4=this[_0x1d2426(0x217)]['process'])!=null&&_0x40e0b4['_WebSocket'])_0x496ffd=(_0x59a6a2=this[_0x1d2426(0x217)]['process'])==null?void 0x0:_0x59a6a2[_0x1d2426(0x241)];else try{let _0x37619e=await import('path');_0x496ffd=(await import((await import('url'))[_0x1d2426(0x297)](_0x37619e['join'](this[_0x1d2426(0x1b4)],'ws/index.js'))[_0x1d2426(0x249)]()))[_0x1d2426(0x285)];}catch{try{_0x496ffd=require(require('path')[_0x1d2426(0x1d7)](this[_0x1d2426(0x1b4)],'ws'));}catch{throw new Error(_0x1d2426(0x273));}}}return this[_0x1d2426(0x1ca)]=_0x496ffd,_0x496ffd;}[_0x3ec852(0x1d5)](){var _0x5becb1=_0x3ec852;this[_0x5becb1(0x1e3)]||this[_0x5becb1(0x26f)]||this[_0x5becb1(0x20c)]>=this[_0x5becb1(0x255)]||(this['_allowedToConnectOnSend']=!0x1,this[_0x5becb1(0x1e3)]=!0x0,this['_connectAttemptCount']++,this[_0x5becb1(0x1c8)]=new Promise((_0x2cc56c,_0xfb083f)=>{var _0x43981e=_0x5becb1;this['getWebSocketClass']()[_0x43981e(0x26d)](_0x9f738f=>{var _0x39eb7a=_0x43981e;let _0x1914fd=new _0x9f738f(_0x39eb7a(0x1e9)+(!this[_0x39eb7a(0x29a)]&&this[_0x39eb7a(0x236)]?_0x39eb7a(0x227):this[_0x39eb7a(0x295)])+':'+this[_0x39eb7a(0x1d8)]);_0x1914fd[_0x39eb7a(0x246)]=()=>{var _0x5b0fb5=_0x39eb7a;this[_0x5b0fb5(0x260)]=!0x1,this[_0x5b0fb5(0x1cb)](_0x1914fd),this[_0x5b0fb5(0x20f)](),_0xfb083f(new Error(_0x5b0fb5(0x1ae)));},_0x1914fd[_0x39eb7a(0x23d)]=()=>{var _0x1e3ccf=_0x39eb7a;this['_inBrowser']||_0x1914fd[_0x1e3ccf(0x24a)]&&_0x1914fd['_socket'][_0x1e3ccf(0x28a)]&&_0x1914fd[_0x1e3ccf(0x24a)][_0x1e3ccf(0x28a)](),_0x2cc56c(_0x1914fd);},_0x1914fd['onclose']=()=>{var _0x4a3ee2=_0x39eb7a;this['_allowedToConnectOnSend']=!0x0,this[_0x4a3ee2(0x1cb)](_0x1914fd),this[_0x4a3ee2(0x20f)]();},_0x1914fd['onmessage']=_0x59ab1b=>{var _0x7d423b=_0x39eb7a;try{if(!(_0x59ab1b!=null&&_0x59ab1b[_0x7d423b(0x1cf)])||!this['eventReceivedCallback'])return;let _0x2c10e5=JSON['parse'](_0x59ab1b[_0x7d423b(0x1cf)]);this[_0x7d423b(0x200)](_0x2c10e5['method'],_0x2c10e5[_0x7d423b(0x216)],this[_0x7d423b(0x217)],this[_0x7d423b(0x29a)]);}catch{}};})[_0x43981e(0x26d)](_0x5d67a9=>(this[_0x43981e(0x26f)]=!0x0,this[_0x43981e(0x1e3)]=!0x1,this[_0x43981e(0x242)]=!0x1,this[_0x43981e(0x260)]=!0x0,this[_0x43981e(0x20c)]=0x0,_0x5d67a9))[_0x43981e(0x28c)](_0x321977=>(this[_0x43981e(0x26f)]=!0x1,this[_0x43981e(0x1e3)]=!0x1,console['warn'](_0x43981e(0x282)+this[_0x43981e(0x27a)]),_0xfb083f(new Error('failed\\x20to\\x20connect\\x20to\\x20host:\\x20'+(_0x321977&&_0x321977[_0x43981e(0x247)])))));}));}[_0x3ec852(0x1cb)](_0x3b0b31){var _0x487b52=_0x3ec852;this[_0x487b52(0x26f)]=!0x1,this[_0x487b52(0x1e3)]=!0x1;try{_0x3b0b31[_0x487b52(0x1a6)]=null,_0x3b0b31[_0x487b52(0x246)]=null,_0x3b0b31[_0x487b52(0x23d)]=null;}catch{}try{_0x3b0b31[_0x487b52(0x1d2)]<0x2&&_0x3b0b31[_0x487b52(0x24d)]();}catch{}}[_0x3ec852(0x20f)](){var _0x85c4bd=_0x3ec852;clearTimeout(this[_0x85c4bd(0x1f1)]),!(this['_connectAttemptCount']>=this[_0x85c4bd(0x255)])&&(this[_0x85c4bd(0x1f1)]=setTimeout(()=>{var _0x20cd79=_0x85c4bd,_0x43296b;this[_0x20cd79(0x26f)]||this[_0x20cd79(0x1e3)]||(this['_connectToHostNow'](),(_0x43296b=this[_0x20cd79(0x1c8)])==null||_0x43296b[_0x20cd79(0x28c)](()=>this[_0x20cd79(0x20f)]()));},0x1f4),this[_0x85c4bd(0x1f1)][_0x85c4bd(0x28a)]&&this[_0x85c4bd(0x1f1)][_0x85c4bd(0x28a)]());}async['send'](_0x3b47e2){var _0x25d00e=_0x3ec852;try{if(!this[_0x25d00e(0x260)])return;this[_0x25d00e(0x242)]&&this[_0x25d00e(0x1d5)](),(await this[_0x25d00e(0x1c8)])[_0x25d00e(0x214)](JSON['stringify'](_0x3b47e2));}catch(_0x5d00ae){this[_0x25d00e(0x1e5)]?console[_0x25d00e(0x234)](this[_0x25d00e(0x225)]+':\\x20'+(_0x5d00ae&&_0x5d00ae[_0x25d00e(0x247)])):(this[_0x25d00e(0x1e5)]=!0x0,console[_0x25d00e(0x234)](this[_0x25d00e(0x225)]+':\\x20'+(_0x5d00ae&&_0x5d00ae[_0x25d00e(0x247)]),_0x3b47e2)),this['_allowedToSend']=!0x1,this[_0x25d00e(0x20f)]();}}};function H(_0x41f328,_0x233681,_0x4415cb,_0x55d5f3,_0x206d3f,_0x183128,_0x2c87f0,_0x1db5e4=oe){var _0x14ad51=_0x3ec852;let _0x444e0f=_0x4415cb['split'](',')[_0x14ad51(0x243)](_0x542835=>{var _0x533b01=_0x14ad51,_0x39c1d6,_0xffa7a3,_0x1f8eef,_0x28f950;try{if(!_0x41f328['_console_ninja_session']){let _0x4ada91=((_0xffa7a3=(_0x39c1d6=_0x41f328[_0x533b01(0x271)])==null?void 0x0:_0x39c1d6['versions'])==null?void 0x0:_0xffa7a3['node'])||((_0x28f950=(_0x1f8eef=_0x41f328[_0x533b01(0x271)])==null?void 0x0:_0x1f8eef['env'])==null?void 0x0:_0x28f950[_0x533b01(0x26c)])===_0x533b01(0x20d);(_0x206d3f===_0x533b01(0x253)||_0x206d3f===_0x533b01(0x1a4)||_0x206d3f===_0x533b01(0x1e7)||_0x206d3f===_0x533b01(0x1d0))&&(_0x206d3f+=_0x4ada91?_0x533b01(0x1bf):_0x533b01(0x230)),_0x41f328[_0x533b01(0x212)]={'id':+new Date(),'tool':_0x206d3f},_0x2c87f0&&_0x206d3f&&!_0x4ada91&&console[_0x533b01(0x1c4)]('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x206d3f[_0x533b01(0x269)](0x0)[_0x533b01(0x1af)]()+_0x206d3f[_0x533b01(0x1c1)](0x1))+',',_0x533b01(0x204),_0x533b01(0x1b6));}let _0x20c134=new q(_0x41f328,_0x233681,_0x542835,_0x55d5f3,_0x183128,_0x1db5e4);return _0x20c134[_0x533b01(0x214)][_0x533b01(0x1ce)](_0x20c134);}catch(_0x184dd7){return console[_0x533b01(0x234)](_0x533b01(0x1d6),_0x184dd7&&_0x184dd7[_0x533b01(0x247)]),()=>{};}});return _0x1b75df=>_0x444e0f[_0x14ad51(0x24f)](_0x53dbc2=>_0x53dbc2(_0x1b75df));}function oe(_0x209e5e,_0x1a37bc,_0x30c03a,_0x4b8ebf){var _0x23acd6=_0x3ec852;_0x4b8ebf&&_0x209e5e===_0x23acd6(0x298)&&_0x30c03a[_0x23acd6(0x23c)][_0x23acd6(0x298)]();}function _0xa4e2(){var _0x36ad35=['replace','_connecting','_isPrimitiveType','_extendedWarning','6074920LfIGvF','astro','String','ws://','_addProperty','match','hrtime','_p_name','function','funcName','1.0.0','_reconnectTimeout','Set','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','time','_isArray','noFunctions','[object\\x20BigInt]','_ninjaIgnoreNextError','now','Map','_HTMLAllCollection','number','coverage','Symbol','nan','eventReceivedCallback','_treeNodePropertiesAfterFullValue','undefined','_setNodeExpandableState','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','create','negativeZero','level','autoExpandPropertyCount','hasOwnProperty','getPrototypeOf','_Symbol','_connectAttemptCount','edge','7FUCggp','_attemptToReconnectShortly','getWebSocketClass','_consoleNinjaAllowedToStart','_console_ninja_session','totalStrLength','send','autoExpandLimit','args','global','Number','stackTraceLimit','_property','strLength','negativeInfinity','_isUndefined','33234KulolX','_type','push','63770','','type','current','_sendErrorMessage','_sortProps','gateway.docker.internal','1McRHFR','_setNodeExpressionPath','env','serialize','bigint','test','_addObjectProperty','set','\\x20browser','_quotedRegExp','array','__es'+'Module','warn','_p_','dockerizedApp',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.116\"],'autoExpand','versions','HTMLAllCollection','name','location','onopen','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','cappedElements','_cleanNode','_WebSocket','_allowedToConnectOnSend','map','null','88720pHyPRp','onerror','message','_isPrimitiveWrapperType','toString','_socket','disabledLog','timeStamp','close','cappedProps','forEach','_keyStrRegExp','some','length','next.js','prototype','_maxConnectAttemptCount','autoExpandMaxDepth','call','parent','sort','props','get','getOwnPropertyDescriptor','_setNodeQueryPath','hits','109105fKfjdK','_allowedToSend','8567820UVLRkT','boolean','valueOf','fromCharCode','_hasSymbolPropertyOnItsPath','_hasMapOnItsPath','_undefined','_p_length','charAt','_objectToString','Buffer','NEXT_RUNTIME','then','node','_connected','124BNoTrY','process','error','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','_isSet','_blacklistedProperty','getter','root_exp_id','_getOwnPropertyDescriptor',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.432/node_modules\",'_webSocketErrorDocsLink','origin','_addFunctionsNode','object','getOwnPropertyNames','_isMap','elements','_setNodePermissions','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','[object\\x20Map]','[object\\x20Array]','default','enumerable','webpack','console','_setNodeId','unref','depth','catch','performance','capped','hostname','300qhVsAu','concat','_isNegativeZero','isExpressionToEvaluate','_numberRegExp','host','isArray','pathToFileURL','reload','_treeNodePropertiesBeforeFullValue','_inBrowser','_console_ninja','_processTreeNodeResult','remix','slice','onclose','unshift','defineProperty','startsWith','1','NEGATIVE_INFINITY','reduceLimits','POSITIVE_INFINITY','logger\\x20websocket\\x20error','toUpperCase','resolveGetters','stringify','string','root_exp','nodeModules','toLowerCase','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','_inNextEdge','count','getOwnPropertySymbols','date','_capIfString','constructor','index','_propertyName','\\x20server','value','substr','setter','7835168QRrKIJ','log','unknown','sortProps','_additionalMetadata','_ws','','_WebSocketClass','_disposeWebsocket','_regExpToString','stack','bind','data','angular','_getOwnPropertySymbols','readyState','[object\\x20Date]','autoExpandPreviousObjects','_connectToHostNow','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','join','port','trace','rootExpression','https://tinyurl.com/37x8b79t','_setNodeLabel','_getOwnPropertyNames','2922476smcMmz','_dateToString','elapsed','774KZZKFn'];_0xa4e2=function(){return _0x36ad35;};return _0xa4e2();}function B(_0x20e038){var _0x445fd2=_0x3ec852,_0x2d0cb7,_0x48943e;let _0x59b43d=function(_0x3b5827,_0x3d5a93){return _0x3d5a93-_0x3b5827;},_0x44bb93;if(_0x20e038[_0x445fd2(0x28d)])_0x44bb93=function(){var _0x12b328=_0x445fd2;return _0x20e038[_0x12b328(0x28d)][_0x12b328(0x1f9)]();};else{if(_0x20e038[_0x445fd2(0x271)]&&_0x20e038['process'][_0x445fd2(0x1ec)]&&((_0x48943e=(_0x2d0cb7=_0x20e038[_0x445fd2(0x271)])==null?void 0x0:_0x2d0cb7['env'])==null?void 0x0:_0x48943e['NEXT_RUNTIME'])!==_0x445fd2(0x20d))_0x44bb93=function(){var _0x379054=_0x445fd2;return _0x20e038[_0x379054(0x271)]['hrtime']();},_0x59b43d=function(_0x3bc085,_0x582ef6){return 0x3e8*(_0x582ef6[0x0]-_0x3bc085[0x0])+(_0x582ef6[0x1]-_0x3bc085[0x1])/0xf4240;};else try{let {performance:_0xad52c}=require('perf_hooks');_0x44bb93=function(){var _0x5392ce=_0x445fd2;return _0xad52c[_0x5392ce(0x1f9)]();};}catch{_0x44bb93=function(){return+new Date();};}}return{'elapsed':_0x59b43d,'timeStamp':_0x44bb93,'now':()=>Date[_0x445fd2(0x1f9)]()};}function X(_0xc83504,_0x4b25fb,_0x1a2fd6){var _0x10b8b3=_0x3ec852,_0x2954ae,_0xfd3100,_0xfea6e8,_0x19cac5,_0x49560d;if(_0xc83504[_0x10b8b3(0x211)]!==void 0x0)return _0xc83504[_0x10b8b3(0x211)];let _0x1a1ca2=((_0xfd3100=(_0x2954ae=_0xc83504[_0x10b8b3(0x271)])==null?void 0x0:_0x2954ae[_0x10b8b3(0x239)])==null?void 0x0:_0xfd3100[_0x10b8b3(0x26e)])||((_0x19cac5=(_0xfea6e8=_0xc83504[_0x10b8b3(0x271)])==null?void 0x0:_0xfea6e8[_0x10b8b3(0x22a)])==null?void 0x0:_0x19cac5[_0x10b8b3(0x26c)])===_0x10b8b3(0x20d);function _0x234bf1(_0x2e82ee){var _0x55a884=_0x10b8b3;if(_0x2e82ee[_0x55a884(0x1a9)]('/')&&_0x2e82ee['endsWith']('/')){let _0x481f20=new RegExp(_0x2e82ee[_0x55a884(0x1a5)](0x1,-0x1));return _0x43848c=>_0x481f20[_0x55a884(0x22d)](_0x43848c);}else{if(_0x2e82ee['includes']('*')||_0x2e82ee['includes']('?')){let _0x2118ba=new RegExp('^'+_0x2e82ee['replace'](/\\./g,String[_0x55a884(0x264)](0x5c)+'.')[_0x55a884(0x1e2)](/\\*/g,'.*')[_0x55a884(0x1e2)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0x561f01=>_0x2118ba[_0x55a884(0x22d)](_0x561f01);}else return _0x470024=>_0x470024===_0x2e82ee;}}let _0x540d3f=_0x4b25fb[_0x10b8b3(0x243)](_0x234bf1);return _0xc83504['_consoleNinjaAllowedToStart']=_0x1a1ca2||!_0x4b25fb,!_0xc83504[_0x10b8b3(0x211)]&&((_0x49560d=_0xc83504[_0x10b8b3(0x23c)])==null?void 0x0:_0x49560d[_0x10b8b3(0x28f)])&&(_0xc83504[_0x10b8b3(0x211)]=_0x540d3f[_0x10b8b3(0x251)](_0x4133cb=>_0x4133cb(_0xc83504['location']['hostname']))),_0xc83504[_0x10b8b3(0x211)];}function J(_0x3a5821,_0x1052be,_0x42e4ae,_0x5041b8){var _0xb3127=_0x3ec852;_0x3a5821=_0x3a5821,_0x1052be=_0x1052be,_0x42e4ae=_0x42e4ae,_0x5041b8=_0x5041b8;let _0x3048cd=B(_0x3a5821),_0x482da7=_0x3048cd[_0xb3127(0x1e0)],_0x9c9eb0=_0x3048cd['timeStamp'];class _0x29f380{constructor(){var _0x669ff0=_0xb3127;this[_0x669ff0(0x250)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x669ff0(0x294)]=/^(0|[1-9][0-9]*)$/,this[_0x669ff0(0x231)]=/'([^\\\\']|\\\\')*'/,this[_0x669ff0(0x267)]=_0x3a5821[_0x669ff0(0x202)],this[_0x669ff0(0x1fb)]=_0x3a5821[_0x669ff0(0x23a)],this[_0x669ff0(0x278)]=Object[_0x669ff0(0x25c)],this[_0x669ff0(0x1dd)]=Object[_0x669ff0(0x27e)],this[_0x669ff0(0x20b)]=_0x3a5821[_0x669ff0(0x1fe)],this[_0x669ff0(0x1cc)]=RegExp[_0x669ff0(0x254)][_0x669ff0(0x249)],this[_0x669ff0(0x1df)]=Date[_0x669ff0(0x254)][_0x669ff0(0x249)];}[_0xb3127(0x22b)](_0x16456b,_0x1e969e,_0x4f036a,_0x13905c){var _0x6e731a=_0xb3127,_0x50bc58=this,_0xf3537f=_0x4f036a[_0x6e731a(0x238)];function _0x4808c8(_0x878d37,_0x4cf9c5,_0x14456a){var _0x3baa88=_0x6e731a;_0x4cf9c5[_0x3baa88(0x223)]=_0x3baa88(0x1c5),_0x4cf9c5[_0x3baa88(0x272)]=_0x878d37['message'],_0x4a51f2=_0x14456a['node']['current'],_0x14456a[_0x3baa88(0x26e)][_0x3baa88(0x224)]=_0x4cf9c5,_0x50bc58[_0x3baa88(0x299)](_0x4cf9c5,_0x14456a);}let _0x45cb1e;_0x3a5821[_0x6e731a(0x288)]&&(_0x45cb1e=_0x3a5821[_0x6e731a(0x288)][_0x6e731a(0x272)],_0x45cb1e&&(_0x3a5821[_0x6e731a(0x288)][_0x6e731a(0x272)]=function(){}));try{try{_0x4f036a[_0x6e731a(0x207)]++,_0x4f036a[_0x6e731a(0x238)]&&_0x4f036a[_0x6e731a(0x1d4)]['push'](_0x1e969e);var _0xfac4ff,_0x15fb5b,_0xba5a45,_0x3b84d3,_0x807424=[],_0x3fb545=[],_0x5bc8fe,_0x25dd2e=this[_0x6e731a(0x21f)](_0x1e969e),_0x1da13b=_0x25dd2e==='array',_0x5777f9=!0x1,_0x1b0b86=_0x25dd2e===_0x6e731a(0x1ee),_0x45eefd=this[_0x6e731a(0x1e4)](_0x25dd2e),_0x5eada3=this[_0x6e731a(0x248)](_0x25dd2e),_0xa15d01=_0x45eefd||_0x5eada3,_0x18e06a={},_0x5200a4=0x0,_0x512e40=!0x1,_0x4a51f2,_0x3f0914=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x4f036a[_0x6e731a(0x28b)]){if(_0x1da13b){if(_0x15fb5b=_0x1e969e['length'],_0x15fb5b>_0x4f036a['elements']){for(_0xba5a45=0x0,_0x3b84d3=_0x4f036a[_0x6e731a(0x280)],_0xfac4ff=_0xba5a45;_0xfac4ff<_0x3b84d3;_0xfac4ff++)_0x3fb545[_0x6e731a(0x220)](_0x50bc58['_addProperty'](_0x807424,_0x1e969e,_0x25dd2e,_0xfac4ff,_0x4f036a));_0x16456b[_0x6e731a(0x23f)]=!0x0;}else{for(_0xba5a45=0x0,_0x3b84d3=_0x15fb5b,_0xfac4ff=_0xba5a45;_0xfac4ff<_0x3b84d3;_0xfac4ff++)_0x3fb545['push'](_0x50bc58[_0x6e731a(0x1ea)](_0x807424,_0x1e969e,_0x25dd2e,_0xfac4ff,_0x4f036a));}_0x4f036a[_0x6e731a(0x208)]+=_0x3fb545['length'];}if(!(_0x25dd2e==='null'||_0x25dd2e==='undefined')&&!_0x45eefd&&_0x25dd2e!==_0x6e731a(0x1e8)&&_0x25dd2e!==_0x6e731a(0x26b)&&_0x25dd2e!==_0x6e731a(0x22c)){var _0x2f7bd5=_0x13905c[_0x6e731a(0x25a)]||_0x4f036a['props'];if(this[_0x6e731a(0x274)](_0x1e969e)?(_0xfac4ff=0x0,_0x1e969e[_0x6e731a(0x24f)](function(_0x15dbcd){var _0x95763b=_0x6e731a;if(_0x5200a4++,_0x4f036a[_0x95763b(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;return;}if(!_0x4f036a['isExpressionToEvaluate']&&_0x4f036a[_0x95763b(0x238)]&&_0x4f036a[_0x95763b(0x208)]>_0x4f036a[_0x95763b(0x215)]){_0x512e40=!0x0;return;}_0x3fb545[_0x95763b(0x220)](_0x50bc58[_0x95763b(0x1ea)](_0x807424,_0x1e969e,_0x95763b(0x1f2),_0xfac4ff++,_0x4f036a,function(_0x50d177){return function(){return _0x50d177;};}(_0x15dbcd)));})):this[_0x6e731a(0x27f)](_0x1e969e)&&_0x1e969e['forEach'](function(_0x1e9fdc,_0x3859fb){var _0x594511=_0x6e731a;if(_0x5200a4++,_0x4f036a[_0x594511(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;return;}if(!_0x4f036a[_0x594511(0x293)]&&_0x4f036a['autoExpand']&&_0x4f036a[_0x594511(0x208)]>_0x4f036a[_0x594511(0x215)]){_0x512e40=!0x0;return;}var _0x1533a0=_0x3859fb[_0x594511(0x249)]();_0x1533a0[_0x594511(0x252)]>0x64&&(_0x1533a0=_0x1533a0['slice'](0x0,0x64)+'...'),_0x3fb545['push'](_0x50bc58[_0x594511(0x1ea)](_0x807424,_0x1e969e,_0x594511(0x1fa),_0x1533a0,_0x4f036a,function(_0x3e272a){return function(){return _0x3e272a;};}(_0x1e9fdc)));}),!_0x5777f9){try{for(_0x5bc8fe in _0x1e969e)if(!(_0x1da13b&&_0x3f0914[_0x6e731a(0x22d)](_0x5bc8fe))&&!this['_blacklistedProperty'](_0x1e969e,_0x5bc8fe,_0x4f036a)){if(_0x5200a4++,_0x4f036a[_0x6e731a(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;break;}if(!_0x4f036a[_0x6e731a(0x293)]&&_0x4f036a['autoExpand']&&_0x4f036a[_0x6e731a(0x208)]>_0x4f036a[_0x6e731a(0x215)]){_0x512e40=!0x0;break;}_0x3fb545['push'](_0x50bc58[_0x6e731a(0x22e)](_0x807424,_0x18e06a,_0x1e969e,_0x25dd2e,_0x5bc8fe,_0x4f036a));}}catch{}if(_0x18e06a[_0x6e731a(0x268)]=!0x0,_0x1b0b86&&(_0x18e06a[_0x6e731a(0x1ed)]=!0x0),!_0x512e40){var _0x1c596f=[]['concat'](this[_0x6e731a(0x1dd)](_0x1e969e))[_0x6e731a(0x291)](this['_getOwnPropertySymbols'](_0x1e969e));for(_0xfac4ff=0x0,_0x15fb5b=_0x1c596f[_0x6e731a(0x252)];_0xfac4ff<_0x15fb5b;_0xfac4ff++)if(_0x5bc8fe=_0x1c596f[_0xfac4ff],!(_0x1da13b&&_0x3f0914[_0x6e731a(0x22d)](_0x5bc8fe[_0x6e731a(0x249)]()))&&!this[_0x6e731a(0x275)](_0x1e969e,_0x5bc8fe,_0x4f036a)&&!_0x18e06a['_p_'+_0x5bc8fe[_0x6e731a(0x249)]()]){if(_0x5200a4++,_0x4f036a[_0x6e731a(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;break;}if(!_0x4f036a[_0x6e731a(0x293)]&&_0x4f036a[_0x6e731a(0x238)]&&_0x4f036a[_0x6e731a(0x208)]>_0x4f036a['autoExpandLimit']){_0x512e40=!0x0;break;}_0x3fb545[_0x6e731a(0x220)](_0x50bc58[_0x6e731a(0x22e)](_0x807424,_0x18e06a,_0x1e969e,_0x25dd2e,_0x5bc8fe,_0x4f036a));}}}}}if(_0x16456b[_0x6e731a(0x223)]=_0x25dd2e,_0xa15d01?(_0x16456b[_0x6e731a(0x1c0)]=_0x1e969e[_0x6e731a(0x263)](),this[_0x6e731a(0x1bb)](_0x25dd2e,_0x16456b,_0x4f036a,_0x13905c)):_0x25dd2e===_0x6e731a(0x1ba)?_0x16456b[_0x6e731a(0x1c0)]=this[_0x6e731a(0x1df)][_0x6e731a(0x257)](_0x1e969e):_0x25dd2e==='bigint'?_0x16456b[_0x6e731a(0x1c0)]=_0x1e969e['toString']():_0x25dd2e==='RegExp'?_0x16456b[_0x6e731a(0x1c0)]=this[_0x6e731a(0x1cc)][_0x6e731a(0x257)](_0x1e969e):_0x25dd2e==='symbol'&&this[_0x6e731a(0x20b)]?_0x16456b[_0x6e731a(0x1c0)]=this[_0x6e731a(0x20b)][_0x6e731a(0x254)]['toString'][_0x6e731a(0x257)](_0x1e969e):!_0x4f036a['depth']&&!(_0x25dd2e===_0x6e731a(0x244)||_0x25dd2e===_0x6e731a(0x202))&&(delete _0x16456b[_0x6e731a(0x1c0)],_0x16456b['capped']=!0x0),_0x512e40&&(_0x16456b[_0x6e731a(0x24e)]=!0x0),_0x4a51f2=_0x4f036a[_0x6e731a(0x26e)]['current'],_0x4f036a[_0x6e731a(0x26e)][_0x6e731a(0x224)]=_0x16456b,this[_0x6e731a(0x299)](_0x16456b,_0x4f036a),_0x3fb545[_0x6e731a(0x252)]){for(_0xfac4ff=0x0,_0x15fb5b=_0x3fb545['length'];_0xfac4ff<_0x15fb5b;_0xfac4ff++)_0x3fb545[_0xfac4ff](_0xfac4ff);}_0x807424[_0x6e731a(0x252)]&&(_0x16456b['props']=_0x807424);}catch(_0x3388f9){_0x4808c8(_0x3388f9,_0x16456b,_0x4f036a);}this[_0x6e731a(0x1c7)](_0x1e969e,_0x16456b),this[_0x6e731a(0x201)](_0x16456b,_0x4f036a),_0x4f036a[_0x6e731a(0x26e)]['current']=_0x4a51f2,_0x4f036a[_0x6e731a(0x207)]--,_0x4f036a[_0x6e731a(0x238)]=_0xf3537f,_0x4f036a[_0x6e731a(0x238)]&&_0x4f036a[_0x6e731a(0x1d4)]['pop']();}finally{_0x45cb1e&&(_0x3a5821[_0x6e731a(0x288)][_0x6e731a(0x272)]=_0x45cb1e);}return _0x16456b;}[_0xb3127(0x1d1)](_0x22475d){var _0x24a928=_0xb3127;return Object[_0x24a928(0x1b9)]?Object[_0x24a928(0x1b9)](_0x22475d):[];}[_0xb3127(0x274)](_0x300fdc){var _0x74478f=_0xb3127;return!!(_0x300fdc&&_0x3a5821['Set']&&this[_0x74478f(0x26a)](_0x300fdc)==='[object\\x20Set]'&&_0x300fdc['forEach']);}[_0xb3127(0x275)](_0x53be4e,_0x38097c,_0x4fa6cf){var _0x4a2967=_0xb3127;return _0x4fa6cf[_0x4a2967(0x1f6)]?typeof _0x53be4e[_0x38097c]==_0x4a2967(0x1ee):!0x1;}[_0xb3127(0x21f)](_0x3476be){var _0x3e50fd=_0xb3127,_0x360c41='';return _0x360c41=typeof _0x3476be,_0x360c41===_0x3e50fd(0x27d)?this[_0x3e50fd(0x26a)](_0x3476be)===_0x3e50fd(0x284)?_0x360c41='array':this[_0x3e50fd(0x26a)](_0x3476be)===_0x3e50fd(0x1d3)?_0x360c41='date':this[_0x3e50fd(0x26a)](_0x3476be)===_0x3e50fd(0x1f7)?_0x360c41=_0x3e50fd(0x22c):_0x3476be===null?_0x360c41=_0x3e50fd(0x244):_0x3476be[_0x3e50fd(0x1bc)]&&(_0x360c41=_0x3476be['constructor'][_0x3e50fd(0x23b)]||_0x360c41):_0x360c41===_0x3e50fd(0x202)&&this[_0x3e50fd(0x1fb)]&&_0x3476be instanceof this[_0x3e50fd(0x1fb)]&&(_0x360c41='HTMLAllCollection'),_0x360c41;}[_0xb3127(0x26a)](_0xc08161){var _0x2b573c=_0xb3127;return Object[_0x2b573c(0x254)][_0x2b573c(0x249)][_0x2b573c(0x257)](_0xc08161);}[_0xb3127(0x1e4)](_0x36467a){var _0x43d30a=_0xb3127;return _0x36467a===_0x43d30a(0x262)||_0x36467a===_0x43d30a(0x1b2)||_0x36467a===_0x43d30a(0x1fc);}[_0xb3127(0x248)](_0x594a4a){return _0x594a4a==='Boolean'||_0x594a4a==='String'||_0x594a4a==='Number';}[_0xb3127(0x1ea)](_0x1d9b48,_0x5d184e,_0x34c2ba,_0x389ffa,_0x817f15,_0x1aabbd){var _0x59ff55=this;return function(_0x5471fd){var _0x541816=_0x354e,_0x2bc053=_0x817f15[_0x541816(0x26e)][_0x541816(0x224)],_0x4ea941=_0x817f15[_0x541816(0x26e)]['index'],_0x328364=_0x817f15[_0x541816(0x26e)][_0x541816(0x258)];_0x817f15[_0x541816(0x26e)][_0x541816(0x258)]=_0x2bc053,_0x817f15[_0x541816(0x26e)]['index']=typeof _0x389ffa=='number'?_0x389ffa:_0x5471fd,_0x1d9b48[_0x541816(0x220)](_0x59ff55[_0x541816(0x21a)](_0x5d184e,_0x34c2ba,_0x389ffa,_0x817f15,_0x1aabbd)),_0x817f15[_0x541816(0x26e)][_0x541816(0x258)]=_0x328364,_0x817f15[_0x541816(0x26e)][_0x541816(0x1bd)]=_0x4ea941;};}[_0xb3127(0x22e)](_0x62ef53,_0x191f7a,_0x2f5a53,_0x2904d3,_0x21f7a2,_0x2c31e2,_0x396622){var _0x54fb86=_0xb3127,_0x29b1bd=this;return _0x191f7a['_p_'+_0x21f7a2[_0x54fb86(0x249)]()]=!0x0,function(_0x2ddeb8){var _0x45e080=_0x54fb86,_0x4d1c7e=_0x2c31e2['node']['current'],_0x3f2b37=_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x1bd)],_0x358102=_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x258)];_0x2c31e2[_0x45e080(0x26e)]['parent']=_0x4d1c7e,_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x1bd)]=_0x2ddeb8,_0x62ef53['push'](_0x29b1bd[_0x45e080(0x21a)](_0x2f5a53,_0x2904d3,_0x21f7a2,_0x2c31e2,_0x396622)),_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x258)]=_0x358102,_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x1bd)]=_0x3f2b37;};}[_0xb3127(0x21a)](_0xa52b9,_0x108ec5,_0x3af85a,_0x2bfe19,_0x31e4a6){var _0x4b80d6=_0xb3127,_0x6935f0=this;_0x31e4a6||(_0x31e4a6=function(_0x40cd3c,_0x2ead91){return _0x40cd3c[_0x2ead91];});var _0x54fee8=_0x3af85a['toString'](),_0x354c22=_0x2bfe19['expressionsToEvaluate']||{},_0x4e38a6=_0x2bfe19[_0x4b80d6(0x28b)],_0x3e979a=_0x2bfe19['isExpressionToEvaluate'];try{var _0x5d757f=this['_isMap'](_0xa52b9),_0x214926=_0x54fee8;_0x5d757f&&_0x214926[0x0]==='\\x27'&&(_0x214926=_0x214926[_0x4b80d6(0x1c1)](0x1,_0x214926[_0x4b80d6(0x252)]-0x2));var _0x4f34d1=_0x2bfe19['expressionsToEvaluate']=_0x354c22[_0x4b80d6(0x235)+_0x214926];_0x4f34d1&&(_0x2bfe19['depth']=_0x2bfe19[_0x4b80d6(0x28b)]+0x1),_0x2bfe19['isExpressionToEvaluate']=!!_0x4f34d1;var _0x2044ae=typeof _0x3af85a=='symbol',_0x3d9baa={'name':_0x2044ae||_0x5d757f?_0x54fee8:this['_propertyName'](_0x54fee8)};if(_0x2044ae&&(_0x3d9baa['symbol']=!0x0),!(_0x108ec5===_0x4b80d6(0x232)||_0x108ec5==='Error')){var _0xa8fe95=this['_getOwnPropertyDescriptor'](_0xa52b9,_0x3af85a);if(_0xa8fe95&&(_0xa8fe95[_0x4b80d6(0x22f)]&&(_0x3d9baa[_0x4b80d6(0x1c2)]=!0x0),_0xa8fe95[_0x4b80d6(0x25b)]&&!_0x4f34d1&&!_0x2bfe19[_0x4b80d6(0x1b0)]))return _0x3d9baa[_0x4b80d6(0x276)]=!0x0,this['_processTreeNodeResult'](_0x3d9baa,_0x2bfe19),_0x3d9baa;}var _0x3ca3be;try{_0x3ca3be=_0x31e4a6(_0xa52b9,_0x3af85a);}catch(_0x4a1e91){return _0x3d9baa={'name':_0x54fee8,'type':_0x4b80d6(0x1c5),'error':_0x4a1e91[_0x4b80d6(0x247)]},this[_0x4b80d6(0x1a3)](_0x3d9baa,_0x2bfe19),_0x3d9baa;}var _0x5e618d=this[_0x4b80d6(0x21f)](_0x3ca3be),_0x522c5a=this[_0x4b80d6(0x1e4)](_0x5e618d);if(_0x3d9baa['type']=_0x5e618d,_0x522c5a)this[_0x4b80d6(0x1a3)](_0x3d9baa,_0x2bfe19,_0x3ca3be,function(){var _0x3a0d0d=_0x4b80d6;_0x3d9baa[_0x3a0d0d(0x1c0)]=_0x3ca3be[_0x3a0d0d(0x263)](),!_0x4f34d1&&_0x6935f0['_capIfString'](_0x5e618d,_0x3d9baa,_0x2bfe19,{});});else{var _0x4e0ea3=_0x2bfe19[_0x4b80d6(0x238)]&&_0x2bfe19[_0x4b80d6(0x207)]<_0x2bfe19[_0x4b80d6(0x256)]&&_0x2bfe19[_0x4b80d6(0x1d4)]['indexOf'](_0x3ca3be)<0x0&&_0x5e618d!==_0x4b80d6(0x1ee)&&_0x2bfe19[_0x4b80d6(0x208)]<_0x2bfe19['autoExpandLimit'];_0x4e0ea3||_0x2bfe19[_0x4b80d6(0x207)]<_0x4e38a6||_0x4f34d1?(this[_0x4b80d6(0x22b)](_0x3d9baa,_0x3ca3be,_0x2bfe19,_0x4f34d1||{}),this['_additionalMetadata'](_0x3ca3be,_0x3d9baa)):this[_0x4b80d6(0x1a3)](_0x3d9baa,_0x2bfe19,_0x3ca3be,function(){var _0x50a27f=_0x4b80d6;_0x5e618d==='null'||_0x5e618d===_0x50a27f(0x202)||(delete _0x3d9baa['value'],_0x3d9baa[_0x50a27f(0x28e)]=!0x0);});}return _0x3d9baa;}finally{_0x2bfe19['expressionsToEvaluate']=_0x354c22,_0x2bfe19['depth']=_0x4e38a6,_0x2bfe19[_0x4b80d6(0x293)]=_0x3e979a;}}[_0xb3127(0x1bb)](_0x2ebf27,_0x5583e5,_0x313d81,_0x46a792){var _0x5ba39b=_0xb3127,_0x2f7a10=_0x46a792[_0x5ba39b(0x21b)]||_0x313d81[_0x5ba39b(0x21b)];if((_0x2ebf27===_0x5ba39b(0x1b2)||_0x2ebf27===_0x5ba39b(0x1e8))&&_0x5583e5[_0x5ba39b(0x1c0)]){let _0x154bf2=_0x5583e5['value'][_0x5ba39b(0x252)];_0x313d81['allStrLength']+=_0x154bf2,_0x313d81['allStrLength']>_0x313d81[_0x5ba39b(0x213)]?(_0x5583e5[_0x5ba39b(0x28e)]='',delete _0x5583e5[_0x5ba39b(0x1c0)]):_0x154bf2>_0x2f7a10&&(_0x5583e5[_0x5ba39b(0x28e)]=_0x5583e5[_0x5ba39b(0x1c0)][_0x5ba39b(0x1c1)](0x0,_0x2f7a10),delete _0x5583e5[_0x5ba39b(0x1c0)]);}}['_isMap'](_0x9078e6){var _0x3e5272=_0xb3127;return!!(_0x9078e6&&_0x3a5821[_0x3e5272(0x1fa)]&&this['_objectToString'](_0x9078e6)===_0x3e5272(0x283)&&_0x9078e6[_0x3e5272(0x24f)]);}[_0xb3127(0x1be)](_0x392633){var _0x552f3f=_0xb3127;if(_0x392633['match'](/^\\d+$/))return _0x392633;var _0x438a74;try{_0x438a74=JSON[_0x552f3f(0x1b1)](''+_0x392633);}catch{_0x438a74='\\x22'+this[_0x552f3f(0x26a)](_0x392633)+'\\x22';}return _0x438a74[_0x552f3f(0x1eb)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x438a74=_0x438a74['substr'](0x1,_0x438a74[_0x552f3f(0x252)]-0x2):_0x438a74=_0x438a74[_0x552f3f(0x1e2)](/'/g,'\\x5c\\x27')[_0x552f3f(0x1e2)](/\\\\\"/g,'\\x22')['replace'](/(^\"|\"$)/g,'\\x27'),_0x438a74;}[_0xb3127(0x1a3)](_0x3f25e6,_0x586312,_0x4716aa,_0x2821b6){var _0xc54001=_0xb3127;this[_0xc54001(0x299)](_0x3f25e6,_0x586312),_0x2821b6&&_0x2821b6(),this[_0xc54001(0x1c7)](_0x4716aa,_0x3f25e6),this[_0xc54001(0x201)](_0x3f25e6,_0x586312);}[_0xb3127(0x299)](_0x3cff7d,_0x2d439e){var _0x1cf56f=_0xb3127;this[_0x1cf56f(0x289)](_0x3cff7d,_0x2d439e),this[_0x1cf56f(0x25d)](_0x3cff7d,_0x2d439e),this['_setNodeExpressionPath'](_0x3cff7d,_0x2d439e),this[_0x1cf56f(0x281)](_0x3cff7d,_0x2d439e);}[_0xb3127(0x289)](_0x5adc61,_0x1e4366){}[_0xb3127(0x25d)](_0x5efa9c,_0xe4f3d4){}[_0xb3127(0x1dc)](_0x469c7a,_0x3b948e){}[_0xb3127(0x21d)](_0xd108b4){return _0xd108b4===this['_undefined'];}[_0xb3127(0x201)](_0x190b6b,_0x240881){var _0x4e43e1=_0xb3127;this[_0x4e43e1(0x1dc)](_0x190b6b,_0x240881),this[_0x4e43e1(0x203)](_0x190b6b),_0x240881['sortProps']&&this[_0x4e43e1(0x226)](_0x190b6b),this['_addFunctionsNode'](_0x190b6b,_0x240881),this['_addLoadNode'](_0x190b6b,_0x240881),this['_cleanNode'](_0x190b6b);}['_additionalMetadata'](_0x30bd89,_0x21c9e7){var _0x3cc971=_0xb3127;try{_0x30bd89&&typeof _0x30bd89['length']==_0x3cc971(0x1fc)&&(_0x21c9e7[_0x3cc971(0x252)]=_0x30bd89[_0x3cc971(0x252)]);}catch{}if(_0x21c9e7[_0x3cc971(0x223)]===_0x3cc971(0x1fc)||_0x21c9e7['type']===_0x3cc971(0x218)){if(isNaN(_0x21c9e7['value']))_0x21c9e7[_0x3cc971(0x1ff)]=!0x0,delete _0x21c9e7[_0x3cc971(0x1c0)];else switch(_0x21c9e7[_0x3cc971(0x1c0)]){case Number[_0x3cc971(0x1ad)]:_0x21c9e7['positiveInfinity']=!0x0,delete _0x21c9e7[_0x3cc971(0x1c0)];break;case Number[_0x3cc971(0x1ab)]:_0x21c9e7[_0x3cc971(0x21c)]=!0x0,delete _0x21c9e7[_0x3cc971(0x1c0)];break;case 0x0:this[_0x3cc971(0x292)](_0x21c9e7[_0x3cc971(0x1c0)])&&(_0x21c9e7[_0x3cc971(0x206)]=!0x0);break;}}else _0x21c9e7[_0x3cc971(0x223)]===_0x3cc971(0x1ee)&&typeof _0x30bd89['name']=='string'&&_0x30bd89[_0x3cc971(0x23b)]&&_0x21c9e7['name']&&_0x30bd89[_0x3cc971(0x23b)]!==_0x21c9e7[_0x3cc971(0x23b)]&&(_0x21c9e7[_0x3cc971(0x1ef)]=_0x30bd89[_0x3cc971(0x23b)]);}[_0xb3127(0x292)](_0xfd1374){var _0x2a4790=_0xb3127;return 0x1/_0xfd1374===Number[_0x2a4790(0x1ab)];}['_sortProps'](_0x448e2f){var _0x4b6e8e=_0xb3127;!_0x448e2f[_0x4b6e8e(0x25a)]||!_0x448e2f[_0x4b6e8e(0x25a)][_0x4b6e8e(0x252)]||_0x448e2f['type']==='array'||_0x448e2f[_0x4b6e8e(0x223)]===_0x4b6e8e(0x1fa)||_0x448e2f[_0x4b6e8e(0x223)]===_0x4b6e8e(0x1f2)||_0x448e2f[_0x4b6e8e(0x25a)][_0x4b6e8e(0x259)](function(_0x151a8e,_0x13e517){var _0xe61612=_0x4b6e8e,_0x548a50=_0x151a8e[_0xe61612(0x23b)][_0xe61612(0x1b5)](),_0xdab317=_0x13e517[_0xe61612(0x23b)][_0xe61612(0x1b5)]();return _0x548a50<_0xdab317?-0x1:_0x548a50>_0xdab317?0x1:0x0;});}[_0xb3127(0x27c)](_0x3ec893,_0x4065b3){var _0x3fcc4b=_0xb3127;if(!(_0x4065b3[_0x3fcc4b(0x1f6)]||!_0x3ec893[_0x3fcc4b(0x25a)]||!_0x3ec893[_0x3fcc4b(0x25a)][_0x3fcc4b(0x252)])){for(var _0x5a239b=[],_0x33bd01=[],_0x407303=0x0,_0x1b7597=_0x3ec893[_0x3fcc4b(0x25a)][_0x3fcc4b(0x252)];_0x407303<_0x1b7597;_0x407303++){var _0x4a87d4=_0x3ec893['props'][_0x407303];_0x4a87d4[_0x3fcc4b(0x223)]===_0x3fcc4b(0x1ee)?_0x5a239b[_0x3fcc4b(0x220)](_0x4a87d4):_0x33bd01[_0x3fcc4b(0x220)](_0x4a87d4);}if(!(!_0x33bd01['length']||_0x5a239b[_0x3fcc4b(0x252)]<=0x1)){_0x3ec893['props']=_0x33bd01;var _0x1206bb={'functionsNode':!0x0,'props':_0x5a239b};this[_0x3fcc4b(0x289)](_0x1206bb,_0x4065b3),this[_0x3fcc4b(0x1dc)](_0x1206bb,_0x4065b3),this[_0x3fcc4b(0x203)](_0x1206bb),this['_setNodePermissions'](_0x1206bb,_0x4065b3),_0x1206bb['id']+='\\x20f',_0x3ec893[_0x3fcc4b(0x25a)][_0x3fcc4b(0x1a7)](_0x1206bb);}}}['_addLoadNode'](_0x3257a0,_0x2c9597){}[_0xb3127(0x203)](_0x2b783b){}[_0xb3127(0x1f5)](_0x1e2317){var _0x3b0d25=_0xb3127;return Array[_0x3b0d25(0x296)](_0x1e2317)||typeof _0x1e2317==_0x3b0d25(0x27d)&&this['_objectToString'](_0x1e2317)===_0x3b0d25(0x284);}[_0xb3127(0x281)](_0x23413e,_0x2053e2){}[_0xb3127(0x240)](_0x508c7d){var _0xbd6357=_0xb3127;delete _0x508c7d[_0xbd6357(0x265)],delete _0x508c7d['_hasSetOnItsPath'],delete _0x508c7d[_0xbd6357(0x266)];}[_0xb3127(0x229)](_0x193f5b,_0x3d4b46){}}let _0x81c045=new _0x29f380(),_0x10c4a6={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x216919={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x8c8dd6(_0x31dd29,_0x4609dd,_0x3089ad,_0x3ece0c,_0xe0883d,_0x8ec857){var _0x2ef2ed=_0xb3127;let _0x42d3ba,_0x3584dc;try{_0x3584dc=_0x9c9eb0(),_0x42d3ba=_0x42e4ae[_0x4609dd],!_0x42d3ba||_0x3584dc-_0x42d3ba['ts']>0x1f4&&_0x42d3ba['count']&&_0x42d3ba['time']/_0x42d3ba[_0x2ef2ed(0x1b8)]<0x64?(_0x42e4ae[_0x4609dd]=_0x42d3ba={'count':0x0,'time':0x0,'ts':_0x3584dc},_0x42e4ae[_0x2ef2ed(0x25e)]={}):_0x3584dc-_0x42e4ae[_0x2ef2ed(0x25e)]['ts']>0x32&&_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1b8)]&&_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1f4)]/_0x42e4ae[_0x2ef2ed(0x25e)]['count']<0x64&&(_0x42e4ae[_0x2ef2ed(0x25e)]={});let _0x13fe9a=[],_0x3061fe=_0x42d3ba[_0x2ef2ed(0x1ac)]||_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1ac)]?_0x216919:_0x10c4a6,_0x51ec12=_0x18a714=>{var _0x39f5ef=_0x2ef2ed;let _0x19e118={};return _0x19e118[_0x39f5ef(0x25a)]=_0x18a714[_0x39f5ef(0x25a)],_0x19e118[_0x39f5ef(0x280)]=_0x18a714[_0x39f5ef(0x280)],_0x19e118[_0x39f5ef(0x21b)]=_0x18a714[_0x39f5ef(0x21b)],_0x19e118[_0x39f5ef(0x213)]=_0x18a714['totalStrLength'],_0x19e118[_0x39f5ef(0x215)]=_0x18a714[_0x39f5ef(0x215)],_0x19e118[_0x39f5ef(0x256)]=_0x18a714[_0x39f5ef(0x256)],_0x19e118[_0x39f5ef(0x1c6)]=!0x1,_0x19e118[_0x39f5ef(0x1f6)]=!_0x1052be,_0x19e118[_0x39f5ef(0x28b)]=0x1,_0x19e118[_0x39f5ef(0x207)]=0x0,_0x19e118['expId']=_0x39f5ef(0x277),_0x19e118[_0x39f5ef(0x1da)]=_0x39f5ef(0x1b3),_0x19e118['autoExpand']=!0x0,_0x19e118[_0x39f5ef(0x1d4)]=[],_0x19e118[_0x39f5ef(0x208)]=0x0,_0x19e118[_0x39f5ef(0x1b0)]=!0x0,_0x19e118['allStrLength']=0x0,_0x19e118[_0x39f5ef(0x26e)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x19e118;};for(var _0xce3a97=0x0;_0xce3a97<_0xe0883d[_0x2ef2ed(0x252)];_0xce3a97++)_0x13fe9a[_0x2ef2ed(0x220)](_0x81c045[_0x2ef2ed(0x22b)]({'timeNode':_0x31dd29===_0x2ef2ed(0x1f4)||void 0x0},_0xe0883d[_0xce3a97],_0x51ec12(_0x3061fe),{}));if(_0x31dd29==='trace'||_0x31dd29===_0x2ef2ed(0x272)){let _0x3cf829=Error[_0x2ef2ed(0x219)];try{Error[_0x2ef2ed(0x219)]=0x1/0x0,_0x13fe9a['push'](_0x81c045['serialize']({'stackNode':!0x0},new Error()[_0x2ef2ed(0x1cd)],_0x51ec12(_0x3061fe),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x3cf829;}}return{'method':_0x2ef2ed(0x1c4),'version':_0x5041b8,'args':[{'ts':_0x3089ad,'session':_0x3ece0c,'args':_0x13fe9a,'id':_0x4609dd,'context':_0x8ec857}]};}catch(_0x366a2c){return{'method':'log','version':_0x5041b8,'args':[{'ts':_0x3089ad,'session':_0x3ece0c,'args':[{'type':_0x2ef2ed(0x1c5),'error':_0x366a2c&&_0x366a2c[_0x2ef2ed(0x247)]}],'id':_0x4609dd,'context':_0x8ec857}]};}finally{try{if(_0x42d3ba&&_0x3584dc){let _0x597e97=_0x9c9eb0();_0x42d3ba['count']++,_0x42d3ba[_0x2ef2ed(0x1f4)]+=_0x482da7(_0x3584dc,_0x597e97),_0x42d3ba['ts']=_0x597e97,_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1b8)]++,_0x42e4ae['hits'][_0x2ef2ed(0x1f4)]+=_0x482da7(_0x3584dc,_0x597e97),_0x42e4ae[_0x2ef2ed(0x25e)]['ts']=_0x597e97,(_0x42d3ba[_0x2ef2ed(0x1b8)]>0x32||_0x42d3ba['time']>0x64)&&(_0x42d3ba[_0x2ef2ed(0x1ac)]=!0x0),(_0x42e4ae[_0x2ef2ed(0x25e)]['count']>0x3e8||_0x42e4ae['hits'][_0x2ef2ed(0x1f4)]>0x12c)&&(_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1ac)]=!0x0);}}catch{}}}return _0x8c8dd6;}((_0x19e4cf,_0x382935,_0x529f3f,_0x4cbc8a,_0x44e8df,_0x1a5085,_0x3c09e2,_0x192c71,_0x49ad0d,_0x10d6ef,_0x37127a)=>{var _0x383768=_0x3ec852;if(_0x19e4cf[_0x383768(0x1a2)])return _0x19e4cf['_console_ninja'];if(!X(_0x19e4cf,_0x192c71,_0x44e8df))return _0x19e4cf['_console_ninja']={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x19e4cf['_console_ninja'];let _0x168ffe=B(_0x19e4cf),_0x5486cc=_0x168ffe[_0x383768(0x1e0)],_0x9cc80f=_0x168ffe[_0x383768(0x24c)],_0x22020b=_0x168ffe[_0x383768(0x1f9)],_0x37a3e8={'hits':{},'ts':{}},_0x25b5d7=J(_0x19e4cf,_0x49ad0d,_0x37a3e8,_0x1a5085),_0x23127b=_0x214ce2=>{_0x37a3e8['ts'][_0x214ce2]=_0x9cc80f();},_0x38104c=(_0x4030db,_0x34b230)=>{var _0x52d39d=_0x383768;let _0x39758b=_0x37a3e8['ts'][_0x34b230];if(delete _0x37a3e8['ts'][_0x34b230],_0x39758b){let _0x3edb2e=_0x5486cc(_0x39758b,_0x9cc80f());_0x22cafb(_0x25b5d7(_0x52d39d(0x1f4),_0x4030db,_0x22020b(),_0x25df7c,[_0x3edb2e],_0x34b230));}},_0xa3f2d5=_0x1b36d6=>{var _0x56c2b5=_0x383768,_0x1ad694;return _0x44e8df===_0x56c2b5(0x253)&&_0x19e4cf[_0x56c2b5(0x27b)]&&((_0x1ad694=_0x1b36d6==null?void 0x0:_0x1b36d6[_0x56c2b5(0x216)])==null?void 0x0:_0x1ad694[_0x56c2b5(0x252)])&&(_0x1b36d6[_0x56c2b5(0x216)][0x0]['origin']=_0x19e4cf[_0x56c2b5(0x27b)]),_0x1b36d6;};_0x19e4cf[_0x383768(0x1a2)]={'consoleLog':(_0x4e1560,_0x482d0e)=>{var _0x34429b=_0x383768;_0x19e4cf[_0x34429b(0x288)][_0x34429b(0x1c4)][_0x34429b(0x23b)]!==_0x34429b(0x24b)&&_0x22cafb(_0x25b5d7(_0x34429b(0x1c4),_0x4e1560,_0x22020b(),_0x25df7c,_0x482d0e));},'consoleTrace':(_0x5a6144,_0x1ac0e6)=>{var _0x535e69=_0x383768,_0x346fb6,_0x2942bd;_0x19e4cf[_0x535e69(0x288)][_0x535e69(0x1c4)][_0x535e69(0x23b)]!=='disabledTrace'&&((_0x2942bd=(_0x346fb6=_0x19e4cf[_0x535e69(0x271)])==null?void 0x0:_0x346fb6[_0x535e69(0x239)])!=null&&_0x2942bd[_0x535e69(0x26e)]&&(_0x19e4cf[_0x535e69(0x1f8)]=!0x0),_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x535e69(0x1d9),_0x5a6144,_0x22020b(),_0x25df7c,_0x1ac0e6))));},'consoleError':(_0x28d1b,_0x2a9562)=>{var _0x350d73=_0x383768;_0x19e4cf[_0x350d73(0x1f8)]=!0x0,_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x350d73(0x272),_0x28d1b,_0x22020b(),_0x25df7c,_0x2a9562)));},'consoleTime':_0x1d4043=>{_0x23127b(_0x1d4043);},'consoleTimeEnd':(_0x1b3eb5,_0x34349e)=>{_0x38104c(_0x34349e,_0x1b3eb5);},'autoLog':(_0x4c7deb,_0x116c7e)=>{var _0x1dbe7e=_0x383768;_0x22cafb(_0x25b5d7(_0x1dbe7e(0x1c4),_0x116c7e,_0x22020b(),_0x25df7c,[_0x4c7deb]));},'autoLogMany':(_0x22a012,_0x76de02)=>{var _0x3e5a97=_0x383768;_0x22cafb(_0x25b5d7(_0x3e5a97(0x1c4),_0x22a012,_0x22020b(),_0x25df7c,_0x76de02));},'autoTrace':(_0x398197,_0x5bc6c5)=>{var _0x2a022a=_0x383768;_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x2a022a(0x1d9),_0x5bc6c5,_0x22020b(),_0x25df7c,[_0x398197])));},'autoTraceMany':(_0x2d0c39,_0xb19a62)=>{var _0x3df4ab=_0x383768;_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x3df4ab(0x1d9),_0x2d0c39,_0x22020b(),_0x25df7c,_0xb19a62)));},'autoTime':(_0x1c2a8c,_0x4acf8e,_0xa3b48e)=>{_0x23127b(_0xa3b48e);},'autoTimeEnd':(_0x653ca5,_0x2aa262,_0x5e7f2b)=>{_0x38104c(_0x2aa262,_0x5e7f2b);},'coverage':_0x50e089=>{var _0x513d70=_0x383768;_0x22cafb({'method':_0x513d70(0x1fd),'version':_0x1a5085,'args':[{'id':_0x50e089}]});}};let _0x22cafb=H(_0x19e4cf,_0x382935,_0x529f3f,_0x4cbc8a,_0x44e8df,_0x10d6ef,_0x37127a),_0x25df7c=_0x19e4cf['_console_ninja_session'];return _0x19e4cf[_0x383768(0x1a2)];})(globalThis,'127.0.0.1',_0x3ec852(0x221),_0x3ec852(0x279),_0x3ec852(0x287),_0x3ec852(0x1f0),'1746894961775',_0x3ec852(0x237),_0x3ec852(0x1c9),_0x3ec852(0x222),_0x3ec852(0x1aa));");
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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x3ec852=_0x354e;(function(_0x1d3b82,_0x4b4e3f){var _0xde2504=_0x354e,_0xa41f60=_0x1d3b82();while(!![]){try{var _0x216156=-parseInt(_0xde2504(0x228))/0x1*(-parseInt(_0xde2504(0x1de))/0x2)+parseInt(_0xde2504(0x21e))/0x3*(parseInt(_0xde2504(0x270))/0x4)+-parseInt(_0xde2504(0x25f))/0x5*(parseInt(_0xde2504(0x290))/0x6)+-parseInt(_0xde2504(0x20e))/0x7*(-parseInt(_0xde2504(0x1e6))/0x8)+-parseInt(_0xde2504(0x1e1))/0x9*(-parseInt(_0xde2504(0x245))/0xa)+-parseInt(_0xde2504(0x1c3))/0xb+-parseInt(_0xde2504(0x261))/0xc;if(_0x216156===_0x4b4e3f)break;else _0xa41f60['push'](_0xa41f60['shift']());}catch(_0x4bb7a8){_0xa41f60['push'](_0xa41f60['shift']());}}}(_0xa4e2,0xc5ada));function _0x354e(_0x131f29,_0x3d7be2){var _0xa4e21e=_0xa4e2();return _0x354e=function(_0x354ea2,_0x3e54af){_0x354ea2=_0x354ea2-0x1a2;var _0x228cf7=_0xa4e21e[_0x354ea2];return _0x228cf7;},_0x354e(_0x131f29,_0x3d7be2);}var G=Object[_0x3ec852(0x205)],V=Object[_0x3ec852(0x1a8)],ee=Object[_0x3ec852(0x25c)],te=Object[_0x3ec852(0x27e)],ne=Object[_0x3ec852(0x20a)],re=Object[_0x3ec852(0x254)][_0x3ec852(0x209)],ie=(_0x4554d2,_0x125af2,_0x537847,_0x34abab)=>{var _0x348090=_0x3ec852;if(_0x125af2&&typeof _0x125af2==_0x348090(0x27d)||typeof _0x125af2==_0x348090(0x1ee)){for(let _0x3eaef0 of te(_0x125af2))!re['call'](_0x4554d2,_0x3eaef0)&&_0x3eaef0!==_0x537847&&V(_0x4554d2,_0x3eaef0,{'get':()=>_0x125af2[_0x3eaef0],'enumerable':!(_0x34abab=ee(_0x125af2,_0x3eaef0))||_0x34abab[_0x348090(0x286)]});}return _0x4554d2;},j=(_0x42f84b,_0x3fd4f4,_0x320463)=>(_0x320463=_0x42f84b!=null?G(ne(_0x42f84b)):{},ie(_0x3fd4f4||!_0x42f84b||!_0x42f84b[_0x3ec852(0x233)]?V(_0x320463,'default',{'value':_0x42f84b,'enumerable':!0x0}):_0x320463,_0x42f84b)),q=class{constructor(_0x22dd0d,_0x1caeb0,_0x32d725,_0x3a5306,_0x18d716,_0x51ba4f){var _0x31a98b=_0x3ec852,_0x5987ac,_0x1b991a,_0x469238,_0xff1fe0;this[_0x31a98b(0x217)]=_0x22dd0d,this['host']=_0x1caeb0,this[_0x31a98b(0x1d8)]=_0x32d725,this[_0x31a98b(0x1b4)]=_0x3a5306,this['dockerizedApp']=_0x18d716,this[_0x31a98b(0x200)]=_0x51ba4f,this[_0x31a98b(0x260)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this['_connected']=!0x1,this['_connecting']=!0x1,this['_inNextEdge']=((_0x1b991a=(_0x5987ac=_0x22dd0d[_0x31a98b(0x271)])==null?void 0x0:_0x5987ac[_0x31a98b(0x22a)])==null?void 0x0:_0x1b991a[_0x31a98b(0x26c)])==='edge',this[_0x31a98b(0x29a)]=!((_0xff1fe0=(_0x469238=this[_0x31a98b(0x217)][_0x31a98b(0x271)])==null?void 0x0:_0x469238[_0x31a98b(0x239)])!=null&&_0xff1fe0[_0x31a98b(0x26e)])&&!this[_0x31a98b(0x1b7)],this['_WebSocketClass']=null,this[_0x31a98b(0x20c)]=0x0,this[_0x31a98b(0x255)]=0x14,this[_0x31a98b(0x27a)]=_0x31a98b(0x1db),this[_0x31a98b(0x225)]=(this['_inBrowser']?_0x31a98b(0x23e):_0x31a98b(0x1f3))+this['_webSocketErrorDocsLink'];}async[_0x3ec852(0x210)](){var _0x1d2426=_0x3ec852,_0x40e0b4,_0x59a6a2;if(this[_0x1d2426(0x1ca)])return this[_0x1d2426(0x1ca)];let _0x496ffd;if(this['_inBrowser']||this[_0x1d2426(0x1b7)])_0x496ffd=this[_0x1d2426(0x217)]['WebSocket'];else{if((_0x40e0b4=this[_0x1d2426(0x217)]['process'])!=null&&_0x40e0b4['_WebSocket'])_0x496ffd=(_0x59a6a2=this[_0x1d2426(0x217)]['process'])==null?void 0x0:_0x59a6a2[_0x1d2426(0x241)];else try{let _0x37619e=await import('path');_0x496ffd=(await import((await import('url'))[_0x1d2426(0x297)](_0x37619e['join'](this[_0x1d2426(0x1b4)],'ws/index.js'))[_0x1d2426(0x249)]()))[_0x1d2426(0x285)];}catch{try{_0x496ffd=require(require('path')[_0x1d2426(0x1d7)](this[_0x1d2426(0x1b4)],'ws'));}catch{throw new Error(_0x1d2426(0x273));}}}return this[_0x1d2426(0x1ca)]=_0x496ffd,_0x496ffd;}[_0x3ec852(0x1d5)](){var _0x5becb1=_0x3ec852;this[_0x5becb1(0x1e3)]||this[_0x5becb1(0x26f)]||this[_0x5becb1(0x20c)]>=this[_0x5becb1(0x255)]||(this['_allowedToConnectOnSend']=!0x1,this[_0x5becb1(0x1e3)]=!0x0,this['_connectAttemptCount']++,this[_0x5becb1(0x1c8)]=new Promise((_0x2cc56c,_0xfb083f)=>{var _0x43981e=_0x5becb1;this['getWebSocketClass']()[_0x43981e(0x26d)](_0x9f738f=>{var _0x39eb7a=_0x43981e;let _0x1914fd=new _0x9f738f(_0x39eb7a(0x1e9)+(!this[_0x39eb7a(0x29a)]&&this[_0x39eb7a(0x236)]?_0x39eb7a(0x227):this[_0x39eb7a(0x295)])+':'+this[_0x39eb7a(0x1d8)]);_0x1914fd[_0x39eb7a(0x246)]=()=>{var _0x5b0fb5=_0x39eb7a;this[_0x5b0fb5(0x260)]=!0x1,this[_0x5b0fb5(0x1cb)](_0x1914fd),this[_0x5b0fb5(0x20f)](),_0xfb083f(new Error(_0x5b0fb5(0x1ae)));},_0x1914fd[_0x39eb7a(0x23d)]=()=>{var _0x1e3ccf=_0x39eb7a;this['_inBrowser']||_0x1914fd[_0x1e3ccf(0x24a)]&&_0x1914fd['_socket'][_0x1e3ccf(0x28a)]&&_0x1914fd[_0x1e3ccf(0x24a)][_0x1e3ccf(0x28a)](),_0x2cc56c(_0x1914fd);},_0x1914fd['onclose']=()=>{var _0x4a3ee2=_0x39eb7a;this['_allowedToConnectOnSend']=!0x0,this[_0x4a3ee2(0x1cb)](_0x1914fd),this[_0x4a3ee2(0x20f)]();},_0x1914fd['onmessage']=_0x59ab1b=>{var _0x7d423b=_0x39eb7a;try{if(!(_0x59ab1b!=null&&_0x59ab1b[_0x7d423b(0x1cf)])||!this['eventReceivedCallback'])return;let _0x2c10e5=JSON['parse'](_0x59ab1b[_0x7d423b(0x1cf)]);this[_0x7d423b(0x200)](_0x2c10e5['method'],_0x2c10e5[_0x7d423b(0x216)],this[_0x7d423b(0x217)],this[_0x7d423b(0x29a)]);}catch{}};})[_0x43981e(0x26d)](_0x5d67a9=>(this[_0x43981e(0x26f)]=!0x0,this[_0x43981e(0x1e3)]=!0x1,this[_0x43981e(0x242)]=!0x1,this[_0x43981e(0x260)]=!0x0,this[_0x43981e(0x20c)]=0x0,_0x5d67a9))[_0x43981e(0x28c)](_0x321977=>(this[_0x43981e(0x26f)]=!0x1,this[_0x43981e(0x1e3)]=!0x1,console['warn'](_0x43981e(0x282)+this[_0x43981e(0x27a)]),_0xfb083f(new Error('failed\\x20to\\x20connect\\x20to\\x20host:\\x20'+(_0x321977&&_0x321977[_0x43981e(0x247)])))));}));}[_0x3ec852(0x1cb)](_0x3b0b31){var _0x487b52=_0x3ec852;this[_0x487b52(0x26f)]=!0x1,this[_0x487b52(0x1e3)]=!0x1;try{_0x3b0b31[_0x487b52(0x1a6)]=null,_0x3b0b31[_0x487b52(0x246)]=null,_0x3b0b31[_0x487b52(0x23d)]=null;}catch{}try{_0x3b0b31[_0x487b52(0x1d2)]<0x2&&_0x3b0b31[_0x487b52(0x24d)]();}catch{}}[_0x3ec852(0x20f)](){var _0x85c4bd=_0x3ec852;clearTimeout(this[_0x85c4bd(0x1f1)]),!(this['_connectAttemptCount']>=this[_0x85c4bd(0x255)])&&(this[_0x85c4bd(0x1f1)]=setTimeout(()=>{var _0x20cd79=_0x85c4bd,_0x43296b;this[_0x20cd79(0x26f)]||this[_0x20cd79(0x1e3)]||(this['_connectToHostNow'](),(_0x43296b=this[_0x20cd79(0x1c8)])==null||_0x43296b[_0x20cd79(0x28c)](()=>this[_0x20cd79(0x20f)]()));},0x1f4),this[_0x85c4bd(0x1f1)][_0x85c4bd(0x28a)]&&this[_0x85c4bd(0x1f1)][_0x85c4bd(0x28a)]());}async['send'](_0x3b47e2){var _0x25d00e=_0x3ec852;try{if(!this[_0x25d00e(0x260)])return;this[_0x25d00e(0x242)]&&this[_0x25d00e(0x1d5)](),(await this[_0x25d00e(0x1c8)])[_0x25d00e(0x214)](JSON['stringify'](_0x3b47e2));}catch(_0x5d00ae){this[_0x25d00e(0x1e5)]?console[_0x25d00e(0x234)](this[_0x25d00e(0x225)]+':\\x20'+(_0x5d00ae&&_0x5d00ae[_0x25d00e(0x247)])):(this[_0x25d00e(0x1e5)]=!0x0,console[_0x25d00e(0x234)](this[_0x25d00e(0x225)]+':\\x20'+(_0x5d00ae&&_0x5d00ae[_0x25d00e(0x247)]),_0x3b47e2)),this['_allowedToSend']=!0x1,this[_0x25d00e(0x20f)]();}}};function H(_0x41f328,_0x233681,_0x4415cb,_0x55d5f3,_0x206d3f,_0x183128,_0x2c87f0,_0x1db5e4=oe){var _0x14ad51=_0x3ec852;let _0x444e0f=_0x4415cb['split'](',')[_0x14ad51(0x243)](_0x542835=>{var _0x533b01=_0x14ad51,_0x39c1d6,_0xffa7a3,_0x1f8eef,_0x28f950;try{if(!_0x41f328['_console_ninja_session']){let _0x4ada91=((_0xffa7a3=(_0x39c1d6=_0x41f328[_0x533b01(0x271)])==null?void 0x0:_0x39c1d6['versions'])==null?void 0x0:_0xffa7a3['node'])||((_0x28f950=(_0x1f8eef=_0x41f328[_0x533b01(0x271)])==null?void 0x0:_0x1f8eef['env'])==null?void 0x0:_0x28f950[_0x533b01(0x26c)])===_0x533b01(0x20d);(_0x206d3f===_0x533b01(0x253)||_0x206d3f===_0x533b01(0x1a4)||_0x206d3f===_0x533b01(0x1e7)||_0x206d3f===_0x533b01(0x1d0))&&(_0x206d3f+=_0x4ada91?_0x533b01(0x1bf):_0x533b01(0x230)),_0x41f328[_0x533b01(0x212)]={'id':+new Date(),'tool':_0x206d3f},_0x2c87f0&&_0x206d3f&&!_0x4ada91&&console[_0x533b01(0x1c4)]('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x206d3f[_0x533b01(0x269)](0x0)[_0x533b01(0x1af)]()+_0x206d3f[_0x533b01(0x1c1)](0x1))+',',_0x533b01(0x204),_0x533b01(0x1b6));}let _0x20c134=new q(_0x41f328,_0x233681,_0x542835,_0x55d5f3,_0x183128,_0x1db5e4);return _0x20c134[_0x533b01(0x214)][_0x533b01(0x1ce)](_0x20c134);}catch(_0x184dd7){return console[_0x533b01(0x234)](_0x533b01(0x1d6),_0x184dd7&&_0x184dd7[_0x533b01(0x247)]),()=>{};}});return _0x1b75df=>_0x444e0f[_0x14ad51(0x24f)](_0x53dbc2=>_0x53dbc2(_0x1b75df));}function oe(_0x209e5e,_0x1a37bc,_0x30c03a,_0x4b8ebf){var _0x23acd6=_0x3ec852;_0x4b8ebf&&_0x209e5e===_0x23acd6(0x298)&&_0x30c03a[_0x23acd6(0x23c)][_0x23acd6(0x298)]();}function _0xa4e2(){var _0x36ad35=['replace','_connecting','_isPrimitiveType','_extendedWarning','6074920LfIGvF','astro','String','ws://','_addProperty','match','hrtime','_p_name','function','funcName','1.0.0','_reconnectTimeout','Set','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','time','_isArray','noFunctions','[object\\x20BigInt]','_ninjaIgnoreNextError','now','Map','_HTMLAllCollection','number','coverage','Symbol','nan','eventReceivedCallback','_treeNodePropertiesAfterFullValue','undefined','_setNodeExpandableState','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','create','negativeZero','level','autoExpandPropertyCount','hasOwnProperty','getPrototypeOf','_Symbol','_connectAttemptCount','edge','7FUCggp','_attemptToReconnectShortly','getWebSocketClass','_consoleNinjaAllowedToStart','_console_ninja_session','totalStrLength','send','autoExpandLimit','args','global','Number','stackTraceLimit','_property','strLength','negativeInfinity','_isUndefined','33234KulolX','_type','push','63770','','type','current','_sendErrorMessage','_sortProps','gateway.docker.internal','1McRHFR','_setNodeExpressionPath','env','serialize','bigint','test','_addObjectProperty','set','\\x20browser','_quotedRegExp','array','__es'+'Module','warn','_p_','dockerizedApp',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.116\"],'autoExpand','versions','HTMLAllCollection','name','location','onopen','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','cappedElements','_cleanNode','_WebSocket','_allowedToConnectOnSend','map','null','88720pHyPRp','onerror','message','_isPrimitiveWrapperType','toString','_socket','disabledLog','timeStamp','close','cappedProps','forEach','_keyStrRegExp','some','length','next.js','prototype','_maxConnectAttemptCount','autoExpandMaxDepth','call','parent','sort','props','get','getOwnPropertyDescriptor','_setNodeQueryPath','hits','109105fKfjdK','_allowedToSend','8567820UVLRkT','boolean','valueOf','fromCharCode','_hasSymbolPropertyOnItsPath','_hasMapOnItsPath','_undefined','_p_length','charAt','_objectToString','Buffer','NEXT_RUNTIME','then','node','_connected','124BNoTrY','process','error','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','_isSet','_blacklistedProperty','getter','root_exp_id','_getOwnPropertyDescriptor',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.432/node_modules\",'_webSocketErrorDocsLink','origin','_addFunctionsNode','object','getOwnPropertyNames','_isMap','elements','_setNodePermissions','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','[object\\x20Map]','[object\\x20Array]','default','enumerable','webpack','console','_setNodeId','unref','depth','catch','performance','capped','hostname','300qhVsAu','concat','_isNegativeZero','isExpressionToEvaluate','_numberRegExp','host','isArray','pathToFileURL','reload','_treeNodePropertiesBeforeFullValue','_inBrowser','_console_ninja','_processTreeNodeResult','remix','slice','onclose','unshift','defineProperty','startsWith','1','NEGATIVE_INFINITY','reduceLimits','POSITIVE_INFINITY','logger\\x20websocket\\x20error','toUpperCase','resolveGetters','stringify','string','root_exp','nodeModules','toLowerCase','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','_inNextEdge','count','getOwnPropertySymbols','date','_capIfString','constructor','index','_propertyName','\\x20server','value','substr','setter','7835168QRrKIJ','log','unknown','sortProps','_additionalMetadata','_ws','','_WebSocketClass','_disposeWebsocket','_regExpToString','stack','bind','data','angular','_getOwnPropertySymbols','readyState','[object\\x20Date]','autoExpandPreviousObjects','_connectToHostNow','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','join','port','trace','rootExpression','https://tinyurl.com/37x8b79t','_setNodeLabel','_getOwnPropertyNames','2922476smcMmz','_dateToString','elapsed','774KZZKFn'];_0xa4e2=function(){return _0x36ad35;};return _0xa4e2();}function B(_0x20e038){var _0x445fd2=_0x3ec852,_0x2d0cb7,_0x48943e;let _0x59b43d=function(_0x3b5827,_0x3d5a93){return _0x3d5a93-_0x3b5827;},_0x44bb93;if(_0x20e038[_0x445fd2(0x28d)])_0x44bb93=function(){var _0x12b328=_0x445fd2;return _0x20e038[_0x12b328(0x28d)][_0x12b328(0x1f9)]();};else{if(_0x20e038[_0x445fd2(0x271)]&&_0x20e038['process'][_0x445fd2(0x1ec)]&&((_0x48943e=(_0x2d0cb7=_0x20e038[_0x445fd2(0x271)])==null?void 0x0:_0x2d0cb7['env'])==null?void 0x0:_0x48943e['NEXT_RUNTIME'])!==_0x445fd2(0x20d))_0x44bb93=function(){var _0x379054=_0x445fd2;return _0x20e038[_0x379054(0x271)]['hrtime']();},_0x59b43d=function(_0x3bc085,_0x582ef6){return 0x3e8*(_0x582ef6[0x0]-_0x3bc085[0x0])+(_0x582ef6[0x1]-_0x3bc085[0x1])/0xf4240;};else try{let {performance:_0xad52c}=require('perf_hooks');_0x44bb93=function(){var _0x5392ce=_0x445fd2;return _0xad52c[_0x5392ce(0x1f9)]();};}catch{_0x44bb93=function(){return+new Date();};}}return{'elapsed':_0x59b43d,'timeStamp':_0x44bb93,'now':()=>Date[_0x445fd2(0x1f9)]()};}function X(_0xc83504,_0x4b25fb,_0x1a2fd6){var _0x10b8b3=_0x3ec852,_0x2954ae,_0xfd3100,_0xfea6e8,_0x19cac5,_0x49560d;if(_0xc83504[_0x10b8b3(0x211)]!==void 0x0)return _0xc83504[_0x10b8b3(0x211)];let _0x1a1ca2=((_0xfd3100=(_0x2954ae=_0xc83504[_0x10b8b3(0x271)])==null?void 0x0:_0x2954ae[_0x10b8b3(0x239)])==null?void 0x0:_0xfd3100[_0x10b8b3(0x26e)])||((_0x19cac5=(_0xfea6e8=_0xc83504[_0x10b8b3(0x271)])==null?void 0x0:_0xfea6e8[_0x10b8b3(0x22a)])==null?void 0x0:_0x19cac5[_0x10b8b3(0x26c)])===_0x10b8b3(0x20d);function _0x234bf1(_0x2e82ee){var _0x55a884=_0x10b8b3;if(_0x2e82ee[_0x55a884(0x1a9)]('/')&&_0x2e82ee['endsWith']('/')){let _0x481f20=new RegExp(_0x2e82ee[_0x55a884(0x1a5)](0x1,-0x1));return _0x43848c=>_0x481f20[_0x55a884(0x22d)](_0x43848c);}else{if(_0x2e82ee['includes']('*')||_0x2e82ee['includes']('?')){let _0x2118ba=new RegExp('^'+_0x2e82ee['replace'](/\\./g,String[_0x55a884(0x264)](0x5c)+'.')[_0x55a884(0x1e2)](/\\*/g,'.*')[_0x55a884(0x1e2)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0x561f01=>_0x2118ba[_0x55a884(0x22d)](_0x561f01);}else return _0x470024=>_0x470024===_0x2e82ee;}}let _0x540d3f=_0x4b25fb[_0x10b8b3(0x243)](_0x234bf1);return _0xc83504['_consoleNinjaAllowedToStart']=_0x1a1ca2||!_0x4b25fb,!_0xc83504[_0x10b8b3(0x211)]&&((_0x49560d=_0xc83504[_0x10b8b3(0x23c)])==null?void 0x0:_0x49560d[_0x10b8b3(0x28f)])&&(_0xc83504[_0x10b8b3(0x211)]=_0x540d3f[_0x10b8b3(0x251)](_0x4133cb=>_0x4133cb(_0xc83504['location']['hostname']))),_0xc83504[_0x10b8b3(0x211)];}function J(_0x3a5821,_0x1052be,_0x42e4ae,_0x5041b8){var _0xb3127=_0x3ec852;_0x3a5821=_0x3a5821,_0x1052be=_0x1052be,_0x42e4ae=_0x42e4ae,_0x5041b8=_0x5041b8;let _0x3048cd=B(_0x3a5821),_0x482da7=_0x3048cd[_0xb3127(0x1e0)],_0x9c9eb0=_0x3048cd['timeStamp'];class _0x29f380{constructor(){var _0x669ff0=_0xb3127;this[_0x669ff0(0x250)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x669ff0(0x294)]=/^(0|[1-9][0-9]*)$/,this[_0x669ff0(0x231)]=/'([^\\\\']|\\\\')*'/,this[_0x669ff0(0x267)]=_0x3a5821[_0x669ff0(0x202)],this[_0x669ff0(0x1fb)]=_0x3a5821[_0x669ff0(0x23a)],this[_0x669ff0(0x278)]=Object[_0x669ff0(0x25c)],this[_0x669ff0(0x1dd)]=Object[_0x669ff0(0x27e)],this[_0x669ff0(0x20b)]=_0x3a5821[_0x669ff0(0x1fe)],this[_0x669ff0(0x1cc)]=RegExp[_0x669ff0(0x254)][_0x669ff0(0x249)],this[_0x669ff0(0x1df)]=Date[_0x669ff0(0x254)][_0x669ff0(0x249)];}[_0xb3127(0x22b)](_0x16456b,_0x1e969e,_0x4f036a,_0x13905c){var _0x6e731a=_0xb3127,_0x50bc58=this,_0xf3537f=_0x4f036a[_0x6e731a(0x238)];function _0x4808c8(_0x878d37,_0x4cf9c5,_0x14456a){var _0x3baa88=_0x6e731a;_0x4cf9c5[_0x3baa88(0x223)]=_0x3baa88(0x1c5),_0x4cf9c5[_0x3baa88(0x272)]=_0x878d37['message'],_0x4a51f2=_0x14456a['node']['current'],_0x14456a[_0x3baa88(0x26e)][_0x3baa88(0x224)]=_0x4cf9c5,_0x50bc58[_0x3baa88(0x299)](_0x4cf9c5,_0x14456a);}let _0x45cb1e;_0x3a5821[_0x6e731a(0x288)]&&(_0x45cb1e=_0x3a5821[_0x6e731a(0x288)][_0x6e731a(0x272)],_0x45cb1e&&(_0x3a5821[_0x6e731a(0x288)][_0x6e731a(0x272)]=function(){}));try{try{_0x4f036a[_0x6e731a(0x207)]++,_0x4f036a[_0x6e731a(0x238)]&&_0x4f036a[_0x6e731a(0x1d4)]['push'](_0x1e969e);var _0xfac4ff,_0x15fb5b,_0xba5a45,_0x3b84d3,_0x807424=[],_0x3fb545=[],_0x5bc8fe,_0x25dd2e=this[_0x6e731a(0x21f)](_0x1e969e),_0x1da13b=_0x25dd2e==='array',_0x5777f9=!0x1,_0x1b0b86=_0x25dd2e===_0x6e731a(0x1ee),_0x45eefd=this[_0x6e731a(0x1e4)](_0x25dd2e),_0x5eada3=this[_0x6e731a(0x248)](_0x25dd2e),_0xa15d01=_0x45eefd||_0x5eada3,_0x18e06a={},_0x5200a4=0x0,_0x512e40=!0x1,_0x4a51f2,_0x3f0914=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x4f036a[_0x6e731a(0x28b)]){if(_0x1da13b){if(_0x15fb5b=_0x1e969e['length'],_0x15fb5b>_0x4f036a['elements']){for(_0xba5a45=0x0,_0x3b84d3=_0x4f036a[_0x6e731a(0x280)],_0xfac4ff=_0xba5a45;_0xfac4ff<_0x3b84d3;_0xfac4ff++)_0x3fb545[_0x6e731a(0x220)](_0x50bc58['_addProperty'](_0x807424,_0x1e969e,_0x25dd2e,_0xfac4ff,_0x4f036a));_0x16456b[_0x6e731a(0x23f)]=!0x0;}else{for(_0xba5a45=0x0,_0x3b84d3=_0x15fb5b,_0xfac4ff=_0xba5a45;_0xfac4ff<_0x3b84d3;_0xfac4ff++)_0x3fb545['push'](_0x50bc58[_0x6e731a(0x1ea)](_0x807424,_0x1e969e,_0x25dd2e,_0xfac4ff,_0x4f036a));}_0x4f036a[_0x6e731a(0x208)]+=_0x3fb545['length'];}if(!(_0x25dd2e==='null'||_0x25dd2e==='undefined')&&!_0x45eefd&&_0x25dd2e!==_0x6e731a(0x1e8)&&_0x25dd2e!==_0x6e731a(0x26b)&&_0x25dd2e!==_0x6e731a(0x22c)){var _0x2f7bd5=_0x13905c[_0x6e731a(0x25a)]||_0x4f036a['props'];if(this[_0x6e731a(0x274)](_0x1e969e)?(_0xfac4ff=0x0,_0x1e969e[_0x6e731a(0x24f)](function(_0x15dbcd){var _0x95763b=_0x6e731a;if(_0x5200a4++,_0x4f036a[_0x95763b(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;return;}if(!_0x4f036a['isExpressionToEvaluate']&&_0x4f036a[_0x95763b(0x238)]&&_0x4f036a[_0x95763b(0x208)]>_0x4f036a[_0x95763b(0x215)]){_0x512e40=!0x0;return;}_0x3fb545[_0x95763b(0x220)](_0x50bc58[_0x95763b(0x1ea)](_0x807424,_0x1e969e,_0x95763b(0x1f2),_0xfac4ff++,_0x4f036a,function(_0x50d177){return function(){return _0x50d177;};}(_0x15dbcd)));})):this[_0x6e731a(0x27f)](_0x1e969e)&&_0x1e969e['forEach'](function(_0x1e9fdc,_0x3859fb){var _0x594511=_0x6e731a;if(_0x5200a4++,_0x4f036a[_0x594511(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;return;}if(!_0x4f036a[_0x594511(0x293)]&&_0x4f036a['autoExpand']&&_0x4f036a[_0x594511(0x208)]>_0x4f036a[_0x594511(0x215)]){_0x512e40=!0x0;return;}var _0x1533a0=_0x3859fb[_0x594511(0x249)]();_0x1533a0[_0x594511(0x252)]>0x64&&(_0x1533a0=_0x1533a0['slice'](0x0,0x64)+'...'),_0x3fb545['push'](_0x50bc58[_0x594511(0x1ea)](_0x807424,_0x1e969e,_0x594511(0x1fa),_0x1533a0,_0x4f036a,function(_0x3e272a){return function(){return _0x3e272a;};}(_0x1e9fdc)));}),!_0x5777f9){try{for(_0x5bc8fe in _0x1e969e)if(!(_0x1da13b&&_0x3f0914[_0x6e731a(0x22d)](_0x5bc8fe))&&!this['_blacklistedProperty'](_0x1e969e,_0x5bc8fe,_0x4f036a)){if(_0x5200a4++,_0x4f036a[_0x6e731a(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;break;}if(!_0x4f036a[_0x6e731a(0x293)]&&_0x4f036a['autoExpand']&&_0x4f036a[_0x6e731a(0x208)]>_0x4f036a[_0x6e731a(0x215)]){_0x512e40=!0x0;break;}_0x3fb545['push'](_0x50bc58[_0x6e731a(0x22e)](_0x807424,_0x18e06a,_0x1e969e,_0x25dd2e,_0x5bc8fe,_0x4f036a));}}catch{}if(_0x18e06a[_0x6e731a(0x268)]=!0x0,_0x1b0b86&&(_0x18e06a[_0x6e731a(0x1ed)]=!0x0),!_0x512e40){var _0x1c596f=[]['concat'](this[_0x6e731a(0x1dd)](_0x1e969e))[_0x6e731a(0x291)](this['_getOwnPropertySymbols'](_0x1e969e));for(_0xfac4ff=0x0,_0x15fb5b=_0x1c596f[_0x6e731a(0x252)];_0xfac4ff<_0x15fb5b;_0xfac4ff++)if(_0x5bc8fe=_0x1c596f[_0xfac4ff],!(_0x1da13b&&_0x3f0914[_0x6e731a(0x22d)](_0x5bc8fe[_0x6e731a(0x249)]()))&&!this[_0x6e731a(0x275)](_0x1e969e,_0x5bc8fe,_0x4f036a)&&!_0x18e06a['_p_'+_0x5bc8fe[_0x6e731a(0x249)]()]){if(_0x5200a4++,_0x4f036a[_0x6e731a(0x208)]++,_0x5200a4>_0x2f7bd5){_0x512e40=!0x0;break;}if(!_0x4f036a[_0x6e731a(0x293)]&&_0x4f036a[_0x6e731a(0x238)]&&_0x4f036a[_0x6e731a(0x208)]>_0x4f036a['autoExpandLimit']){_0x512e40=!0x0;break;}_0x3fb545[_0x6e731a(0x220)](_0x50bc58[_0x6e731a(0x22e)](_0x807424,_0x18e06a,_0x1e969e,_0x25dd2e,_0x5bc8fe,_0x4f036a));}}}}}if(_0x16456b[_0x6e731a(0x223)]=_0x25dd2e,_0xa15d01?(_0x16456b[_0x6e731a(0x1c0)]=_0x1e969e[_0x6e731a(0x263)](),this[_0x6e731a(0x1bb)](_0x25dd2e,_0x16456b,_0x4f036a,_0x13905c)):_0x25dd2e===_0x6e731a(0x1ba)?_0x16456b[_0x6e731a(0x1c0)]=this[_0x6e731a(0x1df)][_0x6e731a(0x257)](_0x1e969e):_0x25dd2e==='bigint'?_0x16456b[_0x6e731a(0x1c0)]=_0x1e969e['toString']():_0x25dd2e==='RegExp'?_0x16456b[_0x6e731a(0x1c0)]=this[_0x6e731a(0x1cc)][_0x6e731a(0x257)](_0x1e969e):_0x25dd2e==='symbol'&&this[_0x6e731a(0x20b)]?_0x16456b[_0x6e731a(0x1c0)]=this[_0x6e731a(0x20b)][_0x6e731a(0x254)]['toString'][_0x6e731a(0x257)](_0x1e969e):!_0x4f036a['depth']&&!(_0x25dd2e===_0x6e731a(0x244)||_0x25dd2e===_0x6e731a(0x202))&&(delete _0x16456b[_0x6e731a(0x1c0)],_0x16456b['capped']=!0x0),_0x512e40&&(_0x16456b[_0x6e731a(0x24e)]=!0x0),_0x4a51f2=_0x4f036a[_0x6e731a(0x26e)]['current'],_0x4f036a[_0x6e731a(0x26e)][_0x6e731a(0x224)]=_0x16456b,this[_0x6e731a(0x299)](_0x16456b,_0x4f036a),_0x3fb545[_0x6e731a(0x252)]){for(_0xfac4ff=0x0,_0x15fb5b=_0x3fb545['length'];_0xfac4ff<_0x15fb5b;_0xfac4ff++)_0x3fb545[_0xfac4ff](_0xfac4ff);}_0x807424[_0x6e731a(0x252)]&&(_0x16456b['props']=_0x807424);}catch(_0x3388f9){_0x4808c8(_0x3388f9,_0x16456b,_0x4f036a);}this[_0x6e731a(0x1c7)](_0x1e969e,_0x16456b),this[_0x6e731a(0x201)](_0x16456b,_0x4f036a),_0x4f036a[_0x6e731a(0x26e)]['current']=_0x4a51f2,_0x4f036a[_0x6e731a(0x207)]--,_0x4f036a[_0x6e731a(0x238)]=_0xf3537f,_0x4f036a[_0x6e731a(0x238)]&&_0x4f036a[_0x6e731a(0x1d4)]['pop']();}finally{_0x45cb1e&&(_0x3a5821[_0x6e731a(0x288)][_0x6e731a(0x272)]=_0x45cb1e);}return _0x16456b;}[_0xb3127(0x1d1)](_0x22475d){var _0x24a928=_0xb3127;return Object[_0x24a928(0x1b9)]?Object[_0x24a928(0x1b9)](_0x22475d):[];}[_0xb3127(0x274)](_0x300fdc){var _0x74478f=_0xb3127;return!!(_0x300fdc&&_0x3a5821['Set']&&this[_0x74478f(0x26a)](_0x300fdc)==='[object\\x20Set]'&&_0x300fdc['forEach']);}[_0xb3127(0x275)](_0x53be4e,_0x38097c,_0x4fa6cf){var _0x4a2967=_0xb3127;return _0x4fa6cf[_0x4a2967(0x1f6)]?typeof _0x53be4e[_0x38097c]==_0x4a2967(0x1ee):!0x1;}[_0xb3127(0x21f)](_0x3476be){var _0x3e50fd=_0xb3127,_0x360c41='';return _0x360c41=typeof _0x3476be,_0x360c41===_0x3e50fd(0x27d)?this[_0x3e50fd(0x26a)](_0x3476be)===_0x3e50fd(0x284)?_0x360c41='array':this[_0x3e50fd(0x26a)](_0x3476be)===_0x3e50fd(0x1d3)?_0x360c41='date':this[_0x3e50fd(0x26a)](_0x3476be)===_0x3e50fd(0x1f7)?_0x360c41=_0x3e50fd(0x22c):_0x3476be===null?_0x360c41=_0x3e50fd(0x244):_0x3476be[_0x3e50fd(0x1bc)]&&(_0x360c41=_0x3476be['constructor'][_0x3e50fd(0x23b)]||_0x360c41):_0x360c41===_0x3e50fd(0x202)&&this[_0x3e50fd(0x1fb)]&&_0x3476be instanceof this[_0x3e50fd(0x1fb)]&&(_0x360c41='HTMLAllCollection'),_0x360c41;}[_0xb3127(0x26a)](_0xc08161){var _0x2b573c=_0xb3127;return Object[_0x2b573c(0x254)][_0x2b573c(0x249)][_0x2b573c(0x257)](_0xc08161);}[_0xb3127(0x1e4)](_0x36467a){var _0x43d30a=_0xb3127;return _0x36467a===_0x43d30a(0x262)||_0x36467a===_0x43d30a(0x1b2)||_0x36467a===_0x43d30a(0x1fc);}[_0xb3127(0x248)](_0x594a4a){return _0x594a4a==='Boolean'||_0x594a4a==='String'||_0x594a4a==='Number';}[_0xb3127(0x1ea)](_0x1d9b48,_0x5d184e,_0x34c2ba,_0x389ffa,_0x817f15,_0x1aabbd){var _0x59ff55=this;return function(_0x5471fd){var _0x541816=_0x354e,_0x2bc053=_0x817f15[_0x541816(0x26e)][_0x541816(0x224)],_0x4ea941=_0x817f15[_0x541816(0x26e)]['index'],_0x328364=_0x817f15[_0x541816(0x26e)][_0x541816(0x258)];_0x817f15[_0x541816(0x26e)][_0x541816(0x258)]=_0x2bc053,_0x817f15[_0x541816(0x26e)]['index']=typeof _0x389ffa=='number'?_0x389ffa:_0x5471fd,_0x1d9b48[_0x541816(0x220)](_0x59ff55[_0x541816(0x21a)](_0x5d184e,_0x34c2ba,_0x389ffa,_0x817f15,_0x1aabbd)),_0x817f15[_0x541816(0x26e)][_0x541816(0x258)]=_0x328364,_0x817f15[_0x541816(0x26e)][_0x541816(0x1bd)]=_0x4ea941;};}[_0xb3127(0x22e)](_0x62ef53,_0x191f7a,_0x2f5a53,_0x2904d3,_0x21f7a2,_0x2c31e2,_0x396622){var _0x54fb86=_0xb3127,_0x29b1bd=this;return _0x191f7a['_p_'+_0x21f7a2[_0x54fb86(0x249)]()]=!0x0,function(_0x2ddeb8){var _0x45e080=_0x54fb86,_0x4d1c7e=_0x2c31e2['node']['current'],_0x3f2b37=_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x1bd)],_0x358102=_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x258)];_0x2c31e2[_0x45e080(0x26e)]['parent']=_0x4d1c7e,_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x1bd)]=_0x2ddeb8,_0x62ef53['push'](_0x29b1bd[_0x45e080(0x21a)](_0x2f5a53,_0x2904d3,_0x21f7a2,_0x2c31e2,_0x396622)),_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x258)]=_0x358102,_0x2c31e2[_0x45e080(0x26e)][_0x45e080(0x1bd)]=_0x3f2b37;};}[_0xb3127(0x21a)](_0xa52b9,_0x108ec5,_0x3af85a,_0x2bfe19,_0x31e4a6){var _0x4b80d6=_0xb3127,_0x6935f0=this;_0x31e4a6||(_0x31e4a6=function(_0x40cd3c,_0x2ead91){return _0x40cd3c[_0x2ead91];});var _0x54fee8=_0x3af85a['toString'](),_0x354c22=_0x2bfe19['expressionsToEvaluate']||{},_0x4e38a6=_0x2bfe19[_0x4b80d6(0x28b)],_0x3e979a=_0x2bfe19['isExpressionToEvaluate'];try{var _0x5d757f=this['_isMap'](_0xa52b9),_0x214926=_0x54fee8;_0x5d757f&&_0x214926[0x0]==='\\x27'&&(_0x214926=_0x214926[_0x4b80d6(0x1c1)](0x1,_0x214926[_0x4b80d6(0x252)]-0x2));var _0x4f34d1=_0x2bfe19['expressionsToEvaluate']=_0x354c22[_0x4b80d6(0x235)+_0x214926];_0x4f34d1&&(_0x2bfe19['depth']=_0x2bfe19[_0x4b80d6(0x28b)]+0x1),_0x2bfe19['isExpressionToEvaluate']=!!_0x4f34d1;var _0x2044ae=typeof _0x3af85a=='symbol',_0x3d9baa={'name':_0x2044ae||_0x5d757f?_0x54fee8:this['_propertyName'](_0x54fee8)};if(_0x2044ae&&(_0x3d9baa['symbol']=!0x0),!(_0x108ec5===_0x4b80d6(0x232)||_0x108ec5==='Error')){var _0xa8fe95=this['_getOwnPropertyDescriptor'](_0xa52b9,_0x3af85a);if(_0xa8fe95&&(_0xa8fe95[_0x4b80d6(0x22f)]&&(_0x3d9baa[_0x4b80d6(0x1c2)]=!0x0),_0xa8fe95[_0x4b80d6(0x25b)]&&!_0x4f34d1&&!_0x2bfe19[_0x4b80d6(0x1b0)]))return _0x3d9baa[_0x4b80d6(0x276)]=!0x0,this['_processTreeNodeResult'](_0x3d9baa,_0x2bfe19),_0x3d9baa;}var _0x3ca3be;try{_0x3ca3be=_0x31e4a6(_0xa52b9,_0x3af85a);}catch(_0x4a1e91){return _0x3d9baa={'name':_0x54fee8,'type':_0x4b80d6(0x1c5),'error':_0x4a1e91[_0x4b80d6(0x247)]},this[_0x4b80d6(0x1a3)](_0x3d9baa,_0x2bfe19),_0x3d9baa;}var _0x5e618d=this[_0x4b80d6(0x21f)](_0x3ca3be),_0x522c5a=this[_0x4b80d6(0x1e4)](_0x5e618d);if(_0x3d9baa['type']=_0x5e618d,_0x522c5a)this[_0x4b80d6(0x1a3)](_0x3d9baa,_0x2bfe19,_0x3ca3be,function(){var _0x3a0d0d=_0x4b80d6;_0x3d9baa[_0x3a0d0d(0x1c0)]=_0x3ca3be[_0x3a0d0d(0x263)](),!_0x4f34d1&&_0x6935f0['_capIfString'](_0x5e618d,_0x3d9baa,_0x2bfe19,{});});else{var _0x4e0ea3=_0x2bfe19[_0x4b80d6(0x238)]&&_0x2bfe19[_0x4b80d6(0x207)]<_0x2bfe19[_0x4b80d6(0x256)]&&_0x2bfe19[_0x4b80d6(0x1d4)]['indexOf'](_0x3ca3be)<0x0&&_0x5e618d!==_0x4b80d6(0x1ee)&&_0x2bfe19[_0x4b80d6(0x208)]<_0x2bfe19['autoExpandLimit'];_0x4e0ea3||_0x2bfe19[_0x4b80d6(0x207)]<_0x4e38a6||_0x4f34d1?(this[_0x4b80d6(0x22b)](_0x3d9baa,_0x3ca3be,_0x2bfe19,_0x4f34d1||{}),this['_additionalMetadata'](_0x3ca3be,_0x3d9baa)):this[_0x4b80d6(0x1a3)](_0x3d9baa,_0x2bfe19,_0x3ca3be,function(){var _0x50a27f=_0x4b80d6;_0x5e618d==='null'||_0x5e618d===_0x50a27f(0x202)||(delete _0x3d9baa['value'],_0x3d9baa[_0x50a27f(0x28e)]=!0x0);});}return _0x3d9baa;}finally{_0x2bfe19['expressionsToEvaluate']=_0x354c22,_0x2bfe19['depth']=_0x4e38a6,_0x2bfe19[_0x4b80d6(0x293)]=_0x3e979a;}}[_0xb3127(0x1bb)](_0x2ebf27,_0x5583e5,_0x313d81,_0x46a792){var _0x5ba39b=_0xb3127,_0x2f7a10=_0x46a792[_0x5ba39b(0x21b)]||_0x313d81[_0x5ba39b(0x21b)];if((_0x2ebf27===_0x5ba39b(0x1b2)||_0x2ebf27===_0x5ba39b(0x1e8))&&_0x5583e5[_0x5ba39b(0x1c0)]){let _0x154bf2=_0x5583e5['value'][_0x5ba39b(0x252)];_0x313d81['allStrLength']+=_0x154bf2,_0x313d81['allStrLength']>_0x313d81[_0x5ba39b(0x213)]?(_0x5583e5[_0x5ba39b(0x28e)]='',delete _0x5583e5[_0x5ba39b(0x1c0)]):_0x154bf2>_0x2f7a10&&(_0x5583e5[_0x5ba39b(0x28e)]=_0x5583e5[_0x5ba39b(0x1c0)][_0x5ba39b(0x1c1)](0x0,_0x2f7a10),delete _0x5583e5[_0x5ba39b(0x1c0)]);}}['_isMap'](_0x9078e6){var _0x3e5272=_0xb3127;return!!(_0x9078e6&&_0x3a5821[_0x3e5272(0x1fa)]&&this['_objectToString'](_0x9078e6)===_0x3e5272(0x283)&&_0x9078e6[_0x3e5272(0x24f)]);}[_0xb3127(0x1be)](_0x392633){var _0x552f3f=_0xb3127;if(_0x392633['match'](/^\\d+$/))return _0x392633;var _0x438a74;try{_0x438a74=JSON[_0x552f3f(0x1b1)](''+_0x392633);}catch{_0x438a74='\\x22'+this[_0x552f3f(0x26a)](_0x392633)+'\\x22';}return _0x438a74[_0x552f3f(0x1eb)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x438a74=_0x438a74['substr'](0x1,_0x438a74[_0x552f3f(0x252)]-0x2):_0x438a74=_0x438a74[_0x552f3f(0x1e2)](/'/g,'\\x5c\\x27')[_0x552f3f(0x1e2)](/\\\\\"/g,'\\x22')['replace'](/(^\"|\"$)/g,'\\x27'),_0x438a74;}[_0xb3127(0x1a3)](_0x3f25e6,_0x586312,_0x4716aa,_0x2821b6){var _0xc54001=_0xb3127;this[_0xc54001(0x299)](_0x3f25e6,_0x586312),_0x2821b6&&_0x2821b6(),this[_0xc54001(0x1c7)](_0x4716aa,_0x3f25e6),this[_0xc54001(0x201)](_0x3f25e6,_0x586312);}[_0xb3127(0x299)](_0x3cff7d,_0x2d439e){var _0x1cf56f=_0xb3127;this[_0x1cf56f(0x289)](_0x3cff7d,_0x2d439e),this[_0x1cf56f(0x25d)](_0x3cff7d,_0x2d439e),this['_setNodeExpressionPath'](_0x3cff7d,_0x2d439e),this[_0x1cf56f(0x281)](_0x3cff7d,_0x2d439e);}[_0xb3127(0x289)](_0x5adc61,_0x1e4366){}[_0xb3127(0x25d)](_0x5efa9c,_0xe4f3d4){}[_0xb3127(0x1dc)](_0x469c7a,_0x3b948e){}[_0xb3127(0x21d)](_0xd108b4){return _0xd108b4===this['_undefined'];}[_0xb3127(0x201)](_0x190b6b,_0x240881){var _0x4e43e1=_0xb3127;this[_0x4e43e1(0x1dc)](_0x190b6b,_0x240881),this[_0x4e43e1(0x203)](_0x190b6b),_0x240881['sortProps']&&this[_0x4e43e1(0x226)](_0x190b6b),this['_addFunctionsNode'](_0x190b6b,_0x240881),this['_addLoadNode'](_0x190b6b,_0x240881),this['_cleanNode'](_0x190b6b);}['_additionalMetadata'](_0x30bd89,_0x21c9e7){var _0x3cc971=_0xb3127;try{_0x30bd89&&typeof _0x30bd89['length']==_0x3cc971(0x1fc)&&(_0x21c9e7[_0x3cc971(0x252)]=_0x30bd89[_0x3cc971(0x252)]);}catch{}if(_0x21c9e7[_0x3cc971(0x223)]===_0x3cc971(0x1fc)||_0x21c9e7['type']===_0x3cc971(0x218)){if(isNaN(_0x21c9e7['value']))_0x21c9e7[_0x3cc971(0x1ff)]=!0x0,delete _0x21c9e7[_0x3cc971(0x1c0)];else switch(_0x21c9e7[_0x3cc971(0x1c0)]){case Number[_0x3cc971(0x1ad)]:_0x21c9e7['positiveInfinity']=!0x0,delete _0x21c9e7[_0x3cc971(0x1c0)];break;case Number[_0x3cc971(0x1ab)]:_0x21c9e7[_0x3cc971(0x21c)]=!0x0,delete _0x21c9e7[_0x3cc971(0x1c0)];break;case 0x0:this[_0x3cc971(0x292)](_0x21c9e7[_0x3cc971(0x1c0)])&&(_0x21c9e7[_0x3cc971(0x206)]=!0x0);break;}}else _0x21c9e7[_0x3cc971(0x223)]===_0x3cc971(0x1ee)&&typeof _0x30bd89['name']=='string'&&_0x30bd89[_0x3cc971(0x23b)]&&_0x21c9e7['name']&&_0x30bd89[_0x3cc971(0x23b)]!==_0x21c9e7[_0x3cc971(0x23b)]&&(_0x21c9e7[_0x3cc971(0x1ef)]=_0x30bd89[_0x3cc971(0x23b)]);}[_0xb3127(0x292)](_0xfd1374){var _0x2a4790=_0xb3127;return 0x1/_0xfd1374===Number[_0x2a4790(0x1ab)];}['_sortProps'](_0x448e2f){var _0x4b6e8e=_0xb3127;!_0x448e2f[_0x4b6e8e(0x25a)]||!_0x448e2f[_0x4b6e8e(0x25a)][_0x4b6e8e(0x252)]||_0x448e2f['type']==='array'||_0x448e2f[_0x4b6e8e(0x223)]===_0x4b6e8e(0x1fa)||_0x448e2f[_0x4b6e8e(0x223)]===_0x4b6e8e(0x1f2)||_0x448e2f[_0x4b6e8e(0x25a)][_0x4b6e8e(0x259)](function(_0x151a8e,_0x13e517){var _0xe61612=_0x4b6e8e,_0x548a50=_0x151a8e[_0xe61612(0x23b)][_0xe61612(0x1b5)](),_0xdab317=_0x13e517[_0xe61612(0x23b)][_0xe61612(0x1b5)]();return _0x548a50<_0xdab317?-0x1:_0x548a50>_0xdab317?0x1:0x0;});}[_0xb3127(0x27c)](_0x3ec893,_0x4065b3){var _0x3fcc4b=_0xb3127;if(!(_0x4065b3[_0x3fcc4b(0x1f6)]||!_0x3ec893[_0x3fcc4b(0x25a)]||!_0x3ec893[_0x3fcc4b(0x25a)][_0x3fcc4b(0x252)])){for(var _0x5a239b=[],_0x33bd01=[],_0x407303=0x0,_0x1b7597=_0x3ec893[_0x3fcc4b(0x25a)][_0x3fcc4b(0x252)];_0x407303<_0x1b7597;_0x407303++){var _0x4a87d4=_0x3ec893['props'][_0x407303];_0x4a87d4[_0x3fcc4b(0x223)]===_0x3fcc4b(0x1ee)?_0x5a239b[_0x3fcc4b(0x220)](_0x4a87d4):_0x33bd01[_0x3fcc4b(0x220)](_0x4a87d4);}if(!(!_0x33bd01['length']||_0x5a239b[_0x3fcc4b(0x252)]<=0x1)){_0x3ec893['props']=_0x33bd01;var _0x1206bb={'functionsNode':!0x0,'props':_0x5a239b};this[_0x3fcc4b(0x289)](_0x1206bb,_0x4065b3),this[_0x3fcc4b(0x1dc)](_0x1206bb,_0x4065b3),this[_0x3fcc4b(0x203)](_0x1206bb),this['_setNodePermissions'](_0x1206bb,_0x4065b3),_0x1206bb['id']+='\\x20f',_0x3ec893[_0x3fcc4b(0x25a)][_0x3fcc4b(0x1a7)](_0x1206bb);}}}['_addLoadNode'](_0x3257a0,_0x2c9597){}[_0xb3127(0x203)](_0x2b783b){}[_0xb3127(0x1f5)](_0x1e2317){var _0x3b0d25=_0xb3127;return Array[_0x3b0d25(0x296)](_0x1e2317)||typeof _0x1e2317==_0x3b0d25(0x27d)&&this['_objectToString'](_0x1e2317)===_0x3b0d25(0x284);}[_0xb3127(0x281)](_0x23413e,_0x2053e2){}[_0xb3127(0x240)](_0x508c7d){var _0xbd6357=_0xb3127;delete _0x508c7d[_0xbd6357(0x265)],delete _0x508c7d['_hasSetOnItsPath'],delete _0x508c7d[_0xbd6357(0x266)];}[_0xb3127(0x229)](_0x193f5b,_0x3d4b46){}}let _0x81c045=new _0x29f380(),_0x10c4a6={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x216919={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x8c8dd6(_0x31dd29,_0x4609dd,_0x3089ad,_0x3ece0c,_0xe0883d,_0x8ec857){var _0x2ef2ed=_0xb3127;let _0x42d3ba,_0x3584dc;try{_0x3584dc=_0x9c9eb0(),_0x42d3ba=_0x42e4ae[_0x4609dd],!_0x42d3ba||_0x3584dc-_0x42d3ba['ts']>0x1f4&&_0x42d3ba['count']&&_0x42d3ba['time']/_0x42d3ba[_0x2ef2ed(0x1b8)]<0x64?(_0x42e4ae[_0x4609dd]=_0x42d3ba={'count':0x0,'time':0x0,'ts':_0x3584dc},_0x42e4ae[_0x2ef2ed(0x25e)]={}):_0x3584dc-_0x42e4ae[_0x2ef2ed(0x25e)]['ts']>0x32&&_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1b8)]&&_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1f4)]/_0x42e4ae[_0x2ef2ed(0x25e)]['count']<0x64&&(_0x42e4ae[_0x2ef2ed(0x25e)]={});let _0x13fe9a=[],_0x3061fe=_0x42d3ba[_0x2ef2ed(0x1ac)]||_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1ac)]?_0x216919:_0x10c4a6,_0x51ec12=_0x18a714=>{var _0x39f5ef=_0x2ef2ed;let _0x19e118={};return _0x19e118[_0x39f5ef(0x25a)]=_0x18a714[_0x39f5ef(0x25a)],_0x19e118[_0x39f5ef(0x280)]=_0x18a714[_0x39f5ef(0x280)],_0x19e118[_0x39f5ef(0x21b)]=_0x18a714[_0x39f5ef(0x21b)],_0x19e118[_0x39f5ef(0x213)]=_0x18a714['totalStrLength'],_0x19e118[_0x39f5ef(0x215)]=_0x18a714[_0x39f5ef(0x215)],_0x19e118[_0x39f5ef(0x256)]=_0x18a714[_0x39f5ef(0x256)],_0x19e118[_0x39f5ef(0x1c6)]=!0x1,_0x19e118[_0x39f5ef(0x1f6)]=!_0x1052be,_0x19e118[_0x39f5ef(0x28b)]=0x1,_0x19e118[_0x39f5ef(0x207)]=0x0,_0x19e118['expId']=_0x39f5ef(0x277),_0x19e118[_0x39f5ef(0x1da)]=_0x39f5ef(0x1b3),_0x19e118['autoExpand']=!0x0,_0x19e118[_0x39f5ef(0x1d4)]=[],_0x19e118[_0x39f5ef(0x208)]=0x0,_0x19e118[_0x39f5ef(0x1b0)]=!0x0,_0x19e118['allStrLength']=0x0,_0x19e118[_0x39f5ef(0x26e)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x19e118;};for(var _0xce3a97=0x0;_0xce3a97<_0xe0883d[_0x2ef2ed(0x252)];_0xce3a97++)_0x13fe9a[_0x2ef2ed(0x220)](_0x81c045[_0x2ef2ed(0x22b)]({'timeNode':_0x31dd29===_0x2ef2ed(0x1f4)||void 0x0},_0xe0883d[_0xce3a97],_0x51ec12(_0x3061fe),{}));if(_0x31dd29==='trace'||_0x31dd29===_0x2ef2ed(0x272)){let _0x3cf829=Error[_0x2ef2ed(0x219)];try{Error[_0x2ef2ed(0x219)]=0x1/0x0,_0x13fe9a['push'](_0x81c045['serialize']({'stackNode':!0x0},new Error()[_0x2ef2ed(0x1cd)],_0x51ec12(_0x3061fe),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x3cf829;}}return{'method':_0x2ef2ed(0x1c4),'version':_0x5041b8,'args':[{'ts':_0x3089ad,'session':_0x3ece0c,'args':_0x13fe9a,'id':_0x4609dd,'context':_0x8ec857}]};}catch(_0x366a2c){return{'method':'log','version':_0x5041b8,'args':[{'ts':_0x3089ad,'session':_0x3ece0c,'args':[{'type':_0x2ef2ed(0x1c5),'error':_0x366a2c&&_0x366a2c[_0x2ef2ed(0x247)]}],'id':_0x4609dd,'context':_0x8ec857}]};}finally{try{if(_0x42d3ba&&_0x3584dc){let _0x597e97=_0x9c9eb0();_0x42d3ba['count']++,_0x42d3ba[_0x2ef2ed(0x1f4)]+=_0x482da7(_0x3584dc,_0x597e97),_0x42d3ba['ts']=_0x597e97,_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1b8)]++,_0x42e4ae['hits'][_0x2ef2ed(0x1f4)]+=_0x482da7(_0x3584dc,_0x597e97),_0x42e4ae[_0x2ef2ed(0x25e)]['ts']=_0x597e97,(_0x42d3ba[_0x2ef2ed(0x1b8)]>0x32||_0x42d3ba['time']>0x64)&&(_0x42d3ba[_0x2ef2ed(0x1ac)]=!0x0),(_0x42e4ae[_0x2ef2ed(0x25e)]['count']>0x3e8||_0x42e4ae['hits'][_0x2ef2ed(0x1f4)]>0x12c)&&(_0x42e4ae[_0x2ef2ed(0x25e)][_0x2ef2ed(0x1ac)]=!0x0);}}catch{}}}return _0x8c8dd6;}((_0x19e4cf,_0x382935,_0x529f3f,_0x4cbc8a,_0x44e8df,_0x1a5085,_0x3c09e2,_0x192c71,_0x49ad0d,_0x10d6ef,_0x37127a)=>{var _0x383768=_0x3ec852;if(_0x19e4cf[_0x383768(0x1a2)])return _0x19e4cf['_console_ninja'];if(!X(_0x19e4cf,_0x192c71,_0x44e8df))return _0x19e4cf['_console_ninja']={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x19e4cf['_console_ninja'];let _0x168ffe=B(_0x19e4cf),_0x5486cc=_0x168ffe[_0x383768(0x1e0)],_0x9cc80f=_0x168ffe[_0x383768(0x24c)],_0x22020b=_0x168ffe[_0x383768(0x1f9)],_0x37a3e8={'hits':{},'ts':{}},_0x25b5d7=J(_0x19e4cf,_0x49ad0d,_0x37a3e8,_0x1a5085),_0x23127b=_0x214ce2=>{_0x37a3e8['ts'][_0x214ce2]=_0x9cc80f();},_0x38104c=(_0x4030db,_0x34b230)=>{var _0x52d39d=_0x383768;let _0x39758b=_0x37a3e8['ts'][_0x34b230];if(delete _0x37a3e8['ts'][_0x34b230],_0x39758b){let _0x3edb2e=_0x5486cc(_0x39758b,_0x9cc80f());_0x22cafb(_0x25b5d7(_0x52d39d(0x1f4),_0x4030db,_0x22020b(),_0x25df7c,[_0x3edb2e],_0x34b230));}},_0xa3f2d5=_0x1b36d6=>{var _0x56c2b5=_0x383768,_0x1ad694;return _0x44e8df===_0x56c2b5(0x253)&&_0x19e4cf[_0x56c2b5(0x27b)]&&((_0x1ad694=_0x1b36d6==null?void 0x0:_0x1b36d6[_0x56c2b5(0x216)])==null?void 0x0:_0x1ad694[_0x56c2b5(0x252)])&&(_0x1b36d6[_0x56c2b5(0x216)][0x0]['origin']=_0x19e4cf[_0x56c2b5(0x27b)]),_0x1b36d6;};_0x19e4cf[_0x383768(0x1a2)]={'consoleLog':(_0x4e1560,_0x482d0e)=>{var _0x34429b=_0x383768;_0x19e4cf[_0x34429b(0x288)][_0x34429b(0x1c4)][_0x34429b(0x23b)]!==_0x34429b(0x24b)&&_0x22cafb(_0x25b5d7(_0x34429b(0x1c4),_0x4e1560,_0x22020b(),_0x25df7c,_0x482d0e));},'consoleTrace':(_0x5a6144,_0x1ac0e6)=>{var _0x535e69=_0x383768,_0x346fb6,_0x2942bd;_0x19e4cf[_0x535e69(0x288)][_0x535e69(0x1c4)][_0x535e69(0x23b)]!=='disabledTrace'&&((_0x2942bd=(_0x346fb6=_0x19e4cf[_0x535e69(0x271)])==null?void 0x0:_0x346fb6[_0x535e69(0x239)])!=null&&_0x2942bd[_0x535e69(0x26e)]&&(_0x19e4cf[_0x535e69(0x1f8)]=!0x0),_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x535e69(0x1d9),_0x5a6144,_0x22020b(),_0x25df7c,_0x1ac0e6))));},'consoleError':(_0x28d1b,_0x2a9562)=>{var _0x350d73=_0x383768;_0x19e4cf[_0x350d73(0x1f8)]=!0x0,_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x350d73(0x272),_0x28d1b,_0x22020b(),_0x25df7c,_0x2a9562)));},'consoleTime':_0x1d4043=>{_0x23127b(_0x1d4043);},'consoleTimeEnd':(_0x1b3eb5,_0x34349e)=>{_0x38104c(_0x34349e,_0x1b3eb5);},'autoLog':(_0x4c7deb,_0x116c7e)=>{var _0x1dbe7e=_0x383768;_0x22cafb(_0x25b5d7(_0x1dbe7e(0x1c4),_0x116c7e,_0x22020b(),_0x25df7c,[_0x4c7deb]));},'autoLogMany':(_0x22a012,_0x76de02)=>{var _0x3e5a97=_0x383768;_0x22cafb(_0x25b5d7(_0x3e5a97(0x1c4),_0x22a012,_0x22020b(),_0x25df7c,_0x76de02));},'autoTrace':(_0x398197,_0x5bc6c5)=>{var _0x2a022a=_0x383768;_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x2a022a(0x1d9),_0x5bc6c5,_0x22020b(),_0x25df7c,[_0x398197])));},'autoTraceMany':(_0x2d0c39,_0xb19a62)=>{var _0x3df4ab=_0x383768;_0x22cafb(_0xa3f2d5(_0x25b5d7(_0x3df4ab(0x1d9),_0x2d0c39,_0x22020b(),_0x25df7c,_0xb19a62)));},'autoTime':(_0x1c2a8c,_0x4acf8e,_0xa3b48e)=>{_0x23127b(_0xa3b48e);},'autoTimeEnd':(_0x653ca5,_0x2aa262,_0x5e7f2b)=>{_0x38104c(_0x2aa262,_0x5e7f2b);},'coverage':_0x50e089=>{var _0x513d70=_0x383768;_0x22cafb({'method':_0x513d70(0x1fd),'version':_0x1a5085,'args':[{'id':_0x50e089}]});}};let _0x22cafb=H(_0x19e4cf,_0x382935,_0x529f3f,_0x4cbc8a,_0x44e8df,_0x10d6ef,_0x37127a),_0x25df7c=_0x19e4cf['_console_ninja_session'];return _0x19e4cf[_0x383768(0x1a2)];})(globalThis,'127.0.0.1',_0x3ec852(0x221),_0x3ec852(0x279),_0x3ec852(0x287),_0x3ec852(0x1f0),'1746894961775',_0x3ec852(0x237),_0x3ec852(0x1c9),_0x3ec852(0x222),_0x3ec852(0x1aa));");
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
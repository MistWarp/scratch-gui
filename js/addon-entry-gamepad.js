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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x26cbec=_0x4e5d;(function(_0x210d44,_0x1831ab){var _0x356c24=_0x4e5d,_0x1058bd=_0x210d44();while(!![]){try{var _0xda2372=parseInt(_0x356c24(0x2c1))/0x1*(-parseInt(_0x356c24(0x281))/0x2)+-parseInt(_0x356c24(0x29a))/0x3*(-parseInt(_0x356c24(0x1e5))/0x4)+-parseInt(_0x356c24(0x229))/0x5+parseInt(_0x356c24(0x28f))/0x6+parseInt(_0x356c24(0x2c4))/0x7*(-parseInt(_0x356c24(0x254))/0x8)+parseInt(_0x356c24(0x277))/0x9+parseInt(_0x356c24(0x21d))/0xa*(parseInt(_0x356c24(0x2a0))/0xb);if(_0xda2372===_0x1831ab)break;else _0x1058bd['push'](_0x1058bd['shift']());}catch(_0x5df211){_0x1058bd['push'](_0x1058bd['shift']());}}}(_0x475f,0xbdf6e));function _0x475f(){var _0x4f79ef=['substr','timeStamp','getPrototypeOf','autoExpand','_type','defineProperty','parse','NEGATIVE_INFINITY','getOwnPropertySymbols','dockerizedApp','bind','_sendErrorMessage','onclose','_HTMLAllCollection','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','__es'+'Module','_isPrimitiveType','[object\\x20Array]','3078050eNYbhr','_addFunctionsNode','concat','value','args','_ws','WebSocket','...','_connectAttemptCount','string','data','performance','1787290EcAegl',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.443/node_modules\",'current','unknown','name','_getOwnPropertyNames','eventReceivedCallback','_p_length','origin','_maxConnectAttemptCount','_Symbol','symbol','NEXT_RUNTIME','_additionalMetadata','\\x20server','get','node','_reconnectTimeout','strLength','expId','Symbol','1747670802260','hits','then','_property','_inNextEdge','ws://','process','serialize','match','global','capped','catch','_webSocketErrorDocsLink','_processTreeNodeResult','_WebSocket','ws/index.js','_connecting','stackTraceLimit','_inBrowser','_connectToHostNow','message','Number','12100200vvRLqp','nan','onmessage','push','noFunctions','toString','default','forEach','Boolean','[object\\x20Map]','number','console','String','send','_ninjaIgnoreNextError','Map','array','_p_','versions','now','angular','_connected','coverage','slice','','POSITIVE_INFINITY','allStrLength','_addObjectProperty','some','%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','_setNodeExpandableState','_addProperty','_undefined','call','test','5636016BFXhkL','depth','parent','map','bigint','stringify','location','elements','root_exp','_attemptToReconnectShortly','6zizOyg','_setNodePermissions','prototype','expressionsToEvaluate','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','elapsed','getOwnPropertyNames','create','props','charAt','_isUndefined','isExpressionToEvaluate','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','replace','4350960tsxpiY','totalStrLength','object','[object\\x20Date]','_disposeWebsocket','_hasSetOnItsPath','astro','function','nodeModules','autoExpandPreviousObjects','toLowerCase','3BeZpUY','trace','_capIfString','remix','pathToFileURL','https://tinyurl.com/37x8b79t','11RGYOJY','port','reduceLimits','_setNodeQueryPath','valueOf','_socket','_treeNodePropertiesBeforeFullValue','autoExpandMaxDepth','_numberRegExp','unref','negativeInfinity','env','logger\\x20websocket\\x20error','127.0.0.1','next.js','_isMap','warn','log','_isSet',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3\",\"192.168.50.172\",\"192.168.50.236\"],'split','getOwnPropertyDescriptor','_getOwnPropertySymbols','null','fromCharCode','onerror','gateway.docker.internal','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','error','_quotedRegExp','count','includes','date','13341XwFJyL','_console_ninja_session','cappedElements','7HypLqw','_setNodeExpressionPath','getWebSocketClass','_allowedToConnectOnSend','','join','Buffer','path','_setNodeId','\\x20browser','reload','onopen','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','autoExpandPropertyCount','Set','_getOwnPropertyDescriptor','perf_hooks','1','index','length','_hasSymbolPropertyOnItsPath','autoExpandLimit','method','_isPrimitiveWrapperType','4115644FCPIBX','disabledLog','disabledTrace','HTMLAllCollection','hostname','_cleanNode','_keyStrRegExp','unshift','getter','_consoleNinjaAllowedToStart','_regExpToString','_sortProps','_propertyName','_setNodeLabel','_dateToString','sortProps','_allowedToSend','_treeNodePropertiesAfterFullValue','undefined','close','pop','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','url','resolveGetters','positiveInfinity','startsWith','_WebSocketClass','type','time','level','host','_isNegativeZero','_console_ninja','_extendedWarning','_objectToString','_blacklistedProperty','_addLoadNode'];_0x475f=function(){return _0x4f79ef;};return _0x475f();}var G=Object[_0x26cbec(0x288)],V=Object[_0x26cbec(0x20f)],ee=Object['getOwnPropertyDescriptor'],te=Object[_0x26cbec(0x287)],ne=Object[_0x26cbec(0x20c)],re=Object[_0x26cbec(0x283)]['hasOwnProperty'],ie=(_0xedc63,_0x440d05,_0x555189,_0x2dd6fe)=>{var _0x56eabb=_0x26cbec;if(_0x440d05&&typeof _0x440d05=='object'||typeof _0x440d05==_0x56eabb(0x296)){for(let _0x12ed6a of te(_0x440d05))!re[_0x56eabb(0x275)](_0xedc63,_0x12ed6a)&&_0x12ed6a!==_0x555189&&V(_0xedc63,_0x12ed6a,{'get':()=>_0x440d05[_0x12ed6a],'enumerable':!(_0x2dd6fe=ee(_0x440d05,_0x12ed6a))||_0x2dd6fe['enumerable']});}return _0xedc63;},j=(_0x46ebe7,_0x3ef9b2,_0x424335)=>(_0x424335=_0x46ebe7!=null?G(ne(_0x46ebe7)):{},ie(_0x3ef9b2||!_0x46ebe7||!_0x46ebe7[_0x26cbec(0x21a)]?V(_0x424335,_0x26cbec(0x25a),{'value':_0x46ebe7,'enumerable':!0x0}):_0x424335,_0x46ebe7)),q=class{constructor(_0x355186,_0x235a46,_0x6a686,_0x459cfa,_0x4268d6,_0x3e8f6b){var _0x32ace4=_0x26cbec,_0x249e44,_0x7da2ac,_0x54bbcd,_0x5eb254;this[_0x32ace4(0x247)]=_0x355186,this['host']=_0x235a46,this[_0x32ace4(0x2a1)]=_0x6a686,this[_0x32ace4(0x297)]=_0x459cfa,this[_0x32ace4(0x213)]=_0x4268d6,this['eventReceivedCallback']=_0x3e8f6b,this[_0x32ace4(0x1f5)]=!0x0,this[_0x32ace4(0x2c7)]=!0x0,this['_connected']=!0x1,this[_0x32ace4(0x24e)]=!0x1,this[_0x32ace4(0x242)]=((_0x7da2ac=(_0x249e44=_0x355186[_0x32ace4(0x244)])==null?void 0x0:_0x249e44[_0x32ace4(0x2ab)])==null?void 0x0:_0x7da2ac[_0x32ace4(0x235)])==='edge',this[_0x32ace4(0x250)]=!((_0x5eb254=(_0x54bbcd=this[_0x32ace4(0x247)][_0x32ace4(0x244)])==null?void 0x0:_0x54bbcd[_0x32ace4(0x266)])!=null&&_0x5eb254[_0x32ace4(0x239)])&&!this[_0x32ace4(0x242)],this[_0x32ace4(0x1ff)]=null,this['_connectAttemptCount']=0x0,this['_maxConnectAttemptCount']=0x14,this[_0x32ace4(0x24a)]=_0x32ace4(0x29f),this['_sendErrorMessage']=(this[_0x32ace4(0x250)]?_0x32ace4(0x219):_0x32ace4(0x1fa))+this[_0x32ace4(0x24a)];}async[_0x26cbec(0x2c6)](){var _0x26bf9e=_0x26cbec,_0x362cfd,_0x3669e3;if(this[_0x26bf9e(0x1ff)])return this['_WebSocketClass'];let _0x2a55fb;if(this['_inBrowser']||this[_0x26bf9e(0x242)])_0x2a55fb=this['global'][_0x26bf9e(0x223)];else{if((_0x362cfd=this[_0x26bf9e(0x247)][_0x26bf9e(0x244)])!=null&&_0x362cfd['_WebSocket'])_0x2a55fb=(_0x3669e3=this['global'][_0x26bf9e(0x244)])==null?void 0x0:_0x3669e3[_0x26bf9e(0x24c)];else try{let _0x2e8287=await import(_0x26bf9e(0x2cb));_0x2a55fb=(await import((await import(_0x26bf9e(0x1fb)))[_0x26bf9e(0x29e)](_0x2e8287[_0x26bf9e(0x2c9)](this[_0x26bf9e(0x297)],_0x26bf9e(0x24d)))[_0x26bf9e(0x259)]()))[_0x26bf9e(0x25a)];}catch{try{_0x2a55fb=require(require('path')[_0x26bf9e(0x2c9)](this[_0x26bf9e(0x297)],'ws'));}catch{throw new Error(_0x26bf9e(0x2bb));}}}return this[_0x26bf9e(0x1ff)]=_0x2a55fb,_0x2a55fb;}[_0x26cbec(0x251)](){var _0x2b30ee=_0x26cbec;this[_0x2b30ee(0x24e)]||this['_connected']||this[_0x2b30ee(0x225)]>=this['_maxConnectAttemptCount']||(this['_allowedToConnectOnSend']=!0x1,this[_0x2b30ee(0x24e)]=!0x0,this[_0x2b30ee(0x225)]++,this[_0x2b30ee(0x222)]=new Promise((_0x5d380b,_0x499f74)=>{var _0x1f8d29=_0x2b30ee;this['getWebSocketClass']()[_0x1f8d29(0x240)](_0x372ba3=>{var _0x15619f=_0x1f8d29;let _0x17bda8=new _0x372ba3(_0x15619f(0x243)+(!this['_inBrowser']&&this[_0x15619f(0x213)]?_0x15619f(0x2ba):this[_0x15619f(0x203)])+':'+this[_0x15619f(0x2a1)]);_0x17bda8[_0x15619f(0x2b9)]=()=>{var _0x574de0=_0x15619f;this['_allowedToSend']=!0x1,this['_disposeWebsocket'](_0x17bda8),this['_attemptToReconnectShortly'](),_0x499f74(new Error(_0x574de0(0x2ac)));},_0x17bda8[_0x15619f(0x1d8)]=()=>{var _0x1d42c7=_0x15619f;this[_0x1d42c7(0x250)]||_0x17bda8[_0x1d42c7(0x2a5)]&&_0x17bda8['_socket'][_0x1d42c7(0x2a9)]&&_0x17bda8['_socket'][_0x1d42c7(0x2a9)](),_0x5d380b(_0x17bda8);},_0x17bda8[_0x15619f(0x216)]=()=>{var _0x4e149d=_0x15619f;this['_allowedToConnectOnSend']=!0x0,this[_0x4e149d(0x293)](_0x17bda8),this['_attemptToReconnectShortly']();},_0x17bda8[_0x15619f(0x256)]=_0x2713e1=>{var _0x16c797=_0x15619f;try{if(!(_0x2713e1!=null&&_0x2713e1[_0x16c797(0x227)])||!this[_0x16c797(0x22f)])return;let _0x2da435=JSON[_0x16c797(0x210)](_0x2713e1[_0x16c797(0x227)]);this['eventReceivedCallback'](_0x2da435[_0x16c797(0x1e3)],_0x2da435[_0x16c797(0x221)],this[_0x16c797(0x247)],this[_0x16c797(0x250)]);}catch{}};})['then'](_0xb70a1c=>(this[_0x1f8d29(0x269)]=!0x0,this['_connecting']=!0x1,this[_0x1f8d29(0x2c7)]=!0x1,this[_0x1f8d29(0x1f5)]=!0x0,this['_connectAttemptCount']=0x0,_0xb70a1c))[_0x1f8d29(0x249)](_0x53cd09=>(this[_0x1f8d29(0x269)]=!0x1,this[_0x1f8d29(0x24e)]=!0x1,console[_0x1f8d29(0x2b0)](_0x1f8d29(0x1d9)+this[_0x1f8d29(0x24a)]),_0x499f74(new Error(_0x1f8d29(0x285)+(_0x53cd09&&_0x53cd09[_0x1f8d29(0x252)])))));}));}[_0x26cbec(0x293)](_0x597b5a){var _0x5602b4=_0x26cbec;this[_0x5602b4(0x269)]=!0x1,this['_connecting']=!0x1;try{_0x597b5a[_0x5602b4(0x216)]=null,_0x597b5a[_0x5602b4(0x2b9)]=null,_0x597b5a[_0x5602b4(0x1d8)]=null;}catch{}try{_0x597b5a['readyState']<0x2&&_0x597b5a[_0x5602b4(0x1f8)]();}catch{}}['_attemptToReconnectShortly'](){var _0x21ea49=_0x26cbec;clearTimeout(this[_0x21ea49(0x23a)]),!(this[_0x21ea49(0x225)]>=this[_0x21ea49(0x232)])&&(this['_reconnectTimeout']=setTimeout(()=>{var _0x587db6=_0x21ea49,_0x195bc3;this[_0x587db6(0x269)]||this[_0x587db6(0x24e)]||(this[_0x587db6(0x251)](),(_0x195bc3=this['_ws'])==null||_0x195bc3[_0x587db6(0x249)](()=>this[_0x587db6(0x280)]()));},0x1f4),this['_reconnectTimeout'][_0x21ea49(0x2a9)]&&this['_reconnectTimeout']['unref']());}async[_0x26cbec(0x261)](_0x56885f){var _0x23613e=_0x26cbec;try{if(!this[_0x23613e(0x1f5)])return;this[_0x23613e(0x2c7)]&&this[_0x23613e(0x251)](),(await this[_0x23613e(0x222)])[_0x23613e(0x261)](JSON['stringify'](_0x56885f));}catch(_0x24b85d){this[_0x23613e(0x206)]?console['warn'](this[_0x23613e(0x215)]+':\\x20'+(_0x24b85d&&_0x24b85d[_0x23613e(0x252)])):(this[_0x23613e(0x206)]=!0x0,console['warn'](this[_0x23613e(0x215)]+':\\x20'+(_0x24b85d&&_0x24b85d['message']),_0x56885f)),this[_0x23613e(0x1f5)]=!0x1,this[_0x23613e(0x280)]();}}};function H(_0x576cce,_0x464544,_0x4c7fb7,_0x3912c9,_0x1ad23a,_0x133022,_0x3a0527,_0x4b89d9=oe){var _0x48819d=_0x26cbec;let _0x5a3f91=_0x4c7fb7[_0x48819d(0x2b4)](',')[_0x48819d(0x27a)](_0x5e9293=>{var _0xd44e68=_0x48819d,_0x545f7e,_0x26b146,_0x889107,_0x538eea;try{if(!_0x576cce['_console_ninja_session']){let _0x2d940f=((_0x26b146=(_0x545f7e=_0x576cce['process'])==null?void 0x0:_0x545f7e['versions'])==null?void 0x0:_0x26b146[_0xd44e68(0x239)])||((_0x538eea=(_0x889107=_0x576cce[_0xd44e68(0x244)])==null?void 0x0:_0x889107[_0xd44e68(0x2ab)])==null?void 0x0:_0x538eea['NEXT_RUNTIME'])==='edge';(_0x1ad23a===_0xd44e68(0x2ae)||_0x1ad23a===_0xd44e68(0x29d)||_0x1ad23a===_0xd44e68(0x295)||_0x1ad23a===_0xd44e68(0x268))&&(_0x1ad23a+=_0x2d940f?_0xd44e68(0x237):_0xd44e68(0x1d6)),_0x576cce['_console_ninja_session']={'id':+new Date(),'tool':_0x1ad23a},_0x3a0527&&_0x1ad23a&&!_0x2d940f&&console['log'](_0xd44e68(0x271)+(_0x1ad23a[_0xd44e68(0x28a)](0x0)['toUpperCase']()+_0x1ad23a[_0xd44e68(0x20a)](0x1))+',',_0xd44e68(0x218),_0xd44e68(0x28d));}let _0x5145de=new q(_0x576cce,_0x464544,_0x5e9293,_0x3912c9,_0x133022,_0x4b89d9);return _0x5145de['send'][_0xd44e68(0x214)](_0x5145de);}catch(_0x3cedfc){return console[_0xd44e68(0x2b0)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host',_0x3cedfc&&_0x3cedfc[_0xd44e68(0x252)]),()=>{};}});return _0x11383a=>_0x5a3f91[_0x48819d(0x25b)](_0x2008bc=>_0x2008bc(_0x11383a));}function oe(_0x1041b7,_0x419b27,_0x4c010f,_0x3cc700){var _0x3d3ae2=_0x26cbec;_0x3cc700&&_0x1041b7===_0x3d3ae2(0x1d7)&&_0x4c010f['location']['reload']();}function B(_0xc5ebf1){var _0xfb923b=_0x26cbec,_0x5fe023,_0x336054;let _0x31be16=function(_0x5386f4,_0x14c3aa){return _0x14c3aa-_0x5386f4;},_0x20e295;if(_0xc5ebf1[_0xfb923b(0x228)])_0x20e295=function(){var _0x915b2a=_0xfb923b;return _0xc5ebf1[_0x915b2a(0x228)][_0x915b2a(0x267)]();};else{if(_0xc5ebf1[_0xfb923b(0x244)]&&_0xc5ebf1[_0xfb923b(0x244)]['hrtime']&&((_0x336054=(_0x5fe023=_0xc5ebf1[_0xfb923b(0x244)])==null?void 0x0:_0x5fe023[_0xfb923b(0x2ab)])==null?void 0x0:_0x336054['NEXT_RUNTIME'])!=='edge')_0x20e295=function(){var _0x398033=_0xfb923b;return _0xc5ebf1[_0x398033(0x244)]['hrtime']();},_0x31be16=function(_0x306fa4,_0xb69eb0){return 0x3e8*(_0xb69eb0[0x0]-_0x306fa4[0x0])+(_0xb69eb0[0x1]-_0x306fa4[0x1])/0xf4240;};else try{let {performance:_0x5d8823}=require(_0xfb923b(0x1dd));_0x20e295=function(){return _0x5d8823['now']();};}catch{_0x20e295=function(){return+new Date();};}}return{'elapsed':_0x31be16,'timeStamp':_0x20e295,'now':()=>Date[_0xfb923b(0x267)]()};}function X(_0x20bac5,_0x1f4c9e,_0x1a09b2){var _0x1ab375=_0x26cbec,_0x3570f1,_0x3042ad,_0x756119,_0xef87c8,_0x5b7c94;if(_0x20bac5['_consoleNinjaAllowedToStart']!==void 0x0)return _0x20bac5[_0x1ab375(0x1ee)];let _0x49c6f3=((_0x3042ad=(_0x3570f1=_0x20bac5[_0x1ab375(0x244)])==null?void 0x0:_0x3570f1[_0x1ab375(0x266)])==null?void 0x0:_0x3042ad[_0x1ab375(0x239)])||((_0xef87c8=(_0x756119=_0x20bac5[_0x1ab375(0x244)])==null?void 0x0:_0x756119[_0x1ab375(0x2ab)])==null?void 0x0:_0xef87c8[_0x1ab375(0x235)])==='edge';function _0x42e718(_0x34c99b){var _0x28646f=_0x1ab375;if(_0x34c99b[_0x28646f(0x1fe)]('/')&&_0x34c99b['endsWith']('/')){let _0x2621c8=new RegExp(_0x34c99b['slice'](0x1,-0x1));return _0x57f7fe=>_0x2621c8[_0x28646f(0x276)](_0x57f7fe);}else{if(_0x34c99b[_0x28646f(0x2bf)]('*')||_0x34c99b['includes']('?')){let _0x4553d8=new RegExp('^'+_0x34c99b[_0x28646f(0x28e)](/\\./g,String[_0x28646f(0x2b8)](0x5c)+'.')[_0x28646f(0x28e)](/\\*/g,'.*')[_0x28646f(0x28e)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0xec7cf7=>_0x4553d8['test'](_0xec7cf7);}else return _0x2794ce=>_0x2794ce===_0x34c99b;}}let _0x489d1d=_0x1f4c9e[_0x1ab375(0x27a)](_0x42e718);return _0x20bac5[_0x1ab375(0x1ee)]=_0x49c6f3||!_0x1f4c9e,!_0x20bac5[_0x1ab375(0x1ee)]&&((_0x5b7c94=_0x20bac5[_0x1ab375(0x27d)])==null?void 0x0:_0x5b7c94[_0x1ab375(0x1e9)])&&(_0x20bac5[_0x1ab375(0x1ee)]=_0x489d1d[_0x1ab375(0x270)](_0x51475e=>_0x51475e(_0x20bac5[_0x1ab375(0x27d)][_0x1ab375(0x1e9)]))),_0x20bac5[_0x1ab375(0x1ee)];}function J(_0x5b0c78,_0x27aee4,_0x4a857b,_0x475fa2){var _0x4807fa=_0x26cbec;_0x5b0c78=_0x5b0c78,_0x27aee4=_0x27aee4,_0x4a857b=_0x4a857b,_0x475fa2=_0x475fa2;let _0x566fac=B(_0x5b0c78),_0xd32059=_0x566fac[_0x4807fa(0x286)],_0x86ae58=_0x566fac[_0x4807fa(0x20b)];class _0x4d1e51{constructor(){var _0x31911e=_0x4807fa;this[_0x31911e(0x1eb)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x31911e(0x2a8)]=/^(0|[1-9][0-9]*)$/,this[_0x31911e(0x2bd)]=/'([^\\\\']|\\\\')*'/,this[_0x31911e(0x274)]=_0x5b0c78[_0x31911e(0x1f7)],this[_0x31911e(0x217)]=_0x5b0c78['HTMLAllCollection'],this['_getOwnPropertyDescriptor']=Object[_0x31911e(0x2b5)],this[_0x31911e(0x22e)]=Object[_0x31911e(0x287)],this['_Symbol']=_0x5b0c78[_0x31911e(0x23d)],this[_0x31911e(0x1ef)]=RegExp['prototype'][_0x31911e(0x259)],this[_0x31911e(0x1f3)]=Date[_0x31911e(0x283)][_0x31911e(0x259)];}[_0x4807fa(0x245)](_0x9dac66,_0x1faf5c,_0x1c9223,_0x45fa90){var _0x450dc5=_0x4807fa,_0x42b2c9=this,_0x24ad5c=_0x1c9223[_0x450dc5(0x20d)];function _0x1e6bd4(_0x47ecb6,_0x799687,_0xba9ba4){var _0x27b39b=_0x450dc5;_0x799687[_0x27b39b(0x200)]='unknown',_0x799687[_0x27b39b(0x2bc)]=_0x47ecb6[_0x27b39b(0x252)],_0x1f0518=_0xba9ba4['node'][_0x27b39b(0x22b)],_0xba9ba4[_0x27b39b(0x239)][_0x27b39b(0x22b)]=_0x799687,_0x42b2c9[_0x27b39b(0x2a6)](_0x799687,_0xba9ba4);}let _0x2f5294;_0x5b0c78['console']&&(_0x2f5294=_0x5b0c78[_0x450dc5(0x25f)][_0x450dc5(0x2bc)],_0x2f5294&&(_0x5b0c78[_0x450dc5(0x25f)][_0x450dc5(0x2bc)]=function(){}));try{try{_0x1c9223[_0x450dc5(0x202)]++,_0x1c9223['autoExpand']&&_0x1c9223[_0x450dc5(0x298)][_0x450dc5(0x257)](_0x1faf5c);var _0x2e839b,_0x5abfd7,_0x57af1d,_0x2e7c55,_0x9b5c9c=[],_0x3a5e42=[],_0x4d5e64,_0x1bd9a4=this[_0x450dc5(0x20e)](_0x1faf5c),_0x2f0a70=_0x1bd9a4===_0x450dc5(0x264),_0x23d1c8=!0x1,_0x15b344=_0x1bd9a4===_0x450dc5(0x296),_0x3ea29f=this[_0x450dc5(0x21b)](_0x1bd9a4),_0x579d3f=this[_0x450dc5(0x1e4)](_0x1bd9a4),_0x53a5c7=_0x3ea29f||_0x579d3f,_0x5b46a1={},_0x2a465b=0x0,_0x26b7ba=!0x1,_0x1f0518,_0x35769f=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x1c9223[_0x450dc5(0x278)]){if(_0x2f0a70){if(_0x5abfd7=_0x1faf5c[_0x450dc5(0x1e0)],_0x5abfd7>_0x1c9223['elements']){for(_0x57af1d=0x0,_0x2e7c55=_0x1c9223[_0x450dc5(0x27e)],_0x2e839b=_0x57af1d;_0x2e839b<_0x2e7c55;_0x2e839b++)_0x3a5e42[_0x450dc5(0x257)](_0x42b2c9['_addProperty'](_0x9b5c9c,_0x1faf5c,_0x1bd9a4,_0x2e839b,_0x1c9223));_0x9dac66[_0x450dc5(0x2c3)]=!0x0;}else{for(_0x57af1d=0x0,_0x2e7c55=_0x5abfd7,_0x2e839b=_0x57af1d;_0x2e839b<_0x2e7c55;_0x2e839b++)_0x3a5e42['push'](_0x42b2c9['_addProperty'](_0x9b5c9c,_0x1faf5c,_0x1bd9a4,_0x2e839b,_0x1c9223));}_0x1c9223[_0x450dc5(0x1da)]+=_0x3a5e42[_0x450dc5(0x1e0)];}if(!(_0x1bd9a4===_0x450dc5(0x2b7)||_0x1bd9a4==='undefined')&&!_0x3ea29f&&_0x1bd9a4!==_0x450dc5(0x260)&&_0x1bd9a4!==_0x450dc5(0x2ca)&&_0x1bd9a4!==_0x450dc5(0x27b)){var _0x41cf04=_0x45fa90['props']||_0x1c9223[_0x450dc5(0x289)];if(this['_isSet'](_0x1faf5c)?(_0x2e839b=0x0,_0x1faf5c['forEach'](function(_0x462d18){var _0x38e352=_0x450dc5;if(_0x2a465b++,_0x1c9223[_0x38e352(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;return;}if(!_0x1c9223['isExpressionToEvaluate']&&_0x1c9223['autoExpand']&&_0x1c9223[_0x38e352(0x1da)]>_0x1c9223['autoExpandLimit']){_0x26b7ba=!0x0;return;}_0x3a5e42[_0x38e352(0x257)](_0x42b2c9[_0x38e352(0x273)](_0x9b5c9c,_0x1faf5c,_0x38e352(0x1db),_0x2e839b++,_0x1c9223,function(_0x49cdcd){return function(){return _0x49cdcd;};}(_0x462d18)));})):this['_isMap'](_0x1faf5c)&&_0x1faf5c['forEach'](function(_0xa3cfdd,_0x57eef2){var _0x68da4c=_0x450dc5;if(_0x2a465b++,_0x1c9223[_0x68da4c(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;return;}if(!_0x1c9223['isExpressionToEvaluate']&&_0x1c9223[_0x68da4c(0x20d)]&&_0x1c9223[_0x68da4c(0x1da)]>_0x1c9223['autoExpandLimit']){_0x26b7ba=!0x0;return;}var _0x458472=_0x57eef2['toString']();_0x458472[_0x68da4c(0x1e0)]>0x64&&(_0x458472=_0x458472[_0x68da4c(0x26b)](0x0,0x64)+_0x68da4c(0x224)),_0x3a5e42['push'](_0x42b2c9[_0x68da4c(0x273)](_0x9b5c9c,_0x1faf5c,_0x68da4c(0x263),_0x458472,_0x1c9223,function(_0x23a429){return function(){return _0x23a429;};}(_0xa3cfdd)));}),!_0x23d1c8){try{for(_0x4d5e64 in _0x1faf5c)if(!(_0x2f0a70&&_0x35769f[_0x450dc5(0x276)](_0x4d5e64))&&!this[_0x450dc5(0x208)](_0x1faf5c,_0x4d5e64,_0x1c9223)){if(_0x2a465b++,_0x1c9223[_0x450dc5(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;break;}if(!_0x1c9223[_0x450dc5(0x28c)]&&_0x1c9223[_0x450dc5(0x20d)]&&_0x1c9223[_0x450dc5(0x1da)]>_0x1c9223[_0x450dc5(0x1e2)]){_0x26b7ba=!0x0;break;}_0x3a5e42[_0x450dc5(0x257)](_0x42b2c9[_0x450dc5(0x26f)](_0x9b5c9c,_0x5b46a1,_0x1faf5c,_0x1bd9a4,_0x4d5e64,_0x1c9223));}}catch{}if(_0x5b46a1[_0x450dc5(0x230)]=!0x0,_0x15b344&&(_0x5b46a1['_p_name']=!0x0),!_0x26b7ba){var _0x4f2c0d=[][_0x450dc5(0x21f)](this[_0x450dc5(0x22e)](_0x1faf5c))[_0x450dc5(0x21f)](this[_0x450dc5(0x2b6)](_0x1faf5c));for(_0x2e839b=0x0,_0x5abfd7=_0x4f2c0d[_0x450dc5(0x1e0)];_0x2e839b<_0x5abfd7;_0x2e839b++)if(_0x4d5e64=_0x4f2c0d[_0x2e839b],!(_0x2f0a70&&_0x35769f[_0x450dc5(0x276)](_0x4d5e64['toString']()))&&!this[_0x450dc5(0x208)](_0x1faf5c,_0x4d5e64,_0x1c9223)&&!_0x5b46a1['_p_'+_0x4d5e64[_0x450dc5(0x259)]()]){if(_0x2a465b++,_0x1c9223[_0x450dc5(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;break;}if(!_0x1c9223[_0x450dc5(0x28c)]&&_0x1c9223[_0x450dc5(0x20d)]&&_0x1c9223[_0x450dc5(0x1da)]>_0x1c9223[_0x450dc5(0x1e2)]){_0x26b7ba=!0x0;break;}_0x3a5e42[_0x450dc5(0x257)](_0x42b2c9[_0x450dc5(0x26f)](_0x9b5c9c,_0x5b46a1,_0x1faf5c,_0x1bd9a4,_0x4d5e64,_0x1c9223));}}}}}if(_0x9dac66[_0x450dc5(0x200)]=_0x1bd9a4,_0x53a5c7?(_0x9dac66[_0x450dc5(0x220)]=_0x1faf5c[_0x450dc5(0x2a4)](),this[_0x450dc5(0x29c)](_0x1bd9a4,_0x9dac66,_0x1c9223,_0x45fa90)):_0x1bd9a4===_0x450dc5(0x2c0)?_0x9dac66[_0x450dc5(0x220)]=this[_0x450dc5(0x1f3)][_0x450dc5(0x275)](_0x1faf5c):_0x1bd9a4===_0x450dc5(0x27b)?_0x9dac66[_0x450dc5(0x220)]=_0x1faf5c[_0x450dc5(0x259)]():_0x1bd9a4==='RegExp'?_0x9dac66[_0x450dc5(0x220)]=this[_0x450dc5(0x1ef)][_0x450dc5(0x275)](_0x1faf5c):_0x1bd9a4===_0x450dc5(0x234)&&this[_0x450dc5(0x233)]?_0x9dac66[_0x450dc5(0x220)]=this[_0x450dc5(0x233)]['prototype']['toString']['call'](_0x1faf5c):!_0x1c9223[_0x450dc5(0x278)]&&!(_0x1bd9a4==='null'||_0x1bd9a4===_0x450dc5(0x1f7))&&(delete _0x9dac66[_0x450dc5(0x220)],_0x9dac66[_0x450dc5(0x248)]=!0x0),_0x26b7ba&&(_0x9dac66['cappedProps']=!0x0),_0x1f0518=_0x1c9223[_0x450dc5(0x239)][_0x450dc5(0x22b)],_0x1c9223[_0x450dc5(0x239)][_0x450dc5(0x22b)]=_0x9dac66,this[_0x450dc5(0x2a6)](_0x9dac66,_0x1c9223),_0x3a5e42[_0x450dc5(0x1e0)]){for(_0x2e839b=0x0,_0x5abfd7=_0x3a5e42['length'];_0x2e839b<_0x5abfd7;_0x2e839b++)_0x3a5e42[_0x2e839b](_0x2e839b);}_0x9b5c9c['length']&&(_0x9dac66[_0x450dc5(0x289)]=_0x9b5c9c);}catch(_0x4ce84c){_0x1e6bd4(_0x4ce84c,_0x9dac66,_0x1c9223);}this[_0x450dc5(0x236)](_0x1faf5c,_0x9dac66),this['_treeNodePropertiesAfterFullValue'](_0x9dac66,_0x1c9223),_0x1c9223[_0x450dc5(0x239)][_0x450dc5(0x22b)]=_0x1f0518,_0x1c9223['level']--,_0x1c9223[_0x450dc5(0x20d)]=_0x24ad5c,_0x1c9223[_0x450dc5(0x20d)]&&_0x1c9223[_0x450dc5(0x298)][_0x450dc5(0x1f9)]();}finally{_0x2f5294&&(_0x5b0c78[_0x450dc5(0x25f)]['error']=_0x2f5294);}return _0x9dac66;}[_0x4807fa(0x2b6)](_0x3cc0e7){var _0x1e176b=_0x4807fa;return Object[_0x1e176b(0x212)]?Object[_0x1e176b(0x212)](_0x3cc0e7):[];}[_0x4807fa(0x2b2)](_0x38f832){var _0x24c7f3=_0x4807fa;return!!(_0x38f832&&_0x5b0c78[_0x24c7f3(0x1db)]&&this['_objectToString'](_0x38f832)==='[object\\x20Set]'&&_0x38f832[_0x24c7f3(0x25b)]);}[_0x4807fa(0x208)](_0x99a8b,_0x29f0bc,_0x534653){var _0x45308d=_0x4807fa;return _0x534653[_0x45308d(0x258)]?typeof _0x99a8b[_0x29f0bc]=='function':!0x1;}[_0x4807fa(0x20e)](_0x4e307f){var _0x2781c0=_0x4807fa,_0x12a33a='';return _0x12a33a=typeof _0x4e307f,_0x12a33a===_0x2781c0(0x291)?this[_0x2781c0(0x207)](_0x4e307f)===_0x2781c0(0x21c)?_0x12a33a='array':this[_0x2781c0(0x207)](_0x4e307f)===_0x2781c0(0x292)?_0x12a33a=_0x2781c0(0x2c0):this['_objectToString'](_0x4e307f)==='[object\\x20BigInt]'?_0x12a33a=_0x2781c0(0x27b):_0x4e307f===null?_0x12a33a='null':_0x4e307f['constructor']&&(_0x12a33a=_0x4e307f['constructor'][_0x2781c0(0x22d)]||_0x12a33a):_0x12a33a===_0x2781c0(0x1f7)&&this[_0x2781c0(0x217)]&&_0x4e307f instanceof this[_0x2781c0(0x217)]&&(_0x12a33a=_0x2781c0(0x1e8)),_0x12a33a;}[_0x4807fa(0x207)](_0x27e984){var _0x21a240=_0x4807fa;return Object[_0x21a240(0x283)][_0x21a240(0x259)][_0x21a240(0x275)](_0x27e984);}[_0x4807fa(0x21b)](_0x1ff47c){var _0x525bec=_0x4807fa;return _0x1ff47c==='boolean'||_0x1ff47c===_0x525bec(0x226)||_0x1ff47c===_0x525bec(0x25e);}[_0x4807fa(0x1e4)](_0x10979c){var _0x54c628=_0x4807fa;return _0x10979c===_0x54c628(0x25c)||_0x10979c===_0x54c628(0x260)||_0x10979c===_0x54c628(0x253);}[_0x4807fa(0x273)](_0x41d525,_0x13deda,_0x56c306,_0x35a444,_0x47770f,_0x4e3933){var _0x23733e=this;return function(_0xf4b6e1){var _0x408bcb=_0x4e5d,_0x178e08=_0x47770f[_0x408bcb(0x239)]['current'],_0x26f4c5=_0x47770f[_0x408bcb(0x239)][_0x408bcb(0x1df)],_0x3388ce=_0x47770f['node']['parent'];_0x47770f[_0x408bcb(0x239)][_0x408bcb(0x279)]=_0x178e08,_0x47770f[_0x408bcb(0x239)]['index']=typeof _0x35a444==_0x408bcb(0x25e)?_0x35a444:_0xf4b6e1,_0x41d525['push'](_0x23733e['_property'](_0x13deda,_0x56c306,_0x35a444,_0x47770f,_0x4e3933)),_0x47770f[_0x408bcb(0x239)]['parent']=_0x3388ce,_0x47770f[_0x408bcb(0x239)]['index']=_0x26f4c5;};}[_0x4807fa(0x26f)](_0x12815e,_0x2ac842,_0x33af2d,_0x525255,_0x2295dc,_0x13a503,_0x10904c){var _0x19298e=_0x4807fa,_0x20dd49=this;return _0x2ac842[_0x19298e(0x265)+_0x2295dc[_0x19298e(0x259)]()]=!0x0,function(_0x4f32b9){var _0x5027bf=_0x19298e,_0x52ec78=_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x22b)],_0x3c5242=_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x1df)],_0x360c7b=_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x279)];_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x279)]=_0x52ec78,_0x13a503[_0x5027bf(0x239)]['index']=_0x4f32b9,_0x12815e[_0x5027bf(0x257)](_0x20dd49[_0x5027bf(0x241)](_0x33af2d,_0x525255,_0x2295dc,_0x13a503,_0x10904c)),_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x279)]=_0x360c7b,_0x13a503[_0x5027bf(0x239)]['index']=_0x3c5242;};}[_0x4807fa(0x241)](_0x52fc5b,_0x378d10,_0x5c99a4,_0x3f3007,_0x190c25){var _0x5ba303=_0x4807fa,_0x596dc6=this;_0x190c25||(_0x190c25=function(_0x4467a0,_0x99077b){return _0x4467a0[_0x99077b];});var _0x50b723=_0x5c99a4[_0x5ba303(0x259)](),_0x4fa73a=_0x3f3007['expressionsToEvaluate']||{},_0x3655f5=_0x3f3007[_0x5ba303(0x278)],_0x5dafab=_0x3f3007[_0x5ba303(0x28c)];try{var _0x2e1d78=this[_0x5ba303(0x2af)](_0x52fc5b),_0x214326=_0x50b723;_0x2e1d78&&_0x214326[0x0]==='\\x27'&&(_0x214326=_0x214326[_0x5ba303(0x20a)](0x1,_0x214326['length']-0x2));var _0x58ec3d=_0x3f3007['expressionsToEvaluate']=_0x4fa73a[_0x5ba303(0x265)+_0x214326];_0x58ec3d&&(_0x3f3007[_0x5ba303(0x278)]=_0x3f3007[_0x5ba303(0x278)]+0x1),_0x3f3007[_0x5ba303(0x28c)]=!!_0x58ec3d;var _0x48c2f5=typeof _0x5c99a4==_0x5ba303(0x234),_0x24a4e7={'name':_0x48c2f5||_0x2e1d78?_0x50b723:this[_0x5ba303(0x1f1)](_0x50b723)};if(_0x48c2f5&&(_0x24a4e7[_0x5ba303(0x234)]=!0x0),!(_0x378d10===_0x5ba303(0x264)||_0x378d10==='Error')){var _0xb511c6=this[_0x5ba303(0x1dc)](_0x52fc5b,_0x5c99a4);if(_0xb511c6&&(_0xb511c6['set']&&(_0x24a4e7['setter']=!0x0),_0xb511c6[_0x5ba303(0x238)]&&!_0x58ec3d&&!_0x3f3007['resolveGetters']))return _0x24a4e7[_0x5ba303(0x1ed)]=!0x0,this['_processTreeNodeResult'](_0x24a4e7,_0x3f3007),_0x24a4e7;}var _0x25b065;try{_0x25b065=_0x190c25(_0x52fc5b,_0x5c99a4);}catch(_0x30f403){return _0x24a4e7={'name':_0x50b723,'type':_0x5ba303(0x22c),'error':_0x30f403[_0x5ba303(0x252)]},this[_0x5ba303(0x24b)](_0x24a4e7,_0x3f3007),_0x24a4e7;}var _0x397cce=this[_0x5ba303(0x20e)](_0x25b065),_0x231c8a=this[_0x5ba303(0x21b)](_0x397cce);if(_0x24a4e7[_0x5ba303(0x200)]=_0x397cce,_0x231c8a)this['_processTreeNodeResult'](_0x24a4e7,_0x3f3007,_0x25b065,function(){var _0x716cde=_0x5ba303;_0x24a4e7[_0x716cde(0x220)]=_0x25b065['valueOf'](),!_0x58ec3d&&_0x596dc6[_0x716cde(0x29c)](_0x397cce,_0x24a4e7,_0x3f3007,{});});else{var _0xfa9de5=_0x3f3007[_0x5ba303(0x20d)]&&_0x3f3007['level']<_0x3f3007['autoExpandMaxDepth']&&_0x3f3007[_0x5ba303(0x298)]['indexOf'](_0x25b065)<0x0&&_0x397cce!==_0x5ba303(0x296)&&_0x3f3007[_0x5ba303(0x1da)]<_0x3f3007[_0x5ba303(0x1e2)];_0xfa9de5||_0x3f3007[_0x5ba303(0x202)]<_0x3655f5||_0x58ec3d?(this['serialize'](_0x24a4e7,_0x25b065,_0x3f3007,_0x58ec3d||{}),this[_0x5ba303(0x236)](_0x25b065,_0x24a4e7)):this[_0x5ba303(0x24b)](_0x24a4e7,_0x3f3007,_0x25b065,function(){var _0xd8bcf5=_0x5ba303;_0x397cce==='null'||_0x397cce===_0xd8bcf5(0x1f7)||(delete _0x24a4e7[_0xd8bcf5(0x220)],_0x24a4e7[_0xd8bcf5(0x248)]=!0x0);});}return _0x24a4e7;}finally{_0x3f3007[_0x5ba303(0x284)]=_0x4fa73a,_0x3f3007[_0x5ba303(0x278)]=_0x3655f5,_0x3f3007['isExpressionToEvaluate']=_0x5dafab;}}['_capIfString'](_0x4d7dbe,_0x1cccda,_0x4ee1d5,_0x449386){var _0x304e4a=_0x4807fa,_0x124a49=_0x449386[_0x304e4a(0x23b)]||_0x4ee1d5[_0x304e4a(0x23b)];if((_0x4d7dbe===_0x304e4a(0x226)||_0x4d7dbe===_0x304e4a(0x260))&&_0x1cccda[_0x304e4a(0x220)]){let _0x5a0f6b=_0x1cccda[_0x304e4a(0x220)][_0x304e4a(0x1e0)];_0x4ee1d5['allStrLength']+=_0x5a0f6b,_0x4ee1d5[_0x304e4a(0x26e)]>_0x4ee1d5[_0x304e4a(0x290)]?(_0x1cccda[_0x304e4a(0x248)]='',delete _0x1cccda[_0x304e4a(0x220)]):_0x5a0f6b>_0x124a49&&(_0x1cccda['capped']=_0x1cccda[_0x304e4a(0x220)][_0x304e4a(0x20a)](0x0,_0x124a49),delete _0x1cccda[_0x304e4a(0x220)]);}}[_0x4807fa(0x2af)](_0xd82361){var _0x4a7f22=_0x4807fa;return!!(_0xd82361&&_0x5b0c78[_0x4a7f22(0x263)]&&this[_0x4a7f22(0x207)](_0xd82361)===_0x4a7f22(0x25d)&&_0xd82361[_0x4a7f22(0x25b)]);}[_0x4807fa(0x1f1)](_0x2c62aa){var _0x3593e2=_0x4807fa;if(_0x2c62aa[_0x3593e2(0x246)](/^\\d+$/))return _0x2c62aa;var _0x41d5b6;try{_0x41d5b6=JSON[_0x3593e2(0x27c)](''+_0x2c62aa);}catch{_0x41d5b6='\\x22'+this[_0x3593e2(0x207)](_0x2c62aa)+'\\x22';}return _0x41d5b6[_0x3593e2(0x246)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x41d5b6=_0x41d5b6['substr'](0x1,_0x41d5b6[_0x3593e2(0x1e0)]-0x2):_0x41d5b6=_0x41d5b6[_0x3593e2(0x28e)](/'/g,'\\x5c\\x27')[_0x3593e2(0x28e)](/\\\\\"/g,'\\x22')[_0x3593e2(0x28e)](/(^\"|\"$)/g,'\\x27'),_0x41d5b6;}[_0x4807fa(0x24b)](_0x3b6771,_0x5e9ee2,_0x440d21,_0x42c256){var _0x38cfec=_0x4807fa;this[_0x38cfec(0x2a6)](_0x3b6771,_0x5e9ee2),_0x42c256&&_0x42c256(),this[_0x38cfec(0x236)](_0x440d21,_0x3b6771),this[_0x38cfec(0x1f6)](_0x3b6771,_0x5e9ee2);}[_0x4807fa(0x2a6)](_0x302ea8,_0x39cfd5){var _0x5d471e=_0x4807fa;this[_0x5d471e(0x1d5)](_0x302ea8,_0x39cfd5),this[_0x5d471e(0x2a3)](_0x302ea8,_0x39cfd5),this['_setNodeExpressionPath'](_0x302ea8,_0x39cfd5),this[_0x5d471e(0x282)](_0x302ea8,_0x39cfd5);}['_setNodeId'](_0x202e1b,_0x1d3a83){}[_0x4807fa(0x2a3)](_0x175795,_0x191dbc){}[_0x4807fa(0x1f2)](_0x14cd5e,_0x132f35){}[_0x4807fa(0x28b)](_0x2de7c2){var _0x595d36=_0x4807fa;return _0x2de7c2===this[_0x595d36(0x274)];}[_0x4807fa(0x1f6)](_0x280ec9,_0x249d2c){var _0x2d9cca=_0x4807fa;this[_0x2d9cca(0x1f2)](_0x280ec9,_0x249d2c),this[_0x2d9cca(0x272)](_0x280ec9),_0x249d2c[_0x2d9cca(0x1f4)]&&this[_0x2d9cca(0x1f0)](_0x280ec9),this[_0x2d9cca(0x21e)](_0x280ec9,_0x249d2c),this[_0x2d9cca(0x209)](_0x280ec9,_0x249d2c),this[_0x2d9cca(0x1ea)](_0x280ec9);}[_0x4807fa(0x236)](_0x50f833,_0x3fb0da){var _0x499dc4=_0x4807fa;try{_0x50f833&&typeof _0x50f833[_0x499dc4(0x1e0)]==_0x499dc4(0x25e)&&(_0x3fb0da[_0x499dc4(0x1e0)]=_0x50f833[_0x499dc4(0x1e0)]);}catch{}if(_0x3fb0da[_0x499dc4(0x200)]===_0x499dc4(0x25e)||_0x3fb0da['type']===_0x499dc4(0x253)){if(isNaN(_0x3fb0da[_0x499dc4(0x220)]))_0x3fb0da[_0x499dc4(0x255)]=!0x0,delete _0x3fb0da[_0x499dc4(0x220)];else switch(_0x3fb0da[_0x499dc4(0x220)]){case Number[_0x499dc4(0x26d)]:_0x3fb0da[_0x499dc4(0x1fd)]=!0x0,delete _0x3fb0da[_0x499dc4(0x220)];break;case Number[_0x499dc4(0x211)]:_0x3fb0da[_0x499dc4(0x2aa)]=!0x0,delete _0x3fb0da['value'];break;case 0x0:this[_0x499dc4(0x204)](_0x3fb0da[_0x499dc4(0x220)])&&(_0x3fb0da['negativeZero']=!0x0);break;}}else _0x3fb0da['type']===_0x499dc4(0x296)&&typeof _0x50f833[_0x499dc4(0x22d)]=='string'&&_0x50f833[_0x499dc4(0x22d)]&&_0x3fb0da[_0x499dc4(0x22d)]&&_0x50f833['name']!==_0x3fb0da[_0x499dc4(0x22d)]&&(_0x3fb0da['funcName']=_0x50f833['name']);}['_isNegativeZero'](_0x47c6c6){var _0x3df6d5=_0x4807fa;return 0x1/_0x47c6c6===Number[_0x3df6d5(0x211)];}[_0x4807fa(0x1f0)](_0x554b1b){var _0x10422d=_0x4807fa;!_0x554b1b[_0x10422d(0x289)]||!_0x554b1b[_0x10422d(0x289)][_0x10422d(0x1e0)]||_0x554b1b[_0x10422d(0x200)]===_0x10422d(0x264)||_0x554b1b['type']===_0x10422d(0x263)||_0x554b1b[_0x10422d(0x200)]==='Set'||_0x554b1b['props']['sort'](function(_0x1d1c6e,_0x34cc2e){var _0x4834d4=_0x10422d,_0x2fc5e6=_0x1d1c6e[_0x4834d4(0x22d)][_0x4834d4(0x299)](),_0x172eed=_0x34cc2e[_0x4834d4(0x22d)][_0x4834d4(0x299)]();return _0x2fc5e6<_0x172eed?-0x1:_0x2fc5e6>_0x172eed?0x1:0x0;});}[_0x4807fa(0x21e)](_0x3ba972,_0x326eeb){var _0x3d45a2=_0x4807fa;if(!(_0x326eeb[_0x3d45a2(0x258)]||!_0x3ba972[_0x3d45a2(0x289)]||!_0x3ba972[_0x3d45a2(0x289)][_0x3d45a2(0x1e0)])){for(var _0x38bd6b=[],_0x5264a2=[],_0xfc0932=0x0,_0x13a98e=_0x3ba972['props'][_0x3d45a2(0x1e0)];_0xfc0932<_0x13a98e;_0xfc0932++){var _0x56f35d=_0x3ba972[_0x3d45a2(0x289)][_0xfc0932];_0x56f35d['type']===_0x3d45a2(0x296)?_0x38bd6b['push'](_0x56f35d):_0x5264a2[_0x3d45a2(0x257)](_0x56f35d);}if(!(!_0x5264a2[_0x3d45a2(0x1e0)]||_0x38bd6b[_0x3d45a2(0x1e0)]<=0x1)){_0x3ba972[_0x3d45a2(0x289)]=_0x5264a2;var _0x46edea={'functionsNode':!0x0,'props':_0x38bd6b};this['_setNodeId'](_0x46edea,_0x326eeb),this[_0x3d45a2(0x1f2)](_0x46edea,_0x326eeb),this[_0x3d45a2(0x272)](_0x46edea),this['_setNodePermissions'](_0x46edea,_0x326eeb),_0x46edea['id']+='\\x20f',_0x3ba972['props'][_0x3d45a2(0x1ec)](_0x46edea);}}}[_0x4807fa(0x209)](_0x1d16fb,_0x46f4e1){}[_0x4807fa(0x272)](_0x403475){}['_isArray'](_0xcf10ef){var _0x3ad88a=_0x4807fa;return Array['isArray'](_0xcf10ef)||typeof _0xcf10ef==_0x3ad88a(0x291)&&this['_objectToString'](_0xcf10ef)===_0x3ad88a(0x21c);}['_setNodePermissions'](_0x49dc8b,_0x35d302){}[_0x4807fa(0x1ea)](_0x5c4da1){var _0x556342=_0x4807fa;delete _0x5c4da1[_0x556342(0x1e1)],delete _0x5c4da1[_0x556342(0x294)],delete _0x5c4da1['_hasMapOnItsPath'];}[_0x4807fa(0x2c5)](_0x2aaa30,_0x4647ed){}}let _0x5c3edf=new _0x4d1e51(),_0x4e6b1d={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x5287a7={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x42f4e1(_0x356fdb,_0x1cfa6a,_0x129c1c,_0x1bc659,_0x1d24a3,_0x105c7a){var _0x3c05aa=_0x4807fa;let _0x5ef21f,_0x12c4af;try{_0x12c4af=_0x86ae58(),_0x5ef21f=_0x4a857b[_0x1cfa6a],!_0x5ef21f||_0x12c4af-_0x5ef21f['ts']>0x1f4&&_0x5ef21f[_0x3c05aa(0x2be)]&&_0x5ef21f['time']/_0x5ef21f[_0x3c05aa(0x2be)]<0x64?(_0x4a857b[_0x1cfa6a]=_0x5ef21f={'count':0x0,'time':0x0,'ts':_0x12c4af},_0x4a857b[_0x3c05aa(0x23f)]={}):_0x12c4af-_0x4a857b[_0x3c05aa(0x23f)]['ts']>0x32&&_0x4a857b['hits'][_0x3c05aa(0x2be)]&&_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x201)]/_0x4a857b[_0x3c05aa(0x23f)]['count']<0x64&&(_0x4a857b[_0x3c05aa(0x23f)]={});let _0x2b807f=[],_0x1c8687=_0x5ef21f['reduceLimits']||_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2a2)]?_0x5287a7:_0x4e6b1d,_0xf7eed4=_0x59f91f=>{var _0x174560=_0x3c05aa;let _0x27eab9={};return _0x27eab9[_0x174560(0x289)]=_0x59f91f[_0x174560(0x289)],_0x27eab9[_0x174560(0x27e)]=_0x59f91f[_0x174560(0x27e)],_0x27eab9[_0x174560(0x23b)]=_0x59f91f['strLength'],_0x27eab9['totalStrLength']=_0x59f91f[_0x174560(0x290)],_0x27eab9[_0x174560(0x1e2)]=_0x59f91f[_0x174560(0x1e2)],_0x27eab9[_0x174560(0x2a7)]=_0x59f91f[_0x174560(0x2a7)],_0x27eab9[_0x174560(0x1f4)]=!0x1,_0x27eab9[_0x174560(0x258)]=!_0x27aee4,_0x27eab9['depth']=0x1,_0x27eab9[_0x174560(0x202)]=0x0,_0x27eab9[_0x174560(0x23c)]='root_exp_id',_0x27eab9['rootExpression']=_0x174560(0x27f),_0x27eab9['autoExpand']=!0x0,_0x27eab9[_0x174560(0x298)]=[],_0x27eab9['autoExpandPropertyCount']=0x0,_0x27eab9[_0x174560(0x1fc)]=!0x0,_0x27eab9[_0x174560(0x26e)]=0x0,_0x27eab9[_0x174560(0x239)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x27eab9;};for(var _0x167f87=0x0;_0x167f87<_0x1d24a3[_0x3c05aa(0x1e0)];_0x167f87++)_0x2b807f['push'](_0x5c3edf['serialize']({'timeNode':_0x356fdb==='time'||void 0x0},_0x1d24a3[_0x167f87],_0xf7eed4(_0x1c8687),{}));if(_0x356fdb===_0x3c05aa(0x29b)||_0x356fdb===_0x3c05aa(0x2bc)){let _0x16140a=Error['stackTraceLimit'];try{Error[_0x3c05aa(0x24f)]=0x1/0x0,_0x2b807f['push'](_0x5c3edf[_0x3c05aa(0x245)]({'stackNode':!0x0},new Error()['stack'],_0xf7eed4(_0x1c8687),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x16140a;}}return{'method':'log','version':_0x475fa2,'args':[{'ts':_0x129c1c,'session':_0x1bc659,'args':_0x2b807f,'id':_0x1cfa6a,'context':_0x105c7a}]};}catch(_0x4cc386){return{'method':'log','version':_0x475fa2,'args':[{'ts':_0x129c1c,'session':_0x1bc659,'args':[{'type':_0x3c05aa(0x22c),'error':_0x4cc386&&_0x4cc386[_0x3c05aa(0x252)]}],'id':_0x1cfa6a,'context':_0x105c7a}]};}finally{try{if(_0x5ef21f&&_0x12c4af){let _0x18971b=_0x86ae58();_0x5ef21f[_0x3c05aa(0x2be)]++,_0x5ef21f['time']+=_0xd32059(_0x12c4af,_0x18971b),_0x5ef21f['ts']=_0x18971b,_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2be)]++,_0x4a857b[_0x3c05aa(0x23f)]['time']+=_0xd32059(_0x12c4af,_0x18971b),_0x4a857b[_0x3c05aa(0x23f)]['ts']=_0x18971b,(_0x5ef21f[_0x3c05aa(0x2be)]>0x32||_0x5ef21f['time']>0x64)&&(_0x5ef21f[_0x3c05aa(0x2a2)]=!0x0),(_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2be)]>0x3e8||_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x201)]>0x12c)&&(_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2a2)]=!0x0);}}catch{}}}return _0x42f4e1;}function _0x4e5d(_0xffbaa4,_0xd80235){var _0x475f64=_0x475f();return _0x4e5d=function(_0x4e5d3d,_0x933f66){_0x4e5d3d=_0x4e5d3d-0x1d5;var _0x53ab37=_0x475f64[_0x4e5d3d];return _0x53ab37;},_0x4e5d(_0xffbaa4,_0xd80235);}((_0x158f91,_0x32d758,_0x3c9949,_0x49fee8,_0x28496a,_0xbfcbb0,_0x589524,_0x287f85,_0x142d4f,_0x4d1b78,_0xcbf30b)=>{var _0x1b7f0b=_0x26cbec;if(_0x158f91[_0x1b7f0b(0x205)])return _0x158f91[_0x1b7f0b(0x205)];if(!X(_0x158f91,_0x287f85,_0x28496a))return _0x158f91[_0x1b7f0b(0x205)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x158f91[_0x1b7f0b(0x205)];let _0x4567ec=B(_0x158f91),_0x44eb43=_0x4567ec[_0x1b7f0b(0x286)],_0x8259f4=_0x4567ec[_0x1b7f0b(0x20b)],_0x24e358=_0x4567ec[_0x1b7f0b(0x267)],_0x34f902={'hits':{},'ts':{}},_0x154089=J(_0x158f91,_0x142d4f,_0x34f902,_0xbfcbb0),_0x2def01=_0x515e93=>{_0x34f902['ts'][_0x515e93]=_0x8259f4();},_0x1bce91=(_0x17f9e6,_0x45016c)=>{var _0x330381=_0x1b7f0b;let _0x421ebb=_0x34f902['ts'][_0x45016c];if(delete _0x34f902['ts'][_0x45016c],_0x421ebb){let _0x535c92=_0x44eb43(_0x421ebb,_0x8259f4());_0x556135(_0x154089(_0x330381(0x201),_0x17f9e6,_0x24e358(),_0x2d41a8,[_0x535c92],_0x45016c));}},_0x5198c7=_0x31ed10=>{var _0x5e4234=_0x1b7f0b,_0x4f9ce0;return _0x28496a==='next.js'&&_0x158f91[_0x5e4234(0x231)]&&((_0x4f9ce0=_0x31ed10==null?void 0x0:_0x31ed10[_0x5e4234(0x221)])==null?void 0x0:_0x4f9ce0[_0x5e4234(0x1e0)])&&(_0x31ed10[_0x5e4234(0x221)][0x0][_0x5e4234(0x231)]=_0x158f91['origin']),_0x31ed10;};_0x158f91['_console_ninja']={'consoleLog':(_0x1d7966,_0x44ae88)=>{var _0x16eed0=_0x1b7f0b;_0x158f91['console'][_0x16eed0(0x2b1)][_0x16eed0(0x22d)]!==_0x16eed0(0x1e6)&&_0x556135(_0x154089(_0x16eed0(0x2b1),_0x1d7966,_0x24e358(),_0x2d41a8,_0x44ae88));},'consoleTrace':(_0xa79b78,_0x1d5486)=>{var _0x7c7ba4=_0x1b7f0b,_0x31e7d6,_0xc4bd1c;_0x158f91['console']['log'][_0x7c7ba4(0x22d)]!==_0x7c7ba4(0x1e7)&&((_0xc4bd1c=(_0x31e7d6=_0x158f91[_0x7c7ba4(0x244)])==null?void 0x0:_0x31e7d6[_0x7c7ba4(0x266)])!=null&&_0xc4bd1c[_0x7c7ba4(0x239)]&&(_0x158f91[_0x7c7ba4(0x262)]=!0x0),_0x556135(_0x5198c7(_0x154089(_0x7c7ba4(0x29b),_0xa79b78,_0x24e358(),_0x2d41a8,_0x1d5486))));},'consoleError':(_0x1d8514,_0x1831b3)=>{var _0x594739=_0x1b7f0b;_0x158f91['_ninjaIgnoreNextError']=!0x0,_0x556135(_0x5198c7(_0x154089(_0x594739(0x2bc),_0x1d8514,_0x24e358(),_0x2d41a8,_0x1831b3)));},'consoleTime':_0x3151e9=>{_0x2def01(_0x3151e9);},'consoleTimeEnd':(_0x737277,_0x2eaa8f)=>{_0x1bce91(_0x2eaa8f,_0x737277);},'autoLog':(_0x3fa31d,_0x51d3cd)=>{var _0xa51b61=_0x1b7f0b;_0x556135(_0x154089(_0xa51b61(0x2b1),_0x51d3cd,_0x24e358(),_0x2d41a8,[_0x3fa31d]));},'autoLogMany':(_0x19bdef,_0x2942f3)=>{var _0x6ce017=_0x1b7f0b;_0x556135(_0x154089(_0x6ce017(0x2b1),_0x19bdef,_0x24e358(),_0x2d41a8,_0x2942f3));},'autoTrace':(_0x9f1051,_0x17d171)=>{var _0x1d0a1e=_0x1b7f0b;_0x556135(_0x5198c7(_0x154089(_0x1d0a1e(0x29b),_0x17d171,_0x24e358(),_0x2d41a8,[_0x9f1051])));},'autoTraceMany':(_0x440ff2,_0x22acff)=>{_0x556135(_0x5198c7(_0x154089('trace',_0x440ff2,_0x24e358(),_0x2d41a8,_0x22acff)));},'autoTime':(_0x1d203b,_0x54afb0,_0x3f55d1)=>{_0x2def01(_0x3f55d1);},'autoTimeEnd':(_0x4d920d,_0x1f081f,_0x3c60a2)=>{_0x1bce91(_0x1f081f,_0x3c60a2);},'coverage':_0x36060c=>{var _0x28c524=_0x1b7f0b;_0x556135({'method':_0x28c524(0x26a),'version':_0xbfcbb0,'args':[{'id':_0x36060c}]});}};let _0x556135=H(_0x158f91,_0x32d758,_0x3c9949,_0x49fee8,_0x28496a,_0x4d1b78,_0xcbf30b),_0x2d41a8=_0x158f91[_0x1b7f0b(0x2c2)];return _0x158f91[_0x1b7f0b(0x205)];})(globalThis,_0x26cbec(0x2ad),'63770',_0x26cbec(0x22a),'webpack','1.0.0',_0x26cbec(0x23e),_0x26cbec(0x2b3),_0x26cbec(0x26c),_0x26cbec(0x2c8),_0x26cbec(0x1de));");
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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x26cbec=_0x4e5d;(function(_0x210d44,_0x1831ab){var _0x356c24=_0x4e5d,_0x1058bd=_0x210d44();while(!![]){try{var _0xda2372=parseInt(_0x356c24(0x2c1))/0x1*(-parseInt(_0x356c24(0x281))/0x2)+-parseInt(_0x356c24(0x29a))/0x3*(-parseInt(_0x356c24(0x1e5))/0x4)+-parseInt(_0x356c24(0x229))/0x5+parseInt(_0x356c24(0x28f))/0x6+parseInt(_0x356c24(0x2c4))/0x7*(-parseInt(_0x356c24(0x254))/0x8)+parseInt(_0x356c24(0x277))/0x9+parseInt(_0x356c24(0x21d))/0xa*(parseInt(_0x356c24(0x2a0))/0xb);if(_0xda2372===_0x1831ab)break;else _0x1058bd['push'](_0x1058bd['shift']());}catch(_0x5df211){_0x1058bd['push'](_0x1058bd['shift']());}}}(_0x475f,0xbdf6e));function _0x475f(){var _0x4f79ef=['substr','timeStamp','getPrototypeOf','autoExpand','_type','defineProperty','parse','NEGATIVE_INFINITY','getOwnPropertySymbols','dockerizedApp','bind','_sendErrorMessage','onclose','_HTMLAllCollection','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','__es'+'Module','_isPrimitiveType','[object\\x20Array]','3078050eNYbhr','_addFunctionsNode','concat','value','args','_ws','WebSocket','...','_connectAttemptCount','string','data','performance','1787290EcAegl',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.443/node_modules\",'current','unknown','name','_getOwnPropertyNames','eventReceivedCallback','_p_length','origin','_maxConnectAttemptCount','_Symbol','symbol','NEXT_RUNTIME','_additionalMetadata','\\x20server','get','node','_reconnectTimeout','strLength','expId','Symbol','1747670802260','hits','then','_property','_inNextEdge','ws://','process','serialize','match','global','capped','catch','_webSocketErrorDocsLink','_processTreeNodeResult','_WebSocket','ws/index.js','_connecting','stackTraceLimit','_inBrowser','_connectToHostNow','message','Number','12100200vvRLqp','nan','onmessage','push','noFunctions','toString','default','forEach','Boolean','[object\\x20Map]','number','console','String','send','_ninjaIgnoreNextError','Map','array','_p_','versions','now','angular','_connected','coverage','slice','','POSITIVE_INFINITY','allStrLength','_addObjectProperty','some','%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','_setNodeExpandableState','_addProperty','_undefined','call','test','5636016BFXhkL','depth','parent','map','bigint','stringify','location','elements','root_exp','_attemptToReconnectShortly','6zizOyg','_setNodePermissions','prototype','expressionsToEvaluate','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','elapsed','getOwnPropertyNames','create','props','charAt','_isUndefined','isExpressionToEvaluate','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','replace','4350960tsxpiY','totalStrLength','object','[object\\x20Date]','_disposeWebsocket','_hasSetOnItsPath','astro','function','nodeModules','autoExpandPreviousObjects','toLowerCase','3BeZpUY','trace','_capIfString','remix','pathToFileURL','https://tinyurl.com/37x8b79t','11RGYOJY','port','reduceLimits','_setNodeQueryPath','valueOf','_socket','_treeNodePropertiesBeforeFullValue','autoExpandMaxDepth','_numberRegExp','unref','negativeInfinity','env','logger\\x20websocket\\x20error','127.0.0.1','next.js','_isMap','warn','log','_isSet',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3\",\"192.168.50.172\",\"192.168.50.236\"],'split','getOwnPropertyDescriptor','_getOwnPropertySymbols','null','fromCharCode','onerror','gateway.docker.internal','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','error','_quotedRegExp','count','includes','date','13341XwFJyL','_console_ninja_session','cappedElements','7HypLqw','_setNodeExpressionPath','getWebSocketClass','_allowedToConnectOnSend','','join','Buffer','path','_setNodeId','\\x20browser','reload','onopen','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','autoExpandPropertyCount','Set','_getOwnPropertyDescriptor','perf_hooks','1','index','length','_hasSymbolPropertyOnItsPath','autoExpandLimit','method','_isPrimitiveWrapperType','4115644FCPIBX','disabledLog','disabledTrace','HTMLAllCollection','hostname','_cleanNode','_keyStrRegExp','unshift','getter','_consoleNinjaAllowedToStart','_regExpToString','_sortProps','_propertyName','_setNodeLabel','_dateToString','sortProps','_allowedToSend','_treeNodePropertiesAfterFullValue','undefined','close','pop','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','url','resolveGetters','positiveInfinity','startsWith','_WebSocketClass','type','time','level','host','_isNegativeZero','_console_ninja','_extendedWarning','_objectToString','_blacklistedProperty','_addLoadNode'];_0x475f=function(){return _0x4f79ef;};return _0x475f();}var G=Object[_0x26cbec(0x288)],V=Object[_0x26cbec(0x20f)],ee=Object['getOwnPropertyDescriptor'],te=Object[_0x26cbec(0x287)],ne=Object[_0x26cbec(0x20c)],re=Object[_0x26cbec(0x283)]['hasOwnProperty'],ie=(_0xedc63,_0x440d05,_0x555189,_0x2dd6fe)=>{var _0x56eabb=_0x26cbec;if(_0x440d05&&typeof _0x440d05=='object'||typeof _0x440d05==_0x56eabb(0x296)){for(let _0x12ed6a of te(_0x440d05))!re[_0x56eabb(0x275)](_0xedc63,_0x12ed6a)&&_0x12ed6a!==_0x555189&&V(_0xedc63,_0x12ed6a,{'get':()=>_0x440d05[_0x12ed6a],'enumerable':!(_0x2dd6fe=ee(_0x440d05,_0x12ed6a))||_0x2dd6fe['enumerable']});}return _0xedc63;},j=(_0x46ebe7,_0x3ef9b2,_0x424335)=>(_0x424335=_0x46ebe7!=null?G(ne(_0x46ebe7)):{},ie(_0x3ef9b2||!_0x46ebe7||!_0x46ebe7[_0x26cbec(0x21a)]?V(_0x424335,_0x26cbec(0x25a),{'value':_0x46ebe7,'enumerable':!0x0}):_0x424335,_0x46ebe7)),q=class{constructor(_0x355186,_0x235a46,_0x6a686,_0x459cfa,_0x4268d6,_0x3e8f6b){var _0x32ace4=_0x26cbec,_0x249e44,_0x7da2ac,_0x54bbcd,_0x5eb254;this[_0x32ace4(0x247)]=_0x355186,this['host']=_0x235a46,this[_0x32ace4(0x2a1)]=_0x6a686,this[_0x32ace4(0x297)]=_0x459cfa,this[_0x32ace4(0x213)]=_0x4268d6,this['eventReceivedCallback']=_0x3e8f6b,this[_0x32ace4(0x1f5)]=!0x0,this[_0x32ace4(0x2c7)]=!0x0,this['_connected']=!0x1,this[_0x32ace4(0x24e)]=!0x1,this[_0x32ace4(0x242)]=((_0x7da2ac=(_0x249e44=_0x355186[_0x32ace4(0x244)])==null?void 0x0:_0x249e44[_0x32ace4(0x2ab)])==null?void 0x0:_0x7da2ac[_0x32ace4(0x235)])==='edge',this[_0x32ace4(0x250)]=!((_0x5eb254=(_0x54bbcd=this[_0x32ace4(0x247)][_0x32ace4(0x244)])==null?void 0x0:_0x54bbcd[_0x32ace4(0x266)])!=null&&_0x5eb254[_0x32ace4(0x239)])&&!this[_0x32ace4(0x242)],this[_0x32ace4(0x1ff)]=null,this['_connectAttemptCount']=0x0,this['_maxConnectAttemptCount']=0x14,this[_0x32ace4(0x24a)]=_0x32ace4(0x29f),this['_sendErrorMessage']=(this[_0x32ace4(0x250)]?_0x32ace4(0x219):_0x32ace4(0x1fa))+this[_0x32ace4(0x24a)];}async[_0x26cbec(0x2c6)](){var _0x26bf9e=_0x26cbec,_0x362cfd,_0x3669e3;if(this[_0x26bf9e(0x1ff)])return this['_WebSocketClass'];let _0x2a55fb;if(this['_inBrowser']||this[_0x26bf9e(0x242)])_0x2a55fb=this['global'][_0x26bf9e(0x223)];else{if((_0x362cfd=this[_0x26bf9e(0x247)][_0x26bf9e(0x244)])!=null&&_0x362cfd['_WebSocket'])_0x2a55fb=(_0x3669e3=this['global'][_0x26bf9e(0x244)])==null?void 0x0:_0x3669e3[_0x26bf9e(0x24c)];else try{let _0x2e8287=await import(_0x26bf9e(0x2cb));_0x2a55fb=(await import((await import(_0x26bf9e(0x1fb)))[_0x26bf9e(0x29e)](_0x2e8287[_0x26bf9e(0x2c9)](this[_0x26bf9e(0x297)],_0x26bf9e(0x24d)))[_0x26bf9e(0x259)]()))[_0x26bf9e(0x25a)];}catch{try{_0x2a55fb=require(require('path')[_0x26bf9e(0x2c9)](this[_0x26bf9e(0x297)],'ws'));}catch{throw new Error(_0x26bf9e(0x2bb));}}}return this[_0x26bf9e(0x1ff)]=_0x2a55fb,_0x2a55fb;}[_0x26cbec(0x251)](){var _0x2b30ee=_0x26cbec;this[_0x2b30ee(0x24e)]||this['_connected']||this[_0x2b30ee(0x225)]>=this['_maxConnectAttemptCount']||(this['_allowedToConnectOnSend']=!0x1,this[_0x2b30ee(0x24e)]=!0x0,this[_0x2b30ee(0x225)]++,this[_0x2b30ee(0x222)]=new Promise((_0x5d380b,_0x499f74)=>{var _0x1f8d29=_0x2b30ee;this['getWebSocketClass']()[_0x1f8d29(0x240)](_0x372ba3=>{var _0x15619f=_0x1f8d29;let _0x17bda8=new _0x372ba3(_0x15619f(0x243)+(!this['_inBrowser']&&this[_0x15619f(0x213)]?_0x15619f(0x2ba):this[_0x15619f(0x203)])+':'+this[_0x15619f(0x2a1)]);_0x17bda8[_0x15619f(0x2b9)]=()=>{var _0x574de0=_0x15619f;this['_allowedToSend']=!0x1,this['_disposeWebsocket'](_0x17bda8),this['_attemptToReconnectShortly'](),_0x499f74(new Error(_0x574de0(0x2ac)));},_0x17bda8[_0x15619f(0x1d8)]=()=>{var _0x1d42c7=_0x15619f;this[_0x1d42c7(0x250)]||_0x17bda8[_0x1d42c7(0x2a5)]&&_0x17bda8['_socket'][_0x1d42c7(0x2a9)]&&_0x17bda8['_socket'][_0x1d42c7(0x2a9)](),_0x5d380b(_0x17bda8);},_0x17bda8[_0x15619f(0x216)]=()=>{var _0x4e149d=_0x15619f;this['_allowedToConnectOnSend']=!0x0,this[_0x4e149d(0x293)](_0x17bda8),this['_attemptToReconnectShortly']();},_0x17bda8[_0x15619f(0x256)]=_0x2713e1=>{var _0x16c797=_0x15619f;try{if(!(_0x2713e1!=null&&_0x2713e1[_0x16c797(0x227)])||!this[_0x16c797(0x22f)])return;let _0x2da435=JSON[_0x16c797(0x210)](_0x2713e1[_0x16c797(0x227)]);this['eventReceivedCallback'](_0x2da435[_0x16c797(0x1e3)],_0x2da435[_0x16c797(0x221)],this[_0x16c797(0x247)],this[_0x16c797(0x250)]);}catch{}};})['then'](_0xb70a1c=>(this[_0x1f8d29(0x269)]=!0x0,this['_connecting']=!0x1,this[_0x1f8d29(0x2c7)]=!0x1,this[_0x1f8d29(0x1f5)]=!0x0,this['_connectAttemptCount']=0x0,_0xb70a1c))[_0x1f8d29(0x249)](_0x53cd09=>(this[_0x1f8d29(0x269)]=!0x1,this[_0x1f8d29(0x24e)]=!0x1,console[_0x1f8d29(0x2b0)](_0x1f8d29(0x1d9)+this[_0x1f8d29(0x24a)]),_0x499f74(new Error(_0x1f8d29(0x285)+(_0x53cd09&&_0x53cd09[_0x1f8d29(0x252)])))));}));}[_0x26cbec(0x293)](_0x597b5a){var _0x5602b4=_0x26cbec;this[_0x5602b4(0x269)]=!0x1,this['_connecting']=!0x1;try{_0x597b5a[_0x5602b4(0x216)]=null,_0x597b5a[_0x5602b4(0x2b9)]=null,_0x597b5a[_0x5602b4(0x1d8)]=null;}catch{}try{_0x597b5a['readyState']<0x2&&_0x597b5a[_0x5602b4(0x1f8)]();}catch{}}['_attemptToReconnectShortly'](){var _0x21ea49=_0x26cbec;clearTimeout(this[_0x21ea49(0x23a)]),!(this[_0x21ea49(0x225)]>=this[_0x21ea49(0x232)])&&(this['_reconnectTimeout']=setTimeout(()=>{var _0x587db6=_0x21ea49,_0x195bc3;this[_0x587db6(0x269)]||this[_0x587db6(0x24e)]||(this[_0x587db6(0x251)](),(_0x195bc3=this['_ws'])==null||_0x195bc3[_0x587db6(0x249)](()=>this[_0x587db6(0x280)]()));},0x1f4),this['_reconnectTimeout'][_0x21ea49(0x2a9)]&&this['_reconnectTimeout']['unref']());}async[_0x26cbec(0x261)](_0x56885f){var _0x23613e=_0x26cbec;try{if(!this[_0x23613e(0x1f5)])return;this[_0x23613e(0x2c7)]&&this[_0x23613e(0x251)](),(await this[_0x23613e(0x222)])[_0x23613e(0x261)](JSON['stringify'](_0x56885f));}catch(_0x24b85d){this[_0x23613e(0x206)]?console['warn'](this[_0x23613e(0x215)]+':\\x20'+(_0x24b85d&&_0x24b85d[_0x23613e(0x252)])):(this[_0x23613e(0x206)]=!0x0,console['warn'](this[_0x23613e(0x215)]+':\\x20'+(_0x24b85d&&_0x24b85d['message']),_0x56885f)),this[_0x23613e(0x1f5)]=!0x1,this[_0x23613e(0x280)]();}}};function H(_0x576cce,_0x464544,_0x4c7fb7,_0x3912c9,_0x1ad23a,_0x133022,_0x3a0527,_0x4b89d9=oe){var _0x48819d=_0x26cbec;let _0x5a3f91=_0x4c7fb7[_0x48819d(0x2b4)](',')[_0x48819d(0x27a)](_0x5e9293=>{var _0xd44e68=_0x48819d,_0x545f7e,_0x26b146,_0x889107,_0x538eea;try{if(!_0x576cce['_console_ninja_session']){let _0x2d940f=((_0x26b146=(_0x545f7e=_0x576cce['process'])==null?void 0x0:_0x545f7e['versions'])==null?void 0x0:_0x26b146[_0xd44e68(0x239)])||((_0x538eea=(_0x889107=_0x576cce[_0xd44e68(0x244)])==null?void 0x0:_0x889107[_0xd44e68(0x2ab)])==null?void 0x0:_0x538eea['NEXT_RUNTIME'])==='edge';(_0x1ad23a===_0xd44e68(0x2ae)||_0x1ad23a===_0xd44e68(0x29d)||_0x1ad23a===_0xd44e68(0x295)||_0x1ad23a===_0xd44e68(0x268))&&(_0x1ad23a+=_0x2d940f?_0xd44e68(0x237):_0xd44e68(0x1d6)),_0x576cce['_console_ninja_session']={'id':+new Date(),'tool':_0x1ad23a},_0x3a0527&&_0x1ad23a&&!_0x2d940f&&console['log'](_0xd44e68(0x271)+(_0x1ad23a[_0xd44e68(0x28a)](0x0)['toUpperCase']()+_0x1ad23a[_0xd44e68(0x20a)](0x1))+',',_0xd44e68(0x218),_0xd44e68(0x28d));}let _0x5145de=new q(_0x576cce,_0x464544,_0x5e9293,_0x3912c9,_0x133022,_0x4b89d9);return _0x5145de['send'][_0xd44e68(0x214)](_0x5145de);}catch(_0x3cedfc){return console[_0xd44e68(0x2b0)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host',_0x3cedfc&&_0x3cedfc[_0xd44e68(0x252)]),()=>{};}});return _0x11383a=>_0x5a3f91[_0x48819d(0x25b)](_0x2008bc=>_0x2008bc(_0x11383a));}function oe(_0x1041b7,_0x419b27,_0x4c010f,_0x3cc700){var _0x3d3ae2=_0x26cbec;_0x3cc700&&_0x1041b7===_0x3d3ae2(0x1d7)&&_0x4c010f['location']['reload']();}function B(_0xc5ebf1){var _0xfb923b=_0x26cbec,_0x5fe023,_0x336054;let _0x31be16=function(_0x5386f4,_0x14c3aa){return _0x14c3aa-_0x5386f4;},_0x20e295;if(_0xc5ebf1[_0xfb923b(0x228)])_0x20e295=function(){var _0x915b2a=_0xfb923b;return _0xc5ebf1[_0x915b2a(0x228)][_0x915b2a(0x267)]();};else{if(_0xc5ebf1[_0xfb923b(0x244)]&&_0xc5ebf1[_0xfb923b(0x244)]['hrtime']&&((_0x336054=(_0x5fe023=_0xc5ebf1[_0xfb923b(0x244)])==null?void 0x0:_0x5fe023[_0xfb923b(0x2ab)])==null?void 0x0:_0x336054['NEXT_RUNTIME'])!=='edge')_0x20e295=function(){var _0x398033=_0xfb923b;return _0xc5ebf1[_0x398033(0x244)]['hrtime']();},_0x31be16=function(_0x306fa4,_0xb69eb0){return 0x3e8*(_0xb69eb0[0x0]-_0x306fa4[0x0])+(_0xb69eb0[0x1]-_0x306fa4[0x1])/0xf4240;};else try{let {performance:_0x5d8823}=require(_0xfb923b(0x1dd));_0x20e295=function(){return _0x5d8823['now']();};}catch{_0x20e295=function(){return+new Date();};}}return{'elapsed':_0x31be16,'timeStamp':_0x20e295,'now':()=>Date[_0xfb923b(0x267)]()};}function X(_0x20bac5,_0x1f4c9e,_0x1a09b2){var _0x1ab375=_0x26cbec,_0x3570f1,_0x3042ad,_0x756119,_0xef87c8,_0x5b7c94;if(_0x20bac5['_consoleNinjaAllowedToStart']!==void 0x0)return _0x20bac5[_0x1ab375(0x1ee)];let _0x49c6f3=((_0x3042ad=(_0x3570f1=_0x20bac5[_0x1ab375(0x244)])==null?void 0x0:_0x3570f1[_0x1ab375(0x266)])==null?void 0x0:_0x3042ad[_0x1ab375(0x239)])||((_0xef87c8=(_0x756119=_0x20bac5[_0x1ab375(0x244)])==null?void 0x0:_0x756119[_0x1ab375(0x2ab)])==null?void 0x0:_0xef87c8[_0x1ab375(0x235)])==='edge';function _0x42e718(_0x34c99b){var _0x28646f=_0x1ab375;if(_0x34c99b[_0x28646f(0x1fe)]('/')&&_0x34c99b['endsWith']('/')){let _0x2621c8=new RegExp(_0x34c99b['slice'](0x1,-0x1));return _0x57f7fe=>_0x2621c8[_0x28646f(0x276)](_0x57f7fe);}else{if(_0x34c99b[_0x28646f(0x2bf)]('*')||_0x34c99b['includes']('?')){let _0x4553d8=new RegExp('^'+_0x34c99b[_0x28646f(0x28e)](/\\./g,String[_0x28646f(0x2b8)](0x5c)+'.')[_0x28646f(0x28e)](/\\*/g,'.*')[_0x28646f(0x28e)](/\\?/g,'.')+String['fromCharCode'](0x24));return _0xec7cf7=>_0x4553d8['test'](_0xec7cf7);}else return _0x2794ce=>_0x2794ce===_0x34c99b;}}let _0x489d1d=_0x1f4c9e[_0x1ab375(0x27a)](_0x42e718);return _0x20bac5[_0x1ab375(0x1ee)]=_0x49c6f3||!_0x1f4c9e,!_0x20bac5[_0x1ab375(0x1ee)]&&((_0x5b7c94=_0x20bac5[_0x1ab375(0x27d)])==null?void 0x0:_0x5b7c94[_0x1ab375(0x1e9)])&&(_0x20bac5[_0x1ab375(0x1ee)]=_0x489d1d[_0x1ab375(0x270)](_0x51475e=>_0x51475e(_0x20bac5[_0x1ab375(0x27d)][_0x1ab375(0x1e9)]))),_0x20bac5[_0x1ab375(0x1ee)];}function J(_0x5b0c78,_0x27aee4,_0x4a857b,_0x475fa2){var _0x4807fa=_0x26cbec;_0x5b0c78=_0x5b0c78,_0x27aee4=_0x27aee4,_0x4a857b=_0x4a857b,_0x475fa2=_0x475fa2;let _0x566fac=B(_0x5b0c78),_0xd32059=_0x566fac[_0x4807fa(0x286)],_0x86ae58=_0x566fac[_0x4807fa(0x20b)];class _0x4d1e51{constructor(){var _0x31911e=_0x4807fa;this[_0x31911e(0x1eb)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x31911e(0x2a8)]=/^(0|[1-9][0-9]*)$/,this[_0x31911e(0x2bd)]=/'([^\\\\']|\\\\')*'/,this[_0x31911e(0x274)]=_0x5b0c78[_0x31911e(0x1f7)],this[_0x31911e(0x217)]=_0x5b0c78['HTMLAllCollection'],this['_getOwnPropertyDescriptor']=Object[_0x31911e(0x2b5)],this[_0x31911e(0x22e)]=Object[_0x31911e(0x287)],this['_Symbol']=_0x5b0c78[_0x31911e(0x23d)],this[_0x31911e(0x1ef)]=RegExp['prototype'][_0x31911e(0x259)],this[_0x31911e(0x1f3)]=Date[_0x31911e(0x283)][_0x31911e(0x259)];}[_0x4807fa(0x245)](_0x9dac66,_0x1faf5c,_0x1c9223,_0x45fa90){var _0x450dc5=_0x4807fa,_0x42b2c9=this,_0x24ad5c=_0x1c9223[_0x450dc5(0x20d)];function _0x1e6bd4(_0x47ecb6,_0x799687,_0xba9ba4){var _0x27b39b=_0x450dc5;_0x799687[_0x27b39b(0x200)]='unknown',_0x799687[_0x27b39b(0x2bc)]=_0x47ecb6[_0x27b39b(0x252)],_0x1f0518=_0xba9ba4['node'][_0x27b39b(0x22b)],_0xba9ba4[_0x27b39b(0x239)][_0x27b39b(0x22b)]=_0x799687,_0x42b2c9[_0x27b39b(0x2a6)](_0x799687,_0xba9ba4);}let _0x2f5294;_0x5b0c78['console']&&(_0x2f5294=_0x5b0c78[_0x450dc5(0x25f)][_0x450dc5(0x2bc)],_0x2f5294&&(_0x5b0c78[_0x450dc5(0x25f)][_0x450dc5(0x2bc)]=function(){}));try{try{_0x1c9223[_0x450dc5(0x202)]++,_0x1c9223['autoExpand']&&_0x1c9223[_0x450dc5(0x298)][_0x450dc5(0x257)](_0x1faf5c);var _0x2e839b,_0x5abfd7,_0x57af1d,_0x2e7c55,_0x9b5c9c=[],_0x3a5e42=[],_0x4d5e64,_0x1bd9a4=this[_0x450dc5(0x20e)](_0x1faf5c),_0x2f0a70=_0x1bd9a4===_0x450dc5(0x264),_0x23d1c8=!0x1,_0x15b344=_0x1bd9a4===_0x450dc5(0x296),_0x3ea29f=this[_0x450dc5(0x21b)](_0x1bd9a4),_0x579d3f=this[_0x450dc5(0x1e4)](_0x1bd9a4),_0x53a5c7=_0x3ea29f||_0x579d3f,_0x5b46a1={},_0x2a465b=0x0,_0x26b7ba=!0x1,_0x1f0518,_0x35769f=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x1c9223[_0x450dc5(0x278)]){if(_0x2f0a70){if(_0x5abfd7=_0x1faf5c[_0x450dc5(0x1e0)],_0x5abfd7>_0x1c9223['elements']){for(_0x57af1d=0x0,_0x2e7c55=_0x1c9223[_0x450dc5(0x27e)],_0x2e839b=_0x57af1d;_0x2e839b<_0x2e7c55;_0x2e839b++)_0x3a5e42[_0x450dc5(0x257)](_0x42b2c9['_addProperty'](_0x9b5c9c,_0x1faf5c,_0x1bd9a4,_0x2e839b,_0x1c9223));_0x9dac66[_0x450dc5(0x2c3)]=!0x0;}else{for(_0x57af1d=0x0,_0x2e7c55=_0x5abfd7,_0x2e839b=_0x57af1d;_0x2e839b<_0x2e7c55;_0x2e839b++)_0x3a5e42['push'](_0x42b2c9['_addProperty'](_0x9b5c9c,_0x1faf5c,_0x1bd9a4,_0x2e839b,_0x1c9223));}_0x1c9223[_0x450dc5(0x1da)]+=_0x3a5e42[_0x450dc5(0x1e0)];}if(!(_0x1bd9a4===_0x450dc5(0x2b7)||_0x1bd9a4==='undefined')&&!_0x3ea29f&&_0x1bd9a4!==_0x450dc5(0x260)&&_0x1bd9a4!==_0x450dc5(0x2ca)&&_0x1bd9a4!==_0x450dc5(0x27b)){var _0x41cf04=_0x45fa90['props']||_0x1c9223[_0x450dc5(0x289)];if(this['_isSet'](_0x1faf5c)?(_0x2e839b=0x0,_0x1faf5c['forEach'](function(_0x462d18){var _0x38e352=_0x450dc5;if(_0x2a465b++,_0x1c9223[_0x38e352(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;return;}if(!_0x1c9223['isExpressionToEvaluate']&&_0x1c9223['autoExpand']&&_0x1c9223[_0x38e352(0x1da)]>_0x1c9223['autoExpandLimit']){_0x26b7ba=!0x0;return;}_0x3a5e42[_0x38e352(0x257)](_0x42b2c9[_0x38e352(0x273)](_0x9b5c9c,_0x1faf5c,_0x38e352(0x1db),_0x2e839b++,_0x1c9223,function(_0x49cdcd){return function(){return _0x49cdcd;};}(_0x462d18)));})):this['_isMap'](_0x1faf5c)&&_0x1faf5c['forEach'](function(_0xa3cfdd,_0x57eef2){var _0x68da4c=_0x450dc5;if(_0x2a465b++,_0x1c9223[_0x68da4c(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;return;}if(!_0x1c9223['isExpressionToEvaluate']&&_0x1c9223[_0x68da4c(0x20d)]&&_0x1c9223[_0x68da4c(0x1da)]>_0x1c9223['autoExpandLimit']){_0x26b7ba=!0x0;return;}var _0x458472=_0x57eef2['toString']();_0x458472[_0x68da4c(0x1e0)]>0x64&&(_0x458472=_0x458472[_0x68da4c(0x26b)](0x0,0x64)+_0x68da4c(0x224)),_0x3a5e42['push'](_0x42b2c9[_0x68da4c(0x273)](_0x9b5c9c,_0x1faf5c,_0x68da4c(0x263),_0x458472,_0x1c9223,function(_0x23a429){return function(){return _0x23a429;};}(_0xa3cfdd)));}),!_0x23d1c8){try{for(_0x4d5e64 in _0x1faf5c)if(!(_0x2f0a70&&_0x35769f[_0x450dc5(0x276)](_0x4d5e64))&&!this[_0x450dc5(0x208)](_0x1faf5c,_0x4d5e64,_0x1c9223)){if(_0x2a465b++,_0x1c9223[_0x450dc5(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;break;}if(!_0x1c9223[_0x450dc5(0x28c)]&&_0x1c9223[_0x450dc5(0x20d)]&&_0x1c9223[_0x450dc5(0x1da)]>_0x1c9223[_0x450dc5(0x1e2)]){_0x26b7ba=!0x0;break;}_0x3a5e42[_0x450dc5(0x257)](_0x42b2c9[_0x450dc5(0x26f)](_0x9b5c9c,_0x5b46a1,_0x1faf5c,_0x1bd9a4,_0x4d5e64,_0x1c9223));}}catch{}if(_0x5b46a1[_0x450dc5(0x230)]=!0x0,_0x15b344&&(_0x5b46a1['_p_name']=!0x0),!_0x26b7ba){var _0x4f2c0d=[][_0x450dc5(0x21f)](this[_0x450dc5(0x22e)](_0x1faf5c))[_0x450dc5(0x21f)](this[_0x450dc5(0x2b6)](_0x1faf5c));for(_0x2e839b=0x0,_0x5abfd7=_0x4f2c0d[_0x450dc5(0x1e0)];_0x2e839b<_0x5abfd7;_0x2e839b++)if(_0x4d5e64=_0x4f2c0d[_0x2e839b],!(_0x2f0a70&&_0x35769f[_0x450dc5(0x276)](_0x4d5e64['toString']()))&&!this[_0x450dc5(0x208)](_0x1faf5c,_0x4d5e64,_0x1c9223)&&!_0x5b46a1['_p_'+_0x4d5e64[_0x450dc5(0x259)]()]){if(_0x2a465b++,_0x1c9223[_0x450dc5(0x1da)]++,_0x2a465b>_0x41cf04){_0x26b7ba=!0x0;break;}if(!_0x1c9223[_0x450dc5(0x28c)]&&_0x1c9223[_0x450dc5(0x20d)]&&_0x1c9223[_0x450dc5(0x1da)]>_0x1c9223[_0x450dc5(0x1e2)]){_0x26b7ba=!0x0;break;}_0x3a5e42[_0x450dc5(0x257)](_0x42b2c9[_0x450dc5(0x26f)](_0x9b5c9c,_0x5b46a1,_0x1faf5c,_0x1bd9a4,_0x4d5e64,_0x1c9223));}}}}}if(_0x9dac66[_0x450dc5(0x200)]=_0x1bd9a4,_0x53a5c7?(_0x9dac66[_0x450dc5(0x220)]=_0x1faf5c[_0x450dc5(0x2a4)](),this[_0x450dc5(0x29c)](_0x1bd9a4,_0x9dac66,_0x1c9223,_0x45fa90)):_0x1bd9a4===_0x450dc5(0x2c0)?_0x9dac66[_0x450dc5(0x220)]=this[_0x450dc5(0x1f3)][_0x450dc5(0x275)](_0x1faf5c):_0x1bd9a4===_0x450dc5(0x27b)?_0x9dac66[_0x450dc5(0x220)]=_0x1faf5c[_0x450dc5(0x259)]():_0x1bd9a4==='RegExp'?_0x9dac66[_0x450dc5(0x220)]=this[_0x450dc5(0x1ef)][_0x450dc5(0x275)](_0x1faf5c):_0x1bd9a4===_0x450dc5(0x234)&&this[_0x450dc5(0x233)]?_0x9dac66[_0x450dc5(0x220)]=this[_0x450dc5(0x233)]['prototype']['toString']['call'](_0x1faf5c):!_0x1c9223[_0x450dc5(0x278)]&&!(_0x1bd9a4==='null'||_0x1bd9a4===_0x450dc5(0x1f7))&&(delete _0x9dac66[_0x450dc5(0x220)],_0x9dac66[_0x450dc5(0x248)]=!0x0),_0x26b7ba&&(_0x9dac66['cappedProps']=!0x0),_0x1f0518=_0x1c9223[_0x450dc5(0x239)][_0x450dc5(0x22b)],_0x1c9223[_0x450dc5(0x239)][_0x450dc5(0x22b)]=_0x9dac66,this[_0x450dc5(0x2a6)](_0x9dac66,_0x1c9223),_0x3a5e42[_0x450dc5(0x1e0)]){for(_0x2e839b=0x0,_0x5abfd7=_0x3a5e42['length'];_0x2e839b<_0x5abfd7;_0x2e839b++)_0x3a5e42[_0x2e839b](_0x2e839b);}_0x9b5c9c['length']&&(_0x9dac66[_0x450dc5(0x289)]=_0x9b5c9c);}catch(_0x4ce84c){_0x1e6bd4(_0x4ce84c,_0x9dac66,_0x1c9223);}this[_0x450dc5(0x236)](_0x1faf5c,_0x9dac66),this['_treeNodePropertiesAfterFullValue'](_0x9dac66,_0x1c9223),_0x1c9223[_0x450dc5(0x239)][_0x450dc5(0x22b)]=_0x1f0518,_0x1c9223['level']--,_0x1c9223[_0x450dc5(0x20d)]=_0x24ad5c,_0x1c9223[_0x450dc5(0x20d)]&&_0x1c9223[_0x450dc5(0x298)][_0x450dc5(0x1f9)]();}finally{_0x2f5294&&(_0x5b0c78[_0x450dc5(0x25f)]['error']=_0x2f5294);}return _0x9dac66;}[_0x4807fa(0x2b6)](_0x3cc0e7){var _0x1e176b=_0x4807fa;return Object[_0x1e176b(0x212)]?Object[_0x1e176b(0x212)](_0x3cc0e7):[];}[_0x4807fa(0x2b2)](_0x38f832){var _0x24c7f3=_0x4807fa;return!!(_0x38f832&&_0x5b0c78[_0x24c7f3(0x1db)]&&this['_objectToString'](_0x38f832)==='[object\\x20Set]'&&_0x38f832[_0x24c7f3(0x25b)]);}[_0x4807fa(0x208)](_0x99a8b,_0x29f0bc,_0x534653){var _0x45308d=_0x4807fa;return _0x534653[_0x45308d(0x258)]?typeof _0x99a8b[_0x29f0bc]=='function':!0x1;}[_0x4807fa(0x20e)](_0x4e307f){var _0x2781c0=_0x4807fa,_0x12a33a='';return _0x12a33a=typeof _0x4e307f,_0x12a33a===_0x2781c0(0x291)?this[_0x2781c0(0x207)](_0x4e307f)===_0x2781c0(0x21c)?_0x12a33a='array':this[_0x2781c0(0x207)](_0x4e307f)===_0x2781c0(0x292)?_0x12a33a=_0x2781c0(0x2c0):this['_objectToString'](_0x4e307f)==='[object\\x20BigInt]'?_0x12a33a=_0x2781c0(0x27b):_0x4e307f===null?_0x12a33a='null':_0x4e307f['constructor']&&(_0x12a33a=_0x4e307f['constructor'][_0x2781c0(0x22d)]||_0x12a33a):_0x12a33a===_0x2781c0(0x1f7)&&this[_0x2781c0(0x217)]&&_0x4e307f instanceof this[_0x2781c0(0x217)]&&(_0x12a33a=_0x2781c0(0x1e8)),_0x12a33a;}[_0x4807fa(0x207)](_0x27e984){var _0x21a240=_0x4807fa;return Object[_0x21a240(0x283)][_0x21a240(0x259)][_0x21a240(0x275)](_0x27e984);}[_0x4807fa(0x21b)](_0x1ff47c){var _0x525bec=_0x4807fa;return _0x1ff47c==='boolean'||_0x1ff47c===_0x525bec(0x226)||_0x1ff47c===_0x525bec(0x25e);}[_0x4807fa(0x1e4)](_0x10979c){var _0x54c628=_0x4807fa;return _0x10979c===_0x54c628(0x25c)||_0x10979c===_0x54c628(0x260)||_0x10979c===_0x54c628(0x253);}[_0x4807fa(0x273)](_0x41d525,_0x13deda,_0x56c306,_0x35a444,_0x47770f,_0x4e3933){var _0x23733e=this;return function(_0xf4b6e1){var _0x408bcb=_0x4e5d,_0x178e08=_0x47770f[_0x408bcb(0x239)]['current'],_0x26f4c5=_0x47770f[_0x408bcb(0x239)][_0x408bcb(0x1df)],_0x3388ce=_0x47770f['node']['parent'];_0x47770f[_0x408bcb(0x239)][_0x408bcb(0x279)]=_0x178e08,_0x47770f[_0x408bcb(0x239)]['index']=typeof _0x35a444==_0x408bcb(0x25e)?_0x35a444:_0xf4b6e1,_0x41d525['push'](_0x23733e['_property'](_0x13deda,_0x56c306,_0x35a444,_0x47770f,_0x4e3933)),_0x47770f[_0x408bcb(0x239)]['parent']=_0x3388ce,_0x47770f[_0x408bcb(0x239)]['index']=_0x26f4c5;};}[_0x4807fa(0x26f)](_0x12815e,_0x2ac842,_0x33af2d,_0x525255,_0x2295dc,_0x13a503,_0x10904c){var _0x19298e=_0x4807fa,_0x20dd49=this;return _0x2ac842[_0x19298e(0x265)+_0x2295dc[_0x19298e(0x259)]()]=!0x0,function(_0x4f32b9){var _0x5027bf=_0x19298e,_0x52ec78=_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x22b)],_0x3c5242=_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x1df)],_0x360c7b=_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x279)];_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x279)]=_0x52ec78,_0x13a503[_0x5027bf(0x239)]['index']=_0x4f32b9,_0x12815e[_0x5027bf(0x257)](_0x20dd49[_0x5027bf(0x241)](_0x33af2d,_0x525255,_0x2295dc,_0x13a503,_0x10904c)),_0x13a503[_0x5027bf(0x239)][_0x5027bf(0x279)]=_0x360c7b,_0x13a503[_0x5027bf(0x239)]['index']=_0x3c5242;};}[_0x4807fa(0x241)](_0x52fc5b,_0x378d10,_0x5c99a4,_0x3f3007,_0x190c25){var _0x5ba303=_0x4807fa,_0x596dc6=this;_0x190c25||(_0x190c25=function(_0x4467a0,_0x99077b){return _0x4467a0[_0x99077b];});var _0x50b723=_0x5c99a4[_0x5ba303(0x259)](),_0x4fa73a=_0x3f3007['expressionsToEvaluate']||{},_0x3655f5=_0x3f3007[_0x5ba303(0x278)],_0x5dafab=_0x3f3007[_0x5ba303(0x28c)];try{var _0x2e1d78=this[_0x5ba303(0x2af)](_0x52fc5b),_0x214326=_0x50b723;_0x2e1d78&&_0x214326[0x0]==='\\x27'&&(_0x214326=_0x214326[_0x5ba303(0x20a)](0x1,_0x214326['length']-0x2));var _0x58ec3d=_0x3f3007['expressionsToEvaluate']=_0x4fa73a[_0x5ba303(0x265)+_0x214326];_0x58ec3d&&(_0x3f3007[_0x5ba303(0x278)]=_0x3f3007[_0x5ba303(0x278)]+0x1),_0x3f3007[_0x5ba303(0x28c)]=!!_0x58ec3d;var _0x48c2f5=typeof _0x5c99a4==_0x5ba303(0x234),_0x24a4e7={'name':_0x48c2f5||_0x2e1d78?_0x50b723:this[_0x5ba303(0x1f1)](_0x50b723)};if(_0x48c2f5&&(_0x24a4e7[_0x5ba303(0x234)]=!0x0),!(_0x378d10===_0x5ba303(0x264)||_0x378d10==='Error')){var _0xb511c6=this[_0x5ba303(0x1dc)](_0x52fc5b,_0x5c99a4);if(_0xb511c6&&(_0xb511c6['set']&&(_0x24a4e7['setter']=!0x0),_0xb511c6[_0x5ba303(0x238)]&&!_0x58ec3d&&!_0x3f3007['resolveGetters']))return _0x24a4e7[_0x5ba303(0x1ed)]=!0x0,this['_processTreeNodeResult'](_0x24a4e7,_0x3f3007),_0x24a4e7;}var _0x25b065;try{_0x25b065=_0x190c25(_0x52fc5b,_0x5c99a4);}catch(_0x30f403){return _0x24a4e7={'name':_0x50b723,'type':_0x5ba303(0x22c),'error':_0x30f403[_0x5ba303(0x252)]},this[_0x5ba303(0x24b)](_0x24a4e7,_0x3f3007),_0x24a4e7;}var _0x397cce=this[_0x5ba303(0x20e)](_0x25b065),_0x231c8a=this[_0x5ba303(0x21b)](_0x397cce);if(_0x24a4e7[_0x5ba303(0x200)]=_0x397cce,_0x231c8a)this['_processTreeNodeResult'](_0x24a4e7,_0x3f3007,_0x25b065,function(){var _0x716cde=_0x5ba303;_0x24a4e7[_0x716cde(0x220)]=_0x25b065['valueOf'](),!_0x58ec3d&&_0x596dc6[_0x716cde(0x29c)](_0x397cce,_0x24a4e7,_0x3f3007,{});});else{var _0xfa9de5=_0x3f3007[_0x5ba303(0x20d)]&&_0x3f3007['level']<_0x3f3007['autoExpandMaxDepth']&&_0x3f3007[_0x5ba303(0x298)]['indexOf'](_0x25b065)<0x0&&_0x397cce!==_0x5ba303(0x296)&&_0x3f3007[_0x5ba303(0x1da)]<_0x3f3007[_0x5ba303(0x1e2)];_0xfa9de5||_0x3f3007[_0x5ba303(0x202)]<_0x3655f5||_0x58ec3d?(this['serialize'](_0x24a4e7,_0x25b065,_0x3f3007,_0x58ec3d||{}),this[_0x5ba303(0x236)](_0x25b065,_0x24a4e7)):this[_0x5ba303(0x24b)](_0x24a4e7,_0x3f3007,_0x25b065,function(){var _0xd8bcf5=_0x5ba303;_0x397cce==='null'||_0x397cce===_0xd8bcf5(0x1f7)||(delete _0x24a4e7[_0xd8bcf5(0x220)],_0x24a4e7[_0xd8bcf5(0x248)]=!0x0);});}return _0x24a4e7;}finally{_0x3f3007[_0x5ba303(0x284)]=_0x4fa73a,_0x3f3007[_0x5ba303(0x278)]=_0x3655f5,_0x3f3007['isExpressionToEvaluate']=_0x5dafab;}}['_capIfString'](_0x4d7dbe,_0x1cccda,_0x4ee1d5,_0x449386){var _0x304e4a=_0x4807fa,_0x124a49=_0x449386[_0x304e4a(0x23b)]||_0x4ee1d5[_0x304e4a(0x23b)];if((_0x4d7dbe===_0x304e4a(0x226)||_0x4d7dbe===_0x304e4a(0x260))&&_0x1cccda[_0x304e4a(0x220)]){let _0x5a0f6b=_0x1cccda[_0x304e4a(0x220)][_0x304e4a(0x1e0)];_0x4ee1d5['allStrLength']+=_0x5a0f6b,_0x4ee1d5[_0x304e4a(0x26e)]>_0x4ee1d5[_0x304e4a(0x290)]?(_0x1cccda[_0x304e4a(0x248)]='',delete _0x1cccda[_0x304e4a(0x220)]):_0x5a0f6b>_0x124a49&&(_0x1cccda['capped']=_0x1cccda[_0x304e4a(0x220)][_0x304e4a(0x20a)](0x0,_0x124a49),delete _0x1cccda[_0x304e4a(0x220)]);}}[_0x4807fa(0x2af)](_0xd82361){var _0x4a7f22=_0x4807fa;return!!(_0xd82361&&_0x5b0c78[_0x4a7f22(0x263)]&&this[_0x4a7f22(0x207)](_0xd82361)===_0x4a7f22(0x25d)&&_0xd82361[_0x4a7f22(0x25b)]);}[_0x4807fa(0x1f1)](_0x2c62aa){var _0x3593e2=_0x4807fa;if(_0x2c62aa[_0x3593e2(0x246)](/^\\d+$/))return _0x2c62aa;var _0x41d5b6;try{_0x41d5b6=JSON[_0x3593e2(0x27c)](''+_0x2c62aa);}catch{_0x41d5b6='\\x22'+this[_0x3593e2(0x207)](_0x2c62aa)+'\\x22';}return _0x41d5b6[_0x3593e2(0x246)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x41d5b6=_0x41d5b6['substr'](0x1,_0x41d5b6[_0x3593e2(0x1e0)]-0x2):_0x41d5b6=_0x41d5b6[_0x3593e2(0x28e)](/'/g,'\\x5c\\x27')[_0x3593e2(0x28e)](/\\\\\"/g,'\\x22')[_0x3593e2(0x28e)](/(^\"|\"$)/g,'\\x27'),_0x41d5b6;}[_0x4807fa(0x24b)](_0x3b6771,_0x5e9ee2,_0x440d21,_0x42c256){var _0x38cfec=_0x4807fa;this[_0x38cfec(0x2a6)](_0x3b6771,_0x5e9ee2),_0x42c256&&_0x42c256(),this[_0x38cfec(0x236)](_0x440d21,_0x3b6771),this[_0x38cfec(0x1f6)](_0x3b6771,_0x5e9ee2);}[_0x4807fa(0x2a6)](_0x302ea8,_0x39cfd5){var _0x5d471e=_0x4807fa;this[_0x5d471e(0x1d5)](_0x302ea8,_0x39cfd5),this[_0x5d471e(0x2a3)](_0x302ea8,_0x39cfd5),this['_setNodeExpressionPath'](_0x302ea8,_0x39cfd5),this[_0x5d471e(0x282)](_0x302ea8,_0x39cfd5);}['_setNodeId'](_0x202e1b,_0x1d3a83){}[_0x4807fa(0x2a3)](_0x175795,_0x191dbc){}[_0x4807fa(0x1f2)](_0x14cd5e,_0x132f35){}[_0x4807fa(0x28b)](_0x2de7c2){var _0x595d36=_0x4807fa;return _0x2de7c2===this[_0x595d36(0x274)];}[_0x4807fa(0x1f6)](_0x280ec9,_0x249d2c){var _0x2d9cca=_0x4807fa;this[_0x2d9cca(0x1f2)](_0x280ec9,_0x249d2c),this[_0x2d9cca(0x272)](_0x280ec9),_0x249d2c[_0x2d9cca(0x1f4)]&&this[_0x2d9cca(0x1f0)](_0x280ec9),this[_0x2d9cca(0x21e)](_0x280ec9,_0x249d2c),this[_0x2d9cca(0x209)](_0x280ec9,_0x249d2c),this[_0x2d9cca(0x1ea)](_0x280ec9);}[_0x4807fa(0x236)](_0x50f833,_0x3fb0da){var _0x499dc4=_0x4807fa;try{_0x50f833&&typeof _0x50f833[_0x499dc4(0x1e0)]==_0x499dc4(0x25e)&&(_0x3fb0da[_0x499dc4(0x1e0)]=_0x50f833[_0x499dc4(0x1e0)]);}catch{}if(_0x3fb0da[_0x499dc4(0x200)]===_0x499dc4(0x25e)||_0x3fb0da['type']===_0x499dc4(0x253)){if(isNaN(_0x3fb0da[_0x499dc4(0x220)]))_0x3fb0da[_0x499dc4(0x255)]=!0x0,delete _0x3fb0da[_0x499dc4(0x220)];else switch(_0x3fb0da[_0x499dc4(0x220)]){case Number[_0x499dc4(0x26d)]:_0x3fb0da[_0x499dc4(0x1fd)]=!0x0,delete _0x3fb0da[_0x499dc4(0x220)];break;case Number[_0x499dc4(0x211)]:_0x3fb0da[_0x499dc4(0x2aa)]=!0x0,delete _0x3fb0da['value'];break;case 0x0:this[_0x499dc4(0x204)](_0x3fb0da[_0x499dc4(0x220)])&&(_0x3fb0da['negativeZero']=!0x0);break;}}else _0x3fb0da['type']===_0x499dc4(0x296)&&typeof _0x50f833[_0x499dc4(0x22d)]=='string'&&_0x50f833[_0x499dc4(0x22d)]&&_0x3fb0da[_0x499dc4(0x22d)]&&_0x50f833['name']!==_0x3fb0da[_0x499dc4(0x22d)]&&(_0x3fb0da['funcName']=_0x50f833['name']);}['_isNegativeZero'](_0x47c6c6){var _0x3df6d5=_0x4807fa;return 0x1/_0x47c6c6===Number[_0x3df6d5(0x211)];}[_0x4807fa(0x1f0)](_0x554b1b){var _0x10422d=_0x4807fa;!_0x554b1b[_0x10422d(0x289)]||!_0x554b1b[_0x10422d(0x289)][_0x10422d(0x1e0)]||_0x554b1b[_0x10422d(0x200)]===_0x10422d(0x264)||_0x554b1b['type']===_0x10422d(0x263)||_0x554b1b[_0x10422d(0x200)]==='Set'||_0x554b1b['props']['sort'](function(_0x1d1c6e,_0x34cc2e){var _0x4834d4=_0x10422d,_0x2fc5e6=_0x1d1c6e[_0x4834d4(0x22d)][_0x4834d4(0x299)](),_0x172eed=_0x34cc2e[_0x4834d4(0x22d)][_0x4834d4(0x299)]();return _0x2fc5e6<_0x172eed?-0x1:_0x2fc5e6>_0x172eed?0x1:0x0;});}[_0x4807fa(0x21e)](_0x3ba972,_0x326eeb){var _0x3d45a2=_0x4807fa;if(!(_0x326eeb[_0x3d45a2(0x258)]||!_0x3ba972[_0x3d45a2(0x289)]||!_0x3ba972[_0x3d45a2(0x289)][_0x3d45a2(0x1e0)])){for(var _0x38bd6b=[],_0x5264a2=[],_0xfc0932=0x0,_0x13a98e=_0x3ba972['props'][_0x3d45a2(0x1e0)];_0xfc0932<_0x13a98e;_0xfc0932++){var _0x56f35d=_0x3ba972[_0x3d45a2(0x289)][_0xfc0932];_0x56f35d['type']===_0x3d45a2(0x296)?_0x38bd6b['push'](_0x56f35d):_0x5264a2[_0x3d45a2(0x257)](_0x56f35d);}if(!(!_0x5264a2[_0x3d45a2(0x1e0)]||_0x38bd6b[_0x3d45a2(0x1e0)]<=0x1)){_0x3ba972[_0x3d45a2(0x289)]=_0x5264a2;var _0x46edea={'functionsNode':!0x0,'props':_0x38bd6b};this['_setNodeId'](_0x46edea,_0x326eeb),this[_0x3d45a2(0x1f2)](_0x46edea,_0x326eeb),this[_0x3d45a2(0x272)](_0x46edea),this['_setNodePermissions'](_0x46edea,_0x326eeb),_0x46edea['id']+='\\x20f',_0x3ba972['props'][_0x3d45a2(0x1ec)](_0x46edea);}}}[_0x4807fa(0x209)](_0x1d16fb,_0x46f4e1){}[_0x4807fa(0x272)](_0x403475){}['_isArray'](_0xcf10ef){var _0x3ad88a=_0x4807fa;return Array['isArray'](_0xcf10ef)||typeof _0xcf10ef==_0x3ad88a(0x291)&&this['_objectToString'](_0xcf10ef)===_0x3ad88a(0x21c);}['_setNodePermissions'](_0x49dc8b,_0x35d302){}[_0x4807fa(0x1ea)](_0x5c4da1){var _0x556342=_0x4807fa;delete _0x5c4da1[_0x556342(0x1e1)],delete _0x5c4da1[_0x556342(0x294)],delete _0x5c4da1['_hasMapOnItsPath'];}[_0x4807fa(0x2c5)](_0x2aaa30,_0x4647ed){}}let _0x5c3edf=new _0x4d1e51(),_0x4e6b1d={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x5287a7={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x42f4e1(_0x356fdb,_0x1cfa6a,_0x129c1c,_0x1bc659,_0x1d24a3,_0x105c7a){var _0x3c05aa=_0x4807fa;let _0x5ef21f,_0x12c4af;try{_0x12c4af=_0x86ae58(),_0x5ef21f=_0x4a857b[_0x1cfa6a],!_0x5ef21f||_0x12c4af-_0x5ef21f['ts']>0x1f4&&_0x5ef21f[_0x3c05aa(0x2be)]&&_0x5ef21f['time']/_0x5ef21f[_0x3c05aa(0x2be)]<0x64?(_0x4a857b[_0x1cfa6a]=_0x5ef21f={'count':0x0,'time':0x0,'ts':_0x12c4af},_0x4a857b[_0x3c05aa(0x23f)]={}):_0x12c4af-_0x4a857b[_0x3c05aa(0x23f)]['ts']>0x32&&_0x4a857b['hits'][_0x3c05aa(0x2be)]&&_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x201)]/_0x4a857b[_0x3c05aa(0x23f)]['count']<0x64&&(_0x4a857b[_0x3c05aa(0x23f)]={});let _0x2b807f=[],_0x1c8687=_0x5ef21f['reduceLimits']||_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2a2)]?_0x5287a7:_0x4e6b1d,_0xf7eed4=_0x59f91f=>{var _0x174560=_0x3c05aa;let _0x27eab9={};return _0x27eab9[_0x174560(0x289)]=_0x59f91f[_0x174560(0x289)],_0x27eab9[_0x174560(0x27e)]=_0x59f91f[_0x174560(0x27e)],_0x27eab9[_0x174560(0x23b)]=_0x59f91f['strLength'],_0x27eab9['totalStrLength']=_0x59f91f[_0x174560(0x290)],_0x27eab9[_0x174560(0x1e2)]=_0x59f91f[_0x174560(0x1e2)],_0x27eab9[_0x174560(0x2a7)]=_0x59f91f[_0x174560(0x2a7)],_0x27eab9[_0x174560(0x1f4)]=!0x1,_0x27eab9[_0x174560(0x258)]=!_0x27aee4,_0x27eab9['depth']=0x1,_0x27eab9[_0x174560(0x202)]=0x0,_0x27eab9[_0x174560(0x23c)]='root_exp_id',_0x27eab9['rootExpression']=_0x174560(0x27f),_0x27eab9['autoExpand']=!0x0,_0x27eab9[_0x174560(0x298)]=[],_0x27eab9['autoExpandPropertyCount']=0x0,_0x27eab9[_0x174560(0x1fc)]=!0x0,_0x27eab9[_0x174560(0x26e)]=0x0,_0x27eab9[_0x174560(0x239)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x27eab9;};for(var _0x167f87=0x0;_0x167f87<_0x1d24a3[_0x3c05aa(0x1e0)];_0x167f87++)_0x2b807f['push'](_0x5c3edf['serialize']({'timeNode':_0x356fdb==='time'||void 0x0},_0x1d24a3[_0x167f87],_0xf7eed4(_0x1c8687),{}));if(_0x356fdb===_0x3c05aa(0x29b)||_0x356fdb===_0x3c05aa(0x2bc)){let _0x16140a=Error['stackTraceLimit'];try{Error[_0x3c05aa(0x24f)]=0x1/0x0,_0x2b807f['push'](_0x5c3edf[_0x3c05aa(0x245)]({'stackNode':!0x0},new Error()['stack'],_0xf7eed4(_0x1c8687),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x16140a;}}return{'method':'log','version':_0x475fa2,'args':[{'ts':_0x129c1c,'session':_0x1bc659,'args':_0x2b807f,'id':_0x1cfa6a,'context':_0x105c7a}]};}catch(_0x4cc386){return{'method':'log','version':_0x475fa2,'args':[{'ts':_0x129c1c,'session':_0x1bc659,'args':[{'type':_0x3c05aa(0x22c),'error':_0x4cc386&&_0x4cc386[_0x3c05aa(0x252)]}],'id':_0x1cfa6a,'context':_0x105c7a}]};}finally{try{if(_0x5ef21f&&_0x12c4af){let _0x18971b=_0x86ae58();_0x5ef21f[_0x3c05aa(0x2be)]++,_0x5ef21f['time']+=_0xd32059(_0x12c4af,_0x18971b),_0x5ef21f['ts']=_0x18971b,_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2be)]++,_0x4a857b[_0x3c05aa(0x23f)]['time']+=_0xd32059(_0x12c4af,_0x18971b),_0x4a857b[_0x3c05aa(0x23f)]['ts']=_0x18971b,(_0x5ef21f[_0x3c05aa(0x2be)]>0x32||_0x5ef21f['time']>0x64)&&(_0x5ef21f[_0x3c05aa(0x2a2)]=!0x0),(_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2be)]>0x3e8||_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x201)]>0x12c)&&(_0x4a857b[_0x3c05aa(0x23f)][_0x3c05aa(0x2a2)]=!0x0);}}catch{}}}return _0x42f4e1;}function _0x4e5d(_0xffbaa4,_0xd80235){var _0x475f64=_0x475f();return _0x4e5d=function(_0x4e5d3d,_0x933f66){_0x4e5d3d=_0x4e5d3d-0x1d5;var _0x53ab37=_0x475f64[_0x4e5d3d];return _0x53ab37;},_0x4e5d(_0xffbaa4,_0xd80235);}((_0x158f91,_0x32d758,_0x3c9949,_0x49fee8,_0x28496a,_0xbfcbb0,_0x589524,_0x287f85,_0x142d4f,_0x4d1b78,_0xcbf30b)=>{var _0x1b7f0b=_0x26cbec;if(_0x158f91[_0x1b7f0b(0x205)])return _0x158f91[_0x1b7f0b(0x205)];if(!X(_0x158f91,_0x287f85,_0x28496a))return _0x158f91[_0x1b7f0b(0x205)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x158f91[_0x1b7f0b(0x205)];let _0x4567ec=B(_0x158f91),_0x44eb43=_0x4567ec[_0x1b7f0b(0x286)],_0x8259f4=_0x4567ec[_0x1b7f0b(0x20b)],_0x24e358=_0x4567ec[_0x1b7f0b(0x267)],_0x34f902={'hits':{},'ts':{}},_0x154089=J(_0x158f91,_0x142d4f,_0x34f902,_0xbfcbb0),_0x2def01=_0x515e93=>{_0x34f902['ts'][_0x515e93]=_0x8259f4();},_0x1bce91=(_0x17f9e6,_0x45016c)=>{var _0x330381=_0x1b7f0b;let _0x421ebb=_0x34f902['ts'][_0x45016c];if(delete _0x34f902['ts'][_0x45016c],_0x421ebb){let _0x535c92=_0x44eb43(_0x421ebb,_0x8259f4());_0x556135(_0x154089(_0x330381(0x201),_0x17f9e6,_0x24e358(),_0x2d41a8,[_0x535c92],_0x45016c));}},_0x5198c7=_0x31ed10=>{var _0x5e4234=_0x1b7f0b,_0x4f9ce0;return _0x28496a==='next.js'&&_0x158f91[_0x5e4234(0x231)]&&((_0x4f9ce0=_0x31ed10==null?void 0x0:_0x31ed10[_0x5e4234(0x221)])==null?void 0x0:_0x4f9ce0[_0x5e4234(0x1e0)])&&(_0x31ed10[_0x5e4234(0x221)][0x0][_0x5e4234(0x231)]=_0x158f91['origin']),_0x31ed10;};_0x158f91['_console_ninja']={'consoleLog':(_0x1d7966,_0x44ae88)=>{var _0x16eed0=_0x1b7f0b;_0x158f91['console'][_0x16eed0(0x2b1)][_0x16eed0(0x22d)]!==_0x16eed0(0x1e6)&&_0x556135(_0x154089(_0x16eed0(0x2b1),_0x1d7966,_0x24e358(),_0x2d41a8,_0x44ae88));},'consoleTrace':(_0xa79b78,_0x1d5486)=>{var _0x7c7ba4=_0x1b7f0b,_0x31e7d6,_0xc4bd1c;_0x158f91['console']['log'][_0x7c7ba4(0x22d)]!==_0x7c7ba4(0x1e7)&&((_0xc4bd1c=(_0x31e7d6=_0x158f91[_0x7c7ba4(0x244)])==null?void 0x0:_0x31e7d6[_0x7c7ba4(0x266)])!=null&&_0xc4bd1c[_0x7c7ba4(0x239)]&&(_0x158f91[_0x7c7ba4(0x262)]=!0x0),_0x556135(_0x5198c7(_0x154089(_0x7c7ba4(0x29b),_0xa79b78,_0x24e358(),_0x2d41a8,_0x1d5486))));},'consoleError':(_0x1d8514,_0x1831b3)=>{var _0x594739=_0x1b7f0b;_0x158f91['_ninjaIgnoreNextError']=!0x0,_0x556135(_0x5198c7(_0x154089(_0x594739(0x2bc),_0x1d8514,_0x24e358(),_0x2d41a8,_0x1831b3)));},'consoleTime':_0x3151e9=>{_0x2def01(_0x3151e9);},'consoleTimeEnd':(_0x737277,_0x2eaa8f)=>{_0x1bce91(_0x2eaa8f,_0x737277);},'autoLog':(_0x3fa31d,_0x51d3cd)=>{var _0xa51b61=_0x1b7f0b;_0x556135(_0x154089(_0xa51b61(0x2b1),_0x51d3cd,_0x24e358(),_0x2d41a8,[_0x3fa31d]));},'autoLogMany':(_0x19bdef,_0x2942f3)=>{var _0x6ce017=_0x1b7f0b;_0x556135(_0x154089(_0x6ce017(0x2b1),_0x19bdef,_0x24e358(),_0x2d41a8,_0x2942f3));},'autoTrace':(_0x9f1051,_0x17d171)=>{var _0x1d0a1e=_0x1b7f0b;_0x556135(_0x5198c7(_0x154089(_0x1d0a1e(0x29b),_0x17d171,_0x24e358(),_0x2d41a8,[_0x9f1051])));},'autoTraceMany':(_0x440ff2,_0x22acff)=>{_0x556135(_0x5198c7(_0x154089('trace',_0x440ff2,_0x24e358(),_0x2d41a8,_0x22acff)));},'autoTime':(_0x1d203b,_0x54afb0,_0x3f55d1)=>{_0x2def01(_0x3f55d1);},'autoTimeEnd':(_0x4d920d,_0x1f081f,_0x3c60a2)=>{_0x1bce91(_0x1f081f,_0x3c60a2);},'coverage':_0x36060c=>{var _0x28c524=_0x1b7f0b;_0x556135({'method':_0x28c524(0x26a),'version':_0xbfcbb0,'args':[{'id':_0x36060c}]});}};let _0x556135=H(_0x158f91,_0x32d758,_0x3c9949,_0x49fee8,_0x28496a,_0x4d1b78,_0xcbf30b),_0x2d41a8=_0x158f91[_0x1b7f0b(0x2c2)];return _0x158f91[_0x1b7f0b(0x205)];})(globalThis,_0x26cbec(0x2ad),'63770',_0x26cbec(0x22a),'webpack','1.0.0',_0x26cbec(0x23e),_0x26cbec(0x2b3),_0x26cbec(0x26c),_0x26cbec(0x2c8),_0x26cbec(0x1de));");
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
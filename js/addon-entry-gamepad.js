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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x47b620=_0x4d74;(function(_0x3db4b5,_0x2ae7c8){var _0x387e67=_0x4d74,_0x3f762a=_0x3db4b5();while(!![]){try{var _0x1e50bd=parseInt(_0x387e67(0x198))/0x1*(-parseInt(_0x387e67(0x11e))/0x2)+-parseInt(_0x387e67(0x1a0))/0x3*(-parseInt(_0x387e67(0x1df))/0x4)+parseInt(_0x387e67(0x19d))/0x5+parseInt(_0x387e67(0x200))/0x6+parseInt(_0x387e67(0x1b7))/0x7*(-parseInt(_0x387e67(0x13c))/0x8)+parseInt(_0x387e67(0x1b4))/0x9*(parseInt(_0x387e67(0x15a))/0xa)+-parseInt(_0x387e67(0x1ac))/0xb;if(_0x1e50bd===_0x2ae7c8)break;else _0x3f762a['push'](_0x3f762a['shift']());}catch(_0x16728e){_0x3f762a['push'](_0x3f762a['shift']());}}}(_0x624e,0xb0075));var G=Object['create'],V=Object[_0x47b620(0x215)],ee=Object[_0x47b620(0x127)],te=Object['getOwnPropertyNames'],ne=Object['getPrototypeOf'],re=Object[_0x47b620(0x152)]['hasOwnProperty'],ie=(_0x1c67f4,_0x498527,_0x38b835,_0x58d654)=>{var _0x56fa30=_0x47b620;if(_0x498527&&typeof _0x498527==_0x56fa30(0x1ca)||typeof _0x498527==_0x56fa30(0x187)){for(let _0x393667 of te(_0x498527))!re[_0x56fa30(0x19a)](_0x1c67f4,_0x393667)&&_0x393667!==_0x38b835&&V(_0x1c67f4,_0x393667,{'get':()=>_0x498527[_0x393667],'enumerable':!(_0x58d654=ee(_0x498527,_0x393667))||_0x58d654[_0x56fa30(0x128)]});}return _0x1c67f4;},j=(_0x2f3562,_0x558ca6,_0xd2b10)=>(_0xd2b10=_0x2f3562!=null?G(ne(_0x2f3562)):{},ie(_0x558ca6||!_0x2f3562||!_0x2f3562[_0x47b620(0x1c7)]?V(_0xd2b10,_0x47b620(0x205),{'value':_0x2f3562,'enumerable':!0x0}):_0xd2b10,_0x2f3562)),q=class{constructor(_0x304632,_0x3833f8,_0x1761b3,_0xaa5c8d,_0x23001c,_0x302573){var _0x1ed588=_0x47b620,_0x13d2bc,_0x4fd4ca,_0x4f195c,_0x4d253b;this['global']=_0x304632,this[_0x1ed588(0x1ef)]=_0x3833f8,this[_0x1ed588(0x199)]=_0x1761b3,this[_0x1ed588(0x185)]=_0xaa5c8d,this[_0x1ed588(0x18d)]=_0x23001c,this[_0x1ed588(0x162)]=_0x302573,this[_0x1ed588(0x134)]=!0x0,this[_0x1ed588(0x188)]=!0x0,this[_0x1ed588(0x1f0)]=!0x1,this[_0x1ed588(0x18e)]=!0x1,this[_0x1ed588(0x201)]=((_0x4fd4ca=(_0x13d2bc=_0x304632[_0x1ed588(0x1bb)])==null?void 0x0:_0x13d2bc[_0x1ed588(0x1f4)])==null?void 0x0:_0x4fd4ca[_0x1ed588(0x154)])==='edge',this['_inBrowser']=!((_0x4d253b=(_0x4f195c=this['global'][_0x1ed588(0x1bb)])==null?void 0x0:_0x4f195c[_0x1ed588(0x184)])!=null&&_0x4d253b['node'])&&!this['_inNextEdge'],this['_WebSocketClass']=null,this[_0x1ed588(0x1e2)]=0x0,this[_0x1ed588(0x1f2)]=0x14,this[_0x1ed588(0x13a)]=_0x1ed588(0x17b),this['_sendErrorMessage']=(this['_inBrowser']?_0x1ed588(0x153):_0x1ed588(0x122))+this[_0x1ed588(0x13a)];}async[_0x47b620(0x1fa)](){var _0x4e74be=_0x47b620,_0xce15f7,_0x2c30bb;if(this[_0x4e74be(0x17a)])return this[_0x4e74be(0x17a)];let _0xa621a1;if(this[_0x4e74be(0x1c2)]||this[_0x4e74be(0x201)])_0xa621a1=this[_0x4e74be(0x1b8)][_0x4e74be(0x1aa)];else{if((_0xce15f7=this[_0x4e74be(0x1b8)][_0x4e74be(0x1bb)])!=null&&_0xce15f7['_WebSocket'])_0xa621a1=(_0x2c30bb=this[_0x4e74be(0x1b8)][_0x4e74be(0x1bb)])==null?void 0x0:_0x2c30bb[_0x4e74be(0x140)];else try{let _0x45e813=await import(_0x4e74be(0x1e6));_0xa621a1=(await import((await import(_0x4e74be(0x1cb)))[_0x4e74be(0x1a1)](_0x45e813[_0x4e74be(0x143)](this[_0x4e74be(0x185)],'ws/index.js'))[_0x4e74be(0x20d)]()))[_0x4e74be(0x205)];}catch{try{_0xa621a1=require(require('path')[_0x4e74be(0x143)](this[_0x4e74be(0x185)],'ws'));}catch{throw new Error(_0x4e74be(0x14d));}}}return this[_0x4e74be(0x17a)]=_0xa621a1,_0xa621a1;}[_0x47b620(0x129)](){var _0x48090d=_0x47b620;this[_0x48090d(0x18e)]||this[_0x48090d(0x1f0)]||this[_0x48090d(0x1e2)]>=this[_0x48090d(0x1f2)]||(this['_allowedToConnectOnSend']=!0x1,this[_0x48090d(0x18e)]=!0x0,this[_0x48090d(0x1e2)]++,this[_0x48090d(0x1a4)]=new Promise((_0xe8cfaf,_0x212501)=>{var _0x4d68b3=_0x48090d;this['getWebSocketClass']()[_0x4d68b3(0x14c)](_0x4beac1=>{var _0x4546cc=_0x4d68b3;let _0x4ef48a=new _0x4beac1(_0x4546cc(0x1b2)+(!this[_0x4546cc(0x1c2)]&&this['dockerizedApp']?_0x4546cc(0x1d6):this[_0x4546cc(0x1ef)])+':'+this['port']);_0x4ef48a[_0x4546cc(0x13d)]=()=>{var _0xc76acb=_0x4546cc;this['_allowedToSend']=!0x1,this['_disposeWebsocket'](_0x4ef48a),this['_attemptToReconnectShortly'](),_0x212501(new Error(_0xc76acb(0x1f5)));},_0x4ef48a['onopen']=()=>{var _0x2354e1=_0x4546cc;this[_0x2354e1(0x1c2)]||_0x4ef48a[_0x2354e1(0x180)]&&_0x4ef48a[_0x2354e1(0x180)]['unref']&&_0x4ef48a['_socket'][_0x2354e1(0x175)](),_0xe8cfaf(_0x4ef48a);},_0x4ef48a['onclose']=()=>{var _0x2fe551=_0x4546cc;this[_0x2fe551(0x188)]=!0x0,this[_0x2fe551(0x166)](_0x4ef48a),this['_attemptToReconnectShortly']();},_0x4ef48a[_0x4546cc(0x21c)]=_0x518304=>{var _0x557cd6=_0x4546cc;try{if(!(_0x518304!=null&&_0x518304[_0x557cd6(0x1dc)])||!this['eventReceivedCallback'])return;let _0x28733e=JSON[_0x557cd6(0x209)](_0x518304[_0x557cd6(0x1dc)]);this['eventReceivedCallback'](_0x28733e[_0x557cd6(0x196)],_0x28733e['args'],this[_0x557cd6(0x1b8)],this[_0x557cd6(0x1c2)]);}catch{}};})['then'](_0x39ad6e=>(this[_0x4d68b3(0x1f0)]=!0x0,this['_connecting']=!0x1,this[_0x4d68b3(0x188)]=!0x1,this['_allowedToSend']=!0x0,this[_0x4d68b3(0x1e2)]=0x0,_0x39ad6e))[_0x4d68b3(0x181)](_0x28d1ad=>(this[_0x4d68b3(0x1f0)]=!0x1,this[_0x4d68b3(0x18e)]=!0x1,console[_0x4d68b3(0x20a)](_0x4d68b3(0x183)+this[_0x4d68b3(0x13a)]),_0x212501(new Error(_0x4d68b3(0x16b)+(_0x28d1ad&&_0x28d1ad[_0x4d68b3(0x148)])))));}));}[_0x47b620(0x166)](_0x2f2dda){var _0x42814a=_0x47b620;this[_0x42814a(0x1f0)]=!0x1,this['_connecting']=!0x1;try{_0x2f2dda[_0x42814a(0x1d8)]=null,_0x2f2dda[_0x42814a(0x13d)]=null,_0x2f2dda[_0x42814a(0x20c)]=null;}catch{}try{_0x2f2dda['readyState']<0x2&&_0x2f2dda['close']();}catch{}}[_0x47b620(0x1f1)](){var _0x147416=_0x47b620;clearTimeout(this[_0x147416(0x16a)]),!(this[_0x147416(0x1e2)]>=this[_0x147416(0x1f2)])&&(this[_0x147416(0x16a)]=setTimeout(()=>{var _0x1b1cc1=_0x147416,_0x178a47;this[_0x1b1cc1(0x1f0)]||this[_0x1b1cc1(0x18e)]||(this[_0x1b1cc1(0x129)](),(_0x178a47=this[_0x1b1cc1(0x1a4)])==null||_0x178a47[_0x1b1cc1(0x181)](()=>this[_0x1b1cc1(0x1f1)]()));},0x1f4),this[_0x147416(0x16a)][_0x147416(0x175)]&&this[_0x147416(0x16a)][_0x147416(0x175)]());}async[_0x47b620(0x17f)](_0x4505d9){var _0xd5dfc1=_0x47b620;try{if(!this[_0xd5dfc1(0x134)])return;this[_0xd5dfc1(0x188)]&&this['_connectToHostNow'](),(await this[_0xd5dfc1(0x1a4)])[_0xd5dfc1(0x17f)](JSON[_0xd5dfc1(0x11f)](_0x4505d9));}catch(_0x44ed9b){this[_0xd5dfc1(0x20b)]?console[_0xd5dfc1(0x20a)](this['_sendErrorMessage']+':\\x20'+(_0x44ed9b&&_0x44ed9b['message'])):(this[_0xd5dfc1(0x20b)]=!0x0,console['warn'](this['_sendErrorMessage']+':\\x20'+(_0x44ed9b&&_0x44ed9b[_0xd5dfc1(0x148)]),_0x4505d9)),this[_0xd5dfc1(0x134)]=!0x1,this['_attemptToReconnectShortly']();}}};function _0x624e(){var _0x5c4ee8=['nan','_addProperty','props','Boolean',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.172\"],'eventReceivedCallback','allStrLength','POSITIVE_INFINITY','_capIfString','_disposeWebsocket','now','_keyStrRegExp','_hasMapOnItsPath','_reconnectTimeout','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','coverage','...','angular','root_exp','_treeNodePropertiesBeforeFullValue','_sortProps','autoExpandLimit','elements','disabledLog','unref','resolveGetters','autoExpandMaxDepth','totalStrLength','array','_WebSocketClass','https://tinyurl.com/37x8b79t','_p_','push','RegExp','send','_socket','catch','constructor','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','versions','nodeModules','negativeZero','function','_allowedToConnectOnSend','hrtime','autoExpandPreviousObjects','time','capped','dockerizedApp','_connecting','_additionalMetadata','toUpperCase','noFunctions','isExpressionToEvaluate','webpack','date','string','method','getOwnPropertyNames','23vwPQSj','port','call','_cleanNode','_objectToString','5105990dLNjig','startsWith','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','32793chlVsA','pathToFileURL','_hasSetOnItsPath','_type','_ws','sort','origin','log','_setNodeId','_setNodeExpandableState','WebSocket','valueOf','7674062LjbMqf','_setNodeExpressionPath','_setNodeLabel','slice','_isArray','concat','ws://','level','38187XCxGfu','disabledTrace','_p_name','3217718QsZOXV','global','rootExpression','error','process','toLowerCase','stackTraceLimit','_undefined','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','expId','match','_inBrowser','getter','','positiveInfinity','elapsed','__es'+'Module','value','Set','object','url','test','_isMap','astro','remix','Error','_treeNodePropertiesAfterFullValue','bigint','_processTreeNodeResult','location','_ninjaIgnoreNextError','gateway.docker.internal','negativeInfinity','onclose','[object\\x20Map]','length','some','data','_isPrimitiveWrapperType','type','60HGPKCM','Symbol','isArray','_connectAttemptCount','includes','symbol','_isPrimitiveType','path','name','get','_getOwnPropertySymbols','[object\\x20Date]','127.0.0.1','_setNodePermissions','substr','autoExpandPropertyCount','host','_connected','_attemptToReconnectShortly','_maxConnectAttemptCount','reload','env','logger\\x20websocket\\x20error','Map','_hasSymbolPropertyOnItsPath','String','null','getWebSocketClass','replace','reduceLimits','_isNegativeZero','undefined','index','4864512ZQlboO','_inNextEdge','expressionsToEvaluate','NEGATIVE_INFINITY','depth','default','console','_propertyName','indexOf','parse','warn','_extendedWarning','onopen','toString','pop','_quotedRegExp','1747677192339','\\x20browser','next.js','_console_ninja','\\x20server','defineProperty','_addFunctionsNode','_dateToString','timeStamp','current','forEach','HTMLAllCollection','onmessage','split','serialize','23014IeqwZt','stringify','perf_hooks','unknown','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','_getOwnPropertyNames','sortProps','number','node','getOwnPropertyDescriptor','enumerable','_connectToHostNow','1.0.0','_setNodeQueryPath','Number','hostname','','count','endsWith','_HTMLAllCollection','Buffer','cappedProps','_allowedToSend','_consoleNinjaAllowedToStart','getOwnPropertySymbols','strLength','bind','edge','_webSocketErrorDocsLink','cappedElements','16NBCtui','onerror','[object\\x20Array]','_regExpToString','_WebSocket','_property','_console_ninja_session','join','_getOwnPropertyDescriptor','_isSet','hits',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.445/node_modules\",'message','parent','trace','60952','then','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','_Symbol','root_exp_id','fromCharCode','_addObjectProperty','prototype','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','NEXT_RUNTIME','_blacklistedProperty','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','1','[object\\x20Set]','autoExpand','1430QjOWYO','funcName','map'];_0x624e=function(){return _0x5c4ee8;};return _0x624e();}function H(_0x1f5413,_0x1dec7a,_0x3ee945,_0x4d979a,_0x3c5cba,_0xe19932,_0x2ed50d,_0xa3af38=oe){var _0x5087c3=_0x47b620;let _0x290dd0=_0x3ee945[_0x5087c3(0x21d)](',')[_0x5087c3(0x15c)](_0x55e655=>{var _0xccacd8=_0x5087c3,_0x3bb9d1,_0x5f4f42,_0x4cd9ff,_0x579520;try{if(!_0x1f5413[_0xccacd8(0x142)]){let _0x58c0ab=((_0x5f4f42=(_0x3bb9d1=_0x1f5413[_0xccacd8(0x1bb)])==null?void 0x0:_0x3bb9d1[_0xccacd8(0x184)])==null?void 0x0:_0x5f4f42[_0xccacd8(0x126)])||((_0x579520=(_0x4cd9ff=_0x1f5413['process'])==null?void 0x0:_0x4cd9ff['env'])==null?void 0x0:_0x579520[_0xccacd8(0x154)])==='edge';(_0x3c5cba===_0xccacd8(0x212)||_0x3c5cba===_0xccacd8(0x1cf)||_0x3c5cba===_0xccacd8(0x1ce)||_0x3c5cba===_0xccacd8(0x16e))&&(_0x3c5cba+=_0x58c0ab?_0xccacd8(0x214):_0xccacd8(0x211)),_0x1f5413[_0xccacd8(0x142)]={'id':+new Date(),'tool':_0x3c5cba},_0x2ed50d&&_0x3c5cba&&!_0x58c0ab&&console['log']('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x3c5cba['charAt'](0x0)[_0xccacd8(0x190)]()+_0x3c5cba['substr'](0x1))+',',_0xccacd8(0x156),_0xccacd8(0x1bf));}let _0x5175af=new q(_0x1f5413,_0x1dec7a,_0x55e655,_0x4d979a,_0xe19932,_0xa3af38);return _0x5175af[_0xccacd8(0x17f)][_0xccacd8(0x138)](_0x5175af);}catch(_0x134a30){return console[_0xccacd8(0x20a)](_0xccacd8(0x19f),_0x134a30&&_0x134a30[_0xccacd8(0x148)]),()=>{};}});return _0x30fc3d=>_0x290dd0[_0x5087c3(0x21a)](_0x4c3b03=>_0x4c3b03(_0x30fc3d));}function oe(_0x957a27,_0x436392,_0xf29371,_0x1319ae){var _0x25ec8e=_0x47b620;_0x1319ae&&_0x957a27===_0x25ec8e(0x1f3)&&_0xf29371['location'][_0x25ec8e(0x1f3)]();}function B(_0x529f02){var _0x511cdf=_0x47b620,_0x27b6da,_0x2493c2;let _0x9651f6=function(_0x5deb22,_0x127e25){return _0x127e25-_0x5deb22;},_0x48c442;if(_0x529f02['performance'])_0x48c442=function(){var _0x3c7ab6=_0x4d74;return _0x529f02['performance'][_0x3c7ab6(0x167)]();};else{if(_0x529f02[_0x511cdf(0x1bb)]&&_0x529f02[_0x511cdf(0x1bb)]['hrtime']&&((_0x2493c2=(_0x27b6da=_0x529f02[_0x511cdf(0x1bb)])==null?void 0x0:_0x27b6da['env'])==null?void 0x0:_0x2493c2[_0x511cdf(0x154)])!=='edge')_0x48c442=function(){var _0x8cbbdd=_0x511cdf;return _0x529f02[_0x8cbbdd(0x1bb)][_0x8cbbdd(0x189)]();},_0x9651f6=function(_0x83c819,_0x24dcc7){return 0x3e8*(_0x24dcc7[0x0]-_0x83c819[0x0])+(_0x24dcc7[0x1]-_0x83c819[0x1])/0xf4240;};else try{let {performance:_0x1a8085}=require(_0x511cdf(0x120));_0x48c442=function(){var _0x1b20b4=_0x511cdf;return _0x1a8085[_0x1b20b4(0x167)]();};}catch{_0x48c442=function(){return+new Date();};}}return{'elapsed':_0x9651f6,'timeStamp':_0x48c442,'now':()=>Date[_0x511cdf(0x167)]()};}function X(_0x28a059,_0x1c82bc,_0xf2c718){var _0xcd16ee=_0x47b620,_0x392755,_0x4abbcc,_0x1d6cee,_0x9185d5,_0x19cfb4;if(_0x28a059[_0xcd16ee(0x135)]!==void 0x0)return _0x28a059[_0xcd16ee(0x135)];let _0x5ebc9d=((_0x4abbcc=(_0x392755=_0x28a059[_0xcd16ee(0x1bb)])==null?void 0x0:_0x392755[_0xcd16ee(0x184)])==null?void 0x0:_0x4abbcc[_0xcd16ee(0x126)])||((_0x9185d5=(_0x1d6cee=_0x28a059[_0xcd16ee(0x1bb)])==null?void 0x0:_0x1d6cee['env'])==null?void 0x0:_0x9185d5[_0xcd16ee(0x154)])===_0xcd16ee(0x139);function _0x546616(_0x131027){var _0x5276f0=_0xcd16ee;if(_0x131027[_0x5276f0(0x19e)]('/')&&_0x131027[_0x5276f0(0x130)]('/')){let _0x5d97cf=new RegExp(_0x131027[_0x5276f0(0x1af)](0x1,-0x1));return _0x814501=>_0x5d97cf[_0x5276f0(0x1cc)](_0x814501);}else{if(_0x131027[_0x5276f0(0x1e3)]('*')||_0x131027['includes']('?')){let _0xf381f9=new RegExp('^'+_0x131027[_0x5276f0(0x1fb)](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x5276f0(0x1fb)](/\\*/g,'.*')[_0x5276f0(0x1fb)](/\\?/g,'.')+String[_0x5276f0(0x150)](0x24));return _0x2ec503=>_0xf381f9[_0x5276f0(0x1cc)](_0x2ec503);}else return _0x6fa262=>_0x6fa262===_0x131027;}}let _0x5e1e25=_0x1c82bc['map'](_0x546616);return _0x28a059['_consoleNinjaAllowedToStart']=_0x5ebc9d||!_0x1c82bc,!_0x28a059[_0xcd16ee(0x135)]&&((_0x19cfb4=_0x28a059['location'])==null?void 0x0:_0x19cfb4[_0xcd16ee(0x12d)])&&(_0x28a059['_consoleNinjaAllowedToStart']=_0x5e1e25[_0xcd16ee(0x1db)](_0x35ec41=>_0x35ec41(_0x28a059[_0xcd16ee(0x1d4)][_0xcd16ee(0x12d)]))),_0x28a059[_0xcd16ee(0x135)];}function J(_0x30e387,_0xfde284,_0x287b16,_0x35a73e){var _0x2a549e=_0x47b620;_0x30e387=_0x30e387,_0xfde284=_0xfde284,_0x287b16=_0x287b16,_0x35a73e=_0x35a73e;let _0x3379aa=B(_0x30e387),_0x1d0ebc=_0x3379aa[_0x2a549e(0x1c6)],_0x2fc9dc=_0x3379aa['timeStamp'];class _0x33df18{constructor(){var _0x32a75b=_0x2a549e;this[_0x32a75b(0x168)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this[_0x32a75b(0x20f)]=/'([^\\\\']|\\\\')*'/,this[_0x32a75b(0x1be)]=_0x30e387['undefined'],this[_0x32a75b(0x131)]=_0x30e387['HTMLAllCollection'],this[_0x32a75b(0x144)]=Object[_0x32a75b(0x127)],this[_0x32a75b(0x123)]=Object[_0x32a75b(0x197)],this[_0x32a75b(0x14e)]=_0x30e387[_0x32a75b(0x1e0)],this[_0x32a75b(0x13f)]=RegExp[_0x32a75b(0x152)][_0x32a75b(0x20d)],this['_dateToString']=Date[_0x32a75b(0x152)][_0x32a75b(0x20d)];}[_0x2a549e(0x21e)](_0x1d8e52,_0x5bb491,_0x284dd7,_0x25db8d){var _0x5acd30=_0x2a549e,_0x2c2b7e=this,_0x3909db=_0x284dd7['autoExpand'];function _0x5d722f(_0x589520,_0x35159e,_0x1e43ac){var _0x2e43c8=_0x4d74;_0x35159e[_0x2e43c8(0x1de)]='unknown',_0x35159e[_0x2e43c8(0x1ba)]=_0x589520[_0x2e43c8(0x148)],_0x59009f=_0x1e43ac[_0x2e43c8(0x126)][_0x2e43c8(0x219)],_0x1e43ac[_0x2e43c8(0x126)][_0x2e43c8(0x219)]=_0x35159e,_0x2c2b7e[_0x2e43c8(0x170)](_0x35159e,_0x1e43ac);}let _0x3f9c2e;_0x30e387['console']&&(_0x3f9c2e=_0x30e387[_0x5acd30(0x206)]['error'],_0x3f9c2e&&(_0x30e387[_0x5acd30(0x206)][_0x5acd30(0x1ba)]=function(){}));try{try{_0x284dd7['level']++,_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7[_0x5acd30(0x18a)]['push'](_0x5bb491);var _0x58d478,_0x5cde39,_0x1a29d2,_0x574b44,_0xdcac3e=[],_0x4b0fe1=[],_0x5569c5,_0x2d42ce=this[_0x5acd30(0x1a3)](_0x5bb491),_0x415d2a=_0x2d42ce===_0x5acd30(0x179),_0x140f9b=!0x1,_0x1a62e7=_0x2d42ce===_0x5acd30(0x187),_0x520fe1=this[_0x5acd30(0x1e5)](_0x2d42ce),_0x14d427=this[_0x5acd30(0x1dd)](_0x2d42ce),_0x5f246b=_0x520fe1||_0x14d427,_0x206964={},_0x1da88d=0x0,_0x3602b9=!0x1,_0x59009f,_0x11e013=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x284dd7['depth']){if(_0x415d2a){if(_0x5cde39=_0x5bb491[_0x5acd30(0x1da)],_0x5cde39>_0x284dd7[_0x5acd30(0x173)]){for(_0x1a29d2=0x0,_0x574b44=_0x284dd7[_0x5acd30(0x173)],_0x58d478=_0x1a29d2;_0x58d478<_0x574b44;_0x58d478++)_0x4b0fe1['push'](_0x2c2b7e[_0x5acd30(0x15e)](_0xdcac3e,_0x5bb491,_0x2d42ce,_0x58d478,_0x284dd7));_0x1d8e52[_0x5acd30(0x13b)]=!0x0;}else{for(_0x1a29d2=0x0,_0x574b44=_0x5cde39,_0x58d478=_0x1a29d2;_0x58d478<_0x574b44;_0x58d478++)_0x4b0fe1[_0x5acd30(0x17d)](_0x2c2b7e['_addProperty'](_0xdcac3e,_0x5bb491,_0x2d42ce,_0x58d478,_0x284dd7));}_0x284dd7[_0x5acd30(0x1ee)]+=_0x4b0fe1[_0x5acd30(0x1da)];}if(!(_0x2d42ce===_0x5acd30(0x1f9)||_0x2d42ce===_0x5acd30(0x1fe))&&!_0x520fe1&&_0x2d42ce!=='String'&&_0x2d42ce!==_0x5acd30(0x132)&&_0x2d42ce!==_0x5acd30(0x1d2)){var _0x46da57=_0x25db8d['props']||_0x284dd7['props'];if(this[_0x5acd30(0x145)](_0x5bb491)?(_0x58d478=0x0,_0x5bb491['forEach'](function(_0x53e164){var _0x999a74=_0x5acd30;if(_0x1da88d++,_0x284dd7[_0x999a74(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;return;}if(!_0x284dd7['isExpressionToEvaluate']&&_0x284dd7['autoExpand']&&_0x284dd7[_0x999a74(0x1ee)]>_0x284dd7[_0x999a74(0x172)]){_0x3602b9=!0x0;return;}_0x4b0fe1[_0x999a74(0x17d)](_0x2c2b7e[_0x999a74(0x15e)](_0xdcac3e,_0x5bb491,_0x999a74(0x1c9),_0x58d478++,_0x284dd7,function(_0x5e3244){return function(){return _0x5e3244;};}(_0x53e164)));})):this[_0x5acd30(0x1cd)](_0x5bb491)&&_0x5bb491['forEach'](function(_0x1f0998,_0x436283){var _0x5c915f=_0x5acd30;if(_0x1da88d++,_0x284dd7[_0x5c915f(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;return;}if(!_0x284dd7['isExpressionToEvaluate']&&_0x284dd7[_0x5c915f(0x159)]&&_0x284dd7[_0x5c915f(0x1ee)]>_0x284dd7[_0x5c915f(0x172)]){_0x3602b9=!0x0;return;}var _0x5b5f96=_0x436283[_0x5c915f(0x20d)]();_0x5b5f96[_0x5c915f(0x1da)]>0x64&&(_0x5b5f96=_0x5b5f96[_0x5c915f(0x1af)](0x0,0x64)+_0x5c915f(0x16d)),_0x4b0fe1[_0x5c915f(0x17d)](_0x2c2b7e['_addProperty'](_0xdcac3e,_0x5bb491,'Map',_0x5b5f96,_0x284dd7,function(_0x467161){return function(){return _0x467161;};}(_0x1f0998)));}),!_0x140f9b){try{for(_0x5569c5 in _0x5bb491)if(!(_0x415d2a&&_0x11e013[_0x5acd30(0x1cc)](_0x5569c5))&&!this[_0x5acd30(0x155)](_0x5bb491,_0x5569c5,_0x284dd7)){if(_0x1da88d++,_0x284dd7[_0x5acd30(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;break;}if(!_0x284dd7['isExpressionToEvaluate']&&_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7[_0x5acd30(0x1ee)]>_0x284dd7[_0x5acd30(0x172)]){_0x3602b9=!0x0;break;}_0x4b0fe1[_0x5acd30(0x17d)](_0x2c2b7e[_0x5acd30(0x151)](_0xdcac3e,_0x206964,_0x5bb491,_0x2d42ce,_0x5569c5,_0x284dd7));}}catch{}if(_0x206964['_p_length']=!0x0,_0x1a62e7&&(_0x206964[_0x5acd30(0x1b6)]=!0x0),!_0x3602b9){var _0x494946=[][_0x5acd30(0x1b1)](this[_0x5acd30(0x123)](_0x5bb491))[_0x5acd30(0x1b1)](this[_0x5acd30(0x1e9)](_0x5bb491));for(_0x58d478=0x0,_0x5cde39=_0x494946[_0x5acd30(0x1da)];_0x58d478<_0x5cde39;_0x58d478++)if(_0x5569c5=_0x494946[_0x58d478],!(_0x415d2a&&_0x11e013[_0x5acd30(0x1cc)](_0x5569c5[_0x5acd30(0x20d)]()))&&!this[_0x5acd30(0x155)](_0x5bb491,_0x5569c5,_0x284dd7)&&!_0x206964[_0x5acd30(0x17c)+_0x5569c5[_0x5acd30(0x20d)]()]){if(_0x1da88d++,_0x284dd7[_0x5acd30(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;break;}if(!_0x284dd7[_0x5acd30(0x192)]&&_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7['autoExpandPropertyCount']>_0x284dd7[_0x5acd30(0x172)]){_0x3602b9=!0x0;break;}_0x4b0fe1[_0x5acd30(0x17d)](_0x2c2b7e[_0x5acd30(0x151)](_0xdcac3e,_0x206964,_0x5bb491,_0x2d42ce,_0x5569c5,_0x284dd7));}}}}}if(_0x1d8e52[_0x5acd30(0x1de)]=_0x2d42ce,_0x5f246b?(_0x1d8e52[_0x5acd30(0x1c8)]=_0x5bb491[_0x5acd30(0x1ab)](),this[_0x5acd30(0x165)](_0x2d42ce,_0x1d8e52,_0x284dd7,_0x25db8d)):_0x2d42ce===_0x5acd30(0x194)?_0x1d8e52[_0x5acd30(0x1c8)]=this[_0x5acd30(0x217)]['call'](_0x5bb491):_0x2d42ce===_0x5acd30(0x1d2)?_0x1d8e52[_0x5acd30(0x1c8)]=_0x5bb491['toString']():_0x2d42ce===_0x5acd30(0x17e)?_0x1d8e52[_0x5acd30(0x1c8)]=this[_0x5acd30(0x13f)][_0x5acd30(0x19a)](_0x5bb491):_0x2d42ce==='symbol'&&this['_Symbol']?_0x1d8e52[_0x5acd30(0x1c8)]=this[_0x5acd30(0x14e)]['prototype'][_0x5acd30(0x20d)][_0x5acd30(0x19a)](_0x5bb491):!_0x284dd7[_0x5acd30(0x204)]&&!(_0x2d42ce===_0x5acd30(0x1f9)||_0x2d42ce===_0x5acd30(0x1fe))&&(delete _0x1d8e52[_0x5acd30(0x1c8)],_0x1d8e52[_0x5acd30(0x18c)]=!0x0),_0x3602b9&&(_0x1d8e52[_0x5acd30(0x133)]=!0x0),_0x59009f=_0x284dd7[_0x5acd30(0x126)][_0x5acd30(0x219)],_0x284dd7[_0x5acd30(0x126)]['current']=_0x1d8e52,this['_treeNodePropertiesBeforeFullValue'](_0x1d8e52,_0x284dd7),_0x4b0fe1[_0x5acd30(0x1da)]){for(_0x58d478=0x0,_0x5cde39=_0x4b0fe1[_0x5acd30(0x1da)];_0x58d478<_0x5cde39;_0x58d478++)_0x4b0fe1[_0x58d478](_0x58d478);}_0xdcac3e[_0x5acd30(0x1da)]&&(_0x1d8e52['props']=_0xdcac3e);}catch(_0x45047e){_0x5d722f(_0x45047e,_0x1d8e52,_0x284dd7);}this[_0x5acd30(0x18f)](_0x5bb491,_0x1d8e52),this[_0x5acd30(0x1d1)](_0x1d8e52,_0x284dd7),_0x284dd7['node']['current']=_0x59009f,_0x284dd7[_0x5acd30(0x1b3)]--,_0x284dd7[_0x5acd30(0x159)]=_0x3909db,_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7[_0x5acd30(0x18a)][_0x5acd30(0x20e)]();}finally{_0x3f9c2e&&(_0x30e387['console'][_0x5acd30(0x1ba)]=_0x3f9c2e);}return _0x1d8e52;}['_getOwnPropertySymbols'](_0x1bb50d){var _0x51ec0d=_0x2a549e;return Object[_0x51ec0d(0x136)]?Object[_0x51ec0d(0x136)](_0x1bb50d):[];}[_0x2a549e(0x145)](_0x456c8f){var _0x6cf61=_0x2a549e;return!!(_0x456c8f&&_0x30e387[_0x6cf61(0x1c9)]&&this[_0x6cf61(0x19c)](_0x456c8f)===_0x6cf61(0x158)&&_0x456c8f[_0x6cf61(0x21a)]);}[_0x2a549e(0x155)](_0x558333,_0x35215b,_0x592f2b){var _0x12579b=_0x2a549e;return _0x592f2b[_0x12579b(0x191)]?typeof _0x558333[_0x35215b]==_0x12579b(0x187):!0x1;}['_type'](_0x2808e2){var _0x5af0b9=_0x2a549e,_0x3680d3='';return _0x3680d3=typeof _0x2808e2,_0x3680d3==='object'?this[_0x5af0b9(0x19c)](_0x2808e2)===_0x5af0b9(0x13e)?_0x3680d3=_0x5af0b9(0x179):this['_objectToString'](_0x2808e2)===_0x5af0b9(0x1ea)?_0x3680d3=_0x5af0b9(0x194):this[_0x5af0b9(0x19c)](_0x2808e2)==='[object\\x20BigInt]'?_0x3680d3=_0x5af0b9(0x1d2):_0x2808e2===null?_0x3680d3=_0x5af0b9(0x1f9):_0x2808e2[_0x5af0b9(0x182)]&&(_0x3680d3=_0x2808e2[_0x5af0b9(0x182)][_0x5af0b9(0x1e7)]||_0x3680d3):_0x3680d3==='undefined'&&this[_0x5af0b9(0x131)]&&_0x2808e2 instanceof this[_0x5af0b9(0x131)]&&(_0x3680d3=_0x5af0b9(0x21b)),_0x3680d3;}[_0x2a549e(0x19c)](_0x1dfbbb){var _0x4ff67b=_0x2a549e;return Object[_0x4ff67b(0x152)][_0x4ff67b(0x20d)][_0x4ff67b(0x19a)](_0x1dfbbb);}[_0x2a549e(0x1e5)](_0x1dd8a0){var _0x4ea9fe=_0x2a549e;return _0x1dd8a0==='boolean'||_0x1dd8a0===_0x4ea9fe(0x195)||_0x1dd8a0===_0x4ea9fe(0x125);}[_0x2a549e(0x1dd)](_0x3e5fdd){var _0x5a90b8=_0x2a549e;return _0x3e5fdd===_0x5a90b8(0x160)||_0x3e5fdd===_0x5a90b8(0x1f8)||_0x3e5fdd===_0x5a90b8(0x12c);}[_0x2a549e(0x15e)](_0x52e19e,_0xcbd8a8,_0x2cb039,_0x550aae,_0x94ef1f,_0x17c656){var _0x5e64a2=this;return function(_0x399986){var _0xfa37bb=_0x4d74,_0x22dac8=_0x94ef1f[_0xfa37bb(0x126)]['current'],_0x3761e3=_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x1ff)],_0x394a00=_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x149)];_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x149)]=_0x22dac8,_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x1ff)]=typeof _0x550aae==_0xfa37bb(0x125)?_0x550aae:_0x399986,_0x52e19e['push'](_0x5e64a2[_0xfa37bb(0x141)](_0xcbd8a8,_0x2cb039,_0x550aae,_0x94ef1f,_0x17c656)),_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x149)]=_0x394a00,_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x1ff)]=_0x3761e3;};}[_0x2a549e(0x151)](_0x2d1341,_0x43bcca,_0x26403b,_0x4d40d8,_0x3f6775,_0x5f4ada,_0x701551){var _0x44505d=this;return _0x43bcca['_p_'+_0x3f6775['toString']()]=!0x0,function(_0x10eb25){var _0x14680e=_0x4d74,_0x115359=_0x5f4ada['node'][_0x14680e(0x219)],_0x355108=_0x5f4ada['node'][_0x14680e(0x1ff)],_0x51410f=_0x5f4ada[_0x14680e(0x126)][_0x14680e(0x149)];_0x5f4ada[_0x14680e(0x126)]['parent']=_0x115359,_0x5f4ada[_0x14680e(0x126)][_0x14680e(0x1ff)]=_0x10eb25,_0x2d1341['push'](_0x44505d[_0x14680e(0x141)](_0x26403b,_0x4d40d8,_0x3f6775,_0x5f4ada,_0x701551)),_0x5f4ada[_0x14680e(0x126)]['parent']=_0x51410f,_0x5f4ada['node']['index']=_0x355108;};}[_0x2a549e(0x141)](_0x512116,_0x372090,_0x3971d6,_0x2ca89c,_0x431fdd){var _0x3d8991=_0x2a549e,_0x3ffba6=this;_0x431fdd||(_0x431fdd=function(_0xe4f2af,_0x436596){return _0xe4f2af[_0x436596];});var _0x46c622=_0x3971d6[_0x3d8991(0x20d)](),_0x229fde=_0x2ca89c['expressionsToEvaluate']||{},_0x46528d=_0x2ca89c[_0x3d8991(0x204)],_0x324395=_0x2ca89c[_0x3d8991(0x192)];try{var _0xf91b54=this[_0x3d8991(0x1cd)](_0x512116),_0x43b9b6=_0x46c622;_0xf91b54&&_0x43b9b6[0x0]==='\\x27'&&(_0x43b9b6=_0x43b9b6[_0x3d8991(0x1ed)](0x1,_0x43b9b6[_0x3d8991(0x1da)]-0x2));var _0x5d57b1=_0x2ca89c[_0x3d8991(0x202)]=_0x229fde[_0x3d8991(0x17c)+_0x43b9b6];_0x5d57b1&&(_0x2ca89c[_0x3d8991(0x204)]=_0x2ca89c[_0x3d8991(0x204)]+0x1),_0x2ca89c[_0x3d8991(0x192)]=!!_0x5d57b1;var _0x2c8bdc=typeof _0x3971d6==_0x3d8991(0x1e4),_0x4b8a49={'name':_0x2c8bdc||_0xf91b54?_0x46c622:this[_0x3d8991(0x207)](_0x46c622)};if(_0x2c8bdc&&(_0x4b8a49[_0x3d8991(0x1e4)]=!0x0),!(_0x372090===_0x3d8991(0x179)||_0x372090===_0x3d8991(0x1d0))){var _0x37bf88=this['_getOwnPropertyDescriptor'](_0x512116,_0x3971d6);if(_0x37bf88&&(_0x37bf88['set']&&(_0x4b8a49['setter']=!0x0),_0x37bf88[_0x3d8991(0x1e8)]&&!_0x5d57b1&&!_0x2ca89c[_0x3d8991(0x176)]))return _0x4b8a49[_0x3d8991(0x1c3)]=!0x0,this[_0x3d8991(0x1d3)](_0x4b8a49,_0x2ca89c),_0x4b8a49;}var _0x394a3d;try{_0x394a3d=_0x431fdd(_0x512116,_0x3971d6);}catch(_0x1b0191){return _0x4b8a49={'name':_0x46c622,'type':'unknown','error':_0x1b0191[_0x3d8991(0x148)]},this[_0x3d8991(0x1d3)](_0x4b8a49,_0x2ca89c),_0x4b8a49;}var _0x40c867=this[_0x3d8991(0x1a3)](_0x394a3d),_0x44056c=this[_0x3d8991(0x1e5)](_0x40c867);if(_0x4b8a49[_0x3d8991(0x1de)]=_0x40c867,_0x44056c)this[_0x3d8991(0x1d3)](_0x4b8a49,_0x2ca89c,_0x394a3d,function(){var _0x509543=_0x3d8991;_0x4b8a49[_0x509543(0x1c8)]=_0x394a3d[_0x509543(0x1ab)](),!_0x5d57b1&&_0x3ffba6['_capIfString'](_0x40c867,_0x4b8a49,_0x2ca89c,{});});else{var _0xdda68e=_0x2ca89c['autoExpand']&&_0x2ca89c[_0x3d8991(0x1b3)]<_0x2ca89c['autoExpandMaxDepth']&&_0x2ca89c[_0x3d8991(0x18a)][_0x3d8991(0x208)](_0x394a3d)<0x0&&_0x40c867!=='function'&&_0x2ca89c[_0x3d8991(0x1ee)]<_0x2ca89c[_0x3d8991(0x172)];_0xdda68e||_0x2ca89c[_0x3d8991(0x1b3)]<_0x46528d||_0x5d57b1?(this[_0x3d8991(0x21e)](_0x4b8a49,_0x394a3d,_0x2ca89c,_0x5d57b1||{}),this[_0x3d8991(0x18f)](_0x394a3d,_0x4b8a49)):this['_processTreeNodeResult'](_0x4b8a49,_0x2ca89c,_0x394a3d,function(){var _0x4febf3=_0x3d8991;_0x40c867===_0x4febf3(0x1f9)||_0x40c867===_0x4febf3(0x1fe)||(delete _0x4b8a49[_0x4febf3(0x1c8)],_0x4b8a49[_0x4febf3(0x18c)]=!0x0);});}return _0x4b8a49;}finally{_0x2ca89c[_0x3d8991(0x202)]=_0x229fde,_0x2ca89c[_0x3d8991(0x204)]=_0x46528d,_0x2ca89c[_0x3d8991(0x192)]=_0x324395;}}[_0x2a549e(0x165)](_0x4def61,_0xe0a235,_0x5d79f8,_0x479a78){var _0x2d1480=_0x2a549e,_0x3ff3c0=_0x479a78['strLength']||_0x5d79f8[_0x2d1480(0x137)];if((_0x4def61===_0x2d1480(0x195)||_0x4def61===_0x2d1480(0x1f8))&&_0xe0a235[_0x2d1480(0x1c8)]){let _0x5042af=_0xe0a235[_0x2d1480(0x1c8)][_0x2d1480(0x1da)];_0x5d79f8['allStrLength']+=_0x5042af,_0x5d79f8[_0x2d1480(0x163)]>_0x5d79f8[_0x2d1480(0x178)]?(_0xe0a235[_0x2d1480(0x18c)]='',delete _0xe0a235['value']):_0x5042af>_0x3ff3c0&&(_0xe0a235[_0x2d1480(0x18c)]=_0xe0a235['value'][_0x2d1480(0x1ed)](0x0,_0x3ff3c0),delete _0xe0a235[_0x2d1480(0x1c8)]);}}[_0x2a549e(0x1cd)](_0x50755c){var _0x398c50=_0x2a549e;return!!(_0x50755c&&_0x30e387[_0x398c50(0x1f6)]&&this[_0x398c50(0x19c)](_0x50755c)===_0x398c50(0x1d9)&&_0x50755c['forEach']);}[_0x2a549e(0x207)](_0x1f2f51){var _0x21f8f7=_0x2a549e;if(_0x1f2f51[_0x21f8f7(0x1c1)](/^\\d+$/))return _0x1f2f51;var _0x9f8785;try{_0x9f8785=JSON[_0x21f8f7(0x11f)](''+_0x1f2f51);}catch{_0x9f8785='\\x22'+this[_0x21f8f7(0x19c)](_0x1f2f51)+'\\x22';}return _0x9f8785[_0x21f8f7(0x1c1)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x9f8785=_0x9f8785[_0x21f8f7(0x1ed)](0x1,_0x9f8785['length']-0x2):_0x9f8785=_0x9f8785[_0x21f8f7(0x1fb)](/'/g,'\\x5c\\x27')[_0x21f8f7(0x1fb)](/\\\\\"/g,'\\x22')['replace'](/(^\"|\"$)/g,'\\x27'),_0x9f8785;}[_0x2a549e(0x1d3)](_0x554110,_0x582f2f,_0x528d3e,_0x3a440f){var _0x37c34a=_0x2a549e;this[_0x37c34a(0x170)](_0x554110,_0x582f2f),_0x3a440f&&_0x3a440f(),this['_additionalMetadata'](_0x528d3e,_0x554110),this['_treeNodePropertiesAfterFullValue'](_0x554110,_0x582f2f);}['_treeNodePropertiesBeforeFullValue'](_0x1dc0f1,_0x4f7ab1){var _0x2afd47=_0x2a549e;this['_setNodeId'](_0x1dc0f1,_0x4f7ab1),this[_0x2afd47(0x12b)](_0x1dc0f1,_0x4f7ab1),this['_setNodeExpressionPath'](_0x1dc0f1,_0x4f7ab1),this[_0x2afd47(0x1ec)](_0x1dc0f1,_0x4f7ab1);}[_0x2a549e(0x1a8)](_0x1f1982,_0x4dbfc7){}[_0x2a549e(0x12b)](_0x3ba8d7,_0x43c238){}[_0x2a549e(0x1ae)](_0xaf686,_0x339ad3){}['_isUndefined'](_0x43f6d4){return _0x43f6d4===this['_undefined'];}[_0x2a549e(0x1d1)](_0x2f3058,_0x3c16c0){var _0xe52623=_0x2a549e;this[_0xe52623(0x1ae)](_0x2f3058,_0x3c16c0),this['_setNodeExpandableState'](_0x2f3058),_0x3c16c0[_0xe52623(0x124)]&&this[_0xe52623(0x171)](_0x2f3058),this[_0xe52623(0x216)](_0x2f3058,_0x3c16c0),this['_addLoadNode'](_0x2f3058,_0x3c16c0),this[_0xe52623(0x19b)](_0x2f3058);}['_additionalMetadata'](_0x12bd57,_0x3e3a76){var _0x35800b=_0x2a549e;try{_0x12bd57&&typeof _0x12bd57['length']=='number'&&(_0x3e3a76[_0x35800b(0x1da)]=_0x12bd57['length']);}catch{}if(_0x3e3a76['type']===_0x35800b(0x125)||_0x3e3a76['type']==='Number'){if(isNaN(_0x3e3a76[_0x35800b(0x1c8)]))_0x3e3a76[_0x35800b(0x15d)]=!0x0,delete _0x3e3a76[_0x35800b(0x1c8)];else switch(_0x3e3a76[_0x35800b(0x1c8)]){case Number[_0x35800b(0x164)]:_0x3e3a76[_0x35800b(0x1c5)]=!0x0,delete _0x3e3a76[_0x35800b(0x1c8)];break;case Number[_0x35800b(0x203)]:_0x3e3a76[_0x35800b(0x1d7)]=!0x0,delete _0x3e3a76[_0x35800b(0x1c8)];break;case 0x0:this['_isNegativeZero'](_0x3e3a76[_0x35800b(0x1c8)])&&(_0x3e3a76[_0x35800b(0x186)]=!0x0);break;}}else _0x3e3a76[_0x35800b(0x1de)]==='function'&&typeof _0x12bd57[_0x35800b(0x1e7)]==_0x35800b(0x195)&&_0x12bd57[_0x35800b(0x1e7)]&&_0x3e3a76[_0x35800b(0x1e7)]&&_0x12bd57[_0x35800b(0x1e7)]!==_0x3e3a76[_0x35800b(0x1e7)]&&(_0x3e3a76[_0x35800b(0x15b)]=_0x12bd57[_0x35800b(0x1e7)]);}[_0x2a549e(0x1fd)](_0x2105d9){var _0x20e3e2=_0x2a549e;return 0x1/_0x2105d9===Number[_0x20e3e2(0x203)];}['_sortProps'](_0x2eb104){var _0x57278d=_0x2a549e;!_0x2eb104[_0x57278d(0x15f)]||!_0x2eb104[_0x57278d(0x15f)][_0x57278d(0x1da)]||_0x2eb104[_0x57278d(0x1de)]===_0x57278d(0x179)||_0x2eb104[_0x57278d(0x1de)]===_0x57278d(0x1f6)||_0x2eb104['type']===_0x57278d(0x1c9)||_0x2eb104[_0x57278d(0x15f)][_0x57278d(0x1a5)](function(_0x2d5226,_0x5bff15){var _0xd61655=_0x57278d,_0x10b3b7=_0x2d5226['name'][_0xd61655(0x1bc)](),_0x2ec8af=_0x5bff15[_0xd61655(0x1e7)][_0xd61655(0x1bc)]();return _0x10b3b7<_0x2ec8af?-0x1:_0x10b3b7>_0x2ec8af?0x1:0x0;});}['_addFunctionsNode'](_0x4d19a6,_0x4d6636){var _0x38a943=_0x2a549e;if(!(_0x4d6636['noFunctions']||!_0x4d19a6[_0x38a943(0x15f)]||!_0x4d19a6['props'][_0x38a943(0x1da)])){for(var _0x59f7ff=[],_0x2571e9=[],_0x2fccdf=0x0,_0x4375c8=_0x4d19a6[_0x38a943(0x15f)][_0x38a943(0x1da)];_0x2fccdf<_0x4375c8;_0x2fccdf++){var _0x1622bf=_0x4d19a6[_0x38a943(0x15f)][_0x2fccdf];_0x1622bf[_0x38a943(0x1de)]===_0x38a943(0x187)?_0x59f7ff[_0x38a943(0x17d)](_0x1622bf):_0x2571e9[_0x38a943(0x17d)](_0x1622bf);}if(!(!_0x2571e9[_0x38a943(0x1da)]||_0x59f7ff[_0x38a943(0x1da)]<=0x1)){_0x4d19a6[_0x38a943(0x15f)]=_0x2571e9;var _0x38a7b9={'functionsNode':!0x0,'props':_0x59f7ff};this[_0x38a943(0x1a8)](_0x38a7b9,_0x4d6636),this[_0x38a943(0x1ae)](_0x38a7b9,_0x4d6636),this[_0x38a943(0x1a9)](_0x38a7b9),this[_0x38a943(0x1ec)](_0x38a7b9,_0x4d6636),_0x38a7b9['id']+='\\x20f',_0x4d19a6[_0x38a943(0x15f)]['unshift'](_0x38a7b9);}}}['_addLoadNode'](_0x5e90a8,_0x4b235e){}[_0x2a549e(0x1a9)](_0xe7e1ce){}[_0x2a549e(0x1b0)](_0x45a61f){var _0x276cc2=_0x2a549e;return Array[_0x276cc2(0x1e1)](_0x45a61f)||typeof _0x45a61f==_0x276cc2(0x1ca)&&this[_0x276cc2(0x19c)](_0x45a61f)==='[object\\x20Array]';}[_0x2a549e(0x1ec)](_0xd4313b,_0x4d2e31){}[_0x2a549e(0x19b)](_0x5dfdd9){var _0x37766f=_0x2a549e;delete _0x5dfdd9[_0x37766f(0x1f7)],delete _0x5dfdd9[_0x37766f(0x1a2)],delete _0x5dfdd9[_0x37766f(0x169)];}[_0x2a549e(0x1ad)](_0x253e69,_0x24f896){}}let _0x22ec59=new _0x33df18(),_0x3761a8={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x503c18={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x5f27f0(_0x4f1222,_0x508609,_0x4548c9,_0x3192ec,_0x3fe4dc,_0x1f6d48){var _0x52ec37=_0x2a549e;let _0x5adec3,_0x322070;try{_0x322070=_0x2fc9dc(),_0x5adec3=_0x287b16[_0x508609],!_0x5adec3||_0x322070-_0x5adec3['ts']>0x1f4&&_0x5adec3[_0x52ec37(0x12f)]&&_0x5adec3[_0x52ec37(0x18b)]/_0x5adec3[_0x52ec37(0x12f)]<0x64?(_0x287b16[_0x508609]=_0x5adec3={'count':0x0,'time':0x0,'ts':_0x322070},_0x287b16[_0x52ec37(0x146)]={}):_0x322070-_0x287b16[_0x52ec37(0x146)]['ts']>0x32&&_0x287b16[_0x52ec37(0x146)]['count']&&_0x287b16[_0x52ec37(0x146)]['time']/_0x287b16['hits']['count']<0x64&&(_0x287b16[_0x52ec37(0x146)]={});let _0x18cdd0=[],_0xdf244d=_0x5adec3['reduceLimits']||_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x1fc)]?_0x503c18:_0x3761a8,_0x1e4915=_0x37183d=>{var _0x3d157c=_0x52ec37;let _0x106bc9={};return _0x106bc9[_0x3d157c(0x15f)]=_0x37183d[_0x3d157c(0x15f)],_0x106bc9[_0x3d157c(0x173)]=_0x37183d[_0x3d157c(0x173)],_0x106bc9[_0x3d157c(0x137)]=_0x37183d[_0x3d157c(0x137)],_0x106bc9['totalStrLength']=_0x37183d[_0x3d157c(0x178)],_0x106bc9[_0x3d157c(0x172)]=_0x37183d[_0x3d157c(0x172)],_0x106bc9[_0x3d157c(0x177)]=_0x37183d[_0x3d157c(0x177)],_0x106bc9['sortProps']=!0x1,_0x106bc9[_0x3d157c(0x191)]=!_0xfde284,_0x106bc9[_0x3d157c(0x204)]=0x1,_0x106bc9['level']=0x0,_0x106bc9[_0x3d157c(0x1c0)]=_0x3d157c(0x14f),_0x106bc9[_0x3d157c(0x1b9)]=_0x3d157c(0x16f),_0x106bc9[_0x3d157c(0x159)]=!0x0,_0x106bc9['autoExpandPreviousObjects']=[],_0x106bc9[_0x3d157c(0x1ee)]=0x0,_0x106bc9[_0x3d157c(0x176)]=!0x0,_0x106bc9['allStrLength']=0x0,_0x106bc9[_0x3d157c(0x126)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x106bc9;};for(var _0x3f740e=0x0;_0x3f740e<_0x3fe4dc[_0x52ec37(0x1da)];_0x3f740e++)_0x18cdd0[_0x52ec37(0x17d)](_0x22ec59['serialize']({'timeNode':_0x4f1222===_0x52ec37(0x18b)||void 0x0},_0x3fe4dc[_0x3f740e],_0x1e4915(_0xdf244d),{}));if(_0x4f1222===_0x52ec37(0x14a)||_0x4f1222===_0x52ec37(0x1ba)){let _0x4c53e2=Error[_0x52ec37(0x1bd)];try{Error['stackTraceLimit']=0x1/0x0,_0x18cdd0['push'](_0x22ec59[_0x52ec37(0x21e)]({'stackNode':!0x0},new Error()['stack'],_0x1e4915(_0xdf244d),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x4c53e2;}}return{'method':_0x52ec37(0x1a7),'version':_0x35a73e,'args':[{'ts':_0x4548c9,'session':_0x3192ec,'args':_0x18cdd0,'id':_0x508609,'context':_0x1f6d48}]};}catch(_0x1d1e5e){return{'method':_0x52ec37(0x1a7),'version':_0x35a73e,'args':[{'ts':_0x4548c9,'session':_0x3192ec,'args':[{'type':_0x52ec37(0x121),'error':_0x1d1e5e&&_0x1d1e5e[_0x52ec37(0x148)]}],'id':_0x508609,'context':_0x1f6d48}]};}finally{try{if(_0x5adec3&&_0x322070){let _0x3afb4a=_0x2fc9dc();_0x5adec3[_0x52ec37(0x12f)]++,_0x5adec3[_0x52ec37(0x18b)]+=_0x1d0ebc(_0x322070,_0x3afb4a),_0x5adec3['ts']=_0x3afb4a,_0x287b16[_0x52ec37(0x146)]['count']++,_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x18b)]+=_0x1d0ebc(_0x322070,_0x3afb4a),_0x287b16[_0x52ec37(0x146)]['ts']=_0x3afb4a,(_0x5adec3[_0x52ec37(0x12f)]>0x32||_0x5adec3[_0x52ec37(0x18b)]>0x64)&&(_0x5adec3['reduceLimits']=!0x0),(_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x12f)]>0x3e8||_0x287b16[_0x52ec37(0x146)]['time']>0x12c)&&(_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x1fc)]=!0x0);}}catch{}}}return _0x5f27f0;}function _0x4d74(_0x584e3d,_0x3bdb28){var _0x624eeb=_0x624e();return _0x4d74=function(_0x4d7493,_0x56f98f){_0x4d7493=_0x4d7493-0x11e;var _0x228814=_0x624eeb[_0x4d7493];return _0x228814;},_0x4d74(_0x584e3d,_0x3bdb28);}((_0x1473b4,_0x3519a8,_0x33af0a,_0x4d0175,_0x11d702,_0x58ce62,_0x397d53,_0x57fb78,_0x468b15,_0x2af434,_0xe6365e)=>{var _0x3f8de2=_0x47b620;if(_0x1473b4['_console_ninja'])return _0x1473b4['_console_ninja'];if(!X(_0x1473b4,_0x57fb78,_0x11d702))return _0x1473b4['_console_ninja']={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x1473b4['_console_ninja'];let _0x3e4646=B(_0x1473b4),_0x34eae8=_0x3e4646[_0x3f8de2(0x1c6)],_0x1e77c1=_0x3e4646[_0x3f8de2(0x218)],_0x2f898e=_0x3e4646[_0x3f8de2(0x167)],_0x33af60={'hits':{},'ts':{}},_0x55dd09=J(_0x1473b4,_0x468b15,_0x33af60,_0x58ce62),_0x355472=_0x27fc00=>{_0x33af60['ts'][_0x27fc00]=_0x1e77c1();},_0x1b8382=(_0x4a02a9,_0xf2a564)=>{let _0x71a495=_0x33af60['ts'][_0xf2a564];if(delete _0x33af60['ts'][_0xf2a564],_0x71a495){let _0x14cad4=_0x34eae8(_0x71a495,_0x1e77c1());_0x4a5733(_0x55dd09('time',_0x4a02a9,_0x2f898e(),_0x308f7f,[_0x14cad4],_0xf2a564));}},_0x506fa1=_0x23a668=>{var _0x38efdc=_0x3f8de2,_0x236a5d;return _0x11d702===_0x38efdc(0x212)&&_0x1473b4[_0x38efdc(0x1a6)]&&((_0x236a5d=_0x23a668==null?void 0x0:_0x23a668['args'])==null?void 0x0:_0x236a5d['length'])&&(_0x23a668['args'][0x0][_0x38efdc(0x1a6)]=_0x1473b4[_0x38efdc(0x1a6)]),_0x23a668;};_0x1473b4['_console_ninja']={'consoleLog':(_0x396103,_0x155426)=>{var _0x6a3b97=_0x3f8de2;_0x1473b4[_0x6a3b97(0x206)][_0x6a3b97(0x1a7)][_0x6a3b97(0x1e7)]!==_0x6a3b97(0x174)&&_0x4a5733(_0x55dd09(_0x6a3b97(0x1a7),_0x396103,_0x2f898e(),_0x308f7f,_0x155426));},'consoleTrace':(_0x4fd8da,_0x24f933)=>{var _0xcd9c72=_0x3f8de2,_0x260e73,_0x3e990f;_0x1473b4[_0xcd9c72(0x206)][_0xcd9c72(0x1a7)][_0xcd9c72(0x1e7)]!==_0xcd9c72(0x1b5)&&((_0x3e990f=(_0x260e73=_0x1473b4[_0xcd9c72(0x1bb)])==null?void 0x0:_0x260e73[_0xcd9c72(0x184)])!=null&&_0x3e990f[_0xcd9c72(0x126)]&&(_0x1473b4[_0xcd9c72(0x1d5)]=!0x0),_0x4a5733(_0x506fa1(_0x55dd09(_0xcd9c72(0x14a),_0x4fd8da,_0x2f898e(),_0x308f7f,_0x24f933))));},'consoleError':(_0x2e1086,_0x187b72)=>{var _0x4047ac=_0x3f8de2;_0x1473b4[_0x4047ac(0x1d5)]=!0x0,_0x4a5733(_0x506fa1(_0x55dd09(_0x4047ac(0x1ba),_0x2e1086,_0x2f898e(),_0x308f7f,_0x187b72)));},'consoleTime':_0x8baf69=>{_0x355472(_0x8baf69);},'consoleTimeEnd':(_0x583396,_0x11c0e6)=>{_0x1b8382(_0x11c0e6,_0x583396);},'autoLog':(_0x14cbea,_0x2710b1)=>{var _0xcba19a=_0x3f8de2;_0x4a5733(_0x55dd09(_0xcba19a(0x1a7),_0x2710b1,_0x2f898e(),_0x308f7f,[_0x14cbea]));},'autoLogMany':(_0xef331,_0x10b8b8)=>{var _0x599b8b=_0x3f8de2;_0x4a5733(_0x55dd09(_0x599b8b(0x1a7),_0xef331,_0x2f898e(),_0x308f7f,_0x10b8b8));},'autoTrace':(_0x313fee,_0x1ca1f6)=>{var _0x27d1ab=_0x3f8de2;_0x4a5733(_0x506fa1(_0x55dd09(_0x27d1ab(0x14a),_0x1ca1f6,_0x2f898e(),_0x308f7f,[_0x313fee])));},'autoTraceMany':(_0x2483e9,_0xfb6afd)=>{var _0x5b50fa=_0x3f8de2;_0x4a5733(_0x506fa1(_0x55dd09(_0x5b50fa(0x14a),_0x2483e9,_0x2f898e(),_0x308f7f,_0xfb6afd)));},'autoTime':(_0x5696c0,_0x5c9ef6,_0x4abb2b)=>{_0x355472(_0x4abb2b);},'autoTimeEnd':(_0x2a2693,_0x84bd07,_0x157dcc)=>{_0x1b8382(_0x84bd07,_0x157dcc);},'coverage':_0x4f777e=>{var _0x354035=_0x3f8de2;_0x4a5733({'method':_0x354035(0x16c),'version':_0x58ce62,'args':[{'id':_0x4f777e}]});}};let _0x4a5733=H(_0x1473b4,_0x3519a8,_0x33af0a,_0x4d0175,_0x11d702,_0x2af434,_0xe6365e),_0x308f7f=_0x1473b4[_0x3f8de2(0x142)];return _0x1473b4[_0x3f8de2(0x213)];})(globalThis,_0x47b620(0x1eb),_0x47b620(0x14b),_0x47b620(0x147),_0x47b620(0x193),_0x47b620(0x12a),_0x47b620(0x210),_0x47b620(0x161),_0x47b620(0x1c4),_0x47b620(0x12e),_0x47b620(0x157));");
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
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x47b620=_0x4d74;(function(_0x3db4b5,_0x2ae7c8){var _0x387e67=_0x4d74,_0x3f762a=_0x3db4b5();while(!![]){try{var _0x1e50bd=parseInt(_0x387e67(0x198))/0x1*(-parseInt(_0x387e67(0x11e))/0x2)+-parseInt(_0x387e67(0x1a0))/0x3*(-parseInt(_0x387e67(0x1df))/0x4)+parseInt(_0x387e67(0x19d))/0x5+parseInt(_0x387e67(0x200))/0x6+parseInt(_0x387e67(0x1b7))/0x7*(-parseInt(_0x387e67(0x13c))/0x8)+parseInt(_0x387e67(0x1b4))/0x9*(parseInt(_0x387e67(0x15a))/0xa)+-parseInt(_0x387e67(0x1ac))/0xb;if(_0x1e50bd===_0x2ae7c8)break;else _0x3f762a['push'](_0x3f762a['shift']());}catch(_0x16728e){_0x3f762a['push'](_0x3f762a['shift']());}}}(_0x624e,0xb0075));var G=Object['create'],V=Object[_0x47b620(0x215)],ee=Object[_0x47b620(0x127)],te=Object['getOwnPropertyNames'],ne=Object['getPrototypeOf'],re=Object[_0x47b620(0x152)]['hasOwnProperty'],ie=(_0x1c67f4,_0x498527,_0x38b835,_0x58d654)=>{var _0x56fa30=_0x47b620;if(_0x498527&&typeof _0x498527==_0x56fa30(0x1ca)||typeof _0x498527==_0x56fa30(0x187)){for(let _0x393667 of te(_0x498527))!re[_0x56fa30(0x19a)](_0x1c67f4,_0x393667)&&_0x393667!==_0x38b835&&V(_0x1c67f4,_0x393667,{'get':()=>_0x498527[_0x393667],'enumerable':!(_0x58d654=ee(_0x498527,_0x393667))||_0x58d654[_0x56fa30(0x128)]});}return _0x1c67f4;},j=(_0x2f3562,_0x558ca6,_0xd2b10)=>(_0xd2b10=_0x2f3562!=null?G(ne(_0x2f3562)):{},ie(_0x558ca6||!_0x2f3562||!_0x2f3562[_0x47b620(0x1c7)]?V(_0xd2b10,_0x47b620(0x205),{'value':_0x2f3562,'enumerable':!0x0}):_0xd2b10,_0x2f3562)),q=class{constructor(_0x304632,_0x3833f8,_0x1761b3,_0xaa5c8d,_0x23001c,_0x302573){var _0x1ed588=_0x47b620,_0x13d2bc,_0x4fd4ca,_0x4f195c,_0x4d253b;this['global']=_0x304632,this[_0x1ed588(0x1ef)]=_0x3833f8,this[_0x1ed588(0x199)]=_0x1761b3,this[_0x1ed588(0x185)]=_0xaa5c8d,this[_0x1ed588(0x18d)]=_0x23001c,this[_0x1ed588(0x162)]=_0x302573,this[_0x1ed588(0x134)]=!0x0,this[_0x1ed588(0x188)]=!0x0,this[_0x1ed588(0x1f0)]=!0x1,this[_0x1ed588(0x18e)]=!0x1,this[_0x1ed588(0x201)]=((_0x4fd4ca=(_0x13d2bc=_0x304632[_0x1ed588(0x1bb)])==null?void 0x0:_0x13d2bc[_0x1ed588(0x1f4)])==null?void 0x0:_0x4fd4ca[_0x1ed588(0x154)])==='edge',this['_inBrowser']=!((_0x4d253b=(_0x4f195c=this['global'][_0x1ed588(0x1bb)])==null?void 0x0:_0x4f195c[_0x1ed588(0x184)])!=null&&_0x4d253b['node'])&&!this['_inNextEdge'],this['_WebSocketClass']=null,this[_0x1ed588(0x1e2)]=0x0,this[_0x1ed588(0x1f2)]=0x14,this[_0x1ed588(0x13a)]=_0x1ed588(0x17b),this['_sendErrorMessage']=(this['_inBrowser']?_0x1ed588(0x153):_0x1ed588(0x122))+this[_0x1ed588(0x13a)];}async[_0x47b620(0x1fa)](){var _0x4e74be=_0x47b620,_0xce15f7,_0x2c30bb;if(this[_0x4e74be(0x17a)])return this[_0x4e74be(0x17a)];let _0xa621a1;if(this[_0x4e74be(0x1c2)]||this[_0x4e74be(0x201)])_0xa621a1=this[_0x4e74be(0x1b8)][_0x4e74be(0x1aa)];else{if((_0xce15f7=this[_0x4e74be(0x1b8)][_0x4e74be(0x1bb)])!=null&&_0xce15f7['_WebSocket'])_0xa621a1=(_0x2c30bb=this[_0x4e74be(0x1b8)][_0x4e74be(0x1bb)])==null?void 0x0:_0x2c30bb[_0x4e74be(0x140)];else try{let _0x45e813=await import(_0x4e74be(0x1e6));_0xa621a1=(await import((await import(_0x4e74be(0x1cb)))[_0x4e74be(0x1a1)](_0x45e813[_0x4e74be(0x143)](this[_0x4e74be(0x185)],'ws/index.js'))[_0x4e74be(0x20d)]()))[_0x4e74be(0x205)];}catch{try{_0xa621a1=require(require('path')[_0x4e74be(0x143)](this[_0x4e74be(0x185)],'ws'));}catch{throw new Error(_0x4e74be(0x14d));}}}return this[_0x4e74be(0x17a)]=_0xa621a1,_0xa621a1;}[_0x47b620(0x129)](){var _0x48090d=_0x47b620;this[_0x48090d(0x18e)]||this[_0x48090d(0x1f0)]||this[_0x48090d(0x1e2)]>=this[_0x48090d(0x1f2)]||(this['_allowedToConnectOnSend']=!0x1,this[_0x48090d(0x18e)]=!0x0,this[_0x48090d(0x1e2)]++,this[_0x48090d(0x1a4)]=new Promise((_0xe8cfaf,_0x212501)=>{var _0x4d68b3=_0x48090d;this['getWebSocketClass']()[_0x4d68b3(0x14c)](_0x4beac1=>{var _0x4546cc=_0x4d68b3;let _0x4ef48a=new _0x4beac1(_0x4546cc(0x1b2)+(!this[_0x4546cc(0x1c2)]&&this['dockerizedApp']?_0x4546cc(0x1d6):this[_0x4546cc(0x1ef)])+':'+this['port']);_0x4ef48a[_0x4546cc(0x13d)]=()=>{var _0xc76acb=_0x4546cc;this['_allowedToSend']=!0x1,this['_disposeWebsocket'](_0x4ef48a),this['_attemptToReconnectShortly'](),_0x212501(new Error(_0xc76acb(0x1f5)));},_0x4ef48a['onopen']=()=>{var _0x2354e1=_0x4546cc;this[_0x2354e1(0x1c2)]||_0x4ef48a[_0x2354e1(0x180)]&&_0x4ef48a[_0x2354e1(0x180)]['unref']&&_0x4ef48a['_socket'][_0x2354e1(0x175)](),_0xe8cfaf(_0x4ef48a);},_0x4ef48a['onclose']=()=>{var _0x2fe551=_0x4546cc;this[_0x2fe551(0x188)]=!0x0,this[_0x2fe551(0x166)](_0x4ef48a),this['_attemptToReconnectShortly']();},_0x4ef48a[_0x4546cc(0x21c)]=_0x518304=>{var _0x557cd6=_0x4546cc;try{if(!(_0x518304!=null&&_0x518304[_0x557cd6(0x1dc)])||!this['eventReceivedCallback'])return;let _0x28733e=JSON[_0x557cd6(0x209)](_0x518304[_0x557cd6(0x1dc)]);this['eventReceivedCallback'](_0x28733e[_0x557cd6(0x196)],_0x28733e['args'],this[_0x557cd6(0x1b8)],this[_0x557cd6(0x1c2)]);}catch{}};})['then'](_0x39ad6e=>(this[_0x4d68b3(0x1f0)]=!0x0,this['_connecting']=!0x1,this[_0x4d68b3(0x188)]=!0x1,this['_allowedToSend']=!0x0,this[_0x4d68b3(0x1e2)]=0x0,_0x39ad6e))[_0x4d68b3(0x181)](_0x28d1ad=>(this[_0x4d68b3(0x1f0)]=!0x1,this[_0x4d68b3(0x18e)]=!0x1,console[_0x4d68b3(0x20a)](_0x4d68b3(0x183)+this[_0x4d68b3(0x13a)]),_0x212501(new Error(_0x4d68b3(0x16b)+(_0x28d1ad&&_0x28d1ad[_0x4d68b3(0x148)])))));}));}[_0x47b620(0x166)](_0x2f2dda){var _0x42814a=_0x47b620;this[_0x42814a(0x1f0)]=!0x1,this['_connecting']=!0x1;try{_0x2f2dda[_0x42814a(0x1d8)]=null,_0x2f2dda[_0x42814a(0x13d)]=null,_0x2f2dda[_0x42814a(0x20c)]=null;}catch{}try{_0x2f2dda['readyState']<0x2&&_0x2f2dda['close']();}catch{}}[_0x47b620(0x1f1)](){var _0x147416=_0x47b620;clearTimeout(this[_0x147416(0x16a)]),!(this[_0x147416(0x1e2)]>=this[_0x147416(0x1f2)])&&(this[_0x147416(0x16a)]=setTimeout(()=>{var _0x1b1cc1=_0x147416,_0x178a47;this[_0x1b1cc1(0x1f0)]||this[_0x1b1cc1(0x18e)]||(this[_0x1b1cc1(0x129)](),(_0x178a47=this[_0x1b1cc1(0x1a4)])==null||_0x178a47[_0x1b1cc1(0x181)](()=>this[_0x1b1cc1(0x1f1)]()));},0x1f4),this[_0x147416(0x16a)][_0x147416(0x175)]&&this[_0x147416(0x16a)][_0x147416(0x175)]());}async[_0x47b620(0x17f)](_0x4505d9){var _0xd5dfc1=_0x47b620;try{if(!this[_0xd5dfc1(0x134)])return;this[_0xd5dfc1(0x188)]&&this['_connectToHostNow'](),(await this[_0xd5dfc1(0x1a4)])[_0xd5dfc1(0x17f)](JSON[_0xd5dfc1(0x11f)](_0x4505d9));}catch(_0x44ed9b){this[_0xd5dfc1(0x20b)]?console[_0xd5dfc1(0x20a)](this['_sendErrorMessage']+':\\x20'+(_0x44ed9b&&_0x44ed9b['message'])):(this[_0xd5dfc1(0x20b)]=!0x0,console['warn'](this['_sendErrorMessage']+':\\x20'+(_0x44ed9b&&_0x44ed9b[_0xd5dfc1(0x148)]),_0x4505d9)),this[_0xd5dfc1(0x134)]=!0x1,this['_attemptToReconnectShortly']();}}};function _0x624e(){var _0x5c4ee8=['nan','_addProperty','props','Boolean',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"MacBook-Pro-3.local\",\"192.168.50.172\"],'eventReceivedCallback','allStrLength','POSITIVE_INFINITY','_capIfString','_disposeWebsocket','now','_keyStrRegExp','_hasMapOnItsPath','_reconnectTimeout','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','coverage','...','angular','root_exp','_treeNodePropertiesBeforeFullValue','_sortProps','autoExpandLimit','elements','disabledLog','unref','resolveGetters','autoExpandMaxDepth','totalStrLength','array','_WebSocketClass','https://tinyurl.com/37x8b79t','_p_','push','RegExp','send','_socket','catch','constructor','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','versions','nodeModules','negativeZero','function','_allowedToConnectOnSend','hrtime','autoExpandPreviousObjects','time','capped','dockerizedApp','_connecting','_additionalMetadata','toUpperCase','noFunctions','isExpressionToEvaluate','webpack','date','string','method','getOwnPropertyNames','23vwPQSj','port','call','_cleanNode','_objectToString','5105990dLNjig','startsWith','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','32793chlVsA','pathToFileURL','_hasSetOnItsPath','_type','_ws','sort','origin','log','_setNodeId','_setNodeExpandableState','WebSocket','valueOf','7674062LjbMqf','_setNodeExpressionPath','_setNodeLabel','slice','_isArray','concat','ws://','level','38187XCxGfu','disabledTrace','_p_name','3217718QsZOXV','global','rootExpression','error','process','toLowerCase','stackTraceLimit','_undefined','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','expId','match','_inBrowser','getter','','positiveInfinity','elapsed','__es'+'Module','value','Set','object','url','test','_isMap','astro','remix','Error','_treeNodePropertiesAfterFullValue','bigint','_processTreeNodeResult','location','_ninjaIgnoreNextError','gateway.docker.internal','negativeInfinity','onclose','[object\\x20Map]','length','some','data','_isPrimitiveWrapperType','type','60HGPKCM','Symbol','isArray','_connectAttemptCount','includes','symbol','_isPrimitiveType','path','name','get','_getOwnPropertySymbols','[object\\x20Date]','127.0.0.1','_setNodePermissions','substr','autoExpandPropertyCount','host','_connected','_attemptToReconnectShortly','_maxConnectAttemptCount','reload','env','logger\\x20websocket\\x20error','Map','_hasSymbolPropertyOnItsPath','String','null','getWebSocketClass','replace','reduceLimits','_isNegativeZero','undefined','index','4864512ZQlboO','_inNextEdge','expressionsToEvaluate','NEGATIVE_INFINITY','depth','default','console','_propertyName','indexOf','parse','warn','_extendedWarning','onopen','toString','pop','_quotedRegExp','1747677192339','\\x20browser','next.js','_console_ninja','\\x20server','defineProperty','_addFunctionsNode','_dateToString','timeStamp','current','forEach','HTMLAllCollection','onmessage','split','serialize','23014IeqwZt','stringify','perf_hooks','unknown','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20','_getOwnPropertyNames','sortProps','number','node','getOwnPropertyDescriptor','enumerable','_connectToHostNow','1.0.0','_setNodeQueryPath','Number','hostname','','count','endsWith','_HTMLAllCollection','Buffer','cappedProps','_allowedToSend','_consoleNinjaAllowedToStart','getOwnPropertySymbols','strLength','bind','edge','_webSocketErrorDocsLink','cappedElements','16NBCtui','onerror','[object\\x20Array]','_regExpToString','_WebSocket','_property','_console_ninja_session','join','_getOwnPropertyDescriptor','_isSet','hits',\"/Users/Mist/.vscode/extensions/wallabyjs.console-ninja-1.0.445/node_modules\",'message','parent','trace','60952','then','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','_Symbol','root_exp_id','fromCharCode','_addObjectProperty','prototype','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','NEXT_RUNTIME','_blacklistedProperty','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','1','[object\\x20Set]','autoExpand','1430QjOWYO','funcName','map'];_0x624e=function(){return _0x5c4ee8;};return _0x624e();}function H(_0x1f5413,_0x1dec7a,_0x3ee945,_0x4d979a,_0x3c5cba,_0xe19932,_0x2ed50d,_0xa3af38=oe){var _0x5087c3=_0x47b620;let _0x290dd0=_0x3ee945[_0x5087c3(0x21d)](',')[_0x5087c3(0x15c)](_0x55e655=>{var _0xccacd8=_0x5087c3,_0x3bb9d1,_0x5f4f42,_0x4cd9ff,_0x579520;try{if(!_0x1f5413[_0xccacd8(0x142)]){let _0x58c0ab=((_0x5f4f42=(_0x3bb9d1=_0x1f5413[_0xccacd8(0x1bb)])==null?void 0x0:_0x3bb9d1[_0xccacd8(0x184)])==null?void 0x0:_0x5f4f42[_0xccacd8(0x126)])||((_0x579520=(_0x4cd9ff=_0x1f5413['process'])==null?void 0x0:_0x4cd9ff['env'])==null?void 0x0:_0x579520[_0xccacd8(0x154)])==='edge';(_0x3c5cba===_0xccacd8(0x212)||_0x3c5cba===_0xccacd8(0x1cf)||_0x3c5cba===_0xccacd8(0x1ce)||_0x3c5cba===_0xccacd8(0x16e))&&(_0x3c5cba+=_0x58c0ab?_0xccacd8(0x214):_0xccacd8(0x211)),_0x1f5413[_0xccacd8(0x142)]={'id':+new Date(),'tool':_0x3c5cba},_0x2ed50d&&_0x3c5cba&&!_0x58c0ab&&console['log']('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x3c5cba['charAt'](0x0)[_0xccacd8(0x190)]()+_0x3c5cba['substr'](0x1))+',',_0xccacd8(0x156),_0xccacd8(0x1bf));}let _0x5175af=new q(_0x1f5413,_0x1dec7a,_0x55e655,_0x4d979a,_0xe19932,_0xa3af38);return _0x5175af[_0xccacd8(0x17f)][_0xccacd8(0x138)](_0x5175af);}catch(_0x134a30){return console[_0xccacd8(0x20a)](_0xccacd8(0x19f),_0x134a30&&_0x134a30[_0xccacd8(0x148)]),()=>{};}});return _0x30fc3d=>_0x290dd0[_0x5087c3(0x21a)](_0x4c3b03=>_0x4c3b03(_0x30fc3d));}function oe(_0x957a27,_0x436392,_0xf29371,_0x1319ae){var _0x25ec8e=_0x47b620;_0x1319ae&&_0x957a27===_0x25ec8e(0x1f3)&&_0xf29371['location'][_0x25ec8e(0x1f3)]();}function B(_0x529f02){var _0x511cdf=_0x47b620,_0x27b6da,_0x2493c2;let _0x9651f6=function(_0x5deb22,_0x127e25){return _0x127e25-_0x5deb22;},_0x48c442;if(_0x529f02['performance'])_0x48c442=function(){var _0x3c7ab6=_0x4d74;return _0x529f02['performance'][_0x3c7ab6(0x167)]();};else{if(_0x529f02[_0x511cdf(0x1bb)]&&_0x529f02[_0x511cdf(0x1bb)]['hrtime']&&((_0x2493c2=(_0x27b6da=_0x529f02[_0x511cdf(0x1bb)])==null?void 0x0:_0x27b6da['env'])==null?void 0x0:_0x2493c2[_0x511cdf(0x154)])!=='edge')_0x48c442=function(){var _0x8cbbdd=_0x511cdf;return _0x529f02[_0x8cbbdd(0x1bb)][_0x8cbbdd(0x189)]();},_0x9651f6=function(_0x83c819,_0x24dcc7){return 0x3e8*(_0x24dcc7[0x0]-_0x83c819[0x0])+(_0x24dcc7[0x1]-_0x83c819[0x1])/0xf4240;};else try{let {performance:_0x1a8085}=require(_0x511cdf(0x120));_0x48c442=function(){var _0x1b20b4=_0x511cdf;return _0x1a8085[_0x1b20b4(0x167)]();};}catch{_0x48c442=function(){return+new Date();};}}return{'elapsed':_0x9651f6,'timeStamp':_0x48c442,'now':()=>Date[_0x511cdf(0x167)]()};}function X(_0x28a059,_0x1c82bc,_0xf2c718){var _0xcd16ee=_0x47b620,_0x392755,_0x4abbcc,_0x1d6cee,_0x9185d5,_0x19cfb4;if(_0x28a059[_0xcd16ee(0x135)]!==void 0x0)return _0x28a059[_0xcd16ee(0x135)];let _0x5ebc9d=((_0x4abbcc=(_0x392755=_0x28a059[_0xcd16ee(0x1bb)])==null?void 0x0:_0x392755[_0xcd16ee(0x184)])==null?void 0x0:_0x4abbcc[_0xcd16ee(0x126)])||((_0x9185d5=(_0x1d6cee=_0x28a059[_0xcd16ee(0x1bb)])==null?void 0x0:_0x1d6cee['env'])==null?void 0x0:_0x9185d5[_0xcd16ee(0x154)])===_0xcd16ee(0x139);function _0x546616(_0x131027){var _0x5276f0=_0xcd16ee;if(_0x131027[_0x5276f0(0x19e)]('/')&&_0x131027[_0x5276f0(0x130)]('/')){let _0x5d97cf=new RegExp(_0x131027[_0x5276f0(0x1af)](0x1,-0x1));return _0x814501=>_0x5d97cf[_0x5276f0(0x1cc)](_0x814501);}else{if(_0x131027[_0x5276f0(0x1e3)]('*')||_0x131027['includes']('?')){let _0xf381f9=new RegExp('^'+_0x131027[_0x5276f0(0x1fb)](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x5276f0(0x1fb)](/\\*/g,'.*')[_0x5276f0(0x1fb)](/\\?/g,'.')+String[_0x5276f0(0x150)](0x24));return _0x2ec503=>_0xf381f9[_0x5276f0(0x1cc)](_0x2ec503);}else return _0x6fa262=>_0x6fa262===_0x131027;}}let _0x5e1e25=_0x1c82bc['map'](_0x546616);return _0x28a059['_consoleNinjaAllowedToStart']=_0x5ebc9d||!_0x1c82bc,!_0x28a059[_0xcd16ee(0x135)]&&((_0x19cfb4=_0x28a059['location'])==null?void 0x0:_0x19cfb4[_0xcd16ee(0x12d)])&&(_0x28a059['_consoleNinjaAllowedToStart']=_0x5e1e25[_0xcd16ee(0x1db)](_0x35ec41=>_0x35ec41(_0x28a059[_0xcd16ee(0x1d4)][_0xcd16ee(0x12d)]))),_0x28a059[_0xcd16ee(0x135)];}function J(_0x30e387,_0xfde284,_0x287b16,_0x35a73e){var _0x2a549e=_0x47b620;_0x30e387=_0x30e387,_0xfde284=_0xfde284,_0x287b16=_0x287b16,_0x35a73e=_0x35a73e;let _0x3379aa=B(_0x30e387),_0x1d0ebc=_0x3379aa[_0x2a549e(0x1c6)],_0x2fc9dc=_0x3379aa['timeStamp'];class _0x33df18{constructor(){var _0x32a75b=_0x2a549e;this[_0x32a75b(0x168)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this[_0x32a75b(0x20f)]=/'([^\\\\']|\\\\')*'/,this[_0x32a75b(0x1be)]=_0x30e387['undefined'],this[_0x32a75b(0x131)]=_0x30e387['HTMLAllCollection'],this[_0x32a75b(0x144)]=Object[_0x32a75b(0x127)],this[_0x32a75b(0x123)]=Object[_0x32a75b(0x197)],this[_0x32a75b(0x14e)]=_0x30e387[_0x32a75b(0x1e0)],this[_0x32a75b(0x13f)]=RegExp[_0x32a75b(0x152)][_0x32a75b(0x20d)],this['_dateToString']=Date[_0x32a75b(0x152)][_0x32a75b(0x20d)];}[_0x2a549e(0x21e)](_0x1d8e52,_0x5bb491,_0x284dd7,_0x25db8d){var _0x5acd30=_0x2a549e,_0x2c2b7e=this,_0x3909db=_0x284dd7['autoExpand'];function _0x5d722f(_0x589520,_0x35159e,_0x1e43ac){var _0x2e43c8=_0x4d74;_0x35159e[_0x2e43c8(0x1de)]='unknown',_0x35159e[_0x2e43c8(0x1ba)]=_0x589520[_0x2e43c8(0x148)],_0x59009f=_0x1e43ac[_0x2e43c8(0x126)][_0x2e43c8(0x219)],_0x1e43ac[_0x2e43c8(0x126)][_0x2e43c8(0x219)]=_0x35159e,_0x2c2b7e[_0x2e43c8(0x170)](_0x35159e,_0x1e43ac);}let _0x3f9c2e;_0x30e387['console']&&(_0x3f9c2e=_0x30e387[_0x5acd30(0x206)]['error'],_0x3f9c2e&&(_0x30e387[_0x5acd30(0x206)][_0x5acd30(0x1ba)]=function(){}));try{try{_0x284dd7['level']++,_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7[_0x5acd30(0x18a)]['push'](_0x5bb491);var _0x58d478,_0x5cde39,_0x1a29d2,_0x574b44,_0xdcac3e=[],_0x4b0fe1=[],_0x5569c5,_0x2d42ce=this[_0x5acd30(0x1a3)](_0x5bb491),_0x415d2a=_0x2d42ce===_0x5acd30(0x179),_0x140f9b=!0x1,_0x1a62e7=_0x2d42ce===_0x5acd30(0x187),_0x520fe1=this[_0x5acd30(0x1e5)](_0x2d42ce),_0x14d427=this[_0x5acd30(0x1dd)](_0x2d42ce),_0x5f246b=_0x520fe1||_0x14d427,_0x206964={},_0x1da88d=0x0,_0x3602b9=!0x1,_0x59009f,_0x11e013=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x284dd7['depth']){if(_0x415d2a){if(_0x5cde39=_0x5bb491[_0x5acd30(0x1da)],_0x5cde39>_0x284dd7[_0x5acd30(0x173)]){for(_0x1a29d2=0x0,_0x574b44=_0x284dd7[_0x5acd30(0x173)],_0x58d478=_0x1a29d2;_0x58d478<_0x574b44;_0x58d478++)_0x4b0fe1['push'](_0x2c2b7e[_0x5acd30(0x15e)](_0xdcac3e,_0x5bb491,_0x2d42ce,_0x58d478,_0x284dd7));_0x1d8e52[_0x5acd30(0x13b)]=!0x0;}else{for(_0x1a29d2=0x0,_0x574b44=_0x5cde39,_0x58d478=_0x1a29d2;_0x58d478<_0x574b44;_0x58d478++)_0x4b0fe1[_0x5acd30(0x17d)](_0x2c2b7e['_addProperty'](_0xdcac3e,_0x5bb491,_0x2d42ce,_0x58d478,_0x284dd7));}_0x284dd7[_0x5acd30(0x1ee)]+=_0x4b0fe1[_0x5acd30(0x1da)];}if(!(_0x2d42ce===_0x5acd30(0x1f9)||_0x2d42ce===_0x5acd30(0x1fe))&&!_0x520fe1&&_0x2d42ce!=='String'&&_0x2d42ce!==_0x5acd30(0x132)&&_0x2d42ce!==_0x5acd30(0x1d2)){var _0x46da57=_0x25db8d['props']||_0x284dd7['props'];if(this[_0x5acd30(0x145)](_0x5bb491)?(_0x58d478=0x0,_0x5bb491['forEach'](function(_0x53e164){var _0x999a74=_0x5acd30;if(_0x1da88d++,_0x284dd7[_0x999a74(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;return;}if(!_0x284dd7['isExpressionToEvaluate']&&_0x284dd7['autoExpand']&&_0x284dd7[_0x999a74(0x1ee)]>_0x284dd7[_0x999a74(0x172)]){_0x3602b9=!0x0;return;}_0x4b0fe1[_0x999a74(0x17d)](_0x2c2b7e[_0x999a74(0x15e)](_0xdcac3e,_0x5bb491,_0x999a74(0x1c9),_0x58d478++,_0x284dd7,function(_0x5e3244){return function(){return _0x5e3244;};}(_0x53e164)));})):this[_0x5acd30(0x1cd)](_0x5bb491)&&_0x5bb491['forEach'](function(_0x1f0998,_0x436283){var _0x5c915f=_0x5acd30;if(_0x1da88d++,_0x284dd7[_0x5c915f(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;return;}if(!_0x284dd7['isExpressionToEvaluate']&&_0x284dd7[_0x5c915f(0x159)]&&_0x284dd7[_0x5c915f(0x1ee)]>_0x284dd7[_0x5c915f(0x172)]){_0x3602b9=!0x0;return;}var _0x5b5f96=_0x436283[_0x5c915f(0x20d)]();_0x5b5f96[_0x5c915f(0x1da)]>0x64&&(_0x5b5f96=_0x5b5f96[_0x5c915f(0x1af)](0x0,0x64)+_0x5c915f(0x16d)),_0x4b0fe1[_0x5c915f(0x17d)](_0x2c2b7e['_addProperty'](_0xdcac3e,_0x5bb491,'Map',_0x5b5f96,_0x284dd7,function(_0x467161){return function(){return _0x467161;};}(_0x1f0998)));}),!_0x140f9b){try{for(_0x5569c5 in _0x5bb491)if(!(_0x415d2a&&_0x11e013[_0x5acd30(0x1cc)](_0x5569c5))&&!this[_0x5acd30(0x155)](_0x5bb491,_0x5569c5,_0x284dd7)){if(_0x1da88d++,_0x284dd7[_0x5acd30(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;break;}if(!_0x284dd7['isExpressionToEvaluate']&&_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7[_0x5acd30(0x1ee)]>_0x284dd7[_0x5acd30(0x172)]){_0x3602b9=!0x0;break;}_0x4b0fe1[_0x5acd30(0x17d)](_0x2c2b7e[_0x5acd30(0x151)](_0xdcac3e,_0x206964,_0x5bb491,_0x2d42ce,_0x5569c5,_0x284dd7));}}catch{}if(_0x206964['_p_length']=!0x0,_0x1a62e7&&(_0x206964[_0x5acd30(0x1b6)]=!0x0),!_0x3602b9){var _0x494946=[][_0x5acd30(0x1b1)](this[_0x5acd30(0x123)](_0x5bb491))[_0x5acd30(0x1b1)](this[_0x5acd30(0x1e9)](_0x5bb491));for(_0x58d478=0x0,_0x5cde39=_0x494946[_0x5acd30(0x1da)];_0x58d478<_0x5cde39;_0x58d478++)if(_0x5569c5=_0x494946[_0x58d478],!(_0x415d2a&&_0x11e013[_0x5acd30(0x1cc)](_0x5569c5[_0x5acd30(0x20d)]()))&&!this[_0x5acd30(0x155)](_0x5bb491,_0x5569c5,_0x284dd7)&&!_0x206964[_0x5acd30(0x17c)+_0x5569c5[_0x5acd30(0x20d)]()]){if(_0x1da88d++,_0x284dd7[_0x5acd30(0x1ee)]++,_0x1da88d>_0x46da57){_0x3602b9=!0x0;break;}if(!_0x284dd7[_0x5acd30(0x192)]&&_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7['autoExpandPropertyCount']>_0x284dd7[_0x5acd30(0x172)]){_0x3602b9=!0x0;break;}_0x4b0fe1[_0x5acd30(0x17d)](_0x2c2b7e[_0x5acd30(0x151)](_0xdcac3e,_0x206964,_0x5bb491,_0x2d42ce,_0x5569c5,_0x284dd7));}}}}}if(_0x1d8e52[_0x5acd30(0x1de)]=_0x2d42ce,_0x5f246b?(_0x1d8e52[_0x5acd30(0x1c8)]=_0x5bb491[_0x5acd30(0x1ab)](),this[_0x5acd30(0x165)](_0x2d42ce,_0x1d8e52,_0x284dd7,_0x25db8d)):_0x2d42ce===_0x5acd30(0x194)?_0x1d8e52[_0x5acd30(0x1c8)]=this[_0x5acd30(0x217)]['call'](_0x5bb491):_0x2d42ce===_0x5acd30(0x1d2)?_0x1d8e52[_0x5acd30(0x1c8)]=_0x5bb491['toString']():_0x2d42ce===_0x5acd30(0x17e)?_0x1d8e52[_0x5acd30(0x1c8)]=this[_0x5acd30(0x13f)][_0x5acd30(0x19a)](_0x5bb491):_0x2d42ce==='symbol'&&this['_Symbol']?_0x1d8e52[_0x5acd30(0x1c8)]=this[_0x5acd30(0x14e)]['prototype'][_0x5acd30(0x20d)][_0x5acd30(0x19a)](_0x5bb491):!_0x284dd7[_0x5acd30(0x204)]&&!(_0x2d42ce===_0x5acd30(0x1f9)||_0x2d42ce===_0x5acd30(0x1fe))&&(delete _0x1d8e52[_0x5acd30(0x1c8)],_0x1d8e52[_0x5acd30(0x18c)]=!0x0),_0x3602b9&&(_0x1d8e52[_0x5acd30(0x133)]=!0x0),_0x59009f=_0x284dd7[_0x5acd30(0x126)][_0x5acd30(0x219)],_0x284dd7[_0x5acd30(0x126)]['current']=_0x1d8e52,this['_treeNodePropertiesBeforeFullValue'](_0x1d8e52,_0x284dd7),_0x4b0fe1[_0x5acd30(0x1da)]){for(_0x58d478=0x0,_0x5cde39=_0x4b0fe1[_0x5acd30(0x1da)];_0x58d478<_0x5cde39;_0x58d478++)_0x4b0fe1[_0x58d478](_0x58d478);}_0xdcac3e[_0x5acd30(0x1da)]&&(_0x1d8e52['props']=_0xdcac3e);}catch(_0x45047e){_0x5d722f(_0x45047e,_0x1d8e52,_0x284dd7);}this[_0x5acd30(0x18f)](_0x5bb491,_0x1d8e52),this[_0x5acd30(0x1d1)](_0x1d8e52,_0x284dd7),_0x284dd7['node']['current']=_0x59009f,_0x284dd7[_0x5acd30(0x1b3)]--,_0x284dd7[_0x5acd30(0x159)]=_0x3909db,_0x284dd7[_0x5acd30(0x159)]&&_0x284dd7[_0x5acd30(0x18a)][_0x5acd30(0x20e)]();}finally{_0x3f9c2e&&(_0x30e387['console'][_0x5acd30(0x1ba)]=_0x3f9c2e);}return _0x1d8e52;}['_getOwnPropertySymbols'](_0x1bb50d){var _0x51ec0d=_0x2a549e;return Object[_0x51ec0d(0x136)]?Object[_0x51ec0d(0x136)](_0x1bb50d):[];}[_0x2a549e(0x145)](_0x456c8f){var _0x6cf61=_0x2a549e;return!!(_0x456c8f&&_0x30e387[_0x6cf61(0x1c9)]&&this[_0x6cf61(0x19c)](_0x456c8f)===_0x6cf61(0x158)&&_0x456c8f[_0x6cf61(0x21a)]);}[_0x2a549e(0x155)](_0x558333,_0x35215b,_0x592f2b){var _0x12579b=_0x2a549e;return _0x592f2b[_0x12579b(0x191)]?typeof _0x558333[_0x35215b]==_0x12579b(0x187):!0x1;}['_type'](_0x2808e2){var _0x5af0b9=_0x2a549e,_0x3680d3='';return _0x3680d3=typeof _0x2808e2,_0x3680d3==='object'?this[_0x5af0b9(0x19c)](_0x2808e2)===_0x5af0b9(0x13e)?_0x3680d3=_0x5af0b9(0x179):this['_objectToString'](_0x2808e2)===_0x5af0b9(0x1ea)?_0x3680d3=_0x5af0b9(0x194):this[_0x5af0b9(0x19c)](_0x2808e2)==='[object\\x20BigInt]'?_0x3680d3=_0x5af0b9(0x1d2):_0x2808e2===null?_0x3680d3=_0x5af0b9(0x1f9):_0x2808e2[_0x5af0b9(0x182)]&&(_0x3680d3=_0x2808e2[_0x5af0b9(0x182)][_0x5af0b9(0x1e7)]||_0x3680d3):_0x3680d3==='undefined'&&this[_0x5af0b9(0x131)]&&_0x2808e2 instanceof this[_0x5af0b9(0x131)]&&(_0x3680d3=_0x5af0b9(0x21b)),_0x3680d3;}[_0x2a549e(0x19c)](_0x1dfbbb){var _0x4ff67b=_0x2a549e;return Object[_0x4ff67b(0x152)][_0x4ff67b(0x20d)][_0x4ff67b(0x19a)](_0x1dfbbb);}[_0x2a549e(0x1e5)](_0x1dd8a0){var _0x4ea9fe=_0x2a549e;return _0x1dd8a0==='boolean'||_0x1dd8a0===_0x4ea9fe(0x195)||_0x1dd8a0===_0x4ea9fe(0x125);}[_0x2a549e(0x1dd)](_0x3e5fdd){var _0x5a90b8=_0x2a549e;return _0x3e5fdd===_0x5a90b8(0x160)||_0x3e5fdd===_0x5a90b8(0x1f8)||_0x3e5fdd===_0x5a90b8(0x12c);}[_0x2a549e(0x15e)](_0x52e19e,_0xcbd8a8,_0x2cb039,_0x550aae,_0x94ef1f,_0x17c656){var _0x5e64a2=this;return function(_0x399986){var _0xfa37bb=_0x4d74,_0x22dac8=_0x94ef1f[_0xfa37bb(0x126)]['current'],_0x3761e3=_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x1ff)],_0x394a00=_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x149)];_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x149)]=_0x22dac8,_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x1ff)]=typeof _0x550aae==_0xfa37bb(0x125)?_0x550aae:_0x399986,_0x52e19e['push'](_0x5e64a2[_0xfa37bb(0x141)](_0xcbd8a8,_0x2cb039,_0x550aae,_0x94ef1f,_0x17c656)),_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x149)]=_0x394a00,_0x94ef1f[_0xfa37bb(0x126)][_0xfa37bb(0x1ff)]=_0x3761e3;};}[_0x2a549e(0x151)](_0x2d1341,_0x43bcca,_0x26403b,_0x4d40d8,_0x3f6775,_0x5f4ada,_0x701551){var _0x44505d=this;return _0x43bcca['_p_'+_0x3f6775['toString']()]=!0x0,function(_0x10eb25){var _0x14680e=_0x4d74,_0x115359=_0x5f4ada['node'][_0x14680e(0x219)],_0x355108=_0x5f4ada['node'][_0x14680e(0x1ff)],_0x51410f=_0x5f4ada[_0x14680e(0x126)][_0x14680e(0x149)];_0x5f4ada[_0x14680e(0x126)]['parent']=_0x115359,_0x5f4ada[_0x14680e(0x126)][_0x14680e(0x1ff)]=_0x10eb25,_0x2d1341['push'](_0x44505d[_0x14680e(0x141)](_0x26403b,_0x4d40d8,_0x3f6775,_0x5f4ada,_0x701551)),_0x5f4ada[_0x14680e(0x126)]['parent']=_0x51410f,_0x5f4ada['node']['index']=_0x355108;};}[_0x2a549e(0x141)](_0x512116,_0x372090,_0x3971d6,_0x2ca89c,_0x431fdd){var _0x3d8991=_0x2a549e,_0x3ffba6=this;_0x431fdd||(_0x431fdd=function(_0xe4f2af,_0x436596){return _0xe4f2af[_0x436596];});var _0x46c622=_0x3971d6[_0x3d8991(0x20d)](),_0x229fde=_0x2ca89c['expressionsToEvaluate']||{},_0x46528d=_0x2ca89c[_0x3d8991(0x204)],_0x324395=_0x2ca89c[_0x3d8991(0x192)];try{var _0xf91b54=this[_0x3d8991(0x1cd)](_0x512116),_0x43b9b6=_0x46c622;_0xf91b54&&_0x43b9b6[0x0]==='\\x27'&&(_0x43b9b6=_0x43b9b6[_0x3d8991(0x1ed)](0x1,_0x43b9b6[_0x3d8991(0x1da)]-0x2));var _0x5d57b1=_0x2ca89c[_0x3d8991(0x202)]=_0x229fde[_0x3d8991(0x17c)+_0x43b9b6];_0x5d57b1&&(_0x2ca89c[_0x3d8991(0x204)]=_0x2ca89c[_0x3d8991(0x204)]+0x1),_0x2ca89c[_0x3d8991(0x192)]=!!_0x5d57b1;var _0x2c8bdc=typeof _0x3971d6==_0x3d8991(0x1e4),_0x4b8a49={'name':_0x2c8bdc||_0xf91b54?_0x46c622:this[_0x3d8991(0x207)](_0x46c622)};if(_0x2c8bdc&&(_0x4b8a49[_0x3d8991(0x1e4)]=!0x0),!(_0x372090===_0x3d8991(0x179)||_0x372090===_0x3d8991(0x1d0))){var _0x37bf88=this['_getOwnPropertyDescriptor'](_0x512116,_0x3971d6);if(_0x37bf88&&(_0x37bf88['set']&&(_0x4b8a49['setter']=!0x0),_0x37bf88[_0x3d8991(0x1e8)]&&!_0x5d57b1&&!_0x2ca89c[_0x3d8991(0x176)]))return _0x4b8a49[_0x3d8991(0x1c3)]=!0x0,this[_0x3d8991(0x1d3)](_0x4b8a49,_0x2ca89c),_0x4b8a49;}var _0x394a3d;try{_0x394a3d=_0x431fdd(_0x512116,_0x3971d6);}catch(_0x1b0191){return _0x4b8a49={'name':_0x46c622,'type':'unknown','error':_0x1b0191[_0x3d8991(0x148)]},this[_0x3d8991(0x1d3)](_0x4b8a49,_0x2ca89c),_0x4b8a49;}var _0x40c867=this[_0x3d8991(0x1a3)](_0x394a3d),_0x44056c=this[_0x3d8991(0x1e5)](_0x40c867);if(_0x4b8a49[_0x3d8991(0x1de)]=_0x40c867,_0x44056c)this[_0x3d8991(0x1d3)](_0x4b8a49,_0x2ca89c,_0x394a3d,function(){var _0x509543=_0x3d8991;_0x4b8a49[_0x509543(0x1c8)]=_0x394a3d[_0x509543(0x1ab)](),!_0x5d57b1&&_0x3ffba6['_capIfString'](_0x40c867,_0x4b8a49,_0x2ca89c,{});});else{var _0xdda68e=_0x2ca89c['autoExpand']&&_0x2ca89c[_0x3d8991(0x1b3)]<_0x2ca89c['autoExpandMaxDepth']&&_0x2ca89c[_0x3d8991(0x18a)][_0x3d8991(0x208)](_0x394a3d)<0x0&&_0x40c867!=='function'&&_0x2ca89c[_0x3d8991(0x1ee)]<_0x2ca89c[_0x3d8991(0x172)];_0xdda68e||_0x2ca89c[_0x3d8991(0x1b3)]<_0x46528d||_0x5d57b1?(this[_0x3d8991(0x21e)](_0x4b8a49,_0x394a3d,_0x2ca89c,_0x5d57b1||{}),this[_0x3d8991(0x18f)](_0x394a3d,_0x4b8a49)):this['_processTreeNodeResult'](_0x4b8a49,_0x2ca89c,_0x394a3d,function(){var _0x4febf3=_0x3d8991;_0x40c867===_0x4febf3(0x1f9)||_0x40c867===_0x4febf3(0x1fe)||(delete _0x4b8a49[_0x4febf3(0x1c8)],_0x4b8a49[_0x4febf3(0x18c)]=!0x0);});}return _0x4b8a49;}finally{_0x2ca89c[_0x3d8991(0x202)]=_0x229fde,_0x2ca89c[_0x3d8991(0x204)]=_0x46528d,_0x2ca89c[_0x3d8991(0x192)]=_0x324395;}}[_0x2a549e(0x165)](_0x4def61,_0xe0a235,_0x5d79f8,_0x479a78){var _0x2d1480=_0x2a549e,_0x3ff3c0=_0x479a78['strLength']||_0x5d79f8[_0x2d1480(0x137)];if((_0x4def61===_0x2d1480(0x195)||_0x4def61===_0x2d1480(0x1f8))&&_0xe0a235[_0x2d1480(0x1c8)]){let _0x5042af=_0xe0a235[_0x2d1480(0x1c8)][_0x2d1480(0x1da)];_0x5d79f8['allStrLength']+=_0x5042af,_0x5d79f8[_0x2d1480(0x163)]>_0x5d79f8[_0x2d1480(0x178)]?(_0xe0a235[_0x2d1480(0x18c)]='',delete _0xe0a235['value']):_0x5042af>_0x3ff3c0&&(_0xe0a235[_0x2d1480(0x18c)]=_0xe0a235['value'][_0x2d1480(0x1ed)](0x0,_0x3ff3c0),delete _0xe0a235[_0x2d1480(0x1c8)]);}}[_0x2a549e(0x1cd)](_0x50755c){var _0x398c50=_0x2a549e;return!!(_0x50755c&&_0x30e387[_0x398c50(0x1f6)]&&this[_0x398c50(0x19c)](_0x50755c)===_0x398c50(0x1d9)&&_0x50755c['forEach']);}[_0x2a549e(0x207)](_0x1f2f51){var _0x21f8f7=_0x2a549e;if(_0x1f2f51[_0x21f8f7(0x1c1)](/^\\d+$/))return _0x1f2f51;var _0x9f8785;try{_0x9f8785=JSON[_0x21f8f7(0x11f)](''+_0x1f2f51);}catch{_0x9f8785='\\x22'+this[_0x21f8f7(0x19c)](_0x1f2f51)+'\\x22';}return _0x9f8785[_0x21f8f7(0x1c1)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x9f8785=_0x9f8785[_0x21f8f7(0x1ed)](0x1,_0x9f8785['length']-0x2):_0x9f8785=_0x9f8785[_0x21f8f7(0x1fb)](/'/g,'\\x5c\\x27')[_0x21f8f7(0x1fb)](/\\\\\"/g,'\\x22')['replace'](/(^\"|\"$)/g,'\\x27'),_0x9f8785;}[_0x2a549e(0x1d3)](_0x554110,_0x582f2f,_0x528d3e,_0x3a440f){var _0x37c34a=_0x2a549e;this[_0x37c34a(0x170)](_0x554110,_0x582f2f),_0x3a440f&&_0x3a440f(),this['_additionalMetadata'](_0x528d3e,_0x554110),this['_treeNodePropertiesAfterFullValue'](_0x554110,_0x582f2f);}['_treeNodePropertiesBeforeFullValue'](_0x1dc0f1,_0x4f7ab1){var _0x2afd47=_0x2a549e;this['_setNodeId'](_0x1dc0f1,_0x4f7ab1),this[_0x2afd47(0x12b)](_0x1dc0f1,_0x4f7ab1),this['_setNodeExpressionPath'](_0x1dc0f1,_0x4f7ab1),this[_0x2afd47(0x1ec)](_0x1dc0f1,_0x4f7ab1);}[_0x2a549e(0x1a8)](_0x1f1982,_0x4dbfc7){}[_0x2a549e(0x12b)](_0x3ba8d7,_0x43c238){}[_0x2a549e(0x1ae)](_0xaf686,_0x339ad3){}['_isUndefined'](_0x43f6d4){return _0x43f6d4===this['_undefined'];}[_0x2a549e(0x1d1)](_0x2f3058,_0x3c16c0){var _0xe52623=_0x2a549e;this[_0xe52623(0x1ae)](_0x2f3058,_0x3c16c0),this['_setNodeExpandableState'](_0x2f3058),_0x3c16c0[_0xe52623(0x124)]&&this[_0xe52623(0x171)](_0x2f3058),this[_0xe52623(0x216)](_0x2f3058,_0x3c16c0),this['_addLoadNode'](_0x2f3058,_0x3c16c0),this[_0xe52623(0x19b)](_0x2f3058);}['_additionalMetadata'](_0x12bd57,_0x3e3a76){var _0x35800b=_0x2a549e;try{_0x12bd57&&typeof _0x12bd57['length']=='number'&&(_0x3e3a76[_0x35800b(0x1da)]=_0x12bd57['length']);}catch{}if(_0x3e3a76['type']===_0x35800b(0x125)||_0x3e3a76['type']==='Number'){if(isNaN(_0x3e3a76[_0x35800b(0x1c8)]))_0x3e3a76[_0x35800b(0x15d)]=!0x0,delete _0x3e3a76[_0x35800b(0x1c8)];else switch(_0x3e3a76[_0x35800b(0x1c8)]){case Number[_0x35800b(0x164)]:_0x3e3a76[_0x35800b(0x1c5)]=!0x0,delete _0x3e3a76[_0x35800b(0x1c8)];break;case Number[_0x35800b(0x203)]:_0x3e3a76[_0x35800b(0x1d7)]=!0x0,delete _0x3e3a76[_0x35800b(0x1c8)];break;case 0x0:this['_isNegativeZero'](_0x3e3a76[_0x35800b(0x1c8)])&&(_0x3e3a76[_0x35800b(0x186)]=!0x0);break;}}else _0x3e3a76[_0x35800b(0x1de)]==='function'&&typeof _0x12bd57[_0x35800b(0x1e7)]==_0x35800b(0x195)&&_0x12bd57[_0x35800b(0x1e7)]&&_0x3e3a76[_0x35800b(0x1e7)]&&_0x12bd57[_0x35800b(0x1e7)]!==_0x3e3a76[_0x35800b(0x1e7)]&&(_0x3e3a76[_0x35800b(0x15b)]=_0x12bd57[_0x35800b(0x1e7)]);}[_0x2a549e(0x1fd)](_0x2105d9){var _0x20e3e2=_0x2a549e;return 0x1/_0x2105d9===Number[_0x20e3e2(0x203)];}['_sortProps'](_0x2eb104){var _0x57278d=_0x2a549e;!_0x2eb104[_0x57278d(0x15f)]||!_0x2eb104[_0x57278d(0x15f)][_0x57278d(0x1da)]||_0x2eb104[_0x57278d(0x1de)]===_0x57278d(0x179)||_0x2eb104[_0x57278d(0x1de)]===_0x57278d(0x1f6)||_0x2eb104['type']===_0x57278d(0x1c9)||_0x2eb104[_0x57278d(0x15f)][_0x57278d(0x1a5)](function(_0x2d5226,_0x5bff15){var _0xd61655=_0x57278d,_0x10b3b7=_0x2d5226['name'][_0xd61655(0x1bc)](),_0x2ec8af=_0x5bff15[_0xd61655(0x1e7)][_0xd61655(0x1bc)]();return _0x10b3b7<_0x2ec8af?-0x1:_0x10b3b7>_0x2ec8af?0x1:0x0;});}['_addFunctionsNode'](_0x4d19a6,_0x4d6636){var _0x38a943=_0x2a549e;if(!(_0x4d6636['noFunctions']||!_0x4d19a6[_0x38a943(0x15f)]||!_0x4d19a6['props'][_0x38a943(0x1da)])){for(var _0x59f7ff=[],_0x2571e9=[],_0x2fccdf=0x0,_0x4375c8=_0x4d19a6[_0x38a943(0x15f)][_0x38a943(0x1da)];_0x2fccdf<_0x4375c8;_0x2fccdf++){var _0x1622bf=_0x4d19a6[_0x38a943(0x15f)][_0x2fccdf];_0x1622bf[_0x38a943(0x1de)]===_0x38a943(0x187)?_0x59f7ff[_0x38a943(0x17d)](_0x1622bf):_0x2571e9[_0x38a943(0x17d)](_0x1622bf);}if(!(!_0x2571e9[_0x38a943(0x1da)]||_0x59f7ff[_0x38a943(0x1da)]<=0x1)){_0x4d19a6[_0x38a943(0x15f)]=_0x2571e9;var _0x38a7b9={'functionsNode':!0x0,'props':_0x59f7ff};this[_0x38a943(0x1a8)](_0x38a7b9,_0x4d6636),this[_0x38a943(0x1ae)](_0x38a7b9,_0x4d6636),this[_0x38a943(0x1a9)](_0x38a7b9),this[_0x38a943(0x1ec)](_0x38a7b9,_0x4d6636),_0x38a7b9['id']+='\\x20f',_0x4d19a6[_0x38a943(0x15f)]['unshift'](_0x38a7b9);}}}['_addLoadNode'](_0x5e90a8,_0x4b235e){}[_0x2a549e(0x1a9)](_0xe7e1ce){}[_0x2a549e(0x1b0)](_0x45a61f){var _0x276cc2=_0x2a549e;return Array[_0x276cc2(0x1e1)](_0x45a61f)||typeof _0x45a61f==_0x276cc2(0x1ca)&&this[_0x276cc2(0x19c)](_0x45a61f)==='[object\\x20Array]';}[_0x2a549e(0x1ec)](_0xd4313b,_0x4d2e31){}[_0x2a549e(0x19b)](_0x5dfdd9){var _0x37766f=_0x2a549e;delete _0x5dfdd9[_0x37766f(0x1f7)],delete _0x5dfdd9[_0x37766f(0x1a2)],delete _0x5dfdd9[_0x37766f(0x169)];}[_0x2a549e(0x1ad)](_0x253e69,_0x24f896){}}let _0x22ec59=new _0x33df18(),_0x3761a8={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x503c18={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x5f27f0(_0x4f1222,_0x508609,_0x4548c9,_0x3192ec,_0x3fe4dc,_0x1f6d48){var _0x52ec37=_0x2a549e;let _0x5adec3,_0x322070;try{_0x322070=_0x2fc9dc(),_0x5adec3=_0x287b16[_0x508609],!_0x5adec3||_0x322070-_0x5adec3['ts']>0x1f4&&_0x5adec3[_0x52ec37(0x12f)]&&_0x5adec3[_0x52ec37(0x18b)]/_0x5adec3[_0x52ec37(0x12f)]<0x64?(_0x287b16[_0x508609]=_0x5adec3={'count':0x0,'time':0x0,'ts':_0x322070},_0x287b16[_0x52ec37(0x146)]={}):_0x322070-_0x287b16[_0x52ec37(0x146)]['ts']>0x32&&_0x287b16[_0x52ec37(0x146)]['count']&&_0x287b16[_0x52ec37(0x146)]['time']/_0x287b16['hits']['count']<0x64&&(_0x287b16[_0x52ec37(0x146)]={});let _0x18cdd0=[],_0xdf244d=_0x5adec3['reduceLimits']||_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x1fc)]?_0x503c18:_0x3761a8,_0x1e4915=_0x37183d=>{var _0x3d157c=_0x52ec37;let _0x106bc9={};return _0x106bc9[_0x3d157c(0x15f)]=_0x37183d[_0x3d157c(0x15f)],_0x106bc9[_0x3d157c(0x173)]=_0x37183d[_0x3d157c(0x173)],_0x106bc9[_0x3d157c(0x137)]=_0x37183d[_0x3d157c(0x137)],_0x106bc9['totalStrLength']=_0x37183d[_0x3d157c(0x178)],_0x106bc9[_0x3d157c(0x172)]=_0x37183d[_0x3d157c(0x172)],_0x106bc9[_0x3d157c(0x177)]=_0x37183d[_0x3d157c(0x177)],_0x106bc9['sortProps']=!0x1,_0x106bc9[_0x3d157c(0x191)]=!_0xfde284,_0x106bc9[_0x3d157c(0x204)]=0x1,_0x106bc9['level']=0x0,_0x106bc9[_0x3d157c(0x1c0)]=_0x3d157c(0x14f),_0x106bc9[_0x3d157c(0x1b9)]=_0x3d157c(0x16f),_0x106bc9[_0x3d157c(0x159)]=!0x0,_0x106bc9['autoExpandPreviousObjects']=[],_0x106bc9[_0x3d157c(0x1ee)]=0x0,_0x106bc9[_0x3d157c(0x176)]=!0x0,_0x106bc9['allStrLength']=0x0,_0x106bc9[_0x3d157c(0x126)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x106bc9;};for(var _0x3f740e=0x0;_0x3f740e<_0x3fe4dc[_0x52ec37(0x1da)];_0x3f740e++)_0x18cdd0[_0x52ec37(0x17d)](_0x22ec59['serialize']({'timeNode':_0x4f1222===_0x52ec37(0x18b)||void 0x0},_0x3fe4dc[_0x3f740e],_0x1e4915(_0xdf244d),{}));if(_0x4f1222===_0x52ec37(0x14a)||_0x4f1222===_0x52ec37(0x1ba)){let _0x4c53e2=Error[_0x52ec37(0x1bd)];try{Error['stackTraceLimit']=0x1/0x0,_0x18cdd0['push'](_0x22ec59[_0x52ec37(0x21e)]({'stackNode':!0x0},new Error()['stack'],_0x1e4915(_0xdf244d),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x4c53e2;}}return{'method':_0x52ec37(0x1a7),'version':_0x35a73e,'args':[{'ts':_0x4548c9,'session':_0x3192ec,'args':_0x18cdd0,'id':_0x508609,'context':_0x1f6d48}]};}catch(_0x1d1e5e){return{'method':_0x52ec37(0x1a7),'version':_0x35a73e,'args':[{'ts':_0x4548c9,'session':_0x3192ec,'args':[{'type':_0x52ec37(0x121),'error':_0x1d1e5e&&_0x1d1e5e[_0x52ec37(0x148)]}],'id':_0x508609,'context':_0x1f6d48}]};}finally{try{if(_0x5adec3&&_0x322070){let _0x3afb4a=_0x2fc9dc();_0x5adec3[_0x52ec37(0x12f)]++,_0x5adec3[_0x52ec37(0x18b)]+=_0x1d0ebc(_0x322070,_0x3afb4a),_0x5adec3['ts']=_0x3afb4a,_0x287b16[_0x52ec37(0x146)]['count']++,_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x18b)]+=_0x1d0ebc(_0x322070,_0x3afb4a),_0x287b16[_0x52ec37(0x146)]['ts']=_0x3afb4a,(_0x5adec3[_0x52ec37(0x12f)]>0x32||_0x5adec3[_0x52ec37(0x18b)]>0x64)&&(_0x5adec3['reduceLimits']=!0x0),(_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x12f)]>0x3e8||_0x287b16[_0x52ec37(0x146)]['time']>0x12c)&&(_0x287b16[_0x52ec37(0x146)][_0x52ec37(0x1fc)]=!0x0);}}catch{}}}return _0x5f27f0;}function _0x4d74(_0x584e3d,_0x3bdb28){var _0x624eeb=_0x624e();return _0x4d74=function(_0x4d7493,_0x56f98f){_0x4d7493=_0x4d7493-0x11e;var _0x228814=_0x624eeb[_0x4d7493];return _0x228814;},_0x4d74(_0x584e3d,_0x3bdb28);}((_0x1473b4,_0x3519a8,_0x33af0a,_0x4d0175,_0x11d702,_0x58ce62,_0x397d53,_0x57fb78,_0x468b15,_0x2af434,_0xe6365e)=>{var _0x3f8de2=_0x47b620;if(_0x1473b4['_console_ninja'])return _0x1473b4['_console_ninja'];if(!X(_0x1473b4,_0x57fb78,_0x11d702))return _0x1473b4['_console_ninja']={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x1473b4['_console_ninja'];let _0x3e4646=B(_0x1473b4),_0x34eae8=_0x3e4646[_0x3f8de2(0x1c6)],_0x1e77c1=_0x3e4646[_0x3f8de2(0x218)],_0x2f898e=_0x3e4646[_0x3f8de2(0x167)],_0x33af60={'hits':{},'ts':{}},_0x55dd09=J(_0x1473b4,_0x468b15,_0x33af60,_0x58ce62),_0x355472=_0x27fc00=>{_0x33af60['ts'][_0x27fc00]=_0x1e77c1();},_0x1b8382=(_0x4a02a9,_0xf2a564)=>{let _0x71a495=_0x33af60['ts'][_0xf2a564];if(delete _0x33af60['ts'][_0xf2a564],_0x71a495){let _0x14cad4=_0x34eae8(_0x71a495,_0x1e77c1());_0x4a5733(_0x55dd09('time',_0x4a02a9,_0x2f898e(),_0x308f7f,[_0x14cad4],_0xf2a564));}},_0x506fa1=_0x23a668=>{var _0x38efdc=_0x3f8de2,_0x236a5d;return _0x11d702===_0x38efdc(0x212)&&_0x1473b4[_0x38efdc(0x1a6)]&&((_0x236a5d=_0x23a668==null?void 0x0:_0x23a668['args'])==null?void 0x0:_0x236a5d['length'])&&(_0x23a668['args'][0x0][_0x38efdc(0x1a6)]=_0x1473b4[_0x38efdc(0x1a6)]),_0x23a668;};_0x1473b4['_console_ninja']={'consoleLog':(_0x396103,_0x155426)=>{var _0x6a3b97=_0x3f8de2;_0x1473b4[_0x6a3b97(0x206)][_0x6a3b97(0x1a7)][_0x6a3b97(0x1e7)]!==_0x6a3b97(0x174)&&_0x4a5733(_0x55dd09(_0x6a3b97(0x1a7),_0x396103,_0x2f898e(),_0x308f7f,_0x155426));},'consoleTrace':(_0x4fd8da,_0x24f933)=>{var _0xcd9c72=_0x3f8de2,_0x260e73,_0x3e990f;_0x1473b4[_0xcd9c72(0x206)][_0xcd9c72(0x1a7)][_0xcd9c72(0x1e7)]!==_0xcd9c72(0x1b5)&&((_0x3e990f=(_0x260e73=_0x1473b4[_0xcd9c72(0x1bb)])==null?void 0x0:_0x260e73[_0xcd9c72(0x184)])!=null&&_0x3e990f[_0xcd9c72(0x126)]&&(_0x1473b4[_0xcd9c72(0x1d5)]=!0x0),_0x4a5733(_0x506fa1(_0x55dd09(_0xcd9c72(0x14a),_0x4fd8da,_0x2f898e(),_0x308f7f,_0x24f933))));},'consoleError':(_0x2e1086,_0x187b72)=>{var _0x4047ac=_0x3f8de2;_0x1473b4[_0x4047ac(0x1d5)]=!0x0,_0x4a5733(_0x506fa1(_0x55dd09(_0x4047ac(0x1ba),_0x2e1086,_0x2f898e(),_0x308f7f,_0x187b72)));},'consoleTime':_0x8baf69=>{_0x355472(_0x8baf69);},'consoleTimeEnd':(_0x583396,_0x11c0e6)=>{_0x1b8382(_0x11c0e6,_0x583396);},'autoLog':(_0x14cbea,_0x2710b1)=>{var _0xcba19a=_0x3f8de2;_0x4a5733(_0x55dd09(_0xcba19a(0x1a7),_0x2710b1,_0x2f898e(),_0x308f7f,[_0x14cbea]));},'autoLogMany':(_0xef331,_0x10b8b8)=>{var _0x599b8b=_0x3f8de2;_0x4a5733(_0x55dd09(_0x599b8b(0x1a7),_0xef331,_0x2f898e(),_0x308f7f,_0x10b8b8));},'autoTrace':(_0x313fee,_0x1ca1f6)=>{var _0x27d1ab=_0x3f8de2;_0x4a5733(_0x506fa1(_0x55dd09(_0x27d1ab(0x14a),_0x1ca1f6,_0x2f898e(),_0x308f7f,[_0x313fee])));},'autoTraceMany':(_0x2483e9,_0xfb6afd)=>{var _0x5b50fa=_0x3f8de2;_0x4a5733(_0x506fa1(_0x55dd09(_0x5b50fa(0x14a),_0x2483e9,_0x2f898e(),_0x308f7f,_0xfb6afd)));},'autoTime':(_0x5696c0,_0x5c9ef6,_0x4abb2b)=>{_0x355472(_0x4abb2b);},'autoTimeEnd':(_0x2a2693,_0x84bd07,_0x157dcc)=>{_0x1b8382(_0x84bd07,_0x157dcc);},'coverage':_0x4f777e=>{var _0x354035=_0x3f8de2;_0x4a5733({'method':_0x354035(0x16c),'version':_0x58ce62,'args':[{'id':_0x4f777e}]});}};let _0x4a5733=H(_0x1473b4,_0x3519a8,_0x33af0a,_0x4d0175,_0x11d702,_0x2af434,_0xe6365e),_0x308f7f=_0x1473b4[_0x3f8de2(0x142)];return _0x1473b4[_0x3f8de2(0x213)];})(globalThis,_0x47b620(0x1eb),_0x47b620(0x14b),_0x47b620(0x147),_0x47b620(0x193),_0x47b620(0x12a),_0x47b620(0x210),_0x47b620(0x161),_0x47b620(0x1c4),_0x47b620(0x12e),_0x47b620(0x157));");
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
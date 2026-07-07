(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-settings~credits~editor~embed~fullscreen~player"],{

/***/ "./node_modules/css-loader/index.js?!./node_modules/postcss-loader/src/index.js?!./src/lib/themes/global-styles.css":
/*!*************************************************************************************************************************!*\
  !*** ./node_modules/css-loader??ref--5-1!./node_modules/postcss-loader/src??postcss!./src/lib/themes/global-styles.css ***!
  \*************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* overridden by src/lib/themes/guiHelpers.js */\n\n/* This is for overriding some styles that don't really \"belong\" to any existing stylesheets */\n\n/* Try to use this sparingly, otherwise this will become unmaintainable again... */\n\n:root {\n    color-scheme: var(--color-scheme);\n}\n\n/* popover is used by gui and paint */\n\n/* some of these are duplicated over there too; !important makes sure these win */\n\n.Popover {\n    color-scheme: light !important;\n}\n\n.Popover-body {\n    color: var(--text-primary) !important;\n    background: var(--popover-background) !important;\n    border: 1px solid var(--ui-black-transparent) !important;\n    box-shadow: 0px 0px 8px 1px var(--shadow) !important;\n}\n\n.Popover-tipShape {\n    fill: var(--popover-background) !important;\n    stroke: var(--ui-black-transparent) !important;\n}\n\n/* ScratchAdddons editor-dark-mode compatibility */\n\n:root {\n    --editorDarkMode-primary: var(--looks-secondary);\n    --editorDarkMode-primary-transparent35: var(--looks-transparent);\n    --editorDarkMode-primary-variant: var(--looks-secondary-dark);\n    --editorDarkMode-border: var(--ui-black-transparent);\n    --editorDarkMode-accent: var(--ui-modal-background);\n    --editorDarkMode-categoryMenu-text: var(--text-primary);\n    --editorDarkMode-accent-text: var(--text-primary);\n    --editorDarkMode-page: var(--ui-primary);\n    --editorDarkMode-highlightText: var(--looks-secondary);\n}\n\n/* Workspace theme support */\n\n:root {\n    --editorTheme3-workspace-background: transparent;\n    --editorTheme3-toolbox-background: transparent;\n    --editorTheme3-toolbox-text: inherit;\n    --editorTheme3-flyout-background: transparent;\n    --editorTheme3-flyout-text: inherit;\n    --editorTheme3-scrollbar: #c1c1c1;\n    --editorTheme3-grid-color: #dedede;\n}", ""]);

// exports


/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/lib/themes/icons/dark.svg":
/*!*****************************************************************!*\
  !*** ./node_modules/raw-loader!./src/lib/themes/icons/dark.svg ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-moon-icon lucide-moon\"><path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/lib/themes/icons/light.svg":
/*!******************************************************************!*\
  !*** ./node_modules/raw-loader!./src/lib/themes/icons/light.svg ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-sun-icon lucide-sun\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2\"/><path d=\"M12 20v2\"/><path d=\"m4.93 4.93 1.41 1.41\"/><path d=\"m17.66 17.66 1.41 1.41\"/><path d=\"M2 12h2\"/><path d=\"M20 12h2\"/><path d=\"m6.34 17.66-1.41 1.41\"/><path d=\"m19.07 4.93-1.41 1.41\"/></svg>"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/lib/themes/icons/midnight.svg":
/*!*********************************************************************!*\
  !*** ./node_modules/raw-loader!./src/lib/themes/icons/midnight.svg ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-cloud-moon-icon lucide-cloud-moon\"><path d=\"M13 16a3 3 0 0 1 0 6H7a5 5 0 1 1 4.9-6z\"/><path d=\"M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36\"/></svg>"

/***/ }),

/***/ "./src/addons/hooks.js":
/*!*****************************!*\
  !*** ./src/addons/hooks.js ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const AddonHooks = {
  appStateReducer: () => {},
  appStateStore: null,
  blockly: null,
  blocklyWorkspace: null,
  blocklyCallbacks: [],
  recolorCallbacks: []
};
/* harmony default export */ __webpack_exports__["default"] = (AddonHooks);

/***/ }),

/***/ "./src/components/menu-bar/tw-align-center.svg":
/*!*****************************************************!*\
  !*** ./src/components/menu-bar/tw-align-center.svg ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBDaXJjdWxhciBiYWNrZ3JvdW5kIC0tPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjExIiBmaWxsPSIjNEVDREM0IiBzdHJva2U9IiMyNkE2OUEiIHN0cm9rZS13aWR0aD0iMSIvPgogIAogIDwhLS0gQ2VudGVyLWFsaWduZWQgdGV4dCBsaW5lcyBpbiB3aGl0ZSAtLT4KICA8cmVjdCB4PSI2IiB5PSI4IiB3aWR0aD0iMTIiIGhlaWdodD0iMS41IiByeD0iMC43NSIgZmlsbD0id2hpdGUiLz4KICA8cmVjdCB4PSI4IiB5PSIxMSIgd2lkdGg9IjgiIGhlaWdodD0iMS41IiByeD0iMC43NSIgZmlsbD0id2hpdGUiLz4KICA8cmVjdCB4PSI2IiB5PSIxNCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9IndoaXRlIi8+CiAgPHJlY3QgeD0iOCIgeT0iMTciIHdpZHRoPSI4IiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo="

/***/ }),

/***/ "./src/components/menu-bar/tw-align-left.svg":
/*!***************************************************!*\
  !*** ./src/components/menu-bar/tw-align-left.svg ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBDaXJjdWxhciBiYWNrZ3JvdW5kIC0tPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjExIiBmaWxsPSIjRkY2NjgwIiBzdHJva2U9IiNFNzRDM0MiIHN0cm9rZS13aWR0aD0iMSIvPgogIAogIDwhLS0gTGVmdC1hbGlnbmVkIHRleHQgbGluZXMgaW4gd2hpdGUgLS0+CiAgPHJlY3QgeD0iNiIgeT0iOCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9IndoaXRlIi8+CiAgPHJlY3QgeD0iNiIgeT0iMTEiIHdpZHRoPSI4IiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9IndoaXRlIi8+CiAgPHJlY3QgeD0iNiIgeT0iMTQiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxLjUiIHJ4PSIwLjc1IiBmaWxsPSJ3aGl0ZSIvPgogIDxyZWN0IHg9IjYiIHk9IjE3IiB3aWR0aD0iOCIgaGVpZ2h0PSIxLjUiIHJ4PSIwLjc1IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"

/***/ }),

/***/ "./src/components/menu-bar/tw-align-right.svg":
/*!****************************************************!*\
  !*** ./src/components/menu-bar/tw-align-right.svg ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBDaXJjdWxhciBiYWNrZ3JvdW5kIC0tPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjExIiBmaWxsPSIjRkZCODREIiBzdHJva2U9IiNGRjk4MDAiIHN0cm9rZS13aWR0aD0iMSIvPgogIAogIDwhLS0gUmlnaHQtYWxpZ25lZCB0ZXh0IGxpbmVzIGluIHdoaXRlIC0tPgogIDxyZWN0IHg9IjYiIHk9IjgiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxLjUiIHJ4PSIwLjc1IiBmaWxsPSJ3aGl0ZSIvPgogIDxyZWN0IHg9IjEwIiB5PSIxMSIgd2lkdGg9IjgiIGhlaWdodD0iMS41IiByeD0iMC43NSIgZmlsbD0id2hpdGUiLz4KICA8cmVjdCB4PSI2IiB5PSIxNCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEuNSIgcng9IjAuNzUiIGZpbGw9IndoaXRlIi8+CiAgPHJlY3QgeD0iMTAiIHk9IjE3IiB3aWR0aD0iOCIgaGVpZ2h0PSIxLjUiIHJ4PSIwLjc1IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"

/***/ }),

/***/ "./src/lib/constants/brand.js":
/*!************************************!*\
  !*** ./src/lib/constants/brand.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Legacy export format because this is used by some build-time scripts stuck in the past.
// eslint-disable-next-line import/no-commonjs
module.exports = {
  APP_NAME: 'MistWarp',
  FEEDBACK_URL: 'https://scratch.mit.edu/users/m1stium#comments',
  GITHUB_URL: 'https://github.com/MistWarp'
};

/***/ }),

/***/ "./src/lib/themes/accent/aurora.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/aurora.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.70 -0.10 0.08)',
  'motion-primary-transparent': 'oklab(0.70 -0.10 0.08 / 0.75)',
  'motion-tertiary': 'oklab(0.75 -0.08 0.06)',
  'looks-secondary': 'oklab(0.70 -0.10 0.08)',
  'looks-tertiary': 'hsla(215, 100%, 55%, 1)',
  'looks-transparent': 'oklab(0.70 -0.10 0.08 / 0.35)',
  'looks-light-transparent': 'oklab(0.70 -0.10 0.08 / 0.15)',
  'looks-secondary-dark': 'oklab(0.60 -0.12 0.10)',
  'extensions-primary': 'oklab(0.75 -0.08 0.06)',
  'extensions-tertiary': 'oklab(0.65 -0.06 -0.08)',
  'extensions-transparent': 'oklab(0.75 -0.08 0.06 / 0.35)',
  'extensions-light': 'oklab(0.80 -0.04 0.04)',
  'drop-highlight': 'oklab(0.70 -0.10 0.08)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.65 -0.12 0.10 / 0.8) 0%, ' +
  // emerald green
  'oklab(0.70 -0.10 0.05 / 0.8) 20%, ' +
  // green-teal
  'oklab(0.65 -0.08 -0.05 / 0.8) 40%, ' +
  // teal-blue
  'oklab(0.60 -0.06 -0.10 / 0.8) 60%, ' +
  // blue
  'oklab(0.55 0.02 -0.12 / 0.8) 80%, ' +
  // purple-blue
  'oklab(0.60 0.08 -0.08 / 0.8) 100%)' // purple
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.70 -0.10 0.08)',
  checkboxActiveBorder: 'oklab(0.75 -0.08 0.06)'
};


/***/ }),

/***/ "./src/lib/themes/accent/blue.js":
/*!***************************************!*\
  !*** ./src/lib/themes/accent/blue.js ***!
  \***************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'looks-secondary': 'hsla(215, 100%, 65%, 1)',
  'looks-tertiary': 'hsla(215, 100%, 55%, 1)',
  'looks-transparent': 'hsla(215, 100%, 65%, 0.35)',
  'looks-light-transparent': 'hsla(215, 100%, 65%, 0.15)',
  'looks-secondary-dark': 'hsla(215, 60%, 50%, 1)'
};
const blockColors = {};


/***/ }),

/***/ "./src/lib/themes/accent/cherry.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/cherry.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.70 0.18 0.08)',
  'motion-primary-transparent': 'oklab(0.70 0.18 0.08 / 0.75)',
  'motion-tertiary': 'oklab(0.72 0.16 0.10)',
  'looks-secondary': 'oklab(0.70 0.18 0.08)',
  'looks-transparent': 'oklab(0.70 0.18 0.08 / 0.35)',
  'looks-light-transparent': 'oklab(0.70 0.18 0.08 / 0.15)',
  'looks-secondary-dark': 'oklab(0.60 0.20 0.06)',
  'extensions-primary': 'oklab(0.72 0.16 0.10)',
  'extensions-tertiary': 'oklab(0.68 0.14 0.04)',
  'extensions-transparent': 'oklab(0.72 0.16 0.10 / 0.35)',
  'extensions-light': 'oklab(0.78 0.12 0.12)',
  'drop-highlight': 'oklab(0.70 0.18 0.08)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.65 0.20 0.06 / 0.8) 0%, ' +
  // deep cherry
  'oklab(0.70 0.18 0.08 / 0.8) 20%, ' +
  // cherry red
  'oklab(0.72 0.16 0.12 / 0.8) 40%, ' +
  // warm cherry
  'oklab(0.75 0.14 0.14 / 0.8) 60%, ' +
  // cherry pink
  'oklab(0.78 0.12 0.08 / 0.8) 80%, ' +
  // soft pink
  'oklab(0.80 0.08 0.04 / 0.8) 100%)' // pale rose
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.70 0.18 0.08)',
  checkboxActiveBorder: 'oklab(0.72 0.16 0.10)'
};


/***/ }),

/***/ "./src/lib/themes/accent/coral.js":
/*!****************************************!*\
  !*** ./src/lib/themes/accent/coral.js ***!
  \****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.72 0.14 0.10)',
  'motion-primary-transparent': 'oklab(0.72 0.14 0.10 / 0.75)',
  'motion-tertiary': 'oklab(0.75 0.12 0.08)',
  'looks-secondary': 'oklab(0.72 0.14 0.10)',
  'looks-transparent': 'oklab(0.72 0.14 0.10 / 0.35)',
  'looks-light-transparent': 'oklab(0.72 0.14 0.10 / 0.15)',
  'looks-secondary-dark': 'oklab(0.62 0.16 0.12)',
  'extensions-primary': 'oklab(0.75 0.12 0.08)',
  'extensions-tertiary': 'oklab(0.78 0.10 0.06)',
  'extensions-transparent': 'oklab(0.75 0.12 0.08 / 0.35)',
  'extensions-light': 'oklab(0.82 0.08 0.04)',
  'drop-highlight': 'oklab(0.72 0.14 0.10)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.68 0.16 0.12 / 0.8) 0%, ' +
  // deep coral
  'oklab(0.72 0.14 0.10 / 0.8) 20%, ' +
  // coral
  'oklab(0.75 0.12 0.08 / 0.8) 40%, ' +
  // light coral
  'oklab(0.78 0.10 0.06 / 0.8) 60%, ' +
  // pale coral
  'oklab(0.80 0.08 0.08 / 0.8) 80%, ' +
  // peach
  'oklab(0.85 0.06 0.04 / 0.8) 100%)' // soft peach
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.72 0.14 0.10)',
  checkboxActiveBorder: 'oklab(0.75 0.12 0.08)'
};


/***/ }),

/***/ "./src/lib/themes/accent/cosmic.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/cosmic.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.68 0.15 -0.08)',
  'motion-primary-transparent': 'oklab(0.68 0.15 -0.08 / 0.75)',
  'motion-tertiary': 'oklab(0.72 0.12 -0.06)',
  'looks-secondary': 'oklab(0.68 0.15 -0.08)',
  'looks-transparent': 'oklab(0.68 0.15 -0.08 / 0.35)',
  'looks-light-transparent': 'oklab(0.68 0.15 -0.08 / 0.15)',
  'looks-secondary-dark': 'oklab(0.58 0.18 -0.10)',
  'extensions-primary': 'oklab(0.72 0.12 -0.06)',
  'extensions-tertiary': 'oklab(0.65 0.08 -0.12)',
  'extensions-transparent': 'oklab(0.72 0.12 -0.06 / 0.35)',
  'extensions-light': 'oklab(0.78 0.08 -0.04)',
  'drop-highlight': 'oklab(0.68 0.15 -0.08)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.45 0.08 -0.15 / 0.8) 0%, ' +
  // deep purple
  'oklab(0.55 0.12 -0.12 / 0.8) 20%, ' +
  // purple
  'oklab(0.65 0.15 -0.08 / 0.8) 40%, ' +
  // magenta
  'oklab(0.70 0.12 -0.04 / 0.8) 60%, ' +
  // pink
  'oklab(0.65 0.05 -0.10 / 0.8) 80%, ' +
  // blue-purple
  'oklab(0.60 -0.02 -0.12 / 0.8) 100%)' // cosmic blue
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.68 0.15 -0.08)',
  checkboxActiveBorder: 'oklab(0.72 0.12 -0.06)'
};


/***/ }),

/***/ "./src/lib/themes/accent/fire.js":
/*!***************************************!*\
  !*** ./src/lib/themes/accent/fire.js ***!
  \***************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.68 0.18 0.12)',
  'motion-primary-transparent': 'oklab(0.68 0.18 0.12 / 0.75)',
  'motion-tertiary': 'oklab(0.72 0.15 0.10)',
  'looks-secondary': 'oklab(0.68 0.18 0.12)',
  'looks-transparent': 'oklab(0.68 0.18 0.12 / 0.35)',
  'looks-light-transparent': 'oklab(0.68 0.18 0.12 / 0.15)',
  'looks-secondary-dark': 'oklab(0.58 0.20 0.14)',
  'extensions-primary': 'oklab(0.72 0.15 0.10)',
  'extensions-tertiary': 'oklab(0.76 0.12 0.08)',
  'extensions-transparent': 'oklab(0.72 0.15 0.10 / 0.35)',
  'extensions-light': 'oklab(0.80 0.10 0.06)',
  'drop-highlight': 'oklab(0.68 0.18 0.12)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.55 0.20 0.16 / 0.8) 0%, ' +
  // deep red
  'oklab(0.65 0.18 0.14 / 0.8) 25%, ' +
  // red-orange
  'oklab(0.72 0.15 0.12 / 0.8) 50%, ' +
  // orange
  'oklab(0.78 0.12 0.10 / 0.8) 75%, ' +
  // yellow-orange
  'oklab(0.85 0.08 0.08 / 0.8) 100%)' // bright yellow
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.68 0.18 0.12)',
  checkboxActiveBorder: 'oklab(0.72 0.15 0.10)'
};


/***/ }),

/***/ "./src/lib/themes/accent/forest.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/forest.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.65 -0.12 0.12)',
  'motion-primary-transparent': 'oklab(0.65 -0.12 0.12 / 0.75)',
  'motion-tertiary': 'oklab(0.68 -0.10 0.14)',
  'looks-secondary': 'oklab(0.65 -0.12 0.12)',
  'looks-transparent': 'oklab(0.65 -0.12 0.12 / 0.35)',
  'looks-light-transparent': 'oklab(0.65 -0.12 0.12 / 0.15)',
  'looks-secondary-dark': 'oklab(0.55 -0.14 0.10)',
  'extensions-primary': 'oklab(0.68 -0.10 0.14)',
  'extensions-tertiary': 'oklab(0.72 -0.08 0.16)',
  'extensions-transparent': 'oklab(0.68 -0.10 0.14 / 0.35)',
  'extensions-light': 'oklab(0.75 -0.06 0.18)',
  'drop-highlight': 'oklab(0.65 -0.12 0.12)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.55 -0.14 0.10 / 0.8) 0%, ' +
  // deep forest
  'oklab(0.60 -0.12 0.12 / 0.8) 20%, ' +
  // dark green
  'oklab(0.65 -0.10 0.14 / 0.8) 40%, ' +
  // forest green
  'oklab(0.70 -0.08 0.16 / 0.8) 60%, ' +
  // medium green
  'oklab(0.75 -0.06 0.18 / 0.8) 80%, ' +
  // light green
  'oklab(0.80 -0.04 0.20 / 0.8) 100%)' // bright green
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.65 -0.12 0.12)',
  checkboxActiveBorder: 'oklab(0.68 -0.10 0.14)'
};


/***/ }),

/***/ "./src/lib/themes/accent/gay.js":
/*!**************************************!*\
  !*** ./src/lib/themes/accent/gay.js ***!
  \**************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': '#078e70',
  // teal green
  'motion-primary-transparent': '#078e70bf',
  // semi-transparent teal green
  'motion-tertiary': '#26cfaa',
  // light green

  'looks-secondary': '#078e70',
  // teal green
  'looks-transparent': '#078e7059',
  // more transparent teal green
  'looks-light-transparent': '#078e7026',
  // very transparent teal green
  'looks-secondary-dark': 'hsla(168, 75%, 40%, 1)',
  // darker teal green

  'extensions-primary': 'hsla(168, 60%, 70%, 1)',
  // light green
  'extensions-tertiary': 'hsla(230, 55%, 55%, 1)',
  // blue
  'extensions-transparent': 'hsla(230, 55%, 55%, 0.35)',
  // semi-transparent blue
  'extensions-light': 'hsla(255, 65%, 50%, 1)',
  // indigo

  'drop-highlight': '#26cfaa',
  // light green

  'menu-bar-background-image': 'linear-gradient(90deg, rgba(7, 142, 112, 0.75) 0%, rgba(38, 207, 170, 0.75) 16.67%, ' + 'rgba(152, 233, 193, 0.75) 33.33%, rgba(251, 254, 252, 0.75) 50%, ' + 'rgba(123, 173, 226, 0.75) 66.67%, rgba(80, 73, 203, 0.75) 83.33%, ' + 'rgba(63, 32, 130, 0.75) 100%)' // new gradient
};
const blockColors = {
  checkboxActiveBackground: '#078e70',
  // teal green
  checkboxActiveBorder: '#26cfaa' // light green
};


/***/ }),

/***/ "./src/lib/themes/accent/green.js":
/*!****************************************!*\
  !*** ./src/lib/themes/accent/green.js ***!
  \****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': '#4caf50',
  // bright green
  'motion-primary-transparent': '#4caf50e6',
  // semi-transparent green
  'motion-tertiary': '#388e3c',
  // darker green

  'looks-secondary': '#4caf50',
  // bright green
  'looks-transparent': '#4caf5059',
  // more transparent green
  'looks-light-transparent': '#4caf5026',
  // very transparent green
  'looks-secondary-dark': 'hsla(122, 39%, 35%, 1)',
  // dark green

  'extensions-primary': 'hsla(122, 39%, 65%, 1)',
  // light green
  'extensions-tertiary': 'hsla(122, 39%, 45%, 1)',
  // medium green
  'extensions-transparent': 'hsla(122, 39%, 65%, 0.35)',
  // semi-transparent green
  'extensions-light': 'hsla(122, 39%, 85%, 1)',
  // very light green

  'drop-highlight': '#80c883' // light green
};
const blockColors = {
  checkboxActiveBackground: '#4caf50',
  // bright green
  checkboxActiveBorder: '#388e3c' // darker green
};


/***/ }),

/***/ "./src/lib/themes/accent/lavender.js":
/*!*******************************************!*\
  !*** ./src/lib/themes/accent/lavender.js ***!
  \*******************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.75 0.08 -0.12)',
  'motion-primary-transparent': 'oklab(0.75 0.08 -0.12 / 0.75)',
  'motion-tertiary': 'oklab(0.78 0.06 -0.10)',
  'looks-secondary': 'oklab(0.75 0.08 -0.12)',
  'looks-transparent': 'oklab(0.75 0.08 -0.12 / 0.35)',
  'looks-light-transparent': 'oklab(0.75 0.08 -0.12 / 0.15)',
  'looks-secondary-dark': 'oklab(0.65 0.10 -0.14)',
  'extensions-primary': 'oklab(0.78 0.06 -0.10)',
  'extensions-tertiary': 'oklab(0.82 0.04 -0.08)',
  'extensions-transparent': 'oklab(0.78 0.06 -0.10 / 0.35)',
  'extensions-light': 'oklab(0.85 0.02 -0.06)',
  'drop-highlight': 'oklab(0.75 0.08 -0.12)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.72 0.10 -0.14 / 0.8) 0%, ' +
  // deep lavender
  'oklab(0.75 0.08 -0.12 / 0.8) 20%, ' +
  // lavender
  'oklab(0.78 0.06 -0.08 / 0.8) 40%, ' +
  // light lavender
  'oklab(0.80 0.08 -0.04 / 0.8) 60%, ' +
  // lavender pink
  'oklab(0.82 0.10 0.00 / 0.8) 80%, ' +
  // soft pink
  'oklab(0.85 0.08 0.04 / 0.8) 100%)' // pale pink
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.75 0.08 -0.12)',
  checkboxActiveBorder: 'oklab(0.78 0.06 -0.10)'
};


/***/ }),

/***/ "./src/lib/themes/accent/mint.js":
/*!***************************************!*\
  !*** ./src/lib/themes/accent/mint.js ***!
  \***************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.78 -0.12 0.08)',
  'motion-primary-transparent': 'oklab(0.78 -0.12 0.08 / 0.75)',
  'motion-tertiary': 'oklab(0.80 -0.10 0.06)',
  'looks-secondary': 'oklab(0.78 -0.12 0.08)',
  'looks-transparent': 'oklab(0.78 -0.12 0.08 / 0.35)',
  'looks-light-transparent': 'oklab(0.78 -0.12 0.08 / 0.15)',
  'looks-secondary-dark': 'oklab(0.68 -0.14 0.10)',
  'extensions-primary': 'oklab(0.80 -0.10 0.06)',
  'extensions-tertiary': 'oklab(0.75 -0.08 -0.02)',
  'extensions-transparent': 'oklab(0.80 -0.10 0.06 / 0.35)',
  'extensions-light': 'oklab(0.85 -0.06 0.04)',
  'drop-highlight': 'oklab(0.78 -0.12 0.08)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.75 -0.14 0.10 / 0.8) 0%, ' +
  // fresh mint
  'oklab(0.78 -0.12 0.08 / 0.8) 20%, ' +
  // mint green
  'oklab(0.80 -0.10 0.04 / 0.8) 40%, ' +
  // light mint
  'oklab(0.82 -0.08 0.00 / 0.8) 60%, ' +
  // mint white
  'oklab(0.80 -0.06 -0.04 / 0.8) 80%, ' +
  // mint cyan
  'oklab(0.75 -0.04 -0.08 / 0.8) 100%)' // soft cyan
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.78 -0.12 0.08)',
  checkboxActiveBorder: 'oklab(0.80 -0.10 0.06)'
};


/***/ }),

/***/ "./src/lib/themes/accent/nebula.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/nebula.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.55 0.08 -0.12)',
  'motion-primary-transparent': 'oklab(0.55 0.08 -0.12 / 0.75)',
  'motion-tertiary': 'oklab(0.60 0.06 -0.10)',
  'looks-secondary': 'oklab(0.55 0.08 -0.12)',
  'looks-transparent': 'oklab(0.55 0.08 -0.12 / 0.35)',
  'looks-light-transparent': 'oklab(0.55 0.08 -0.12 / 0.15)',
  'looks-secondary-dark': 'oklab(0.45 0.10 -0.14)',
  'extensions-primary': 'oklab(0.60 0.06 -0.10)',
  'extensions-tertiary': 'oklab(0.50 0.12 0.04)',
  'extensions-transparent': 'oklab(0.60 0.06 -0.10 / 0.35)',
  'extensions-light': 'oklab(0.70 0.04 -0.08)',
  'drop-highlight': 'oklab(0.55 0.08 -0.12)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.25 0.02 -0.08 / 0.9) 0%, ' +
  // deep space black
  'oklab(0.35 0.08 -0.12 / 0.85) 15%, ' +
  // dark purple
  'oklab(0.45 0.12 -0.08 / 0.8) 30%, ' +
  // purple
  'oklab(0.55 0.15 0.02 / 0.8) 50%, ' +
  // magenta-pink
  'oklab(0.65 0.08 0.08 / 0.8) 70%, ' +
  // coral
  'oklab(0.75 0.02 0.12 / 0.8) 85%, ' +
  // gold
  'oklab(0.85 -0.02 0.08 / 0.8) 100%)' // bright yellow
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.55 0.08 -0.12)',
  checkboxActiveBorder: 'oklab(0.60 0.06 -0.10)'
};


/***/ }),

/***/ "./src/lib/themes/accent/ocean.js":
/*!****************************************!*\
  !*** ./src/lib/themes/accent/ocean.js ***!
  \****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.65 -0.08 -0.12)',
  'motion-primary-transparent': 'oklab(0.65 -0.08 -0.12 / 0.75)',
  'motion-tertiary': 'oklab(0.70 -0.06 -0.10)',
  'looks-secondary': 'oklab(0.65 -0.08 -0.12)',
  'looks-transparent': 'oklab(0.65 -0.08 -0.12 / 0.35)',
  'looks-light-transparent': 'oklab(0.65 -0.08 -0.12 / 0.15)',
  'looks-secondary-dark': 'oklab(0.55 -0.10 -0.14)',
  'extensions-primary': 'oklab(0.70 -0.06 -0.10)',
  'extensions-tertiary': 'oklab(0.75 -0.04 -0.08)',
  'extensions-transparent': 'oklab(0.70 -0.06 -0.10 / 0.35)',
  'extensions-light': 'oklab(0.80 -0.02 -0.06)',
  'drop-highlight': 'oklab(0.65 -0.08 -0.12)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.45 -0.05 -0.15 / 0.8) 0%, ' +
  // deep blue
  'oklab(0.55 -0.08 -0.12 / 0.8) 20%, ' +
  // ocean blue
  'oklab(0.65 -0.08 -0.08 / 0.8) 40%, ' +
  // teal
  'oklab(0.70 -0.06 -0.04 / 0.8) 60%, ' +
  // aqua
  'oklab(0.80 -0.02 -0.02 / 0.8) 80%, ' +
  // cyan
  'oklab(0.85 0.00 0.00 / 0.8) 100%)' // light cyan
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.65 -0.08 -0.12)',
  checkboxActiveBorder: 'oklab(0.70 -0.06 -0.10)'
};


/***/ }),

/***/ "./src/lib/themes/accent/orange.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/orange.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': '#ff7f2a',
  // bright orange
  'motion-primary-transparent': '#ff7f2ae6',
  // semi-transparent orange
  'motion-tertiary': '#e65c00',
  // darker orange

  'looks-secondary': '#ff7f2a',
  // bright orange
  'looks-transparent': '#ff7f2a59',
  // more transparent orange
  'looks-light-transparent': '#ff7f2a26',
  // very transparent orange
  'looks-secondary-dark': 'hsla(25, 100%, 45%, 1)',
  // dark orange

  'extensions-primary': 'hsla(30, 100%, 65%, 1)',
  // light orange
  'extensions-tertiary': 'hsla(30, 90%, 45%, 1)',
  // medium orange
  'extensions-transparent': 'hsla(30, 90%, 65%, 0.35)',
  // semi-transparent orange
  'extensions-light': 'hsla(30, 100%, 85%, 1)',
  // very light orange

  'drop-highlight': '#ffad66' // light orange
};
const blockColors = {
  checkboxActiveBackground: '#ff7f2a',
  // bright orange
  checkboxActiveBorder: '#e65c00' // darker orange
};


/***/ }),

/***/ "./src/lib/themes/accent/pink.js":
/*!***************************************!*\
  !*** ./src/lib/themes/accent/pink.js ***!
  \***************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'hsla(330, 80%, 70%, 1)',
  'motion-primary-transparent': 'hsla(330, 80%, 70%, 0.9)',
  'motion-tertiary': 'hsla(330, 60%, 55%, 1)',
  'looks-secondary': 'hsla(330, 80%, 70%, 1)',
  'looks-transparent': 'hsla(330, 80%, 70%, 0.35)',
  'looks-light-transparent': 'hsla(330, 80%, 70%, 0.15)',
  'looks-secondary-dark': 'hsla(330, 60%, 55%, 1)'
};
const blockColors = {};


/***/ }),

/***/ "./src/lib/themes/accent/purple.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/purple.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'hsla(260, 60%, 60%, 1)',
  'motion-primary-transparent': 'hsla(260, 60%, 60%, 0.9)',
  'motion-tertiary': 'hsla(260, 42%, 51%, 1)',
  'looks-secondary': 'hsla(260, 60%, 60%, 1)',
  'looks-transparent': 'hsla(260, 60%, 60%, 0.35)',
  'looks-light-transparent': 'hsla(260, 60%, 60%, 0.15)',
  'looks-secondary-dark': 'hsla(260, 42%, 51%, 1)'
};
const blockColors = {};


/***/ }),

/***/ "./src/lib/themes/accent/rainbow.js":
/*!******************************************!*\
  !*** ./src/lib/themes/accent/rainbow.js ***!
  \******************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': '#ff4c4c',
  'motion-primary-transparent': '#ff4c4ce6',
  'motion-tertiary': '#cc3333',
  'looks-secondary': '#ff4c4c',
  'looks-transparent': '#ff4d4d59',
  'looks-light-transparent': '#ff4d4d26',
  'looks-secondary-dark': 'hsla(0, 42%, 51%, 1)',
  'extensions-primary': 'hsla(10, 85%, 65%, 1)',
  'extensions-tertiary': 'hsla(10, 85%, 40%, 1)',
  'extensions-transparent': 'hsla(10, 85%, 65%, 0.35)',
  'extensions-light': 'hsla(10, 57%, 85%, 1)',
  'drop-highlight': '#ff8c8c',
  'menu-bar-background-image': 'linear-gradient(90deg, rgba(255, 0, 0, 0.75) 0%, rgba(255, 154, 0, 0.75) 10%, ' + 'rgba(208, 222, 33, 0.75) 20%, rgba(79, 220, 74, 0.75) 30%, rgba(63, 218, 216, 0.75) 40%, ' + 'rgba(47, 201, 226, 0.75) 50%, rgba(28, 127, 238, 0.75) 60%, rgba(95, 21, 242, 0.75) 70%, ' + 'rgba(186, 12, 248, 0.75) 80%, rgba(251, 7, 217, 0.75) 90%, rgba(255, 0, 0, 0.75) 100%)'
};
const blockColors = {
  checkboxActiveBackground: '#ff4c4c',
  checkboxActiveBorder: '#cc3333'
};


/***/ }),

/***/ "./src/lib/themes/accent/red.js":
/*!**************************************!*\
  !*** ./src/lib/themes/accent/red.js ***!
  \**************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': '#ff4c4c',
  'motion-primary-transparent': '#ff4c4ce6',
  'motion-tertiary': '#cc3333',
  'looks-secondary': '#ff4c4c',
  'looks-transparent': '#ff4d4d59',
  'looks-light-transparent': '#ff4d4d26',
  'looks-secondary-dark': 'hsla(0, 42%, 51%, 1)',
  'extensions-primary': 'hsla(10, 85%, 65%, 1)',
  'extensions-tertiary': 'hsla(10, 85%, 40%, 1)',
  'extensions-transparent': 'hsla(10, 85%, 65%, 0.35)',
  'extensions-light': 'hsla(10, 57%, 85%, 1)',
  'drop-highlight': '#ff8c8c'
};
const blockColors = {
  checkboxActiveBackground: '#ff4c4c',
  checkboxActiveBorder: '#cc3333'
};


/***/ }),

/***/ "./src/lib/themes/accent/rotur.js":
/*!****************************************!*\
  !*** ./src/lib/themes/accent/rotur.js ***!
  \****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.42 -0.01 -0.08)',
  'motion-primary-transparent': 'oklab(0.42 -0.01 -0.08 / 0.8)',
  'motion-tertiary': 'oklab(0.37 0.01 -0.07)',
  'looks-secondary': 'oklab(0.37 0.01 -0.07)',
  'looks-transparent': 'oklab(0.37 0.01 -0.07 / 0.6)',
  'looks-light-transparent': 'oklab(0.37 0.01 -0.07 / 0.3)',
  'looks-secondary-dark': 'oklab(0.30 0.02 -0.04)',
  'extensions-primary': 'oklab(0.30 0.02 -0.04)',
  'extensions-tertiary': 'oklab(0.30 0.02 -0.04 / 0.8)',
  'extensions-transparent': 'oklab(0.30 0.02 -0.04 / 0.35)',
  'extensions-light': 'oklab(0.42 -0.01 -0.08 / 0.9)',
  'drop-highlight': 'oklab(0.37 0.01 -0.07)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.42 -0.01 -0.08 / 0.4) 0%, ' + 'oklab(0.37 0.01 -0.07 / 0.4) 50%, ' + 'oklab(0.30 0.02 -0.04 / 0.4) 100%)'
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.42 -0.01 -0.08)',
  checkboxActiveBorder: 'oklab(0.37 0.01 -0.07)'
};


/***/ }),

/***/ "./src/lib/themes/accent/sky.js":
/*!**************************************!*\
  !*** ./src/lib/themes/accent/sky.js ***!
  \**************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.80 -0.04 -0.08)',
  'motion-primary-transparent': 'oklab(0.80 -0.04 -0.08 / 0.75)',
  'motion-tertiary': 'oklab(0.82 -0.02 -0.06)',
  'looks-secondary': 'oklab(0.80 -0.04 -0.08)',
  'looks-transparent': 'oklab(0.80 -0.04 -0.08 / 0.35)',
  'looks-light-transparent': 'oklab(0.80 -0.04 -0.08 / 0.15)',
  'looks-secondary-dark': 'oklab(0.70 -0.06 -0.10)',
  'extensions-primary': 'oklab(0.82 -0.02 -0.06)',
  'extensions-tertiary': 'oklab(0.85 0.00 -0.04)',
  'extensions-transparent': 'oklab(0.82 -0.02 -0.06 / 0.35)',
  'extensions-light': 'oklab(0.88 0.00 -0.02)',
  'drop-highlight': 'oklab(0.80 -0.04 -0.08)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.75 -0.06 -0.10 / 0.8) 0%, ' +
  // soft blue
  'oklab(0.80 -0.04 -0.08 / 0.8) 20%, ' +
  // sky blue
  'oklab(0.83 -0.02 -0.06 / 0.8) 40%, ' +
  // light blue
  'oklab(0.86 0.00 -0.04 / 0.8) 60%, ' +
  // pale blue
  'oklab(0.88 0.00 -0.02 / 0.8) 80%, ' +
  // very pale blue
  'oklab(0.92 0.00 0.00 / 0.8) 100%)' // almost white
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.80 -0.04 -0.08)',
  checkboxActiveBorder: 'oklab(0.82 -0.02 -0.06)'
};


/***/ }),

/***/ "./src/lib/themes/accent/sunset.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/sunset.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.75 0.12 0.08)',
  'motion-primary-transparent': 'oklab(0.75 0.12 0.08 / 0.75)',
  'motion-tertiary': 'oklab(0.72 0.14 0.06)',
  'looks-secondary': 'oklab(0.75 0.12 0.08)',
  'looks-transparent': 'oklab(0.75 0.12 0.08 / 0.35)',
  'looks-light-transparent': 'oklab(0.75 0.12 0.08 / 0.15)',
  'looks-secondary-dark': 'oklab(0.65 0.15 0.10)',
  'extensions-primary': 'oklab(0.72 0.14 0.06)',
  'extensions-tertiary': 'oklab(0.68 0.16 0.04)',
  'extensions-transparent': 'oklab(0.72 0.14 0.06 / 0.35)',
  'extensions-light': 'oklab(0.80 0.10 0.10)',
  'drop-highlight': 'oklab(0.75 0.12 0.08)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.72 0.14 0.12 / 0.8) 0%, ' +
  // warm orange
  'oklab(0.75 0.12 0.08 / 0.8) 25%, ' +
  // coral
  'oklab(0.70 0.15 0.02 / 0.8) 50%, ' +
  // pink
  'oklab(0.65 0.12 -0.04 / 0.8) 75%, ' +
  // purple-pink
  'oklab(0.58 0.08 -0.08 / 0.8) 100%)' // deep purple
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.75 0.12 0.08)',
  checkboxActiveBorder: 'oklab(0.72 0.14 0.06)'
};


/***/ }),

/***/ "./src/lib/themes/accent/trans.js":
/*!****************************************!*\
  !*** ./src/lib/themes/accent/trans.js ***!
  \****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': 'oklab(0.85 0.08 0.02)',
  'motion-primary-transparent': 'oklab(0.85 0.08 0.02 / 0.75)',
  'motion-tertiary': 'oklab(0.85 0.08 0.02)',
  'looks-secondary': 'oklab(0.85 0.08 0.02)',
  'looks-transparent': 'oklab(0.85 0.08 0.02 / 0.75)',
  'looks-light-transparent': 'oklab(0.85 0.08 0.02 / 0.75)',
  'looks-secondary-dark': 'oklab(0.85 0.08 0.02)',
  'extensions-primary': 'oklab(0.85 0.08 0.02)',
  'extensions-tertiary': 'oklab(0.72 0.10 0.03)',
  'extensions-transparent': 'oklab(0.85 0.08 0.02 / 0.35)',
  'extensions-light': 'oklab(0.85 0.08 0.02)',
  'drop-highlight': 'oklab(0.85 0.08 0.02)',
  'menu-bar-background-image': 'linear-gradient(90deg, ' + 'oklab(0.82 -0.05 -0.15 / 0.75) 0%, ' + 'oklab(0.85 0.08 0.02 / 0.75) 50%, ' + 'oklab(1.0 0.0 0.0 / 0.75) 100%)'
};
const blockColors = {
  checkboxActiveBackground: 'oklab(0.85 0.08 0.02)',
  checkboxActiveBorder: 'oklab(0.85 0.08 0.02)'
};


/***/ }),

/***/ "./src/lib/themes/accent/yellow.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/accent/yellow.js ***!
  \*****************************************/
/*! exports provided: guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
const guiColors = {
  'motion-primary': '#ffcc00',
  // bright yellow
  'motion-primary-transparent': '#ffcc00e6',
  // semi-transparent yellow
  'motion-tertiary': '#e6b800',
  // darker yellow

  'looks-secondary': '#ffcc00',
  // bright yellow
  'looks-transparent': '#ffcc0059',
  // more transparent yellow
  'looks-light-transparent': '#ffcc0026',
  // very transparent yellow
  'looks-secondary-dark': 'hsla(48, 100%, 40%, 1)',
  // dark yellow

  'extensions-primary': 'hsla(50, 100%, 65%, 1)',
  // light yellow
  'extensions-tertiary': 'hsla(50, 90%, 45%, 1)',
  // medium yellow
  'extensions-transparent': 'hsla(50, 90%, 65%, 0.35)',
  // semi-transparent yellow
  'extensions-light': 'hsla(50, 100%, 85%, 1)',
  // very light yellow

  'drop-highlight': '#ffdb4d' // light yellow
};
const blockColors = {
  checkboxActiveBackground: '#ffcc00',
  // bright yellow
  checkboxActiveBorder: '#e6b800' // darker yellow
};


/***/ }),

/***/ "./src/lib/themes/accents.js":
/*!***********************************!*\
  !*** ./src/lib/themes/accents.js ***!
  \***********************************/
/*! exports provided: ACCENTS, ACCENT_MAP, ACCENT_DEFAULT */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ACCENTS", function() { return ACCENTS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ACCENT_MAP", function() { return ACCENT_MAP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ACCENT_DEFAULT", function() { return ACCENT_DEFAULT; });
/* harmony import */ var _accent_purple__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./accent/purple */ "./src/lib/themes/accent/purple.js");
/* harmony import */ var _accent_blue__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./accent/blue */ "./src/lib/themes/accent/blue.js");
/* harmony import */ var _accent_red__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./accent/red */ "./src/lib/themes/accent/red.js");
/* harmony import */ var _accent_orange__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./accent/orange */ "./src/lib/themes/accent/orange.js");
/* harmony import */ var _accent_yellow__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./accent/yellow */ "./src/lib/themes/accent/yellow.js");
/* harmony import */ var _accent_green__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./accent/green */ "./src/lib/themes/accent/green.js");
/* harmony import */ var _accent_rainbow__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./accent/rainbow */ "./src/lib/themes/accent/rainbow.js");
/* harmony import */ var _accent_trans__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./accent/trans */ "./src/lib/themes/accent/trans.js");
/* harmony import */ var _accent_gay__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./accent/gay */ "./src/lib/themes/accent/gay.js");
/* harmony import */ var _accent_rotur__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./accent/rotur */ "./src/lib/themes/accent/rotur.js");
/* harmony import */ var _accent_pink__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./accent/pink */ "./src/lib/themes/accent/pink.js");
/* harmony import */ var _accent_sunset__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./accent/sunset */ "./src/lib/themes/accent/sunset.js");
/* harmony import */ var _accent_ocean__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./accent/ocean */ "./src/lib/themes/accent/ocean.js");
/* harmony import */ var _accent_aurora__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./accent/aurora */ "./src/lib/themes/accent/aurora.js");
/* harmony import */ var _accent_cosmic__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./accent/cosmic */ "./src/lib/themes/accent/cosmic.js");
/* harmony import */ var _accent_fire__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./accent/fire */ "./src/lib/themes/accent/fire.js");
/* harmony import */ var _accent_nebula__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./accent/nebula */ "./src/lib/themes/accent/nebula.js");
/* harmony import */ var _accent_lavender__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./accent/lavender */ "./src/lib/themes/accent/lavender.js");
/* harmony import */ var _accent_mint__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./accent/mint */ "./src/lib/themes/accent/mint.js");
/* harmony import */ var _accent_cherry__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./accent/cherry */ "./src/lib/themes/accent/cherry.js");
/* harmony import */ var _accent_sky__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./accent/sky */ "./src/lib/themes/accent/sky.js");
/* harmony import */ var _accent_forest__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./accent/forest */ "./src/lib/themes/accent/forest.js");
/* harmony import */ var _accent_coral__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./accent/coral */ "./src/lib/themes/accent/coral.js");























const ACCENTS = [{
  name: 'Red',
  accent: _accent_red__WEBPACK_IMPORTED_MODULE_2__,
  description: 'Red accent color',
  id: 'tw.accent.red'
}, {
  name: 'Orange',
  accent: _accent_orange__WEBPACK_IMPORTED_MODULE_3__,
  description: 'Orange accent color',
  id: 'tw.accent.orange'
}, {
  name: 'Yellow',
  accent: _accent_yellow__WEBPACK_IMPORTED_MODULE_4__,
  description: 'Yellow accent color',
  id: 'tw.accent.yellow'
}, {
  name: 'Green',
  accent: _accent_green__WEBPACK_IMPORTED_MODULE_5__,
  description: 'Green accent color',
  id: 'tw.accent.green'
}, {
  name: 'Purple',
  accent: _accent_purple__WEBPACK_IMPORTED_MODULE_0__,
  description: 'Purple accent color',
  id: 'tw.accent.purple'
}, {
  name: 'Blue',
  accent: _accent_blue__WEBPACK_IMPORTED_MODULE_1__,
  description: 'Blue accent color',
  id: 'tw.accent.blue'
}, {
  name: 'Rainbow',
  accent: _accent_rainbow__WEBPACK_IMPORTED_MODULE_6__,
  description: 'Rainbow accent color',
  id: 'tw.accent.rainbow'
}, {
  name: 'Trans',
  accent: _accent_trans__WEBPACK_IMPORTED_MODULE_7__,
  description: 'Trans accent color',
  id: 'tw.accent.trans'
}, {
  name: 'Gay',
  accent: _accent_gay__WEBPACK_IMPORTED_MODULE_8__,
  description: 'Gay accent color',
  id: 'tw.accent.gay'
}, {
  name: 'Rotur',
  accent: _accent_rotur__WEBPACK_IMPORTED_MODULE_9__,
  description: 'Rotur accent color',
  id: 'tw.accent.rotur'
}, {
  name: 'Pink',
  accent: _accent_pink__WEBPACK_IMPORTED_MODULE_10__,
  description: 'Pink accent color',
  id: 'tw.accent.pink'
}, {
  name: 'Sunset',
  accent: _accent_sunset__WEBPACK_IMPORTED_MODULE_11__,
  description: 'Beautiful sunset gradient',
  id: 'tw.accent.sunset'
}, {
  name: 'Ocean',
  accent: _accent_ocean__WEBPACK_IMPORTED_MODULE_12__,
  description: 'Deep ocean gradient',
  id: 'tw.accent.ocean'
}, {
  name: 'Aurora',
  accent: _accent_aurora__WEBPACK_IMPORTED_MODULE_13__,
  description: 'Aurora borealis gradient',
  id: 'tw.accent.aurora'
}, {
  name: 'Cosmic',
  accent: _accent_cosmic__WEBPACK_IMPORTED_MODULE_14__,
  description: 'Cosmic space gradient',
  id: 'tw.accent.cosmic'
}, {
  name: 'Fire',
  accent: _accent_fire__WEBPACK_IMPORTED_MODULE_15__,
  description: 'Fiery gradient',
  id: 'tw.accent.fire'
}, {
  name: 'Nebula',
  accent: _accent_nebula__WEBPACK_IMPORTED_MODULE_16__,
  description: 'Stellar nebula gradient',
  id: 'tw.accent.nebula'
}, {
  name: 'Lavender',
  accent: _accent_lavender__WEBPACK_IMPORTED_MODULE_17__,
  description: 'Soft lavender to pink gradient',
  id: 'tw.accent.lavender'
}, {
  name: 'Mint',
  accent: _accent_mint__WEBPACK_IMPORTED_MODULE_18__,
  description: 'Fresh mint to cyan gradient',
  id: 'tw.accent.mint'
}, {
  name: 'Cherry',
  accent: _accent_cherry__WEBPACK_IMPORTED_MODULE_19__,
  description: 'Vibrant cherry to rose gradient',
  id: 'tw.accent.cherry'
}, {
  name: 'Sky',
  accent: _accent_sky__WEBPACK_IMPORTED_MODULE_20__,
  description: 'Light sky blue to white gradient',
  id: 'tw.accent.sky'
}, {
  name: 'Forest',
  accent: _accent_forest__WEBPACK_IMPORTED_MODULE_21__,
  description: 'Deep forest to bright green gradient',
  id: 'tw.accent.forest'
}, {
  name: 'Coral',
  accent: _accent_coral__WEBPACK_IMPORTED_MODULE_22__,
  description: 'Warm coral to peach gradient',
  id: 'tw.accent.coral'
}];
const ACCENT_MAP = {};
for (const accent of ACCENTS) {
  ACCENT_MAP[accent.name.toLowerCase()] = {
    defaultMessage: accent.name,
    accent: accent.accent,
    description: accent.description,
    id: accent.id
  };
}
const ACCENT_DEFAULT = ACCENTS[0].name.toLowerCase();


/***/ }),

/***/ "./src/lib/themes/blocks/dark.js":
/*!***************************************!*\
  !*** ./src/lib/themes/blocks/dark.js ***!
  \***************************************/
/*! exports provided: blockColors, extensions, customExtensionColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extensions", function() { return extensions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "customExtensionColors", function() { return customExtensionColors; });
/* harmony import */ var _utils_color__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/color */ "./src/lib/utils/color.js");

const blockColors = {
  motion: {
    primary: '#0F1E33',
    secondary: '#4C4C4C',
    tertiary: '#4C97FF',
    quaternary: '#4C97FF'
  },
  looks: {
    primary: '#1E1433',
    secondary: '#4C4C4C',
    tertiary: '#9966FF',
    quaternary: '#9966FF'
  },
  sounds: {
    primary: '#291329',
    secondary: '#4C4C4C',
    tertiary: '#CF63CF',
    quaternary: '#CF63CF'
  },
  control: {
    primary: '#332205',
    secondary: '#4C4C4C',
    tertiary: '#FFAB19',
    quaternary: '#FFAB19'
  },
  event: {
    primary: '#332600',
    secondary: '#4C4C4C',
    tertiary: '#FFBF00',
    quaternary: '#FFBF00'
  },
  sensing: {
    primary: '#12232A',
    secondary: '#4C4C4C',
    tertiary: '#5CB1D6',
    quaternary: '#5CB1D6'
  },
  pen: {
    primary: '#03251C',
    secondary: '#4C4C4C',
    tertiary: '#0fBD8C',
    quaternary: '#0fBD8C'
  },
  operators: {
    primary: '#112611',
    secondary: '#4C4C4C',
    tertiary: '#59C059',
    quaternary: '#59C059'
  },
  data: {
    primary: '#331C05',
    secondary: '#4C4C4C',
    tertiary: '#FF8C1A',
    quaternary: '#FF8C1A'
  },
  data_lists: {
    primary: '#331405',
    secondary: '#4C4C4C',
    tertiary: '#FF661A',
    quaternary: '#FF661A'
  },
  more: {
    primary: '#331419',
    secondary: '#4C4C4C',
    tertiary: '#FF6680',
    quaternary: '#FF6680'
  },
  addons: {
    primary: '#0b3331',
    secondary: '#4C4C4C',
    tertiary: '#34e4d0',
    quaternary: '#34e4d0'
  },
  text: 'rgba(255, 255, 255, .7)',
  textFieldText: '#E5E5E5',
  textField: '#4C4C4C',
  menuHover: 'rgba(255, 255, 255, 0.3)'
};
const extensions = {};
const customExtensionColors = {
  primary: _primary => {
    const hsv = Object(_utils_color__WEBPACK_IMPORTED_MODULE_0__["hex2hsv"])(_primary);
    hsv[2] = Math.max(hsv[2] - 70, 20);
    return Object(_utils_color__WEBPACK_IMPORTED_MODULE_0__["hsv2hex"])(hsv);
  },
  secondary: () => '#4C4C4C',
  tertiary: primary => primary,
  quaternary: primary => primary,
  categoryIconBackground: primary => customExtensionColors.primary(primary),
  categoryIconBorder: primary => customExtensionColors.tertiary(primary)
};


/***/ }),

/***/ "./src/lib/themes/blocks/high-contrast-media/extensions/musicIcon.svg":
/*!****************************************************************************!*\
  !*** ./src/lib/themes/blocks/high-contrast-media/extensions/musicIcon.svg ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjQzMzggMzBDMjkuNTEzIDMwIDMxLjYzNjYgMjguMTU2OSAzMS4xNzkgMjUuODc0QzI4LjI5OTQgMTMuMDQzNiAyNy40MjU2IDkuODUxMzQgMjcuOTQ1NCA5LjYwNTQ3QzI4LjMxMjUgOS40MzE4MyAyOS4zNzQ2IDEwLjcyNzYgMzAuOTE2MiAxMS4xMzU5QzM0LjY0MTYgMTIuMTEyNiA0MC4yNzQyIDYuNDA3NTEgMzQuNTY1NSA3LjI5MTg2QzMyLjMyMjQgNy42MzkgMzAuMTU4NyA2LjIzODM2IDI4LjQ4NzkgNS4xNTY3OUMyNS45MDcyIDMuNDg2MiAyNC41MDI0IDIuNTc2ODQgMjUuNzk3NCAxMC4wNDUxQzI2LjQzNDkgMTMuNzAzNSAyNi45Njk3IDE2LjMyMzEgMjcuMzQ3NSAxOC4xNzM5QzI3Ljk5NTcgMjEuMzQ5NCAyOC4xODE5IDIyLjI2MTYgMjcuNjMyNSAyMi4yNzQxQzI3LjMzMjEgMjIuMTUyIDI3LjAzMjcgMjIuMDU3OCAyNi42OTU3IDIxLjk3MjRDMjYuMDg4IDIxLjgyMjUgMjUuNDUxNiAyMS43MzgyIDI0LjgwNTMgMjEuNzM4MkMyMS43MjcxIDIxLjczODIgMTkuNjAzNiAyMy41ODkyIDIwLjA2MjEgMjUuODc0QzIwLjUxMDcgMjguMTU2OSAyMy4zNjQ2IDMwIDI2LjQzMzggMzBaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNOS40Mzg2MSAzNi4wMDAxQzEyLjUwNjUgMzYuMDAwMSAxNC42MzAyIDM0LjE0OCAxNC4xODE3IDMxLjg2NDJDMTEuMzAzMiAxOS4wMzM2IDEwLjQyOTkgMTUuODQxNiAxMC45NDk2IDE1LjU5NThDMTEuMzE2NiAxNS40MjIyIDEyLjM3ODMgMTYuNzE3NyAxMy45MTkgMTcuMTI2QzE3LjY0MjggMTguMTEzNiAyMy4yNzI5IDEyLjM5ODUgMTcuNTY2NyAxMy4yOTE4QzE1LjMyNDggMTMuNjM4NiAxMy4xNjIzIDEyLjIzODIgMTEuNDkyMiAxMS4xNTY5QzguOTEyMzcgOS40ODYzNiA3LjUwNzk3IDguNTc2OTggOC44MDI1MSAxNi4wNDUxQzkuNDQyOTQgMTkuNzI4NiA5Ljk3OTggMjIuMzU5NCAxMC4zNTggMjQuMjEyNUMxMC45OTEyIDI3LjMxNTQgMTEuMTc5NSAyOC4yMzg0IDEwLjY2NDQgMjguMjczMkM5Ljc4NDMyIDI3LjkyNTggOC44MTIzOSAyNy43MjkzIDcuODEwODIgMjcuNzI5M0M0LjczNCAyNy43MjkzIDIuNjExMzQgMjkuNTgwNCAzLjA1OTc4IDMxLjg2NDJDMy41MTgwOSAzNC4xNDggNi4zNzA2OSAzNi4wMDAxIDkuNDM4NjEgMzYuMDAwMVoiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo="

/***/ }),

/***/ "./src/lib/themes/blocks/high-contrast-media/extensions/penIcon.svg":
/*!**************************************************************************!*\
  !*** ./src/lib/themes/blocks/high-contrast-media/extensions/penIcon.svg ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "static/assets/b631383707e87a454b479dedaa8ca014.svg";

/***/ }),

/***/ "./src/lib/themes/blocks/high-contrast-media/extensions/text2speechIcon.svg":
/*!**********************************************************************************!*\
  !*** ./src/lib/themes/blocks/high-contrast-media/extensions/text2speechIcon.svg ***!
  \**********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDIxLjY2OTNWMzQuMjgzNEMxNiAzNS44MTUxIDE0IDM2LjUzNTkgMTIuOCAzNS41NDQ4TDEwLjIgMzMuMzgyNEM5LjIgMzIuNTcxNSA4IDMyLjIxMTEgNi43IDMyLjIxMTFINi4zQzUgMzIuMjExMSA0IDMxLjMxMDEgNCAzMC4xMzg4VjI1LjkwNDFDNCAyNC43MzI4IDUgMjMuODMxOCA2LjMgMjMuODMxOEg2LjdDOCAyMy44MzE4IDkuMiAyMy4zODEzIDEwLjEgMjIuNjYwNEwxMi44IDIwLjQ5OEMxNCAxOS40MTY4IDE2IDIwLjIyNzcgMTYgMjEuNjY5M1oiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0yNCA0QzE5LjU4MTcgNCAxNiA3LjU4MTcyIDE2IDEyQzE2IDE1LjExNDcgMTcuNzc5OSAxNy44MTM2IDIwLjM3ODEgMTkuMTM1MUMyMC4yMDk1IDIwLjkwODcgMTkuNjU2NCAyMS42NjU1IDE5LjMwNDIgMjIuMTQ3M0MxOS4xMjY1IDIyLjM5MDQgMTkgMjIuNTYzNSAxOSAyMi43NjE5QzE5IDIzLjQyODYgMTkuNjY2NyAyMy40Mjg2IDE5LjY2NjcgMjMuNDI4NkMyMC42MTMyIDIzLjQyODYgMjMuNTgxMyAyMi4yNjIzIDI1LjQwOTcgMjBIMjhDMzIuNDE4MyAyMCAzNiAxNi40MTgzIDM2IDEyQzM2IDcuNTgxNzIgMzIuNDE4MyA0IDI4IDRIMjRaIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMEI4RTY5Ii8+Cjwvc3ZnPgo="

/***/ }),

/***/ "./src/lib/themes/blocks/high-contrast-media/extensions/translateIcon.svg":
/*!********************************************************************************!*\
  !*** ./src/lib/themes/blocks/high-contrast-media/extensions/translateIcon.svg ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "static/assets/ef4a998a82a8567de018baa4607bc6a0.svg";

/***/ }),

/***/ "./src/lib/themes/blocks/high-contrast-media/extensions/videoSensingIcon.svg":
/*!***********************************************************************************!*\
  !*** ./src/lib/themes/blocks/high-contrast-media/extensions/videoSensingIcon.svg ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBvcGFjaXR5PSIwLjI1IiBjeD0iMzIiIGN5PSIyNiIgcj0iNCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzBCOEU2OSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgb3BhY2l0eT0iMC41IiBjeD0iMzIiIGN5PSIyMiIgcj0iNCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzBCOEU2OSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgb3BhY2l0eT0iMC43NSIgY3g9IjMyIiBjeT0iMTgiIHI9IjQiIGZpbGw9IndoaXRlIiBzdHJva2U9IiMwQjhFNjkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjE0IiByPSI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMEI4RTY5IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTE3IDE3LjVMMjIuNCAxNEMyMi45IDEzLjcgMjMuNSAxMy44IDIzLjggMTQuM0MyMy45IDE0LjUgMjQgMTQuNyAyNCAxNC44VjI1LjFDMjQgMjUuNyAyMy41IDI2LjEgMjMgMjYuMUMyMi44IDI2LjEgMjIuNiAyNiAyMi41IDI1LjlMMTcgMjIuNlYyNEMxNyAyNi4yIDE1LjIgMjguMSAxMyAyOC4xSDQuMUMxLjggMjggMCAyNi4yIDAgMjRWMTYuMUMwIDEzLjggMS44IDEyIDQuMSAxMkgxM0MxNS4yIDEyIDE3IDEzLjggMTcgMTYuMVYxNy41WiIgZmlsbD0iYmxhY2siLz4KPC9zdmc+Cg=="

/***/ }),

/***/ "./src/lib/themes/blocks/high-contrast.js":
/*!************************************************!*\
  !*** ./src/lib/themes/blocks/high-contrast.js ***!
  \************************************************/
/*! exports provided: blockColors, extensions, customExtensionColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extensions", function() { return extensions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "customExtensionColors", function() { return customExtensionColors; });
/* harmony import */ var _high_contrast_media_extensions_musicIcon_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./high-contrast-media/extensions/musicIcon.svg */ "./src/lib/themes/blocks/high-contrast-media/extensions/musicIcon.svg");
/* harmony import */ var _high_contrast_media_extensions_musicIcon_svg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_high_contrast_media_extensions_musicIcon_svg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _high_contrast_media_extensions_penIcon_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./high-contrast-media/extensions/penIcon.svg */ "./src/lib/themes/blocks/high-contrast-media/extensions/penIcon.svg");
/* harmony import */ var _high_contrast_media_extensions_penIcon_svg__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_high_contrast_media_extensions_penIcon_svg__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _high_contrast_media_extensions_text2speechIcon_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./high-contrast-media/extensions/text2speechIcon.svg */ "./src/lib/themes/blocks/high-contrast-media/extensions/text2speechIcon.svg");
/* harmony import */ var _high_contrast_media_extensions_text2speechIcon_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_high_contrast_media_extensions_text2speechIcon_svg__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _high_contrast_media_extensions_translateIcon_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./high-contrast-media/extensions/translateIcon.svg */ "./src/lib/themes/blocks/high-contrast-media/extensions/translateIcon.svg");
/* harmony import */ var _high_contrast_media_extensions_translateIcon_svg__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_high_contrast_media_extensions_translateIcon_svg__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _high_contrast_media_extensions_videoSensingIcon_svg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./high-contrast-media/extensions/videoSensingIcon.svg */ "./src/lib/themes/blocks/high-contrast-media/extensions/videoSensingIcon.svg");
/* harmony import */ var _high_contrast_media_extensions_videoSensingIcon_svg__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_high_contrast_media_extensions_videoSensingIcon_svg__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _utils_color__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/color */ "./src/lib/utils/color.js");






const blockColors = {
  motion: {
    primary: '#80B5FF',
    secondary: '#B3D2FF',
    tertiary: '#3373CC',
    quaternary: '#CCE1FF'
  },
  looks: {
    primary: '#CCB3FF',
    secondary: '#DDCCFF',
    tertiary: '#774DCB',
    quaternary: '#EEE5FF'
  },
  sounds: {
    primary: '#E19DE1',
    secondary: '#FFB3FF',
    tertiary: '#BD42BD',
    quaternary: '#FFCCFF'
  },
  control: {
    primary: '#FFBE4C',
    secondary: '#FFDA99',
    tertiary: '#CF8B17',
    quaternary: '#FFE3B3'
  },
  event: {
    primary: '#FFD966',
    secondary: '#FFECB3',
    tertiary: '#CC9900',
    quaternary: '#FFF2CC'
  },
  sensing: {
    primary: '#85C4E0',
    secondary: '#AED8EA',
    tertiary: '#2E8EB8',
    quaternary: '#C2E2F0'
  },
  pen: {
    primary: '#13ECAF',
    secondary: '#75F0CD',
    tertiary: '#0B8E69',
    quaternary: '#A3F5DE'
  },
  operators: {
    primary: '#7ECE7E',
    secondary: '#B5E3B5',
    tertiary: '#389438',
    quaternary: '#DAF1DA'
  },
  data: {
    primary: '#FFA54C',
    secondary: '#FFCC99',
    tertiary: '#DB6E00',
    quaternary: '#FFE5CC'
  },
  // This is not a new category, but rather for differentiation
  // between lists and scalar variables.
  data_lists: {
    primary: '#FF9966',
    secondary: '#FFCAB0',
    // I don't think this is used, b/c we don't have any droppable fields in list blocks
    tertiary: '#E64D00',
    quaternary: '#FFDDCC'
  },
  more: {
    primary: '#FF99AA',
    secondary: '#FFCCD5',
    tertiary: '#FF3355',
    quaternary: '#FFE5EA'
  },
  addons: {
    primary: '#34e4d0',
    secondary: '#71e2d5',
    tertiary: '#29b2a2',
    quaternary: '#9ee2db'
  },
  text: '#000000',
  textFieldText: '#000000',
  // Text inside of inputs e.g. 90 in [point in direction (90)]
  toolboxText: '#000000',
  // Toolbox text, color picker text (used to be #575E75)
  blackText: '#000000',
  // The color that the category menu label (e.g. 'motion', 'looks', etc.) changes to on hover
  toolboxHover: '#3373CC',
  insertionMarker: '#000000',
  insertionMarkerOpacity: 0.2,
  fieldShadow: 'rgba(255, 255, 255, 0.3)',
  dragShadowOpacity: 0.6,
  menuHover: 'rgba(255, 255, 255, 0.3)'
};
const extensions = {
  music: {
    blockIconURI: _high_contrast_media_extensions_musicIcon_svg__WEBPACK_IMPORTED_MODULE_0___default.a
  },
  pen: {
    blockIconURI: _high_contrast_media_extensions_penIcon_svg__WEBPACK_IMPORTED_MODULE_1___default.a
  },
  text2speech: {
    blockIconURI: _high_contrast_media_extensions_text2speechIcon_svg__WEBPACK_IMPORTED_MODULE_2___default.a
  },
  translate: {
    blockIconURI: _high_contrast_media_extensions_translateIcon_svg__WEBPACK_IMPORTED_MODULE_3___default.a
  },
  videoSensing: {
    blockIconURI: _high_contrast_media_extensions_videoSensingIcon_svg__WEBPACK_IMPORTED_MODULE_4___default.a
  }
};
const clamp = (value, lower, upper) => Math.max(lower, Math.min(upper, value));
const customExtensionColors = {
  primary: _primary => {
    const hsv = Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hex2hsv"])(_primary);
    hsv[1] = clamp(hsv[1] - 20, 0, 50);
    hsv[2] = clamp(hsv[2] + 20, 80, 100);
    return Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hsv2hex"])(hsv);
  },
  secondary: primary => {
    const hsv = Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hex2hsv"])(primary);
    hsv[1] = clamp(hsv[1] - 40, 0, 50);
    hsv[2] = clamp(hsv[2] + 20, 80, 100);
    return Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hsv2hex"])(hsv);
  },
  tertiary: primary => {
    const hsv = Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hex2hsv"])(primary);
    hsv[2] = clamp(hsv[2] - 20, 0, 100);
    return Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hsv2hex"])(hsv);
  },
  quaternary: primary => {
    const hsv = Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hex2hsv"])(primary);
    hsv[1] = clamp(hsv[1] - 60, 0, 100);
    hsv[2] = clamp(hsv[2] + 20, 90, 100);
    return Object(_utils_color__WEBPACK_IMPORTED_MODULE_5__["hsv2hex"])(hsv);
  },
  categoryIconBackground: primary => customExtensionColors.primary(primary),
  categoryIconBorder: primary => customExtensionColors.tertiary(primary)
};


/***/ }),

/***/ "./src/lib/themes/blocks/three.js":
/*!****************************************!*\
  !*** ./src/lib/themes/blocks/three.js ***!
  \****************************************/
/*! exports provided: blockColors, extensions */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extensions", function() { return extensions; });
const blockColors = {
  motion: {
    primary: '#4C97FF',
    secondary: '#4280D7',
    tertiary: '#3373CC',
    quaternary: '#3373CC'
  },
  looks: {
    primary: '#9966FF',
    secondary: '#855CD6',
    tertiary: '#774DCB',
    quaternary: '#774DCB'
  },
  sounds: {
    primary: '#CF63CF',
    secondary: '#C94FC9',
    tertiary: '#BD42BD',
    quaternary: '#BD42BD'
  },
  control: {
    primary: '#FFAB19',
    secondary: '#EC9C13',
    tertiary: '#CF8B17',
    quaternary: '#CF8B17'
  },
  event: {
    primary: '#FFBF00',
    secondary: '#E6AC00',
    tertiary: '#CC9900',
    quaternary: '#CC9900'
  },
  sensing: {
    primary: '#5CB1D6',
    secondary: '#47A8D1',
    tertiary: '#2E8EB8',
    quaternary: '#2E8EB8'
  },
  pen: {
    primary: '#0fBD8C',
    secondary: '#0DA57A',
    tertiary: '#0B8E69',
    quaternary: '#0B8E69'
  },
  operators: {
    primary: '#59C059',
    secondary: '#46B946',
    tertiary: '#389438',
    quaternary: '#389438'
  },
  data: {
    primary: '#FF8C1A',
    secondary: '#FF8000',
    tertiary: '#DB6E00',
    quaternary: '#DB6E00'
  },
  // This is not a new category, but rather for differentiation
  // between lists and scalar variables.
  data_lists: {
    primary: '#FF661A',
    secondary: '#FF5500',
    tertiary: '#E64D00',
    quaternary: '#E64D00'
  },
  more: {
    primary: '#FF6680',
    secondary: '#FF4D6A',
    tertiary: '#FF3355',
    quaternary: '#FF3355'
  },
  addons: {
    primary: '#29beb8',
    secondary: '#3aa8a4',
    tertiary: '#3aa8a4',
    quaternary: '#3aa8a4'
  },
  patch: {
    primary: '#2DA4A0',
    secondary: '#66BDBA',
    tertiary: '#24827F',
    quaternary: '#1B615F'
  },
  text: '#FFFFFF',
  workspace: '#F9F9F9',
  toolboxHover: '#4C97FF',
  toolboxSelected: '#E9EEF2',
  toolboxText: '#575E75',
  toolbox: '#FFFFFF',
  blackText: '#575E75',
  flyout: '#F9F9F9',
  scrollbar: '#CECDCE',
  scrollbarHover: '#CECDCE',
  textField: '#FFFFFF',
  textFieldText: '#575E75',
  insertionMarker: '#000000',
  insertionMarkerOpacity: 0.2,
  dragShadowOpacity: 0.6,
  stackGlow: '#FFF200',
  stackGlowSize: 4,
  stackGlowOpacity: 1,
  replacementGlow: '#FFFFFF',
  replacementGlowSize: 2,
  replacementGlowOpacity: 1,
  colourPickerStroke: '#FFFFFF',
  // CSS colours: support RGBA
  fieldShadow: 'rgba(255, 255, 255, 0.3)',
  dropDownShadow: 'rgba(0, 0, 0, .3)',
  numPadBackground: '#547AB2',
  numPadBorder: '#435F91',
  numPadActiveBackground: '#435F91',
  numPadText: 'white',
  // Do not use hex here, it cannot be inlined with data-uri SVG
  valueReportBackground: '#FFFFFF',
  valueReportBorder: '#AAAAAA',
  valueReportForeground: '#000000',
  menuHover: 'rgba(0, 0, 0, 0.2)',
  contextMenuBackground: '#ffffff',
  contextMenuBorder: '#cccccc',
  contextMenuForeground: '#000000',
  contextMenuActiveBackground: '#d6e9f8',
  contextMenuDisabledForeground: '#cccccc',
  flyoutLabelColor: '#575E75',
  checkboxInactiveBackground: '#ffffff',
  checkboxInactiveBorder: '#c8c8c8',
  checkboxActiveBackground: '#4C97FF',
  checkboxActiveBorder: '#3373CC',
  checkboxCheck: '#ffffff',
  buttonBorder: '#c6c6c6',
  buttonActiveBackground: '#ffffff',
  buttonForeground: '#575E75',
  zoomIconFilter: 'none',
  gridColor: '#dddddd'
};
const extensions = {};


/***/ }),

/***/ "./src/lib/themes/custom-themes.js":
/*!*****************************************!*\
  !*** ./src/lib/themes/custom-themes.js ***!
  \*****************************************/
/*! exports provided: CustomTheme, CustomThemeManager, GradientUtils, customThemeManager */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CustomTheme", function() { return CustomTheme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CustomThemeManager", function() { return CustomThemeManager; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GradientUtils", function() { return GradientUtils; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "customThemeManager", function() { return customThemeManager; });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.js */ "./src/lib/themes/index.js");
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Custom theme management for Mistwarp
 * Handles creation, storage, and management of user-defined themes including custom gradients and accents
 */


const CUSTOM_THEMES_STORAGE_KEY = 'tw:custom-themes';
const MAX_CUSTOM_THEMES = 50; // Reasonable limit to prevent storage issues

/**
 * Utility functions for custom gradients and accent creation
 */
class GradientUtils {
  /**
   * Create a linear gradient CSS string from color stops
   * @param {Array} colorStops - Array of {color: string, position: number} objects
   * @param {number} direction - Gradient direction in degrees (default: 90 for horizontal)
   * @returns {string} CSS linear-gradient string
   */
  static createLinearGradient(colorStops) {
    let direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 90;
    if (!Array.isArray(colorStops) || colorStops.length < 2) {
      throw new Error('At least 2 color stops are required');
    }
    const sortedStops = colorStops.sort((a, b) => a.position - b.position).map(stop => "".concat(stop.color, " ").concat(stop.position, "%"));
    return "linear-gradient(".concat(direction, "deg, ").concat(sortedStops.join(', '), ")");
  }

  /**
   * Convert hex color to RGBA
   * @param {string} hex - Hex color string
   * @param {number} opacity - Opacity value (0-1)
   * @returns {string} RGBA color string
   */
  static hexToRgba(hex) {
    let opacity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    return "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(opacity, ")");
  }

  /**
   * Convert hex to HSL
   * @param {string} hex - Hex color string
   * @returns {object} HSL object {h, s, l}
   */
  static hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const l = (max + min) / 2;
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  /**
   * Convert HSL to hex
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {string} Hex color string
   */
  static hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r;
    let g;
    let b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = c => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0".concat(hex) : hex;
    };
    return "#".concat(toHex(r)).concat(toHex(g)).concat(toHex(b));
  }

  /**
   * Lighten a color by percentage
   * @param {string} hex - Hex color string
   * @param {number} percent - Percentage to lighten (0-100)
   * @returns {string} Lightened hex color
   */
  static lightenColor(hex, percent) {
    const hsl = this.hexToHsl(hex);
    hsl.l = Math.min(100, hsl.l + percent);
    return this.hslToHex(hsl.h, hsl.s, hsl.l);
  }

  /**
   * Darken a color by percentage
   * @param {string} hex - Hex color string
   * @param {number} percent - Percentage to darken (0-100)
   * @returns {string} Darkened hex color
   */
  static darkenColor(hex, percent) {
    const hsl = this.hexToHsl(hex);
    hsl.l = Math.max(0, hsl.l - percent);
    return this.hslToHex(hsl.h, hsl.s, hsl.l);
  }

  /**
   * Generate color variations for an accent theme
   * @param {string} baseColor - Base hex color
   * @returns {object} Color variations
   */
  static generateColorVariations(baseColor) {
    return {
      primary: baseColor,
      light: this.lightenColor(baseColor, 15),
      lighter: this.lightenColor(baseColor, 30),
      dark: this.darkenColor(baseColor, 15),
      darker: this.darkenColor(baseColor, 30),
      transparent: this.hexToRgba(baseColor, 0.35),
      lightTransparent: this.hexToRgba(baseColor, 0.15),
      mediumTransparent: this.hexToRgba(baseColor, 0.75)
    };
  }

  /**
   * Generate accent theme colors from a primary color
   * @param {string} primaryColor - Primary color (hex, rgb, hsl, etc.)
   * @param {object} options - Options for color generation
   * @returns {object} Generated accent colors
   */
  static generateAccentColors(primaryColor) {
    const variations = this.generateColorVariations(primaryColor);
    return {
      'motion-primary': variations.primary,
      'motion-primary-transparent': variations.mediumTransparent,
      'motion-tertiary': variations.dark,
      'looks-secondary': variations.primary,
      'looks-tertiary': variations.dark,
      'looks-transparent': variations.transparent,
      'looks-light-transparent': variations.lightTransparent,
      'looks-secondary-dark': variations.dark,
      'extensions-primary': variations.light,
      'extensions-tertiary': variations.lighter,
      'extensions-transparent': variations.transparent,
      'extensions-light': variations.lighter,
      'drop-highlight': variations.light
    };
  }

  /**
   * Create a custom gradient accent theme
   * @param {Array} colorStops - Gradient color stops
   * @param {string} primaryColor - Primary accent color
   * @param {object} options - Additional options
   * @returns {object} Custom accent theme object
   */
  static createGradientAccent(colorStops, primaryColor) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const baseColors = this.generateAccentColors(primaryColor, options);

    // Create a version with reduced opacity for menu bar background
    const gradientStopsWithOpacity = colorStops.map(stop => ({
      color: this.hexToRgba(stop.color, 0.8),
      position: stop.position
    }));
    const gradientWithOpacity = this.createLinearGradient(gradientStopsWithOpacity, options.direction || 90);
    return {
      guiColors: _objectSpread(_objectSpread({}, baseColors), {}, {
        'menu-bar-background-image': gradientWithOpacity
      }),
      blockColors: {
        checkboxActiveBackground: primaryColor,
        checkboxActiveBorder: this.darkenColor(primaryColor, 10)
      }
    };
  }

  /**
   * Generate complementary colors for color harmonies
   * @param {string} baseColor - Base hex color
   * @returns {object} Complementary color schemes
   */
  static generateColorHarmonies(baseColor) {
    const hsl = this.hexToHsl(baseColor);
    const complementary = this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
    const triadic1 = this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
    const triadic2 = this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l);
    const analogous1 = this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
    const analogous2 = this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l);
    return {
      complementary: [baseColor, complementary],
      triadic: [baseColor, triadic1, triadic2],
      analogous: [baseColor, analogous1, analogous2],
      monochromatic: [baseColor, this.lightenColor(baseColor, 20), this.darkenColor(baseColor, 20)]
    };
  }

  /**
   * Generate gradient presets
   * @returns {Array} Array of gradient presets
   */
  static getGradientPresets() {
    return [{
      name: 'Sunset',
      colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
      direction: 90
    }, {
      name: 'Ocean',
      colors: ['#667eea', '#764ba2', '#6dd5ed'],
      direction: 45
    }, {
      name: 'Forest',
      colors: ['#134e5e', '#71b280', '#a8e6cf'],
      direction: 135
    }, {
      name: 'Purple Rain',
      colors: ['#667eea', '#764ba2', '#f093fb'],
      direction: 90
    }, {
      name: 'Fire',
      colors: ['#ff416c', '#ff4b2b', '#ffb347'],
      direction: 45
    }, {
      name: 'Aurora',
      colors: ['#00c9ff', '#92fe9d', '#a8e6cf'],
      direction: 90
    }, {
      name: 'Space',
      colors: ['#2c3e50', '#4ca1af', '#c0392b'],
      direction: 180
    }, {
      name: 'Cherry',
      colors: ['#eb3349', '#f45c43', '#ff8a80'],
      direction: 90
    }];
  }

  /**
   * Create gradient from preset
   * @param {string} presetName - Name of the preset
   * @param {string} primaryColor - Primary color override (optional)
   * @returns {object} Gradient accent theme
   */
  static createPresetGradient(presetName) {
    let primaryColor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    const preset = this.getGradientPresets().find(p => p.name === presetName);
    if (!preset) {
      throw new Error("Gradient preset \"".concat(presetName, "\" not found"));
    }
    const colorStops = preset.colors.map((color, index) => ({
      color: color,
      position: index / (preset.colors.length - 1) * 100
    }));
    const primary = primaryColor || preset.colors[0];
    return this.createGradientAccent(colorStops, primary, {
      direction: preset.direction
    });
  }
}

/**
 * CustomTheme class extends Theme with additional metadata
 */
class CustomTheme extends _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"] {
  constructor(name, description, accent, gui, blocks, menuBarAlign, wallpaper, fonts) {
    let author = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 'User';
    // If accent is an object (custom gradient),
    // pass a default string to parent and store the custom accent separately
    const accentKey = typeof accent === 'object' ? 'red' : accent; // Default to 'red' as fallback
    super(accentKey, gui, blocks, menuBarAlign, wallpaper, fonts);

    /** @readonly */
    this.name = name;
    /** @readonly */
    this.description = description;
    /** @readonly */
    this.author = author;
    /** @readonly */
    this.createdAt = new Date().toISOString();
    /** @readonly */
    this.uuid = this.generateUUID();

    // Check if it's a full accent object (with guiColors)
    const isFullAccent = typeof accent === 'object' && accent.guiColors;
    this.customAccent = isFullAccent ? accent : null;

    // Store the original accent data (either gradient format or full accent object)
    this.originalAccent = accent;
  }
  generateUUID() {
    return "custom-theme-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
  }

  /**
   * Override getGuiColors to handle custom accent objects
   * @returns {object} GUI colors
   */
  getGuiColors() {
    if (this.customAccent) {
      // Use dynamic imports to avoid circular dependency issues
      const defaultsDeep = __webpack_require__(/*! lodash.defaultsdeep */ "./node_modules/lodash.defaultsdeep/index.js");

      // Get the base GUI colors directly without importing from index.js
      let baseGuiColors = {};
      try {
        baseGuiColors = _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_MAP"][this.gui].guiColors || {};
      } catch (e) {
        console.warn('Failed to load GUI theme modules:', e);
        // Fallback to basic colors if import fails
        baseGuiColors = {
          'color-scheme': 'light',
          'ui-primary': '#E5F0FF',
          'text-primary': '#575E75'
        };
      }

      // For custom accents, use the custom accent object directly
      const mergedColors = defaultsDeep({}, this.customAccent.guiColors || {}, baseGuiColors);
      return mergedColors;
    }

    // For standard accents, use the parent implementation
    return super.getGuiColors();
  }

  /**
   * @param {string} what - The property to change (e.g., 'gui', 'blocks', 'accent')
   * @param {*} to - The new value for the property
   * @returns {Theme|CustomTheme} A new theme instance with the updated property
   */
  set(what, to) {
    if (what === 'accent') {
      return super.set(what, to);
    }
    if (this.customAccent) {
      const next = {
        name: this.name,
        description: this.description,
        author: this.author,
        accent: this.customAccent,
        gui: this.gui,
        blocks: this.blocks,
        menuBarAlign: this.menuBarAlign,
        wallpaper: this.wallpaper,
        fonts: this.fonts
      };
      if (Object.prototype.hasOwnProperty.call(next, what)) {
        next[what] = to;
      } else if (what === 'name') {
        next.name = to;
      } else {
        return super.set(what, to);
      }
      return new CustomTheme(next.name, next.description, next.accent, next.gui, next.blocks, next.menuBarAlign, next.wallpaper, next.fonts, next.author);
    }
    return super.set(what, to);
  }

  /**
   * Override getBlockColors to handle custom accent objects
   * @returns {object} Block colors
   */
  getBlockColors() {
    if (this.customAccent) {
      // Use dynamic imports to avoid circular dependency issues
      const defaultsDeep = __webpack_require__(/*! lodash.defaultsdeep */ "./node_modules/lodash.defaultsdeep/index.js");

      // Get base block colors directly without importing from index.js
      let baseGuiColors = {};
      let baseBlockColors = {};
      try {
        // Import block theme modules directly
        if (this.blocks === 'high-contrast') {
          const blocksHighContrast = __webpack_require__(/*! ./blocks/high-contrast.js */ "./src/lib/themes/blocks/high-contrast.js");
          baseBlockColors = blocksHighContrast.blockColors || {};
        } else if (this.blocks === 'dark') {
          const blocksDark = __webpack_require__(/*! ./blocks/dark.js */ "./src/lib/themes/blocks/dark.js");
          baseBlockColors = blocksDark.blockColors || {};
        } else {
          const blocksThree = __webpack_require__(/*! ./blocks/three.js */ "./src/lib/themes/blocks/three.js");
          baseBlockColors = blocksThree.blockColors || {};
        }
        baseGuiColors = _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_MAP"][this.gui].blockColors || {};
      } catch (e) {
        console.warn('Failed to load block theme modules:', e);
        // Fallback to basic block colors if import fails
        baseBlockColors = {
          motion: {
            primary: '#4C97FF',
            secondary: '#4280D7',
            tertiary: '#3373CC'
          },
          looks: {
            primary: '#9966FF',
            secondary: '#855CD6',
            tertiary: '#774DCB'
          }
        };
      }

      // For custom accents, use the custom accent object directly
      const mergedColors = defaultsDeep({}, this.customAccent.blockColors || {}, baseGuiColors, baseBlockColors);
      return mergedColors;
    }

    // For standard accents, use the parent implementation
    return super.getBlockColors();
  }

  /**
   * Export theme to JSON format
   * @returns {object} Theme data
   */
  export() {
    const accentExport = this._exportGradient();
    return {
      uuid: this.uuid,
      createdAt: this.createdAt,
      name: this.name,
      description: this.description,
      author: this.author,
      accent: accentExport || null,
      gui: this.gui,
      blocks: this.blocks,
      menuBarAlign: this.menuBarAlign,
      wallpaper: this.wallpaper || {
        url: '',
        opacity: 0.3,
        darkness: 0,
        gridVisible: true,
        history: []
      },
      fonts: this.fonts || {
        system: [],
        google: [],
        history: []
      }
    };
  }

  /**
   * Convert OKLab to sRGB (0–255)
   * Based on Björn Ottosson's reference implementation
   * @param {number} L OKLab L component
   * @param {number} a OKLab a component
   * @param {number} b OKLab b component
   * @returns {object} An object of {r, g, b}
   */
  oklabToRgb(L, a, b) {
    // OKLab → LMS
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    // LMS → linear sRGB
    let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    // linear → gamma
    const compand = x => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    r = compand(r);
    g = compand(g);
    b2 = compand(b2);
    const clamp = v => Math.min(255, Math.max(0, Math.round(v * 255)));
    return {
      r: clamp(r),
      g: clamp(g),
      b: clamp(b2)
    };
  }

  /**
  * Export gradient accent to format
  * @returns {object} Gradient format
  */
  _exportGradient() {
    if (this.originalAccent && typeof this.originalAccent === 'object' && Array.isArray(this.originalAccent.colors)) {
      return this.originalAccent;
    }
    const menuBarImage = document.documentElement.style.getPropertyValue('--menu-bar-background-image');
    if (!menuBarImage) return null;
    const directionMatch = menuBarImage.match(/([\d.]+)deg/i);
    const direction = directionMatch ? directionMatch[1] : '90';
    const colorStops = [];

    // Match full color stop tokens (rgb/rgba/hex/oklab + optional position)
    const stops = menuBarImage.match(/(oklab\([^)]+\)|rgba?\([^)]+\)|#[a-fA-F0-9]{3,8})\s*([\d.]+%?)?/gi) || [];
    stops.forEach((stop, index) => {
      let color = null;
      let position = null;
      const rgbaMatch = stop.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)\s*([\d.]+)?%?/i);
      const hexMatch = stop.match(/#([a-fA-F0-9]{3,8})/);
      const oklabMatch = stop.match(/oklab\(\s*([+-]?[\d.]+)\s+([+-]?[\d.]+)\s+([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+))?\s*\)\s*([\d.]+)?%?/i);
      if (rgbaMatch) {
        const _rgbaMatch = _slicedToArray(rgbaMatch, 5),
          r = _rgbaMatch[1],
          g = _rgbaMatch[2],
          b = _rgbaMatch[3],
          pos = _rgbaMatch[4];
        color = "#".concat(parseInt(r, 10).toString(16).padStart(2, '0')).concat(parseInt(g, 10).toString(16).padStart(2, '0')).concat(parseInt(b, 10).toString(16).padStart(2, '0'));
        position = typeof pos === 'undefined' ? index / (stops.length - 1) * 100 : parseFloat(pos);
      } else if (hexMatch) {
        color = hexMatch[0];
        const posMatch = stop.match(/([\d.]+)%/);
        position = posMatch ? parseFloat(posMatch[1]) : index / (stops.length - 1) * 100;
      } else if (oklabMatch) {
        const _oklabMatch = _slicedToArray(oklabMatch, 6),
          L = _oklabMatch[1],
          A = _oklabMatch[2],
          B = _oklabMatch[3],
          _alpha = _oklabMatch[4],
          pos = _oklabMatch[5];
        const _this$oklabToRgb = this.oklabToRgb(parseFloat(L), parseFloat(A), parseFloat(B)),
          r = _this$oklabToRgb.r,
          g = _this$oklabToRgb.g,
          b = _this$oklabToRgb.b;
        color = "#".concat(r.toString(16).padStart(2, '0')).concat(g.toString(16).padStart(2, '0')).concat(b.toString(16).padStart(2, '0'));
        position = typeof pos === 'undefined' ? index / (stops.length - 1) * 100 : parseFloat(pos);
      }
      if (color !== null && position !== null) {
        colorStops.push({
          color,
          position
        });
      }
    });
    colorStops.sort((a, b) => a.position - b.position);
    return {
      colors: colorStops,
      direction: direction.toString()
    };
  }

  /**
   * Export standard accent to format
   * @param {string} accent - Standard accent color name
   * @returns {object} Standard accent format
   */
  _exportStandardAccent(accent) {
    return {
      type: 'standard',
      name: accent
    };
  }

  /**
   * Create CustomTheme from exported data
   * @param {object} data the inputted custom theme data
   * @returns {CustomTheme} the finished custom theme object
   */
  static import(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid theme data');
    }
    if (!data.name || !data.gui || !data.blocks) {
      throw new Error('Missing required theme properties');
    }
    let accentToUse = data.accent;

    // Handle null/undefined accent - create a default accent
    if (!accentToUse) {
      accentToUse = {
        guiColors: GradientUtils.generateAccentColors('#ff6b6b')
      };
    } else if (accentToUse && typeof accentToUse === 'object' && Array.isArray(accentToUse.colors)) {
      // Check if accent is in gradient format (colors array)
      const colors = accentToUse.colors;
      const direction = accentToUse.direction || '90';
      const primaryColor = colors[0] ? colors[0].color : '#ff6b6b';
      accentToUse = GradientUtils.createGradientAccent(colors, primaryColor, {
        direction
      });
    }
    const theme = new CustomTheme(data.name, data.description || '', accentToUse,
    // This will be the gradient object for custom themes
    data.gui, data.blocks, data.menuBarAlign, data.wallpaper, data.fonts, data.author || 'Unknown');

    // Preserve original UUID and creation date if available
    if (data.uuid) {
      Object.defineProperty(theme, 'uuid', {
        value: data.uuid,
        writable: false
      });
    }
    if (data.createdAt) {
      Object.defineProperty(theme, 'createdAt', {
        value: data.createdAt,
        writable: false
      });
    }
    return theme;
  }
}

/**
 * CustomThemeManager handles storage and management of custom themes
 */
class CustomThemeManager {
  constructor() {
    this.themes = new Map();
    this._listeners = new Set();
    this.loadCustomThemes();
  }
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
  _emitChange() {
    for (const listener of this._listeners) {
      try {
        listener();
      } catch (e) {
        // Ignore listener errors
      }
    }
  }

  /**
   * Load custom themes from localStorage
   */
  loadCustomThemes() {
    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      if (!stored) {
        console.log('No custom themes found in storage');
        return;
      }
      const themesData = JSON.parse(stored);
      if (!Array.isArray(themesData)) {
        console.warn('Invalid themes data format in storage - not an array');
        return;
      }
      console.log("Loading ".concat(themesData.length, " custom themes from storage"));
      let loadedCount = 0;
      for (const themeData of themesData) {
        try {
          const theme = CustomTheme.import(themeData);
          this.themes.set(theme.uuid, theme);
          loadedCount++;
        } catch (e) {
          console.warn("Failed to load custom theme \"".concat((themeData === null || themeData === void 0 ? void 0 : themeData.name) || 'unknown', "\":"), e);
        }
      }
      console.log("Successfully loaded ".concat(loadedCount, "/").concat(themesData.length, " custom themes"));
    } catch (e) {
      console.error('Failed to load custom themes from storage:', e);
    }
  }

  /**
   * Save custom themes to localStorage
   */
  saveCustomThemes() {
    try {
      const themesData = Array.from(this.themes.values()).map(theme => theme.export());
      if (themesData.length === 0) {
        localStorage.removeItem(CUSTOM_THEMES_STORAGE_KEY);
        console.log('Cleared custom themes storage (no themes)');
        this._emitChange();
        return;
      }
      const jsonString = JSON.stringify(themesData, null, 2);
      if (jsonString.length > 5 * 1024 * 1024) {
        console.warn('Theme data is very large (over 5MB), may cause storage issues');
      }
      localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, jsonString);
      console.log("Saved ".concat(themesData.length, " custom themes to storage (").concat(jsonString.length, " bytes)"));
      this._emitChange();
    } catch (e) {
      console.error('Failed to save custom themes to storage:', e);
      if (e.name === 'QuotaExceededError') {
        const currentData = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
        if (currentData) {
          localStorage.setItem("".concat(CUSTOM_THEMES_STORAGE_KEY, "_backup"), currentData);
        }
        throw new Error('Storage quota exceeded - try deleting some themes');
      }
      throw new Error("Failed to save themes: ".concat(e.message));
    }
  }

  /**
   * Add a new custom theme
   * @param {CustomTheme} theme a custom theme
   */
  addTheme(theme) {
    if (!(theme instanceof CustomTheme)) {
      throw new Error('Theme must be an instance of CustomTheme');
    }
    if (this.themes.size >= MAX_CUSTOM_THEMES) {
      throw new Error("Maximum number of custom themes (".concat(MAX_CUSTOM_THEMES, ") reached"));
    }

    // Check for duplicate names
    for (const existingTheme of this.themes.values()) {
      if (existingTheme.name === theme.name) {
        throw new Error("Theme with name \"".concat(theme.name, "\" already exists"));
      }
    }
    this.themes.set(theme.uuid, theme);
    this.saveCustomThemes();
  }

  /**
   * Remove a custom theme
   * @param {string} uuid the uuid of a custom theme
   * @returns {boolean} whether the deletion was successful
   */
  removeTheme(uuid) {
    if (this.themes.has(uuid)) {
      this.themes.delete(uuid);
      this.saveCustomThemes();
      return true;
    }
    return false;
  }

  /**
   * Get a custom theme by UUID
   * @param {string} uuid a custom theme uuid
   * @returns {CustomTheme|null} a custom theme
   */
  getTheme(uuid) {
    return this.themes.get(uuid) || null;
  }

  /**
   * Get all custom themes
   * @returns {CustomTheme[]} all custom themes
   */
  getAllThemes() {
    return Array.from(this.themes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Update an existing theme
   * @param {string} uuid a custom theme uuid
   * @param {object} updates an object of key value pairs to edit
   * @throws when the theme doesnt exist
   * @returns {CustomTheme} the updated custom theme
   */
  updateTheme(uuid, updates) {
    const existingTheme = this.themes.get(uuid);
    if (!existingTheme) {
      throw new Error('Theme not found');
    }

    // Create new theme with updates
    const updatedTheme = new CustomTheme(updates.name || existingTheme.name, typeof updates.description === 'undefined' ? existingTheme.description : updates.description, updates.accent || existingTheme.accent, updates.gui || existingTheme.gui, updates.blocks || existingTheme.blocks, updates.menuBarAlign || existingTheme.menuBarAlign, updates.wallpaper || existingTheme.wallpaper, updates.fonts || existingTheme.fonts, existingTheme.author);

    // Preserve original UUID and creation date
    Object.defineProperty(updatedTheme, 'uuid', {
      value: uuid,
      writable: false
    });
    Object.defineProperty(updatedTheme, 'createdAt', {
      value: existingTheme.createdAt,
      writable: false
    });
    this.themes.set(uuid, updatedTheme);
    this.saveCustomThemes();
    return updatedTheme;
  }

  /**
   * Update gradient for an existing custom theme
   * @param {string} uuid - Theme UUID
   * @param {Array} colorStops - New gradient color stops
   * @param {string} primaryColor - New primary accent color
   * @param {object} options - Additional options
   * @returns {CustomTheme} Updated theme
   */
  updateThemeGradient(uuid, colorStops, primaryColor) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    const existingTheme = this.themes.get(uuid);
    if (!existingTheme) {
      throw new Error('Theme not found');
    }

    // Generate new gradient accent
    const gradientAccent = GradientUtils.createGradientAccent(colorStops, primaryColor, options);

    // Create updated theme with new gradient
    const updatedTheme = new CustomTheme(existingTheme.name, existingTheme.description, gradientAccent,
    // Updated gradient accent
    existingTheme.gui, existingTheme.blocks, existingTheme.menuBarAlign, existingTheme.wallpaper, existingTheme.fonts, existingTheme.author);

    // Preserve original UUID and creation date
    Object.defineProperty(updatedTheme, 'uuid', {
      value: uuid,
      writable: false
    });
    Object.defineProperty(updatedTheme, 'createdAt', {
      value: existingTheme.createdAt,
      writable: false
    });
    this.themes.set(uuid, updatedTheme);
    this.saveCustomThemes();
    return updatedTheme;
  }

  /**
   * Check if a theme has a custom gradient
   * @param {string} uuid - Theme UUID
   * @returns {boolean} True if theme has custom gradient
   */
  hasCustomGradient(uuid) {
    const theme = this.themes.get(uuid);
    return theme && theme.customAccent && theme.customAccent.guiColors && theme.customAccent.guiColors['menu-bar-background-image'];
  }

  /**
   * Convert RGBA color to hex
   * @param {string} rgba - RGBA color string like "rgba(255, 107, 107, 0.8)"
   * @returns {string} Hex color string
   */
  rgbaToHex(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return rgba; // Return original if not RGBA format

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const toHex = n => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0".concat(hex) : hex;
    };
    return "#".concat(toHex(r)).concat(toHex(g)).concat(toHex(b));
  }

  /**
   * Extract gradient information from a custom theme
   * @param {string} uuid - Theme UUID
   * @returns {object|null} Gradient information or null if not a gradient theme
   */
  getThemeGradientInfo(uuid) {
    const theme = this.themes.get(uuid);
    if (!theme || !this.hasCustomGradient(uuid)) {
      return null;
    }
    const gradientString = theme.customAccent.guiColors['menu-bar-background-image'];

    // Try to parse the gradient string to extract colors and direction
    const gradientMatch = gradientString.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
    if (!gradientMatch) {
      return null;
    }
    const direction = parseInt(gradientMatch[1], 10);
    const colorString = gradientMatch[2];

    // Parse color stops using a more sophisticated approach
    const colorStops = [];

    // Split the color string by looking for patterns that start with rgba( or #
    // This handles the comma issue within RGBA values
    const stopPattern = /(?:rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)\s*[\d.]*%?|#[a-fA-F0-9]{3,8}\s*[\d.]*%?)/g;
    const stopMatches = colorString.match(stopPattern);
    if (!stopMatches) {
      return null;
    }
    stopMatches.forEach((stopString, index) => {
      let color;
      let position;

      // Clean up the stop string
      stopString = stopString.trim();

      // Check for RGBA format: rgba(255, 107, 107, 0.8) 50%
      const rgbaMatch = stopString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)\s*([\d.]+)%?/);
      if (rgbaMatch) {
        const _rgbaMatch2 = _slicedToArray(rgbaMatch, 5),
          r = _rgbaMatch2[1],
          g = _rgbaMatch2[2],
          b = _rgbaMatch2[3],
          pos = _rgbaMatch2[4];
        const rHex = parseInt(r, 10).toString(16).padStart(2, '0');
        const gHex = parseInt(g, 10).toString(16).padStart(2, '0');
        const bHex = parseInt(b, 10).toString(16).padStart(2, '0');
        color = "#".concat(rHex).concat(gHex).concat(bHex);
        position = pos ? parseFloat(pos) : index / (stopMatches.length - 1) * 100;
      } else {
        // Check for hex format: #ff6b6b 50%
        const hexMatch = stopString.match(/#([a-fA-F0-9]{3,8})/);
        const posMatch = stopString.match(/([\d.]+)%/);
        if (hexMatch) {
          color = hexMatch[0];
          // Ensure 6-digit hex
          if (color.length === 4) {
            color = "#".concat(color[1]).concat(color[1]).concat(color[2]).concat(color[2]).concat(color[3]).concat(color[3]);
          }
        } else {
          color = '#000000'; // fallback
        }
        position = posMatch ? parseFloat(posMatch[1]) : index / (stopMatches.length - 1) * 100;
      }
      colorStops.push({
        color,
        position
      });
    });

    // Sort color stops by position
    colorStops.sort((a, b) => a.position - b.position);

    // Try to extract primary color from accent colors
    let primaryColor = '#ff6b6b'; // fallback
    if (theme.customAccent.guiColors['motion-primary']) {
      primaryColor = theme.customAccent.guiColors['motion-primary'];
    }

    // If we have color stops, use the first one as primary color
    if (colorStops.length > 0) {
      primaryColor = colorStops[0].color;
    }
    return {
      colorStops,
      direction,
      primaryColor,
      gradientString
    };
  }

  /**
   * Export all custom themes
   * @returns {object} all your custom themes
   */
  exportAllThemes() {
    const themes = this.getAllThemes().map(theme => theme.export());
    return {
      version: '2.0',
      platform: 'MistWarp',
      timestamp: Date.now(),
      themes: themes
    };
  }

  /**
   * Import themes from exported data
   * @param {object} data your custom theme json file
   * @param {boolean} overwrite Whether to overwrite existing themes with same name
   * @returns {object} Import results
   */
  importThemes(data) {
    let overwrite = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    const isPlainObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    const looksLikeNitroboltTheme = obj => isPlainObject(obj) && typeof obj.name === 'string' && (typeof obj.isGradient === 'boolean' || isPlainObject(obj.gradient) || obj.gradient === null) && (typeof obj.primaryColor === 'string' || typeof obj.secondaryColor === 'string' || typeof obj.tertiaryColor === 'string');
    const toNumberOrNull = value => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return null;
    };
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const importNitroboltTheme = nitrobolt => {
      const name = (nitrobolt.name || '').trim();
      if (!name) throw new Error('Theme name is required');
      const description = '';

      // Nitrobolt format provides a few colors; treat primary as the accent base.
      const primaryColor = typeof nitrobolt.primaryColor === 'string' ? nitrobolt.primaryColor : '#ff6b6b';
      const gradient = nitrobolt.gradient;
      const hasGradient = Boolean(nitrobolt.isGradient) && isPlainObject(gradient) && Array.isArray(gradient.colors);
      let accent;
      if (hasGradient) {
        const directionRaw = toNumberOrNull(gradient.direction);
        const direction = directionRaw === null ? 90 : directionRaw;
        const colorStops = gradient.colors.filter(stop => stop && typeof stop.color === 'string').map(stop => {
          const pos = toNumberOrNull(stop.position);
          return {
            color: stop.color,
            position: pos === null ? 0 : clamp(pos, 0, 100)
          };
        }).sort((a, b) => a.position - b.position);
        if (colorStops.length < 2) {
          throw new Error('Gradient themes must have at least 2 color stops');
        }
        accent = GradientUtils.createGradientAccent(colorStops, primaryColor, {
          direction
        });
      } else {
        // No gradient (or gradient is null/missing): keep default GUI theme background.
        accent = {
          guiColors: GradientUtils.generateAccentColors(primaryColor),
          blockColors: {
            checkboxActiveBackground: primaryColor,
            checkboxActiveBorder: GradientUtils.darkenColor(primaryColor, 10)
          }
        };
      }
      return new CustomTheme(name, description, accent, 'light', 'three', 'left', null, null);
    };
    let themesToImport;
    if (data && Array.isArray(data.themes)) {
      themesToImport = data.themes.map(t => ({
        kind: 'mistwarp',
        data: t
      }));
    } else if (Array.isArray(data) && data.every(looksLikeNitroboltTheme)) {
      themesToImport = data.map(t => ({
        kind: 'nitrobolt',
        data: t
      }));
    } else if (looksLikeNitroboltTheme(data)) {
      themesToImport = [{
        kind: 'nitrobolt',
        data
      }];
    } else {
      throw new Error('Invalid import data format');
    }
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    for (const entry of themesToImport) {
      try {
        const theme = entry.kind === 'mistwarp' ? CustomTheme.import(entry.data) : importNitroboltTheme(entry.data);

        // Check for existing theme with same name
        const existingTheme = Array.from(this.themes.values()).find(t => t.name === theme.name);
        if (existingTheme && !overwrite) {
          results.skipped++;
          continue;
        }
        if (existingTheme && overwrite) {
          this.removeTheme(existingTheme.uuid);
        }
        this.addTheme(theme);
        results.imported++;
      } catch (e) {
        const themeName = entry && entry.data && entry.data.name ? entry.data.name : 'Unknown';
        results.errors.push("Failed to import theme \"".concat(themeName, "\": ").concat(e.message));
      }
    }
    return results;
  }

  /**
   * Clear all custom themes
   */
  clearAllThemes() {
    this.themes.clear();
    try {
      localStorage.removeItem(CUSTOM_THEMES_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear custom themes storage:', e);
    }
  }

  /**
   * Create a custom theme from current theme
   * @param {Theme} currentTheme the current theme
   * @param {string} name the name for the new theme
   * @param {string} description the description for the new theme
   * @returns {CustomTheme} the new custom theme
   */
  createFromCurrentTheme(currentTheme, name) {
    let description = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    if (!name || typeof name !== 'string') {
      throw new Error('Theme name is required');
    }
    const customTheme = new CustomTheme(name.trim(), description.trim(), currentTheme.accent, currentTheme.gui, currentTheme.blocks, currentTheme.menuBarAlign, currentTheme.wallpaper, currentTheme.fonts);
    this.addTheme(customTheme);
    return customTheme;
  }

  /**
   * Create a custom gradient theme
   * @param {string} name - Theme name
   * @param {string} description - Theme description
   * @param {Array} colorStops - Gradient color stops
   * @param {string} primaryColor - Primary accent color
   * @param {object} options - Additional options
   * @param {Theme} baseTheme - Base theme for GUI and block settings
   * @returns {CustomTheme} the new theme
   */
  createGradientTheme(name, description, colorStops, primaryColor) {
    let options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    let baseTheme = arguments.length > 5 ? arguments[5] : undefined;
    if (!name || typeof name !== 'string') {
      throw new Error('Theme name is required');
    }

    // Generate gradient accent
    const gradientAccent = GradientUtils.createGradientAccent(colorStops, primaryColor, options);
    const customTheme = new CustomTheme(name.trim(), description.trim(), gradientAccent,
    // Custom gradient accent
    (baseTheme === null || baseTheme === void 0 ? void 0 : baseTheme.gui) || 'light', (baseTheme === null || baseTheme === void 0 ? void 0 : baseTheme.blocks) || 'three', (baseTheme === null || baseTheme === void 0 ? void 0 : baseTheme.menuBarAlign) || 'left', (baseTheme === null || baseTheme === void 0 ? void 0 : baseTheme.wallpaper) || null, (baseTheme === null || baseTheme === void 0 ? void 0 : baseTheme.fonts) || null);
    this.addTheme(customTheme);
    return customTheme;
  }

  /**
   * Get storage diagnostics
   * @returns {object} Storage information
   */
  getStorageInfo() {
    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
      const size = stored ? new Blob([stored]).size : 0;
      const parsed = stored ? JSON.parse(stored) : [];
      return {
        hasData: Boolean(stored),
        themeCount: Array.isArray(parsed) ? parsed.length : 0,
        dataSize: size,
        dataSizeFormatted: "".concat((size / 1024).toFixed(2), " KB"),
        isValid: Array.isArray(parsed),
        quotaEstimate: {
          used: size,
          total: 5 * 1024 * 1024,
          percentage: (size / (5 * 1024 * 1024) * 100).toFixed(2)
        }
      };
    } catch (e) {
      return {
        error: e.message,
        hasData: !!localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY)
      };
    }
  }
}

// Singleton instance
const customThemeManager = new CustomThemeManager();


/***/ }),

/***/ "./src/lib/themes/fonts.js":
/*!*********************************!*\
  !*** ./src/lib/themes/fonts.js ***!
  \*********************************/
/*! exports provided: applyThemeFonts, removeThemeFonts, getFontFamilyString */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyThemeFonts", function() { return applyThemeFonts; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeThemeFonts", function() { return removeThemeFonts; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getFontFamilyString", function() { return getFontFamilyString; });
/* harmony import */ var _google_fonts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./google-fonts */ "./src/lib/themes/google-fonts.js");
/**
 * Font management utility for applying theme fonts to the document
 */


let currentFontStyleElement = null;
const DEFAULT_FALLBACK_STACK = ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'];
const setCurrentFontStyleEl = element => {
  currentFontStyleElement = element;
};

/**
 * Apply theme fonts to the document
 * @param {object} fonts - The fonts object from theme
 * @param {Array} fonts.google - Array of Google Font names
 * @param {Array} fonts.system - Array of system font names
 */
const applyThemeFonts = async fonts => {
  var _fonts$google, _fonts$google2, _fonts$system;
  const existingStyleEl = document.getElementById('theme-fonts');
  if (existingStyleEl) {
    existingStyleEl.remove();
  }

  // Remove existing font styles
  if (currentFontStyleElement) {
    currentFontStyleElement.remove();
    setCurrentFontStyleEl(null);
  }

  // Load Google Fonts first
  if (fonts !== null && fonts !== void 0 && (_fonts$google = fonts.google) !== null && _fonts$google !== void 0 && _fonts$google.length) {
    await Promise.all(fonts.google.map(fontName => Object(_google_fonts__WEBPACK_IMPORTED_MODULE_0__["loadGoogleFont"])(fontName, ['400', '700'])));
  }

  // Create CSS for theme fonts
  const fontStack = [];

  // Add Google Fonts first (they have priority)
  if (fonts !== null && fonts !== void 0 && (_fonts$google2 = fonts.google) !== null && _fonts$google2 !== void 0 && _fonts$google2.length) {
    fontStack.push(...fonts.google.map(font => "\"".concat(font, "\"")));
  }

  // Add system fonts
  if (fonts !== null && fonts !== void 0 && (_fonts$system = fonts.system) !== null && _fonts$system !== void 0 && _fonts$system.length) {
    fontStack.push(...fonts.system.map(font => "\"".concat(font, "\"")));
  }

  // Add fallback fonts
  fontStack.push(...DEFAULT_FALLBACK_STACK);
  const fontFamily = fontStack.join(', ');

  // Create style element
  const newFontStyleElement = document.createElement('style');
  newFontStyleElement.id = 'theme-fonts';
  newFontStyleElement.textContent = "\n        /* Theme Fonts - High Priority Overrides */\n        *:not([class^=\"paint-editor_text-area_\"]) {\n            font-family: var(--theme-font, ".concat(fontFamily, ") !important;\n        }\n\n        /* Ensure key UI elements inherit correctly */\n        body, html,\n        .gui, \n        .blocklySvg,\n        [class*=\"gui_\"],\n        [class*=\"menu-bar_\"],\n        [class*=\"settings-menu_\"],\n        [class*=\"blocklyText\"],\n        .blocklyText,\n        .blocklyHtmlInput,\n        button, input, textarea, select,\n        .menu-bar, .menu-item {\n            font-family: inherit !important;\n        }\n        \n        /* SVG text elements in Blockly */\n        text, tspan {\n            font-family: ").concat(fontFamily, " !important;\n        }\n    ");
  setCurrentFontStyleEl(newFontStyleElement);
  document.head.appendChild(currentFontStyleElement);
};

/**
 * Remove theme fonts from the document
 */
const removeThemeFonts = () => {
  const existingStyleEl = document.getElementById('theme-fonts');
  if (existingStyleEl) {
    existingStyleEl.remove();
  }
  if (currentFontStyleElement) {
    currentFontStyleElement.remove();
    setCurrentFontStyleEl(null);
  }
};

/**
 * Get the current font stack as a CSS font-family string
 * @param {object} fonts - The fonts object from theme
 * @returns {string} CSS font-family string
 */
const getFontFamilyString = fonts => {
  var _fonts$google3, _fonts$system2, _fonts$google4, _fonts$system3;
  if (!fonts || !((_fonts$google3 = fonts.google) !== null && _fonts$google3 !== void 0 && _fonts$google3.length) && !((_fonts$system2 = fonts.system) !== null && _fonts$system2 !== void 0 && _fonts$system2.length)) {
    return DEFAULT_FALLBACK_STACK.join(', ');
  }
  const fontStack = [];
  if ((_fonts$google4 = fonts.google) !== null && _fonts$google4 !== void 0 && _fonts$google4.length) {
    fontStack.push(...fonts.google.map(font => "\"".concat(font, "\"")));
  }
  if ((_fonts$system3 = fonts.system) !== null && _fonts$system3 !== void 0 && _fonts$system3.length) {
    fontStack.push(...fonts.system.map(font => "\"".concat(font, "\"")));
  }
  fontStack.push(...DEFAULT_FALLBACK_STACK);
  return fontStack.join(', ');
};


/***/ }),

/***/ "./src/lib/themes/global-styles.css":
/*!******************************************!*\
  !*** ./src/lib/themes/global-styles.css ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(/*! !../../../node_modules/css-loader??ref--5-1!../../../node_modules/postcss-loader/src??postcss!./global-styles.css */ "./node_modules/css-loader/index.js?!./node_modules/postcss-loader/src/index.js?!./src/lib/themes/global-styles.css");

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! ../../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./src/lib/themes/google-fonts.js":
/*!****************************************!*\
  !*** ./src/lib/themes/google-fonts.js ***!
  \****************************************/
/*! exports provided: loadGoogleFont, getGoogleFontsList, searchGoogleFonts, isGoogleFont, getPopularGoogleFonts, removeGoogleFont */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(process) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadGoogleFont", function() { return loadGoogleFont; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getGoogleFontsList", function() { return getGoogleFontsList; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "searchGoogleFonts", function() { return searchGoogleFonts; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isGoogleFont", function() { return isGoogleFont; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPopularGoogleFonts", function() { return getPopularGoogleFonts; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeGoogleFont", function() { return removeGoogleFont; });
/**
 * Google Fonts integration utility
 */

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY || 'demo'; // Can be set via environment
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';
const GOOGLE_FONTS_METADATA_URL = 'https://fonts.google.com/metadata/fonts';

// Popular Google Fonts list for quick selection
const POPULAR_GOOGLE_FONTS = ['Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Source Sans Pro', 'Roboto Condensed', 'Oswald', 'Raleway', 'Nunito', 'Ubuntu', 'Playfair Display', 'Merriweather', 'PT Sans', 'Poppins', 'Fira Sans', 'Work Sans', 'Roboto Slab', 'Crimson Text', 'Droid Sans', 'Libre Baskerville'];
let fontsCache = null;
let loadingPromise = null;
const normalizeFamily = fontFamily => (fontFamily || '').trim();
const encodeCss2Family = fontFamily => encodeURIComponent(normalizeFamily(fontFamily)).replace(/%20/g, '+');
const uniqSortedWeights = weights => {
  const normalized = (weights || []).map(w => String(w).trim()).filter(Boolean).map(w => w === 'regular' ? '400' : w);
  return [...new Set(normalized)].sort((a, b) => Number(a) - Number(b));
};
const buildCss2AxisSpecifier = (weights, _ref) => {
  let includeItalic = _ref.includeItalic;
  const w = uniqSortedWeights(weights);
  const fallback = w.length ? w : ['400', '700'];
  if (includeItalic) {
    const entries = [];
    for (const weight of fallback) {
      entries.push("0,".concat(weight));
    }
    for (const weight of fallback) {
      entries.push("1,".concat(weight));
    }
    return "ital,wght@".concat(entries.join(';'));
  }
  return "wght@".concat(fallback.join(';'));
};
const getOrCreateGoogleFontLink = fontFamily => {
  const family = normalizeFamily(fontFamily);
  const existing = document.querySelector("link[data-google-font=\"".concat(CSS.escape(family), "\"]"));
  if (existing) return existing;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute('data-google-font', family);
  document.head.appendChild(link);
  return link;
};
const fetchGoogleFontsMetadata = async () => {
  const response = await fetch(GOOGLE_FONTS_METADATA_URL);
  if (!response.ok) {
    throw new Error("Google Fonts metadata error: ".concat(response.status));
  }
  const text = await response.text();
  const jsonText = text.replace(/^\)\]\}'\n/, '');
  const data = JSON.parse(jsonText);
  const list = data.familyMetadataList || [];
  return list.map(item => ({
    family: item.family,
    category: item.category || 'sans-serif',
    variants: item.fonts ? Object.keys(item.fonts) : []
  }));
};

/**
 * Load a Google Font by adding a link tag to the document head
 * @param {string} fontFamily - The font family name
 * @param {string[]} weightsOrOptions - Array of font weights (e.g., ['400', '700'])
 * @returns {undefined}
 */
const loadGoogleFont = (fontFamily, weightsOrOptions) => new Promise((resolve, reject) => {
  const family = normalizeFamily(fontFamily);
  if (!family) {
    resolve();
    return;
  }

  // Back-compat: second arg used to be an array of weights
  const includeItalic = !weightsOrOptions || Array.isArray(weightsOrOptions) ? true : weightsOrOptions.includeItalic !== false;
  const weights = Array.isArray(weightsOrOptions) ? weightsOrOptions : weightsOrOptions && weightsOrOptions.weights;
  const familyParam = encodeCss2Family(family);
  const axis = buildCss2AxisSpecifier(weights, {
    includeItalic
  });
  const url = "https://fonts.googleapis.com/css2?family=".concat(familyParam, ":").concat(axis, "&display=swap");
  const link = getOrCreateGoogleFontLink(family);
  if (link.href === url) {
    resolve();
    return;
  }
  link.onload = () => resolve();
  link.onerror = () => reject(new Error("Failed to load font: ".concat(family)));
  link.href = url;
});

/**
 * Get list of available Google Fonts
 * @returns {Promise<Array>} Array of font objects with family, category, variants
 */
const getGoogleFontsList = () => {
  if (fontsCache) {
    return fontsCache;
  }
  if (loadingPromise) {
    return loadingPromise;
  }
  loadingPromise = (async () => {
    try {
      // If no API key, fall back to the public metadata endpoint (no key required).
      if (GOOGLE_FONTS_API_KEY === 'demo') {
        try {
          fontsCache = await fetchGoogleFontsMetadata();
          return fontsCache;
        } catch (error) {
          // If metadata fetch fails (offline/CSP/etc.), fall back to popular fonts.
          fontsCache = POPULAR_GOOGLE_FONTS.map(family => ({
            family,
            category: 'sans-serif',
            variants: ['regular', '700']
          }));
          return fontsCache;
        }
      }
      const response = await fetch("".concat(GOOGLE_FONTS_API_URL, "?key=").concat(GOOGLE_FONTS_API_KEY, "&sort=popularity"));
      if (!response.ok) {
        throw new Error("Google Fonts API error: ".concat(response.status));
      }
      const data = await response.json();
      fontsCache = data.items || [];
      return fontsCache;
    } catch (error) {
      console.warn('Failed to load Google Fonts list, using popular fonts:', error);
      // Fallback to popular fonts
      fontsCache = POPULAR_GOOGLE_FONTS.map(family => ({
        family,
        category: 'sans-serif',
        variants: ['regular', '700']
      }));
      return fontsCache;
    }
  })();
  return loadingPromise;
};

/**
 * Search Google Fonts by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Filtered array of font objects
 */
const searchGoogleFonts = async query => {
  const fonts = await getGoogleFontsList();
  const lowercaseQuery = query.toLowerCase();
  return fonts.filter(font => font.family.toLowerCase().includes(lowercaseQuery)).slice(0, 10); // Limit results
};

/**
 * Check if a font is a Google Font
 * @param {string} fontFamily - Font family name
 * @returns {boolean} if a font family is on google fonts
 */
const isGoogleFont = async fontFamily => {
  const fonts = await getGoogleFontsList();
  return fonts.some(font => font.family.toLowerCase() === fontFamily.toLowerCase());
};

/**
 * Get popular Google Fonts for quick selection
 * @returns {Array<string>} Array of popular font family names
 */
const getPopularGoogleFonts = () => [...POPULAR_GOOGLE_FONTS];

/**
 * Remove a Google Font from the document
 * @param {string} fontFamily - The font family name to remove
 */
const removeGoogleFont = fontFamily => {
  const family = normalizeFamily(fontFamily);
  const existingLink = family ? document.querySelector("link[data-google-font=\"".concat(CSS.escape(family), "\"]")) : null;
  if (existingLink) {
    existingLink.remove();
  }
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./src/lib/themes/gui.js":
/*!*******************************!*\
  !*** ./src/lib/themes/gui.js ***!
  \*******************************/
/*! exports provided: GUI_MAP, GUI_DEFAULT */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GUI_MAP", function() { return GUI_MAP; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GUI_DEFAULT", function() { return GUI_DEFAULT; });
/* harmony import */ var _gui_light__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gui/light */ "./src/lib/themes/gui/light.js");
/* harmony import */ var _gui_dark__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./gui/dark */ "./src/lib/themes/gui/dark.js");
/* harmony import */ var _gui_midnight__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./gui/midnight */ "./src/lib/themes/gui/midnight.js");
// This file defines all GUI themes available in the Scratch GUI

// The GUI pulls from here, you only need to update this file to add a new GUI theme




const GUI_LIGHT = 'light';
const GUI_DARK = 'dark';
const GUI_MIDNIGHT = 'midnight';
const GUI_MAP = {
  [GUI_LIGHT]: _gui_light__WEBPACK_IMPORTED_MODULE_0__,
  [GUI_DARK]: _gui_dark__WEBPACK_IMPORTED_MODULE_1__,
  [GUI_MIDNIGHT]: _gui_midnight__WEBPACK_IMPORTED_MODULE_2__
};
const GUI_DEFAULT = GUI_LIGHT;


/***/ }),

/***/ "./src/lib/themes/gui/dark.js":
/*!************************************!*\
  !*** ./src/lib/themes/gui/dark.js ***!
  \************************************/
/*! exports provided: name, icon, guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "name", function() { return name; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
/* harmony import */ var _raw_loader_icons_dark_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !raw-loader!../icons/dark.svg */ "./node_modules/raw-loader/index.js!./src/lib/themes/icons/dark.svg");
/* harmony import */ var _raw_loader_icons_dark_svg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_icons_dark_svg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony reexport (default from non-harmony) */ __webpack_require__.d(__webpack_exports__, "icon", function() { return _raw_loader_icons_dark_svg__WEBPACK_IMPORTED_MODULE_0___default.a; });

const name = 'Dark';
const guiColors = {
  'color-scheme': 'dark',
  'ui-primary': '#111111',
  'ui-secondary': '#1e1e1e',
  'ui-tertiary': '#2e2e2e',
  'ui-modal-overlay': '#333333aa',
  'ui-modal-background': '#111111',
  'ui-modal-foreground': '#eeeeee',
  'ui-modal-header-background': '#333333',
  'ui-modal-header-foreground': '#ffffff',
  'ui-white': '#111111',
  'ui-black-transparent': '#ffffff26',
  'text-primary': '#eeeeee',
  'menu-bar-background': '#333333',
  'assets-background': '#111111',
  'input-background': '#1e1e1e',
  'popover-background': '#1e1e1e',
  'badge-background': '#16202c',
  'badge-border': '#203652',
  'fullscreen-background': '#111111',
  'fullscreen-accent': '#111111',
  'page-background': '#111111',
  'page-foreground': '#eeeeee',
  'project-title-inactive': 'var(--ui-secondary)',
  'project-title-hover': '#ffffff3f',
  'link-color': '#44aaff',
  'filter-icon-black': 'invert(100%)',
  'filter-icon-gray': 'grayscale(100%) brightness(1.7)',
  'filter-icon-white': 'brightness(0) invert(100%)',
  'paint-filter-icon-gray': 'brightness(1.7)'
};
const blockColors = {
  insertionMarker: '#cccccc',
  workspace: '#1e1e1e',
  toolboxSelected: '#1e1e1e',
  toolboxText: '#cccccc',
  toolbox: '#111111',
  flyout: '#111111',
  scrollbar: '#666666',
  valueReportBackground: '#1e1e1e',
  valueReportBorder: '#333333',
  valueReportForeground: '#eeeeee',
  contextMenuBackground: '#111111',
  contextMenuBorder: '#ffffff26',
  contextMenuForeground: '#eeeeee',
  contextMenuActiveBackground: '#2e2e2e',
  contextMenuDisabledForeground: '#666666',
  flyoutLabelColor: '#cccccc',
  checkboxInactiveBackground: '#222222',
  checkboxInactiveBorder: '#c8c8c8',
  buttonBorder: '#c6c6c6',
  buttonActiveBackground: '#222222',
  buttonForeground: '#cccccc',
  zoomIconFilter: 'invert(100%)',
  gridColor: '#484848'
};


/***/ }),

/***/ "./src/lib/themes/gui/light.js":
/*!*************************************!*\
  !*** ./src/lib/themes/gui/light.js ***!
  \*************************************/
/*! exports provided: name, icon, guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "name", function() { return name; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
/* harmony import */ var _raw_loader_icons_light_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !raw-loader!../icons/light.svg */ "./node_modules/raw-loader/index.js!./src/lib/themes/icons/light.svg");
/* harmony import */ var _raw_loader_icons_light_svg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_icons_light_svg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony reexport (default from non-harmony) */ __webpack_require__.d(__webpack_exports__, "icon", function() { return _raw_loader_icons_light_svg__WEBPACK_IMPORTED_MODULE_0___default.a; });

const name = 'Light';
const guiColors = {
  'color-scheme': 'light',
  'ui-primary': 'hsla(215, 100%, 95%, 1)',
  /* #E5F0FF */
  'ui-secondary': 'hsla(215, 75%, 95%, 1)',
  /* #E9F1FC */
  'ui-tertiary': 'hsla(215, 50%, 90%, 1)',
  /* #D9E3F2 */

  'ui-modal-overlay': 'var(--motion-primary-transparent)',
  'ui-modal-background': 'hsla(0, 100%, 100%, 1)',
  /* #FFFFFF */
  'ui-modal-foreground': 'hsla(225, 15%, 40%, 1)',
  /* #575E75 */
  'ui-modal-header-background': 'var(--looks-secondary)',
  'ui-modal-header-foreground': 'hsla(0, 100%, 100%, 1)',
  /* #FFFFFF */

  'ui-white': 'hsla(0, 100%, 100%, 1)',
  /* #FFFFFF */
  'ui-white-dim': 'hsla(0, 100%, 100%, 0.75)',
  /* 25% transparent version of ui-white */
  'ui-white-transparent': 'hsla(0, 100%, 100%, 0.25)',
  /* 25% transparent version of ui-white */
  'ui-transparent': 'hsla(0, 100%, 100%, 0)',
  /* 25% transparent version of ui-white */

  'ui-black-transparent': 'hsla(0, 0%, 0%, 0.15)',
  /* 15% transparent version of black */

  'text-primary': 'hsla(225, 15%, 40%, 1)',
  /* #575E75 */
  'text-primary-transparent': 'hsla(225, 15%, 40%, 0.75)',
  'red-primary': 'hsla(20, 100%, 55%, 1)',
  /* #FF661A */
  'red-tertiary': 'hsla(20, 100%, 45%, 1)',
  /* #E64D00 */

  'sound-primary': 'hsla(300, 53%, 60%, 1)',
  /* #CF63CF */
  'sound-tertiary': 'hsla(300, 48%, 50%, 1)',
  /* #BD42BD */

  'control-primary': 'hsla(38, 100%, 55%, 1)',
  /* #FFAB19 */

  'data-primary': 'hsla(30, 100%, 55%, 1)',
  /* #FF8C1A */

  'pen-primary': 'hsla(163, 85%, 40%, 1)',
  /* #0FBD8C */
  'pen-transparent': 'hsla(163, 85%, 40%, 0.25)',
  /* #0FBD8C */
  'pen-tertiary': 'hsla(163, 86%, 30%, 1)',
  /* #0B8E69 */

  'error-primary': 'hsla(30, 100%, 55%, 1)',
  /* #FF8C1A */
  'error-light': 'hsla(30, 100%, 70%, 1)',
  /* #FFB366 */
  'error-transparent': 'hsla(30, 100%, 55%, 0.25)',
  /* #FF8C1A */

  'extensions-primary': 'hsla(163, 85%, 40%, 1)',
  /* #0FBD8C */
  'extensions-tertiary': 'hsla(163, 85%, 30%, 1)',
  /* #0B8E69 */
  'extensions-transparent': 'hsla(163, 85%, 40%, 0.35)',
  /* 35% transparent version of extensions-primary */
  'extensions-light': 'hsla(163, 57%, 85%, 1)',
  /* opaque version of extensions-transparent, on white bg */

  'drop-highlight': 'hsla(215, 100%, 77%, 1)',
  /* lighter than motion-primary */

  'menu-bar-background': 'var(--looks-secondary)',
  'menu-bar-background-image': 'none',
  'menu-bar-foreground': '#ffffff',
  'assets-background': '#ffffff',
  'input-background': '#ffffff',
  'popover-background': '#ffffff',
  'shadow': 'hsla(0, 0%, 0%, 0.15)',
  'badge-background': '#dbebff',
  'badge-border': '#b9d6ff',
  'fullscreen-background': '#ffffff',
  'fullscreen-accent': '#e8edf1',
  'page-background': '#ffffff',
  'page-foreground': '#000000',
  'project-title-inactive': 'var(--ui-white-transparent)',
  'project-title-hover': '#ffffff7f',
  'link-color': '#2255dd',
  'filter-icon-black': 'none',
  'filter-icon-gray': 'grayscale(100%)',
  'filter-icon-white': 'none',
  'paint-ui-pane-border': 'var(--ui-black-transparent)',
  'paint-text-primary': 'var(--text-primary)',
  'paint-form-border': 'var(--ui-black-transparent)',
  'paint-looks-secondary': 'var(--looks-secondary)',
  'paint-looks-transparent': 'var(--looks-transparent)',
  'paint-input-background': 'var(--input-background)',
  'paint-popover-background': 'var(--popover-background)',
  'paint-filter-icon-gray': 'none'
};
const blockColors = {};


/***/ }),

/***/ "./src/lib/themes/gui/midnight.js":
/*!****************************************!*\
  !*** ./src/lib/themes/gui/midnight.js ***!
  \****************************************/
/*! exports provided: name, icon, guiColors, blockColors */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "name", function() { return name; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "guiColors", function() { return guiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blockColors", function() { return blockColors; });
/* harmony import */ var _raw_loader_icons_midnight_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !raw-loader!../icons/midnight.svg */ "./node_modules/raw-loader/index.js!./src/lib/themes/icons/midnight.svg");
/* harmony import */ var _raw_loader_icons_midnight_svg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_raw_loader_icons_midnight_svg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony reexport (default from non-harmony) */ __webpack_require__.d(__webpack_exports__, "icon", function() { return _raw_loader_icons_midnight_svg__WEBPACK_IMPORTED_MODULE_0___default.a; });

const name = 'Midnight';
const guiColors = {
  'color-scheme': 'dark',
  'ui-primary': '#000000',
  'ui-secondary': '#0a0a0a',
  'ui-tertiary': '#151515',
  'ui-modal-overlay': '#222222aa',
  'ui-modal-background': '#000000',
  'ui-modal-foreground': '#eeeeee',
  'ui-modal-header-background': '#222222',
  'ui-modal-header-foreground': '#ffffff',
  'ui-white': '#000000',
  'ui-black-transparent': '#ffffff26',
  'text-primary': '#eeeeee',
  'menu-bar-background': '#222222',
  'assets-background': '#000000',
  'input-background': '#0a0a0a',
  'popover-background': '#0a0a0a',
  'badge-background': '#101820',
  'badge-border': '#152638',
  'fullscreen-background': '#000000',
  'fullscreen-accent': '#000000',
  'page-background': '#000000',
  'page-foreground': '#eeeeee',
  'project-title-inactive': 'var(--ui-secondary)',
  'project-title-hover': '#ffffff3f',
  'link-color': '#44aaff',
  'filter-icon-black': 'invert(100%)',
  'filter-icon-gray': 'grayscale(100%) brightness(1.7)',
  'filter-icon-white': 'brightness(0) invert(100%)',
  'paint-filter-icon-gray': 'brightness(1.7)'
};
const blockColors = {
  insertionMarker: '#cccccc',
  workspace: '#0a0a0a',
  toolboxSelected: '#0a0a0a',
  toolboxText: '#cccccc',
  toolbox: '#000000',
  flyout: '#000000',
  scrollbar: '#555555',
  valueReportBackground: '#0a0a0a',
  valueReportBorder: '#222222',
  valueReportForeground: '#eeeeee',
  contextMenuBackground: '#000000',
  contextMenuBorder: '#ffffff26',
  contextMenuForeground: '#eeeeee',
  contextMenuActiveBackground: '#1a1a1a',
  contextMenuDisabledForeground: '#666666',
  flyoutLabelColor: '#cccccc',
  checkboxInactiveBackground: '#111111',
  checkboxInactiveBorder: '#c8c8c8',
  buttonBorder: '#c6c6c6',
  buttonActiveBackground: '#111111',
  buttonForeground: '#cccccc',
  zoomIconFilter: 'invert(100%)',
  gridColor: '#383838'
};


/***/ }),

/***/ "./src/lib/themes/guiHelpers.js":
/*!**************************************!*\
  !*** ./src/lib/themes/guiHelpers.js ***!
  \**************************************/
/*! exports provided: applyGuiColors, applyWallpaper, applyBlocksWorkspaceTransparency */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyGuiColors", function() { return applyGuiColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyWallpaper", function() { return applyWallpaper; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyBlocksWorkspaceTransparency", function() { return _applyBlocksWorkspaceTransparency; });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.js */ "./src/lib/themes/index.js");
/* harmony import */ var _addons_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../addons/hooks */ "./src/addons/hooks.js");
/* harmony import */ var _themes_fonts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../themes/fonts */ "./src/lib/themes/fonts.js");
/* harmony import */ var _global_styles_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./global-styles.css */ "./src/lib/themes/global-styles.css");
/* harmony import */ var _global_styles_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_global_styles_css__WEBPACK_IMPORTED_MODULE_3__);
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }




const BLOCK_COLOR_NAMES = [
// Corresponds to the name of the object in blockColors
'motion', 'looks', 'sounds', 'control', 'event', 'sensing', 'pen', 'operators', 'data', 'data_lists', 'more', 'addons'];

/**
 * @param {string} css CSS color or var(--...)
 * @returns {string} evaluated CSS
 */
const evaluateCSS = css => {
  const variableMatch = css.match(/^var\(([\w-]+)\)$/);
  if (variableMatch) {
    return document.documentElement.style.getPropertyValue(variableMatch[1]);
  }
  return css;
};

/**
 * Convert hex color to rgba with given opacity
 * @param {string} hex hex color string
 * @param {number} opacity opacity value (0-1)
 * @returns {string} rgba color string
 */
const hexToRgba = (hex, opacity) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  return "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(opacity, ")");
};

/**
 * Apply transparency styling to a specific element
 * @param {Element} element the element to apply transparency to
 * @param {boolean} hasWallpaper whether wallpaper is active
 * @param {number} wallpaperOpacity opacity of the wallpaper (0.1 to 1.0)
 */
const applyTransparencyToElement = function applyTransparencyToElement(element, hasWallpaper) {
  let wallpaperOpacity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.3;
  if (hasWallpaper) {
    // Calculate appropriate background transparency based on wallpaper opacity
    // Higher wallpaper opacity means we need more workspace transparency to see through
    const backgroundOpacity = Math.max(0.2, Math.min(0.8, 1 - wallpaperOpacity + 0.1));
    const guiColors = document.documentElement.style.getPropertyValue('--ui-primary') || '#e5f0ff';
    const backgroundColor = guiColors.startsWith('#') ? hexToRgba(guiColors, backgroundOpacity) : "rgba(229, 240, 255, ".concat(backgroundOpacity, ")");
    element.style.backgroundColor = backgroundColor;
  } else {
    // Remove transparency styling
    element.style.backgroundColor = '';
  }
};

/**
 * Apply or remove transparency from the blocks workspace using JavaScript
 * @param {boolean} hasWallpaper whether wallpaper is active
 * @param {number} wallpaperOpacity opacity of the wallpaper (0.1 to 1.0)
 * @param {number} retryCount current retry attempt (for internal use)
 */
const _applyBlocksWorkspaceTransparency = function applyBlocksWorkspaceTransparency(hasWallpaper) {
  let wallpaperOpacity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.3;
  let retryCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  // Find the blocks workspace SVG element using the specific selector
  const blocksSvg = document.querySelector('svg.blocklySvg');
  if (!blocksSvg) {
    // Fallback to a more general selector if the specific one doesn't work
    const fallbackSvg = document.querySelector('svg.blocklySvg');
    if (fallbackSvg) {
      applyTransparencyToElement(fallbackSvg, hasWallpaper, wallpaperOpacity);
      return;
    }

    // If no blocks workspace is found and we haven't retried too many times, try again
    // This handles cases where wallpaper is applied before blocks are loaded
    const maxRetries = 20; // Try for up to 10 seconds (50ms * 20 = 1000ms, then exponential backoff)
    if (retryCount < maxRetries) {
      // Use exponential backoff: start with 50ms, then increase
      const delay = retryCount < 10 ? 50 : Math.min(500, 50 * Math.pow(2, retryCount - 10));
      setTimeout(() => {
        _applyBlocksWorkspaceTransparency(hasWallpaper, wallpaperOpacity, retryCount + 1);
      }, delay);
    }
    return;
  }
  applyTransparencyToElement(blocksSvg, hasWallpaper, wallpaperOpacity);
};

// Keep track of the current wallpaper state for observer
let currentWallpaperState = {
  hasWallpaper: false,
  opacity: 0.3
};

/**
 * Observer to watch for blocks workspace changes and apply transparency when needed
 */
const createBlocksWorkspaceObserver = () => {
  // Only create observer if we don't already have one
  if (window.blocksWorkspaceObserver) {
    return;
  }
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Check for both specific and general blocks workspace selectors
        const blocksSvg = document.querySelector('svg.blocklySvg');
        if (blocksSvg && currentWallpaperState.hasWallpaper) {
          // Apply transparency to newly created blocks workspace
          applyTransparencyToElement(blocksSvg, true, currentWallpaperState.opacity);

          // Also check for any nested SVG elements that might need transparency
          const nestedSvgs = blocksSvg.querySelectorAll('svg');
          for (let i = 0; i < nestedSvgs.length; i++) {
            applyTransparencyToElement(nestedSvgs[i], true, currentWallpaperState.opacity);
          }
          break;
        }
      }
    }
  });

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  window.blocksWorkspaceObserver = observer;
};

/**
 * Update the observer's knowledge of current wallpaper state
 * @param {boolean} hasWallpaper whether wallpaper is active
 * @param {number} opacity wallpaper opacity
 */
const updateWallpaperObserverState = function updateWallpaperObserverState(hasWallpaper) {
  let opacity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.3;
  currentWallpaperState = {
    hasWallpaper,
    opacity
  };
  if (hasWallpaper) {
    createBlocksWorkspaceObserver();

    // Also add a listener for workspace creation events if available
    if (window.AddonHooks && window.AddonHooks.workspaceCreated) {
      window.AddonHooks.workspaceCreated(() => {
        if (currentWallpaperState.hasWallpaper) {
          // Small delay to ensure workspace is fully initialized
          setTimeout(() => {
            _applyBlocksWorkspaceTransparency(true, currentWallpaperState.opacity);
          }, 50);
        }
      });
    }
  } else if (window.blocksWorkspaceObserver) {
    // Clean up observer when no wallpaper is active
    window.blocksWorkspaceObserver.disconnect();
    window.blocksWorkspaceObserver = null;
  }
};

/**
 * Apply wallpaper background to the GUI
 * @param {object} wallpaper wallpaper configuration
 */
const applyWallpaper = wallpaper => {
  const target = document.querySelector("[class*='blocks-wrapper_']");
  let checkCountTarget = 0;
  if (!target) {
    const maxChecks = 50;
    const checkInterval = setInterval(() => {
      checkCountTarget++;
      const newTarget = document.querySelector("[class*='blocks-wrapper_']");
      if (newTarget) {
        applyWallpaper(wallpaper);
        clearInterval(checkInterval);
      } else if (checkCountTarget >= maxChecks) {
        clearInterval(checkInterval);
      }
    }, 500);
    return;
  }
  if (wallpaper.url) {
    // Apply opacity by creating a semi-transparent overlay
    const opacity = Math.max(0.1, Math.min(1, wallpaper.opacity || 0.3));
    const overlayOpacity = 1 - opacity;

    // Apply darkness tinting with black overlay
    const darkness = Math.max(0, Math.min(0.8, wallpaper.darkness || 0));

    // Create a composite background with the image and darkness overlay
    // The darkness overlay is applied as a black semi-transparent layer over the image
    if (darkness > 0) {
      target.style.backgroundImage = "\n                linear-gradient(rgba(0, 0, 0, ".concat(darkness, "), rgba(0, 0, 0, ").concat(darkness, ")),\n                url(\"").concat(wallpaper.url, "\")\n            ");
    } else {
      target.style.backgroundImage = "url(\"".concat(wallpaper.url, "\")");
    }
    target.style.backgroundSize = 'cover';
    target.style.backgroundPosition = 'center';
    target.style.backgroundRepeat = 'no-repeat';
    target.style.backgroundAttachment = 'fixed';

    // Use CSS custom properties for overlay and darkness
    document.documentElement.style.setProperty('--wallpaper-overlay-opacity', overlayOpacity.toString());
    document.documentElement.style.setProperty('--wallpaper-darkness', darkness.toString());

    // Apply JavaScript-based transparency to blocks workspace
    _applyBlocksWorkspaceTransparency(true, opacity);

    // Update observer state for future blocks workspace changes
    updateWallpaperObserverState(true, opacity);

    // Also set up a periodic check for blocks workspace in case it loads later
    let checkCount = 0;
    const maxChecks = 50;
    const checkInterval = setInterval(() => {
      checkCount++;
      const blocksSvg = document.querySelector('svg.blocklySvg');
      if (blocksSvg) {
        // Found the blocks workspace, apply transparency and stop checking
        applyTransparencyToElement(blocksSvg, true, opacity);
        clearInterval(checkInterval);
      } else if (checkCount >= maxChecks) {
        // Stop checking after max attempts
        clearInterval(checkInterval);
      }
    }, 500);
  } else {
    // Remove wallpaper
    target.style.backgroundImage = '';
    target.style.backgroundSize = '';
    target.style.backgroundPosition = '';
    target.style.backgroundRepeat = '';
    target.style.backgroundAttachment = '';
    document.documentElement.style.removeProperty('--wallpaper-overlay-opacity');
    document.documentElement.style.removeProperty('--wallpaper-darkness');

    // Remove transparency from blocks workspace
    _applyBlocksWorkspaceTransparency(false);

    // Update observer state
    updateWallpaperObserverState(false);
  }
};

/**
 * @param {Theme} theme the theme
 */
const applyGuiColors = theme => {
  const doc = document.documentElement;
  const defaultGuiColors = _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults && _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.light && typeof _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.light.getGuiColors === 'function' ? _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.light.getGuiColors() : _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_MAP"] && _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_MAP"].light && _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_MAP"].light.guiColors || {};
  for (const _ref of Object.entries(defaultGuiColors)) {
    var _ref2 = _slicedToArray(_ref, 2);
    const name = _ref2[0];
    const value = _ref2[1];
    doc.style.setProperty("--".concat(name, "-default"), value);
  }
  const guiColors = theme.getGuiColors();
  for (const _ref3 of Object.entries(defaultGuiColors)) {
    var _ref4 = _slicedToArray(_ref3, 2);
    const name = _ref4[0];
    const defaultValue = _ref4[1];
    const value = Object.prototype.hasOwnProperty.call(guiColors, name) ? guiColors[name] : defaultValue;
    doc.style.setProperty("--".concat(name), value);

    // Convert hex colors to RGB values for overlay purposes
    if (name === 'ui-primary' && typeof value === 'string' && value.startsWith('#')) {
      const hex = value.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      doc.style.setProperty('--ui-primary-rgb', "".concat(r, ", ").concat(g, ", ").concat(b));
    } else if (name === 'ui-primary' && typeof value === 'string' && value.startsWith('hsla')) {
      // For HSLA values, set a default RGB fallback
      doc.style.setProperty('--ui-primary-rgb', '229, 240, 255');
    }
  }
  for (const _ref5 of Object.entries(guiColors)) {
    var _ref6 = _slicedToArray(_ref5, 2);
    const name = _ref6[0];
    const value = _ref6[1];
    if (!Object.prototype.hasOwnProperty.call(defaultGuiColors, name)) {
      doc.style.setProperty("--".concat(name), value);
    }
  }
  const blockColors = theme.getBlockColors();
  doc.style.setProperty('--editorTheme3-blockText', blockColors.text);
  doc.style.setProperty('--editorTheme3-inputColor', blockColors.textField);
  doc.style.setProperty('--editorTheme3-inputColor-text', blockColors.textFieldText);
  for (const color of BLOCK_COLOR_NAMES) {
    doc.style.setProperty("--editorTheme3-".concat(color, "-primary"), blockColors[color].primary);
    doc.style.setProperty("--editorTheme3-".concat(color, "-secondary"), blockColors[color].secondary);
    doc.style.setProperty("--editorTheme3-".concat(color, "-tertiary"), blockColors[color].tertiary);
    doc.style.setProperty("--editorTheme3-".concat(color, "-field-background"), blockColors[color].quaternary);
  }

  // Set workspace-specific colors from GUI themes
  if (blockColors.workspace) {
    doc.style.setProperty('--editorTheme3-workspace-background', blockColors.workspace);
  }
  if (blockColors.toolbox) {
    doc.style.setProperty('--editorTheme3-toolbox-background', blockColors.toolbox);
  }
  if (blockColors.toolboxText || blockColors.flyoutLabelColor) {
    doc.style.setProperty('--editorTheme3-toolbox-text', blockColors.toolboxText || blockColors.flyoutLabelColor);
  }
  if (blockColors.flyout) {
    doc.style.setProperty('--editorTheme3-flyout-background', blockColors.flyout);
  }
  if (blockColors.flyoutText || blockColors.flyoutLabelColor) {
    doc.style.setProperty('--editorTheme3-flyout-text', blockColors.flyoutText || blockColors.flyoutLabelColor);
  }
  if (blockColors.scrollbar) {
    doc.style.setProperty('--editorTheme3-scrollbar', blockColors.scrollbar);
  }
  if (blockColors.gridColor) {
    doc.style.setProperty('--editorTheme3-grid-color', blockColors.gridColor);
  }

  // Some browsers will color their interfaces to match theme-color, so if we make it the same color as our
  // menu bar, it'll look pretty cool.
  let metaThemeColor = document.head.querySelector('meta[name=theme-color]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', evaluateCSS(guiColors['menu-bar-background']));

  // a horrible hack for icons...
  window.Recolor = {
    primary: guiColors['looks-secondary']
  };
  _addons_hooks__WEBPACK_IMPORTED_MODULE_1__["default"].recolorCallbacks.forEach(i => i());

  // Apply wallpaper
  applyWallpaper(theme.wallpaper);

  // Apply fonts (async but don't block UI)
  Object(_themes_fonts__WEBPACK_IMPORTED_MODULE_2__["applyThemeFonts"])(theme.fonts).catch(console.error);
};


/***/ }),

/***/ "./src/lib/themes/index.js":
/*!*********************************!*\
  !*** ./src/lib/themes/index.js ***!
  \*********************************/
/*! exports provided: Theme, defaultBlockColors, ACCENT_MAP, GUI_MAP, MENUBAR_ALIGN, ACCENT_DEFAULT, GUI_DEFAULT, MENUBAR_ALIGN_DEFAULT, BLOCKS_THREE, BLOCKS_DARK, BLOCKS_HIGH_CONTRAST, BLOCKS_CUSTOM, BLOCKS_MAP */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Theme", function() { return Theme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultBlockColors", function() { return defaultBlockColors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BLOCKS_THREE", function() { return BLOCKS_THREE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BLOCKS_DARK", function() { return BLOCKS_DARK; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BLOCKS_HIGH_CONTRAST", function() { return BLOCKS_HIGH_CONTRAST; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BLOCKS_CUSTOM", function() { return BLOCKS_CUSTOM; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BLOCKS_MAP", function() { return BLOCKS_MAP; });
/* harmony import */ var lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash.defaultsdeep */ "./node_modules/lodash.defaultsdeep/index.js");
/* harmony import */ var lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _blocks_three__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./blocks/three */ "./src/lib/themes/blocks/three.js");
/* harmony import */ var _blocks_high_contrast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./blocks/high-contrast */ "./src/lib/themes/blocks/high-contrast.js");
/* harmony import */ var _blocks_dark__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./blocks/dark */ "./src/lib/themes/blocks/dark.js");
/* harmony import */ var _accents__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./accents */ "./src/lib/themes/accents.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ACCENT_MAP", function() { return _accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_MAP"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "ACCENT_DEFAULT", function() { return _accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_DEFAULT"]; });

/* harmony import */ var _gui__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./gui */ "./src/lib/themes/gui.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GUI_MAP", function() { return _gui__WEBPACK_IMPORTED_MODULE_5__["GUI_MAP"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "GUI_DEFAULT", function() { return _gui__WEBPACK_IMPORTED_MODULE_5__["GUI_DEFAULT"]; });

/* harmony import */ var _menubar__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./menubar */ "./src/lib/themes/menubar.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MENUBAR_ALIGN", function() { return _menubar__WEBPACK_IMPORTED_MODULE_6__["MENUBAR_ALIGN"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MENUBAR_ALIGN_DEFAULT", function() { return _menubar__WEBPACK_IMPORTED_MODULE_6__["MENUBAR_ALIGN_DEFAULT"]; });

function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }







const BLOCKS_THREE = 'three';
const BLOCKS_DARK = 'dark';
const BLOCKS_HIGH_CONTRAST = 'high-contrast';
const BLOCKS_CUSTOM = 'custom';
const BLOCKS_DEFAULT = BLOCKS_THREE;
const defaultBlockColors = _blocks_three__WEBPACK_IMPORTED_MODULE_1__["blockColors"];
const BLOCKS_MAP = {
  [BLOCKS_THREE]: {
    blocksMediaFolder: 'blocks-media/default',
    colors: _blocks_three__WEBPACK_IMPORTED_MODULE_1__["blockColors"],
    extensions: _blocks_three__WEBPACK_IMPORTED_MODULE_1__["extensions"],
    customExtensionColors: {},
    useForStage: true
  },
  [BLOCKS_HIGH_CONTRAST]: {
    blocksMediaFolder: 'blocks-media/high-contrast',
    colors: lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0___default()({}, _blocks_high_contrast__WEBPACK_IMPORTED_MODULE_2__["blockColors"], defaultBlockColors),
    extensions: _blocks_high_contrast__WEBPACK_IMPORTED_MODULE_2__["extensions"],
    customExtensionColors: _blocks_high_contrast__WEBPACK_IMPORTED_MODULE_2__["customExtensionColors"],
    useForStage: true
  },
  [BLOCKS_DARK]: {
    blocksMediaFolder: 'blocks-media/default',
    colors: lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0___default()({}, _blocks_dark__WEBPACK_IMPORTED_MODULE_3__["blockColors"], defaultBlockColors),
    extensions: _blocks_dark__WEBPACK_IMPORTED_MODULE_3__["extensions"],
    customExtensionColors: _blocks_dark__WEBPACK_IMPORTED_MODULE_3__["customExtensionColors"],
    useForStage: false
  },
  [BLOCKS_CUSTOM]: {
    // to be filled by editor-theme3 addon
    blocksMediaFolder: 'blocks-media/default',
    colors: _blocks_three__WEBPACK_IMPORTED_MODULE_1__["blockColors"],
    extensions: {},
    customExtensionColors: {},
    useForStage: false
  }
};
let themeObjectsCreated = 0;
class Theme {
  constructor(accent, gui, blocks, menuBarAlign, wallpaper, fonts, name) {
    if (!name) name = gui;
    // do not modify these directly
    /** @readonly */
    this.id = ++themeObjectsCreated;
    /** @readonly */
    this.accent = Object.prototype.hasOwnProperty.call(_accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_MAP"], accent) ? accent : _accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_DEFAULT"];
    /** @readonly */
    this.gui = Object.prototype.hasOwnProperty.call(_gui__WEBPACK_IMPORTED_MODULE_5__["GUI_MAP"], gui) ? gui : _gui__WEBPACK_IMPORTED_MODULE_5__["GUI_DEFAULT"];
    /** @readonly */
    this.blocks = Object.prototype.hasOwnProperty.call(BLOCKS_MAP, blocks) ? blocks : BLOCKS_DEFAULT;
    /** @readonly */
    this.menuBarAlign = Object.keys(_menubar__WEBPACK_IMPORTED_MODULE_6__["MENUBAR_ALIGN"]).includes(menuBarAlign) ? menuBarAlign : _menubar__WEBPACK_IMPORTED_MODULE_6__["MENUBAR_ALIGN_DEFAULT"];

    /** @readonly */
    this.wallpaper = wallpaper || {
      url: '',
      opacity: 0.3,
      darkness: 0,
      gridVisible: true,
      history: []
    };
    /** @readonly */
    this.fonts = fonts || {
      system: [],
      google: [],
      history: []
    };

    /** @readonly */
    this.name = name;
  }
  set(what, to) {
    if (what === 'accent') {
      return new Theme(to, this.gui, this.blocks, this.menuBarAlign, this.wallpaper, this.fonts, this.name);
    } else if (what === 'gui') {
      return new Theme(this.accent, to, this.blocks, this.menuBarAlign, this.wallpaper, this.fonts, this.name);
    } else if (what === 'blocks') {
      return new Theme(this.accent, this.gui, to, this.menuBarAlign, this.wallpaper, this.fonts, this.name);
    } else if (what === 'menuBarAlign') {
      return new Theme(this.accent, this.gui, this.blocks, to, this.wallpaper, this.fonts, this.name);
    } else if (what === 'wallpaper') {
      return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, to, this.fonts, this.name);
    } else if (what === 'fonts') {
      return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, this.wallpaper, to, this.name);
    } else if (what === 'name') {
      return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, this.wallpaper, this.fonts, to);
    }
    throw new Error("Unknown theme property: ".concat(what));
  }
  getBlocksMediaFolder() {
    return BLOCKS_MAP[this.blocks].blocksMediaFolder;
  }
  getGuiColors() {
    return lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0___default()({}, _accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_MAP"][this.accent].guiColors, _gui__WEBPACK_IMPORTED_MODULE_5__["GUI_MAP"][this.gui].guiColors, BLOCKS_MAP[this.blocks].colors, {
      'looks-secondary': '#d399e5'
    });
  }
  getBlockColors() {
    return lodash_defaultsdeep__WEBPACK_IMPORTED_MODULE_0___default()({}, _accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_MAP"][this.accent].blockColors, _gui__WEBPACK_IMPORTED_MODULE_5__["GUI_MAP"][this.gui].blockColors, BLOCKS_MAP[this.blocks].colors);
  }
  getExtensions() {
    return BLOCKS_MAP[this.blocks].extensions;
  }
  isDark() {
    return this.getGuiColors()['color-scheme'] === 'dark';
  }
  getStageBlockColors() {
    if (BLOCKS_MAP[this.blocks].useForStage) {
      return this.getBlockColors();
    }
    return Theme.defaults.light.getBlockColors();
  }
  getCustomExtensionColors() {
    return BLOCKS_MAP[this.blocks].customExtensionColors;
  }
  getBlocksThemeId() {
    return "".concat(this.blocks, "-").concat(BLOCKS_MAP[this.blocks].blocksMediaFolder);
  }
}
_defineProperty(Theme, "defaults", Object.create(null));
const keys = Object.keys(_gui__WEBPACK_IMPORTED_MODULE_5__["GUI_MAP"]);
for (const key of keys) {
  Theme.defaults[key] = new Theme(_accents__WEBPACK_IMPORTED_MODULE_4__["ACCENT_DEFAULT"], key, BLOCKS_DEFAULT, _menubar__WEBPACK_IMPORTED_MODULE_6__["MENUBAR_ALIGN_DEFAULT"], {
    url: '',
    opacity: 0.3,
    darkness: 0,
    gridVisible: true,
    history: []
  }, {
    system: [],
    google: [],
    history: []
  }, _gui__WEBPACK_IMPORTED_MODULE_5__["GUI_MAP"][key].name);
}


/***/ }),

/***/ "./src/lib/themes/menubar.js":
/*!***********************************!*\
  !*** ./src/lib/themes/menubar.js ***!
  \***********************************/
/*! exports provided: MENUBAR_ALIGN, MENUBAR_ALIGN_DEFAULT */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MENUBAR_ALIGN", function() { return MENUBAR_ALIGN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MENUBAR_ALIGN_DEFAULT", function() { return MENUBAR_ALIGN_DEFAULT; });
/* harmony import */ var _components_menu_bar_tw_align_left_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../components/menu-bar/tw-align-left.svg */ "./src/components/menu-bar/tw-align-left.svg");
/* harmony import */ var _components_menu_bar_tw_align_left_svg__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_components_menu_bar_tw_align_left_svg__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_menu_bar_tw_align_center_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../components/menu-bar/tw-align-center.svg */ "./src/components/menu-bar/tw-align-center.svg");
/* harmony import */ var _components_menu_bar_tw_align_center_svg__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_components_menu_bar_tw_align_center_svg__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _components_menu_bar_tw_align_right_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../components/menu-bar/tw-align-right.svg */ "./src/components/menu-bar/tw-align-right.svg");
/* harmony import */ var _components_menu_bar_tw_align_right_svg__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_components_menu_bar_tw_align_right_svg__WEBPACK_IMPORTED_MODULE_2__);



const MENUBAR_ALIGN = {
  left: {
    defaultMessage: 'Left',
    description: 'Label for left-aligned menu bar',
    id: 'tw.menuBar.align.left',
    icon: _components_menu_bar_tw_align_left_svg__WEBPACK_IMPORTED_MODULE_0___default.a
  },
  center: {
    defaultMessage: 'Center',
    description: 'Label for center-aligned menu bar',
    id: 'tw.menuBar.align.center',
    icon: _components_menu_bar_tw_align_center_svg__WEBPACK_IMPORTED_MODULE_1___default.a
  },
  right: {
    defaultMessage: 'Right',
    description: 'Label for right-aligned menu bar',
    id: 'tw.menuBar.align.right',
    icon: _components_menu_bar_tw_align_right_svg__WEBPACK_IMPORTED_MODULE_2___default.a
  }
};
const MENUBAR_ALIGN_DEFAULT = 'center';


/***/ }),

/***/ "./src/lib/themes/themePersistance.js":
/*!********************************************!*\
  !*** ./src/lib/themes/themePersistance.js ***!
  \********************************************/
/*! exports provided: onSystemPreferenceChange, detectTheme, persistTheme, applyTheme */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "onSystemPreferenceChange", function() { return onSystemPreferenceChange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detectTheme", function() { return detectTheme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "persistTheme", function() { return persistTheme; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyTheme", function() { return applyTheme; });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.js */ "./src/lib/themes/index.js");
/* harmony import */ var _custom_themes_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./custom-themes.js */ "./src/lib/themes/custom-themes.js");
/* harmony import */ var _guiHelpers_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./guiHelpers.js */ "./src/lib/themes/guiHelpers.js");



const matchMedia = query => window.matchMedia ? window.matchMedia(query) : null;
const PREFERS_HIGH_CONTRAST_QUERY = matchMedia('(prefers-contrast: more)');
const PREFERS_DARK_QUERY = matchMedia('(prefers-color-scheme: dark)');
const STORAGE_KEY = 'tw:theme';

/**
 * @returns {Theme} detected theme
 */
const systemPreferencesTheme = () => {
  const defaultsAvailable = _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"] && _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults && _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.light;
  if (defaultsAvailable) {
    if (PREFERS_HIGH_CONTRAST_QUERY && PREFERS_HIGH_CONTRAST_QUERY.matches) {
      return _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.highContrast;
    }
    if (PREFERS_DARK_QUERY && PREFERS_DARK_QUERY.matches) {
      return _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.dark;
    }
    return _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.light;
  }

  // Fallback: construct a minimal Theme if Theme.defaults isn't initialized yet
  if (PREFERS_HIGH_CONTRAST_QUERY && PREFERS_HIGH_CONTRAST_QUERY.matches) {
    return new _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"](_index_js__WEBPACK_IMPORTED_MODULE_0__["ACCENT_DEFAULT"], _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_DEFAULT"], _index_js__WEBPACK_IMPORTED_MODULE_0__["BLOCKS_THREE"], _index_js__WEBPACK_IMPORTED_MODULE_0__["MENUBAR_ALIGN_DEFAULT"]);
  }
  if (PREFERS_DARK_QUERY && PREFERS_DARK_QUERY.matches) {
    return new _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"](_index_js__WEBPACK_IMPORTED_MODULE_0__["ACCENT_DEFAULT"], 'dark', _index_js__WEBPACK_IMPORTED_MODULE_0__["BLOCKS_THREE"], _index_js__WEBPACK_IMPORTED_MODULE_0__["MENUBAR_ALIGN_DEFAULT"]);
  }
  return new _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"](_index_js__WEBPACK_IMPORTED_MODULE_0__["ACCENT_DEFAULT"], _index_js__WEBPACK_IMPORTED_MODULE_0__["GUI_DEFAULT"], _index_js__WEBPACK_IMPORTED_MODULE_0__["BLOCKS_THREE"], _index_js__WEBPACK_IMPORTED_MODULE_0__["MENUBAR_ALIGN_DEFAULT"]);
};

/**
 * @param {function} onChange callback; no guarantees about arguments
 * @returns {function} call to remove event listeners to prevent memory leak
 */
const onSystemPreferenceChange = onChange => {
  if (!PREFERS_HIGH_CONTRAST_QUERY || !PREFERS_DARK_QUERY ||
  // Some old browsers don't support addEventListener on media queries
  !PREFERS_HIGH_CONTRAST_QUERY.addEventListener || !PREFERS_DARK_QUERY.addEventListener) {
    return () => {};
  }
  PREFERS_HIGH_CONTRAST_QUERY.addEventListener('change', onChange);
  PREFERS_DARK_QUERY.addEventListener('change', onChange);
  return () => {
    PREFERS_HIGH_CONTRAST_QUERY.removeEventListener('change', onChange);
    PREFERS_DARK_QUERY.removeEventListener('change', onChange);
  };
};

/**
 * @returns {Theme} the theme
 */
const detectTheme = () => {
  const systemPreferences = systemPreferencesTheme();
  try {
    const local = localStorage.getItem(STORAGE_KEY);

    // Migrate legacy preferences
    if (local === 'dark') {
      return _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.dark;
    }
    if (local === 'light') {
      return _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"].defaults.light;
    }
    const parsed = JSON.parse(local);

    // Check if this is a custom theme
    if (parsed.isCustom && parsed.customThemeUuid) {
      const customTheme = _custom_themes_js__WEBPACK_IMPORTED_MODULE_1__["customThemeManager"].getTheme(parsed.customThemeUuid);
      if (customTheme) {
        return customTheme;
      }
      // Fall back to system preferences if custom theme not found
      console.warn("Custom theme ".concat(parsed.customThemeUuid, " not found, falling back to system preferences"));
    }
    if (parsed.inlineCustomTheme && typeof parsed.inlineCustomTheme === 'object') {
      try {
        return _custom_themes_js__WEBPACK_IMPORTED_MODULE_1__["CustomTheme"].import(parsed.inlineCustomTheme);
      } catch (e) {
        console.warn('Failed to import inline custom theme, falling back to system preferences', e);
      }
    }

    // Any invalid values in storage will be handled by Theme itself
    const wallpaper = parsed.wallpaper || {
      url: '',
      opacity: 0.3,
      darkness: 0,
      gridVisible: true,
      history: []
    };

    // Add backward compatibility for gridVisible
    if (typeof wallpaper.gridVisible === 'undefined') {
      wallpaper.gridVisible = true;
    }
    return new _index_js__WEBPACK_IMPORTED_MODULE_0__["Theme"](parsed.accent || systemPreferences.accent, parsed.gui || systemPreferences.gui, parsed.blocks || systemPreferences.blocks, parsed.menuBarAlign || systemPreferences.menuBarAlign, wallpaper, parsed.fonts || {
      system: [],
      google: [],
      history: []
    });
  } catch (e) {
    // ignore
  }
  return systemPreferences;
};

/**
 * @param {Theme} theme the theme
 */
const persistTheme = theme => {
  const systemPreferences = systemPreferencesTheme();
  const nonDefaultSettings = {};

  // Handle custom themes differently
  if (theme instanceof _custom_themes_js__WEBPACK_IMPORTED_MODULE_1__["CustomTheme"]) {
    const isSavedCustomTheme = !!_custom_themes_js__WEBPACK_IMPORTED_MODULE_1__["customThemeManager"].getTheme(theme.uuid);
    if (isSavedCustomTheme) {
      nonDefaultSettings.customThemeUuid = theme.uuid;
      nonDefaultSettings.isCustom = true;
    } else {
      // Modified/unselected custom theme: persist inline so it can be restored.
      nonDefaultSettings.inlineCustomTheme = theme.export();
    }
  } else {
    if (theme.accent !== systemPreferences.accent) {
      nonDefaultSettings.accent = theme.accent;
    }
    if (theme.gui !== systemPreferences.gui) {
      nonDefaultSettings.gui = theme.gui;
    }
    // custom blocks are managed by addon at runtime, don't save here
    if (theme.blocks !== systemPreferences.blocks && theme.blocks !== _index_js__WEBPACK_IMPORTED_MODULE_0__["BLOCKS_CUSTOM"]) {
      nonDefaultSettings.blocks = theme.blocks;
    }
    if (theme.menuBarAlign !== systemPreferences.menuBarAlign) {
      nonDefaultSettings.menuBarAlign = theme.menuBarAlign;
    }
    // Always save wallpaper settings if they exist
    if (theme.wallpaper && (theme.wallpaper.url || theme.wallpaper.history.length > 0)) {
      nonDefaultSettings.wallpaper = theme.wallpaper;
    }

    // Always save fonts settings if they exist
    if (theme.fonts && (theme.fonts.system.length > 0 || theme.fonts.google.length > 0 || theme.fonts.history.length > 0)) {
      nonDefaultSettings.fonts = theme.fonts;
    }
  }
  if (Object.keys(nonDefaultSettings).length === 0) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nonDefaultSettings));
    } catch (e) {
      // ignore
    }
  }
};

/**
 * Apply a theme to the GUI pipeline and persist settings.
 * This centralizes application so loading and manual changes behave the same.
 * @param {Theme} theme the theme
 */
const applyTheme = theme => {
  try {
    Object(_guiHelpers_js__WEBPACK_IMPORTED_MODULE_2__["applyGuiColors"])(theme);
  } catch (e) {
    // Don't let GUI application failures block persistence
    console.error('Failed to apply GUI colors for theme:', e);
  }
  persistTheme(theme);
};
try {
  applyTheme(detectTheme());
} catch (e) {
  console.error('Failed to apply theme:', e);
}


/***/ }),

/***/ "./src/lib/utils/color.js":
/*!********************************!*\
  !*** ./src/lib/utils/color.js ***!
  \********************************/
/*! exports provided: hex2hsv, hsv2hex */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hex2hsv", function() { return hex2hsv; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hsv2hex", function() { return hsv2hex; });
/*
    Parts of this file are from https://github.com/Qix-/color-convert/blob/6b7dee5a168f76bf42c084fefa7bbe1a0941ad7e/conversions.js

    Copyright (c) 2011-2016 Heather Arthur <fayearthur@gmail.com>.
    Copyright (c) 2016-2021 Josh Junon <josh@junon.me>.

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
    LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
    OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @param {string} hex hex color code like #abc123
 * @returns {number[]} [r, g, b] in range [0-255]. Alpha channel is ignored.
 */
const hex2rgb = hex => {
  const parsed = Number.parseInt(hex.substring(1), 16);
  return [parsed >> 16 & 255, parsed >> 8 & 255, parsed & 255];
};

/**
 * @param {number[]} rgb [r, g, b] in range [0-255]
 * @returns {string} hex color code like #123abc
 */
const rgb2hex = rgb => {
  const number = rgb[0] << 16 | rgb[1] << 8 | rgb[2];
  return "#".concat(number.toString(16).padStart(6, '0'));
};

/**
 * @param {number[]} rgb [r, g, b] in range [0-255]
 * @returns {number[]} [h, s, v] in range [0-360] for h, [0-100] for s, v
 */
const rgb2hsv = rgb => {
  let rdif;
  let gdif;
  let bdif;
  let h;
  let s;
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const v = Math.max(r, g, b);
  const diff = v - Math.min(r, g, b);
  const diffc = c => (v - c) / 6 / diff + 1 / 2;
  if (diff === 0) {
    h = 0;
    s = 0;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);
    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  return [h * 360, s * 100, v * 100];
};

/**
 * @param {number[]} hsv [h, s, v] in range [0-360] for h, [0-100] for s, v
 * @returns {number[]} [r, g, b] in range [0-255]
 */
const hsv2rgb = hsv => {
  const h = hsv[0] / 60;
  const s = hsv[1] / 100;
  let v = hsv[2] / 100;
  const hi = Math.floor(h) % 6;
  const f = h - Math.floor(h);
  const p = 255 * v * (1 - s);
  const q = 255 * v * (1 - s * f);
  const t = 255 * v * (1 - s * (1 - f));
  v *= 255;
  switch (hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
};
const hex2hsv = hex => rgb2hsv(hex2rgb(hex));
const hsv2hex = hsv => rgb2hex(hsv2rgb(hsv));


/***/ }),

/***/ "./src/playground/app-target.js":
/*!**************************************!*\
  !*** ./src/playground/app-target.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-dom */ "./node_modules/react-dom/index.js");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_modal__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-modal */ "./node_modules/react-modal/lib/index.js");
/* harmony import */ var react_modal__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_modal__WEBPACK_IMPORTED_MODULE_1__);


const appTarget = document.getElementById('app');

// Remove everything from the target to fix macOS Safari "Save Page As",
while (appTarget.firstChild) {
  appTarget.removeChild(appTarget.firstChild);
}
Object(react_modal__WEBPACK_IMPORTED_MODULE_1__["setAppElement"])(appTarget);
const render = children => {
  // Use ReactDOM.createRoot for better performance if available (React 18+)
  if (react_dom__WEBPACK_IMPORTED_MODULE_0___default.a.createRoot) {
    const root = react_dom__WEBPACK_IMPORTED_MODULE_0___default.a.createRoot(appTarget);
    root.render(children);
  } else {
    react_dom__WEBPACK_IMPORTED_MODULE_0___default.a.render(children, appTarget);
  }

  // Schedule splash end after render completes
  requestAnimationFrame(() => {
    // Log time when React app renders (splash screen ends)
    if (window.MISTWARP_LOAD_START_TIME) {
      if (window.performance && window.performance.mark) {
        window.performance.mark('mistwarp-app-render');
      }
    }
    if (window.SplashEnd) {
      window.SplashEnd();
    }
  });
};
/* harmony default export */ __webpack_exports__["default"] = (render);

/***/ })

}]);
//# sourceMappingURL=addon-settings~credits~editor~embed~fullscreen~player.js.map
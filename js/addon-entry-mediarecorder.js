(window["webpackJsonpGUI"] = window["webpackJsonpGUI"] || []).push([["addon-entry-mediarecorder"],{

/***/ "./node_modules/css-loader/index.js!./src/addons/addons/mediarecorder/style.css":
/*!*****************************************************************************!*\
  !*** ./node_modules/css-loader!./src/addons/addons/mediarecorder/style.css ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Legacy modal styles */\n.mediaRecorderPopup {\n  box-sizing: border-box;\n  width: 700px;\n  max-height: min(800px, 80vh);\n  max-width: 85%;\n  margin-top: 12vh;\n  overflow-y: auto;\n  margin-left: auto;\n  margin-right: auto;\n}\n\n.sa-record svg {\n    margin-right: .5rem;\n    vertical-align: middle;\n}\n\n.mediaRecorderPopupContent {\n  padding: 1.5rem 2.25rem;\n}\n\n.mediaRecorderPopup p {\n  font-size: 1rem;\n  margin: 0.5rem auto;\n}\n\n.mediaRecorderPopup p :last-child {\n  margin-left: 1rem;\n}\n\n.mediaRecorderPopup[dir=\"rtl\"] p :last-child {\n  margin-left: 0;\n  margin-right: 1rem;\n}\n\np.mediaRecorderPopupOption {\n  display: flex;\n  align-items: center;\n}\n\n.mediaRecorderPopupOption input[type=\"checkbox\"] {\n  height: 1.5rem;\n}\n\n#recordOptionSecondsInput,\n#recordOptionDelayInput {\n  width: 6rem;\n}\n\n.mediaRecorderPopupButtons {\n  margin-top: 1.5rem;\n}\n\n.mediaRecorderPopupButtons button {\n  margin-left: 0.5rem;\n}\n\n.mediaRecorderPopupButtons button:nth-of-type(1) {\n  color: black;\n}\n\n/* Window manager styles */\n.media-recorder-options-window .media-recorder-content {\n  padding: 18px;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  box-sizing: border-box;\n  background: var(--ui-modal-background, #fff);\n  color: var(--ui-modal-foreground, #575e75);\n  overflow-y: auto;\n  min-height: 0; /* Allow flex shrinking */\n}\n\n.media-recorder-options-window .media-recorder-description {\n  margin: 0 0 16px 0;\n  font-size: 13px;\n  color: var(--ui-modal-foreground, #575e75);\n  line-height: 1.4;\n  padding: 12px;\n  background: var(--ui-secondary, #f9f9f9);\n  border-radius: 6px;\n  border-left: 3px solid var(--ui-blue, #4C97FF);\n}\n\n.media-recorder-options-window .media-recorder-form {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  min-height: 0; /* Allow flex shrinking */\n  overflow-y: auto;\n  padding-right: 4px; /* Space for scrollbar */\n}\n\n.media-recorder-options-window .media-recorder-input-group {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.media-recorder-options-window .media-recorder-label {\n  font-weight: 600;\n  font-size: 13px;\n  color: var(--ui-modal-foreground, #575e75);\n  margin-bottom: 2px;\n}\n\n.media-recorder-options-window .media-recorder-input {\n  padding: 10px;\n  border: 2px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));\n  border-radius: 5px;\n  font-size: 13px;\n  width: 100%;\n  box-sizing: border-box;\n  background: var(--ui-white, #fff);\n  color: var(--ui-modal-foreground, #575e75);\n  transition: border-color 0.2s, box-shadow 0.2s;\n}\n\n.media-recorder-options-window .media-recorder-input:focus {\n  outline: none;\n  border-color: var(--ui-blue, #4C97FF);\n  box-shadow: 0 0 0 3px var(--ui-blue-transparent, rgba(76, 151, 255, 0.2));\n}\n\n.media-recorder-options-window .media-recorder-checkbox-group {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  font-size: 13px;\n  color: var(--ui-modal-foreground, #575e75);\n  cursor: pointer;\n  padding: 8px 10px;\n  border-radius: 5px;\n  transition: background-color 0.2s;\n  border: 1px solid transparent;\n  margin: 1px 0;\n}\n\n.media-recorder-options-window .media-recorder-checkbox-group:hover:not(.disabled) {\n  background-color: var(--ui-secondary, #f9f9f9);\n  border-color: var(--ui-black-transparent, rgba(0, 0, 0, 0.1));\n}\n\n.media-recorder-options-window .media-recorder-checkbox-group.disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n  background-color: var(--ui-black-transparent, rgba(0, 0, 0, 0.05));\n}\n\n.media-recorder-options-window .media-recorder-checkbox {\n  accent-color: var(--ui-blue, #4C97FF);\n  width: 16px;\n  height: 16px;\n  margin: 0;\n}\n\n.media-recorder-options-window .media-recorder-buttons {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n  margin-top: auto; /* Push to bottom */\n  padding-top: 16px;\n  border-top: 2px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.1));\n  flex-shrink: 0; /* Prevent buttons from shrinking */\n}\n\n.media-recorder-options-window .media-recorder-button {\n  padding: 10px 18px;\n  border-radius: 5px;\n  cursor: pointer;\n  font-size: 12px;\n  font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  font-weight: 500;\n  transition: all 0.2s;\n  border: none;\n  min-width: 75px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.media-recorder-options-window .media-recorder-button-cancel {\n  border: 2px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));\n  background: var(--ui-white, #fff);\n  color: var(--ui-modal-foreground, #575e75);\n}\n\n.media-recorder-options-window .media-recorder-button-cancel:hover {\n  background: var(--ui-secondary, #f9f9f9);\n  border-color: var(--ui-black-transparent, rgba(0, 0, 0, 0.25));\n  transform: translateY(-1px);\n  box-shadow: 0 2px 4px var(--ui-black-transparent, rgba(0, 0, 0, 0.1));\n}\n\n.media-recorder-options-window .media-recorder-button-start {\n  background: var(--ui-blue, #4C97FF);\n  color: var(--ui-white, #fff);\n  font-weight: 600;\n  box-shadow: 0 2px 4px var(--ui-blue-transparent, rgba(76, 151, 255, 0.3));\n}\n\n.media-recorder-options-window .media-recorder-button-start:hover {\n  background: var(--ui-blue-darker, #4280d7);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 8px var(--ui-blue-transparent, rgba(76, 151, 255, 0.4));\n}\n\n.media-recorder-options-window .media-recorder-button:active {\n  transform: translateY(0);\n}\n\n/* Recording status styles */\n.media-recorder-options-window .media-recorder-status-header {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  margin-bottom: 20px;\n  padding: 16px;\n  background: linear-gradient(135deg, var(--ui-blue, #4C97FF), var(--ui-blue-darker, #4280d7));\n  border-radius: 8px;\n  color: var(--ui-white, #fff);\n}\n\n.media-recorder-options-window .media-recorder-status-icon {\n  font-size: 32px;\n  animation: pulse 2s infinite;\n}\n\n@keyframes pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.7; }\n}\n\n.media-recorder-options-window .media-recorder-status-text h3 {\n  margin: 0 0 4px 0;\n  font-size: 18px;\n  font-weight: 600;\n}\n\n.media-recorder-options-window .media-recorder-status-text p {\n  margin: 0;\n  font-size: 13px;\n  opacity: 0.9;\n}\n\n.media-recorder-options-window .media-recorder-status-info {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  margin-bottom: 20px;\n  flex: 1; /* Take up available space */\n}\n\n.media-recorder-options-window .media-recorder-status-item {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px;\n  background: var(--ui-secondary, #f9f9f9);\n  border-radius: 6px;\n  border-left: 3px solid var(--ui-blue, #4C97FF);\n}\n\n.media-recorder-options-window .media-recorder-status-label {\n  font-weight: 600;\n  color: var(--ui-modal-foreground, #575e75);\n  font-size: 13px;\n}\n\n.media-recorder-options-window .media-recorder-status-value {\n  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;\n  font-size: 13px;\n  color: var(--ui-blue, #4C97FF);\n  font-weight: 600;\n}\n\n.media-recorder-options-window .media-recorder-button-stop {\n  background: var(--ui-red, #ff4757);\n  color: var(--ui-white, #fff);\n  font-weight: 600;\n  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);\n  width: 100%;\n}\n\n.media-recorder-options-window .media-recorder-button-stop:hover {\n  background: var(--ui-red-darker, #ff3742);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 8px rgba(255, 71, 87, 0.4);\n}\n\n.media-recorder-options-window .media-recorder-button-save {\n  background: var(--ui-green, #2ed573);\n  color: var(--ui-white, #fff);\n  font-weight: 600;\n  box-shadow: 0 2px 4px rgba(46, 213, 115, 0.3);\n  flex: 1;\n}\n\n.media-recorder-options-window .media-recorder-button-save:hover {\n  background: var(--ui-green-darker, #26d069);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 8px rgba(46, 213, 115, 0.4);\n}\n\n/* Responsive adjustments for smaller window sizes */\n@media (max-width: 400px) {\n  .media-recorder-options-window .media-recorder-content {\n    padding: 16px;\n  }\n  \n  .media-recorder-options-window .media-recorder-form {\n    gap: 16px;\n  }\n  \n  .media-recorder-options-window .media-recorder-buttons {\n    flex-direction: column;\n    gap: 8px;\n  }\n  \n  .media-recorder-options-window .media-recorder-button {\n    width: 100%;\n  }\n}\n", ""]);

// exports


/***/ }),

/***/ "./src/addons/addons/mediarecorder/_runtime_entry.js":
/*!***********************************************************!*\
  !*** ./src/addons/addons/mediarecorder/_runtime_entry.js ***!
  \***********************************************************/
/*! exports provided: resources */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resources", function() { return resources; });
/* harmony import */ var _userscript_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./userscript.js */ "./src/addons/addons/mediarecorder/userscript.js");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! css-loader!./style.css */ "./node_modules/css-loader/index.js!./src/addons/addons/mediarecorder/style.css");
/* harmony import */ var _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_css_loader_style_css__WEBPACK_IMPORTED_MODULE_1__);
/* generated by pull.js */


const resources = {
  'userscript.js': _userscript_js__WEBPACK_IMPORTED_MODULE_0__["default"],
  'style.css': _css_loader_style_css__WEBPACK_IMPORTED_MODULE_1___default.a
};

/***/ }),

/***/ "./src/addons/addons/mediarecorder/userscript.js":
/*!*******************************************************!*\
  !*** ./src/addons/addons/mediarecorder/userscript.js ***!
  \*******************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _libraries_common_cs_download_blob_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../libraries/common/cs/download-blob.js */ "./src/addons/libraries/common/cs/download-blob.js");
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lucide-react */ "./node_modules/lucide-react/dist/esm/lucide-react.js");


let recordElem;
const getRecordElem = () => recordElem;
const setRecordElem = elem => {
  recordElem = elem;
};
/* harmony default export */ __webpack_exports__["default"] = (async _ref => {
  let addon = _ref.addon,
    console = _ref.console,
    msg = _ref.msg;
  let isRecording = false;
  let isWaitingForFlag = false;
  let waitingForFlagFunc = null;
  let abortController = null;
  let stopSignFunc = null;
  let recordBuffer = [];
  let recorder;
  let timeout;
  let optionsWindow = null;

  // Access window manager through dynamic import
  let WindowManager = null;
  const initWindowManager = async () => {
    if (WindowManager) return WindowManager;
    try {
      // Try to access the window manager module
      const windowManagerModule = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(null, /*! ../../../addons/window-system/window-manager.js */ "./src/addons/window-system/window-manager.js"));
      WindowManager = windowManagerModule.default;
      return WindowManager;
    } catch (e) {
      console.warn('Could not load window manager:', e);
      return null;
    }
  };
  const mimeType = [
  // Chrome and Firefox only support encoding as webm
  // VP9 is preferred as its playback is better supported across platforms
  'video/webm; codecs=vp9',
  // Firefox only supports encoding VP8
  'video/webm',
  // Safari only supports encoding H264 as mp4
  'video/mp4'].find(i => MediaRecorder.isTypeSupported(i));
  const fileExtension = mimeType.split(';')[0].split('/')[1];
  while (true) {
    const elem = await addon.tab.waitForElement('div[class*="menu-bar_file-group"] > div:last-child:not(.sa-record)', {
      markAsSeen: true,
      reduxEvents: ['scratch-gui/mode/SET_PLAYER', 'fontsLoaded/SET_FONTS_LOADED', 'scratch-gui/locales/SELECT_LOCALE']
    });
    const getOptions = async () => new Promise(async resolve => {
      // Initialize window manager
      const WM = await initWindowManager();

      // Create a window using the window manager
      optionsWindow = WM.createWindow({
        id: 'media-recorder-options',
        title: msg('option-title'),
        width: 420,
        height: 480,
        minWidth: 340,
        minHeight: 360,
        resizable: true,
        maximizable: true,
        className: 'media-recorder-options-window',
        onClose: () => {
          resolve(null);
          optionsWindow = null;
        }
      });

      // Create content container
      const content = document.createElement('div');
      content.className = 'media-recorder-content';

      // Description
      const description = Object.assign(document.createElement('p'), {
        textContent: msg('record-description', {
          extension: ".".concat(fileExtension)
        }),
        className: 'media-recorder-description'
      });
      content.appendChild(description);

      // Form container
      const form = document.createElement('div');
      form.className = 'media-recorder-form';

      // Seconds input
      const secondsGroup = document.createElement('div');
      secondsGroup.className = 'media-recorder-input-group';
      const secondsLabel = Object.assign(document.createElement('label'), {
        textContent: msg('record-duration'),
        className: 'media-recorder-label'
      });
      const secondsInput = Object.assign(document.createElement('input'), {
        type: 'number',
        min: 1,
        max: 600,
        value: 30,
        className: 'media-recorder-input'
      });
      secondsGroup.appendChild(secondsLabel);
      secondsGroup.appendChild(secondsInput);
      form.appendChild(secondsGroup);

      // Delay input
      const delayGroup = document.createElement('div');
      delayGroup.className = 'media-recorder-input-group';
      const delayLabel = Object.assign(document.createElement('label'), {
        textContent: msg('start-delay'),
        className: 'media-recorder-label'
      });
      const delayInput = Object.assign(document.createElement('input'), {
        type: 'number',
        min: 0,
        max: 600,
        value: 0,
        className: 'media-recorder-input'
      });
      delayGroup.appendChild(delayLabel);
      delayGroup.appendChild(delayInput);
      form.appendChild(delayGroup);

      // Audio checkbox
      const audioGroup = document.createElement('label');
      audioGroup.className = 'media-recorder-checkbox-group';
      const audioInput = Object.assign(document.createElement('input'), {
        type: 'checkbox',
        checked: true,
        className: 'media-recorder-checkbox'
      });
      const audioText = document.createTextNode(msg('record-audio'));
      audioGroup.appendChild(audioInput);
      audioGroup.appendChild(audioText);
      audioGroup.title = msg('record-audio-description');
      form.appendChild(audioGroup);

      // Mic checkbox
      const micGroup = document.createElement('label');
      micGroup.className = 'media-recorder-checkbox-group';
      const micInput = Object.assign(document.createElement('input'), {
        type: 'checkbox',
        checked: false,
        className: 'media-recorder-checkbox'
      });
      const micText = document.createTextNode(msg('record-mic'));
      micGroup.appendChild(micInput);
      micGroup.appendChild(micText);
      form.appendChild(micGroup);

      // Green flag checkbox
      const flagGroup = document.createElement('label');
      flagGroup.className = 'media-recorder-checkbox-group';
      const flagInput = Object.assign(document.createElement('input'), {
        type: 'checkbox',
        checked: true,
        className: 'media-recorder-checkbox'
      });
      const flagText = document.createTextNode(msg('record-after-flag'));
      flagGroup.appendChild(flagInput);
      flagGroup.appendChild(flagText);
      form.appendChild(flagGroup);

      // Stop sign checkbox
      const stopGroup = document.createElement('label');
      stopGroup.className = 'media-recorder-checkbox-group';
      const stopInput = Object.assign(document.createElement('input'), {
        type: 'checkbox',
        checked: true,
        className: 'media-recorder-checkbox'
      });
      const stopText = document.createTextNode(msg('record-until-stop'));
      stopGroup.appendChild(stopInput);
      stopGroup.appendChild(stopText);

      // Handle dependency between flag and stop checkboxes
      flagInput.addEventListener('change', () => {
        const disabled = !flagInput.checked;
        stopInput.disabled = disabled;
        if (disabled) {
          stopGroup.title = msg('record-until-stop-disabled', {
            afterFlagOption: msg('record-after-flag')
          });
          stopGroup.classList.add('disabled');
        } else {
          stopGroup.title = '';
          stopGroup.classList.remove('disabled');
        }
      });
      form.appendChild(stopGroup);

      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'media-recorder-buttons';

      // Cancel button
      const cancelButton = Object.assign(document.createElement('button'), {
        textContent: msg('cancel'),
        className: 'media-recorder-button media-recorder-button-cancel'
      });
      cancelButton.addEventListener('click', () => {
        optionsWindow.close();
        resolve(null);
        optionsWindow = null;
      });

      // Start button
      const startButton = Object.assign(document.createElement('button'), {
        textContent: msg('start'),
        className: 'media-recorder-button media-recorder-button-start'
      });
      startButton.addEventListener('click', () => {
        const options = {
          secs: Number(secondsInput.value),
          delay: Number(delayInput.value),
          audioEnabled: audioInput.checked,
          micEnabled: micInput.checked,
          waitUntilFlag: flagInput.checked,
          useStopSign: !stopInput.disabled && stopInput.checked
        };

        // Don't close window immediately, keep it open for status
        resolve(options);
      });
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(startButton);
      content.appendChild(form);
      content.appendChild(buttonContainer);

      // Set the content and show the window
      optionsWindow.setContent(content);
      optionsWindow.show();
    });

    // Function to show recording status in the options window
    const showRecordingStatus = opts => {
      if (!optionsWindow) return;

      // Update window title
      optionsWindow.setTitle("".concat(msg('option-title'), " - Recording"));

      // Create status content
      const statusContent = document.createElement('div');
      statusContent.className = 'media-recorder-content';

      // Status header
      const statusHeader = document.createElement('div');
      statusHeader.className = 'media-recorder-status-header';
      statusHeader.innerHTML = "\n        <div class=\"media-recorder-status-icon\">\uD83C\uDFAC</div>\n        <div class=\"media-recorder-status-text\">\n          <h3>Recording in Progress</h3>\n          <p>Your project is being recorded. You can stop anytime using the button below.</p>\n        </div>\n      ";
      statusContent.appendChild(statusHeader);

      // Status info container
      const statusInfo = document.createElement('div');
      statusInfo.className = 'media-recorder-status-info';

      // Recording time display
      const timeDisplay = document.createElement('div');
      timeDisplay.className = 'media-recorder-status-item';
      timeDisplay.innerHTML = "\n        <span class=\"media-recorder-status-label\">Time:</span>\n        <span class=\"media-recorder-status-value\" id=\"recording-time\">0s / ".concat(opts.secs, "s</span>\n      ");
      statusInfo.appendChild(timeDisplay);

      // Data size display
      const sizeDisplay = document.createElement('div');
      sizeDisplay.className = 'media-recorder-status-item';
      sizeDisplay.innerHTML = "\n        <span class=\"media-recorder-status-label\">Size:</span>\n        <span class=\"media-recorder-status-value\" id=\"recording-size\">0 KB</span>\n      ";
      statusInfo.appendChild(sizeDisplay);
      statusContent.appendChild(statusInfo);

      // Stop buttons
      const stopButtonContainer = document.createElement('div');
      stopButtonContainer.className = 'media-recorder-buttons';

      // Cancel button (doesn't save)
      const cancelButton = document.createElement('button');
      cancelButton.className = 'media-recorder-button media-recorder-button-cancel';
      cancelButton.textContent = 'Cancel Recording';
      cancelButton.addEventListener('click', () => {
        stopRecording(true); // Force stop without saving
      });

      // End and save button
      const saveButton = document.createElement('button');
      saveButton.className = 'media-recorder-button media-recorder-button-save';
      saveButton.textContent = 'End and Save';
      saveButton.addEventListener('click', () => {
        stopRecording(false); // Normal stop with saving
      });
      stopButtonContainer.appendChild(cancelButton);
      stopButtonContainer.appendChild(saveButton);
      statusContent.appendChild(stopButtonContainer);

      // Update window content
      optionsWindow.setContent(statusContent);

      // Return elements for updating
      return {
        timeElement: statusContent.querySelector('#recording-time'),
        sizeElement: statusContent.querySelector('#recording-size')
      };
    };
    const disposeRecorder = () => {
      isRecording = false;
      updateRecordButton(msg('record'));
      const recordElem = getRecordElem();
      recordElem.title = '';
      recorder = null;
      recordBuffer = [];
      clearTimeout(timeout);
      timeout = 0;
      if (stopSignFunc) {
        addon.tab.traps.vm.runtime.off('PROJECT_STOP_ALL', stopSignFunc);
        stopSignFunc = null;
      }

      // Close the options window if it's still open
      if (optionsWindow) {
        optionsWindow.close();
        optionsWindow = null;
      }
    };
    const stopRecording = force => {
      if (isWaitingForFlag) {
        addon.tab.traps.vm.runtime.off('PROJECT_START', waitingForFlagFunc);
        isWaitingForFlag = false;
        waitingForFlagFunc = null;
        abortController.abort();
        abortController = null;
        disposeRecorder();
        return;
      }
      if (!isRecording || !recorder || recorder.state === 'inactive') return;
      if (force) {
        disposeRecorder();
      } else {
        // The onstop handler is already set, just stop the recorder
        recorder.stop();
      }
    };

    // Function to update record button content while preserving camera icon
    const updateRecordButton = text => {
      // Clear all content
      const tempRecordElem = getRecordElem();
      tempRecordElem.innerHTML = '';

      // Re-add camera icon
      const cameraIcon = document.createElement('span');
      cameraIcon.innerHTML = "\n                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-video-icon lucide-video\"><path d=\"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\"/><rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"2\"/></svg>\n            ";

      // Add icon and text
      tempRecordElem.appendChild(cameraIcon);
      tempRecordElem.appendChild(document.createTextNode(text));
    };
    const startRecording = async opts => {
      // Timer
      const secs = Math.min(600, Math.max(1, opts.secs));

      // Show recording status in the window
      const statusElements = showRecordingStatus(opts);
      let startTime = null;
      let statusInterval = null;

      // Initialize MediaRecorder
      recordBuffer = [];
      isRecording = true;
      const vm = addon.tab.traps.vm;
      let micStream;
      if (opts.micEnabled) {
        // Show permission dialog before green flag is clicked
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
        } catch (e) {
          if (e.name !== 'NotAllowedError' && e.name !== 'NotFoundError') throw e;
          opts.micEnabled = false;
        }
      }
      if (opts.waitUntilFlag) {
        isWaitingForFlag = true;
        updateRecordButton(msg('click-flag'));
        recordElem.title = msg('click-flag-description');
        abortController = new AbortController();
        try {
          await Promise.race([new Promise(resolve => {
            waitingForFlagFunc = () => resolve();
            vm.runtime.once('PROJECT_START', waitingForFlagFunc);
          }), new Promise((_, reject) => {
            abortController.signal.addEventListener('abort', () => reject('aborted'), {
              once: true
            });
          })]);
        } catch (e) {
          if (e.message === 'aborted') return;
          throw e;
        }
      }
      isWaitingForFlag = false;
      waitingForFlagFunc = abortController = null;
      const stream = new MediaStream();
      const videoStream = vm.runtime.renderer.canvas.captureStream();
      stream.addTrack(videoStream.getVideoTracks()[0]);
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      if (opts.audioEnabled) {
        const mediaStreamDestination = vm.runtime.audioEngine.audioContext.createMediaStreamDestination();
        vm.runtime.audioEngine.inputNode.connect(mediaStreamDestination);
        const audioSource = ctx.createMediaStreamSource(mediaStreamDestination.stream);
        audioSource.connect(dest);
      }
      if (opts.micEnabled) {
        const micSource = ctx.createMediaStreamSource(micStream);
        micSource.connect(dest);
      }
      if (opts.audioEnabled || opts.micEnabled) {
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      }
      recorder = new MediaRecorder(stream, {
        mimeType
      });
      recorder.ondataavailable = e => {
        recordBuffer.push(e.data);
      };
      recorder.onerror = e => {
        console.warn('Recorder error:', e.error);
        stopRecording(true);
      };
      recorder.onstop = () => {
        var _addon$tab$redux$stat, _addon$tab$redux$stat2, _addon$tab$redux$stat3;
        const blob = new Blob(recordBuffer, {
          type: mimeType
        });
        Object(_libraries_common_cs_download_blob_js__WEBPACK_IMPORTED_MODULE_0__["default"])("".concat(((_addon$tab$redux$stat = addon.tab.redux.state) === null || _addon$tab$redux$stat === void 0 ? void 0 : (_addon$tab$redux$stat2 = _addon$tab$redux$stat.preview) === null || _addon$tab$redux$stat2 === void 0 ? void 0 : (_addon$tab$redux$stat3 = _addon$tab$redux$stat2.projectInfo) === null || _addon$tab$redux$stat3 === void 0 ? void 0 : _addon$tab$redux$stat3.title) || 'video', ".").concat(fileExtension), blob);
        disposeRecorder();
      };
      timeout = setTimeout(() => stopRecording(false), secs * 1000);
      if (opts.useStopSign) {
        stopSignFunc = () => stopRecording();
        vm.runtime.once('PROJECT_STOP_ALL', stopSignFunc);
      }

      // Delay
      const delay = opts.delay || 0;
      const roundedDelay = Math.floor(delay);
      for (let index = 0; index < roundedDelay; index++) {
        updateRecordButton(msg('starting-in', {
          secs: roundedDelay - index
        }));
        if (statusElements && statusElements.timeElement) {
          statusElements.timeElement.textContent = "Starting in ".concat(roundedDelay - index, "s...");
        }
        await new Promise(resolve => setTimeout(resolve, 975));
      }
      setTimeout(() => {
        updateRecordButton(msg('stop'));
        startTime = Date.now();

        // Start status updates
        if (statusElements) {
          statusInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, secs - elapsed);

            // Update time display (elapsed/total format)
            statusElements.timeElement.textContent = "".concat(elapsed, "s / ").concat(secs, "s");

            // Update data size
            const totalSize = recordBuffer.reduce((acc, chunk) => acc + chunk.size, 0);
            const sizeText = totalSize < 1024 * 1024 ? "".concat(Math.round(totalSize / 1024), " KB") : "".concat((totalSize / (1024 * 1024)).toFixed(1), " MB");
            statusElements.sizeElement.textContent = sizeText;
            if (remaining <= 0) {
              clearInterval(statusInterval);
            }
          }, 100);
        }
        recorder.start(1000);
      }, (delay - roundedDelay) * 1000);
    };
    if (!recordElem) {
      recordElem = Object.assign(document.createElement('div'), {
        className: "sa-record ".concat(elem.className)
      });

      // Initialize button with camera icon and text
      updateRecordButton(msg('record'));
      recordElem.addEventListener('click', async () => {
        if (isRecording) {
          stopRecording();
        } else {
          const opts = await getOptions();
          if (!opts) {
            console.log('Canceled');
            return;
          }
          startRecording(opts);
        }
      });
    }
    elem.parentElement.appendChild(recordElem);
  }
});

/***/ }),

/***/ "./src/addons/libraries/common/cs/download-blob.js":
/*!*********************************************************!*\
  !*** ./src/addons/libraries/common/cs/download-blob.js ***!
  \*********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// From https://github.com/scratchfoundation/scratch-gui/blob/develop/src/lib/download-blob.js
/* harmony default export */ __webpack_exports__["default"] = ((filename, blob) => {
  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);

  // Use special ms version if available to get it working on Edge.
  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }
  if ("download" in HTMLAnchorElement.prototype) {
    const url = window.URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.type = blob.type;
    downloadLink.click();
    // remove the link after a timeout to prevent a crash on iOS 13 Safari
    window.setTimeout(() => {
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
    }, 1000);
  } else {
    // iOS 12 Safari, open a new page and set href to data-uri
    let popup = window.open("", "_blank");
    const reader = new FileReader();
    reader.onloadend = function () {
      popup.location.href = reader.result;
      popup = null;
    };
    reader.readAsDataURL(blob);
  }
});

/***/ })

}]);
//# sourceMappingURL=addon-entry-mediarecorder.js.map
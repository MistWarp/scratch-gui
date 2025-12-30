import downloadBlob from '../../libraries/common/cs/download-blob.js';

import {Camera} from 'lucide-react';

let recordElem;
const getRecordElem = () => recordElem;
const setRecordElem = elem => {
    recordElem = elem;
};

export default async ({addon, console, msg}) => {
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
            const windowManagerModule = await import('../../../addons/window-system/window-manager.js');
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
        'video/mp4'
    ].find(i => MediaRecorder.isTypeSupported(i));
    const fileExtension = mimeType.split(';')[0].split('/')[1];

    while (true) {
        const elem = await addon.tab
            .waitForElement('div[class*="menu-bar_file-group"] > div:last-child:not(.sa-record)', {
                markAsSeen: true,
                reduxEvents: [
                    'scratch-gui/mode/SET_PLAYER',
                    'fontsLoaded/SET_FONTS_LOADED',
                    'scratch-gui/locales/SELECT_LOCALE']
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
                    extension: `.${fileExtension}`
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
            optionsWindow.setTitle(`${msg('option-title')} - Recording`);
      
            // Create status content
            const statusContent = document.createElement('div');
            statusContent.className = 'media-recorder-content';
      
            // Status header
            const statusHeader = document.createElement('div');
            statusHeader.className = 'media-recorder-status-header';
            statusHeader.innerHTML = `
        <div class="media-recorder-status-icon">🎬</div>
        <div class="media-recorder-status-text">
          <h3>Recording in Progress</h3>
          <p>Your project is being recorded. You can stop anytime using the button below.</p>
        </div>
      `;
            statusContent.appendChild(statusHeader);
      
            // Status info container
            const statusInfo = document.createElement('div');
            statusInfo.className = 'media-recorder-status-info';
      
            // Recording time display
            const timeDisplay = document.createElement('div');
            timeDisplay.className = 'media-recorder-status-item';
            timeDisplay.innerHTML = `
        <span class="media-recorder-status-label">Time:</span>
        <span class="media-recorder-status-value" id="recording-time">0s / ${opts.secs}s</span>
      `;
            statusInfo.appendChild(timeDisplay);
      
            // Data size display
            const sizeDisplay = document.createElement('div');
            sizeDisplay.className = 'media-recorder-status-item';
            sizeDisplay.innerHTML = `
        <span class="media-recorder-status-label">Size:</span>
        <span class="media-recorder-status-value" id="recording-size">0 KB</span>
      `;
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
            cameraIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video-icon lucide-video"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            `;
      
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
                    micStream = await navigator.mediaDevices.getUserMedia({audio: true});
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
                    await Promise.race([
                        new Promise(resolve => {
                            waitingForFlagFunc = () => resolve();
                            vm.runtime.once('PROJECT_START', waitingForFlagFunc);
                        }),
                        new Promise((_, reject) => {
                            abortController.signal.addEventListener('abort', () => reject('aborted'), {once: true});
                        })
                    ]);
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
            recorder = new MediaRecorder(stream, {mimeType});
            recorder.ondataavailable = e => {
                recordBuffer.push(e.data);
            };
            recorder.onerror = e => {
                console.warn('Recorder error:', e.error);
                stopRecording(true);
            };
            recorder.onstop = () => {
                const blob = new Blob(recordBuffer, {type: mimeType});
                downloadBlob(`${addon.tab.redux.state?.preview?.projectInfo?.title || 'video'}.${fileExtension}`, blob);
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
                updateRecordButton(msg('starting-in', {secs: roundedDelay - index}));
                if (statusElements && statusElements.timeElement) {
                    statusElements.timeElement.textContent = `Starting in ${roundedDelay - index}s...`;
                }
                await new Promise(resolve => setTimeout(resolve, 975));
            }
      
            setTimeout(
                () => {
                    updateRecordButton(msg('stop'));
                    startTime = Date.now();
          
                    // Start status updates
                    if (statusElements) {
                        statusInterval = setInterval(() => {
                            const elapsed = Math.floor((Date.now() - startTime) / 1000);
                            const remaining = Math.max(0, secs - elapsed);
              
                            // Update time display (elapsed/total format)
                            statusElements.timeElement.textContent = `${elapsed}s / ${secs}s`;
              
                            // Update data size
                            const totalSize = recordBuffer.reduce((acc, chunk) => acc + chunk.size, 0);
                            const sizeText = totalSize < 1024 * 1024 ?
                                `${Math.round(totalSize / 1024)} KB` :
                                `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
                            statusElements.sizeElement.textContent = sizeText;
              
                            if (remaining <= 0) {
                                clearInterval(statusInterval);
                            }
                        }, 100);
                    }

                    recorder.start(1000);
                },
                (delay - roundedDelay) * 1000
            );
        };
        if (!recordElem) {
            recordElem = Object.assign(document.createElement('div'), {
                className: `sa-record ${elem.className}`
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
};

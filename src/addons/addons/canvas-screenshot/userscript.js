/**
 * Canvas Screenshot addon main script
 * @param {object} param0 Scratch addon parameters
 */
export default async function ({addon, msg}) {
    const vm = addon.tab.traps.vm;
  
    await new Promise(resolve => {
        if (vm.editingTarget) {
            return resolve();
        }
        vm.runtime.once('PROJECT_LOADED', () => {
            resolve();
        });
    });

    const screenshotButtonOuter = document.createElement('div');
    screenshotButtonOuter.className = 'sa-screenshot-container';
  
    const screenshotButton = document.createElement('div');
    screenshotButton.className = addon.tab.scratchClass('button_outlined-button', 'stage-header_stage-button');
  
    const screenshotButtonContent = document.createElement('div');
    screenshotButtonContent.className = addon.tab.scratchClass('button_content');
  
    const screenshotButtonImage = document.createElement('svg');
    screenshotButtonImage.className = addon.tab.scratchClass('stage-header_stage-button-icon');
    screenshotButtonImage.draggable = false;
    const iconSrc = addon.self.getResource('/icons/camera.svg');
    screenshotButtonImage.innerHTML = iconSrc;
  
    screenshotButtonContent.appendChild(screenshotButtonImage);
    screenshotButton.appendChild(screenshotButtonContent);
    screenshotButtonOuter.appendChild(screenshotButton);

    const playSoundEffect = () => {
        const soundUrl = addon.settings.get('sound_url');
        if (soundUrl) {
            try {
                const audio = new Audio(soundUrl);
                audio.volume = 0.3;
                audio.play().catch(() => {});
            } catch (err) {
                // Audio creation failed - ignore silently
            }
        }
    };

    const showPreview = (dataUrl) => {
        if (!addon.settings.get('show_notifications')) return;
    
        const preview = document.createElement('div');
        preview.className = 'sa-screenshot-preview';
    
        const image = document.createElement('img');
        image.src = dataUrl;
        preview.appendChild(image);
    
        document.body.appendChild(preview);
    
        setTimeout(() => preview.classList.add('sa-screenshot-preview-visible'), 100);
        setTimeout(() => {
            preview.classList.remove('sa-screenshot-preview-visible');
            setTimeout(() => {
                if (preview.parentNode) {
                    preview.parentNode.removeChild(preview);
                }
            }, 300);
        }, 3000);
    };

    const takeScreenshot = async () => {
        try {
            const renderer = vm.renderer;
      
            if (!renderer) {
                showNotification(msg('screenshot-error'), 'error');
                return;
            }

            // Use Scratch's built-in snapshot method
            const snapshotPromise = new Promise(resolve => {
                renderer.requestSnapshot(uri => {
                    resolve(uri);
                });
            });

            const dataUrl = await snapshotPromise;
      
            if (!dataUrl) {
                showPreview(null);
                return;
            }

            // Convert data URL to blob for clipboard
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            if (!blob || blob.size === 0) {
                return;
            }

            // Copy to clipboard if supported
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({'image/png': blob})
                    ]);
                    showPreview(dataUrl);
                    playSoundEffect();
                } catch (err) {
                }
            } else {
                showPreview(dataUrl);
                playSoundEffect();
            }
      
        } catch (err) {
            showNotification(msg('screenshot-error'), 'error');
        }
    };

    // Add click event listener
    screenshotButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        takeScreenshot();
    });

    // Function to manage button visibility
    const updateButtonVisibility = () => {
        if (addon.tab.editorMode === 'editor') {
            // Add next to debugger with order 1 (debugger has order 0)
            try {
                addon.tab.appendToSharedSpace({
                    space: 'stageHeader',
                    element: screenshotButtonOuter,
                    order: 1
                });
            } catch (err) {
                // Failed to add button - ignore silently
            }
        } else if (screenshotButtonOuter.parentNode) {
            screenshotButtonOuter.remove();
        }
    };

    // Wait for stage header and manage button visibility
    while (true) {
        try {
            await addon.tab.waitForElement(
                '[class^="stage-header_stage-size-row"], [class^="stage-header_fullscreen-buttons-row_"]',
                {
                    markAsSeen: true,
                    reduxEvents: [
                        'scratch-gui/mode/SET_PLAYER',
                        'scratch-gui/mode/SET_FULL_SCREEN',
                        'fontsLoaded/SET_FONTS_LOADED',
                        'scratch-gui/locales/SELECT_LOCALE'
                    ]
                }
            );
      
            updateButtonVisibility();
      
            // Add a delay to avoid excessive processing
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

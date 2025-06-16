import { isPaused, setPaused, onPauseChanged, setup } from "../debugger/module.js";

export default async function ({ addon, console, msg }) {
  setup(addon);
  
  let stepButton = null;

  // Create the step frame button
  function createStepButton() {
    const button = document.createElement('img');
    button.className = 'frame-stepper-button';
    button.title = 'Step one frame';
    button.src = addon.self.getResource("/step.svg") /* rewritten by pull.js */;
    button.draggable = false;
    button.style.cssText = `
      display: none;
      cursor: pointer;
      margin-left: 8px;
      transition: all 0.2s ease;
      width: 32px;
      height: 32px;
      padding: 6px;
      border-radius: 6px;
      background: var(--ui-blue, #4c97ff);
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'var(--ui-blue-dark, #3373cc)';
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 2px 8px rgba(76, 151, 255, 0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'var(--ui-blue, #4c97ff)';
      button.style.transform = 'scale(1)';
      button.style.boxShadow = 'none';
    });
    
    // Add click handler for frame stepping
    button.addEventListener('click', () => {
      stepOneFrame();
    });
    
    return button;
  }

  // Function to step exactly one frame
  function stepOneFrame() {
    if (!isPaused()) return;
    
    try {
      const vm = addon.tab.traps.vm;
      if (!vm || !vm.runtime) {
        console.warn('VM not available for frame stepping');
        return;
      }

      // Set up a one-time listener for the AFTER_EXECUTE event
      const onAfterExecute = () => {
        // Remove the listener immediately to prevent multiple triggers
        vm.runtime.off('AFTER_EXECUTE', onAfterExecute);
        // Pause again after one frame has executed
        setPaused(true);
      };
      
      // Add the listener before unpausing
      vm.runtime.on('AFTER_EXECUTE', onAfterExecute);
      
      // Unpause to allow one frame to execute
      setPaused(false);
    } catch (error) {
      console.warn('Error stepping frame:', error);
    }
  }

  // Function to update button visibility based on pause state
  function updateStepButtonVisibility() {
    if (!stepButton) return;
    
    const shouldShow = isPaused();
    stepButton.style.display = shouldShow ? 'flex' : 'none';
  }

  // Function to find and insert the step button
  function insertStepButton() {
    // Look for the controls container (where play/pause/stop buttons are)
    const controlsContainer = document.querySelector('[class*="controls_controls-container"]') ||
                             document.querySelector('[class*="stage-header_stage-controls"]') ||
                             document.querySelector('.stage-controls');
    
    if (!controlsContainer) {
      // Try again later if not found
      setTimeout(insertStepButton, 1000);
      return;
    }

    // Look for the pause button specifically
    const pauseButton = controlsContainer.querySelector('[class*="stop-all_stop-all"]') ||
                       controlsContainer.querySelector('[aria-label*="Stop"]') ||
                       controlsContainer.querySelector('button[title*="stop"]');
    
    if (pauseButton && !stepButton) {
      stepButton = createStepButton();
      
      // Insert after the pause/stop button
      pauseButton.parentNode.insertBefore(stepButton, pauseButton.nextSibling);
      
      // Set up pause state monitoring
      onPauseChanged(updateStepButtonVisibility);
      
      // Update visibility immediately
      updateStepButtonVisibility();
    }
  }

  // Wait for stage controls and insert button
  while (true) {
    await addon.tab.waitForElement("[class^='green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    insertStepButton();
  }
}

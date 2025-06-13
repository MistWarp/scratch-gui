export default async function ({ addon, console, msg }) {
  // The settings window functionality is now handled in render-interface.jsx
  // This addon just ensures the feature is available and can be customized if needed
  
  console.log('Settings window addon loaded - addon settings will open in a draggable window');
  
  // Optional: Add any custom styling or behavior for the settings window here
  const addCustomStyling = () => {
    // Add custom CSS for settings window if needed
    const style = document.createElement('style');
    style.textContent = `
      .addon-window.sa-settings-window {
        /* Custom styling for settings window */
      }
    `;
    document.head.appendChild(style);
  };
  
  // Initialize custom styling
  addCustomStyling();
  
  // Cleanup when addon is disabled
  addon.self.addEventListener('disabled', () => {
    console.log('Settings window addon disabled');
  });
}

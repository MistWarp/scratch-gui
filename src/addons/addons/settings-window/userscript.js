export default async function ({ addon, console, msg }) {
  const WindowManager = (await import('../../window-system/window-manager.js')).default;
  
  let settingsWindow = null;
  let settingsComponent = null;
  
  // Override the global addon settings handler
  const originalHandleClickAddonSettings = window.handleClickAddonSettings;
  
  window.handleClickAddonSettings = function(addonId) {
    showSettingsWindow(addonId);
  };
  
  function showSettingsWindow(addonId) {
    if (settingsWindow) {
      // If window already exists, just focus it and optionally navigate to addon
      settingsWindow.focus();
      if (typeof addonId === 'string') {
        // Navigate to specific addon (we'll implement this later)
        navigateToAddon(addonId);
      }
      return;
    }
    
    // Create the settings window
    settingsWindow = WindowManager.createWindow({
      title: 'Addon Settings',
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      x: 100,
      y: 100,
      onClose: () => {
        settingsWindow = null;
        settingsComponent = null;
      }
    });
    
    // Create settings content
    createSettingsContent(addonId);
  }
  
  function createSettingsContent(addonId) {
    const container = settingsWindow.getContentElement();
    container.style.padding = '0';
    container.style.overflow = 'hidden';
    
    // Create iframe to load the settings page
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Construct the settings URL
    const path = process.env.ROUTING_STYLE === 'wildcard' ? 'addons' : 'addons.html';
    const url = `${process.env.ROOT}${path}${typeof addonId === 'string' ? `#${addonId}` : ''}`;
    
    iframe.src = url;
    container.appendChild(iframe);
    
    settingsComponent = iframe;
  }
  
  function navigateToAddon(addonId) {
    if (settingsComponent && settingsComponent.contentWindow) {
      // Try to navigate to the specific addon in the iframe
      try {
        const newUrl = settingsComponent.src.split('#')[0] + '#' + addonId;
        settingsComponent.src = newUrl;
      } catch (e) {
        console.warn('Could not navigate to addon:', e);
      }
    }
  }
  
  // Restore original handler when addon is disabled
  addon.self.addEventListener('disabled', () => {
    if (settingsWindow) {
      settingsWindow.close();
    }
    window.handleClickAddonSettings = originalHandleClickAddonSettings;
  });
}

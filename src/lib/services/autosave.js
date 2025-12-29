/**
 * Autosave service for automatically saving projects at regular intervals
 */

import SettingsStore from '../../addons/settings-store-singleton.js';

class AutosaveService {
    constructor () {
        this.vm = null;
        this.store = null;
        this.intervalId = null;
        this.enabled = false;
        this.interval = 5; // minutes
        this.showNotifications = true;
        this.onlyWhenChanged = true;
        this.lastSaveTime = 0;
        this.initialized = false;
        this.addonSettingsListener = null;
    }

    /**
     * Check if the service is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized () {
        return this.initialized;
    }

    /**
     * Initialize the autosave service
     * @param {VM} vm - The Scratch virtual machine instance
     * @param {Store} store - The Redux store
     */
    initialize (vm, store) {
        this.vm = vm;
        this.store = store;
        this.initialized = true;
        
        // Load settings from localStorage
        this.loadSettings();
        
        // Listen for Redux settings changes
        store.subscribe(() => {
            const state = store.getState();
            const autosaveState = state.scratchGui.autosave;
            
            // Only apply Redux settings if autosave addon is not enabled
            if (!SettingsStore.getAddonEnabled('autosave')) {
                if (autosaveState.enabled !== this.enabled) {
                    this.setEnabled(autosaveState.enabled);
                }
                if (autosaveState.interval !== this.interval) {
                    this.setInterval(autosaveState.interval);
                }
                if (autosaveState.showNotifications !== this.showNotifications) {
                    this.showNotifications = autosaveState.showNotifications;
                }
            }
        });
        
        // Listen for addon settings changes
        this.addonSettingsListener = e => {
            if (e.detail.addonId === 'autosave') {
                this.updateFromAddonSettings();
            }
        };
        SettingsStore.addEventListener('setting-changed', this.addonSettingsListener);
        
        // Initial load from addon settings if enabled
        this.updateFromAddonSettings();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings () {
        try {
            const saved = localStorage.getItem('scratch-autosave-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.enabled = settings.enabled || false;
                this.interval = settings.interval || 5;
                this.showNotifications = settings.showNotifications !== false;
                this.onlyWhenChanged = settings.onlyWhenChanged !== false;
            }
        } catch (e) {
            console.warn('Failed to load autosave settings:', e);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings () {
        try {
            const settings = {
                enabled: this.enabled,
                interval: this.interval,
                showNotifications: this.showNotifications,
                onlyWhenChanged: this.onlyWhenChanged
            };
            localStorage.setItem('scratch-autosave-settings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save autosave settings:', e);
        }
    }

    /**
     * Enable or disable autosave
     * @param {boolean} enabled - Whether autosave should be enabled
     */
    setEnabled (enabled) {
        this.enabled = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
    }

    /**
     * Set the autosave interval
     * @param {number} interval - Interval in minutes
     */
    setInterval (interval) {
        this.interval = Math.max(1, Math.min(60, interval)); // Clamp between 1-60 minutes
        this.saveSettings();
        
        if (this.enabled) {
            this.restart();
        }
    }

    /**
     * Update settings from addon settings
     */
    updateFromAddonSettings () {
        if (SettingsStore.getAddonEnabled('autosave')) {
            const wasEnabled = this.enabled;
            this.enabled = SettingsStore.getAddonSetting('autosave', 'enabled');
            this.interval = SettingsStore.getAddonSetting('autosave', 'interval');
            this.showNotifications = SettingsStore.getAddonSetting('autosave', 'showNotifications');
            this.onlyWhenChanged = SettingsStore.getAddonSetting('autosave', 'saveOnlyWhenChanged');
            
            // Start/stop autosave based on enabled state
            if (this.enabled && !wasEnabled) {
                this.start();
            } else if (!this.enabled && wasEnabled) {
                this.stop();
            } else if (this.enabled) {
                // Restart with new interval if needed
                this.start();
            }
        }
    }

    /**
     * Clean up the service and remove event listeners
     */
    destroy () {
        this.stop();
        if (this.addonSettingsListener) {
            SettingsStore.removeEventListener('setting-changed', this.addonSettingsListener);
            this.addonSettingsListener = null;
        }
        this.initialized = false;
    }

    /**
     * Start the autosave timer
     */
    start () {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        if (!this.enabled || !this.vm) return;
        
        const intervalMs = this.interval * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.performAutosave();
        }, intervalMs);
        
        console.log(`Autosave started with ${this.interval} minute interval`);
        
        if (this.showNotifications) {
            this.showNotification(`Autosave enabled - saving every ${this.interval} minutes`);
        }
    }

    /**
     * Stop the autosave timer
     */
    stop () {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('Autosave stopped');
    }

    /**
     * Restart the autosave timer (stop and start)
     */
    restart () {
        this.stop();
        this.start();
    }

    /**
     * Check if the project has changes that need saving
     * @returns {boolean} True if project needs saving
     */
    hasProjectChanged () {
        if (!this.onlyWhenChanged) return true;
        
        try {
            const state = this.store.getState();
            return state.scratchGui.projectChanged;
        } catch (e) {
            console.warn('Failed to check project changed state:', e);
            return true; // Default to saving if we can't check
        }
    }

    /**
     * Generate a filename for the autosaved project
     * @returns {string} Generated filename
     */
    generateAutosaveFilename () {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')
            .slice(0, 19);
        
        try {
            const state = this.store.getState();
            const projectTitle = state.scratchGui.projectTitle || 'Untitled';
            return `${projectTitle}_autosave_${timestamp}.sb3`;
        } catch (e) {
            return `Scratch_Project_autosave_${timestamp}.sb3`;
        }
    }

    /**
     * Perform an autosave
     * @returns {Promise<boolean>} True if save was successful
     */
    async performAutosave () {
        if (!this.enabled || !this.vm) {
            return false;
        }
        
        try {
            // Check if we have a project loaded
            if (!this.vm.runtime || !this.vm.runtime.targets || this.vm.runtime.targets.length === 0) {
                console.log('Autosave: No project loaded, skipping save');
                return false;
            }

            // Check if project has changed
            if (!this.hasProjectChanged()) {
                console.log('Autosave: Project unchanged, skipping save');
                return false;
            }

            console.log('Autosave: Starting automatic save...');
            
            if (this.showNotifications) {
                this.showNotification('Saving project...', 'saving');
            }

            // Get project data as blob
            const projectBlob = await this.vm.saveProjectSb3();
            const filename = this.generateAutosaveFilename();
            
            // Create download link and trigger download
            const url = URL.createObjectURL(projectBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            this.lastSaveTime = Date.now();
            
            if (this.showNotifications) {
                this.showNotification(`Project saved as ${filename}`, 'success');
            }
            
            console.log(`Autosave: Successfully saved project as ${filename}`);
            return true;
            
        } catch (error) {
            console.error('Autosave: Failed to save project:', error);
            
            if (this.showNotifications) {
                this.showNotification('Failed to save project automatically', 'error');
            }
            
            return false;
        }
    }

    /**
     * Manually trigger an autosave
     * @returns {Promise<boolean>} True if save was successful
     */
    saveNow () {
        if (!this.enabled) {
            if (this.showNotifications) {
                this.showNotification('Autosave is disabled. Enable it in File menu first.', 'error');
            }
            return false;
        }
        
        return this.performAutosave();
    }

    /**
     * Show a notification to the user
     * @param {string} message - The message to show
     * @param {string} type - The type of notification (info, success, error, saving)
     */
    showNotification (message, type = 'info') {
        if (!this.showNotifications) return;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'autosave-notification';
        notification.textContent = message;
        
        // Add type-specific styling
        if (type === 'success') {
            notification.classList.add('autosave-success');
        } else if (type === 'error') {
            notification.classList.add('autosave-error');
        } else if (type === 'saving') {
            notification.classList.add('autosave-saving');
        }
        
        // Position and style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            backgroundColor: type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#333',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            zIndex: '10000',
            fontSize: '14px',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            maxWidth: '320px',
            wordWrap: 'break-word',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto-remove after duration
        const duration = type === 'saving' ? 2000 : 4000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Get the current autosave status
     * @returns {object} Status information
     */
    getStatus () {
        return {
            enabled: this.enabled,
            interval: this.interval,
            lastSaveTime: this.lastSaveTime,
            showNotifications: this.showNotifications,
            onlyWhenChanged: this.onlyWhenChanged
        };
    }
}

// Create a singleton instance
const autosaveService = new AutosaveService();

export default autosaveService;

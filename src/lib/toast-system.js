/**
 * Reusable Toast Notification System
 * Provides a simple API for showing toast notifications throughout the application
 */

class ToastSystem {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 4000;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'info', 'success', 'warning', 'error'
     * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
     * @param {object} options - Additional options (icon, action, etc.)
     * @returns {string} Toast ID for programmatic dismissal
     */
    show(message, type = 'info', duration = this.defaultDuration, options = {}) {
        const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.dataset.toastId = toastId;
        
        // Get theme colors from CSS variables to match GUI styling
        const getCSSVariable = (varName) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || null;
        };
        
        // Determine colors based on type, using theme CSS variables
        // Background uses GUI accent color, border uses UI background color
        const themeColors = {
            info: {
                outline: getCSSVariable('--motion-primary') || '#4C97FF',
                icon: 'ℹ️'
            },
            success: {
                outline: getCSSVariable('--control-primary') || '#FFAB19',
                icon: '✓'
            },
            warning: {
                outline: getCSSVariable('--control-primary') || '#FFAB19',
                icon: '⚠️'
            },
            error: {
                outline: getCSSVariable('--red-primary') || '#FF661A',
                icon: '✕'
            }
        };
        
        const color = themeColors[type] || themeColors.info;
        const icon = options.icon || color.icon;
        
        // Get UI background color for border/outline
        const uiBackground = getCSSVariable('--ui-primary') || 
                            getCSSVariable('--ui-secondary') || 
                            '#E5F0FF';
        
        // Build toast content
        let content = '';
        if (icon) {
            content += `<span class="toast-icon">${icon}</span>`;
        }
        content += `<span class="toast-message">${this.escapeHtml(message)}</span>`;
        
        if (options.action) {
            content += `<button class="toast-action" data-action="${options.action.id}">${this.escapeHtml(options.action.label)}</button>`;
        }
        
        toast.innerHTML = content;
        
        // Style the toast to match GUI theme
        // Background uses GUI accent color, border uses UI background color
        Object.assign(toast.style, {
            backgroundColor: uiBackground,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            fontSize: '14px',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            maxWidth: '400px',
            minWidth: '300px',
            wordWrap: 'break-word',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'default',
            border: `2px solid ${color.outline}`
        });
        
        // Add internal styles for toast elements
        const style = document.createElement('style');
        if (!document.getElementById('toast-system-styles')) {
            style.id = 'toast-system-styles';
            style.textContent = `
                .toast-container {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                }
                .toast {
                    position: relative;
                }
                .toast-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                }
                .toast-message {
                    flex: 1;
                    line-height: 1.4;
                }
                .toast-action {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    transition: background 0.2s;
                    flex-shrink: 0;
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                }
                .toast-action:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                .toast-action:active {
                    background: rgba(255, 255, 255, 0.4);
                }
                .toast-container {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Handle action button clicks
        if (options.action) {
            const actionBtn = toast.querySelector('.toast-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', () => {
                    if (options.action.callback) {
                        options.action.callback();
                    }
                    this.dismiss(toastId);
                });
            }
        }
        
        // Add to container
        this.container.appendChild(toast);
        this.toasts.push({ id: toastId, element: toast });
        
        // Limit number of toasts
        if (this.toasts.length > this.maxToasts) {
            const oldest = this.toasts.shift();
            this.dismiss(oldest.id);
        }
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toastId);
            }, duration);
        }
        
        return toastId;
    }

    /**
     * Dismiss a toast by ID
     * @param {string} toastId - The ID of the toast to dismiss
     */
    dismiss(toastId) {
        const toastIndex = this.toasts.findIndex(t => t.id === toastId);
        if (toastIndex === -1) return;
        
        const { element } = this.toasts[toastIndex];
        this.toasts.splice(toastIndex, 1);
        
        // Animate out
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }

    /**
     * Dismiss all toasts
     */
    dismissAll() {
        const ids = this.toasts.map(t => t.id);
        ids.forEach(id => this.dismiss(id));
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Convenience methods
     */
    info(message, duration, options) {
        return this.show(message, 'info', duration, options);
    }

    success(message, duration, options) {
        return this.show(message, 'success', duration, options);
    }

    warning(message, duration, options) {
        return this.show(message, 'warning', duration, options);
    }

    error(message, duration, options) {
        return this.show(message, 'error', duration, options);
    }
}

// Create singleton instance
const toastSystem = new ToastSystem();

// Make it available globally
if (typeof window !== 'undefined') {
    window.ToastSystem = toastSystem;
}

export default toastSystem;


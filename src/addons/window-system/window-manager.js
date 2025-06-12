/**
 * Centralized Window System for Addons
 * Provides a unified API for creating and managing draggable, resizable windows
 */

let nextZIndex = 1000;
let windowCount = 0;
const activeWindows = new Map();

class AddonWindow {
    constructor(options = {}) {
        this.id = options.id || `addon-window-${++windowCount}`;
        this.title = options.title || 'Addon Window';
        this.width = options.width || 400;
        this.height = options.height || 300;
        this.minWidth = options.minWidth || 200;
        this.minHeight = options.minHeight || 150;
        this.maxWidth = options.maxWidth || null;
        this.maxHeight = options.maxHeight || null;
        this.x = options.x || Math.random() * 100 + 50;
        this.y = options.y || Math.random() * 100 + 50;
        this.resizable = options.resizable !== false;
        this.modal = options.modal || false;
        this.closable = options.closable !== false;
        this.minimizable = options.minimizable !== false;
        this.maximizable = options.maximizable !== false;
        this.className = options.className || '';
        
        this.isVisible = false;
        this.isMinimized = false;
        this.isMaximized = false;
        this.zIndex = ++nextZIndex;
        
        this.onClose = options.onClose || (() => {});
        this.onMinimize = options.onMinimize || (() => {});
        this.onMaximize = options.onMaximize || (() => {});
        this.onRestore = options.onRestore || (() => {});
        this.onResize = options.onResize || (() => {});
        this.onMove = options.onMove || (() => {});
        
        this.element = null;
        this.headerElement = null;
        this.contentElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.savedState = null; // For maximize/restore
        
        this.createWindow();
        activeWindows.set(this.id, this);
    }
    
    createWindow() {
        // Create main window element
        this.element = document.createElement('div');
        this.element.className = `addon-window ${this.className}`;
        this.element.style.cssText = `
            position: fixed;
            left: ${this.x}px;
            top: ${this.y}px;
            width: ${this.width}px;
            height: ${this.height}px;
            z-index: ${this.zIndex};
            background: var(--ui-modal-background, #ffffff);
            border: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            display: none;
            flex-direction: column;
            overflow: hidden;
        `;
        
        this.element.addEventListener('mousedown', () => this.bringToFront());
        
        // Create header
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'addon-window-header';
        this.headerElement.style.cssText = `
            background: var(--ui-secondary, #f2f2f2);
            border-bottom: 1px solid var(--ui-black-transparent, rgba(0, 0, 0, 0.15));
            padding: 8px 12px;
            cursor: move;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 32px;
            box-sizing: border-box;
        `;
        
        // Title
        const titleElement = document.createElement('div');
        titleElement.className = 'addon-window-title';
        titleElement.textContent = this.title;
        titleElement.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            color: var(--text-primary, #575e75);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        
        // Controls
        const controlsElement = document.createElement('div');
        controlsElement.className = 'addon-window-controls';
        controlsElement.style.cssText = `
            display: flex;
            gap: 4px;
            align-items: center;
        `;
        
        // Control buttons
        if (this.minimizable) {
            const minimizeBtn = this.createControlButton('−', 'Minimize', () => this.minimize());
            controlsElement.appendChild(minimizeBtn);
        }
        
        if (this.maximizable) {
            const maximizeBtn = this.createControlButton('□', 'Maximize', () => this.toggleMaximize());
            controlsElement.appendChild(maximizeBtn);
        }
        
        if (this.closable) {
            const closeBtn = this.createControlButton('×', 'Close', () => this.close());
            closeBtn.style.color = '#ff4444';
            controlsElement.appendChild(closeBtn);
        }
        
        this.headerElement.appendChild(titleElement);
        this.headerElement.appendChild(controlsElement);
        
        // Create content area
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'addon-window-content';
        this.contentElement.style.cssText = `
            flex: 1;
            overflow: auto;
            padding: 12px;
            box-sizing: border-box;
        `;
        
        this.element.appendChild(this.headerElement);
        this.element.appendChild(this.contentElement);
        
        // Add resize handles if resizable
        if (this.resizable) {
            this.addResizeHandles();
        }
        
        // Add drag functionality
        this.addDragFunctionality();
        
        // Add to DOM
        document.body.appendChild(this.element);
    }
    
    createControlButton(text, title, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.title = title;
        button.style.cssText = `
            background: transparent;
            border: none;
            cursor: pointer;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            color: var(--text-primary, #575e75);
            transition: background-color 0.2s;
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'var(--ui-black-transparent, rgba(0, 0, 0, 0.1))';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        
        return button;
    }
    
    addDragFunctionality() {
        this.headerElement.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            this.isDragging = true;
            this.bringToFront();
            
            const rect = this.element.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', this.handleDrag);
            document.addEventListener('mouseup', this.handleDragEnd);
            
            e.preventDefault();
        });
        
        this.handleDrag = (e) => {
            if (!this.isDragging) return;
            
            const newX = e.clientX - this.dragOffset.x;
            const newY = e.clientY - this.dragOffset.y;
            
            // Keep window within viewport
            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;
            
            this.x = Math.max(0, Math.min(maxX, newX));
            this.y = Math.max(0, Math.min(maxY, newY));
            
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            this.onMove(this.x, this.y);
        };
        
        this.handleDragEnd = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', this.handleDrag);
            document.removeEventListener('mouseup', this.handleDragEnd);
        };
    }
    
    addResizeHandles() {
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            
            const styles = {
                position: 'absolute',
                backgroundColor: 'transparent',
                zIndex: '10'
            };
            
            // Set position and cursor for each handle
            switch (direction) {
                case 'n':
                    Object.assign(styles, {
                        top: '0', left: '8px', right: '8px', height: '4px',
                        cursor: 'n-resize'
                    });
                    break;
                case 'ne':
                    Object.assign(styles, {
                        top: '0', right: '0', width: '8px', height: '8px',
                        cursor: 'ne-resize'
                    });
                    break;
                case 'e':
                    Object.assign(styles, {
                        right: '0', top: '8px', bottom: '8px', width: '4px',
                        cursor: 'e-resize'
                    });
                    break;
                case 'se':
                    Object.assign(styles, {
                        bottom: '0', right: '0', width: '8px', height: '8px',
                        cursor: 'se-resize'
                    });
                    break;
                case 's':
                    Object.assign(styles, {
                        bottom: '0', left: '8px', right: '8px', height: '4px',
                        cursor: 's-resize'
                    });
                    break;
                case 'sw':
                    Object.assign(styles, {
                        bottom: '0', left: '0', width: '8px', height: '8px',
                        cursor: 'sw-resize'
                    });
                    break;
                case 'w':
                    Object.assign(styles, {
                        left: '0', top: '8px', bottom: '8px', width: '4px',
                        cursor: 'w-resize'
                    });
                    break;
                case 'nw':
                    Object.assign(styles, {
                        top: '0', left: '0', width: '8px', height: '8px',
                        cursor: 'nw-resize'
                    });
                    break;
            }
            
            Object.assign(handle.style, styles);
            
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResize(e, direction);
            });
            
            this.element.appendChild(handle);
        });
    }
    
    startResize(e, direction) {
        this.isResizing = true;
        this.resizeDirection = direction;
        this.bringToFront();
        
        const rect = this.element.getBoundingClientRect();
        this.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
        
        document.addEventListener('mousemove', this.handleResize);
        document.addEventListener('mouseup', this.handleResizeEnd);
        
        e.preventDefault();
    }
    
    handleResize = (e) => {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;
        const direction = this.resizeDirection;
        
        let newWidth = this.resizeStart.width;
        let newHeight = this.resizeStart.height;
        let newX = this.x;
        let newY = this.y;
        
        // Calculate new dimensions based on resize direction
        if (direction.includes('e')) newWidth += deltaX;
        if (direction.includes('w')) {
            newWidth -= deltaX;
            newX = this.resizeStart.left + deltaX;
        }
        if (direction.includes('s')) newHeight += deltaY;
        if (direction.includes('n')) {
            newHeight -= deltaY;
            newY = this.resizeStart.top + deltaY;
        }
        
        // Apply constraints
        newWidth = Math.max(this.minWidth, newWidth);
        newHeight = Math.max(this.minHeight, newHeight);
        
        if (this.maxWidth) newWidth = Math.min(this.maxWidth, newWidth);
        if (this.maxHeight) newHeight = Math.min(this.maxHeight, newHeight);
        
        // Update dimensions
        this.width = newWidth;
        this.height = newHeight;
        this.x = newX;
        this.y = newY;
        
        this.element.style.width = `${newWidth}px`;
        this.element.style.height = `${newHeight}px`;
        this.element.style.left = `${newX}px`;
        this.element.style.top = `${newY}px`;
        
        this.onResize(newWidth, newHeight);
    };
    
    handleResizeEnd = () => {
        this.isResizing = false;
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.handleResizeEnd);
    };
    
    bringToFront() {
        this.zIndex = ++nextZIndex;
        this.element.style.zIndex = this.zIndex;
    }
    
    show() {
        this.isVisible = true;
        this.element.style.display = 'flex';
        this.bringToFront();
        return this;
    }
    
    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
        return this;
    }
    
    close() {
        this.hide();
        this.onClose();
        activeWindows.delete(this.id);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    minimize() {
        if (this.isMinimized) return this;
        
        this.isMinimized = true;
        this.hide();
        this.onMinimize();
        return this;
    }
    
    restore() {
        if (this.isMaximized) {
            this.isMaximized = false;
            if (this.savedState) {
                this.x = this.savedState.x;
                this.y = this.savedState.y;
                this.width = this.savedState.width;
                this.height = this.savedState.height;
                this.element.style.left = `${this.x}px`;
                this.element.style.top = `${this.y}px`;
                this.element.style.width = `${this.width}px`;
                this.element.style.height = `${this.height}px`;
            }
        }
        
        if (this.isMinimized) {
            this.isMinimized = false;
            this.show();
        }
        
        this.onRestore();
        return this;
    }
    
    maximize() {
        if (this.isMaximized) return this;
        
        // Save current state
        this.savedState = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
        
        this.isMaximized = true;
        this.x = 0;
        this.y = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.element.style.left = '0px';
        this.element.style.top = '0px';
        this.element.style.width = '100vw';
        this.element.style.height = '100vh';
        
        this.onMaximize();
        return this;
    }
    
    toggleMaximize() {
        if (this.isMaximized) {
            this.restore();
        } else {
            this.maximize();
        }
        return this;
    }
    
    setTitle(title) {
        this.title = title;
        const titleElement = this.headerElement.querySelector('.addon-window-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        return this;
    }
    
    setContent(content) {
        this.contentElement.innerHTML = '';
        if (typeof content === 'string') {
            this.contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.contentElement.appendChild(content);
        }
        return this;
    }
    
    getContentElement() {
        return this.contentElement;
    }
    
    center() {
        this.x = (window.innerWidth - this.width) / 2;
        this.y = (window.innerHeight - this.height) / 2;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        return this;
    }
}

// Window Manager API
const WindowManager = {
    createWindow(options) {
        return new AddonWindow(options);
    },
    
    getWindow(id) {
        return activeWindows.get(id);
    },
    
    getAllWindows() {
        return Array.from(activeWindows.values());
    },
    
    closeWindow(id) {
        const window = activeWindows.get(id);
        if (window) {
            window.close();
        }
    },
    
    closeAllWindows() {
        for (const window of activeWindows.values()) {
            window.close();
        }
    },
    
    bringToFront(id) {
        const window = activeWindows.get(id);
        if (window) {
            window.bringToFront();
        }
    }
};

export default WindowManager;

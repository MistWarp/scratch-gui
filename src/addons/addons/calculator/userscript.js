import WindowManager from '../../window-system/window-manager.js';

export default async function ({ addon, msg, console }) {
    const vm = addon.tab.traps.vm;
    
    let calculatorWindow = null;
    let calculatorButton = null;
    let cleanupFunctions = [];
    
    // Calculator state
    let display = '0';
    let previousValue = null;
    let operation = null;
    let waitingForOperand = false;
    let memory = 0;
    
    // Calculator functions
    function calculate(firstValue, secondValue, operation) {
        switch (operation) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '*':
                return firstValue * secondValue;
            case '/':
                return secondValue !== 0 ? firstValue / secondValue : NaN;
            case '=':
                return secondValue;
            default:
                return secondValue;
        }
    }
    
    function updateDisplay() {
        const displayElement = calculatorWindow?.getContentElement()?.querySelector('.calc-display');
        if (displayElement) {
            displayElement.textContent = display;
        }
    }
    
    function inputNumber(num) {
        if (waitingForOperand) {
            display = String(num);
            waitingForOperand = false;
        } else {
            display = display === '0' ? String(num) : display + num;
        }
        updateDisplay();
    }
    
    function inputDecimal() {
        if (waitingForOperand) {
            display = '0.';
            waitingForOperand = false;
        } else if (display.indexOf('.') === -1) {
            display += '.';
        }
        updateDisplay();
    }
    
    function clear() {
        display = '0';
        previousValue = null;
        operation = null;
        waitingForOperand = false;
        updateDisplay();
    }
    
    function performOperation(nextOperation) {
        const inputValue = parseFloat(display);
        
        if (previousValue === null) {
            previousValue = inputValue;
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = calculate(currentValue, inputValue, operation);
            
            display = String(newValue);
            previousValue = newValue;
            updateDisplay();
        }
        
        waitingForOperand = true;
        operation = nextOperation;
    }
    
    function percentage() {
        const value = parseFloat(display);
        display = String(value / 100);
        updateDisplay();
    }
    
    function toggleSign() {
        if (display !== '0') {
            display = display.startsWith('-') ? display.slice(1) : '-' + display;
            updateDisplay();
        }
    }
    
    function memoryAdd() {
        memory += parseFloat(display);
        updateMemoryIndicator();
    }
    
    function memorySubtract() {
        memory -= parseFloat(display);
        updateMemoryIndicator();
    }
    
    function memoryRecall() {
        display = String(memory);
        waitingForOperand = true;
        updateDisplay();
    }
    
    function memoryClear() {
        memory = 0;
        updateMemoryIndicator();
    }
    
    function updateMemoryIndicator() {
        const indicator = calculatorWindow?.getContentElement()?.querySelector('.calc-memory-indicator');
        if (indicator) {
            indicator.className = `calc-memory-indicator ${memory !== 0 ? 'active' : ''}`;
        }
    }
    
    function createCalculatorContent() {
        const container = document.createElement('div');
        container.className = 'calc-container';
        
        container.innerHTML = `
            <div class="calc-display-container">
                <div class="calc-memory-indicator ${memory !== 0 ? 'active' : ''}">M</div>
                <div class="calc-display">0</div>
            </div>
            <div class="calc-buttons">
                <div class="calc-row">
                    <button class="calc-btn calc-btn-function" data-action="memory-clear">MC</button>
                    <button class="calc-btn calc-btn-function" data-action="memory-recall">MR</button>
                    <button class="calc-btn calc-btn-function" data-action="memory-add">M+</button>
                    <button class="calc-btn calc-btn-function" data-action="memory-subtract">M-</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn calc-btn-function" data-action="clear">C</button>
                    <button class="calc-btn calc-btn-function" data-action="toggle-sign">±</button>
                    <button class="calc-btn calc-btn-function" data-action="percentage">%</button>
                    <button class="calc-btn calc-btn-operation" data-operation="/">÷</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn calc-btn-number" data-number="7">7</button>
                    <button class="calc-btn calc-btn-number" data-number="8">8</button>
                    <button class="calc-btn calc-btn-number" data-number="9">9</button>
                    <button class="calc-btn calc-btn-operation" data-operation="*">×</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn calc-btn-number" data-number="4">4</button>
                    <button class="calc-btn calc-btn-number" data-number="5">5</button>
                    <button class="calc-btn calc-btn-number" data-number="6">6</button>
                    <button class="calc-btn calc-btn-operation" data-operation="-">−</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn calc-btn-number" data-number="1">1</button>
                    <button class="calc-btn calc-btn-number" data-number="2">2</button>
                    <button class="calc-btn calc-btn-number" data-number="3">3</button>
                    <button class="calc-btn calc-btn-operation" data-operation="+">+</button>
                </div>
                <div class="calc-row">
                    <button class="calc-btn calc-btn-number calc-btn-zero" data-number="0">0</button>
                    <button class="calc-btn calc-btn-number" data-action="decimal">.</button>
                    <button class="calc-btn calc-btn-equals" data-operation="=">=</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        container.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.dataset.number) {
                inputNumber(parseInt(target.dataset.number));
            } else if (target.dataset.operation) {
                performOperation(target.dataset.operation);
            } else if (target.dataset.action) {
                switch (target.dataset.action) {
                    case 'decimal':
                        inputDecimal();
                        break;
                    case 'clear':
                        clear();
                        break;
                    case 'toggle-sign':
                        toggleSign();
                        break;
                    case 'percentage':
                        percentage();
                        break;
                    case 'memory-clear':
                        memoryClear();
                        break;
                    case 'memory-recall':
                        memoryRecall();
                        break;
                    case 'memory-add':
                        memoryAdd();
                        break;
                    case 'memory-subtract':
                        memorySubtract();
                        break;
                }
            }
        });
        
        // Add keyboard support
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                inputNumber(parseInt(e.key));
            } else if (e.key === '.') {
                e.preventDefault();
                inputDecimal();
            } else if (e.key === '+') {
                e.preventDefault();
                performOperation('+');
            } else if (e.key === '-') {
                e.preventDefault();
                performOperation('-');
            } else if (e.key === '*') {
                e.preventDefault();
                performOperation('*');
            } else if (e.key === '/') {
                e.preventDefault();
                performOperation('/');
            } else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                performOperation('=');
            } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                clear();
            } else if (e.key === '%') {
                e.preventDefault();
                percentage();
            }
        };
        
        // Add global keyboard listener when calculator is open
        document.addEventListener('keydown', handleKeyDown);
        cleanupFunctions.push(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });
        
        // Prevent scrolling on the calculator container
        const preventScroll = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        container.addEventListener('wheel', preventScroll);
        container.addEventListener('touchmove', preventScroll);
        container.addEventListener('scroll', preventScroll);
        
        cleanupFunctions.push(() => {
            container.removeEventListener('wheel', preventScroll);
            container.removeEventListener('touchmove', preventScroll);
            container.removeEventListener('scroll', preventScroll);
        });
        
        // Make container focusable for keyboard events
        container.tabIndex = 0;
        
        return container;
    }
    
    function createCalculatorWindow() {
        try {
            const savedPosition = addon.settings.get('remember_position') ? 
                JSON.parse(localStorage.getItem('sa-calculator-position') || 'null') : null;
            
            calculatorWindow = WindowManager.createWindow({
                id: 'calculator',
                title: 'Calculator',
                width: 280,
                height: 450,
                minWidth: 280,
                minHeight: 450,
                maxWidth: 280,
                maxHeight: 450,
                resizable: false,
                x: savedPosition?.x || Math.max(50, (window.innerWidth - 280) / 2),
                y: savedPosition?.y || Math.max(50, (window.innerHeight - 450) / 2),
                className: 'sa-calculator',
                onClose: () => {
                    calculatorWindow = null;
                    updateButtonState(false);
                    runCleanup();
                },
                onMove: (x, y) => {
                    if (addon.settings.get('remember_position')) {
                        localStorage.setItem('sa-calculator-position', JSON.stringify({ x, y }));
                    }
                }
            });
            
            const content = createCalculatorContent();
            calculatorWindow.setContent(content);
            calculatorWindow.show();
            
            // Focus the calculator for keyboard input
            setTimeout(() => {
                content.focus();
            }, 100);
            
            updateButtonState(true);
            return calculatorWindow;
        } catch (error) {
            console.error('Error creating calculator window:', error);
            updateButtonState(false);
            return null;
        }
    }
    
    function updateButtonState(isActive) {
        if (calculatorButton) {
            const calculatorButtonContent = calculatorButton.querySelector('[class*="button_content"]');
            if (calculatorButtonContent) {
                calculatorButtonContent.classList.toggle('active', isActive);
            }
        }
    }
    
    function runCleanup() {
        for (const cleanup of cleanupFunctions) {
            try {
                cleanup();
            } catch (error) {
                console.warn('Error during calculator cleanup:', error);
            }
        }
        cleanupFunctions.length = 0;
    }
    
    function createCalculatorButton() {
        if (!addon.settings.get('show_button')) return null;
        
        const calculatorButtonOuter = document.createElement("div");
        calculatorButtonOuter.className = "sa-calculator-container";
        
        const calculatorButtonElement = document.createElement("div");
        calculatorButtonElement.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
        
        const calculatorButtonContent = document.createElement("div");
        calculatorButtonContent.className = addon.tab.scratchClass("button_content");
        
        const calculatorButtonImage = document.createElement("img");
        calculatorButtonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
        calculatorButtonImage.draggable = false;
        calculatorButtonImage.src = addon.self.getResource("/icons/calculator.svg");
        calculatorButtonImage.title = 'Open Calculator';
        
        calculatorButtonContent.appendChild(calculatorButtonImage);
        calculatorButtonElement.appendChild(calculatorButtonContent);
        calculatorButtonOuter.appendChild(calculatorButtonElement);
        
        calculatorButton = calculatorButtonOuter;
        
        calculatorButtonElement.addEventListener('click', () => {
            try {
                if (calculatorWindow && calculatorWindow.isVisible) {
                    calculatorWindow.close();
                } else {
                    createCalculatorWindow();
                }
            } catch (error) {
                console.error('Calculator button click error:', error);
                updateButtonState(false);
            }
        });
        
        return calculatorButtonOuter;
    }
    
    function toggleCalculator() {
        if (calculatorWindow && calculatorWindow.isVisible) {
            calculatorWindow.close();
        } else {
            createCalculatorWindow();
        }
    }
    
    // Initialize the addon
    async function init() {
        // Wait for VM to be ready
        await new Promise((resolve) => {
            if (vm.editingTarget) {
                return resolve();
            }
            vm.runtime.once("PROJECT_LOADED", resolve);
        });

        // Function to manage button visibility
        const updateButtonVisibility = () => {
            if (addon.tab.editorMode === "editor" && addon.settings.get('show_button')) {
                try {
                    const buttonElement = createCalculatorButton();
                    if (buttonElement) {
                        addon.tab.appendToSharedSpace({ 
                            space: "stageHeader", 
                            element: buttonElement, 
                            order: 2 
                        });
                    }
                } catch (err) {
                    console.warn('Failed to add calculator button:', err);
                }
            } else {
                if (calculatorButton && calculatorButton.parentNode) {
                    calculatorButton.remove();
                }
                calculatorButton = null;
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
                            "scratch-gui/mode/SET_PLAYER",
                            "scratch-gui/mode/SET_FULL_SCREEN",
                            "fontsLoaded/SET_FONTS_LOADED",
                            "scratch-gui/locales/SELECT_LOCALE",
                        ],
                    }
                );
                
                updateButtonVisibility();
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    // Listen for setting changes
    addon.settings.addEventListener('changed', () => {
        if (calculatorWindow) {
            const content = createCalculatorContent();
            calculatorWindow.setContent(content);
            content.focus();
        }
    });
    
    // Add keyboard shortcut (Ctrl+Shift+C)
    const handleGlobalKeydown = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'C' && !e.altKey) {
            e.preventDefault();
            toggleCalculator();
        }
    };
    
    document.addEventListener('keydown', handleGlobalKeydown);
    cleanupFunctions.push(() => {
        document.removeEventListener('keydown', handleGlobalKeydown);
    });

    // Handle addon disable
    const handleStateChange = () => {
        if (!addon.self.enabled) {
            if (calculatorWindow) {
                calculatorWindow.close();
            }
            if (calculatorButton) {
                calculatorButton.remove();
                calculatorButton = null;
            }
            runCleanup();
        }
    };
    
    addon.tab.redux.addEventListener('statechanged', handleStateChange);
    cleanupFunctions.push(() => {
        addon.tab.redux.removeEventListener('statechanged', handleStateChange);
    });

    // Global cleanup on addon disable
    addon.self.addEventListener("disabled", () => {
        if (calculatorWindow) {
            calculatorWindow.close();
        }
        if (calculatorButton) {
            calculatorButton.remove();
            calculatorButton = null;
        }
        runCleanup();
    });

    // Start the addon
    init();
}

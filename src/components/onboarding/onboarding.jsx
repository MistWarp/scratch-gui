import PropTypes from 'prop-types';
import React, {Component, createRef} from 'react';
import ReactDOM from 'react-dom';
import WindowManager from '../../addons/window-system/window-manager.js';
import {Search, Maximize2, Palette, Sparkles, Hand, CheckCheck} from 'lucide-react';

import './onboarding.css';

const TUTORIAL_STEPS = [
    {
        title: 'Welcome to MistWarp!',
        content: 'Follow this short tour to discover the powerful features that make MistWarp special.',
        icon: Sparkles,
        selector: null,
        position: 'center'
    },
    {
        title: 'Find Anything',
        content: 'Use the search bar to quickly find blocks, variables, broadcasts, and text content within your sprite\'s code.',
        icon: Search,
        selector: '.sa-find-dropdown',
        position: 'bottom'
    },
    {
        title: 'Window Manager',
        content: 'MistWarp\'s window manager gives you unparalleled multitasking power. Drag windows anywhere, resize them to your liking, or keep them always-on-top when you need them.',
        icon: Maximize2,
        selector: null,
        position: 'center',
        optional: true
    },
    {
        title: 'Resize Panels',
        content: 'Drag the resize handles to adjust the size of your workspace. Customize the stage, backpack, and block palette to fit your needs.',
        icon: Hand,
        selector: '.stagePaneResizer',
        position: 'right'
    },
    {
        title: 'Personalize Your Experience',
        content: 'Choose from beautiful themes, accent colors, wallpapers, and custom fonts in Settings. Make MistWarp yours.',
        icon: Palette,
        selector: null,
        position: 'bottom'
    },
    {
        title: 'You\'re All Set!',
        content: 'You can access this tutorial anytime from the Edit menu. Now go create something amazing!',
        icon: CheckCheck,
        selector: null,
        position: 'center'
    }
];

class OnboardingTutorial extends Component {
    constructor (props) {
        super(props);
        this.windowRef = createRef();
        this.onboardingWindow = null;
        this.contentContainer = null;
    }

    componentDidMount () {
        this.openWindow();
    }

    componentDidUpdate (prevProps) {
        if (this.props.visible && !prevProps.visible) {
            this.openWindow();
        } else if (!this.props.visible && prevProps.visible) {
            this.closeWindow();
        } else if (this.props.visible && this.props.step !== prevProps.step) {
            this.handleStepChange(prevProps.step, this.props.step);
            this.updateWindowPosition();
        }
    }

    componentWillUnmount () {
        if (this.onboardingWindow) {
            this.onboardingWindow.destroy();
        }
    }

    handleStepChange (prevStep, newStep) {
        if (newStep === 1) {
            const findInput = document.querySelector('.mw-native-find-bar input');
            if (findInput) {
                findInput.focus();
            }
        }

        if (newStep === 4) {
            this.props.openSettingsMenu();
        }
    }

    openWindow () {
        if (this.onboardingWindow) {
            this.onboardingWindow.show();
            this.updateWindowPosition();
            return;
        }

        this.onboardingWindow = WindowManager.createWindow({
            id: 'onboarding-tutorial',
            title: 'MistWarp Tutorial',
            width: 340,
            height: 380,
            minWidth: 300,
            minHeight: 350,
            resizable: true,
            modal: false,
            closable: true,
            minimizable: true,
            maximizable: false,
            onClose: this.handleClose
        });

        // Create content container for React portal
        this.contentContainer = document.createElement('div');
        this.contentContainer.style.flex = '1';
        this.contentContainer.style.overflow = 'auto';
        this.contentContainer.style.minHeight = '0';

        this.onboardingWindow.setContent(this.contentContainer);
        this.onboardingWindow.show();
        setTimeout(() => this.updateWindowPosition(), 100);
        this.forceUpdate(); // Trigger re-render to render the portal content
    }

    closeWindow () {
        if (this.onboardingWindow) {
            this.onboardingWindow.hide();
        }
    }

    updateWindowPosition () {
        if (!this.onboardingWindow) return;

        const {step} = this.props;
        const currentStep = TUTORIAL_STEPS[step];

        if (!currentStep) return;

        if (!currentStep.selector || currentStep.position === 'center') {
            this.positionWindowCenter();
        } else {
            const target = document.querySelector(currentStep.selector);
            if (target) {
                const rect = target.getBoundingClientRect();
                this.positionWindowNearTarget(rect, currentStep.position);
            } else if (currentStep.optional) {
                this.positionWindowCenter();
            } else {
                this.positionWindowCenter();
            }
        }
    }

    positionWindowCenter () {
        if (!this.onboardingWindow) return;
        this.onboardingWindow.center();
    }

    positionWindowNearTarget (targetRect, position) {
        if (!this.onboardingWindow) return;

        const windowWidth = this.onboardingWindow.width;
        const windowHeight = this.onboardingWindow.height;
        const margin = 20;
        let x; let y;

        switch (position) {
        case 'bottom':
            x = Math.max(16, Math.min(
                window.innerWidth - windowWidth - 16,
                targetRect.left + ((targetRect.width - windowWidth) / 2)
            ));
            y = targetRect.bottom + margin;
            if (y + windowHeight > window.innerHeight - 16) {
                y = Math.max(64, targetRect.top - windowHeight - margin);
            }
            break;
        case 'right':
            x = targetRect.right + margin;
            if (x + windowWidth > window.innerWidth - 16) {
                x = Math.max(16, targetRect.left - windowWidth - margin);
            }
            y = Math.max(64, Math.min(window.innerHeight - windowHeight - 16, targetRect.top));
            break;
        case 'left':
            x = Math.max(16, targetRect.left - windowWidth - margin);
            if (x < 16) {
                x = targetRect.right + margin;
            }
            y = Math.max(64, Math.min(window.innerHeight - windowHeight - 16, targetRect.top));
            break;
        case 'center':
        default:
            this.positionWindowCenter();
            return;
        }

        this.onboardingWindow.moveTo(x, y);
    }

    handleClose = () => {
        this.props.onClose();
    };

    markAsComplete = () => {
        localStorage.setItem('mw:has-seen-onboarding', 'true');
    };

    markAsSkipped = () => {
        localStorage.setItem('mw:has-seen-onboarding', 'true');
    };

    renderContent () {
        if (!this.contentContainer) return null;

        const {step, onNext, onPrev} = this.props;
        const currentStep = TUTORIAL_STEPS[step];
        if (!currentStep) return null;

        const Icon = currentStep.icon;
        const isLastStep = step === TUTORIAL_STEPS.length - 1;
        const isFirstStep = step === 0;

        const content = (
            <div className="mw-onboarding-content">
                <div className="mw-onboarding-icon">
                    <Icon size={32} />
                </div>

                <h3 className="mw-onboarding-title">
                    {currentStep.title}
                </h3>

                <p className="mw-onboarding-description">
                    {currentStep.content}
                </p>

                <div className="mw-onboarding-steps">
                    {TUTORIAL_STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`mw-onboarding-step-dot ${index === step ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <div className="mw-onboarding-buttons">
                    {!isFirstStep && (
                        <button
                            className="mw-onboarding-button mw-onboarding-button-secondary"
                            onClick={onPrev}
                        >
                            {'←'}
                        </button>
                    )}

                    <button
                        className="mw-onboarding-button mw-onboarding-button-primary"
                        onClick={() => {
                            if (isLastStep) {
                                this.markAsComplete();
                                this.handleClose();
                            } else {
                                onNext();
                            }
                        }}
                    >
                        {isLastStep ? 'Start Creating' : 'Next '}
                        {!isLastStep && '→'}
                    </button>
                </div>

                {!isLastStep && (
                    <div
                        className="mw-onboarding-skip-text"
                        onClick={() => {
                            this.markAsSkipped();
                            this.handleClose();
                        }}
                    >
                        {'Skip tutorial'}
                    </div>
                )}

                {isLastStep && (
                    <button
                        className="mw-onboarding-button mw-onboarding-button-secondary"
                        style={{
                            width: '100%',
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                        onClick={() => {
                            localStorage.removeItem('mw:has-seen-onboarding');
                            this.handleClose();
                            setTimeout(() => this.openWindow(), 100);
                        }}
                    >
                        {'↻ Replay Tutorial'}
                    </button>
                )}
            </div>
        );

        return ReactDOM.createPortal(content, this.contentContainer);
    }

    render () {
        if (!this.props.visible) return null;
        return this.renderContent();
    }
}

OnboardingTutorial.propTypes = {
    visible: PropTypes.bool.isRequired,
    step: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    openSettingsMenu: PropTypes.func
};

export default OnboardingTutorial;

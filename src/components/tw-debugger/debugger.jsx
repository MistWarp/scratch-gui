import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';

import AddonWindow from '../../addons/window-system/window.jsx';
import createLogsTab from './tabs/logs.js';
import createThreadsTab from './tabs/threads.js';
import createPerformanceTab from './tabs/performance.js';
import createMemoryTab from './tabs/memory.js';

import playIcon from './icons/play.svg';
import stepIcon from './icons/step.svg';

import '!!style-loader!css-loader!./debugger.css';

const INITIAL_WIDTH = 640;
const INITIAL_HEIGHT = 460;

class Debugger extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'setContentRef',
            'handlePauseChanged',
            'handleResume',
            'handleStep',
            'handleTabClick',
            'handleToolbarButtonClick'
        ]);

        if (!props.controller.tabs) {
            props.controller.tabs = [
                createLogsTab(props.controller),
                createThreadsTab(props.controller),
                createPerformanceTab(props.controller),
                createMemoryTab(props.controller)
            ];
        }
        this.tabs = props.controller.tabs;
        this.activeTab = null;
        this.contentRef = null;

        this.state = {
            activeTabId: this.tabs[0].id,
            paused: props.controller.engine.isPaused()
        };
    }

    componentDidMount () {
        this.props.controller.setVisible(true);
        this.props.controller.events.addEventListener('pause', this.handlePauseChanged);
    }

    componentDidUpdate (prevProps, prevState) {
        if (prevState.activeTabId !== this.state.activeTabId) {
            this.mountActiveTab();
        }
    }

    componentWillUnmount () {
        this.props.controller.setVisible(false);
        this.props.controller.events.removeEventListener('pause', this.handlePauseChanged);
        if (this.activeTab && this.activeTab.hide) {
            this.activeTab.hide();
        }
    }

    getActiveTab () {
        return this.tabs.find(tab => tab.id === this.state.activeTabId);
    }

    mountActiveTab () {
        if (!this.contentRef) return;
        const nextTab = this.getActiveTab();
        if (this.activeTab === nextTab && this.contentRef.contains(nextTab.content)) return;
        if (this.activeTab && this.activeTab !== nextTab && this.activeTab.hide) {
            this.activeTab.hide();
        }
        this.activeTab = nextTab;
        while (this.contentRef.firstChild) {
            this.contentRef.removeChild(this.contentRef.firstChild);
        }
        this.contentRef.appendChild(nextTab.content);
        if (nextTab.show) {
            nextTab.show();
        }
    }

    setContentRef (element) {
        this.contentRef = element;
        if (element) {
            this.mountActiveTab();
        }
    }

    handlePauseChanged (event) {
        this.setState({paused: event.paused});
    }

    handleResume () {
        this.props.controller.engine.setPaused(false);
    }

    handleStep () {
        this.props.controller.engine.singleStep();
    }

    handleTabClick (e) {
        this.setState({activeTabId: e.currentTarget.dataset.tabId});
    }

    handleToolbarButtonClick (e) {
        const button = this.getActiveTab().buttons[Number(e.currentTarget.dataset.index)];
        if (button) {
            button.onClick();
        }
    }

    render () {
        const {paused} = this.state;
        const activeTab = this.getActiveTab();

        return (
            <AddonWindow
                id="debugger"
                title="Debugger"
                className="sa-debugger-window"
                width={INITIAL_WIDTH}
                height={INITIAL_HEIGHT}
                minWidth={400}
                minHeight={300}
                onClose={this.props.onClose}
                onMinimize={this.props.onClose}
            >
                <div
                    className="mw-debugger-tabs"
                    role="tablist"
                >
                    {this.tabs.map(tab => (
                        <button
                            key={tab.id}
                            role="tab"
                            data-tab-id={tab.id}
                            aria-selected={tab.id === this.state.activeTabId}
                            className={
                                tab.id === this.state.activeTabId ?
                                    'mw-debugger-tab mw-debugger-tab-active' :
                                    'mw-debugger-tab'
                            }
                            onClick={this.handleTabClick}
                        >
                            <span
                                className="mw-debugger-tab-icon"
                                style={{maskImage: `url(${tab.icon})`, WebkitMaskImage: `url(${tab.icon})`}}
                            />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mw-debugger-toolbar">
                    {paused && (
                        <div className="mw-debugger-paused">
                            <span className="mw-debugger-paused-dot" />
                            {'Paused'}
                        </div>
                    )}
                    {paused && (
                        <button
                            className="mw-debugger-toolbar-btn mw-debugger-resume"
                            onClick={this.handleResume}
                        >
                            <span
                                className="mw-debugger-toolbar-icon"
                                style={{maskImage: `url(${playIcon})`, WebkitMaskImage: `url(${playIcon})`}}
                            />
                            {'Resume'}
                        </button>
                    )}
                    {paused && (
                        <button
                            className="mw-debugger-toolbar-btn"
                            onClick={this.handleStep}
                        >
                            <span
                                className="mw-debugger-toolbar-icon"
                                style={{maskImage: `url(${stepIcon})`, WebkitMaskImage: `url(${stepIcon})`}}
                            />
                            {'Step'}
                        </button>
                    )}
                    <div className="mw-debugger-toolbar-spacer" />
                    {activeTab.buttons.map((button, index) => (
                        <button
                            key={index}
                            className="mw-debugger-toolbar-btn"
                            data-index={index}
                            onClick={this.handleToolbarButtonClick}
                        >
                            {button.icon && (
                                <span
                                    className="mw-debugger-toolbar-icon"
                                    style={{
                                        maskImage: `url(${button.icon})`,
                                        WebkitMaskImage: `url(${button.icon})`
                                    }}
                                />
                            )}
                            {button.label}
                        </button>
                    ))}
                </div>

                <div
                    className="mw-debugger-body"
                    ref={this.setContentRef}
                />
            </AddonWindow>
        );
    }
}

Debugger.propTypes = {
    controller: PropTypes.shape({
        engine: PropTypes.object,
        setVisible: PropTypes.func,
        tabs: PropTypes.array,
        events: PropTypes.object
    }).isRequired,
    onClose: PropTypes.func.isRequired
};

export default Debugger;

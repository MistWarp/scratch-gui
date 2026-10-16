import PropTypes from 'prop-types';
import React from 'react';
import {RoturConsentBody} from '../mw-rotur-consent-modal/consent-modal.jsx';
import styles from './frame-prompt.css';

const ENABLE_DELAY = 700;

const watchVisibility = (element, onChange) => {
    if (typeof IntersectionObserver === 'undefined') return null;
    let observer;
    try {
        observer = new IntersectionObserver(entries => {
            const entry = entries[entries.length - 1];
            onChange(entry.isVisible !== false);
        }, {trackVisibility: true, delay: 100});
    } catch (e) {
        return null;
    }
    observer.observe(element);
    return observer;
};

class FramePrompt extends React.Component {
    constructor (props) {
        super(props);
        this.dialog = React.createRef();
        this.state = {ready: false, visible: true};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleAllowed = () => this.answer(true);
        this.handleDenied = () => this.answer(false);
        this.handleBlocked = () => this.answer('block');
        this.handleShareThis = () => this.answer('this');
        this.handleShareAll = () => this.answer('all');
    }

    componentDidMount () {
        this.timer = setTimeout(() => this.setState({ready: true}), ENABLE_DELAY);
        this.observer = watchVisibility(this.dialog.current, visible => this.setState({visible}));
        if (this.dialog.current) this.dialog.current.focus();
    }

    componentWillUnmount () {
        clearTimeout(this.timer);
        if (this.observer) this.observer.disconnect();
    }

    answer (value) {
        if (value !== false && value !== 'block' && !(this.state.ready && this.state.visible)) return;
        this.props.onAnswer(value);
    }

    handleKeyDown (event) {
        if (event.key === 'Escape') this.answer(false);
    }

    render () {
        const enabled = this.state.ready && this.state.visible;
        return (
            <div
                className={styles.backdrop}
                onKeyDown={this.handleKeyDown}
            >
                <div
                    className={styles.dialog}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Rotur"
                    tabIndex={-1}
                    ref={this.dialog}
                >
                    <div className={styles.origin}>{`MistWarp account (${location.host})`}</div>
                    <fieldset
                        disabled={!enabled}
                        style={{border: 0, margin: 0, padding: 0, minWidth: 0}}
                    >
                        <RoturConsentBody
                            type={this.props.type}
                            data={this.props.data}
                            onAllowed={this.handleAllowed}
                            onDenied={this.handleDenied}
                            onBlocked={this.handleBlocked}
                            onShareThis={this.handleShareThis}
                            onShareAll={this.handleShareAll}
                            onShareNo={this.handleDenied}
                        />
                    </fieldset>
                </div>
            </div>
        );
    }
}

FramePrompt.propTypes = {
    type: PropTypes.oneOf(['consent', 'confirm', 'share']).isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.object.isRequired,
    onAnswer: PropTypes.func.isRequired
};

export default FramePrompt;

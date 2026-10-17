import PropTypes from 'prop-types';
import React from 'react';
import {RoturConsentBody} from '../mw-rotur-consent-modal/consent-modal.jsx';
import styles from './frame-prompt.css';
import modalStyles from '../tw-security-manager-modal/security-manager-modal.css';

const ENABLE_DELAY = 700;

const supportsVisibilityCheck = () => typeof IntersectionObserver !== 'undefined' &&
    typeof IntersectionObserverEntry !== 'undefined' &&
    'isVisible' in IntersectionObserverEntry.prototype;

const watchVisibility = (element, onChange) => {
    if (typeof IntersectionObserver === 'undefined') return null;
    const observer = new IntersectionObserver(entries => {
        const entry = entries[entries.length - 1];
        onChange(entry.isVisible === true && entry.intersectionRatio >= 0.99);
    }, {trackVisibility: true, delay: 100, threshold: [0, 0.99, 1]});
    observer.observe(element);
    return observer;
};

class FramePrompt extends React.Component {
    constructor (props) {
        super(props);
        this.dialog = React.createRef();
        this.state = {ready: false, visible: props.mode === 'window'};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleAllowed = () => this.answer(true);
        this.handleDenied = () => this.answer(false);
        this.handleBlocked = () => this.answer('block');
        this.handleShareThis = () => this.answer('this');
        this.handleShareAll = () => this.answer('all');
        this.handleReview = () => this.props.onReview();
    }

    componentDidMount () {
        this.startDelay();
        if (this.props.mode === 'inline' && this.dialog.current) {
            this.observer = watchVisibility(this.dialog.current, visible => {
                if (visible && !this.state.visible) this.startDelay();
                this.setState({visible});
            });
        }
        if (this.dialog.current) this.dialog.current.focus();
    }

    componentWillUnmount () {
        clearTimeout(this.timer);
        if (this.observer) this.observer.disconnect();
    }

    startDelay () {
        clearTimeout(this.timer);
        this.setState({ready: false});
        this.timer = setTimeout(() => this.setState({ready: true}), ENABLE_DELAY);
    }

    answer (value) {
        if (value !== false && value !== 'block' && !(this.state.ready && this.state.visible)) return;
        this.props.onAnswer(value);
    }

    handleKeyDown (event) {
        if (event.key === 'Escape') this.answer(false);
    }

    renderSignOut () {
        return (
            <div className={modalStyles.body}>
                <h2>{'Sign out of MistWarp?'}</h2>
                <p>
                    {this.props.data.username ?
                        `This signs @${this.props.data.username} out of MistWarp in every tab on this browser.` :
                        'This signs you out of MistWarp in every tab on this browser.'}
                </p>
                <div className={modalStyles.buttons}>
                    <button
                        type="button"
                        className={modalStyles.denyButton}
                        onClick={this.handleDenied}
                    >
                        {'Cancel'}
                    </button>
                    <button
                        type="button"
                        className={modalStyles.allowButton}
                        onClick={this.handleAllowed}
                    >
                        {'Sign out'}
                    </button>
                </div>
            </div>
        );
    }

    renderReview () {
        return (
            <div className={modalStyles.body}>
                <h2>{'Review this request'}</h2>
                <p>
                    {this.props.type === 'signout' ?
                        'The editor is asking to sign you out of MistWarp. ' +
                            'Open a MistWarp window to see the request and answer it.' :
                        `"${this.props.data.name || 'This project'}" is asking to use your Rotur account. ` +
                            'Open a MistWarp window to see the request and answer it.'}
                </p>
                {this.props.reviewError ? <p>{this.props.reviewError}</p> : null}
                <div className={modalStyles.buttons}>
                    <button
                        type="button"
                        className={modalStyles.denyButton}
                        onClick={this.handleDenied}
                    >
                        {'Not now'}
                    </button>
                    <button
                        type="button"
                        className={modalStyles.allowButton}
                        onClick={this.handleReview}
                    >
                        {'Review in a MistWarp window'}
                    </button>
                </div>
            </div>
        );
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
                    aria-label={this.props.type === 'signout' ? 'MistWarp' : 'Rotur'}
                    tabIndex={-1}
                    ref={this.dialog}
                >
                    <div className={styles.origin}>{`MistWarp account (${location.host})`}</div>
                    {this.props.mode === 'review' ? this.renderReview() : (
                        <fieldset
                            className={styles.fields}
                            disabled={!enabled}
                        >
                            {this.props.type === 'signout' ? this.renderSignOut() : <RoturConsentBody
                                type={this.props.type}
                                data={this.props.data}
                                onAllowed={this.handleAllowed}
                                onDenied={this.handleDenied}
                                onBlocked={this.handleBlocked}
                                onShareThis={this.handleShareThis}
                                onShareAll={this.handleShareAll}
                                onShareNo={this.handleDenied}
                            />}
                        </fieldset>
                    )}
                </div>
            </div>
        );
    }
}

FramePrompt.propTypes = {
    type: PropTypes.oneOf(['consent', 'confirm', 'share', 'signout']).isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    data: PropTypes.object.isRequired,
    mode: PropTypes.oneOf(['inline', 'review', 'window']).isRequired,
    reviewError: PropTypes.string,
    onAnswer: PropTypes.func.isRequired,
    onReview: PropTypes.func
};

export {supportsVisibilityCheck};
export default FramePrompt;

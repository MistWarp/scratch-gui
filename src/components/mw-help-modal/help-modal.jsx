import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/windowed-modal.jsx';
import {DOCS_BASE, getHelpEntry} from '../../lib/help/index.js';

import styles from './help-modal.css';

const messages = defineMessages({
    title: {
        defaultMessage: 'Help',
        description: 'Title of the Help window',
        id: 'mw.help.title'
    }
});

// The docs are built for full-width viewing; zoom out so more fits in the window.
const HELP_ZOOM = '0.9';

const helpUrl = selectedId => {
    const entry = getHelpEntry(selectedId);
    return `${DOCS_BASE}${(entry && entry.docsPath) || ''}/`;
};

const editorIsDark = () => {
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--ui-modal-background')
        .trim();
    if (!raw) return false;
    const probe = document.createElement('span');
    probe.style.color = raw;
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g);
    probe.remove();
    if (!rgb) return false;
    const [r, g, b] = rgb.map(Number);
    return ((0.299 * r) + (0.587 * g) + (0.114 * b)) < 128;
};

// The docs iframe is same-origin, so hand it the editor's live theme custom
// properties and color mode. The docs CSS maps Infima vars onto these.
const applyEditorTheme = frame => {
    try {
        const doc = frame && frame.contentDocument;
        if (!doc || !doc.documentElement) return;
        doc.documentElement.style.cssText = document.documentElement.style.cssText;
        doc.documentElement.setAttribute('data-theme', editorIsDark() ? 'dark' : 'light');
        if (doc.body) doc.body.style.zoom = HELP_ZOOM;
    } catch (e) {
        // cross-document access can throw during teardown; safe to ignore
    }
};

class HelpModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleLoad']);
        this.frame = null;
        this.observer = null;
    }
    componentDidMount () {
        // Set before the iframe's docs bundle initializes so it boots in the
        // right color mode (Docusaurus reads this key once at load).
        try {
            localStorage.setItem('theme', editorIsDark() ? 'dark' : 'light');
        } catch (e) {
            // storage may be unavailable; the onLoad sync still handles colors
        }
        // Re-sync when the user changes theme while Help is open. The editor
        // applies themes by mutating inline styles/classes on <html>.
        this.observer = new MutationObserver(() => applyEditorTheme(this.frame));
        this.observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    componentWillUnmount () {
        if (this.observer) this.observer.disconnect();
    }
    handleLoad (e) {
        this.frame = e.target;
        applyEditorTheme(this.frame);
    }
    render () {
        const src = helpUrl(this.props.selectedId);
        return (
            <Modal
                className={styles.modalContent}
                contentLabel={this.props.intl.formatMessage(messages.title)}
                onRequestClose={this.props.onClose}
                id="helpModal"
                width={880}
                height={620}
                minWidth={520}
                minHeight={400}
            >
                <iframe
                    key={src}
                    className={styles.frame}
                    src={src}
                    title={this.props.intl.formatMessage(messages.title)}
                    onLoad={this.handleLoad}
                />
            </Modal>
        );
    }
}

HelpModal.propTypes = {
    intl: intlShape.isRequired,
    selectedId: PropTypes.string,
    onClose: PropTypes.func.isRequired
};

export default injectIntl(HelpModal);

import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';

import styles from './settings-modal.css';

const Header = props => (
    <div className={styles.header}>
        {props.children}
    </div>
);

Header.propTypes = {
    children: PropTypes.node
};

const AddonsPage = () => {
    const iframeRef = React.useRef(null);

    const syncCSSVariables = React.useCallback(() => {
        if (!iframeRef.current) return;

        const iframe = iframeRef.current;
        const iframeDoc = iframe.contentDocument;
        const iframeHtml = iframeDoc.documentElement;
        const iframeBody = iframeDoc.body;

        if (!iframeBody) return;

        iframeBody.style.background = 'transparent';
        iframeHtml.style.background = 'transparent';

        const rootStyle = window.getComputedStyle(document.documentElement);
        const bodyStyle = window.getComputedStyle(document.body);

        const variables = [];

        for (let i = rootStyle.length - 1; i >= 0; i--) {
            const prop = rootStyle[i];
            if (prop.startsWith('--')) {
                const value = rootStyle.getPropertyValue(prop);
                variables.push(`${prop}: ${value};`);
            }
        }

        for (let i = bodyStyle.length - 1; i >= 0; i--) {
            const prop = bodyStyle[i];
            if (prop.startsWith('--')) {
                const value = bodyStyle.getPropertyValue(prop);
                variables.push(`${prop}: ${value};`);
            }
        }

        if (variables.length > 0) {
            const style = iframeDoc.createElement('style');
            style.textContent = `
                html, body {
                    background: transparent !important;
                }
                :root, html, body {
                    ${variables.join(' ')}
                }
            `;
            iframeDoc.head.appendChild(style);
        }
    }, []);

    const handleIframeLoad = React.useCallback(() => {
        syncCSSVariables();
    }, [syncCSSVariables]);

    React.useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleIframeLoad);
            return () => {
                iframe.removeEventListener('load', handleIframeLoad);
            };
        }
    }, [handleIframeLoad]);

    return (
        <div className={styles.addonsContainer}>
            <iframe
                ref={iframeRef}
                className={styles.addonsIframe}
                title="Addons settings"
                src="/addons.html"
                frameBorder="0"
                sandbox="allow-same-origin allow-scripts allow-modals allow-forms allow-popups"
            />
        </div>
    );
};

const ProjectPage = props => (
    <React.Fragment>
        <Header>
            <FormattedMessage
                defaultMessage="Project Settings"
                id="tw.settingsModal.projectSettings"
            />
        </Header>
        <div className={styles.setting}>
            <button
                onClick={props.onStoreProjectOptions}
                className={styles.button}
            >
                <FormattedMessage
                    defaultMessage="Store settings in project"
                    id="tw.settingsModal.storeProjectOptions"
                />
            </button>
            <p className={styles.detail}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="Stores the selected settings in the project so they will be automatically applied when the project is loaded."
                    id="tw.settingsModal.storeProjectOptionsHelp"
                />
            </p>
            <label className={styles.label}>
                <FancyCheckbox
                    className={styles.checkbox}
                    checked={props.storeThemeInProject}
                    onChange={props.onStoreThemeInProjectChange}
                />
                <FormattedMessage
                    defaultMessage="Also store theme in project"
                    id="tw.settingsModal.storeThemeInProject"
                />
            </label>
            <p className={styles.detail}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="If enabled, the current MistWarp theme will also be saved with the project settings."
                    id="tw.settingsModal.storeThemeInProjectHelp"
                />
            </p>
        </div>
    </React.Fragment>
);

ProjectPage.propTypes = {
    onStoreProjectOptions: PropTypes.func,
    storeThemeInProject: PropTypes.bool,
    onStoreThemeInProjectChange: PropTypes.func
};

export {
    AddonsPage,
    ProjectPage
};

import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import styles from './project-load-error.css';

const ProjectLoadError = ({error, onRetry}) => (
    <div className={styles.wrapper}>
        <div
            className={styles.body}
            role="alert"
        >
            <h1>
                <FormattedMessage
                    defaultMessage="Could not load project"
                    description="Heading when a project download fails"
                    id="mw.projectLoadError.title"
                />
            </h1>
            <p>
                <FormattedMessage
                    defaultMessage="Check your connection and try again."
                    description="Advice when a project download fails"
                    id="mw.projectLoadError.description"
                />
            </p>
            <p className={styles.details}>{error.message || String(error)}</p>
            <button
                type="button"
                onClick={onRetry}
            >
                <FormattedMessage
                    defaultMessage="Try again"
                    description="Retry downloading the requested project"
                    id="mw.projectLoadError.retry"
                />
            </button>
        </div>
    </div>
);

ProjectLoadError.propTypes = {
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    onRetry: PropTypes.func.isRequired
};

export default ProjectLoadError;

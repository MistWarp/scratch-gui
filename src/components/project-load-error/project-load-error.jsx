import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';
import styles from './project-load-error.css';

// A fresh editor with the default project, without the project that failed.
const newProjectHref = () => (process.env.ROUTING_STYLE === 'wildcard' ?
    `${process.env.ROOT || '/'}editor` : 'editor.html');

export const unknownExtensionId = error => {
    const match = /^Unknown extension: (.+)$/.exec(String((error && error.message) || error || ''));
    return match ? match[1] : null;
};

const ProjectLoadError = ({error, isEmbedded, onNewProject, onOpenFile, onRetry}) => {
    const missingExtension = unknownExtensionId(error);
    const handleNewProject = useCallback(event => {
        if (!onNewProject) return;
        event.preventDefault();
        onNewProject();
    }, [onNewProject]);
    return (
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
                {missingExtension ? (
                    <p>
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="This project uses the extension {extension}, which MistWarp does not have. It was probably made in another Scratch mod."
                            description="Shown when a project needs an extension MistWarp does not include"
                            id="mw.projectLoadError.unknownExtension"
                            values={{extension: <code>{missingExtension}</code>}}
                        />
                    </p>
                ) : (
                    <React.Fragment>
                        <p>
                            <FormattedMessage
                                defaultMessage="Check your connection and try again."
                                description="Advice when a project download fails"
                                id="mw.projectLoadError.description"
                            />
                        </p>
                        <p className={styles.details}>{error.message || String(error)}</p>
                    </React.Fragment>
                )}
                <div className={styles.actions}>
                    {missingExtension || !onRetry ? null : (
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
                    )}
                    {/* A link, so it works even if the editor never finished starting. */}
                    {isEmbedded ? null : (
                        <a
                            className={styles.secondary}
                            href={newProjectHref()}
                            onClick={handleNewProject}
                        >
                            <FormattedMessage
                                defaultMessage="Start a new project"
                                // eslint-disable-next-line max-len
                                description="Link on the project load error screen that opens the editor with a new project"
                                id="mw.projectLoadError.newProject"
                            />
                        </a>
                    )}
                    {onOpenFile ? (
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={onOpenFile}
                        >
                            <FormattedMessage
                                defaultMessage="Open a file"
                                // eslint-disable-next-line max-len
                                description="Button on the project load error screen that loads a project from the computer"
                                id="mw.projectLoadError.openFile"
                            />
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

ProjectLoadError.propTypes = {
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    isEmbedded: PropTypes.bool,
    onNewProject: PropTypes.func,
    onOpenFile: PropTypes.func,
    onRetry: PropTypes.func
};

export default ProjectLoadError;

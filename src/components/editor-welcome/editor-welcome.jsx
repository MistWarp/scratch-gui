import PropTypes from 'prop-types';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {X} from 'lucide-react';

import {STARTERS} from '../../lib/starter-projects';
import {DOCS_BASE} from '../../lib/help/index.js';
import {getCommandPaletteKey} from '../../lib/shortcuts/command-palette.js';
import {getIsShowingWithoutId} from '../../reducers/project-state';
import {
    dismissEditorWelcome,
    isEditorWelcomeDismissed,
    shouldShowEditorWelcome
} from '../../lib/editor-welcome.js';

import styles from './editor-welcome.css';

const messages = defineMessages({
    dismiss: {
        defaultMessage: 'Dismiss',
        description: 'Accessible label for the button that closes the editor welcome card',
        id: 'mw.editorWelcome.dismiss'
    },
    region: {
        defaultMessage: 'Getting started',
        description: 'Accessible label for the editor welcome card shown on a first visit',
        id: 'mw.editorWelcome.region'
    }
});

const starterUrl = id => {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('starter', id);
    return url.toString();
};

const readLocation = () => ({
    hash: window.location.hash,
    search: window.location.search
});

const EditorWelcome = ({
    intl,
    isEmbedded,
    isPlayerOnly,
    isShowingDefaultProject,
    projectChanged,
    onOpenFile
}) => {
    const [dismissed, setDismissed] = useState(isEditorWelcomeDismissed);
    const [initialLocation] = useState(readLocation);
    const wasShown = useRef(false);

    const visible = shouldShowEditorWelcome({
        dismissed,
        isEmbedded,
        isPlayerOnly,
        isShowingDefaultProject,
        projectChanged,
        ...initialLocation
    });

    const dismiss = useCallback(() => {
        dismissEditorWelcome();
        setDismissed(true);
    }, []);

    useEffect(() => {
        if (visible) {
            wasShown.current = true;
        } else if (wasShown.current && !dismissed) {
            dismiss();
        }
    }, [visible, dismissed, dismiss]);

    const handleStarter = useCallback(event => {
        dismissEditorWelcome();
        window.location.assign(starterUrl(event.currentTarget.dataset.starter));
    }, []);

    const handleDocs = useCallback(() => {
        window.open(`${DOCS_BASE}/`, '_blank', 'noopener,noreferrer');
    }, []);

    if (!visible) return null;

    const paletteKey = getCommandPaletteKey();

    return (
        <aside
            className={styles.welcome}
            aria-label={intl.formatMessage(messages.region)}
        >
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.heading}>
                        <FormattedMessage
                            defaultMessage="Make your first project"
                            description="Heading of the welcome card shown the first time someone opens the editor"
                            id="mw.editorWelcome.heading"
                        />
                    </h2>
                    <button
                        type="button"
                        className={styles.close}
                        aria-label={intl.formatMessage(messages.dismiss)}
                        title={intl.formatMessage(messages.dismiss)}
                        onClick={dismiss}
                    >
                        <X size={16} />
                    </button>
                </div>
                <p className={styles.text}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Start from a small working project and change it, or open a project from your computer."
                        description="Text in the editor welcome card explaining the ways to start"
                        id="mw.editorWelcome.intro"
                    />
                </p>
                <div className={styles.starters}>
                    {STARTERS.map(starter => (
                        <button
                            key={starter.id}
                            type="button"
                            className={styles.starter}
                            data-starter={starter.id}
                            onClick={handleStarter}
                        >
                            <span className={styles.starterTop}>
                                <span className={styles.starterTitle}>{starter.title}</span>
                                <span className={styles.starterKind}>{starter.kind}</span>
                            </span>
                            <span className={styles.starterDescription}>{starter.description}</span>
                        </button>
                    ))}
                </div>
                <div className={styles.actions}>
                    {onOpenFile ? (
                        <button
                            type="button"
                            className={styles.action}
                            onClick={onOpenFile}
                        >
                            <FormattedMessage
                                defaultMessage="Open a file"
                                // eslint-disable-next-line max-len
                                description="Button in the editor welcome card that opens a project file from the computer"
                                id="mw.editorWelcome.openFile"
                            />
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className={styles.action}
                        onClick={handleDocs}
                    >
                        <FormattedMessage
                            defaultMessage="Documentation"
                            description="Button in the editor welcome card that opens the MistWarp documentation"
                            id="mw.editorWelcome.docs"
                        />
                    </button>
                </div>
                {paletteKey ? (
                    <p className={styles.hint}>
                        <FormattedMessage
                            defaultMessage="Press {shortcut} to search every command."
                            // eslint-disable-next-line max-len
                            description="Hint in the editor welcome card. {shortcut} is the command palette key, such as Ctrl+K."
                            id="mw.editorWelcome.commandPaletteHint"
                            values={{
                                shortcut: <kbd className={styles.key}>{paletteKey}</kbd>
                            }}
                        />
                    </p>
                ) : null}
            </div>
        </aside>
    );
};

EditorWelcome.propTypes = {
    intl: intlShape.isRequired,
    isEmbedded: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isShowingDefaultProject: PropTypes.bool,
    projectChanged: PropTypes.bool,
    onOpenFile: PropTypes.func
};

const mapStateToProps = state => ({
    isEmbedded: state.scratchGui.mode.isEmbedded,
    isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
    isShowingDefaultProject: getIsShowingWithoutId(state.scratchGui.projectState.loadingState),
    projectChanged: state.scratchGui.projectChanged
});

export {EditorWelcome};
export default injectIntl(connect(mapStateToProps)(EditorWelcome));

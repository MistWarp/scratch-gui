import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {Flag, X} from 'lucide-react';
import {getStarter} from '../../lib/starter-projects';
import {SAVE_FEEDBACK_EVENT} from '../../lib/mw/save-feedback';
import styles from './starter-guide.css';

const messages = defineMessages({
    guide: {
        id: 'mw.starterGuide.label',
        defaultMessage: 'Starter project guide',
        description: 'Accessible label of the guide shown above a starter project'
    },
    dismiss: {
        id: 'mw.starterGuide.dismiss',
        defaultMessage: 'Dismiss starter guide',
        description: 'Accessible label of the button that hides the starter project guide'
    }
});

const readStarter = () => getStarter(new URLSearchParams(window.location.search).get('starter'));

const StarterGuide = ({intl, vm, onImport}) => {
    const [starter, setStarter] = useState(readStarter);
    const [dismissed, setDismissed] = useState(false);
    useEffect(() => {
        const update = () => {
            setStarter(readStarter()); setDismissed(false);
        };
        const saved = event => {
            if (event.detail.vm === vm) setStarter(readStarter());
        };
        vm.on('PROJECT_LOADED', update);
        window.addEventListener(SAVE_FEEDBACK_EVENT, saved);
        return () => {
            vm.off('PROJECT_LOADED', update);
            window.removeEventListener(SAVE_FEEDBACK_EVENT, saved);
        };
    }, [vm]);
    const run = useCallback(() => vm.greenFlag(), [vm]);
    const dismiss = useCallback(() => setDismissed(true), []);
    if (!starter || dismissed) return null;
    return (
        <aside
            className={styles.guide}
            aria-label={intl.formatMessage(messages.guide)}
        >
            <div><strong>{starter.title}</strong><span>{starter.task}</span></div>
            <button
                type="button"
                onClick={run}
            >
                <Flag size={15} />
                <FormattedMessage
                    defaultMessage="Run project"
                    description="Starter guide button that clicks the green flag"
                    id="mw.starterGuide.run"
                />
            </button>
            {onImport ? <button
                type="button"
                onClick={onImport}
            >
                <FormattedMessage
                    defaultMessage="Open your own file"
                    description="Starter guide button that loads a project file from the computer"
                    id="mw.starterGuide.openFile"
                />
            </button> : null}
            <button
                type="button"
                aria-label={intl.formatMessage(messages.dismiss)}
                onClick={dismiss}
            ><X size={16} /></button>
        </aside>
    );
};

StarterGuide.propTypes = {intl: intlShape.isRequired, vm: PropTypes.object.isRequired, onImport: PropTypes.func};
export default injectIntl(StarterGuide);

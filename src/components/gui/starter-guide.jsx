import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Flag, X} from 'lucide-react';
import {getStarter} from '../../lib/starter-projects';
import {SAVE_FEEDBACK_EVENT} from '../../lib/mw/save-feedback';
import styles from './starter-guide.css';

const readStarter = () => getStarter(new URLSearchParams(window.location.search).get('starter'));

const StarterGuide = ({vm, onImport}) => {
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
            aria-label="Starter project guide"
        >
            <div><strong>{starter.title}</strong><span>{starter.task}</span></div>
            <button
                type="button"
                onClick={run}
            ><Flag size={15} />{'Run project'}</button>
            {onImport ? <button
                type="button"
                onClick={onImport}
            >{'Open your own file'}</button> : null}
            <button
                type="button"
                aria-label="Dismiss starter guide"
                onClick={dismiss}
            ><X size={16} /></button>
        </aside>
    );
};

StarterGuide.propTypes = {vm: PropTypes.object.isRequired, onImport: PropTypes.func};
export default StarterGuide;

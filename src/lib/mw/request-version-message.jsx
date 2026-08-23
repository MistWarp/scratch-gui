import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {History} from 'lucide-react';

import Modal from '../../community/components/ui/Modal.jsx';
import CommunityScope from './community-scope.jsx';
import styles from './request-version-message.css';

const VersionMessageModal = ({finish}) => {
    const [message, setMessage] = useState('');
    const input = useRef(null);

    useEffect(() => {
        if (input.current) input.current.focus();
    }, []);

    const save = () => {
        const value = message.trim();
        if (value) finish(value);
    };

    return (
        <Modal
            icon={History}
            title="What changed?"
            onClose={() => finish(null)}
            actions={(
                <>
                    <button
                        className={styles.cancel}
                        type="button"
                        onClick={() => finish(null)}
                    >{'Cancel'}</button>
                    <button
                        className={styles.skip}
                        type="button"
                        onClick={() => finish(false)}
                    >{'Skip'}</button>
                    <button
                        className={styles.save}
                        type="button"
                        disabled={!message.trim()}
                        onClick={save}
                    >{'Save version'}</button>
                </>
            )}
        >
            <label className={styles.field}>
                <span>{'Add a short note for this version'}</span>
                <input
                    ref={input}
                    value={message}
                    maxLength={120}
                    placeholder="For example: Added a new level"
                    onChange={event => setMessage(event.target.value)}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            save();
                        }
                    }}
                />
            </label>
        </Modal>
    );
};

VersionMessageModal.propTypes = {
    finish: PropTypes.func.isRequired
};

const requestVersionMessage = () => new Promise(resolve => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let finished = false;
    const finish = value => {
        if (finished) return;
        finished = true;
        ReactDOM.unmountComponentAtNode(container);
        container.remove();
        resolve(value);
    };
    ReactDOM.render(
        <CommunityScope initialPath="/">
            <VersionMessageModal finish={finish} />
        </CommunityScope>,
        container
    );
});

export default requestVersionMessage;

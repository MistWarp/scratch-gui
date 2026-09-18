import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {Import} from 'lucide-react';
import {track} from '../analytics';
import {useCommunityIntl} from '../i18n.jsx';
import styles from './ScratchImport.module.css';

export const scratchProjectId = value => {
    const match = String(value).trim()
        .match(/^(?:https?:\/\/)?(?:www\.)?scratch\.mit\.edu\/projects\/(\d+)|^(\d+)$/);
    return match ? match[1] || match[2] : null;
};

const ScratchImport = ({source}) => {
    const {text} = useCommunityIntl();
    const [value, setValue] = useState('');
    const [invalid, setInvalid] = useState(false);
    const submit = event => {
        event.preventDefault();
        const id = scratchProjectId(value);
        if (!id) {
            setInvalid(true);
            return;
        }
        track('scratch_import', {source});
        window.location.href = `/editor#${id}`;
    };
    return (
        <form className={styles.form} onSubmit={submit}>
            <input
                type="text"
                inputMode="url"
                value={value}
                placeholder={text('Paste a Scratch project link')}
                aria-label={text('Scratch project link or ID')}
                aria-invalid={invalid}
                onChange={event => {
                    setValue(event.target.value);
                    setInvalid(false);
                }}
            />
            <button type="submit"><Import size={15} />{text('Open in MistWarp')}</button>
            {invalid ? (
                <p role="alert">{text('Enter a link like scratch.mit.edu/projects/123456 or a project ID.')}</p>
            ) : null}
        </form>
    );
};

ScratchImport.propTypes = {
    source: PropTypes.string.isRequired
};

export default ScratchImport;

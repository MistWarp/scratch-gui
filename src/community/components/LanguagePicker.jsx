import tokenStyles from '../styles/tokens.module.css';
import React from 'react';
import {LOCALES, useCommunityIntl} from '../i18n.jsx';

const LanguagePicker = ({id = 'community-language'}) => {
    const {preference, setPreference, t, text, loading, loadError, retry} = useCommunityIntl();
    return (
        <div className={tokenStyles['mw-language-picker']}>
            <label htmlFor={id}>{t('settings.language')}</label>
            <select id={id} value={preference} onChange={event => setPreference(event.target.value)}>
                {LOCALES.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.value === 'auto' ? text('Use browser language') : option.label}
                    </option>
                ))}
            </select>
            {loading ? <span role="status">{text('Loading language…')}</span> : null}
            {loadError ? <span role="alert">
                {text('Could not load this language. Your current language is still active.')}{' '}
                <button type="button" onClick={retry}>{text('Try again')}</button>
            </span> : null}
        </div>
    );
};

export default LanguagePicker;

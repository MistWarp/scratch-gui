import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Building2} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import Button from './ui/Button.jsx';
import {orgLabel} from '../use-publishable-orgs.js';
import styles from './OrgMoveRow.module.css';

const ROTUR_NEW_ORG = 'https://rotur.dev/orgs/new';

const sameName = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

const moveChoices = ({orgs, owner, self, ownedByOrg, selfLabel}) => {
    const choices = orgs
        .filter(org => !sameName(org.username, owner))
        .map(org => ({value: org.username, label: orgLabel(org)}));
    if (ownedByOrg && self && !sameName(self, owner)) choices.unshift({value: self, label: selfLabel});
    return choices;
};

const OrgMoveRow = ({orgs, owner, self, ownedByOrg, loaded, failed, disabled, onMove, onRetry, className}) => {
    const {text: communityText} = useCommunityText();
    const [choice, setChoice] = useState('');
    const choices = moveChoices({
        orgs,
        owner,
        self,
        ownedByOrg,
        selfLabel: communityText('Your account (@{username})', {username: self})
    });
    const choiceStillOffered = choices.some(option => option.value === choice);
    useEffect(() => {
        if (choice && !choiceStillOffered) setChoice('');
    }, [choice, choiceStillOffered]);
    if (!loaded) return <p className={styles.hint}>{communityText('Loading your organisations…')}</p>;
    const failedHint = failed ? (
        <p className={styles.hint}>
            {communityText('Could not load your organisations.')}{' '}
            {onRetry ? (
                <Button variant="secondary" size="small" onClick={onRetry}>{communityText('Try again')}</Button>
            ) : null}
        </p>
    ) : null;
    if (failed && !choices.length) return failedHint;
    if (!choices.length) {
        return (
            <p className={styles.hint}>
                {orgs.length ?
                    communityText('Other organisations you can publish for will appear here.') :
                    communityText('Organisations you can publish for will appear here.')}{' '}
                <a href={ROTUR_NEW_ORG} target="_blank" rel="noopener noreferrer">
                    {communityText('Create an organisation on Rotur')}
                </a>
            </p>
        );
    }
    const move = () => onMove(choice);
    return (
        <>
            {failedHint}
            <div className={className}>
                <select
                    value={choiceStillOffered ? choice : ''}
                    disabled={disabled}
                    aria-label={communityText('Move to')}
                    onChange={event => setChoice(event.target.value)}
                >
                    <option value="">{communityText('Choose where to move it')}</option>
                    {choices.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <Button variant="secondary" disabled={!choiceStillOffered || !choice || disabled} onClick={move}>
                    <Building2 size={16} />{communityText('Move')}
                </Button>
            </div>
        </>
    );
};

OrgMoveRow.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    failed: PropTypes.bool,
    loaded: PropTypes.bool,
    onMove: PropTypes.func.isRequired,
    onRetry: PropTypes.func,
    orgs: PropTypes.arrayOf(PropTypes.shape({
        displayName: PropTypes.string,
        username: PropTypes.string.isRequired
    })).isRequired,
    owner: PropTypes.string,
    ownedByOrg: PropTypes.bool,
    self: PropTypes.string
};

OrgMoveRow.defaultProps = {
    loaded: true
};

export {moveChoices};
export default OrgMoveRow;

import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {Building2} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import Button from './ui/Button.jsx';
import styles from './OrgMoveRow.module.css';

const ROTUR_NEW_ORG = 'https://rotur.dev/orgs/new';

const orgName = org => (org.displayName ? `${org.displayName} (@${org.username})` : `@${org.username}`);

const OrgMoveRow = ({orgs, owner, disabled, onMove, className}) => {
    const {text: communityText} = useCommunityText();
    const [choice, setChoice] = useState('');
    const currentOwner = String(owner || '').toLowerCase();
    const choices = orgs.filter(org => org.username.toLowerCase() !== currentOwner);
    if (!choices.length) {
        return (
            <p className={styles.hint}>
                {choices.length < orgs.length ?
                    communityText('Other organisations you can publish for will appear here.') :
                    communityText('Organisations you can publish for will appear here.')}{' '}
                <a href={ROTUR_NEW_ORG} target="_blank" rel="noopener noreferrer">
                    {communityText('Create an organisation on Rotur')}
                </a>
            </p>
        );
    }
    return (
        <div className={className}>
            <select
                value={choice}
                disabled={disabled}
                aria-label={communityText('Organisation')}
                onChange={event => setChoice(event.target.value)}
            >
                <option value="">{communityText('Choose an organisation')}</option>
                {choices.map(org => <option key={org.username} value={org.username}>{orgName(org)}</option>)}
            </select>
            <Button variant="secondary" disabled={!choice || disabled} onClick={() => onMove(choice)}>
                <Building2 size={16} />{communityText('Move')}
            </Button>
        </div>
    );
};

OrgMoveRow.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onMove: PropTypes.func.isRequired,
    orgs: PropTypes.arrayOf(PropTypes.shape({
        displayName: PropTypes.string,
        username: PropTypes.string.isRequired
    })).isRequired,
    owner: PropTypes.string
};

export default OrgMoveRow;

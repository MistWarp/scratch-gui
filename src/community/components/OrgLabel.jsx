import React from 'react';
import {Building2} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import styles from './OrgLabel.module.css';

const isOrgOwned = value => Boolean(value) && value.ownerType === 'org';

const ownershipMovable = item => Boolean(item) && (!isOrgOwned(item) || item.canMoveOut === true);

const OrgLabel = ({owned, className = ''}) => {
    const {text: communityText} = useCommunityText();
    if (!owned) return null;
    return (
        <span className={`${styles.label} ${className}`.trim()}>
            <Building2 size={12} aria-hidden="true" />
            <span>{communityText('Organisation')}</span>
        </span>
    );
};

export {isOrgOwned, ownershipMovable};
export default OrgLabel;

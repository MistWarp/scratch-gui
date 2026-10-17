import PropTypes from 'prop-types';
import React from 'react';
import {ExternalLink, PawPrint} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {pounceUrl} from '../claw-posts.js';
import {usePounceQuota} from '../pounce-quota.js';
import SectionHeading from './ui/SectionHeading.jsx';
import styles from './ClawSidebar.module.css';

const ClawSidebar = ({user}) => {
    const {text: communityText} = useCommunityText();
    const quota = usePounceQuota(user.username);
    const links = [
        {href: pounceUrl('/settings/for-you'), label: communityText('For You settings')},
        {href: pounceUrl('/promotions'), label: communityText('Your promotions')},
        {href: pounceUrl('/creator'), label: communityText('Creator dashboard')}
    ];
    if (!quota) return null;
    return (
        <aside className={styles.sidebar} aria-label={communityText('Pounces')}>
            <SectionHeading as="h2" icon={PawPrint} title={communityText('Pounces')} />
            <p className={styles.left}>
                {communityText(
                    '{value1, plural, one {You have # pounce left today.} other {You have # pounces left today.}}',
                    {value1: quota.left}
                )}
            </p>
            <p className={styles.help}>
                {communityText('Everyone gets {value1} pounces a day. Pounce a post to help more people see it.', {
                    value1: quota.daily
                })}
            </p>
            <p className={styles.help}>
                {communityText('For You settings, promotions and creator earnings are on pounce, the claw app.')}
            </p>
            <ul className={styles.links}>
                {links.map(link => (
                    <li key={link.href}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {link.label}
                            <ExternalLink size={13} aria-hidden="true" />
                        </a>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

ClawSidebar.propTypes = {
    user: PropTypes.shape({username: PropTypes.string.isRequired}).isRequired
};

export default ClawSidebar;

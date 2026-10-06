/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {Ban} from 'lucide-react';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import {timeAgo} from '../../format';
import styles from '../Admin.module.css';
import {adminUserPath} from './admin-links.js';

// Banned users, with a button to ban someone by name.
const BansSection = ({bans, banByName, unban}) => {
    const {text: communityText} = useCommunityText();
    return (
        <section className={styles.card}>
            <SectionHeading
                icon={Ban}
                title={communityText('Bans')}
                actions={<Button onClick={banByName}>{communityText('Ban a user…')}</Button>}
            />
            {bans.length ? (
                <div className={styles.list}>
                    {bans.map(ban => (
                        <div
                            key={ban.username}
                            className={styles.row}
                        >
                            <Avatar
                                username={ban.username}
                                size={28}
                            />
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}><Link to={adminUserPath(ban.username)}>{`@${ban.username}`}</Link></span>
                                <span className={styles.rowMeta}>
                                    {communityText('Banned by @{value1}{value2}', {value1: ban.by, value2: timeAgo(ban.created) ? ` · ${timeAgo(ban.created)} ago` : ''})}
                                    {ban.reason ? ` · ${ban.reason}` : ''}
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                <Button onClick={() => unban(ban.username)}>{communityText('Unban')}</Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState compact icon={Ban} title={communityText('No banned users')}>
                    {communityText('Nobody is banned.')}
                </EmptyState>
            )}
        </section>
    );
};

export default BansSection;

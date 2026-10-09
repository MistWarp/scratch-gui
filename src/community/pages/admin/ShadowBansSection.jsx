/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {Ghost} from 'lucide-react';
import {projectUrl} from '../../api';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import {timeAgoText} from '../../format';
import styles from '../Admin.module.css';
import {adminUserPath} from './admin-links.js';

const ShadowBansSection = ({shadowBans, shadowBanByName, liftUser, liftProject}) => {
    const {text: communityText} = useCommunityText();
    const users = shadowBans.users || [];
    const projects = shadowBans.projects || [];
    const meta = entry => communityText('Shadow banned by @{value1}{value2}', {value1: entry.by, value2: timeAgoText(entry.created) ? ` · ${timeAgoText(entry.created)}` : ''});
    return (
        <section className={styles.card}>
            <SectionHeading
                icon={Ghost}
                title={communityText('Shadow bans')}
                count={users.length + projects.length}
                lead={communityText('Shadow banned creators and projects are left out of explore, search, profiles and every other list, and their comments are hidden from everyone else. Links still work, and they see everything as normal.')}
                actions={<Button onClick={shadowBanByName}>{communityText('Shadow ban a user…')}</Button>}
            />
            {users.length || projects.length ? (
                <div className={styles.list}>
                    {users.map(entry => (
                        <div
                            key={`user:${entry.username}`}
                            className={styles.row}
                        >
                            <Avatar
                                username={entry.username}
                                size={28}
                            />
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}><Link to={adminUserPath(entry.username)}>{`@${entry.username}`}</Link></span>
                                <span className={styles.rowMeta}>
                                    {meta(entry)}
                                    {entry.reason ? ` · ${entry.reason}` : ''}
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                <Button onClick={() => liftUser(entry.username)}>{communityText('Lift shadow ban')}</Button>
                            </div>
                        </div>
                    ))}
                    {projects.map(entry => (
                        <div
                            key={`project:${entry.id}`}
                            className={styles.row}
                        >
                            <div className={styles.rowInfo}>
                                <span className={styles.rowTitle}>
                                    <Link to={projectUrl(entry.id)}>{entry.title || entry.id}</Link>
                                    <span className={styles.badge}>{communityText('Project')}</span>
                                </span>
                                <span className={styles.rowMeta}>
                                    {communityText('by @{value1}', {value1: entry.owner})}
                                    {` · ${meta(entry)}`}
                                    {entry.reason ? ` · ${entry.reason}` : ''}
                                </span>
                            </div>
                            <div className={styles.rowActions}>
                                <Button onClick={() => liftProject(entry.id)}>{communityText('Lift shadow ban')}</Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState compact icon={Ghost} title={communityText('No shadow bans')}>
                    {communityText('No creators or projects are shadow banned.')}
                </EmptyState>
            )}
        </section>
    );
};

ShadowBansSection.propTypes = {
    shadowBans: PropTypes.shape({
        users: PropTypes.arrayOf(PropTypes.object),
        projects: PropTypes.arrayOf(PropTypes.object)
    }).isRequired,
    shadowBanByName: PropTypes.func.isRequired,
    liftUser: PropTypes.func.isRequired,
    liftProject: PropTypes.func.isRequired
};

export default ShadowBansSection;

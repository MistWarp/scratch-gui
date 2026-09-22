import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React from 'react';
import {Link} from 'react-router-dom';
import {Clock, Coins, HandCoins, Trophy} from 'lucide-react';
import Avatar from './Avatar.jsx';
import {formatDateTime} from '../format.js';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import styles from './ProjectDonationAnalytics.module.css';

const credits = value => (Math.round((Number(value) || 0) * 100) / 100).toLocaleString(getCommunityLocale());

const ProjectDonationAnalytics = ({projectId, donations = {}}) => {
    const {text: communityText} = useCommunityText();
    const donors = Array.isArray(donations.donors) ? donations.donors : [];
    const recent = Array.isArray(donations.recent) ? donations.recent : [];
    const donationCount = Number(donations.count) || 0;
    const donorCount = Number(donations.uniqueDonors) || 0;
    return (
        <section className={styles.card} aria-labelledby="project-donations-title">
            <SectionHeading
                id="project-donations-title"
                icon={HandCoins}
                title={communityText('Project donations')}
                lead={communityText(
                    // eslint-disable-next-line max-len
                    '{value1, plural, one {# donation} other {# donations}} from {value2, plural, one {# donor} other {# donors}}.',
                    {value1: donationCount, value2: donorCount}
                )}
                actions={(
                    <span className={styles.total}>
                        <Coins size={16} />
                        {communityText('{value1} credits', {value1: credits(donations.total)})}
                    </span>
                )}
            />
            {donors.length ? (
                <div className={styles.columns}>
                    <div>
                        <SectionHeading as="h3" icon={Trophy} title={communityText('Top donors')} />
                        <ol className={styles.donorList}>
                            {donors.map((donor, index) => (
                                <li key={donor.username} className={styles.donorRow}>
                                    <span className={styles.rank}>{index + 1}</span>
                                    <Avatar username={donor.username} size={28} />
                                    <Link to={`/users/${donor.username}`}>{donor.username}</Link>
                                    <span className={styles.amount}>
                                        {communityText('{value1} credits', {value1: credits(donor.amount)})}
                                    </span>
                                    <span className={styles.count}>
                                        {donor.count === 1 ?
                                            communityText('1 donation') :
                                            communityText('{value1} donations', {value1: donor.count})}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div>
                        <SectionHeading as="h3" icon={Clock} title={communityText('Recent donations')} />
                        <ul className={styles.recentList}>
                            {recent.map(donation => (
                                <li key={donation.commentId} className={styles.recentRow}>
                                    <Link to={`/users/${donation.username}`}>{donation.username}</Link>
                                    <Link
                                        to={`/project/${projectId}#comment-id-${donation.commentId}`}
                                        className={styles.recentAmount}
                                    >
                                        {communityText('{value1} credits', {value1: credits(donation.amount)})}
                                    </Link>
                                    <time>
                                        {formatDateTime(donation.at, 'Date unavailable')}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <EmptyState compact icon={HandCoins} title={communityText('No donations yet')}>
                    {communityText('No one has donated to this project yet.')}
                </EmptyState>
            )}
        </section>
    );
};

export default ProjectDonationAnalytics;

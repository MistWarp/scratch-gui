import React from 'react';
import {Link} from 'react-router-dom';
import {Coins, Trophy} from 'lucide-react';
import Avatar from './Avatar.jsx';
import {formatDateTime} from '../format.js';
import styles from './ProjectDonationAnalytics.module.css';

const credits = value => (Math.round((Number(value) || 0) * 100) / 100).toLocaleString();

const ProjectDonationAnalytics = ({projectId, donations = {}}) => {
    const donors = Array.isArray(donations.donors) ? donations.donors : [];
    const recent = Array.isArray(donations.recent) ? donations.recent : [];
    return (
        <section className={styles.card} aria-labelledby="project-donations-title">
            <div className={styles.heading}>
                <div>
                    <h2 id="project-donations-title">Project donations</h2>
                    <p>
                        {(Number(donations.count) || 0).toLocaleString()} {
                            Number(donations.count) === 1 ? 'donation' : 'donations'
                        } from {(Number(donations.uniqueDonors) || 0).toLocaleString()} {
                            Number(donations.uniqueDonors) === 1 ? 'donor' : 'donors'
                        }.
                    </p>
                </div>
                <span className={styles.total}><Coins size={16} /> {credits(donations.total)} credits</span>
            </div>
            {donors.length ? (
                <div className={styles.columns}>
                    <div>
                        <h3><Trophy size={15} /> Top donors</h3>
                        <ol className={styles.donorList}>
                            {donors.map((donor, index) => (
                                <li key={donor.username} className={styles.donorRow}>
                                    <span className={styles.rank}>{index + 1}</span>
                                    <Avatar username={donor.username} size={28} />
                                    <Link to={`/users/${donor.username}`}>{donor.username}</Link>
                                    <span className={styles.amount}>{credits(donor.amount)} credits</span>
                                    <span className={styles.count}>
                                        {donor.count} {donor.count === 1 ? 'donation' : 'donations'}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div>
                        <h3>Recent donations</h3>
                        <ul className={styles.recentList}>
                            {recent.map(donation => (
                                <li key={donation.commentId} className={styles.recentRow}>
                                    <Link to={`/users/${donation.username}`}>{donation.username}</Link>
                                    <Link
                                        to={`/project/${projectId}#comment-id-${donation.commentId}`}
                                        className={styles.recentAmount}
                                    >{credits(donation.amount)} credits</Link>
                                    <time>
                                        {formatDateTime(donation.at, 'Date unavailable')}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p className={styles.empty}>No one has donated to this project yet.</p>
            )}
        </section>
    );
};

export default ProjectDonationAnalytics;

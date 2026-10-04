/* eslint-disable max-len */
import {getCommunityLocale} from '../../locale.js';
import React, {useEffect, useState} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {User} from 'lucide-react';
import api from '../../api';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {timeAgo, formatBytes} from '../../format';
import styles from '../Admin.module.css';
import UserDetailCard from './UserDetailCard.jsx';

const UserManager = () => {
    const {text: communityText} = useCommunityText();
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [sort, setSort] = useState('name');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [loadAttempt, setLoadAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        const loadUsers = () => {
            setLoading(true);
            setError('');
            api.admin.users({q: query.trim(), offset, limit: 30, sort})
                .then(data => {
                    if (!active) return;
                    const nextUsers = data.users || [];
                    setUsers(nextUsers);
                    setTotal(Number.isFinite(Number(data.total)) ? Number(data.total) : nextUsers.length);
                    setLoading(false);
                })
                .catch(e => {
                    if (!active) return;
                    setError(e.message || 'Could not load users.');
                    setLoading(false);
                });
        };
        const timer = query ? setTimeout(loadUsers, 180) : null;
        if (!query) loadUsers();
        return () => {
            active = false;
            if (timer) clearTimeout(timer);
        };
    }, [loadAttempt, offset, query, sort]);

    if (selected) {
        return (
            <div>
                <SectionHeading icon={User} title={communityText('Users')} />
                <UserDetailCard username={selected} onBack={() => setSelected(null)} />
            </div>
        );
    }

    return (
        <div>
            <SectionHeading icon={User} title={communityText('Users')} />
            <div className={styles.userToolbar}>
                <input
                    className={styles.input}
                    placeholder={communityText('Search usernames…')}
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setOffset(0);
                    }}
                />
                <select
                    className={styles.select}
                    aria-label={communityText('Sort users')}
                    value={sort}
                    onChange={e => {
                        setSort(e.target.value);
                        setOffset(0);
                    }}
                >
                    <option value="name">{communityText('Name')}</option>
                    <option value="recent">{communityText('Newest')}</option>
                    <option value="followers">{communityText('Most followed')}</option>
                </select>
                <span className={styles.toolbarCount}>
                    {communityText('{value1} total', {value1: total.toLocaleString(getCommunityLocale())})}
                </span>
            </div>
            {error ? (
                <StatusMessage compact error onRetry={() => setLoadAttempt(value => value + 1)}>{error}</StatusMessage>
            ) : null}
            {loading ? (
                <StatusMessage>{communityText('Loading users…')}</StatusMessage>
            ) : error ? null : users.length ? (
                <div className={styles.list}>
                    {users.map(user => {
                        const pct = user.quotaLimit > 0 ? (user.quotaUsed / user.quotaLimit) * 100 : 0;
                        const joined = timeAgo(user.created);
                        return (
                            <div
                                key={user.username}
                                className={`${styles.row} ${styles.rowClickable}`}
                                onClick={() => setSelected(user.username)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelected(user.username);
                                    }
                                }}
                            >
                                <Avatar username={user.username} size={32} />
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowTitle}>
                                        <a
                                            href={`/users/${user.username}`}
                                            onClick={event => event.stopPropagation()}
                                        >{`@${user.username}`}</a>
                                        {user.banned ? (
                                            <span className={`${styles.badge} ${styles.badgeDanger}`}>{communityText('banned')}</span>
                                        ) : user.standingLevel && user.standingLevel !== 'good' ? (
                                            <span className={styles.badge}>{user.standingLevel}</span>
                                        ) : null}
                                    </span>
                                    <span className={styles.rowMeta}>
                                        {communityText('{value1} followers · {value2} projects', {value1: user.followerCount, value2: user.projectCount})}
                                        {joined ? communityText(' · joined {value1} ago', {value1: joined}) : ''}
                                    </span>
                                </div>
                                <div className={styles.resetInfo}>
                                    <div className={styles.quotaBar}>
                                        <span className={`${styles.quotaFillBg} ${styles.quotaFillBgFixed}`}>
                                            <span
                                                className={styles.quotaFill}
                                                style={{width: `${Math.min(100, pct)}%`}}
                                            />
                                        </span>
                                        <span className={styles.quotaText}>
                                            {formatBytes(user.quotaUsed)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState compact icon={User} title={communityText('No users found')}>
                    {communityText('No users match that search.')}
                </EmptyState>
            )}
            {!error && total > 30 ? (
                <div className={styles.pagination}>
                    <Button
                        disabled={offset === 0 || loading}
                        onClick={() => setOffset(Math.max(0, offset - 30))}
                    >{communityText('Previous')}</Button>
                    <span>{communityText('{value1}–{value2} of {value3}', {value1: offset + 1, value2: Math.min(offset + users.length, total), value3: total})}</span>
                    <Button
                        disabled={offset + users.length >= total || loading}
                        onClick={() => setOffset(offset + 30)}
                    >{communityText('Next')}</Button>
                </div>
            ) : null}
        </div>
    );
};

export default UserManager;

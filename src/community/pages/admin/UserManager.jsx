/* eslint-disable max-len */
import {getCommunityLocale} from '../../locale.js';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {User} from 'lucide-react';
import api from '../../api';
import Avatar from '../../components/Avatar.jsx';
import UnderlineTabs from '../../components/UnderlineTabs.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {timeAgo, formatBytes} from '../../format';
import styles from '../Admin.module.css';
import UserDetailCard from './UserDetailCard.jsx';

const PAGE_SIZE = 30;

const UserManager = ({selected: controlledSelected, onSelect}) => {
    const {text: communityText} = useCommunityText();
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [sort, setSort] = useState('recent');
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ownSelected, setOwnSelected] = useState(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const controlled = typeof onSelect === 'function';
    const selected = controlled ? controlledSelected : ownSelected;
    const select = controlled ? onSelect : setOwnSelected;

    useEffect(() => {
        let active = true;
        const loadUsers = () => {
            setLoading(true);
            setError('');
            api.admin.users({q: query.trim(), offset, limit: PAGE_SIZE, sort, filter})
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
    }, [loadAttempt, offset, query, sort, filter]);

    if (selected) {
        return (
            <div>
                <SectionHeading icon={User} title={communityText('Users')} />
                <UserDetailCard username={selected} onBack={() => select(null)} />
            </div>
        );
    }

    const filters = [
        {key: '', label: communityText('Everyone')},
        {key: 'flagged', label: communityText('Warned or banned')},
        {key: 'new', label: communityText('Joined this week')},
        {key: 'minor', label: communityText('Under 18')},
        {key: 'admin', label: communityText('Admins')}
    ];

    return (
        <div>
            <SectionHeading icon={User} title={communityText('Users')} count={total} />
            <div className={styles.userToolbar}>
                <input
                    type="search"
                    className={styles.input}
                    placeholder={communityText('Search by username or Rotur ID')}
                    aria-label={communityText('Search users')}
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
                    <option value="recent">{communityText('Newest')}</option>
                    <option value="name">{communityText('Name')}</option>
                    <option value="followers">{communityText('Most followed')}</option>
                </select>
            </div>
            <UnderlineTabs
                className={styles.tabs}
                items={filters}
                value={filter}
                onChange={next => {
                    setFilter(next);
                    setOffset(0);
                }}
                ariaLabel="Filter users"
                variant="buttons"
            />
            {error ? (
                <StatusMessage compact error onRetry={() => setLoadAttempt(value => value + 1)}>{error}</StatusMessage>
            ) : null}
            {loading ? (
                <StatusMessage>{communityText('Loading users…')}</StatusMessage>
            ) : error ? null : users.length ? (
                <div className={styles.userList}>
                    {users.map(user => {
                        const pct = user.quotaLimit > 0 ? (user.quotaUsed / user.quotaLimit) * 100 : 0;
                        const joined = timeAgo(user.created);
                        return (
                            <div
                                key={user.username}
                                className={`${styles.userRow} ${styles.rowClickable}`}
                                onClick={() => select(user.username)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        select(user.username);
                                    }
                                }}
                            >
                                <Avatar username={user.username} size={32} />
                                <div className={styles.rowInfo}>
                                    <span className={styles.rowTitle}>
                                        {`@${user.username}`}
                                        {user.admin ? <span className={styles.badge}>{communityText('Admin')}</span> : null}
                                        {user.banned ? (
                                            <span className={`${styles.badge} ${styles.badgeDanger}`}>{communityText('Banned')}</span>
                                        ) : user.standingLevel && user.standingLevel !== 'good' ? (
                                            <span className={`${styles.badge} ${styles.badgeWarn}`}>{user.standingLevel}</span>
                                        ) : null}
                                        {user.minor ? <span className={styles.badge}>{communityText('Under 18')}</span> : null}
                                    </span>
                                    <span className={styles.rowMeta}>
                                        {joined ?
                                            communityText('Joined {value1} ago · {value2} projects · {value3} followers', {value1: joined, value2: user.projectCount, value3: user.followerCount}) :
                                            communityText('{value1} projects · {value2} followers', {value1: user.projectCount, value2: user.followerCount})}
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
                    {communityText('No users match that search or filter.')}
                </EmptyState>
            )}
            {!error && total > PAGE_SIZE ? (
                <div className={styles.pagination}>
                    <Button
                        disabled={offset === 0 || loading}
                        onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    >{communityText('Previous')}</Button>
                    <span>{communityText('{value1}–{value2} of {value3}', {value1: offset + 1, value2: Math.min(offset + users.length, total), value3: total.toLocaleString(getCommunityLocale())})}</span>
                    <Button
                        disabled={offset + users.length >= total || loading}
                        onClick={() => setOffset(offset + PAGE_SIZE)}
                    >{communityText('Next')}</Button>
                </div>
            ) : null}
        </div>
    );
};

UserManager.propTypes = {
    selected: PropTypes.string,
    onSelect: PropTypes.func
};

export default UserManager;

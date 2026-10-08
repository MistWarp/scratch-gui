import PropTypes from 'prop-types';
import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronLeft, ChevronRight, History} from 'lucide-react';

import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {getCommunityLocale} from '../locale.js';
import Avatar from './Avatar.jsx';
import {ExploreSearch} from './ExploreHeader.jsx';
import EmptyState from './ui/EmptyState.jsx';
import IconButton from './ui/IconButton.jsx';
import SelectMenu from './ui/SelectMenu.jsx';
import styles from './TransactionHistory.module.css';

const PAGE_SIZE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

const dayStart = time => {
    if (!(time > 0)) return 0;
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
};

const amountText = value => Math.abs(value).toLocaleString(getCommunityLocale(), {maximumFractionDigits: 2});

const clockText = time => new Date(time).toLocaleTimeString(getCommunityLocale(), {hour: '2-digit', minute: '2-digit'});

const TransactionHistory = ({transactions}) => {
    const {text: communityText} = useCommunityText();
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [query, filter]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return transactions.filter(transaction => {
            if (filter === 'in' && !transaction.incoming) return false;
            if (filter === 'out' && transaction.incoming) return false;
            if (!needle) return true;
            return `${transaction.note} ${transaction.user}`.toLowerCase().includes(needle);
        });
    }, [transactions, query, filter]);

    const dayNets = useMemo(() => {
        const nets = new Map();
        for (const transaction of filtered) {
            const start = dayStart(transaction.time);
            const signed = transaction.incoming ? transaction.amount : -transaction.amount;
            nets.set(start, (nets.get(start) || 0) + signed);
        }
        for (const [start, net] of nets) nets.set(start, Math.round(net * 100) / 100);
        return nets;
    }, [filtered]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const days = [];
    for (const transaction of filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)) {
        const start = dayStart(transaction.time);
        let day = days[days.length - 1];
        if (!day || day.start !== start) {
            day = {start, net: dayNets.get(start) || 0, items: []};
            days.push(day);
        }
        day.items.push(transaction);
    }

    const today = dayStart(Date.now());
    const yesterday = dayStart(today - (DAY_MS / 2));
    const dayLabel = start => {
        if (!start) return communityText('Date unknown');
        if (start === today) return communityText('Today');
        if (start === yesterday) return communityText('Yesterday');
        const sameYear = new Date(start).getFullYear() === new Date(today).getFullYear();
        const options = {weekday: 'long', month: 'long', day: 'numeric'};
        if (!sameYear) options.year = 'numeric';
        return new Date(start).toLocaleDateString(getCommunityLocale(), options);
    };

    return (
        <section className={styles.history}>
            <div className={styles.toolbar}>
                <ExploreSearch
                    ariaLabel={communityText('Search transactions')}
                    placeholder={communityText('Search by note or username')}
                    value={query}
                    onChange={setQuery}
                />
                <SelectMenu
                    ariaLabel={communityText('Transaction type')}
                    value={filter}
                    onChange={setFilter}
                    align="right"
                    className={styles.filter}
                    options={[
                        {value: 'all', label: communityText('All activity')},
                        {value: 'in', label: communityText('Money in')},
                        {value: 'out', label: communityText('Money out')}
                    ]}
                />
            </div>

            {days.length ? (
                <div className={styles.surface}>
                    {days.map(day => (
                        <div key={day.start} className={styles.day}>
                            <h3 className={styles.dayHeading}>
                                <span>{dayLabel(day.start)}</span>
                                <span className={day.net > 0 ? styles.income : ''}>
                                    {day.net > 0 ? '+' : day.net < 0 ? '−' : ''}{amountText(day.net)}
                                </span>
                            </h3>
                            <ul className={styles.rows}>
                                {day.items.map(transaction => (
                                    <li key={transaction.id} className={styles.row}>
                                        <span className={styles.lead}>
                                            <Avatar username={transaction.user || 'rotur'} size={24} />
                                        </span>
                                        <span className={styles.body}>
                                            <span className={styles.title}>
                                                {transaction.note || (transaction.incoming ?
                                                    communityText('Received credits') :
                                                    communityText('Sent credits'))}
                                            </span>
                                            <span className={styles.meta}>
                                                {transaction.user ? (
                                                    <React.Fragment>
                                                        <Link to={`/users/${encodeURIComponent(transaction.user)}`}>
                                                            {`@${transaction.user}`}
                                                        </Link>
                                                        <span aria-hidden="true">{' · '}</span>
                                                    </React.Fragment>
                                                ) : null}
                                                {transaction.time > 0 ? (
                                                    <time dateTime={new Date(transaction.time).toISOString()}>
                                                        {clockText(transaction.time)}
                                                    </time>
                                                ) : null}
                                            </span>
                                        </span>
                                        <strong className={transaction.incoming ? styles.amountIn : styles.amount}>
                                            {transaction.incoming ? '+' : '−'}{amountText(transaction.amount)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {totalPages > 1 ? (
                        <div className={styles.pagination}>
                            <span>
                                {communityText('Page {value1} of {value2}', {value1: safePage + 1, value2: totalPages})}
                            </span>
                            <span className={styles.pageButtons}>
                                <IconButton
                                    label={communityText('Previous page')}
                                    disabled={safePage === 0}
                                    onClick={() => setPage(Math.max(0, safePage - 1))}
                                >
                                    <ChevronLeft size={16} />
                                </IconButton>
                                <IconButton
                                    label={communityText('Next page')}
                                    disabled={safePage >= totalPages - 1}
                                    onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                                >
                                    <ChevronRight size={16} />
                                </IconButton>
                            </span>
                        </div>
                    ) : null}
                </div>
            ) : (
                <EmptyState compact icon={History} title={communityText('No matching transactions')}>
                    {communityText('Try another search or show all activity.')}
                </EmptyState>
            )}
        </section>
    );
};

TransactionHistory.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        incoming: PropTypes.bool,
        amount: PropTypes.number,
        user: PropTypes.string,
        note: PropTypes.string,
        time: PropTypes.number
    })).isRequired
};

export default TransactionHistory;

import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {Check, ExternalLink, X} from 'lucide-react';
import api from '../api.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import styles from './PaidPerks.module.css';

const TIERS = ['Free', 'Lite', 'Plus', 'Pro'];
const PRICES = {Free: 'Free', Lite: '15 RC/month', Plus: '£1.75/month', Pro: '£5.75/month'};

const MISTWARP_ROWS = [
    ['Weekly uploads', 'weeklyUploadBytes', value => `${Math.round(value / 1048576).toLocaleString(getCommunityLocale())} MB`],
    ['Total project assets', 'maxProjectAssetsBytes', value => `${Math.round(value / 1048576).toLocaleString(getCommunityLocale())} MB`],
    ['Largest project asset', 'maxProjectAssetBytes', value => `${Math.round(value / 1048576).toLocaleString(getCommunityLocale())} MB`],
    ['Deleted project recovery', 'recoveryDays', value => `${value} days`],
    ['Creator analytics history', 'analyticsDays', value => (value === 0 ? 'All time' : `${value} days`)],
    ['Advanced analytics and CSV exports', 'advancedAnalytics', String],
    ['Advanced project history', 'advancedHistory', String],
    ['Named history checkpoints', 'historyCheckpoints', String],
    ['Custom project branding', 'customProjectBranding', String],
    ['Vanity project URLs', 'vanityProjectUrls', String],
    ['People in a collaboration room', 'collaborationLimit', String],
    ['Project sales fee', 'salesFeeBasisPoints', value => `${value / 100}%`],
    ['Maximum project price', 'maxProjectPrice', value => `${value} RC`]
];

const Cell = ({value, format}) => {
    const {text: communityText} = useCommunityText();
    if (typeof value === 'boolean') return (value ? <Check aria-label={communityText('Included')} size={17} /> : <X aria-label={communityText('Not included')} size={17} />);
    return format ? format(value) : String(value);
};

const Comparison = ({plans, rows, source}) => {
    const {text: communityText} = useCommunityText();
    return (<div className={styles.tableWrap}>
        <table>
            <thead><tr><th>{communityText('Benefit')}</th>{TIERS.map(tier => <th key={tier}>{tier}</th>)}</tr></thead>
            <tbody>{rows.map(([label, key, format]) => (
                <tr key={key}>
                    <th>{label}</th>
                    {TIERS.map(tier => {
                        const plan = plans.find(item => item.tier === tier);
                        return <td key={tier}><Cell format={format} value={plan?.[source]?.[key]} /></td>;
                    })}
                </tr>
            ))}</tbody>
        </table>
    </div>);
};

Cell.propTypes = {
    value: PropTypes.oneOfType([PropTypes.bool, PropTypes.number, PropTypes.string]),
    format: PropTypes.func
};

Comparison.propTypes = {
    plans: PropTypes.arrayOf(PropTypes.object).isRequired,
    rows: PropTypes.arrayOf(PropTypes.array).isRequired,
    source: PropTypes.string.isRequired
};

const PaidPerks = () => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        api.perks().then(result => active && setData(result)).catch(e => active && setError(e.message));
        return () => {
            active = false;
        };
    }, [user?.username]);

    if (error) return <main className={styles.page}><p className={styles.status}>{error}</p></main>;
    if (!data) return <main className={styles.page}><p className={styles.status}>{communityText('Loading membership benefits…')}</p></main>;

    const currentTier = data.current?.tier || 'Free';
    return (
        <main className={styles.page}>
            <header className={styles.hero}>
                <h1>{communityText('More MistWarp with your Rotur plan')}</h1>
                <p>{communityText('MistWarp is run by Rotur. Supporting Rotur supports MistWarp and unlocks higher limits and creator perks here.')}</p>
                <div className={styles.actions}>
                    <Button variant="primary" onClick={() => window.open(data.roturMembershipUrl, '_blank', 'noopener,noreferrer')}>{communityText('View membership on rotur.dev ')}<ExternalLink size={15} /></Button>
                    {!user ? <Button variant="secondary" onClick={login}>{communityText('Sign in to check your plan')}</Button> : null}
                </div>
            </header>

            <section className={styles.plans} aria-label={communityText('Rotur plans')}>
                {data.plans.map(plan => (
                    <article className={`${styles.plan} ${plan.tier === currentTier ? styles.current : ''}`} key={plan.tier}>
                        <div><h2>{plan.tier}</h2>{plan.tier === currentTier ? <span>{communityText('Current')}</span> : null}</div>
                        <strong>{PRICES[plan.tier]}</strong>
                        <p>{plan.mistwarp.weeklyUploadBytes / 1048576}{communityText(' MB weekly uploads · ')}{plan.mistwarp.recoveryDays}{communityText('-day recovery · ')}{plan.mistwarp.collaborationLimit}{communityText('-person rooms')}</p>
                    </article>
                ))}
            </section>

            <section className={styles.section}>
                <h2>{communityText('MistWarp benefits')}</h2>
                <p>{communityText('MistWarp owns and enforces these limits. They apply as soon as MistWarp verifies your Rotur tier.')}</p>
                <Comparison plans={data.plans} rows={MISTWARP_ROWS} source="mistwarp" />
            </section>

        </main>
    );
};

export {MISTWARP_ROWS};
export default PaidPerks;

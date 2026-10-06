import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {
    CalendarCheck, Coins, ExternalLink, History, ShoppingBag, Wallet as WalletIcon
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {allowWallet, claimDailyCredits, getDailyWait, getWallet} from '../../lib/rotur/wallet.js';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import TransactionHistory from '../components/TransactionHistory.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
import {formatDate} from '../format';
import styles from './Wallet.module.css';

const ROTUR_ACCOUNT = 'https://rotur.dev/me';
const ROTUR_ACTIVITY = 'https://rotur.dev/me/activity';
const HOUR_MS = 60 * 60 * 1000;
const TABS = ['activity', 'purchases'];

const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;


const Wallet = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const viewerRef = useRef(viewerName);
    viewerRef.current = viewerName;
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'activity';
    const [wallet, setWallet] = useState(null);
    const [walletError, setWalletError] = useState('');
    const [walletAttempt, setWalletAttempt] = useState(0);
    const [allowing, setAllowing] = useState(false);
    const [dailyWait, setDailyWait] = useState(null);
    const [claiming, setClaiming] = useState(false);
    const [claimMsg, setClaimMsg] = useState('');
    const [purchases, setPurchases] = useState(null);
    const [purchaseError, setPurchaseError] = useState('');
    const [purchaseAttempt, setPurchaseAttempt] = useState(0);

    useEffect(() => {
        setClaimMsg('');
        setClaiming(false);
        setDailyWait(null);
        if (!viewerName) return () => {};
        let stale = false;
        getDailyWait()
            .then(wait => !stale && setDailyWait(wait))
            .catch(() => {});
        return () => {
            stale = true;
        };
    }, [viewerName]);

    useEffect(() => {
        if (!viewerName) {
            setWallet(null);
            setWalletError('');
            return () => {};
        }
        let stale = false;
        setWallet(null);
        setWalletError('');
        getWallet()
            .then(data => !stale && setWallet(data))
            .catch(() => !stale && setWalletError(communityText('Could not load your balance from Rotur.')));
        return () => {
            stale = true;
        };
    }, [walletAttempt, viewerName]);

    useEffect(() => {
        if (!viewerName) {
            setPurchases(null);
            setPurchaseError('');
            return () => {};
        }
        let stale = false;
        setPurchases(null);
        setPurchaseError('');
        api.purchases()
            .then(data => !stale && setPurchases(data.purchases || []))
            .catch(() => !stale && setPurchaseError(communityText('Could not load purchase history.')));
        return () => {
            stale = true;
        };
    }, [purchaseAttempt, viewerName]);

    if (loading) {
        return <main className={styles.page}><StatusMessage /></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <SignInPrompt onSignIn={login}>{communityText('Sign in to see your wallet.')}</SignInPrompt>
            </main>
        );
    }

    const setTab = next => {
        const params = new URLSearchParams(searchParams);
        if (next === 'activity') params.delete('tab');
        else params.set('tab', next);
        setSearchParams(params, {replace: true});
    };

    const allow = async () => {
        const context = viewerRef.current;
        setAllowing(true);
        try {
            if (await allowWallet() && viewerRef.current === context) setWalletAttempt(value => value + 1);
        } finally {
            if (viewerRef.current === context) setAllowing(false);
        }
    };

    const claim = async () => {
        if (claiming) return;
        const context = viewerRef.current;
        setClaiming(true);
        setClaimMsg('');
        try {
            const result = await claimDailyCredits();
            if (viewerRef.current !== context) return;
            if (result.claimed) {
                setClaimMsg(communityText('Daily credits claimed.'));
                setDailyWait(24 * HOUR_MS);
                setWalletAttempt(value => value + 1);
            } else if (result.denied) {
                setClaimMsg(communityText('MistWarp needs your permission on Rotur to claim daily credits.'));
            } else {
                setDailyWait(result.waitMs);
            }
        } catch (e) {
            if (viewerRef.current !== context) return;
            setClaimMsg(e.message || communityText('Could not claim daily credits.'));
        } finally {
            if (viewerRef.current === context) setClaiming(false);
        }
    };

    const waitHours = dailyWait > 0 ? Math.ceil(dailyWait / HOUR_MS) : 0;
    const transactions = wallet && wallet.allowed ?
        wallet.transactions.filter(transaction => transaction.mistwarp) :
        [];

    return (
        <main className={styles.page}>
            <PageHeader icon={WalletIcon} title={communityText('Wallet')} />

            <section className={styles.balanceCard}>
                <span className={styles.balanceIcon}><Coins size={22} /></span>
                <div className={styles.balanceText}>
                    <div className={styles.balanceLabel}>{communityText('Your balance')}</div>
                    {wallet && wallet.allowed ? (
                        <div className={styles.balanceValue}>
                            {fmtCredits(wallet.balance).toLocaleString(getCommunityLocale())}
                            <span className={styles.balanceUnit}>{communityText('credits')}</span>
                        </div>
                    ) : wallet ? (
                        <React.Fragment>
                            <div className={styles.balanceHint}>
                                {communityText('Let MistWarp see your balance and transactions on Rotur.')}
                            </div>
                            <Button
                                variant="primary"
                                className={styles.allowButton}
                                onClick={allow}
                                busy={allowing}
                                busyLabel={communityText('Waiting for Rotur…')}
                            >
                                <Coins size={16} />{communityText('Show my balance')}</Button>
                        </React.Fragment>
                    ) : walletError ? null : (
                        <div className={styles.balanceValue}>{'…'}</div>
                    )}
                    {claimMsg ? <div className={styles.claimMsg} role="status">{claimMsg}</div> : null}
                    {!claimMsg && waitHours ? (
                        <div className={styles.claimMsg}>
                            {communityText('You can claim daily credits again in {value1}h.', {value1: waitHours})}
                        </div>
                    ) : null}
                </div>
                <div className={styles.balanceActions}>
                    <Button
                        variant={wallet && !wallet.allowed ? 'secondary' : 'primary'}
                        onClick={claim}
                        busy={claiming}
                        busyLabel={communityText('Claiming…')}
                        disabled={waitHours > 0}
                    >
                        <CalendarCheck size={16} />{communityText('Claim daily credits')}</Button>
                    <Button as="a" href={ROTUR_ACCOUNT} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} />{communityText('Open Rotur')}</Button>
                </div>
            </section>
            {walletError ? (
                <StatusMessage compact error onRetry={() => setWalletAttempt(value => value + 1)}>
                    {walletError}
                </StatusMessage>
            ) : null}

            <UnderlineTabs
                items={[
                    {key: 'activity', label: communityText('Activity')},
                    {key: 'purchases', label: communityText('Purchases')}
                ]}
                value={tab}
                onChange={setTab}
                className={styles.tabs}
                ariaLabel={communityText('Wallet sections')}
                idPrefix="wallet"
            />
            <div {...tabPanelProps('wallet', tab)}>
                {tab === 'activity' ? (
                    wallet === null && !walletError ? (
                        <StatusMessage compact />
                    ) : wallet && wallet.allowed ? (
                        <React.Fragment>
                            <div className={styles.activityLead}>
                                <span>{communityText('Credits you spent and earned on MistWarp.')}</span>
                                <a href={ROTUR_ACTIVITY} target="_blank" rel="noopener noreferrer">
                                    {communityText('See your full wallet on rotur.dev')}
                                    <ExternalLink size={14} aria-hidden="true" />
                                </a>
                            </div>
                            {transactions.length ? (
                                <TransactionHistory transactions={transactions} />
                            ) : (
                                <EmptyState
                                    compact
                                    icon={History}
                                    title={communityText('No MistWarp transactions yet')}
                                >
                                    {communityText('Buying projects and game items, donations and sales show up here.')}
                                </EmptyState>
                            )}
                        </React.Fragment>
                    ) : (
                        <EmptyState compact icon={History} title={communityText('Your transactions are on Rotur')}>
                            {communityText('Show your balance to see them here too.')}
                        </EmptyState>
                    )
                ) : null}
                {tab === 'purchases' ? (
                    purchaseError ? (
                        <StatusMessage compact error onRetry={() => setPurchaseAttempt(value => value + 1)}>
                            {purchaseError}
                        </StatusMessage>
                    ) : purchases === null ? (
                        <StatusMessage compact />
                    ) : purchases.length ? (
                        <ul className={styles.list}>
                            {purchases.map((purchase, index) => (
                                <li key={`${purchase.projectId}-${index}`} className={styles.row}>
                                    <span className={styles.outIcon}><ShoppingBag size={17} aria-hidden="true" /></span>
                                    <span className={styles.rowText}>
                                        <Link to={projectUrl(purchase.projectId)} className={styles.rowTitle}>
                                            {purchase.title || purchase.projectId}
                                        </Link>
                                        {purchase.at ? (
                                            <span className={styles.rowMeta}>{formatDate(purchase.at)}</span>
                                        ) : null}
                                    </span>
                                    <strong className={styles.outAmount}>
                                        {fmtCredits(purchase.amount).toLocaleString(getCommunityLocale())}
                                    </strong>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            compact
                            icon={ShoppingBag}
                            title={communityText('No purchases yet')}
                            action={<Button as={Link} to="/explore">{communityText('Explore projects')}</Button>}
                        >
                            {communityText('You have not bought any projects yet.')}
                        </EmptyState>
                    )
                ) : null}
            </div>
        </main>
    );
};

export default Wallet;

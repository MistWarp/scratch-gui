import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {
    ArrowDownLeft, ArrowUpRight, Coins, Wallet as WalletIcon, HeartHandshake, Send, ExternalLink, CalendarCheck
} from 'lucide-react';
import api, {projectUrl} from '../api';
import {getAccountSummary, claimDaily} from '../../lib/rotur/client.js';
import {
    CREDIT_PACKS, getBillingStatus, openCreditCheckout, openBillingPortal, consumeBillingResult, getCommerceEarnings
} from '../credits';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import {formatDate, safeDate} from '../format';
import styles from './Wallet.module.css';

const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const donationDate = value => {
    const date = safeDate(value);
    return !date ? '' : date.toLocaleString(getCommunityLocale(), {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const Wallet = () => {
    const {text: communityText} = useCommunityText();
    const credits = value => communityText('{value1} credits', {value1: fmtCredits(value)});
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const walletContext = useRef(viewerName);
    walletContext.current = viewerName;
    const [account, setAccount] = useState(null);
    const [accountLoaded, setAccountLoaded] = useState(false);
    const [accountError, setAccountError] = useState('');
    const [accountAttempt, setAccountAttempt] = useState(0);
    const [purchases, setPurchases] = useState(null);
    const [purchaseError, setPurchaseError] = useState('');
    const [purchaseAttempt, setPurchaseAttempt] = useState(0);
    const [earnings, setEarnings] = useState(null);
    const [earningsError, setEarningsError] = useState('');
    const [earningsAttempt, setEarningsAttempt] = useState(0);
    const [claiming, setClaiming] = useState(false);
    const [claimMsg, setClaimMsg] = useState('');
    const [billing, setBilling] = useState(null);
    const [checkoutBusy, setCheckoutBusy] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [billingResult, setBillingResult] = useState(null);
    const billingResultConsumed = useRef(false);
    const actionLocks = useRef(new Set());

    useEffect(() => {
        if (loading || !viewerName || billingResultConsumed.current) return;
        billingResultConsumed.current = true;
        const value = consumeBillingResult();
        if (value) setBillingResult({viewerName, value});
    }, [loading, viewerName]);

    useEffect(() => {
        setClaimMsg('');
        setClaiming(false);
        setCheckoutBusy(false);
        setCheckoutError('');
    }, [viewerName]);

    useEffect(() => {
        if (!viewerName) {
            setAccount(null);
            setAccountLoaded(false);
            setAccountError('');
            return () => {};
        }
        let stale = false;
        setAccount(null);
        setAccountLoaded(false);
        setAccountError('');
        getAccountSummary()
            .then(data => {
                if (stale) return;
                setAccount(data);
                setAccountLoaded(true);
            })
            .catch(() => {
                if (stale) return;
                setAccountError(communityText('Could not load your wallet data.'));
                setAccountLoaded(true);
            });
        return () => {
            stale = true;
        };
    }, [accountAttempt, viewerName]);

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

    useEffect(() => {
        if (!viewerName) {
            setEarnings(null);
            setEarningsError('');
            return () => {};
        }
        let stale = false;
        setEarnings(null);
        setEarningsError('');
        const earningsRequest = typeof getCommerceEarnings === 'function' ?
            getCommerceEarnings() : Promise.resolve(null);
        earningsRequest
            .then(data => {
                if (stale) return;
                if (!data) throw new Error('Creator earnings are unavailable.');
                setEarnings(data);
            })
            .catch(() => !stale && setEarningsError(communityText('Could not load creator earnings.')));
        return () => {
            stale = true;
        };
    }, [earningsAttempt, viewerName]);

    useEffect(() => {
        if (!viewerName) {
            setBilling(null);
            return () => {};
        }
        let stale = false;
        setBilling(null);
        getBillingStatus()
            .then(data => !stale && setBilling(data))
            .catch(() => !stale && setBilling({billing_configured: false}));
        return () => {
            stale = true;
        };
    }, [viewerName]);

    if (loading) {
        return <main className={styles.page}><StatusMessage /></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <SignInPrompt onSignIn={login}>{communityText('Sign in to view your wallet.')}</SignInPrompt>
            </main>
        );
    }

    const balance = account && account.balance !== null ? account.balance : null;
    const billingReady = Boolean(billing && billing.billing_configured);
    const billingMsg = billingResult && billingResult.viewerName === viewerName ? billingResult.value : null;

    const doClaimDaily = async () => {
        const context = walletContext.current;
        const actionKey = `${context}\u0000claim`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setClaiming(true);
        setClaimMsg('');
        try {
            await claimDaily();
            if (walletContext.current !== context) return;
            setClaimMsg(communityText('Daily credits claimed.'));
            const data = await getAccountSummary();
            if (data && walletContext.current === context) {
                setAccount(data);
                setAccountLoaded(true);
            }
        } catch (e) {
            if (walletContext.current !== context) return;
            if (e.waitHours) {
                setClaimMsg(communityText('Already claimed. Come back in {value1}h.', {value1: e.waitHours}));
            } else if (e.needsReauth) {
                setClaimMsg(communityText(
                    'Your current login cannot claim daily credits. Log out and back in, then try again.'
                ));
            } else {
                setClaimMsg(e.message || 'Could not claim daily credits.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (walletContext.current === context) setClaiming(false);
        }
    };

    const buy = async pack => {
        const context = walletContext.current;
        const actionKey = `${context}\u0000billing`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setCheckoutBusy(true);
        setCheckoutError('');
        try {
            await openCreditCheckout(pack);
        } catch (e) {
            if (walletContext.current === context) {
                setCheckoutError(e.needsReauth ?
                    communityText('Your current login cannot buy credits. Log out and back in, then try again.') :
                    (e.message || 'Could not open checkout.'));
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (walletContext.current === context) setCheckoutBusy(false);
        }
    };

    const manageBilling = async () => {
        const context = walletContext.current;
        const actionKey = `${context}\u0000billing`;
        if (actionLocks.current.has(actionKey)) return;
        actionLocks.current.add(actionKey);
        setCheckoutBusy(true);
        setCheckoutError('');
        try {
            await openBillingPortal();
        } catch (e) {
            if (walletContext.current === context) {
                setCheckoutError(e.message || 'Could not open billing.');
            }
        } finally {
            actionLocks.current.delete(actionKey);
            if (walletContext.current === context) setCheckoutBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <PageHeader icon={WalletIcon} title={communityText('Wallet')} />

            <section className={styles.balanceCard}>
                <span className={styles.balanceIcon}><WalletIcon size={22} /></span>
                <div>
                    <div className={styles.balanceLabel}>{communityText('Your balance')}</div>
                    <div className={styles.balanceValue}>
                        {balance !== null ? (
                            <>
                                {fmtCredits(balance).toLocaleString(getCommunityLocale())}
                                <span className={styles.balanceUnit}>{communityText('credits')}</span>
                            </>
                        ) : (
                            <span className={styles.balanceUnknown}>
                                {accountLoaded ? communityText('Could not load your balance right now') : '…'}
                            </span>
                        )}
                    </div>
                    {claimMsg ? <div className={styles.claimMsg}>{claimMsg}</div> : null}
                </div>
                <Button
                    variant="primary"
                    className={styles.claimBtn}
                    onClick={doClaimDaily}
                    busy={claiming}
                    busyLabel={communityText('Claiming…')}
                >
                    <CalendarCheck size={16} />{communityText('Claim daily')}</Button>
            </section>
            {accountError ? (
                <StatusMessage compact error onRetry={() => setAccountAttempt(value => value + 1)}>
                    {accountError}
                </StatusMessage>
            ) : null}

            {account && (account.donationsReceived > 0 || account.donationsGiven > 0) ? (
                <div className={styles.donationRow}>
                    {account.donationsReceived > 0 ? (
                        <div className={styles.donationCard}>
                            <HeartHandshake size={16} />
                            <span>{communityText('{value1} received in donations', {value1: fmtCredits(account.donationsReceived)})}</span>
                        </div>
                    ) : null}
                    {account.donationsGiven > 0 ? (
                        <div className={styles.donationCard}>
                            <Send size={16} />
                            <span>{communityText('{value1} given in donations', {value1: fmtCredits(account.donationsGiven)})}</span>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{communityText('Creator earnings')}</h2>
                <p className={styles.sectionLead}>{communityText('Tips, project sales, revenue shares, and bounties paid to you.')}</p>
                {earnings ? (
                    <React.Fragment>
                        <div className={styles.earningsGrid}>
                            <div>
                                <span>{communityText('Today')}</span>
                                <strong>{credits(earnings.totals.today)}</strong>
                            </div>
                            <div>
                                <span>{communityText('Last 30 days')}</span>
                                <strong>{credits(earnings.totals.last_30_days)}</strong>
                            </div>
                            <div>
                                <span>{communityText('Recorded total')}</span>
                                <strong>{credits(earnings.totals.lifetime)}</strong>
                            </div>
                        </div>
                        {earnings.history && earnings.history.length ? (
                            <ul className={styles.earningsList}>
                                {earnings.history.slice(0, 10).map(entry => (
                                    <li key={entry.id} className={styles.earningEntry}>
                                        <span>
                                            <strong>
                                                {entry.note || String(entry.kind || 'earning').replace(/_/g, ' ')}
                                            </strong>
                                            <small>{entry.payer ? communityText('From {value1}', {value1: entry.payer}) : entry.source}</small>
                                        </span>
                                        <strong>+{credits(entry.amount)}</strong>
                                    </li>
                                ))}
                            </ul>
                        ) : <EmptyState compact icon={Coins} title={communityText('No creator earnings yet')} />}
                    </React.Fragment>
                ) : earningsError ? (
                    <StatusMessage compact error onRetry={() => setEarningsAttempt(value => value + 1)}>
                        {earningsError}
                    </StatusMessage>
                ) : <StatusMessage compact>{communityText('Loading creator earnings…')}</StatusMessage>}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{communityText('Donation history')}</h2>
                <p className={styles.sectionLead}>{communityText('Credits you have sent or received through MistWarp profiles.')}</p>
                {account && Array.isArray(account.donations) && account.donations.length ? (
                    <ul className={styles.donations}>
                        {account.donations.map(donation => {
                            const received = donation.direction === 'received';
                            const donatedAt = safeDate(donation.time);
                            return (
                                <li key={donation.id} className={styles.donationEntry}>
                                    <span className={received ? styles.receivedIcon : styles.givenIcon}>
                                        {received ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                                    </span>
                                    <span className={styles.donationDetails}>
                                        <strong>{received ? communityText('Received') : communityText('Sent')}</strong>
                                        {donation.user ? (
                                            <span>
                                                {received ? communityText('From') : communityText('To')}{' '}
                                                <Link to={`/users/${donation.user}`}>{donation.user}</Link>
                                            </span>
                                        ) : null}
                                        {donatedAt ? (
                                            <time dateTime={donatedAt.toISOString()}>
                                                {donationDate(donation.time)}
                                            </time>
                                        ) : null}
                                    </span>
                                    <strong className={received ? styles.receivedAmount : styles.givenAmount}>
                                        {received ? '+' : '-'}{credits(donation.amount)}</strong>
                                </li>
                            );
                        })}
                    </ul>
                ) : accountError ? (
                    <EmptyState compact icon={HeartHandshake} title={communityText('Donation history unavailable')}>
                        {communityText('Try loading your wallet data again above.')}
                    </EmptyState>
                ) : accountLoaded ? (
                    <EmptyState compact icon={HeartHandshake} title={communityText('No profile donations yet')} />
                ) : (
                    <StatusMessage compact>{communityText('Loading donation history…')}</StatusMessage>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{communityText('Buy credits')}</h2>
                <p className={styles.sectionLead}>{communityText('Top up through Stripe. Credits are added to your Rotur account after checkout.')}</p>
                {billingMsg ? (
                    <Notice variant={billingMsg === 'success' ? 'success' : 'info'} className={styles.notice}>
                        {billingMsg === 'success' ?
                            communityText('Payment successful. Credits will appear in your balance shortly.') :
                            communityText('Checkout cancelled.')}
                    </Notice>
                ) : null}
                <div className={styles.tiers}>
                    {CREDIT_PACKS.map(pack => (
                        <button
                            key={pack.lookupKey}
                            type="button"
                            className={styles.tier}
                            onClick={() => buy(pack)}
                            disabled={checkoutBusy || !billingReady}
                        >
                            <span className={styles.tierCredits}>
                                {pack.credits.toLocaleString(getCommunityLocale())}
                                <span>{communityText('credits')}</span>
                            </span>
                            <span className={styles.tierPrice}>${pack.price.toFixed(2)}</span>
                        </button>
                    ))}
                </div>
                {checkoutBusy ? <p className={styles.checkoutNote}>{communityText('Opening secure Stripe checkout…')}</p> : null}
                {!billing ? <p className={styles.checkoutNote}>{communityText('Checking billing availability…')}</p> : null}
                {checkoutError ? (
                    <Notice variant="error" className={styles.checkoutNotice}>{checkoutError}</Notice>
                ) : null}
                {billing && !billing.billing_configured ? (
                    <Notice variant="warning" className={styles.checkoutNotice}>
                        {communityText('Stripe billing is currently unavailable. Try again later.')}
                    </Notice>
                ) : null}
                {billing && billing.stripe_portal ? (
                    <Button
                        variant="secondary"
                        className={styles.portalButton}
                        onClick={manageBilling}
                        busy={checkoutBusy}
                        busyLabel={communityText('Opening billing…')}
                    >
                        <ExternalLink size={14} />{communityText('Manage billing')}</Button>
                ) : null}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{communityText('Purchase history')}</h2>
                {purchaseError ? (
                    <StatusMessage compact error onRetry={() => setPurchaseAttempt(value => value + 1)}>
                        {purchaseError}
                    </StatusMessage>
                ) : purchases === null ? (
                    <StatusMessage compact />
                ) : purchases.length ? (
                    <ul className={styles.purchases}>
                        {purchases.map((purchase, index) => (
                            <li
                                key={`${purchase.projectId}-${index}`}
                                className={styles.purchaseRow}
                            >
                                <Link
                                    to={projectUrl(purchase.projectId)}
                                    className={styles.purchaseTitle}
                                >{purchase.title || purchase.projectId}</Link>
                                <span className={styles.purchaseMeta}>
                                    <span className={styles.purchaseAmount}>
                                        <Coins size={13} />
                                        {fmtCredits(purchase.amount)}
                                    </span>
                                    {purchase.at ? (
                                        <span className={styles.purchaseDate}>{formatDate(purchase.at)}</span>
                                    ) : null}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        compact
                        icon={Coins}
                        title={communityText('No purchases yet')}
                        action={<Button as={Link} to="/explore">{communityText('Explore projects')}</Button>}
                    >
                        {communityText('You have not bought any projects yet.')}
                    </EmptyState>
                )}
            </section>
        </main>
    );
};

export default Wallet;

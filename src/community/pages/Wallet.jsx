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
import {formatDate, safeDate} from '../format';
import styles from './Wallet.module.css';

const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const donationDate = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const Wallet = () => {
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
                setAccountError('Could not load your wallet data.');
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
            .catch(() => !stale && setPurchaseError('Could not load purchase history.'));
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
            .catch(() => !stale && setEarningsError('Could not load creator earnings.'));
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
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return (
            <main className={styles.page}>
                <p className={styles.status}>Sign in to view your wallet. <Button onClick={login}>Sign in</Button></p>
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
            setClaimMsg('Daily credits claimed!');
            const data = await getAccountSummary();
            if (data && walletContext.current === context) {
                setAccount(data);
                setAccountLoaded(true);
            }
        } catch (e) {
            if (walletContext.current !== context) return;
            if (e.waitHours) {
                setClaimMsg(`Already claimed. Come back in ${e.waitHours}h.`);
            } else if (e.needsReauth) {
                setClaimMsg('Your current login cannot claim daily credits. Log out and back in, then try again.');
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
                    'Your current login cannot buy credits. Log out and back in, then try again.' :
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
            <h1 className={styles.heading}>Wallet</h1>

            <section className={styles.balanceCard}>
                <span className={styles.balanceIcon}><WalletIcon size={22} /></span>
                <div>
                    <div className={styles.balanceLabel}>Your balance</div>
                    <div className={styles.balanceValue}>
                        {balance !== null ? (
                            <>
                                {fmtCredits(balance).toLocaleString()}
                                <span className={styles.balanceUnit}>credits</span>
                            </>
                        ) : (
                            <span className={styles.balanceUnknown}>
                                {accountLoaded ? 'Could not load your balance right now' : '…'}
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
                    busyLabel="Claiming…"
                >
                    <CalendarCheck size={16} />
                    Claim daily
                </Button>
            </section>
            {accountError ? (
                <p className={styles.status}>
                    {accountError}{' '}
                    <Button variant="secondary" onClick={() => setAccountAttempt(value => value + 1)}>Try again</Button>
                </p>
            ) : null}

            {account && (account.donationsReceived > 0 || account.donationsGiven > 0) ? (
                <div className={styles.donationRow}>
                    {account.donationsReceived > 0 ? (
                        <div className={styles.donationCard}>
                            <HeartHandshake size={16} />
                            <span>{`${fmtCredits(account.donationsReceived)} received in donations`}</span>
                        </div>
                    ) : null}
                    {account.donationsGiven > 0 ? (
                        <div className={styles.donationCard}>
                            <Send size={16} />
                            <span>{`${fmtCredits(account.donationsGiven)} given in donations`}</span>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Creator earnings</h2>
                <p className={styles.sectionLead}>Tips, project sales, revenue shares, and bounties paid to you.</p>
                {earnings ? (
                    <React.Fragment>
                        <div className={styles.earningsGrid}>
                            <div><span>Today</span><strong>{fmtCredits(earnings.totals.today)} credits</strong></div>
                            <div>
                                <span>Last 30 days</span>
                                <strong>{fmtCredits(earnings.totals.last_30_days)} credits</strong>
                            </div>
                            <div>
                                <span>Recorded total</span>
                                <strong>{fmtCredits(earnings.totals.lifetime)} credits</strong>
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
                                            <small>{entry.payer ? `From ${entry.payer}` : entry.source}</small>
                                        </span>
                                        <strong>+{fmtCredits(entry.amount)} credits</strong>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className={styles.empty}>No creator earnings yet.</p>}
                    </React.Fragment>
                ) : earningsError ? (
                    <p className={styles.empty}>
                        {earningsError}{' '}
                        <Button
                            variant="secondary"
                            onClick={() => setEarningsAttempt(value => value + 1)}
                        >Try again</Button>
                    </p>
                ) : <p className={styles.empty}>Loading creator earnings…</p>}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Donation history</h2>
                <p className={styles.sectionLead}>Credits you have sent or received through MistWarp profiles.</p>
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
                                        <strong>{received ? 'Received' : 'Sent'}</strong>
                                        {donation.user ? (
                                            <span>
                                                {received ? 'From ' : 'To '}
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
                                        {received ? '+' : '-'}{fmtCredits(donation.amount)} credits
                                    </strong>
                                </li>
                            );
                        })}
                    </ul>
                ) : accountError ? (
                    <p className={styles.empty}>
                        Donation history is unavailable. Try loading your wallet data again above.
                    </p>
                ) : accountLoaded ? (
                    <p className={styles.empty}>No profile donations yet.</p>
                ) : (
                    <p className={styles.empty}>Loading donation history…</p>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Buy credits</h2>
                <p className={styles.sectionLead}>
                    Top up through Stripe. Credits are added to your Rotur account after checkout.
                </p>
                {billingMsg ? (
                    <p className={styles.billingMsg}>
                        {billingMsg === 'success' ?
                            'Payment successful. Credits will appear in your balance shortly.' :
                            'Checkout cancelled.'}
                    </p>
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
                                {pack.credits.toLocaleString()}
                                <span> credits</span>
                            </span>
                            <span className={styles.tierPrice}>${pack.price.toFixed(2)}</span>
                        </button>
                    ))}
                </div>
                {checkoutBusy ? <p className={styles.checkoutNote}>Opening secure Stripe checkout…</p> : null}
                {!billing ? <p className={styles.checkoutNote}>Checking billing availability…</p> : null}
                {checkoutError ? <p className={styles.checkoutError}>{checkoutError}</p> : null}
                {billing && !billing.billing_configured ? (
                    <p className={styles.checkoutError}>Stripe billing is currently unavailable. Try again later.</p>
                ) : null}
                {billing && billing.stripe_portal ? (
                    <Button
                        variant="secondary"
                        className={styles.portalButton}
                        onClick={manageBilling}
                        busy={checkoutBusy}
                        busyLabel="Opening billing…"
                    >
                        <ExternalLink size={14} />
                        Manage billing
                    </Button>
                ) : null}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Purchase history</h2>
                {purchaseError ? (
                    <p className={styles.status}>
                        {purchaseError}{' '}
                        <Button
                            variant="secondary"
                            onClick={() => setPurchaseAttempt(value => value + 1)}
                        >Try again</Button>
                    </p>
                ) : purchases === null ? (
                    <p className={styles.status}>Loading…</p>
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
                    <p className={styles.empty}>
                        You have not bought any projects yet.{' '}
                        <Link
                            to="/explore"
                            className={styles.exploreLink}
                        >
                            Explore projects
                            <ExternalLink size={13} />
                        </Link>
                    </p>
                )}
            </section>
        </main>
    );
};

export default Wallet;

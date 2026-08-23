import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Coins, Wallet as WalletIcon, HeartHandshake, Send, ExternalLink, CalendarCheck} from 'lucide-react';
import api, {projectUrl} from '../api';
import {getAccountSummary, claimDaily} from '../../lib/rotur/client.js';
import {CREDIT_PACKS, getBillingStatus, openCreditCheckout, openBillingPortal, consumeBillingResult} from '../credits';
import {useUser} from '../UserContext.jsx';
import {formatDate} from '../format';
import styles from './Wallet.module.css';

const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const Wallet = () => {
    const {user, loading} = useUser();
    const [account, setAccount] = useState(null);
    const [accountLoaded, setAccountLoaded] = useState(false);
    const [purchases, setPurchases] = useState(null);
    const [claiming, setClaiming] = useState(false);
    const [claimMsg, setClaimMsg] = useState('');
    const [billing, setBilling] = useState(null);
    const [checkoutBusy, setCheckoutBusy] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const billingMsg = consumeBillingResult();

    useEffect(() => {
        if (!user) {
            setAccount(null);
            setPurchases(null);
            setBilling(null);
            return () => {};
        }
        let stale = false;
        getAccountSummary()
            .then(data => {
                if (stale) return;
                setAccount(data);
                setAccountLoaded(true);
            })
            .catch(() => !stale && setAccountLoaded(true));
        api.purchases()
            .then(data => !stale && setPurchases(data.purchases || []))
            .catch(() => !stale && setPurchases([]));
        getBillingStatus()
            .then(data => !stale && setBilling(data))
            .catch(() => !stale && setBilling({billing_configured: false}));
        return () => {
            stale = true;
        };
    }, [user]);

    if (loading) {
        return <main className={styles.page}><p className={styles.status}>Loading…</p></main>;
    }
    if (!user) {
        return <main className={styles.page}><p className={styles.status}>Sign in to view your wallet.</p></main>;
    }

    const balance = account && account.balance !== null ? account.balance : null;

    const doClaimDaily = async () => {
        if (claiming) return;
        setClaiming(true);
        setClaimMsg('');
        try {
            await claimDaily();
            setClaimMsg('Daily credits claimed!');
            const data = await getAccountSummary();
            if (data) {
                setAccount(data);
                setAccountLoaded(true);
            }
        } catch (e) {
            if (e.waitHours) {
                setClaimMsg(`Already claimed. Come back in ${e.waitHours}h.`);
            } else if (e.needsReauth) {
                setClaimMsg('Your current login cannot claim daily credits. Log out and back in, then try again.');
            } else {
                setClaimMsg(e.message || 'Could not claim daily credits.');
            }
        } finally {
            setClaiming(false);
        }
    };

    const buy = async pack => {
        if (checkoutBusy) return;
        setCheckoutBusy(true);
        setCheckoutError('');
        try {
            await openCreditCheckout(pack);
        } catch (e) {
            setCheckoutError(e.needsReauth ?
                'Your current login cannot buy credits. Log out and back in, then try again.' :
                (e.message || 'Could not open checkout.'));
        } finally {
            setCheckoutBusy(false);
        }
    };

    const manageBilling = async () => {
        if (checkoutBusy) return;
        setCheckoutBusy(true);
        setCheckoutError('');
        try {
            await openBillingPortal();
        } catch (e) {
            setCheckoutError(e.message || 'Could not open billing.');
        } finally {
            setCheckoutBusy(false);
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
                <button
                    className={styles.claimBtn}
                    onClick={doClaimDaily}
                    disabled={claiming}
                >
                    <CalendarCheck size={16} />
                    {claiming ? 'Claiming…' : 'Claim daily'}
                </button>
            </section>

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
                            disabled={checkoutBusy}
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
                {checkoutError ? <p className={styles.checkoutError}>{checkoutError}</p> : null}
                {billing && !billing.billing_configured ? (
                    <p className={styles.checkoutError}>Stripe billing is currently unavailable. Try again later.</p>
                ) : null}
                {billing && billing.stripe_portal ? (
                    <button
                        type="button"
                        className={styles.portalButton}
                        onClick={manageBilling}
                        disabled={checkoutBusy}
                    >
                        <ExternalLink size={14} />
                        Manage billing
                    </button>
                ) : null}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Purchase history</h2>
                {purchases === null ? (
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

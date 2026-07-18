import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Coins, Wallet as WalletIcon, HeartHandshake, Send, ExternalLink, CalendarCheck} from 'lucide-react';
import api, {projectUrl} from '../api';
import {getAccountSummary, claimDaily} from '../../lib/rotur/client.js';
import {PURCHASE_TIERS} from '../credits';
import {useUser} from '../UserContext.jsx';
import styles from './Wallet.module.css';

const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

const formatDate = ms => {
    if (!ms) return '';
    try {
        return new Date(ms).toLocaleDateString([], {year: 'numeric', month: 'short', day: 'numeric'});
    } catch (e) {
        return '';
    }
};

const Wallet = () => {
    const {user, loading} = useUser();
    const [account, setAccount] = useState(null);
    const [accountLoaded, setAccountLoaded] = useState(false);
    const [purchases, setPurchases] = useState(null);
    const [claiming, setClaiming] = useState(false);
    const [claimMsg, setClaimMsg] = useState('');

    useEffect(() => {
        if (!user) {
            setAccount(null);
            setPurchases(null);
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
            setClaimMsg(e.waitHours ?
                `Already claimed. Come back in ${e.waitHours}h.` :
                (e.message || 'Could not claim daily credits.'));
        } finally {
            setClaiming(false);
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
                                {accountLoaded ? 'Log out and back in to see your balance' : '…'}
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
                    Top up through Ko-fi. Credits are added to your Rotur account after checkout.
                </p>
                <div className={styles.tiers}>
                    {PURCHASE_TIERS.map(tier => (
                        <a
                            key={tier.credits}
                            className={styles.tier}
                            href={tier.link}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className={styles.tierCredits}>
                                {tier.credits.toLocaleString()}
                                <span> credits</span>
                            </span>
                            <span className={styles.tierPrice}>${tier.price.toFixed(2)}</span>
                        </a>
                    ))}
                </div>
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

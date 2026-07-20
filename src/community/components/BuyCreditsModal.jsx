import React from 'react';
import {Coins, X, ExternalLink} from 'lucide-react';
import {PURCHASE_TIERS} from '../credits';
import styles from './BuyCreditsModal.module.css';

const round = value => Math.round((Number(value) || 0) * 100) / 100;

// Shown anywhere a MistWarp action needs more credits than the viewer has.
// `needed` (optional) is the total the action costs; `balance` (optional) the
// viewer's current balance, used to show how many more are required.
const BuyCreditsModal = ({needed = 0, balance = null, onClose, children}) => {
    const short = needed && balance !== null ? Math.max(0, round(needed - balance)) : 0;
    return (
        <div
            className={styles.overlay}
            onClick={onClose}
        >
            <div
                className={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles.head}>
                    <span className={styles.headTitle}>
                        <Coins size={17} />
                        Buy credits
                    </span>
                    <button
                        className={styles.close}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.body}>
                    <p className={styles.lead}>
                        {short > 0 ?
                            `You need ${short} more credits for this.` :
                            'Top up your credits to buy projects and support creators.'}
                        {balance !== null ? ` You have ${round(balance)}.` : ''}
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
                    <p className={styles.note}>
                        <ExternalLink size={13} />
                        Credits are added to your Rotur account after checkout on Ko-fi.
                    </p>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BuyCreditsModal;

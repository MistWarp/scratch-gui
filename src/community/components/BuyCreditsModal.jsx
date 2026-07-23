import React from 'react';
import {Coins, ExternalLink} from 'lucide-react';
import {PURCHASE_TIERS} from '../credits';
import Modal from './ui/Modal.jsx';
import styles from './BuyCreditsModal.module.css';

const round = value => Math.round((Number(value) || 0) * 100) / 100;

// Shown anywhere a MistWarp action needs more credits than the viewer has.
// `needed` (optional) is the total the action costs; `balance` (optional) the
// viewer's current balance, used to show how many more are required.
const BuyCreditsModal = ({needed = 0, balance = null, onClose, children}) => {
    const short = needed && balance !== null ? Math.max(0, round(needed - balance)) : 0;
    return (
        <Modal
            icon={Coins}
            title="Buy credits"
            onClose={onClose}
        >
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
        </Modal>
    );
};

export default BuyCreditsModal;

import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, PartyPopper, Sparkles} from 'lucide-react';
import {useUser} from '../UserContext.jsx';
import {watchTier} from '../tier-watch.js';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import styles from './UpgradeCelebration.module.css';

const megabytes = value => Math.round(value / 1048576).toLocaleString();
const CONFETTI = Array.from({length: 24}, (_, index) => index);

const UpgradeCelebration = () => {
    const {text: communityText} = useCommunityText();
    const {user, setSubscription} = useUser();
    const [celebration, setCelebration] = useState(null);
    const username = user?.username;

    useEffect(() => {
        if (!username) return () => {};
        return watchTier(username, ({current, upgraded, acknowledge}) => {
            setSubscription(current.tier);
            if (upgraded) setCelebration({perks: current, acknowledge});
        });
    }, [username]);

    if (!celebration) return null;
    const {perks} = celebration;
    const close = () => {
        celebration.acknowledge();
        setCelebration(null);
    };
    const limits = perks.mistwarp || {};
    const unlocked = [
        limits.weeklyUploadBytes && communityText('{size} MB of uploads every week', {
            size: megabytes(limits.weeklyUploadBytes)
        }),
        limits.maxProjectAssetsBytes && communityText('{size} MB of assets per project', {
            size: megabytes(limits.maxProjectAssetsBytes)
        }),
        limits.recoveryDays && communityText('{days} days of deleted project recovery', {days: limits.recoveryDays}),
        limits.advancedAnalytics && communityText('Advanced analytics and CSV exports'),
        limits.vanityProjectUrls && communityText('Vanity project URLs')
    ].filter(Boolean);

    return (
        <Modal
            icon={PartyPopper}
            title={communityText('Welcome to {tier}', {tier: perks.tier})}
            onClose={close}
            actions={<>
                <Button onClick={close}>{communityText('Close')}</Button>
                <Button
                    as={Link}
                    to="/perks"
                    variant="primary"
                    onClick={close}
                ><Sparkles size={16} />{communityText('View your membership benefits')}</Button>
            </>}
        >
            <div className={styles.confetti} aria-hidden="true">
                {CONFETTI.map(index => (
                    <span
                        key={index}
                        style={{'--i': index}}
                    />
                ))}
            </div>
            <p className={styles.lead}>
                {communityText('Thank you for supporting MistWarp. Your new membership benefits are ready to use.')}
            </p>
            <ul className={styles.list}>
                {unlocked.map(line => <li key={line}><Check size={16} />{line}</li>)}
            </ul>
        </Modal>
    );
};

export default UpgradeCelebration;

import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Coins, ExternalLink, ShoppingBag, Wallet as WalletIcon} from 'lucide-react';
import api, {projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../components/ui/EmptyState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import {formatDate} from '../format';
import styles from './Purchases.module.css';

const ROTUR_ACCOUNT = 'https://rotur.dev/me';

const fmtCredits = value => Math.round((Number(value) || 0) * 100) / 100;

// What you've bought on MistWarp, from MistWarp's own records. Your balance,
// daily credits and everything else about your credits are on Rotur.
const Purchases = () => {
    const {text: communityText} = useCommunityText();
    const {user, loading, login} = useUser();
    const viewerName = (user && user.username) || '';
    const [purchases, setPurchases] = useState(null);
    const [purchaseError, setPurchaseError] = useState('');
    const [purchaseAttempt, setPurchaseAttempt] = useState(0);

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
                <SignInPrompt onSignIn={login}>{communityText('Sign in to see your purchases.')}</SignInPrompt>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <PageHeader icon={ShoppingBag} title={communityText('Purchases')} />

            <section className={styles.roturCard}>
                <span className={styles.roturIcon}><WalletIcon size={22} /></span>
                <div>
                    <div className={styles.roturTitle}>{communityText('Your credits are on Rotur')}</div>
                    <div className={styles.roturLead}>
                        {communityText(
                            'See your balance, claim daily credits and check your transactions on rotur.dev.'
                        )}
                    </div>
                </div>
                <Button
                    as="a"
                    variant="primary"
                    className={styles.roturButton}
                    href={ROTUR_ACCOUNT}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {communityText('Open Rotur')}<ExternalLink size={15} /></Button>
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

export default Purchases;

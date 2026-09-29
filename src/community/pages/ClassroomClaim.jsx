import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {CheckCircle2, FolderOpen, LogIn, LogOut, UserRoundCheck} from 'lucide-react';
import api from '../api';
import {useUser} from '../UserContext.jsx';
import {formatDate} from '../format.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import styles from './ClassroomJoin.module.css';

const ClassroomClaim = () => {
    const {text: communityText} = useCommunityText();
    const {code} = useParams();
    const {user, loading, login, logout} = useUser();
    const [claim, setClaim] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [redeemError, setRedeemError] = useState('');

    useEffect(() => {
        let active = true;
        setClaim(null);
        setError('');
        api.classroom.claim(code)
            .then(data => {
                if (active) setClaim(data);
            })
            .catch(e => {
                if (active) setError((e && e.message) || communityText('This link has expired or was already used.'));
            });
        return () => {
            active = false;
        };
    }, [code]);

    const redeem = async () => {
        if (busy) return;
        setBusy(true);
        setRedeemError('');
        try {
            const data = await api.classroom.redeemClaim(code);
            setResult(data);
        } catch (e) {
            setRedeemError((e && e.message) || communityText('The move did not complete. Please try again.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className={styles.page}>
            <div className={styles.brand}>
                <UserRoundCheck size={28} aria-hidden="true" />
                <span>{communityText('MistWarp Classroom')}</span>
            </div>
            {error ? (
                <div className={styles.card}>
                    <h1 className={styles.title}>{communityText('This link cannot be used')}</h1>
                    <Notice variant="error">{error}</Notice>
                </div>
            ) : null}
            {!error && !claim ? <div className={styles.card}><StatusMessage /></div> : null}
            {claim && result ? (
                <div className={styles.card}>
                    <h1 className={styles.title}>{communityText('All moved!')}</h1>
                    <p className={styles.lead}>
                        {communityText('{value1, plural, one {# project now belongs} other {# projects now belong}} to {value2}. The class account has been removed.', {value1: (result.projects || []).length, value2: user ? user.username : ''})}
                    </p>
                    <Button as={Link} to="/mystuff" variant="primary" className={styles.bigButton}>
                        <FolderOpen size={20} aria-hidden="true" />
                        {communityText('Go to My stuff')}
                    </Button>
                </div>
            ) : null}
            {claim && !result ? (
                <div className={styles.card}>
                    <p className={styles.className}>{claim.className}</p>
                    <h1 className={styles.title}>{communityText('Move the projects of {value1} to your own account', {value1: claim.displayName})}</h1>
                    <p className={styles.lead}>
                        {communityText('{value1, plural, one {# project} other {# projects}} from the class of {value2} will move to the Rotur account you sign in with. The link works until {value3}.', {value1: claim.projectCount || 0, value2: claim.teacher, value3: formatDate(claim.expiresAt)})}
                    </p>
                    <Notice>{communityText('If you are under 13, ask a parent or guardian to do this with you.')}</Notice>
                    {!user && !loading ? (
                        <Button variant="primary" className={styles.bigButton} onClick={login}>
                            <LogIn size={20} aria-hidden="true" />
                            {communityText('Sign in with Rotur')}
                        </Button>
                    ) : null}
                    {user && user.isStudent ? (
                        <EmptyState
                            compact
                            icon={LogOut}
                            title={communityText('You are signed in as a class account.')}
                            action={(
                                <Button onClick={logout}>
                                    <LogOut size={16} aria-hidden="true" />
                                    {communityText('Sign out')}
                                </Button>
                            )}
                        >
                            {communityText('Sign out, then open this link again and sign in with your own Rotur account.')}
                        </EmptyState>
                    ) : null}
                    {user && !user.isStudent ? (
                        <React.Fragment>
                            <p className={styles.lead}>{communityText('You are signed in as {value1}.', {value1: user.username})}</p>
                            {redeemError ? <Notice variant="error">{redeemError}</Notice> : null}
                            <Button variant="primary" className={styles.bigButton} onClick={redeem} busy={busy} busyLabel={communityText('Moving…')}>
                                <CheckCircle2 size={20} aria-hidden="true" />
                                {communityText('Move the projects to my account')}
                            </Button>
                        </React.Fragment>
                    ) : null}
                </div>
            ) : null}
        </main>
    );
};

export default ClassroomClaim;

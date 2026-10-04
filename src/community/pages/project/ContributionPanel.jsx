/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronRight, GitFork, GitPullRequest, LogIn} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api, {projectUrl} from '../../api';
import {listCommerceBounties} from '../../credits';
import Button from '../../components/ui/Button.jsx';
import EmptyState, {SignInPrompt} from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import SelectMenu from '../../components/ui/SelectMenu.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import {
    contributionPayload, contributionRemixes, openPullForRemix, recalledBountyClaim, rememberBountyClaim
} from './project-helpers.js';
import styles from '../Project.module.css';

const ContributionPanel = ({id, baseUrl, sourceProjectId, preferredBountyId, onRemix, user, viewerName, login}) => {
    const {text: communityText} = useCommunityText();
    const actionContext = `${id}\u0000${sourceProjectId}\u0000${viewerName}`;
    const actionContextRef = useRef(actionContext);
    actionContextRef.current = actionContext;
    const [remixProjectId, setRemixProjectId] = useState(sourceProjectId);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const [bounties, setBounties] = useState([]);
    const [bountyId, setBountyId] = useState('');
    const [remixes, setRemixes] = useState(sourceProjectId ? [] : null);
    const [targetPulls, setTargetPulls] = useState([]);
    const [remixLoadError, setRemixLoadError] = useState(false);
    const [remixLoadAttempt, setRemixLoadAttempt] = useState(0);
    const actionLocks = useRef(new Set());
    const openPull = openPullForRemix(targetPulls, id, remixProjectId);

    useEffect(() => {
        actionLocks.current.clear();
        setRemixProjectId(sourceProjectId);
        setTitle('');
        setBody('');
        setStatus('');
        setBusy(false);
        const rememberedBounty = preferredBountyId || (sourceProjectId ? recalledBountyClaim(sourceProjectId) : '');
        setBountyId(rememberedBounty);
        if (user) {
            listCommerceBounties({source: 'mistwarp', resource_type: 'project', resource_id: id, status: 'open'})
                .then(data => {
                    const openBounties = data.bounties || [];
                    setBounties(openBounties);
                    if (rememberedBounty && !openBounties.some(item => item.id === rememberedBounty)) {
                        setBountyId('');
                        if (sourceProjectId) rememberBountyClaim(sourceProjectId, '');
                    }
                })
                .catch(() => setBounties([]));
        } else {
            setBounties([]);
        }
    }, [id, sourceProjectId, viewerName, preferredBountyId]);

    useEffect(() => {
        if (sourceProjectId) {
            setRemixes([]);
            setTargetPulls([]);
            setRemixLoadError(false);
            return () => {};
        }
        if (!user?.username) {
            setRemixes([]);
            setTargetPulls([]);
            setRemixProjectId('');
            setRemixLoadError(false);
            return () => {};
        }
        let active = true;
        setRemixes(null);
        setRemixLoadError(false);
        Promise.all([
            api.myProjects(user.username),
            api.pulls(id)
        ]).then(([projectData, pullData]) => {
            if (!active) return;
            const ownedRemixes = contributionRemixes(projectData.projects, id, user.username);
            setRemixes(ownedRemixes);
            setTargetPulls(pullData.pulls || []);
            setRemixProjectId(current => (
                ownedRemixes.some(project => project.id === current) ? current : (ownedRemixes[0]?.id || '')
            ));
        }).catch(() => {
            if (!active) return;
            setRemixes([]);
            setTargetPulls([]);
            setRemixLoadError(true);
        });
        return () => {
            active = false;
        };
    }, [id, remixLoadAttempt, sourceProjectId, user?.username]);

    const submit = async event => {
        event.preventDefault();
        const context = actionContextRef.current;
        if (actionLocks.current.has(context)) return;
        if (!user) {
            login();
            return;
        }
        const payload = contributionPayload(remixProjectId, title, body, bountyId);
        if (!payload.remixProjectId || !payload.title) {
            setStatus(communityText('Add a fork project ID and title before sending.'));
            return;
        }
        actionLocks.current.add(context);
        setBusy(true);
        setStatus('');
        try {
            const data = await api.contribute(id, payload);
            if (actionContextRef.current !== context) return;
            setTargetPulls(current => [data.pull, ...current]);
            setStatus('');
            setTitle('');
            setBody('');
            setBountyId('');
            if (sourceProjectId) rememberBountyClaim(sourceProjectId, '');
        } catch (e) {
            if (actionContextRef.current === context) {
                setStatus(e.message || communityText('Could not send the contribution.'));
            }
        } finally {
            actionLocks.current.delete(context);
            if (actionContextRef.current === context) setBusy(false);
        }
    };

    return (
        <form className={styles.inlineForm} onSubmit={submit}>
            <h3>{communityText('Send changes back')}</h3>
            <p className={styles.muted}>
                {sourceProjectId ?
                    communityText('This creates a pull request for the parent project. The owner can review your changes before merging them.') :
                    communityText('Choose one of your remixes, then describe the changes you want the project owner to review.')}
            </p>
            {!sourceProjectId ? (
                <div className={styles.contributionRemixPicker}>
                    {remixes === null ? <StatusMessage compact>{communityText('Loading your remixes…')}</StatusMessage> : null}
                    {remixLoadError ? (
                        <StatusMessage error compact onRetry={() => setRemixLoadAttempt(value => value + 1)}>
                            {communityText('Could not load your remixes.')}
                        </StatusMessage>
                    ) : null}
                    {remixes?.length ? (
                        <label className={styles.bountySelect}>
                            <span>{communityText('Remix to contribute')}</span>
                            <SelectMenu
                                options={remixes.map(project => ({
                                    value: project.id,
                                    label: project.title || project.id
                                }))}
                                value={remixProjectId}
                                disabled={busy}
                                onChange={setRemixProjectId}
                                ariaLabel={communityText('Remix to contribute')}
                                width={320}
                            />
                        </label>
                    ) : null}
                    {user && remixes && !remixes.length && !remixLoadError ? (
                        <EmptyState
                            compact
                            icon={GitFork}
                            title={communityText('No remix yet')}
                            action={onRemix ? (
                                <Button type="button" variant="primary" onClick={onRemix}>
                                    <GitFork size={15} />{communityText('Create a remix')}</Button>
                            ) : null}
                        >{communityText('You do not have a remix of this project yet.')}</EmptyState>
                    ) : null}
                    {!user ? (
                        <SignInPrompt compact onSignIn={login}>{communityText('Sign in to choose one of your remixes.')}</SignInPrompt>
                    ) : null}
                </div>
            ) : null}
            {openPull ? (
                <Link className={styles.openContribution} to={`${baseUrl || projectUrl(id)}/pulls/${openPull.index}`}>
                    <GitPullRequest size={17} />
                    <span><strong>{openPull.title}</strong><small>{communityText('Pull request #{value1} is open for this remix', {value1: openPull.index})}</small></span>
                    <ChevronRight size={16} />
                </Link>
            ) : (sourceProjectId || remixProjectId) ? (
                <React.Fragment>
                    <ol className={styles.contributionSteps}>
                        <li className={sourceProjectId || remixProjectId ? styles.contributionStepDone : ''}><span>1</span>{communityText('Remix the project')}</li>
                        <li><span>2</span>{communityText('Edit and save your remix')}</li>
                        <li><span>3</span>{communityText('Describe your work and send it')}</li>
                    </ol>
                    <input value={title} disabled={busy} required maxLength={200} placeholder={communityText('What did you change?')} onChange={event => setTitle(event.target.value)} />
                    <textarea value={body} disabled={busy} placeholder={communityText('Anything the creator should know')} onChange={event => setBody(event.target.value)} />
                    {bounties.length ? (
                        <label className={styles.bountySelect}>
                            <span>{communityText('Bounty to claim')} <small>{communityText('Optional')}</small></span>
                            <SelectMenu
                                options={[
                                    {value: '', label: communityText('No bounty')},
                                    ...bounties.map(bounty => ({
                                        value: bounty.id,
                                        label: communityText('{value1} credits: {value2}', {value1: bounty.amount, value2: bounty.title})
                                    }))
                                ]}
                                value={bountyId}
                                disabled={busy}
                                onChange={setBountyId}
                                ariaLabel={communityText('Bounty to claim')}
                                width={320}
                            />
                            <small>{communityText('The reward is paid when the project owner merges this pull request.')}</small>
                        </label>
                    ) : null}
                    <Button type="submit" variant="primary" busy={busy} busyLabel={communityText('Sending…')}>
                        {user ? <GitPullRequest size={15} /> : <LogIn size={15} />}
                        {user ? communityText('Create pull request') : communityText('Sign in to contribute')}
                    </Button>
                </React.Fragment>
            ) : null}
            {status ? <Notice variant="error">{status}</Notice> : null}
        </form>
    );
};

export default ContributionPanel;

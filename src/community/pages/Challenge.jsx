import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarDays, Gavel, Info, Medal, MessageCircle, ScrollText, Settings, Sparkles, Star, Trophy, UserMinus, UserPlus, Users} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import UserLink from '../components/UserLink.jsx';
import CommentThread from '../components/CommentThread.jsx';
import useSpaceCommentSource from '../space-comments.js';
import ProjectCard from '../components/ProjectCard.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import Button from '../components/ui/Button.jsx';
import CardGrid from '../components/ui/CardGrid.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import styles from './Challenge.module.css';

const PHASES = {
    'upcoming': {label: 'Starts soon', tone: 'planned'},
    'submissions': {label: 'Submissions open', tone: 'open'},
    'judging': {label: 'Judging', tone: 'building'},
    'awaiting-results': {label: 'Results pending', tone: 'building'},
    'results': {label: 'Results published', tone: 'shipped'}
};

const timestamp = value => {
    const parsed = typeof value === 'number' ? value :
        typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : new Date(value).getTime();
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const dateTime = value => {
    const parsed = timestamp(value);
    return parsed ? new Date(parsed).toLocaleString(getCommunityLocale(), {dateStyle: 'medium', timeStyle: 'short'}) : 'Not set';
};

export const challengePhase = (space, now) => {
    if (timestamp(space.resultsPublishedAt)) return 'results';
    const startsAt = timestamp(space.startsAt);
    const endsAt = timestamp(space.endsAt);
    const judgingEndsAt = timestamp(space.judgingEndsAt);
    if (startsAt && now < startsAt) return 'upcoming';
    if (endsAt && now <= endsAt) return 'submissions';
    if (judgingEndsAt && now <= judgingEndsAt) return 'judging';
    return 'awaiting-results';
};

export const challengeScore = value => {
    const score = Number(value);
    return Number.isFinite(score) && score > 0 ? score.toFixed(1) : 'No score';
};

export const challengeRatingsReady = (criteria, ratings) => (
    criteria.length > 0 && criteria.every(criterion => {
        const value = Number(ratings[criterion.id]);
        return Number.isFinite(value) && value >= 1 && value <= 10;
    })
);

const remaining = (value, now) => {
    const difference = Math.max(0, timestamp(value) - now);
    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    if (days) return `${days}d ${hours}h`;
    const minutes = Math.floor((difference % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

const elapsedFraction = (from, to, now) => {
    const start = timestamp(from);
    const end = timestamp(to);
    if (!start || !end || end <= start) return now >= end ? 1 : 0;
    return Math.min(1, Math.max(0, (now - start) / (end - start)));
};

const ScoreForm = ({challengeId, project, criteria, onSaved}) => {
    const {text: communityText} = useCommunityText();
    const prior = project.myScore || {};
    const priorRatings = new Map((prior.ratings || []).map(rating => [rating.criterionId, rating.value]));
    const [ratings, setRatings] = useState(() => Object.fromEntries(criteria.map(criterion => [criterion.id, priorRatings.get(criterion.id) || 5])));
    const [feedback, setFeedback] = useState(prior.feedback || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const saveInFlight = useRef(new Set());
    const currentContext = useRef(`${challengeId}\u0000${project.id}`);
    currentContext.current = `${challengeId}\u0000${project.id}`;
    const ratingsReady = challengeRatingsReady(criteria, ratings);

    useEffect(() => {
        setSaving(false);
        setMessage('');
    }, [challengeId, project.id]);

    const save = async event => {
        event.preventDefault();
        const actionContext = `${challengeId}\u0000${project.id}`;
        if (saveInFlight.current.has(actionContext)) return;
        if (!ratingsReady) {
            setMessage(communityText('Give every criterion a score from 1 to 10.'));
            return;
        }
        const releaseSave = () => {
            saveInFlight.current.delete(actionContext);
        };
        saveInFlight.current.add(actionContext);
        setSaving(true);
        setMessage('');
        try {
            await api.scoreChallengeEntry(challengeId, project.id, {
                ratings: criteria.map(criterion => ({criterionId: criterion.id, value: Number(ratings[criterion.id])})),
                feedback: feedback.trim()
            });
            if (currentContext.current === actionContext) {
                setMessage(communityText('Score saved.'));
                onSaved();
            }
        } catch (error) {
            if (currentContext.current === actionContext) {
                setMessage(error.message || 'Could not save this score.');
            }
        } finally {
            releaseSave();
            if (currentContext.current === actionContext) setSaving(false);
        }
    };

    return (
        <form className={styles.scoreForm} onSubmit={save}>
            <div className={styles.scoreHeading}><Gavel size={16} /><strong>{communityText('Your score')}</strong>{prior.edited ? <span>{communityText('Last saved {value1}', {value1: dateTime(prior.edited)})}</span> : null}</div>
            {criteria.map(criterion => (
                <label key={criterion.id} className={styles.scoreCriterion}>
                    <span><strong>{criterion.name}</strong><small>{criterion.description}</small></span>
                    <input type="number" min="1" max="10" required disabled={saving} value={ratings[criterion.id]} onChange={event => setRatings(current => ({...current, [criterion.id]: event.target.value}))} />
                    <em>{communityText('/ 10')}</em>
                </label>
            ))}
            <label className={styles.feedbackField}><span>{communityText('Private feedback for the host')}</span><textarea disabled={saving} maxLength={2000} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder={communityText('Notes on this entry')} /></label>
            {!criteria.length ? <p>{communityText('No judging criteria are configured.')}</p> : null}
            <div className={styles.scoreActions}><Button variant="primary" type="submit" busy={saving} busyLabel={communityText('Saving…')} disabled={!ratingsReady}>{communityText('Save score')}</Button>{message ? <span>{message}</span> : null}</div>
        </form>
    );
};

const Entry = ({challengeId, project, challenge, user, login, load, showScore = false}) => {
    const {text: communityText} = useCommunityText();
    const canVote = !showScore && challenge.phase === 'judging' && challenge.communityVoting;
    const [voting, setVoting] = useState(false);
    const [voteError, setVoteError] = useState('');
    const voteInFlight = useRef(new Set());
    const currentContext = useRef(`${challengeId}\u0000${project.id}`);
    currentContext.current = `${challengeId}\u0000${project.id}`;
    useEffect(() => {
        setVoting(false);
        setVoteError('');
    }, [challengeId, project.id]);
    const vote = async value => {
        if (!user) {
            login();
            return;
        }
        const actionContext = `${challengeId}\u0000${project.id}`;
        if (voteInFlight.current.has(actionContext)) return;
        const releaseVote = () => {
            voteInFlight.current.delete(actionContext);
        };
        voteInFlight.current.add(actionContext);
        setVoting(true);
        setVoteError('');
        try {
            await api.voteChallengeEntry(challengeId, project.id, value);
            if (currentContext.current === actionContext) await load();
        } catch (requestError) {
            if (currentContext.current === actionContext) {
                setVoteError(requestError.message || 'Could not save your rating.');
            }
        } finally {
            releaseVote();
            if (currentContext.current === actionContext) setVoting(false);
        }
    };
    return (
        <article className={styles.entry}>
            {challenge.phase === 'results' && project.place ? <span className={project.place <= 3 ? styles.placeWinner : styles.place}>#{project.place}</span> : null}
            <ProjectCard project={project} />
            {challenge.phase === 'results' ? (
                <div className={styles.entryResults}>
                    <span><strong>{challengeScore(project.judgeScore)}</strong>{communityText('judges')}</span>
                    {challenge.communityVoting ? <span><strong>{challengeScore(project.audienceScore)}</strong>{communityText('audience')}</span> : null}
                </div>
            ) : null}
            {canVote ? (
                <div className={styles.audienceVote}>
                    <span>{communityText('Audience rating')}</span>
                    <div>{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" disabled={voting} className={value <= project.myVote ? styles.starActive : ''} onClick={() => vote(value)} aria-label={communityText('Rate {value1} out of 5', {value1: value})}><Star size={17} fill={value <= project.myVote ? 'currentColor' : 'none'} /></button>)}</div>
                    <small>{communityText('{value1} ratings', {value1: project.audienceVoteCount || 0})}</small>
                    {voteError ? <small role="alert">{voteError}</small> : null}
                </div>
            ) : null}
            {showScore ? <ScoreForm challengeId={challengeId} project={project} criteria={challenge.criteria || []} onSaved={load} /> : null}
        </article>
    );
};

const Timeline = ({space, phase, now}) => {
    const {text: communityText} = useCommunityText();
    const finished = phase === 'results' || phase === 'awaiting-results';
    const steps = [
        {
            key: 'open',
            icon: CalendarDays,
            label: communityText('Submissions open'),
            at: space.startsAt,
            done: phase !== 'upcoming',
            active: phase === 'upcoming',
            countdown: phase === 'upcoming' ? communityText('Starts in {value1}', {value1: remaining(space.startsAt, now)}) : '',
            progress: phase === 'upcoming' ? 0 : phase === 'submissions' ? elapsedFraction(space.startsAt, space.endsAt, now) : 1
        },
        {
            key: 'close',
            icon: Trophy,
            label: communityText('Submissions close'),
            at: space.endsAt,
            done: phase === 'judging' || finished,
            active: phase === 'submissions',
            countdown: phase === 'submissions' ? communityText('{value1} left to enter', {value1: remaining(space.endsAt, now)}) : '',
            progress: finished ? 1 : phase === 'judging' ? elapsedFraction(space.endsAt, space.judgingEndsAt, now) : 0
        },
        {
            key: 'judging',
            icon: Gavel,
            label: communityText('Judging ends'),
            at: space.judgingEndsAt,
            done: finished,
            active: phase === 'judging',
            countdown: phase === 'judging' ? communityText('{value1} of judging left', {value1: remaining(space.judgingEndsAt, now)}) : ''
        }
    ];
    return (
        <ol className={styles.timeline} aria-label={communityText('Challenge schedule')}>
            {steps.map(step => (
                <li key={step.key} className={step.active ? styles.stepActive : step.done ? styles.stepDone : styles.step}>
                    <div className={styles.stepTrack}>
                        <span className={styles.stepDot}><step.icon size={13} aria-hidden="true" /></span>
                        {typeof step.progress === 'number' ? <span className={styles.progress}><span className={styles.progressFill} style={{width: `${Math.round(step.progress * 100)}%`}} /></span> : null}
                    </div>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <strong className={styles.stepDate}>{dateTime(step.at)}</strong>
                    {step.countdown ? <span className={styles.stepCountdown}>{step.countdown}</span> : null}
                </li>
            ))}
        </ol>
    );
};

const Challenge = ({id, space, user, login, load}) => {
    const {text: communityText} = useCommunityText();
    const [tab, setTab] = useState(space.phase === 'results' ? 'results' : 'overview');
    const [error, setError] = useState('');
    const [actionBusy, setActionBusy] = useState('');
    const [now, setNow] = useState(Date.now());
    const actionInFlight = useRef(new Set());
    const currentId = useRef(id);
    currentId.current = id;
    const currentPhase = challengePhase(space, now);
    const phase = PHASES[currentPhase] || PHASES.upcoming;
    const liveSpace = {...space, phase: currentPhase};
    const criteria = space.criteria || [];
    const judges = space.judges || [];
    const commentSource = useSpaceCommentSource(id);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setActionBusy('');
        setError('');
    }, [id]);

    const respondToJudgeInvite = async accepted => {
        const actionId = id;
        if (actionInFlight.current.has(actionId)) return;
        const releaseAction = () => {
            actionInFlight.current.delete(actionId);
        };
        actionInFlight.current.add(actionId);
        setActionBusy('invite');
        setError('');
        try {
            await api.respondJudgeInvitation(id, accepted);
            if (currentId.current === actionId) await load();
        } catch (requestError) {
            if (currentId.current === actionId) {
                setError(requestError.message || 'Could not respond to the invitation.');
            }
        } finally {
            releaseAction();
            if (currentId.current === actionId) setActionBusy('');
        }
    };

    const toggleJoined = async () => {
        if (!user) {
            login();
            return;
        }
        const actionId = id;
        if (actionInFlight.current.has(actionId)) return;
        const releaseAction = () => {
            actionInFlight.current.delete(actionId);
        };
        actionInFlight.current.add(actionId);
        setActionBusy('join');
        setError('');
        try {
            if (space.joined) await api.leaveChallenge(id);
            else await api.joinChallenge(id);
            if (currentId.current === actionId) await load();
        } catch (requestError) {
            if (currentId.current === actionId) {
                setError(requestError.message || 'Could not update your participation.');
            }
        } finally {
            releaseAction();
            if (currentId.current === actionId) setActionBusy('');
        }
    };

    const tabs = [
        {key: 'overview', label: communityText('Overview')},
        {key: 'submissions', label: <>{communityText('Submissions')} <b>{space.projects.length}</b></>},
        ...(space.isJudge && currentPhase === 'judging' ? [{key: 'judging', label: communityText('Judge entries')}] : []),
        ...(currentPhase === 'results' ? [{key: 'results', label: communityText('Results')}] : [])
    ];

    useEffect(() => {
        if (tabs.some(item => item.key === tab)) return;
        setTab(currentPhase === 'results' ? 'results' : 'overview');
    }, [currentPhase, space.isJudge, tab]);

    return (
        <main className={styles.page}>
            {space.judgeInvited ? (
                <Notice
                    icon={Gavel}
                    className={styles.invite}
                    title={<><UserLink username={space.owner}>{space.owner}</UserLink>{' '}{communityText('invited you to judge this challenge.')}</>}
                    action={(
                        <React.Fragment>
                            <Button variant="primary" busy={actionBusy === 'invite'} busyLabel={communityText('Responding…')} disabled={Boolean(actionBusy)} onClick={() => respondToJudgeInvite(true)}>{communityText('Accept')}</Button>
                            <Button disabled={Boolean(actionBusy)} onClick={() => respondToJudgeInvite(false)}>{communityText('Decline')}</Button>
                        </React.Fragment>
                    )}
                >
                    {communityText('Judges score every submission against the published criteria.')}
                </Notice>
            ) : null}
            <PageHeader
                backTo="/spaces?kind=challenge"
                backLabel={communityText('All challenges')}
                icon={Trophy}
                title={space.title}
                lead={(
                    <span className={styles.meta}>
                        <span className={styles.phase} data-tone={phase.tone}>{communityText(phase.label)}</span>
                        <Link to={`/users/${space.owner}`} className={styles.hostLink}><Avatar username={space.owner} size={22} /><span>{communityText('Hosted by {value1}', {value1: space.owner})}</span></Link>
                        <GroupTag username={space.owner} compact />
                    </span>
                )}
                actions={(
                    <React.Fragment>
                        {(currentPhase === 'upcoming' || currentPhase === 'submissions') ? <Button variant={space.joined ? 'secondary' : 'primary'} busy={actionBusy === 'join'} busyLabel={communityText('Updating…')} disabled={Boolean(actionBusy)} onClick={toggleJoined}>{space.joined ? <UserMinus size={16} /> : <UserPlus size={16} />}{space.joined ? communityText('Leave challenge') : communityText('Join challenge')}</Button> : null}
                        {space.canManage ? <Button as={Link} to={`/spaces/${id}/manage`}><Settings size={16} />{communityText('Manage challenge')}</Button> : null}
                    </React.Fragment>
                )}
            >
                <Timeline space={space} phase={currentPhase} now={now} />
            </PageHeader>
            <UnderlineTabs items={tabs} value={tab} onChange={setTab} className={styles.tabs} ariaLabel="Challenge sections" />
            {error ? <Notice variant="error" className={styles.pageNotice}>{error}</Notice> : null}
            {tab === 'overview' ? (
                <div className={styles.overview}>
                    <div className={styles.mainColumn}>
                        {space.theme ? (
                            <section className={styles.theme}>
                                <Sparkles size={22} aria-hidden="true" />
                                <div><span>{communityText('Theme')}</span><strong>{space.theme}</strong></div>
                            </section>
                        ) : null}
                        <section className={styles.section}>
                            <SectionHeading icon={Info} title={communityText('About this challenge')} />
                            <div className={styles.longText}><RichText text={space.description || communityText('The host has not added a description yet.')} /></div>
                        </section>
                        <section className={styles.section}>
                            <SectionHeading icon={ScrollText} title={communityText('Rules')} />
                            <div className={styles.longText}><RichText text={space.rules || communityText('The host has not added rules yet.')} /></div>
                        </section>
                    </div>
                    <aside className={styles.sidebar}>
                        <dl className={styles.facts}>
                            <div><dt>{communityText('Joined')}</dt><dd>{space.participantCount || 0}</dd></div>
                            <div><dt>{communityText('Submissions')}</dt><dd>{space.projects.length}</dd></div>
                            <div><dt>{communityText('Audience voting')}</dt><dd>{space.communityVoting ? communityText('On') : communityText('Off')}</dd></div>
                        </dl>
                        <div className={styles.sidebarBlock}>
                            <h2><Gavel size={16} aria-hidden="true" />{communityText('Judging criteria')}</h2>
                            {criteria.length ? (
                                <ul className={styles.criteria}>
                                    {criteria.map(criterion => (
                                        <li key={criterion.id}>
                                            <div>
                                                <strong>{criterion.name}</strong>
                                                {criteria.length > 1 ? <span className={styles.weight} aria-label={communityText('Weight {value1} of 5', {value1: criterion.weight})}>{[1, 2, 3, 4, 5].map(step => <i key={step} className={step <= criterion.weight ? styles.weightOn : ''} />)}</span> : null}
                                            </div>
                                            {criterion.description ? <p>{criterion.description}</p> : null}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className={styles.sidebarEmpty}>{communityText('No judging criteria are configured.')}</p>}
                        </div>
                        <div className={styles.sidebarBlock}>
                            <h2><Users size={16} aria-hidden="true" />{communityText('Judges')}</h2>
                            {judges.length ? (
                                <ul className={styles.people}>
                                    {judges.map(name => <li key={name}><Link to={`/users/${name}`}><Avatar username={name} size={28} /><span>{name}</span></Link><GroupTag username={name} compact linked={false} /></li>)}
                                </ul>
                            ) : <p className={styles.sidebarEmpty}>{communityText('No judges announced yet.')}</p>}
                        </div>
                    </aside>
                    <section className={styles.community} id="space-comments">
                        <SectionHeading icon={MessageCircle} title={communityText('Community')} lead={communityText('Questions, progress updates, and discussion about the challenge.')} />
                        <CommentThread source={commentSource} canModerate={Boolean(space.canManage)} canPin={Boolean(space.canManage)} reportContext={`challenge ${space.title}`} />
                    </section>
                </div>
            ) : null}
            {tab === 'submissions' ? (
                <section>
                    <SectionHeading
                        icon={Trophy}
                        title={communityText('Submissions')}
                        count={space.projects.length}
                        lead={currentPhase === 'submissions' ? communityText('Enter a shared or unlisted project before submissions close.') : communityText('Submissions are locked for this challenge.')}
                        actions={currentPhase === 'submissions' && (space.openSubmissions || space.canManage) ? <SpaceProjectPicker space={liveSpace} onAdded={load} /> : null}
                    />
                    {space.projects.length ? <CardGrid>{space.projects.map(project => <Entry key={project.id} challengeId={id} project={project} challenge={liveSpace} user={user} login={login} load={load} />)}</CardGrid> : <EmptyState icon={Trophy} title={communityText('No submissions yet')}>{communityText('The first entry will appear here.')}</EmptyState>}
                </section>
            ) : null}
            {tab === 'results' ? (
                <section>
                    <SectionHeading icon={Medal} title={communityText('Final results')} lead={communityText('Ranked by the judges using the criteria shown on the overview.')} />
                    {space.projects.length ? <ol className={styles.resultList}>{space.projects.map(project => <li key={project.id}><span className={project.place <= 3 ? styles.resultPlaceWinner : styles.resultPlace}>{project.place ? `#${project.place}` : '-'}</span><div><Link to={`/project/${project.id}`}>{project.title}</Link><span>{communityText('by')}{' '}<UserLink username={project.owner}>{project.owner}</UserLink></span></div><strong>{challengeScore(project.judgeScore)}<small>{communityText('/ 10')}</small></strong></li>)}</ol> : <EmptyState compact icon={Medal} title={communityText('No results')}>{communityText('This challenge did not receive any submissions.')}</EmptyState>}
                </section>
            ) : null}
            {tab === 'judging' ? (
                <section>
                    <SectionHeading icon={Gavel} title={communityText('Judge entries')} lead={communityText('{value1} of {value2} entries scored by you.', {value1: space.projects.filter(project => project.myScore?.edited).length, value2: space.projects.length})} />
                    {space.projects.length ? <CardGrid>{space.projects.map(project => <Entry key={project.id} challengeId={id} project={project} challenge={liveSpace} user={user} login={login} load={load} showScore />)}</CardGrid> : <EmptyState icon={Gavel} title={communityText('No entries to judge')}>{communityText('Submissions will appear here after the deadline.')}</EmptyState>}
                </section>
            ) : null}
        </main>
    );
};

export default Challenge;

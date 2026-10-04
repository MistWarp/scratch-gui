import {getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {CalendarDays, Check, ExternalLink, Gavel, Info, Medal, MessageCircle, ScrollText, Settings, Sparkles, Star, Trophy, UserMinus, UserPlus, Users} from 'lucide-react';
import api, {projectUrl} from '../api';
import Avatar from '../components/Avatar.jsx';
import GroupTag from '../components/GroupTag.jsx';
import UserLink from '../components/UserLink.jsx';
import CommentThread from '../components/CommentThread.jsx';
import useSpaceCommentSource from '../space-comments.js';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectThumbnail from '../components/ProjectThumbnail.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
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

const AUDIENCE_PHASES = {
    ...PHASES,
    judging: {label: 'Voting open', tone: 'building'}
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

export const challengeAudienceJudged = space => Boolean(space) && space.votingMode === 'audience';

export const challengeRating = value => {
    const rating = Number(value);
    return Number.isFinite(rating) && rating > 0 ? Math.min(5, rating) : 0;
};

export const challengeWeightedScore = (criteria, ratings) => {
    if (!challengeRatingsReady(criteria, ratings)) return 0;
    let total = 0;
    let weights = 0;
    criteria.forEach(criterion => {
        const weight = Number(criterion.weight) || 1;
        total += Number(ratings[criterion.id]) * weight;
        weights += weight;
    });
    return weights ? total / weights : 0;
};

const isScored = project => Boolean(project.myScore && project.myScore.edited);

const savedRatings = project => Object.fromEntries(((project.myScore && project.myScore.ratings) || []).map(rating => [rating.criterionId, rating.value]));

export const nextUnscoredEntry = (projects, currentId) => {
    const index = projects.findIndex(project => project.id === currentId);
    const ordered = index < 0 ? projects : [...projects.slice(index + 1), ...projects.slice(0, index)];
    return ordered.find(project => !isScored(project)) || null;
};

const STAR_VALUES = [1, 2, 3, 4, 5];

const StarRating = ({average, count, myVote, interactive, busy, title, onRate}) => {
    const {text: communityText} = useCommunityText();
    const [preview, setPreview] = useState(0);
    const shown = preview || challengeRating(average);
    const label = count ?
        communityText('Rated {value1} out of 5 from {value2} ratings', {value1: challengeRating(average).toFixed(1), value2: count}) :
        communityText('No ratings yet');
    const star = value => (
        <span className={styles.star} aria-hidden="true">
            <Star size={18} />
            <span className={styles.starFill} style={{width: `${Math.round(Math.max(0, Math.min(1, shown - value + 1)) * 100)}%`}}><Star size={18} fill="currentColor" /></span>
            {myVote === value ? <i className={styles.starMine} /> : null}
        </span>
    );
    return (
        <div className={styles.rating} title={title || label}>
            {interactive ? (
                <div className={preview ? styles.starsPreview : styles.stars} role="radiogroup" aria-label={communityText('Your rating')} onMouseLeave={() => setPreview(0)}>
                    {STAR_VALUES.map(value => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={myVote === value}
                            aria-label={communityText('Rate {value1} out of 5', {value1: value})}
                            disabled={busy}
                            onMouseEnter={() => setPreview(value)}
                            onFocus={() => setPreview(value)}
                            onBlur={() => setPreview(0)}
                            onClick={() => onRate(value)}
                        >{star(value)}</button>
                    ))}
                </div>
            ) : (
                <div className={styles.stars} role="img" aria-label={label}>{STAR_VALUES.map(value => <span key={value}>{star(value)}</span>)}</div>
            )}
            <span className={styles.ratingMeta}>
                <strong>{count ? challengeRating(average).toFixed(1) : '–'}</strong>
                <small>{communityText('({value1})', {value1: count || 0})}</small>
            </span>
        </div>
    );
};

const Entry = ({challengeId, project, challenge, user, login, load, onError}) => {
    const {text: communityText} = useCommunityText();
    const audienceJudged = challengeAudienceJudged(challenge);
    const audienceVoting = audienceJudged || Boolean(challenge.communityVoting);
    const showRatings = audienceVoting && challenge.phase !== 'upcoming' && challenge.phase !== 'submissions';
    const showJudgeScore = !audienceJudged && challenge.phase === 'results';
    const ownEntry = Boolean(user && user.username && project.owner && user.username.toLowerCase() === project.owner.toLowerCase());
    const canVote = audienceVoting && challenge.phase === 'judging' && !ownEntry;
    const [voting, setVoting] = useState(false);
    const voteInFlight = useRef(new Set());
    const currentContext = useRef(`${challengeId}\u0000${project.id}`);
    currentContext.current = `${challengeId}\u0000${project.id}`;
    useEffect(() => {
        setVoting(false);
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
        onError('');
        try {
            await api.voteChallengeEntry(challengeId, project.id, value);
            if (currentContext.current === actionContext) await load();
        } catch (requestError) {
            if (currentContext.current === actionContext) {
                onError(requestError.message || 'Could not save your rating.');
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
            {showRatings || showJudgeScore ? (
                <div className={styles.entryFooter}>
                    {showJudgeScore ? <span className={styles.judgeResult} title={communityText('Judge score')}><Gavel size={14} aria-hidden="true" /><strong>{challengeScore(project.judgeScore)}</strong><small>{communityText('/ 10')}</small></span> : null}
                    {showRatings ? (
                        <StarRating
                            average={project.audienceScore}
                            count={project.audienceVoteCount}
                            myVote={Number(project.myVote) || 0}
                            interactive={canVote}
                            busy={voting}
                            title={ownEntry && challenge.phase === 'judging' ? communityText('You cannot rate your own entry.') : ''}
                            onRate={vote}
                        />
                    ) : null}
                </div>
            ) : null}
        </article>
    );
};

const ScoreScale = ({label, value, disabled, onChange}) => (
    <div className={styles.scale} role="radiogroup" aria-label={label}>
        {Array.from({length: 10}, (unused, index) => index + 1).map(step => (
            <button
                key={step}
                type="button"
                role="radio"
                aria-checked={Number(value) === step}
                className={Number(value) === step ? styles.scaleActive : ''}
                disabled={disabled}
                onClick={() => onChange(step)}
            >{step}</button>
        ))}
    </div>
);

const JudgingWorkspace = ({challengeId, projects, criteria, load}) => {
    const {text: communityText} = useCommunityText();
    const firstUnscored = () => (nextUnscoredEntry(projects, '') || projects[0] || {}).id || '';
    const [selectedId, setSelectedId] = useState(firstUnscored);
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({text: '', error: false});
    const saveInFlight = useRef(false);
    const panelRef = useRef(null);
    const currentId = useRef(challengeId);
    currentId.current = challengeId;

    useEffect(() => {
        setSelectedId(firstUnscored());
        setDrafts({});
        setSaving(false);
        setMessage({text: '', error: false});
    }, [challengeId]);

    const selected = projects.find(project => project.id === selectedId) || projects[0];
    if (!selected) return null;
    const scoredCount = projects.filter(isScored).length;
    const draft = drafts[selected.id] || {ratings: savedRatings(selected), feedback: (selected.myScore && selected.myScore.feedback) || ''};
    const ready = challengeRatingsReady(criteria, draft.ratings);
    const weighted = challengeWeightedScore(criteria, draft.ratings);
    const remainingAfter = nextUnscoredEntry(projects, selected.id);
    const updateDraft = patch => setDrafts(current => ({...current, [selected.id]: {...draft, ...patch}}));

    const select = projectId => {
        setSelectedId(projectId);
        setMessage({text: '', error: false});
        if (panelRef.current && window.matchMedia && window.matchMedia('(max-width: 860px)').matches) {
            panelRef.current.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    };

    const save = async advance => {
        if (saveInFlight.current) return;
        if (!ready) {
            setMessage({text: communityText('Give every criterion a score from 1 to 10.'), error: true});
            return;
        }
        const actionId = challengeId;
        const project = selected;
        const releaseSave = () => {
            saveInFlight.current = false;
        };
        saveInFlight.current = true;
        setSaving(true);
        setMessage({text: '', error: false});
        try {
            await api.scoreChallengeEntry(challengeId, project.id, {
                ratings: criteria.map(criterion => ({criterionId: criterion.id, value: Number(draft.ratings[criterion.id])})),
                feedback: draft.feedback.trim()
            });
            if (currentId.current !== actionId) return;
            setDrafts(current => {
                const next = {...current};
                delete next[project.id];
                return next;
            });
            await load();
            if (currentId.current !== actionId) return;
            const next = advance ? nextUnscoredEntry(projects, project.id) : null;
            if (next) select(next.id);
            setMessage({text: next ? communityText('Saved {value1}.', {value1: project.title}) : communityText('Score saved.'), error: false});
        } catch (error) {
            if (currentId.current === actionId) setMessage({text: error.message || 'Could not save this score.', error: true});
        } finally {
            releaseSave();
            if (currentId.current === actionId) setSaving(false);
        }
    };

    return (
        <div className={styles.judging}>
            <div className={styles.judgeProgress}>
                <span>{scoredCount === projects.length ? communityText('Every entry has your score. You can still change them until judging ends.') : communityText('{value1} of {value2} entries scored', {value1: scoredCount, value2: projects.length})}</span>
                <span className={styles.progress}><span className={styles.progressFill} style={{width: `${Math.round((scoredCount / projects.length) * 100)}%`}} /></span>
            </div>
            <div className={styles.judgeLayout}>
                <ol className={styles.judgeQueue} aria-label={communityText('Entries to judge')}>
                    {projects.map(project => {
                        const scored = isScored(project);
                        const state = drafts[project.id] ? 'draft' : scored ? 'scored' : 'todo';
                        return (
                            <li key={project.id}>
                                <button type="button" className={project.id === selected.id ? styles.queueActive : styles.queueItem} aria-current={project.id === selected.id ? 'true' : null} onClick={() => select(project.id)}>
                                    <span className={styles.queueThumb}><ProjectThumbnail project={project} fallbackClassName={styles.queueFallback} lazy /></span>
                                    <span className={styles.queueText}><strong>{project.title}</strong><small>{project.owner}</small></span>
                                    <span className={styles.queueStatus} data-state={state}>
                                        {state === 'draft' ? communityText('Unsaved') : scored ? <><Check size={13} aria-hidden="true" />{challengeScore(challengeWeightedScore(criteria, savedRatings(project)))}</> : communityText('To do')}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
                <form
                    ref={panelRef}
                    className={styles.judgePanel}
                    onSubmit={event => {
                        event.preventDefault();
                        save(true);
                    }}
                >
                    <header className={styles.judgeEntry}>
                        <Link to={projectUrl(selected)} target="_blank" rel="noopener noreferrer" className={styles.judgeThumb} aria-label={communityText('Open {value1}', {value1: selected.title})}>
                            <ProjectThumbnail project={selected} fallbackClassName={styles.queueFallback} />
                        </Link>
                        <div className={styles.judgeEntryText}>
                            <h3>{selected.title}</h3>
                            <span>{communityText('by')}{' '}<UserLink username={selected.owner}>{selected.owner}</UserLink></span>
                            <Button as={Link} to={projectUrl(selected)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />{communityText('Play in new tab')}</Button>
                        </div>
                    </header>
                    <fieldset className={styles.judgeCriteria} disabled={saving}>
                        {criteria.map(criterion => (
                            <div key={criterion.id} className={styles.judgeCriterion}>
                                <div className={styles.judgeCriterionText}>
                                    <strong>{criterion.name}</strong>
                                    {criteria.length > 1 && Number(criterion.weight) > 1 ? <span className={styles.judgeWeight}>{communityText('×{value1} weight', {value1: criterion.weight})}</span> : null}
                                    {criterion.description ? <small>{criterion.description}</small> : null}
                                </div>
                                <ScoreScale
                                    label={criterion.name}
                                    value={draft.ratings[criterion.id]}
                                    disabled={saving}
                                    onChange={value => updateDraft({ratings: {...draft.ratings, [criterion.id]: value}})}
                                />
                            </div>
                        ))}
                        {!criteria.length ? <p>{communityText('No judging criteria are configured.')}</p> : null}
                        <label className={styles.feedbackField}>
                            <span>{communityText('Private feedback for the host')}</span>
                            <textarea maxLength={2000} value={draft.feedback} onChange={event => updateDraft({feedback: event.target.value})} placeholder={communityText('Optional notes on this entry')} />
                        </label>
                    </fieldset>
                    <footer className={styles.judgeActions}>
                        <span className={styles.judgeTotal}><strong>{ready ? weighted.toFixed(1) : '–'}</strong><small>{communityText('/ 10 overall')}</small></span>
                        {message.text ? <span className={message.error ? styles.judgeMessageError : styles.judgeMessage} role={message.error ? 'alert' : 'status'}>{message.text}</span> : null}
                        <div className={styles.judgeButtons}>
                            {remainingAfter ? <Button disabled={!ready || saving} onClick={() => save(false)}>{communityText('Save')}</Button> : null}
                            <Button variant="primary" type="submit" busy={saving} busyLabel={communityText('Saving…')} disabled={!ready}>{remainingAfter ? communityText('Save and next') : communityText('Save score')}</Button>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const Timeline = ({space, phase, now, audienceJudged}) => {
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
            icon: audienceJudged ? Star : Gavel,
            label: audienceJudged ? communityText('Voting ends') : communityText('Judging ends'),
            at: space.judgingEndsAt,
            done: finished,
            active: phase === 'judging',
            countdown: phase === 'judging' ? (audienceJudged ? communityText('{value1} of voting left', {value1: remaining(space.judgingEndsAt, now)}) : communityText('{value1} of judging left', {value1: remaining(space.judgingEndsAt, now)})) : ''
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
    const audienceJudged = challengeAudienceJudged(space);
    const phase = (audienceJudged ? AUDIENCE_PHASES : PHASES)[currentPhase] || PHASES.upcoming;
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
        ...(space.isJudge && !audienceJudged && currentPhase === 'judging' ? [{key: 'judging', label: communityText('Judge entries')}] : []),
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
                <Timeline space={space} phase={currentPhase} now={now} audienceJudged={audienceJudged} />
            </PageHeader>
            <UnderlineTabs items={tabs} value={tab} onChange={setTab} className={styles.tabs} ariaLabel="Challenge sections" idPrefix="challenge" />
            {error ? <Notice variant="error" className={styles.pageNotice}>{error}</Notice> : null}
            <div {...tabPanelProps('challenge', tab)}>
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
                                <div><dt>{communityText('Winner picked by')}</dt><dd>{audienceJudged ? communityText('Audience') : communityText('Judges')}</dd></div>
                            </dl>
                            {audienceJudged ? (
                                <div className={styles.sidebarBlock}>
                                    <h2><Star size={16} aria-hidden="true" />{communityText('Audience vote')}</h2>
                                    <p className={styles.sidebarText}>{communityText('Once submissions close, anyone signed in can rate each entry from 1 to 5 stars. The entry with the highest average rating wins.')}</p>
                                </div>
                            ) : null}
                            {!audienceJudged && space.communityVoting ? <p className={styles.sidebarText}>{communityText('Audience ratings are open during judging. They are shown next to each entry but do not decide the winner.')}</p> : null}
                            {!audienceJudged ? (
                                <React.Fragment>
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
                                </React.Fragment>
                            ) : null}
                        </aside>
                        <section className={styles.community} id="space-comments">
                            <SectionHeading icon={MessageCircle} title={communityText('Community')} lead={communityText('Questions, progress updates, and discussion about the challenge.')} />
                            <CommentThread source={commentSource} canModerate={Boolean(space.canManage)} canPin={Boolean(space.canManage)} reportContext={`challenge ${space.title}`} draftKey={`space:${id}`} />
                        </section>
                    </div>
                ) : null}
                {tab === 'submissions' ? (
                    <section>
                        <SectionHeading
                            icon={Trophy}
                            title={communityText('Submissions')}
                            count={space.projects.length}
                            lead={currentPhase === 'submissions' ? communityText('Enter a shared or unlisted project before submissions close.') :
                                currentPhase === 'judging' && (audienceJudged || space.communityVoting) ? communityText('Click the stars to rate an entry. You can change your rating until voting ends.') :
                                    communityText('Submissions are locked for this challenge.')}
                            actions={currentPhase === 'submissions' && (space.openSubmissions || space.canManage) ? <SpaceProjectPicker space={liveSpace} onAdded={load} /> : null}
                        />
                        {space.projects.length ? <CardGrid>{space.projects.map(project => <Entry key={project.id} challengeId={id} project={project} challenge={liveSpace} user={user} login={login} load={load} onError={setError} />)}</CardGrid> : <EmptyState icon={Trophy} title={communityText('No submissions yet')}>{communityText('The first entry will appear here.')}</EmptyState>}
                    </section>
                ) : null}
                {tab === 'results' ? (
                    <section>
                        <SectionHeading icon={Medal} title={communityText('Final results')} lead={audienceJudged ? communityText('Ranked by average audience rating. Ties go to the entry with more ratings.') : communityText('Ranked by the judges using the criteria shown on the overview.')} />
                        {space.projects.length ? <ol className={styles.resultList}>{space.projects.map(project => <li key={project.id}><span className={project.place <= 3 ? styles.resultPlaceWinner : styles.resultPlace}>{project.place ? `#${project.place}` : '-'}</span><div><Link to={`/project/${project.id}`}>{project.title}</Link><span>{communityText('by')}{' '}<UserLink username={project.owner}>{project.owner}</UserLink></span></div>{audienceJudged ? <strong>{challengeScore(project.audienceScore)}<small>{communityText('/ 5 · {value1} ratings', {value1: project.audienceVoteCount || 0})}</small></strong> : <strong>{challengeScore(project.judgeScore)}<small>{communityText('/ 10')}</small></strong>}</li>)}</ol> : <EmptyState compact icon={Medal} title={communityText('No results')}>{communityText('This challenge did not receive any submissions.')}</EmptyState>}
                    </section>
                ) : null}
                {tab === 'judging' ? (
                    <section>
                        <SectionHeading icon={Gavel} title={communityText('Judge entries')} lead={communityText('Play each entry, then score it from 1 to 10 on every criterion. Only the host sees your feedback.')} />
                        {space.projects.length ? <JudgingWorkspace challengeId={id} projects={space.projects} criteria={criteria} load={load} /> : <EmptyState icon={Gavel} title={communityText('No entries to judge')}>{communityText('Submissions will appear here after the deadline.')}</EmptyState>}
                    </section>
                ) : null}
            </div>
        </main>
    );
};

export default Challenge;

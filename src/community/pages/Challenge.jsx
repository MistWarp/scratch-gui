/* eslint-disable max-len */
import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, CalendarDays, Clock3, Gavel, Medal, MessageCircle, Settings, Star, Trophy, UserMinus, UserPlus} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import CommentThread from '../components/CommentThread.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import RichText from '../components/RichText.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import SectionTabs from '../components/SectionTabs.jsx';
import Button from '../components/ui/Button.jsx';
import styles from './Challenge.module.css';

const PHASES = {
    'upcoming': {label: 'Starts soon', detail: 'Submissions have not opened yet.'},
    'submissions': {label: 'Submissions open', detail: 'Build your project and enter before the deadline.'},
    'judging': {label: 'Judging', detail: 'Entries are locked while judges review them.'},
    'awaiting-results': {label: 'Results pending', detail: 'Judging has ended. The host will publish the results.'},
    'results': {label: 'Results published', detail: 'The final standings are ready.'}
};

const dateTime = value => (value ? new Date(value).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'}) : 'Not set');

const remaining = (value, now) => {
    const difference = Math.max(0, value - now);
    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference % 86400000) / 3600000);
    if (days) return `${days}d ${hours}h`;
    const minutes = Math.floor((difference % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

const ScoreForm = ({challengeId, project, criteria, onSaved}) => {
    const prior = project.myScore || {};
    const priorRatings = new Map((prior.ratings || []).map(rating => [rating.criterionId, rating.value]));
    const [ratings, setRatings] = useState(() => Object.fromEntries(criteria.map(criterion => [criterion.id, priorRatings.get(criterion.id) || 5])));
    const [feedback, setFeedback] = useState(prior.feedback || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const save = async event => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await api.scoreChallengeEntry(challengeId, project.id, {
                ratings: criteria.map(criterion => ({criterionId: criterion.id, value: Number(ratings[criterion.id])})),
                feedback
            });
            setMessage('Score saved.');
            onSaved();
        } catch (error) {
            setMessage(error.message || 'Could not save this score.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className={styles.scoreForm} onSubmit={save}>
            <div className={styles.scoreHeading}><Gavel size={16} /><strong>Your score</strong>{prior.edited ? <span>Last saved {dateTime(prior.edited)}</span> : null}</div>
            {criteria.map(criterion => (
                <label key={criterion.id} className={styles.scoreCriterion}>
                    <span><strong>{criterion.name}</strong><small>{criterion.description}</small></span>
                    <input type="number" min="1" max="10" value={ratings[criterion.id]} onChange={event => setRatings(current => ({...current, [criterion.id]: event.target.value}))} />
                    <em>/ 10</em>
                </label>
            ))}
            <label className={styles.feedbackField}><span>Private feedback for the host</span><textarea maxLength={2000} value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Notes on this entry" /></label>
            <div className={styles.scoreActions}><Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save score'}</Button>{message ? <span>{message}</span> : null}</div>
        </form>
    );
};

const Entry = ({challengeId, project, challenge, user, login, load, showScore = false}) => {
    const canVote = !showScore && challenge.phase === 'judging' && challenge.communityVoting;
    const [voting, setVoting] = useState(false);
    const [voteError, setVoteError] = useState('');
    const vote = async value => {
        if (!user) {
            login();
            return;
        }
        if (voting) return;
        setVoting(true);
        setVoteError('');
        try {
            await api.voteChallengeEntry(challengeId, project.id, value);
            await load();
        } catch (requestError) {
            setVoteError(requestError.message || 'Could not save your rating.');
        } finally {
            setVoting(false);
        }
    };
    return (
        <article className={styles.entry}>
            {challenge.phase === 'results' && project.place ? <span className={project.place <= 3 ? styles.placeWinner : styles.place}>#{project.place}</span> : null}
            <ProjectCard project={project} />
            {challenge.phase === 'results' ? (
                <div className={styles.entryResults}>
                    <span><strong>{project.judgeScore ? project.judgeScore.toFixed(1) : 'No score'}</strong> judges</span>
                    {challenge.communityVoting ? <span><strong>{project.audienceScore ? project.audienceScore.toFixed(1) : 'No score'}</strong> audience</span> : null}
                </div>
            ) : null}
            {canVote ? (
                <div className={styles.audienceVote}>
                    <span>Audience rating</span>
                    <div>{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" disabled={voting} className={value <= project.myVote ? styles.starActive : ''} onClick={() => vote(value)} aria-label={`Rate ${value} out of 5`}><Star size={17} fill={value <= project.myVote ? 'currentColor' : 'none'} /></button>)}</div>
                    <small>{project.audienceVoteCount || 0} ratings</small>
                    {voteError ? <small role="alert">{voteError}</small> : null}
                </div>
            ) : null}
            {showScore ? <ScoreForm challengeId={challengeId} project={project} criteria={challenge.criteria || []} onSaved={load} /> : null}
        </article>
    );
};

const Challenge = ({id, space, user, login, load}) => {
    const [tab, setTab] = useState(space.phase === 'results' ? 'results' : 'overview');
    const [error, setError] = useState('');
    const [now, setNow] = useState(Date.now());
    const currentPhase = space.resultsPublishedAt ? 'results' : now < space.startsAt ? 'upcoming' : now <= space.endsAt ? 'submissions' : now <= space.judgingEndsAt ? 'judging' : 'awaiting-results';
    const phase = PHASES[currentPhase] || PHASES.upcoming;
    const deadline = currentPhase === 'upcoming' ? space.startsAt : currentPhase === 'submissions' ? space.endsAt : space.judgingEndsAt;
    const liveSpace = {...space, phase: currentPhase};
    const commentSource = useMemo(() => ({
        list: () => api.spaceComments(id),
        add: (content, parent) => api.addSpaceComment(id, content, parent),
        remove: commentId => api.deleteSpaceComment(id, commentId),
        react: (commentId, type) => api.reactSpaceComment(id, commentId, type)
    }), [id]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const respondToJudgeInvite = async accepted => {
        setError('');
        try {
            await api.respondJudgeInvitation(id, accepted);
            await load();
        } catch (requestError) {
            setError(requestError.message || 'Could not respond to the invitation.');
        }
    };

    const toggleJoined = async () => {
        if (!user) {
            login();
            return;
        }
        setError('');
        try {
            if (space.joined) await api.leaveChallenge(id);
            else await api.joinChallenge(id);
            await load();
        } catch (requestError) {
            setError(requestError.message || 'Could not update your participation.');
        }
    };

    const tabs = [
        {key: 'overview', label: 'Overview'},
        {key: 'submissions', label: `Submissions ${space.projects.length}`},
        ...(space.isJudge && currentPhase === 'judging' ? [{key: 'judging', label: 'Judge entries'}] : []),
        ...(currentPhase === 'results' ? [{key: 'results', label: 'Results'}] : []),
        {key: 'community', label: 'Community'}
    ];

    useEffect(() => {
        if (tabs.some(item => item.key === tab)) return;
        setTab(currentPhase === 'results' ? 'results' : 'overview');
    }, [currentPhase, space.isJudge, tab]);

    return (
        <main className={styles.page}>
            <Link to="/spaces?kind=challenge" className={styles.back}><ArrowLeft size={15} /> All challenges</Link>
            {space.judgeInvited ? <section className={styles.invite}><Gavel size={21} /><div><strong>{space.owner} invited you to judge this challenge.</strong><span>Judges score every submission against the published criteria.</span></div><Button variant="primary" onClick={() => respondToJudgeInvite(true)}>Accept</Button><Button onClick={() => respondToJudgeInvite(false)}>Decline</Button></section> : null}
            <header className={styles.hero}>
                <div className={styles.heroMain}>
                    <span className={styles.phase}>{phase.label}</span>
                    <h1>{space.title}</h1>
                    <p>{space.description || 'The host has not added a description yet.'}</p>
                    <div className={styles.host}><Avatar username={space.owner} size={30} /><span>Hosted by <Link to={`/users/${space.owner}`}>{space.owner}</Link></span></div>
                </div>
                <div className={styles.heroSide}>
                    {deadline && currentPhase !== 'results' && currentPhase !== 'awaiting-results' ? <div className={styles.countdown}><Clock3 size={18} /><span>{currentPhase === 'upcoming' ? 'Starts in' : currentPhase === 'submissions' ? 'Ends in' : 'Judging ends in'}</span><strong>{remaining(deadline, now)}</strong></div> : null}
                    {(currentPhase === 'upcoming' || currentPhase === 'submissions') ? <Button variant={space.joined ? 'secondary' : 'primary'} onClick={toggleJoined}>{space.joined ? <UserMinus size={16} /> : <UserPlus size={16} />}{space.joined ? 'Leave challenge' : 'Join challenge'}</Button> : null}
                    {space.canManage ? <Link className={styles.manage} to={`/spaces/${id}/manage`}><Settings size={16} /> Manage challenge</Link> : null}
                </div>
            </header>
            <section className={styles.timeline}>
                <div className={currentPhase === 'upcoming' ? styles.timelineActive : ''}><CalendarDays size={17} /><span>Submissions open</span><strong>{dateTime(space.startsAt)}</strong></div>
                <div className={currentPhase === 'submissions' ? styles.timelineActive : ''}><Trophy size={17} /><span>Submissions close</span><strong>{dateTime(space.endsAt)}</strong></div>
                <div className={currentPhase === 'judging' || currentPhase === 'awaiting-results' ? styles.timelineActive : ''}><Gavel size={17} /><span>Judging ends</span><strong>{dateTime(space.judgingEndsAt)}</strong></div>
            </section>
            <SectionTabs items={tabs} value={tab} onChange={setTab} className={styles.tabs} activeClassName={styles.tabActive} ariaLabel="Challenge sections" />
            {error ? <p className={styles.error}>{error}</p> : null}
            {tab === 'overview' ? (
                <div className={styles.overview}>
                    <div className={styles.mainColumn}>
                        {space.theme ? <section className={styles.theme}><span>Theme</span><strong>{space.theme}</strong></section> : null}
                        <section className={styles.panel}><h2>About this challenge</h2><div className={styles.longText}><RichText text={space.description} /></div></section>
                        <section className={styles.panel}><h2>Rules</h2><div className={styles.longText}><RichText text={space.rules || 'The host has not added rules yet.'} /></div></section>
                    </div>
                    <aside className={styles.sidebar}>
                        <section className={styles.panel}><h2>Judging criteria</h2><div className={styles.criteria}>{(space.criteria || []).map(criterion => <article key={criterion.id}><div><strong>{criterion.name}</strong><span>Weight {criterion.weight} of 5</span></div><p>{criterion.description}</p></article>)}</div></section>
                        <section className={styles.panel}><h2>Judges</h2><div className={styles.people}>{(space.judges || []).map(name => <Link key={name} to={`/users/${name}`}><Avatar username={name} size={30} /><span>{name}</span></Link>)}{!space.judges?.length ? <p>No judges announced yet.</p> : null}</div></section>
                        <section className={styles.facts}><div><strong>{space.participantCount || 0}</strong><span>joined</span></div><div><strong>{space.projects.length}</strong><span>submissions</span></div><div><strong>{space.judgeCount || 0}</strong><span>judges</span></div><div><strong>{space.communityVoting ? 'On' : 'Off'}</strong><span>audience voting</span></div></section>
                    </aside>
                </div>
            ) : null}
            {tab === 'submissions' ? (
                <section className={styles.submissions}>
                    <header><div><h2>Submissions</h2><p>{currentPhase === 'submissions' ? 'Enter a shared or unlisted project before submissions close.' : 'Submissions are locked for this challenge.'}</p></div>{currentPhase === 'submissions' && (space.openSubmissions || space.canManage) ? <SpaceProjectPicker space={liveSpace} onAdded={load} /> : null}</header>
                    {space.projects.length ? <div className={styles.entryGrid}>{space.projects.map(project => <Entry key={project.id} challengeId={id} project={project} challenge={liveSpace} user={user} login={login} load={load} />)}</div> : <div className={styles.empty}><Trophy size={28} /><strong>No submissions yet</strong><span>The first entry will appear here.</span></div>}
                </section>
            ) : null}
            {tab === 'results' ? (
                <section className={styles.results}>
                    <header><Medal size={24} /><div><h2>Final results</h2><p>Ranked by the judges using the criteria shown on the overview.</p></div></header>
                    <div className={styles.resultList}>{space.projects.map(project => <article key={project.id}><span className={project.place <= 3 ? styles.resultPlaceWinner : styles.resultPlace}>#{project.place}</span><div><Link to={`/project/${project.id}`}>{project.title}</Link><span>by {project.owner}</span></div><strong>{project.judgeScore ? project.judgeScore.toFixed(1) : 'No score'}<small>/ 10</small></strong></article>)}</div>
                </section>
            ) : null}
            {tab === 'judging' ? (
                <section className={styles.submissions}>
                    <header><div><h2>Judge entries</h2><p>{space.projects.filter(project => project.myScore?.edited).length} of {space.projects.length} entries scored by you.</p></div></header>
                    {space.projects.length ? <div className={styles.entryGrid}>{space.projects.map(project => <Entry key={project.id} challengeId={id} project={project} challenge={liveSpace} user={user} login={login} load={load} showScore />)}</div> : <div className={styles.empty}><Gavel size={28} /><strong>No entries to judge</strong><span>Submissions will appear here after the deadline.</span></div>}
                </section>
            ) : null}
            {tab === 'community' ? <section className={styles.comments}><header><MessageCircle size={20} /><div><h2>Community</h2><p>Questions, progress updates, and discussion about the challenge.</p></div></header><CommentThread source={commentSource} canModerate={Boolean(space.canManage)} reportContext={`challenge ${space.title}`} /></section> : null}
        </main>
    );
};

export default Challenge;

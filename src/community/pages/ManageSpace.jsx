/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, CalendarClock, Check, Gavel, Image as ImageIcon, LayoutGrid, Plus, Search, Settings, Trash2, UserPlus, Users, X} from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar.jsx';
import SpaceProjectPicker from '../components/SpaceProjectPicker.jsx';
import Button from '../components/ui/Button.jsx';
import useLatest from '../use-latest.js';
import styles from './Spaces.module.css';

const SECTIONS = [
    {key: 'general', label: 'General', Icon: Settings},
    {key: 'curators', label: 'Curators', Icon: Users},
    {key: 'projects', label: 'Projects', Icon: LayoutGrid},
    {key: 'danger', label: 'Danger zone', Icon: Trash2}
];

const CHALLENGE_SECTIONS = [
    {key: 'general', label: 'Details', Icon: Settings},
    {key: 'schedule', label: 'Schedule', Icon: CalendarClock},
    {key: 'judging', label: 'Judging', Icon: Gavel},
    {key: 'projects', label: 'Submissions', Icon: LayoutGrid},
    {key: 'curators', label: 'Host team', Icon: Users},
    {key: 'danger', label: 'Danger zone', Icon: Trash2}
];

const dateTimeInput = value => (value ? new Date(value - (new Date(value).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');

const prepareThumbnail = file => new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        canvas.getContext('2d').drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error('Could not process this image.'));
        }, 'image/png');
    };
    image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read this image.'));
    };
    image.src = url;
});

const ManageSpace = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [space, setSpace] = useState(null);
    const [form, setForm] = useState(null);
    const [active, setActive] = useState('general');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [inviteQuery, setInviteQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [busyUser, setBusyUser] = useState('');
    const [thumbnailBusy, setThumbnailBusy] = useState(false);
    const beginSearch = useLatest();

    const load = useCallback(() => api.getSpaceManagement(id).then(data => {
        const loaded = {
            ...data.space,
            criteria: data.space.criteria?.length ? data.space.criteria : [{id: 'overall', name: 'Overall', description: 'How strong is the entry as a whole?', weight: 1}],
            judges: data.space.judges || [],
            judgeInvites: data.space.judgeInvites || [],
            judgingEndsAt: data.space.judgingEndsAt || (data.space.endsAt ? data.space.endsAt + 604800000 : 0),
            theme: data.space.theme || '',
            rules: data.space.rules || ''
        };
        setSpace(loaded);
        setForm(loaded);
        return loaded;
    }), [id]);

    useEffect(() => {
        load().catch(e => setError(e.message || 'You cannot manage this space.'));
    }, [load]);

    useEffect(() => {
        const query = inviteQuery.trim();
        const fresh = beginSearch();
        if (query.length < 2 || !space || !space.isOwner) {
            setSuggestions([]);
            setSearching(false);
            return () => {};
        }
        setSearching(true);
        const timer = setTimeout(() => {
            api.searchUsers(query)
                .then(fresh(data => setSuggestions(data.users || [])))
                .catch(fresh(() => setSuggestions([])))
                .finally(fresh(() => setSearching(false)));
        }, 250);
        return () => clearTimeout(timer);
    }, [beginSearch, inviteQuery, space]);

    const updateForm = (field, value) => setForm(current => ({...current, [field]: value}));

    const uploadThumbnail = async event => {
        const input = event.currentTarget;
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        setThumbnailBusy(true);
        setError('');
        setStatus('');
        try {
            const thumbnail = await prepareThumbnail(file);
            await api.setSpaceThumbnail(id, thumbnail);
            await load();
            setStatus('Studio thumbnail updated.');
        } catch (e) {
            setError(e.message || 'Could not upload the thumbnail.');
        } finally {
            setThumbnailBusy(false);
            input.value = '';
        }
    };

    const save = async event => {
        event.preventDefault();
        setError('');
        setStatus('');
        try {
            const patch = {
                title: form.title,
                description: form.description,
                visibility: form.visibility,
                openSubmissions: form.openSubmissions,
                theme: form.theme,
                rules: form.rules
            };
            if (active === 'schedule') Object.assign(patch, {startsAt: form.startsAt, endsAt: form.endsAt, judgingEndsAt: form.judgingEndsAt});
            if (active === 'judging') {
                patch.communityVoting = form.communityVoting;
                if (!space.projects.some(project => project.judgeScoreCount > 0)) patch.criteria = form.criteria;
            }
            await api.updateSpace(id, patch);
            await load();
            setStatus('Changes saved.');
        } catch (e) {
            setError(e.message || 'Could not save changes.');
        }
    };

    const invite = async username => {
        setBusyUser(username);
        setError('');
        try {
            await api.inviteSpaceCurator(id, username);
            setInviteQuery('');
            setSuggestions([]);
            await load();
            setStatus(`Invitation sent to ${username}.`);
        } catch (e) {
            setError(e.message || 'Could not send the invitation.');
        } finally {
            setBusyUser('');
        }
    };

    const removeCurator = async username => {
        setBusyUser(username);
        setError('');
        try {
            await api.removeSpaceCurator(id, username);
            await load();
        } catch (e) {
            setError(e.message || 'Could not remove this curator.');
        } finally {
            setBusyUser('');
        }
    };

    const inviteJudge = async username => {
        setBusyUser(username);
        setError('');
        try {
            await api.inviteChallengeJudge(id, username);
            setInviteQuery('');
            setSuggestions([]);
            await load();
            setStatus(`Judge invitation sent to ${username}.`);
        } catch (e) {
            setError(e.message || 'Could not invite this judge.');
        } finally {
            setBusyUser('');
        }
    };

    const removeJudge = async username => {
        setBusyUser(username);
        setError('');
        try {
            await api.removeChallengeJudge(id, username);
            await load();
        } catch (e) {
            setError(e.message || 'Could not remove this judge.');
        } finally {
            setBusyUser('');
        }
    };

    const updateCriterion = (index, field, value) => setForm(current => ({
        ...current,
        criteria: current.criteria.map((criterion, criterionIndex) => (criterionIndex === index ? {...criterion, [field]: value} : criterion))
    }));

    const addCriterion = () => setForm(current => ({
        ...current,
        criteria: [...current.criteria, {id: `jc${Date.now()}`, name: '', description: '', weight: 1}]
    }));

    const removeCriterion = index => setForm(current => ({
        ...current,
        criteria: current.criteria.filter((criterion, criterionIndex) => criterionIndex !== index)
    }));

    const cancelInvitation = async username => {
        setBusyUser(username);
        setError('');
        try {
            await api.cancelSpaceInvitation(id, username);
            await load();
        } catch (e) {
            setError(e.message || 'Could not cancel this invitation.');
        } finally {
            setBusyUser('');
        }
    };

    const removeProject = async projectId => {
        setError('');
        try {
            await api.removeSpaceProject(id, projectId);
            await load();
        } catch (e) {
            setError(e.message || 'Could not remove this project.');
        }
    };

    const unavailableUsers = useMemo(() => {
        if (!space) return new Set();
        const names = space.kind === 'challenge' && active === 'judging' ? [space.owner, ...(space.judges || []), ...(space.judgeInvites || []).map(pendingInvitation => pendingInvitation.username)] : [space.owner, ...(space.managers || []), ...(space.curatorInvites || []).map(pendingInvitation => pendingInvitation.username)];
        return new Set(names.map(name => name.toLowerCase()));
    }, [active, space]);

    if (!space || !form) {
        return <main className={styles.page}><p className={styles.status}>{error || 'Loading management tools…'}</p></main>;
    }
    const criteriaLocked = space.projects.some(project => project.judgeScoreCount > 0);

    return (
        <main className={`${styles.page} ${styles.managePage}`}>
            <Link to={`/spaces/${id}`} className={styles.back}><ArrowLeft size={15} /> Back to {space.title}</Link>
            <header className={styles.manageHeader}>
                <div><span>{space.kind === 'challenge' ? 'Manage challenge' : 'Manage space'}</span><h1>{space.title}</h1></div>
                <Link to={`/spaces/${id}`}>View public page</Link>
            </header>
            <div className={styles.manageLayout}>
                <nav className={styles.manageNav} aria-label="Space settings">
                    {(space.kind === 'challenge' ? CHALLENGE_SECTIONS : SECTIONS).filter(section => section.key !== 'danger' || space.isOwner).map(({key, label, Icon}) => (
                        <button
                            key={key}
                            className={active === key ? styles.manageNavActive : ''}
                            onClick={() => {
                                setActive(key);
                                setError('');
                                setStatus('');
                            }}
                        ><Icon size={16} /> {label}</button>
                    ))}
                </nav>
                <div className={styles.manageContent}>
                    {error ? <p className={styles.error}>{error}</p> : null}
                    {status ? <p className={styles.success}><Check size={15} /> {status}</p> : null}
                    {active === 'general' ? (
                        <form className={styles.manageCard} onSubmit={save}>
                            <header><h2>{space.kind === 'challenge' ? 'Challenge details' : 'General details'}</h2><p>{space.kind === 'challenge' ? 'Give participants the context they need before they enter.' : 'Change how this space appears and who can submit projects.'}</p></header>
                            {space.kind === 'studio' ? <div className={styles.thumbnailEditor}>{space.thumbnailUrl ? <img src={space.thumbnailUrl} alt="" /> : <span><ImageIcon size={28} /> No thumbnail</span>}<label><strong>{thumbnailBusy ? 'Uploading…' : 'Choose image'}</strong><small>PNG, JPG, or WebP up to 1 MB. A 4:3 image works best.</small><input type="file" accept="image/png,image/jpeg,image/webp" disabled={thumbnailBusy} onChange={uploadThumbnail} /></label></div> : null}
                            <label><span>Name</span><input value={form.title} maxLength={100} required onChange={event => updateForm('title', event.target.value)} /></label>
                            <label><span>Description</span><textarea value={form.description || ''} maxLength={5000} onChange={event => updateForm('description', event.target.value)} /></label>
                            {space.kind === 'challenge' ? <><label><span>Theme</span><input value={form.theme || ''} maxLength={200} placeholder="Optional theme or prompt" onChange={event => updateForm('theme', event.target.value)} /></label><label><span>Rules</span><textarea value={form.rules || ''} maxLength={10000} placeholder="Eligibility, team rules, allowed tools, and anything that could disqualify an entry" onChange={event => updateForm('rules', event.target.value)} /></label></> : null}
                            <div className={styles.formRow}>
                                <label><span>Visibility</span><select value={form.visibility} onChange={event => updateForm('visibility', event.target.value)}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></label>
                                <label className={styles.toggleField}><input type="checkbox" checked={Boolean(form.openSubmissions)} onChange={event => updateForm('openSubmissions', event.target.checked)} /><span><strong>Open submissions</strong><small>Let people add their own shared or unlisted projects.</small></span></label>
                            </div>
                            <div className={styles.manageCardActions}><Button type="submit">Save changes</Button></div>
                        </form>
                    ) : null}
                    {active === 'schedule' && space.kind === 'challenge' ? (
                        <form className={styles.manageCard} onSubmit={save}>
                            <header><h2>Schedule</h2><p>Each deadline changes what participants and judges can do.</p></header>
                            <div className={styles.scheduleFields}>
                                <label><span>Submissions open</span><input type="datetime-local" value={dateTimeInput(form.startsAt)} onChange={event => updateForm('startsAt', event.target.value ? new Date(event.target.value).getTime() : 0)} /><small>People can start entering projects.</small></label>
                                <label><span>Submissions close</span><input type="datetime-local" value={dateTimeInput(form.endsAt)} onChange={event => updateForm('endsAt', event.target.value ? new Date(event.target.value).getTime() : 0)} /><small>Entries lock and judging starts.</small></label>
                                <label><span>Judging ends</span><input type="datetime-local" value={dateTimeInput(form.judgingEndsAt)} onChange={event => updateForm('judgingEndsAt', event.target.value ? new Date(event.target.value).getTime() : 0)} /><small>The host can publish the final results.</small></label>
                            </div>
                            <div className={styles.manageCardActions}><Button type="submit">Save schedule</Button></div>
                        </form>
                    ) : null}
                    {active === 'judging' && space.kind === 'challenge' ? (
                        <section className={styles.judgingStack}>
                            <form className={styles.manageCard} onSubmit={save}>
                                <header><h2>Scoring criteria</h2><p>{criteriaLocked ? 'Scoring has started, so the criteria are locked.' : 'Judges score each entry from 1 to 10. Weights decide how much each criterion counts.'}</p></header>
                                <div className={styles.criteriaEditor}>
                                    {(form.criteria || []).map((criterion, index) => <article key={criterion.id}><label><span>Name</span><input required disabled={criteriaLocked} maxLength={60} value={criterion.name} onChange={event => updateCriterion(index, 'name', event.target.value)} /></label><label><span>Description</span><input disabled={criteriaLocked} maxLength={300} value={criterion.description || ''} onChange={event => updateCriterion(index, 'description', event.target.value)} /></label><label className={styles.weightField}><span>Weight <strong>{criterion.weight}</strong></span><input type="range" disabled={criteriaLocked} min="1" max="5" step="1" value={criterion.weight} onChange={event => updateCriterion(index, 'weight', Number(event.target.value))} aria-label={`${criterion.name || 'Criterion'} weight, ${criterion.weight} of 5`} /></label><button type="button" onClick={() => removeCriterion(index)} disabled={criteriaLocked || form.criteria.length === 1} aria-label={`Remove ${criterion.name || 'criterion'}`}><X size={16} /></button></article>)}
                                </div>
                                {!criteriaLocked && form.criteria.length < 8 ? <button className={styles.addCriterion} type="button" onClick={addCriterion}><Plus size={15} /> Add criterion</button> : null}
                                <label className={styles.toggleField}><input type="checkbox" checked={Boolean(form.communityVoting)} onChange={event => updateForm('communityVoting', event.target.checked)} /><span><strong>Audience ratings</strong><small>Signed-in users can rate entries from 1 to 5 during judging. Audience ratings are shown separately and do not change the winner.</small></span></label>
                                <div className={styles.manageCardActions}><Button type="submit">Save judging setup</Button></div>
                            </form>
                            <section className={styles.manageCard}>
                                <header><h2>Judges</h2><p>Judges accept an invitation before they can score entries.</p></header>
                                <div className={styles.curatorInvite}>
                                    <Search size={16} />
                                    <input value={inviteQuery} onChange={event => setInviteQuery(event.target.value)} placeholder="Search for a judge" />
                                    {searching ? <span>Searching…</span> : null}
                                    {inviteQuery.trim().length >= 2 && !searching ? <div className={styles.userSuggestions}>{suggestions.filter(person => !unavailableUsers.has(person.username.toLowerCase())).map(person => <button key={person.username} type="button" onClick={() => inviteJudge(person.username)} disabled={busyUser === person.username}><Avatar username={person.username} size={32} /><span><strong>{person.username}</strong><small>MistWarp user</small></span><UserPlus size={16} /></button>)}{!suggestions.filter(person => !unavailableUsers.has(person.username.toLowerCase())).length ? <p>No available users found.</p> : null}</div> : null}
                                </div>
                                <div className={styles.peopleList}>{(space.judges || []).map(username => <article key={username}><Avatar username={username} size={38} /><div><strong>{username}</strong><span>Judge</span></div><button type="button" onClick={() => removeJudge(username)} disabled={busyUser === username}><X size={15} /> Remove</button></article>)}{!space.judges?.length ? <p className={styles.pickerEmpty}>No judges have accepted yet.</p> : null}</div>
                                {(space.judgeInvites || []).length ? <><h3 className={styles.subheading}>Pending invitations</h3><div className={styles.peopleList}>{space.judgeInvites.map(invitation => <article key={invitation.username}><Avatar username={invitation.username} size={38} /><div><strong>{invitation.username}</strong><span>Invited</span></div></article>)}</div></> : null}
                            </section>
                            <section className={styles.manageCard}>
                                <header><h2>Results</h2><p>Publishing reveals the ranked judge scores on the public challenge page.</p></header>
                                <div className={styles.publishRow}><span>{space.resultsPublishedAt ? `Published ${new Date(space.resultsPublishedAt).toLocaleString()}` : `${space.projects.filter(project => project.judgeScoreCount > 0).length} of ${space.projects.length} entries scored`}</span>{!space.resultsPublishedAt ? <Button
                                    variant="primary" onClick={async () => {
                                        try {
                                            await api.publishChallengeResults(id); await load(); setStatus('Results published.');
                                        } catch (e) {
                                            setError(e.message || 'Could not publish results.');
                                        }
                                    }}
                                >Publish results</Button> : <span className={styles.published}><Check size={15} /> Results are live</span>}</div>
                            </section>
                        </section>
                    ) : null}
                    {active === 'curators' ? (
                        <section className={styles.manageCard}>
                            <header><h2>Curators</h2><p>Curators can edit this space and organise its projects. Invitations must be accepted before access is granted.</p></header>
                            {space.isOwner ? (
                                <div className={styles.curatorInvite}>
                                    <Search size={16} />
                                    <input value={inviteQuery} onChange={event => setInviteQuery(event.target.value)} placeholder="Search for someone to invite" />
                                    {searching ? <span>Searching…</span> : null}
                                    {inviteQuery.trim().length >= 2 && !searching ? (
                                        <div className={styles.userSuggestions}>
                                            {suggestions.filter(person => !unavailableUsers.has(person.username.toLowerCase())).map(person => (
                                                <button key={person.username} type="button" onClick={() => invite(person.username)} disabled={busyUser === person.username}><Avatar username={person.username} size={32} /><span><strong>{person.username}</strong><small>{person.bio || 'MistWarp user'}</small></span><UserPlus size={16} /></button>
                                            ))}
                                            {!suggestions.filter(person => !unavailableUsers.has(person.username.toLowerCase())).length ? <p>No available users found.</p> : null}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                            <div className={styles.peopleList}>
                                <article><Avatar username={space.owner} size={38} /><div><strong>{space.owner}</strong><span>Owner</span></div></article>
                                {(space.managers || []).map(username => <article key={username}><Avatar username={username} size={38} /><div><strong>{username}</strong><span>Curator</span></div>{space.isOwner ? <button type="button" onClick={() => removeCurator(username)} disabled={busyUser === username}><X size={15} /> Remove</button> : null}</article>)}
                            </div>
                            {space.isOwner && (space.curatorInvites || []).length ? <><h3 className={styles.subheading}>Pending invitations</h3><div className={styles.peopleList}>{space.curatorInvites.map(pendingInvitation => <article key={pendingInvitation.username}><Avatar username={pendingInvitation.username} size={38} /><div><strong>{pendingInvitation.username}</strong><span>Invited</span></div><button type="button" onClick={() => cancelInvitation(pendingInvitation.username)} disabled={busyUser === pendingInvitation.username}><X size={15} /> Cancel</button></article>)}</div></> : null}
                        </section>
                    ) : null}
                    {active === 'projects' ? (
                        <section className={styles.manageCard}>
                            <header className={styles.manageProjectsHeader}><div><h2>{space.kind === 'challenge' ? 'Submissions' : 'Projects'}</h2><p>{space.kind === 'challenge' ? 'Review entries or remove one that breaks the rules.' : 'Add, find, and remove projects from this space.'}</p></div><SpaceProjectPicker space={space} onAdded={load} /></header>
                            <div className={styles.manageProjectList}>
                                {space.projects.map(project => <article key={project.id}><div><strong>{project.title}</strong><span>by {project.owner}</span>{space.kind === 'challenge' && (project.scoreBreakdown || []).length ? <div className={styles.submissionFeedback}>{project.scoreBreakdown.map(score => <span key={score.judge}><strong>{score.judge}</strong>{score.feedback || 'Score submitted'}</span>)}</div> : null}</div><Link to={`/project/${project.id}`}>View</Link><button type="button" onClick={() => removeProject(project.id)}><Trash2 size={15} /> Remove</button></article>)}
                                {!space.projects.length ? <p className={styles.pickerEmpty}>No projects have been added yet.</p> : null}
                            </div>
                        </section>
                    ) : null}
                    {active === 'danger' && space.isOwner ? (
                        <section className={`${styles.manageCard} ${styles.dangerCard}`}>
                            <header><h2>Delete space</h2><p>This permanently removes the space. Projects are not deleted.</p></header>
                            <Button
                                variant="danger"
                                onClick={async () => {
                                    if (!window.confirm(`Delete ${space.title}?`)) return;
                                    await api.deleteSpace(id);
                                    navigate('/spaces');
                                }}
                            ><Trash2 size={16} /> Delete space</Button>
                        </section>
                    ) : null}
                </div>
            </div>
        </main>
    );
};

export default ManageSpace;

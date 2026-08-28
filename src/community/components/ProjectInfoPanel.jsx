/* eslint-disable max-len */
import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, GitPullRequest, Pencil, Plus, Users, X, GitFork} from 'lucide-react';
import api, {projectUrl} from '../api';
import Avatar from './Avatar.jsx';
import RichText from './RichText.jsx';
import SectionTabs from './SectionTabs.jsx';
import ProjectCompatibility, {CONTROL_TYPES} from './ProjectCompatibility.jsx';
import Button from './ui/Button.jsx';
import IconButton from './ui/IconButton.jsx';
import styles from './ProjectInfoPanel.module.css';

const parseTags = text => {
    const seen = [];
    text.split(/[\s,]+/).forEach(raw => {
        const tag = raw.replace(/^#+/, '').trim().toLowerCase();
        if (tag && !seen.includes(tag) && seen.length < 10) {
            seen.push(tag);
        }
    });
    return seen;
};

const creditLink = credit => {
    const url = (credit.url || '').trim();
    if (url.startsWith('https://') || url.startsWith('http://')) return url;
    return null;
};

const INFO_TABS = ['About', 'Details'];

const ProjectInfoPanel = ({project, onSaved, embedded = false}) => {
    const [tab, setTab] = useState('About');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [instructions, setInstructions] = useState(project.instructions || '');
    const [notes, setNotes] = useState(project.notes || '');
    const [credits, setCredits] = useState(project.credits || []);
    const [tagsText, setTagsText] = useState((project.tags || []).join(' '));
    const [compatibility, setCompatibility] = useState(project.compatibility || {mobile: false, keyboard: false, controller: false});
    const saveLocks = useRef(new Set());
    const currentProjectId = useRef(project.id);
    currentProjectId.current = project.id;

    useEffect(() => {
        setEditing(false);
        setSaving(false);
        setSaveError('');
    }, [project.id]);

    const startEdit = () => {
        setInstructions(project.instructions || '');
        setNotes(project.notes || '');
        setCredits(project.credits || []);
        setTagsText((project.tags || []).join(' '));
        setCompatibility(project.compatibility || {mobile: false, keyboard: false, controller: false});
        setSaveError('');
        setEditing(true);
    };

    const cancelEdit = () => {
        setSaveError('');
        setEditing(false);
    };

    const save = async () => {
        const projectId = project.id;
        if (saveLocks.current.has(projectId)) return;
        saveLocks.current.add(projectId);
        setSaving(true);
        setSaveError('');
        try {
            const data = await api.updateProject(project.id, {
                instructions,
                notes,
                credits: credits.filter(c => c.who && c.who.trim()),
                tags: parseTags(tagsText),
                compatibility
            });
            if (currentProjectId.current === projectId) {
                setEditing(false);
                onSaved(data.project);
            }
        } catch (e) {
            if (currentProjectId.current === projectId) {
                setSaveError(e.message || 'Could not save your changes.');
            }
        } finally {
            saveLocks.current.delete(projectId);
            if (currentProjectId.current === projectId) setSaving(false);
        }
    };

    const updateCredit = (i, field, value) => {
        setCredits(list => list.map((c, idx) => (idx === i ? {...c, [field]: value} : c)));
    };
    const addCredit = () => setCredits(list => [...list, {who: '', role: '', url: ''}]);
    const removeCredit = i => setCredits(list => list.filter((c, idx) => idx !== i));

    return (
        <aside className={embedded ? `${styles.sidePanel} ${styles.sidePanelEmbedded}` : styles.sidePanel}>
            <SectionTabs
                items={INFO_TABS.map(name => ({key: name, label: name}))}
                value={tab}
                onChange={setTab}
                className={styles.panelTabs}
                itemClassName={styles.panelTab}
                activeClassName={styles.panelTabActive}
                ariaLabel="Project information"
            />
            <div className={styles.panelBody} role="tabpanel">
                {saveError ? <p className={styles.panelError}>{saveError}</p> : null}
                {tab === 'About' && (
                    <div className={styles.aboutSections}>
                        <section>
                            <h3>Instructions</h3>
                            {editing ? (
                                <textarea
                                    className={styles.panelInput}
                                    value={instructions}
                                    disabled={saving}
                                    maxLength={5000}
                                    placeholder="How do you play or use this project?"
                                    onChange={e => setInstructions(e.target.value)}
                                />
                            ) : project.instructions ? (
                                <p className={styles.panelText}><RichText text={project.instructions} /></p>
                            ) : <p className={styles.panelEmpty}>No instructions provided.</p>}
                        </section>
                        {(editing || project.notes) ? (
                            <section>
                                <h3>Creator notes</h3>
                                {editing ? (
                                    <textarea
                                        className={styles.panelInput}
                                        value={notes}
                                        disabled={saving}
                                        maxLength={5000}
                                        placeholder="Development notes, known issues, or anything else worth sharing"
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                ) : <p className={styles.panelText}><RichText text={project.notes} /></p>}
                            </section>
                        ) : null}
                    </div>
                )}

                {tab === 'Details' && (
                    <div className={styles.detailSections}>
                        <section>
                            <h3>Team</h3>
                            <div className={styles.teamPanel}>
                                <div className={styles.teamSummary}>
                                    <Users size={17} />
                                    <strong>{project.collaboration?.teamSize || 1}</strong>
                                    <span>{(project.collaboration?.teamSize || 1) === 1 ? 'person' : 'people'}</span>
                                </div>
                                <ul className={styles.teamList}>
                                    <li>
                                        <Link to={`/users/${project.owner}`}><Avatar username={project.owner} size={30} /><span><strong>{project.owner}</strong><small>Owner</small></span></Link>
                                    </li>
                                    {(project.collaboration?.contributors || []).map(username => (
                                        <li key={username}>
                                            <Link to={`/users/${username}`}><Avatar username={username} size={30} /><span><strong>{username}</strong><small>Contributor</small></span></Link>
                                        </li>
                                    ))}
                                </ul>
                                {(project.collaboration?.acceptedChanges || 0) > 0 ? (
                                    <div className={styles.acceptedChanges}>
                                        <GitPullRequest size={16} />
                                        <strong>{project.collaboration.acceptedChanges}</strong>
                                        <span>accepted {project.collaboration.acceptedChanges === 1 ? 'contribution' : 'contributions'}</span>
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {(editing || (project.credits && project.credits.length)) ? <section>
                            <h3>Credits</h3>
                            {editing ? (
                                <div className={styles.creditEditor}>
                                    {credits.map((c, i) => (
                                        <div
                                            key={i}
                                            className={styles.creditEditRow}
                                        >
                                            <div className={styles.creditFields}>
                                                <input
                                                    className={styles.creditWho}
                                                    value={c.who}
                                                    disabled={saving}
                                                    maxLength={60}
                                                    placeholder="name or MistWarp username"
                                                    aria-label="Name or MistWarp username"
                                                    onChange={e => updateCredit(i, 'who', e.target.value)}
                                                />
                                                <input
                                                    className={styles.creditRole}
                                                    value={c.role}
                                                    disabled={saving}
                                                    maxLength={120}
                                                    placeholder="what they did"
                                                    aria-label="Contribution"
                                                    onChange={e => updateCredit(i, 'role', e.target.value)}
                                                />
                                                <input
                                                    className={styles.creditUrl}
                                                    type="url"
                                                    value={c.url || ''}
                                                    disabled={saving}
                                                    maxLength={500}
                                                    placeholder="external profile URL (optional)"
                                                    aria-label="External profile URL"
                                                    onChange={e => updateCredit(i, 'url', e.target.value)}
                                                />
                                            </div>
                                            <IconButton
                                                className={styles.creditRemove}
                                                disabled={saving}
                                                onClick={() => removeCredit(i)}
                                                label={`Remove credit for ${c.who || 'unnamed contributor'}`}
                                            >
                                                <X size={14} />
                                            </IconButton>
                                        </div>
                                    ))}
                                    <Button
                                        variant="secondary"
                                        className={styles.creditAdd}
                                        disabled={saving}
                                        onClick={addCredit}
                                    >
                                        <Plus size={14} />
                                        Add credit
                                    </Button>
                                </div>
                            ) : <ul className={styles.creditList}>
                                {project.credits.map((c, i) => {
                                    const externalUrl = creditLink(c);
                                    return (
                                        <li key={i}>
                                            {externalUrl ? (
                                                <a
                                                    href={externalUrl}
                                                    className={styles.creditName}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >{c.who}</a>
                                            ) : (
                                                <Link
                                                    to={`/users/${c.who}`}
                                                    className={styles.creditName}
                                                >{c.who}</Link>
                                            )}
                                            {c.role ? (
                                                <span className={styles.creditRoleText}>
                                                    {' '}
                                                    <RichText text={c.role} />
                                                </span>
                                            ) : null}
                                        </li>
                                    );
                                })}
                            </ul>}
                        </section> : null}

                        {(editing || (project.tags && project.tags.length)) ? <section>
                            <h3>Tags</h3>
                            {editing ? (
                                <div>
                                    <input
                                        className={styles.tagInput}
                                        value={tagsText}
                                        disabled={saving}
                                        placeholder="platformer game pixel-art"
                                        onChange={e => setTagsText(e.target.value)}
                                    />
                                    <p className={styles.fieldHint}>Separate tags with spaces. Up to 10.</p>
                                </div>
                            ) : <div className={styles.tagRow}>
                                {project.tags.map(tag => (
                                    <Link
                                        key={tag}
                                        to={`/explore?q=${encodeURIComponent(`#${tag}`)}`}
                                        className={styles.tag}
                                    >{`#${tag}`}</Link>
                                ))}
                            </div>}
                        </section> : null}

                        <section>
                            <h3>Controls</h3>
                            {editing ? (
                                <div className={styles.controlEditor}>
                                    {CONTROL_TYPES.map(({key, label, detail, Icon}) => (
                                        <label key={key} className={compatibility[key] ? styles.controlOptionActive : styles.controlOption}>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(compatibility[key])}
                                                disabled={saving}
                                                onChange={event => {
                                                    const {checked} = event.target;
                                                    setCompatibility(current => ({...current, [key]: checked}));
                                                }}
                                            />
                                            <Icon size={19} />
                                            <span><strong>{label}</strong><small>{detail}</small></span>
                                        </label>
                                    ))}
                                </div>
                            ) : Object.entries(project.compatibility || {}).some(([, supported]) => supported) ? (
                                <ProjectCompatibility compatibility={project.compatibility} />
                            ) : <p className={styles.panelEmpty}>No controls listed.</p>}
                        </section>
                    </div>
                )}

                {!editing && project.remixParent ? (
                    <Link
                        to={projectUrl(project.remixParent)}
                        className={styles.remixOf}
                    >
                        <GitFork size={13} />
                        Based on another project
                    </Link>
                ) : null}
                {project.isOwner ? (
                    <div className={styles.panelBodyFooter}>
                        {editing ? (
                            <div className={styles.panelBodyActions}>
                                <Button
                                    variant="secondary"
                                    className={styles.panelContentAction}
                                    onClick={cancelEdit}
                                    disabled={saving}
                                >
                                    <X size={14} />
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className={styles.panelSave}
                                    onClick={save}
                                    busy={saving}
                                    busyLabel="Saving…"
                                >
                                    <Check size={14} />
                                    Save
                                </Button>
                            </div>
                        ) : (
                            <Button variant="secondary" className={styles.panelContentAction} onClick={startEdit}>
                                <Pencil size={14} />
                                Edit details
                            </Button>
                        )}
                    </div>
                ) : null}
            </div>
        </aside>
    );
};

export default ProjectInfoPanel;

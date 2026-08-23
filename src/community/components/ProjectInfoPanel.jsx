/* eslint-disable max-len */
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, Pencil, Plus, X, GitFork} from 'lucide-react';
import api, {projectUrl} from '../api';
import RichText from './RichText.jsx';
import ProjectCompatibility, {CONTROL_TYPES} from './ProjectCompatibility.jsx';
import styles from './ProjectInfoPanel.module.css';

const INFO_TABS = ['About', 'Credits', 'Tags', 'Controls'];

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
        setSaving(true);
        setSaveError('');
        try {
            await api.updateProject(project.id, {
                instructions,
                notes,
                credits: credits.filter(c => c.who && c.who.trim()),
                tags: parseTags(tagsText),
                compatibility
            });
            setEditing(false);
            onSaved();
        } catch (e) {
            setSaveError(e.message || 'Could not save your changes.');
        } finally {
            setSaving(false);
        }
    };

    const updateCredit = (i, field, value) => {
        setCredits(list => list.map((c, idx) => (idx === i ? {...c, [field]: value} : c)));
    };
    const addCredit = () => setCredits(list => [...list, {who: '', role: '', url: ''}]);
    const removeCredit = i => setCredits(list => list.filter((c, idx) => idx !== i));

    return (
        <aside className={embedded ? `${styles.sidePanel} ${styles.sidePanelEmbedded}` : styles.sidePanel}>
            <div className={styles.panelTabs}>
                {INFO_TABS.map(name => (
                    <button
                        key={name}
                        className={name === tab ? styles.panelTabActive : styles.panelTab}
                        onClick={() => setTab(name)}
                    >{name}</button>
                ))}
            </div>
            <div className={styles.panelBody}>
                {saveError ? <p className={styles.panelError}>{saveError}</p> : null}
                {tab === 'About' && (
                    <div className={styles.aboutSections}>
                        <section>
                            <h3>Instructions</h3>
                            {editing ? (
                                <textarea
                                    className={styles.panelInput}
                                    value={instructions}
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
                                        maxLength={5000}
                                        placeholder="Development notes, known issues, or anything else worth sharing"
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                ) : <p className={styles.panelText}><RichText text={project.notes} /></p>}
                            </section>
                        ) : null}
                    </div>
                )}

                {tab === 'Credits' && (
                    editing ? (
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
                                            maxLength={60}
                                            placeholder="name or MistWarp username"
                                            aria-label="Name or MistWarp username"
                                            onChange={e => updateCredit(i, 'who', e.target.value)}
                                        />
                                        <input
                                            className={styles.creditRole}
                                            value={c.role}
                                            maxLength={120}
                                            placeholder="what they did"
                                            aria-label="Contribution"
                                            onChange={e => updateCredit(i, 'role', e.target.value)}
                                        />
                                        <input
                                            className={styles.creditUrl}
                                            type="url"
                                            value={c.url || ''}
                                            maxLength={500}
                                            placeholder="external profile URL (optional)"
                                            aria-label="External profile URL"
                                            onChange={e => updateCredit(i, 'url', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className={styles.creditRemove}
                                        onClick={() => removeCredit(i)}
                                        title="Remove"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className={styles.creditAdd}
                                onClick={addCredit}
                            >
                                <Plus size={14} />
                                Add credit
                            </button>
                        </div>
                    ) : (project.credits && project.credits.length) ? (
                        <ul className={styles.creditList}>
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
                        </ul>
                    ) : <p className={styles.panelEmpty}>No credits listed.</p>
                )}

                {tab === 'Tags' && (
                    editing ? (
                        <div>
                            <input
                                className={styles.panelInput}
                                value={tagsText}
                                placeholder="platformer game pixel-art"
                                onChange={e => setTagsText(e.target.value)}
                            />
                            <p className={styles.panelEmpty}>Separate tags with spaces. Up to 10.</p>
                        </div>
                    ) : (project.tags && project.tags.length) ? (
                        <div className={styles.tagRow}>
                            {project.tags.map(tag => (
                                <Link
                                    key={tag}
                                    to={`/explore?q=${encodeURIComponent(`#${tag}`)}`}
                                    className={styles.tag}
                                >{`#${tag}`}</Link>
                            ))}
                        </div>
                    ) : <p className={styles.panelEmpty}>No tags yet.</p>
                )}

                {tab === 'Controls' && (
                    editing ? (
                        <div className={styles.controlEditor}>
                            <p>Choose the controls you have tested with this project.</p>
                            {CONTROL_TYPES.map(({key, label, detail, Icon}) => (
                                <label key={key} className={compatibility[key] ? styles.controlOptionActive : styles.controlOption}>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(compatibility[key])}
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
                    ) : <p className={styles.panelEmpty}>The creator has not listed the controls for this project.</p>
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
                                <button className={styles.panelContentAction} onClick={cancelEdit} disabled={saving}>
                                    <X size={14} />
                                    Cancel
                                </button>
                                <button className={styles.panelSave} onClick={save} disabled={saving}>
                                    <Check size={14} />
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <button className={styles.panelContentAction} onClick={startEdit}>
                                <Pencil size={14} />
                                Edit details
                            </button>
                        )}
                    </div>
                ) : null}
            </div>
        </aside>
    );
};

export default ProjectInfoPanel;

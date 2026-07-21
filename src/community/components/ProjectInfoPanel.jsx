import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, Pencil, Plus, X, GitFork} from 'lucide-react';
import api, {projectUrl} from '../api';
import RichText from './RichText.jsx';
import styles from './ProjectInfoPanel.module.css';

const INFO_TABS = ['Instructions', 'Notes', 'Credits', 'Tags'];

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

const ProjectInfoPanel = ({project, onSaved, embedded = false}) => {
    const [tab, setTab] = useState('Instructions');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [instructions, setInstructions] = useState(project.instructions || '');
    const [notes, setNotes] = useState(project.notes || '');
    const [credits, setCredits] = useState(project.credits || []);
    const [tagsText, setTagsText] = useState((project.tags || []).join(' '));

    const startEdit = () => {
        setInstructions(project.instructions || '');
        setNotes(project.notes || '');
        setCredits(project.credits || []);
        setTagsText((project.tags || []).join(' '));
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
                tags: parseTags(tagsText)
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
    const addCredit = () => setCredits(list => [...list, {who: '', role: ''}]);
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
                {project.isOwner ? (
                    editing ? (
                        <>
                            <button
                                className={styles.panelEdit}
                                onClick={save}
                                disabled={saving}
                                title="Save"
                            >
                                <Check size={15} />
                            </button>
                            <button
                                className={styles.panelEdit}
                                onClick={cancelEdit}
                                disabled={saving}
                                title="Cancel"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <button
                            className={styles.panelEdit}
                            onClick={startEdit}
                            title="Edit"
                        >
                            <Pencil size={14} />
                        </button>
                    )
                ) : null}
            </div>
            <div className={styles.panelBody}>
                {saveError ? <p className={styles.panelError}>{saveError}</p> : null}
                {tab === 'Instructions' && (
                    editing ? (
                        <textarea
                            className={styles.panelInput}
                            value={instructions}
                            maxLength={5000}
                            placeholder="How do you play or use this project?"
                            onChange={e => setInstructions(e.target.value)}
                        />
                    ) : project.instructions ? (
                        <p className={styles.panelText}><RichText text={project.instructions} /></p>
                    ) : <p className={styles.panelEmpty}>No instructions provided.</p>
                )}

                {tab === 'Notes' && (
                    editing ? (
                        <textarea
                            className={styles.panelInput}
                            value={notes}
                            maxLength={5000}
                            placeholder="Anything else you want to share"
                            onChange={e => setNotes(e.target.value)}
                        />
                    ) : project.notes ? (
                        <p className={styles.panelText}><RichText text={project.notes} /></p>
                    ) : <p className={styles.panelEmpty}>No notes yet.</p>
                )}

                {tab === 'Credits' && (
                    editing ? (
                        <div className={styles.creditEditor}>
                            {credits.map((c, i) => (
                                <div
                                    key={i}
                                    className={styles.creditEditRow}
                                >
                                    <input
                                        className={styles.creditWho}
                                        value={c.who}
                                        placeholder="username"
                                        onChange={e => updateCredit(i, 'who', e.target.value)}
                                    />
                                    <input
                                        className={styles.creditRole}
                                        value={c.role}
                                        placeholder="what they did"
                                        onChange={e => updateCredit(i, 'role', e.target.value)}
                                    />
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
                            {project.credits.map((c, i) => (
                                <li key={i}>
                                    <Link
                                        to={`/users/${c.who}`}
                                        className={styles.creditName}
                                    >{c.who}</Link>
                                    {c.role ? (
                                        <span className={styles.creditRoleText}>
                                            {' '}
                                            <RichText text={c.role} />
                                        </span>
                                    ) : null}
                                </li>
                            ))}
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

                {!editing && project.remixParent ? (
                    <Link
                        to={projectUrl(project.remixParent)}
                        className={styles.remixOf}
                    >
                        <GitFork size={13} />
                        Based on another project
                    </Link>
                ) : null}
            </div>
        </aside>
    );
};

export default ProjectInfoPanel;

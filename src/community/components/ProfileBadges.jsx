import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Eye, EyeOff, GripVertical, Lock, Pencil} from 'lucide-react';
import rotur from '../rotur';
import safeIconSvg from '../safe-icon.js';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import styles from './ProfileBadges.module.css';

const badgeShape = PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    description: PropTypes.string,
    issuer: PropTypes.string,
    evolving: PropTypes.bool,
    level: PropTypes.number,
    progress: PropTypes.number,
    next_threshold: PropTypes.number
});

export const badgePercent = badge => {
    if (!badge.evolving || !Number.isFinite(badge.progress) || !Number.isFinite(badge.next_threshold) ||
        badge.next_threshold <= 0) return 0;
    return Math.min(100, Math.max(0, (badge.progress / badge.next_threshold) * 100));
};

const TOOLTIP_WIDTH = 250;
const TOOLTIP_EDGE_GAP = 12;

export const badgeTooltipPosition = (badgeRect, viewportWidth) => {
    const anchorCenter = badgeRect.left + (badgeRect.width / 2);
    const halfWidth = TOOLTIP_WIDTH / 2;
    const center = Math.min(
        viewportWidth - TOOLTIP_EDGE_GAP - halfWidth,
        Math.max(TOOLTIP_EDGE_GAP + halfWidth, anchorCenter)
    );
    return {
        bottom: window.innerHeight - badgeRect.top + 8,
        left: center,
        arrowOffset: anchorCenter - center
    };
};

const BadgeDetail = ({badge, position}) => {
    const percent = badgePercent(badge);
    const hasProgress = badge.evolving && Number.isFinite(badge.progress);
    return (
        <span
            id="profile-badge-tooltip"
            className={styles.tooltip}
            role="tooltip"
            style={{
                'bottom': position.bottom,
                'left': position.left,
                '--badge-tooltip-arrow-offset': `${position.arrowOffset}px`
            }}
        >
            <span className={styles.tooltipHead}>
                <strong>{badge.name}</strong>
                {badge.evolving ? <span>Level {badge.level || 1}</span> : null}
            </span>
            {badge.issuer ? <span className={styles.issuer}>{badge.issuer}</span> : null}
            {badge.description ? <span className={styles.description}>{badge.description}</span> : null}
            {hasProgress ? (
                <span className={styles.progress}>
                    <span className={styles.progressLabel}>
                        <span>Progress</span>
                        <strong>{badge.progress}{badge.next_threshold ? ` / ${badge.next_threshold}` : ''}</strong>
                    </span>
                    {badge.next_threshold ? (
                        <span className={styles.progressTrack}>
                            <span style={{width: `${percent}%`}} />
                        </span>
                    ) : null}
                </span>
            ) : null}
        </span>
    );
};

BadgeDetail.propTypes = {
    badge: badgeShape.isRequired,
    position: PropTypes.shape({
        arrowOffset: PropTypes.number.isRequired,
        bottom: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired
    }).isRequired
};

const visibleBadges = badges => badges.filter(badge => !badge.hidden);
const movableIds = badges => badges.filter(badge => !badge.pinned && badge.id).map(badge => badge.id);

const BadgeEditor = ({onClose, onVisibleChange}) => {
    const [badges, setBadges] = useState([]);
    const [preferences, setPreferences] = useState({hidden_badges: [], badge_order: []});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [draggedId, setDraggedId] = useState('');
    const active = useRef(true);
    const loadSequence = useRef(0);
    const saveInFlight = useRef(false);
    const releaseSave = () => {
        saveInFlight.current = false;
    };

    const load = () => {
        const sequence = loadSequence.current + 1;
        loadSequence.current = sequence;
        setLoading(true);
        setError('');
        rotur.badgePreferences().then(result => {
            if (!active.current || loadSequence.current !== sequence) return;
            setBadges(Array.isArray(result.badges) ? result.badges : []);
            setPreferences(result.preferences || {hidden_badges: [], badge_order: []});
        }).catch(cause => {
            if (active.current && loadSequence.current === sequence) {
                setError(cause.message || 'Could not load your badges.');
            }
        }).finally(() => {
            if (active.current && loadSequence.current === sequence) setLoading(false);
        });
    };

    useEffect(() => {
        load();
        return () => {
            active.current = false;
            loadSequence.current += 1;
        };
    }, []);

    const commit = async (nextBadges, nextPreferences) => {
        if (saveInFlight.current) return;
        saveInFlight.current = true;
        const previousBadges = badges;
        const previousPreferences = preferences;
        setBadges(nextBadges);
        setPreferences(nextPreferences);
        setSaving(true);
        setError('');
        try {
            const result = await rotur.updateBadgePreferences(nextPreferences);
            if (!active.current) return;
            const saved = Array.isArray(result.badges) ? result.badges : nextBadges;
            setBadges(saved);
            setPreferences(result.preferences || nextPreferences);
            onVisibleChange(Array.isArray(result.visible_badges) ? result.visible_badges : visibleBadges(saved));
        } catch (cause) {
            if (active.current) {
                setBadges(previousBadges);
                setPreferences(previousPreferences);
                setError(cause.message || 'Could not save your badges.');
            }
        } finally {
            releaseSave();
            if (active.current) setSaving(false);
        }
    };

    const move = (sourceId, targetId) => {
        if (saving || sourceId === targetId) return;
        const pinned = badges.filter(badge => badge.pinned);
        const movable = badges.filter(badge => !badge.pinned);
        const from = movable.findIndex(badge => badge.id === sourceId);
        const to = movable.findIndex(badge => badge.id === targetId);
        if (from < 0 || to < 0) return;
        const [moved] = movable.splice(from, 1);
        movable.splice(to, 0, moved);
        const next = [...pinned, ...movable];
        commit(next, {...preferences, badge_order: movableIds(next)});
    };

    const moveBy = (badge, offset) => {
        const movable = badges.filter(item => !item.pinned);
        const index = movable.findIndex(item => item.id === badge.id);
        const target = movable[index + offset];
        if (target && target.id) move(badge.id, target.id);
    };

    const toggle = badge => {
        if (!badge.id || badge.pinned || saving) return;
        const next = badges.map(item => (item.id === badge.id ? {...item, hidden: !item.hidden} : item));
        commit(next, {
            ...preferences,
            hidden_badges: next.filter(item => item.hidden && item.id).map(item => item.id)
        });
    };

    return (
        <Modal title="Edit badges" onClose={onClose} dismissDisabled={saving}>
            <div className={styles.editorIntro}>
                <p>Drag badges into the order you want. Hidden badges stay here but disappear from your profile.</p>
                {saving ? <span>Saving…</span> : null}
            </div>
            {loading ? <p className={styles.editorState}>Loading badges…</p> : null}
            {error ? (
                <div className={styles.editorError} role="alert">
                    <span>{error}</span>
                    <Button onClick={load}>Try again</Button>
                </div>
            ) : null}
            {!loading && !error && !badges.length ? (
                <p className={styles.editorState}>You do not have any badges yet.</p>
            ) : null}
            {!loading && badges.length ? (
                <div className={styles.editorList}>
                    {badges.map(badge => (
                        <div
                            key={badge.id || badge.name}
                            className={styles.editorRow}
                            data-hidden={badge.hidden || null}
                            draggable={!badge.pinned && !saving}
                            onDragStart={event => {
                                if (!badge.id || badge.pinned) return;
                                setDraggedId(badge.id);
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', badge.id);
                            }}
                            onDragOver={event => {
                                if (draggedId && badge.id && !badge.pinned) event.preventDefault();
                            }}
                            onDrop={event => {
                                event.preventDefault();
                                if (draggedId && badge.id) move(draggedId, badge.id);
                                setDraggedId('');
                            }}
                            onDragEnd={() => setDraggedId('')}
                        >
                            {badge.pinned ? (
                                <span className={styles.lock} title="Always first"><Lock size={16} /></span>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.grip}
                                    aria-label={`Reorder ${badge.name}`}
                                    title="Drag to reorder. Use the arrow keys to move."
                                    disabled={saving}
                                    onKeyDown={event => {
                                        if (event.key === 'ArrowUp') {
                                            event.preventDefault(); moveBy(badge, -1);
                                        }
                                        if (event.key === 'ArrowDown') {
                                            event.preventDefault(); moveBy(badge, 1);
                                        }
                                    }}
                                ><GripVertical size={18} /></button>
                            )}
                            {badge.icon ? (
                                <span
                                    className={styles.editorIcon}
                                    // eslint-disable-next-line react/no-danger
                                    dangerouslySetInnerHTML={{
                                        __html: safeIconSvg(badge.icon, {size: 2, viewSize: 24})
                                    }}
                                />
                            ) : null}
                            <span className={styles.editorDetails}>
                                <strong>{badge.name}</strong>
                                <span>{badge.description}</span>
                            </span>
                            <button
                                type="button"
                                className={styles.visibility}
                                aria-label={badge.pinned ?
                                    `${badge.name} is always visible` :
                                    `${badge.hidden ? 'Show' : 'Hide'} ${badge.name}`
                                }
                                disabled={badge.pinned || saving}
                                onClick={() => toggle(badge)}
                            >{badge.hidden ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                    ))}
                </div>
            ) : null}
        </Modal>
    );
};

BadgeEditor.propTypes = {
    onClose: PropTypes.func.isRequired,
    onVisibleChange: PropTypes.func.isRequired
};

const ProfileBadges = ({badges, editable, onChange}) => {
    const [editing, setEditing] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState(null);

    const showTooltip = (badge, element) => {
        setActiveTooltip({
            badge,
            element,
            position: badgeTooltipPosition(element.getBoundingClientRect(), window.innerWidth)
        });
    };

    useEffect(() => {
        if (!activeTooltip) return () => {};
        const updatePosition = () => {
            setActiveTooltip(current => {
                if (!current) return current;
                return {
                    ...current,
                    position: badgeTooltipPosition(current.element.getBoundingClientRect(), window.innerWidth)
                };
            });
        };
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [activeTooltip && activeTooltip.element]);

    return (
        <React.Fragment>
            <div className={styles.badges}>
                {badges.map((rawBadge, index) => {
                    const badge = typeof rawBadge === 'string' ? {name: rawBadge} : rawBadge;
                    if (!badge.icon) return null;
                    return (
                        <button
                            key={badge.id || `${badge.name}-${index}`}
                            type="button"
                            className={styles.badge}
                            aria-label={`${badge.name}: ${badge.description || 'badge'}`}
                            aria-describedby={activeTooltip && activeTooltip.badge === badge ?
                                'profile-badge-tooltip' : null}
                            onMouseEnter={event => showTooltip(badge, event.currentTarget)}
                            onMouseLeave={event => {
                                if (document.activeElement !== event.currentTarget) setActiveTooltip(null);
                            }}
                            onFocus={event => showTooltip(badge, event.currentTarget)}
                            onBlur={() => setActiveTooltip(null)}
                        >
                            <span
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                    __html: safeIconSvg(badge.icon, {size: 2, viewSize: 20})
                                }}
                            />
                        </button>
                    );
                })}
                {editable ? (
                    <button
                        type="button"
                        className={styles.edit}
                        onClick={() => setEditing(true)}
                        aria-label="Edit badge order and visibility"
                        title="Edit badges"
                    ><Pencil size={14} /></button>
                ) : null}
            </div>
            {activeTooltip && typeof document !== 'undefined' ? createPortal(
                <BadgeDetail badge={activeTooltip.badge} position={activeTooltip.position} />,
                document.body
            ) : null}
            {editing ? <BadgeEditor onClose={() => setEditing(false)} onVisibleChange={onChange} /> : null}
        </React.Fragment>
    );
};

ProfileBadges.propTypes = {
    badges: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, badgeShape])).isRequired,
    editable: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

export default ProfileBadges;

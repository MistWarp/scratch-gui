import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Clock, Image, ListChecks, Plus, Send, UserRound, X} from 'lucide-react';
import rotur from '../rotur.js';
import {attachmentLimit, postLimit, useClawPostLength} from '../claw-limits.js';
import {madeWithProject} from '../claw-links.js';
import {formatDateTime} from '../format';
import {readSessionDraft, writeSessionDraft} from '../session-draft.js';
import {ATTACHMENT_TYPES, uploadPostAttachment} from '../post-upload.js';
import Button from './ui/Button.jsx';
import Notice from './ui/Notice.jsx';
import GifPicker from './GifPicker.jsx';
import PostAttachment from './PostAttachment.jsx';
import PostProjectCard from './PostProjectCard.jsx';
import styles from './PostComposer.module.css';

const localDateTimeValue = time => {
    const date = new Date(time);
    date.setSeconds(0, 0);
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
};

const PostComposer = ({
    user, onPosted, profileOnly = false, allowProfileOnly = true, initialContent = '', madeWith = null, bare = false
}) => {
    const {text: communityText} = useCommunityText();
    const fileInput = useRef(null);
    const submitInFlight = useRef(false);
    const draftScope = madeWith ? `project:${madeWith.ref}` : (profileOnly ? 'profile' : 'feed');
    const draftKey = `post:${user.username || ''}:${draftScope}`;
    const [content, setContent] = useState(() => readSessionDraft(draftKey) || initialContent);
    const [onProfile, setOnProfile] = useState(profileOnly);
    const [project, setProject] = useState(madeWith);
    const [attachments, setAttachments] = useState([]);
    const [poll, setPoll] = useState(null);
    const [scheduledFor, setScheduledFor] = useState('');
    const [gifPickerOpen, setGifPickerOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const draftKeyRef = useRef(draftKey);
    useEffect(() => {
        if (draftKeyRef.current === draftKey) return;
        draftKeyRef.current = draftKey;
        setContent(readSessionDraft(draftKey) || initialContent);
    }, [draftKey]);
    const releaseSubmit = () => {
        submitInFlight.current = false;
    };
    const tier = user.subscription || user.tier || '';
    const maxLength = useClawPostLength(user);
    const maxAttachments = attachmentLimit(tier);
    const pollValid = !poll || poll.filter(value => value.trim()).length >= 2;
    const canPost = (content.trim() || attachments.length || (poll && pollValid)) &&
        content.length <= maxLength && !busy && !uploading && pollValid;
    const attachmentLimitMessage = () => (maxAttachments === 1 ?
        communityText('Your account can add one attachment.') :
        communityText('Your account can add up to {value1} attachments.', {value1: maxAttachments}));

    const addFiles = async filesValue => {
        const files = Array.from(filesValue || []).slice(0, Math.max(0, maxAttachments - attachments.length));
        if (!files.length) {
            if (attachments.length >= maxAttachments) setError(attachmentLimitMessage());
            return;
        }
        setUploading(true);
        setProgress(0);
        setError('');
        try {
            const uploaded = [];
            for (const file of files) uploaded.push(await uploadPostAttachment(file, setProgress));
            setAttachments(current => [...current, ...uploaded].slice(0, maxAttachments));
        } catch (cause) {
            setError(cause.message || communityText('Could not upload this attachment.'));
        } finally {
            setUploading(false);
        }
    };
    const chooseFiles = event => {
        addFiles(event.target.files);
        event.target.value = '';
    };
    const selectGif = url => {
        if (attachments.length >= maxAttachments) {
            setError(attachmentLimitMessage());
            return;
        }
        setAttachments(current => (current.includes(url) ? current : [...current, url]));
        setGifPickerOpen(false);
    };
    const submit = async event => {
        event.preventDefault();
        if (!canPost || submitInFlight.current) return;
        submitInFlight.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        const options = {profileOnly: onProfile};
        if (project) options.madeWith = project;
        if (attachments.length === 1) options.attachment = attachments[0];
        else if (attachments.length > 1) options.attachments = attachments;
        if (poll) options.poll = poll.map(value => value.trim()).filter(Boolean);
        if (scheduledFor) options.scheduledFor = new Date(scheduledFor).getTime();
        let posted = null;
        try {
            const created = await rotur.createPost(content.trim(), options);
            if (!created.scheduled && !scheduledFor) {
                posted = {...created, user: created.user || user.username};
            } else {
                setNotice(communityText('Scheduled for {value1}', {
                    value1: formatDateTime(options.scheduledFor || created.scheduledFor)
                }));
            }
            writeSessionDraft(draftKey, '');
            setContent('');
            setAttachments([]);
            setPoll(null);
            setScheduledFor('');
            setGifPickerOpen(false);
        } catch (cause) {
            setError(cause.message || communityText('Could not publish this post.'));
        } finally {
            releaseSubmit();
            setBusy(false);
        }
        if (posted) onPosted(posted);
    };
    const handlePaste = event => {
        const files = Array.from(event.clipboardData?.items || [])
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile())
            .filter(Boolean);
        if (!files.length) return;
        event.preventDefault();
        addFiles(files);
    };
    const defaultSchedule = () => localDateTimeValue(Date.now() + 3600000);

    return (
        <form
            className={`${styles.composer}${bare ? ` ${styles.bare}` : ''}${dragging ? ` ${styles.dragging}` : ''}`}
            onSubmit={submit}
            onDragOver={event => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
            }}
        >
            <textarea
                value={content}
                maxLength={maxLength}
                disabled={busy}
                placeholder={onProfile ?
                    communityText('Post something to your profile') :
                    communityText('Post something')}
                aria-label={communityText('Post content')}
                onPaste={handlePaste}
                onChange={event => {
                    setContent(event.target.value);
                    writeSessionDraft(draftKey, event.target.value);
                }}
            />
            <input
                hidden
                ref={fileInput}
                type="file"
                multiple={maxAttachments > 1}
                accept={ATTACHMENT_TYPES.join(',')}
                onChange={chooseFiles}
            />
            {project && madeWithProject({made_with: project}) ? (
                <div className={styles.project}>
                    <PostProjectCard project={madeWithProject({made_with: project})} compact />
                    <button
                        type="button"
                        onClick={() => setProject(null)}
                        aria-label={communityText('Remove the project card')}
                        title={communityText('Remove the project card')}
                    ><X size={14} /></button>
                </div>
            ) : null}
            {uploading ? (
                <div className={styles.upload}>
                    <span style={{width: `${progress}%`}} />
                    <small>{communityText('Uploading… {value1}%', {value1: progress})}</small>
                </div>
            ) : null}
            {attachments.length ? (
                <div className={styles.attachments} data-count={attachments.length}>
                    {attachments.map((url, index) => (
                        <div className={styles.attachment} key={url}>
                            <PostAttachment url={url} />
                            <button
                                type="button"
                                onClick={() => setAttachments(current => current.filter((_, item) => item !== index))}
                                aria-label={communityText('Remove attachment')}
                            ><X size={14} /></button>
                        </div>
                    ))}
                </div>
            ) : null}
            {poll ? (
                <div className={styles.pollEditor}>
                    {poll.map((option, index) => (
                        <div key={index}>
                            <input
                                value={option}
                                maxLength={80}
                                placeholder={communityText('Option {value1}', {value1: index + 1})}
                                aria-label={communityText('Option {value1}', {value1: index + 1})}
                                onChange={event => {
                                    const nextValue = event.target.value;
                                    setPoll(current => current.map((value, item) => (
                                        item === index ? nextValue : value
                                    )));
                                }}
                            />
                            {poll.length > 2 ? (
                                <button
                                    type="button"
                                    onClick={() => setPoll(current => current.filter((_, item) => item !== index))}
                                    aria-label={communityText('Remove option {value1}', {value1: index + 1})}
                                ><X size={14} /></button>
                            ) : null}
                        </div>
                    ))}
                    {pollValid ? null : (
                        <small className={styles.pollHint}>{communityText('Add at least 2 options')}</small>
                    )}
                    {poll.length < 6 ? (
                        <button type="button" onClick={() => setPoll(current => [...current, ''])}>
                            <Plus size={14} />
                            {communityText('Add option')}
                        </button>
                    ) : null}
                </div>
            ) : null}
            {scheduledFor ? (
                <label className={styles.schedule}>
                    <Clock size={14} />
                    {communityText('Publish at')}
                    <input
                        type="datetime-local"
                        value={scheduledFor}
                        min={localDateTimeValue(Date.now())}
                        onChange={event => setScheduledFor(event.target.value)}
                    />
                </label>
            ) : null}
            {gifPickerOpen ? <GifPicker onSelect={selectGif} onClose={() => setGifPickerOpen(false)} /> : null}
            <div className={styles.foot}>
                <div className={styles.tools}>
                    <button
                        type="button"
                        disabled={uploading || attachments.length >= maxAttachments}
                        onClick={() => fileInput.current.click()}
                        title={communityText('Attach images or video')}
                    ><Image size={16} /><span>{communityText('Media')}</span></button>
                    <button
                        type="button"
                        className={gifPickerOpen ? styles.active : ''}
                        disabled={uploading || attachments.length >= maxAttachments}
                        onClick={() => setGifPickerOpen(value => !value)}
                        aria-expanded={gifPickerOpen}
                    ><strong>{communityText('GIF')}</strong></button>
                    <button
                        type="button"
                        className={poll ? styles.active : ''}
                        onClick={() => setPoll(current => (current ? null : ['', '']))}
                        title={communityText('Add a poll')}
                    ><ListChecks size={16} /><span>{communityText('Poll')}</span></button>
                    <button
                        type="button"
                        className={scheduledFor ? styles.active : ''}
                        onClick={() => setScheduledFor(current => (current ? '' : defaultSchedule()))}
                        title={communityText('Schedule post')}
                    ><Clock size={16} /><span>{communityText('Schedule')}</span></button>
                    {allowProfileOnly ? (
                        <button
                            type="button"
                            className={onProfile ? styles.active : ''}
                            aria-pressed={onProfile}
                            onClick={() => setOnProfile(value => !value)}
                            title={communityText('Only show this post on your profile')}
                        ><UserRound size={16} /><span>{communityText('Profile only')}</span></button>
                    ) : null}
                </div>
                <span className={content.length >= maxLength ? styles.over : ''}>{content.length}/{maxLength}</span>
                <Button type="submit" variant="primary" busy={busy} disabled={!canPost}>
                    <Send size={15} />
                    {communityText('Post')}
                </Button>
            </div>
            {error ? <Notice variant="error" className={styles.message}>{error}</Notice> : null}
            {notice ? (
                <Notice variant="success" className={styles.message} onDismiss={() => setNotice('')}>
                    {notice}
                </Notice>
            ) : null}
        </form>
    );
};

PostComposer.propTypes = {
    user: PropTypes.object.isRequired,
    onPosted: PropTypes.func.isRequired,
    profileOnly: PropTypes.bool,
    allowProfileOnly: PropTypes.bool,
    initialContent: PropTypes.string,
    madeWith: PropTypes.shape({
        app: PropTypes.string,
        kind: PropTypes.string,
        ref: PropTypes.string,
        url: PropTypes.string,
        title: PropTypes.string,
        image: PropTypes.string
    }),
    bare: PropTypes.bool
};

export {attachmentLimit, localDateTimeValue, postLimit};
export default PostComposer;

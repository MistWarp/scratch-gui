import PropTypes from 'prop-types';
import React, {useRef, useState} from 'react';
import {Clock, Image, ListChecks, Plus, Send, X} from 'lucide-react';
import rotur from '../rotur.js';
import {ATTACHMENT_TYPES, uploadPostAttachment} from '../post-upload.js';
import Button from './ui/Button.jsx';
import GifPicker from './GifPicker.jsx';
import PostAttachment from './PostAttachment.jsx';
import styles from './PostComposer.module.css';

const tierRank = tier => ({lite: 1, plus: 2, drive: 3, pro: 3, max: 4}[String(tier || '').toLowerCase()] || 0);
const postLimit = tier => {
    const rank = tierRank(tier);
    return rank >= 4 ? 1000 : rank >= 3 ? 800 : rank >= 2 ? 600 : rank >= 1 ? 400 : 300;
};
const attachmentLimit = tier => {
    const rank = tierRank(tier);
    return rank >= 3 ? 4 : rank >= 2 ? 2 : 1;
};

const PostComposer = ({user, onPosted, profileOnly = false}) => {
    const fileInput = useRef(null);
    const submitInFlight = useRef(false);
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [poll, setPoll] = useState(null);
    const [scheduledFor, setScheduledFor] = useState('');
    const [gifPickerOpen, setGifPickerOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState('');
    const releaseSubmit = () => {
        submitInFlight.current = false;
    };
    const tier = user.subscription || user.tier || '';
    const maxLength = postLimit(tier);
    const maxAttachments = attachmentLimit(tier);
    const pollValid = !poll || poll.filter(value => value.trim()).length >= 2;
    const canPost = (content.trim() || attachments.length || (poll && pollValid)) &&
        content.length <= maxLength && !busy && !uploading && pollValid;

    const addFiles = async filesValue => {
        const files = Array.from(filesValue || []).slice(0, Math.max(0, maxAttachments - attachments.length));
        if (!files.length) {
            if (attachments.length >= maxAttachments) {
                setError(`Your account can add up to ${maxAttachments} attachment${maxAttachments === 1 ? '' : 's'}.`);
            }
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
            setError(cause.message || 'Could not upload this attachment.');
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
            setError(`Your account can add up to ${maxAttachments} attachment${maxAttachments === 1 ? '' : 's'}.`);
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
        const options = {profileOnly};
        if (attachments.length === 1) options.attachment = attachments[0];
        else if (attachments.length > 1) options.attachments = attachments;
        if (poll) options.poll = poll.map(value => value.trim()).filter(Boolean);
        if (scheduledFor) options.scheduledFor = new Date(scheduledFor).getTime();
        try {
            const created = await rotur.createPost(content.trim(), options);
            if (!created.scheduled && !scheduledFor) onPosted({...created, user: created.user || user.username});
            setContent('');
            setAttachments([]);
            setPoll(null);
            setScheduledFor('');
            setGifPickerOpen(false);
        } catch (cause) {
            setError(cause.message || 'Could not publish this post.');
        } finally {
            releaseSubmit();
            setBusy(false);
        }
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
    const defaultSchedule = () => {
        const date = new Date(Date.now() + 3600000);
        date.setSeconds(0, 0);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    return (
        <form
            className={`${styles.composer}${dragging ? ` ${styles.dragging}` : ''}`}
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
                placeholder={profileOnly ? 'Post something to your profile' : 'Post something'}
                aria-label="Post content"
                onPaste={handlePaste}
                onChange={event => setContent(event.target.value)}
            />
            <input
                hidden
                ref={fileInput}
                type="file"
                multiple={maxAttachments > 1}
                accept={ATTACHMENT_TYPES.join(',')}
                onChange={chooseFiles}
            />
            {uploading ? (
                <div className={styles.upload}>
                    <span style={{width: `${progress}%`}} />
                    <small>Uploading… {progress}%</small>
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
                                aria-label="Remove attachment"
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
                                placeholder={`Option ${index + 1}`}
                                onChange={event => setPoll(current => current.map((value, item) => (
                                    item === index ? event.target.value : value
                                )))}
                            />
                            {poll.length > 2 ? (
                                <button
                                    type="button"
                                    onClick={() => setPoll(current => current.filter((_, item) => item !== index))}
                                    aria-label={`Remove option ${index + 1}`}
                                ><X size={14} /></button>
                            ) : null}
                        </div>
                    ))}
                    {poll.length < 6 ? (
                        <button type="button" onClick={() => setPoll(current => [...current, ''])}>
                            <Plus size={14} /> Add option
                        </button>
                    ) : null}
                </div>
            ) : null}
            {scheduledFor ? (
                <label className={styles.schedule}><Clock size={14} /> Publish at
                    <input
                        type="datetime-local"
                        value={scheduledFor}
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
                        title="Attach images or video"
                    ><Image size={16} /><span>Media</span></button>
                    <button
                        type="button"
                        className={gifPickerOpen ? styles.active : ''}
                        disabled={uploading || attachments.length >= maxAttachments}
                        onClick={() => setGifPickerOpen(value => !value)}
                        aria-expanded={gifPickerOpen}
                    ><strong>GIF</strong></button>
                    <button
                        type="button"
                        className={poll ? styles.active : ''}
                        onClick={() => setPoll(current => (current ? null : ['', '']))}
                        title="Add a poll"
                    ><ListChecks size={16} /><span>Poll</span></button>
                    <button
                        type="button"
                        className={scheduledFor ? styles.active : ''}
                        onClick={() => setScheduledFor(current => (current ? '' : defaultSchedule()))}
                        title="Schedule post"
                    ><Clock size={16} /><span>Schedule</span></button>
                </div>
                <span className={content.length >= maxLength ? styles.over : ''}>{content.length}/{maxLength}</span>
                <Button type="submit" variant="primary" busy={busy} disabled={!canPost}>
                    <Send size={15} /> Post
                </Button>
            </div>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </form>
    );
};

PostComposer.propTypes = {
    user: PropTypes.object.isRequired,
    onPosted: PropTypes.func.isRequired,
    profileOnly: PropTypes.bool
};

export {attachmentLimit, postLimit};
export default PostComposer;

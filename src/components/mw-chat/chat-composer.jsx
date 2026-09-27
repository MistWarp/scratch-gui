/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {Blocks, File, Paperclip, Pencil, Reply, SendHorizontal, ShieldCheck, X} from 'lucide-react';

import {activeTyping, channelName, directPeer, messageAuthor} from '../../lib/originchats/connection.js';
import {subscribeFileOffers} from '../../lib/originchats/chat-ui.js';
import {formatBytes} from './chat-actions.js';
import {isMine} from './chat-messages.jsx';
import styles from './chat-pane.css';

const SIGNING_DISMISSED_KEY = 'mw:chat-signing-dismissed';

const messages = defineMessages({
    placeholder: {
        defaultMessage: 'Message #{channel}',
        description: 'Placeholder for the chat message box',
        id: 'mw.chat.placeholder'
    },
    directPlaceholder: {
        defaultMessage: 'Message {name}',
        description: 'Placeholder for the message box in a direct message conversation',
        id: 'mw.chat.directPlaceholder'
    },
    send: {
        defaultMessage: 'Send message',
        description: 'Button that sends a chat message',
        id: 'mw.chat.send'
    },
    save: {
        defaultMessage: 'Save edit',
        description: 'Button that saves an edited chat message',
        id: 'mw.chat.save'
    },
    attach: {
        defaultMessage: 'Attach files',
        description: 'Button that opens a file picker to attach files to a chat message',
        id: 'mw.chat.attach'
    },
    removeAttachment: {
        defaultMessage: 'Remove {name}',
        description: 'Button that removes a pending attachment from the chat message box',
        id: 'mw.chat.removeAttachment'
    },
    uploading: {
        defaultMessage: 'Uploading {percent}%',
        description: 'Progress shown on a file being uploaded to chat',
        id: 'mw.chat.uploading'
    },
    uploadTooLarge: {
        defaultMessage: '{name} is larger than the {size} limit on this server.',
        description: 'Error when a file is too large to upload to the chat server',
        id: 'mw.chat.uploadTooLarge'
    },
    uploadType: {
        defaultMessage: 'This server does not accept files like {name}.',
        description: 'Error when the chat server does not accept the file type',
        id: 'mw.chat.uploadType'
    },
    uploadDisabled: {
        defaultMessage: 'This server does not accept file uploads.',
        description: 'Error when the chat server has uploads turned off',
        id: 'mw.chat.uploadDisabled'
    },
    uploadFailed: {
        defaultMessage: 'Could not upload {name}.',
        description: 'Error when a chat file upload fails',
        id: 'mw.chat.uploadFailed'
    },
    script: {
        defaultMessage: 'Script',
        description: 'Label on a pending chat attachment that is a script dragged from the code area',
        id: 'mw.chat.script'
    },
    replyingTo: {
        defaultMessage: 'Replying to {name}',
        description: 'Bar above the chat message box while replying to a message',
        id: 'mw.chat.replyingTo'
    },
    editing: {
        defaultMessage: 'Editing your message',
        description: 'Bar above the chat message box while editing a message',
        id: 'mw.chat.editing'
    },
    cancel: {
        defaultMessage: 'Cancel',
        description: 'Button that cancels replying to or editing a chat message',
        id: 'mw.chat.cancel'
    },
    typingOne: {
        defaultMessage: '{user} is typing…',
        description: 'Typing indicator for one person in the chat',
        id: 'mw.chat.typingOne'
    },
    typingTwo: {
        defaultMessage: '{first} and {second} are typing…',
        description: 'Typing indicator for two people in the chat',
        id: 'mw.chat.typingTwo'
    },
    typingMany: {
        defaultMessage: 'Several people are typing…',
        description: 'Typing indicator for three or more people in the chat',
        id: 'mw.chat.typingMany'
    },
    someoneOnDiscord: {
        defaultMessage: 'Someone on Discord',
        description: 'Name used in the typing indicator for a Discord user whose name is not known yet',
        id: 'mw.chat.someoneOnDiscord'
    },
    someone: {
        defaultMessage: 'Someone',
        description: 'Name used in the typing indicator for a person whose name is not known yet',
        id: 'mw.chat.someone'
    },
    slowDown: {
        defaultMessage: 'Slow down a little before sending another message.',
        description: 'Shown when the chat server rate limits the user',
        id: 'mw.chat.slowDown'
    },
    signFailed: {
        defaultMessage: 'Your message could not be signed, so it was not sent. Try again.',
        description: 'Shown when signing a chat message fails',
        id: 'mw.chat.signFailed'
    },
    signingPrompt: {
        defaultMessage: 'Sign your messages so others can check they really came from you.',
        description: 'Prompt in the chat message box asking the user to allow message signing',
        id: 'mw.chat.signingPrompt'
    },
    signingEnable: {
        defaultMessage: 'Turn on signing',
        description: 'Button that asks Rotur for permission to sign chat messages',
        id: 'mw.chat.signingEnable'
    },
    signingDismiss: {
        defaultMessage: 'Not now',
        description: 'Button that hides the chat message signing prompt',
        id: 'mw.chat.signingDismiss'
    }
});

let uploadKey = 0;

const readDismissed = () => {
    try {
        return localStorage.getItem(SIGNING_DISMISSED_KEY) === '1';
    } catch (e) {
        return false;
    }
};

const uploadError = (intl, error, item, connection) => {
    if (error.code === 'too_large') {
        const limit = error.max || (connection.getState().attachments || {}).max_size;
        return intl.formatMessage(messages.uploadTooLarge, {name: item.name, size: formatBytes(limit)});
    }
    if (error.code === 'type') return intl.formatMessage(messages.uploadType, {name: item.name});
    if (error.code === 'disabled') return intl.formatMessage(messages.uploadDisabled);
    if (error.status === 413) {
        const limit = (connection.getState().attachments || {}).max_size;
        return intl.formatMessage(messages.uploadTooLarge, {name: item.name, size: formatBytes(limit)});
    }
    return intl.formatMessage(messages.uploadFailed, {name: item.name});
};

const PendingUpload = ({intl, item, onRemove}) => {
    const image = item.preview && item.type.startsWith('image/');
    return (
        <li
            className={classNames(styles.pending, {[styles.pendingError]: item.status === 'error'})}
            title={item.error || item.name}
        >
            {image ? (
                <img
                    className={styles.pendingThumb}
                    src={item.preview}
                    alt=""
                />
            ) : (
                <span className={styles.pendingThumb}>
                    {item.script ? <Blocks size={16} /> : <File size={16} />}
                </span>
            )}
            <span className={styles.pendingText}>
                <span className={styles.pendingName}>
                    {item.script ? intl.formatMessage(messages.script) : item.name}
                </span>
                <span className={styles.pendingMeta}>
                    {item.status === 'error' ? item.error : null}
                    {item.status === 'uploading' ?
                        intl.formatMessage(messages.uploading, {percent: Math.round(item.progress * 100)}) : null}
                    {item.status === 'done' ? formatBytes(item.size) : null}
                </span>
            </span>
            {item.status === 'uploading' ? (
                <span
                    className={styles.pendingProgress}
                    style={{width: `${Math.round(item.progress * 100)}%`}}
                />
            ) : null}
            <button
                type="button"
                className={styles.pendingRemove}
                aria-label={intl.formatMessage(messages.removeAttachment, {name: item.name})}
                onClick={() => onRemove(item.key)}
            >
                <X size={12} />
            </button>
        </li>
    );
};

PendingUpload.propTypes = {
    intl: intlShape.isRequired,
    item: PropTypes.object.isRequired,
    onRemove: PropTypes.func.isRequired
};

const typingLabel = (intl, entry) => {
    if (entry.name) return entry.name;
    return intl.formatMessage(entry.provider === 'discord' ? messages.someoneOnDiscord : messages.someone);
};

const Composer = ({connection, intl, onClearTarget, onEditLast, state, target}) => {
    const [draft, setDraft] = useState('');
    const [uploads, setUploads] = useState([]);
    const [dismissed, setDismissed] = useState(readDismissed);
    const [, setTick] = useState(0);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const uploadsRef = useRef(uploads);
    uploadsRef.current = uploads;
    const channel = state.channels.find(item => item.name === state.active);
    const label = state.direct ?
        intl.formatMessage(messages.directPlaceholder, {name: channelName(channel) || directPeer(channel) || ''}) :
        intl.formatMessage(messages.placeholder, {channel: channelName(channel)});
    const typing = activeTyping(state, state.active);
    const editing = target && target.mode === 'edit';
    const uploadsEnabled = !state.attachments || state.attachments.enabled !== false;

    useEffect(() => {
        if (!typing.length) return;
        const timer = setTimeout(() => setTick(tick => tick + 1), 1000);
        return () => clearTimeout(timer);
    });

    useLayoutEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    }, [draft]);

    useEffect(() => {
        if (!target) return;
        if (target.mode === 'edit') setDraft(target.message.content || '');
        if (inputRef.current) inputRef.current.focus();
    }, [target]);

    useEffect(() => () => {
        uploadsRef.current.forEach(item => {
            if (item.controller) item.controller.abort();
            if (item.preview) URL.revokeObjectURL(item.preview);
        });
    }, []);

    const patchUpload = (key, values) => setUploads(list => list.map(item => (
        item.key === key ? {...item, ...values} : item
    )));

    const addFiles = files => {
        const added = Array.from(files).map(file => {
            uploadKey += 1;
            const item = {
                key: `upload-${uploadKey}`,
                name: file.name || 'file',
                size: file.size,
                type: file.type || '',
                script: Boolean(file.mwScript),
                preview: /^image\//.test(file.type || '') ? URL.createObjectURL(file) : null,
                progress: 0,
                status: 'uploading',
                attachment: null,
                error: null,
                controller: new AbortController()
            };
            connection.upload(file, {
                onProgress: progress => patchUpload(item.key, {progress}),
                signal: item.controller.signal
            })
                .then(attachment => patchUpload(item.key, {status: 'done', progress: 1, attachment}))
                .catch(error => {
                    if (error.code === 'aborted') return;
                    patchUpload(item.key, {status: 'error', error: uploadError(intl, error, item, connection)});
                });
            return item;
        });
        setUploads(list => [...list, ...added]);
        if (inputRef.current) inputRef.current.focus();
    };

    useEffect(() => subscribeFileOffers(files => {
        if (!editing && uploadsEnabled) addFiles(files);
    }), [editing, uploadsEnabled, connection]);

    const removeUpload = key => setUploads(list => list.filter(item => {
        if (item.key !== key) return true;
        if (item.controller && item.status === 'uploading') item.controller.abort();
        if (item.preview) URL.revokeObjectURL(item.preview);
        return false;
    }));

    const reset = () => {
        uploads.forEach(item => {
            if (item.preview) URL.revokeObjectURL(item.preview);
        });
        setUploads([]);
        setDraft('');
        onClearTarget();
    };

    const busy = uploads.some(item => item.status === 'uploading');
    const ready = uploads.filter(item => item.status === 'done');
    const canSend = !busy && (Boolean(draft.trim()) || (!editing && ready.length > 0));

    const submit = event => {
        event.preventDefault();
        if (!canSend) return;
        if (editing) {
            if (connection.editMessage(state.active, target.message.id, draft)) reset();
            return;
        }
        const sent = connection.sendMessage(state.active, draft, {
            replyTo: target && target.mode === 'reply' ? target.message.id : null,
            attachments: ready.map(item => item.attachment)
        });
        if (sent) reset();
    };

    let typingText = '';
    if (typing.length === 1) {
        typingText = intl.formatMessage(messages.typingOne, {user: typingLabel(intl, typing[0])});
    } else if (typing.length === 2) {
        typingText = intl.formatMessage(messages.typingTwo, {
            first: typingLabel(intl, typing[0]),
            second: typingLabel(intl, typing[1])
        });
    } else if (typing.length > 2) {
        typingText = intl.formatMessage(messages.typingMany);
    }

    let notice = null;
    if (state.notice) {
        if (state.notice.kind === 'rate_limit') notice = intl.formatMessage(messages.slowDown);
        else if (state.notice.kind === 'sign_failed') notice = intl.formatMessage(messages.signFailed);
        else notice = state.notice.text;
    }

    return (
        <form
            className={styles.composer}
            onSubmit={submit}
        >
            {notice ? (
                <p
                    className={styles.notice}
                    role="alert"
                >{notice}</p>
            ) : null}
            {state.signing === 'needs_permission' && !dismissed ? (
                <div className={styles.signingPrompt}>
                    <ShieldCheck size={16} />
                    <p>{intl.formatMessage(messages.signingPrompt)}</p>
                    <div className={styles.signingActions}>
                        <button
                            type="button"
                            className={styles.cardButton}
                            onClick={() => connection.enableSigning()}
                        >{intl.formatMessage(messages.signingEnable)}</button>
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => {
                                setDismissed(true);
                                try {
                                    localStorage.setItem(SIGNING_DISMISSED_KEY, '1');
                                } catch (e) {
                                    return null;
                                }
                            }}
                        >{intl.formatMessage(messages.signingDismiss)}</button>
                    </div>
                </div>
            ) : null}
            {target ? (
                <div className={styles.targetBar}>
                    {editing ? <Pencil size={13} /> : <Reply size={13} />}
                    <span className={styles.targetText}>
                        {editing ?
                            intl.formatMessage(messages.editing) :
                            intl.formatMessage(messages.replyingTo, {name: messageAuthor(state, target.message)})}
                    </span>
                    <button
                        type="button"
                        className={styles.pendingRemove}
                        aria-label={intl.formatMessage(messages.cancel)}
                        title={intl.formatMessage(messages.cancel)}
                        onClick={() => {
                            if (editing) setDraft('');
                            onClearTarget();
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : null}
            {uploads.length ? (
                <ul className={styles.pendingList}>
                    {uploads.map(item => (
                        <PendingUpload
                            key={item.key}
                            intl={intl}
                            item={item}
                            onRemove={removeUpload}
                        />
                    ))}
                </ul>
            ) : null}
            <div className={styles.inputRow}>
                <div className={styles.field}>
                    {uploadsEnabled && !editing ? (
                        <button
                            type="button"
                            className={styles.attach}
                            title={intl.formatMessage(messages.attach)}
                            aria-label={intl.formatMessage(messages.attach)}
                            onClick={() => fileRef.current && fileRef.current.click()}
                        >
                            <Paperclip size={16} />
                        </button>
                    ) : null}
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        hidden
                        onChange={event => {
                            if (event.target.files && event.target.files.length) addFiles(event.target.files);
                            event.target.value = '';
                        }}
                    />
                    <textarea
                        ref={inputRef}
                        className={styles.input}
                        rows={1}
                        value={draft}
                        maxLength={Number(state.limits.post_content) || 2000}
                        placeholder={label}
                        aria-label={label}
                        onChange={event => {
                            setDraft(event.target.value);
                            connection.clearNotice();
                            if (event.target.value.trim() && !editing) connection.sendTyping(state.active);
                        }}
                        onPaste={event => {
                            const files = Array.from((event.clipboardData && event.clipboardData.files) || []);
                            if (!files.length || !uploadsEnabled || editing) return;
                            event.preventDefault();
                            addFiles(files);
                        }}
                        onKeyDown={event => {
                            event.stopPropagation();
                            const plain = !event.shiftKey && !event.nativeEvent.isComposing;
                            if (event.key === 'Enter' && plain) {
                                submit(event);
                            } else if (event.key === 'Escape' && target) {
                                event.preventDefault();
                                if (editing) setDraft('');
                                onClearTarget();
                            } else if (event.key === 'ArrowUp' && !draft && !target) {
                                const list = state.messages[state.active] || [];
                                const last = list.slice().reverse()
                                    .find(message => isMine(state, message));
                                if (last) {
                                    event.preventDefault();
                                    onEditLast(last);
                                }
                            }
                        }}
                    />
                    <button
                        type="submit"
                        className={styles.send}
                        disabled={!canSend}
                        title={intl.formatMessage(editing ? messages.save : messages.send)}
                        aria-label={intl.formatMessage(editing ? messages.save : messages.send)}
                    >
                        <SendHorizontal size={16} />
                    </button>
                </div>
            </div>
            <p
                className={styles.typing}
                aria-live="polite"
            >{typingText}</p>
        </form>
    );
};

Composer.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onClearTarget: PropTypes.func.isRequired,
    onEditLast: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired,
    target: PropTypes.shape({
        mode: PropTypes.oneOf(['reply', 'edit']).isRequired,
        message: PropTypes.object.isRequired
    })
};

export default Composer;

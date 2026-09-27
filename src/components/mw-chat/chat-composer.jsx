/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {Bell, BellOff, Blocks, CornerUpLeft, File, Paperclip, SendHorizontal, ShieldCheck, X} from 'lucide-react';

import {
    activeTyping,
    canEditMessage,
    channelName,
    directPeer,
    findMessage,
    isRoturUser,
    messageAuthor,
    messageAvatar
} from '../../lib/originchats/connection.js';
import {subscribeFileOffers} from '../../lib/originchats/chat-ui.js';
import {firstLine, parse} from '../../lib/originchats/rich-text.js';
import {formatBytes} from './chat-actions.js';
import {isMine} from './chat-messages.jsx';
import {RichText, UserPicture, richContext} from './chat-rich-text.jsx';
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
    uploadFailedReason: {
        defaultMessage: 'Could not upload {name}. The server said: {reason}',
        description: 'Error when a chat file upload fails, with the reason the chat server gave',
        id: 'mw.chat.uploadFailedReason'
    },
    scriptFailed: {
        defaultMessage: 'Could not upload the script.',
        description: 'Error when uploading a script dragged from the code area fails',
        id: 'mw.chat.scriptFailed'
    },
    scriptFailedReason: {
        defaultMessage: 'Could not upload the script. The server said: {reason}',
        description: 'Error when uploading a script dragged from the code area fails, with the reason the chat server gave',
        id: 'mw.chat.scriptFailedReason'
    },
    script: {
        defaultMessage: 'Script',
        description: 'Label on a pending chat attachment that is a script dragged from the code area',
        id: 'mw.chat.script'
    },
    scriptReady: {
        defaultMessage: 'Ready to send, {size}',
        description: 'Status under a script dragged into the chat message box once it has uploaded',
        id: 'mw.chat.scriptReady'
    },
    removeScript: {
        defaultMessage: 'Remove script',
        description: 'Button that removes a script dragged into the chat message box before sending',
        id: 'mw.chat.removeScript'
    },
    replyingTo: {
        defaultMessage: 'Replying to {name}',
        description: 'Bar above the chat message box while replying to a message',
        id: 'mw.chat.replyingTo'
    },
    replyJump: {
        defaultMessage: 'Show the message you are replying to',
        description: 'Tooltip on the reply bar above the chat message box, which scrolls to the original message',
        id: 'mw.chat.replyJump'
    },
    replyPingOn: {
        defaultMessage: '{name} will be notified. Click to reply without notifying them.',
        description: 'Tooltip on the bell toggle in the reply bar while the reply will ping the original author',
        id: 'mw.chat.replyPingOn'
    },
    replyPingOff: {
        defaultMessage: '{name} will not be notified. Click to notify them.',
        description: 'Tooltip on the bell toggle in the reply bar while the reply will not ping the original author',
        id: 'mw.chat.replyPingOff'
    },
    replyPingLabel: {
        defaultMessage: 'Notify {name}',
        description: 'Accessible label for the toggle that decides whether a reply pings the original author',
        id: 'mw.chat.replyPingLabel'
    },
    noContent: {
        defaultMessage: 'Attachment',
        description: 'Shown in the reply bar when the message being replied to has no text',
        id: 'mw.chat.replyAttachment'
    },
    cancel: {
        defaultMessage: 'Cancel reply',
        description: 'Button that cancels replying to a chat message',
        id: 'mw.chat.cancelReply'
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
    const reason = error.status && error.message && !/^Upload failed/.test(error.message) ? error.message : '';
    if (item.script) {
        return reason ?
            intl.formatMessage(messages.scriptFailedReason, {reason}) :
            intl.formatMessage(messages.scriptFailed);
    }
    return reason ?
        intl.formatMessage(messages.uploadFailedReason, {name: item.name, reason}) :
        intl.formatMessage(messages.uploadFailed, {name: item.name});
};

const PendingScript = ({intl, item, onRemove}) => {
    const percent = Math.round(item.progress * 100);
    let status = null;
    if (item.status === 'error') status = item.error;
    else if (item.status === 'uploading') status = intl.formatMessage(messages.uploading, {percent});
    else if (item.status === 'done') status = intl.formatMessage(messages.scriptReady, {size: formatBytes(item.size)});
    return (
        <li
            className={classNames(styles.pendingScript, {[styles.pendingError]: item.status === 'error'})}
            title={item.status === 'error' ? item.error : null}
        >
            {item.preview ? (
                <img
                    className={styles.pendingScriptImage}
                    src={item.preview}
                    alt={intl.formatMessage(messages.script)}
                    draggable={false}
                />
            ) : null}
            <div className={styles.pendingScriptBar}>
                <span className={styles.pendingMeta}>{status}</span>
                <button
                    type="button"
                    className={styles.pendingRemove}
                    aria-label={intl.formatMessage(messages.removeScript)}
                    title={intl.formatMessage(messages.removeScript)}
                    onClick={() => onRemove(item.key)}
                >
                    <X size={12} />
                </button>
            </div>
            {item.status === 'uploading' ? (
                <span
                    className={styles.pendingProgress}
                    style={{width: `${percent}%`}}
                />
            ) : null}
        </li>
    );
};

PendingScript.propTypes = {
    intl: intlShape.isRequired,
    item: PropTypes.object.isRequired,
    onRemove: PropTypes.func.isRequired
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

const ReplyBar = ({connection, intl, onCancel, onJump, onTogglePing, reply, state}) => {
    const message = findMessage(state, state.active, reply.message.id) || reply.message;
    const name = messageAuthor(state, message);
    const person = Boolean(message.user) && !message.webhook && !message.alias;
    const canPing = person && !isMine(state, message);
    const tokens = parse(firstLine(message.content || ''), richContext(state, message));
    return (
        <div className={styles.replyBar}>
            <button
                type="button"
                className={styles.replyBarMain}
                title={intl.formatMessage(messages.replyJump)}
                onClick={() => onJump(message.id)}
            >
                <CornerUpLeft
                    size={14}
                    className={styles.replyIcon}
                />
                <span className={styles.replyBarLabel}>
                    {intl.formatMessage(messages.replyingTo, {name})}
                </span>
                {person ? (
                    <UserPicture
                        rotur={isRoturUser(state, message.user)}
                        size={16}
                        src={messageAvatar(state, message, connection.serverUrl)}
                        username={message.user}
                    />
                ) : null}
                <span className={styles.replyText}>
                    {tokens.length ? (
                        <RichText
                            tokens={tokens}
                            intl={intl}
                            state={state}
                            inline
                        />
                    ) : intl.formatMessage(messages.noContent)}
                </span>
            </button>
            {canPing ? (
                <button
                    type="button"
                    className={classNames(styles.pingToggle, {[styles.pingToggleOff]: !reply.ping})}
                    aria-pressed={reply.ping}
                    aria-label={intl.formatMessage(messages.replyPingLabel, {name})}
                    title={intl.formatMessage(reply.ping ? messages.replyPingOn : messages.replyPingOff, {name})}
                    onClick={onTogglePing}
                >
                    {reply.ping ? <Bell size={13} /> : <BellOff size={13} />}
                </button>
            ) : null}
            <button
                type="button"
                className={styles.pendingRemove}
                aria-label={intl.formatMessage(messages.cancel)}
                title={intl.formatMessage(messages.cancel)}
                onClick={onCancel}
            >
                <X size={12} />
            </button>
        </div>
    );
};

ReplyBar.propTypes = {
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onCancel: PropTypes.func.isRequired,
    onJump: PropTypes.func.isRequired,
    onTogglePing: PropTypes.func.isRequired,
    reply: PropTypes.shape({
        message: PropTypes.object.isRequired,
        ping: PropTypes.bool.isRequired
    }).isRequired,
    state: PropTypes.object.isRequired
};

const Composer = ({apiRef, connection, intl, onClearReply, onEditLast, onJump, onTogglePing, reply, state}) => {
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
        if (reply && inputRef.current) inputRef.current.focus();
    }, [reply && reply.message.id]);

    if (apiRef) {
        apiRef.current = {
            focus: () => inputRef.current && inputRef.current.focus(),
            insert: text => {
                setDraft(value => `${value && !/\s$/.test(value) ? `${value} ` : value}${text}`);
                if (inputRef.current) inputRef.current.focus();
            }
        };
    }

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
                channel: state.active,
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
        if (uploadsEnabled) addFiles(files);
    }), [uploadsEnabled, connection]);

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
        onClearReply();
    };

    const busy = uploads.some(item => item.status === 'uploading');
    const ready = uploads.filter(item => item.status === 'done');
    const canSend = !busy && (Boolean(draft.trim()) || ready.length > 0);

    const submit = event => {
        event.preventDefault();
        if (!canSend) return;
        const sent = connection.sendMessage(state.active, draft, {
            replyTo: reply ? reply.message.id : null,
            ping: reply ? reply.ping : true,
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
            {reply ? (
                <ReplyBar
                    connection={connection}
                    intl={intl}
                    onCancel={onClearReply}
                    onJump={onJump}
                    onTogglePing={() => {
                        onTogglePing();
                        if (inputRef.current) inputRef.current.focus();
                    }}
                    reply={reply}
                    state={state}
                />
            ) : null}
            {uploads.length ? (
                <ul className={styles.pendingList}>
                    {uploads.map(item => {
                        const Item = item.script ? PendingScript : PendingUpload;
                        return (
                            <Item
                                key={item.key}
                                intl={intl}
                                item={item}
                                onRemove={removeUpload}
                            />
                        );
                    })}
                </ul>
            ) : null}
            <div className={styles.inputRow}>
                <div className={styles.field}>
                    {uploadsEnabled ? (
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
                            if (event.target.value.trim()) connection.sendTyping(state.active);
                        }}
                        onPaste={event => {
                            const files = Array.from((event.clipboardData && event.clipboardData.files) || []);
                            if (!files.length || !uploadsEnabled) return;
                            event.preventDefault();
                            addFiles(files);
                        }}
                        onKeyDown={event => {
                            event.stopPropagation();
                            const plain = !event.shiftKey && !event.nativeEvent.isComposing;
                            if (event.key === 'Enter' && plain) {
                                submit(event);
                            } else if (event.key === 'Escape' && reply) {
                                event.preventDefault();
                                onClearReply();
                            } else if (event.key === 'ArrowUp' && !draft && !event.altKey && !event.ctrlKey &&
                                !event.metaKey && !event.shiftKey) {
                                const list = state.messages[state.active] || [];
                                const last = list.slice().reverse()
                                    .find(message => canEditMessage(state, state.active, message));
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
                        title={intl.formatMessage(messages.send)}
                        aria-label={intl.formatMessage(messages.send)}
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
    apiRef: PropTypes.shape({current: PropTypes.object}),
    connection: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    onClearReply: PropTypes.func.isRequired,
    onEditLast: PropTypes.func.isRequired,
    onJump: PropTypes.func.isRequired,
    onTogglePing: PropTypes.func.isRequired,
    reply: PropTypes.shape({
        message: PropTypes.object.isRequired,
        ping: PropTypes.bool.isRequired
    }),
    state: PropTypes.object.isRequired
};

export default Composer;

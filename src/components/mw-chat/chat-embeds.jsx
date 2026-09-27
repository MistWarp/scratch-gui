/* eslint-disable react/jsx-no-bind */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useContext, useEffect, useState} from 'react';
import {defineMessages, intlShape} from 'react-intl';
import {
    Blocks,
    Check,
    Download,
    ExternalLink,
    Eye,
    File,
    Heart,
    LogIn,
    Play,
    Plus,
    Server
} from 'lucide-react';

import {
    cleanHost,
    fetchProjectCard,
    fetchServerCard,
    fetchSharedMessage,
    originChatsInviteUrl,
    proxiedImage,
    safeUrl,
    trustedMedia,
    youtubeFrame,
    youtubeThumbnail
} from '../../lib/originchats/embeds.js';
import {firstLine, parse} from '../../lib/originchats/rich-text.js';
import {SCRIPT_MIME, fetchScriptSvg, scriptBlockCount} from '../../lib/originchats/script-image.js';
import {CHAT_DRAG_MIME, ChatActions, downloadFile, formatBytes, formatCount} from './chat-actions.js';
import {RichText, UserPicture} from './chat-rich-text.jsx';
import styles from './chat-pane.css';

const messages = defineMessages({
    serverMembers: {
        defaultMessage: '{count} members',
        description: 'Member count on a chat server invite card',
        id: 'mw.chat.embed.serverMembers'
    },
    serverOnline: {
        defaultMessage: '{count} online',
        description: 'Online count on a chat server invite card',
        id: 'mw.chat.embed.serverOnline'
    },
    serverInviteExpired: {
        defaultMessage: 'This invite has expired.',
        description: 'Shown on a chat server invite card when the invite code has expired',
        id: 'mw.chat.embed.serverInviteExpired'
    },
    serverInviteInvalid: {
        defaultMessage: 'This invite is no longer valid.',
        description: 'Shown on a chat server invite card when the invite code is invalid',
        id: 'mw.chat.embed.serverInviteInvalid'
    },
    serverInvite: {
        defaultMessage: 'Invite to {server}',
        description: 'Accessible label for a chat server invite card',
        id: 'mw.chat.embed.serverInvite'
    },
    serverJoin: {
        defaultMessage: 'Join',
        description: 'Button on a chat server invite card that joins the server',
        id: 'mw.chat.embed.serverJoin'
    },
    serverJoined: {
        defaultMessage: 'Joined',
        description: 'Label on a chat server invite card when the user is already a member',
        id: 'mw.chat.embed.serverJoined'
    },
    serverOpen: {
        defaultMessage: 'Open in OriginChats',
        description: 'Link on a chat server invite card for a server the editor chat cannot join directly',
        id: 'mw.chat.embed.serverOpen'
    },
    serverUnavailable: {
        defaultMessage: 'OriginChats server {server}',
        description: 'Fallback text for a chat server link when the server details could not be loaded',
        id: 'mw.chat.embed.serverUnavailable'
    },
    projectBy: {
        defaultMessage: 'by {owner}',
        description: 'Author line on a MistWarp project card in chat',
        id: 'mw.chat.embed.projectBy'
    },
    projectViews: {
        defaultMessage: '{count} views',
        description: 'View count on a MistWarp project card in chat',
        id: 'mw.chat.embed.projectViews'
    },
    projectLoves: {
        defaultMessage: '{count} loves',
        description: 'Love count on a MistWarp project card in chat',
        id: 'mw.chat.embed.projectLoves'
    },
    playVideo: {
        defaultMessage: 'Play video',
        description: 'Accessible label for a YouTube thumbnail in chat',
        id: 'mw.chat.embed.playVideo'
    },
    download: {
        defaultMessage: 'Download {name}',
        description: 'Button that downloads a file attached to a chat message',
        id: 'mw.chat.embed.download'
    },
    scriptBlocks: {
        defaultMessage: '{count, plural, one {Script with # block} other {Script with # blocks}}',
        description: 'Label on a chat attachment that contains a Scratch script',
        id: 'mw.chat.embed.scriptBlocks'
    },
    scriptHint: {
        defaultMessage: 'Drag this script into the code area, or add it to the current sprite.',
        description: 'Tooltip on a script image in chat explaining how to use it',
        id: 'mw.chat.embed.scriptHint'
    },
    scriptAdd: {
        defaultMessage: 'Add to sprite',
        description: 'Button that adds a script shared in chat to the sprite being edited',
        id: 'mw.chat.embed.scriptAdd'
    },
    scriptAdded: {
        defaultMessage: 'Added',
        description: 'Shown briefly after a script from chat was added to the project',
        id: 'mw.chat.embed.scriptAdded'
    },
    openImage: {
        defaultMessage: 'Open {name} in a new tab',
        description: 'Accessible label for an image attached to a chat message',
        id: 'mw.chat.embed.openImage'
    }
});

const useAsync = (load, deps) => {
    const [value, setValue] = useState({loading: true, data: null});
    useEffect(() => {
        let alive = true;
        setValue({loading: true, data: null});
        Promise.resolve(load())
            .then(data => alive && setValue({loading: false, data}))
            .catch(() => alive && setValue({loading: false, data: null}));
        return () => {
            alive = false;
        };
    }, deps);
    return value;
};

const markChatDrag = event => {
    if (event.dataTransfer) event.dataTransfer.setData(CHAT_DRAG_MIME, '1');
};

const ServerIcon = ({icon, name, size}) => (icon ? (
    <img
        className={styles.serverIcon}
        src={icon}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
    />
) : (
    <span
        className={styles.serverIcon}
        style={{width: size, height: size}}
        aria-hidden="true"
    >{(name || '?').slice(0, 1).toUpperCase()}</span>
));

ServerIcon.propTypes = {
    icon: PropTypes.string,
    name: PropTypes.string,
    size: PropTypes.number.isRequired
};

const ServerEmbed = ({embed, intl}) => {
    const actions = useContext(ChatActions);
    const {loading, data} = useAsync(() => fetchServerCard(embed.server, embed.code), [embed.server, embed.code]);
    const home = actions.homeServer && embed.server === actions.homeServer;
    const openUrl = originChatsInviteUrl(embed.server, embed.code);

    if (loading) return <div className={classNames(styles.card, styles.cardLoading)} />;
    if (!data) {
        return (
            <a
                className={styles.linkCard}
                href={openUrl}
                target="_blank"
                rel="noreferrer"
            >
                <Server size={14} />
                {intl.formatMessage(messages.serverUnavailable, {server: embed.server})}
            </a>
        );
    }

    const invalid = data.invite && !data.invite.valid;
    let action;
    if (home && actions.homeMembership === 'member') {
        action = (
            <span className={styles.cardDone}>
                <Check size={14} />
                {intl.formatMessage(messages.serverJoined)}
            </span>
        );
    } else if (home) {
        action = (
            <button
                type="button"
                className={styles.cardButton}
                disabled={invalid}
                onClick={() => actions.joinHomeServer(embed.code)}
            >
                <LogIn size={14} />
                {intl.formatMessage(messages.serverJoin)}
            </button>
        );
    } else {
        action = (
            <a
                className={styles.cardButton}
                href={openUrl}
                target="_blank"
                rel="noreferrer"
            >
                <ExternalLink size={14} />
                {intl.formatMessage(messages.serverOpen)}
            </a>
        );
    }

    return (
        <div
            className={classNames(styles.card, styles.serverCard)}
            role="group"
            aria-label={intl.formatMessage(messages.serverInvite, {server: data.name})}
        >
            {data.banner ? (
                <img
                    className={styles.serverBanner}
                    src={data.banner}
                    alt=""
                    loading="lazy"
                    draggable={false}
                />
            ) : null}
            <div className={styles.serverHead}>
                <ServerIcon
                    icon={data.icon}
                    name={data.name}
                    size={40}
                />
                <div className={styles.serverText}>
                    <p className={styles.cardTitle}>{data.name}</p>
                    <p className={styles.cardMeta}>
                        {data.online === null ? null : (
                            <span className={styles.cardStat}>
                                <span className={styles.dot} />
                                {intl.formatMessage(messages.serverOnline, {count: formatCount(data.online)})}
                            </span>
                        )}
                        {data.members === null ? null : (
                            <span className={styles.cardStat}>
                                {intl.formatMessage(messages.serverMembers, {count: formatCount(data.members)})}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            {data.description ? <p className={styles.cardDescription}>{data.description}</p> : null}
            {invalid ? (
                <p className={styles.cardWarning}>
                    {intl.formatMessage(data.invite.reason === 'invite_expired' ?
                        messages.serverInviteExpired : messages.serverInviteInvalid)}
                </p>
            ) : null}
            <div className={styles.cardActions}>{action}</div>
        </div>
    );
};

ServerEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired
};

const YoutubeEmbed = ({embed, intl}) => {
    const [playing, setPlaying] = useState(false);
    if (playing) {
        return (
            <div className={styles.video}>
                <iframe
                    src={youtubeFrame(embed.id)}
                    title="YouTube"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            </div>
        );
    }
    return (
        <button
            type="button"
            className={classNames(styles.video, styles.videoThumb)}
            aria-label={intl.formatMessage(messages.playVideo)}
            onClick={() => setPlaying(true)}
        >
            <img
                src={youtubeThumbnail(embed.id)}
                alt=""
                loading="lazy"
                draggable={false}
            />
            <span className={styles.playBadge}><Play size={18} /></span>
        </button>
    );
};

YoutubeEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired
};

const ProjectEmbed = ({embed, intl}) => {
    const {loading, data} = useAsync(() => fetchProjectCard(embed.id), [embed.id]);
    if (loading) return <div className={classNames(styles.card, styles.cardLoading)} />;
    if (!data) return null;
    return (
        <a
            className={classNames(styles.card, styles.projectCard)}
            href={embed.url}
            target="_blank"
            rel="noreferrer"
        >
            {data.thumbnail ? (
                <img
                    className={styles.projectThumb}
                    src={data.thumbnail}
                    alt=""
                    loading="lazy"
                    draggable={false}
                />
            ) : null}
            <span className={styles.projectText}>
                <span className={styles.cardTitle}>{data.title}</span>
                {data.owner ? (
                    <span className={styles.cardMeta}>{intl.formatMessage(messages.projectBy, {owner: data.owner})}</span>
                ) : null}
                <span className={styles.cardMeta}>
                    <span className={styles.cardStat}>
                        <Eye size={12} />
                        {intl.formatMessage(messages.projectViews, {count: formatCount(data.views)})}
                    </span>
                    <span className={styles.cardStat}>
                        <Heart size={12} />
                        {intl.formatMessage(messages.projectLoves, {count: formatCount(data.loves)})}
                    </span>
                </span>
            </span>
        </a>
    );
};

ProjectEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired
};

const SharedMessageEmbed = ({embed, intl, state}) => {
    const {loading, data} = useAsync(() => fetchSharedMessage(embed.server, embed.channel, embed.id),
        [embed.server, embed.channel, embed.id]);
    if (loading || !data || !data.id) return null;
    const text = firstLine(data.content);
    return (
        <a
            className={classNames(styles.card, styles.quoteCard)}
            href={embed.url}
            target="_blank"
            rel="noreferrer"
        >
            <span className={styles.quoteAuthor}>
                <UserPicture
                    rotur
                    size={16}
                    username={data.user}
                />
                <span>{data.user}</span>
                <span className={styles.time}>{`#${embed.channel}`}</span>
            </span>
            <span className={styles.quoteText}>
                <RichText
                    tokens={parse(text, {users: state.users})}
                    intl={intl}
                    state={state}
                    inline
                />
            </span>
        </a>
    );
};

SharedMessageEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const ImageView = ({alt, intl, name, onDragStart, src, title, href}) => (
    <a
        className={styles.image}
        href={href || src}
        target="_blank"
        rel="noreferrer"
        title={title}
        aria-label={intl.formatMessage(messages.openImage, {name: name || alt || ''})}
    >
        <img
            src={src}
            alt={alt || ''}
            loading="lazy"
            onDragStart={onDragStart || markChatDrag}
        />
    </a>
);

ImageView.propTypes = {
    alt: PropTypes.string,
    href: PropTypes.string,
    intl: intlShape.isRequired,
    name: PropTypes.string,
    onDragStart: PropTypes.func,
    src: PropTypes.string.isRequired,
    title: PropTypes.string
};

const MediaEmbed = ({embed, intl}) => {
    const src = safeUrl(embed.url);
    if (!src) return null;
    const preload = trustedMedia(src) ? 'metadata' : 'none';
    if (embed.type === 'video') {
        return (
            <video
                className={styles.media}
                src={src}
                controls
                preload={preload}
            />
        );
    }
    if (embed.type === 'audio') {
        return (
            <audio
                className={styles.audio}
                src={src}
                controls
                preload={preload}
            />
        );
    }
    return (
        <ImageView
            intl={intl}
            src={proxiedImage(src)}
            href={src}
        />
    );
};

MediaEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired
};

const LinkEmbed = ({embed, intl}) => {
    const url = safeUrl(embed.url);
    const rawImage = safeUrl((embed.image && embed.image.url) || (embed.thumbnail && embed.thumbnail.url));
    const image = rawImage && proxiedImage(rawImage);
    const large = Boolean(embed.image && embed.image.url);
    const site = (embed.provider && embed.provider.name) || embed.site_name || (url && cleanHost(url));
    const color = /^#[0-9a-f]{3,8}$/i.test(String(embed.color || '')) ? embed.color : null;
    const author = embed.author && embed.author.name;
    const fields = Array.isArray(embed.fields) ? embed.fields.filter(field => field && field.name).slice(0, 10) : [];
    const video = safeUrl(embed.video && embed.video.url);
    const videoPreload = video && trustedMedia(video) ? 'metadata' : 'none';
    return (
        <div
            className={classNames(styles.card, styles.linkEmbed)}
            style={color ? {'--embed-color': color} : null}
        >
            <div className={styles.linkEmbedBody}>
                {site ? <p className={styles.cardMeta}>{site}</p> : null}
                {author ? <p className={styles.linkEmbedAuthor}>{author}</p> : null}
                {embed.title ? (
                    url ? (
                        <a
                            className={styles.cardTitle}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                        >{embed.title}</a>
                    ) : <p className={styles.cardTitle}>{embed.title}</p>
                ) : null}
                {embed.description ? <p className={styles.cardDescription}>{embed.description}</p> : null}
                {fields.length ? (
                    <dl className={styles.embedFields}>
                        {fields.map((field, index) => (
                            <div
                                key={index}
                                className={classNames(styles.embedField, {[styles.embedFieldInline]: field.inline})}
                            >
                                <dt>{field.name}</dt>
                                <dd>{field.value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
                {embed.footer && embed.footer.text ? <p className={styles.cardMeta}>{embed.footer.text}</p> : null}
            </div>
            {image && !large ? (
                <img
                    className={styles.linkEmbedThumb}
                    src={image}
                    alt=""
                    loading="lazy"
                    onDragStart={markChatDrag}
                />
            ) : null}
            {image && large ? (
                <div className={styles.linkEmbedImage}>
                    <ImageView
                        intl={intl}
                        src={image}
                        href={url || rawImage}
                    />
                </div>
            ) : null}
            {video && !image ? (
                <video
                    className={styles.media}
                    src={video}
                    controls
                    preload={videoPreload}
                />
            ) : null}
        </div>
    );
};

LinkEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired
};

const ClientEmbed = ({embed, intl, state}) => {
    switch (embed.type) {
    case 'server':
        return (
            <ServerEmbed
                embed={embed}
                intl={intl}
            />
        );
    case 'youtube':
        return (
            <YoutubeEmbed
                embed={embed}
                intl={intl}
            />
        );
    case 'project':
        return (
            <ProjectEmbed
                embed={embed}
                intl={intl}
            />
        );
    case 'message':
        return (
            <SharedMessageEmbed
                embed={embed}
                intl={intl}
                state={state}
            />
        );
    default:
        return (
            <MediaEmbed
                embed={embed}
                intl={intl}
            />
        );
    }
};

ClientEmbed.propTypes = {
    embed: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    state: PropTypes.object.isRequired
};

const attachmentUrl = (attachment, serverUrl) => {
    const raw = String(attachment.url || '');
    if (raw.startsWith('/')) return `${serverUrl}${raw}`;
    return safeUrl(raw);
};

const attachmentKind = attachment => {
    const type = String(attachment.mime_type || attachment.type || '').toLowerCase();
    const name = String(attachment.name || '').toLowerCase();
    if (type === 'image/svg+xml' || name.endsWith('.svg')) return 'svg';
    if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|bmp)$/.test(name)) return 'image';
    if (type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/.test(name)) return 'video';
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/.test(name)) return 'audio';
    return 'file';
};

const DownloadButton = ({intl, name, url}) => (
    <button
        type="button"
        className={styles.iconButton}
        title={intl.formatMessage(messages.download, {name})}
        aria-label={intl.formatMessage(messages.download, {name})}
        onClick={() => downloadFile(url, name)}
    >
        <Download size={15} />
    </button>
);

DownloadButton.propTypes = {
    intl: intlShape.isRequired,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
};

const FileCard = ({attachment, intl, url}) => {
    const name = attachment.name || 'file';
    return (
        <div className={classNames(styles.card, styles.fileCard)}>
            <span className={styles.fileIcon}><File size={18} /></span>
            <span className={styles.fileText}>
                <a
                    className={styles.fileName}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                >{name}</a>
                {attachment.size ? <span className={styles.cardMeta}>{formatBytes(attachment.size)}</span> : null}
            </span>
            <DownloadButton
                intl={intl}
                name={name}
                url={url}
            />
        </div>
    );
};

FileCard.propTypes = {
    attachment: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    url: PropTypes.string.isRequired
};

const ScriptAttachment = ({attachment, intl, url}) => {
    const actions = useContext(ChatActions);
    const {loading, data} = useAsync(() => fetchScriptSvg(url), [url]);
    const [added, setAdded] = useState(false);
    const name = attachment.name || 'script.svg';

    useEffect(() => {
        if (!added) return;
        const timer = setTimeout(() => setAdded(false), 1600);
        return () => clearTimeout(timer);
    }, [added]);

    if (loading) return <div className={classNames(styles.card, styles.cardLoading)} />;
    if (!data) {
        return (
            <div className={styles.attachmentImage}>
                <ImageView
                    intl={intl}
                    name={name}
                    src={url}
                />
            </div>
        );
    }

    const onDragStart = event => {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData(SCRIPT_MIME, JSON.stringify(data));
        event.dataTransfer.setData(CHAT_DRAG_MIME, '1');
        event.dataTransfer.setData('text/uri-list', url);
    };
    const hint = intl.formatMessage(messages.scriptHint);

    return (
        <figure className={classNames(styles.card, styles.scriptCard)}>
            <div
                className={styles.scriptImage}
                title={hint}
                draggable
                onDragStart={onDragStart}
            >
                <img
                    src={url}
                    alt={hint}
                    loading="lazy"
                    draggable={false}
                />
            </div>
            <figcaption className={styles.scriptBar}>
                <span className={styles.scriptLabel}>
                    <Blocks size={14} />
                    {intl.formatMessage(messages.scriptBlocks, {count: scriptBlockCount(data)})}
                </span>
                {actions.canAddScript ? (
                    <button
                        type="button"
                        className={styles.cardButton}
                        onClick={async () => {
                            if (await actions.addScript(data)) setAdded(true);
                        }}
                    >
                        {added ? <Check size={14} /> : <Plus size={14} />}
                        {intl.formatMessage(added ? messages.scriptAdded : messages.scriptAdd)}
                    </button>
                ) : null}
                <DownloadButton
                    intl={intl}
                    name={name}
                    url={url}
                />
            </figcaption>
        </figure>
    );
};

ScriptAttachment.propTypes = {
    attachment: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    url: PropTypes.string.isRequired
};

const Attachment = ({attachment, intl, serverUrl}) => {
    const url = attachmentUrl(attachment, serverUrl);
    if (!url) return null;
    const kind = attachmentKind(attachment);
    const name = attachment.name || 'file';
    if (kind === 'svg') {
        return (
            <ScriptAttachment
                attachment={attachment}
                intl={intl}
                url={url}
            />
        );
    }
    if (kind === 'image') {
        return (
            <div className={styles.attachmentImage}>
                <ImageView
                    intl={intl}
                    name={name}
                    src={url}
                />
            </div>
        );
    }
    if (kind === 'video' || kind === 'audio') {
        return (
            <div className={styles.attachmentMedia}>
                <MediaEmbed
                    embed={{type: kind, url}}
                    intl={intl}
                />
                <div className={styles.attachmentMediaBar}>
                    <span className={styles.fileName}>{name}</span>
                    <DownloadButton
                        intl={intl}
                        name={name}
                        url={url}
                    />
                </div>
            </div>
        );
    }
    return (
        <FileCard
            attachment={attachment}
            intl={intl}
            url={url}
        />
    );
};

Attachment.propTypes = {
    attachment: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    serverUrl: PropTypes.string.isRequired
};

export {Attachment, ClientEmbed, LinkEmbed, ServerIcon, attachmentKind, markChatDrag};

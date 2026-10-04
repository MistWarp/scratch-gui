import {parseHttpUrl, safeUrl} from '../utils/safe-url.js';
import {ORIGINCHATS_WEB} from './links.js';

const HOST = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d+)?$/i;
const SHARE_HOSTS = ['originchats.com', 'www.originchats.com', 'originchats.mistium.com'];
const INVITE_CODE = /^[A-Za-z0-9_-]{4,64}$/;
const HEX_INVITE = /^[A-Fa-f0-9]{12}$/;
const KNOWN_SERVERS = ['chats.mistwarp.org'];
const NOT_SERVERS = ['discord.com', 'discord.gg', 'www.discord.com', 'discordapp.com', 'www.discordapp.com'];
const NATIVE_SERVER = /^originChats:\/\/([A-Za-z\d][A-Za-z\d.-]*(?:\.[A-Za-z\d][A-Za-z\d-]*)+)\/?$/i;
const YOUTUBE = new RegExp(
    '(?:youtube\\.com/watch\\?(?:[^#\\s]*&)?v=|youtu\\.be/|youtube\\.com/(?:embed|shorts)/)([a-zA-Z0-9_-]{6,})',
    'i'
);
const MISTWARP_HOSTS = ['mistwarp.org', 'www.mistwarp.org'];
const PROJECT_PATH = /^\/project\/([A-Za-z0-9_-]+)\/?$/;
const MESSAGE_PATH = /^\/message\/([^/]+)\/([^/]+)\/([A-Za-z0-9-]+)\/?$/;
const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|bmp|svg)$/i;
const VIDEO_EXT = /\.(?:mp4|webm|mov|m4v|ogv)$/i;
const AUDIO_EXT = /\.(?:mp3|wav|ogg|oga|m4a|flac|aac|opus)$/i;
const MAX_EMBEDS = 3;
const MISTWARP_API_BASE = process.env.MW_API_BASE || 'https://api.mistwarp.org/v1';
const IMAGE_PROXY = 'https://wsrv.nl/?n=-1&url=';
const TRUSTED_MEDIA = [
    'chats.mistwarp.org',
    'dms.originchats.com',
    'attachments.mistium.com',
    'mwapi.mistium.com',
    'api.mistwarp.org',
    'avatars.rotur.dev',
    'i.ytimg.com',
    'cdn.discordapp.com',
    'media.discordapp.net',
    'gifs.originchats.com',
    'wsrv.nl'
];

const cleanHost = raw => {
    const host = String(raw || '')
        .trim()
        .replace(/^(?:https?|wss?):\/\//i, '')
        .split('/')[0]
        .toLowerCase();
    return HOST.test(host) && host.includes('.') ? host : null;
};

const segments = url => url.pathname.split('/')
    .filter(Boolean)
    .map(part => {
        try {
            return decodeURIComponent(part);
        } catch (e) {
            return part;
        }
    });

const parseInvite = raw => {
    const native = NATIVE_SERVER.exec(String(raw || ''));
    if (native) {
        const server = cleanHost(native[1]);
        return server ? {server, code: null} : null;
    }
    const url = parseHttpUrl(raw);
    if (!url) return null;
    const host = url.host.toLowerCase();
    const parts = segments(url);
    if (SHARE_HOSTS.includes(host)) {
        const queryServer = url.searchParams.get('server') || url.searchParams.get('serverurl');
        if (queryServer) {
            const server = cleanHost(queryServer);
            const code = url.searchParams.get('invite') || url.searchParams.get('invite_code') ||
                url.searchParams.get('code');
            return server ? {server, code: code && INVITE_CODE.test(code) ? code : null} : null;
        }
        if (parts[0] !== 'invite' || !parts[1] || parts.length > 3) return null;
        const server = cleanHost(parts[1]);
        if (!server) return null;
        const code = parts[2] && INVITE_CODE.test(parts[2]) ? parts[2] : null;
        return {server, code};
    }
    if (NOT_SERVERS.includes(host) || parts[0] !== 'invite' || parts.length !== 2) return null;
    const code = parts[1];
    if (!KNOWN_SERVERS.includes(host) && !HEX_INVITE.test(code)) return null;
    return INVITE_CODE.test(code) ? {server: host, code} : null;
};

const parseMessageLink = raw => {
    const url = parseHttpUrl(raw);
    if (!url || !SHARE_HOSTS.includes(url.host.toLowerCase())) return null;
    const match = MESSAGE_PATH.exec(url.pathname);
    if (!match) return null;
    const server = cleanHost(decodeURIComponent(match[1]));
    if (!server) return null;
    return {server, channel: decodeURIComponent(match[2]), id: match[3]};
};

const parseProjectLink = raw => {
    const url = parseHttpUrl(raw);
    if (!url || !MISTWARP_HOSTS.includes(url.host.toLowerCase())) return null;
    const match = PROJECT_PATH.exec(url.pathname);
    return match ? {id: match[1]} : null;
};

const mediaType = raw => {
    const url = parseHttpUrl(raw);
    if (!url) return null;
    if (IMAGE_EXT.test(url.pathname)) return 'image';
    if (VIDEO_EXT.test(url.pathname)) return 'video';
    if (AUDIO_EXT.test(url.pathname)) return 'audio';
    return null;
};

const detectEmbed = raw => {
    const invite = parseInvite(raw);
    if (invite) return {type: 'server', url: raw, ...invite};
    const message = parseMessageLink(raw);
    if (message) return {type: 'message', url: raw, ...message};
    const youtube = YOUTUBE.exec(String(raw || ''));
    if (youtube && parseHttpUrl(raw)) return {type: 'youtube', url: raw, id: youtube[1]};
    const project = parseProjectLink(raw);
    if (project) return {type: 'project', url: raw, ...project};
    const media = mediaType(raw);
    if (media) return {type: media, url: raw};
    return null;
};

const collectLinks = tokens => {
    const links = [];
    const walk = list => list.forEach(token => {
        if (token.type === 'link' && !token.quiet) links.push(token.url);
        else if (token.type === 'format') walk(token.children || []);
    });
    walk(tokens || []);
    return links;
};

const embedKey = embed => (embed.type === 'server' ? `server:${embed.server}:${embed.code || ''}` : embed.url);

const messageEmbeds = tokens => {
    const seen = new Set();
    const found = [];
    for (const link of collectLinks(tokens)) {
        const embed = detectEmbed(link);
        if (!embed) continue;
        const key = embedKey(embed);
        if (seen.has(key)) continue;
        seen.add(key);
        found.push(embed);
        if (found.length >= MAX_EMBEDS) break;
    }
    return found;
};

const serverEmbeds = (message, clientEmbeds) => {
    const covered = new Set((clientEmbeds || []).map(embed => embed.url));
    return (Array.isArray(message && message.embeds) ? message.embeds : [])
        .filter(embed => embed && typeof embed === 'object')
        .filter(embed => !(embed.generated && embed.url && covered.has(embed.url)))
        .filter(embed => !(embed.generated && embed.url && detectEmbed(embed.url)))
        .filter(embed => embed.title || embed.description || embed.image || embed.thumbnail ||
            (embed.fields && embed.fields.length) || embed.video || embed.author)
        .slice(0, MAX_EMBEDS);
};

const serverHttp = host => `${/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) ? 'http' : 'https'}://${host}`;

const originChatsInviteUrl = (server, code) => (code ?
    `${ORIGINCHATS_WEB}/invite/${encodeURIComponent(server)}/${encodeURIComponent(code)}` :
    `${ORIGINCHATS_WEB}/app?server=${encodeURIComponent(server)}`);

const trustedMedia = url => {
    const parsed = parseHttpUrl(url);
    return Boolean(parsed) && TRUSTED_MEDIA.includes(parsed.host.toLowerCase());
};

const proxiedImage = raw => {
    const url = safeUrl(raw);
    if (!url) return null;
    return trustedMedia(url) ? url : `${IMAGE_PROXY}${encodeURIComponent(url)}`;
};

const youtubeThumbnail = id => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

const youtubeFrame = id => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;

const cache = new Map();

const cachedJson = (key, url) => {
    if (!cache.has(key)) {
        cache.set(key, fetch(url)
            .then(response => (response.ok || response.status === 404 ? response.json() : null))
            .catch(() => null));
    }
    return cache.get(key);
};

const fetchServerCard = async (server, code) => {
    const base = serverHttp(server);
    const [info, invite] = await Promise.all([
        cachedJson(`info:${server}`, `${base}/info`),
        code ? cachedJson(`invite:${server}:${code}`,
            `${base}/invite/${encodeURIComponent(String(code).toUpperCase())}/check`) : Promise.resolve(null)
    ]);
    const details = (info && info.server) || (invite && invite.server) || null;
    if (!details) return null;
    const stats = (info && info.stats) || {};
    return {
        name: details.name || server,
        icon: proxiedImage(details.icon),
        banner: proxiedImage(details.banner),
        description: details.description || details.about || '',
        owner: details.owner && details.owner.name,
        members: Number(stats.total_users) || null,
        online: Number(stats.online_users || stats.connected_users) || null,
        invite: invite && typeof invite.valid === 'boolean' ?
            {valid: invite.valid, reason: invite.reason || null} :
            null
    };
};

const fetchSharedMessage = (server, channel, id) => cachedJson(
    `message:${server}:${channel}:${id}`,
    `${serverHttp(server)}/messages/${encodeURIComponent(channel)}/${encodeURIComponent(id)}`
);

const fetchProjectCard = async id => {
    const data = await cachedJson(`project:${id}`, `${MISTWARP_API_BASE}/projects/${encodeURIComponent(id)}`);
    const project = data && data.project;
    if (!project || !project.title) return null;
    return {
        title: project.title,
        owner: project.owner || '',
        thumbnail: safeUrl(project.thumbUrl),
        views: Number(project.views) || 0,
        loves: Number(project.loveCount) || 0
    };
};

export {
    cleanHost,
    detectEmbed,
    fetchProjectCard,
    fetchServerCard,
    fetchSharedMessage,
    messageEmbeds,
    originChatsInviteUrl,
    parseInvite,
    proxiedImage,
    safeUrl,
    trustedMedia,
    serverEmbeds,
    serverHttp,
    youtubeFrame,
    youtubeThumbnail
};

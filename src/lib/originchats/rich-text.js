import {formatUsername} from './connection.js';

const PH = String.fromCharCode(1);
const PH_SPLIT = new RegExp(`${PH}(\\d+)${PH}`);
const STANDARD_USERNAME = '[a-zA-Z0-9_](?:[a-zA-Z0-9_.-]*[a-zA-Z0-9_.])?(?:#[0-9]+)?';
const PROVIDER_USERNAME = `USR:[a-zA-Z0-9]+_${STANDARD_USERNAME}`;
const USERNAME_MENTION = new RegExp(`@((?:${PROVIDER_USERNAME}|${STANDARD_USERNAME}))`, 'g');
const EMOJI_URL = new RegExp(
    '<?https?://([^/\\s<>]+)/emojis/(\\d+)(?:\\.(?:png|gif|webp|jpe?g))?(?:\\?[^\\s<>]*)?>?(?=$|[\\s<>),.!])',
    'gi'
);
const EMOJI_TOKEN = /originChats:(?:<emoji>)?\/\/([^/\s]+)\/(?:emojis\/)?(\d+)/g;
const STICKER_TOKEN = /originChats:<sticker>\/\/([^/\s]+)\/(\d+)/g;
const BRACKET_LINK = /<(https?:\/\/[^\s"'<>]+)>/g;
const URL = new RegExp(`https?://[^\\s"'<>${PH}]+`, 'g');
const TRAILING = /[.,!?:;]+$/;
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

const hostUrl = host => {
    const trimmed = String(host || '').replace(/\/+$/, '');
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `${LOCAL_HOST.test(trimmed) ? 'http' : 'https'}://${trimmed}`;
};

const emojiImage = (host, id, ctx) => {
    const known = ctx.emojis && ctx.emojis[id];
    if (known && known.assetServerUrl) {
        return `${hostUrl(known.assetServerUrl)}/emojis/${encodeURIComponent(known.fileName)}`;
    }
    return `${hostUrl(host)}/emojis/${encodeURIComponent(id)}`;
};

const trimUrl = url => {
    let clean = url.replace(TRAILING, '');
    while (clean.endsWith(')') && (clean.match(/\(/g) || []).length < (clean.match(/\)/g) || []).length) {
        clean = clean.slice(0, -1);
    }
    return clean;
};

const visible = text => /\S/.test(text);

const parse = (input, context = {}) => {
    const ctx = {
        users: context.users || {},
        roles: context.roles || {},
        emojis: context.emojis || {},
        channels: context.channels || [],
        pinged: (context.pinged || []).map(name => String(name).toLowerCase())
    };
    const tokens = [];
    const add = token => {
        tokens.push(token);
        return `${PH}${tokens.length - 1}${PH}`;
    };
    const resolve = text => String(text)
        .split(PH_SPLIT)
        .map((part, index) => {
            if (index % 2 === 1) return tokens[Number(part)];
            return part ? {type: 'text', text: part} : null;
        })
        .filter(Boolean);

    const roleFor = id => {
        const name = Object.keys(ctx.roles).find(key => ctx.roles[key] && ctx.roles[key].id === id);
        return name ? {name, color: ctx.roles[name].color || null} : null;
    };
    const channelByLabel = {};
    ctx.channels.forEach(channel => {
        if (!channel || !channel.name) return;
        channelByLabel[String(channel.name).toLowerCase()] = channel.name;
        if (channel.display_name) channelByLabel[String(channel.display_name).toLowerCase()] = channel.name;
    });

    let s = String(input || '');
    s = s.replace(/```(?:[a-zA-Z0-9_-]*\n)?([\s\S]*?)```/g, (source, code) => (
        visible(code) ? add({type: 'codeBlock', code: code.replace(/\n$/, '')}) : source
    ));
    s = s.replace(/`([^`\n]+)`/g, (source, code) => (visible(code) ? add({type: 'inlineCode', code}) : source));
    s = s.replace(/\\([\\`*_~|#@<>[\]()-])/g, (source, char) => add({type: 'text', text: char}));
    s = s.replace(EMOJI_URL, (source, host, id) => `originChats:<emoji>//${host}/${id}`);
    s = s.replace(EMOJI_TOKEN, (source, host, id) => {
        const known = ctx.emojis[id];
        return add({type: 'emoji', host, id, name: (known && known.name) || id, src: emojiImage(host, id, ctx)});
    });
    s = s.replace(STICKER_TOKEN, (source, host, id) => (
        add({type: 'sticker', host, id, src: `${hostUrl(host)}/stickers/${id}`})
    ));
    s = s.replace(BRACKET_LINK, (source, url) => add({type: 'link', url, text: url}));
    s = s.replace(URL, match => {
        const url = trimUrl(match);
        return add({type: 'link', url, text: url}) + match.slice(url.length);
    });
    s = s.replace(/@&([a-zA-Z0-9_-]+)/g, (source, id) => {
        const role = roleFor(id);
        return role ? add({type: 'roleMention', id, name: role.name, color: role.color}) : source;
    });
    s = s.replace(USERNAME_MENTION, (source, username, offset, whole) => {
        const key = username.toLowerCase();
        const user = ctx.users[key];
        if (user || ctx.pinged.includes(key)) {
            const display = (user && user.nickname) || formatUsername(username);
            return add({type: 'mention', username, display, known: true});
        }
        if (/[\w.]/.test(whole.charAt(offset - 1))) return source;
        return add({type: 'mention', username, display: formatUsername(username), known: false});
    });
    s = s.replace(/#([a-zA-Z0-9_-]+)/g, (source, name) => {
        const channel = channelByLabel[name.toLowerCase()];
        return channel ? add({type: 'channel', name, channel}) : source;
    });

    const format = text => {
        let out = String(text);
        const wrap = (re, style, inner) => {
            out = out.replace(re, (source, ...groups) => {
                const content = inner ? inner(groups) : groups[0];
                if (!visible(content)) return source;
                return add({type: 'format', style, children: resolve(format(content))});
            });
        };
        wrap(/\|\|([\s\S]+?)\|\|/g, 'spoiler');
        wrap(/~~(.+?)~~/g, 'strike');
        wrap(/^-# (.*)$/gm, 'sub');
        wrap(/(?<!\w)__(?=\S)(.+?)__/g, 'underline');
        wrap(/\*\*\*(.+?)\*\*\*/g, 'boldItalic');
        wrap(/\*\*(.+?)\*\*/g, 'bold');
        wrap(/\*([^\s*](?:[^*\n]*?[^\s*])?)\*/g, 'italic');
        wrap(/(?<!\w)_([^\s_](?:[^_\n]*?[^\s_])?)_/g, 'italic');
        return out;
    };

    s = format(s);
    s = s.replace(/\n/g, () => add({type: 'break'}));
    return resolve(s);
};

const firstLine = text => String(text || '')
    .split('\n')
    .find(visible) || '';

const onlyEmoji = tokens => tokens.length > 0 && tokens.every(token => (
    token.type === 'emoji' || (token.type === 'text' && !visible(token.text))
));

export {emojiImage, firstLine, hostUrl, onlyEmoji, parse};

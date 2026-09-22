const INVITE = 'mw.invite';
const INVITE_REPLY = 'mw.invite.reply';
const INVITE_CANCEL = 'mw.invite.cancel';
const ASK = 'mw.ask';
const ASK_REPLY = 'mw.ask.reply';
const HANDLED = 'mw.handled';

const INVITE_TTL = 2 * 60 * 1000;
const MAX_TITLE = 120;

const randomHex = bytes => {
    const values = new Uint8Array(bytes);
    crypto.getRandomValues(values);
    return Array.from(values, value => value.toString(16).padStart(2, '0')).join('');
};

const isId = value => typeof value === 'string' && /^[a-f0-9]{16,64}$/.test(value);
const isRoomId = value => typeof value === 'string' && value.length > 0 && value.length <= 64 &&
    value.trim() === value && Array.from(value).every(character => character.charCodeAt(0) >= 32);
const cleanTitle = value => (typeof value === 'string' ? value.trim().slice(0, MAX_TITLE) : '');

const makeInvite = ({roomId, key, projectTitle}) => ({
    t: INVITE,
    v: 1,
    id: randomHex(12),
    room: roomId,
    key,
    title: cleanTitle(projectTitle)
});

const makeAsk = ({projectTitle}) => ({
    t: ASK,
    v: 1,
    id: randomHex(12),
    title: cleanTitle(projectTitle)
});

const makeReply = (type, id, answer) => ({t: type, v: 1, id, answer});

const makeCancel = id => ({t: INVITE_CANCEL, v: 1, id});

const makeHandled = id => ({t: HANDLED, v: 1, id});

const readInvite = message => {
    if (!message || message.t !== INVITE || !isId(message.id) || !isRoomId(message.room) ||
        !isId(message.key)) return null;
    return {id: message.id, room: message.room, key: message.key, title: cleanTitle(message.title)};
};

const readAsk = message => {
    if (!message || message.t !== ASK || !isId(message.id)) return null;
    return {id: message.id, title: cleanTitle(message.title)};
};

const readReply = (message, type, answers) => {
    if (!message || message.t !== type || !isId(message.id) || !answers.includes(message.answer)) return null;
    return {id: message.id, answer: message.answer};
};

export {
    ASK,
    ASK_REPLY,
    HANDLED,
    INVITE,
    INVITE_CANCEL,
    INVITE_REPLY,
    INVITE_TTL,
    isId,
    makeAsk,
    makeCancel,
    makeHandled,
    makeInvite,
    makeReply,
    randomHex,
    readAsk,
    readInvite,
    readReply
};

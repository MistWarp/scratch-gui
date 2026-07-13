/**
 * Wire protocol for the collaboration engine.
 *
 * Every message exchanged between peers is a single JSON-serializable
 * "envelope". The host is the authority: client edits travel as `propose`
 * envelopes, the host assigns a sequence number and re-broadcasts them as
 * `op` envelopes which every client applies in strict `seq` order.
 *
 * `validateEnvelope` MUST be called on every inbound message before it is
 * dispatched; anything that fails validation is dropped. Never trust
 * `clientId` on inbound proposals — the transport-level peer id is
 * authoritative for who sent a message.
 */

const PROTOCOL_VERSION = 1;

const KIND = {
    OP: 'op',
    PROPOSE: 'propose',
    REJECT: 'reject',
    CTRL: 'ctrl',
    SNAPSHOT: 'snapshot',
    ASSET: 'asset',
    PRESENCE: 'presence'
};

// Sequenced operations (host-ordered). Used by both `op` and `propose`.
const OP = {
    BLOCK_EVENT: 'block-event',
    BLOCKS_SHARE: 'blocks-share',
    TARGET_UPDATE: 'target-update',
    SPRITE_ADD: 'sprite-add',
    SPRITE_DELETE: 'sprite-delete',
    SPRITE_RENAME: 'sprite-rename',
    SPRITE_REORDER: 'sprite-reorder',
    COSTUME_ADD: 'costume-add',
    COSTUME_DELETE: 'costume-delete',
    COSTUME_RENAME: 'costume-rename',
    COSTUME_SELECT: 'costume-select',
    COSTUME_REORDER: 'costume-reorder',
    COSTUME_DUPLICATE: 'costume-duplicate',
    COSTUME_UPDATE: 'costume-update',
    SOUND_ADD: 'sound-add',
    SOUND_DELETE: 'sound-delete',
    SOUND_RENAME: 'sound-rename',
    SOUND_REORDER: 'sound-reorder',
    SOUND_DUPLICATE: 'sound-duplicate',
    SOUND_UPDATE: 'sound-update',
    EXTENSION_LOAD: 'extension-load',
    EXTENSION_REMOVE: 'extension-remove',
    EXTENSION_REORDER: 'extension-reorder'
};

// Unsequenced control-plane messages.
const CTRL = {
    HELLO: 'hello',
    JOIN_REQUEST: 'join-request',
    JOIN_APPROVED: 'join-approved',
    JOIN_DENIED: 'join-denied',
    JOIN_CANCELLED: 'join-cancelled',
    USERS_LIST: 'users-list',
    USER_JOINED: 'user-joined',
    USER_LEFT: 'user-left',
    USERNAME_CHANGE: 'username-change',
    KICK: 'kick',
    PRIVACY_CHANGED: 'privacy-changed',
    OPS_REQUEST: 'ops-request',
    RESYNC_REQUIRED: 'resync-required',
    SESSION_READY: 'session-ready',
    HOST_LOADING_START: 'host-loading-start',
    HOST_LOADING_PROGRESS: 'host-loading-progress',
    HOST_LOADING_COMPLETE: 'host-loading-complete',
    PING: 'ping',
    PONG: 'pong'
};

const REJECT = {
    OP_REJECT: 'op-reject'
};

const SNAPSHOT = {
    REQUEST: 'snapshot-request',
    BEGIN: 'snapshot-begin',
    CHUNK: 'snapshot-chunk',
    ACK: 'snapshot-ack',
    COMPLETE: 'snapshot-complete'
};

const ASSET = {
    REQUEST: 'asset-request',
    BEGIN: 'asset-begin',
    CHUNK: 'asset-chunk'
};

const PRESENCE = {
    CURSOR: 'cursor',
    CURSOR_LEAVE: 'cursor-leave',
    CURSOR_CHAT: 'cursor-chat',
    EDITING_TARGET: 'editing-target'
};

const KIND_TYPES = {
    [KIND.OP]: new Set(Object.values(OP)),
    [KIND.PROPOSE]: new Set(Object.values(OP)),
    [KIND.REJECT]: new Set(Object.values(REJECT)),
    [KIND.CTRL]: new Set(Object.values(CTRL)),
    [KIND.SNAPSHOT]: new Set(Object.values(SNAPSHOT)),
    [KIND.ASSET]: new Set(Object.values(ASSET)),
    [KIND.PRESENCE]: new Set(Object.values(PRESENCE))
};

// Size caps. Generous but bounded — the goal is to stop a malicious or
// broken peer from wedging everyone else, not to be precise.
const LIMITS = {
    MAX_STRING: 1024,
    MAX_USERNAME: 60,
    MAX_ROOM_ID: 64,
    MAX_CHAT: 500,
    MAX_REASON: 200,
    MAX_ID: 128,
    MAX_XML: 1024 * 1024,
    MAX_DATA_URL: 8 * 1024 * 1024,
    MAX_CHUNK_BYTES: 256 * 1024,
    MAX_CHUNK_COUNT: 65536,
    MAX_TRANSFER_BYTES: 512 * 1024 * 1024,
    // A sprite-add carries one ref per costume and sound, so this has to
    // clear a realistically fat sprite, not just a costume or two.
    MAX_ASSET_REFS: 512,
    MAX_USERS: 128
};

const isPlainObject = value =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value);

const isNonEmptyString = (value, max) =>
    typeof value === 'string' && value.length > 0 && value.length <= max;

const isOptionalString = (value, max) =>
    typeof value === 'undefined' || (typeof value === 'string' && value.length <= max);

const isNonNegativeInt = value =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0;

const isFiniteNumber = value =>
    typeof value === 'number' && isFinite(value);

const isBinary = value =>
    value instanceof ArrayBuffer || ArrayBuffer.isView(value);

const binaryByteLength = value => (
    value instanceof ArrayBuffer ? value.byteLength : value.byteLength
);

const isChunkData = value => {
    if (isBinary(value)) return binaryByteLength(value) <= LIMITS.MAX_CHUNK_BYTES;
    // base64 expands ~4/3, allow the slack
    if (typeof value === 'string') return value.length <= Math.ceil(LIMITS.MAX_CHUNK_BYTES * 1.4);
    return false;
};

const isUserInfo = value =>
    isPlainObject(value) &&
    isNonEmptyString(value.id, LIMITS.MAX_ID) &&
    isNonEmptyString(value.username, LIMITS.MAX_USERNAME) &&
    isOptionalString(value.handle, LIMITS.MAX_USERNAME) &&
    typeof value.isHost === 'boolean';

const isMd5Ext = value =>
    typeof value === 'string' && /^[a-f0-9]{32}\.[a-z0-9]{1,10}$/i.test(value);

const isAssetRefs = value =>
    typeof value === 'undefined' || (
        Array.isArray(value) &&
        value.length <= LIMITS.MAX_ASSET_REFS &&
        value.every(isMd5Ext)
    );

/**
 * Per-type payload validators. Each returns an error string, or null when
 * the payload is acceptable. Types without an entry accept any plain object.
 */
const PAYLOAD_VALIDATORS = {
    [OP.BLOCK_EVENT]: payload => {
        if (!isPlainObject(payload.event)) return 'block-event requires an event object';
        if (!isNonEmptyString(payload.event.type, LIMITS.MAX_STRING)) return 'block event missing type';
        if (!isOptionalString(payload.event.xml, LIMITS.MAX_XML)) return 'block event xml too large';
        if (!isOptionalString(payload.targetId, LIMITS.MAX_ID)) return 'invalid targetId';
        return null;
    },
    [OP.TARGET_UPDATE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'target-update requires targetId';
        if (!isPlainObject(payload.props)) return 'target-update requires props object';
        const allowed = ['x', 'y', 'direction', 'size', 'visible', 'rotationStyle', 'draggable'];
        for (const key of Object.keys(payload.props)) {
            if (allowed.indexOf(key) === -1) return `target-update prop not allowed: ${key}`;
            const value = payload.props[key];
            const ok = key === 'visible' || key === 'draggable' ?
                typeof value === 'boolean' :
                key === 'rotationStyle' ?
                    isNonEmptyString(value, LIMITS.MAX_STRING) :
                    isFiniteNumber(value);
            if (!ok) return `target-update prop invalid: ${key}`;
        }
        return null;
    },
    [OP.SPRITE_ADD]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sprite-add requires targetId';
        if (!isPlainObject(payload.spriteJson) && !isNonEmptyString(payload.spriteJson, LIMITS.MAX_XML)) {
            return 'sprite-add requires spriteJson';
        }
        if (!isAssetRefs(payload.assetRefs)) return 'invalid assetRefs';
        return null;
    },
    [OP.SPRITE_DELETE]: payload =>
        (isNonEmptyString(payload.targetId, LIMITS.MAX_ID) ? null : 'sprite-delete requires targetId'),
    [OP.SPRITE_RENAME]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sprite-rename requires targetId';
        if (!isNonEmptyString(payload.name, LIMITS.MAX_STRING)) return 'sprite-rename requires name';
        return null;
    },
    [OP.SPRITE_REORDER]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sprite-reorder requires targetId';
        if (!isNonNegativeInt(payload.newIndex)) return 'sprite-reorder requires newIndex';
        return null;
    },
    [OP.COSTUME_ADD]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-add requires targetId';
        if (!isPlainObject(payload.costume)) return 'costume-add requires costume object';
        if (!isAssetRefs(payload.assetRefs)) return 'invalid assetRefs';
        return null;
    },
    [OP.COSTUME_DELETE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-delete requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'costume-delete requires index';
        return null;
    },
    [OP.COSTUME_RENAME]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-rename requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'costume-rename requires index';
        if (!isNonEmptyString(payload.name, LIMITS.MAX_STRING)) return 'costume-rename requires name';
        return null;
    },
    [OP.COSTUME_SELECT]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-select requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'costume-select requires index';
        return null;
    },
    [OP.COSTUME_REORDER]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-reorder requires targetId';
        if (!isNonNegativeInt(payload.oldIndex)) return 'costume-reorder requires oldIndex';
        if (!isNonNegativeInt(payload.newIndex)) return 'costume-reorder requires newIndex';
        return null;
    },
    [OP.SOUND_ADD]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sound-add requires targetId';
        if (!isPlainObject(payload.sound)) return 'sound-add requires sound object';
        if (!isAssetRefs(payload.assetRefs)) return 'invalid assetRefs';
        return null;
    },
    [OP.SOUND_DELETE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sound-delete requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'sound-delete requires index';
        return null;
    },
    [OP.SOUND_RENAME]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sound-rename requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'sound-rename requires index';
        if (!isNonEmptyString(payload.name, LIMITS.MAX_STRING)) return 'sound-rename requires name';
        return null;
    },
    [OP.SOUND_REORDER]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sound-reorder requires targetId';
        if (!isNonNegativeInt(payload.oldIndex)) return 'sound-reorder requires oldIndex';
        if (!isNonNegativeInt(payload.newIndex)) return 'sound-reorder requires newIndex';
        return null;
    },
    [OP.COSTUME_DUPLICATE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-duplicate requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'costume-duplicate requires index';
        return null;
    },
    [OP.SOUND_DUPLICATE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sound-duplicate requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'sound-duplicate requires index';
        return null;
    },
    [OP.COSTUME_UPDATE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'costume-update requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'costume-update requires index';
        if (typeof payload.isVector !== 'boolean') return 'costume-update requires isVector';
        if (payload.isVector) {
            if (!isNonEmptyString(payload.svg, LIMITS.MAX_DATA_URL)) return 'costume-update requires svg';
        } else if (!isNonEmptyString(payload.bitmapData, LIMITS.MAX_DATA_URL)) {
            return 'costume-update requires bitmapData';
        }
        return null;
    },
    [OP.SOUND_UPDATE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'sound-update requires targetId';
        if (!isNonNegativeInt(payload.index)) return 'sound-update requires index';
        if (!isPlainObject(payload.audioData)) return 'sound-update requires audioData';
        if (!isNonNegativeInt(payload.audioData.numberOfChannels) ||
            payload.audioData.numberOfChannels === 0 || payload.audioData.numberOfChannels > 8) {
            return 'sound-update invalid channel count';
        }
        if (!Array.isArray(payload.audioData.channels)) return 'sound-update requires channels';
        return null;
    },
    [OP.BLOCKS_SHARE]: payload => {
        if (!isNonEmptyString(payload.targetId, LIMITS.MAX_ID)) return 'blocks-share requires targetId';
        if (!isPlainObject(payload.blocks) && !Array.isArray(payload.blocks)) {
            return 'blocks-share requires blocks';
        }
        return null;
    },
    [OP.EXTENSION_LOAD]: payload =>
        (isNonEmptyString(payload.extensionId, LIMITS.MAX_STRING) ? null : 'extension-load requires extensionId'),
    [OP.EXTENSION_REMOVE]: payload =>
        (isNonEmptyString(payload.extensionId, LIMITS.MAX_STRING) ? null : 'extension-remove requires extensionId'),
    [OP.EXTENSION_REORDER]: payload => {
        if (!isNonEmptyString(payload.extensionId, LIMITS.MAX_STRING)) return 'extension-reorder requires extensionId';
        if (!isNonNegativeInt(payload.newIndex)) return 'extension-reorder requires newIndex';
        return null;
    },

    [REJECT.OP_REJECT]: payload => {
        if (!isNonNegativeInt(payload.clientOpId)) return 'op-reject requires clientOpId';
        if (!isOptionalString(payload.reason, LIMITS.MAX_REASON)) return 'op-reject reason too long';
        return null;
    },

    [CTRL.HELLO]: payload => {
        if (!isNonNegativeInt(payload.protocolVersion)) return 'hello requires protocolVersion';
        if (!isNonEmptyString(payload.username, LIMITS.MAX_USERNAME)) return 'hello requires username';
        if (!isOptionalString(payload.handle, LIMITS.MAX_USERNAME)) return 'hello handle must be a string';
        if (!isNonEmptyString(payload.roomId, LIMITS.MAX_ROOM_ID)) return 'hello requires roomId';
        if (typeof payload.lastAppliedSeq !== 'undefined' && !isNonNegativeInt(payload.lastAppliedSeq)) {
            return 'hello lastAppliedSeq must be a non-negative integer';
        }
        return null;
    },
    [CTRL.JOIN_REQUEST]: payload =>
        (isNonEmptyString(payload.username, LIMITS.MAX_USERNAME) ? null : 'join-request requires username'),
    [CTRL.JOIN_APPROVED]: payload => {
        if (!isNonEmptyString(payload.hostUsername, LIMITS.MAX_USERNAME)) return 'join-approved requires hostUsername';
        return null;
    },
    [CTRL.JOIN_DENIED]: payload =>
        (isOptionalString(payload.reason, LIMITS.MAX_REASON) ? null : 'join-denied reason too long'),
    [CTRL.USERS_LIST]: payload => {
        if (!Array.isArray(payload.users) || payload.users.length > LIMITS.MAX_USERS) {
            return 'users-list requires users array';
        }
        if (!payload.users.every(isUserInfo)) return 'users-list contains invalid user';
        return null;
    },
    [CTRL.USER_JOINED]: payload =>
        (isUserInfo(payload.user) ? null : 'user-joined requires user info'),
    [CTRL.USER_LEFT]: payload =>
        (isNonEmptyString(payload.id, LIMITS.MAX_ID) ? null : 'user-left requires id'),
    [CTRL.USERNAME_CHANGE]: payload =>
        (isNonEmptyString(payload.username, LIMITS.MAX_USERNAME) ? null : 'username-change requires username'),
    [CTRL.KICK]: payload =>
        (isOptionalString(payload.reason, LIMITS.MAX_REASON) ? null : 'kick reason too long'),
    [CTRL.PRIVACY_CHANGED]: payload =>
        (payload.privacy === 'public' || payload.privacy === 'private' ?
            null : 'privacy-changed requires public|private'),
    [CTRL.OPS_REQUEST]: payload =>
        (isNonNegativeInt(payload.fromSeq) ? null : 'ops-request requires fromSeq'),
    [CTRL.HOST_LOADING_PROGRESS]: payload =>
        (isFiniteNumber(payload.progress) ? null : 'host-loading-progress requires progress'),

    [SNAPSHOT.BEGIN]: payload => {
        if (!isNonEmptyString(payload.transferId, LIMITS.MAX_ID)) return 'snapshot-begin requires transferId';
        if (!isNonNegativeInt(payload.totalBytes) || payload.totalBytes > LIMITS.MAX_TRANSFER_BYTES) {
            return 'snapshot-begin invalid totalBytes';
        }
        if (!isNonNegativeInt(payload.chunkCount) || payload.chunkCount > LIMITS.MAX_CHUNK_COUNT) {
            return 'snapshot-begin invalid chunkCount';
        }
        if (!isNonNegativeInt(payload.atSeq)) return 'snapshot-begin requires atSeq';
        // sb3 files do not preserve target ids, so the sender shares its
        // name->id map and the receiver adopts those ids after loading.
        if (typeof payload.targetIds !== 'undefined') {
            if (!Array.isArray(payload.targetIds) || payload.targetIds.length > 1000) {
                return 'snapshot-begin invalid targetIds';
            }
            for (const entry of payload.targetIds) {
                if (!isPlainObject(entry) ||
                    !isNonEmptyString(entry.id, LIMITS.MAX_ID) ||
                    !isNonEmptyString(entry.name, LIMITS.MAX_STRING) ||
                    typeof entry.isStage !== 'boolean') {
                    return 'snapshot-begin invalid targetIds entry';
                }
            }
        }
        // sb3 files only record extensions whose blocks are used, so the
        // sender also shares its full loaded-extension list.
        if (typeof payload.extensions !== 'undefined') {
            if (!Array.isArray(payload.extensions) || payload.extensions.length > 64) {
                return 'snapshot-begin invalid extensions';
            }
            for (const entry of payload.extensions) {
                if (!isPlainObject(entry) ||
                    !isNonEmptyString(entry.id, LIMITS.MAX_STRING) ||
                    !isOptionalString(entry.url, LIMITS.MAX_STRING)) {
                    return 'snapshot-begin invalid extensions entry';
                }
            }
        }
        return null;
    },
    [SNAPSHOT.CHUNK]: payload => {
        if (!isNonEmptyString(payload.transferId, LIMITS.MAX_ID)) return 'snapshot-chunk requires transferId';
        if (!isNonNegativeInt(payload.index)) return 'snapshot-chunk requires index';
        if (!isChunkData(payload.data)) return 'snapshot-chunk invalid data';
        return null;
    },
    [SNAPSHOT.ACK]: payload => {
        if (!isNonEmptyString(payload.transferId, LIMITS.MAX_ID)) return 'snapshot-ack requires transferId';
        if (!isNonNegativeInt(payload.index)) return 'snapshot-ack requires index';
        return null;
    },
    [SNAPSHOT.COMPLETE]: payload =>
        (isNonEmptyString(payload.transferId, LIMITS.MAX_ID) ? null : 'snapshot-complete requires transferId'),

    [ASSET.REQUEST]: payload => {
        if (!Array.isArray(payload.md5exts) || payload.md5exts.length === 0 ||
            payload.md5exts.length > LIMITS.MAX_ASSET_REFS) {
            return 'asset-request requires md5exts array';
        }
        if (!payload.md5exts.every(isMd5Ext)) return 'asset-request contains invalid md5ext';
        return null;
    },
    [ASSET.BEGIN]: payload => {
        if (!isMd5Ext(payload.md5ext)) return 'asset-begin requires md5ext';
        if (!isNonNegativeInt(payload.totalBytes) || payload.totalBytes > LIMITS.MAX_TRANSFER_BYTES) {
            return 'asset-begin invalid totalBytes';
        }
        if (!isNonNegativeInt(payload.chunkCount) || payload.chunkCount > LIMITS.MAX_CHUNK_COUNT) {
            return 'asset-begin invalid chunkCount';
        }
        return null;
    },
    [ASSET.CHUNK]: payload => {
        if (!isMd5Ext(payload.md5ext)) return 'asset-chunk requires md5ext';
        if (!isNonNegativeInt(payload.index)) return 'asset-chunk requires index';
        if (!isChunkData(payload.data)) return 'asset-chunk invalid data';
        return null;
    },

    [PRESENCE.CURSOR]: payload => {
        if (!isFiniteNumber(payload.x) || !isFiniteNumber(payload.y)) return 'cursor requires x/y';
        if (!isOptionalString(payload.targetId, LIMITS.MAX_ID)) return 'cursor invalid targetId';
        if (!isOptionalString(payload.targetName, LIMITS.MAX_STRING)) return 'cursor invalid targetName';
        return null;
    },
    [PRESENCE.CURSOR_CHAT]: payload =>
        // Missing/empty text clears the remote chat bubble.
        (isOptionalString(payload.text, LIMITS.MAX_CHAT) ? null : 'cursor-chat text too long'),
    // Where a peer is working: which sprite, which tab, and which costume or
    // sound within that tab. Peers on older builds send targetId alone.
    [PRESENCE.EDITING_TARGET]: payload => {
        if (!isOptionalString(payload.targetId, LIMITS.MAX_ID)) return 'editing-target invalid targetId';
        if (typeof payload.tab !== 'undefined' && !isNonNegativeInt(payload.tab)) {
            return 'editing-target invalid tab';
        }
        if (typeof payload.assetIndex !== 'undefined' && !isNonNegativeInt(payload.assetIndex)) {
            return 'editing-target invalid assetIndex';
        }
        return null;
    }
};

/**
 * Validate an inbound envelope.
 * @param {object} envelope The decoded message.
 * @returns {string|null} An error string when invalid, null when valid.
 */
const validateEnvelope = envelope => {
    if (!isPlainObject(envelope)) return 'envelope is not an object';
    if (envelope.v !== PROTOCOL_VERSION) return `unsupported protocol version: ${envelope.v}`;
    const types = KIND_TYPES[envelope.kind];
    if (!types) return `unknown kind: ${envelope.kind}`;
    if (!types.has(envelope.type)) return `unknown type for ${envelope.kind}: ${envelope.type}`;
    if (!isPlainObject(envelope.payload)) return 'payload is not an object';

    if (envelope.kind === KIND.OP) {
        if (!isNonNegativeInt(envelope.seq)) return 'op requires seq';
        if (!isNonEmptyString(envelope.clientId, LIMITS.MAX_ID)) return 'op requires clientId';
        if (!isNonNegativeInt(envelope.clientOpId)) return 'op requires clientOpId';
    }
    if (envelope.kind === KIND.PROPOSE) {
        if (!isNonNegativeInt(envelope.clientOpId)) return 'propose requires clientOpId';
    }

    const validator = PAYLOAD_VALIDATORS[envelope.type];
    if (validator) {
        const error = validator(envelope.payload);
        if (error) return error;
    }
    return null;
};

const makeEnvelope = (kind, type, payload, extra) => Object.assign({
    v: PROTOCOL_VERSION,
    kind,
    type,
    ts: Date.now(),
    payload: payload || {}
}, extra);

const makeOp = (type, payload, {seq, clientId, clientOpId}) =>
    makeEnvelope(KIND.OP, type, payload, {seq, clientId, clientOpId});

const makePropose = (type, payload, clientOpId) =>
    makeEnvelope(KIND.PROPOSE, type, payload, {clientOpId});

const makeReject = (clientOpId, reason) =>
    makeEnvelope(KIND.REJECT, REJECT.OP_REJECT, {clientOpId, reason});

const makeCtrl = (type, payload) => makeEnvelope(KIND.CTRL, type, payload);

const makeSnapshot = (type, payload) => makeEnvelope(KIND.SNAPSHOT, type, payload);

const makeAsset = (type, payload) => makeEnvelope(KIND.ASSET, type, payload);

const makePresence = (type, payload) => makeEnvelope(KIND.PRESENCE, type, payload);

export {
    PROTOCOL_VERSION,
    KIND,
    OP,
    CTRL,
    REJECT,
    SNAPSHOT,
    ASSET,
    PRESENCE,
    LIMITS,
    validateEnvelope,
    makeEnvelope,
    makeOp,
    makePropose,
    makeReject,
    makeCtrl,
    makeSnapshot,
    makeAsset,
    makePresence
};

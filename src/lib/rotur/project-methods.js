// The only Rotur SDK methods a project may reach through a Rotur host (the
// editor, the community project page and packaged exports). Each entry lists
// the scopes that cover it (any one is enough; an empty list means it needs no
// grant) and, for actions that give away or destroy something, the
// confirmation the host shows before every call. Nothing here spends credits:
// projects can't.
//
// The host decides all of this. Nothing the project sends (labels,
// confirmation text, a "sensitive" flag, a project name) is trusted, because a
// custom extension running next to the project can send any message it likes.
// Never resolve a method path that is not a key of this table.

const text = value => String(typeof value === 'undefined' || value === null ? '' : value).slice(0, 200);

const PROJECT_METHODS = Object.freeze({
    'me.abilities': {scopes: []},
    'me.checkAuth': {scopes: ['account:view']},
    'me.get': {scopes: ['account:view']},
    'me.badges': {scopes: ['account:view']},
    'me.subscription': {scopes: ['account:view']},
    'me.blocked': {scopes: ['blocked:view']},
    'me.block': {scopes: ['blocked:manage']},
    'me.unblock': {scopes: ['blocked:manage']},

    'profiles.get': {scopes: []},
    'profiles.exists': {scopes: []},
    'avatars.url': {scopes: []},
    'standing.get': {scopes: []},
    'accounts.bannedCheck': {scopes: []},
    'notifications.list': {scopes: ['notifications:view']},

    'gifts.get': {scopes: []},
    'gifts.claim': {
        scopes: ['gifts:claim'],
        confirm: args => ({label: `claim gift code ${text(args[0])}`})
    },
    'gifts.cancel': {scopes: ['gifts:cancel']},
    'gifts.mine': {scopes: ['gifts:view']},
    'stats.economy': {scopes: []},
    'stats.mostGained': {scopes: []},

    'keys.mine': {scopes: ['keys:view']},
    'keys.get': {scopes: []},
    'keys.check': {scopes: []},
    'keys.cancel': {
        scopes: ['keys:manage'],
        confirm: args => ({label: `cancel your subscription to key ${text(args[0])}`})
    },
    'keys.rename': {scopes: ['keys:manage']},
    'keys.update': {scopes: ['keys:manage']},
    'keys.revoke': {scopes: ['keys:manage']},
    'keys.delete': {
        scopes: ['keys:manage'],
        confirm: args => ({label: `delete key ${text(args[0])}`})
    },
    'storage.get': {scopes: ['storage:view'], projectStorage: true},
    'storage.set': {scopes: ['storage:manage'], projectStorage: true},
    'storage.delete': {scopes: ['storage:delete'], projectStorage: true},

    'status.get': {scopes: []},
    'socket.setStatus': {scopes: ['status:update'], activity: true},
    'socket.addActivity': {scopes: ['status:update'], activity: true},
    'socket.removeActivity': {scopes: ['status:update'], activity: true},

    'posts.create': {scopes: ['posts:create']},
    'posts.feed': {scopes: []},
    'posts.followingFeed': {scopes: ['posts:view']},
    'posts.top': {scopes: []},
    'posts.search': {scopes: []},
    'posts.like': {scopes: ['posts:like']},
    'posts.unlike': {scopes: ['posts:like']},
    'posts.reply': {scopes: ['posts:reply']},
    'posts.repost': {scopes: ['posts:repost']},
    'posts.delete': {
        scopes: ['posts:delete'],
        confirm: args => ({label: `delete post ${text(args[0])}`})
    },
    'following.follow': {scopes: ['following:follow']},
    'following.unfollow': {scopes: ['following:unfollow']},
    'following.followers': {scopes: []},
    'following.following': {scopes: []},
    'friends.list': {scopes: ['friends:view']},
    'friends.requests': {scopes: ['friends:view']},
    'friends.request': {scopes: ['friends:request']},
    'friends.accept': {scopes: ['friends:accept']},
    'friends.reject': {scopes: ['friends:accept']},
    'friends.remove': {scopes: ['friends:remove']},

    'items.get': {scopes: []},
    'items.selling': {scopes: []},
    'items.list': {scopes: []},
    'items.sell': {scopes: ['items:sell']},
    'items.stopSelling': {scopes: ['items:sell']},
    'items.setPrice': {scopes: ['items:manage']},
    'items.transfer': {
        scopes: ['items:manage'],
        confirm: args => ({label: `give item ${text(args[0])} to @${text(args[1])}`})
    },
    'cosmetics.shop': {scopes: []},
    'cosmetics.mine': {scopes: ['cosmetics:view']},
    'cosmetics.equip': {scopes: ['cosmetics:equip']},
    'cosmetics.unequip': {scopes: ['cosmetics:equip']},
    'cosmetics.forUser': {scopes: []},

    'groups.mine': {scopes: ['groups:view']},
    'groups.search': {scopes: ['groups:view']},
    'groups.get': {scopes: []},
    'groups.join': {scopes: ['groups:join']},
    'groups.requestJoin': {scopes: ['groups:join']},
    'groups.leave': {scopes: ['groups:leave']},
    'groups.members': {scopes: ['groups:members.view']},
    'groups.roles': {scopes: ['groups:view']},
    'groups.announcements': {scopes: []},
    'groups.events': {scopes: ['groups:view']},
    'groups.products': {scopes: ['groups:view']},

    // Projects only reach MistWarp's own Origin FS folder, never the whole drive.
    'files.index': {scopes: ['files:app']},
    'files.getByPath': {scopes: ['files:app']},
    'files.getByUUID': {scopes: ['files:app']},
    'files.usage': {scopes: ['files:app']}
});

const has = (object, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(object, key);

/**
 * @param {string} method Dotted SDK method name sent by a project.
 * @returns {object|null} The allowlist entry, or null if projects may not call it.
 */
const projectMethod = method => (has(PROJECT_METHODS, method) ? PROJECT_METHODS[method] : null);

const WHOLE_DRIVE_SCOPES = ['files:view', 'files:manage', 'files:delete'];

// Every scope some project block can use. A project may only ask for these.
const PROJECT_SCOPES = new Set(Object.values(PROJECT_METHODS).flatMap(spec => spec.scopes));

// Scopes whose only methods ask for confirmation on every call, so granting
// the scope by itself lets the project do nothing without asking again.
const CONFIRMED_ONLY_SCOPES = new Set([...PROJECT_SCOPES].filter(scope => {
    const users = Object.values(PROJECT_METHODS).filter(spec => spec.scopes.includes(scope));
    return users.every(spec => spec.confirm);
}));

/**
 * Whether a set of requested scopes can be granted without a consent prompt:
 * read-only scopes, and scopes whose every use is confirmed per call.
 * @param {string[]} scopes Requested scopes, all known project scopes.
 * @returns {boolean} True to grant silently.
 */
const grantsSilently = scopes => scopes.every(scope => scope.endsWith(':view') || CONFIRMED_ONLY_SCOPES.has(scope));

/**
 * Validate a scope request from a project.
 * @param {unknown} scopes Whatever the project sent.
 * @returns {string[]|null} The scopes, or null if any is not a project scope.
 */
const validateProjectScopes = scopes => {
    if (!Array.isArray(scopes)) return null;
    // Older projects ask for the whole drive; they get MistWarp's folder.
    const list = [...new Set(scopes.map(scope => (WHOLE_DRIVE_SCOPES.includes(scope) ? 'files:app' : scope)))];
    return list.every(scope => typeof scope === 'string' && PROJECT_SCOPES.has(scope)) ? list : null;
};

/**
 * Check a call from a project against the allowlist and the project's grant.
 * @param {string} method Dotted SDK method name.
 * @param {unknown} args Arguments the project sent.
 * @param {string[]} granted Scopes this project has been granted.
 * @param {string} storageId The project's own storage id, chosen by the host.
 * @returns {object} What to run: {spec, args, confirm}.
 */
const authorizeProjectCall = (method, args, granted, storageId) => {
    const spec = projectMethod(method);
    if (!spec) {
        throw new Error(`Projects cannot call Rotur method: ${String(method).slice(0, 80)}`);
    }
    let list = Array.isArray(args) ? args.slice(0, 8) : [];
    if (spec.scopes.length && !spec.confirm && !spec.scopes.some(scope => granted.includes(scope))) {
        throw new Error('Rotur access was not granted for this project');
    }
    if (spec.projectStorage) {
        // A project only ever reaches its own storage bag.
        list = [storageId || 'mistwarp', ...list.slice(1)];
    }
    return {spec, args: list, confirm: spec.confirm ? spec.confirm(list) : null};
};

const OFS_HOME = 'origin/(c) users/';

const outsideFolder = root => new Error(`Projects can only read files in MistWarp's folder${root ? `, ${root}` : ''}`);

// Rotur's folder for the signed-in account, read once per token from the path
// index. A failed read isn't kept, so the next call tries again.
const appFolders = new WeakMap();
const appFolder = client => {
    const cached = appFolders.get(client);
    if (cached && cached.token === client.token) return cached.folder;
    const folder = client.files.pathIndex().then(index => {
        const {root, username} = index || {};
        if (typeof root !== 'string' || !root || !username) {
            throw new Error('Rotur did not give this project a folder of its own');
        }
        const name = root.replace(/\/+$/, '').toLowerCase();
        return {root, name, base: `${OFS_HOME}${String(username).toLowerCase()}${name}`};
    });
    appFolders.set(client, {token: client.token, folder});
    folder.catch(() => {
        if (appFolders.get(client) && appFolders.get(client).folder === folder) appFolders.delete(client);
    });
    return folder;
};

/**
 * Turn a path a project gave into the Origin FS path Rotur indexes, inside
 * MistWarp's own folder. Rotur picks the folder (/application data/<app>@<creator>)
 * and says which in the path index. "/save.txt", "save.txt", the folder's own
 * "/application data/..." path and the full "origin/(c) users/..." path all work.
 * @param {object} client Rotur SDK client.
 * @param {unknown} path What the project asked for.
 * @returns {Promise<string>} The full, lower-case path.
 */
const appFilePath = async (client, path) => {
    const asked = String(path || '').trim()
        .toLowerCase();
    // Bad segments are refused before Rotur is asked anything.
    const parts = asked.replace(/^\/+/, '').split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || part.includes('\\'))) {
        throw outsideFolder('');
    }
    const {root, name, base} = await appFolder(client);
    const relative = asked.startsWith(`${name}/`) ? asked.slice(name.length) : asked;
    const full = relative.startsWith(OFS_HOME) ? relative : `${base}/${relative.replace(/^\/+/, '')}`;
    if (!full.startsWith(`${base}/`)) throw outsideFolder(root);
    return full;
};

const SECRET_FIELDS = new Set(['key', 'token', 'access_token', 'refresh_token', 'accesstoken', 'refreshtoken',
    'password', 'validator', 'code', 'webhook']);
const SENSITIVE_FIELD = new RegExp([
    'token', 'secret', 'passw', 'email', 'reset', 'verif', 'login', 'hmac', 'stripe', 'billing', 'session',
    'webhook', 'recovery', 'totp', 'phone', 'birth', '^dob$', '(^|[._])(ip|ips|last_ip)$'
].join('|'), 'i');
const PROJECT_SYSTEM_FIELDS = new Set([
    'sys.id', 'sys.index', 'sys.badges', 'sys.banner', 'sys.banner_unlocked', 'sys.banner_updated_at',
    'sys.overlay', 'sys.social_links', 'sys.group', 'sys.status', 'sys.subscription', 'sys.moderator',
    'sys.admin', 'sys.banned', 'sys.account_type', 'sys.tos_accepted', 'sys.email_verified',
    'sys.terms_updated', 'sys.policy_updated', 'sys.friends', 'sys.requests', 'sys.blocked', 'sys.currency',
    'sys.sable_credits', 'sys.items'
]);
const ALLOWED_FIELDS = new Set(['next_billing', 'token_type', 'sys.email_verified', 'discord_verified']);
const HIDDEN_PROFILE_FIELDS = new Set(['email', 'sexuality', 'identity', 'nationality', 'birthday', 'age',
    'relationship_status', 'timezone', 'language', 'favorite_website']);
const METHOD_SECRET_FIELDS = {
    'gifts.mine': new Set(['code']),
    'gifts.get': new Set(['code']),
    'keys.get': new Set(['webhook']),
    'keys.mine': new Set(['webhook']),
    'items.get': new Set(['private_data']),
    'items.list': new Set(['private_data']),
    'items.selling': new Set(['private_data'])
};

const subscriptionSummary = value => (value && typeof value === 'object' && !Array.isArray(value) ? {
    active: value.active,
    tier: value.tier,
    next_billing: value.next_billing
} : value);

const tokenVariants = tokens => {
    const variants = new Set();
    for (const token of tokens) {
        if (typeof token !== 'string' || token.length < 8) continue;
        variants.add(token);
        variants.add(encodeURIComponent(token));
    }
    return [...variants];
};

const scrubString = (value, secrets) => (secrets.some(secret => value.includes(secret)) ? null : value);

const withoutSecrets = (value, rules, ancestors = new Set(), depth = 0) => {
    if (typeof value === 'string') return scrubString(value, rules.secrets);
    if (!value || typeof value !== 'object') return value;
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Date) return value;
    if (ancestors.has(value)) return null;
    ancestors.add(value);
    let clean;
    if (Array.isArray(value)) {
        clean = value.map(item => withoutSecrets(item, rules, ancestors, depth + 1));
    } else {
        clean = {};
        for (const [field, item] of Object.entries(value)) {
            const lower = field.toLowerCase();
            if (scrubString(field, rules.secrets) === null) continue;
            if (rules.fields && rules.fields.has(lower)) continue;
            if (rules.account && !ALLOWED_FIELDS.has(lower) &&
                (SECRET_FIELDS.has(lower) || SENSITIVE_FIELD.test(lower))) continue;
            if (rules.account && depth === 0 && (HIDDEN_PROFILE_FIELDS.has(lower) ||
                (lower.startsWith('sys.') && !PROJECT_SYSTEM_FIELDS.has(lower)))) continue;
            const summarise = rules.account && depth === 0 && lower === 'sys.subscription';
            const kept = summarise ? subscriptionSummary(item) : item;
            Object.defineProperty(clean, field, {
                value: withoutSecrets(kept, rules, ancestors, depth + 1),
                enumerable: true,
                writable: true,
                configurable: true
            });
        }
    }
    ancestors.delete(value);
    return clean;
};

const projectSafeResult = (method, result, tokens) => withoutSecrets(result, {
    secrets: tokenVariants(tokens),
    account: method.startsWith('me.') || method.startsWith('profiles.'),
    fields: METHOD_SECRET_FIELDS[method] || null
});

const projectSafeError = (error, tokens) => {
    const message = String((error && error.message) || error || 'The Rotur request failed');
    const safe = new Error(scrubString(message, tokenVariants(tokens)) === null ?
        'The Rotur request failed' : message.slice(0, 300));
    if (error && typeof error.status === 'number') safe.status = error.status;
    return safe;
};

/**
 * Run an allowlisted method on a Rotur client. The path is a key of the
 * allowlist, never something taken straight from a project. Results and
 * errors are filtered so no credential reaches the project.
 * @param {object} client A rotur-sdk Rotur instance.
 * @param {string} method An allowlisted method name.
 * @param {Array} args Arguments.
 * @returns {Promise<unknown>} The filtered SDK result.
 */
const invokeProjectMethod = async (client, method, args) => {
    if (!projectMethod(method)) {
        throw new Error(`Projects cannot call Rotur method: ${String(method).slice(0, 80)}`);
    }
    const [namespace, name] = method.split('.');
    if (namespace === 'socket' && (!client.socket || !client.socket.connected)) {
        try {
            await client.connectSocket();
        } catch (error) {
            throw projectSafeError(error, [client.token]);
        }
    }
    const owner = namespace === 'socket' ? client.socket : client[namespace];
    const fn = owner && owner[name];
    if (typeof fn !== 'function') {
        throw new Error(`Rotur method is unavailable: ${method}`);
    }
    const tokenBefore = client.token;
    let result;
    try {
        result = method === 'files.getByPath' ?
            await fn.call(owner, await appFilePath(client, args[0])) :
            await fn.apply(owner, args);
    } catch (error) {
        throw projectSafeError(error, [tokenBefore, client.token]);
    }
    return projectSafeResult(method, result, [tokenBefore, client.token]);
};

export {
    PROJECT_METHODS,
    PROJECT_SCOPES,
    projectMethod,
    grantsSilently,
    validateProjectScopes,
    authorizeProjectCall,
    invokeProjectMethod,
    projectSafeResult,
    appFilePath
};

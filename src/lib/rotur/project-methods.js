// The only Rotur SDK methods a project may reach through a Rotur host (the
// editor, the community project page and packaged exports). Each entry lists
// the scopes that cover it (any one is enough; an empty list means it needs no
// grant) and, for actions that spend, give away or destroy something, the
// confirmation the host shows before every call.
//
// The host decides all of this. Nothing the project sends (labels,
// confirmation text, a "sensitive" flag, a project name) is trusted, because a
// custom extension running next to the project can send any message it likes.
// Never resolve a method path that is not a key of this table.

const text = value => String(typeof value === 'undefined' || value === null ? '' : value).slice(0, 200);
const amount = value => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const PROJECT_METHODS = Object.freeze({
    'me.abilities': {scopes: []},
    'me.checkAuth': {scopes: []},
    'me.get': {scopes: ['account:view', 'credits:view']},
    'me.badges': {scopes: ['account:view']},
    'me.subscription': {scopes: ['account:view']},
    'me.blocked': {scopes: ['blocked:view']},
    'me.block': {scopes: ['blocked:manage']},
    'me.unblock': {scopes: ['blocked:manage']},
    'me.requests': {scopes: ['friends:view']},
    'me.claimTime': {scopes: ['credits:view']},
    'me.transactions': {scopes: ['credits:view']},

    'profiles.get': {scopes: []},
    'profiles.exists': {scopes: []},
    'profiles.getAvatarUrl': {scopes: []},
    'standing.get': {scopes: []},
    'check.banned': {scopes: []},
    'notifications.list': {scopes: ['notifications:view']},

    'gifts.create': {
        scopes: ['gifts:create'],
        confirm: args => ({label: `create a gift of ${amount(args[0])} credits`})
    },
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
    'keys.buy': {
        scopes: [],
        confirm: args => ({label: `buy key ${text(args[0])}`})
    },
    'keys.cancel': {
        scopes: [],
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
    'socket.setStatus': {scopes: ['account:profile'], activity: true},
    'socket.addActivity': {scopes: ['account:profile'], activity: true},
    'socket.removeActivity': {scopes: ['account:profile'], activity: true},

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
    'friends.request': {scopes: ['friends:request']},
    'friends.accept': {scopes: ['friends:accept']},
    'friends.reject': {scopes: ['friends:accept']},
    'friends.remove': {scopes: ['friends:remove']},

    'items.get': {scopes: []},
    'items.selling': {scopes: []},
    'items.list': {scopes: []},
    'items.buy': {
        scopes: ['items:buy'],
        confirm: args => ({label: `buy item ${text(args[0])}`})
    },
    'items.sell': {scopes: ['items:sell']},
    'items.stopSelling': {scopes: ['items:sell']},
    'items.setPrice': {scopes: ['items:sell']},
    'items.transfer': {
        scopes: ['items:manage'],
        confirm: args => ({label: `give item ${text(args[0])} to @${text(args[1])}`})
    },
    'cosmetics.shop': {scopes: []},
    'cosmetics.mine': {scopes: ['cosmetics:view']},
    'cosmetics.purchase': {
        scopes: ['cosmetics:buy'],
        confirm: args => ({label: `buy cosmetic ${text(args[0])}`})
    },
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
    'groups.sendTip': {
        scopes: ['credits:manage'],
        confirm: args => ({label: `tip ${amount(args[1])} credits to group ${text(args[0])}`})
    },
    'groups.purchaseProduct': {
        scopes: ['credits:manage'],
        confirm: args => ({label: `buy product ${text(args[1])} in group ${text(args[0])}`})
    },

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

// Every scope some project block can use. A project may only ask for these.
const WHOLE_DRIVE_SCOPES = ['files:view', 'files:manage', 'files:delete'];

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

/**
 * Run an allowlisted method on a Rotur client. The path is a key of the
 * allowlist, never something taken straight from a project.
 * @param {object} client A rotur-sdk Rotur instance.
 * @param {string} method An allowlisted method name.
 * @param {Array} args Arguments.
 * @returns {Promise<unknown>} The SDK result.
 */
const OFS_HOME = 'origin/(c) users/';

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
    const {root, username} = await client.files.pathIndex();
    if (typeof root !== 'string' || !root || !username) {
        throw new Error('Rotur did not give this project a folder of its own');
    }
    const folder = root.replace(/\/+$/, '').toLowerCase();
    const base = `${OFS_HOME}${String(username).toLowerCase()}${folder}`;
    let asked = String(path || '').trim()
        .toLowerCase();
    if (asked.startsWith(`${folder}/`)) asked = asked.slice(folder.length);
    const full = asked.startsWith(OFS_HOME) ? asked : `${base}/${asked.replace(/^\/+/, '')}`;
    const inside = full.startsWith(`${base}/`) &&
        full.slice(base.length + 1).split('/')
            .every(part => part && part !== '.' && part !== '..' && !part.includes('\\'));
    if (!inside) {
        throw new Error(`Projects can only read files in MistWarp's folder, ${root}`);
    }
    return full;
};

const invokeProjectMethod = async (client, method, args) => {
    if (!projectMethod(method)) {
        throw new Error(`Projects cannot call Rotur method: ${String(method).slice(0, 80)}`);
    }
    const [namespace, name] = method.split('.');
    if (namespace === 'socket' && (!client.socket || !client.socket.connected)) {
        await client.connectSocket();
    }
    const owner = namespace === 'socket' ? client.socket : client[namespace];
    const fn = owner && owner[name];
    if (typeof fn !== 'function') {
        throw new Error(`Rotur method is unavailable: ${method}`);
    }
    if (method === 'files.getByPath') {
        return fn.call(owner, await appFilePath(client, args[0]));
    }
    return fn.apply(owner, args);
};

export {
    PROJECT_METHODS,
    PROJECT_SCOPES,
    projectMethod,
    grantsSilently,
    validateProjectScopes,
    authorizeProjectCall,
    invokeProjectMethod,
    appFilePath
};

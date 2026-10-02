import {Rotur} from 'rotur-sdk';
import {
    PROJECT_METHODS,
    authorizeProjectCall,
    grantsSilently,
    invokeProjectMethod,
    projectMethod,
    validateProjectScopes
} from '../../src/lib/rotur/project-methods.js';

const roturExtensions = require('scratch-vm/src/extensions/rotur/index.js');

// Run every block of every built-in Rotur extension against a recording host,
// so the allowlist is checked against what the extensions really send.
const recordExtensionCalls = async () => {
    const calls = [];
    for (const Extension of Object.values(roturExtensions)) {
        let consented = [];
        const host = {
            whenReady: () => Promise.resolve(),
            getUser: () => ({loggedIn: true, username: 'player', id: '1'}),
            projectId: () => 'project-1',
            projectName: () => 'Project',
            projectImage: () => '',
            ensureConsent: scopes => {
                consented = scopes;
                return Promise.resolve(true);
            },
            call: (method, args, opts) => {
                calls.push({method, args, opts, scopes: consented});
                return Promise.resolve({});
            }
        };
        const runtime = {roturHost: host, targets: []};
        const extension = new Extension(runtime);
        for (const block of extension.getInfo().blocks) {
            if (!block.opcode) continue;
            const args = Object.fromEntries(Object.entries(block.arguments)
                .map(([name, arg]) => [name, arg.defaultValue]));
            consented = [];
            await extension[block.opcode](args);
        }
    }
    return calls;
};

test('every method the built-in Rotur extensions call is allowlisted with its scope', async () => {
    const calls = await recordExtensionCalls();
    expect(calls.length).toBeGreaterThan(80);
    for (const {method, opts, scopes} of calls) {
        // The "send credits" block: projects can't send credits any more.
        if (method === 'me.transfer') continue;
        const spec = projectMethod(method);
        expect({method, allowed: Boolean(spec)}).toEqual({method, allowed: true});
        for (const scope of scopes) {
            expect({method, scope, covered: spec.scopes.includes(scope)})
                .toEqual({method, scope, covered: true});
        }
        if (opts && opts.sensitive) {
            expect({method, confirmed: Boolean(spec.confirm)}).toEqual({method, confirmed: true});
        }
    }
    const used = new Set(calls.map(call => call.method));
    expect(Object.keys(PROJECT_METHODS).filter(method => !used.has(method))).toEqual([]);
});

test.each([
    '_http.getToken',
    '_http.post',
    'constructor',
    'constructor.constructor',
    '__proto__.toString',
    'toString',
    'hasOwnProperty',
    'setToken',
    'logout',
    'tokens.create',
    'tokens.list',
    'validators.generate',
    'signing.sign',
    'me.deleteAccount',
    'me.update',
    'admin.transferCredits',
    'me.transfer',
    'me.transfer.call',
    'socket.token',
    'socket.send',
    ''
])('rejects %j', method => {
    expect(projectMethod(method)).toBeNull();
    expect(() => authorizeProjectCall(method, [], ['credits:transfer'], 'project-1'))
        .toThrow('Projects cannot call Rotur method');
});

test('rejects non-string method names', () => {
    for (const method of [null, undefined, 1, {}, ['me', 'get']]) {
        expect(() => authorizeProjectCall(method, [], [], 'project-1')).toThrow('Projects cannot call');
    }
});

test('the token is never reachable through the dispatcher', async () => {
    const client = new Rotur({token: 'rotur_secret-token'});
    await expect(invokeProjectMethod(client, '_http.getToken', [])).rejects.toThrow('Projects cannot call');
    await expect(invokeProjectMethod(client, 'socket.token', [])).rejects.toThrow('Projects cannot call');
});

test('a scoped method needs a grant for one of its scopes', () => {
    expect(() => authorizeProjectCall('posts.create', ['hi'], [], 'p')).toThrow('not granted');
    expect(() => authorizeProjectCall('posts.create', ['hi'], ['posts:like'], 'p')).toThrow('not granted');
    expect(authorizeProjectCall('posts.create', ['hi'], ['posts:create'], 'p').args).toEqual(['hi']);
    expect(authorizeProjectCall('me.get', [], ['credits:view'], 'p').confirm).toBeNull();
    expect(authorizeProjectCall('profiles.get', ['someone'], [], 'p').args).toEqual(['someone']);
});

test('spending methods are confirmed with text the host builds from the arguments', () => {
    expect(authorizeProjectCall('gifts.create', ['999'], [], 'p').confirm.label)
        .toBe('create a gift of 999 credits');
    expect(authorizeProjectCall('groups.sendTip', ['tag', '5'], [], 'p').confirm.label)
        .toBe('tip 5 credits to group tag');
    for (const method of [
        'gifts.create', 'gifts.claim', 'keys.buy', 'keys.cancel', 'keys.delete',
        'posts.delete', 'items.buy', 'items.transfer', 'cosmetics.purchase',
        'groups.sendTip', 'groups.purchaseProduct'
    ]) {
        expect({method, confirm: Boolean(projectMethod(method).confirm)}).toEqual({method, confirm: true});
    }
});

test('project storage always uses the host project id', () => {
    expect(authorizeProjectCall('storage.get', ['other-project'], ['storage:view'], 'mine').args)
        .toEqual(['mine']);
    expect(authorizeProjectCall('storage.set', ['other-project', 'k', 'v'], ['storage:manage'], 'mine').args)
        .toEqual(['mine', 'k', 'v']);
    expect(authorizeProjectCall('storage.delete', ['x', 'k'], ['storage:delete'], '').args)
        .toEqual(['mistwarp', 'k']);
});

test('projects may only ask for scopes their blocks can use', () => {
    expect(validateProjectScopes(['posts:create', 'posts:create', 'credits:view']))
        .toEqual(['posts:create', 'credits:view']);
    for (const scope of ['tokens:manage', 'account:delete', 'signing:private', 'account:settings',
        'validators:generate', 'full', 'constructor', 7]) {
        expect(validateProjectScopes(['posts:create', scope])).toBeNull();
    }
    expect(validateProjectScopes('posts:create')).toBeNull();
});

test('only read scopes and per-call-confirmed scopes are granted without asking', () => {
    expect(grantsSilently(['credits:view', 'account:view'])).toBe(true);
    expect(grantsSilently(['gifts:create'])).toBe(true);
    expect(grantsSilently(['posts:delete'])).toBe(true);
    expect(grantsSilently(['posts:create'])).toBe(false);
    expect(grantsSilently(['keys:manage'])).toBe(false);
    expect(grantsSilently(['credits:view', 'storage:manage'])).toBe(false);
});

import {Rotur} from 'rotur-sdk';
import {
    PROJECT_METHODS,
    authorizeProjectCall,
    grantsSilently,
    invokeProjectMethod,
    projectMethod,
    validateProjectScopes,
    appFilePath
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
        const spec = projectMethod(method);
        expect({method, allowed: Boolean(spec)}).toEqual({method, allowed: true});
        // A block's scope is what the host grants for it, after mapping.
        for (const scope of validateProjectScopes(scopes)) {
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
    'me.claimTime',
    'me.transactions',
    'gifts.create',
    'keys.buy',
    'groups.sendTip',
    'groups.purchaseProduct',
    'items.buy',
    'cosmetics.purchase',
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

test('actions that give something away or destroy it are confirmed with text the host builds', () => {
    expect(authorizeProjectCall('items.transfer', ['hat', 'sam'], [], 'p').confirm.label).toBe('give item hat to @sam');
    expect(authorizeProjectCall('gifts.claim', ['CODE'], [], 'p').confirm.label).toBe('claim gift code CODE');
    for (const method of [
        'gifts.claim', 'keys.cancel', 'keys.delete', 'posts.delete', 'items.transfer'
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
    expect(grantsSilently(['gifts:claim'])).toBe(true);
    expect(grantsSilently(['posts:delete'])).toBe(true);
    expect(grantsSilently(['posts:create'])).toBe(false);
    expect(grantsSilently(['keys:manage'])).toBe(false);
    expect(grantsSilently(['credits:view', 'storage:manage'])).toBe(false);
});

describe('project files stay in MistWarp\'s own Origin FS folder', () => {
    const root = '/application data/app_1938b6a87799f862@mist';
    const home = 'origin/(c) users/sam/application data/app_1938b6a87799f862@mist';
    const client = () => ({
        files: {
            pathIndex: jest.fn(() => Promise.resolve({root, username: 'Sam', index: {}})),
            getByPath: jest.fn(path => Promise.resolve({path}))
        }
    });

    test('a whole-drive request gets the app folder instead', () => {
        expect(validateProjectScopes(['files:view', 'files:manage', 'posts:create']))
            .toEqual(['files:app', 'posts:create']);
        expect(projectMethod('files.getByPath').scopes).toEqual(['files:app']);
        expect(grantsSilently(['files:app'])).toBe(false);
    });

    test.each([
        '/save.txt', 'save.txt', 'Save.TXT', `${root}/save.txt`, `${home}/save.txt`
    ])('%j is the folder\'s save.txt', async path => {
        await expect(appFilePath(client(), path)).resolves.toBe(`${home}/save.txt`);
    });

    test.each([
        'origin/(c) users/sam/documents/diary.txt',
        'origin/(c) users/kit/application data/app_1938b6a87799f862@mist/save.txt', `${home}x/save.txt`
    ])('%j outside the folder is refused', async path => {
        await expect(appFilePath(client(), path)).rejects.toThrow(`Projects can only read files in MistWarp's folder, ${root}`);
    });

    test.each(['../secrets.txt', './save.txt', 'a//b.txt', 'a\\b.txt', '', '/'])(
        '%j is refused before Rotur is asked',
        async path => {
            const rotur = client();
            await expect(appFilePath(rotur, path)).rejects.toThrow('Projects can only read files in MistWarp\'s folder');
            expect(rotur.files.pathIndex).not.toHaveBeenCalled();
        }
    );

    test('the folder is read once per token', async () => {
        const rotur = {...client(), token: 'a'};
        await appFilePath(rotur, 'one.txt');
        await appFilePath(rotur, 'two.txt');
        expect(rotur.files.pathIndex).toHaveBeenCalledTimes(1);
        rotur.token = 'b';
        await appFilePath(rotur, 'one.txt');
        expect(rotur.files.pathIndex).toHaveBeenCalledTimes(2);
    });

    test('a token Rotur gives no folder to reads nothing', async () => {
        const unscoped = {files: {pathIndex: () => Promise.resolve({index: {}, username: 'sam'})}};
        await expect(appFilePath(unscoped, '/save.txt')).rejects.toThrow('folder of its own');
    });

    test('the bridge reads by path inside the folder', async () => {
        const rotur = client();
        await invokeProjectMethod(rotur, 'files.getByPath', ['/levels/1.json']);
        expect(rotur.files.getByPath).toHaveBeenCalledWith(`${home}/levels/1.json`);
        await expect(invokeProjectMethod(rotur, 'files.getByPath', ['../x'])).rejects.toThrow('MistWarp\'s folder');
        expect(rotur.files.getByPath).toHaveBeenCalledTimes(1);
    });
});

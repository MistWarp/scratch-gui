import {
    Transport,
    DEFAULT_PEER_CONFIG,
    CLASSROOM_ICE_SERVERS
} from '../../../src/lib/collaboration/transport.js';
import {CollabService} from '../../../src/lib/collaboration/index.js';
import {avatarForCollabUser} from '../../../src/lib/collaboration/avatar.js';
import {FakePeer} from '../../fixtures/fake-peerjs.js';

jest.mock('peerjs', () => {
    const fixtures = jest.requireActual('../../fixtures/fake-peerjs.js');
    return {__esModule: true, default: fixtures.FakePeer};
});

const STUDENT_KEY = 'mw:classroom-student';
const CLOUDFLARE_ONLY = [{urls: 'stun:stun.cloudflare.com:3478'}];

class BrokerPeer extends FakePeer {
    constructor (id, config) {
        super(id, config);
        this._options = Object.assign({}, config);
        this.offerConfigs = [];
    }
    get options () {
        return this._options;
    }
    _handleMessage (message) {
        if (message.type === 'OFFER') this.offerConfigs.push(this.options.config);
    }
}

const makeTransport = options => {
    const peers = [];
    const transport = new Transport(Object.assign({
        createPeer: (id, config) => {
            const peer = new BrokerPeer(id, config);
            peers.push(peer);
            return peer;
        }
    }, options));
    return {transport, peers};
};

const offer = metadata => ({type: 'OFFER', src: 'client', payload: {type: 'data', metadata}});

const hostedTransport = async options => {
    const {transport, peers} = makeTransport(options);
    const hosting = transport.host('room1');
    peers[0].simulateOpen();
    await hosting;
    return {transport, peer: peers[0]};
};

const iceUrls = servers => servers.map(server => server.urls);

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

describe('classroom ICE servers', () => {
    test('the restricted list is Cloudflare STUN only', () => {
        expect(CLASSROOM_ICE_SERVERS).toEqual(CLOUDFLARE_ONLY);
    });

    test('a student session only ever uses Cloudflare STUN', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const {transport, peer} = await hostedTransport();
        expect(transport.restricted).toBe(true);
        expect(peer.config.config.iceServers).toEqual(CLOUDFLARE_ONLY);
        expect(JSON.stringify(peer.config)).not.toMatch(/google|freeturn|mikedev/);
        expect(peer.config.host).toBe(DEFAULT_PEER_CONFIG.host);
        transport.destroy();
    });

    test('a classroom session opened by a teacher is restricted too', async () => {
        const {transport, peer} = await hostedTransport({restricted: true});
        expect(peer.config.config.iceServers).toEqual(CLOUDFLARE_ONLY);
        transport.destroy();
    });

    test('a restricted client tells the host it is a classroom peer', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const {transport, peers} = makeTransport();
        const joining = transport.join('room1', {username: 'ada~k7p2q'}).catch(error => error);
        peers[0].simulateOpen();
        await Promise.resolve();
        await Promise.resolve();
        expect(peers[0].config.config.iceServers).toEqual(CLOUDFLARE_ONLY);
        expect(peers[0].connections[0].metadata).toEqual({username: 'ada~k7p2q', classroom: true});
        transport.destroy();
        await expect(joining).resolves.toMatchObject({collabCode: 'CONNECTION_CANCELLED'});
    });

    test('other sessions keep the default servers', async () => {
        const {transport, peer} = await hostedTransport();
        expect(transport.restricted).toBe(false);
        expect(iceUrls(peer.config.config.iceServers)).toEqual(iceUrls(DEFAULT_PEER_CONFIG.config.iceServers));
        transport.destroy();
    });

    test('an unrestricted host answers a classroom peer with Cloudflare STUN only', async () => {
        const {transport, peer} = await hostedTransport();
        peer._handleMessage(offer({username: 'ada~k7p2q'}));
        peer._handleMessage(offer({username: 'teacher', classroom: true}));
        peer._handleMessage(offer({username: 'friend'}));
        expect(peer.offerConfigs[0].iceServers).toEqual(CLOUDFLARE_ONLY);
        expect(peer.offerConfigs[1].iceServers).toEqual(CLOUDFLARE_ONLY);
        expect(iceUrls(peer.offerConfigs[2].iceServers)).toEqual(iceUrls(DEFAULT_PEER_CONFIG.config.iceServers));
        expect(peer.options.config).toBe(DEFAULT_PEER_CONFIG.config);
        transport.destroy();
    });
});

describe('collaboration service for class accounts', () => {
    const makeService = () => {
        const service = new CollabService();
        service.init({on: jest.fn(), removeListener: jest.fn(), emit: jest.fn()});
        return service;
    };

    test('a student cannot host or join by room code', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const service = makeService();
        await expect(service.connectToRoom('cool-cat-123', 'ada~k7p2q', true))
            .rejects.toMatchObject({collabCode: 'CLASSROOM_ROOM_CODE'});
        await expect(service.connectToRoom('cool-cat-123', 'ada~k7p2q', false))
            .rejects.toMatchObject({collabCode: 'CLASSROOM_ROOM_CODE'});
        expect(service._transport).toBeNull();
    });

    test('a teacher joining a classroom project session gets the restricted transport', async () => {
        const service = makeService();
        const connecting = service.connectToRoom('room', 'teacher', false, 'public', 'teacher',
            {projectId: 'p1', branch: 'main'}, {classroom: true});
        expect(service._transport.restricted).toBe(true);
        service.disconnect();
        await expect(connecting).rejects.toThrow();
    });

    test('a teacher in an ordinary project session keeps the default transport', async () => {
        const service = makeService();
        const connecting = service.connectToRoom('room', 'teacher', false, 'public', 'teacher',
            {projectId: 'p1', branch: 'main'}, {classroom: false});
        expect(service._transport.restricted).toBe(false);
        service.disconnect();
        await expect(connecting).rejects.toThrow();
    });

    test('a student joining a host with a custom extension only loads gallery extensions', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const service = makeService();
        const load = jest.fn(() => Promise.resolve());
        service.vm = {
            extensionManager: {isExtensionLoaded: () => false},
            editingCommands: {extensions: {loadExtensionURL: load}}
        };
        await service._loadMissingExtensions([
            {id: 'pen'},
            {id: 'gallery', url: 'https://extensions.turbowarp.org/Lily/Skins.js'},
            {id: 'custom', url: 'https://example.com/tracker.js'}
        ]);
        expect(load.mock.calls.map(call => call[0])).toEqual([
            'pen',
            'https://extensions.turbowarp.org/Lily/Skins.js'
        ]);
    });
});

describe('collaboration avatars', () => {
    test('never requests a Rotur avatar for a class account', () => {
        const url = avatarForCollabUser({username: 'ada~k7p2q', handle: 'ada~k7p2q'});
        expect(url).toMatch(/^data:image\/svg\+xml,/);
        expect(url).not.toContain('rotur.dev');
    });

    test('a student session shows initials for everyone', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        const url = avatarForCollabUser({username: 'Mist', handle: 'mist'});
        expect(url).toMatch(/^data:image\/svg\+xml,/);
        expect(url).not.toContain('rotur.dev');
    });

    test('Rotur users outside a student session keep their Rotur avatar', () => {
        expect(avatarForCollabUser({username: 'Mist', handle: 'mist'})).toBe('https://avatars.rotur.dev/mist');
        expect(avatarForCollabUser({username: 'Guest'})).toBeNull();
    });
});

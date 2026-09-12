import PeerModule from 'peerjs';
import {resolvePeerConstructor} from '../../../src/lib/collaboration/peer-constructor';

test('uses the installed PeerJS constructor', () => {
    expect(resolvePeerConstructor(PeerModule)).toBe(window.Peer);
    expect(typeof resolvePeerConstructor(PeerModule)).toBe('function');
});

test('accepts direct, Parcel default, and named constructor exports', () => {
    class Peer {}
    for (const module of [Peer, {default: Peer}, {Peer}, {default: {}, peerjs: {Peer}}]) {
        expect(new (resolvePeerConstructor(module))()).toBeInstanceOf(Peer);
    }
});

test('rejects unusable module exports with a recovery message', () => {
    expect(() => resolvePeerConstructor({default: {}})).toThrow('Please reload');
});

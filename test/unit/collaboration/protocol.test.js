import {
    PROTOCOL_VERSION,
    KIND,
    OP,
    CTRL,
    SNAPSHOT,
    ASSET,
    PRESENCE,
    LIMITS,
    validateEnvelope,
    makeOp,
    makePropose,
    makeReject,
    makeCtrl,
    makeSnapshot,
    makeAsset,
    makePresence
} from '../../../src/lib/collaboration/protocol.js';

describe('protocol envelope validation', () => {
    test('rejects non-object envelopes', () => {
        [null, 42, 'hello', [], undefined, new ArrayBuffer(4)].forEach(bad => {
            expect(validateEnvelope(bad)).not.toBeNull();
        });
    });

    test('rejects wrong protocol version', () => {
        const envelope = makeCtrl(CTRL.PING, {});
        envelope.v = PROTOCOL_VERSION + 1;
        expect(validateEnvelope(envelope)).toMatch(/version/);
    });

    test('rejects unknown kind', () => {
        const envelope = makeCtrl(CTRL.PING, {});
        envelope.kind = 'nonsense';
        expect(validateEnvelope(envelope)).toMatch(/kind/);
    });

    test('rejects type not belonging to kind', () => {
        // A ctrl type is not a valid op type
        const envelope = makeOp(CTRL.PING, {}, {seq: 1, clientId: 'a', clientOpId: 1});
        expect(validateEnvelope(envelope)).toMatch(/unknown type/);
    });

    test('rejects non-object payloads', () => {
        const envelope = makeCtrl(CTRL.PING, {});
        envelope.payload = 'nope';
        expect(validateEnvelope(envelope)).toMatch(/payload/);
    });

    test('accepts ping/pong', () => {
        expect(validateEnvelope(makeCtrl(CTRL.PING, {}))).toBeNull();
        expect(validateEnvelope(makeCtrl(CTRL.PONG, {}))).toBeNull();
    });

    describe('op envelopes', () => {
        const validBlockEvent = () => makeOp(OP.BLOCK_EVENT, {
            event: {type: 'create', xml: '<block/>'},
            targetId: 'target1'
        }, {seq: 5, clientId: 'peer-a', clientOpId: 3});

        test('accepts a valid block-event op', () => {
            expect(validateEnvelope(validBlockEvent())).toBeNull();
        });

        test('requires seq, clientId and clientOpId', () => {
            let envelope = validBlockEvent();
            delete envelope.seq;
            expect(validateEnvelope(envelope)).toMatch(/seq/);

            envelope = validBlockEvent();
            envelope.seq = -1;
            expect(validateEnvelope(envelope)).toMatch(/seq/);

            envelope = validBlockEvent();
            envelope.seq = 1.5;
            expect(validateEnvelope(envelope)).toMatch(/seq/);

            envelope = validBlockEvent();
            delete envelope.clientId;
            expect(validateEnvelope(envelope)).toMatch(/clientId/);

            envelope = validBlockEvent();
            delete envelope.clientOpId;
            expect(validateEnvelope(envelope)).toMatch(/clientOpId/);
        });

        test('propose requires clientOpId but not seq', () => {
            const envelope = makePropose(OP.BLOCK_EVENT, {
                event: {type: 'create'}
            }, 7);
            expect(validateEnvelope(envelope)).toBeNull();

            delete envelope.clientOpId;
            expect(validateEnvelope(envelope)).toMatch(/clientOpId/);
        });

        test('block-event requires an event object with a type', () => {
            const envelope = makePropose(OP.BLOCK_EVENT, {event: 'nope'}, 1);
            expect(validateEnvelope(envelope)).not.toBeNull();

            const envelope2 = makePropose(OP.BLOCK_EVENT, {event: {}}, 1);
            expect(validateEnvelope(envelope2)).not.toBeNull();
        });

        test('block-event caps xml size', () => {
            const envelope = makePropose(OP.BLOCK_EVENT, {
                event: {type: 'create', xml: 'x'.repeat(LIMITS.MAX_XML + 1)}
            }, 1);
            expect(validateEnvelope(envelope)).toMatch(/xml/);
        });

        test('target-update accepts known props only', () => {
            const good = makePropose(OP.TARGET_UPDATE, {
                targetId: 't1',
                props: {x: 10, y: -20.5, direction: 90, size: 100, visible: true, rotationStyle: 'all around'}
            }, 1);
            expect(validateEnvelope(good)).toBeNull();

            const badProp = makePropose(OP.TARGET_UPDATE, {
                targetId: 't1',
                props: {volume: 100}
            }, 1);
            expect(validateEnvelope(badProp)).toMatch(/not allowed/);

            const badType = makePropose(OP.TARGET_UPDATE, {
                targetId: 't1',
                props: {x: 'ten'}
            }, 1);
            expect(validateEnvelope(badType)).toMatch(/invalid/);

            const nanProp = makePropose(OP.TARGET_UPDATE, {
                targetId: 't1',
                props: {x: NaN}
            }, 1);
            expect(validateEnvelope(nanProp)).toMatch(/invalid/);
        });

        test('sprite ops validate ids, names and indices', () => {
            expect(validateEnvelope(makePropose(OP.SPRITE_DELETE, {targetId: 't1'}, 1))).toBeNull();
            expect(validateEnvelope(makePropose(OP.SPRITE_DELETE, {}, 1))).not.toBeNull();

            expect(validateEnvelope(makePropose(OP.SPRITE_RENAME, {targetId: 't1', name: 'Cat'}, 1))).toBeNull();
            expect(validateEnvelope(makePropose(OP.SPRITE_RENAME, {targetId: 't1', name: ''}, 1))).not.toBeNull();

            expect(validateEnvelope(makePropose(OP.COSTUME_SELECT, {targetId: 't1', index: 0}, 1))).toBeNull();
            expect(validateEnvelope(makePropose(OP.COSTUME_SELECT, {targetId: 't1', index: -1}, 1))).not.toBeNull();
        });

        test('asset refs must be md5ext formatted and bounded', () => {
            const md5 = 'a'.repeat(32);
            const good = makePropose(OP.COSTUME_ADD, {
                targetId: 't1',
                costume: {name: 'c'},
                assetRefs: [`${md5}.svg`]
            }, 1);
            expect(validateEnvelope(good)).toBeNull();

            const bad = makePropose(OP.COSTUME_ADD, {
                targetId: 't1',
                costume: {name: 'c'},
                assetRefs: ['../../etc/passwd']
            }, 1);
            expect(validateEnvelope(bad)).toMatch(/assetRefs/);

            const tooMany = makePropose(OP.COSTUME_ADD, {
                targetId: 't1',
                costume: {name: 'c'},
                assetRefs: new Array(LIMITS.MAX_ASSET_REFS + 1).fill(`${md5}.svg`)
            }, 1);
            expect(validateEnvelope(tooMany)).toMatch(/assetRefs/);
        });
    });

    describe('reject envelopes', () => {
        test('op-reject requires clientOpId and caps reason', () => {
            expect(validateEnvelope(makeReject(3, 'bad op'))).toBeNull();
            expect(validateEnvelope(makeReject(3))).toBeNull();

            const noId = makeReject(3, 'x');
            noId.payload = {reason: 'x'};
            expect(validateEnvelope(noId)).toMatch(/clientOpId/);

            expect(validateEnvelope(makeReject(3, 'x'.repeat(LIMITS.MAX_REASON + 1)))).toMatch(/reason/);
        });
    });

    describe('ctrl envelopes', () => {
        test('hello requires protocolVersion, username and roomId', () => {
            const good = makeCtrl(CTRL.HELLO, {
                protocolVersion: PROTOCOL_VERSION,
                username: 'sophie',
                roomId: 'myroom'
            });
            expect(validateEnvelope(good)).toBeNull();

            expect(validateEnvelope(makeCtrl(CTRL.HELLO, {username: 'a', roomId: 'r'}))).toMatch(/protocolVersion/);
            expect(validateEnvelope(makeCtrl(CTRL.HELLO, {
                protocolVersion: 1,
                username: 'x'.repeat(LIMITS.MAX_USERNAME + 1),
                roomId: 'r'
            }))).toMatch(/username/);
        });

        test('users-list validates each user', () => {
            const good = makeCtrl(CTRL.USERS_LIST, {users: [
                {id: 'p1', username: 'a', isHost: true},
                {id: 'p2', username: 'b', isHost: false}
            ]});
            expect(validateEnvelope(good)).toBeNull();

            const bad = makeCtrl(CTRL.USERS_LIST, {users: [{id: 'p1'}]});
            expect(validateEnvelope(bad)).toMatch(/invalid user/);

            const notArray = makeCtrl(CTRL.USERS_LIST, {users: 'everyone'});
            expect(validateEnvelope(notArray)).toMatch(/users array/);
        });

        test('privacy-changed only accepts public|private', () => {
            expect(validateEnvelope(makeCtrl(CTRL.PRIVACY_CHANGED, {privacy: 'public'}))).toBeNull();
            expect(validateEnvelope(makeCtrl(CTRL.PRIVACY_CHANGED, {privacy: 'private'}))).toBeNull();
            expect(validateEnvelope(makeCtrl(CTRL.PRIVACY_CHANGED, {privacy: 'secret'}))).not.toBeNull();
        });

        test('ops-request requires fromSeq', () => {
            expect(validateEnvelope(makeCtrl(CTRL.OPS_REQUEST, {fromSeq: 10}))).toBeNull();
            expect(validateEnvelope(makeCtrl(CTRL.OPS_REQUEST, {}))).toMatch(/fromSeq/);
        });
    });

    describe('snapshot envelopes', () => {
        test('snapshot-begin validates bounds', () => {
            const good = makeSnapshot(SNAPSHOT.BEGIN, {
                transferId: 'x1',
                totalBytes: 1000,
                chunkCount: 1,
                atSeq: 42
            });
            expect(validateEnvelope(good)).toBeNull();

            const noSeq = makeSnapshot(SNAPSHOT.BEGIN, {transferId: 'x1', totalBytes: 1000, chunkCount: 1});
            expect(validateEnvelope(noSeq)).toMatch(/atSeq/);

            const tooBig = makeSnapshot(SNAPSHOT.BEGIN, {
                transferId: 'x1',
                totalBytes: LIMITS.MAX_TRANSFER_BYTES + 1,
                chunkCount: 1,
                atSeq: 0
            });
            expect(validateEnvelope(tooBig)).toMatch(/totalBytes/);
        });

        test('snapshot-chunk accepts binary data within bounds', () => {
            const good = makeSnapshot(SNAPSHOT.CHUNK, {
                transferId: 'x1',
                index: 0,
                data: new ArrayBuffer(64 * 1024)
            });
            expect(validateEnvelope(good)).toBeNull();

            const goodView = makeSnapshot(SNAPSHOT.CHUNK, {
                transferId: 'x1',
                index: 0,
                data: new Uint8Array(16)
            });
            expect(validateEnvelope(goodView)).toBeNull();

            const tooBig = makeSnapshot(SNAPSHOT.CHUNK, {
                transferId: 'x1',
                index: 0,
                data: new ArrayBuffer(LIMITS.MAX_CHUNK_BYTES + 1)
            });
            expect(validateEnvelope(tooBig)).toMatch(/data/);

            const badData = makeSnapshot(SNAPSHOT.CHUNK, {
                transferId: 'x1',
                index: 0,
                data: {evil: true}
            });
            expect(validateEnvelope(badData)).toMatch(/data/);
        });
    });

    describe('asset envelopes', () => {
        const md5ext = `${'b'.repeat(32)}.png`;

        test('asset-request requires valid md5exts', () => {
            expect(validateEnvelope(makeAsset(ASSET.REQUEST, {md5exts: [md5ext]}))).toBeNull();
            expect(validateEnvelope(makeAsset(ASSET.REQUEST, {md5exts: []}))).not.toBeNull();
            expect(validateEnvelope(makeAsset(ASSET.REQUEST, {md5exts: ['nope']}))).not.toBeNull();
        });

        test('asset-begin and asset-chunk validate', () => {
            expect(validateEnvelope(makeAsset(ASSET.BEGIN, {
                md5ext,
                totalBytes: 100,
                chunkCount: 1
            }))).toBeNull();
            expect(validateEnvelope(makeAsset(ASSET.CHUNK, {
                md5ext,
                index: 0,
                data: new ArrayBuffer(100)
            }))).toBeNull();
            expect(validateEnvelope(makeAsset(ASSET.CHUNK, {
                md5ext: 'bad',
                index: 0,
                data: new ArrayBuffer(4)
            }))).not.toBeNull();
        });
    });

    describe('presence envelopes', () => {
        test('cursor requires finite coordinates', () => {
            expect(validateEnvelope(makePresence(PRESENCE.CURSOR, {x: 1, y: 2, targetId: 't1'}))).toBeNull();
            expect(validateEnvelope(makePresence(PRESENCE.CURSOR, {x: Infinity, y: 2}))).not.toBeNull();
            expect(validateEnvelope(makePresence(PRESENCE.CURSOR, {x: 1}))).not.toBeNull();
        });

        test('cursor-chat caps text length and allows clearing', () => {
            expect(validateEnvelope(makePresence(PRESENCE.CURSOR_CHAT, {text: 'hi'}))).toBeNull();
            expect(validateEnvelope(makePresence(PRESENCE.CURSOR_CHAT, {
                text: 'x'.repeat(LIMITS.MAX_CHAT + 1)
            }))).not.toBeNull();
            // Empty payload clears the remote bubble.
            expect(validateEnvelope(makePresence(PRESENCE.CURSOR_CHAT, {}))).toBeNull();
        });

        test('editing-target allows clearing the target', () => {
            expect(validateEnvelope(makePresence(PRESENCE.EDITING_TARGET, {targetId: 't1'}))).toBeNull();
            expect(validateEnvelope(makePresence(PRESENCE.EDITING_TARGET, {}))).toBeNull();
        });
    });

    describe('fuzzing', () => {
        test('random garbage never validates and never throws', () => {
            const garbage = [
                {},
                {v: 1},
                {v: 1, kind: KIND.OP},
                {v: 1, kind: KIND.OP, type: OP.BLOCK_EVENT},
                {v: 1, kind: KIND.OP, type: OP.BLOCK_EVENT, payload: null},
                {v: 1, kind: KIND.CTRL, type: CTRL.USERS_LIST, payload: {users: [null]}},
                {v: 1, kind: KIND.CTRL, type: CTRL.HELLO, payload: {
                    protocolVersion: '1', username: 'a', roomId: 'r'
                }},
                {v: '1', kind: KIND.CTRL, type: CTRL.PING, payload: {}},
                {v: 1, kind: KIND.SNAPSHOT, type: SNAPSHOT.CHUNK, payload: {
                    transferId: 'x', index: 0.5, data: new ArrayBuffer(1)
                }},
                {v: 1, kind: KIND.PRESENCE, type: PRESENCE.CURSOR, payload: {x: 'a', y: 'b'}}
            ];
            garbage.forEach(envelope => {
                expect(() => validateEnvelope(envelope)).not.toThrow();
                expect(validateEnvelope(envelope)).not.toBeNull();
            });
        });
    });
});

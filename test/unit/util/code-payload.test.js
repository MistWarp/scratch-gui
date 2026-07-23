jest.mock('../../../src/lib/backpack/block-to-image', () => () => Promise.resolve('block-image'));
jest.mock('../../../src/lib/backpack/thumbnail', () => () => Promise.resolve('thumbnail'));

import codePayload, {offsetToPosition} from '../../../src/lib/backpack/code-payload';
import {Base64} from 'js-base64';

describe('codePayload', () => {
    test('base64 encodes the blocks as json', () => {
        const blocks = '☁︎❤️🐻';
        const payload = codePayload({
            blockObjects: blocks
        });
        return payload.then(p => {
            expect(
                JSON.parse(Base64.decode(p.body))
            ).toEqual(blocks);
        });
    });
});

describe('offsetToPosition', () => {
    test('moves the top block to the position', () => {
        const payload = [{topLevel: true, x: 10, y: 20}, {topLevel: false}];
        offsetToPosition(payload, 100, 200);
        expect(payload[0]).toEqual({topLevel: true, x: 100, y: 200});
    });

    test('anchors on the frame and keeps the scripts inside it', () => {
        // Positions parsed out of the workspace xml are strings.
        const payload = {
            blocks: [
                {topLevel: true, x: '60', y: '90'},
                {topLevel: true, x: '60', y: '200'}
            ],
            frames: [{title: 'Movement', x: 40, y: 60, width: 400, height: 300}]
        };
        offsetToPosition(payload, 0, 0);
        expect(payload.frames[0]).toMatchObject({x: 0, y: 0});
        expect(payload.blocks[0]).toMatchObject({x: 20, y: 30});
        expect(payload.blocks[1]).toMatchObject({x: 20, y: 140});
    });

    test('places a frame with no scripts in it', () => {
        const payload = {blocks: [], frames: [{x: 40, y: 60}]};
        offsetToPosition(payload, 100, 200);
        expect(payload.frames[0]).toEqual({x: 100, y: 200});
    });
});

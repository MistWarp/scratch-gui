import blockToImage from './block-to-image';
import createThumbnail from './thumbnail';
import {BLOCKS_DEFAULT_SCALE} from '../constants/layout-constants';
import {Base64} from 'js-base64';

const codePayload = ({blockObjects, topBlockId}) => {
    const payload = {
        type: 'script', // Needs to match backpack-server type name
        name: 'code', // All code currently gets the same name
        mime: 'application/json',
        // Backpack expects a base64 encoded string to store. Cannot use btoa because
        // the code can contain characters outside the 0-255 code-point range supported by btoa
        body: Base64.encode(JSON.stringify(blockObjects)) // Base64 encode the json
    };

    return blockToImage(topBlockId)
        .then(createThumbnail)
        .then(thumbnail => {
            payload.thumbnail = thumbnail;
            return payload;
        });
};

const getBlocks = payload => (Array.isArray(payload) ? payload : payload.blocks);

const getFrames = payload => (Array.isArray(payload) ? [] : payload.frames || []);

/**
 * Move a payload so that its anchor sits at the given workspace position, taking
 * everything else along. A frame is the anchor when there is one, so that the
 * scripts stay inside it.
 * @param {object} payload The blocks, and frames, being placed.
 * @param {number} x The x position for the anchor, in workspace units.
 * @param {number} y The y position for the anchor, in workspace units.
 * @return {object} The same payload, moved.
 */
const offsetToPosition = (payload, x, y) => {
    const blocks = getBlocks(payload);
    const frames = getFrames(payload);
    const anchor = frames[0] || blocks.find(i => i.topLevel);
    if (!anchor) return payload;

    // Positions parsed out of the workspace xml arrive as strings.
    const at = (item, axis) => Number(item[axis]) || 0;
    const dx = x - at(anchor, 'x');
    const dy = y - at(anchor, 'y');
    for (const block of blocks) {
        if (block.topLevel) {
            block.x = at(block, 'x') + dx;
            block.y = at(block, 'y') + dy;
        }
    }
    for (const frame of frames) {
        frame.x = at(frame, 'x') + dx;
        frame.y = at(frame, 'y') + dy;
    }

    return payload;
};

const placeInViewport = (payload, workspaceMetrics, isRtl) => {
    const {scrollX, scrollY, scale} = workspaceMetrics || {
        scrollX: 0,
        scrollY: 0,
        scale: BLOCKS_DEFAULT_SCALE
    };

    const posY = -scrollY + 30;
    const posX = isRtl ? scrollX + 30 : -scrollX + 30;

    return offsetToPosition(payload, posX / scale, posY / scale);
};

export {
    codePayload as default,
    offsetToPosition,
    placeInViewport
};

import React, {useRef} from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {useEmbedFetchBridge} from '../../src/community/pages/project/use-embed-bridges.js';
import {cachedFetchBuffer} from '../../src/lib/community/cached-fetch.js';

jest.mock('../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn(),
    preloadContent: jest.fn(() => Promise.resolve(null))
}));

const project = {id: '1', projectJsonUrl: 'https://cdn.test/project.sb3'};

const Bridge = ({frame}) => {
    const ref = useRef(frame);
    useEmbedFetchBridge(project, ref);
    return null;
};

test('sends the player a copy of the cached project, not the cached buffer itself', async () => {
    const cached = new Uint8Array([1, 2, 3]).buffer;
    cachedFetchBuffer.mockResolvedValue(cached);
    const postMessage = jest.fn();
    const frame = {contentWindow: {postMessage}};
    const wrapper = mount(<Bridge frame={frame} />);

    await act(async () => {
        window.dispatchEvent(new MessageEvent('message', {
            source: frame.contentWindow,
            data: {type: 'mw:fetch', id: 7, url: project.projectJsonUrl}
        }));
        await Promise.resolve();
        await Promise.resolve();
    });

    expect(postMessage).toHaveBeenCalledTimes(1);
    const [message, , transfer] = postMessage.mock.calls[0];
    expect(message.type).toBe('mw:fetch-result');
    expect(message.id).toBe(7);
    expect(message.buffer).not.toBe(cached);
    expect(Array.from(new Uint8Array(message.buffer))).toEqual([1, 2, 3]);
    expect(transfer).toEqual([message.buffer]);
    wrapper.unmount();
});

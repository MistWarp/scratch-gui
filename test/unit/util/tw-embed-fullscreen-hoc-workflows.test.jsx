import React from 'react';
import TWFullScreenHOC from '../../../src/lib/components/tw-embed-fullscreen-hoc';
import FullscreenAPI from '../../../src/lib/api/fullscreen';

jest.mock('../../../src/lib/api/fullscreen', () => ({
    available: jest.fn(() => true),
    enabled: jest.fn(() => false),
    exit: jest.fn(),
    request: jest.fn()
}));

const Wrapped = () => <div />;
const ConnectedFullScreen = TWFullScreenHOC(Wrapped);
const FullScreenComponent = ConnectedFullScreen.WrappedComponent;

const makeComponent = overrides => new FullScreenComponent({
    isFullScreen: false,
    onSetIsFullScreen: jest.fn(),
    onSetWindowIsFullScreen: jest.fn(),
    value: 'new value',
    ...overrides
});

describe('embedded fullscreen workflow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        FullscreenAPI.available.mockReturnValue(true);
        FullscreenAPI.enabled.mockReturnValue(false);
    });

    test('does not repeat the browser operation for an unrelated prop update', () => {
        const component = makeComponent({isFullScreen: true});
        component.componentDidUpdate({isFullScreen: true, value: 'old value'});

        expect(FullscreenAPI.request).not.toHaveBeenCalled();
        expect(component.render().props.value).toBe('new value');
    });

    test('requests browser fullscreen when the flag changes', () => {
        FullscreenAPI.request.mockReturnValue(Promise.resolve());
        const component = makeComponent({isFullScreen: true});
        component.mounted = true;

        component.componentDidUpdate({isFullScreen: false});

        expect(FullscreenAPI.request).toHaveBeenCalledTimes(1);
    });

    test('restores actual state after the browser rejects fullscreen', async () => {
        FullscreenAPI.request.mockReturnValue(Promise.reject(new Error('denied')));
        const component = makeComponent({isFullScreen: true});
        component.mounted = true;

        component.componentDidUpdate({isFullScreen: false});
        await Promise.resolve();
        await Promise.resolve();

        expect(component.props.onSetWindowIsFullScreen).toHaveBeenCalledWith(false);
        expect(component.props.onSetIsFullScreen).toHaveBeenCalledWith(false);
    });
});

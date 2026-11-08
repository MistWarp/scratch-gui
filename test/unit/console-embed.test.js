import {isConsoleEmbed, startConsoleEmbed} from '../../src/lib/console-embed.js';

describe('console embed', () => {
    test('is off when the player is not framed', () => {
        window.history.replaceState({}, '', '/embed.html?mw_console=1&mw_bridge=1');
        expect(isConsoleEmbed()).toBe(false);
    });

    test('tells the console about the menu key and pauses when asked', () => {
        const posted = [];
        const postMessage = jest.spyOn(window.parent, 'postMessage').mockImplementation(message => posted.push(message));
        const setPaused = jest.fn();
        startConsoleEmbed({setPaused});

        window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
        window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', repeat: true}));
        window.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}));
        expect(posted).toEqual([{type: 'mw:console', action: 'menu'}]);

        window.dispatchEvent(new MessageEvent('message', {source: window.parent, data: {type: 'mw:console', action: 'pause'}}));
        window.dispatchEvent(new MessageEvent('message', {source: window.parent, data: {type: 'mw:console', action: 'resume'}}));
        window.dispatchEvent(new MessageEvent('message', {source: null, data: {type: 'mw:console', action: 'pause'}}));
        expect(setPaused.mock.calls).toEqual([[true], [false]]);
        postMessage.mockRestore();
    });
});

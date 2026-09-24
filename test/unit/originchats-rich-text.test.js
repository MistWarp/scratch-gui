import {firstLine, onlyEmoji, parse} from '../../src/lib/originchats/rich-text.js';

const context = {
    users: {
        kai: {username: 'kai', nickname: 'Kai'},
        'usr:discord_1': {username: 'USR:discord_1', nickname: 'Doody', cracked: true}
    },
    roles: {everyone: {id: '1552656206236090490', color: '#5865f2'}},
    emojis: {8: {id: '8', name: 'wave', fileName: 'wave.png'}},
    channels: [{name: 'help', type: 'text'}]
};

const types = tokens => tokens.map(token => token.type);

describe('originchats rich text', () => {
    test('resolves user mentions to nicknames and leaves handles glued to words alone', () => {
        const tokens = parse('hi @kai and @USR:discord_1, mail me@example.com @nobody', context);
        expect(tokens.filter(token => token.type === 'mention')).toEqual([
            {type: 'mention', username: 'kai', display: 'Kai', known: true},
            {type: 'mention', username: 'USR:discord_1', display: 'Doody', known: true},
            {type: 'mention', username: 'nobody', display: 'nobody', known: false}
        ]);
        expect(tokens.some(token => token.type === 'text' && token.text.includes('me@example.com'))).toBe(true);
    });

    test('resolves role mentions through the role list and channel mentions through the channel list', () => {
        const tokens = parse('@&1552656206236090490 see #help or #nowhere @&missing', context);
        expect(tokens[0]).toEqual({type: 'roleMention', id: '1552656206236090490', name: 'everyone', color: '#5865f2'});
        expect(tokens.find(token => token.type === 'channel')).toEqual({type: 'channel', name: 'help'});
        const text = tokens.filter(token => token.type === 'text').map(token => token.text)
            .join('');
        expect(text).toContain('#nowhere');
        expect(text).toContain('@&missing');
    });

    test('turns every emoji reference form into an image token', () => {
        const typed = parse('originChats:<emoji>//chats.mistium.com/8', context)[0];
        const legacy = parse('originChats://chats.mistium.com/emojis/8', context)[0];
        const bare = parse('https://chats.mistium.com/emojis/8.png lol', context)[0];
        [typed, legacy, bare].forEach(token => {
            expect(token.type).toBe('emoji');
            expect(token.src).toBe('https://chats.mistium.com/emojis/8');
            expect(token.name).toBe('wave');
        });
        expect(onlyEmoji(parse('originChats:<emoji>//chats.mistium.com/8  ', context))).toBe(true);
        expect(onlyEmoji(parse('hi originChats:<emoji>//chats.mistium.com/8', context))).toBe(false);
    });

    test('links urls without swallowing trailing punctuation and honours angle brackets', () => {
        const tokens = parse('see https://mistwarp.org/project/abc123. or <https://x.y/z>', context);
        expect(tokens.filter(token => token.type === 'link').map(token => token.url)).toEqual([
            'https://mistwarp.org/project/abc123',
            'https://x.y/z'
        ]);
        expect(tokens[2]).toEqual({type: 'text', text: '. or '});
    });

    test('nests inline formatting and keeps code literal', () => {
        const tokens = parse('**bold *it* al** ~~gone~~ ||secret|| `**raw**`', context);
        expect(types(tokens)).toEqual(['format', 'text', 'format', 'text', 'format', 'text', 'inlineCode']);
        expect(tokens[0].style).toBe('bold');
        expect(types(tokens[0].children)).toEqual(['text', 'format', 'text']);
        expect(tokens[0].children[1].style).toBe('italic');
        expect(tokens[4].style).toBe('spoiler');
        expect(tokens[6].code).toBe('**raw**');
    });

    test('splits fenced code blocks and line breaks', () => {
        expect(parse('```js\nlet a = 1;\n```\nnext', context)).toEqual([
            {type: 'codeBlock', code: 'let a = 1;'},
            {type: 'break'},
            {type: 'text', text: 'next'}
        ]);
    });

    test('firstLine skips blank leading lines', () => {
        expect(firstLine('\n\nhello\nworld')).toBe('hello');
        expect(firstLine('')).toBe('');
    });
});

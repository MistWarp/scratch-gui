import {detectEmbed, messageEmbeds, parseInvite, serverEmbeds} from '../../src/lib/originchats/embeds.js';
import {parse} from '../../src/lib/originchats/rich-text.js';
import {readScriptSvg} from '../../src/lib/originchats/script-image.js';
import {messageSigningContent} from '../../src/lib/originchats/signing.js';

describe('originchats invite links', () => {
    test('share links, server links and native links are recognised', () => {
        expect(parseInvite('https://originchats.com/invite/chats.mistwarp.org/ABC123DEF456')).toEqual({
            server: 'chats.mistwarp.org',
            code: 'ABC123DEF456'
        });
        expect(parseInvite('https://originchats.com/invite/chats.mistwarp.org')).toEqual({
            server: 'chats.mistwarp.org',
            code: null
        });
        expect(parseInvite('https://originchats.com/app?server=chats.example.com&invite=ZZZZ1234')).toEqual({
            server: 'chats.example.com',
            code: 'ZZZZ1234'
        });
        expect(parseInvite('https://chats.example.com/invite/0123456789AB')).toEqual({
            server: 'chats.example.com',
            code: '0123456789AB'
        });
        expect(parseInvite('https://chats.mistwarp.org/invite/anything')).toEqual({
            server: 'chats.mistwarp.org',
            code: 'anything'
        });
        expect(parseInvite('originChats://chats.example.com')).toEqual({server: 'chats.example.com', code: null});
    });

    test('other sites with an invite path are not treated as servers', () => {
        expect(parseInvite('https://discord.com/invite/neEMnJxYW8')).toBe(null);
        expect(parseInvite('https://example.com/invite/hello')).toBe(null);
        expect(parseInvite('https://originchats.com/invite/not a host/x')).toBe(null);
    });
});

describe('originchats embeds', () => {
    test('links are classified by type', () => {
        expect(detectEmbed('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({type: 'youtube', id: 'dQw4w9WgXcQ'});
        expect(detectEmbed('https://mistwarp.org/project/p123')).toMatchObject({type: 'project', id: 'p123'});
        expect(detectEmbed('https://originchats.com/message/chats.mistwarp.org/general/abc-123')).toMatchObject({
            type: 'message',
            server: 'chats.mistwarp.org',
            channel: 'general',
            id: 'abc-123'
        });
        expect(detectEmbed('https://example.com/cat.PNG?x=1')).toMatchObject({type: 'image'});
        expect(detectEmbed('https://example.com/clip.webm')).toMatchObject({type: 'video'});
        expect(detectEmbed('https://example.com/page')).toBe(null);
    });

    test('bracketed links do not embed and duplicates are dropped', () => {
        const tokens = parse('https://youtu.be/dQw4w9WgXcQ <https://youtu.be/other1234> https://youtu.be/dQw4w9WgXcQ');
        expect(messageEmbeds(tokens).map(embed => embed.id)).toEqual(['dQw4w9WgXcQ']);
    });

    test('generated server embeds are skipped when the client renders the link itself', () => {
        const clientEmbeds = messageEmbeds(parse('https://youtu.be/dQw4w9WgXcQ'));
        const message = {embeds: [
            {type: 'link', generated: true, url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Video'},
            {type: 'link', generated: true, url: 'https://example.com', title: 'Example'},
            {type: 'link', generated: true, url: 'https://example.com/empty'}
        ]};
        expect(serverEmbeds(message, clientEmbeds).map(embed => embed.title)).toEqual(['Example']);
    });
});

describe('script images', () => {
    const svg = blocks => `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><metadata id="mistwarp-script">${
        JSON.stringify({format: 'mistwarp-script', version: 1, blocks}).replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
    }</metadata><g /></svg>`;

    test('scripts round trip through the svg metadata', () => {
        const blocks = [{id: 'a', opcode: 'event_whenflagclicked', topLevel: true, next: null}];
        expect(readScriptSvg(svg(blocks))).toEqual(blocks);
        const framed = {blocks, frames: [{title: 'x'}]};
        expect(readScriptSvg(svg(framed))).toEqual(framed);
    });

    test('ordinary or malformed svgs are not scripts', () => {
        expect(readScriptSvg('<svg xmlns="http://www.w3.org/2000/svg"><g /></svg>')).toBe(null);
        expect(readScriptSvg(svg([{opcode: 'no_id'}]))).toBe(null);
        expect(readScriptSvg(svg([]))).toBe(null);
        expect(readScriptSvg('<svg><metadata id="mistwarp-script">{not json</metadata></svg>')).toBe(null);
    });
});

describe('message signing payload', () => {
    test('matches the OriginChats message tuple', () => {
        expect(messageSigningContent('user-id', 'hello', [{name: 'file.txt', id: 'attachment-id'}], 1.234,
            'chat.example.com')).toEqual([
            'originchats.message.v1', 'user-id', 'hello', [{name: 'file.txt', id: 'attachment-id'}], 1.234,
            'chat.example.com'
        ]);
    });
});

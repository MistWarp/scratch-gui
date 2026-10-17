import {internalMistWarpRoute, markdownLink, shortLinkText, splitParts} from '../../src/community/components/RichText.jsx';

describe('MistWarp rich text links', () => {
    test('parses labelled Markdown links', () => {
        expect(markdownLink('[Summer challenge](/spaces/challenge-1)')).toEqual({
            label: 'Summer challenge',
            destination: '/spaces/challenge-1'
        });
        expect(markdownLink('[not closed](/spaces/a')).toBeNull();
        expect(splitParts('Enter [Summer challenge](/spaces/challenge-1) with @sophie.')).toEqual([
            'Enter ',
            '[Summer challenge](/spaces/challenge-1)',
            ' with ',
            '@sophie',
            '.'
        ]);
    });

    test('accepts public MistWarp destinations', () => {
        expect(internalMistWarpRoute('/spaces/studio-1')).toBe('/spaces/studio-1');
        expect(internalMistWarpRoute('/spaces?kind=challenge')).toBe('/spaces?kind=challenge');
        expect(internalMistWarpRoute('https://mistwarp.org/project/abc123#comments'))
            .toBe('/project/abc123#comments');
        expect(internalMistWarpRoute('https://warp.mistium.com/project/abc123#comments'))
            .toBe('/project/abc123#comments');
        expect(internalMistWarpRoute('/users/sophie/followers')).toBe('/users/sophie/followers');
    });

    test('opens claw posts inside MistWarp', () => {
        expect(internalMistWarpRoute('https://pounce.rotur.dev/p/245259f462c2a3de')).toBe('/posts/245259f462c2a3de');
        expect(internalMistWarpRoute('https://pounce.rotur.dev/#/p/abc_def')).toBe('/posts/abc_def');
        expect(internalMistWarpRoute('https://mistwarp.org/posts/abc123')).toBe('/posts/abc123');
        expect(internalMistWarpRoute('https://pounce.rotur.dev/u/mist')).toBeNull();
    });

    test('rejects external and private destinations', () => {
        expect(internalMistWarpRoute('https://example.com/spaces/studio-1')).toBeNull();
        expect(internalMistWarpRoute('//example.com/project/abc123')).toBeNull();
        expect(internalMistWarpRoute('/admin')).toBeNull();
        expect(internalMistWarpRoute('javascript:alert(1)')).toBeNull();
    });

    test('shortens long links for display', () => {
        expect(shortLinkText('https://example.com/a')).toBe('example.com/a');
        expect(shortLinkText('https://www.example.com/')).toBe('example.com');
        expect(shortLinkText('https://originchats.com/message/chats.mistium.com/general/5e105412-c2bb-420f-a37e-a10ecee38c9a'))
            .toBe('originchats.com/message/\u2026/5e105\u2026');
        expect(shortLinkText('https://github.com/MistWarp/scratch-gui/pull/158')).toBe('github.com/MistWarp/\u2026/158');
        expect(shortLinkText('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('youtube.com/watch?v=dQw4w9WgXcQ\u2026');
        for (const url of [
            'https://averyveryveryverylonghostnamethatgoesonandon.example.com/x/y',
            'https://docs.rotur.dev/claw/api/v2/feeds/for-you/reasons?with=a-very-long-query-string'
        ]) {
            expect(shortLinkText(url).length).toBeLessThanOrEqual(32);
        }
    });
});

import {internalMistWarpRoute, markdownLink, splitParts} from '../../src/community/components/RichText.jsx';

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
        expect(internalMistWarpRoute('https://warp.mistium.com/project/abc123#comments'))
            .toBe('/project/abc123#comments');
        expect(internalMistWarpRoute('/users/sophie/followers')).toBe('/users/sophie/followers');
    });

    test('rejects external and private destinations', () => {
        expect(internalMistWarpRoute('https://example.com/spaces/studio-1')).toBeNull();
        expect(internalMistWarpRoute('//example.com/project/abc123')).toBeNull();
        expect(internalMistWarpRoute('/admin')).toBeNull();
        expect(internalMistWarpRoute('javascript:alert(1)')).toBeNull();
    });
});

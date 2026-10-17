import {
    isPublicProject, madeWithProject, mistwarpProjectRef, pouncePostId, projectMadeWith, projectRefInText
} from '../../src/community/claw-links.js';

describe('pounce post links', () => {
    test.each([
        ['https://pounce.rotur.dev/p/abc123', 'abc123'],
        ['https://pounce.rotur.dev/p/245259f462c2a3de33002453532b9efd/', '245259f462c2a3de33002453532b9efd'],
        ['https://pounce.rotur.dev/#/p/Post_id-9', 'Post_id-9'],
        ['http://pounce.rotur.dev/#/p/abcdef?ref=share', 'abcdef']
    ])('reads %s', (url, id) => {
        expect(pouncePostId(url)).toBe(id);
    });

    test.each([
        'https://pounce.rotur.dev/u/mist',
        'https://pounce.rotur.dev/p/abc',
        'https://pounce.rotur.dev/p/has%20space',
        'https://example.com/p/abcdef',
        'https://pounce.rotur.dev.example.com/p/abcdef',
        'javascript:alert(1)',
        'not a url'
    ])('ignores %s', url => {
        expect(pouncePostId(url)).toBeNull();
    });
});

describe('MistWarp project references', () => {
    test('reads project and vanity links on MistWarp hosts', () => {
        expect(mistwarpProjectRef('https://mistwarp.org/project/p123abc')).toEqual({
            id: 'p123abc', url: 'https://mistwarp.org/project/p123abc'
        });
        expect(mistwarpProjectRef('https://warp.mistium.com/p/my-game/')).toEqual({
            slug: 'my-game', url: 'https://mistwarp.org/p/my-game'
        });
        expect(mistwarpProjectRef('https://example.com/project/p123abc')).toBeNull();
        expect(mistwarpProjectRef('https://mistwarp.org/project/p123abc/pulls')).toBeNull();
    });

    test('finds the first project link in post text', () => {
        expect(projectRefInText('Look! https://example.com/x then https://mistwarp.org/project/abc1.')).toEqual({
            id: 'abc1', url: 'https://mistwarp.org/project/abc1'
        });
        expect(projectRefInText('[my game](https://mistwarp.org/project/abc2)')).toEqual({
            id: 'abc2', url: 'https://mistwarp.org/project/abc2'
        });
        expect(projectRefInText('no links here')).toBeNull();
    });

    test('prefers made_with from the API and falls back to the text', () => {
        expect(madeWithProject({
            content: 'https://mistwarp.org/project/fromtext',
            made_with: {
                app: 'MistWarp',
                kind: 'project',
                ref: 'fromapi',
                url: 'https://mistwarp.org/project/fromapi',
                title: ' Cool game ',
                image: 'https://thumbs.example/a.png'
            }
        })).toEqual({id: 'fromapi'});
        expect(madeWithProject({
            content: 'https://mistwarp.org/project/fromtext',
            made_with: {app: 'originChats', kind: 'server', ref: 'x', url: 'https://example.com'}
        })).toEqual({id: 'fromtext', url: 'https://mistwarp.org/project/fromtext'});
        expect(madeWithProject({
            made_with: {
                app: 'MistWarp',
                kind: 'project',
                ref: '../x',
                url: 'https://mistwarp.org/p/slugged',
                image: 'javascript:alert(1)'
            }
        })).toEqual({slug: 'slugged', url: 'https://mistwarp.org/p/slugged'});
        expect(madeWithProject({content: 'hello'})).toBeNull();
        expect(madeWithProject(null)).toBeNull();
    });

    test('builds made_with for a project', () => {
        expect(projectMadeWith({
            id: 'p1', title: 'Game', thumbUrl: 'https://thumbs.example/p1.png', vanitySlug: 'great-game'
        })).toEqual({
            app: 'MistWarp',
            kind: 'project',
            ref: 'p1',
            url: 'https://mistwarp.org/p/great-game',
            title: 'Game',
            image: 'https://thumbs.example/p1.png'
        });
        expect(projectMadeWith({id: 'p2'})).toEqual({
            app: 'MistWarp', kind: 'project', ref: 'p2', url: 'https://mistwarp.org/project/p2'
        });
    });

    test('only treats shared, visible projects as public', () => {
        expect(isPublicProject({shared: true, visibility: 'public'})).toBe(true);
        expect(isPublicProject({shared: true, visibility: 'unlisted'})).toBe(true);
        expect(isPublicProject({shared: true, visibility: 'private'})).toBe(false);
        expect(isPublicProject({shared: false, visibility: 'public'})).toBe(false);
        expect(isPublicProject({shared: true, moderationHidden: true})).toBe(false);
        expect(isPublicProject(null)).toBe(false);
    });
});

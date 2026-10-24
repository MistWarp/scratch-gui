import {excerptParts, imageFor, linkedPlaces, routeFor} from '../../src/community/news-excerpt.js';

describe('news excerpts', () => {
    test('routes MistWarp links in the app and leaves others outside', () => {
        expect(routeFor('https://mistwarp.org/spaces/sp1')).toEqual({kind: 'space', id: 'sp1', to: '/spaces/sp1'});
        expect(routeFor('/p/claim-mistwarp')).toEqual({kind: 'project', slug: 'claim-mistwarp', to: '/p/claim-mistwarp'});
        expect(routeFor('https://mistwarp.org/project/p1#x')).toEqual({kind: 'project', id: 'p1', to: '/project/p1#x'});
        expect(routeFor('https://scratch.mit.edu/projects/1')).toEqual({kind: 'external', href: 'https://scratch.mit.edu/projects/1'});
    });

    test('strips markdown, drops images and keeps links as parts', () => {
        expect(excerptParts('## Hi\n\n**Bold** see [docs](https://x.dev) ![a](https://img.test/a.png)\n\n- done')).toEqual([
            {text: 'Hi. Bold see '},
            {label: 'docs', route: {kind: 'external', href: 'https://x.dev'}},
            {text: ' done'}
        ]);
    });

    test('finds a picture and the places a post points at', () => {
        const item = {body: 'Look ![shot](https://img.test/a.png) at https://mistwarp.org/p/game', link: {url: '/spaces/sp1'}};
        expect(imageFor(item)).toBe('https://img.test/a.png');
        expect(linkedPlaces(item).map(route => route.kind)).toEqual(['space', 'project']);
    });
});

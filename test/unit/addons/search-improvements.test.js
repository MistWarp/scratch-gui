import {scoreText} from '../../../src/lib/spotlight/searchUtils.js';
import {filterBackpackContents} from '../../../src/containers/backpack.jsx';
import {getDefaultShortcuts} from '../../../src/lib/shortcuts/registry.js';

describe('search improvements', () => {
    test('spotlight ranks exact, prefix, and fuzzy matches', () => {
        expect(scoreText('Sprite', 'sprite')).toBeGreaterThan(scoreText('Sprite list', 'sprite'));
        expect(scoreText('Sprite', 'sprt')).toBeGreaterThan(0);
        expect(scoreText('Costume', 'sprite')).toBe(0);
    });

    test('backpack search ranks names and understands item types', () => {
        const contents = [
            {id: '1', name: 'Walking loop', type: 'script'},
            {id: '2', name: 'Walk', type: 'costume'},
            {id: '3', name: 'Cat walk', type: 'sound'}
        ];
        expect(filterBackpackContents(contents, 'walk').map(item => item.id)).toEqual(['2', '1', '3']);
        expect(filterBackpackContents(contents, 'code').map(item => item.id)).toEqual(['1']);
    });

    test('spotlight has its own customizable shortcut', () => {
        const shortcuts = getDefaultShortcuts();
        const spotlight = shortcuts.find(shortcut => shortcut.id === 'spotlightSearch');
        const restorePoints = shortcuts.find(shortcut => shortcut.id === 'restorePoints');
        expect(spotlight.actionType).toBe('callback');
        expect(spotlight.key).not.toBe(restorePoints.key);
    });
});

import {buildRemixTree} from '../../src/community/remix-tree.js';

describe('remix tree model', () => {
    const tree = {
        root: 'original',
        nodes: [
            {id: 'branch-b', remixParent: 'original', created: 30},
            {id: 'nested', remixParent: 'branch-a', created: 40},
            {id: 'original', remixParent: '', created: 10},
            {id: 'branch-a', remixParent: 'original', created: 20}
        ]
    };

    test('sorts branches and follows the selected lineage', () => {
        const model = buildRemixTree(tree);
        expect(model.childrenOf('original').map(node => node.id)).toEqual(['branch-a', 'branch-b']);
        expect(model.pathTo('nested').map(node => node.id)).toEqual(['original', 'branch-a', 'nested']);
    });

    test('counts all descendants without looping on corrupt data', () => {
        const model = buildRemixTree({
            ...tree,
            nodes: [...tree.nodes, {id: 'loop', remixParent: 'loop'}]
        });
        expect(model.descendantCount('original')).toBe(3);
        expect(model.descendantCount('loop')).toBe(0);
    });
});

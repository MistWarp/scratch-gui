import {buildRemixTree, layoutRemixGraph, remixBranchView} from '../../src/community/remix-tree.js';

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

    test('lays generations out as connected graph columns', () => {
        const graph = layoutRemixGraph(tree);
        const byId = new Map(graph.nodes.map(entry => [entry.node.id, entry]));
        expect(byId.get('original').depth).toBe(0);
        expect(byId.get('branch-a').depth).toBe(1);
        expect(byId.get('nested').depth).toBe(2);
        expect(graph.edges.map(edge => [edge.from.node.id, edge.to.node.id])).toEqual([
            ['original', 'branch-a'],
            ['original', 'branch-b'],
            ['branch-a', 'nested']
        ]);
    });

    test('shows the selected branch and hides its siblings', () => {
        expect(remixBranchView(tree, 'original').nodes.map(node => node.id)).toEqual([
            'branch-b', 'nested', 'original', 'branch-a'
        ]);
        expect(remixBranchView(tree, 'branch-a').nodes.map(node => node.id)).toEqual([
            'nested', 'original', 'branch-a'
        ]);
        expect(layoutRemixGraph(tree, 'branch-a').nodes.map(entry => entry.node.id)).not.toContain('branch-b');
    });
});

import {layoutGraph} from '../../../src/community/components/GitGraph.jsx';

describe('MistWarp commit graph', () => {
    test('keeps branch tips in separate lanes and connects merge parents', () => {
        const graph = {
            branches: ['main', 'feature/paint'],
            branchLogs: [
                {branch: 'main', oids: ['merge', 'base']},
                {branch: 'feature/paint', oids: ['feature', 'base']}
            ],
            nodes: [
                {sha: 'merge', parents: ['base', 'feature'], branches: ['main']},
                {sha: 'feature', parents: ['base'], branches: ['feature/paint']},
                {sha: 'base', parents: [], branches: ['main', 'feature/paint']}
            ]
        };

        const layout = layoutGraph(graph, 'main');
        expect(layout.rows.find(node => node.sha === 'merge').lane).toBe(0);
        expect(layout.rows.find(node => node.sha === 'feature').lane).toBe(1);
        expect(layout.edges.map(edge => `${edge.from.sha}:${edge.to.sha}`)).toEqual([
            'merge:base',
            'merge:feature',
            'feature:base'
        ]);
    });
});

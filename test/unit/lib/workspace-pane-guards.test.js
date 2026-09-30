import installWorkspacePaneGuards from '../../../src/lib/workspace-pane-guards';

const makeDocument = matches => ({
    elementFromPoint: () => ({closest: selector => (matches.some(match => selector.includes(match)) ? {} : null)})
});

const makeWorkspace = ({deleteArea = null, inside = true} = {}) => ({
    isDeleteArea: jest.fn(() => deleteArea),
    isInsideBlocksArea: jest.fn(() => inside)
});

const event = {clientX: 10, clientY: 20};

describe('installWorkspacePaneGuards', () => {
    test('a drop on the backpack over the palette does not delete the script', () => {
        const workspace = makeWorkspace({deleteArea: 2});
        installWorkspacePaneGuards(workspace, makeDocument(['data-backpack-drop-zone']));
        expect(workspace.isDeleteArea(event)).toBe(null);
        expect(workspace.isInsideBlocksArea(event)).toBe(false);
    });

    test('the palette still deletes blocks everywhere else', () => {
        const workspace = makeWorkspace({deleteArea: 2});
        installWorkspacePaneGuards(workspace, makeDocument([]));
        expect(workspace.isDeleteArea(event)).toBe(2);
        expect(workspace.isInsideBlocksArea(event)).toBe(true);
    });

    test('the chat pane counts as outside the workspace but never blocks deleting', () => {
        const workspace = makeWorkspace({deleteArea: 2});
        installWorkspacePaneGuards(workspace, makeDocument(['data-chat-pane']));
        expect(workspace.isInsideBlocksArea(event)).toBe(false);
        expect(workspace.isDeleteArea(event)).toBe(2);
    });

    test('events without coordinates keep the original answers', () => {
        const workspace = makeWorkspace({deleteArea: 2});
        installWorkspacePaneGuards(workspace, makeDocument(['data-backpack-drop-zone']));
        expect(workspace.isDeleteArea({})).toBe(2);
        expect(workspace.isInsideBlocksArea({})).toBe(true);
    });

    test('a pointer outside the blocks area stays outside', () => {
        const workspace = makeWorkspace({inside: false});
        installWorkspacePaneGuards(workspace, makeDocument([]));
        expect(workspace.isInsideBlocksArea(event)).toBe(false);
    });
});

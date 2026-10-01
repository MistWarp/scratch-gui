const BACKPACK_DROP_ZONE = '[data-backpack-drop-zone]';
const OVERLAY_PANES = `[data-chat-pane], ${BACKPACK_DROP_ZONE}`;

const installWorkspacePaneGuards = (workspace, doc) => {
    const isOverPane = (event, selector) => {
        if (typeof event.clientX !== 'number') return false;
        const top = doc.elementFromPoint(event.clientX, event.clientY);
        return Boolean(top && top.closest && top.closest(selector));
    };

    const isDeleteArea = workspace.isDeleteArea.bind(workspace);
    workspace.isDeleteArea = event => {
        const area = isDeleteArea(event);
        if (area !== null && isOverPane(event, BACKPACK_DROP_ZONE)) return null;
        return area;
    };

    const isInsideBlocksArea = workspace.isInsideBlocksArea.bind(workspace);
    workspace.isInsideBlocksArea = event => {
        if (!isInsideBlocksArea(event)) return false;
        return !isOverPane(event, OVERLAY_PANES);
    };
};

export default installWorkspacePaneGuards;

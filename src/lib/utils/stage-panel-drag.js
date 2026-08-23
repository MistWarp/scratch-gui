/**
 * Attach pointer and mouse listeners for a stage-panel resize gesture.
 * @param {Function} onMove receives pointer and mouse movement events
 * @param {Function} onFinish runs after the first pointer or mouse release
 * @returns {Function} removes all listeners without finishing the gesture
 */
const listenForStagePanelDrag = (onMove, onFinish) => {
    let active = true;
    const handlers = {};
    const cleanup = () => {
        if (!active) return;
        active = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', handlers.finish);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', handlers.finish);
    };
    handlers.finish = () => {
        cleanup();
        onFinish();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', handlers.finish);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', handlers.finish);
    return cleanup;
};

export default listenForStagePanelDrag;

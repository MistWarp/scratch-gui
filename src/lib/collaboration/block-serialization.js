/**
 * (De)serialization of Blockly workspace events for the wire.
 * Ported from the old event-serialization.js; takes vm/workspace
 * explicitly instead of reaching into a service object.
 */

const serializeEvent = (vm, event) => {
    const json = event.toJson();

    if (event.type === 'move') {
        if (event.oldParentId) json.oldParentId = event.oldParentId;
        if (event.oldInputName) json.oldInputName = event.oldInputName;
        if (event.oldCoordinate) {
            json.oldCoordinate = `${Math.round(event.oldCoordinate.x)},${Math.round(event.oldCoordinate.y)}`;
        }
    }

    if (event.type === 'change') {
        if (typeof event.newValue !== 'undefined') json.newValue = event.newValue;
        if (typeof event.oldValue !== 'undefined') json.oldValue = event.oldValue;
        if (event.name) json.name = event.name;
        if (event.element) json.element = event.element;
    }

    if (event.type === 'comment_create') {
        if (event.xy) {
            json.xy = {x: event.xy.x, y: event.xy.y};
        }
        if (event.commentId) json.commentId = event.commentId;
        if (event.blockId) json.blockId = event.blockId;
        if (typeof event.text !== 'undefined') json.text = event.text;
        if (typeof event.width !== 'undefined') json.width = event.width;
        if (typeof event.height !== 'undefined') json.height = event.height;
        if (typeof event.minimized !== 'undefined') json.minimized = event.minimized;
        if (event.xml) {
            const ScratchBlocks = window.ScratchBlocks;
            if (ScratchBlocks && ScratchBlocks.Xml && ScratchBlocks.Xml.domToText) {
                json.xml = ScratchBlocks.Xml.domToText(event.xml);
            } else if (event.xml.outerHTML) {
                json.xml = event.xml.outerHTML;
            }
        }
    }

    if (event.type === 'comment_delete') {
        if (event.commentId) json.commentId = event.commentId;
        if (event.blockId) json.blockId = event.blockId;
    }

    if (event.type === 'comment_move') {
        if (event.commentId) json.commentId = event.commentId;
        if (event.newCoordinate_) {
            json.newCoordinate = `${Math.round(event.newCoordinate_.x)},${Math.round(event.newCoordinate_.y)}`;
        }
    }

    if (event.type === 'comment_change') {
        if (typeof event.oldContents_ !== 'undefined') json.oldContents = event.oldContents_;
        if (typeof event.newContents_ !== 'undefined') json.newContents = event.newContents_;
        if (typeof event.oldContents !== 'undefined') json.oldContents = event.oldContents;
        if (typeof event.newContents !== 'undefined') json.newContents = event.newContents;
        if (event.commentId) json.commentId = event.commentId;
    }

    if (event.type === 'var_create' || event.type === 'var_delete') {
        if (typeof event.varType !== 'undefined') json.varType = event.varType;
        if (typeof event.varName !== 'undefined') json.varName = event.varName;
        if (typeof event.isLocal !== 'undefined') json.isLocal = event.isLocal;
        if (typeof event.isCloud !== 'undefined') json.isCloud = event.isCloud;
        if (event.varId) json.varId = event.varId;
    }

    if (event.type === 'var_rename') {
        if (typeof event.oldName !== 'undefined') json.oldName = event.oldName;
        if (typeof event.newName !== 'undefined') json.newName = event.newName;
        if (event.varId) json.varId = event.varId;
    }

    const target = vm && vm.editingTarget;
    if (target) {
        json.targetName = target.getName();
    }
    for (const key of ['newCoordinate', 'oldCoordinate', 'xy', 'newCoordinate_', 'newContents_',
        'title', 'width', 'height', 'collapsed', 'blockIds', 'frameId']) {
        if (typeof event[key] !== 'undefined') json[key] = event[key];
    }
    return json;
};

const SYNCABLE_EVENTS = [
    'create', 'delete', 'change', 'move',
    'var_create', 'var_delete', 'var_rename',
    'comment_create', 'comment_delete', 'comment_change', 'comment_move',
    'frame_create', 'frame_delete', 'frame_change', 'frame_move'
];

const shouldSyncEvent = event => {
    if (!event || !event.type) {
        return false;
    }
    if (SYNCABLE_EVENTS.indexOf(event.type) === -1) {
        return false;
    }
    if (event.type === 'change') {
        if (event.element === 'select' || event.element === 'click') {
            return false;
        }
    }
    if (event.type === 'create') {
        if (event.xml && typeof event.xml === 'object' && event.xml.nodeName === 'shadow') {
            return false;
        }
    }
    return true;
};

export {
    serializeEvent,
    shouldSyncEvent
};

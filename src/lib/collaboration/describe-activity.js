import {COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX} from '../../reducers/editor-tab';

/**
 * Put into words where someone is working, e.g. "Editing costume \"walk-a\" in
 * Sprite1". Used for the peer list in the collaboration window and for the
 * Rotur presence status, so both always say the same thing.
 *
 * Names are resolved from the VM at call time rather than carried along, so a
 * rename never leaves a stale description behind.
 *
 * @param {VirtualMachine} vm The VM.
 * @param {object} activity {targetId, tab, assetIndex} — assetIndex optional.
 * @returns {string|null} The description, or null when the sprite is unknown.
 */
const describeActivity = (vm, activity) => {
    if (!vm || !vm.runtime || !activity || !activity.targetId) return null;
    const target = vm.runtime.getTargetById(activity.targetId);
    if (!target) return null;

    const where = target.isStage ? 'the Stage' : target.getName();
    const asset = typeof activity.assetIndex === 'number' ? (
        activity.tab === COSTUMES_TAB_INDEX ?
            (target.getCostumes() || [])[activity.assetIndex] :
            (target.getSounds() || [])[activity.assetIndex]
    ) : null;

    switch (activity.tab) {
    case COSTUMES_TAB_INDEX: {
        const noun = target.isStage ? 'backdrop' : 'costume';
        return asset ?
            `Editing ${noun} "${asset.name}" in ${where}` :
            `Editing ${noun}s in ${where}`;
    }
    case SOUNDS_TAB_INDEX:
        return asset ?
            `Editing sound "${asset.name}" in ${where}` :
            `Editing sounds in ${where}`;
    default:
        return `Editing code in ${where}`;
    }
};

export default describeActivity;

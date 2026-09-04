const states = new WeakMap();
export const SAVE_FEEDBACK_EVENT = 'mw:save-feedback';

export const getSaveFeedback = vm => states.get(vm) || null;

export const setSaveFeedback = (vm, value) => {
    if (!vm) return;
    states.set(vm, value);
    window.dispatchEvent(new CustomEvent(SAVE_FEEDBACK_EVENT, {detail: {vm}}));
};

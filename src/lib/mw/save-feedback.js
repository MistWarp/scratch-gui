const states = new WeakMap();
export const SAVE_FEEDBACK_EVENT = 'mw:save-feedback';

export const getSaveFeedback = vm => (states.get(vm) || {}).value || null;

export const getSaveFeedbackTime = vm => (states.get(vm) || {}).at || null;

export const setSaveFeedback = (vm, value) => {
    if (!vm) return;
    states.set(vm, {value, at: Date.now()});
    window.dispatchEvent(new CustomEvent(SAVE_FEEDBACK_EVENT, {detail: {vm}}));
};

const INTENT_PARAM = 'from';
const INTENTS = ['remix', 'scratch'];

let editorIntent = null;
let taken = false;

const takeEditorIntent = () => {
    if (taken) return editorIntent;
    taken = true;
    if (typeof location === 'undefined' || typeof URLSearchParams === 'undefined') return editorIntent;
    const params = new URLSearchParams(location.search);
    const intent = params.get(INTENT_PARAM);
    if (!INTENTS.includes(intent)) return editorIntent;
    editorIntent = intent;
    params.delete(INTENT_PARAM);
    const query = params.toString();
    try {
        history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
    } catch (e) {
        return editorIntent;
    }
    return editorIntent;
};

const resetEditorIntent = () => {
    editorIntent = null;
    taken = false;
};

export {INTENT_PARAM, takeEditorIntent, resetEditorIntent};

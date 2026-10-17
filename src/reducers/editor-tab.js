const ACTIVATE_TAB = 'scratch-gui/navigation/ACTIVATE_TAB';
const SHOW_BLOCKS_TAB = 'scratch-gui/navigation/SHOW_BLOCKS_TAB';
const REVEAL_IN_CODE = 'scratch-gui/navigation/REVEAL_IN_CODE';
const CONSUME_REVEAL = 'scratch-gui/navigation/CONSUME_REVEAL';
const ASSET_EDITOR_ACTIVATED = 'scratch-gui/navigation/ASSET_EDITOR_ACTIVATED';

// Constants use numbers to make it easier to work with react-tabs
const BLOCKS_TAB_INDEX = 0;
const COSTUMES_TAB_INDEX = 1;
const SOUNDS_TAB_INDEX = 2;
const EXTENSIONS_TAB_INDEX = 3;

const BLOCKS_MODE = 'blocks';
const CODE_MODE = 'code';
const EDITOR_MODE_KEY = 'mw:editor-mode';

const readStoredMode = () => {
    try {
        return localStorage.getItem(EDITOR_MODE_KEY) === CODE_MODE ? CODE_MODE : BLOCKS_MODE;
    } catch (e) {
        return BLOCKS_MODE;
    }
};

const storeEditorMode = mode => {
    try {
        localStorage.setItem(EDITOR_MODE_KEY, mode === CODE_MODE ? CODE_MODE : BLOCKS_MODE);
    } catch (e) {
        return;
    }
};

let nonce = 0;

const initialState = {
    activeTabIndex: BLOCKS_TAB_INDEX,
    editorMode: readStoredMode(),
    reveal: null,
    activeAssetEditor: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case ACTIVATE_TAB:
        if (state.editorMode === CODE_MODE) {
            if (action.activeTabIndex === COSTUMES_TAB_INDEX || action.activeTabIndex === SOUNDS_TAB_INDEX) {
                return Object.assign({}, state, {
                    reveal: {
                        kind: action.activeTabIndex === COSTUMES_TAB_INDEX ? 'currentCostume' : 'currentSound',
                        nonce: ++nonce
                    }
                });
            }
            return state;
        }
        return Object.assign({}, state, {
            activeTabIndex: action.activeTabIndex
        });
    case SHOW_BLOCKS_TAB:
        return Object.assign({}, state, {
            editorMode: BLOCKS_MODE,
            activeTabIndex: typeof action.activeTabIndex === 'number' ? action.activeTabIndex : state.activeTabIndex,
            reveal: null
        });
    case REVEAL_IN_CODE:
        return Object.assign({}, state, {
            editorMode: CODE_MODE,
            reveal: Object.assign({}, action.request, {nonce: ++nonce})
        });
    case CONSUME_REVEAL:
        if (!state.reveal || state.reveal.nonce !== action.nonce) return state;
        return Object.assign({}, state, {reveal: null});
    case ASSET_EDITOR_ACTIVATED:
        return Object.assign({}, state, {activeAssetEditor: action.editor || null});
    default:
        return state;
    }
};

const activateTab = function (tab) {
    return {
        type: ACTIVATE_TAB,
        activeTabIndex: tab
    };
};

const showBlocksTab = tab => ({
    type: SHOW_BLOCKS_TAB,
    activeTabIndex: tab
});

const revealInCode = request => ({
    type: REVEAL_IN_CODE,
    request: request || {kind: 'enter'}
});

const consumeReveal = id => ({
    type: CONSUME_REVEAL,
    nonce: id
});

const assetEditorActivated = editor => ({
    type: ASSET_EDITOR_ACTIVATED,
    editor: editor || null
});

export {
    reducer as default,
    initialState as editorTabInitialState,
    activateTab,
    showBlocksTab,
    revealInCode,
    consumeReveal,
    assetEditorActivated,
    storeEditorMode,
    ACTIVATE_TAB,
    SHOW_BLOCKS_TAB,
    REVEAL_IN_CODE,
    ASSET_EDITOR_ACTIVATED,
    BLOCKS_MODE,
    CODE_MODE,
    BLOCKS_TAB_INDEX,
    EXTENSIONS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
};

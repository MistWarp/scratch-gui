import {detectTheme} from '../lib/themes/themePersistance';
import {applyGuiColors} from '../lib/themes/guiHelpers';

const SET_THEME = 'scratch-gui/theme/SET_THEME';

const initialState = {
    theme: detectTheme()
};

try {
    applyGuiColors(initialState.theme);
} catch (e) {
    console.error('Failed to apply initial GUI colors for theme:', e);
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
    case SET_THEME:
        return {...state, theme: action.theme};
    default:
        return state;
    }
};

const setTheme = theme => {
    console.log('setTheme', theme);
    return {
        type: SET_THEME,
        theme
    };
};

export {
    reducer as default,
    initialState as themeInitialState,
    setTheme
};

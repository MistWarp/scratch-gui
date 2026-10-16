import {setTheme} from '../../reducers/theme.js';
import {applyTheme, applyThemeVisuals} from '../../lib/themes/themePersistance.js';

// Shared react-redux mappings for the appearance settings pages that read and change the theme.

const themeStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

const themeDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        applyTheme(theme);
    },
    onPreviewTheme: theme => {
        dispatch(setTheme(theme));
        applyThemeVisuals(theme);
    }
});

export {
    themeStateToProps,
    themeDispatchToProps
};

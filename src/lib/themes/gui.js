// This file defines all GUI themes available in the Scratch GUI

// The GUI pulls from here, you only need to update this file to add a new GUI theme

import * as guiLight from './gui/light';
import * as guiDark from './gui/dark';
import * as guiMidnight from './gui/midnight';

const GUI_LIGHT = 'light';
const GUI_DARK = 'dark';
const GUI_MIDNIGHT = 'midnight';

const GUI_MAP = {
    [GUI_LIGHT]: guiLight,
    [GUI_DARK]: guiDark,
    [GUI_MIDNIGHT]: guiMidnight
};
const GUI_DEFAULT = GUI_LIGHT;

export {
    GUI_MAP,
    GUI_DEFAULT
};

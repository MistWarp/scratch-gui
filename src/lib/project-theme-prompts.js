import {local} from '../modules/storage';

const IGNORE_STORAGE_KEY = 'mw:ignore-project-theme-prompts';

const isPlainObject = value => Boolean(value) && typeof value === 'object';

const readProjectThemeIgnoreMap = () => local.readJSON(IGNORE_STORAGE_KEY, {}, isPlainObject);

const ignoreProjectThemePrompt = promptKey => {
    const map = readProjectThemeIgnoreMap();
    map[promptKey] = true;
    local.writeJSON(IGNORE_STORAGE_KEY, map);
};

export {ignoreProjectThemePrompt, readProjectThemeIgnoreMap};

import {defineMessages} from 'react-intl';

const SET_PROJECT_TITLE = 'projectTitle/SET_PROJECT_TITLE';

const messages = defineMessages({
    defaultProjectTitle: {
        id: 'tw.gui.defaultProjectTitle',
        description: 'Default title for project',
        defaultMessage: 'Project'
    }
});
const defaultProjectTitleMessage = messages.defaultProjectTitle;

// we are initializing to a blank string instead of an actual title,
// because it would be hard to localize here
const initialState = '';

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_PROJECT_TITLE:
        return action.title;
    default:
        return state;
    }
};
const setProjectTitle = title => ({
    type: SET_PROJECT_TITLE,
    title: title
});

const isDefaultProjectTitle = (title, localeMessages) => title === defaultProjectTitleMessage.defaultMessage ||
    Boolean(localeMessages && title === localeMessages[defaultProjectTitleMessage.id]);

const projectNameForTitle = (title, localeMessages) =>
    (!title || isDefaultProjectTitle(title, localeMessages) ? '' : title);

const syncProjectNameToVm = store => {
    let namedVm = null;
    let name = null;
    const sync = () => {
        const state = store.getState();
        const {vm, projectTitle} = state.scratchGui;
        const projectName = projectNameForTitle(projectTitle, state.locales && state.locales.messages);
        if (!vm || (vm === namedVm && projectName === name)) return;
        namedVm = vm;
        name = projectName;
        vm.setProjectName(projectName);
    };
    sync();
    return store.subscribe(sync);
};

export {
    reducer as default,
    initialState as projectTitleInitialState,
    defaultProjectTitleMessage,
    isDefaultProjectTitle,
    projectNameForTitle,
    setProjectTitle,
    syncProjectNameToVm
};

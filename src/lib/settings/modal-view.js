let initialView = null;

const setSettingsModalInitialView = view => {
    initialView = view;
};

const takeSettingsModalInitialView = () => {
    const view = initialView;
    initialView = null;
    return view;
};

export {
    setSettingsModalInitialView,
    takeSettingsModalInitialView
};

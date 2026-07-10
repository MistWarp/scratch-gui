let initialView = null;

const setGitModalInitialView = view => {
    initialView = view;
};

const takeGitModalInitialView = () => {
    const view = initialView;
    initialView = null;
    return view;
};

export {
    setGitModalInitialView,
    takeGitModalInitialView
};

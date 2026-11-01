import {useCallback, useEffect, useState} from 'react';

const MOBILE_EDITOR_VIEWS = {
    editor: 'editor',
    sprites: 'sprites',
    stage: 'stage'
};

const useMobileEditorView = ({isMobileEditor, onActivateTab}) => {
    const [mobileEditorView, setMobileEditorView] = useState(MOBILE_EDITOR_VIEWS.editor);

    useEffect(() => {
        if (!isMobileEditor) {
            setMobileEditorView(MOBILE_EDITOR_VIEWS.editor);
        }
    }, [isMobileEditor]);

    const handleSelectMobileTab = useCallback(tabIndex => {
        onActivateTab(tabIndex);
        setMobileEditorView(MOBILE_EDITOR_VIEWS.editor);
    }, [onActivateTab]);

    return {
        handleSelectMobileTab,
        handleSelectMobileView: setMobileEditorView,
        mobileEditorView
    };
};

export {MOBILE_EDITOR_VIEWS};
export default useMobileEditorView;

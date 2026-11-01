import {useEffect} from 'react';

const useShortcutCallbacks = (onStartSelectingFileUpload, onClickPackager) => {
    useEffect(() => {
        if (onStartSelectingFileUpload || onClickPackager) {
            const {updateCallbacks: updateShortcutsCallbacks} = require('../../lib/shortcuts/event-router.js');
            const newCallbacks = {};
            if (onStartSelectingFileUpload) {
                newCallbacks.loadFromComputer = onStartSelectingFileUpload;
            }
            if (onClickPackager) {
                newCallbacks.openPackager = onClickPackager;
            }
            updateShortcutsCallbacks(newCallbacks);
        }
    }, [onStartSelectingFileUpload, onClickPackager]);
};

export default useShortcutCallbacks;

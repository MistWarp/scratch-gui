import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import {getGuiComponents} from './gui-components';

const AssetLibraryWindows = ({
    backdropLibraryVisible,
    costumeLibraryVisible,
    soundLibraryVisible,
    soundRecorderVisible,
    vm,
    onRequestCloseBackdropLibrary,
    onRequestCloseCostumeLibrary,
    onRequestCloseSoundLibrary
}) => {
    const {CostumeLibrary, BackdropLibrary, SoundLibrary, RecordModal} = getGuiComponents();
    return (
        <React.Fragment>
            {costumeLibraryVisible ? (
                <CostumeLibrary
                    vm={vm}
                    onRequestClose={onRequestCloseCostumeLibrary}
                />
            ) : null}
            {backdropLibraryVisible ? (
                <BackdropLibrary
                    vm={vm}
                    onRequestClose={onRequestCloseBackdropLibrary}
                />
            ) : null}
            {soundLibraryVisible ? (
                <SoundLibrary
                    vm={vm}
                    onRequestClose={onRequestCloseSoundLibrary}
                />
            ) : null}
            {soundRecorderVisible ? <RecordModal /> : null}
        </React.Fragment>
    );
};

AssetLibraryWindows.propTypes = {
    backdropLibraryVisible: PropTypes.bool,
    costumeLibraryVisible: PropTypes.bool,
    soundLibraryVisible: PropTypes.bool,
    soundRecorderVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseSoundLibrary: PropTypes.func
};

export default AssetLibraryWindows;

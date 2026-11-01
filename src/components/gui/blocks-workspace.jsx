import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import EditorWelcome from '../editor-welcome/editor-welcome.jsx';
import {Theme} from '../../lib/themes';
import PaletteFooter from './palette-footer.jsx';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const BlocksWorkspace = ({
    basePath,
    blocksId,
    canUseCloud,
    isVisible,
    stageSize,
    theme,
    vm,
    onExtensionButtonClick,
    onOpenCustomExtensionModal,
    onOpenFile
}) => {
    const {Blocks, Watermark} = getGuiComponents();
    return (
        <React.Fragment>
            <Box className={styles.blocksWrapper}>
                <Blocks
                    key={`${blocksId}/${theme.getBlocksThemeId()}`}
                    canUseCloud={canUseCloud}
                    grow={1}
                    isVisible={isVisible}
                    options={{
                        media: `${basePath}static/${theme.getBlocksMediaFolder()}/`
                    }}
                    stageSize={stageSize}
                    onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                    theme={theme}
                    vm={vm}
                />
            </Box>
            <PaletteFooter onExtensionButtonClick={onExtensionButtonClick} />
            <Box className={styles.watermark}>
                <Watermark />
            </Box>
            <EditorWelcome onOpenFile={onOpenFile} />
        </React.Fragment>
    );
};

BlocksWorkspace.propTypes = {
    basePath: PropTypes.string,
    blocksId: PropTypes.string,
    canUseCloud: PropTypes.bool,
    isVisible: PropTypes.bool,
    stageSize: PropTypes.string,
    theme: PropTypes.instanceOf(Theme),
    vm: PropTypes.instanceOf(VM).isRequired,
    onExtensionButtonClick: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onOpenFile: PropTypes.func
};

export default BlocksWorkspace;

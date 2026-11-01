import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import {isRendererSupported} from '../../lib/utils/tw-environment-support-prober.js';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const StagePanel = ({
    isFullScreen,
    isRtl,
    isStageHidden,
    panelRef,
    panelStyle,
    stageContainerWidth,
    stageSize,
    vm
}) => {
    const {TargetPane} = getGuiComponents();
    return (
        <Box
            className={classNames(styles.stageAndTargetWrapper, styles[stageSize], {
                [styles.stageHidden]: isStageHidden
            })}
            ref={panelRef}
            style={panelStyle}
        >
            <StageWrapper
                isFullScreen={isFullScreen}
                isRendererSupported={isRendererSupported()}
                isRtl={isRtl}
                isStageHidden={isStageHidden}
                stageSize={stageSize}
                stageContainerWidth={
                    typeof stageContainerWidth === 'number' ? stageContainerWidth : null
                }
                vm={vm}
            />
            {isStageHidden ? null : (
                <Box className={styles.targetWrapper}>
                    <TargetPane
                        stageSize={stageSize}
                        vm={vm}
                    />
                </Box>
            )}
        </Box>
    );
};

StagePanel.propTypes = {
    isFullScreen: PropTypes.bool,
    isRtl: PropTypes.bool,
    isStageHidden: PropTypes.bool,
    panelRef: PropTypes.shape({current: PropTypes.instanceOf(Element)}).isRequired,
    panelStyle: PropTypes.shape({
        width: PropTypes.string,
        flexBasis: PropTypes.string,
        flexGrow: PropTypes.number,
        flexShrink: PropTypes.number
    }),
    stageContainerWidth: PropTypes.number,
    stageSize: PropTypes.string.isRequired,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default StagePanel;

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import StageWrapper from '../../containers/stage-wrapper.jsx';
import MobileStageControls from '../mobile-stage-controls/mobile-stage-controls.jsx';
import {STAGE_SIZE_MODES} from '../../lib/constants/layout-constants';
import {isRendererSupported} from '../../lib/utils/tw-environment-support-prober.js';
import {getMobileStageWidth} from '../../modules/editor-layout';
import styles from './gui.css';

const useFittedStageWidth = paneRef => {
    const [stageContainerWidth, setStageContainerWidth] = useState(null);
    useEffect(() => {
        const element = paneRef.current;
        if (!element) return;
        let fitRaf = null;
        const fitStage = () => {
            if (fitRaf) return;
            fitRaf = requestAnimationFrame(() => {
                fitRaf = null;
                const style = window.getComputedStyle(element);
                const horizontalPadding = (Number.parseFloat(style.paddingLeft) || 0) +
                    (Number.parseFloat(style.paddingRight) || 0);
                const nextWidth = getMobileStageWidth(Math.max(0, element.clientWidth - horizontalPadding));
                setStageContainerWidth(prev => (
                    typeof prev === 'number' && Math.abs(prev - nextWidth) < 1 ? prev : nextWidth
                ));
            });
        };
        fitStage();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', fitStage);
            return () => {
                window.removeEventListener('resize', fitStage);
                if (fitRaf) cancelAnimationFrame(fitRaf);
            };
        }
        const observer = new ResizeObserver(fitStage);
        observer.observe(element);
        return () => {
            observer.disconnect();
            if (fitRaf) cancelAnimationFrame(fitRaf);
        };
    }, [paneRef]);
    return stageContainerWidth;
};

const MobileStagePane = ({isFullScreen, isRtl, vm}) => {
    const paneRef = useRef(null);
    const stageContainerWidth = useFittedStageWidth(paneRef);
    return (
        <Box
            className={classNames(styles.mobileEditorPane, styles.mobileStagePane)}
            ref={paneRef}
        >
            <Box className={styles.mobileStageDisplay}>
                <StageWrapper
                    hideFullscreenButton
                    isFullScreen={isFullScreen}
                    isRendererSupported={isRendererSupported()}
                    isRtl={isRtl}
                    isStageHidden={false}
                    stageSize={STAGE_SIZE_MODES.full}
                    stageContainerWidth={stageContainerWidth}
                    vm={vm}
                />
            </Box>
            <MobileStageControls vm={vm} />
        </Box>
    );
};

MobileStagePane.propTypes = {
    isFullScreen: PropTypes.bool,
    isRtl: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default MobileStagePane;

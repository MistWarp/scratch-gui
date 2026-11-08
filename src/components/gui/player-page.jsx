import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';

import StageWrapper from '../../containers/stage-wrapper.jsx';
import Alerts from '../../containers/alerts.jsx';
import {STAGE_SIZE_MODES} from '../../lib/constants/layout-constants';
import {isRendererSupported} from '../../lib/utils/tw-environment-support-prober.js';
import {isConsoleEmbed} from '../../lib/console-embed.js';
import styles from './gui.css';

const consoleEmbed = isConsoleEmbed();

const getFullscreenBackgroundColor = () => {
    if (consoleEmbed) return '#000000';
    const params = new URLSearchParams(location.search);
    if (params.has('fullscreen-background')) {
        return params.get('fullscreen-background');
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return '#111';
    }
    return 'white';
};

const fullscreenBackgroundColor = getFullscreenBackgroundColor();

const PlayerPage = ({
    alertsVisible,
    children,
    isEmbedded,
    isFullScreen,
    isRtl,
    isWindowFullScreen,
    loading,
    stageContainerWidth,
    vm
}) => (
    <React.Fragment>
        {isWindowFullScreen || consoleEmbed ? (
            <div
                className={styles.fullscreenBackground}
                style={{
                    backgroundColor: fullscreenBackgroundColor
                }}
            />
        ) : null}
        <StageWrapper
            centered={!isFullScreen && !isEmbedded}
            isFullScreen={isFullScreen}
            isEmbedded={isEmbedded}
            isRendererSupported={isRendererSupported()}
            isRtl={isRtl}
            loading={loading}
            stageContainerWidth={
                typeof stageContainerWidth === 'number' ? stageContainerWidth : null
            }
            stageSize={STAGE_SIZE_MODES.full}
            vm={vm}
        >
            {alertsVisible ? (
                <Alerts className={styles.alertsContainer} />
            ) : null}
        </StageWrapper>
        {children}
    </React.Fragment>
);

PlayerPage.propTypes = {
    alertsVisible: PropTypes.bool,
    children: PropTypes.node,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isRtl: PropTypes.bool,
    isWindowFullScreen: PropTypes.bool,
    loading: PropTypes.bool,
    stageContainerWidth: PropTypes.number,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default PlayerPage;

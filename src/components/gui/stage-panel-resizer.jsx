import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Box from '../box/box.jsx';
import styles from './gui.css';

const messages = defineMessages({
    resizeStagePanel: {
        id: 'gui.gui.resizeStagePanel',
        description: 'Accessible label for the handle between the code area and the stage panel',
        defaultMessage: 'Resize stage panel. Use left and right arrow keys.'
    }
});

const StagePanelResizer = ({intl, onDoubleClick, onKeyDown, onPointerDown}) => (
    <Box
        className={styles.stagePaneResizer}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        role="separator"
        aria-orientation="vertical"
        aria-label={intl.formatMessage(messages.resizeStagePanel)}
        tabIndex={0}
    />
);

StagePanelResizer.propTypes = {
    intl: intlShape.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    onPointerDown: PropTypes.func.isRequired
};

export default injectIntl(StagePanelResizer);

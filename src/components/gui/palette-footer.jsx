import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {PackagePlus as ExtensionIcon, Search} from 'lucide-react';

import Box from '../box/box.jsx';
import {getFindBarApi} from '../../lib/find-bar/api';
import styles from './gui.css';

const messages = defineMessages({
    addExtension: {
        id: 'gui.gui.addExtension',
        description: 'Button to add an extension in the target pane',
        defaultMessage: 'Add Extension'
    },
    findBlocks: {
        id: 'gui.gui.findBlocks',
        description: 'Button in the block palette that opens block search',
        defaultMessage: 'Find Blocks'
    }
});

const handleOpenSearch = () => {
    const findBar = getFindBarApi();
    if (findBar) findBar.expand();
};

const PaletteFooter = ({intl, onExtensionButtonClick}) => (
    <Box className={styles.paletteFooter}>
        <button
            type="button"
            className={classNames(
                styles.paletteButton,
                styles.paletteSearchButton
            )}
            title={intl.formatMessage(messages.findBlocks)}
            onClick={handleOpenSearch}
        >
            <Search
                className={styles.paletteButtonIcon}
                size={22}
            />
        </button>
        <button
            type="button"
            className={styles.paletteButton}
            title={intl.formatMessage(messages.addExtension)}
            onClick={onExtensionButtonClick}
        >
            <ExtensionIcon
                className={styles.extensionButtonIcon}
                draggable={false}
            />
            <span className={styles.paletteButtonLabel}>
                {intl.formatMessage(messages.addExtension)}
            </span>
        </button>
    </Box>
);

PaletteFooter.propTypes = {
    intl: intlShape.isRequired,
    onExtensionButtonClick: PropTypes.func
};

export default injectIntl(PaletteFooter);

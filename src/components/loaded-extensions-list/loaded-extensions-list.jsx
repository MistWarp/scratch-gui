import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';
import Box from '../box/box.jsx';
import styles from './loaded-extensions-list.css';

const LoadedExtensionsList = ({extensions, onExtensionClick}) => {
    if (extensions.length === 0) {
        return (
            <Box className={styles.noExtensions}>
                <FormattedMessage
                    defaultMessage="No extensions loaded"
                    description="Message shown when no extensions are loaded"
                    id="gui.loadedExtensions.noExtensions"
                />
            </Box>
        );
    }

    return (
        <Box className={styles.extensionsList}>
            <Box className={styles.header}>
                <FormattedMessage
                    defaultMessage="Loaded Extensions"
                    description="Header for the loaded extensions list"
                    id="gui.loadedExtensions.header"
                />
            </Box>
            {extensions.map(extension => (
                <Box
                    key={extension.id}
                    className={classNames(styles.extensionItem, {
                        [styles.clickable]: !!onExtensionClick
                    })}
                    onClick={onExtensionClick ? () => onExtensionClick(extension.id) : null}
                >
                    <Box className={styles.extensionInfo}>
                        <Box className={styles.extensionName}>
                            {extension.name}
                        </Box>
                        {extension.url && (
                            <Box className={styles.extensionUrl}>
                                {extension.url}
                            </Box>
                        )}
                    </Box>
                    <Box className={styles.blockCount}>
                        <Box className={styles.blockCountNumber}>
                            {extension.blockCount}
                        </Box>
                        <Box className={styles.blockCountLabel}>
                            <FormattedMessage
                                defaultMessage="{count, plural, one {block} other {blocks}}"
                                description="Label showing number of blocks used from extension"
                                id="gui.loadedExtensions.blockCount"
                                values={{count: extension.blockCount}}
                            />
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

LoadedExtensionsList.propTypes = {
    extensions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        url: PropTypes.string,
        blockCount: PropTypes.number.isRequired
    })).isRequired,
    onExtensionClick: PropTypes.func
};

export default LoadedExtensionsList;

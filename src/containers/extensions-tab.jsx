import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import VM from 'scratch-vm';

import Box from '../components/box/box.jsx';
import ExtensionLibrary from './extension-library.jsx';
import {
    openExtensionLibrary,
    closeExtensionLibrary,
    openCustomExtensionModal
} from '../reducers/modals';

import styles from './extensions-tab.css';
import addExtensionIcon from '../components/gui/icon--extensions.svg';

const messages = defineMessages({
    addExtension: {
        defaultMessage: 'Add Extension',
        description: 'Button to add an extension in the extensions tab',
        id: 'gui.extensionsTab.addExtension'
    }
});

class ExtensionsTab extends React.Component {
    constructor (props) {
        super(props);
        this.handleAddExtensionClick = this.handleAddExtensionClick.bind(this);
        this.handleExtensionClick = this.handleExtensionClick.bind(this);
        this.state = {
            loadedExtensions: []
        };
    }

    componentDidMount () {
        this.updateLoadedExtensions();
        // Listen for extension loading changes
        if (this.props.vm) {
            this.props.vm.on('EXTENSION_ADDED', this.updateLoadedExtensions.bind(this));
            this.props.vm.runtime.on('PROJECT_LOADED', this.updateLoadedExtensions.bind(this));
        }
    }

    componentWillUnmount () {
        if (this.props.vm) {
            this.props.vm.off('EXTENSION_ADDED', this.updateLoadedExtensions.bind(this));
            this.props.vm.runtime.off('PROJECT_LOADED', this.updateLoadedExtensions.bind(this));
        }
    }

    handleAddExtensionClick () {
        this.props.onExtensionButtonClick();
    }

    handleExtensionClick (extensionId) {
        // Handle clicks on loaded extensions - could open documentation or settings
        console.log('Extension clicked:', extensionId);
    }

    /**
     * Count blocks used by a specific extension across all targets
     * @param {string} extensionId - The extension ID to count blocks for
     * @returns {number} - Number of blocks used by this extension
     */
    countExtensionBlocks (extensionId) {
        if (!this.props.vm || !this.props.vm.runtime) return 0;

        let blockCount = 0;
        
        // Iterate through all targets (sprites and stage)
        this.props.vm.runtime.targets.forEach(target => {
            if (!target.blocks) return;
            
            // Get all blocks for this target
            const blocks = target.blocks._blocks;
            if (!blocks) return;
            
            // Count blocks that belong to this extension
            Object.values(blocks).forEach(block => {
                if (block && block.opcode && block.opcode.startsWith(extensionId + '_')) {
                    blockCount++;
                }
            });
        });

        return blockCount;
    }

    /**
     * Get information about a loaded extension
     * @param {string} extensionId - The extension ID
     * @returns {object} - Extension information including name and URL
     */
    getExtensionInfo (extensionId) {
        if (!this.props.vm || !this.props.vm.runtime) return { name: extensionId, url: null };

        // Try to get extension info from runtime block info
        const blockInfo = this.props.vm.runtime._blockInfo || [];
        const extensionInfo = blockInfo.find(info => info.id === extensionId);
        
        if (extensionInfo) {
            return {
                name: extensionInfo.name || extensionId,
                url: this.getExtensionURL(extensionId)
            };
        }

        return {
            name: extensionId,
            url: this.getExtensionURL(extensionId)
        };
    }

    /**
     * Get the URL for an extension if it's a custom extension
     * @param {string} extensionId - The extension ID
     * @returns {string|null} - The extension URL or null if it's a built-in extension
     */
    getExtensionURL (extensionId) {
        if (!this.props.vm || !this.props.vm.extensionManager) return null;
        
        const extensionURLs = this.props.vm.extensionManager.getExtensionURLs();
        return extensionURLs[extensionId] || null;
    }

    /**
     * Update the list of loaded extensions with their block counts
     */
    updateLoadedExtensions () {
        if (!this.props.vm || !this.props.vm.extensionManager) {
            this.setState({ loadedExtensions: [] });
            return;
        }

        const loadedExtensionIds = Array.from(this.props.vm.extensionManager._loadedExtensions.keys());
        const extensionsWithCounts = loadedExtensionIds.map(extensionId => {
            const blockCount = this.countExtensionBlocks(extensionId);
            const info = this.getExtensionInfo(extensionId);
            
            return {
                id: extensionId,
                name: info.name,
                url: info.url,
                blockCount: blockCount
            };
        });

        // Sort by block count (descending) and then by name
        extensionsWithCounts.sort((a, b) => {
            if (a.blockCount !== b.blockCount) {
                return b.blockCount - a.blockCount;
            }
            return a.name.localeCompare(b.name);
        });

        this.setState({ loadedExtensions: extensionsWithCounts });
    }

    render () {
        const {
            extensionLibraryVisible,
            intl,
            onCategorySelected,
            onRequestCloseExtensionLibrary,
            vm
        } = this.props;

        return (
            <Box className={styles.extensionsTab}>
                <Box className={styles.extensionsGrid}>
                    {/* Add Extension Button - always first */}
                    <Box className={styles.extensionGridItem}>
                        <button
                            className={styles.addExtensionButton}
                            title={intl.formatMessage(messages.addExtension)}
                            onClick={this.handleAddExtensionClick}
                        >
                            <img
                                className={styles.addExtensionIcon}
                                draggable={false}
                                src={addExtensionIcon}
                            />
                            <span className={styles.addExtensionText}>
                                {intl.formatMessage(messages.addExtension)}
                            </span>
                        </button>
                    </Box>

                    {/* Loaded Extensions */}
                    {this.state.loadedExtensions.map(extension => (
                        <Box
                            key={extension.id}
                            className={styles.extensionGridItem}
                            onClick={() => this.handleExtensionClick(extension.id)}
                        >
                            <Box className={styles.extensionCard}>
                                <Box className={styles.extensionName}>
                                    {extension.name}
                                </Box>
                                <Box className={styles.extensionBlockCount}>
                                    <Box className={styles.blockCountNumber}>
                                        {extension.blockCount}
                                    </Box>
                                    <Box className={styles.blockCountLabel}>
                                        {extension.blockCount === 1 ? 'block' : 'blocks'}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
                
                {extensionLibraryVisible && (
                    <ExtensionLibrary
                        vm={vm}
                        onCategorySelected={onCategorySelected}
                        onRequestClose={onRequestCloseExtensionLibrary}
                    />
                )}
            </Box>
        );
    }
}

ExtensionsTab.propTypes = {
    extensionLibraryVisible: PropTypes.bool,
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary
});

const mapDispatchToProps = dispatch => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onRequestCloseExtensionLibrary: () => dispatch(closeExtensionLibrary())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(injectIntl(ExtensionsTab));

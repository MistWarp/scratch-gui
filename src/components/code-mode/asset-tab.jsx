/* eslint-disable react/jsx-no-bind */
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {MousePointerClick} from 'lucide-react';

import PaintEditorWrapper from '../../containers/paint-editor-wrapper.jsx';
import SoundEditor from '../../containers/sound-editor.jsx';
import SoundEditorNotSupported from '../tw-sound-editor-not-supported/sound-editor-not-supported.jsx';
import {isAssetEditorActive} from '../../lib/code-mode/key-scope.js';
import messages from './messages.js';
import styles from './workbench.css';

const shouldMountAssetEditor = (tab, editingTargetId) =>
    Boolean(tab && editingTargetId && tab.targetId === editingTargetId);

const AssetTab = props => {
    const {editingTargetId, index, intl, ownerName, soundSupported, tab} = props;
    if (!shouldMountAssetEditor(tab, editingTargetId)) {
        return (
            <div className={styles.assetPlaceholder}>
                <p>{intl.formatMessage(messages.otherSprite, {name: ownerName})}</p>
                <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={props.onOpenToEdit}
                >
                    <MousePointerClick size={14} />
                    <span>{intl.formatMessage(messages.openToEdit)}</span>
                </button>
            </div>
        );
    }
    return (
        <div
            className={styles.assetTab}
            data-mw-region="asset"
        >
            {tab.kind === 'costume' ? (
                <PaintEditorWrapper
                    isActive={isAssetEditorActive}
                    selectedCostumeIndex={index}
                />
            ) : (soundSupported ? (
                <SoundEditor
                    isActive={isAssetEditorActive}
                    soundIndex={index}
                />
            ) : <SoundEditorNotSupported />)}
        </div>
    );
};

AssetTab.propTypes = {
    editingTargetId: PropTypes.string,
    index: PropTypes.number.isRequired,
    intl: intlShape,
    ownerName: PropTypes.string,
    soundSupported: PropTypes.bool,
    tab: PropTypes.shape({
        kind: PropTypes.oneOf(['costume', 'sound']).isRequired,
        targetId: PropTypes.string.isRequired
    }).isRequired,
    onOpenToEdit: PropTypes.func.isRequired
};

export {AssetTab, shouldMountAssetEditor};
export default injectIntl(AssetTab);

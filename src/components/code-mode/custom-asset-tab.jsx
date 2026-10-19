import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {Download, File as FileIcon} from 'lucide-react';

import {formatSize} from '../../lib/code-mode/custom-assets.js';
import messages from './messages.js';
import styles from './workbench.css';

const CustomAssetTab = ({format, intl, kind, name, size, url, onDownload}) => (
    <div className={styles.customAsset}>
        <div className={styles.customAssetBody}>
            {kind === 'image' && url ? (
                <img
                    alt={name}
                    className={styles.customAssetImage}
                    src={url}
                />
            ) : null}
            {kind === 'audio' && url ? (
                <audio
                    controls
                    className={styles.customAssetAudio}
                    src={url}
                />
            ) : null}
            {kind === 'binary' ? (
                <div className={styles.customAssetBinary}>
                    <FileIcon size={40} />
                    <p>{intl.formatMessage(messages.binaryAsset)}</p>
                </div>
            ) : null}
        </div>
        <div className={styles.customAssetInfo}>
            <span className={styles.customAssetName}>{name}</span>
            <span className={styles.customAssetMeta}>
                {intl.formatMessage(messages.assetInfo, {format, size: formatSize(size)})}
            </span>
            <button
                className={styles.secondaryButton}
                type="button"
                onClick={onDownload}
            >
                <Download size={14} />
                <span>{intl.formatMessage(messages.download)}</span>
            </button>
        </div>
    </div>
);

CustomAssetTab.propTypes = {
    format: PropTypes.string,
    intl: intlShape,
    kind: PropTypes.oneOf(['image', 'audio', 'binary']).isRequired,
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    url: PropTypes.string,
    onDownload: PropTypes.func.isRequired
};

export {CustomAssetTab};
export default injectIntl(CustomAssetTab);

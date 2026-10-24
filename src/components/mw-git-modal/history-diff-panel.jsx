import PropTypes from 'prop-types';
import React, {useCallback} from 'react';

import DiffView from '../../community/components/DiffView.jsx';
import {CommunityIntlProvider} from '../../community/i18n.jsx';
import scopeStyles from '../../lib/mw/community-scope.css';

import styles from './history-view.css';

const HistoryDiffPanel = ({assets, diff, fileTexts, locale}) => {
    const loadAsset = useCallback((side, path) => {
        const asset = assets && assets[path];
        const bytes = asset ? asset[side] : null;
        return Promise.resolve(bytes && bytes.length ? {bytes, mediaType: asset.mediaType || ''} : null);
    }, [assets]);
    return (
        <div className={`${scopeStyles.scope} ${styles.diffScope}`}>
            <CommunityIntlProvider
                embedded
                locale={locale}
            >
                <DiffView
                    diff={diff}
                    fileTexts={fileTexts || {}}
                    loadAsset={loadAsset}
                />
            </CommunityIntlProvider>
        </div>
    );
};

HistoryDiffPanel.propTypes = {
    assets: PropTypes.object,
    diff: PropTypes.string,
    fileTexts: PropTypes.object,
    locale: PropTypes.string
};

export default HistoryDiffPanel;

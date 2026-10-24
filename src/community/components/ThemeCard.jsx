import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {Download, Heart} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {CardStats, MediaCard, OwnerLink} from './GameCard.jsx';
import ThemePreview from './ThemePreview.jsx';
import styles from './ThemeCard.module.css';

const ThemeCard = ({returnLabel = 'Back', theme}) => {
    const {text: communityText} = useCommunityText();
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    const likes = theme.likes || 0;
    const downloads = theme.downloads || 0;
    return (
        <MediaCard
            to={`/themes/${encodeURIComponent(theme.id)}`}
            state={{themeReturnLabel: returnLabel, themeReturnTo: returnTo}}
            title={theme.name}
            media={<ThemePreview
                className={styles.preview}
                theme={theme}
            />}
            meta={(
                <>
                    {theme.owner ? <OwnerLink username={theme.owner} /> : null}
                    <CardStats
                        items={[{
                            icon: Heart,
                            label: communityText('{value1} likes', {value1: likes}),
                            value: likes
                        }, {
                            icon: Download,
                            label: communityText('{value1} downloads', {value1: downloads}),
                            value: downloads
                        }]}
                    />
                </>
            )}
        />
    );
};

ThemeCard.propTypes = {
    returnLabel: PropTypes.string,
    theme: PropTypes.object.isRequired
};

export default ThemeCard;

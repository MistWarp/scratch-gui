import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {Download, Heart} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';
import ThemePreview from './ThemePreview.jsx';
import styles from './ThemeCard.module.css';
import UserLink from './UserLink.jsx';

const ThemeCard = ({returnLabel = 'Back', theme}) => {
    const {text: communityText} = useCommunityText();
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
        <article className={styles.card}>
            <Link
                className={styles.mainLink}
                state={{themeReturnLabel: returnLabel, themeReturnTo: returnTo}}
                to={`/themes/${encodeURIComponent(theme.id)}`}
                aria-label={communityText("Open {value1}", {value1: theme.name})}
            />
            <span className={styles.thumb}><ThemePreview className={styles.preview} theme={theme} /></span>
            <span className={styles.body}>
                <span className={styles.titleRow}>
                    <strong>{theme.name}</strong>
                </span>
                <span className={styles.author}>{communityText('by ')}<UserLink username={theme.owner}>{theme.owner}</UserLink></span>
                <span className={styles.stats}>
                    <span aria-label={communityText("{value1} likes", {value1: theme.likes || 0})}>
                        <Heart aria-hidden="true" size={13} /> {theme.likes || 0}
                    </span>
                    <span aria-label={communityText("{value1} downloads", {value1: theme.downloads || 0})}>
                        <Download aria-hidden="true" size={13} /> {theme.downloads || 0}
                    </span>
                </span>
            </span>
        </article>
    );
};

ThemeCard.propTypes = {
    returnLabel: PropTypes.string,
    theme: PropTypes.object.isRequired
};

export default ThemeCard;

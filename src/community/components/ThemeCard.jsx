import PropTypes from 'prop-types';
import React from 'react';
import {Download, Heart} from 'lucide-react';
import {Link, useLocation} from 'react-router-dom';
import ThemePreview from './ThemePreview.jsx';
import styles from './ThemeCard.module.css';

const ThemeCard = ({returnLabel = 'Back', theme}) => {
    const location = useLocation();
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
        <article className={styles.card}>
            <Link
                className={styles.mainLink}
                state={{themeReturnLabel: returnLabel, themeReturnTo: returnTo}}
                to={`/themes/${encodeURIComponent(theme.id)}`}
            >
                <span className={styles.thumb}><ThemePreview className={styles.preview} theme={theme} /></span>
                <span className={styles.body}>
                    <span className={styles.titleRow}>
                        <strong>{theme.name}</strong>
                    </span>
                    <span className={styles.author}>by {theme.owner}</span>
                    <span className={styles.stats}>
                        <span aria-label={`${theme.likes || 0} likes`}>
                            <Heart aria-hidden="true" size={13} /> {theme.likes || 0}
                        </span>
                        <span aria-label={`${theme.downloads || 0} downloads`}>
                            <Download aria-hidden="true" size={13} /> {theme.downloads || 0}
                        </span>
                    </span>
                </span>
            </Link>
        </article>
    );
};

ThemeCard.propTypes = {
    returnLabel: PropTypes.string,
    theme: PropTypes.object.isRequired
};

export default ThemeCard;

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {useCommunityIntl} from '../i18n.jsx';
import CardGrid from './ui/CardGrid.jsx';
import styles from './CardGridSkeleton.module.css';

// Placeholder project cards shown while a grid's first page loads, shaped like
// ProjectCard so the page doesn't jump when the real cards arrive. Pass the
// page's own grid class to match its columns; without one it uses CardGrid.
const CardGridSkeleton = ({className, count, label}) => {
    const {text: communityText} = useCommunityIntl();
    const cards = Array.from({length: count}, (_, index) => (
        <div
            key={index}
            className={styles.card}
            aria-hidden="true"
        >
            <div className={styles.thumb} />
            <div className={styles.body}>
                <span className={styles.title} />
                <span className={styles.owner} />
                <span className={styles.stats} />
            </div>
        </div>
    ));
    const status = <span className={styles.srOnly}>{label || communityText('Loading projects…')}</span>;
    if (className) {
        return (
            <div
                className={classNames(styles.skeleton, className)}
                role="status"
                aria-busy="true"
            >{status}{cards}</div>
        );
    }
    return (
        <CardGrid
            className={styles.skeleton}
            role="status"
            aria-busy="true"
        >{status}{cards}</CardGrid>
    );
};

CardGridSkeleton.propTypes = {
    className: PropTypes.string,
    count: PropTypes.number,
    label: PropTypes.node
};

CardGridSkeleton.defaultProps = {
    count: 8
};

export default CardGridSkeleton;

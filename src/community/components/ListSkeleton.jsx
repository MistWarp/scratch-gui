import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {useCommunityIntl} from '../i18n.jsx';
import styles from './ListSkeleton.module.css';

// Placeholder rows for list pages (people, groups, posts) while the first
// page loads: a picture and a couple of lines, like the rows that replace it.
const ListSkeleton = ({className, count, label, lines, media}) => {
    const {text: communityText} = useCommunityIntl();
    return (
        <div
            className={classNames(styles.list, className)}
            role="status"
            aria-busy="true"
        >
            <span className={styles.srOnly}>{label || communityText('Loading…')}</span>
            {Array.from({length: count}, (_, index) => (
                <div
                    key={index}
                    className={styles.row}
                    aria-hidden="true"
                >
                    {media ? <span className={classNames(styles.media, styles[media])} /> : null}
                    <span className={styles.lines}>
                        {Array.from({length: lines}, (__, line) => <span key={line} />)}
                    </span>
                </div>
            ))}
        </div>
    );
};

ListSkeleton.propTypes = {
    className: PropTypes.string,
    count: PropTypes.number,
    label: PropTypes.node,
    lines: PropTypes.number,
    media: PropTypes.oneOf(['round', 'square', null])
};

ListSkeleton.defaultProps = {
    count: 6,
    lines: 2,
    media: 'round'
};

export default ListSkeleton;

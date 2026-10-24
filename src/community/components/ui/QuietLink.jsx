import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';

import styles from './QuietLink.module.css';

// Section actions that shouldn't compete with the content: dim until hovered.
const QuietLink = ({children, href, to}) => (href ?
    <a
        className={styles.link}
        href={href}
    >{children}</a> :
    <Link
        className={styles.link}
        to={to}
    >{children}</Link>);

QuietLink.propTypes = {
    children: PropTypes.node,
    href: PropTypes.string,
    to: PropTypes.string
};

export default QuietLink;

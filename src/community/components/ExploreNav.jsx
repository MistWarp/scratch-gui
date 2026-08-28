import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import styles from './ExploreNav.module.css';

const ITEMS = [
    {key: 'projects', label: 'Projects', to: '/explore'},
    {key: 'groups', label: 'Groups', to: '/groups'},
    {key: 'studios', label: 'Studios', to: '/spaces?kind=studio'},
    {key: 'challenges', label: 'Challenges', to: '/spaces?kind=challenge'},
    {key: 'collections', label: 'Collections', to: '/spaces?kind=collection'},
    {key: 'themes', label: 'Themes', to: '/themes'}
];

const ExploreNav = ({active}) => (
    <nav className={styles.nav} aria-label="Explore sections">
        {ITEMS.map(item => (
            <Link
                aria-current={active === item.key ? 'page' : null}
                className={active === item.key ? styles.active : styles.link}
                key={item.key}
                to={item.to}
            >
                {item.label}
            </Link>
        ))}
    </nav>
);

ExploreNav.propTypes = {active: PropTypes.oneOf(ITEMS.map(item => item.key)).isRequired};

export default ExploreNav;

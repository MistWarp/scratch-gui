import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import styles from './ExploreNav.module.css';

// Games and the places that gather them first, then people, then the rest.
const GROUPS = [
    [
        {key: 'projects', label: 'Games', to: '/explore'},
        {key: 'challenges', label: 'Challenges', to: '/spaces?kind=challenge'},
        {key: 'studios', label: 'Studios', to: '/spaces?kind=studio'},
        {key: 'collections', label: 'Collections', to: '/spaces?kind=collection'}
    ],
    [
        {key: 'creators', label: 'Creators', to: '/leaderboard?board=loves'},
        {key: 'posts', label: 'Posts', to: '/posts'},
        {key: 'groups', label: 'Groups', to: '/groups'}
    ],
    [
        {key: 'themes', label: 'Themes', to: '/themes'},
        {key: 'bounties', label: 'Bounties', to: '/bounties'}
    ]
];
const ITEMS = GROUPS.flat();

const ExploreNav = ({active}) => {
    const {text: communityText} = useCommunityText();
    const navRef = useRef(null);
    useEffect(() => {
        const nav = navRef.current;
        const current = nav && nav.querySelector('[aria-current="page"]');
        if (!current || nav.scrollWidth <= nav.clientWidth) return;
        nav.scrollLeft = current.offsetLeft - nav.offsetLeft - ((nav.clientWidth - current.offsetWidth) / 2);
    }, [active]);
    return (
        <nav
            className={styles.nav}
            ref={navRef}
            aria-label={communityText('Explore sections')}
        >
            {GROUPS.map((group, index) => (
                <div
                    key={index}
                    className={styles.group}
                >
                    {group.map(item => (
                        <Link
                            aria-current={active === item.key ? 'page' : null}
                            className={active === item.key ? styles.active : styles.link}
                            key={item.key}
                            to={item.to}
                        >
                            {communityText(item.label)}
                        </Link>
                    ))}
                </div>
            ))}
        </nav>
    );
};

ExploreNav.propTypes = {active: PropTypes.oneOf(ITEMS.map(item => item.key)).isRequired};

export default ExploreNav;

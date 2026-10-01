import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import {Building2, Coins, Gamepad2, Layers3, Library, Palette, Trophy} from 'lucide-react';
import styles from './ExploreNav.module.css';

const ITEMS = [
    {key: 'projects', label: 'Projects', to: '/explore', icon: Gamepad2},
    {key: 'studios', label: 'Studios', to: '/spaces?kind=studio', icon: Layers3},
    {key: 'challenges', label: 'Challenges', to: '/spaces?kind=challenge', icon: Trophy},
    {key: 'collections', label: 'Collections', to: '/spaces?kind=collection', icon: Library},
    {key: 'groups', label: 'Groups', to: '/groups', icon: Building2},
    {key: 'bounties', label: 'Bounties', to: '/bounties', icon: Coins},
    {key: 'themes', label: 'Themes', to: '/themes', icon: Palette}
];

const ExploreNav = ({active}) => {
    const {text: communityText} = useCommunityText();
    const navRef = useRef(null);
    useEffect(() => {
        const nav = navRef.current;
        const current = nav && nav.querySelector('[aria-current="page"]');
        if (!current || nav.scrollWidth <= nav.clientWidth) return;
        nav.scrollLeft = current.offsetLeft - nav.offsetLeft - ((nav.clientWidth - current.offsetWidth) / 2);
    }, [active]);
    return (<nav className={styles.nav} ref={navRef} aria-label={communityText('Explore sections')}>
        {ITEMS.map(({icon: Icon, ...item}) => (
            <Link
                aria-current={active === item.key ? 'page' : null}
                className={active === item.key ? styles.active : styles.link}
                key={item.key}
                to={item.to}
            >
                <Icon size={16} aria-hidden="true" />
                {communityText(item.label)}
            </Link>
        ))}
    </nav>);
};

ExploreNav.propTypes = {active: PropTypes.oneOf(ITEMS.map(item => item.key)).isRequired};

export default ExploreNav;

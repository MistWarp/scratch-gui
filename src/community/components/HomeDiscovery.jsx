import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Star, UserPlus} from 'lucide-react';
import api from '../api';
import rotur from '../rotur.js';
import {track} from '../analytics';
import {useCommunityIntl} from '../i18n.jsx';
import useAfterLogin from '../use-after-login.js';
import Avatar from './Avatar.jsx';
import FeaturedProject from './FeaturedProject.jsx';
import Button from './ui/Button.jsx';
import styles from './HomeDiscovery.module.css';

const sameName = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

const SuggestedCreators = ({viewerName}) => {
    const {text} = useCommunityIntl();
    const [creators, setCreators] = useState([]);
    const [followed, setFollowed] = useState({});
    useEffect(() => {
        let active = true;
        Promise.all([
            api.leaderboard('loves'),
            viewerName ? rotur.following(viewerName).catch(() => ({following: []})) : {following: []}
        ]).then(([board, follows]) => {
            if (!active) return;
            const following = follows.following || [];
            setCreators((board.users || [])
                .filter(creator => !sameName(creator.username, viewerName) &&
                    !following.some(name => sameName(name, creator.username)))
                .slice(0, 5));
        })
            .catch(() => active && setCreators([]));
        return () => {
            active = false;
        };
    }, [viewerName]);
    const follow = useAfterLogin(async username => {
        setFollowed(current => ({...current, [username]: true}));
        try {
            await rotur.follow(username);
            track('suggested_creator_followed');
        } catch (e) {
            setFollowed(current => ({...current, [username]: false}));
        }
    }, 'follow');
    if (!creators.length) return null;
    return (
        <section>
            <div className={styles.head}>
                <h2><UserPlus size={19} />{text('Creators to follow')}</h2>
                <Link to="/leaderboard">{text('See all')}</Link>
            </div>
            <div className={styles.creators}>
                {creators.map(creator => (
                    <div key={creator.username} className={styles.creator}>
                        <Link to={`/users/${creator.username}`}><Avatar username={creator.username} size={40} /></Link>
                        <Link to={`/users/${creator.username}`} className={styles.creatorBody}>
                            <strong>{creator.username}</strong>
                            <span>
                                {text('{value1} projects · {value2} hearts', {
                                    value1: creator.projects,
                                    value2: creator.loves
                                })}
                            </span>
                        </Link>
                        <Button
                            variant="secondary"
                            disabled={Boolean(followed[creator.username])}
                            onClick={() => follow(creator.username)}
                        >
                            {followed[creator.username] ? text('Following') : text('Follow')}
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
};

SuggestedCreators.propTypes = {
    viewerName: PropTypes.string
};

const HomeDiscovery = ({viewerName, side}) => {
    const {text} = useCommunityIntl();
    const [featured, setFeatured] = useState(null);
    useEffect(() => {
        let active = true;
        api.featuredProject()
            .then(data => active && setFeatured(data.project || null))
            .catch(() => active && setFeatured(null));
        return () => {
            active = false;
        };
    }, []);
    return (
        <div className={featured ? styles.grid : null}>
            {featured ? (
                <section>
                    <div className={styles.head}>
                        <h2><Star size={19} />{text('Featured today')}</h2>
                    </div>
                    <FeaturedProject project={featured} />
                </section>
            ) : null}
            {side || <SuggestedCreators viewerName={viewerName} />}
        </div>
    );
};

HomeDiscovery.propTypes = {
    viewerName: PropTypes.string,
    side: PropTypes.node
};

export default HomeDiscovery;

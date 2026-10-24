import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {BarChart3, CalendarDays, Megaphone, Newspaper, Rocket} from 'lucide-react';
import api from '../api';
import {useCommunityIntl} from '../i18n.jsx';
import loadProjectPreview from '../project-preview.js';
import {excerptParts, imageFor, linkedPlaces} from '../news-excerpt.js';
import Avatar from './Avatar.jsx';
import styles from './NewsParts.module.css';

// Shared by the News page and home's News section, so the two match.

export const NEWS_KINDS = {
    update: {label: 'Update', plural: 'Updates', icon: Megaphone},
    release: {label: 'Release', plural: 'Releases', icon: Rocket},
    event: {label: 'Event', plural: 'Events', icon: CalendarDays},
    poll: {label: 'Poll', plural: 'Polls', icon: BarChart3},
    general: {label: 'General', plural: 'General', icon: Newspaper}
};

export const kindOf = item => (NEWS_KINDS[item && item.category] ? item.category : 'general');

export const PLACES = PropTypes.objectOf(PropTypes.shape({title: PropTypes.string, thumbUrl: PropTypes.string}));

const placeKey = route => `${route.kind}:${route.id || route.slug}`;
const placeCache = new Map();
const loadPlace = route => {
    const key = placeKey(route);
    if (!placeCache.has(key)) {
        const request = route.kind === 'space' ?
            api.getSpace(route.id).then(data => {
                const space = (data && data.space) || data || {};
                return {title: space.title, thumbUrl: space.thumbnailUrl};
            }) :
            loadProjectPreview(route.id ? {id: route.id} : {slug: route.slug})
                .then(project => (project ? {title: project.title, thumbUrl: project.thumbUrl} : null));
        placeCache.set(key, request.catch(() => null));
    }
    return placeCache.get(key);
};

/**
 * Titles and thumbnails of the projects and spaces some posts link to.
 * @param {?Array.<object>} items news items
 * @returns {object} places by key
 */
export const usePlaces = items => {
    const [places, setPlaces] = useState({});
    useEffect(() => {
        let active = true;
        const routes = (items || []).flatMap(linkedPlaces);
        Promise.all(routes.map(route => loadPlace(route).then(place => [placeKey(route), place])))
            .then(entries => active && setPlaces(Object.fromEntries(entries.filter(([, place]) => place))));
        return () => {
            active = false;
        };
    }, [items]);
    return places;
};

/**
 * A real picture for a post: its first image, or the thumbnail of a project
 * or space it links to. Never a made-up one.
 * @param {object} item news item
 * @param {object} places from usePlaces
 * @returns {?string} image URL
 */
export const coverFor = (item, places) => {
    const image = imageFor(item);
    if (image) return image;
    const place = linkedPlaces(item).map(route => places[placeKey(route)])
        .find(found => found && found.thumbUrl);
    return place ? place.thumbUrl : null;
};

// The lead story's picture, or nothing when the post has none.
export const NewsCover = ({className, item, places}) => {
    const [failed, setFailed] = useState(false);
    const image = coverFor(item, places);
    if (!image || failed) return null;
    return (
        <Link
            className={`${styles.cover} ${className || ''}`}
            to={`/news/${item.id}`}
            tabIndex={-1}
            aria-hidden="true"
        >
            <img
                src={image}
                alt=""
                loading="lazy"
                onError={() => setFailed(true)}
            />
        </Link>
    );
};

NewsCover.propTypes = {
    className: PropTypes.string,
    item: PropTypes.shape({id: PropTypes.string}).isRequired,
    places: PLACES.isRequired
};

// A small square for list rows: the picture, or a quiet mark for the kind.
export const NewsThumb = ({item, places}) => {
    const [failed, setFailed] = useState(false);
    const image = coverFor(item, places);
    const Icon = NEWS_KINDS[kindOf(item)].icon;
    return (
        <Link
            className={styles.thumb}
            to={`/news/${item.id}`}
            tabIndex={-1}
            aria-hidden="true"
        >
            {image && !failed ? (
                <img
                    src={image}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <Icon
                    className={styles.mark}
                    aria-hidden="true"
                />
            )}
        </Link>
    );
};

NewsThumb.propTypes = {
    item: PropTypes.shape({category: PropTypes.string, id: PropTypes.string}).isRequired,
    places: PLACES.isRequired
};

const linkLabel = (part, places, text) => {
    if (part.label) return part.label;
    const route = part.route;
    if (route.kind === 'project' || route.kind === 'space') {
        const place = places[placeKey(route)];
        if (place && place.title) return place.title;
        return route.kind === 'space' ? text('the space') : text('the project');
    }
    if (route.kind === 'user') return `@${route.name}`;
    if (route.kind === 'external') {
        try {
            return new URL(route.href).hostname.replace(/^www\./, '');
        } catch (e) {
            return route.href;
        }
    }
    return route.to;
};

// Plain text with the post's links kept as links, named after what they open.
export const Excerpt = ({className, item, places}) => {
    const {text} = useCommunityIntl();
    return (
        <p className={`${styles.excerpt} ${className || ''}`}>
            {excerptParts(item.body).map((part, index) => {
                if (part.text) return <React.Fragment key={index}>{part.text}</React.Fragment>;
                const label = linkLabel(part, places, text);
                return part.route.kind === 'external' ? (
                    <a
                        key={index}
                        href={part.route.href}
                        target="_blank"
                        rel="noopener noreferrer"
                    >{label}</a>
                ) : (
                    <Link
                        key={index}
                        to={part.route.to}
                    >{label}</Link>
                );
            })}
        </p>
    );
};

Excerpt.propTypes = {
    className: PropTypes.string,
    item: PropTypes.shape({body: PropTypes.string}).isRequired,
    places: PLACES.isRequired
};

// Avatar and name, the same size everywhere a person is credited.
export const AuthorLink = ({username}) => (username ? (
    <Link
        className={styles.author}
        to={`/users/${username}`}
    >
        <Avatar
            className={styles.authorAvatar}
            username={username}
            size={18}
        />
        <span>{username}</span>
    </Link>
) : null);

AuthorLink.propTypes = {
    username: PropTypes.string
};

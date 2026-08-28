import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api, {projectUrl} from '../api';
import styles from './RichText.module.css';

const MENTION = /^@[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/;
const MARKDOWN_LINK = /^\[([^\]\n]{1,80})\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)$/;
const TOKEN = new RegExp(
    '\\[[^\\]\\n]{1,80}\\]\\((?:https?:\\/\\/[^\\s)]+|\\/[^\\s)]*)\\)|' +
    'https?:\\/\\/[^\\s]+|@[A-Za-z0-9][A-Za-z0-9_-]{0,19}',
    'g'
);
const PUBLIC_ROUTES = [
    /^\/$/,
    /^\/explore\/?$/,
    /^\/project\/[A-Za-z0-9]+\/?$/,
    /^\/users\/[A-Za-z0-9][A-Za-z0-9_-]{0,19}(?:\/(?:followers|following))?\/?$/,
    /^\/spaces\/?$/,
    /^\/spaces\/[A-Za-z0-9_-]+\/?$/,
    /^\/(?:news|leaderboard|roadmap|trust|support|status)\/?$/
];

export const splitParts = text => {
    const parts = [];
    let last = 0;
    let match;
    TOKEN.lastIndex = 0;
    while ((match = TOKEN.exec(text)) !== null) {
        const start = match.index;
        const value = match[0];
        if (value.startsWith('@') && start > 0 && /[A-Za-z0-9_-]/.test(text[start - 1])) {
            continue;
        }
        parts.push(text.slice(last, start));
        parts.push(value);
        last = start + value.length;
    }
    parts.push(text.slice(last));
    return parts;
};

const titleCache = new Map();
const spaceCache = new Map();

const fetchTitle = id => {
    if (!titleCache.has(id)) {
        titleCache.set(id, api.getProject(id)
            .then(data => (data.project && data.project.title) || id)
            .catch(() => id));
    }
    return titleCache.get(id);
};

const ProjectLink = ({id}) => {
    const [title, setTitle] = useState(null);
    useEffect(() => {
        let cancelled = false;
        fetchTitle(id).then(t => !cancelled && setTitle(t));
        return () => {
            cancelled = true;
        };
    }, [id]);
    return <Link className={styles.internalLink} to={projectUrl(id)}>{title || id}</Link>;
};

const fetchSpace = id => {
    if (!spaceCache.has(id)) {
        spaceCache.set(id, api.getSpace(id)
            .then(data => data.space || null)
            .catch(() => null));
    }
    return spaceCache.get(id);
};

const SpaceLink = ({id}) => {
    const [space, setSpace] = useState(null);
    useEffect(() => {
        let cancelled = false;
        fetchSpace(id).then(value => !cancelled && setSpace(value));
        return () => {
            cancelled = true;
        };
    }, [id]);
    return (
        <Link className={styles.internalLink} to={`/spaces/${id}`}>
            {space && space.title ? space.title : id}
        </Link>
    );
};

export const internalMistWarpRoute = destination => {
    try {
        if (destination.startsWith('//')) return null;
        const base = typeof window === 'undefined' ? 'https://warp.mistium.com' : window.location.origin;
        const parsed = new URL(destination, base);
        const localHosts = ['warp.mistium.com'];
        if (typeof window !== 'undefined') localHosts.push(window.location.host);
        if (!localHosts.includes(parsed.host)) return null;
        if (!PUBLIC_ROUTES.some(pattern => pattern.test(parsed.pathname))) return null;
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (e) {
        return null;
    }
};

export const markdownLink = value => {
    const match = String(value).match(MARKDOWN_LINK);
    return match ? {label: match[1], destination: match[2]} : null;
};

const InternalLink = ({route, label}) => {
    if (label) return <Link className={styles.internalLink} to={route}>{label}</Link>;
    if (route === '/') return <Link className={styles.internalLink} to="/">MistWarp</Link>;
    const project = route.match(/^\/project\/([A-Za-z0-9]+)\/?$/);
    if (project) return <ProjectLink id={project[1]} />;
    const space = route.match(/^\/spaces\/([A-Za-z0-9_-]+)\/?$/);
    if (space) return <SpaceLink id={space[1]} />;
    const user = route.match(/^\/users\/([A-Za-z0-9][A-Za-z0-9_-]{0,19})\/?$/);
    if (user) return <Link className={styles.mention} to={route}>@{user[1]}</Link>;
    return <Link className={styles.internalLink} to={route}>{route}</Link>;
};

const RichText = ({text}) => splitParts(String(text || ''))
    .map((part, index) => {
        if (MENTION.test(part)) {
            return (
                <Link
                    key={index}
                    className={styles.mention}
                    to={`/users/${part.slice(1)}`}
                >{part}</Link>
            );
        }
        const markdown = markdownLink(part);
        if (markdown) {
            const route = internalMistWarpRoute(markdown.destination);
            if (route) return <InternalLink key={index} route={route} label={markdown.label} />;
            return (
                <a
                    key={index}
                    className={styles.externalLink}
                    href={markdown.destination}
                    target="_blank"
                    rel="noreferrer"
                >
                    {markdown.label}
                </a>
            );
        }
        if (!/^https?:\/\//.test(part)) {
            return part;
        }
        const trailing = part.match(/[.,!?)]+$/);
        const url = trailing ? part.slice(0, -trailing[0].length) : part;
        const rest = trailing ? trailing[0] : '';
        const route = internalMistWarpRoute(url);
        if (route) {
            return (
                <React.Fragment key={index}>
                    <InternalLink route={route} />
                    {rest}
                </React.Fragment>
            );
        }
        return (
            <React.Fragment key={index}>
                <a
                    className={styles.externalLink}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                >{url.replace(/^https?:\/\//, '')}</a>
                {rest}
            </React.Fragment>
        );
    });

export default RichText;

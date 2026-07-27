import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import api, {projectUrl} from '../api';

const TOKEN = /https?:\/\/[^\s]+|@[A-Za-z0-9_]+/g;

const splitParts = text => {
    const parts = [];
    let last = 0;
    let match;
    TOKEN.lastIndex = 0;
    while ((match = TOKEN.exec(text)) !== null) {
        const start = match.index;
        const value = match[0];
        if (value.startsWith('@') && start > 0 && /[A-Za-z0-9_]/.test(text[start - 1])) {
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
    return <Link className="mw-project-link" to={projectUrl(id)}>{title || id}</Link>;
};

const projectIdFrom = url => {
    try {
        const parsed = new URL(url);
        if (parsed.host !== 'warp.mistium.com' && parsed.host !== window.location.host) {
            return null;
        }
        const match = parsed.pathname.match(/^\/project\/([A-Za-z0-9]+)\/?$/);
        return match ? match[1] : null;
    } catch (e) {
        return null;
    }
};

const RichText = ({text}) => splitParts(String(text || ''))
    .map((part, index) => {
        if (/^@[A-Za-z0-9_]+$/.test(part)) {
            return (
                <Link
                    key={index}
                    to={`/users/${part.slice(1)}`}
                >{part}</Link>
            );
        }
        if (!/^https?:\/\//.test(part)) {
            return part;
        }
        const trailing = part.match(/[.,!?)]+$/);
        const url = trailing ? part.slice(0, -trailing[0].length) : part;
        const rest = trailing ? trailing[0] : '';
        const id = projectIdFrom(url);
        if (id) {
            return (
                <React.Fragment key={index}>
                    <ProjectLink id={id} />
                    {rest}
                </React.Fragment>
            );
        }
        return (
            <React.Fragment key={index}>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                >{url.replace(/^https?:\/\//, '')}</a>
                {rest}
            </React.Fragment>
        );
    });

export default RichText;

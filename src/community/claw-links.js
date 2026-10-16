import {projectUrl} from './api.js';

const SITE = 'https://mistwarp.org';
const MISTWARP_HOSTS = ['mistwarp.org', 'www.mistwarp.org', 'warp.mistium.com'];
const POUNCE_HOSTS = ['pounce.rotur.dev'];
const POST_ID = /^[A-Za-z0-9_-]{6,64}$/;
const PROJECT_ID = /^[A-Za-z0-9]{1,80}$/;
const PROJECT_PATH = /^\/project\/([A-Za-z0-9]{1,80})\/?$/;
const VANITY_PATH = /^\/p\/([A-Za-z0-9-]{3,40})\/?$/;
const URL_IN_TEXT = /https?:\/\/[^\s<>()]+/g;

const parseUrl = value => {
    try {
        const url = new URL(String(value));
        return /^https?:$/.test(url.protocol) ? url : null;
    } catch (e) {
        return null;
    }
};

const decode = value => {
    try {
        return decodeURIComponent(value);
    } catch (e) {
        return null;
    }
};

const httpUrl = value => {
    const url = typeof value === 'string' ? parseUrl(value) : null;
    return url ? url.href : '';
};

const pouncePostId = value => {
    const url = parseUrl(value);
    if (!url || !POUNCE_HOSTS.includes(url.hostname.toLowerCase())) return null;
    const path = url.pathname === '/' ? url.hash.replace(/^#/, '').split('?')[0] : url.pathname;
    const match = path.match(/^\/p\/([^/]+)\/?$/);
    const id = match ? decode(match[1]) : null;
    return id && POST_ID.test(id) ? id : null;
};

const localHosts = () => {
    const hosts = [...MISTWARP_HOSTS];
    if (typeof window !== 'undefined' && window.location && window.location.host) hosts.push(window.location.host);
    return hosts;
};

const mistwarpProjectRef = value => {
    const url = parseUrl(value);
    if (!url || !localHosts().includes(url.host.toLowerCase())) return null;
    const project = url.pathname.match(PROJECT_PATH);
    if (project) return {id: project[1], url: `${SITE}/project/${project[1]}`};
    const vanity = url.pathname.match(VANITY_PATH);
    if (vanity) return {slug: vanity[1], url: `${SITE}/p/${vanity[1]}`};
    return null;
};

const projectRefInText = text => {
    for (const match of String(text || '').matchAll(URL_IN_TEXT)) {
        const ref = mistwarpProjectRef(match[0].replace(/[.,!?]+$/, ''));
        if (ref) return ref;
    }
    return null;
};

const madeWithProject = post => {
    if (!post || typeof post !== 'object') return null;
    const made = post.made_with;
    if (made && typeof made === 'object' && String(made.app || '').toLowerCase() === 'mistwarp' &&
        made.kind === 'project') {
        const ref = typeof made.ref === 'string' && PROJECT_ID.test(made.ref) ? made.ref : null;
        const fromUrl = ref ? null : mistwarpProjectRef(made.url);
        if (ref || fromUrl) {
            const project = ref ? {id: ref} : {...fromUrl};
            const title = typeof made.title === 'string' ? made.title.trim().slice(0, 120) : '';
            const image = httpUrl(made.image);
            if (title) project.title = title;
            if (image) project.image = image;
            return project;
        }
    }
    return projectRefInText(post.content);
};

const projectShareUrl = project => `${SITE}${projectUrl(project)}`;

const projectMadeWith = project => {
    const made = {app: 'MistWarp', kind: 'project', ref: String(project.id), url: projectShareUrl(project)};
    const title = String(project.title || '').trim()
        .slice(0, 120);
    const image = httpUrl(project.thumbUrl);
    if (title) made.title = title;
    if (image) made.image = image;
    return made;
};

const sitePostUrl = id => `${SITE}/posts/${encodeURIComponent(id)}`;

export {
    madeWithProject,
    mistwarpProjectRef,
    pouncePostId,
    projectMadeWith,
    projectRefInText,
    projectShareUrl,
    sitePostUrl
};

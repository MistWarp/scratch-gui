import React, {useEffect, useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import {Code2, Eye, FileCode2, FileQuestion} from 'lucide-react';
import api from '../api.js';
import FileBrowserTree from './FileBrowserTree.jsx';
import styles from './ProjectFiles.module.css';

export {buildProjectFileTree, initiallyOpenFolders} from './FileBrowserTree.jsx';

const snapshotCache = new Map();
const fileContentCache = new Map();
const SNAPSHOT_CACHE_LIMIT = 24;
const FILE_CONTENT_CACHE_LIMIT = 32;
const FILE_CONTENT_CACHE_BYTES = 64 * 1024 * 1024;
let cachedFileBytes = 0;
const MAX_READABLE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MEDIA_PREVIEW_BYTES = 25 * 1024 * 1024;
const MEDIA_TYPES = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime'
};

const mediaTypeForPath = path => MEDIA_TYPES[path.split('.').pop().toLowerCase()] || '';
const decodeBase64 = value => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

export const projectSnapshotCacheKey = project =>
    `${project.id || project.workspaceUrl}:${project.gitHead || 'HEAD'}:${project.workspaceUrl}`;

export const canLoadProjectSnapshot = project => Boolean(
    project.id && project.gitHead
);

export const canCacheProjectSnapshot = project => (
    project.shared === true && (project.visibility || 'public') === 'public' &&
    Number(project.price || 0) <= 0
);

const rememberSnapshot = (key, request) => {
    snapshotCache.set(key, request);
    if (snapshotCache.size > SNAPSHOT_CACHE_LIMIT) {
        snapshotCache.delete(snapshotCache.keys().next().value);
    }
};

const loadSnapshot = project => {
    const key = projectSnapshotCacheKey(project);
    const cacheable = canCacheProjectSnapshot(project);
    if (!cacheable || !snapshotCache.has(key)) {
        const request = api.commitTree(project.id, project.gitHead)
            .then(result => ({
                head: result.sha,
                remote: true,
                cacheable,
                files: (result.files || []).map(file => ({
                    ...file,
                    mediaType: mediaTypeForPath(file.path)
                }))
            }))
            .catch(error => {
                if (cacheable) snapshotCache.delete(key);
                throw error;
            });
        if (!cacheable) return request;
        rememberSnapshot(key, request);
    }
    const hit = snapshotCache.get(key);
    if (cacheable && hit) {
        snapshotCache.delete(key);
        snapshotCache.set(key, hit);
    }
    return hit;
};

const forgetOldestFileContent = () => {
    const oldestKey = fileContentCache.keys().next().value;
    const oldest = fileContentCache.get(oldestKey);
    if (oldest) cachedFileBytes -= oldest.size;
    fileContentCache.delete(oldestKey);
};

const rememberFileContent = (key, request, size) => {
    fileContentCache.set(key, {request, size});
    cachedFileBytes += size;
    for (
        let overLimit = fileContentCache.size > FILE_CONTENT_CACHE_LIMIT ||
            cachedFileBytes > FILE_CONTENT_CACHE_BYTES;
        overLimit;
        overLimit = fileContentCache.size > FILE_CONTENT_CACHE_LIMIT ||
            cachedFileBytes > FILE_CONTENT_CACHE_BYTES
    ) {
        forgetOldestFileContent();
    }
    return request;
};

export const loadProjectFileContent = (projectId, snapshot, file) => {
    if (!snapshot.remote) return Promise.resolve(file);
    const mediaType = file.mediaType || mediaTypeForPath(file.path);
    const readable = !file.binary && file.size <= MAX_READABLE_FILE_BYTES;
    const previewable = Boolean(mediaType) && file.size <= MAX_MEDIA_PREVIEW_BYTES;
    if (!readable && !previewable) return Promise.resolve({...file, binary: true, mediaType});
    const cacheKey = `${projectId}:${snapshot.head}:${file.path}`;
    if (snapshot.cacheable && fileContentCache.has(cacheKey)) {
        const cached = fileContentCache.get(cacheKey);
        fileContentCache.delete(cacheKey);
        fileContentCache.set(cacheKey, cached);
        return cached.request;
    }
    const request = api.commitFile(projectId, snapshot.head, file.path).then(result => {
        const bytes = decodeBase64(result.content || '');
        return {
            ...file,
            binary: !readable,
            mediaType,
            text: readable ? new TextDecoder().decode(bytes) : null,
            media: previewable ? bytes : null
        };
    }).catch(error => {
        const cached = fileContentCache.get(cacheKey);
        if (cached) cachedFileBytes -= cached.size;
        fileContentCache.delete(cacheKey);
        throw error;
    });
    if (!snapshot.cacheable || file.size > FILE_CONTENT_CACHE_BYTES) return request;
    return rememberFileContent(cacheKey, request, file.size);
};

const FRACTCH_KEYWORDS = new Set([
    'at', 'broadcast', 'center', 'clone', 'costume', 'current', 'else', 'forever', 'from', 'if', 'layer',
    'repeat', 'return', 'sound', 'sprite', 'stop', 'target', 'until', 'use', 'var', 'vars', 'wait', 'when', 'while'
]);
const FRACTCH_VALUES = new Set(['false', 'null', 'true']);
const FRACTCH_TOKEN = new RegExp(
    String.raw`/\*|\*/|//|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|` +
    String.raw`\b\d+(?:\.\d+)?\b|\b[A-Za-z_][\w-]*\b|[^\w\s]`,
    'g'
);

export const highlightFractch = text => {
    let inComment = false;
    return text.split('\n').map(line => {
        const tokens = [];
        let cursor = 0;
        const push = (value, kind = '') => {
            if (value) tokens.push({value, kind});
        };
        while (cursor < line.length) {
            if (inComment) {
                const end = line.indexOf('*/', cursor);
                if (end < 0) {
                    push(line.slice(cursor), 'comment');
                    cursor = line.length;
                } else {
                    push(line.slice(cursor, end + 2), 'comment');
                    cursor = end + 2;
                    inComment = false;
                }
                continue;
            }
            FRACTCH_TOKEN.lastIndex = cursor;
            const match = FRACTCH_TOKEN.exec(line);
            if (!match) {
                push(line.slice(cursor));
                break;
            }
            if (match.index > cursor) push(line.slice(cursor, match.index));
            const value = match[0];
            if (value === '//') {
                push(line.slice(match.index), 'comment');
                break;
            }
            if (value === '/*') {
                const end = line.indexOf('*/', match.index + 2);
                if (end < 0) {
                    push(line.slice(match.index), 'comment');
                    inComment = true;
                    break;
                }
                push(line.slice(match.index, end + 2), 'comment');
                cursor = end + 2;
                continue;
            }
            let kind = '';
            if (/^["']/.test(value)) kind = 'string';
            else if (/^\d/.test(value)) kind = 'number';
            else if (FRACTCH_KEYWORDS.has(value)) kind = 'keyword';
            else if (FRACTCH_VALUES.has(value)) kind = 'value';
            else if (/^[^\w\s]+$/.test(value)) kind = 'operator';
            push(value, kind);
            cursor = match.index + value.length;
        }
        return tokens;
    });
};

export const formatXml = text => {
    const tokens = String(text || '')
        .replace(/>\s+</g, '><')
        .match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<\/?[^>]+>|[^<]+/g) || [];
    let depth = 0;
    const out = [];
    for (const token of tokens) {
        const trimmed = token.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('</')) depth = Math.max(0, depth - 1);
        out.push(`${'  '.repeat(depth)}${trimmed}`);
        if (/^<(?!\/|!|\?)/.test(trimmed) && !trimmed.endsWith('/>')) depth++;
    }
    return out.join('\n');
};

const XML_TOKEN = /<!--[\s\S]*?-->|"(?:\\.|[^"\\])*"|<\/?[A-Za-z_][\w:.-]*|\/?>|=[^\S\n]*|[^<"\s=]+|\s+/g;

export const highlightXml = text => text.split('\n').map(line => {
    const tokens = [];
    let cursor = 0;
    XML_TOKEN.lastIndex = cursor;
    let match;
    while ((match = XML_TOKEN.exec(line)) !== null) {
        if (match.index > cursor) tokens.push({value: line.slice(cursor, match.index), kind: ''});
        const value = match[0];
        let kind = '';
        if (/^<!--/.test(value)) kind = 'comment';
        else if (/^"/.test(value)) kind = 'string';
        else if (/^<\/?[A-Za-z_]/.test(value) || value === '/>') kind = 'keyword';
        else if (/^>$/.test(value) || /^=$/.test(value)) kind = 'operator';
        else if (/^\s+$/.test(value)) kind = '';
        tokens.push({value, kind});
        cursor = match.index + value.length;
        if (value && cursor >= line.length) break;
    }
    if (cursor < line.length) tokens.push({value: line.slice(cursor), kind: ''});
    return tokens.filter(token => token.value);
});

const formatSize = value => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const ProjectFiles = ({project, onCount, initialPath, onSelectPath, bounded}) => {
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    const [selectedPath, setSelectedPath] = useState('');
    const [selectedContent, setSelectedContent] = useState(null);
    const [contentError, setContentError] = useState('');
    const [contentLoading, setContentLoading] = useState(false);
    const [viewMode, setViewMode] = useState('code');
    const [mediaUrl, setMediaUrl] = useState('');
    const initialPathRef = useRef(initialPath);
    initialPathRef.current = initialPath;

    useEffect(() => {
        let active = true;
        setSnapshot(null);
        setError('');
        if (!canLoadProjectSnapshot(project)) {
            setError('This project does not have a saved file archive yet.');
            return () => {};
        }
        loadSnapshot(project).then(result => {
            if (!active) return;
            setSnapshot(result);
            onCount(result.files.length);
            const requested = result.files.find(file => file.path === initialPathRef.current);
            const first = requested || result.files.find(file => !file.binary) || result.files[0];
            setSelectedPath(first ? first.path : '');
        }).catch(loadError => {
            if (active) setError(loadError.message || 'Could not load project files.');
        });
        return () => {
            active = false;
        };
    }, [project.gitHead, project.workspaceUrl, onCount]);

    const files = snapshot ? snapshot.files : [];
    useEffect(() => {
        if (initialPath && files.some(file => file.path === initialPath)) setSelectedPath(initialPath);
    }, [files, initialPath]);
    const selectedFile = files.find(file => file.path === selectedPath) || null;
    useEffect(() => {
        let active = true;
        setSelectedContent(null);
        setContentError('');
        if (!selectedFile || !snapshot) {
            setContentLoading(false);
            return () => {};
        }
        setContentLoading(true);
        loadProjectFileContent(project.id, snapshot, selectedFile).then(file => {
            if (active) setSelectedContent(file);
        }).catch(loadError => {
            if (active) setContentError(loadError.message || 'Could not load this file.');
        }).finally(() => {
            if (active) setContentLoading(false);
        });
        return () => {
            active = false;
        };
    }, [project.id, selectedFile, snapshot]);
    const selected = selectedContent || selectedFile;
    useEffect(() => {
        setViewMode(selected?.media ? 'preview' : 'code');
        if (!selected?.media || !selected.mediaType) {
            setMediaUrl('');
            return () => {};
        }
        const url = URL.createObjectURL(new Blob([selected.media], {type: selected.mediaType}));
        setMediaUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [selected]);
    const lines = useMemo(() => {
        if (!selected || selected.binary || typeof selected.text !== 'string') return [];
        if (/\.fractch$/i.test(selected.path)) return highlightFractch(selected.text);
        if (/\.svg$/i.test(selected.path)) return highlightXml(formatXml(selected.text));
        return selected.text.split('\n').map(line => [{value: line, kind: ''}]);
    }, [selected]);
    const selectFile = path => {
        setSelectedPath(path);
        onSelectPath(path);
    };

    if (error) return <div className={styles.state}>{error}</div>;
    if (!snapshot) return <div className={styles.state}>Loading project files…</div>;
    if (!files.length) return <div className={styles.state}>This project has no files.</div>;

    return (
        <section className={`${styles.browser} ${bounded ? styles.browserBounded : ''}`}>
            <FileBrowserTree files={files} selectedPath={selectedPath} onSelect={selectFile} showCount />
            <article className={styles.viewer}>
                {selected ? (
                    <React.Fragment>
                        <header>
                            <FileCode2 size={15} />
                            <strong>{selected.path}</strong>
                            <span>{formatSize(selected.size)}</span>
                            <code>{snapshot.head.slice(0, 7)}</code>
                            {selected.media && !selected.binary ? (
                                <div className={styles.viewModes}>
                                    <button
                                        type="button"
                                        className={viewMode === 'preview' ? styles.viewModeActive : styles.viewMode}
                                        onClick={() => setViewMode('preview')}
                                    ><Eye size={13} /> Preview</button>
                                    <button
                                        type="button"
                                        className={viewMode === 'code' ? styles.viewModeActive : styles.viewMode}
                                        onClick={() => setViewMode('code')}
                                    ><Code2 size={13} /> Source</button>
                                </div>
                            ) : null}
                        </header>
                        {contentLoading ? (
                            <div className={styles.state}>Loading file…</div>
                        ) : contentError ? (
                            <div className={styles.state}>{contentError}</div>
                        ) : selected.media && viewMode === 'preview' && mediaUrl ? (
                            <div className={styles.mediaPreview}>
                                {selected.mediaType.startsWith('image/') ? (
                                    <img src={mediaUrl} alt={`Preview of ${selected.path}`} />
                                ) : selected.mediaType.startsWith('audio/') ? (
                                    <audio controls src={mediaUrl}><track kind="captions" /></audio>
                                ) : (
                                    <video controls src={mediaUrl}><track kind="captions" /></video>
                                )}
                            </div>
                        ) : selected.binary ? (
                            <div className={styles.binaryState}>
                                <FileQuestion size={30} />
                                <strong>Binary file</strong>
                                <span>
                                    {selected.mediaType && !selected.media ?
                                        `${formatSize(selected.size)} · This file is too large to preview.` :
                                        `${formatSize(selected.size)} · Preview is not available.`}
                                </span>
                            </div>
                        ) : (
                            <div className={styles.code} role="region" aria-label={`${selected.path} contents`}>
                                {lines.map((line, index) => (
                                    <div className={styles.codeLine} key={index}>
                                        <span>{index + 1}</span><code>{line.length ? line.map((token, tokenIndex) => (
                                            <span
                                                className={token.kind ? styles[`token-${token.kind}`] : null}
                                                key={`${tokenIndex}-${token.value}`}
                                            >{token.value}</span>
                                        )) : ' '}</code>
                                    </div>
                                ))}
                            </div>
                        )}
                    </React.Fragment>
                ) : <div className={styles.state}>Select a file to read it.</div>}
            </article>
        </section>
    );
};

ProjectFiles.propTypes = {
    bounded: PropTypes.bool,
    project: PropTypes.object.isRequired,
    onCount: PropTypes.func,
    initialPath: PropTypes.string,
    onSelectPath: PropTypes.func
};

ProjectFiles.defaultProps = {
    bounded: false,
    onCount: () => {},
    initialPath: '',
    onSelectPath: () => {}
};

export default ProjectFiles;

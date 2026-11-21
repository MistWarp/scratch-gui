/* eslint-disable max-len */
import React, {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {File, FileAudio, FileCode2, FileImage, Folder, FolderOpen, History, Search} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api from '../../api';
import {commitHeadline} from '../../commit-summary.js';
import {getCommunityLocale} from '../../locale.js';
import {safeDate, timeAgo} from '../../format.js';
import useLatest from '../../use-latest.js';
import Avatar from '../../components/Avatar.jsx';
import {ProjectFileViewer, loadProjectSnapshot} from '../../components/ProjectFiles.jsx';
import UserLink from '../../components/UserLink.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import useCommitSummaries from './use-commit-summaries.js';
import styles from '../ProjectCode.module.css';

const IMAGE_FILE = /\.(svg|png|jpe?g|gif|webp|bmp|ico)$/i;
const AUDIO_FILE = /\.(wav|mp3|ogg|m4a|flac)$/i;
const CODE_FILE = /\.(fractch|json|js|md|txt)$/i;

export const encodeCodePath = path => String(path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');

export const codeEntryUrl = (baseUrl, kind, path, query = '') => {
    const encoded = encodeCodePath(path);
    const url = encoded ? `${baseUrl}/code/${kind}/${encoded}` : `${baseUrl}/code`;
    return query ? `${url}?${query}` : url;
};

export const listDirectory = (files, dir) => {
    const prefix = dir ? `${dir}/` : '';
    const entries = new Map();
    (files || []).forEach(file => {
        if (!file.path.startsWith(prefix)) return;
        const rest = file.path.slice(prefix.length);
        const slash = rest.indexOf('/');
        if (slash < 0) {
            entries.set(rest, {name: rest, path: file.path, dir: false, file});
            return;
        }
        const name = rest.slice(0, slash);
        if (!entries.has(name)) entries.set(name, {name, path: `${prefix}${name}`, dir: true});
    });
    return Array.from(entries.values()).sort((a, b) => {
        if (a.dir !== b.dir) return a.dir ? -1 : 1;
        return a.name.localeCompare(b.name, [], {numeric: true, sensitivity: 'base'});
    });
};

export const searchFiles = (files, query) => {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return [];
    return (files || []).filter(file => file.path.toLowerCase().includes(needle)).slice(0, 200);
};

const entryIcon = entry => {
    if (entry.dir) return Folder;
    if (IMAGE_FILE.test(entry.name)) return FileImage;
    if (AUDIO_FILE.test(entry.name)) return FileAudio;
    if (CODE_FILE.test(entry.name)) return FileCode2;
    return File;
};

const CommitCell = ({baseUrl, sha, commit, summary}) => {
    const {text: communityText} = useCommunityText();
    if (!sha || !commit) return <span className={styles.rowMessage} />;
    const headline = commitHeadline(commit.message, summary, communityText, getCommunityLocale());
    return (
        <Link className={styles.rowMessage} to={`${baseUrl}/commits/${sha}`} title={headline.detail || headline.title}>
            {headline.title}
        </Link>
    );
};

const CommitTime = ({commit}) => {
    const date = commit ? safeDate(commit.date) : null;
    if (!date) return <span className={styles.rowTime} />;
    return <time className={styles.rowTime} dateTime={date.toISOString()} title={date.toLocaleString()}>{timeAgo(commit.date)}</time>;
};

const FolderCommit = ({baseUrl, sha, commit, summary, commitCount, commitsUrl}) => {
    const {text: communityText} = useCommunityText();
    if (!sha || !commit) return null;
    const headline = commitHeadline(commit.message, summary, communityText, getCommunityLocale());
    const date = safeDate(commit.date);
    return (
        <div className={styles.latest}>
            {commit.author ? (
                <UserLink className={styles.latestAuthor} username={commit.author}>
                    <Avatar username={commit.author} size={24} />
                    <span>{commit.author}</span>
                </UserLink>
            ) : null}
            <Link className={styles.latestMessage} to={`${baseUrl}/commits/${sha}`}>
                <span>{headline.title}</span>
                {headline.detail ? <small>{headline.detail}</small> : null}
            </Link>
            <code>{sha.slice(0, 7)}</code>
            {date ? <time dateTime={date.toISOString()}>{timeAgo(commit.date)}</time> : null}
            {commitCount ? (
                <Link className={styles.latestCount} to={commitsUrl}>
                    <History size={15} />
                    {commitCount === 1 ? communityText('1 commit') : communityText('{value1} commits', {value1: commitCount})}
                </Link>
            ) : null}
        </div>
    );
};

const Breadcrumb = ({baseUrl, query, rootLabel, path}) => {
    const parts = path.split('/').filter(Boolean);
    return (
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to={codeEntryUrl(baseUrl, 'tree', '', query)}>{rootLabel}</Link>
            {parts.map((part, index) => {
                const partPath = parts.slice(0, index + 1).join('/');
                const last = index === parts.length - 1;
                return (
                    <React.Fragment key={partPath}>
                        <span aria-hidden="true">{'/'}</span>
                        {last ? <strong aria-current="page">{part}</strong> : <Link to={codeEntryUrl(baseUrl, 'tree', partPath, query)}>{part}</Link>}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

const CodeBrowser = ({project, baseUrl, kind, path, query, headCommit, commitCount, commitsUrl, toolbar, onFileCount}) => {
    const {text: communityText} = useCommunityText();
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    const [lastCommits, setLastCommits] = useState(null);
    const [search, setSearch] = useState('');
    const beginLoad = useLatest();
    const head = project.gitHead;

    useEffect(() => {
        const fresh = beginLoad();
        setSnapshot(null);
        setError('');
        setLastCommits(null);
        loadProjectSnapshot(project)
            .then(fresh(result => {
                setSnapshot(result);
                onFileCount(result.files.length);
            }))
            .catch(fresh(loadError => setError(loadError.message || communityText('Could not load project files.'))));
        api.commitLastCommits(project.id, head)
            .then(fresh(result => setLastCommits(result && result.paths ? result : {paths: {}, commits: {}})))
            .catch(fresh(() => setLastCommits({paths: {}, commits: {}})));
    }, [project.id, head]);

    useEffect(() => {
        setSearch('');
    }, [path, kind]);

    const files = snapshot ? snapshot.files : [];
    const shas = useMemo(() => {
        const values = Object.values((lastCommits && lastCommits.paths) || {});
        if (headCommit) values.unshift(headCommit.sha);
        return Array.from(new Set(values));
    }, [lastCommits, headCommit]);
    const summaries = useCommitSummaries(project.id, shas);
    const commitFor = entryPath => {
        const sha = lastCommits && lastCommits.paths[entryPath];
        return sha ? {sha, commit: lastCommits.commits[sha]} : {sha: '', commit: null};
    };

    if (error) return <StatusMessage error>{error}</StatusMessage>;
    if (!snapshot) return <StatusMessage>{communityText('Loading project files…')}</StatusMessage>;

    const rootLabel = project.title;
    if (kind === 'blob') {
        const file = files.find(entry => entry.path === path);
        if (!file) {
            return (
                <EmptyState icon={FileCode2} title={communityText('This file does not exist on this branch')}>
                    <Link to={codeEntryUrl(baseUrl, 'tree', '', query)}>{communityText('Go to the project files')}</Link>
                </EmptyState>
            );
        }
        const latest = commitFor(path);
        return (
            <div className={styles.browserStack}>
                <Breadcrumb baseUrl={baseUrl} query={query} rootLabel={rootLabel} path={path} />
                <FolderCommit baseUrl={baseUrl} sha={latest.sha} commit={latest.commit} summary={summaries[latest.sha]} />
                <ProjectFileViewer className={styles.fileViewer} project={project} snapshot={snapshot} file={file} title={file.path.split('/').pop()} />
            </div>
        );
    }

    const entries = listDirectory(files, path);
    if (path && !entries.length) {
        return (
            <EmptyState icon={FolderOpen} title={communityText('This folder does not exist on this branch')}>
                <Link to={codeEntryUrl(baseUrl, 'tree', '', query)}>{communityText('Go to the project files')}</Link>
            </EmptyState>
        );
    }
    const folderLatest = path ? commitFor(path) : (headCommit ? {sha: headCommit.sha, commit: headCommit} : {sha: '', commit: null});
    const matches = searchFiles(files, search);
    const parentPath = path.split('/').slice(0, -1).join('/');

    return (
        <div className={styles.browserStack}>
            <div className={styles.toolbar}>
                {toolbar}
                {path ? <Breadcrumb baseUrl={baseUrl} query={query} rootLabel={rootLabel} path={path} /> : null}
                <label className={styles.fileSearch}>
                    <Search size={15} />
                    <input
                        type="search"
                        value={search}
                        placeholder={communityText('Go to file')}
                        aria-label={communityText('Go to file')}
                        onChange={event => setSearch(event.target.value)}
                    />
                </label>
            </div>
            <section className={styles.listing}>
                <FolderCommit
                    baseUrl={baseUrl}
                    sha={folderLatest.sha}
                    commit={folderLatest.commit}
                    summary={summaries[folderLatest.sha]}
                    commitCount={path ? null : commitCount}
                    commitsUrl={commitsUrl}
                />
                {search.trim() ? (
                    matches.length ? (
                        <ul className={styles.rows}>
                            {matches.map(file => {
                                const Icon = entryIcon({name: file.path, dir: false});
                                return (
                                    <li key={file.path}>
                                        <Icon size={16} className={styles.rowIcon} />
                                        <Link className={styles.rowName} to={codeEntryUrl(baseUrl, 'blob', file.path, query)}>{file.path}</Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <EmptyState compact icon={Search} title={communityText('No files match')}>
                            {communityText('Try a different file name.')}
                        </EmptyState>
                    )
                ) : (
                    <ul className={styles.rows}>
                        {path ? (
                            <li>
                                <FolderOpen size={16} className={styles.rowIcon} />
                                <Link className={styles.rowName} to={codeEntryUrl(baseUrl, 'tree', parentPath, query)} aria-label={communityText('Parent folder')}>{'..'}</Link>
                            </li>
                        ) : null}
                        {entries.map(entry => {
                            const Icon = entryIcon(entry);
                            const latest = commitFor(entry.path);
                            return (
                                <li key={entry.path}>
                                    <Icon size={16} className={entry.dir ? styles.rowFolderIcon : styles.rowIcon} />
                                    <Link className={styles.rowName} to={codeEntryUrl(baseUrl, entry.dir ? 'tree' : 'blob', entry.path, query)}>{entry.name}</Link>
                                    <CommitCell baseUrl={baseUrl} sha={latest.sha} commit={latest.commit} summary={summaries[latest.sha]} />
                                    <CommitTime commit={latest.commit} />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default CodeBrowser;

/* eslint-disable max-len */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {
    CircleDashed, ExternalLink, GitFork, Lock
} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import api, {editorUrl, projectUrl} from '../api';
import {useUser} from '../UserContext.jsx';
import {useResolvedProjectId, projectBaseUrl} from '../use-resolved-project-id.js';
import {canViewProjectSource} from '../project-source-access';
import {uncommittedSummaryDetail} from '../commit-summary.js';
import {formatBytes, safeDate, timeAgo} from '../format.js';
import {getCommunityLocale} from '../locale.js';
import setPageMeta from '../page-meta.js';
import {hasRemixDivergence, remixParentLabel} from '../remix-origin.js';
import useLatest from '../use-latest.js';
import Avatar from '../components/Avatar.jsx';
import ForkStatus from '../components/ForkStatus.jsx';
import ProjectBranches from '../components/ProjectBranches.jsx';
import RichText from '../components/RichText.jsx';
import UnderlineTabs from '../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../components/SectionTabs.jsx';
import UserLink from '../components/UserLink.jsx';
import ViewModeSwitch from '../components/ViewModeSwitch.jsx';
import {withShareKey} from '../developer-mode.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SelectMenu from '../components/ui/SelectMenu.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import CodeBrowser from './project/CodeBrowser.jsx';
import CommentThread from '../components/CommentThread.jsx';
import scrollToAnchorWithRetry from '../scroll-to-anchor.js';
import HistoryList from './project/HistoryList.jsx';
import projectCommentSource from './project/comment-source.js';
import IssueList from './project/IssueList.jsx';
import IssueThread from './project/IssueThread.jsx';
import ProjectPreview from './project/ProjectPreview.jsx';
import PullList from './project/PullList.jsx';
import ReleaseList from './project/ReleaseList.jsx';
import useProjectData from './project/use-project-data.js';
import useRemixSync from '../use-remix-sync.js';
import styles from './ProjectCode.module.css';

const TAB_ID_PREFIX = 'project-code';
export const CODE_TABS = ['code', 'issues', 'comments', 'commits', 'branches', 'pulls', 'releases'];
export const codeLocation = splat => {
    const parts = String(splat || '').split('/').filter(Boolean);
    if (parts[0] === 'tree' || parts[0] === 'blob') return {tab: 'code', kind: parts[0], path: parts.slice(1).join('/')};
    if (parts[0] === 'issues' && /^\d+$/.test(parts[1] || '')) return {tab: 'issues', kind: 'issue', path: '', number: Number(parts[1])};
    return {tab: CODE_TABS.includes(parts[0]) ? parts[0] : 'code', kind: 'tree', path: ''};
};
export const codeTabPath = (baseUrl, tab) => (tab === 'code' ? `${baseUrl}/code` : `${baseUrl}/code/${tab}`);

export const commitContributors = commits => {
    const counts = new Map();
    (commits || []).forEach(commit => {
        const name = String(commit.author || '').trim();
        if (!name) return;
        const key = name.toLowerCase();
        const entry = counts.get(key) || {username: name, commits: 0};
        entry.commits += 1;
        counts.set(key, entry);
    });
    return Array.from(counts.values()).sort((a, b) => b.commits - a.commits || a.username.localeCompare(b.username));
};

const Count = ({value}) => (typeof value === 'number' ? <b>{value}</b> : null);

const ReadmePanel = ({project}) => {
    const {text: communityText} = useCommunityText();
    if (!project.instructions && !project.notes) return null;
    return (
        <section className={styles.readme}>
            <h2>{communityText('About this project')}</h2>
            {project.instructions ? (
                <div>
                    <h3>{communityText('Instructions')}</h3>
                    <p><RichText text={project.instructions} /></p>
                </div>
            ) : null}
            {project.notes ? (
                <div>
                    <h3>{communityText('Creator notes')}</h3>
                    <p><RichText text={project.notes} /></p>
                </div>
            ) : null}
        </section>
    );
};

const AboutPanel = ({project, baseUrl, shareKey, counts, fileCount, contributors}) => {
    const {text: communityText} = useCommunityText();
    const rows = [
        {key: 'commits', tab: 'commits', value: counts.commits, one: communityText('1 commit'), many: communityText('{value1} commits', {value1: counts.commits})},
        {key: 'branches', tab: 'branches', value: counts.branches, one: communityText('1 branch'), many: communityText('{value1} branches', {value1: counts.branches})},
        {key: 'issues', tab: 'issues', value: counts.issues, one: communityText('1 open issue'), many: communityText('{value1} open issues', {value1: counts.issues})},
        {key: 'pulls', tab: 'pulls', value: counts.pulls, one: communityText('1 open pull request'), many: communityText('{value1} open pull requests', {value1: counts.pulls})},
        {key: 'releases', tab: 'releases', value: counts.releases, one: communityText('1 release'), many: communityText('{value1} releases', {value1: counts.releases})}
    ].filter(row => typeof row.value === 'number');
    const updated = safeDate(project.edited);
    return (
        <aside className={styles.side}>
            <ProjectPreview key={project.id} project={project} />
            <section>
                <h2>{communityText('Details')}</h2>
                {(project.tags || []).length ? (
                    <div className={styles.tags}>
                        {project.tags.map(tag => <Link key={tag} to={`/search?q=${encodeURIComponent(`#${tag}`)}`}>{`#${tag}`}</Link>)}
                    </div>
                ) : null}
                <ul className={styles.facts}>
                    {rows.map(row => (
                        <li key={row.key}><Link to={withShareKey(codeTabPath(baseUrl, row.tab), shareKey)}>{row.value === 1 ? row.one : row.many}</Link></li>
                    ))}
                    {fileCount !== null ? <li>{fileCount === 1 ? communityText('1 file') : communityText('{value1} files', {value1: fileCount})}</li> : null}
                    {project.sizeBytes ? <li>{communityText('{value1} in total', {value1: formatBytes(project.sizeBytes)})}</li> : null}
                    {updated ? <li>{communityText('Updated {value1}', {value1: timeAgo(project.edited)})}</li> : null}
                </ul>
                <ul className={styles.facts}>
                    <li><Link to={withShareKey(`${baseUrl}#reviews`, shareKey)}>{communityText('Read reviews')}</Link></li>
                    <li><Link to={withShareKey(`/project/${project.id}/remixes`, shareKey)}>{communityText('See the remix tree')}</Link></li>
                </ul>
            </section>
            {contributors.length ? (
                <section>
                    <h2>{communityText('Contributors')}</h2>
                    <ul className={styles.people}>
                        {contributors.map(person => (
                            <li key={person.username}>
                                <UserLink username={person.username}>
                                    <Avatar username={person.username} size={28} />
                                    <span>{person.username}</span>
                                </UserLink>
                                <small>{person.commits === 1 ? communityText('1 commit') : communityText('{value1} commits', {value1: person.commits})}</small>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </aside>
    );
};

const canMaintainProject = project => Boolean(
    project.isOwner || project.myRole === 'owner' || project.myRole === 'maintainer'
);

const ProjectCodePage = ({id, vanitySlug}) => {
    const {text: communityText} = useCommunityText();
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const {hash: locationHash} = useLocation();
    const {user} = useUser();
    const viewerName = (user && user.username) || '';
    const {project, versionHistory, error, load, loadHistory, refreshProjectAndHistory} = useProjectData(id);
    const [branches, setBranches] = useState(null);
    const [openPulls, setOpenPulls] = useState(null);
    const [releaseCount, setReleaseCount] = useState(null);
    const [issueCounts, setIssueCounts] = useState(null);
    const [fileCount, setFileCount] = useState(null);
    const beginExtras = useLatest();
    const place = codeLocation(params['*']);
    const tab = place.tab;
    const baseUrl = projectBaseUrl({project, projectId: id, vanitySlug});
    const canView = Boolean(project && canViewProjectSource(project));
    const shareKey = searchParams.get('k') || '';

    const commentSource = useMemo(() => projectCommentSource(id), [id]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        if (tab !== 'comments' || !canView) return;
        if (!/^#comment-id-./.test(locationHash)) return;
        return scrollToAnchorWithRetry(locationHash.slice(1));
    }, [tab, canView, locationHash]);
    useEffect(() => {
        if (canView) loadHistory();
    }, [canView, loadHistory]);

    const loadBranches = useCallback(() => {
        if (!id || !canView) return;
        const fresh = beginExtras();
        api.branches(id).then(fresh(data => setBranches(data.branches || []))).catch(fresh(() => setBranches([])));
        api.pulls(id).then(fresh(data => setOpenPulls((data.pulls || []).filter(pull => pull.state === 'open').length))).catch(() => {});
        api.releases(id).then(fresh(data => setReleaseCount((data.releases || []).length))).catch(() => {});
        api.getComments(id, {limit: 1, issue: 'open'}).then(fresh(data => setIssueCounts(data.issueCounts || null))).catch(() => {});
    }, [beginExtras, canView, id]);
    const remixSync = useRemixSync({
        projectId: id,
        remixFrom: project?.remixFrom || null,
        onSynced: () => {
            loadBranches();
            return refreshProjectAndHistory();
        }
    });
    const refreshIssueCounts = useCallback(() => {
        api.getComments(id, {limit: 1, issue: 'open'}).then(data => setIssueCounts(data.issueCounts || null)).catch(() => {});
    }, [id]);
    useEffect(() => {
        setBranches(null);
        setOpenPulls(null);
        setReleaseCount(null);
        setIssueCounts(null);
        setFileCount(null);
        loadBranches();
    }, [loadBranches]);

    useEffect(() => {
        if (project) setPageMeta({title: communityText('Developer view · {value1}', {value1: project.title})});
    }, [project && project.title]);

    const defaultBranch = (project && project.gitBranch) || (versionHistory && versionHistory.branch) || 'main';
    const requestedBranch = searchParams.get('branch') || '';
    const selectedBranch = (branches || []).find(branch => branch.name === requestedBranch) ||
        (branches || []).find(branch => branch.name === defaultBranch) || null;
    const branchName = selectedBranch ? selectedBranch.name : defaultBranch;
    const browseProject = useMemo(() => {
        if (!project || !selectedBranch || !selectedBranch.head || selectedBranch.head === project.gitHead) return project;
        return {...project, gitHead: selectedBranch.head, gitBranch: selectedBranch.name};
    }, [project, selectedBranch && selectedBranch.head, selectedBranch && selectedBranch.name]);
    const latestCommit = selectedBranch && selectedBranch.head ?
        {sha: selectedBranch.head, author: selectedBranch.author, date: selectedBranch.date, message: selectedBranch.message} :
        (versionHistory && versionHistory.commits && versionHistory.commits[0]) || null;
    const contributors = useMemo(() => commitContributors(versionHistory && versionHistory.commits), [versionHistory]);
    const counts = {
        commits: project ? Number(project.commitCount) || (versionHistory?.commits?.length ?? null) : null,
        branches: branches ? branches.length : null,
        pulls: openPulls,
        releases: releaseCount,
        issues: issueCounts ? issueCounts.open : null
    };
    const hasIssues = Boolean(issueCounts && (issueCounts.open || issueCounts.done));
    const visibleTabs = CODE_TABS.filter(key => key !== 'issues' || !project || !project.issuesOff ||
        hasIssues || issueCounts === null || tab === 'issues');

    const pickBranch = name => {
        const next = new URLSearchParams(searchParams);
        if (name && name !== defaultBranch) next.set('branch', name);
        else next.delete('branch');
        setSearchParams(next);
    };
    const branchQuery = selectedBranch && selectedBranch.name === requestedBranch && requestedBranch !== defaultBranch ?
        `branch=${encodeURIComponent(requestedBranch)}` : '';
    const onFileCount = useCallback(count => setFileCount(count), []);
    const showTab = key => navigate(withShareKey(key === 'code' && branchQuery ? `${codeTabPath(baseUrl, key)}?${branchQuery}` : codeTabPath(baseUrl, key), shareKey));

    if (error && !project) return <main className={styles.page}><StatusMessage error onRetry={load}>{error}</StatusMessage></main>;
    if (!project) return <main className={styles.page}><StatusMessage>{communityText('Loading project…')}</StatusMessage></main>;

    const tabLabels = {
        code: communityText('Code'),
        comments: communityText('Comments'),
        issues: <React.Fragment>{communityText('Issues')}<Count value={counts.issues} /></React.Fragment>,
        commits: <React.Fragment>{communityText('Commits')}<Count value={counts.commits} /></React.Fragment>,
        branches: <React.Fragment>{communityText('Branches')}<Count value={counts.branches} /></React.Fragment>,
        pulls: <React.Fragment>{communityText('Pull requests')}<Count value={counts.pulls} /></React.Fragment>,
        releases: <React.Fragment>{communityText('Releases')}<Count value={counts.releases} /></React.Fragment>
    };

    const uncommitted = versionHistory && versionHistory.uncommitted ? versionHistory.uncommitted : null;
    const showUncommitted = Boolean(
        uncommitted && (!uncommitted.branch || uncommitted.branch === branchName)
    );
    const uncommittedDetail = showUncommitted ?
        uncommittedSummaryDetail(uncommitted, communityText, getCommunityLocale()) : '';
    const remixFrom = project.remixFrom || null;
    const remixParentUrl = remixFrom ? projectUrl(remixFrom) : '';

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <Link to={`/users/${project.owner}`} className={styles.ownerAvatar}>
                        <Avatar username={project.owner} size={32} />
                    </Link>
                    <div className={styles.headingCopy}>
                        <h1>
                            <Link to={`/users/${project.owner}`}>{project.owner}</Link>
                            <span className={styles.slash}>{'/'}</span>
                            <Link to={codeTabPath(baseUrl, 'code')}>{project.title}</Link>
                        </h1>
                        {remixFrom ? (
                            <p className={styles.remixOrigin}>
                                <GitFork size={13} aria-hidden="true" />
                                <span>{communityText('Remixed from')}</span>
                                <Link to={codeTabPath(remixParentUrl, 'code')}>
                                    {remixParentLabel(remixFrom)}
                                </Link>
                            </p>
                        ) : null}
                    </div>
                </div>
                <div className={styles.actions}>
                    <ViewModeSwitch
                        mode="developer"
                        projectHref={withShareKey(baseUrl, shareKey)}
                        developerHref={withShareKey(codeTabPath(baseUrl, 'code'), shareKey)}
                    />
                    {project.canRemix && !project.isOwner ? (
                        <Button as="a" variant="secondary" href={editorUrl({platformProject: project.id, from: 'remix'})}>
                            <GitFork size={16} />{communityText('Remix')}</Button>
                    ) : null}
                    {canView ? (
                        <Button as="a" variant="primary" href={editorUrl({platformProject: project.id, mode: 'code'})}>
                            <ExternalLink size={16} />{communityText('See inside')}</Button>
                    ) : null}
                </div>
            </header>
            {canView ? (
                <React.Fragment>
                    <UnderlineTabs
                        className={styles.tabs}
                        ariaLabel={communityText('Developer view')}
                        idPrefix={TAB_ID_PREFIX}
                        value={tab}
                        onChange={showTab}
                        items={visibleTabs.map(key => ({key, label: tabLabels[key]}))}
                    />
                    <div {...tabPanelProps(TAB_ID_PREFIX, tab)} className={styles.panel}>
                        {tab === 'code' ? (
                            <div className={place.kind === 'tree' && !place.path ? styles.codeLayout : styles.codeFull}>
                                <div className={styles.main}>
                                    {place.kind === 'tree' && !place.path && branchName === defaultBranch && hasRemixDivergence(remixFrom) ? (
                                        <ForkStatus
                                            projectId={id}
                                            remixFrom={remixFrom}
                                            canContribute={Boolean(project.isOwner && remixFrom.ahead > 0)}
                                            contributeHref={`${remixParentUrl}#contribute`}
                                            canSync={canMaintainProject(project)}
                                            hasUncommitted={Boolean(uncommitted)}
                                            sync={remixSync}
                                        />
                                    ) : null}
                                    {place.kind === 'tree' && !place.path && showUncommitted ? (
                                        <div className={styles.uncommittedBanner}>
                                            <span className={styles.uncommittedBadge}>
                                                <CircleDashed size={13} aria-hidden="true" />
                                                {communityText('Not committed')}
                                            </span>
                                            <span className={styles.uncommittedCopy}>
                                                <strong>{communityText('Uncommitted changes')}</strong>
                                                {uncommittedDetail ? <small>{uncommittedDetail}</small> : null}
                                            </span>
                                            <Link
                                                className={styles.uncommittedAction}
                                                to={withShareKey(`${baseUrl}/commits/worktree`, shareKey)}
                                            >
                                                {communityText('View changes')}
                                            </Link>
                                        </div>
                                    ) : null}
                                    {browseProject && (branches !== null || !requestedBranch) ? (
                                        <CodeBrowser
                                            project={browseProject}
                                            baseUrl={baseUrl}
                                            kind={place.kind}
                                            path={place.path}
                                            query={branchQuery}
                                            headCommit={latestCommit}
                                            commitCount={branchName === defaultBranch ? counts.commits : null}
                                            commitsUrl={codeTabPath(baseUrl, 'commits')}
                                            onFileCount={onFileCount}
                                            toolbar={branches && branches.length ? (
                                                <React.Fragment>
                                                    <SelectMenu
                                                        align="left"
                                                        ariaLabel={communityText('Branch')}
                                                        className={styles.branchPicker}
                                                        value={branchName}
                                                        onChange={pickBranch}
                                                        options={branches.map(branch => ({value: branch.name, label: branch.name}))}
                                                    />
                                                    {branches.length > 1 && !place.path ? (
                                                        <Link className={styles.toolbarLink} to={codeTabPath(baseUrl, 'branches')}>
                                                            {communityText('{value1} branches', {value1: branches.length})}
                                                        </Link>
                                                    ) : null}
                                                </React.Fragment>
                                            ) : null}
                                        />
                                    ) : <StatusMessage>{communityText('Loading project files…')}</StatusMessage>}
                                    {place.kind === 'tree' && !place.path ? <ReadmePanel project={project} /> : null}
                                </div>
                                {place.kind === 'tree' && !place.path ? (
                                    <AboutPanel
                                        project={project}
                                        baseUrl={baseUrl}
                                        shareKey={shareKey}
                                        counts={counts}
                                        fileCount={fileCount}
                                        contributors={contributors}
                                    />
                                ) : null}
                            </div>
                        ) : null}
                        {tab === 'issues' && place.kind === 'issue' ? (
                            <IssueThread key={`${id}:${place.number}`} id={id} baseUrl={baseUrl} shareKey={shareKey} number={place.number} project={project} onChange={refreshIssueCounts} />
                        ) : null}
                        {tab === 'issues' && place.kind !== 'issue' ? (
                            <IssueList id={id} baseUrl={baseUrl} project={project} onCounts={setIssueCounts} />
                        ) : null}
                        {tab === 'comments' ? (
                            <CommentThread
                                projectComments
                                source={commentSource}
                                donationRecipient={project.owner}
                                canModerate={project.isOwner}
                                canPin={project.isOwner}
                                issues={{
                                    canTriage: Boolean(project.isOwner),
                                    enabled: !project.issuesOff,
                                    href: number => withShareKey(`${baseUrl}/code/issues/${number}`, shareKey)
                                }}
                                disabled={Boolean(project.commentsOff)}
                                disabledReason={communityText('Comments are turned off.')}
                                reportContext={`project ${id}`}
                                draftKey={`project:${project.id}`}
                            />
                        ) : null}
                        {tab === 'commits' ? (
                            <HistoryList id={id} baseUrl={baseUrl} history={versionHistory} canRestore={project.isOwner} onChange={refreshProjectAndHistory} />
                        ) : null}
                        {tab === 'branches' ? (
                            <ProjectBranches
                                id={id}
                                canManage={project.isOwner}
                                onChange={() => {
                                    loadBranches();
                                    return refreshProjectAndHistory();
                                }}
                            />
                        ) : null}
                        {tab === 'pulls' ? (
                            <PullList id={id} baseUrl={baseUrl} onCount={setOpenPulls} onNew={() => navigate(`${baseUrl}#contribute`)} />
                        ) : null}
                        {tab === 'releases' ? (
                            <ReleaseList key={id} id={id} isOwner={project.isOwner} viewerName={viewerName} />
                        ) : null}
                    </div>
                </React.Fragment>
            ) : (
                <EmptyState icon={Lock} title={communityText('The source of this project is private')}>
                    {communityText('Only people the creator has given access can see its files and history.')}
                </EmptyState>
            )}
        </main>
    );
};

const ProjectCode = () => {
    const {text: communityText} = useCommunityText();
    const {projectId, vanitySlug, resolving, resolveError} = useResolvedProjectId();
    if (resolving) return <main className={styles.page}><StatusMessage>{communityText('Finding project…')}</StatusMessage></main>;
    if (resolveError) return <main className={styles.page}><StatusMessage error>{resolveError}</StatusMessage></main>;
    return <ProjectCodePage key={projectId} id={projectId} vanitySlug={vanitySlug} />;
};

export default ProjectCode;

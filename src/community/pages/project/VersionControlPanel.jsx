/* eslint-disable max-len */
import React from 'react';
import {GitPullRequest, History, GitBranch, Package} from 'lucide-react';
import ProjectBranches from '../../components/ProjectBranches.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import styles from '../Project.module.css';
import HistoryList from './HistoryList.jsx';
import PullList from './PullList.jsx';
import ReleaseList from './ReleaseList.jsx';

// History, branches, pull requests and releases, with a sidebar to switch between them.
const VersionControlPanel = ({
    id, project, viewerName, baseProjectUrl, versionControlTab, showActivity, versionHistory,
    refreshProjectAndHistory, openPullCount, setOpenPullCount
}) => (
    <div className={styles.versionControlLayout}>
        <Sidebar
            ariaLabel="Version control"
            active={versionControlTab}
            onChange={key => showActivity('Version control', key)}
            sections={[
                {key: 'history', label: 'History', icon: History, badge: versionHistory?.graph?.nodes?.length ?? versionHistory?.commits?.length ?? project.commitCount},
                {key: 'branches', label: 'Branches', icon: GitBranch},
                {key: 'pulls', label: 'Pull requests', icon: GitPullRequest, badge: openPullCount},
                {key: 'releases', label: 'Releases', icon: Package}
            ]}
        />
        <div className={styles.versionControlContent}>
            {versionControlTab === 'history' ? (
                <HistoryList id={id} baseUrl={baseProjectUrl} history={versionHistory} canRestore={project.isOwner} onChange={refreshProjectAndHistory} />
            ) : null}
            {versionControlTab === 'branches' ? (
                <ProjectBranches id={id} canManage={project.isOwner} onChange={refreshProjectAndHistory} />
            ) : null}
            {versionControlTab === 'pulls' ? (
                <PullList id={id} baseUrl={baseProjectUrl} onCount={setOpenPullCount} onNew={() => showActivity('Contribute')} />
            ) : null}
            {versionControlTab === 'releases' ? (
                <ReleaseList key={id} id={id} isOwner={project.isOwner} viewerName={viewerName} />
            ) : null}
        </div>
    </div>
);

export default VersionControlPanel;

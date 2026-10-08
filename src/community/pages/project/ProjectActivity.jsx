/* eslint-disable max-len */
import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {MessageSquareOff, MessageSquare} from 'lucide-react';
import {projectUrl} from '../../api';
import {canViewProjectSource} from '../../project-source-access';
import CommentThread from '../../components/CommentThread.jsx';
import ProjectFiles from '../../components/ProjectFiles.jsx';
import Button from '../../components/ui/Button.jsx';
import UnderlineTabs from '../../components/UnderlineTabs.jsx';
import {tabPanelProps} from '../../components/SectionTabs.jsx';
import styles from '../Project.module.css';
import {activityTabsFor} from './activity-tabs.js';
import {rememberBountyClaim} from './project-helpers.js';
import ProjectBounties from './ProjectBounties.jsx';
import OutgoingPullNotice from './OutgoingPullNotice.jsx';
import ReviewPanel from './ReviewPanel.jsx';
import ContributionPanel from './ContributionPanel.jsx';
import VersionControlPanel from './VersionControlPanel.jsx';

const TAB_ID_PREFIX = 'project-activity';
// Tab and panel ids are built from the tab key, so "Version control" becomes "version-control".
const tabKey = name => name.toLowerCase().replace(/\s+/g, '-');

// The tabbed activity area under the stage: comments, files, reviews, version control, bounties and contributions.
const ProjectActivity = ({
    id, project, user, login, userLoading, viewerName, ownsProject, locked, baseProjectUrl, tab,
    showActivity, openBountyCount, projectFileCount, setProjectFileCount, commentSource,
    toggleComments, savingComments, versionControlTab, versionHistory, refreshProjectAndHistory,
    openPullCount, setOpenPullCount, remix, remixForBounty, preferredBountyId,
    setPreferredBountyId, navigate
}) => {
    const {text: communityText} = useCommunityText();
    const activityTabLabels = {
        'Comments': communityText('Comments'),
        'Files': communityText('Files'),
        'Reviews': communityText('Reviews'),
        'Version control': communityText('Version control'),
        'Bounties': communityText('Bounties'),
        'Contribute': communityText('Contribute')
    };

    const tabs = activityTabsFor(project);

    return (
        <section className={styles.commentsCol}>
            <UnderlineTabs
                className={styles.activityTabs}
                ariaLabel="Project activity"
                idPrefix={TAB_ID_PREFIX}
                value={tabKey(tab)}
                onChange={key => showActivity(tabs.find(name => tabKey(name) === key))}
                items={tabs.map(name => ({
                    key: tabKey(name),
                    label: (
                        <React.Fragment>
                            {activityTabLabels[name] || name}
                            {name === 'Bounties' && openBountyCount !== null ? (
                                <b>{openBountyCount}</b>
                            ) : null}
                            {name === 'Files' && projectFileCount !== null ? (
                                <b>{projectFileCount}</b>
                            ) : null}
                        </React.Fragment>
                    )
                }))}
            />
            <div {...tabPanelProps(TAB_ID_PREFIX, tabKey(tab))}>
                {tab === 'Comments' && (
                    <CommentThread
                        projectComments
                        source={commentSource}
                        donationRecipient={project.owner}
                        canModerate={project.isOwner}
                        canPin={project.isOwner}
                        disabled={Boolean(project.commentsOff) || locked}
                        disabledReason={locked && !project.commentsOff ?
                            communityText('Buy this project to comment.') : communityText('Comments are turned off.')}
                        reportContext={`project ${id}`}
                        draftKey={`project:${project.id}`}
                        composerAction={project.isOwner ? (
                            <Button
                                variant="secondary"
                                onClick={toggleComments}
                                busy={savingComments}
                            >
                                {project.commentsOff ?
                                    <MessageSquare size={14} /> :
                                    <MessageSquareOff size={14} />}
                                {project.commentsOff ? communityText('Turn on comments') : communityText('Turn off comments')}
                            </Button>
                        ) : null}
                    />
                )}
                {tab === 'Files' && canViewProjectSource(project) ? <ProjectFiles project={project} onCount={setProjectFileCount} /> : null}
                {tab === 'Reviews' && <ReviewPanel key={id} id={id} project={project} user={user} login={login} ownsProject={ownsProject} />}
                {tab === 'Version control' && canViewProjectSource(project) && (
                    <VersionControlPanel
                        id={id}
                        project={project}
                        viewerName={viewerName}
                        baseProjectUrl={baseProjectUrl}
                        versionControlTab={versionControlTab}
                        showActivity={showActivity}
                        versionHistory={versionHistory}
                        refreshProjectAndHistory={refreshProjectAndHistory}
                        openPullCount={openPullCount}
                        setOpenPullCount={setOpenPullCount}
                    />
                )}
                {tab === 'Bounties' && (
                    <ProjectBounties
                        project={project}
                        userLoading={userLoading}
                        onRemix={remix}
                        onClaim={bounty => {
                            if (project.remixParent && project.isOwner) {
                                rememberBountyClaim(project.id, bounty.id);
                                setPreferredBountyId(bounty.id);
                                showActivity('Contribute');
                            } else {
                                remixForBounty(bounty);
                            }
                        }}
                        onCreate={() => navigate(`/mystuff/project/${id}?section=bounties`)}
                    />
                )}
                {tab === 'Contribute' && canViewProjectSource(project) && (
                    <div className={styles.contributionStack}>
                        <OutgoingPullNotice id={id} targetId={project.remixParent || ''} />
                        <ContributionPanel
                            key={`${id}:${project.remixParent || ''}`}
                            id={project.remixParent || id}
                            baseUrl={project.remixParent ? projectUrl(project.remixParent) : baseProjectUrl}
                            sourceProjectId={project.remixParent ? id : ''}
                            preferredBountyId={preferredBountyId}
                            onRemix={remix}
                            user={user}
                            viewerName={viewerName}
                            login={login}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProjectActivity;

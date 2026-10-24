/* eslint-disable max-len */
import {formatCommunityMessage, getCommunityLocale} from '../locale.js';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {BookmarkMinus, Eye, EyeOff, Library} from 'lucide-react';
import {Link} from 'react-router-dom';
import {formatPlaytime, timeAgoText} from '../format';
import {projectUrl} from '../api';
import ListSkeleton from './ListSkeleton.jsx';
import StuffRow, {MenuLink, MenuSeparator, MetaLine, StuffList} from './StuffRow.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Notice from './ui/Notice.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import UserLink from './UserLink.jsx';
import styles from './MyStuffLibrary.module.css';

const playtimeLabel = project => {
    if (!(project.duration > 0)) return formatCommunityMessage('Not played yet');
    return formatCommunityMessage('{duration} played', {duration: formatPlaytime(project.duration, false)});
};

const lastPlayedLabel = project => {
    if (!(project.lastPlayed > 0)) return '';
    return formatCommunityMessage('Last played {value1}', {value1: timeAgoText(project.lastPlayed)});
};

const MyStuffLibrary = ({
    projects, total, loading, error, moreBusy, hasMore, actionBusy, actionError,
    onRetry, onLoadMore, onChangeVisibility, onRemove
}) => {
    const {text: communityText, rich: communityRich} = useCommunityText();
    let body;
    if (loading) {
        body = <ListSkeleton count={4} media="square" label={communityText('Loading your library…')} />;
    } else if (error) {
        body = (
            <StatusMessage compact error onRetry={onRetry}>
                {communityText('Could not load your library.')}
            </StatusMessage>
        );
    } else if (projects.length) {
        body = (
            <React.Fragment>
                <StuffList>
                    {projects.map(project => (
                        <StuffRow
                            key={project.id}
                            project={project}
                            title={project.title}
                            to={projectUrl(project)}
                            dimmed={actionBusy === project.id}
                            meta={<MetaLine
                                parts={[
                                    communityRich('by {user}', {
                                        user: <UserLink key="owner" username={project.owner}>{project.owner}</UserLink>
                                    }),
                                    playtimeLabel(project),
                                    lastPlayedLabel(project),
                                    project.libraryPublic === false ? (
                                        <span key="hidden" className={styles.hidden}>
                                            <EyeOff size={13} aria-hidden="true" />{communityText('Hidden from your profile')}
                                        </span>
                                    ) : null
                                ]}
                            />}
                            menuLabel={communityText('Library options for {value1}', {value1: project.title})}
                            menu={({close}) => (
                                <React.Fragment>
                                    <MenuLink
                                        onClick={() => {
                                            close(false);
                                            if (!actionBusy) onChangeVisibility(project);
                                        }}
                                    >
                                        {project.libraryPublic === false ? <Eye size={15} /> : <EyeOff size={15} />}
                                        {project.libraryPublic === false ?
                                            communityText('Show in public library') :
                                            communityText('Hide from public library')}
                                    </MenuLink>
                                    <MenuSeparator />
                                    <MenuLink
                                        danger
                                        onClick={() => {
                                            close(false);
                                            if (!actionBusy) onRemove(project);
                                        }}
                                    >
                                        <BookmarkMinus size={15} />
                                        {communityText('Remove from library')}
                                    </MenuLink>
                                </React.Fragment>
                            )}
                        />
                    ))}
                </StuffList>
                {actionError ? <Notice variant="error" className={styles.actionError}>{actionError}</Notice> : null}
                {hasMore ? (
                    <div className={styles.more}>
                        <Button
                            busy={moreBusy}
                            busyLabel={communityText('Loading…')}
                            onClick={onLoadMore}
                        >
                            {communityText('Load more games')}
                        </Button>
                    </div>
                ) : null}
            </React.Fragment>
        );
    } else {
        body = (
            <EmptyState
                icon={Library}
                title={communityText('Your library is empty')}
                action={<Button as={Link} to="/explore">{communityText('Find games on Explore')}</Button>}
            >
                {communityText('Use "Save to library" on a project to add it here.')}
            </EmptyState>
        );
    }
    return (
        <section className={styles.library}>
            <SectionHeading
                title={communityText('Library')}
                lead={communityText('Games you saved, with your playtime and public profile controls.')}
                actions={!loading && !error && total ? (
                    <span className={styles.count}>
                        {total === 1 ?
                            communityText('1 game') :
                            communityText('{value1} games', {value1: total.toLocaleString(getCommunityLocale())})}
                    </span>
                ) : null}
            />
            {body}
        </section>
    );
};

MyStuffLibrary.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.object),
    total: PropTypes.number,
    loading: PropTypes.bool,
    error: PropTypes.bool,
    moreBusy: PropTypes.bool,
    hasMore: PropTypes.bool,
    actionBusy: PropTypes.string,
    actionError: PropTypes.string,
    onRetry: PropTypes.func,
    onLoadMore: PropTypes.func,
    onChangeVisibility: PropTypes.func,
    onRemove: PropTypes.func
};

MyStuffLibrary.defaultProps = {
    projects: [],
    total: 0,
    loading: false,
    error: false,
    moreBusy: false,
    hasMore: false,
    actionBusy: '',
    actionError: '',
    onRetry: () => {},
    onLoadMore: () => {},
    onChangeVisibility: () => {},
    onRemove: () => {}
};

export {lastPlayedLabel, playtimeLabel};
export default MyStuffLibrary;

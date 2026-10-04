/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {
    GitFork, ExternalLink, ImageUp, MonitorPlay, Flag, MoreHorizontal, Code2, Trash2, Link2, Coins,
    SlidersHorizontal, Bookmark, BookmarkCheck, Star, Library
} from 'lucide-react';
import {payLink} from '../../../lib/rotur/payment-window.js';
import Avatar from '../../components/Avatar.jsx';
import GroupTag from '../../components/GroupTag.jsx';
import VisibilityMenu from '../../components/VisibilityMenu.jsx';
import {canViewProjectSource} from '../../project-source-access';
import {sameUser} from '../../format';
import Button from '../../components/ui/Button.jsx';
import Dropdown from '../../components/ui/Dropdown.jsx';
import IconButton from '../../components/ui/IconButton.jsx';
import styles from '../Project.module.css';
import {track} from '../../analytics';

// Title, byline and the action buttons and menu at the top of a project page.
const ProjectHeader = ({
    project, user, userLoading, title, setTitle, savingTitle, saveTitle, visibility,
    changeVisibility, savingVisibility, remix, toggleLibrary, savingLibrary, seeInsideHref,
    copyLink, setCollectionOpen, thumbnailStatus, useStageThumbnail, chooseThumbnailUpload,
    menuRemix, toggleFeatured, savingFeatured, featuredProject, menuReport, setActionError,
    setDeleteConfirm
}) => {
    const {text: communityText} = useCommunityText();
    const handleTitleKeyDown = event => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    return (
        <div className={styles.topBar}>
            <div className={styles.titleBlock}>
                <Link to={`/users/${project.owner}`}>
                    <Avatar
                        username={project.owner}
                        size={44}
                    />
                </Link>
                <div className={styles.titleText}>
                    <div className={styles.titleRow}>
                        {project.isOwner ? (
                            <input
                                className={styles.titleInput}
                                value={title}
                                maxLength={100}
                                aria-label={communityText('Project title')}
                                disabled={savingTitle}
                                onChange={event => setTitle(event.target.value)}
                                onBlur={saveTitle}
                                onKeyDown={handleTitleKeyDown}
                            />
                        ) : <h1>{project.title}</h1>}
                    </div>
                    <div className={styles.bylineRow}>
                        <Link
                            to={`/users/${project.owner}`}
                            className={styles.byline}
                        >{communityText('by {value1}', {value1: project.owner})}</Link>
                        <GroupTag className={styles.projectGroupTag} username={project.owner} compact />
                        {project.groupTag ? <Link className={styles.groupByline} to={`/groups/${project.groupTag}`}>{communityText('for @')}{project.groupTag}</Link> : null}
                    </div>
                    {project.branding?.tagline ? <p className={styles.brandTagline}>{project.branding.tagline}</p> : null}
                </div>
            </div>
            <div className={styles.topActions}>
                {user && !project.isOwner ? (
                    <Button
                        as="a"
                        variant="secondary"
                        href={payLink(project.owner, {note: `Support for ${project.title}`})}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={communityText('Send {value1} credits on Rotur', {value1: project.owner})}
                    >
                        <Coins size={16} />{communityText('Support')}</Button>
                ) : null}
                {project.isOwner ? (
                    <VisibilityMenu
                        value={visibility}
                        onChange={changeVisibility}
                        disabled={savingVisibility}
                    />
                ) : project.canRemix ? (
                    <Button
                        variant="secondary"
                        onClick={remix}
                        disabled={userLoading}
                        title={!user && !userLoading ? communityText('Sign in to remix') : null}
                    >
                        <GitFork size={16} />{communityText('Remix')}</Button>
                ) : null}
                {user ? (
                    <Button
                        variant="secondary"
                        onClick={toggleLibrary}
                        disabled={savingLibrary}
                        aria-pressed={Boolean(project.saved)}
                    >
                        {project.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                        {project.saved ? communityText('Remove from library') : communityText('Save to library')}
                    </Button>
                ) : null}
                {canViewProjectSource(project) ? (
                    <Button
                        as="a"
                        variant="primary"
                        href={seeInsideHref}
                    >
                        <ExternalLink size={16} />{communityText('See inside')}</Button>
                ) : null}
                <Dropdown
                    className={styles.menuWrap}
                    menuClassName={styles.actionMenu}
                    renderTrigger={({open, toggle}) => (
                        <IconButton
                            label={communityText('More actions')}
                            aria-expanded={open}
                            aria-haspopup="menu"
                            onClick={toggle}
                        >
                            <MoreHorizontal size={18} />
                        </IconButton>
                    )}
                >
                    {({close}) => (
                        <React.Fragment>
                            <button
                                type="button"
                                onClick={() => {
                                    close();
                                    copyLink();
                                }}
                            >
                                <Link2 size={15} />{communityText('Copy link')}</button>
                            {project.shared && visibility === 'public' ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        track('embed_code_copied', {project: project.id});
                                        copyLink(`<iframe src="${window.location.origin}/embed.html?mw=${
                                            encodeURIComponent(project.id)
                                        }" width="482" height="412" frameborder="0" scrolling="no" ` +
                                            'allowfullscreen></iframe>');
                                    }}
                                >
                                    <Code2 size={15} />{communityText('Copy embed code')}</button>
                            ) : null}
                            {user ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        setCollectionOpen(true);
                                    }}
                                >
                                    <Library size={15} />{communityText('Save to collection')}</button>
                            ) : null}
                            {project.isOwner ? <div className={styles.menuSeparator} role="separator" /> : null}
                            {project.isOwner ? (
                                <button
                                    type="button"
                                    disabled={thumbnailStatus === 'saving'}
                                    onClick={() => {
                                        close();
                                        useStageThumbnail();
                                    }}
                                >
                                    <MonitorPlay size={15} />{communityText('Use stage as thumbnail')}</button>
                            ) : null}
                            {project.isOwner ? (
                                <button
                                    type="button"
                                    disabled={thumbnailStatus === 'saving'}
                                    onClick={() => {
                                        close();
                                        chooseThumbnailUpload();
                                    }}
                                >
                                    <ImageUp size={15} />{communityText('Upload thumbnail')}</button>
                            ) : null}
                            {project.isOwner ? (
                                <Link
                                    to={`/mystuff/project/${project.id}`}
                                    onClick={close}
                                >
                                    <SlidersHorizontal size={15} />{communityText('Manage & analytics')}</Link>
                            ) : null}
                            {project.isOwner ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        menuRemix();
                                    }}
                                    disabled={!user}
                                >
                                    <GitFork size={15} />{communityText('Remix')}</button>
                            ) : null}
                            {project.isOwner && project.shared ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        toggleFeatured();
                                    }}
                                    disabled={savingFeatured}
                                >
                                    <Star
                                        size={15}
                                        fill={featuredProject === project.id ? 'currentColor' : 'none'}
                                    />
                                    {featuredProject === project.id ?
                                        communityText('Remove profile feature') : communityText('Feature on profile')}
                                </button>
                            ) : null}
                            {user && !sameUser(project.owner, user.username) ? <div className={styles.menuSeparator} role="separator" /> : null}
                            {user && !sameUser(project.owner, user.username) ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        menuReport();
                                    }}
                                >
                                    <Flag size={15} />{communityText('Report')}</button>
                            ) : null}
                            {project.isOwner ? <div className={styles.menuSeparator} role="separator" /> : null}
                            {project.isOwner ? (
                                <button
                                    type="button"
                                    className={styles.menuDanger}
                                    onClick={() => {
                                        close();
                                        setActionError(null);
                                        setDeleteConfirm(true);
                                    }}
                                >
                                    <Trash2 size={15} />{communityText('Delete project')}</button>
                            ) : null}
                        </React.Fragment>
                    )}
                </Dropdown>
            </div>
        </div>
    );
};

export default ProjectHeader;

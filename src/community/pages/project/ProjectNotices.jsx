/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {EyeOff, Ghost, Link as LinkIcon, Coins, Palette, ShieldAlert} from 'lucide-react';
import LiveProjectSession from '../../components/LiveProjectSession.jsx';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import styles from '../Project.module.css';
import {restoreUserTheme} from './embed-helpers.js';
import {adminUserPath} from '../admin/admin-links.js';

// Status notices above the stage: errors, copy and thumbnail feedback, visibility, price and the project theme.
const ProjectNotices = ({
    project, visibility, price, actionError, setActionError, copied, thumbnailStatus,
    projectThemeApplied, revertTheme, setRevertTheme, isAdmin, openModeration
}) => {
    const {text: communityText} = useCommunityText();
    const hold = project.moderationHidden;
    const shadowBan = isAdmin ? project.shadowBan : null;
    return (
        <React.Fragment>
            {actionError ? (
                <Notice variant="error" className={styles.pageNotice} onDismiss={() => setActionError(null)}>{actionError}</Notice>
            ) : null}
            <LiveProjectSession project={project} />
            {copied ? <Notice variant="success" className={styles.pageNotice}>{communityText('Copied to clipboard.')}</Notice> : null}
            {thumbnailStatus !== 'idle' ? (
                <Notice variant={thumbnailStatus === 'saving' ? 'info' : 'success'} className={styles.pageNotice}>
                    {thumbnailStatus === 'saving' ? communityText('Saving thumbnail…') : communityText('Thumbnail updated.')}
                </Notice>
            ) : null}

            {visibility === 'unlisted' ? (
                <Notice variant="info" icon={LinkIcon} className={styles.pageNotice}>
                    {communityText('Unlisted. Hidden from search and profiles, but anyone with the link can open it.')}
                </Notice>
            ) : null}
            {hold ? (
                <Notice
                    variant="warning"
                    icon={ShieldAlert}
                    className={styles.pageNotice}
                    title={communityText('A moderator hid this project')}
                    action={isAdmin ? <Button onClick={() => openModeration('restore')}>{communityText('Restore')}</Button> : null}
                >
                    <p>{communityText('Only you can see it, and it can\'t be shared again until a moderator restores it.')}</p>
                    {hold.reason ? <p>{communityText('Reason: {value1}', {value1: hold.reason})}</p> : null}
                    {isAdmin && hold.by ? <p>{communityText('Hidden by @{value1}.', {value1: hold.by})}</p> : null}
                </Notice>
            ) : null}
            {shadowBan && shadowBan.project ? (
                <Notice
                    variant="info"
                    icon={Ghost}
                    className={styles.pageNotice}
                    title={communityText('This project is shadow banned')}
                    action={<Button onClick={() => openModeration('unshadow')}>{communityText('Lift shadow ban')}</Button>}
                >
                    <p>{communityText('It is left out of every list, but its link still works and its creator sees nothing different. Only admins see this notice.')}</p>
                    {shadowBan.projectReason ? <p>{communityText('Note: {value1}', {value1: shadowBan.projectReason})}</p> : null}
                </Notice>
            ) : null}
            {shadowBan && shadowBan.owner ? (
                <Notice
                    variant="info"
                    icon={Ghost}
                    className={styles.pageNotice}
                    title={communityText('{value1} is shadow banned', {value1: project.owner})}
                    action={<Button as={Link} to={adminUserPath(project.owner)}>{communityText('Moderate creator')}</Button>}
                >
                    {communityText('None of their projects or comments appear for anyone else. Only admins see this notice.')}
                </Notice>
            ) : null}
            {visibility === 'private' && !hold ? (
                <Notice variant="info" icon={EyeOff} className={styles.pageNotice}>
                    {project.contributionOnly ?
                        communityText('This remix of a project offered for purchase stays private. You can contribute your changes back to the original creator.') :
                        communityText('Unshared. Only you can see this project.')}
                </Notice>
            ) : null}
            {price > 0 ? (
                <Notice variant="info" icon={Coins} className={styles.pageNotice}>
                    {project.isOwner ?
                        communityText('Available for a one-time purchase of {value1} credits.', {value1: price}) :
                        project.bought ?
                            communityText('Thanks for supporting this creator. You have access to play this project.') :
                            communityText('Support this creator with a one-time purchase of {value1} credits to play.', {value1: price})}
                </Notice>
            ) : null}
            {projectThemeApplied && !revertTheme ? (
                <Notice
                    variant="info"
                    icon={Palette}
                    className={styles.pageNotice}
                    action={(
                        <React.Fragment>
                            <Button
                                onClick={() => {
                                    setRevertTheme(true);
                                    restoreUserTheme();
                                }}
                            >{communityText('Use my theme')}</Button>
                            <Button as={Link} to="/settings">{communityText('Preferences')}</Button>
                        </React.Fragment>
                    )}
                >{communityText('This project applied its own theme.')}</Notice>
            ) : null}
        </React.Fragment>
    );
};

export default ProjectNotices;

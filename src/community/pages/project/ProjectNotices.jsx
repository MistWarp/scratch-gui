/* eslint-disable max-len */
import React from 'react';
import {Link} from 'react-router-dom';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {EyeOff, Link as LinkIcon, Coins, Palette} from 'lucide-react';
import LiveProjectSession from '../../components/LiveProjectSession.jsx';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import styles from '../Project.module.css';
import {restoreUserTheme} from './embed-helpers.js';

// Status notices above the stage: errors, copy and thumbnail feedback, visibility, price and the project theme.
const ProjectNotices = ({
    project, visibility, price, actionError, setActionError, copied, thumbnailStatus,
    projectThemeApplied, revertTheme, setRevertTheme
}) => {
    const {text: communityText} = useCommunityText();
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
            {visibility === 'private' ? (
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

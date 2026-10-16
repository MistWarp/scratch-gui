/* eslint-disable max-len */
import {getCommunityLocale} from '../../locale.js';
import React, {useEffect, useState} from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {
    Play, ExternalLink, Clock3, Upload, ShieldCheck, ShieldAlert, Lock, Coins, Bookmark, BookmarkCheck, Flag, MessagesSquare
} from 'lucide-react';
import {editorUrl} from '../../api';
import {formatPlaytime} from '../../format';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import ReactionButtons from '../../components/ReactionButtons.jsx';
import UserLink from '../../components/UserLink.jsx';
import {ChatContact, formatServiceNames} from '../../components/PlayerChat.jsx';
import {isMinorAccount} from '../../../lib/minor-account.js';
import styles from '../Project.module.css';

const CHAT_SEEN_KEY = 'mw:player-chat-seen';

const readChatSeen = id => {
    try {
        return JSON.parse(localStorage.getItem(CHAT_SEEN_KEY) || '[]').includes(id);
    } catch (e) {
        return false;
    }
};

const rememberChatSeen = id => {
    try {
        const seen = JSON.parse(localStorage.getItem(CHAT_SEEN_KEY) || '[]').filter(item => item !== id);
        localStorage.setItem(CHAT_SEEN_KEY, JSON.stringify([id, ...seen].slice(0, 200)));
    } catch (e) {
        return;
    }
};

// The player frame (or the paywall or empty state in its place) with the reaction and stats bar below it.
const ProjectStage = ({
    project, user, userLoading, locked, hasContent, price, buying, openBuyConfirm, contentError,
    followThemeDecision, stageHeightRatio, stageSourceKey, stageFrame, stageSource,
    sendThemeToStage, unsandboxed, setUnsandboxed, runUnsandboxed, customExtensions, react,
    reactionBusy, savingLibrary, saveAfterLogin, thumbInput, pickThumbnail, reportChat
}) => {
    const {text: communityText, rich: communityRich} = useCommunityText();
    const chat = project.playerContact || {};
    const minor = Boolean(user) && isMinorAccount();
    const chatGate = Boolean(chat.connects) && !project.isOwner;
    const [chatAccepted, setChatAccepted] = useState(() => !minor && readChatSeen(project.id));
    useEffect(() => {
        setChatAccepted(!minor && readChatSeen(project.id));
    }, [project.id, minor]);
    const acceptChat = () => {
        if (!minor) rememberChatSeen(project.id);
        setChatAccepted(true);
    };
    const chatServices = formatServiceNames(chat.services, communityText);
    return (
        <div className={styles.stageCol}>
            <div
                className={styles.stageWrap}
                style={{paddingBottom: `calc(${stageHeightRatio * 100}% + 48px)`}}
            >
                <div className={styles.stageSizer}>
                    {!locked && !hasContent ? (
                        <div className={styles.paywall}>
                            <EmptyState
                                icon={Upload}
                                title={communityText('Nothing here yet')}
                                action={project.isOwner ? (
                                    <Button as="a" variant="primary" href={editorUrl({platformProject: project.id})}>
                                        <ExternalLink size={16} />{communityText('Open in editor')}</Button>
                                ) : null}
                            >
                                {project.isOwner ?
                                    communityText('No content yet. Open it in the editor and save to upload.') :
                                    communityText('This project has not been uploaded yet.')}
                            </EmptyState>
                        </div>
                    ) : locked ? (
                        <div className={styles.paywall}>
                            <EmptyState
                                icon={Lock}
                                title={communityText('Support this creator')}
                                action={(
                                    <Button variant="primary" onClick={openBuyConfirm} disabled={!user || buying}>
                                        <Coins size={16} />{communityText('Buy for {value1} credits', {value1: price})}</Button>
                                )}
                            >
                                {communityText('Your purchase supports the creator and gives you access to play {value1}. Pay once, with no recurring charge.', {value1: project.title})}
                                {user ? null : ` ${communityText('Sign in to purchase and support this creator.')}`}
                            </EmptyState>
                        </div>
                    ) : chat.studentBlocked ? (
                        <div className={styles.paywall}>
                            <EmptyState icon={MessagesSquare} title={communityText('Not available on class accounts')}>
                                {communityText('This project lets players talk to each other, so class accounts can\'t open it.')}
                            </EmptyState>
                        </div>
                    ) : contentError ? (
                        <div className={styles.paywall}>
                            <EmptyState icon={ShieldAlert} title={communityText('Project unavailable')}>
                                {communityText('The project file could not be loaded. The creator may need to save it again.')}
                            </EmptyState>
                        </div>
                    ) : chatGate && !chatAccepted && !userLoading ? (
                        <div className={styles.paywall}>
                            <EmptyState
                                icon={MessagesSquare}
                                title={communityText('You can talk to other players here')}
                                action={(
                                    <Button variant="primary" onClick={acceptChat}>
                                        <Play size={16} />{communityText('Play')}</Button>
                                )}
                            >
                                {chatServices ?
                                    communityText('Messages go through {value1}, not MistWarp, so moderators only see chat that players report.', {value1: chatServices}) :
                                    communityText('Messages go through a service MistWarp doesn\'t run, so moderators only see chat that players report.')}
                                {' '}
                                {minor ?
                                    communityText('Never share your real name, age, address, school or photos. If anyone makes you uncomfortable, stop playing, report them and tell an adult you trust.') :
                                    communityText('Don\'t share personal information, and report anyone who makes you uncomfortable.')}
                            </EmptyState>
                        </div>
                    ) : followThemeDecision === null || userLoading ? (
                        <div className={styles.paywall}><StatusMessage>{communityText('Loading project…')}</StatusMessage></div>
                    ) : (
                        <iframe
                            key={stageSourceKey}
                            ref={stageFrame}
                            className={styles.stage}
                            src={stageSource.current.url}
                            title={project.title}
                            onLoad={sendThemeToStage}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            sandbox={unsandboxed ?
                                null :
                                'allow-scripts allow-forms allow-pointer-lock allow-downloads ' +
                                'allow-popups allow-popups-to-escape-sandbox'}
                        />
                    )}
                </div>
            </div>
            {customExtensions.length ? (
                <Notice
                    variant={unsandboxed ? 'warning' : 'info'}
                    icon={unsandboxed ? ShieldAlert : ShieldCheck}
                    className={styles.stageNotice}
                    action={unsandboxed ? (
                        <Button onClick={() => setUnsandboxed(false)}>{communityText('Back to sandbox')}</Button>
                    ) : (
                        <Button onClick={runUnsandboxed}>{communityText('Run without sandbox')}</Button>
                    )}
                >
                    {unsandboxed ?
                        communityText('Running with full access to your account. Only for projects you trust.') :
                        communityText('Uses custom extensions, running in a sandbox. Saved data can persist to browser storage.')}
                </Notice>
            ) : null}
            {chat.connects && !chat.studentBlocked ? (
                <Notice
                    variant="info"
                    icon={MessagesSquare}
                    className={styles.stageNotice}
                    action={user ? (
                        <Button onClick={reportChat}>
                            <Flag size={16} />{communityText('Report chat')}</Button>
                    ) : null}
                >
                    {chat.declared && chat.contact ?
                        communityRich('{user} moderates chat in this project. Reach them at {contact}.', {
                            user: <UserLink username={project.owner}>{`@${project.owner}`}</UserLink>,
                            contact: <ChatContact contact={chat.contact} />
                        }) :
                        communityRich('{user} hasn\'t added a contact for chat yet. Report anything that breaks the rules.', {
                            user: <UserLink username={project.owner}>{`@${project.owner}`}</UserLink>
                        })}
                </Notice>
            ) : null}
            <div className={styles.statsBar}>
                <ReactionButtons
                    variant="bordered"
                    counts={{heart: project.loveCount || 0, brokenheart: project.brokenHeartCount || 0}}
                    activeReaction={project.myReaction || ''}
                    onReact={react}
                    disabled={locked || reactionBusy}
                    disabledTitle={locked ? communityText('Buy this project to react.') : communityText('Saving…')}
                />
                <button
                    type="button"
                    className={`${styles.statButton} ${project.saved ? styles.statButtonActive : ''}`}
                    disabled={savingLibrary}
                    title={user ? (project.saved ? communityText('Remove from your library') : communityText('Save to your library')) :
                        communityText('Sign in to save to your library')}
                    aria-label={project.saved ?
                        communityText('Remove from library, {value1} saves', {value1: project.saveCount || 0}) :
                        communityText('Save to library, {value1} saves', {value1: project.saveCount || 0})}
                    aria-pressed={Boolean(project.saved)}
                    onClick={saveAfterLogin}
                >
                    {project.saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    {(project.saveCount || 0).toLocaleString(getCommunityLocale())}
                </button>
                <span className={styles.statMuted}>
                    <Play size={15} />
                    {project.views || 0}
                </span>
                {user && Number.isFinite(project.myPlaytimeMs) ? (
                    <span className={styles.statMuted} title={communityText('Your playtime on this project')}>
                        <Clock3 size={15} />
                        {project.myPlaytimeMs > 0 ?
                            communityText('{value1} played', {value1: formatPlaytime(project.myPlaytimeMs, false)}) : communityText('Not played yet')}
                    </span>
                ) : null}
                <input
                    ref={thumbInput}
                    className={styles.hiddenInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={pickThumbnail}
                />
            </div>
        </div>
    );
};

export default ProjectStage;

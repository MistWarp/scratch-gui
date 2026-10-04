/* eslint-disable max-len */
import {getCommunityLocale} from '../../locale.js';
import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {
    Play, ExternalLink, Clock3, Upload, ShieldCheck, ShieldAlert, Lock, Coins, Bookmark, BookmarkCheck
} from 'lucide-react';
import {editorUrl} from '../../api';
import {formatPlaytime} from '../../format';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Notice from '../../components/ui/Notice.jsx';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import ReactionButtons from '../../components/ReactionButtons.jsx';
import styles from '../Project.module.css';

// The player frame (or the paywall or empty state in its place) with the reaction and stats bar below it.
const ProjectStage = ({
    project, user, userLoading, locked, hasContent, price, buying, openBuyConfirm, contentError,
    followThemeDecision, stageHeightRatio, stageSourceKey, stageFrame, stageSource,
    sendThemeToStage, unsandboxed, setUnsandboxed, runUnsandboxed, customExtensions, react,
    reactionBusy, savingLibrary, saveAfterLogin, thumbInput, pickThumbnail
}) => {
    const {text: communityText} = useCommunityText();
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
                    ) : contentError ? (
                        <div className={styles.paywall}>
                            <EmptyState icon={ShieldAlert} title={communityText('Project unavailable')}>
                                {communityText('The project file could not be loaded. The creator may need to save it again.')}
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
            <div className={styles.statsBar}>
                <ReactionButtons
                    variant="bordered"
                    counts={{heart: project.loveCount || 0, brokenheart: project.brokenHeartCount || 0}}
                    activeReaction={project.myReaction || ''}
                    onReact={react}
                    disabled={locked || reactionBusy}
                    disabledTitle={locked ? 'Buy this project to react' : 'Saving…'}
                />
                <button
                    type="button"
                    className={`${styles.statButton} ${project.saved ? styles.statButtonActive : ''}`}
                    disabled={savingLibrary}
                    title={user ? (project.saved ? communityText('Remove from your library') : communityText('Save to your library')) :
                        communityText('Sign in to save to your library')}
                    aria-label={communityText('{value1} library, {value2} saves', {value1: project.saved ? 'Remove from' : 'Save to', value2: project.saveCount || 0})}
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

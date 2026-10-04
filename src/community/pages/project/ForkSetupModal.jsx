/* eslint-disable max-len */
import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {GitFork, Trophy} from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import Modal from '../../components/ui/Modal.jsx';
import UserLink from '../../components/UserLink.jsx';
import styles from '../Project.module.css';

// Names the private working copy and branch before a remix is created.
const ForkSetupModal = ({
    project, forkSetup, setForkSetup, forkBounty, setForkBounty, creatingFork, createFork
}) => {
    const {text: communityText} = useCommunityText();
    return (
        <Modal
            className={styles.forkModal}
            title={communityText('Set up your fork')}
            onClose={() => {
                setForkSetup(null);
                setForkBounty(null);
            }}
            dismissDisabled={creatingFork}
        >
            <form onSubmit={createFork}>
                <p className={styles.forkIntro}>{communityText('MistWarp will create a private working copy. Edit and save it, then open its project page and send your changes back.')}</p>
                {forkBounty ? (
                    <Notice variant="info" icon={Trophy} title={communityText('Working on a bounty')} className={styles.forkNotice}>
                        <p><strong>{forkBounty.title}</strong></p>
                        <p>{communityText('{value1} credits, paid if the project owner merges your pull request.', {value1: forkBounty.amount})}</p>
                    </Notice>
                ) : null}
                <label className={styles.forkField}>
                    <span>{communityText('Project name')}</span>
                    <input
                        value={forkSetup.title}
                        disabled={creatingFork}
                        maxLength={100}
                        required
                        autoFocus
                        onChange={event => setForkSetup({...forkSetup, title: event.target.value})}
                    />
                </label>
                <label className={styles.forkField}>
                    <span>{communityText('Working branch')}</span>
                    <input
                        value={forkSetup.branch}
                        disabled={creatingFork}
                        maxLength={100}
                        required
                        pattern="[A-Za-z0-9][A-Za-z0-9._/-]*"
                        onChange={event => setForkSetup({...forkSetup, branch: event.target.value})}
                    />
                </label>
                <dl className={styles.forkSummary}>
                    <div><dt>{communityText('Forked from')}</dt><dd><UserLink username={project.owner}>{project.owner}</UserLink>/{project.title}</dd></div>
                    <div><dt>{communityText('Base commit')}</dt><dd><code>{project.gitHead ? project.gitHead.slice(0, 7) : communityText('Current version')}</code></dd></div>
                    <div><dt>{communityText('Visibility')}</dt><dd>{communityText('Private draft')}</dd></div>
                </dl>
                <div className={styles.confirmActions}>
                    <Button
                        onClick={() => {
                            setForkSetup(null);
                            setForkBounty(null);
                        }}
                        disabled={creatingFork}
                    >{communityText('Cancel')}</Button>
                    <Button
                        variant="primary"
                        type="submit"
                        busy={creatingFork}
                        busyLabel={communityText('Creating fork…')}
                    >
                        <GitFork size={15} />{communityText('Create fork')}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ForkSetupModal;

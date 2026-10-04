/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {GitFork, Plus, Trophy} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {projectUrl} from '../../api';
import {listCommerceBounties} from '../../credits';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import {bountyProjectId} from './project-helpers.js';
import styles from '../Project.module.css';

const ProjectBounties = ({project, userLoading, onRemix, onClaim, onCreate}) => {
    const {text: communityText} = useCommunityText();
    const [items, setItems] = useState(null);
    const targetId = bountyProjectId(project);
    const isFork = Boolean(project.remixParent);

    useEffect(() => {
        let active = true;
        setItems(null);
        listCommerceBounties({
            source: 'mistwarp',
            resource_type: 'project',
            resource_id: targetId,
            status: 'open'
        })
            .then(data => {
                if (active) setItems(data.bounties || []);
            })
            .catch(() => {
                if (active) setItems([]);
            });
        return () => {
            active = false;
        };
    }, [targetId]);

    if (items === null) return null;

    return (
        <section className={styles.bountyPanel} aria-labelledby="project-bounties-title">
            <SectionHeading
                id="project-bounties-title"
                icon={Trophy}
                title={isFork ? communityText('Bounties on the parent project') : communityText('Bounties')}
                count={items.length}
                actions={project.isOwner && !isFork ? (
                    <Button variant="primary" onClick={onCreate}>
                        <Plus size={16} />{communityText('New bounty')}</Button>
                ) : !isFork && project.canRemix ? (
                    <Button variant="primary" disabled={userLoading} onClick={onRemix}>
                        <GitFork size={16} />{communityText('Remix')}</Button>
                ) : null}
            />
            {items.length ? (
                <ul className={styles.bountyList}>
                    {items.map(item => (
                        <li key={item.id}>
                            <div>
                                <Link className={styles.bountyTitle} to={`/bounties/${encodeURIComponent(item.id)}`}>{item.title}</Link>
                                {item.description ? <p>{item.description}</p> : null}
                            </div>
                            <div className={styles.bountyItemAction}>
                                <span className={styles.bountyReward}>{communityText('{value1} credits', {value1: item.amount})}</span>
                                {!project.isOwner || isFork ? (
                                    isFork && !project.isOwner ? (
                                        <Link className={styles.bountyClaim} to={projectUrl(targetId)}>{communityText('Open parent')}</Link>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.bountyClaim}
                                            disabled={userLoading}
                                            onClick={() => onClaim(item)}
                                        >{isFork ? communityText('Use this bounty') : communityText('Work on this')}</button>
                                    )
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState icon={Trophy} title={communityText('No open bounties')}>
                    {project.isOwner && !isFork ?
                        communityText('Fund a specific change when you want contributors to pick it up.') :
                        communityText('There are no funded tasks right now. You can still fork the project and send an improvement.')}
                </EmptyState>
            )}
        </section>
    );
};

export default ProjectBounties;

/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronRight, GitPullRequest} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api, {projectUrl} from '../../api';
import styles from '../Project.module.css';

const OutgoingPullNotice = ({id, targetId}) => {
    const {text: communityText} = useCommunityText();
    const [pulls, setPulls] = useState(null);
    const [targetTitle, setTargetTitle] = useState('');
    const [targetVanity, setTargetVanity] = useState('');
    useEffect(() => {
        if (!targetId) {
            setPulls([]);
            return () => {};
        }
        let active = true;
        Promise.all([api.pulls(targetId), api.getProject(targetId)]).then(([data, projectData]) => {
            if (!active) return;
            const target = projectData.project || projectData;
            setTargetTitle(target.title || targetId);
            setTargetVanity(target.vanitySlug || '');
            setPulls((data.pulls || []).filter(pull => pull.state === 'open' && pull.sourceProjectId === id));
        }).catch(() => {
            if (active) setPulls([]);
        });
        return () => {
            active = false;
        };
    }, [id, targetId]);
    if (!pulls?.length) return null;
    return (
        <section className={styles.outgoingPulls}>
            <header><GitPullRequest size={16} /><strong>{communityText('Open pull requests from this project')}</strong><span>{pulls.length}</span></header>
            {pulls.map(pull => (
                <Link key={`${pull.targetProjectId}:${pull.index}`} to={`${projectUrl({id: pull.targetProjectId, vanitySlug: targetVanity})}/pulls/${pull.index}`}>
                    <span><strong>{pull.title}</strong><small>{communityText('into {value1}', {value1: targetTitle || pull.targetProjectId})}</small></span>
                    <span>#{pull.index} <ChevronRight size={14} /></span>
                </Link>
            ))}
        </section>
    );
};

export default OutgoingPullNotice;

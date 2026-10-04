/* eslint-disable max-len */
import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronRight, GitFork} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import api, {projectUrl} from '../../api';
import StatusMessage from '../../components/ui/StatusMessage.jsx';
import styles from '../Project.module.css';

const RemixTree = ({id, baseUrl}) => {
    const {text: communityText} = useCommunityText();
    const [tree, setTree] = useState(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setTree(null);
        setFailed(false);
        api.remixTree(id)
            .then(data => active && setTree(data))
            .catch(() => active && setFailed(true));
        return () => {
            active = false;
        };
    }, [attempt, id]);
    if (!tree && !failed) return null;
    if (failed) {
        return (
            <StatusMessage error compact onRetry={() => setAttempt(value => value + 1)}>
                {communityText('Could not load remixes.')}
            </StatusMessage>
        );
    }
    const nodes = tree.nodes || [];
    return (
        <section className={styles.remixPanel}>
            <GitFork size={20} />
            <div>
                <h2>{communityText('Remix tree')}</h2>
                <p>{nodes.length > 1 ? communityText('{value1} projects branch from the same original.', {value1: nodes.length}) : communityText('See this project alongside its Git history.')}</p>
            </div>
            <Link to={`${baseUrl || projectUrl(id)}/remixes`}>{communityText('Explore tree')}<ChevronRight size={15} /></Link>
        </section>
    );
};

export default RemixTree;

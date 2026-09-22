import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Compass, Dices} from 'lucide-react';
import api, {projectUrl} from '../api';
import setPageMeta from '../page-meta.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatusMessage from '../components/ui/StatusMessage.jsx';
import styles from './InfoPage.module.css';

const Random = () => {
    const {text: communityText} = useCommunityText();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const loadRandom = useCallback(async exclude => {
        setLoading(true);
        setError('');
        try {
            const data = await api.randomProject(exclude);
            const project = data.project || data;
            if (!project || !project.id) throw new Error('empty');
            navigate(projectUrl(project), {replace: true});
        } catch (e) {
            setError('no-shared');
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        setPageMeta({title: 'Random project'});
        loadRandom(searchParams.get('exclude'));
    }, []);

    return (
        <main className={`${styles.page} ${styles.notFound}`}>
            {loading ? (
                <StatusMessage>{communityText('Finding a random project…')}</StatusMessage>
            ) : null}
            {error ? (
                <EmptyState
                    icon={Dices}
                    title={communityText('No shared projects yet')}
                    action={(
                        <React.Fragment>
                            <Button variant="primary" onClick={() => loadRandom()}>
                                <Dices size={16} aria-hidden="true" />
                                {communityText('Try again')}
                            </Button>
                            <Button as={Link} to="/explore">
                                <Compass size={16} aria-hidden="true" />
                                {communityText('Browse projects instead')}
                            </Button>
                        </React.Fragment>
                    )}
                >
                    {communityText('Share a project and it can turn up here.')}
                </EmptyState>
            ) : null}
        </main>
    );
};

export default Random;

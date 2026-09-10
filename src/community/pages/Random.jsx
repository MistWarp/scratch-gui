import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useCallback, useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Dices} from 'lucide-react';
import api, {projectUrl} from '../api';
import setPageMeta from '../page-meta.js';
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
            <div>
                <h1><Dices size={32} /></h1>
                <h2>
                    {loading ? communityText('Finding a random project…') : communityText('No shared projects yet.')}
                </h2>
                {error ? (
                    <p>
                        <button
                            type="button"
                            className={styles.link}
                            onClick={() => loadRandom()}
                        >
                            {communityText('Try again')}
                        </button>
                        {' · '}
                        <Link
                            className={styles.link}
                            to="/explore"
                        >
                            {communityText('Browse projects instead')}
                        </Link>
                    </p>
                ) : null}
            </div>
        </main>
    );
};

export default Random;

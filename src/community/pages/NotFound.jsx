import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import React, {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {House, SearchX} from 'lucide-react';
import setPageMeta from '../page-meta.js';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import styles from './InfoPage.module.css';

const NotFound = () => {
    const {text: communityText} = useCommunityText();
    useEffect(() => setPageMeta({title: 'Page not found'}), []);
    return (
        <main className={`${styles.page} ${styles.notFound}`}>
            <EmptyState
                icon={SearchX}
                title={communityText('That page does not exist.')}
                action={(
                    <Button as={Link} to="/" variant="primary">
                        <House size={16} aria-hidden="true" />
                        {communityText('Return to the MistWarp home page')}
                    </Button>
                )}
            />
        </main>
    );
};

export default NotFound;

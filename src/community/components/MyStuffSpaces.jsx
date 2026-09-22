import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {FolderHeart, Layers3, Trophy} from 'lucide-react';
import SpaceCard from './SpaceCard.jsx';
import CardGrid from './ui/CardGrid.jsx';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './MyStuffSpaces.module.css';

const MyStuffSpaces = ({
    mode, spaces, error, onRetry
}) => {
    const {text: communityText} = useCommunityText();
    if (error) {
        return (
            <StatusMessage compact error onRetry={onRetry}>
                {mode === 'collections' ?
                    communityText('Could not load your collections.') :
                    communityText('Could not load your spaces.')}
            </StatusMessage>
        );
    }
    if (!spaces) return <StatusMessage compact />;

    if (mode === 'collections') {
        const collections = spaces.filter(space => space.kind === 'collection' && space.canManage);
        return (
            <section>
                <SectionHeading
                    icon={FolderHeart}
                    title={communityText('Collections')}
                    lead={communityText('Your project collections.')}
                    link="/spaces?kind=collection"
                    linkLabel={communityText('Browse collections')}
                />
                {collections.length ? (
                    <CardGrid>
                        {collections.map(collection => (
                            <SpaceCard key={collection._id} space={collection} to={`/spaces/${collection._id}`} />
                        ))}
                    </CardGrid>
                ) : (
                    <EmptyState compact icon={FolderHeart} title={communityText('No collections yet')}>
                        {communityText('Collections you create show up here.')}
                    </EmptyState>
                )}
            </section>
        );
    }

    const studios = spaces.filter(space => space.kind === 'studio');
    const challenges = spaces.filter(space => space.kind === 'challenge');
    return (
        <section>
            <SectionHeading
                icon={Layers3}
                title={communityText('Spaces')}
                lead={communityText('Studios you curate or follow, and challenges you host, join, judge, or follow.')}
                link="/spaces?kind=studio"
                linkLabel={communityText('Browse studios')}
            />
            <div className={styles.group}>
                <SectionHeading as="h3" icon={Layers3} title={communityText('Studios')} count={studios.length} />
                {studios.length ? (
                    <CardGrid>
                        {studios.map(studio => (
                            <SpaceCard key={studio._id} space={studio} to={`/spaces/${studio._id}`} />
                        ))}
                    </CardGrid>
                ) : (
                    <EmptyState compact icon={Layers3} title={communityText('No studios yet')}>
                        {communityText('You do not have any studios yet.')}
                    </EmptyState>
                )}
            </div>
            <div className={styles.group}>
                <SectionHeading as="h3" icon={Trophy} title={communityText('Challenges')} count={challenges.length} />
                {challenges.length ? (
                    <CardGrid>
                        {challenges.map(challenge => (
                            <SpaceCard key={challenge._id} space={challenge} to={`/spaces/${challenge._id}`} />
                        ))}
                    </CardGrid>
                ) : (
                    <EmptyState compact icon={Trophy} title={communityText('No challenges yet')}>
                        {communityText('You have not joined or followed any challenges yet.')}
                    </EmptyState>
                )}
            </div>
        </section>
    );
};

MyStuffSpaces.propTypes = {
    mode: PropTypes.oneOf(['collections', 'spaces']).isRequired,
    spaces: PropTypes.arrayOf(PropTypes.object),
    error: PropTypes.bool,
    onRetry: PropTypes.func.isRequired
};

MyStuffSpaces.defaultProps = {
    spaces: null,
    error: false
};

export default MyStuffSpaces;

/* eslint-disable max-len */
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {FolderHeart, Layers3, Plus, Trophy} from 'lucide-react';
import SpaceCard from './SpaceCard.jsx';
import {CardSkeleton} from './GameCard.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import QuietLink from './ui/QuietLink.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import styles from './MyStuffSpaces.module.css';

const SpaceGrid = ({spaces}) => (
    <div className={styles.grid}>
        {spaces.map(space => (
            <SpaceCard key={space._id} space={space} to={`/spaces/${space._id}`} />
        ))}
    </div>
);

SpaceGrid.propTypes = {
    spaces: PropTypes.arrayOf(PropTypes.object).isRequired
};

const Count = ({value}) => <span className={styles.count}>{value}</span>;

Count.propTypes = {
    value: PropTypes.number.isRequired
};

const MyStuffSpaces = ({
    mode, spaces, error, onRetry
}) => {
    const {text: communityText} = useCommunityText();
    const collections = mode === 'collections';
    const heading = collections ? (
        <SectionHeading
            title={communityText('Collections')}
            lead={communityText('Your project collections.')}
            actions={(
                <React.Fragment>
                    <QuietLink to="/spaces?kind=collection">{communityText('Browse collections')}</QuietLink>
                    <Button size="small" as={Link} to="/spaces?create=1&kind=collection">
                        <Plus size={14} />{communityText('New collection')}
                    </Button>
                </React.Fragment>
            )}
        />
    ) : (
        <SectionHeading
            title={communityText('Spaces')}
            lead={communityText('Studios you curate or follow, and challenges you host, join, judge, or follow.')}
            actions={(
                <React.Fragment>
                    <QuietLink to="/spaces">{communityText('Browse spaces')}</QuietLink>
                    <Button size="small" as={Link} to="/spaces?create=1&kind=studio">
                        <Plus size={14} />{communityText('New studio')}
                    </Button>
                </React.Fragment>
            )}
        />
    );
    let body;
    if (error) {
        body = (
            <StatusMessage compact error onRetry={onRetry}>
                {collections ?
                    communityText('Could not load your collections.') :
                    communityText('Could not load your spaces.')}
            </StatusMessage>
        );
    } else if (!spaces) {
        body = (
            <div className={styles.grid} role="status" aria-label={communityText('Loading…')}>
                {[0, 1, 2].map(index => <CardSkeleton key={index} />)}
            </div>
        );
    } else if (collections) {
        const mine = spaces.filter(space => space.kind === 'collection' && space.canManage);
        body = mine.length ? <SpaceGrid spaces={mine} /> : (
            <EmptyState icon={FolderHeart} title={communityText('No collections yet')}>
                {communityText('Collections you create show up here.')}
            </EmptyState>
        );
    } else {
        const studios = spaces.filter(space => space.kind === 'studio');
        const challenges = spaces.filter(space => space.kind === 'challenge');
        body = (
            <React.Fragment>
                <div className={styles.group}>
                    <SectionHeading
                        as="h3"
                        title={<React.Fragment>{communityText('Studios')} <Count value={studios.length} /></React.Fragment>}
                    />
                    {studios.length ? <SpaceGrid spaces={studios} /> : (
                        <EmptyState compact icon={Layers3} title={communityText('No studios yet')}>
                            {communityText('You do not have any studios yet.')}
                        </EmptyState>
                    )}
                </div>
                <div className={styles.group}>
                    <SectionHeading
                        as="h3"
                        title={<React.Fragment>{communityText('Challenges')} <Count value={challenges.length} /></React.Fragment>}
                        actions={<QuietLink to="/spaces?kind=challenge">{communityText('Find a challenge')}</QuietLink>}
                    />
                    {challenges.length ? <SpaceGrid spaces={challenges} /> : (
                        <EmptyState compact icon={Trophy} title={communityText('No challenges yet')}>
                            {communityText('You have not joined or followed any challenges yet.')}
                        </EmptyState>
                    )}
                </div>
            </React.Fragment>
        );
    }
    return (
        <section>
            {heading}
            {body}
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

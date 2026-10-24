/* eslint-disable max-len */
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import {RotateCcw, Trash2} from 'lucide-react';
import {formatDate} from '../format';
import ListSkeleton from './ListSkeleton.jsx';
import StuffRow, {MenuLink, StuffList} from './StuffRow.jsx';
import Button from './ui/Button.jsx';
import EmptyState from './ui/EmptyState.jsx';
import SectionHeading from './ui/SectionHeading.jsx';
import StatusMessage from './ui/StatusMessage.jsx';

const MyStuffTrash = ({busy, failed, onEmpty, onPurge, onRestore, onRetry, projects}) => {
    const {text: communityText} = useCommunityText();
    let body;
    if (failed) {
        body = <StatusMessage compact error onRetry={onRetry}>{communityText('Could not load Trash.')}</StatusMessage>;
    } else if (projects === null) {
        body = <ListSkeleton count={3} media="square" label={communityText('Loading Trash…')} />;
    } else if (projects.length) {
        body = (
            <StuffList>
                {projects.map(project => (
                    <StuffRow
                        key={project.id}
                        project={project}
                        title={project.title || communityText('Untitled')}
                        dimmed={busy === `restore:${project.id}` || busy === `purge:${project.id}`}
                        meta={communityText('Deletes forever {value1}', {value1: formatDate(project.purgeAt, 'date unavailable')})}
                        trailing={(
                            <Button
                                size="small"
                                busy={busy === `restore:${project.id}`}
                                disabled={Boolean(busy)}
                                onClick={() => onRestore(project)}
                            ><RotateCcw size={14} />{communityText('Restore')}</Button>
                        )}
                        menuLabel={communityText('More for {value1}', {value1: project.title})}
                        menu={({close}) => (
                            <MenuLink
                                danger
                                onClick={() => {
                                    close(false);
                                    if (!busy) onPurge(project);
                                }}
                            ><Trash2 size={15} aria-hidden="true" />{communityText('Delete forever')}</MenuLink>
                        )}
                    />
                ))}
            </StuffList>
        );
    } else {
        body = (
            <EmptyState icon={Trash2} title={communityText('No deleted projects')}>
                {communityText('Trash is empty. Projects you delete stay here until their recovery period ends.')}
            </EmptyState>
        );
    }
    return (
        <section>
            <SectionHeading
                title={communityText('Trash')}
                lead={communityText('Deleted projects wait here, still counting toward your storage, until they are deleted forever.')}
                actions={projects && projects.length ? (
                    <Button
                        size="small"
                        variant="danger"
                        disabled={Boolean(busy)}
                        onClick={onEmpty}
                    >{communityText('Empty Trash')}</Button>
                ) : null}
            />
            {body}
        </section>
    );
};

MyStuffTrash.propTypes = {
    busy: PropTypes.string,
    failed: PropTypes.bool,
    onEmpty: PropTypes.func.isRequired,
    onPurge: PropTypes.func.isRequired,
    onRestore: PropTypes.func.isRequired,
    onRetry: PropTypes.func.isRequired,
    projects: PropTypes.arrayOf(PropTypes.object)
};

MyStuffTrash.defaultProps = {
    busy: '',
    failed: false,
    projects: null
};

export default MyStuffTrash;

import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {ExternalLink, PawPrint} from 'lucide-react';
import loadProjectPreview from '../project-preview.js';
import {projectMadeWith, projectShareUrl} from '../claw-links.js';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';
import Notice from './ui/Notice.jsx';
import StatusMessage from './ui/StatusMessage.jsx';
import PostComposer from './PostComposer.jsx';
import styles from './PostToClawModal.module.css';

const PostToClawModal = ({project, user, onClose, onViewPost}) => {
    const {text: communityText} = useCommunityText();
    const [details, setDetails] = useState(null);
    const [posted, setPosted] = useState(null);
    useEffect(() => {
        let active = true;
        setDetails(null);
        loadProjectPreview({id: project.id}).then(found => {
            if (active) setDetails({...project, ...(found || {})});
        });
        return () => {
            active = false;
        };
    }, [project.id]);

    return (
        <Modal
            icon={PawPrint}
            title={communityText('Post to claw')}
            onClose={onClose}
            actions={posted ? (
                <React.Fragment>
                    <Button onClick={onClose}>{communityText('Close')}</Button>
                    {posted.id && onViewPost ? (
                        <Button variant="primary" onClick={() => onViewPost(posted.id)}>
                            <ExternalLink size={15} />
                            {communityText('View post')}
                        </Button>
                    ) : null}
                </React.Fragment>
            ) : null}
        >
            {posted ? (
                <Notice variant="success">
                    {details && details.title ?
                        communityText('Your post about {value1} is on claw.', {value1: details.title}) :
                        communityText('Your post is on claw.')}
                </Notice>
            ) : null}
            {!posted && !details ? <StatusMessage compact /> : null}
            {!posted && details ? (
                <React.Fragment>
                    <p className={styles.lead}>
                        {details.title ?
                            communityText('Share {value1} with people on claw, the Rotur social network.', {
                                value1: details.title
                            }) :
                            communityText('Share your project with people on claw, the Rotur social network.')}
                    </p>
                    <PostComposer
                        bare
                        user={user}
                        initialContent={projectShareUrl(details)}
                        madeWith={projectMadeWith(details)}
                        onPosted={setPosted}
                    />
                </React.Fragment>
            ) : null}
        </Modal>
    );
};

PostToClawModal.propTypes = {
    project: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string,
        thumbUrl: PropTypes.string,
        vanitySlug: PropTypes.string
    }).isRequired,
    user: PropTypes.shape({username: PropTypes.string}).isRequired,
    onClose: PropTypes.func.isRequired,
    onViewPost: PropTypes.func
};

export default PostToClawModal;

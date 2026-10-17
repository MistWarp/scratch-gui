import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {ChevronDown, ExternalLink, Megaphone, Sparkles} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {authorName, pounceUrl, promotedBy, reasonLines} from '../claw-posts.js';
import styles from './PostReasons.module.css';

let nextId = 0;

const PostReasons = ({post, onLayoutChange}) => {
    const {text: communityText} = useCommunityText();
    const [open, setOpen] = useState(false);
    const idRef = useRef(null);
    if (!idRef.current) {
        nextId += 1;
        idRef.current = `post-reasons-${nextId}`;
    }
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        if (onLayoutChange) onLayoutChange();
    }, [open]);

    const promoter = promotedBy(post);
    if (promoter !== null) {
        return (
            <p className={styles.promoted}>
                <Megaphone size={13} aria-hidden="true" />
                <span>
                    {promoter ?
                        communityText('Promoted by {value1}', {value1: `@${promoter}`}) :
                        communityText('Promoted')}
                </span>
            </p>
        );
    }
    const lines = reasonLines(post.reasons, authorName(post), communityText);
    if (!lines.length) return null;
    return (
        <div className={styles.reasons}>
            <button
                type="button"
                className={styles.chip}
                aria-expanded={open}
                aria-controls={idRef.current}
                title={communityText('Why you are seeing this post')}
                onClick={() => setOpen(value => !value)}
            >
                <Sparkles size={12} aria-hidden="true" />
                <span>{lines[0]}</span>
                <ChevronDown size={12} aria-hidden="true" className={open ? styles.flipped : null} />
            </button>
            {open ? (
                <div className={styles.panel} id={idRef.current}>
                    <strong>{communityText('Why you are seeing this post')}</strong>
                    <ul>{lines.map(line => <li key={line}>{line}</li>)}</ul>
                    <a href={pounceUrl('/settings/for-you')} target="_blank" rel="noopener noreferrer">
                        {communityText('Open For You settings on pounce')}
                        <ExternalLink size={12} aria-hidden="true" />
                    </a>
                </div>
            ) : null}
        </div>
    );
};

PostReasons.propTypes = {
    post: PropTypes.object.isRequired,
    onLayoutChange: PropTypes.func
};

export default PostReasons;

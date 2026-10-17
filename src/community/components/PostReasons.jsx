import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {ExternalLink} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import {authorName, pounceUrl, reasonLines, showsWhy} from '../claw-posts.js';
import styles from './PostReasons.module.css';

let nextId = 0;

const PostReasons = ({post}) => {
    const {text: communityText} = useCommunityText();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const buttonRef = useRef(null);
    const idRef = useRef(null);
    if (!idRef.current) {
        nextId += 1;
        idRef.current = `post-reasons-${nextId}`;
    }

    useEffect(() => {
        if (!open) return;
        const inside = target => Boolean(wrapRef.current && wrapRef.current.contains(target));
        const onPointer = event => {
            if (!inside(event.target)) setOpen(false);
        };
        const onKey = event => {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            setOpen(false);
            if (buttonRef.current) buttonRef.current.focus();
        };
        const onFocus = event => {
            if (!inside(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', onPointer, true);
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('focusin', onFocus);
        return () => {
            document.removeEventListener('pointerdown', onPointer, true);
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('focusin', onFocus);
        };
    }, [open]);

    if (!showsWhy(post.reasons)) return null;
    const lines = reasonLines(post.reasons, authorName(post), communityText);
    if (!lines.length) return null;
    return (
        <span className={styles.why} ref={wrapRef}>
            <button
                ref={buttonRef}
                type="button"
                className={styles.button}
                aria-expanded={open}
                aria-controls={open ? idRef.current : null}
                aria-label={communityText('Why am I seeing this post?')}
                onClick={() => setOpen(value => !value)}
            >{communityText('Why?')}</button>
            {open ? (
                <div
                    className={styles.panel}
                    id={idRef.current}
                    role="dialog"
                    aria-label={communityText('Why you are seeing this post')}
                >
                    <strong>{communityText('Why you are seeing this post')}</strong>
                    <ul>{lines.map(line => <li key={line}>{line}</li>)}</ul>
                    <a href={pounceUrl('/settings/for-you')} target="_blank" rel="noopener noreferrer">
                        {communityText('Open For You settings on pounce')}
                        <ExternalLink size={12} aria-hidden="true" />
                    </a>
                </div>
            ) : null}
        </span>
    );
};

PostReasons.propTypes = {
    post: PropTypes.object.isRequired
};

export default PostReasons;

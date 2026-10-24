/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React, {useEffect, useRef, useState} from 'react';
import {Check, Share2} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import copyText from '../../copy-text.js';
import {aboutUrl} from '../../classroom.js';
import Button from '../ui/Button.jsx';

const ShareWithTeacher = ({className, variant}) => {
    const {text: communityText} = useCommunityText();
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);
    const flash = setter => {
        setter(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setter(false), 2500);
    };
    const share = async () => {
        const url = aboutUrl();
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: communityText('MistWarp Classroom'),
                    text: communityText('MistWarp Classroom lets a class build Scratch projects in a private space that the teacher runs.'),
                    url
                });
                return;
            } catch (error) {
                if (error && error.name === 'AbortError') return;
            }
        }
        try {
            await copyText(url);
            setFailed(false);
            flash(setCopied);
        } catch (error) {
            setCopied(false);
            flash(setFailed);
        }
    };
    let label = communityText('Share with your teacher');
    if (copied) label = communityText('Link copied');
    if (failed) label = communityText('Could not copy the link');
    return (
        <Button className={className} variant={variant} onClick={share} aria-live="polite">
            {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
            {label}
        </Button>
    );
};

ShareWithTeacher.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'secondary'])
};

ShareWithTeacher.defaultProps = {
    variant: 'secondary'
};

export default ShareWithTeacher;

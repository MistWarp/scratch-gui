import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {PawPrint} from 'lucide-react';
import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import rotur from '../rotur.js';
import {postStats, withPounce} from '../claw-posts.js';
import {setPouncesLeft, usePounceQuota} from '../pounce-quota.js';
import {useUser} from '../UserContext.jsx';
import Button from './ui/Button.jsx';

const resetTime = resetsAt => {
    if (!resetsAt) return '';
    try {
        return new Date(resetsAt).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    } catch (_) {
        return '';
    }
};

const PounceButton = ({post, mine, onChange, onNotice, onError}) => {
    const {text: communityText} = useCommunityText();
    const {user, login} = useUser();
    const quota = usePounceQuota(user && user.username);
    const [busy, setBusy] = useState(false);
    const {pounceCount, pounced} = postStats(post, user && user.username);
    const noneLeft = Boolean(quota) && quota.left <= 0 && !pounced;
    const usedUp = () => {
        const time = resetTime(quota && quota.resetsAt);
        return time ?
            communityText('You have used all of today\'s pounces. You get more at {value1}.', {value1: time}) :
            communityText('You have used all of today\'s pounces. You get more tomorrow.');
    };
    let hint = communityText('Pounce to help more people see this post.');
    if (!user) hint = communityText('Sign in to pounce.');
    else if (mine) hint = communityText('You cannot pounce your own post.');
    else if (noneLeft) hint = usedUp();
    else if (pounced) hint = communityText('Undo pounce');
    else if (quota) {
        hint = communityText(
            '{value1, plural, one {You have # pounce left today.} other {You have # pounces left today.}}',
            {value1: quota.left}
        );
    }

    const toggle = async () => {
        if (!user) {
            login();
            return;
        }
        if (mine || noneLeft) {
            onNotice(mine ? communityText('You cannot pounce your own post.') : usedUp());
            return;
        }
        if (busy) return;
        const next = !pounced;
        const before = post;
        const leftBefore = quota ? quota.left : null;
        setBusy(true);
        onChange(withPounce(post, next));
        if (next && leftBefore !== null) setPouncesLeft(leftBefore - 1);
        try {
            const result = next ? await rotur.pounce(post.id) : await rotur.unpounce(post.id);
            if (result && typeof result.pounced === 'boolean') {
                onChange(withPounce(before, result.pounced, result.pounce_count));
            }
            if (result && typeof result.pounces_left === 'number') setPouncesLeft(result.pounces_left);
            if (next) {
                const left = result && typeof result.pounces_left === 'number' ? result.pounces_left : null;
                if (left === 0) onNotice(communityText('Pounced. That was your last pounce today.'));
                else if (left === null) onNotice(communityText('Pounced.'));
                else {
                    onNotice(communityText(
                        '{value1, plural, one {Pounced. # pounce left today.} other {Pounced. # pounces left today.}}',
                        {value1: left}
                    ));
                }
            }
        } catch (error) {
            onChange(before);
            if (leftBefore !== null) setPouncesLeft(leftBefore);
            if (error.code === 'no_pounces_left') {
                setPouncesLeft(0, error.data && error.data.resets_at);
                onError(usedUp());
            } else if (error.code === 'cannot_pounce') {
                onError(communityText('This post cannot be pounced.'));
            } else {
                onError(error.message || communityText('Could not update this post.'));
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Button
            aria-pressed={pounced}
            aria-disabled={Boolean(user) && (mine || noneLeft) ? true : null}
            aria-label={pounced ?
                communityText('{value1, plural, one {Undo pounce, # pounce} other {Undo pounce, # pounces}}', {
                    value1: pounceCount || 0
                }) :
                communityText('{value1, plural, one {Pounce, # pounce} other {Pounce, # pounces}}', {
                    value1: pounceCount || 0
                })}
            title={hint}
            disabled={busy}
            onClick={toggle}
        >
            <PawPrint size={17} fill={pounced ? 'currentColor' : 'none'} aria-hidden="true" />
            {pounceCount ? <span>{pounceCount}</span> : null}
        </Button>
    );
};

PounceButton.propTypes = {
    post: PropTypes.object.isRequired,
    mine: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onNotice: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired
};

export default PounceButton;

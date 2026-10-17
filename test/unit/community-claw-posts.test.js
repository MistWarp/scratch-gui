import {
    canPounce, mayPromote, postStats, promotedBy, reasonLines, replyContext, withLike, withPounce
} from '../../src/community/claw-posts.js';

const text = (message, values = {}) => message.replace(/\{(\w+)(?:, plural, one \{([^}]*)\} other \{([^}]*)\})?\}/g,
    (match, key, one, other) => {
        if (one === undefined) return String(values[key]);
        return (values[key] === 1 ? one : other).replace('#', String(values[key]));
    });

describe('claw post state', () => {
    test('reads legacy arrays when there are no v2 counts', () => {
        const stats = postStats({likes: ['Alice', 'bob'], replies: [{id: 'r'}], views: 4}, 'alice');
        expect(stats).toEqual({likeCount: 2, liked: true, replyCount: 1, pounceCount: null, pounced: false, views: 4});
    });

    test('prefers v2 counts and viewer state', () => {
        const stats = postStats({
            like_count: 7,
            reply_count: 3,
            pounce_count: 2,
            view_count: 40,
            views: 12,
            viewer: {liked: false, pounced: true},
            likes: ['alice']
        }, 'alice');
        expect(stats).toEqual({likeCount: 7, liked: false, replyCount: 3, pounceCount: 2, pounced: true, views: 40});
    });

    test('likes update both the legacy list and the v2 count', () => {
        const liked = withLike({likes: ['bob'], like_count: 1, viewer: {liked: false}}, true, 'alice');
        expect(liked).toEqual({likes: ['bob', 'alice'], like_count: 2, viewer: {liked: true}});
        expect(withLike(liked, false, 'alice')).toEqual({likes: ['bob'], like_count: 1, viewer: {liked: false}});
        expect(withLike({like_count: 3}, true, 'alice')).toEqual({like_count: 4});
        expect(withLike({likes: []}, true, 'alice')).toEqual({likes: ['alice']});
    });

    test('pounces take the count from the API when it gives one', () => {
        expect(withPounce({pounce_count: 2}, true)).toEqual({pounce_count: 3, viewer: {pounced: true}});
        expect(withPounce({pounce_count: 2, viewer: {pounced: true}}, false, 5))
            .toEqual({pounce_count: 5, viewer: {pounced: false}});
        expect(withPounce({pounce_count: 2, viewer: {pounced: true}}, true)).toEqual({
            pounce_count: 2, viewer: {pounced: true}
        });
    });

    test('only posts from an API with pounces can be pounced', () => {
        expect(canPounce({id: 'a', pounce_count: 0})).toBe(true);
        expect(canPounce({id: 'a'})).toBe(false);
        expect(canPounce({id: 'a', pounce_count: 0, is_repost: true})).toBe(false);
    });
});

describe('For You reasons', () => {
    test('are described in plain words, skipping unknown and repeated ones', () => {
        const lines = reasonLines([
            {type: 'pounced_by', users: ['mist', 'flufi']},
            {type: 'friend_replied', count: 2},
            {type: 'something_new'},
            {type: 'conversation', replies: 1},
            {type: 'made_with', app: 'MistWarp'},
            {type: 'fresh'},
            {type: 'fresh'},
            {type: 'followed_author'}
        ], 'sophie', text);
        expect(lines).toEqual([
            'Pounced by @mist, @flufi',
            '2 people you follow replied',
            '1 reply so far',
            'Made with MistWarp',
            'Posted recently',
            'You follow @sophie'
        ]);
    });

    test('reasons with missing details fall back or drop out', () => {
        expect(reasonLines([
            {type: 'pounced_by'}, {type: 'friend_replied'}, {type: 'app_match'}, {type: 'conversation'}, null
        ], 'x', text)).toEqual(['Pounced by people you follow', 'Someone you follow replied', 'People are replying']);
    });

    test('promoted items name the promoter', () => {
        expect(promotedBy({placement: 'promoted', promoted_by: 'mist'})).toBe('mist');
        expect(promotedBy({reasons: [{type: 'promoted', by: 'flufi'}]})).toBe('flufi');
        expect(promotedBy({placement: 'promoted'})).toBe('');
        expect(promotedBy({placement: 'organic', reasons: [{type: 'fresh'}]})).toBeNull();
    });
});

describe('replies', () => {
    test('know the post and person they answer', () => {
        expect(replyContext({reply_to: 'p1', root_id: 'p0', reply_to_user: {username: 'mist'}, self_thread: true}))
            .toEqual({parentId: 'p1', rootId: 'p0', user: 'mist', selfThread: true});
        expect(replyContext({reply_to: null})).toBeNull();
    });

    test('only your own public top-level posts can be promoted', () => {
        expect(mayPromote({user: 'Sophie'}, 'sophie')).toBe(true);
        expect(mayPromote({user: 'mist'}, 'sophie')).toBe(false);
        expect(mayPromote({user: 'sophie', reply_to: 'p1'}, 'sophie')).toBe(false);
        expect(mayPromote({user: 'sophie', profile_only: true}, 'sophie')).toBe(false);
        expect(mayPromote({user: 'sophie', is_repost: true}, 'sophie')).toBe(false);
    });
});

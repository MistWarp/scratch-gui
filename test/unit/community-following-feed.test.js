import {
    interleaveTimeline,
    normalizeFollowingPosts,
    timestampMs
} from '../../src/community/following-feed.js';

describe('following feed timeline', () => {
    test('normalizes seconds and removes duplicate posts', () => {
        const posts = normalizeFollowingPosts([
            {id: 'older', user: 'alice', content: 'Old', timestamp: 1000},
            {id: 'newer', user: 'bob', content: 'New', timestamp: 2000000000000},
            {id: 'older', user: 'alice', content: 'Duplicate', timestamp: 3000}
        ]);

        expect(posts.map(post => post.id)).toEqual(['newer', 'older']);
        expect(posts[1].timestamp).toBe(1000000);
    });

    test('interweaves posts and notifications newest first', () => {
        const timeline = interleaveTimeline(
            [{id: 'notification', type: 'follow', created: 2000}],
            [{id: 'post', user: 'alice', content: 'Hello', timestamp: 3000}]
        );

        expect(timeline.map(item => item.id)).toEqual(['post', 'notification']);
        expect(timeline[0].timelineType).toBe('following-post');
        expect(timestampMs(timeline[1].created)).toBe(2000000);
    });
});

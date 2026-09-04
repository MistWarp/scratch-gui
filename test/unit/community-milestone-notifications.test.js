import {isMilestoneNotification, milestoneText, milestoneLink} from '../../src/community/milestone-notifications';

const kinds = ['project', 'comment', 'roadmap post', 'studio', 'challenge', 'news post', 'post', 'theme', 'collection'];
test.each(kinds)('renders the milestone for a %s', contentKind => {
    const item = {type: 'like_milestone', milestone: 25, contentKind};
    expect(isMilestoneNotification(item)).toBe(true);
    expect(milestoneText(item)).toBe(`Your ${contentKind} got 25 likes`);
});
test('formats follower milestones', () => {
    expect(milestoneText({type: 'follower_milestone', milestone: 1000})).toBe('You reached 1,000 followers');
});
test.each(['/project/p1#comment-id-c1', '/roadmap?idea=r1#comment-id-c1', '/spaces/s1', '/posts/p1', '/users/alice/followers'])('links to %s', path => {
    expect(milestoneLink({path})).toBe(path);
});
test.each(['//evil.test', '/\\evil.test', 'https://evil.test', 'javascript:alert(1)'])('rejects external notification links: %s', path => {
    expect(milestoneLink({path})).toBe('/notifications');
});

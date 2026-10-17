import {
    GROUP_WINDOW,
    groupNotifications,
    matchesFilter,
    surfaceOf
} from '../../src/community/notification-groups.js';

const NOW = 1760000000000;
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
let seq = 0;

const claw = (type, actor, ago, post = 'p1', extra = {}) => ({
    id: `n${++seq}`,
    type,
    user: actor,
    actor,
    post_id: post,
    timestamp: NOW - ago,
    read: true,
    ...extra
});

const kinds = rows => rows.map(row => row.kind);

describe('grouping by person', () => {
    test('collapses one person\'s consecutive actions inside the window into one row', () => {
        const rows = groupNotifications([
            claw('like', 'Andrew', 1 * MIN, 'p1'),
            claw('pounce', 'Andrew', 5 * MIN, 'p2'),
            claw('reply', 'Andrew', 20 * MIN, 'p1', {content: 'nice'})
        ]);
        expect(kinds(rows)).toEqual(['actor']);
        expect(rows[0].actor).toBe('Andrew');
        expect(rows[0].items).toHaveLength(3);
        expect(rows[0].types).toEqual(['like', 'pounce', 'reply']);
        expect(rows[0].targets).toEqual(['post:p1', 'post:p2']);
        expect(rows[0].object).toBe('posts');
        expect(rows[0].time).toBe(NOW - MIN);
    });

    test('starts a new row once the window has passed', () => {
        const rows = groupNotifications([
            claw('like', 'Andrew', 0, 'p1'),
            claw('pounce', 'Andrew', 30 * MIN, 'p2'),
            claw('like', 'Andrew', GROUP_WINDOW + MIN, 'p3'),
            claw('pounce', 'Andrew', GROUP_WINDOW + (2 * MIN), 'p4')
        ]);
        expect(kinds(rows)).toEqual(['actor', 'actor']);
        expect(rows[0].items.map(n => n.post_id)).toEqual(['p1', 'p2']);
        expect(rows[1].items.map(n => n.post_id)).toEqual(['p3', 'p4']);
    });

    test('someone else in between ends the run', () => {
        const rows = groupNotifications([
            claw('like', 'Andrew', 0, 'p1'),
            claw('pounce', 'Andrew', MIN, 'p2'),
            claw('like', 'SanDisk', 2 * MIN, 'p9'),
            claw('repost', 'Andrew', 3 * MIN, 'p3')
        ]);
        expect(kinds(rows)).toEqual(['actor', 'single', 'single']);
        expect(rows[2].items[0].type).toBe('repost');
    });

    test('names a single post when every action is on it', () => {
        const [row] = groupNotifications([
            claw('like', 'SanDisk', 0, 'p6'),
            claw('pounce', 'SanDisk', MIN, 'p6')
        ]);
        expect(row.kind).toBe('actor');
        expect(row.targets).toEqual(['post:p6']);
    });

    test('reproduces the owner\'s inbox as three rows', () => {
        const items = [
            claw('reply', 'Andrew', 10000, 'pa', {content: 'no'}),
            claw('reply', 'Andrew', 20000, 'pa', {content: ''}),
            claw('reply', 'Andrew', 30000, 'pa', {content: 'wrong'}),
            claw('repost', 'Andrew', 3 * MIN, 'pa'),
            claw('like', 'Andrew', 3 * MIN, 'pa'),
            claw('pounce', 'Andrew', 51 * MIN, 'pb'),
            claw('pounce', 'Andrew', 51 * MIN, 'pc'),
            claw('like', 'Andrew', 51 * MIN, 'pc'),
            claw('like', 'Andrew', 52 * MIN, 'pb'),
            claw('reply', 'Andrew', 52 * MIN, 'pb', {content: 'crazy'}),
            claw('pounce', 'Andrew', 52 * MIN, 'pd'),
            claw('like', 'SanDisk', 4 * HOUR, 'pe'),
            claw('pounce', 'SanDisk', 4 * HOUR, 'pe'),
            claw('like', 'marsidko.sensitive', 5 * HOUR, 'pe')
        ];
        const rows = groupNotifications(items);
        expect(kinds(rows)).toEqual(['actor', 'actor', 'single']);
        expect(rows[0].items).toHaveLength(11);
        expect(rows[0].types).toEqual(['like', 'pounce', 'repost', 'reply']);
        expect(rows[1].actor).toBe('SanDisk');
        expect(rows[2].items[0].actor).toBe('marsidko.sensitive');
    });
});

describe('grouping the same action across people', () => {
    test('combines likes on one post from different people', () => {
        const rows = groupNotifications([
            claw('like', 'flufi', 0, 'p1'),
            claw('like', 'darkdot', 5 * MIN, 'p1'),
            claw('like', 'mist', 3 * HOUR, 'p1')
        ]);
        expect(kinds(rows)).toEqual(['stack']);
        expect(rows[0].type).toBe('like');
        expect(rows[0].actors).toEqual(['flufi', 'darkdot', 'mist']);
        expect(rows[0].target).toBe('post:p1');
    });

    test('keeps different posts and different actions apart', () => {
        const rows = groupNotifications([
            claw('like', 'flufi', 0, 'p1'),
            claw('like', 'darkdot', 5 * MIN, 'p2'),
            claw('pounce', 'mist', 10 * MIN, 'p1')
        ]);
        expect(kinds(rows)).toEqual(['single', 'single', 'single']);
    });

    test('combines follows and project loves', () => {
        const rows = groupNotifications([
            {id: 'f1', type: 'follow', follower: 'darkdot', actor: 'darkdot', timestamp: NOW},
            {id: 'f2', type: 'follow', follower: 'kiwi', actor: 'kiwi', timestamp: NOW - HOUR},
            {id: 'l1', type: 'love', actor: 'kiwi', projectId: 'x', created: NOW - (2 * HOUR)},
            {id: 'l2', type: 'love', actor: 'tomo', projectId: 'x', created: NOW - (3 * HOUR)}
        ]);
        expect(rows.map(row => [row.kind, row.type, row.actors])).toEqual([
            ['stack', 'follow', ['darkdot', 'kiwi']],
            ['stack', 'love', ['kiwi', 'tomo']]
        ]);
    });

    test('a person who did several things is not pulled into a crowd', () => {
        const rows = groupNotifications([
            claw('like', 'SanDisk', 0, 'p6'),
            claw('pounce', 'SanDisk', MIN, 'p6'),
            claw('like', 'marsidko', HOUR, 'p6')
        ]);
        expect(kinds(rows)).toEqual(['actor', 'single']);
    });
});

describe('mixed types', () => {
    test('system notices, milestones and mentions stay on their own', () => {
        const rows = groupNotifications([
            claw('like', 'Andrew', 0, 'p1'),
            {id: 'm', type: 'post_milestone', post_id: 'p1', milestone: 100, timestamp: NOW - MIN},
            claw('mention', 'Andrew', 2 * MIN, 'theirs', {content: '@you hi'}),
            claw('pounce', 'Andrew', 3 * MIN, 'p2'),
            {id: 's', type: 'standing', level: 'good', created: NOW - (4 * MIN)}
        ]);
        expect(rows.map(row => row.kind)).toEqual(['actor', 'single', 'single', 'single']);
        expect(rows[0].items.map(n => n.type)).toEqual(['like', 'pounce']);
        expect(rows[1].items[0].type).toBe('post_milestone');
        expect(rows[2].items[0].type).toBe('mention');
    });

    test('claw and project activity from one person reads as posts and projects', () => {
        const [row] = groupNotifications([
            claw('like', 'kiwi', 0, 'p1'),
            {id: 'c', type: 'comment', actor: 'kiwi', projectId: 'x', preview: 'cool', created: NOW - MIN},
            {id: 'l', type: 'love', actor: 'kiwi', projectId: 'x', created: NOW - (2 * MIN)}
        ]);
        expect(row.kind).toBe('actor');
        expect(row.types).toEqual(['like', 'love', 'comment']);
        expect(row.object).toBe('mixed');
    });

    test('filters by surface and conversation', () => {
        const like = claw('like', 'a', 0);
        const reply = claw('reply', 'a', 0, 'p1', {content: 'hi'});
        const comment = {type: 'comment', actor: 'a', projectId: 'x'};
        const news = {type: 'news', title: 'Hi'};
        expect([like, reply, comment, news].map(surfaceOf)).toEqual(['claw', 'claw', 'projects', 'system']);
        expect([like, reply, comment, news].filter(n => matchesFilter(n, 'mentions'))).toEqual([reply, comment]);
        expect([like, reply, comment, news].filter(n => matchesFilter(n, 'all'))).toHaveLength(4);
    });
});

describe('reply text', () => {
    test('a group keeps the newest reply as its excerpt', () => {
        const [row] = groupNotifications([
            claw('like', 'Andrew', 0, 'p1'),
            claw('reply', 'Andrew', MIN, 'p1', {content: ''}),
            claw('reply', 'Andrew', 2 * MIN, 'p1', {content: 'wrong'}),
            claw('reply', 'Andrew', 3 * MIN, 'p2', {content: 'crazy'})
        ]);
        expect(row.excerpt).toBe('wrong');
        expect(row.items.filter(n => n.type === 'reply').map(n => n.content)).toEqual(['', 'wrong', 'crazy']);
    });

    test('replies on their own keep their text and are never combined across people', () => {
        const rows = groupNotifications([
            claw('reply', 'flufi', 0, 'p1', {content: 'first'}),
            claw('reply', 'darkdot', MIN, 'p1', {content: 'second'})
        ]);
        expect(kinds(rows)).toEqual(['single', 'single']);
        expect(rows.map(row => row.items[0].content)).toEqual(['first', 'second']);
    });

    test('without clustering every notification is its own row, newest first', () => {
        const rows = groupNotifications([
            claw('reply', 'Andrew', 2 * MIN, 'p1', {content: 'b'}),
            claw('reply', 'Andrew', MIN, 'p1', {content: 'a'})
        ], {cluster: false});
        expect(rows.map(row => row.items[0].content)).toEqual(['a', 'b']);
    });
});

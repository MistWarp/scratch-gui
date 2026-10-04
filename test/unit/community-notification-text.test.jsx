import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter, Link} from 'react-router-dom';

import {createTranslator} from '../../src/community/i18n.jsx';
import {
    actorFor, describeNotification, richTranslator, stripSender, targetFor
} from '../../src/community/notification-text.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const english = createTranslator('en', {});

const render = parts => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <span>{parts}</span>
    </MemoryRouter>
);

describe('notification targets', () => {
    test.each([
        [{type: 'space_comment', spaceId: 's1', commentId: 'c1'}, {to: '/spaces/s1#comment-id-c1'}],
        [{type: 'space_project', spaceId: 's1'}, {to: '/spaces/s1'}],
        [{type: 'comment', projectId: 'p1', pull: 3, commentId: 'c2'}, {to: '/project/p1/pulls/3#comment-id-c2'}],
        [{type: 'roadmap_comment', roadmapId: 'r1'}, {to: '/roadmap#idea-r1'}],
        [{type: 'profile_comment', commentId: 'c3'}, {to: '/users/viewer#comment-id-c3'}],
        [{type: 'news', newsId: 'n 1'}, {to: '/news/n%201'}],
        [{type: 'news'}, {to: '/news'}],
        [{type: 'group_invite', group_tag: 'cats'}, {href: 'https://rotur.dev/groups/cats'}],
        [{type: 'like_milestone', milestone: 5, path: '/posts/p1'}, {to: '/posts/p1'}],
        [{type: 'follow', actor: 'alice'}, null]
    ])('links %o', (notification, target) => {
        expect(targetFor(notification, 'viewer')).toEqual(target);
    });
});

describe('notification actors', () => {
    test('prefers a username-shaped title over the posting app', () => {
        expect(actorFor({title: 'shima', actor: 'MistWarp'})).toBe('shima');
        expect(actorFor({title: 'MistWarp', actor: 'bob'})).toBe('bob');
        expect(actorFor({})).toBeNull();
    });

    test('drops a repeated sender prefix', () => {
        expect(stripSender('shima', 'shima commented on your project')).toBe('commented on your project');
    });
});

describe('rich translations', () => {
    test('places nodes where the translated sentence puts them', () => {
        const reordered = createTranslator('xx', {'{actor} loved {project}': '{project} was loved by {actor}'});
        const t = richTranslator(reordered);
        const wrapper = render(t('{actor} loved {project}', {
            actor: <b>{'alice'}</b>,
            project: <i>{'Cool Game'}</i>
        }));
        expect(wrapper.html()).toBe('<span><i>Cool Game</i> was loved by <b>alice</b></span>');
    });

    test('links the sentence around the actor without nesting links', () => {
        const t = richTranslator(english, children => <Link to="/project/p1">{children}</Link>);
        const wrapper = render(describeNotification(
            {type: 'comment', projectTitle: 'Cool Game', pull: 4},
            t,
            <Link to="/users/bob">{'bob'}</Link>
        ));
        expect(wrapper.text()).toBe('bob commented on PR #4 in Cool Game');
        expect(wrapper.find('a').map(link => [link.prop('href'), link.text()])).toEqual([
            ['/users/bob', 'bob'],
            ['/project/p1', 'commented on PR #4 in Cool Game']
        ]);
        expect(wrapper.find('a').at(1)
            .find('a')).toHaveLength(1);
    });

    test('keeps literal values intact', () => {
        const t = richTranslator(english);
        const wrapper = render(t('{actor} posted: {post}', {actor: <b>{'alice'}</b>, post: 'use {braces}'}));
        expect(wrapper.text()).toBe('alice posted: use {braces}');
    });
});

describe('notification sentences', () => {
    const describeText = (notification, actor = 'alice') => render(describeNotification(
        notification,
        richTranslator(english),
        <b>{actor}</b>
    )).text();

    test.each([
        [{type: 'space_comment', spaceTitle: 'Game Jam'}, 'alice commented on Game Jam'],
        [{type: 'love'}, 'alice loved your project'],
        [{type: 'donation', amount: 1}, 'alice donated 1 credit to you'],
        [{type: 'donation', amount: 20}, 'alice donated 20 credits to you'],
        [{type: 'contribution_merged', projectTitle: 'Cool Game', pull: 2},
            'alice merged changes for Cool Game in PR #2'],
        [{type: 'project_review', projectTitle: 'Cool Game', rating: 4}, 'alice rated Cool Game 4 out of 5'],
        [{type: 'report_update', action: 'warn_user'}, 'Your report was actioned with a warning.'],
        [{type: 'report_update', action: 'unknown'}, 'Your report was reviewed.'],
        [{type: 'standing', level: 'warned', reason: 'spam'}, 'Your account standing is now warned: spam'],
        [{type: 'moderation', message: 'Please read the rules'}, 'Please read the rules'],
        [{type: 'news', title: 'Release notes'}, 'New announcement: Release notes'],
        [{type: 'like_milestone', milestone: 25, contentKind: 'comment'}, 'Your comment got 25 likes'],
        [{type: 'notification', title: 'alice', body: 'alice waved at you'}, 'alice waved at you'],
        [{type: 'unknown'}, 'alice sent you a notification']
    ])('describes %o', (notification, text) => {
        expect(describeText(notification)).toBe(text);
    });
});

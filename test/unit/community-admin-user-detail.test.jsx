import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import UserDetailCard from '../../src/community/pages/admin/UserDetailCard.jsx';
import {adminUserPath, commentLocation} from '../../src/community/pages/admin/admin-links.js';

const NOW = Date.now();

const user = {
    username: 'sam',
    userId: 'u_sam',
    created: NOW - (3 * 86400000),
    bio: 'I make games',
    minor: true,
    student: false,
    admin: false,
    banned: false,
    ban: {},
    plan: {tier: 'Lite', known: true},
    commentsOff: true,
    followerCount: 4,
    followingCount: 2,
    standing: {level: 'warning',
        recoverAt: NOW + 86400000,
        history: [
            {level: 'warning', previous: 'good', reason: 'spam in comments', by: 'mist', created: NOW - 50000}
        ]},
    sessions: {active: 2, lastSignIn: NOW - 3600000},
    totals: {projects: 1, shared: 1, views: 120, hearts: 9, revenue: 30},
    projects: [{id: 'p1', title: 'Starfall', shared: true, views: 120, loveCount: 9, sizeBytes: 2048, edited: NOW}],
    quota: {used: 1048576, limit: 2147483648},
    reports: {
        aboutCount: 1,
        openAboutCount: 1,
        filedCount: 1,
        about: [{id: 'r1', type: 'comment', category: 'spam', reason: 'spam', reporter: 'kit', subject: 'sam', snapshot: 'buy now', created: NOW, resolved: false}],
        filed: [{id: 'r2', type: 'project', category: 'stolen', reason: 'stolen', reporter: 'sam', subject: 'kit', created: NOW, resolved: true, action: 'dismiss', resolvedBy: 'mist'}]
    },
    comments: [{key: 'project-p9', id: 'c1', content: 'check out my game', created: NOW, parent: ''}],
    activity: [{type: 'love', projectId: 'p9', projectTitle: 'Racer', projectOwner: 'kit', created: NOW}],
    spaces: [{id: 's1', title: 'Platformers'}],
    classes: [],
    note: {text: 'Watch for spam.', by: 'mist', updated: NOW - 60000}
};

const flush = async wrapper => {
    await act(async () => {
        for (let i = 0; i < 4; i++) await Promise.resolve();
    });
    wrapper.update();
};

const render = async () => {
    const wrapper = mount(
        <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <UserDetailCard
                username="u_sam"
                onBack={() => {}}
            />
        </MemoryRouter>
    );
    await flush(wrapper);
    return wrapper;
};

const clickTab = async (wrapper, name) => {
    await act(async () => {
        wrapper.find('[role="tab"]').filterWhere(tab => tab.text().startsWith(name))
            .simulate('click');
    });
    wrapper.update();
};

describe('admin user detail', () => {
    beforeEach(() => {
        jest.spyOn(api.admin, 'getUser').mockResolvedValue(user);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('shows who the account is at a glance', async () => {
        const wrapper = await render();
        const text = wrapper.text();
        expect(api.admin.getUser).toHaveBeenCalledWith('u_sam');
        expect(text).toContain('@sam');
        expect(text).toContain('u_sam');
        expect(text).toContain('Lite');
        expect(text).toContain('2 active sessions');
        expect(text).toContain('Under 18');
        expect(text).toContain('may be an adult who has not added one');
        expect(text).toContain('1 open');
        expect(wrapper.find('textarea').first()
            .prop('value')).toBe('Watch for spam.');
        wrapper.unmount();
    });

    test('lists reports about and by the account, and their comments and activity', async () => {
        const wrapper = await render();
        await clickTab(wrapper, 'Reports');
        expect(wrapper.text()).toContain('About @sam');
        expect(wrapper.text()).toContain('buy now');
        expect(wrapper.text()).toContain('Filed by @sam');
        expect(wrapper.text()).toContain('dismiss by @mist');
        await clickTab(wrapper, 'Comments');
        expect(wrapper.text()).toContain('check out my game');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'On project p9')
            .prop('href')).toContain('#comment-id-c1');
        await clickTab(wrapper, 'Activity');
        expect(wrapper.text()).toContain('Loved Racer');
        await clickTab(wrapper, 'Moderation');
        expect(wrapper.text()).toContain('spam in comments');
        wrapper.unmount();
    });

    test('saves the admin note', async () => {
        const save = jest.spyOn(api.admin, 'setUserNote').mockResolvedValue({ok: true});
        const wrapper = await render();
        await act(async () => {
            wrapper.find('textarea').first()
                .simulate('change', {target: {value: 'Second warning means suspension.'}});
        });
        wrapper.update();
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Save note')
                .simulate('click');
        });
        await flush(wrapper);
        expect(save).toHaveBeenCalledWith('sam', 'Second warning means suspension.');
        expect(wrapper.text()).toContain('Note saved.');
        wrapper.unmount();
    });
});

describe('admin links', () => {
    test('link to a user in the admin page', () => {
        expect(adminUserPath('Sam Smith')).toBe('/admin?section=users&user=Sam%20Smith');
    });

    test('work out where a comment was posted', () => {
        expect(commentLocation('project-123')).toEqual({kind: 'project', id: '123'});
        expect(commentLocation('profile-sam')).toEqual({kind: 'profile', id: 'sam'});
        expect(commentLocation('pull-123-4')).toEqual({kind: 'pull', id: '123', index: '4'});
        expect(commentLocation('roadmap-abc')).toEqual({kind: 'roadmap', id: 'abc'});
    });
});

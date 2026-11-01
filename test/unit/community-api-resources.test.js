import {describe, expect, test} from '@jest/globals';
import warpthemeApi from '../../src/lib/warptheme-api.js';
import account from '../../src/community/api/account.js';
import bounties from '../../src/community/api/bounties.js';
import comments from '../../src/community/api/comments.js';
import feedback from '../../src/community/api/feedback.js';
import games from '../../src/community/api/games.js';
import git from '../../src/community/api/git.js';
import news from '../../src/community/api/news.js';
import projects from '../../src/community/api/projects.js';
import roadmap from '../../src/community/api/roadmap.js';
import spaces from '../../src/community/api/spaces.js';
import stats from '../../src/community/api/stats.js';
import support from '../../src/community/api/support.js';
import users from '../../src/community/api/users.js';
import api from '../../src/community/api';

const spreadGroups = {
    account,
    bounties,
    comments,
    feedback,
    games,
    git,
    news,
    projects,
    roadmap,
    spaces,
    stats,
    support,
    users,
    warpthemeApi
};

describe('community api resources', () => {
    test('no two resource groups define the same method', () => {
        const owners = new Map();
        const clashes = [];
        for (const [group, methods] of Object.entries(spreadGroups)) {
            for (const name of Object.keys(methods)) {
                if (owners.has(name)) clashes.push(`${name}: ${owners.get(name)} and ${group}`);
                owners.set(name, group);
            }
        }
        expect(clashes).toEqual([]);
        expect(owners.has('admin') || owners.has('classroom') || owners.has('request')).toBe(false);
    });

    test('the composed api exposes every group method', () => {
        for (const methods of Object.values(spreadGroups)) {
            for (const [name, method] of Object.entries(methods)) expect(api[name]).toBe(method);
        }
        expect(typeof api.admin.reports).toBe('function');
        expect(typeof api.classroom.overview).toBe('function');
    });
});

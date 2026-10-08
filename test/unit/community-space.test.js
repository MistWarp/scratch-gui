import api from '../../src/community/api';
import {
    loadMissingProjects, normalizeSpace, spaceLoadMessage, toggleFollow
} from '../../src/community/pages/Space.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Space loading feedback', () => {
    test('only calls a confirmed 404 not found', () => {
        expect(spaceLoadMessage({status: 404})).toBe('Space not found.');
        expect(spaceLoadMessage({status: 503})).toBe('Could not load this space.');
        expect(spaceLoadMessage(new Error('offline'))).toBe('Could not load this space.');
    });

    test('normalizes optional API lists before rendering a space', () => {
        expect(normalizeSpace({_id: 'space'})).toMatchObject({
            projects: [],
            projectIds: [],
            followers: [],
            managers: [],
            judges: []
        });
    });
});

describe('Space follow and project loading', () => {
    test('following updates the button, count and follower list before the server answers', () => {
        const space = normalizeSpace({followers: ['ann'], followerCount: 1, following: false});
        const followed = toggleFollow(space, 'me', true);
        expect(followed).toMatchObject({following: true, followerCount: 2, followers: ['ann', 'me']});
        expect(toggleFollow(followed, 'me', false))
            .toMatchObject({following: false, followerCount: 1, followers: ['ann']});
    });

    test('projects missing from the response are fetched once and remembered', async () => {
        const getProject = jest.spyOn(api, 'getProject').mockImplementation(id => Promise.resolve({project: {id}}));
        const known = new Map();
        const space = {projectIds: ['a', 'b'], projects: [{id: 'a'}]};
        try {
            await expect(loadMissingProjects(space, known)).resolves.toMatchObject({projects: [{id: 'a'}, {id: 'b'}]});
            await expect(loadMissingProjects(space, known)).resolves.toMatchObject({projects: [{id: 'a'}, {id: 'b'}]});
            expect(getProject).toHaveBeenCalledTimes(1);
            expect(getProject).toHaveBeenCalledWith('b');
        } finally {
            getProject.mockRestore();
        }
    });

    test('ranked projects keep the server order when some are fetched separately', async () => {
        const getProject = jest.spyOn(api, 'getProject').mockImplementation(id => Promise.resolve({project: {id}}));
        const space = {projectIds: ['a', 'b', 'c', 'd'], projects: [{id: 'c'}, {id: 'a'}, {id: 'd'}]};
        try {
            await expect(loadMissingProjects(space, new Map())).resolves.toMatchObject({
                projects: [{id: 'c'}, {id: 'a'}, {id: 'd'}, {id: 'b'}]
            });
        } finally {
            getProject.mockRestore();
        }
    });
});

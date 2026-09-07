import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {useParams} from 'react-router-dom';
import api, {projectUrl} from '../../src/community/api.js';
import {useResolvedProjectId, projectBaseUrl} from '../../src/community/use-resolved-project-id.js';

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useParams: jest.fn()
    };
});

jest.mock('../../src/community/api.js', () => {
    const normalizeVanitySlug = slug => {
        if (typeof slug !== 'string') return '';
        const trimmed = slug.trim();
        if (!trimmed) return '';
        if (/^[A-Za-z0-9-]{3,40}$/.test(trimmed)) return trimmed;
        return '';
    };
    const projectUrl = (idOrProject, maybeSlug) => {
        let id = idOrProject;
        let slug = maybeSlug;
        if (idOrProject && typeof idOrProject === 'object') {
            id = idOrProject.id ?? idOrProject.projectId ?? idOrProject.project_id;
            slug = idOrProject.vanitySlug ?? idOrProject.slug ?? maybeSlug;
        }
        const vanity = normalizeVanitySlug(slug);
        if (vanity) return `/p/${encodeURIComponent(vanity)}`;
        return `/project/${id}`;
    };
    return {
        __esModule: true,
        default: {resolveVanity: jest.fn()},
        projectUrl
    };
});

const Probe = () => {
    const state = useResolvedProjectId();
    return <span>{JSON.stringify(state)}</span>;
};

const readState = wrapper => JSON.parse(wrapper.find('span').text());

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

describe('vanity project URLs', () => {
    beforeEach(() => {
        api.resolveVanity.mockReset();
    });

    test('projectUrl prefers the vanity form when a slug is available', () => {
        expect(projectUrl({id: 'abc123', vanitySlug: 'cool-thing'})).toBe('/p/cool-thing');
        expect(projectUrl('abc123')).toBe('/project/abc123');
        expect(projectUrl({id: 'abc123'})).toBe('/project/abc123');
        expect(projectUrl({id: 'abc123', vanitySlug: ''})).toBe('/project/abc123');
        expect(projectUrl({id: 'abc123', vanitySlug: 'ab'})).toBe('/project/abc123');
    });

    test('projectBaseUrl stays on the vanity form while loading', () => {
        expect(projectBaseUrl({project: {id: 'abc123', vanitySlug: 'cool-thing'}}))
            .toBe('/p/cool-thing');
        expect(projectBaseUrl({project: null, projectId: '', vanitySlug: 'cool-thing'}))
            .toBe('/p/cool-thing');
        expect(projectBaseUrl({project: null, projectId: 'abc123', vanitySlug: ''}))
            .toBe('/project/abc123');
    });

    test('plain project ids resolve without a vanity lookup', () => {
        useParams.mockReturnValue({id: 'project-1'});
        const wrapper = mount(<Probe />);
        expect(readState(wrapper)).toMatchObject({projectId: 'project-1', resolving: false});
        expect(api.resolveVanity).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('vanity slugs resolve to an id while keeping the slug', async () => {
        useParams.mockReturnValue({slug: 'cool-thing'});
        api.resolveVanity.mockResolvedValueOnce({id: 'project-1'});
        const wrapper = mount(<Probe />);
        expect(readState(wrapper)).toMatchObject({resolving: true, vanitySlug: 'cool-thing'});
        await flush(wrapper);
        expect(api.resolveVanity).toHaveBeenCalledWith('cool-thing');
        expect(readState(wrapper)).toMatchObject({
            projectId: 'project-1',
            vanitySlug: 'cool-thing',
            resolving: false
        });
        wrapper.unmount();
    });

    test('unknown slugs report a missing link', async () => {
        useParams.mockReturnValue({slug: 'missing'});
        api.resolveVanity.mockRejectedValueOnce(new Error('not found'));
        const wrapper = mount(<Probe />);
        await flush(wrapper);
        expect(readState(wrapper).resolveError).toContain('does not exist');
        wrapper.unmount();
    });

    test('a stale rejection does not hide the current lookup', async () => {
        let rejectOld;
        let resolveNew;
        const oldRequest = new Promise((_, reject) => {
            rejectOld = reject;
        });
        const newRequest = new Promise(resolve => {
            resolveNew = resolve;
        });
        // Prevent an unhandled rejection if the old request settles after the test.
        oldRequest.catch(() => {});
        useParams.mockReturnValue({slug: 'old'});
        api.resolveVanity.mockReturnValueOnce(oldRequest).mockReturnValueOnce(newRequest);
        const wrapper = mount(<Probe />);

        useParams.mockReturnValue({slug: 'new'});
        wrapper.setProps({});
        expect(readState(wrapper)).toMatchObject({resolving: true, vanitySlug: 'new'});

        await act(async () => {
            rejectOld(new Error('old failure'));
            await Promise.resolve();
        });
        wrapper.update();
        expect(readState(wrapper)).toMatchObject({resolving: true, vanitySlug: 'new'});

        await act(async () => {
            resolveNew({id: 'new-project'});
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(readState(wrapper)).toMatchObject({projectId: 'new-project', resolving: false});
        wrapper.unmount();
    });
});

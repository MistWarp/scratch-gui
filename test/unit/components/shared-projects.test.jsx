import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import {SharedProjectCard} from '../../../src/community/components/SharedProjects.jsx';

jest.mock('../../../src/community/api.js', () => ({
    __esModule: true,
    default: {request: jest.fn()},
    editorUrl: ({platformProject}) => `/editor#mw-${platformProject}`,
    projectUrl: idOrProject => {
        const project = idOrProject && typeof idOrProject === 'object' ? idOrProject : {id: idOrProject};
        if (project.vanitySlug) return `/p/${project.vanitySlug}`;
        return `/project/${project.id}`;
    }
}));
jest.mock('../../../src/community/components/Avatar.jsx', () => () => null);

const render = project => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <SharedProjectCard project={project} />
    </MemoryRouter>
);
const titleLink = card => card.find('h3 a');

describe('shared project cards', () => {
    const project = {id: 'p1', title: 'Team project', owner: 'Mist', myRole: 'editor', canSaveDirectly: true};

    test('sends people who can save straight to the editor', () => {
        const card = render(project);
        expect(card.find('article')).toHaveLength(1);
        expect(card.text()).toContain('Editor');
        expect(card.text()).toContain('Edit project');
        expect(titleLink(card).prop('href')).toBe('/editor#mw-p1');
        expect(card.text()).not.toContain('Your access:');
    });

    test('sends read-only teammates to the project page', () => {
        const card = render({...project, myRole: 'tester', canSaveDirectly: false});
        expect(card.text()).toContain('Tester');
        expect(card.text()).toContain('Open project');
        expect(titleLink(card).prop('href')).toBe('/project/p1');
    });

    test('prefers the vanity URL when the project has one', () => {
        const card = render({...project, myRole: 'tester', canSaveDirectly: false, vanitySlug: 'cool-thing'});
        expect(titleLink(card).prop('href')).toBe('/p/cool-thing');
    });

    test('uses a neutral label for an unfamiliar access level', () => {
        const card = render({...project, myRole: null});
        expect(card.text()).toContain('Shared access');
    });
});

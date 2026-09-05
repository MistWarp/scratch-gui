import React from 'react';
import {shallow} from 'enzyme';
import {SharedProjectCard} from '../../../src/community/components/SharedProjects.jsx';
import Button from '../../../src/community/components/ui/Button.jsx';

jest.mock('../../../src/community/api.js', () => ({
    __esModule: true,
    default: {request: jest.fn()},
    editorUrl: ({platformProject}) => `/editor#mw-${platformProject}`,
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../../src/community/components/UserLink.jsx', () => 'UserLink');

describe('shared project cards', () => {
    const project = {id: 'p1', title: 'Team project', owner: 'Mist', myRole: 'editor', canSaveDirectly: true};

    test('keeps editing access and the primary action inside the card', () => {
        const card = shallow(<SharedProjectCard project={project} />);
        expect(card.type()).toBe('article');
        expect(card.text()).toContain('Editor');
        expect(card.find(Button).props()).toEqual(expect.objectContaining({
            as: 'a', href: '/editor#mw-p1', variant: 'primary', 'aria-label': 'Edit Team project'
        }));
        expect(card.text()).not.toContain('Your access:');
    });

    test('gives read-only teammates an open action, not an edit action', () => {
        const card = shallow(<SharedProjectCard project={{...project, myRole: 'tester', canSaveDirectly: false}} />);
        expect(card.text()).toContain('Tester');
        expect(card.find(Button).props()).toEqual(expect.objectContaining({
            href: '/project/p1', variant: 'secondary', 'aria-label': 'Open Team project'
        }));
    });

    test('uses a neutral label for an unfamiliar access level', () => {
        const card = shallow(<SharedProjectCard project={{...project, myRole: null}} />);
        expect(card.text()).toContain('Shared access');
    });
});

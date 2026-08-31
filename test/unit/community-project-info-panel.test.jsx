import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount} from 'enzyme';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        updateProject: jest.fn().mockResolvedValue({project: {id: '123', tags: ['platformer', 'games']}})
    },
    projectUrl: id => `/project/${id}`
}));

import ProjectInfoPanel from '../../src/community/components/ProjectInfoPanel.jsx';
import api from '../../src/community/api';

describe('ProjectInfoPanel tabs', () => {
    const defaultProject = {
        id: '123',
        owner: 'creator',
        instructions: 'Test instructions',
        notes: 'Test notes'
    };

    test('shows About and Details tabs', () => {
        let wrapper;
        act(() => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <ProjectInfoPanel project={defaultProject} />
                </MemoryRouter>
            );
        });

        const tabButtons = wrapper.find('button[role="tab"]');
        expect(tabButtons.map(b => b.text())).toEqual(['About', 'Details']);
    });

    beforeEach(() => {
        api.updateProject.mockClear();
    });

    test('keeps manual tag editing without a suggestion action', async () => {
        let wrapper;
        const onSaved = jest.fn();
        act(() => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <ProjectInfoPanel
                        project={{
                            ...defaultProject,
                            title: 'A tiny platformer game',
                            tags: [],
                            gitHead: 'abc123456',
                            isOwner: true
                        }}
                        onSaved={onSaved}
                    />
                </MemoryRouter>
            );
        });

        act(() => wrapper.find('button[role="tab"]').at(1).props().onClick());
        wrapper.update();
        act(() => wrapper.find('button').filterWhere(button => button.text() === 'Edit details').props().onClick());
        wrapper.update();

        expect(wrapper.find('button').filterWhere(button => button.text() === 'Suggest tags')).toHaveLength(0);
        expect(wrapper.text()).toContain('Up to 10 tags.');
        act(() => wrapper.find('input[placeholder="platformer game pixel-art"]').props().onChange({
            target: {value: 'platformer game'}
        }));
        wrapper.update();

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Save').props().onClick();
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.updateProject).toHaveBeenCalledWith('123', expect.objectContaining({
            tags: ['platformer', 'game']
        }));
        expect(onSaved).toHaveBeenCalled();
    });
});

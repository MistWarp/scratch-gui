import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount} from 'enzyme';
import {Tags} from 'lucide-react';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        updateProject: jest.fn().mockResolvedValue({project: {id: '123', tags: ['platformer', 'games']}})
    },
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/community/suggest-project-tags.js', () => ({
    loadLatestFractchSource: jest.fn().mockResolvedValue({
        source: '// File: Stage.fractch\nproject source',
        commitName: 'Add jumping',
        commitSha: 'abc123456'
    })
}));
jest.mock('../../src/lib/sable/smart-features.js', () => ({
    suggestProjectTags: jest.fn().mockResolvedValue({
        tags: ['platformer', 'games'],
        charged: 0.04,
        balance: 9.96
    })
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

    test('shows the source commit and SC cost before accepting and saving suggested tags', async () => {
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

        const suggestButton = wrapper.find('button').filterWhere(button => button.text() === 'Suggest tags');
        expect(suggestButton.find(Tags)).toHaveLength(1);
        await act(async () => {
            suggestButton.props().onClick();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Add jumping');
        expect(wrapper.text()).toContain('abc1234');
        expect(wrapper.text()).toContain('This request cost 0.04 SC.');
        expect(wrapper.text()).toContain('#platformer');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Accept')).props().onClick();
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.updateProject).toHaveBeenCalledWith('123', expect.objectContaining({
            tags: ['platformer', 'games']
        }));
        expect(onSaved).toHaveBeenCalled();
    });

    test('cancels the full edit without saving suggested tags', async () => {
        let wrapper;
        act(() => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <ProjectInfoPanel
                        project={{...defaultProject, title: 'Game', tags: [], gitHead: 'abc123456', isOwner: true}}
                        onSaved={jest.fn()}
                    />
                </MemoryRouter>
            );
        });

        act(() => wrapper.find('button[role="tab"]').at(1).props().onClick());
        wrapper.update();
        act(() => wrapper.find('button').filterWhere(button => button.text() === 'Edit details').props().onClick());
        wrapper.update();
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Suggest tags').props().onClick();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        const cancel = wrapper.find('button').filterWhere(button => (
            button.text().includes('Cancel') && !button.prop('disabled')
        ));
        expect(cancel).toHaveLength(1);
        act(() => cancel.props().onClick());
        wrapper.update();
        expect(api.updateProject).not.toHaveBeenCalled();
        expect(wrapper.find('input[placeholder="platformer game pixel-art"]')).toHaveLength(0);
    });
});

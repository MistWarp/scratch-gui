import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount} from 'enzyme';

import ProjectInfoPanel from '../../src/community/components/ProjectInfoPanel.jsx';

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
});

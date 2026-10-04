import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import ProjectCard from '../../src/community/components/ProjectCard.jsx';

jest.mock('../../src/community/components/GroupTag.jsx', () => () => null);
jest.mock('../../src/community/components/ProjectThumbnail.jsx', () => () => null);

describe('ProjectCard', () => {
    test('names each stat for screen readers', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ProjectCard project={{id: 'p1', title: 'Game', owner: 'sam', loveCount: 1, views: 340}} />
            </MemoryRouter>
        );
        expect(wrapper.text()).toContain('1 love');
        expect(wrapper.text()).toContain('340 views');
        wrapper.unmount();
    });
});

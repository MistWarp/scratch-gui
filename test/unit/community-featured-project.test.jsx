import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api.js';
import FeaturedProject from '../../src/community/components/FeaturedProject.jsx';

const project = {
    id: 'featured-1',
    title: 'Featured game',
    owner: 'Sophie',
    thumbUrl: '/thumbnail.png'
};

const Harness = () => (
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <FeaturedProject project={project} />
    </MemoryRouter>
);

describe('FeaturedProject', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('does not load or mount the project player until Play is clicked', async () => {
        let resolveProject;
        const getProject = jest.spyOn(api, 'getProject').mockReturnValue(new Promise(resolve => {
            resolveProject = resolve;
        }));
        const wrapper = mount(<Harness />);

        expect(getProject).not.toHaveBeenCalled();
        expect(wrapper.find('iframe')).toHaveLength(0);
        expect(wrapper.find('button').text()).toContain('Play project');

        act(() => {
            wrapper.find('button').simulate('click');
        });

        expect(getProject).toHaveBeenCalledTimes(1);
        expect(getProject).toHaveBeenCalledWith('featured-1');
        expect(wrapper.find('iframe')).toHaveLength(0);

        await act(async () => {
            resolveProject({
                project: {
                    ...project,
                    hasContent: true,
                    projectJsonUrl: 'https://projects.example/featured-1.sb3',
                    assetsBase: 'https://assets.example/'
                }
            });
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('iframe')).toHaveLength(1);
        wrapper.unmount();
    });
});

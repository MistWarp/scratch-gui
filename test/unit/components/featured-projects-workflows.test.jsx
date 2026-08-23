import React from 'react';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import {FeaturedProjects} from '../../../src/components/tw-featured-projects/featured-projects.jsx';

describe('featured projects controls', () => {
    test('uses a native button to reveal projects', () => {
        const wrapper = shallowWithIntl(
            <FeaturedProjects
                projectId={null}
                setProjectId={() => {}}
                studio="123"
            />
        );
        const opener = wrapper.find('button');

        expect(opener.prop('type')).toBe('button');
        opener.simulate('click');
        expect(wrapper.state('opened')).toBe(true);
    });
});

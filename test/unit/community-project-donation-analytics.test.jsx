import React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {mount} from 'enzyme';

import ProjectDonationAnalytics from '../../src/community/components/ProjectDonationAnalytics.jsx';

describe('project donation analytics', () => {
    test('shows the top donor and links recent donations to their comments', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ProjectDonationAnalytics
                    projectId="project-1"
                    donations={{
                        total: 31,
                        count: 3,
                        uniqueDonors: 2,
                        donors: [
                            {username: 'Alex', amount: 25, count: 2},
                            {username: 'Sam', amount: 6, count: 1}
                        ],
                        recent: [{commentId: 'comment-1', username: 'Alex', amount: 15, at: 1000}]
                    }}
                />
            </MemoryRouter>
        );

        expect(wrapper.text()).toContain('31 credits');
        expect(wrapper.text()).toContain('Alex25 credits2 donations');
        expect(wrapper.find('a[href="/project/project-1#comment-id-comment-1"]')).toHaveLength(1);
        wrapper.unmount();
    });

    test('shows an empty state before the first donation', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ProjectDonationAnalytics projectId="project-1" />
            </MemoryRouter>
        );

        expect(wrapper.text()).toContain('No one has donated to this project yet.');
        wrapper.unmount();
    });
});

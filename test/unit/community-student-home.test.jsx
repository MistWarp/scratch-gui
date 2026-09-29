/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import StudentHome, {AssignmentCard} from '../../src/community/components/classroom/StudentHome.jsx';
import api from '../../src/community/api.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        classroom: {
            startAssignment: jest.fn(),
            turnIn: jest.fn(),
            unsubmit: jest.fn()
        }
    },
    editorUrl: ({platformProject}) => `/editor#mw-${platformProject}`,
    projectUrl: project => `/project/${project.id}`
}));
jest.mock('../../src/community/locale', () => ({getCommunityLocale: () => 'en', formatCommunityMessage: key => key}));
jest.mock('../../src/community/i18n.jsx', () => {
    // eslint-disable-next-line global-require
    const IntlMessageFormat = require('intl-messageformat').default;
    return {
        useCommunityIntl: () => ({
            t: key => key,
            text: (key, values) => (values ? new IntlMessageFormat(key, 'en').format(values) : key)
        })
    };
});

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

const renderCard = (assignment, onChange = jest.fn()) => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <AssignmentCard
            assignment={assignment}
            onChange={onChange}
        />
    </MemoryRouter>
);

const buttonNames = wrapper => wrapper.find('button').map(node => node.text().trim())
    .filter(Boolean);
const linkNames = wrapper => wrapper.find('a').map(node => node.text().trim())
    .filter(Boolean);

describe('student assignment actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('an assignment that has not been started offers Start and opens the project', async () => {
        const originalLocation = window.location;
        delete window.location;
        window.location = {href: ''};
        api.classroom.startAssignment
            .mockResolvedValue({submission: {state: 'started', projectId: 'p1'}, projectId: 'p1'});
        const wrapper = renderCard({
            id: 'a1', title: 'Maze game', dueAt: Date.now() + 86400000, instructions: 'Build a maze.'
        });
        expect(wrapper.text()).toContain('Not started');
        expect(buttonNames(wrapper)).toEqual(['Start']);
        wrapper.find('button').simulate('click');
        await flush(wrapper);
        expect(api.classroom.startAssignment).toHaveBeenCalledWith('a1');
        expect(window.location.href).toBe('/editor#mw-p1');
        window.location = originalLocation;
        wrapper.unmount();
    });

    test('work in progress can be opened or turned in', async () => {
        const onChange = jest.fn();
        api.classroom.turnIn.mockResolvedValue({submission: {state: 'turned_in', projectId: 'p1', late: false}});
        const wrapper = renderCard({
            id: 'a1', title: 'Maze game', dueAt: 0, submission: {state: 'started', projectId: 'p1'}
        }, onChange);
        expect(wrapper.text()).toContain('In progress');
        expect(wrapper.text()).toContain('There is no due date.');
        expect(linkNames(wrapper)).toEqual(['Open']);
        expect(wrapper.find('a').prop('href')).toBe('/editor#mw-p1');
        expect(buttonNames(wrapper)).toEqual(['Turn in']);
        wrapper.find('button').simulate('click');
        await flush(wrapper);
        expect(api.classroom.turnIn).toHaveBeenCalledWith('a1');
        expect(onChange).toHaveBeenCalledWith({state: 'turned_in', projectId: 'p1', late: false});
        wrapper.unmount();
    });

    test('turned in work can be taken back and late work is labelled', async () => {
        const onChange = jest.fn();
        api.classroom.unsubmit.mockResolvedValue({submission: {state: 'started', projectId: 'p1'}});
        const wrapper = renderCard({
            id: 'a1',
            title: 'Animate your name',
            dueAt: Date.now() - 86400000,
            submission: {state: 'turned_in', late: true, projectId: 'p1'}
        }, onChange);
        expect(wrapper.text()).toContain('Turned in late');
        expect(buttonNames(wrapper)).toEqual(['Take back']);
        wrapper.find('button').simulate('click');
        await flush(wrapper);
        expect(api.classroom.unsubmit).toHaveBeenCalledWith('a1');
        expect(onChange).toHaveBeenCalledWith({state: 'started', projectId: 'p1'});
        wrapper.unmount();
    });

    test('returned work shows feedback and grade and can be turned in again', () => {
        const wrapper = renderCard({
            id: 'a1',
            title: 'Animate your name',
            dueAt: 0,
            submission: {state: 'returned', projectId: 'p1', feedback: 'Lovely use of glide blocks.', grade: 'B+'}
        });
        expect(wrapper.text()).toContain('Returned');
        expect(wrapper.text()).toContain('Lovely use of glide blocks.');
        expect(wrapper.text()).toContain('Grade: B+');
        expect(buttonNames(wrapper)).toEqual(['Turn in again']);
        wrapper.unmount();
    });

    test('a failed action shows the server message and keeps the buttons', async () => {
        api.classroom.turnIn.mockRejectedValue(new Error('This assignment is closed.'));
        const wrapper = renderCard({
            id: 'a1', title: 'Maze game', dueAt: 0, submission: {state: 'started', projectId: 'p1'}
        });
        wrapper.find('button').simulate('click');
        await flush(wrapper);
        expect(wrapper.find('[role="alert"]').text()).toContain('This assignment is closed.');
        expect(buttonNames(wrapper)).toEqual(['Turn in']);
        wrapper.unmount();
    });

    test('the student home greets the student and lists projects and storage', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <StudentHome
                    data={{
                        student: {displayName: 'Ada Okafor', username: 'adaokafor~yumrk'},
                        class: {name: 'Year 7 Computing', teacher: 'Mist'},
                        assignments: [],
                        projects: [{id: 'p1', title: 'Space dodger', edited: Date.now() - 60000}],
                        storage: {used: 95830, limit: 26843258111}
                    }}
                    onReload={() => {}}
                />
            </MemoryRouter>
        );
        const text = wrapper.text();
        expect(text).toContain('Hi, Ada Okafor!');
        expect(text).toContain('You are in Year 7 Computing. Your teacher is Mist.');
        expect(text).toContain('No assignments yet');
        expect(text).toContain('Space dodger');
        expect(text).toContain('94 KB of 25.0 GB');
        wrapper.unmount();
    });
});

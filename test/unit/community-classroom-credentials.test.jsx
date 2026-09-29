/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {mount} from 'enzyme';

import CredentialsResult from '../../src/community/components/classroom/CredentialsResult.jsx';

jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({
        t: key => key,
        text: (key, values) => (values ? key.replace('{value1}', String(values.value1)) : key)
    })
}));

const passwordStudents = [
    {id: 's1', displayName: 'Ada Okafor', username: 'adaokafor~yumrk', credentials: {password: 'violet-robin-75'}},
    {id: 's2', displayName: 'Ben Carter', username: 'bencarter~yumrk', credentials: {password: 'frost-jolly-27'}}
];

const pictureStudents = [
    {id: 's3', displayName: 'Mia', username: 'mia~jfsnb', credentials: {pictures: ['snail', 'rocket', 'tree']}}
];

describe('classroom login credentials', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('lists passwords and prints one card per student', () => {
        const onDone = jest.fn();
        const wrapper = mount(
            <CredentialsResult
                classTitle="Year 7 Computing"
                code="FB2HV829"
                loginMode="password"
                students={passwordStudents}
                onDone={onDone}
            />
        );
        const text = wrapper.text();
        expect(text).toContain('Passwords are not shown again.');
        expect(text).toContain('violet-robin-75');
        expect(text).toContain('frost-jolly-27');
        const cards = document.body.querySelectorAll('article');
        expect(cards).toHaveLength(2);
        expect(cards[0].textContent).toContain('Year 7 Computing');
        expect(cards[0].textContent).toContain('mistwarp.org/classroom/join/FB2HV829');
        expect(cards[0].textContent).toContain('FB2HV829');
        expect(cards[0].textContent).toContain('violet-robin-75');
        expect(cards[0].textContent).toContain('type this password');
        wrapper.find('button').filterWhere(node => node.text() === 'Done')
            .simulate('click');
        expect(onDone).toHaveBeenCalled();
        wrapper.unmount();
        expect(document.body.querySelectorAll('article')).toHaveLength(0);
    });

    test('shows the three pictures in order for picture classes', () => {
        const print = jest.spyOn(window, 'print').mockImplementation(() => {});
        const wrapper = mount(
            <CredentialsResult
                classTitle="Year 3 Explorers"
                code="8GXEVEFY"
                loginMode="picture"
                students={pictureStudents}
                onDone={() => {}}
            />
        );
        expect(wrapper.text()).toContain('Picture sequences are not shown again.');
        const icons = wrapper.find('li [role="img"]').map(node => node.prop('aria-label'));
        expect(icons).toEqual(['Snail', 'Rocket', 'Tree']);
        const card = document.body.querySelector('article');
        expect(card.textContent).toContain('tap these three pictures in order');
        expect(Array.from(card.querySelectorAll('[role="img"]')).map(node => node.getAttribute('aria-label')))
            .toEqual(['Snail', 'Rocket', 'Tree']);
        wrapper.find('button').filterWhere(node => node.text() === 'Print login cards')
            .simulate('click');
        expect(print).toHaveBeenCalled();
        print.mockRestore();
        wrapper.unmount();
    });
});

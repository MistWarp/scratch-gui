import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import TransactionHistory from '../../src/community/components/TransactionHistory.jsx';

const HOUR = 60 * 60 * 1000;

const transaction = (index, fields = {}) => ({
    id: `t${index}`,
    incoming: false,
    amount: 0.25,
    user: `user${index}`,
    note: 'Daily credit',
    time: Date.now() - (index * HOUR),
    ...fields
});

const render = transactions => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <TransactionHistory transactions={transactions} />
    </MemoryRouter>
);

const dayHeadings = wrapper => wrapper.find('h3').map(heading => heading.text());

describe('TransactionHistory', () => {
    test('groups transactions under their day with the day\'s net', () => {
        const wrapper = render([
            transaction(0, {incoming: true, amount: 3, note: 'Daily claim', user: 'rotur', time: Date.now()}),
            transaction(1, {time: Date.now() - 1000})
        ]);
        const headings = dayHeadings(wrapper);
        expect(headings).toHaveLength(1);
        expect(headings[0]).toContain('Today');
        expect(headings[0]).toContain('+2.75');
        expect(wrapper.find('li')).toHaveLength(2);
        expect(wrapper.text()).toContain('@user1');
        expect(wrapper.text()).toContain('−0.25');
        wrapper.unmount();
    });

    test('shows 25 at a time and pages through the rest', () => {
        const many = Array.from({length: 30}, (_, index) => transaction(index, {time: Date.now() - (index * 60000)}));
        const wrapper = render(many);
        expect(wrapper.find('li')).toHaveLength(25);
        expect(wrapper.text()).toContain('Page 1 of 2');
        act(() => {
            wrapper.find('button[aria-label="Next page"]').simulate('click');
        });
        wrapper.update();
        expect(wrapper.find('li')).toHaveLength(5);
        expect(wrapper.text()).toContain('Page 2 of 2');
        wrapper.unmount();
    });

    test('searches notes and usernames', () => {
        const wrapper = render([
            transaction(1, {note: 'Meowing Simulator', user: 'LucasMcCheese'}),
            transaction(2)
        ]);
        act(() => {
            wrapper.find('input[type="search"]').simulate('change', {target: {value: 'meow'}});
        });
        wrapper.update();
        expect(wrapper.find('li')).toHaveLength(1);
        expect(wrapper.text()).toContain('Meowing Simulator');
        act(() => {
            wrapper.find('input[type="search"]').simulate('change', {target: {value: 'nobody here'}});
        });
        wrapper.update();
        expect(wrapper.text()).toContain('No matching transactions');
        wrapper.unmount();
    });
});

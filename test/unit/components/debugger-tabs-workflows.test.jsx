import React from 'react';
import {shallow} from 'enzyme';

import {Debugger} from '../../../src/components/tw-debugger/debugger.jsx';

const makeController = () => ({
    engine: {
        isPaused: () => false,
        setPaused: jest.fn(),
        singleStep: jest.fn()
    },
    events: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    },
    setVisible: jest.fn(),
    tabs: [
        {id: 'logs', label: 'Logs', content: document.createElement('div'), buttons: []},
        {id: 'threads', label: 'Threads', content: document.createElement('div'), buttons: []},
        {id: 'memory', label: 'Memory', content: document.createElement('div'), buttons: []}
    ]
});

describe('debugger tabs', () => {
    test('uses arrow keys to select and focus the next tab', () => {
        const wrapper = shallow(<Debugger controller={makeController()} onClose={() => {}} />);
        const instance = wrapper.instance();
        const tabs = [{focus: jest.fn()}, {focus: jest.fn()}, {focus: jest.fn()}];
        const preventDefault = jest.fn();

        instance.handleTabKeyDown({
            key: 'ArrowRight',
            preventDefault,
            currentTarget: {
                dataset: {tabId: 'logs'},
                parentElement: {querySelectorAll: () => tabs}
            }
        });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(instance.state.activeTabId).toBe('threads');
        expect(tabs[1].focus).toHaveBeenCalledTimes(1);
        wrapper.update();
        expect(wrapper.find('[role="tab"]').map(tab => tab.prop('tabIndex'))).toEqual([-1, 0, -1]);
    });
});

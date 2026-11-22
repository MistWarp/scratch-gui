import React from 'react';
import {mount} from 'enzyme';

import MergeConflicts from '../../src/community/components/MergeConflicts.jsx';

const props = extra => ({
    title: 'Resolve merge conflicts',
    conflicts: [{path: 'Cat/main.fractch', content: '<<<<<<< target'}],
    binaryConflicts: [{path: 'Cat/a.svg', choice: 'target'}],
    keepLabel: 'Keep current project',
    useLabel: 'Use pull request',
    submitLabel: 'Save resolutions and merge',
    onChoose: jest.fn(),
    onSubmit: jest.fn(),
    onTextChange: jest.fn(),
    ...extra
});

describe('merge conflicts', () => {
    test('moves focus to the conflicts when asked', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const wrapper = mount(<MergeConflicts {...props({focusOnMount: true})} />, {attachTo: host});
        expect(document.activeElement).toBe(wrapper.find('section').getDOMNode());
        wrapper.unmount();
        host.remove();
    });

    test('shows the error between the conflicts and the submit button', () => {
        const wrapper = mount(<MergeConflicts {...props({error: 'Choose a version for Cat/a.svg.'})} />);
        const html = wrapper.html();
        const errorAt = html.indexOf('Choose a version for Cat/a.svg.');
        expect(errorAt).toBeGreaterThan(html.indexOf('Use pull request'));
        expect(errorAt).toBeLessThan(html.indexOf('Save resolutions and merge'));
    });

    test('locks every choice while saving and marks the chosen version', () => {
        const wrapper = mount(<MergeConflicts {...props({busy: true})} />);
        expect(wrapper.find('textarea').prop('disabled')).toBe(true);
        const choices = wrapper.find('button[aria-pressed]');
        expect(choices.everyWhere(choice => choice.prop('disabled') === true)).toBe(true);
        expect(choices.at(0).prop('aria-pressed')).toBe(true);
        expect(choices.at(1).prop('aria-pressed')).toBe(false);
    });
});

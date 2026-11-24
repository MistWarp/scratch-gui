import React from 'react';
import {mount} from 'enzyme';

import MergeConflicts from '../../src/community/components/MergeConflicts.jsx';

const props = extra => ({
    title: 'Resolve merge conflicts',
    conflicts: [{path: 'Cat/main.fractch', content: '<<<<<<<<< target\nmove 5\n=========\nmove 20\n>>>>>>>>> pull request'}],
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

    test('uses the heading level it is given and h3 otherwise', () => {
        expect(mount(<MergeConflicts {...props()} />).find('section h3')
            .exists()).toBe(true);
        const top = mount(<MergeConflicts {...props({headingLevel: 'h2'})} />);
        expect(top.find('section h2').exists()).toBe(true);
        expect(top.find('section h3').exists()).toBe(false);
    });

    test('names each asset choice group by its path', () => {
        const wrapper = mount(<MergeConflicts
            {...props({binaryConflicts: [{path: 'Cat/a.svg', choice: ''}, {path: 'Stage/b.wav', choice: ''}]})}
        />);
        const groups = wrapper.find('[role="group"]').hostNodes();
        expect(groups).toHaveLength(2);
        const names = groups.map(group => wrapper.find(`#${group.prop('aria-labelledby')}`).hostNodes()
            .text());
        expect(names).toEqual(['Cat/a.svg', 'Stage/b.wav']);
    });
});

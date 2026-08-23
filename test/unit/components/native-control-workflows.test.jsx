import React from 'react';
import {shallow} from 'enzyme';

import CloseButton from '../../../src/components/close-button/close-button';
import DeleteButton from '../../../src/components/delete-button/delete-button';
import Question from '../../../src/components/question/question.jsx';
import CloudServerButton from '../../../src/components/tw-cloud-variable-badge/cloud-server-button.jsx';
import {UsernameModalComponent} from '../../../src/components/tw-username-modal/username-modal.jsx';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

describe('native control workflows', () => {
    test('close control is a non-submitting button', () => {
        const control = shallow(<CloseButton onClick={() => {}} />);

        expect(control.type()).toBe('button');
        expect(control.prop('type')).toBe('button');
        expect(control.prop('aria-label')).toBe('Close');
    });

    test('back control has the correct action label', () => {
        const control = shallow(<CloseButton buttonType="back" onClick={() => {}} />);

        expect(control.prop('aria-label')).toBe('Back');
    });

    test('delete control passes disabled state to the native button', () => {
        const control = shallow(<DeleteButton disabled onClick={() => {}} />);

        expect(control.type()).toBe('button');
        expect(control.prop('type')).toBe('button');
        expect(control.prop('disabled')).toBe(true);
    });

    test('cloud server choices are non-submitting pressed buttons', () => {
        const control = shallow(
            <CloudServerButton
                cloudHost="wss://example.com"
                name="Example"
                selected
                onClick={() => {}}
            />
        );

        expect(control.prop('type')).toBe('button');
        expect(control.prop('aria-pressed')).toBe(true);
    });

    test('username reset link is a real button', () => {
        const control = shallowWithIntl(
            <UsernameModalComponent
                mustChangeUsername
                value="name"
                valueValid
                onCancel={() => {}}
                onChange={() => {}}
                onFocus={() => {}}
                onKeyPress={() => {}}
                onOk={() => {}}
                onReset={() => {}}
            />
        );
        const resetControl = control.find('button').first();

        expect(resetControl.prop('type')).toBe('button');
    });

    test('question submit control cannot submit an enclosing form', () => {
        const control = shallow(
            <Question
                answer=""
                onChange={() => {}}
                onClick={() => {}}
                onKeyPress={() => {}}
                question="Name?"
            />
        ).find('button');

        expect(control.prop('type')).toBe('button');
        expect(control.prop('title')).toBe('Submit answer');
    });
});

import React from 'react';
import {mount} from 'enzyme';
import FramePrompt from '../../../src/components/account-frame/frame-prompt.jsx';

let observerCallback = null;

beforeEach(() => {
    jest.useFakeTimers();
    observerCallback = null;
    global.IntersectionObserver = class {
        constructor (callback) {
            observerCallback = callback;
        }
        observe () {}
        disconnect () {}
    };
});

afterEach(() => {
    jest.useRealTimers();
    delete global.IntersectionObserver;
});

const setVisible = (wrapper, isVisible, intersectionRatio = 1) => {
    observerCallback([{isVisible, intersectionRatio}]);
    wrapper.update();
};

const consent = props => mount(<FramePrompt
    type="consent"
    data={{scopes: ['blocked:manage'], name: 'Game', username: 'mist'}}
    mode="inline"
    onAnswer={jest.fn()}
    {...props}
/>);

const click = (wrapper, label) => wrapper.find('button').filterWhere(button => button.text() === label)
    .simulate('click');

test('approval waits for the delay and for the frame to be fully visible', () => {
    const onAnswer = jest.fn();
    const wrapper = consent({onAnswer});
    click(wrapper, 'Connect');
    setVisible(wrapper, true);
    click(wrapper, 'Connect');
    expect(onAnswer).not.toHaveBeenCalled();
    jest.advanceTimersByTime(800);
    wrapper.update();
    setVisible(wrapper, true, 0.5);
    click(wrapper, 'Connect');
    expect(onAnswer).not.toHaveBeenCalled();
    setVisible(wrapper, true, 1);
    jest.advanceTimersByTime(800);
    wrapper.update();
    click(wrapper, 'Connect');
    expect(onAnswer).toHaveBeenCalledWith(true);
});

test('becoming visible again restarts the delay', () => {
    const onAnswer = jest.fn();
    const wrapper = consent({onAnswer});
    setVisible(wrapper, true);
    jest.advanceTimersByTime(800);
    setVisible(wrapper, false);
    setVisible(wrapper, true);
    wrapper.update();
    click(wrapper, 'Connect');
    expect(onAnswer).not.toHaveBeenCalled();
    jest.advanceTimersByTime(800);
    wrapper.update();
    click(wrapper, 'Connect');
    expect(onAnswer).toHaveBeenCalledWith(true);
});

test('saying no is always possible', () => {
    const onAnswer = jest.fn();
    const wrapper = consent({onAnswer});
    wrapper.find('div[role="dialog"]').simulate('keydown', {key: 'Escape'});
    expect(onAnswer).toHaveBeenCalledWith(false);
});

test('without a visibility check the frame only offers a review window', () => {
    const onReview = jest.fn();
    const onAnswer = jest.fn();
    const wrapper = mount(<FramePrompt
        type="consent"
        data={{scopes: ['blocked:manage'], name: 'Game'}}
        mode="review"
        onAnswer={onAnswer}
        onReview={onReview}
    />);
    expect(wrapper.find('button').map(button => button.text())).toEqual(['Not now', 'Review in a MistWarp window']);
    click(wrapper, 'Review in a MistWarp window');
    expect(onReview).toHaveBeenCalled();
    click(wrapper, 'Not now');
    expect(onAnswer).toHaveBeenCalledWith(false);
});

test('a MistWarp window can approve after the delay', () => {
    const onAnswer = jest.fn();
    const wrapper = mount(<FramePrompt
        type="confirm"
        data={{label: 'claim gift code A'}}
        mode="window"
        onAnswer={onAnswer}
    />);
    click(wrapper, 'Allow once');
    expect(onAnswer).not.toHaveBeenCalled();
    jest.advanceTimersByTime(800);
    wrapper.update();
    click(wrapper, 'Allow once');
    expect(onAnswer).toHaveBeenCalledWith(true);
});

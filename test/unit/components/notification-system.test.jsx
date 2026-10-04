import React from 'react';
import {act} from 'react-dom/test-utils';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import Notification from '../../../src/lib/notification-system.jsx';
import Notifications from '../../../src/components/notifications/notifications.jsx';
import notificationManager from '../../../src/lib/notification-manager.js';

const mountNotification = props => mountWithIntl(
    <Notification
        id="notification-test"
        message="Saved"
        type="info"
        duration={4000}
        onDismiss={jest.fn()}
        {...props}
    />
);

describe('Notification', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        notificationManager.dismissAll();
        jest.useRealTimers();
    });

    test('is a live region with a labelled close button; errors interrupt', () => {
        const info = mountNotification();
        expect(info.find('[role="status"]').text()).toContain('Saved');
        expect(info.find('button[aria-label="Dismiss notification"]').exists()).toBe(true);
        info.unmount();

        const error = mountNotification({type: 'error'});
        expect(error.find('[role="alert"]').exists()).toBe(true);
        error.unmount();
    });

    test('the close button and Escape dismiss it after it fades out', () => {
        const onDismiss = jest.fn();
        const wrapper = mountNotification({onDismiss, duration: 0});
        wrapper.find('button[aria-label="Dismiss notification"]').simulate('click');
        expect(onDismiss).not.toHaveBeenCalled();
        act(() => jest.advanceTimersByTime(300));
        expect(onDismiss).toHaveBeenCalledWith('notification-test');
        wrapper.unmount();

        const onEscape = jest.fn();
        const escaped = mountNotification({onDismiss: onEscape, duration: 0});
        escaped.find('[role="status"]').simulate('keydown', {key: 'Escape'});
        act(() => jest.advanceTimersByTime(300));
        expect(onEscape).toHaveBeenCalledWith('notification-test');
        escaped.unmount();
    });

    test('hovering or focusing it pauses the timeout', () => {
        const onDismiss = jest.fn();
        const wrapper = mountNotification({onDismiss, duration: 1000});
        const root = () => wrapper.find('[role="status"]');

        act(() => jest.advanceTimersByTime(600));
        root().simulate('mouseenter');
        act(() => jest.advanceTimersByTime(5000));
        expect(onDismiss).not.toHaveBeenCalled();

        root().simulate('focus');
        root().simulate('mouseleave');
        act(() => jest.advanceTimersByTime(5000));
        expect(onDismiss).not.toHaveBeenCalled();

        root().simulate('blur', {relatedTarget: null});
        act(() => jest.advanceTimersByTime(399));
        expect(onDismiss).not.toHaveBeenCalled();
        act(() => jest.advanceTimersByTime(1 + 300));
        expect(onDismiss).toHaveBeenCalledWith('notification-test');
        wrapper.unmount();
    });

    test('actions run and then dismiss it, and the list passes manager actions through', () => {
        const onClick = jest.fn();
        const onDismiss = jest.fn();
        const wrapper = mountNotification({onDismiss, duration: 0, actions: [{label: 'Let them in', onClick}]});
        wrapper.find('button')
            .filterWhere(button => button.text() === 'Let them in')
            .simulate('click');
        expect(onClick).toHaveBeenCalled();
        act(() => jest.advanceTimersByTime(300));
        expect(onDismiss).toHaveBeenCalled();
        wrapper.unmount();

        notificationManager.info('Bob wants to join', 0, {actions: [{label: 'Open', onClick}]});
        const list = mountWithIntl(
            <Notifications
                notifications={notificationManager.notifications}
                onDismiss={jest.fn()}
            />
        );
        expect(list.find('button').filterWhere(button => button.text() === 'Open')
            .exists()).toBe(true);
        list.unmount();
    });

    test('the manager leaves dismissal timing to the notification, so pausing works', () => {
        const id = notificationManager.info('Saved', 1000);
        const onDismiss = notificationManager.dismiss.bind(notificationManager);
        const wrapper = mountNotification({id, duration: 1000, onDismiss});
        wrapper.find('[role="status"]').simulate('mouseenter');
        act(() => jest.advanceTimersByTime(5000));
        expect(notificationManager.notifications.map(item => item.id)).toContain(id);
        wrapper.find('[role="status"]').simulate('mouseleave');
        act(() => jest.advanceTimersByTime(1300));
        expect(notificationManager.notifications.map(item => item.id)).not.toContain(id);
        wrapper.unmount();
    });
});

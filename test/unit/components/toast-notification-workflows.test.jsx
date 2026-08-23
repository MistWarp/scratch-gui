import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {ToastNotificationComponent} from '../../../src/components/toast-notification/toast-notification';

describe('toast notification timing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('an identical new notification gets a fresh timeout', () => {
        const onClose = jest.fn();
        const props = {
            intl: {
                formatDate: jest.fn(),
                formatHTMLMessage: jest.fn(),
                formatMessage: message => message.defaultMessage,
                formatNumber: jest.fn(),
                formatPlural: jest.fn(),
                formatRelative: jest.fn(),
                formatTime: jest.fn(),
                now: jest.fn()
            },
            message: 'Project autosaved.',
            onClose,
            sequence: 1,
            type: 'success',
            visible: true
        };
        let notification;
        act(() => {
            notification = renderer.create(<ToastNotificationComponent {...props} />);
        });

        act(() => jest.advanceTimersByTime(2000));
        act(() => {
            notification.update(<ToastNotificationComponent
                {...props}
                sequence={2}
            />);
        });
        act(() => jest.advanceTimersByTime(1000));
        expect(onClose).not.toHaveBeenCalled();

        act(() => jest.advanceTimersByTime(2000));
        expect(onClose).toHaveBeenCalledTimes(1);
        notification.unmount();
    });
});

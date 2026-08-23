import {SimpleDialogContainer} from '../../../src/containers/simple-dialog.jsx';
import {openSimpleDialog} from '../../../src/reducers/modals';

const makeContainer = overrides => new SimpleDialogContainer({
    onRequestClose: jest.fn(),
    simpleDialog: true,
    simpleDialogConfig: {
        type: 'confirm',
        title: 'Confirm',
        message: 'Continue?',
        onOk: jest.fn(),
        onCancel: jest.fn()
    },
    ...overrides
});

describe('simple dialog workflows', () => {
    test('settles only once when a button is clicked repeatedly', () => {
        const container = makeContainer();

        container.handleOk();
        container.handleOk();
        container.handleCancel();

        expect(container.props.onRequestClose).toHaveBeenCalledTimes(1);
        expect(container.props.simpleDialogConfig.onOk).toHaveBeenCalledTimes(1);
        expect(container.props.simpleDialogConfig.onCancel).not.toHaveBeenCalled();
    });

    test('cancels the old request when another dialog replaces it', () => {
        const previousConfig = {
            type: 'prompt',
            title: 'Old',
            message: 'Old prompt',
            onCancel: jest.fn()
        };
        const container = makeContainer({simpleDialogConfig: previousConfig});
        const previousProps = container.props;
        container.props = {
            ...previousProps,
            simpleDialogConfig: {
                type: 'prompt',
                title: 'New',
                message: 'New prompt'
            }
        };

        container.componentDidUpdate(previousProps);

        expect(previousConfig.onCancel).toHaveBeenCalledTimes(1);
        expect(container.settled).toBe(false);
    });

    test('assigns a fresh identity to every dialog', () => {
        const first = openSimpleDialog({type: 'prompt'});
        const second = openSimpleDialog({type: 'prompt'});

        expect(second.dialogConfig.dialogId).toBeGreaterThan(first.dialogConfig.dialogId);
    });
});

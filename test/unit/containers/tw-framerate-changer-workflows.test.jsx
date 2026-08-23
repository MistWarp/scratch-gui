import {FramerateChanger} from '../../../src/containers/tw-framerate-changer.jsx';

const makeChanger = overrides => new FramerateChanger({
    framerate: 60,
    intl: {formatMessage: message => message.defaultMessage},
    openSimpleDialog: jest.fn(),
    vm: {setFramerate: jest.fn()},
    ...overrides
});

describe('framerate menu control', () => {
    test('uses an in-app prompt for a custom framerate', async () => {
        const openSimpleDialog = jest.fn(config => config.onOk('72'));
        const changer = makeChanger({openSimpleDialog});

        await changer.changeFramerate({ctrlKey: true});

        expect(openSimpleDialog).toHaveBeenCalledWith(expect.objectContaining({
            type: 'prompt',
            defaultValue: '60'
        }));
        expect(changer.props.vm.setFramerate).toHaveBeenCalledWith(72);
    });

    test('ignores invalid custom framerates', async () => {
        const changer = makeChanger({
            openSimpleDialog: jest.fn(config => config.onOk('-1'))
        });

        await changer.changeFramerate({shiftKey: true});

        expect(changer.props.vm.setFramerate).not.toHaveBeenCalled();
    });
});

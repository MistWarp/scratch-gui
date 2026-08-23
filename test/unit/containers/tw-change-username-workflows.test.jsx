import {ChangeUsername} from '../../../src/containers/tw-change-username';

jest.mock('../../../src/lib/utils/isScratchDesktop', () => jest.fn(() => false));

describe('username change workflow', () => {
    test('shows an app error instead of opening the modal while a web project runs', () => {
        const changer = new ChangeUsername({
            onOpenUsernameModal: jest.fn(),
            onShowUnavailable: jest.fn(),
            running: true
        });

        changer.changeUsername();

        expect(changer.props.onShowUnavailable).toHaveBeenCalledTimes(1);
        expect(changer.props.onOpenUsernameModal).not.toHaveBeenCalled();
    });

    test('opens the username modal when the project is stopped', () => {
        const changer = new ChangeUsername({
            onOpenUsernameModal: jest.fn(),
            onShowUnavailable: jest.fn(),
            running: false
        });

        changer.changeUsername();

        expect(changer.props.onOpenUsernameModal).toHaveBeenCalledTimes(1);
        expect(changer.props.onShowUnavailable).not.toHaveBeenCalled();
    });
});

import {RoturLoginModal} from '../../../src/components/mw-rotur-login-modal/rotur-login-modal.jsx';
import {getRoturSessionApi} from '../../../src/lib/rotur/session-api.js';

jest.mock('../../../src/lib/rotur/session-api.js', () => ({
    getRoturSessionApi: jest.fn()
}));

describe('Rotur login modal workflows', () => {
    test('locks duplicate login and close actions until login finishes', async () => {
        let finishLogin;
        const login = jest.fn(() => new Promise(resolve => {
            finishLogin = resolve;
        }));
        const onRequestClose = jest.fn();
        getRoturSessionApi.mockReturnValue({login});
        const modal = new RoturLoginModal({
            onRequestClose,
            status: '',
            username: ''
        });
        modal.setState = state => {
            modal.state = {...modal.state, ...state};
        };

        const first = modal.handleLogin();
        const second = modal.handleLogin();
        modal.handleRequestClose();

        expect(login).toHaveBeenCalledTimes(1);
        expect(onRequestClose).not.toHaveBeenCalled();

        finishLogin();
        await first;
        await second;
        modal.handleRequestClose();
        expect(onRequestClose).toHaveBeenCalledTimes(1);
    });
});

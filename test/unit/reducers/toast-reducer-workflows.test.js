import toastReducer from '../../../src/reducers/toast';

describe('toast reducer', () => {
    test('increments the sequence for repeated identical notifications', () => {
        const action = {
            type: 'scratch-gui/SHOW_TOAST',
            message: 'Project autosaved.',
            toastType: 'success'
        };

        const first = toastReducer(undefined, action); // eslint-disable-line no-undefined
        const second = toastReducer(first, action);

        expect(first.sequence).toBe(1);
        expect(second.sequence).toBe(2);
        expect(second.message).toBe(first.message);
    });
});

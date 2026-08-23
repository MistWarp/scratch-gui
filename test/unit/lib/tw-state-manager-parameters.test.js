import {
    confirmProjectSwitch,
    parseNonNegativeURLNumber,
    restoreRouterURL
} from '../../../src/lib/components/tw-state-manager-hoc';

describe('state manager URL number parsing', () => {
    test('accepts finite non-negative values', () => {
        expect(parseNonNegativeURLNumber('0')).toBe(0);
        expect(parseNonNegativeURLNumber('60')).toBe(60);
        expect(parseNonNegativeURLNumber('2.5')).toBe(2.5);
    });

    test('rejects values that cannot be applied safely', () => {
        expect(parseNonNegativeURLNumber('-1')).toBeNull();
        expect(parseNonNegativeURLNumber('fast')).toBeNull();
        expect(parseNonNegativeURLNumber('Infinity')).toBeNull();
    });
});

describe('state manager project switching', () => {
    test('uses the in-app confirmation when no host override is supplied', async () => {
        const openDialog = jest.fn(config => config.onCancel());

        await expect(confirmProjectSwitch({
            openDialog,
            message: 'Switch?'
        })).resolves.toBe(false);

        expect(openDialog).toHaveBeenCalledWith(expect.objectContaining({
            type: 'confirm',
            message: 'Switch?'
        }));
    });

    test('supports asynchronous host confirmations', async () => {
        await expect(confirmProjectSwitch({
            confirmWithMessage: () => Promise.resolve(true),
            openDialog: jest.fn(),
            message: 'Switch?'
        })).resolves.toBe(true);
    });

    test('restores the loaded project URL after a cancelled navigation', () => {
        window.history.replaceState({}, '', '/editor?mode=test#999');
        const router = {
            generateURL: jest.fn(() => '/editor?mode=test#123')
        };

        expect(restoreRouterURL(router, {
            projectId: '123',
            isPlayerOnly: false,
            isFullScreen: false
        })).toBe(true);

        expect(window.location.hash).toBe('#123');
    });
});

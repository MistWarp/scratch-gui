import {sleep} from '../../../src/lib/utils/async';

describe('sleep', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test('resolves after the given time', async () => {
        jest.useFakeTimers();
        const done = jest.fn();
        const promise = sleep(1000).then(done);

        jest.advanceTimersByTime(999);
        await Promise.resolve();
        expect(done).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        await promise;
        expect(done).toHaveBeenCalled();
    });
});

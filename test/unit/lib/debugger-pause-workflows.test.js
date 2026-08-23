import {
    isPaused,
    setPaused,
    setup
} from '../../../src/addons/addons/debugger/module';

describe('debugger pause lifecycle', () => {
    test('stopping the project also clears debugger pause', () => {
        const originalStopAll = jest.fn(() => 'stopped');
        const runtime = {
            _getMonitorThreadCount: jest.fn(() => 0),
            audioEngine: {
                audioContext: {
                    resume: jest.fn(() => Promise.resolve()),
                    suspend: jest.fn(() => Promise.resolve())
                }
            },
            emit: jest.fn(),
            getIsEdgeActivatedHat: jest.fn(),
            greenFlag: jest.fn(),
            ioDevices: {
                clock: {
                    _paused: false,
                    pause: jest.fn(),
                    resume: jest.fn()
                }
            },
            sequencer: {
                activeThread: null,
                stepThreads: jest.fn()
            },
            startHats: jest.fn(() => []),
            stopAll: originalStopAll,
            threads: []
        };
        setup({tab: {traps: {vm: {runtime}}}});
        setPaused(true);

        expect(runtime.stopAll()).toBe('stopped');

        expect(originalStopAll).toHaveBeenCalledTimes(1);
        expect(isPaused()).toBe(false);
        expect(runtime.ioDevices.clock.resume).toHaveBeenCalledTimes(1);
    });
});

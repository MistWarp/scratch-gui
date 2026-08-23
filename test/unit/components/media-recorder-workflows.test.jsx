import {MediaRecorderButton} from '../../../src/components/menu-bar/media-recorder.jsx';

const makeRecorder = overrides => {
    const recorder = new MediaRecorderButton({
        className: '',
        intl: {formatMessage: jest.fn(message => message.defaultMessage)},
        labelClassName: '',
        projectTitle: 'Project',
        vm: {
            runtime: {
                once: jest.fn(),
                off: jest.fn()
            }
        },
        ...overrides
    });
    recorder.setState = update => {
        recorder.state = {...recorder.state, ...update};
    };
    return recorder;
};

describe('media recorder startup', () => {
    const originalMediaRecorder = window.MediaRecorder;

    afterEach(() => {
        window.MediaRecorder = originalMediaRecorder;
    });

    test('reports unsupported browsers without throwing', async () => {
        delete window.MediaRecorder;
        const recorder = makeRecorder();

        await recorder.handleStart();

        expect(recorder.state.error).toBe('This browser cannot encode a supported video format.');
    });

    test('ignores duplicate start clicks while microphone access is pending', async () => {
        let finishPermission;
        window.MediaRecorder = function () {};
        window.MediaRecorder.isTypeSupported = jest.fn(() => true);
        const getUserMedia = jest.fn(() => new Promise(resolve => {
            finishPermission = resolve;
        }));
        Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: {getUserMedia}
        });
        const recorder = makeRecorder();
        recorder.state.microphone = true;

        const firstStart = recorder.handleStart();
        await recorder.handleStart();
        expect(getUserMedia).toHaveBeenCalledTimes(1);

        finishPermission({getTracks: () => []});
        await firstStart;
        expect(recorder.props.vm.runtime.once).toHaveBeenCalledTimes(1);
        expect(recorder.state.phase).toBe('waiting');
    });

    test('does not arm a hidden recording after cancelling a permission prompt', async () => {
        let finishPermission;
        const stopTrack = jest.fn();
        window.MediaRecorder = function () {};
        window.MediaRecorder.isTypeSupported = jest.fn(() => true);
        Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: {
                getUserMedia: () => new Promise(resolve => {
                    finishPermission = resolve;
                })
            }
        });
        const recorder = makeRecorder();
        recorder.state.microphone = true;
        recorder.state.open = true;

        const start = recorder.handleStart();
        recorder.handleClose();
        finishPermission({getTracks: () => [{stop: stopTrack}]});
        await start;

        expect(recorder.props.vm.runtime.once).not.toHaveBeenCalled();
        expect(stopTrack).toHaveBeenCalledTimes(1);
        expect(recorder.state.open).toBe(false);
        expect(recorder.state.phase).toBe('options');
    });
});

import {RecordingStep} from '../../../src/containers/recording-step.jsx';

const makeStep = mounted => {
    const step = Object.create(RecordingStep.prototype);
    step._isMounted = mounted;
    step.props = {
        onShowRecordingError: jest.fn(),
        recording: false
    };
    step.setState = jest.fn();
    return step;
};

describe('recording step callbacks', () => {
    test('shows an app error when microphone setup fails', () => {
        const step = makeStep(true);

        step.handleRecordingError(new Error('permission denied'));

        expect(step.props.onShowRecordingError).toHaveBeenCalledTimes(1);
    });

    test('ignores recorder callbacks after the modal closes', () => {
        const step = makeStep(false);

        step.handleStarted();
        step.handleLevelUpdate(0.5);
        step.handleRecordingError(new Error('late failure'));

        expect(step.setState).not.toHaveBeenCalled();
        expect(step.props.onShowRecordingError).not.toHaveBeenCalled();
    });
});

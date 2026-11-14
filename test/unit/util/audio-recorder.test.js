import getUserMedia from 'get-user-media-promise';
import AudioRecorder from '../../../src/lib/audio/audio-recorder';

jest.mock('get-user-media-promise', () => jest.fn());
jest.mock('../../../src/lib/audio/shared-audio-context.js', () => jest.fn(() => ({})));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const makeStream = () => {
    const tracks = [{stop: jest.fn()}, {stop: jest.fn()}];
    return {tracks, getTracks: () => tracks, getAudioTracks: () => tracks};
};

describe('AudioRecorder', () => {
    test('a recorder disposed before the microphone opens closes the stream it is given', async () => {
        const stream = makeStream();
        getUserMedia.mockReturnValue(Promise.resolve(stream));
        const recorder = new AudioRecorder();
        const onStarted = jest.fn();
        const onError = jest.fn();
        recorder.startListening(onStarted, jest.fn(), onError);
        recorder.dispose();
        await flush();
        expect(onStarted).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
        stream.tracks.forEach(track => expect(track.stop).toHaveBeenCalledTimes(1));
    });

    test('a recorder that is still wanted keeps the stream open', async () => {
        const stream = makeStream();
        getUserMedia.mockReturnValue(Promise.resolve(stream));
        const recorder = new AudioRecorder();
        recorder.attachUserMediaStream = jest.fn();
        const onStarted = jest.fn();
        recorder.startListening(onStarted, jest.fn(), jest.fn());
        await flush();
        expect(onStarted).toHaveBeenCalledTimes(1);
        expect(recorder.attachUserMediaStream).toHaveBeenCalledWith(stream, expect.any(Function));
        stream.tracks.forEach(track => expect(track.stop).not.toHaveBeenCalled());
    });

    test('a refused microphone is reported unless the recorder was disposed', async () => {
        getUserMedia.mockReturnValue(Promise.reject(new Error('denied')));
        const recorder = new AudioRecorder();
        const onError = jest.fn();
        recorder.startListening(jest.fn(), jest.fn(), onError);
        await flush();
        expect(onError).toHaveBeenCalledTimes(1);

        getUserMedia.mockReturnValue(Promise.reject(new Error('denied')));
        const disposed = new AudioRecorder();
        const ignored = jest.fn();
        disposed.startListening(jest.fn(), jest.fn(), ignored);
        disposed.dispose();
        await flush();
        expect(ignored).not.toHaveBeenCalled();
    });
});

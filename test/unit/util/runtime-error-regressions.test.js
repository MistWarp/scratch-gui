import {importWithRetry} from '../../../src/lib/lazy-with-retry';
import VideoProvider from '../../../src/lib/video/video-provider';
import {requestVideoStream, requestDisableVideo} from '../../../src/lib/video/camera';

jest.mock('../../../src/lib/video/camera', () => ({
    requestVideoStream: jest.fn(),
    requestDisableVideo: jest.fn(() => true)
}));

test('retries a failed chunk download once', async () => {
    jest.useFakeTimers();
    const error = Object.assign(new Error('Loading chunk 116 failed.'), {name: 'ChunkLoadError'});
    const module = {default: () => null};
    const load = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(module);
    const pending = importWithRetry(load);
    await Promise.resolve();
    jest.runAllTimers();
    await expect(pending).resolves.toBe(module);
    expect(load).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
});

test('does not retry exceptions executing a module', async () => {
    const error = new TypeError('Broken module');
    const load = jest.fn().mockRejectedValue(error);
    await expect(importWithRetry(load)).rejects.toBe(error);
    expect(load).toHaveBeenCalledTimes(1);
});

test('a second failed chunk request reaches the error boundary', async () => {
    jest.useFakeTimers();
    const error = Object.assign(new Error('Loading chunk 116 failed.'), {name: 'ChunkLoadError'});
    const load = jest.fn().mockRejectedValue(error);
    const pending = expect(importWithRetry(load)).rejects.toBe(error);
    await Promise.resolve();
    jest.runAllTimers();
    await pending;
    expect(load).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
});

test('blocked video playback is handled, releases the camera, and can be retried', async () => {
    const error = new DOMException('Playback denied', 'NotAllowedError');
    const stop = jest.fn();
    requestVideoStream.mockResolvedValue({getTracks: () => [{stop}]});
    const play = jest.spyOn(HTMLMediaElement.prototype, 'play')
        .mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const provider = new VideoProvider();
    provider.onError = jest.fn();
    await provider.enableVideo();
    expect(provider.onError).toHaveBeenCalledWith(error);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(requestDisableVideo).toHaveBeenCalled();
    expect(provider.video).toBeNull();
    await expect(provider.enableVideo()).resolves.toBe(provider);
    expect(provider.video.muted).toBe(true);
    expect(provider.video.playsInline).toBe(true);
    provider.disableVideo();
    await Promise.resolve();
    play.mockRestore();
});

test('disabling during blocked playback releases the shared camera only once', async () => {
    requestDisableVideo.mockClear();
    requestVideoStream.mockResolvedValue({getTracks: () => [{stop: jest.fn()}]});
    const play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('Blocked'));
    const provider = new VideoProvider();
    provider.onError = jest.fn();
    const pending = provider.enableVideo();
    provider.disableVideo();
    await pending;
    await Promise.resolve();
    expect(requestDisableVideo).toHaveBeenCalledTimes(1);
    play.mockRestore();
});

/* eslint-env jest */
import AudioBufferPlayer from '../../src/lib/audio/audio-buffer-player';

const mockSources = [];
const mockContext = {currentTime: 0};

jest.mock('../../src/lib/audio/shared-audio-context.js', () => (
    jest.fn().mockImplementation(() => Object.assign(mockContext, {
        destination: {},
        createBuffer: (channels, length, sampleRate) => {
            const data = Array.from({length: channels}, () => new Float32Array(length));
            return {
                duration: length / sampleRate,
                length,
                numberOfChannels: channels,
                sampleRate,
                getChannelData: c => data[c]
            };
        },
        createBufferSource: () => {
            const source = {
                connect: jest.fn(),
                stop: jest.fn(),
                start: jest.fn((when, offset, duration) => {
                    if (offset < 0) throw new RangeError(`offset ${offset} is less than the minimum bound (0)`);
                    if (duration < 0) throw new RangeError(`duration ${duration} is negative`);
                })
            };
            mockSources.push(source);
            return source;
        }
    }))
));

beforeEach(() => {
    mockSources.length = 0;
    mockContext.currentTime = 0;
});

test('copies every channel of a clip into the buffer', () => {
    const player = new AudioBufferPlayer({
        channels: [new Float32Array([1, 2]), new Float32Array([3, 4])],
        sampleRate: 100
    });
    expect(player.buffer.numberOfChannels).toBe(2);
    expect(Array.from(player.buffer.getChannelData(1))).toEqual([3, 4]);
});

test('plays a range from an offset and reports the position', () => {
    const player = new AudioBufferPlayer(new Float32Array(1000), 100);
    const onUpdate = jest.fn();
    player.playRange({start: 200, end: 600, from: 300, onUpdate});
    expect(mockSources[0].start).toHaveBeenCalledWith(0, 3, 3);
    expect(onUpdate).toHaveBeenCalledWith(300, []);
    mockContext.currentTime = 1;
    expect(player.currentSample()).toBe(400);
    mockContext.currentTime = 10;
    expect(player.currentSample()).toBe(600);
    player.stop();
    expect(mockSources[0].stop).toHaveBeenCalled();
    expect(player.currentSample()).toBeNull();
});

test('loops a range and wraps the reported position', () => {
    const player = new AudioBufferPlayer(new Float32Array(1000), 100);
    player.playRange({start: 200, end: 400, loop: true});
    const source = mockSources[0];
    expect(source.loop).toBe(true);
    expect(source.loopStart).toBe(2);
    expect(source.loopEnd).toBe(4);
    mockContext.currentTime = 2.5;
    expect(player.currentSample()).toBe(250);
});

test('only the current source reports that playback ended', () => {
    const player = new AudioBufferPlayer(new Float32Array(1000), 100);
    const onEnded = jest.fn();
    player.playRange({start: 0, end: 100, onEnded});
    const first = mockSources[0];
    const firstEnded = first.onended;
    player.playRange({start: 0, end: 100, onEnded});
    if (firstEnded) firstEnded();
    expect(onEnded).not.toHaveBeenCalled();
    mockSources[1].onended();
    expect(onEnded).toHaveBeenCalledTimes(1);
});

test('an empty range plays the whole sound', () => {
    const player = new AudioBufferPlayer(new Float32Array(1000), 100);
    player.playRange({start: 500, end: 500});
    expect(mockSources[0].start).toHaveBeenCalledWith(0, 0, 10);
});

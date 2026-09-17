/* eslint-env jest */
import AudioBufferPlayer from '../../src/lib/audio/audio-buffer-player';

jest.mock('../../src/lib/audio/shared-audio-context.js', () => (
    jest.fn().mockImplementation(() => ({
        destination: {},
        createBuffer: (channels, length, sampleRate) => ({
            duration: length / sampleRate,
            getChannelData: () => ({set: () => {}})
        }),
        createBufferSource: () => ({
            connect: () => {},
            start: (when, offset, duration) => {
                if (offset < 0) throw new RangeError(`offset ${offset} is less than the minimum bound (0)`);
                if (duration < 0) throw new RangeError(`duration ${duration} is negative`);
            }
        })
    }))
));

const playWith = (trimStart, trimEnd) => {
    const player = new AudioBufferPlayer(new Float32Array(44100), 44100);
    player.update = () => {};
    player.play(trimStart, trimEnd, () => {}, () => {});
    return player;
};

test('a normal trim range is left alone', () => {
    const player = playWith(0.25, 0.75);
    expect(player.trimStart).toBe(0.25);
    expect(player.trimEnd).toBe(0.75);
});

test('a trim handle dragged past the start does not throw', () => {
    expect(() => playWith(-0.0109501, 0.5)).not.toThrow();
    expect(playWith(-0.0109501, 0.5).trimStart).toBe(0);
});

test('a trim handle dragged past the end does not throw', () => {
    expect(() => playWith(0.5, 1.4)).not.toThrow();
    expect(playWith(0.5, 1.4).trimEnd).toBe(1);
});

test('an inverted trim range yields a zero-length, non-negative duration', () => {
    const player = playWith(0.8, 0.2);
    expect(player.trimEnd).toBe(player.trimStart);
});

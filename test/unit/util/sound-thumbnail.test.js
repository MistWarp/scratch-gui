import soundThumbnail from '../../../src/lib/audio/sound-thumbnail';

const buffer = channels => ({
    numberOfChannels: channels.length,
    getChannelData: jest.fn(index => channels[index])
});

const decode = url => decodeURIComponent(url.replace('data:image/svg+xml;utf8,', ''));

describe('sound thumbnail', () => {
    test('draws one lane for mono and two for stereo', () => {
        const mono = decode(soundThumbnail('mono', buffer([new Float32Array([0, 1, -1, 0.5])]), '#123456'));
        expect(mono).toContain('fill="#123456"');
        expect((mono.match(/M/g) || []).length).toBe(26);
        const stereo = decode(soundThumbnail('stereo', buffer([
            new Float32Array([0, 1, -1, 0.5]),
            new Float32Array([0, 0.5, -0.5, 0.25])
        ]), '#123456'));
        expect((stereo.match(/M/g) || []).length).toBe(52);
    });

    test('caches by key and colour', () => {
        const source = buffer([new Float32Array([0, 1])]);
        const first = soundThumbnail('cached', source, '#000');
        expect(soundThumbnail('cached', source, '#000')).toBe(first);
        expect(source.getChannelData).toHaveBeenCalledTimes(1);
        expect(soundThumbnail('cached', source, '#fff')).not.toBe(first);
    });

    test('returns nothing without a loaded buffer', () => {
        expect(soundThumbnail('missing', null, '#000')).toBeNull();
    });
});

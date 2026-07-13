/* global WebAudioTestAPI */
import 'web-audio-test-api';
WebAudioTestAPI.setState({
    'AudioContext#resume': 'enabled'
});

import SharedAudioContext from '../../../src/lib/audio/shared-audio-context';

describe('Shared Audio Context', () => {
    test('is undefined without a user gesture', () => {
        expect(SharedAudioContext()).toBeUndefined();
    });

    test('returns an AudioContext once a user gesture is seen', () => {
        document.dispatchEvent(new Event('mousedown'));

        expect(SharedAudioContext()).toBeInstanceOf(AudioContext);
    });

    test('returns the same AudioContext on subsequent calls', () => {
        expect(SharedAudioContext()).toBe(SharedAudioContext());
    });
});

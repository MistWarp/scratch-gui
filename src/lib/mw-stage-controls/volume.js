// Native port of the vol-slider/mute-project addon volume logic.
// Volumes in this file are always in 0-1.

let hasSetup = false;
/** @type {AudioParam|null} */
let gainNode = null;
let unmuteVolume = 1;
let volumeBeforeFinishSetup = 1;
const callbacks = [];

const setVolume = newVolume => {
    if (gainNode) {
        gainNode.value = newVolume;
    } else {
        volumeBeforeFinishSetup = newVolume;
    }
    callbacks.forEach(callback => callback());
};

const getVolume = () => {
    if (gainNode) {
        return gainNode.value;
    }
    return volumeBeforeFinishSetup;
};

const isMuted = () => getVolume() === 0;

const setUnmutedVolume = newUnmuteVolume => {
    unmuteVolume = newUnmuteVolume;
};

const setMuted = newMuted => {
    if (newMuted) {
        setUnmutedVolume(getVolume());
        setVolume(0);
    } else {
        setVolume(unmuteVolume === 0 ? 1 : unmuteVolume);
    }
};

const onVolumeChanged = callback => {
    callbacks.push(callback);
};

const gotAudioEngine = audioEngine => {
    if (!audioEngine) {
        // eslint-disable-next-line no-console
        console.error('could not get audio engine; stage volume control will not work');
        return;
    }
    gainNode = audioEngine.inputNode.gain;
    gainNode.value = volumeBeforeFinishSetup;
};

const setup = vm => {
    if (hasSetup) {
        return;
    }
    hasSetup = true;

    const audioEngine = vm.runtime.audioEngine;
    if (audioEngine) {
        gotAudioEngine(audioEngine);
    } else {
        vm.runtime.once('PROJECT_LOADED', () => {
            gotAudioEngine(vm.runtime.audioEngine);
        });
    }
};

export {
    setup,
    getVolume,
    setVolume,
    isMuted,
    setMuted,
    setUnmutedVolume,
    onVolumeChanged
};

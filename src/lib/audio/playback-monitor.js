class PlaybackMonitor {
    constructor () {
        this.listeners = new Set();
        this.sample = null;
        this.levels = [];
        this.recordingSeconds = null;
    }

    update (state) {
        if ('sample' in state) this.sample = state.sample;
        if ('levels' in state) this.levels = state.levels;
        if ('recordingSeconds' in state) this.recordingSeconds = state.recordingSeconds;
        this.listeners.forEach(listener => listener(this));
    }

    reset () {
        this.update({sample: null, levels: [], recordingSeconds: null});
    }

    subscribe (listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
}

export default PlaybackMonitor;

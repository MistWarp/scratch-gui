import SharedAudioContext from './shared-audio-context.js';

const toChannels = samples => (samples && Array.isArray(samples.channels) ? samples.channels : [samples]);

class AudioBufferPlayer {
    constructor (samples, sampleRate) {
        this.audioContext = new SharedAudioContext();
        const channels = toChannels(samples);
        const rate = samples && samples.sampleRate ? samples.sampleRate : sampleRate;
        const length = Math.max(1, channels[0] ? channels[0].length : 0);
        this.buffer = this.audioContext.createBuffer(channels.length, length, rate);
        channels.forEach((channel, c) => {
            if (channel) this.buffer.getChannelData(c).set(channel);
        });
        this.source = null;
        this.analysers = [];
        this.levelData = null;

        this.startTime = null;
        this.updateCallback = null;
        this.rangeStart = 0;
        this.rangeEnd = 0;
        this.loop = false;
        this.raf = null;
    }

    connectMeter (node) {
        const context = this.audioContext;
        if (typeof context.createChannelSplitter !== 'function' || typeof context.createAnalyser !== 'function') {
            node.connect(context.destination);
            return;
        }
        const channelCount = this.buffer.numberOfChannels || 1;
        const splitter = context.createChannelSplitter(channelCount);
        node.connect(splitter);
        node.connect(context.destination);
        this.analysers = [];
        for (let c = 0; c < channelCount; c++) {
            const analyser = context.createAnalyser();
            analyser.fftSize = 1024;
            splitter.connect(analyser, c);
            this.analysers.push(analyser);
        }
        this.levelData = new Float32Array(1024);
    }

    getLevels () {
        if (!this.analysers.length || !this.levelData) return [];
        return this.analysers.map(analyser => {
            analyser.getFloatTimeDomainData(this.levelData);
            let peak = 0;
            for (let i = 0; i < this.levelData.length; i++) {
                const value = Math.abs(this.levelData[i]);
                if (value > peak) peak = value;
            }
            return peak;
        });
    }

    playRange ({start, end, from, loop, onUpdate, onEnded}) {
        this.stop();
        const length = this.buffer.length;
        const rate = this.buffer.sampleRate;
        this.rangeStart = Math.max(0, Math.min(length, start));
        this.rangeEnd = Math.max(this.rangeStart, Math.min(length, end));
        if (this.rangeEnd - this.rangeStart < 1) {
            this.rangeStart = 0;
            this.rangeEnd = length;
        }
        const offset = typeof from === 'number' && from >= this.rangeStart && from < this.rangeEnd ?
            from : this.rangeStart;
        this.loop = Boolean(loop);
        this.updateCallback = onUpdate;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        if (this.loop) {
            source.loop = true;
            source.loopStart = this.rangeStart / rate;
            source.loopEnd = this.rangeEnd / rate;
        }
        source.onended = () => {
            if (this.source !== source) return;
            this.source = null;
            this.cancelFrame();
            if (onEnded) onEnded();
        };
        this.connectMeter(source);
        this.source = source;
        this.startOffset = offset;
        this.startTime = this.audioContext.currentTime;
        if (this.loop) {
            source.start(0, offset / rate);
        } else {
            source.start(0, offset / rate, (this.rangeEnd - offset) / rate);
        }
        this.tick();
    }

    currentSample () {
        if (!this.source) return null;
        const rate = this.buffer.sampleRate;
        const elapsed = Math.max(0, (this.audioContext.currentTime - this.startTime) * rate);
        const position = this.startOffset + elapsed;
        if (!this.loop) return Math.min(this.rangeEnd, position);
        if (position < this.rangeEnd) return position;
        const span = this.rangeEnd - this.rangeStart;
        return this.rangeStart + ((position - this.rangeEnd) % span);
    }

    tick () {
        this.cancelFrame();
        if (!this.source || !this.updateCallback) return;
        this.updateCallback(this.currentSample(), this.getLevels());
        this.raf = requestAnimationFrame(() => this.tick());
    }

    cancelFrame () {
        if (this.raf !== null) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }

    stop () {
        this.cancelFrame();
        if (this.source) {
            const source = this.source;
            this.source = null;
            source.onended = null;
            try {
                source.stop();
            } catch {
                return;
            }
        }
    }
}

export default AudioBufferPlayer;

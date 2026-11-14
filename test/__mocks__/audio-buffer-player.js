export default class MockAudioBufferPlayer {
    constructor (samples, sampleRate) {
        this.samples = samples;
        this.sampleRate = sampleRate;
        this.buffer = {
            getChannelData: jest.fn(() => samples),
            sampleRate: sampleRate
        };
        this.playRange = jest.fn(options => {
            this.options = options;
            this.onUpdate = options.onUpdate;
            this.onEnded = options.onEnded;
        });
        this.position = null;
        this.currentSample = jest.fn(() => this.position);
        this.stop = jest.fn();
        MockAudioBufferPlayer.instance = this;
        MockAudioBufferPlayer.instances.push(this);
    }
}

MockAudioBufferPlayer.instances = [];

import {createEngine} from './fractch-engine.js';

const engine = createEngine();

self.onmessage = event => {
    const {id, message} = event.data;
    try {
        self.postMessage({id, result: engine.handle(message)});
    } catch (error) {
        self.postMessage({id, error: String((error && error.message) || error)});
    }
};

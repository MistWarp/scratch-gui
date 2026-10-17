import {lintExtension} from './lint.js';

self.onmessage = event => {
    const {id, source, options} = event.data;
    try {
        self.postMessage({id, diagnostics: lintExtension(source, options)});
    } catch (error) {
        self.postMessage({id, error: String((error && error.message) || error)});
    }
};

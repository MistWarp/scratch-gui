/**
 * Minimal event emitter used by the collaboration engine.
 * Avoids depending on the node 'events' polyfill and keeps listener
 * bookkeeping explicit so sessions can be torn down deterministically.
 */
class Emitter {
    constructor () {
        this._listeners = new Map();
    }

    on (event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
        return this;
    }

    off (event, callback) {
        const callbacks = this._listeners.get(event);
        if (!callbacks) return this;
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
            this._listeners.delete(event);
        }
        return this;
    }

    once (event, callback) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback(...args);
        };
        return this.on(event, wrapper);
    }

    emit (event, ...args) {
        const callbacks = this._listeners.get(event);
        if (!callbacks) return false;
        // Copy so handlers that unsubscribe during dispatch don't skip others.
        callbacks.slice().forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                // A listener throwing must not break other listeners or the
                // network dispatch path that emitted this event.
                // eslint-disable-next-line no-console
                console.error(`[Collab] Listener for "${event}" threw:`, error);
            }
        });
        return true;
    }

    removeAllListeners (event) {
        if (typeof event === 'undefined') {
            this._listeners.clear();
        } else {
            this._listeners.delete(event);
        }
        return this;
    }

    listenerCount (event) {
        const callbacks = this._listeners.get(event);
        return callbacks ? callbacks.length : 0;
    }
}

export default Emitter;

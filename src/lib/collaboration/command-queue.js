/** Commands and snapshot captures share this queue. Cancelling discards work
 * which has not started; active jobs receive a lifetime check after each await. */
export default class CommandQueue {
    constructor () {
        this.tail = Promise.resolve();
        this.generation = 0;
    }

    run (job) {
        const generation = this.generation;
        const active = () => generation === this.generation;
        const result = this.tail.then(() => {
            if (!active()) throw new Error('Collaboration session ended');
            return job(active);
        });
        this.tail = result.catch(() => {});
        return result;
    }

    cancel () {
        this.generation++;
    }
}

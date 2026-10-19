import {createLinter} from '../../../src/lib/extension-dev/lint-client.js';
import {lintExtension} from '../../../src/lib/extension-dev/lint.js';

const mockWorkers = [];

jest.mock('../../../src/lib/extension-dev/lint-worker-spawn.js', () => ({
    __esModule: true,
    default: () => {
        const worker = {
            sent: [],
            terminated: false,
            postMessage (message) {
                this.sent.push(message);
            },
            terminate () {
                this.terminated = true;
            },
            reply (index) {
                const {id, source, options} = this.sent[index];
                const lint = require('../../../src/lib/extension-dev/lint.js').lintExtension;
                this.onmessage({data: {id, diagnostics: lint(source, options)}});
            }
        };
        mockWorkers.push(worker);
        return worker;
    }
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const SOURCE = 'Scratch.extensions.register({});';

describe('createLinter coalescing', () => {
    afterEach(() => {
        delete global.Worker;
        mockWorkers.length = 0;
    });

    test('direct mode resolves superseded requests with null', async () => {
        const linter = createLinter();
        const first = linter.lint('a', {});
        const second = linter.lint('b', {});
        const third = linter.lint(SOURCE, {});
        await expect(first).resolves.toBeNull();
        await expect(second).resolves.toBeNull();
        await expect(third).resolves.toEqual(lintExtension(SOURCE, {}));
        const pending = linter.lint(SOURCE, {});
        linter.dispose();
        await expect(pending).resolves.toBeNull();
    });

    test('worker mode keeps one request in flight and sends only the latest', async () => {
        global.Worker = function () {};
        const linter = createLinter();
        const first = linter.lint('first', {});
        await flush();
        const [worker] = mockWorkers;
        expect(worker.sent.map(each => each.source)).toEqual(['first']);
        const second = linter.lint('second', {});
        const third = linter.lint(SOURCE, {});
        await flush();
        expect(worker.sent).toHaveLength(1);
        await expect(first).resolves.toBeNull();
        await expect(second).resolves.toBeNull();
        worker.reply(0);
        await flush();
        expect(worker.sent.map(each => each.source)).toEqual(['first', SOURCE]);
        worker.reply(1);
        await expect(third).resolves.toEqual(lintExtension(SOURCE, {}));
        const pending = linter.lint(SOURCE, {});
        linter.dispose();
        await expect(pending).resolves.toBeNull();
        expect(worker.terminated).toBe(true);
    });

    test('a worker error falls back to direct linting', async () => {
        global.Worker = function () {};
        const linter = createLinter();
        const request = linter.lint(SOURCE, {});
        await flush();
        mockWorkers[0].onerror({preventDefault () {}});
        await expect(request).resolves.toEqual(lintExtension(SOURCE, {}));
        linter.dispose();
    });
});

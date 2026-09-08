import {preview} from 'vite';
import {spawn} from 'node:child_process';

// ES module builds must be served over HTTP, rather than opened as file:// URLs.
const server = await preview({preview: {host: '127.0.0.1', port: 0}});
const address = server.httpServer.address();
const args = process.argv.slice(2);
const workers = args.includes('--runInBand') || args.some(arg => arg.startsWith('--maxWorkers')) ?
    [] : ['--maxWorkers=4'];
const child = spawn('pnpm', ['exec', 'jest', ...workers, 'test[/\\\\]integration', ...args], {
    stdio: 'inherit',
    env: {...process.env, TEST_BASE_URL: `http://127.0.0.1:${address.port}`}
});
child.on('error', error => {
    console.error(error);
    server.httpServer.close();
    process.exitCode = 1;
});
child.on('exit', code => {
    server.httpServer.close();
    process.exitCode = code ?? 1;
});

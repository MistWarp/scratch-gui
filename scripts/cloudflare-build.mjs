import {execFile, spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';

const docsOrigin = process.env.MW_DOCS_ORIGIN || 'https://docs.warp.mistium.com';

const run = (command, args, env = {}) => new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: 'inherit', env: {...process.env, ...env}});
    child.on('error', reject);
    child.on('exit', code => (code === 0 ? resolve() :
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))));
});

const docsMaster = async () => {
    const {stdout} = await promisify(execFile)('git',
        ['ls-remote', 'https://github.com/MistWarp/docs', 'refs/heads/master']);
    return stdout.split(/\s/)[0];
};

const fetchOk = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response;
};
const downloadDocs = async () => {
    const [master, published] = await Promise.all([docsMaster(),
        fetchOk(`${docsOrigin}/docs-build.json`).then(response => response.json())]);
    if (published.commit !== master) {
        throw new Error(`the docs deployment is at ${String(published.commit).slice(0, 8)}, ` +
            `master is at ${master.slice(0, 8)}`);
    }
    const archive = Buffer.from(await (await fetchOk(`${docsOrigin}/docs-build.tar.gz`)).arrayBuffer());
    const output = path.join(os.tmpdir(), 'mistwarp-docs', 'build');
    fs.rmSync(path.dirname(output), {recursive: true, force: true});
    fs.mkdirSync(output, {recursive: true});
    const file = path.join(os.tmpdir(), 'mistwarp-docs', 'docs-build.tar.gz');
    fs.writeFileSync(file, archive);
    await run('tar', ['-xzf', file, '-C', output]);
    if (!fs.existsSync(path.join(output, 'index.html'))) throw new Error('the archive has no index.html');
    console.log(`Using the docs build of MistWarp/docs ${master.slice(0, 8)} from ${docsOrigin}`);
    return output;
};

const docs = downloadDocs().catch(error => {
    console.log(`Building the docs from source: ${error.message}`);
    return null;
});

if (!process.env.MW_PINNED_FORKS) await run(process.execPath, ['scripts/sync-forks.mjs']);
await run('pnpm', ['install', process.env.MW_PINNED_FORKS ? '--frozen-lockfile' : '--no-frozen-lockfile',
    '--ignore-scripts']);
await run('pnpm', ['run', 'setup:microbit']);
const docsBuild = await docs;
// The community build needs more memory than Node's default heap.
const nodeOptions = process.env.NODE_OPTIONS || '';
await run(process.execPath, ['scripts/build.mjs', '--site-only'], {
    MW_COMMUNITY: 'true',
    ...(/--max-old-space-size/.test(nodeOptions) ? {} :
        {NODE_OPTIONS: `${nodeOptions} --max-old-space-size=7168`.trim()}),
    ...(docsBuild ? {MW_DOCS_BUILD: docsBuild} : {})
});

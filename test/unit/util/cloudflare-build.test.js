/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DOCS_MASTER = 'a'.repeat(40);

const runCloudflareBuild = async ({env = {}, publishedCommit = DOCS_MASTER, archiveStatus = 200} = {}) => {
    const steps = [];
    const written = [];
    const source = fs.readFileSync(path.resolve(__dirname, '../../../scripts/cloudflare-build.mjs'), 'utf8')
        .replace(/^import .*;\n/gm, '');
    const context = {
        process: {env: {...env}, execPath: '/node'},
        Buffer,
        Error,
        Promise,
        String,
        console: {log: () => {}},
        os: {tmpdir: () => '/tmp'},
        path,
        fs: {
            rmSync: () => {},
            mkdirSync: () => {},
            writeFileSync: file => written.push(file),
            existsSync: file => file === '/tmp/mistwarp-docs/build/index.html'
        },
        promisify: () => async () => ({stdout: `${DOCS_MASTER}\trefs/heads/master\n`}),
        execFile: () => {},
        fetch: async url => ({
            ok: url.endsWith('.json') || archiveStatus === 200,
            status: url.endsWith('.json') ? 200 : archiveStatus,
            json: async () => ({commit: publishedCommit}),
            arrayBuffer: async () => new ArrayBuffer(4)
        }),
        spawn: (command, args, options) => {
            const step = command === '/node' ? args.join(' ') : `${command} ${args.join(' ')}`;
            steps.push({step, env: options.env});
            return {on: (event, callback) => event === 'exit' && setImmediate(() => callback(0))};
        },
        setImmediate
    };
    await vm.runInNewContext(`(async () => {${source}})()`, context);
    return {steps, written};
};

const EXTRACT_DOCS = 'tar -xzf /tmp/mistwarp-docs/docs-build.tar.gz -C /tmp/mistwarp-docs/build';
const names = steps => steps.map(({step}) => step);
const sequence = steps => names(steps).filter(step => step !== EXTRACT_DOCS);

test('updates the forks, then installs once without their build scripts', async () => {
    const {steps} = await runCloudflareBuild();
    expect(sequence(steps)).toEqual([
        'scripts/sync-forks.mjs',
        'pnpm install --no-frozen-lockfile --ignore-scripts',
        'pnpm run prepublish',
        'scripts/build.mjs --site-only'
    ]);
});

test('hands the downloaded docs to the site build', async () => {
    const {steps} = await runCloudflareBuild();
    expect(names(steps).indexOf(EXTRACT_DOCS)).toBeLessThan(names(steps).indexOf('scripts/build.mjs --site-only'));
    const build = steps.find(({step}) => step === 'scripts/build.mjs --site-only');
    expect(build.env.MW_DOCS_BUILD).toBe('/tmp/mistwarp-docs/build');
    expect(build.env.MW_COMMUNITY).toBe('true');
});

test('builds the docs from source when the published archive is behind master', async () => {
    const {steps} = await runCloudflareBuild({publishedCommit: 'b'.repeat(40)});
    expect(names(steps)).not.toContain(EXTRACT_DOCS);
    expect(steps.at(-1).env.MW_DOCS_BUILD).toBeUndefined();
});

test('builds the docs from source when the archive cannot be downloaded', async () => {
    const {steps} = await runCloudflareBuild({archiveStatus: 404});
    expect(steps.at(-1).env.MW_DOCS_BUILD).toBeUndefined();
});

test('MW_PINNED_FORKS keeps the committed pins and lockfile', async () => {
    const {steps} = await runCloudflareBuild({env: {MW_PINNED_FORKS: '1'}});
    expect(names(steps)).not.toContain('scripts/sync-forks.mjs');
    expect(names(steps)).toContain('pnpm install --frozen-lockfile --ignore-scripts');
});

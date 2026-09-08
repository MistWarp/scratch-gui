/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runBuild = async (initialEnv = {}, args = ['--site-only']) => {
    let head = 'commit-at-build-start';
    const identities = [];
    const builds = [];
    const environment = {...initialEnv};
    const source = fs.readFileSync(path.resolve(__dirname, '../../../scripts/build.mjs'), 'utf8')
        .replace(/^import .*;\n/gm, '');
    const context = {
        process: {env: environment, argv: ['node', 'build.mjs', ...args],
            cwd: () => '/test', execPath: '/node'},
        loadEnv: () => ({}),
        build: async () => {
            builds.push({...environment});
            identities.push(environment.MW_BUILD_ID || environment.GITHUB_SHA || head);
            // A commit made while the first compilation is running must not
            // change the identity of the library build or version.json.
            head = 'commit-made-during-build';
        },
        execFileSync: (command, args) => {
            if (command === 'git') return head;
            if (args[0] === 'scripts/write-version.mjs') {
                identities.push(environment.MW_BUILD_ID || environment.GITHUB_SHA || head);
            }
        }
    };
    await vm.runInNewContext(`(async () => {${source}})()`, context);
    return {identities, environment, builds};
};

test('all build passes and version.json use the commit captured before compilation', async () => {
    const {identities} = await runBuild();
    expect(identities).toEqual(Array(2).fill('commit-at-build-start'));
});

test('an explicit deployment identity is kept for every build output', async () => {
    const {identities, environment} = await runBuild({MW_BUILD_ID: 'release-id', MW_BUILD_TIME: 'release-time'});
    expect(identities).toEqual(Array(2).fill('release-id'));
    expect(environment.MW_BUILD_TIME).toBe('release-time');
});

test('CI identity takes precedence over the checkout commit', async () => {
    const {identities} = await runBuild({GITHUB_SHA: 'ci-commit'});
    expect(identities).toEqual(Array(2).fill('ci-commit'));
});

test('deployment compiles every site entry in one pass', async () => {
    const {builds} = await runBuild({BUILD_DIR: 'deploy-build', MW_COMMUNITY: 'true'});
    expect(builds).toHaveLength(1);
    expect(builds[0].ONLY_ENTRY).toBeUndefined();
    expect(builds[0].MW_SKIP_EDITOR).toBeUndefined();
    expect(builds[0].BUILD_DIR).toBe('deploy-build');
});

test('build:all compiles the site once and then the library with the same identity', async () => {
    const {builds, identities} = await runBuild({}, []);
    expect(builds).toHaveLength(2);
    expect(builds[0].BUILD_MODE).toBeUndefined();
    expect(builds[1].BUILD_MODE).toBe('dist');
    expect(identities).toEqual(Array(3).fill('commit-at-build-start'));
});

test('standalone editor builds retain their selected entry without building the library', async () => {
    const {builds} = await runBuild({ONLY_ENTRY: 'editor'}, []);
    expect(builds).toHaveLength(1);
    expect(builds[0].ONLY_ENTRY).toBe('editor');
    expect(builds[0].BUILD_MODE).toBeUndefined();
});

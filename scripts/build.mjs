import {build, loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';

const env = {...loadEnv('production', process.cwd(), ''), ...process.env};
const siteOnly = process.argv.includes('--site-only');
if (!env.ONLY_ENTRY && env.BUILD_MODE !== 'dist') {
    // Rollup can inline imports only for a single entry. Build the other pages
    // first, then add the complete editor bundle to the same output directory.
    process.env.MW_SKIP_EDITOR = 'true';
    await build();
    delete process.env.MW_SKIP_EDITOR;
    process.env.ONLY_ENTRY = 'editor';
    process.env.MW_KEEP_BUILD = 'true';
    await build();
    delete process.env.ONLY_ENTRY;
    delete process.env.MW_KEEP_BUILD;
} else {
    await build();
}
execFileSync(process.execPath, ['scripts/write-version.mjs', env.BUILD_DIR || 'build'], {stdio: 'inherit'});
if (!siteOnly && !env.ONLY_ENTRY) {
    process.env.BUILD_MODE = 'dist';
    await build();
}

import {build, loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';

const env = {...loadEnv('production', process.cwd(), ''), ...process.env};
const siteOnly = process.argv.includes('--site-only');
await build();
execFileSync(process.execPath, ['scripts/write-version.mjs', env.BUILD_DIR || 'build'], {stdio: 'inherit'});
if (!siteOnly && !env.ONLY_ENTRY) {
    process.env.BUILD_MODE = 'dist';
    await build();
}

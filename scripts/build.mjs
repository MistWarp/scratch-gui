import {build, loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const env = {...loadEnv('production', process.cwd(), ''), ...process.env};
// Capture once: HEAD can change during a long build. The Vite builds and the
// version.json child process must identify the same build, even after a commit.
process.env.MW_BUILD_ID = env.MW_BUILD_ID || env.GITHUB_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
process.env.MW_BUILD_TIME = env.MW_BUILD_TIME || new Date().toISOString();
if (env.CF_PAGES && !env.MW_PINNED_FORKS) {
    execFileSync(process.execPath, ['scripts/sync-forks.mjs'], {stdio: 'inherit'});
    execFileSync('pnpm', ['install', '--no-frozen-lockfile'], {stdio: 'inherit'});
}
if ((env.CF_PAGES || env.MW_BUILD_DOCS) && !env.MW_DOCS_BUILD && !fs.existsSync('../docs/build')) {
    process.env.MW_DOCS_BUILD = path.join(os.tmpdir(), 'mistwarp-docs', 'build');
    execFileSync(process.execPath, ['scripts/build-docs.mjs', process.env.MW_DOCS_BUILD], {stdio: 'inherit'});
}
const siteOnly = process.argv.includes('--site-only');
// Compile all selected pages together so the editor, player, and community
// share modules. ONLY_ENTRY=editor still produces a standalone editor bundle.
await build();
execFileSync(process.execPath, ['scripts/write-version.mjs', env.BUILD_DIR || 'build'], {stdio: 'inherit'});
if (!siteOnly && !env.ONLY_ENTRY) {
    process.env.BUILD_MODE = 'dist';
    await build();
}

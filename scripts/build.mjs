import {build, loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';

const env = {...loadEnv('production', process.cwd(), ''), ...process.env};
// Capture once: HEAD can change during a long build. The Vite builds and the
// version.json child process must identify the same build, even after a commit.
process.env.MW_BUILD_ID = env.MW_BUILD_ID || env.GITHUB_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
process.env.MW_BUILD_TIME = env.MW_BUILD_TIME || new Date().toISOString();
const siteOnly = process.argv.includes('--site-only');
// Compile all selected pages together so the editor, player, and community
// share modules. ONLY_ENTRY=editor still produces a standalone editor bundle.
await build();
execFileSync(process.execPath, ['scripts/write-version.mjs', env.BUILD_DIR || 'build'], {stdio: 'inherit'});
if (!siteOnly && !env.ONLY_ENTRY) {
    process.env.BUILD_MODE = 'dist';
    await build();
}

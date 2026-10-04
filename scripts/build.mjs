import {build, loadEnv} from 'vite';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {resolveBuildId} from './build-id.mjs';

// Flags stand in for environment variables so that the package.json scripts also run
// on Windows, where `FOO=bar command` does not work:
//   --entry=<name>    ONLY_ENTRY=<name>: build one page (see vite.config.mjs)
//   --community       MW_COMMUNITY=true: include the community site
//   --no-community    MW_COMMUNITY empty: leave it out, even when .env turns it on
//   --stats           MW_BUILD_STATS=true: write stats.json and report compressed sizes
//   --library         BUILD_MODE=dist: build only the GUI library into dist/
//   --site-only       build the site without the library
// A community build needs more memory than Node's default. The package.json scripts
// run this file with --max-old-space-size=7168.
const flags = process.argv.slice(2);
for (const flag of flags) {
    if (flag.startsWith('--entry=')) process.env.ONLY_ENTRY = flag.slice('--entry='.length);
    else if (flag === '--community') process.env.MW_COMMUNITY = 'true';
    else if (flag === '--no-community') process.env.MW_COMMUNITY = '';
    else if (flag === '--stats') process.env.MW_BUILD_STATS = 'true';
    else if (flag === '--library') process.env.BUILD_MODE = 'dist';
    else if (flag !== '--site-only') throw new Error(`Unknown build flag: ${flag}`);
}
const libraryOnly = flags.includes('--library');

const env = {...loadEnv('production', process.cwd(), ''), ...process.env};
// Capture once: HEAD can change during a long build. The Vite builds and the
// version.json child process must identify the same build, even after a commit.
process.env.MW_BUILD_ID = resolveBuildId(env);
process.env.MW_BUILD_TIME = env.MW_BUILD_TIME || new Date().toISOString();
if (libraryOnly) {
    await build();
} else {
    if ((env.CF_PAGES || env.MW_BUILD_DOCS) && !env.MW_DOCS_BUILD && !fs.existsSync('../docs/build')) {
        process.env.MW_DOCS_BUILD = path.join(os.tmpdir(), 'mistwarp-docs', 'build');
        execFileSync(process.execPath, ['scripts/build-docs.mjs', process.env.MW_DOCS_BUILD], {stdio: 'inherit'});
    }
    const siteOnly = flags.includes('--site-only');
    // Compile all selected pages together so the editor, player, and community
    // share modules. ONLY_ENTRY=editor still produces a standalone editor bundle.
    await build();
    execFileSync(process.execPath, ['scripts/write-version.mjs', env.BUILD_DIR || 'build'], {stdio: 'inherit'});
    if (!siteOnly && !env.ONLY_ENTRY) {
        process.env.BUILD_MODE = 'dist';
        await build();
    }
}

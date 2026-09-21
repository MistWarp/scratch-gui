import fs from 'node:fs';
import path from 'node:path';

// `pnpm link ../scratch-blocks` rewrites package.json with a `link:` override, and those
// overrides have been committed before now. Cloudflare Pages and the Actions runners build
// scratch-gui on its own with no sibling checkouts, so a committed `link:` override points
// the build at a directory that is not there. node-linker=hoisted gives us a flat
// node_modules, so pointing each symlink at the sibling by hand does the same job for local
// development without touching the manifest.
const forks = ['scratch-audio', 'scratch-blocks', 'scratch-paint', 'scratch-render', 'scratch-vm'];
const unlink = process.argv.includes('--unlink');

for (const name of forks) {
    const installed = path.join('node_modules', name);
    const sibling = path.join('..', name);
    if (unlink) {
        if (fs.lstatSync(installed, {throwIfNoEntry: false})?.isSymbolicLink()) fs.unlinkSync(installed);
        continue;
    }
    if (!fs.existsSync(sibling)) {
        console.error(`${sibling} is not checked out, clone MistWarp/${name} next to scratch-gui`);
        process.exit(1);
    }
    fs.rmSync(installed, {recursive: true, force: true});
    fs.symlinkSync(path.join('..', sibling), installed, 'junction');
    console.log(`${name} -> ${sibling}`);
}

console.log(unlink ?
    'forks unlinked, run `pnpm install` to restore the pinned copies' :
    'forks linked, run `pnpm install` to go back to the pinned copies');

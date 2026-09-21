import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

// The engine packages live in their own MistWarp repositories. Cloudflare Pages and
// the Actions runners build scratch-gui on its own, so they cannot use the sibling
// checkouts that `pnpm run link` wires up locally: package.json has to pin every fork
// to an immutable codeload tarball instead. Those pins only stay correct if something
// moves them, which is what this script does.
const forks = {
    'scratch-audio': ['MistWarp/scratch-audio', 'develop'],
    'scratch-blocks': ['MistWarp/scratch-blocks', 'develop'],
    'scratch-paint': ['MistWarp/scratch-paint', 'develop'],
    'scratch-render': ['MistWarp/scratch-render', 'develop'],
    'scratch-vm': ['MistWarp/scratch-vm', 'develop']
};

const check = process.argv.includes('--check');
const tarball = (repo, commit) => `https://codeload.github.com/${repo}/tar.gz/${commit}`;

const head = (repo, branch) => {
    const output = execFileSync('git',
        ['ls-remote', `https://github.com/${repo}`, `refs/heads/${branch}`], {encoding: 'utf8'});
    const commit = output.split(/\s/)[0];
    if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`${repo} has no branch ${branch}`);
    return commit;
};

const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// Each importer entry in the lockfile repeats the package.json range. When the two
// disagree, `pnpm install --frozen-lockfile` installs something nobody asked for,
// which is how a months-old scratch-blocks reached production.
const lockSpecifiers = Object.fromEntries([...fs.readFileSync('pnpm-lock.yaml', 'utf8')
    .matchAll(/^ {6}(scratch-[\w-]+):\n {8}specifier: (.+)$/gm)].map(match => [match[1], match[2]]));

const broken = [];
const stale = [];
// `pnpm link` used to write these, and committing one points the standalone builds at a
// sibling checkout that only exists on a developer's machine. `pnpm run link` symlinks
// node_modules directly now, so an override here means someone reached for `pnpm link`.
for (const [name, override] of Object.entries(manifest.pnpm.overrides)) {
    if (override.startsWith('link:')) broken.push(`${name} has a "${override}" override, use \`pnpm run link\``);
}
for (const [name, [repo, branch]] of Object.entries(forks)) {
    const pinned = manifest.dependencies[name];
    if (!pinned) {
        broken.push(`${name} is missing from dependencies`);
        continue;
    }
    const commit = pinned.startsWith(tarball(repo, '')) && pinned.slice(tarball(repo, '').length);
    if (!/^[0-9a-f]{40}$/.test(commit || '')) {
        broken.push(`${name} is "${pinned}", expected a ${repo} tarball pinned to a commit`);
        continue;
    }
    if (lockSpecifiers[name] !== pinned) {
        broken.push(`${name} is "${pinned}" in package.json but "${lockSpecifiers[name]}" in pnpm-lock.yaml`);
        continue;
    }
    const latest = head(repo, branch);
    if (latest !== commit) stale.push([name, repo, commit, latest]);
}

if (broken.length) {
    console.error(`${broken.join('\n')}\nRun \`pnpm run deps:sync\` to repin the forks.`);
    process.exit(1);
}

if (check) {
    for (const [name, repo, commit, latest] of stale) {
        // A fork moving ahead is normal and should not fail unrelated pull requests;
        // the scheduled sync-forks workflow opens a pull request to catch us up.
        console.log(`::warning::${name} is pinned to ${commit.slice(0, 8)}, ` +
            `${repo} develop is at ${latest.slice(0, 8)}`);
    }
    console.log(`fork pins ok${stale.length ? ` (${stale.length} behind)` : ''}`);
    process.exit(0);
}

if (!stale.length) {
    console.log('fork pins already up to date');
    process.exit(0);
}

let source = fs.readFileSync('package.json', 'utf8');
for (const [name, repo, commit, latest] of stale) {
    source = source.replace(`"${name}": "${tarball(repo, commit)}"`, `"${name}": "${tarball(repo, latest)}"`);
    console.log(`${name} ${commit.slice(0, 8)} -> ${latest.slice(0, 8)}`);
}
fs.writeFileSync('package.json', source);
console.log('package.json updated, run `pnpm install --no-frozen-lockfile` to refresh the lockfile');

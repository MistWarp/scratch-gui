import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

const outputDir = path.resolve(process.argv[2] || 'build');

const resolveSha = () => {
    if (process.env.MW_BUILD_ID) return process.env.MW_BUILD_ID;
    if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
    try {
        return execSync('git rev-parse HEAD', {encoding: 'utf8'}).trim();
    } catch (e) {
        return 'dev';
    }
};

const FORK_TARBALL = /^https:\/\/codeload\.github\.com\/MistWarp\/[\w.-]+\/tar\.gz\/([0-9a-f]{40})$/;

const forkCommits = () => {
    try {
        const {dependencies} = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return Object.fromEntries(Object.entries(dependencies)
            .map(([name, spec]) => [name, String(spec).match(FORK_TARBALL)])
            .filter(([, match]) => match)
            .map(([name, match]) => [name, match[1]]));
    } catch (e) {
        return {};
    }
};

const version = {
    id: resolveSha(),
    forks: forkCommits(),
    runId: process.env.GITHUB_RUN_ID || null,
    time: process.env.MW_BUILD_TIME || new Date().toISOString()
};

fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(path.join(outputDir, 'version.json'), `${JSON.stringify(version)}\n`);
console.log(`Wrote version.json: ${JSON.stringify(version)}`);

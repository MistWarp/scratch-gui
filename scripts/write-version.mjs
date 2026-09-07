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

const version = {
    id: resolveSha(),
    runId: process.env.GITHUB_RUN_ID || null,
    time: process.env.MW_BUILD_TIME || new Date().toISOString()
};

fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(path.join(outputDir, 'version.json'), `${JSON.stringify(version)}\n`);
console.log(`Wrote version.json: ${JSON.stringify(version)}`);

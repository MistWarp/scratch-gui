import {execFileSync} from 'node:child_process';

export const gitCommit = () => {
    try {
        return execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']})
            .trim();
    } catch (e) {
        return 'dev';
    }
};

export const resolveBuildId = env => env.MW_BUILD_ID || env.GITHUB_SHA || gitCommit();

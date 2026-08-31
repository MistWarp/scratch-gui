import {getFileContentAtCommit, computeLineDiff} from './git-diff.js';
import {getFs, REPO_DIR, git} from './browser-git.js';

const readWorkingText = async (pfs, filepath) => {
    try {
        const value = await pfs.readFile(`${REPO_DIR}/${filepath}`, 'utf8');
        return typeof value === 'string' ? value : new TextDecoder().decode(value);
    } catch (error) {
        return '';
    }
};

const range = (start, length) => `${start},${length}`;

const formatFileDiff = async ({filepath, description}, head, pfs, fs) => {
    let before = '';
    if (head && description !== 'untracked') {
        before = (await getFileContentAtCommit({fs, dir: REPO_DIR, oid: head, filepath})).text || '';
    }
    const after = description === 'deleted' ? '' : await readWorkingText(pfs, filepath);
    const diff = await computeLineDiff(before, after);
    const oldPath = description === 'untracked' ? '/dev/null' : `a/${filepath}`;
    const newPath = description === 'deleted' ? '/dev/null' : `b/${filepath}`;
    const lines = [
        `diff --git a/${filepath} b/${filepath}`,
        `--- ${oldPath}`,
        `+++ ${newPath}`
    ];
    for (const hunk of diff.hunks || []) {
        lines.push(`@@ -${range(hunk.oldStart, hunk.oldLines)} +${range(hunk.newStart, hunk.newLines)} @@`);
        for (const change of hunk.changes || []) {
            lines.push(`${change.type === 'add' ? '+' : '-'}${change.content}`);
        }
    }
    return lines.join('\n');
};

const getFractchGitDiff = async changes => {
    const fractchChanges = (changes || []).filter(change => /\.fractch$/i.test(change.filepath || ''));
    if (!fractchChanges.length) throw new Error('There are no changed Fractch files to name.');
    const fs = getFs();
    const pfs = fs.promises;
    let head = '';
    try {
        head = await git.resolveRef({fs, dir: REPO_DIR, ref: 'HEAD'});
    } catch (error) {
        head = '';
    }
    const parts = [];
    for (const change of fractchChanges) {
        parts.push(await formatFileDiff(change, head, pfs, fs));
    }
    return parts.join('\n\n');
};

export {getFractchGitDiff};

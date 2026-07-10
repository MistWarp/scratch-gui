/**
 * Git diff utilities for file comparison
 * Integrates with isomorphic-git and MyersDiff
 */

import git from 'isomorphic-git';
import MyersDiff from './diff-utils.js';

export {MyersDiff};

/**
 * Get file content at a specific commit
 * @param {object} fs - Filesystem object
 * @param {string} dir - Repository directory
 * @param {string} oid - Commit or tree OID
 * @param {string} filepath - Path to file (relative to repo root)
 * @returns {Promise<{text: string|null, oid: string|null}>}
 */
export const getFileContentAtCommit = async ({fs, dir, oid, filepath}) => {
    if (!fs || !dir || !oid || !filepath) {
        throw new Error('Missing required parameters');
    }

    try {
        const {blob} = await git.readBlob({fs, dir, oid, filepath});
        
        if (!blob) {
            return {text: null, oid: null};
        }

        const uint8Array = blob instanceof Uint8Array ? blob : new Uint8Array(blob);
        let text;

        try {
            text = new TextDecoder().decode(uint8Array);
        } catch (e) {
            text = Array.from(uint8Array).map(b => String.fromCharCode(b))
                .join('');
        }

        return {text, oid: oid};
    } catch (e) {
        if (e && e.code === 'NotFoundError') {
            return {text: null, oid: null};
        }
        throw e;
    }
};

/**
 * Get the tree at a specific commit
 * @param {object} fs - Filesystem object
 * @param {string} dir - Repository directory
 * @param {string} commitOid - Commit OID
 * @returns {Promise<{oid: string, tree: object}>}
 */
export const getTreeAtCommit = async ({fs, dir, commitOid}) => {
    if (!fs || !dir || !commitOid) {
        throw new Error('Missing required parameters');
    }

    const {commit} = await git.readCommit({fs, dir, oid: commitOid});
    const treeOid = commit.tree;
    const {tree} = await git.readTree({fs, dir, oid: treeOid});

    return {oid: treeOid, tree, commit};
};

/**
 * List all files in a tree recursively
 * @param {object} fs - Filesystem object
 * @param {string} dir - Repository directory
 * @param {string} treeOid - Tree OID
 * @returns {Promise<Array<{path: string, mode: number, oid: string}>>}
 */
export const listFilesInTree = async ({fs, dir, treeOid, basePath = ''}) => {
    const files = [];
    const {tree} = await git.readTree({fs, dir, oid: treeOid});

    for (const entry of tree) {
        const fullPath = basePath ? `${basePath}/${entry.path}` : entry.path;

        if (entry.type === 'blob') {
            files.push({
                path: fullPath,
                mode: entry.mode,
                oid: entry.oid,
                type: 'blob'
            });
        } else if (entry.type === 'tree') {
            const subFiles = await listFilesInTree({fs, dir, treeOid: entry.oid, basePath: fullPath});
            files.push(...subFiles);
        }
    }

    return files;
};

/**
 * Get changed files between two commits
 * @param {object} fs - Filesystem object
 * @param {string} dir - Repository directory
 * @param {string} oidA - First commit OID
 * @param {string} oidB - Second commit OID
 * @returns {Promise<Array<{path: string, type: 'added'|'removed'|'modified', oidA: string|null, oidB: string|null}>>}
 */
export const getChangedFilesBetweenCommits = async ({fs, dir, oidA, oidB}) => {
    if (!fs || !dir || !oidA || !oidB) {
        throw new Error('Missing required parameters');
    }

    const treeA = await listFilesInTree({fs, dir, treeOid: (await git.readCommit({fs, dir, oid: oidA})).commit.tree});
    const treeB = await listFilesInTree({fs, dir, treeOid: (await git.readCommit({fs, dir, oid: oidB})).commit.tree});

    const mapA = new Map(treeA.map(f => [f.path, f]));
    const mapB = new Map(treeB.map(f => [f.path, f]));

    const changedFiles = [];

    const allPaths = new Set([...mapA.keys(), ...mapB.keys()]);

    for (const path of allPaths) {
        const fileA = mapA.get(path);
        const fileB = mapB.get(path);

        if (!fileA) {
            changedFiles.push({
                path,
                type: 'added',
                oidA: null,
                oidB: fileB.oid
            });
        } else if (!fileB) {
            changedFiles.push({
                path,
                type: 'removed',
                oidA: fileA.oid,
                oidB: null
            });
        } else if (fileA.oid !== fileB.oid) {
            changedFiles.push({
                path,
                type: 'modified',
                oidA: fileA.oid,
                oidB: fileB.oid
            });
        }
    }

    return changedFiles;
};

/**
 * Get parent commits of a commit
 * @param {object} fs - Filesystem object
 * @param {string} dir - Repository directory
 * @param {string} oid - Commit OID
 * @returns {Promise<string[]>} Array of parent OIDs
 */
export const getCommitParents = async ({fs, dir, oid}) => {
    try {
        const {commit} = await git.readCommit({fs, dir, oid});
        return Array.isArray(commit.parent) ? commit.parent : [commit.parent].filter(Boolean);
    } catch (e) {
        return [];
    }
};

/**
 * Compute line diff between two texts
 * @param {string} contentA - Original content
 * @param {string} contentB - Modified content
 * @param {object} options - Options for diff computation
 * @param {boolean} options.ignoreWhitespace - Ignore whitespace changes
 * @returns {Promise<DiffResult>}
 */
export const computeLineDiff = async (contentA, contentB, options = {}) => {
    const {ignoreWhitespace = false} = options;

    let processedA = contentA || '';
    let processedB = contentB || '';

    if (ignoreWhitespace) {
        processedA = normalizeWhitespace(processedA);
        processedB = normalizeWhitespace(processedB);
    }

    return MyersDiff.compute(processedA, processedB);
};

/**
 * Normalize whitespace by removing leading/trailing and collapsing runs of spaces
 * @param {string} text
 * @returns {string}
 */
function normalizeWhitespace (text) {
    return text
        .split('\n')
        .map(line => line.trim().replace(/\s+/g, ' '))
        .join('\n');
}

/**
 * Get simplified change type comparison
 * @param {string} typeA
 * @param {string} typeB
 * @returns {string}
 */
export const getChangeType = (typeA, typeB) => {
    if (!typeA) return 'add';
    if (!typeB) return 'remove';
    if (typeA !== typeB) return 'modify';
    return 'none';
};

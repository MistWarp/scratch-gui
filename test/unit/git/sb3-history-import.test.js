import JSZip from 'jszip';

jest.mock('@isomorphic-git/lightning-fs', () => class MemoryFs {
    constructor () {
        const directories = new Set(['/']);
        const files = new Map();
        const parent = path => path.slice(0, path.lastIndexOf('/')) || '/';
        this.promises = {
            mkdir: async path => {
                if (directories.has(path)) {
                    const error = new Error('exists');
                    error.code = 'EEXIST';
                    throw error;
                }
                directories.add(path);
            },
            stat: async path => {
                if (directories.has(path)) return {isDirectory: () => true};
                if (files.has(path)) return {isDirectory: () => false};
                const error = new Error('missing');
                error.code = 'ENOENT';
                throw error;
            },
            readdir: async path => {
                const prefix = path === '/' ? '/' : `${path}/`;
                return [...directories, ...files.keys()]
                    .filter(item => item !== path && item.startsWith(prefix))
                    .map(item => item.slice(prefix.length).split('/')[0])
                    .filter((item, index, items) => item && items.indexOf(item) === index);
            },
            rmdir: async path => directories.delete(path),
            unlink: async path => files.delete(path),
            writeFile: async (path, data) => {
                if (!directories.has(parent(path))) throw new Error('missing parent');
                files.set(path, data);
            },
            readFile: async path => {
                if (!files.has(path)) throw new Error('missing');
                return files.get(path);
            }
        };
    }
});

import {
    deleteRepo,
    getFs,
    importRepoFromSb3,
    repoExists,
    REPO_DIR
} from '../../../src/lib/git/browser-git.js';

const makePlainSb3 = async () => {
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify({targets: []}));
    return zip.generateAsync({type: 'uint8array'});
};

const makeExistingRepo = async () => {
    const pfs = getFs().promises;
    await pfs.mkdir(REPO_DIR).catch(error => {
        if (error.code !== 'EEXIST') throw error;
    });
    await pfs.mkdir(`${REPO_DIR}/.git`).catch(error => {
        if (error.code !== 'EEXIST') throw error;
    });
    await pfs.writeFile(`${REPO_DIR}/.git/history-marker`, 'parent history');
};

describe('SB3 history import', () => {
    beforeEach(() => deleteRepo());
    afterEach(() => deleteRepo());

    test('keeps online project history when a plain SB3 replaces its contents', async () => {
        await makeExistingRepo();

        await importRepoFromSb3(await makePlainSb3(), {preserveExisting: true});

        expect(await repoExists()).toBe(true);
        const marker = await getFs().promises.readFile(`${REPO_DIR}/.git/history-marker`, {encoding: 'utf8'});
        expect(marker).toBe('parent history');
    });

    test('clears unrelated history for a standalone plain SB3 load', async () => {
        await makeExistingRepo();

        await importRepoFromSb3(await makePlainSb3());

        expect(await repoExists()).toBe(false);
    });
});

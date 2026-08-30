jest.mock('isomorphic-git', () => ({
    __esModule: true,
    default: {
        add: jest.fn(),
        commit: jest.fn(),
        init: jest.fn(),
        resolveRef: jest.fn(),
        statusMatrix: jest.fn()
    },
    Errors: {}
}));

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
            readFile: async path => files.get(path)
        };
        mockGit.init.mockImplementation(async ({dir}) => {
            directories.add(`${dir}/.git`);
        });
    }
});

jest.mock('../../../src/lib/git/fractch-tree.js', () => ({
    writeProjectToFractchTree: jest.fn(),
    buildSb3FromFractchTree: jest.fn()
}));

import {commitProject, deleteRepo} from '../../../src/lib/git/browser-git.js';

const mockGit = jest.requireMock('isomorphic-git').default;

describe('initial project commit', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        mockGit.commit.mockResolvedValue('first-commit');
        mockGit.resolveRef.mockResolvedValue('first-commit');
        mockGit.statusMatrix.mockResolvedValue([]);
        await deleteRepo();
    });

    afterEach(() => deleteRepo());

    test('uses the requested commit as the baseline instead of creating an empty second commit', async () => {
        const author = {name: 'Mist', email: 'mist@example.com'};

        await expect(commitProject({
            sb3Files: {'project.json': new Uint8Array([1])},
            message: 'game save data',
            author,
            rememberAuthor: false
        })).resolves.toBe('first-commit');

        expect(mockGit.commit).toHaveBeenCalledTimes(1);
        expect(mockGit.commit).toHaveBeenCalledWith(expect.objectContaining({
            message: 'game save data',
            author
        }));
        expect(mockGit.resolveRef).toHaveBeenCalledWith(expect.objectContaining({ref: 'HEAD'}));
    });
});

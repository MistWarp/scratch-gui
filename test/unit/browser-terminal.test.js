import {TextDecoder, TextEncoder} from 'util';

Object.defineProperty(global, 'TextDecoder', {value: TextDecoder, configurable: true});
Object.defineProperty(global, 'TextEncoder', {value: TextEncoder, configurable: true});

jest.mock('../../src/lib/git/browser-git', () => ({
    REPO_DIR: '/repo',
    deleteWorktreeFile: jest.fn(),
    getDefaultAuthor: jest.fn(),
    getFs: jest.fn(),
    git: {},
    listWorktreeFiles: jest.fn(() => Promise.resolve(['Sprite/project.json'])),
    readWorktreeFile: jest.fn(() => Promise.resolve(new Uint8Array())),
    writeWorktreeFile: jest.fn()
}));

test('carries the resulting directory into the next command', async () => {
    const {runBrowserCommand} = require('../../src/lib/git/browser-terminal');
    const changed = await runBrowserCommand('cd Sprite', '/repo');
    expect(changed.cwd).toBe('/repo/Sprite');
    expect((await runBrowserCommand('pwd', changed.cwd)).stdout).toBe('/repo/Sprite\n');
});

import {exportProject} from '../../src/packager/export-project';
import Packager from '../../src/packager/packager/web/export';
import {downloadProject} from '../../src/packager/packager/download-project';
import {verifyBuildId} from '../../src/packager/packager/build-id';

jest.mock('../../src/packager/packager/web/export', () => jest.fn());
jest.mock('virtual:packager-runtime', () => ({buildId: 'test'}), {virtual: true});
jest.mock('../../src/packager/packager/download-project', () => ({downloadProject: jest.fn()}));

beforeEach(() => {
    jest.clearAllMocks();
    Packager.mockImplementation(() => ({
        abort: jest.fn(), addEventListener: jest.fn(),
        package: jest.fn().mockResolvedValue({data: '<html></html>', type: 'text/html', filename: 'Project.html'})
    }));
    downloadProject.mockResolvedValue({type: 'sb3', analysis: {}});
});

test('every export takes a fresh snapshot from the current editor VM', async () => {
    const first = new ArrayBuffer(1);
    const second = new ArrayBuffer(2);
    const vm = {saveProjectSb3: jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second)};
    const controller = new AbortController();
    const args = {vm, options: {target: 'html'}, signal: controller.signal, onProgress: jest.fn()};
    const result = await exportProject(args);
    await exportProject(args);
    expect(vm.saveProjectSb3).toHaveBeenCalledTimes(2);
    expect(downloadProject.mock.calls.map(call => call[0])).toEqual([first, second]);
    expect(result.blob.type).toBe('text/html');
});

test('cancelled project preparation cannot continue into packaging', async () => {
    let resolve;
    const vm = {saveProjectSb3: jest.fn(() => new Promise(done => { resolve = done; }))};
    const controller = new AbortController();
    const pending = exportProject({vm, options: {}, signal: controller.signal, onProgress: jest.fn()});
    controller.abort();
    resolve(new ArrayBuffer(0));
    await expect(pending).rejects.toMatchObject({name: 'AbortError'});
    expect(downloadProject).not.toHaveBeenCalled();
});

test('runtime validation rejects stale deployments and accepts unstamped runtimes', () => {
    expect(verifyBuildId('current', 'runtime code\n// current =^..^=')).toBe(true);
    expect(verifyBuildId('current', 'runtime code\n// previous =^..^=')).toBe(false);
    // Development builds of the standalone packager do not stamp their runtimes.
    expect(verifyBuildId('current', 'runtime code')).toBe(true);
});

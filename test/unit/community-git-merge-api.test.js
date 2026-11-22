jest.mock('../../src/lib/community/api.js', () => ({
    request: jest.fn(() => Promise.resolve({ok: true})),
    uploadProject: jest.fn(() => Promise.resolve({ok: true}))
}));

import {request, uploadProject} from '../../src/lib/community/api.js';
import git from '../../src/community/api/git.js';

describe('merge uploads', () => {
    beforeEach(() => {
        request.mockClear();
        uploadProject.mockClear();
    });

    test('pull request merges name the remix head they were prepared from', async () => {
        await git.uploadPullMerge('target', {sb3: 'sb3', mergeTree: 'tree', expectedHead: 'a', pullId: 2, sourceHead: 'b'});
        expect(uploadProject).toHaveBeenCalledWith('target', 'sb3', null, null, {
            mergeTree: 'tree', expectedHead: 'a', pullId: 2, mergeSourceHead: 'b'
        });
    });

    test('a remix sync is prepared on the server and uploaded with both heads', async () => {
        await git.syncRemix('remix');
        expect(request).toHaveBeenCalledWith('/projects/remix/remix/sync', expect.objectContaining({method: 'POST'}));
        await git.uploadRemixSync('remix', {sb3: 'sb3', mergeTree: 'tree', expectedHead: 'a', syncHead: 'c'});
        expect(uploadProject).toHaveBeenCalledWith('remix', 'sb3', null, null, {
            mergeTree: 'tree', expectedHead: 'a', syncHead: 'c'
        });
    });
});

jest.mock('../../../src/lib/community/api', () => ({request: jest.fn(() => Promise.resolve())}));

test('reports build identity and project IDs from editor hashes', async () => {
    const {request} = require('../../../src/lib/community/api');
    const {reportSiteError} = require('../../../src/lib/error-reporter');
    const {BUILD_ID} = require('../../../src/lib/build-version');
    reportSiteError({message: 'Test asset failure', url: 'https://mistwarp.org/editor#mw-p123'});
    expect(request).toHaveBeenCalledWith('/errors', expect.objectContaining({body: expect.objectContaining({
        projectId: 'p123', appVersion: BUILD_ID, message: 'Test asset failure'
    })}));
    await Promise.resolve();
});

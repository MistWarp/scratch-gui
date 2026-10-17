import {cleanContext, createFrameActivity} from '../../../src/lib/account/frame-activity.js';

const NOW = 1792200000000;

test('activity from the editor is trimmed to what presence shows', () => {
    expect(cleanContext({
        projectTitle: `  My game\u0000\n${'x'.repeat(300)}`,
        doing: 'Editing costume "walk"',
        collaborating: 'yes',
        url: 'https://mistwarp.org/project/p123',
        editingSince: NOW - 60000,
        extra: 'dropped'
    }, NOW)).toEqual({
        projectTitle: `My game  ${'x'.repeat(191)}`,
        doing: 'Editing costume "walk"',
        collaborating: false,
        url: 'https://mistwarp.org/project/p123',
        editingSince: NOW - 60000
    });
});

test('only MistWarp project links reach the Rotur profile', () => {
    for (const url of [
        'https://evil.example/project/p1',
        'https://mistwarp.org.evil.example/project/p1',
        'https://mistwarp.org/project/p1/../../admin',
        'https://mistwarp.org/users/someone',
        'javascript:alert(1)',
        42
    ]) {
        expect(cleanContext({url}, NOW).url).toBeNull();
    }
});

test('a start time from the future or long ago becomes now', () => {
    expect(cleanContext({editingSince: NOW + 1000}, NOW).editingSince).toBe(NOW);
    expect(cleanContext({editingSince: NOW - (8 * 24 * 60 * 60 * 1000)}, NOW).editingSince).toBe(NOW);
    expect(cleanContext({editingSince: 'soon'}, NOW).editingSince).toBe(NOW);
    expect(cleanContext(null, NOW)).toMatchObject({projectTitle: '', doing: null, url: null});
});

test('the frame publishes the cleaned activity and clears it', async () => {
    const deps = {syncActivity: jest.fn(async () => {}), clearActivity: jest.fn(), now: () => NOW};
    const activity = createFrameActivity(deps);
    await activity.set({context: {projectTitle: 'Game', collaborating: true}});
    expect(deps.syncActivity).toHaveBeenCalledWith(expect.objectContaining({projectTitle: 'Game', collaborating: true}));
    activity.clear();
    expect(deps.clearActivity).toHaveBeenCalled();
});

import {cleanContext, createFrameActivity} from '../../../src/lib/account/frame-activity.js';
import describeActivity from '../../../src/lib/collaboration/describe-activity.js';
import {COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX} from '../../../src/reducers/editor-tab';

const NOW = 1792200000000;

test('activity from the editor is trimmed to what presence shows', () => {
    expect(cleanContext({
        projectTitle: `  My game\u0000\n\t${'x'.repeat(300)}`,
        doing: 'Editing code in Sprite1',
        collaborating: 'yes',
        url: 'https://mistwarp.org/project/p123',
        editingSince: NOW - 60000,
        extra: 'dropped'
    }, NOW)).toEqual({
        projectTitle: `My game ${'x'.repeat(112)}`,
        doing: 'Editing code in Sprite1',
        collaborating: false,
        url: 'https://mistwarp.org/project/p123',
        editingSince: NOW - 60000
    });
});

test('hidden and reordering characters are dropped from presence text', () => {
    const title = 'Game\u202e\u2066\u200b\u2028\u0085\u00ad end';
    expect(cleanContext({projectTitle: title}, NOW).projectTitle).toBe('Game end');
    expect(cleanContext({projectTitle: '\ud83d\udc69\u200d\ud83d\udcbb dev'}, NOW).projectTitle)
        .toBe('\ud83d\udc69\u200d\ud83d\udcbb dev');
    expect(cleanContext({projectTitle: 'a\ud800b'}, NOW).projectTitle).toBe('ab');
    const emoji = '\ud83d\ude00'.repeat(130);
    expect(cleanContext({projectTitle: emoji}, NOW).projectTitle).toBe('\ud83d\ude00'.repeat(120));
});

test('what you are doing must read like the editor wrote it', () => {
    for (const doing of [
        'Editing code in Sprite1',
        'Editing costumes in Cat',
        'Editing backdrops in the Stage',
        'Editing sounds in Cat',
        'Editing costume "walk-a" in Cat'
    ]) {
        expect(cleanContext({doing}, NOW).doing).toBe(doing);
    }
    for (const doing of [
        'Giving away free credits at evil.example',
        'Editing code',
        `Editing code in ${'x'.repeat(121)}`,
        42
    ]) {
        expect(cleanContext({doing}, NOW).doing).toBeNull();
    }
});

test('every description the editor makes passes', () => {
    const sprite = {
        id: 's',
        isStage: false,
        getName: () => 'Sprite1',
        getCostumes: () => [{name: 'walk-a'}],
        getSounds: () => [{name: 'meow'}]
    };
    const stage = {...sprite, id: 'st', isStage: true};
    const vm = {runtime: {getTargetById: id => (id === 's' ? sprite : stage)}};
    for (const targetId of ['s', 'st']) {
        for (const tab of [0, COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX]) {
            for (const assetIndex of [undefined, 0]) {
                const doing = describeActivity(vm, {targetId, tab, assetIndex});
                expect(cleanContext({doing}, NOW).doing).toBe(doing);
            }
        }
    }
});

test('only MistWarp project links reach the Rotur profile', () => {
    for (const url of [
        'https://evil.example/project/p1',
        'https://mistwarp.org.evil.example/project/p1',
        'https://mistwarp.org@evil.example/project/p1',
        'https://mistwarp.org/project/p1/../../admin',
        'https://mistwarp.org/project/p1?next=https://evil.example',
        'https://mistwarp.org/project/p1#x',
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

const setup = lastSent => {
    let time = NOW;
    const timers = [];
    const deps = {
        syncActivity: jest.fn(async () => {}),
        clearActivity: jest.fn(),
        now: () => time,
        setTimer: (fn, wait) => timers.push({fn, at: time + wait}),
        lastSent
    };
    const advance = async ms => {
        time += ms;
        for (const timer of timers.splice(0)) {
            if (timer.at <= time) timer.fn();
            else timers.push(timer);
        }
        await Promise.resolve();
        await Promise.resolve();
    };
    return {deps, activity: createFrameActivity(deps), advance, timers};
};

test('the frame publishes the cleaned activity and clears it', async () => {
    const {deps, activity, advance} = setup();
    activity.set({context: {projectTitle: 'Game', collaborating: true}});
    await advance(0);
    expect(deps.syncActivity).toHaveBeenCalledWith(expect.objectContaining({projectTitle: 'Game', collaborating: true}));
    activity.clear();
    await advance(2000);
    expect(deps.clearActivity).toHaveBeenCalledTimes(1);
});

test('a flood of updates reaches Rotur at most once every two seconds, newest last', async () => {
    const {deps, activity, advance} = setup();
    for (let i = 0; i < 1000; i++) {
        activity.set({context: {projectTitle: `Spam ${i}`, editingSince: NOW}});
        activity.clear();
    }
    activity.set({context: {projectTitle: 'Last', editingSince: NOW}});
    await advance(0);
    expect(deps.syncActivity).toHaveBeenCalledTimes(1);
    await advance(1999);
    expect(deps.syncActivity).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(deps.syncActivity).toHaveBeenCalledTimes(2);
    expect(deps.syncActivity).toHaveBeenLastCalledWith(expect.objectContaining({projectTitle: 'Last'}));
    expect(deps.clearActivity).not.toHaveBeenCalled();
    await advance(10000);
    expect(deps.syncActivity).toHaveBeenCalledTimes(2);
});

test('unchanged activity and clearing nothing send nothing', async () => {
    const {deps, activity, advance} = setup();
    activity.clear();
    await advance(5000);
    expect(deps.clearActivity).not.toHaveBeenCalled();
    activity.set({context: {projectTitle: 'Game', editingSince: NOW}});
    await advance(5000);
    activity.set({context: {projectTitle: 'Game', editingSince: NOW}});
    await advance(5000);
    expect(deps.syncActivity).toHaveBeenCalledTimes(1);
});

test('a settings change republishes the last activity, and signing out forgets it', async () => {
    const {deps, activity, advance} = setup();
    activity.refresh();
    await advance(5000);
    expect(deps.syncActivity).not.toHaveBeenCalled();
    activity.set({context: {projectTitle: 'Game', editingSince: NOW}});
    await advance(5000);
    activity.refresh();
    await advance(0);
    expect(deps.syncActivity).toHaveBeenCalledTimes(2);
    activity.forget();
    activity.refresh();
    activity.clear();
    await advance(5000);
    expect(deps.syncActivity).toHaveBeenCalledTimes(2);
    expect(deps.clearActivity).not.toHaveBeenCalled();
});

test('frames opened side by side share one sending slot', async () => {
    let shared = 0;
    const lastSent = {
        get: () => shared,
        set: value => {
            shared = value;
        }
    };
    const first = setup(lastSent);
    const second = setup(lastSent);
    for (let i = 0; i < 100; i++) {
        first.activity.set({context: {projectTitle: `A ${i}`, editingSince: NOW}});
        second.activity.set({context: {projectTitle: `B ${i}`, editingSince: NOW}});
    }
    const sends = () => first.deps.syncActivity.mock.calls.length + second.deps.syncActivity.mock.calls.length;
    await first.advance(0);
    await second.advance(0);
    expect(sends()).toBe(1);
    for (let step = 0; step < 3; step++) {
        await first.advance(2000);
        await second.advance(2000);
    }
    expect(sends()).toBe(3);
});

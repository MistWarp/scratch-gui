import {
    FIRST_BACKUP_DELAY,
    forgetUnsavedBackup,
    getBackupDelay,
    getBackupErrorKind,
    isProjectRunning,
    rememberUnsavedBackup,
    takeUnsavedBackup,
    touchUnsavedBackup,
    waitForQuietMoment
} from '../../../src/lib/mw/device-backups.js';
import {
    beginProjectOperation,
    isProjectOperationActiveError,
    PROJECT_OPERATION_EVENT
} from '../../../src/lib/project-operation.js';

const KEY = 'mw:unsaved-device-backup';

beforeEach(() => {
    localStorage.clear();
});

test('the first automatic backup comes sooner than the configured interval', () => {
    expect(getBackupDelay(5 * 60 * 1000, false)).toBe(FIRST_BACKUP_DELAY);
    expect(getBackupDelay(5 * 60 * 1000, true)).toBe(5 * 60 * 1000);
    expect(getBackupDelay(30 * 1000, false)).toBe(30 * 1000);
    expect(getBackupDelay(-1, false)).toBe(-1);
});

test('names why a backup failed', () => {
    expect(getBackupErrorKind(new Error('Creating restore point: QuotaExceededError: full'))).toBe('quota');
    expect(getBackupErrorKind(Object.assign(new Error('x'), {name: 'StorageUnavailableError'}))).toBe('unavailable');
    expect(getBackupErrorKind(new Error('Could not open database: SecurityError'))).toBe('unavailable');
    expect(getBackupErrorKind(new Error('disk on fire'))).toBe('other');
    expect(getBackupErrorKind(null)).toBe('other');
});

test('monitor threads do not count as a running project', () => {
    expect(isProjectRunning({runtime: {threads: []}})).toBe(false);
    expect(isProjectRunning({runtime: {threads: [{updateMonitor: true}]}})).toBe(false);
    expect(isProjectRunning({runtime: {threads: [{}]}})).toBe(true);
});

describe('waiting for a quiet moment', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('waits for running scripts to stop', async () => {
        const vm = {runtime: {threads: [{}]}};
        const done = jest.fn();
        waitForQuietMoment(vm).then(done);
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
        expect(done).not.toHaveBeenCalled();

        vm.runtime.threads = [];
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
        expect(done).toHaveBeenCalled();
    });

    test('gives up waiting after the maximum delay', async () => {
        const done = jest.fn();
        waitForQuietMoment({runtime: {threads: [{}]}}, {maxWait: 3000}).then(done);
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
        expect(done).toHaveBeenCalled();
    });

    test('does not wait for scripts when the page is being hidden', async () => {
        const done = jest.fn();
        waitForQuietMoment({runtime: {threads: [{}]}}, {immediate: true}).then(done);
        jest.advanceTimersByTime(300);
        await Promise.resolve();
        expect(done).toHaveBeenCalled();
    });
});

describe('unsaved work from an earlier session', () => {
    const earlier = (alive, extra) => localStorage.setItem(KEY, JSON.stringify({
        id: 7, title: 'Game', created: 1000, session: 'earlier', alive, ...extra
    }));

    test('is offered once', () => {
        earlier(0);
        expect(takeUnsavedBackup()).toEqual({id: 7, title: 'Game', created: 1000});
        expect(takeUnsavedBackup()).toBeNull();
    });

    test('is not offered while another tab is still keeping it alive', () => {
        const now = 10 * 60 * 1000;
        earlier(now - 1000);
        expect(takeUnsavedBackup(now)).toBeNull();
        expect(localStorage.getItem(KEY)).not.toBeNull();
        expect(takeUnsavedBackup(now + (5 * 60 * 1000))).toEqual({id: 7, title: 'Game', created: 1000});
    });

    test('this session never offers its own backup, and forgets it once saved', () => {
        rememberUnsavedBackup({id: 3, title: 'Mine', created: 5});
        expect(takeUnsavedBackup(Date.now() + (60 * 60 * 1000))).toBeNull();
        touchUnsavedBackup(true);
        expect(JSON.parse(localStorage.getItem(KEY)).alive).toBe(0);
        forgetUnsavedBackup();
        expect(localStorage.getItem(KEY)).toBeNull();
    });

    test('saving here does not forget another session\'s backup', () => {
        earlier(0);
        forgetUnsavedBackup();
        touchUnsavedBackup();
        expect(JSON.parse(localStorage.getItem(KEY)).session).toBe('earlier');
        expect(JSON.parse(localStorage.getItem(KEY)).alive).toBe(0);
    });

    test('ignores damaged records', () => {
        localStorage.setItem(KEY, '{nope');
        expect(takeUnsavedBackup()).toBeNull();
    });
});

test('project operations announce when they start and end, and a busy lock has a code', () => {
    const vm = {};
    const seen = [];
    const listener = event => {
        if (event.detail.vm === vm) seen.push(event.detail.active);
    };
    window.addEventListener(PROJECT_OPERATION_EVENT, listener);
    try {
        const release = beginProjectOperation(vm);
        let error;
        try {
            beginProjectOperation(vm);
        } catch (e) {
            error = e;
        }
        expect(isProjectOperationActiveError(error)).toBe(true);
        release();
        release();
        expect(seen).toEqual([true, false]);
    } finally {
        window.removeEventListener(PROJECT_OPERATION_EVENT, listener);
    }
});

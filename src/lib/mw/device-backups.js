// Timing and recovery helpers for automatic device backups (restore points).
// See containers/tw-restore-point-manager.jsx.

// The first automatic backup after the first change comes sooner than the
// configured interval, so a crash early in a session still leaves a copy.
const FIRST_BACKUP_DELAY = 60 * 1000;

/**
 * @param {number} interval Configured interval in ms; negative means never.
 * @param {boolean} hasBackedUp Whether an automatic backup already ran this session.
 * @returns {number} ms to wait before the next automatic backup, or -1 for never.
 */
const getBackupDelay = (interval, hasBackedUp) => {
    if (interval < 0) return -1;
    return hasBackedUp ? interval : Math.min(interval, FIRST_BACKUP_DELAY);
};

const MAX_RUNNING_WAIT = 60 * 1000;
const RUNNING_POLL = 1000;
const IDLE_TIMEOUT = 2000;

// Monitor updates are threads too, but they never stop while monitors show.
const isProjectRunning = vm => Boolean(vm && vm.runtime && Array.isArray(vm.runtime.threads) &&
    vm.runtime.threads.some(thread => !thread.updateMonitor));

const whenIdle = callback => {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(callback, {timeout: IDLE_TIMEOUT});
    } else {
        setTimeout(callback, 250);
    }
};

/**
 * Serialising a project blocks the main thread, so automatic backups wait
 * until the project stops running (or maxWait passes) and the page is idle.
 * @param {VirtualMachine} vm scratch-vm instance
 * @param {object} [options] Options
 * @param {boolean} [options.immediate] Skip waiting for scripts to stop (page hidden).
 * @param {number} [options.maxWait] Longest wait for running scripts, in ms.
 * @returns {Promise<void>} Resolves when it is a good moment to back up.
 */
const waitForQuietMoment = (vm, {immediate = false, maxWait = MAX_RUNNING_WAIT} = {}) => new Promise(resolve => {
    const deadline = Date.now() + maxWait;
    const check = () => {
        if (!immediate && isProjectRunning(vm) && Date.now() < deadline) {
            setTimeout(check, RUNNING_POLL);
            return;
        }
        whenIdle(() => resolve());
    };
    check();
});

/**
 * @param {Error} error Error from creating a device backup.
 * @returns {'quota'|'unavailable'|'other'} Why the backup failed, for the alert.
 */
const getBackupErrorKind = error => {
    if (!error) return 'other';
    const text = `${error.name || ''} ${error.message || ''}`;
    if (/quota/i.test(text)) return 'quota';
    if (error.name === 'StorageUnavailableError' || /SecurityError|InvalidStateError/.test(text)) {
        return 'unavailable';
    }
    return 'other';
};

// The newest backup holding work that was not saved, so the next session can
// offer it after a crash or closed tab. Saving clears it. `alive` is a
// heartbeat: a record still being refreshed belongs to another open tab.
const UNSAVED_BACKUP_KEY = 'mw:unsaved-device-backup';
const HEARTBEAT_INTERVAL = 60 * 1000;
const ALIVE_TIMEOUT = 3 * 60 * 1000;
const SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36)
    .slice(2)}`;

const readRecord = () => {
    try {
        const record = JSON.parse(localStorage.getItem(UNSAVED_BACKUP_KEY));
        return record && typeof record === 'object' && typeof record.created === 'number' ? record : null;
    } catch (e) {
        return null;
    }
};

const writeRecord = record => {
    try {
        if (record) localStorage.setItem(UNSAVED_BACKUP_KEY, JSON.stringify(record));
        else localStorage.removeItem(UNSAVED_BACKUP_KEY);
    } catch (e) {
        // Storage may be unavailable (private mode); recovery is best effort.
    }
};

/**
 * @param {{id: number, title: string, created: number}} backup Backup that holds unsaved work.
 * @param {number} [now] Current time in ms.
 */
const rememberUnsavedBackup = ({id, title, created}, now = Date.now()) => {
    writeRecord({id, title, created, session: SESSION_ID, alive: now});
};

/**
 * Keep this session's record fresh so other tabs don't offer it.
 * @param {boolean} [closing] True when the page is going away.
 * @param {number} [now] Current time in ms.
 */
const touchUnsavedBackup = (closing = false, now = Date.now()) => {
    const record = readRecord();
    if (record && record.session === SESSION_ID) writeRecord({...record, alive: closing ? 0 : now});
};

// Called once this session's work is saved (or replaced).
const forgetUnsavedBackup = () => {
    const record = readRecord();
    if (record && record.session === SESSION_ID) writeRecord(null);
};

/**
 * Take the backup a previous session left unsaved, if any. It is offered once:
 * the record is removed whether or not the user restores it.
 * @param {number} [now] Current time in ms.
 * @returns {?{id: number, title: string, created: number}} The backup to offer.
 */
const takeUnsavedBackup = (now = Date.now()) => {
    const record = readRecord();
    if (!record || record.session === SESSION_ID) return null;
    if (record.alive && now - record.alive < ALIVE_TIMEOUT) return null;
    writeRecord(null);
    return {id: record.id, title: record.title, created: record.created};
};

export {
    FIRST_BACKUP_DELAY,
    HEARTBEAT_INTERVAL,
    forgetUnsavedBackup,
    getBackupDelay,
    getBackupErrorKind,
    isProjectRunning,
    rememberUnsavedBackup,
    takeUnsavedBackup,
    touchUnsavedBackup,
    waitForQuietMoment
};

import {local} from '../../modules/storage';
// All we save is whether the box was checked last time, nothing more.
// User still has to manually confirm loading the extension and has
// every opportunity to uncheck the box.

const PERSISTED_UNSANDBOXED_KEY = 'tw:persisted_unsandboxed';

/**
 * @returns {boolean} True if persistence enabled
 */
const getPersistedUnsandboxed = () => local.readString(PERSISTED_UNSANDBOXED_KEY) === 'true';

/**
 * @param {boolean} persisted True if persistence enabled
 */
const setPersistedUnsandboxed = persisted => {
    local.writeBoolean(PERSISTED_UNSANDBOXED_KEY, persisted === true);
};

export {
    getPersistedUnsandboxed,
    setPersistedUnsandboxed
};

/**
 * Wait for a number of milliseconds.
 * @param {number} ms How long to wait.
 * @returns {Promise<void>} Resolves once the time has passed.
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export {
    sleep
};

/**
 * Small bridge so login modal / account menu can call session handlers
 * without a window global or prop-drilling through the whole GUI tree.
 */

/** @type {{login: Function, logout: Function}|null} */
let api = null;

const setRoturSessionApi = next => {
    api = next;
};

const getRoturSessionApi = () => api;

export {
    setRoturSessionApi,
    getRoturSessionApi
};

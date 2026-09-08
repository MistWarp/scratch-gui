// Keep class names distinct so imperative DOM selectors exercise module mappings.
module.exports = new Proxy({}, {
    get: (target, key) => (key === '__esModule' ? false : `module-${String(key)}`)
});

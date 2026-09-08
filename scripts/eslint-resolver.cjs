const path = require('path');
const {createRequire} = require('module');

module.exports = {
    interfaceVersion: 2,
    resolve (request, importer) {
        const source = request.replace(/\?.*$/, '');
        if (source === 'scratch-paint') {
            return {found: true, path: path.resolve(__dirname, '../node_modules/scratch-paint/src/index.js')};
        }
        if (source === 'scratch-render-fonts') {
            return {found: true, path: path.resolve(__dirname, '../src/lib/tw-scratch-render-fonts/index.js')};
        }
        const resolve = createRequire(importer).resolve;
        for (const extension of ['', '.js', '.jsx', '.mjs', '.json']) {
            try {
                return {found: true, path: resolve(source + extension)};
            } catch (error) {
                // Try the next source extension.
            }
        }
        return {found: false};
    }
};

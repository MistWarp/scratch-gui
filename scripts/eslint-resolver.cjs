const fs = require('fs');
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
        if (/^(@[^/]+\/)?[^./@][^/]*$/.test(source)) {
            try {
                const packageJSONPath = resolve(`${source}/package.json`);
                const {browser} = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
                if (typeof browser === 'string') {
                    return {found: true, path: path.resolve(path.dirname(packageJSONPath), browser)};
                }
            } catch (error) {
                return {found: false};
            }
        }
        return {found: false};
    }
};

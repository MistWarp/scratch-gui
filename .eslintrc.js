const path = require('path');

module.exports = {
    root: true,
    extends: ['scratch', 'scratch/node', 'scratch/es6'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        // Parse with the same Babel config that Jest compiles with.
        babelOptions: {
            configFile: path.resolve(__dirname, 'babel.config.cjs')
        }
    },
    rules: {
        'import/namespace': 'off'
    },
    overrides: [
        {
            // Node scripts and the Vite config are ES modules.
            files: ['*.mjs'],
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 'latest'
            }
        },
        {
            files: ['*.cjs'],
            parserOptions: {
                sourceType: 'script'
            }
        }
    ]
};

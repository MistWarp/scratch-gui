const path = require('path');
const typescript = require('../scripts/eslint-typescript.cjs');
const legacyStorageFiles = require('../scripts/eslint-legacy-storage-files.cjs');

const storageMessage = 'Use local or session from src/modules/storage instead of touching web storage directly.';
const storageProperties = ['window', 'globalThis', 'self'].flatMap(object => (
    ['localStorage', 'sessionStorage'].map(property => ({object, property, message: storageMessage}))
));
const moduleDeepImport = {
    group: ['**/modules/*/*', '!**/modules/*/index', '!**/modules/*/index.ts'],
    message: 'Import a module through its index, as in ../modules/storage.'
};
const uiLayerImport = {
    group: ['components', 'containers', 'community', 'playground', 'reducers', 'addons'].flatMap(layer => [
        `../../${layer}`, `../../${layer}/**`, `../../../${layer}`, `../../../${layer}/**`
    ]),
    message: 'Modules sit below the UI. Pass what you need in instead of importing app code.'
};
const siblingModuleDeepImport = {
    group: ['../*/*', '!../*/index', '!../*/index.ts', '!../../**'],
    message: 'Import another module through its index only.'
};
module.exports = {
    root: true,
    extends: ['scratch', 'scratch/es6', 'scratch/react', 'plugin:import/errors'],
    env: {
        browser: true
    },
    globals: {
        process: true
    },
    parserOptions: {
        // The shared Babel config, also used by Jest. See babel.config.cjs.
        babelOptions: {
            configFile: path.resolve(__dirname, '../babel.config.cjs')
        }
    },
    rules: {
        // BEGIN: these caused trouble after upgrading eslint-plugin-react from 7.24.0 to 7.33.2
        'react/forbid-prop-types': 'off',
        'react/no-unknown-property': 'off',
        // END: these caused trouble after upgrading eslint-plugin-react from 7.24.0 to 7.33.2
        'no-warning-comments': 'off',
        'no-unused-vars': ['error', {args: 'after-used', varsIgnorePattern: '^_', ignoreRestSiblings: true}],
        'import/no-mutable-exports': 'error',
        'import/no-commonjs': 'error',
        'import/no-amd': 'error',
        'no-restricted-globals': ['error',
            {name: 'localStorage', message: storageMessage},
            {name: 'sessionStorage', message: storageMessage}
        ],
        'no-restricted-properties': ['error', ...storageProperties],
        'no-restricted-imports': ['error', {patterns: [moduleDeepImport]}],
        'import/no-nodejs-modules': 'error',
        'react/jsx-no-literals': 'error',
        'no-confusing-arrow': ['error', {
            allowParens: true
        }]
    },
    overrides: [
        {
            files: ['**/.eslintrc.js'],
            env: {
                node: true
            },
            rules: {
                'import/no-commonjs': 'off'
            }
        },
        {
            files: ['community/**/*.js', 'community/**/*.jsx', 'components/mw-share-modal/**/*.jsx'],
            rules: {
                'react/jsx-no-literals': 'off',
                'react/jsx-no-bind': 'off',
                'react/prop-types': 'off',
                'react/jsx-max-props-per-line': 'off',
                'react/no-multi-comp': 'off',
                'no-negated-condition': 'off',
                'no-alert': 'off',
                'newline-per-chained-call': 'off'
            }
        },
        typescript,
        {
            files: ['modules/storage/**/*', ...legacyStorageFiles],
            rules: {
                'no-restricted-globals': 'off',
                'no-restricted-properties': 'off'
            }
        },
        {
            files: ['modules/**/*'],
            rules: {
                'no-restricted-imports': ['error', {
                    patterns: [uiLayerImport, siblingModuleDeepImport, moduleDeepImport]
                }]
            }
        }
    ],
    settings: {
        'react': {
            version: '16.2' // Prevent 16.3 lifecycle method errors
        },
        'import/resolver': {
            [path.resolve(__dirname, '../scripts/eslint-resolver.cjs')]: {}
        }
    }
};

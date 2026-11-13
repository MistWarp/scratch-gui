const path = require('path');
const typescript = require('../scripts/eslint-typescript.cjs');

const storageMessage = 'Use local or session from src/modules/storage instead of touching web storage directly.';
const storageProperties = ['window', 'globalThis', 'self'].flatMap(object => (
    ['localStorage', 'sessionStorage'].map(property => ({object, property, message: storageMessage}))
));
const blocksGlobalMessage = 'Read ScratchBlocks and the workspace from src/modules/blocks-registry. ' +
    'Only containers/blocks.jsx sets these globals, for addons and userscripts.';
const blocksGlobalProperties = [
    ...['window', 'globalThis', 'self'].flatMap(object => (
        ['ScratchBlocks', 'Blockly'].map(property => ({object, property, message: blocksGlobalMessage}))
    )),
    ...['blockly', 'blocklyWorkspace', 'blocklyCallbacks'].map(property => (
        {object: 'AddonHooks', property, message: blocksGlobalMessage}
    ))
];
const moduleDeepImport = {
    group: ['**/modules/*/*', '!**/modules/*/index', '!**/modules/*/index.ts'],
    message: 'Import a module through its index, as in ../modules/storage.'
};
const uiLayerImport = {
    group: ['components', 'containers', 'community', 'playground', 'reducers', 'addons'].flatMap(layer => [
        `../../${layer}`, `../../${layer}/**`, `../../../${layer}`, `../../../${layer}/**`,
        `../../../../${layer}`, `../../../../${layer}/**`
    ]),
    message: 'Modules sit below the UI. Pass what you need in instead of importing app code.'
};
const vmFieldMessage = 'Keep editor state off the VM and its runtime. Use src/modules/project-session, ' +
    'or a WeakMap or WeakSet in the file that owns the state.';
const guiFieldName = '/^__?mw(?!(InstallToken|InstallingWholeProject)$)/';
const vmObject = ':matches([name=/^(vm|runtime)$/], [property.name=/^(vm|runtime)$/])';
const vmFieldSelectors = [
    `MemberExpression:matches([property.name=${guiFieldName}], [property.value=${guiFieldName}])` +
        `:has(> .object${vmObject})`,
    `VariableDeclarator:has(> .init${vmObject}) > ObjectPattern > Property[key.name=${guiFieldName}]`,
    `AssignmentExpression:has(> .right${vmObject}) > ObjectPattern > Property[key.name=${guiFieldName}]`
].map(selector => ({selector, message: vmFieldMessage}));
const localeDataImport = {
    name: '@turbowarp/scratch-l10n',
    message: 'The package index bundles formatting data for every language. Import the locale list from ' +
        '@turbowarp/scratch-l10n/src/supported-locales.js and load locale data through src/lib/intl-locale-data.'
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
        'require-jsdoc': 'off',
        'no-unused-vars': ['error', {args: 'after-used', varsIgnorePattern: '^_', ignoreRestSiblings: true}],
        'import/no-mutable-exports': 'error',
        'import/no-commonjs': 'error',
        'import/no-amd': 'error',
        'no-restricted-globals': ['error',
            {name: 'localStorage', message: storageMessage},
            {name: 'sessionStorage', message: storageMessage}
        ],
        'no-restricted-properties': ['error', ...storageProperties, ...blocksGlobalProperties],
        'no-restricted-syntax': ['error', ...vmFieldSelectors],
        'no-restricted-imports': ['error', {paths: [localeDataImport], patterns: [moduleDeepImport]}],
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
            files: ['modules/storage/**/*'],
            rules: {
                'no-restricted-globals': 'off',
                'no-restricted-properties': ['error', ...blocksGlobalProperties]
            }
        },
        {
            files: ['containers/blocks.jsx'],
            rules: {
                'no-restricted-properties': ['error', ...storageProperties]
            }
        },
        {
            files: ['modules/**/*'],
            rules: {
                'no-restricted-imports': ['error', {
                    paths: [localeDataImport],
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

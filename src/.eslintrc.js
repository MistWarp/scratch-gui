const path = require('path');
module.exports = {
    root: true,
    extends: ['scratch', 'scratch/es6', 'scratch/react', 'plugin:import/errors'],
    env: {
        browser: true
    },
    globals: {
        process: true
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
        }
    ],
    settings: {
        'react': {
            version: '16.2' // Prevent 16.3 lifecycle method errors
        },
        'import/resolver': {
            webpack: {
                config: path.resolve(__dirname, '../webpack.config.js')
            }
        }
    }
};

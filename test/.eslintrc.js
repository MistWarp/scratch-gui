module.exports = {
    extends: ['scratch/react', 'scratch/es6', 'plugin:jest/recommended'],
    env: {
        browser: true,
        jest: true
    },
    plugins: ['jest'],
    rules: {
        'react/prop-types': 0,
        // Re-rendering cost does not matter in tests, and small test components need no names.
        'react/jsx-no-bind': 'off',
        'react/display-name': 'off',
        // jest.mock() factories and jest.isolateModules() have to require() inside functions.
        'global-require': 'off'
    },
    settings: {
        react: {
            version: '16.2' // Matches src/.eslintrc.js
        }
    }
};

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
        'global-require': 'off',
        // Async mock implementations stand in for real async functions without awaiting anything.
        'require-await': 'off',
        // Tests assert on undefined and pass it to reach default arguments.
        'no-undefined': 'off',
        // Reports sequential awaits in test bodies that no other code can interleave with.
        'require-atomic-updates': 'off',
        // Test files are .js or .jsx regardless of whether they render JSX.
        'react/jsx-filename-extension': 'off',
        // URL safety tests need javascript: URLs as inputs.
        'no-script-url': 'off',
        // Test names and fixtures are often long strings; code lines still wrap at 120.
        'max-len': ['error', {
            code: 120,
            tabWidth: 4,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true
        }]
    },
    settings: {
        react: {
            version: '16.2' // Matches src/.eslintrc.js
        }
    }
};

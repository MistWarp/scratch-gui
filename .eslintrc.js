module.exports = {
    extends: ['scratch', 'scratch/node', 'scratch/es6'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        'import/namespace': 'off'
    }
};

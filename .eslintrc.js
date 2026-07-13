module.exports = {
    extends: ['scratch', 'scratch/node', 'scratch/es6'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true
        },
        babelOptions: {
            presets: [
                ['@babel/preset-env'],
                ['@babel/preset-react']
            ],
            plugins: ['@babel/plugin-syntax-dynamic-import', '@babel/plugin-transform-object-rest-spread']
        }
    },
    rules: {
        'import/namespace': 'off'
    }
};

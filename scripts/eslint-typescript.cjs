const path = require('path');

const root = path.resolve(__dirname, '..');

module.exports = {
    files: ['*.ts', '*.tsx'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {jsx: true},
        project: path.join(root, 'tsconfig.json'),
        tsconfigRootDir: root
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'plugin:@typescript-eslint/strict-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked'
    ],
    rules: {
        'require-jsdoc': 'off',
        'valid-jsdoc': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'no-useless-constructor': 'off',
        'no-shadow': 'off',
        'no-redeclare': 'off',
        'no-dupe-class-members': 'off',
        'react/jsx-filename-extension': ['error', {extensions: ['.jsx', '.tsx']}],
        '@typescript-eslint/no-unused-vars': ['error', {args: 'after-used', varsIgnorePattern: '^_'}],
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/explicit-module-boundary-types': 'error'
    }
};

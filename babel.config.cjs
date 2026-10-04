// The one Babel config for this repository. Jest (babel-jest) compiles tests with it, and
// ESLint (@babel/eslint-parser) parses with it. Vite does not read it: the site is compiled by
// esbuild, and @vitejs/plugin-react runs Babel with config files turned off.
module.exports = api => {
    const jest = api.caller(caller => Boolean(caller && caller.name === 'babel-jest'));
    return {
        presets: [
            // Tests run in the installed Node.js, so only transform what it lacks.
            ['@babel/preset-env', jest ? {targets: {node: 'current'}} : {}],
            '@babel/preset-react'
        ],
        plugins: [
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-transform-object-rest-spread'
        ]
    };
};

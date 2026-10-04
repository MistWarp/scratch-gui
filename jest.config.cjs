const path = require('path');

// Browser tests in test/integration need a built site and Chrome, so plain `jest` and the
// test:unit scripts leave them out. `pnpm run test:integration` (scripts/test-integration.mjs)
// serves build/ and sets TEST_BASE_URL, which brings them back in.
const integration = Boolean(process.env.TEST_BASE_URL);

module.exports = {
    setupFiles: [
        'raf/polyfill',
        '<rootDir>/test/helpers/enzyme-setup.js'
    ],
    globalSetup: '<rootDir>/test/helpers/jest-global-setup.mjs',
    testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/.claude/',
        ...(integration ? [] : ['<rootDir>/test/integration/'])
    ],
    moduleNameMapper: {
        '^scratch-paint$': '<rootDir>/test/__mocks__/scratch-paint.js',
        '\\.module\\.css$': '<rootDir>/test/__mocks__/cssModuleMock.js',
        'generated/editor-locales/index\\.js$': '<rootDir>/test/__mocks__/editor-locales.js',
        '\\?arraybuffer$': '<rootDir>/test/__mocks__/arrayBufferMock.js',
        '\\?(raw|base64|url|recolor|worker)$': '<rootDir>/test/__mocks__/fileMock.js',
        '\\.css\\?(inline|global)$': '<rootDir>/test/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/test/__mocks__/fileMock.js',
        '\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js',
        'editor-msgs(\\.js)?$': '<rootDir>/test/__mocks__/editor-msgs-mock.js',
        '^scratch-render-fonts$': '<rootDir>/src/lib/tw-scratch-render-fonts',
        '^!arraybuffer-loader!.*$': '<rootDir>/test/__mocks__/arrayBufferMock.js',
        '^!!base64-loader!.*$': '<rootDir>/test/__mocks__/fileMock.js',
        '^!raw-loader!.*$': '<rootDir>/test/__mocks__/fileMock.js',
        '^scratch-audio$': '<rootDir>/node_modules/scratch-audio/src/index.js',
        '^scratchblocks$': '<rootDir>/node_modules/scratchblocks/build/scratchblocks.min.es.js',
        '^fractch/browser$': '<rootDir>/node_modules/fractch/src/browser.js',
        '^@turbowarp/scratch-svg-renderer$': '<rootDir>/node_modules/@turbowarp/scratch-svg-renderer'
    },
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: ['node', 'require', 'default']
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(scratch-audio|scratch-paint|fractch|scratchblocks|pify|isomorphic-git|rotur-sdk|' +
            '@vernier/godirect|@chenglou/pretext)/)'
    ],
    transform: {
        // babel.config.cjs is shared with ESLint. Ignore any .babelrc in linked fork checkouts.
        '^.+\\.(js|jsx|mjs|cjs)$': ['babel-jest', {
            configFile: path.join(__dirname, 'babel.config.cjs'),
            babelrc: false
        }]
    }
};

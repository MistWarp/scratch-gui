// Jest config for the collaboration engine unit tests. These are pure-logic
// tests that don't need the enzyme/jsdom setup files from the main config
// (which currently fail to load under this node/jest combination because a
// hoisted modern cheerio requires `node:`-prefixed core modules).
// Run with: npm run test:collab
module.exports = {
    setupFiles: [],
    testMatch: ['<rootDir>/test/unit/collaboration/**/*.test.js'],
    moduleNameMapper: {
        '\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js'
    }
};

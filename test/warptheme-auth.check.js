const assert = require('assert');
const {needsValidatorPermission} = require('../src/lib/warptheme-auth.js');

assert.strictEqual(needsValidatorPermission(403, {}), true);
assert.strictEqual(needsValidatorPermission(400, {error: 'Missing permission: validators:generate'}), true);
assert.strictEqual(needsValidatorPermission(500, {error: 'Service unavailable'}), false);

console.log('WarpTheme validator permission check passed');

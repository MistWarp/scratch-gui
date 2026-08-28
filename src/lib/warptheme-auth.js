/* eslint-disable import/no-commonjs */
const needsValidatorPermission = (status, data = {}) => {
    const message = String(data.error || data.message || '').toLowerCase();
    return status === 403 || (message.includes('permission') && message.includes('validator'));
};

module.exports = {needsValidatorPermission};

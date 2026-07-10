const needsValidatorPermission = (status, data = {}) => (
    status === 401 ||
    status === 403 ||
    /validators:generate|permission|scope/i.test(String(data.error || data.message || ''))
);

module.exports = {needsValidatorPermission};

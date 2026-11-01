import {request} from '../../lib/community/api.js';

export default {
    support: ticket => request('/support', {method: 'POST', body: ticket}),
    agreement: () => request('/agreement'),
    acceptAgreement: () => request('/agreement/accept', {method: 'POST'}),
    report: (type, target, reason, context, targetUser, category) =>
        request('/reports', {method: 'POST', body: {type, target, reason, context, targetUser, category}})
};

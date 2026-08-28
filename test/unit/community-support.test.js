import {
    normalizeSupportParams,
    resetSupportForm,
    supportPayload,
    withSupportTopic
} from '../../src/community/pages/Support.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Support request payload', () => {
    test('submits the displayed signed-in username after identity restoration', () => {
        expect(supportPayload({
            type: 'account',
            username: '',
            subject: '  Help  ',
            message: '  Details  '
        }, {username: 'signed-in-user'})).toEqual({
            type: 'account',
            username: 'signed-in-user',
            subject: 'Help',
            message: 'Details'
        });
    });

    test('canonicalizes support topics without dropping unrelated parameters', () => {
        expect(normalizeSupportParams(new URLSearchParams('topic=unknown&from=footer')).toString()).toBe('from=footer');
        expect(normalizeSupportParams(new URLSearchParams('topic=safety')).toString()).toBe('topic=safety');
        expect(withSupportTopic(new URLSearchParams('from=footer'), 'legal').toString()).toBe('from=footer&topic=legal');
        expect(withSupportTopic(new URLSearchParams('topic=appeal&from=footer'), 'account').toString()).toBe('from=footer');
    });

    test('clears the sent message while preserving identity and topic for another request', () => {
        expect(resetSupportForm({
            type: 'appeal',
            username: 'guest',
            subject: 'Old subject',
            message: 'Old message'
        }, {username: 'signed-in-user'})).toEqual({
            type: 'appeal',
            username: 'signed-in-user',
            subject: '',
            message: ''
        });
    });
});

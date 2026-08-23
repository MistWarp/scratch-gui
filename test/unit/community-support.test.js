import {supportPayload} from '../../src/community/pages/Support.jsx';

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
});

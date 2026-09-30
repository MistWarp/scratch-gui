import reducer, {roturInitialState, setRoturUser, clearRoturUser} from '../../src/reducers/rotur.js';

let mockStudent = false;

jest.mock('../../src/lib/rotur/identity.js', () => ({
    isStudentSession: () => mockStudent
}));

describe('rotur reducer student flag', () => {
    test('starts signed out and not a student', () => {
        expect(roturInitialState.isStudent).toBe(false);
        expect(roturInitialState.displayName).toBeNull();
    });

    test('carries isStudent and displayName from the identity user', () => {
        const state = reducer(roturInitialState, setRoturUser({
            username: 'adaokafor~yumrk', displayName: 'Ada Okafor', isStudent: true
        }));
        expect(state.isStudent).toBe(true);
        expect(state.displayName).toBe('Ada Okafor');
        expect(state.username).toBe('adaokafor~yumrk');
    });

    test('a Rotur user is never a student and clearing resets the flag', () => {
        const teacher = reducer(roturInitialState, setRoturUser({username: 'Mist', isStudent: 'yes'}));
        expect(teacher.isStudent).toBe(false);
        const student = reducer(roturInitialState, setRoturUser({username: 'mia~jfsnb', isStudent: true}));
        expect(reducer(student, clearRoturUser()).isStudent).toBe(false);
    });
});

describe('chat ui for students', () => {
    beforeEach(() => {
        jest.resetModules();
        sessionStorage.clear();
        localStorage.clear();
        window.history.replaceState(null, '', '/editor.html?chat=1');
    });

    test('ignores the chat URL flag and never opens for a student', () => {
        mockStudent = true;
        // eslint-disable-next-line global-require
        const chatUi = require('../../src/lib/originchats/chat-ui.js');
        expect(chatUi.getChatUi().open).toBe(false);
        chatUi.openChat();
        expect(chatUi.getChatUi().open).toBe(false);
        chatUi.toggleChat();
        expect(chatUi.getChatUi().open).toBe(false);
        expect(sessionStorage.getItem('mw:chat-open')).toBeNull();
    });

    test('still honours the URL flag and toggles for everyone else', () => {
        mockStudent = false;
        // eslint-disable-next-line global-require
        const chatUi = require('../../src/lib/originchats/chat-ui.js');
        expect(chatUi.getChatUi().open).toBe(true);
        chatUi.toggleChat();
        expect(chatUi.getChatUi().open).toBe(false);
        chatUi.openChat();
        expect(chatUi.getChatUi().open).toBe(true);
    });
});

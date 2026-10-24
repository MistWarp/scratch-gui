import {publicIdentity} from '../../src/lib/account/protocol.js';

describe('class accounts across the account frame', () => {
    afterEach(() => {
        localStorage.clear();
        window.history.replaceState(null, '', '/');
    });

    test('the frame tells the editor that a class account is a student', () => {
        const identity = publicIdentity({
            status: 'ready',
            user: {username: 'ada~k7p2q', displayName: 'Ada', isStudent: true}
        });
        expect(identity.user).toEqual({
            username: 'ada~k7p2q',
            id: '',
            bio: null,
            isStudent: true,
            displayName: 'Ada'
        });
    });

    test('a Rotur account carries no student fields', () => {
        const identity = publicIdentity({status: 'ready', user: {username: 'mist', id: 'u1'}});
        expect(identity.user).toEqual({username: 'mist', id: 'u1', bio: null});
    });

    test('the split editor treats a class link as a student before the frame answers', () => {
        window.history.replaceState(null, '', '/?classroom=student');
        jest.isolateModules(() => {
            jest.doMock('../../src/lib/account/origins.js', () => ({
                ACCOUNT_ORIGIN: 'https://mistwarp.org',
                EDITOR_ORIGIN: 'https://editor.mistwarp.org',
                isSplitEditor: () => true,
                isEditorOrigin: () => false
            }));
            const flag = require('../../src/lib/rotur/student-flag.js');
            expect(flag.isStudentSession()).toBe(true);
            flag.setSplitStudent(false);
            expect(flag.isStudentSession()).toBe(false);
        });
        jest.dontMock('../../src/lib/account/origins.js');
    });

    test('outside the split editor a class link changes nothing', () => {
        window.history.replaceState(null, '', '/?classroom=student');
        jest.isolateModules(() => {
            const flag = require('../../src/lib/rotur/student-flag.js');
            expect(flag.isStudentSession()).toBe(false);
        });
    });
});

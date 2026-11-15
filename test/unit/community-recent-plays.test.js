import {forgetPlays, recentPlays, rememberPlay, updatedSincePlayed} from '../../src/community/recent-plays.js';

const project = (id, extra = {}) => ({id, title: `Game ${id}`, owner: 'maker', shared: true, visibility: 'public', lastUploadAt: 100, ...extra});

describe('recent plays on this device', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('newest first, without duplicates, capped at twelve', () => {
        for (let i = 1; i <= 14; i++) rememberPlay(project(`p${i}`), i);
        rememberPlay(project('p3'), 99);
        const plays = recentPlays();
        expect(plays).toHaveLength(12);
        expect(plays[0]).toMatchObject({id: 'p3', lastPlayed: 99, title: 'Game p3'});
        expect(plays.filter(item => item.id === 'p3')).toHaveLength(1);
    });

    test('private and unshared projects are not remembered', () => {
        rememberPlay(project('a', {visibility: 'unlisted'}));
        rememberPlay(project('b', {shared: false}));
        expect(recentPlays()).toEqual([]);
    });

    test('broken storage reads as empty', () => {
        localStorage.setItem('mw:recent-plays', '{"not": "a list"}');
        expect(recentPlays()).toEqual([]);
    });

    test('a play remembers the upload it saw', () => {
        rememberPlay(project('a'), 500);
        expect(recentPlays()[0]).toMatchObject({id: 'a', seenUploadAt: 100, lastPlayed: 500});
    });

    test('forgotten plays leave the list', () => {
        rememberPlay(project('a'), 1);
        rememberPlay(project('b'), 2);
        forgetPlays(['a']);
        expect(recentPlays().map(item => item.id)).toEqual(['b']);
    });

    test('a device play is updated only by a newer upload than the one it saw', () => {
        expect(updatedSincePlayed({lastUploadAt: 200, seenUploadAt: 100, lastPlayed: 999})).toBe(true);
        expect(updatedSincePlayed({lastUploadAt: 100, seenUploadAt: 100, lastPlayed: 50})).toBe(false);
        expect(updatedSincePlayed({lastUploadAt: 200, seenUploadAt: 0})).toBe(false);
    });

    test('an account play is updated by an upload after the last play', () => {
        expect(updatedSincePlayed({lastUploadAt: 200, lastPlayed: 100})).toBe(true);
        expect(updatedSincePlayed({lastUploadAt: 100, lastPlayed: 200})).toBe(false);
        expect(updatedSincePlayed({edited: 300, lastPlayed: 200})).toBe(false);
        expect(updatedSincePlayed({})).toBe(false);
        expect(updatedSincePlayed(null)).toBe(false);
    });
});

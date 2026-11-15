import {recentPlays, rememberPlay, updatedSincePlayed} from '../../src/community/recent-plays.js';
import {rememberProject} from '../../src/community/components/RelatedProjects.jsx';

const project = (id, extra = {}) => ({id, title: `Game ${id}`, owner: 'maker', shared: true, visibility: 'public', edited: 100, ...extra});

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

    test('a project edited after the last play is updated', () => {
        expect(updatedSincePlayed({edited: 200, lastPlayed: 100})).toBe(true);
        expect(updatedSincePlayed({edited: 100, lastPlayed: 200})).toBe(false);
        expect(updatedSincePlayed({edited: 0, lastPlayed: 200})).toBe(false);
        expect(updatedSincePlayed({})).toBe(false);
    });

    test('remembering a project returns how many this visit has seen', () => {
        expect(rememberProject('a')).toBe(1);
        expect(rememberProject('b')).toBe(2);
        expect(rememberProject('a')).toBe(2);
    });
});

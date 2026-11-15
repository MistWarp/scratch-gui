import {projectPublishedAt, projectUpdatedAt, shortTime} from '../../src/community/project-times.js';

const DAY = 24 * 60 * 60 * 1000;

describe('project times', () => {
    test('a shared project counts from when it was shared, an unshared one from when it was uploaded', () => {
        expect(projectPublishedAt({shared: true, sharedAt: 2000, created: 1000})).toBe(2000);
        expect(projectPublishedAt({shared: true, created: 1000})).toBe(1000);
        expect(projectPublishedAt({shared: false, sharedAt: 2000, created: 1000})).toBe(1000);
        expect(projectPublishedAt({})).toBe(0);
        expect(projectPublishedAt(null)).toBe(0);
    });

    test('an update shows only for new content at least a minute after sharing', () => {
        expect(projectUpdatedAt({shared: true, sharedAt: 1000, lastUploadAt: 1000 + 30000})).toBe(0);
        expect(projectUpdatedAt({shared: true, sharedAt: 1000, lastUploadAt: 1000 + DAY})).toBe(1000 + DAY);
        expect(projectUpdatedAt({shared: true, sharedAt: 1000, lastUploadAt: 500, edited: 1000 + DAY})).toBe(0);
        expect(projectUpdatedAt({shared: true, sharedAt: 1000})).toBe(0);
    });

    test('the last week reads as relative time, older dates as a date', () => {
        const now = Date.UTC(2026, 10, 15, 12);
        expect(shortTime(now - (3 * DAY), now)).not.toMatch(/2026/);
        expect(shortTime(now - (30 * DAY), now)).toMatch(/2026/);
    });

    test('a time ahead of this clock reads as now, not as a date', () => {
        expect(shortTime(Date.now() + (30 * DAY))).not.toMatch(/2026|2027/);
    });
});

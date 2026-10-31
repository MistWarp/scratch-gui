import {eventCount, eventGroupCount} from '../../src/community/pages/admin/admin-format.js';

const events = {
    'share_opened': {20756: 1},
    'share_opened:save': {20756: 2, 20757: 3},
    'share_opened:update': {20757: 4},
    'share_openedx': {20757: 9},
    'editor_open': {20757: '5'}
};

test('counts one event key across every day', () => {
    expect(eventCount(events, 'share_opened:save')).toBe(5);
    expect(eventCount(events, 'editor_open')).toBe(5);
    expect(eventCount(events, 'missing')).toBe(0);
    expect(eventCount(null, 'editor_open')).toBe(0);
});

test('counts an event together with all of its variants', () => {
    expect(eventGroupCount(events, 'share_opened')).toBe(10);
    expect(eventGroupCount(undefined, 'share_opened')).toBe(0);
});

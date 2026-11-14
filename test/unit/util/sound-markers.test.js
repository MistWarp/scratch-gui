import {
    clampMarkers,
    nextMarker,
    previousMarker,
    regionAround,
    scaleMarkers,
    spliceMarkers,
    toggleMarker
} from '../../../src/lib/audio/sound-markers';

describe('sound markers', () => {
    test('toggles markers and keeps them sorted', () => {
        expect(toggleMarker([10, 30], 20)).toEqual([10, 20, 30]);
        expect(toggleMarker([10, 20, 30], 20)).toEqual([10, 30]);
    });

    test('finds the markers around a position', () => {
        expect(previousMarker([10, 30], 30)).toBe(10);
        expect(previousMarker([10, 30], 10)).toBeNull();
        expect(nextMarker([10, 30], 10)).toBe(30);
        expect(nextMarker([10, 30], 30)).toBeNull();
        expect(regionAround([10, 30], 20, 100)).toEqual({start: 10, end: 30});
        expect(regionAround([10, 30], 5, 100)).toEqual({start: 0, end: 10});
        expect(regionAround([10, 30], 30, 100)).toEqual({start: 30, end: 100});
        expect(regionAround([], 30, 100)).toEqual({start: 0, end: 100});
    });

    test('moves markers when audio is removed, inserted or resized', () => {
        expect(spliceMarkers([10, 25, 40], {at: 20, removed: 10, inserted: 0})).toEqual([10, 30]);
        expect(spliceMarkers([10, 40], {at: 20, removed: 0, inserted: 5})).toEqual([10, 45]);
        expect(spliceMarkers([10, 25, 40], {at: 20, removed: 10, inserted: 20})).toEqual([10, 30, 50]);
        expect(spliceMarkers([20, 30], {at: 20, removed: 10, inserted: 0})).toEqual([20]);
    });

    test('scales and clamps markers', () => {
        expect(scaleMarkers([10, 11, 40], 0.5)).toEqual([5, 6, 20]);
        expect(clampMarkers([-1, 5, 50, 5], 20)).toEqual([5]);
    });
});

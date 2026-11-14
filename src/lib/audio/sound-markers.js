const sortedUnique = markers => Array.from(new Set(markers)).sort((a, b) => a - b);

const toggleMarker = (markers, sample) => (
    markers.includes(sample) ? markers.filter(marker => marker !== sample) : sortedUnique(markers.concat(sample))
);

const previousMarker = (markers, sample) => {
    let found = null;
    for (const marker of markers) {
        if (marker < sample) found = marker;
    }
    return found;
};

const nextMarker = (markers, sample) => {
    for (const marker of markers) {
        if (marker > sample) return marker;
    }
    return null;
};

const regionAround = (markers, sample, total) => {
    let start = 0;
    let end = total;
    for (const marker of markers) {
        if (marker <= sample) start = marker;
        else if (marker < end) end = marker;
    }
    return {start, end};
};

const spliceMarkers = (markers, {at, removed, inserted}) => sortedUnique(markers.map(marker => {
    if (marker <= at) return marker;
    if (marker >= at + removed) return marker + inserted - removed;
    if (removed > 0 && inserted > 0) return at + Math.round(((marker - at) * inserted) / removed);
    return null;
}).filter(marker => marker !== null));

const scaleMarkers = (markers, ratio) => sortedUnique(markers.map(marker => Math.round(marker * ratio)));

const clampMarkers = (markers, total) => sortedUnique(markers.filter(marker => marker >= 0 && marker <= total));

export {
    clampMarkers,
    nextMarker,
    previousMarker,
    regionAround,
    scaleMarkers,
    spliceMarkers,
    toggleMarker
};

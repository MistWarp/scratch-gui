const GIFS_ORIGIN = 'https://gifs.originchats.com';
const GIFS_API = `${GIFS_ORIGIN}/api`;

const gifUrl = url => {
    const value = String(url || '').trim();
    if (!value) return '';
    try {
        return new URL(value, GIFS_ORIGIN).toString();
    } catch (_) {
        return value;
    }
};

const findGifs = async (query, signal) => {
    const params = new URLSearchParams({limit: '24'});
    const trimmed = String(query || '').trim();
    if (trimmed) params.set('q', trimmed);
    else params.set('sort', 'views');
    const response = await fetch(`${GIFS_API}/gifs?${params.toString()}`, {signal});
    if (!response.ok) throw new Error(`GIF search failed (${response.status})`);
    const data = await response.json();
    return data && data.ok !== false && Array.isArray(data.gifs) ? data.gifs.filter(gif => gif.id && gif.url) : [];
};

export {findGifs, gifUrl};

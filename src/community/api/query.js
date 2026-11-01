export const commentQuery = ({offset = 0, limit = 20, anchor = '', all = false, sort = 'newest'} = {}) => {
    const params = new URLSearchParams();
    if (all) {
        params.set('all', '1');
    } else {
        params.set('offset', String(offset));
        params.set('limit', String(limit));
    }
    if (anchor) params.set('anchor', anchor);
    if (sort === 'donations') params.set('sort', 'donations');
    return params.toString();
};

export const projectAccessQuery = () => {
    const key = typeof location === 'undefined' ? '' : new URLSearchParams(location.search).get('k');
    return key ? `?k=${encodeURIComponent(key)}` : '';
};

// GETs the server builds on demand (exports, diffs, git trees) can take longer
// than the usual deadline.
export const SLOW_GET_TIMEOUT = 60000;

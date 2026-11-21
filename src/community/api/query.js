export const commentQuery = ({
    offset = 0, limit = 20, anchor = '', all = false, sort = 'newest', issue = '', number = 0
} = {}) => {
    const params = new URLSearchParams();
    if (all) {
        params.set('all', '1');
    } else {
        params.set('offset', String(offset));
        params.set('limit', String(limit));
    }
    if (anchor) params.set('anchor', anchor);
    if (sort === 'donations') params.set('sort', 'donations');
    if (['open', 'done', 'any'].includes(issue)) {
        params.set('issue', issue);
        if (Number(number) > 0) params.set('number', String(Math.floor(Number(number))));
    }
    return params.toString();
};

export const projectAccessQuery = () => {
    const key = typeof location === 'undefined' ? '' : new URLSearchParams(location.search).get('k');
    return key ? `?k=${encodeURIComponent(key)}` : '';
};

export const SLOW_GET_TIMEOUT = 60000;

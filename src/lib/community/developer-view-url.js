const developerViewUrl = url => {
    const text = String(url || '');
    const cut = text.search(/[?#]/);
    const path = cut === -1 ? text : text.slice(0, cut);
    const rest = cut === -1 ? '' : text.slice(cut);
    if (!path || /\/code\/?$/.test(path)) return text;
    return `${path.replace(/\/+$/, '')}/code${rest}`;
};

export default developerViewUrl;

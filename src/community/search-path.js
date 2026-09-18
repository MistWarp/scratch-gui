const searchPath = query => {
    const value = query.trim();
    return value ? `/search?q=${encodeURIComponent(value)}` : '/explore';
};

export default searchPath;

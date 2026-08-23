const searchPath = query => {
    const value = query.trim();
    return value ? `/explore?q=${encodeURIComponent(value)}` : '/explore';
};

export default searchPath;

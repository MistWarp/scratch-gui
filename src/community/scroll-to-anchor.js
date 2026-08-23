const scrollToAnchorWithRetry = (id, {attempts = 20, delay = 300} = {}) => {
    let cancelled = false;
    let timeoutId = null;
    const tryScroll = remaining => {
        if (cancelled) return;
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({behavior: 'smooth', block: 'center'});
            return;
        }
        if (remaining > 0) {
            timeoutId = setTimeout(() => tryScroll(remaining - 1), delay);
        }
    };
    tryScroll(attempts);
    return () => {
        cancelled = true;
        if (timeoutId) clearTimeout(timeoutId);
    };
};

export default scrollToAnchorWithRetry;

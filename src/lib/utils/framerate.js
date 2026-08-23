const normalizeCustomFramerate = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export {normalizeCustomFramerate};

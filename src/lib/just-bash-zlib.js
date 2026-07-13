const unsupported = () => {
    throw new Error('gzip commands are not available in the browser terminal');
};

const constants = {
    Z_BEST_COMPRESSION: 9,
    Z_BEST_SPEED: 1,
    Z_DEFAULT_COMPRESSION: -1
};

export {constants, unsupported as gunzipSync, unsupported as gzipSync};

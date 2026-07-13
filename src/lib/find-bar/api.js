let api = null;

const setFindBarApi = value => {
    api = value;
};

const getFindBarApi = () => api;

export {
    setFindBarApi,
    getFindBarApi
};

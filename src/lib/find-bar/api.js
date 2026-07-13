let api = null;

const setFindBarApi = value => {
    api = value;
};

const getFindBarApi = () => api;

let codeSearch = null;

const setCodeSearch = value => {
    codeSearch = value;
};

const getCodeSearch = () => codeSearch;

export {
    setFindBarApi,
    getFindBarApi,
    setCodeSearch,
    getCodeSearch
};

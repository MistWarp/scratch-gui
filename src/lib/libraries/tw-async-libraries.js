const libraryData = {};

const asyncLibrary = (name, callback) => {
    let data = null;
    return () => {
        if (libraryData[name]) return libraryData[name];
        if (data) return data;
        return callback()
            .then(mod => (data = mod.default));
    };
};

export const getBackdropLibrary = asyncLibrary(
    'backdrops',
    () => import(/* webpackChunkName: "library-backdrops" */ './backdrops.json')
);
export const getCostumeLibrary = asyncLibrary(
    'costumes',
    () => import(/* webpackChunkName: "library-costumes" */ './costumes.json')
);
export const getSoundLibrary = asyncLibrary(
    'sounds',
    () => import(/* webpackChunkName: "library-sounds" */ './sounds.json')
);
export const getSpriteLibrary = asyncLibrary(
    'sprites',
    () => import(/* webpackChunkName: "library-sprites" */ './sprites.json')
);

export const setLibraryData = data => {
    Object.assign(libraryData, data);
};

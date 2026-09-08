import * as bundledModule0 from "./backdrops.json";
import * as bundledModule1 from "./costumes.json";
import * as bundledModule2 from "./sounds.json";
import * as bundledModule3 from "./sprites.json";

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
    () => Promise.resolve(bundledModule0)
);
export const getCostumeLibrary = asyncLibrary(
    'costumes',
    () => Promise.resolve(bundledModule1)
);
export const getSoundLibrary = asyncLibrary(
    'sounds',
    () => Promise.resolve(bundledModule2)
);
export const getSpriteLibrary = asyncLibrary(
    'sprites',
    () => Promise.resolve(bundledModule3)
);

export const setLibraryData = data => {
    Object.assign(libraryData, data);
};

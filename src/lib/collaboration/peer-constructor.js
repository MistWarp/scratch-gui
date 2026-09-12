// PeerJS 1.3 is a Parcel/CommonJS bundle. Vite can expose the constructor
// directly or inside its default export, depending on dependency prebundling.
export const resolvePeerConstructor = module => {
    for (const candidate of [module, module && module.default, module && module.Peer,
        module && module.peerjs && module.peerjs.Peer]) {
        if (typeof candidate === 'function') return candidate;
    }
    throw new TypeError('The collaboration library did not provide a Peer constructor. Please reload the page.');
};

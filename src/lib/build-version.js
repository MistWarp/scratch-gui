// Build/deploy identity baked in at Vite build time (see vite.config.mjs
// DefinePlugin: MW_BUILD_ID / MW_BUILD_TIME) compared against /version.json
// written by scripts/write-version.mjs, so a long-lived tab can notice a new
// deploy and prompt the user to reload.

const BUILD_ID = process.env.MW_BUILD_ID || 'dev';
const BUILD_TIME = process.env.MW_BUILD_TIME || '';

const shortId = id => {
    if (!id || id === 'dev') return id;
    return id.length > 7 ? id.slice(0, 7) : id;
};

// version.json must bypass HTTP caches and the service worker (which would
// otherwise serve a stale copy via stale-while-revalidate).
const fetchDeployedVersion = async () => {
    const root = process.env.ROOT || '/';
    const res = await fetch(`${root}version.json?t=${Date.now()}`, {cache: 'no-store'});
    if (!res.ok) throw new Error(`version.json responded ${res.status}`);
    return res.json();
};

const isUpdateAvailable = deployed => Boolean(
    deployed && deployed.id && BUILD_ID && deployed.id !== 'dev' && deployed.id !== BUILD_ID
);

export {
    BUILD_ID,
    BUILD_TIME,
    shortId,
    fetchDeployedVersion,
    isUpdateAvailable
};

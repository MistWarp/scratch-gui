const DB_NAME = 'MW_IsolatedEditor';
const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspaces');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});
export const loadWorkspace = async scope => {
    const db = await open();
    try {
        return await new Promise((resolve, reject) => {
            const request = db.transaction('workspaces').objectStore('workspaces')
                .get(scope);
            request.onsuccess = () => resolve(request.result || {local: {}, databases: []});
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
};
export const saveWorkspace = async (scope, workspace) => {
    const db = await open();
    try {
        await new Promise((resolve, reject) => {
            const transaction = db.transaction('workspaces', 'readwrite');
            transaction.objectStore('workspaces').put(workspace, scope);
            transaction.oncomplete = resolve;
            transaction.onabort = () => reject(transaction.error);
        });
    } finally {
        db.close();
    }
};
export const initialPreferences = () => {
    const seed = {};
    // Explicit list: never seed account caches, Git credentials, tokens or all
    // of localStorage into a realm which intentionally runs arbitrary JS.
    for (const key of ['tw:theme', 'tw:custom-themes', 'tw:language', 'tw:addons',
        'tw:restore-point-interval', 'tw:username-override']) {
        const value = localStorage.getItem(key);
        if (value !== null) seed[key] = value;
    }
    return seed;
};

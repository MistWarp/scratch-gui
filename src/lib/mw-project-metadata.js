/**
 * The sb3 `meta` block: who saved a project and when.
 *
 *   "meta": {
 *     ...,
 *     "author": {"username": "mist", "id": "..."},
 *     "created": "2026-07-01T…", // written once, then carried forward untouched
 *     "edited": "2026-07-13T…"   // rewritten every save
 *   }
 *
 * The VM has no hook for extra metadata, so both halves wrap VM methods — the
 * one funnel every save and load path goes through (download, autosave,
 * restore points, git, packager) rather than each of them doing its own thing.
 *
 * Authorship is only added for a signed-in account. Dates and the standard
 * Scratch user-agent field are written for every project save.
 */

let author = null;

// The `meta` of the project currently open, as loaded or most recently saved.
let loadedMeta = null;

// When this project first came into existence. Adopted from the file it was
// loaded from, otherwise minted at its first save — and then never touched
// again, so it survives every later save of the same project.
let created = null;

/**
 * Set (or clear, with null) the account whose name goes on saves.
 * @param {{username: string, id: string}|null} user The signed-in Rotur user.
 */
const setProjectAuthor = user => {
    author = user && user.username ? {
        username: user.username,
        id: user.id || null
    } : null;
};

/**
 * The `meta` of the open project as it was loaded, or null for a project that
 * has never been saved (a fresh one, or one saved before this existed).
 * @returns {object|null} The metadata.
 */
const getLoadedProjectMeta = () => loadedMeta;

/**
 * Wrap a VM so project saves carry authorship and loads remember it.
 * @param {VirtualMachine} vm The VM to stamp.
 */
const installProjectMetadata = vm => {
    const originalToJSON = vm.toJSON.bind(vm);
    vm.toJSON = (optTargetId, serializationOptions) => {
        const json = originalToJSON(optTargetId, serializationOptions);
        // Sprite exports have no project meta to stamp.
        if (optTargetId) return json;
        try {
            // ponytail: re-parses the whole project.json to add two keys. It is
            // dwarfed by the DEFLATE pass that follows it on every save; if that
            // ever stops being true, the fix is a `meta` hook in the VM's sb3
            // serializer, not string surgery here.
            const project = JSON.parse(json);
            if (!created) created = new Date().toISOString();
            project.meta = Object.assign({}, loadedMeta, project.meta, {
                created,
                edited: new Date().toISOString(),
                agent: typeof navigator === 'undefined' ? '' : navigator.userAgent
            });
            if (author) project.meta.author = Object.assign({}, author);
            // Migrate projects saved by the metadata draft before these names
            // were settled.
            delete project.meta.createdAt;
            delete project.meta.savedAt;
            loadedMeta = project.meta;
            return JSON.stringify(project);
        } catch (error) {
            // A save that loses its byline still beats a save that fails.
            return json;
        }
    };

    // deserializeProject is the one place the VM hands us the parsed project
    // json, so it is the only cheap way to see the meta a file arrived with.
    const originalDeserialize = vm.deserializeProject.bind(vm);
    vm.deserializeProject = (projectJSON, zip) => {
        loadedMeta = (projectJSON && projectJSON.meta) || null;
        // Opening a project adopts its birthday; opening one without a
        // recorded birthday means the next save mints one.
        created = (loadedMeta && (loadedMeta.created || loadedMeta.createdAt)) || null;
        return originalDeserialize(projectJSON, zip);
    };
};

export {
    setProjectAuthor,
    getLoadedProjectMeta,
    installProjectMetadata
};

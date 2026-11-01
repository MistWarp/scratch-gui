export type ProjectMeta = Record<string, unknown>;

export interface ProjectAuthor {
    username: string;
    id: string | null;
}

export interface ProjectMetadataHandler {
    serialize?: (value: unknown, meta: ProjectMeta) => unknown;
    deserialize?: (value: unknown, meta: ProjectMeta) => void;
}

export interface ProjectMetadataVM {
    registerProjectMetadata: (key: string, handler: ProjectMetadataHandler) => () => void;
}

const VM_KEYS = new Set(['semver', 'vm', 'origin', 'platform', 'agent']);
const OWN_KEYS = new Set(['created', 'edited', 'author']);
const RETIRED_KEYS = new Set(['createdAt', 'savedAt']);

let author: ProjectAuthor | null = null;
let loadedMeta: ProjectMeta | null = null;
let savedMeta: ProjectMeta | null = null;
let carried: ProjectMeta = {};
let created: string | null = null;

const carriedKeysByVm = new WeakMap<ProjectMetadataVM, Set<string>>();

export const setProjectAuthor = (user: {username?: string | null; id?: string | null} | null): void => {
    author = user?.username ? {username: user.username, id: user.id || null} : null;
};

export const getLoadedProjectMeta = (): ProjectMeta | null => savedMeta ?? loadedMeta;

const isCarriedKey = (key: string): boolean =>
    key !== '' && !VM_KEYS.has(key) && !OWN_KEYS.has(key) && !RETIRED_KEYS.has(key);

const carriedValue = (key: string) => (): unknown => carried[key];

const carryLoadedKeys = (vm: ProjectMetadataVM, registered: Set<string>): void => {
    for (const key of Object.keys(carried)) {
        if (registered.has(key) || !isCarriedKey(key)) continue;
        registered.add(key);
        vm.registerProjectMetadata(key, {serialize: carriedValue(key)});
    }
};

const recordedCreated = (value: unknown, meta: ProjectMeta): string | null => {
    const recorded = value || meta.createdAt;
    return typeof recorded === 'string' && recorded !== '' ? recorded : null;
};

export const installProjectMetadata = (vm: ProjectMetadataVM): void => {
    if (carriedKeysByVm.has(vm)) return;
    const registered = new Set<string>();
    carriedKeysByVm.set(vm, registered);

    vm.registerProjectMetadata('created', {
        serialize: (_value, meta) => {
            savedMeta = meta;
            created ??= new Date().toISOString();
            return created;
        },
        deserialize: (value, meta) => {
            loadedMeta = Object.keys(meta).length === 0 ? null : {...meta};
            savedMeta = null;
            carried = {...meta};
            created = recordedCreated(value, meta);
            carryLoadedKeys(vm, registered);
        }
    });
    vm.registerProjectMetadata('edited', {
        serialize: () => new Date().toISOString()
    });
    vm.registerProjectMetadata('agent', {
        serialize: () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)
    });
    vm.registerProjectMetadata('author', {
        serialize: () => {
            if (author) carried.author = {...author};
            return carried.author;
        }
    });
};

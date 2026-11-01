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

interface ProjectMetadataState {
    loadedMeta: ProjectMeta | null;
    savedMeta: ProjectMeta | null;
    carried: ProjectMeta;
    created: string | null;
}

const OWN_KEYS = new Set(['created', 'edited', 'agent', 'author']);
const RETIRED_KEYS = new Set(['createdAt', 'savedAt']);

let author: ProjectAuthor | null = null;

const states = new WeakMap<ProjectMetadataVM, ProjectMetadataState>();

export const setProjectAuthor = (user: {username?: string | null; id?: string | null} | null): void => {
    author = user?.username ? {username: user.username, id: user.id || null} : null;
};

export const getLoadedProjectMeta = (vm: ProjectMetadataVM): ProjectMeta | null => {
    const state = states.get(vm);
    return state ? state.savedMeta ?? state.loadedMeta : null;
};

const carryUnwrittenKeys = (state: ProjectMetadataState, meta: ProjectMeta): void => {
    for (const [key, value] of Object.entries(state.carried)) {
        if (key in meta || OWN_KEYS.has(key) || RETIRED_KEYS.has(key)) continue;
        meta[key] = value;
    }
};

const recordedCreated = (value: unknown, meta: ProjectMeta): string | null => {
    const recorded = value || meta.createdAt;
    return typeof recorded === 'string' && recorded !== '' ? recorded : null;
};

export const installProjectMetadata = (vm: ProjectMetadataVM): void => {
    if (states.has(vm)) return;
    const state: ProjectMetadataState = {loadedMeta: null, savedMeta: null, carried: {}, created: null};
    states.set(vm, state);

    vm.registerProjectMetadata('created', {
        serialize: (_value, meta) => {
            carryUnwrittenKeys(state, meta);
            state.savedMeta = meta;
            state.created ??= new Date().toISOString();
            return state.created;
        },
        deserialize: (value, meta) => {
            state.loadedMeta = Object.keys(meta).length === 0 ? null : {...meta};
            state.savedMeta = null;
            state.carried = {...meta};
            state.created = recordedCreated(value, meta);
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
            if (author) state.carried.author = {...author};
            return state.carried.author;
        }
    });
};

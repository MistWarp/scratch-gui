export type ScratchBlocksLibrary = object;
export type BlocksWorkspace = object;

type WorkspaceListener = (workspace: BlocksWorkspace | null) => void;

let library: ScratchBlocksLibrary | null = null;
let workspace: BlocksWorkspace | null = null;
const libraryWaiters: ((loaded: ScratchBlocksLibrary) => void)[] = [];
const workspaceListeners = new Set<WorkspaceListener>();

export const setScratchBlocks = (loaded: ScratchBlocksLibrary): void => {
    library = loaded;
    for (const resolve of libraryWaiters.splice(0)) resolve(loaded);
};

export const getScratchBlocks = (): ScratchBlocksLibrary | null => library;

export const whenScratchBlocks = (): Promise<ScratchBlocksLibrary> => (
    library ? Promise.resolve(library) : new Promise(resolve => {
        libraryWaiters.push(resolve);
    })
);

export const setActiveWorkspace = (next: BlocksWorkspace | null): void => {
    if (next === workspace) return;
    workspace = next;
    for (const listener of [...workspaceListeners]) listener(next);
};

export const getActiveWorkspace = (): BlocksWorkspace | null => workspace;

export const onActiveWorkspace = (listener: WorkspaceListener): (() => void) => {
    workspaceListeners.add(listener);
    return () => {
        workspaceListeners.delete(listener);
    };
};

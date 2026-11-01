export interface BlocksEvent {
    readonly type: string;
    readonly workspaceId?: string;
    readonly blockId?: string;
}

export type BlocksEventListener = (event: BlocksEvent) => void;

export interface BlocksBlock {
    readonly id: string;
    readonly type: string;
    getSvgRoot: () => SVGGElement | null;
}

export interface BlocksWorkspace {
    readonly id: string;
    getBlockById: (id: string) => BlocksBlock | null;
    getAllBlocks: (ordered: boolean) => BlocksBlock[];
    getTopBlocks: (ordered: boolean) => BlocksBlock[];
    addChangeListener: (listener: BlocksEventListener) => BlocksEventListener;
    removeChangeListener: (listener: BlocksEventListener) => void;
    getParentSvg: () => SVGSVGElement | null;
}

export interface ScratchBlocksLibrary {
    getMainWorkspace: () => BlocksWorkspace | null;
    Events: {
        fire: (event: BlocksEvent) => void;
        disable: () => void;
        enable: () => void;
        isEnabled: () => boolean;
    };
    Xml: {
        domToText: (dom: Node) => string;
        textToDom: (text: string) => Element;
        blockToDom: (block: BlocksBlock) => Element;
    };
}

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

export const resetBlocksRegistryForTests = (): void => {
    library = null;
    workspace = null;
    libraryWaiters.length = 0;
    workspaceListeners.clear();
};

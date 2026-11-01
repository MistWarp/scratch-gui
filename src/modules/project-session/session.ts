export interface HistoryHydration {
    key: string;
    projectId?: string;
    ready: boolean;
    manifest: unknown;
    replaceHistory?: boolean;
    promise: Promise<unknown> | null;
}

interface WorkspaceState {
    pendingDiskOverwrite: boolean;
    requireExplicitPush: boolean;
    approvedRemotes: Set<string>;
    historyHydration: HistoryHydration | null;
}

export interface ProjectSession extends WorkspaceState {
    canTrustProject: boolean;
    historyBootstrapError: Error | null;
}

const newSession = (): ProjectSession => ({
    pendingDiskOverwrite: false,
    requireExplicitPush: false,
    approvedRemotes: new Set(),
    historyHydration: null,
    canTrustProject: false,
    historyBootstrapError: null
});

const detachedWorkspace = (): WorkspaceState => ({
    pendingDiskOverwrite: false,
    requireExplicitPush: true,
    approvedRemotes: new Set(),
    historyHydration: null
});

const sessions = new WeakMap<object, ProjectSession>();

export const projectSession = (vm: object): ProjectSession => {
    let session = sessions.get(vm);
    if (!session) {
        session = newSession();
        sessions.set(vm, session);
    }
    return session;
};

export const resetProjectSession = (vm: object): ProjectSession =>
    Object.assign(projectSession(vm), detachedWorkspace());

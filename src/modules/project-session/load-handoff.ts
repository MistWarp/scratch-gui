export interface RollbackOptions {
    abort?: boolean;
    error?: unknown;
}

export interface LoadHandoff {
    prepareHistory?: () => Promise<unknown>;
    release?: () => void;
    rollback?: (options?: RollbackOptions) => Promise<void>;
}

const handoffs = new WeakMap<object, LoadHandoff>();

export const setLoadHandoff = (vm: object, handoff: LoadHandoff): void => {
    handoffs.set(vm, handoff);
};

export const takeLoadHandoff = (vm: object): LoadHandoff => {
    const handoff = handoffs.get(vm) ?? {};
    handoffs.delete(vm);
    return handoff;
};

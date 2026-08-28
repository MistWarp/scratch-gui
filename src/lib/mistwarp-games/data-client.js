import {request} from '../community/api.js';

const capabilities = new Map();

const capabilityKey = (projectId, context) => `${projectId}:${context}`;

const createCapability = async (projectId, context) => {
    const result = await request(`/projects/${encodeURIComponent(projectId)}/data-capability`, {
        method: 'POST',
        body: {context}
    });
    capabilities.set(capabilityKey(projectId, context), result);
    return result.capability;
};

const getCapability = (projectId, context) => {
    const key = capabilityKey(projectId, context);
    const current = capabilities.get(key);
    if (current && current.expiresAt > Date.now() + 5000) return current.capability;
    return createCapability(projectId, context);
};

const withCapability = async (projectId, context, callback) => {
    let capability = await getCapability(projectId, context);
    try {
        return await callback(capability);
    } catch (error) {
        if (error.status !== 403 && error.status !== 409) throw error;
        capabilities.delete(capabilityKey(projectId, context));
        capability = await getCapability(projectId, context);
        return callback(capability);
    }
};

const loadProjectSave = (projectId, context) => withCapability(projectId, context, capability =>
    request(`/projects/${encodeURIComponent(projectId)}/me/save`, {
        headers: {'X-MistWarp-Game-Data': capability},
        cache: false
    }).then(result => result.save)
);

const saveProjectData = (projectId, context, save) => withCapability(projectId, context, capability =>
    request(`/projects/${encodeURIComponent(projectId)}/me/save`, {
        method: 'PUT',
        body: save,
        headers: {'X-MistWarp-Game-Data': capability}
    }).then(result => result.save)
);

const loadGlobalGameData = (projectId, context) => withCapability(projectId, context, capability =>
    request(`/projects/${encodeURIComponent(projectId)}/me/global-data`, {
        headers: {'X-MistWarp-Game-Data': capability},
        cache: false
    }).then(result => result.data)
);

const loadProjectInventory = (projectId, context) => withCapability(projectId, context, capability =>
    request(`/projects/${encodeURIComponent(projectId)}/me/inventory`, {
        headers: {'X-MistWarp-Game-Data': capability},
        cache: false
    }).then(result => result.inventory)
);

const grantProjectItem = (projectId, context, item, requestId) =>
    withCapability(projectId, context, capability =>
        request(`/projects/${encodeURIComponent(projectId)}/me/inventory/grant`, {
            method: 'POST',
            body: {item, requestId},
            headers: {'X-MistWarp-Game-Data': capability}
        }).then(result => result.inventory)
    );

const clearCapabilities = () => capabilities.clear();

export {
    loadProjectSave,
    saveProjectData,
    loadGlobalGameData,
    loadProjectInventory,
    grantProjectItem,
    clearCapabilities
};

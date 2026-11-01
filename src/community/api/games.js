/* eslint-disable max-len */
import {request} from '../../lib/community/api.js';

export default {
    purchases: () => request('/me/purchases'),
    gameProducts: id => request(`/projects/${id}/products`, {cache: false}),
    ownsGameProduct: (id, product) => request(`/projects/${id}/products/${encodeURIComponent(product)}/owns`, {
        cache: false
    }),
    gameProductIntent: (id, product, returnUrl) => request(`/projects/${id}/products/${encodeURIComponent(product)}/purchase/intent`, {
        method: 'POST', body: {returnUrl}
    }),
    gameProductConfirm: (id, product, key) => request(`/projects/${id}/products/${encodeURIComponent(product)}/purchase/confirm`, {
        method: 'POST', body: {key}
    }),
    gameProductRefundIntent: (id, product, username, returnUrl) => request(`/projects/${id}/products/${encodeURIComponent(product)}/refund/intent`, {
        method: 'POST', body: {username, returnUrl}
    }),
    grantGameProduct: (id, product, username) => request(`/projects/${id}/products/${encodeURIComponent(product)}/grant`, {
        method: 'POST', body: {username}
    }),
    revokeGameProduct: (id, product, {username, refundKey, noRefund}) => request(`/projects/${id}/products/${encodeURIComponent(product)}/revoke`, {
        method: 'POST', body: {username, refundKey, noRefund}
    }),
    createGameDataCapability: (id, context) => request(`/projects/${id}/data-capability`, {
        method: 'POST', body: {context}
    }),
    createMultiplayerTicket: (id, context, room) => request(`/projects/${id}/multiplayer-ticket`, {
        method: 'POST', body: {context, room}
    }),
    getProjectSave: (id, capability) => request(`/projects/${id}/me/save`, {
        headers: {'X-MistWarp-Game-Data': capability}, cache: false
    }),
    putProjectSave: (id, capability, save) => request(`/projects/${id}/me/save`, {
        method: 'PUT', body: save, headers: {'X-MistWarp-Game-Data': capability}
    }),
    gameSaves: () => request('/me/game-saves', {cache: false}),
    deleteGameSave: id => request(`/me/game-saves/${id}`, {method: 'DELETE'}),
    gameInventory: () => request('/me/game-inventory', {cache: false}),
    gameInventoryConfig: id => request(`/projects/${id}/game-inventory-config`, {cache: false})
};

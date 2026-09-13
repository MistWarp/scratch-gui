import {Rotur} from 'rotur-sdk';
import {scopesUsedByProject} from 'scratch-vm/src/extensions/rotur/core';
import {APP_NAME} from '../../lib/constants/brand';

const ACCOUNT_EXTENSIONS = new Set([
  'rotur', 'roturEconomy', 'roturKeys', 'roturStatus', 'roturSocial', 'roturShop', 'roturGroups', 'roturFiles',
  'mistwarpPlayers', 'mistwarpMultiplayer', 'mistwarpData', 'mistwarpMarketplace', 'mistwarpInventory'
]);

export const accountExtensionsUsed = runtime => [...new Set(runtime.targets.flatMap(target =>
  Object.values(target.blocks && target.blocks._blocks || {}).map(block => String(block.opcode).split('_')[0])
))].filter(id => ACCOUNT_EXTENSIONS.has(id));

const readJSON = async response => {
  const data = await response.json();
  if (!response.ok || data.error || data.ok === false) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

// A separate client belongs to this exported player. Editor credentials are never copied into exports.
export const createAccountHost = (runtime, options = {}, Client = Rotur) => {
  const client = new Client();
  let user = {loggedIn: false, username: '', id: ''};
  let granted = [];
  let session = '';
  let capability = null;
  let ready = Promise.resolve();
  let prompt = null;
  const projectId = String(options.projectId || '');
  const projectPath = `/projects/${encodeURIComponent(projectId)}`;
  const title = options.title || document.title || APP_NAME;

  const showAction = (heading, description, label, action) => {
    if (prompt) return prompt;
    prompt = new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#000b;font:16px system-ui;color:#eee';
      const card = document.createElement('section');
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-label', heading);
      card.style.cssText = 'background:#202027;padding:24px;border-radius:12px;width:min(420px,85vw)';
      const h = document.createElement('h2');
      h.textContent = heading;
      const text = document.createElement('p');
      text.textContent = description;
      const error = document.createElement('p');
      error.setAttribute('role', 'alert');
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = 'padding:10px 16px;cursor:pointer;font:inherit';
      button.onclick = async () => {
        button.disabled = true;
        error.textContent = '';
        try {
          const result = await action();
          overlay.remove();
          prompt = null;
          resolve(result);
        } catch (e) {
          error.textContent = e.message;
          button.disabled = false;
        }
      };
      card.append(h, text, error, button);
      overlay.append(card);
      document.body.append(overlay);
      button.focus();
    });
    return prompt;
  };

  const ensureConsent = async scopes => {
    if (prompt) {
      await prompt;
      return ensureConsent(scopes);
    }
    const requested = [...new Set(['account:view', ...granted, ...(scopes || [])])];
    if (user.loggedIn && requested.every(scope => granted.includes(scope))) return true;
    return showAction(`Sign in to play ${title}`, 'This project uses your Rotur account. Rotur will show the permissions it requests.',
      'Sign in with Rotur', async () => {
        await client.login({system: `${APP_NAME}: ${title}`.slice(0, 80), requires: requested, timeout: 120000});
        const profile = await client.me.get();
        if (!profile || !profile.username) throw new Error('Could not verify the signed-in account. Please try again.');
        user = {loggedIn: true, username: profile.username, id: String(profile.id || '')};
        granted = requested;
        session = '';
        capability = null;
        runtime.ioDevices.userData.postData({username: user.username});
        return true;
      });
  };

  const request = async (path, method = 'GET', body, headers = {}) => {
    if (!user.loggedIn) throw new Error('Sign in with Rotur to use this project.');
    if (!session) {
      await ensureConsent(['validators:generate']);
      const validation = await client.validators.generate('mistwarp');
      const auth = await readJSON(await fetch(`https://api.mistwarp.org/v1/auth?v=${encodeURIComponent(validation.validator)}`,
        {method: 'POST'}));
      session = auth.token;
    }
    return readJSON(await fetch(`https://api.mistwarp.org/v1${path}`, {
      method, headers: {...headers, Authorization: `Bearer ${session}`, 'Content-Type': 'application/json'},
      ...(body === undefined ? {} : {body: JSON.stringify(body)})
    }));
  };

  const gameData = async (path, method, body) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!capability || capability.expiresAt <= Date.now() + 5000) {
        capability = await request(`${projectPath}/data-capability`, 'POST', {context: 'play'});
      }
      try {
        return await request(`${projectPath}${path}`, method, body, {'X-MistWarp-Game-Data': capability.capability});
      } catch (e) {
        capability = null;
        if (attempt || ![403, 409].includes(e.status)) throw e;
      }
    }
  };

  const roturHost = {
    whenReady: () => ready,
    getUser: () => user,
    projectId: () => projectId || options.storageId || title,
    projectName: () => title,
    projectImage: () => '',
    grantedScopes: () => granted.slice(),
    ensureConsent,
    async call (method, args = [], opts = {}) {
      await ready;
      if (!user.loggedIn) throw new Error('Sign in with Rotur to use this project.');
      if (opts.sensitive && !window.confirm(`${opts.label || method}\n${opts.confirmation ? JSON.stringify(opts.confirmation) : ''}`)) {
        throw new Error('You cancelled this Rotur action');
      }
      if (['socket.addActivity', 'socket.setStatus'].includes(method) &&
          !window.confirm(`Allow ${title} to update your Rotur activity?`)) return '';
      const parts = method.split('.');
      if (parts.some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error('Invalid Rotur method');
      if (parts[0] === 'socket' && (!client.socket || !client.socket.connected)) await client.connectSocket();
      let owner = client;
      for (const part of parts.slice(0, -1)) owner = owner && owner[part];
      const fn = owner && owner[parts[parts.length - 1]];
      if (typeof fn !== 'function') throw new Error(`Unknown Rotur method: ${method}`);
      return fn.apply(owner, args);
    }
  };

  const draftKey = () => `mw:export-save:${options.storageId || title}:${user.id || user.username}`;
  const gamesHost = {
    whenReady: () => ready,
    getUser: () => user,
    subscribe: () => () => {},
    async call (method, args = []) {
      await ready;
      if (!user.loggedIn) throw new Error('Sign in with Rotur to use this project.');
      // Multiplayer is disabled in the editor too.
      if (method === 'multiplayer.connect') return {connected: false, self: '', players: [], status: 'multiplayer disabled'};
      if (method === 'multiplayer.disconnect') return {connected: false};
      if (method === 'multiplayer.players') return [];
      if (method.startsWith('multiplayer.')) return false;
      if (!projectId) {
        const save = JSON.parse(localStorage.getItem(draftKey()) || '{"revision":0,"value":{}}');
        if (method === 'data.load') return save;
        if (method === 'data.save') {
          const next = {value: args[0].value, revision: save.revision + 1};
          localStorage.setItem(draftKey(), JSON.stringify(next));
          return next;
        }
        if (method === 'inventory.load' || method === 'inventory.grant') return {revision: 0, items: []};
        if (method === 'marketplace.owns') return runtime.ownsProduct ? runtime.ownsProduct(args[0], user.username) : false;
        throw new Error('Publish this project to MistWarp before using its shop or shared inventory.');
      }
      if (method === 'data.load') return (await gameData('/me/save', 'GET')).save;
      if (method === 'data.save') return (await gameData('/me/save', 'PUT', args[0])).save;
      if (method === 'inventory.load') return (await gameData('/me/inventory', 'GET')).inventory;
      if (method === 'inventory.grant') return (await gameData('/me/inventory/grant', 'POST', args[0])).inventory;
      if (method === 'marketplace.owns') return (await request(`${projectPath}/products/${encodeURIComponent(args[0])}/owns`)).owned;
      if (method === 'marketplace.open' || method === 'marketplace.purchase') {
        return options.openShop(projectId, method === 'marketplace.purchase' ? args[0] : '', {request, ensureConsent, client, showAction});
      }
      if (method === 'marketplace.configure') {
        const current = await request(`${projectPath}/products`);
        const gameProducts = (current.products || []).filter(item => item.id !== args[0].id);
        gameProducts.push(args[0]);
        await request(projectPath, 'PUT', {gameProducts});
        return true;
      }
      const config = method.startsWith('inventory.') ? await request(`${projectPath}/game-inventory-config`) : null;
      if (method === 'inventory.configureItem') {
        const gameItems = (config.items || []).filter(item => item.id !== args[0].id);
        gameItems.push(args[0]);
        await request(projectPath, 'PUT', {gameItems});
      } else if (method === 'inventory.setPolicy') {
        await request(projectPath, 'PUT', {inventoryPolicy: {...config.policy, mode: String(args[0])}});
      } else if (method === 'inventory.allowItem' || method === 'inventory.allowProject') {
        const field = method === 'inventory.allowItem' ? 'allowedItems' : 'allowedProjects';
        await request(projectPath, 'PUT', {inventoryPolicy: {...config.policy, mode: 'allowlist',
          [field]: [...new Set([...(config.policy[field] || []), String(args[0])])]}});
      } else {
        throw new Error(`Unknown MistWarp method: ${method}`);
      }
      return true;
    }
  };

  runtime.roturHost = roturHost;
  runtime.mistwarpGameHost = gamesHost;
  return {
    async prepare () {
      const used = accountExtensionsUsed(runtime);
      if (!used.length) return;
      const scopes = scopesUsedByProject(runtime);
      if (used.some(id => id.startsWith('mistwarp')) && projectId) scopes.push('validators:generate');
      ready = ensureConsent(scopes);
      await ready;
    }
  };
};

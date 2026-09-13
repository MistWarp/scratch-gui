import * as memoryIndexedDB from 'fake-indexeddb';

export const createMemoryStorage = () => {
  const values = new Map();
  const storage = {
    get length () { return values.size; },
    key: index => [...values.keys()][Number(index)] ?? null,
    getItem: key => values.get(String(key)) ?? null,
    setItem: (key, value) => { values.set(String(key), String(value)); },
    removeItem: key => { values.delete(String(key)); },
    clear: () => values.clear()
  };
  return new Proxy(storage, {
    get: (target, key) => key in target ? target[key] : storage.getItem(key) ?? undefined,
    set: (target, key, value) => { storage.setItem(key, value); return true; },
    deleteProperty: (target, key) => { storage.removeItem(key); return true; },
    ownKeys: () => [...values.keys()],
    getOwnPropertyDescriptor: (target, key) => values.has(key) ?
      {configurable: true, enumerable: true, writable: true, value: values.get(key)} : undefined
  });
};

export const installBrowserStorage = target => {
  let isolated = false;
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      target[name].getItem('__mw_storage_check__');
    } catch (_) {
      isolated = true;
      Object.defineProperty(target, name, {configurable: true, value: createMemoryStorage()});
    }
  }
  try {
    if (!isolated && target.indexedDB) return;
  } catch (_) { /* Sandboxed previews have an opaque origin. */ }
  for (const [name, value] of Object.entries(memoryIndexedDB)) {
    if (name.startsWith('IDB') || name === 'indexedDB') {
      Object.defineProperty(target, name, {configurable: true, value});
    }
  }
};

installBrowserStorage(window);

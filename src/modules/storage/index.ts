import {createStore} from './store';
import {
    isLegacyAddonEnabled as isEnabledIn,
    readLegacyAddonSettings as readFrom,
    type LegacyAddonSettings
} from './legacy-addons';

export type {KeyValueArea, Store} from './store';
export type {LegacyAddonSettings} from './legacy-addons';
export {createStore} from './store';

export const local = createStore(() => globalThis.localStorage);
export const session = createStore(() => globalThis.sessionStorage);

export const readLegacyAddonSettings = (): LegacyAddonSettings => readFrom(local);
export const isLegacyAddonEnabled = (addonId: string): boolean => isEnabledIn(local, addonId);

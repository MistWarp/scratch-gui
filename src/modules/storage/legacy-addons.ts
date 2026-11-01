import type {Store} from './store';

const LEGACY_ADDON_SETTINGS_KEY = 'tw:addons';

export type LegacyAddonSettings = Partial<Record<string, Record<string, unknown>>>;

const isRecord = (value: unknown): value is LegacyAddonSettings =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const readLegacyAddonSettings = (store: Store): LegacyAddonSettings =>
    store.readJSON(LEGACY_ADDON_SETTINGS_KEY, {}, isRecord);

export const isLegacyAddonEnabled = (store: Store, addonId: string): boolean =>
    Boolean(readLegacyAddonSettings(store)[addonId]?.enabled);

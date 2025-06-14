import ProgressiveLoader, {LoadPriority} from '../lib/progressive-loader.js';

const progressiveLoader = new ProgressiveLoader();

/**
 * Helper function to determine if an addon is enabled by default
 * @param {string} addonId - The ID of the addon to check
 * @returns {boolean} Whether the addon is enabled by default
 */
const isDefaultAddon = (addonId) => {
    const defaultAddons = [
        'cat-blocks',
        'editor-devtools',
        'debugger',
        'drag-drop',
        'pause'
    ];
    return defaultAddons.includes(addonId);
};

const runAddons = () => {
    // Register core addons with different priorities
    progressiveLoader.register(
        'addons-api',
        () => import(/* webpackChunkName: "addons-api" */ './api'),
        LoadPriority.HIGH
    );

    // Register default addons as high priority
    progressiveLoader.register(
        'default-addons',
        () => import(/* webpackChunkName: "default-addons" */ './generated/addon-entries')
            .then(module => {
                // Load only enabled by default addons first
                const defaultAddonPromises = [];
                for (const [id, loader] of Object.entries(module.default)) {
                    if (isDefaultAddon(id)) {
                        defaultAddonPromises.push(loader());
                    }
                }
                return Promise.all(defaultAddonPromises);
            }),
        LoadPriority.HIGH
    );

    // Register optional addons as medium priority
    progressiveLoader.register(
        'optional-addons',
        () => import(/* webpackChunkName: "optional-addons" */ './generated/addon-entries')
            .then(module => {
                const optionalAddonPromises = [];
                for (const [id, loader] of Object.entries(module.default)) {
                    if (!isDefaultAddon(id)) {
                        optionalAddonPromises.push(loader());
                    }
                }
                return Promise.all(optionalAddonPromises);
            }),
        LoadPriority.MEDIUM
    );

    // Start progressive loading
    progressiveLoader.startLoading();

    return progressiveLoader;
};

export default runAddons;

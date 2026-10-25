import log from './utils/log';

// The sandbox's own errors for a script it couldn't fetch or that never registered.
const UNHELPED_BY_FULL_ACCESS = /Error in sandboxed script|did not finish registering|Failed to load extension script/;

/**
 * Whether a link's extension URL may be offered full access after it fails in the sandbox:
 * https (or this machine), no credentials, and written the way the browser would load it,
 * so the host the prompt shows is the host the code comes from.
 * @param {string} url The extension's URL
 * @returns {boolean} True if it may be offered
 */
const canOfferFullAccessFor = url => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return false;
    }
    const local = parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    return parsed.href === url &&
        (parsed.protocol === 'https:' || local) &&
        !parsed.username &&
        !parsed.password;
};

/**
 * Loads the extensions a link names (?extension=). Some extensions need the page itself and
 * fail in the sandbox; the first of those may be offered full access, once per page, and only
 * when the editor isn't framed by another site or showing just the player, where a prompt
 * could be clicked for someone.
 * @param {string[]} urls The link's extension parameters
 * @param {object} options How to load them
 * @param {object} options.manager The VM's extension manager
 * @param {boolean} options.mayAskFullAccess Whether this page may ask at all
 * @param {Function} options.onError Called once for each extension that couldn't load
 * @returns {Promise<void>} Resolves when every extension has loaded or failed
 */
const loadLinkedExtensions = (urls, {manager, mayAskFullAccess, onError}) => {
    let offered = false;
    const security = manager.securityManager;

    const offerFullAccess = async (url, error) => {
        if (offered || !mayAskFullAccess || url === 'patching' || !canOfferFullAccessFor(url)) return false;
        // A script that couldn't be fetched, or never registered, fails the same way unsandboxed.
        if (UNHELPED_BY_FULL_ACCESS.test(String(error && error.message))) return false;
        if (typeof security.canRetryUnsandboxed !== 'function') return false;
        offered = true;
        const mode = await Promise.resolve(security.getSandboxMode(url)).catch(() => null);
        if (mode === 'unsandboxed') return false;
        // It registered something before failing, so it's loaded (sandboxed) already.
        if (manager.isExtensionURLLoaded && manager.isExtensionURLLoaded(url)) return false;
        return Boolean(await security.canRetryUnsandboxed(url));
    };

    return Promise.all([...new Set(urls)].map(url => {
        const allowed = url === 'patching' ?
            Promise.resolve(security.canLoadExtensionFromProject('builtin:patching')) :
            Promise.resolve(true);
        return allowed
            .then(ok => (ok ? manager.loadExtensionURL(url) : null))
            .catch(async error => {
                if (await offerFullAccess(url, error)) return manager.loadExtensionURL(url);
                throw error;
            })
            .catch(error => {
                log.error(`Could not load extension from URL parameter: ${url}`, error);
                onError(error);
            });
    })).then(() => {});
};

export {canOfferFullAccessFor, loadLinkedExtensions};

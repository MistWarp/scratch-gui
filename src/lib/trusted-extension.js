const isTrustedExtensionUrl = url => (
    url.startsWith('https://extensions.turbowarp.org/') ||
    url.startsWith('https://extensions.mistium.com/') ||
    url.startsWith('http://localhost:8000/')
);

export default isTrustedExtensionUrl;

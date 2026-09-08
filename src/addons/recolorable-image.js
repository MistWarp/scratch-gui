const decodeSvg = source => {
    const match = /^data:image\/svg\+xml((?:;[^,]*)?),(.*)$/is.exec(source);
    if (!match) return null;
    const data = decodeURIComponent(match[2]);
    if (!/;base64(?:;|$)/i.test(match[1])) return data;
    return new TextDecoder().decode(Uint8Array.from(atob(data), char => char.charCodeAt(0)));
};

/**
 * Create an SVG image which updates when the editor accent changes.
 * @param {function} getColor Read the current accent colour.
 * @param {Array<function>} callbacks Theme update callbacks.
 * @returns {HTMLImageElement} An image accepting inline SVGs and file URLs.
 */
export default function createRecolorableImage (getColor, callbacks) {
    const image = document.createElement('img');
    const nativeSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    let source = '';
    let svg = null;
    let revision = 0;
    const update = () => {
        if (svg === null) return;
        const recolored = svg.replace(/#855cd6/gi, () => getColor());
        nativeSrc.set.call(image, `data:image/svg+xml,${encodeURIComponent(recolored)}`);
    };
    Object.defineProperty(image, 'src', {
        get: () => source,
        set: value => {
            source = String(value);
            svg = null;
            const current = ++revision;
            nativeSrc.set.call(image, source);
            try {
                svg = decodeSvg(source);
                if (svg !== null) {
                    update();
                    return;
                }
                // Vite serves larger and development assets as file URLs.
                const url = new URL(source, document.baseURI);
                if (!/\.svg$/i.test(url.pathname)) return;
                fetch(url.href).then(response => {
                    if (!response.ok) throw new Error('Could not load SVG');
                    return response.text();
                })
                    .then(text => {
                        if (current !== revision || !/<svg[\s>]/i.test(text)) return;
                        svg = text;
                        update();
                    })
                    .catch(() => {
                    // Keep the native image source if recoloring is unavailable.
                    });
            } catch (e) {
                // Invalid data URLs should behave like ordinary broken images.
            }
        }
    });
    callbacks.push(update);
    return image;
}

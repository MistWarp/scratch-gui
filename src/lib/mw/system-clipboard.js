let systemClipboardActive = false;

const stripBlockPositionAttributes = xml => {
    if (!xml || xml.nodeType !== 1) return;

    if (/^(block|comment)$/i.test(xml.tagName)) {
        xml.removeAttribute('x');
        xml.removeAttribute('y');
    }

    for (let child = xml.firstChild; child; child = child.nextSibling) {
        stripBlockPositionAttributes(child);
    }
};

const isFirefox = () => typeof navigator !== 'undefined' &&
        typeof navigator.userAgent === 'string' &&
        navigator.userAgent.includes('Firefox');
    
const canWriteText = () => !isFirefox() &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    navigator.clipboard.writeText;

const canReadText = () => !isFirefox() &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    navigator.clipboard.readText;

const decodeBase64Utf8 = value => {
    if (typeof atob !== 'function') return null;
    try {
        return decodeURIComponent(escape(atob(value)));
    } catch (e) {
        return null;
    }
};

const encodeBase64Utf8 = value => {
    if (typeof btoa !== 'function') return null;
    try {
        return btoa(unescape(encodeURIComponent(value)));
    } catch (e) {
        return null;
    }
};

const installSystemClipboardForBlocks = (ScratchBlocks, vm, onImportError) => {
    if (ScratchBlocks) {
        ScratchBlocks.__mistwarpSystemBlocksClipboardImportError = onImportError;
    }
    if (!ScratchBlocks || ScratchBlocks.__mistwarpSystemBlocksClipboardInstalled) return;
    ScratchBlocks.__mistwarpSystemBlocksClipboardInstalled = true;

    let readAccessDenied = false;
    let writeAccessDenied = false;

    const getExtensionMetaForXml = xml => {
        if (!vm || !vm.extensionManager || !xml) return null;

        const corePrefixes = new Set([
            'motion',
            'looks',
            'sound',
            'event',
            'events',
            'control',
            'sensing',
            'operator',
            'data',
            'procedures'
        ]);

        const extensionIds = new Set();
        const nodes = [xml];
        while (nodes.length) {
            const node = nodes.pop();
            if (!node || node.nodeType !== 1) continue;
            if (/^(block|shadow)$/i.test(node.tagName)) {
                const type = node.getAttribute('type');
                if (type && type.includes('_')) {
                    const prefix = type.split('_')[0];
                    if (prefix && !corePrefixes.has(prefix) && vm.extensionManager.isExtensionLoaded(prefix)) {
                        extensionIds.add(prefix);
                    }
                }
            }
            for (let child = node.firstChild; child; child = child.nextSibling) nodes.push(child);
        }

        if (extensionIds.size === 0) return null;

        const urls = {};
        if (typeof vm.extensionManager.getExtensionURLs === 'function') {
            const extensionURLs = vm.extensionManager.getExtensionURLs() || {};
            extensionIds.forEach(id => {
                if (extensionURLs[id]) urls[id] = extensionURLs[id];
            });
        }

        return {
            v: 1,
            ids: Array.from(extensionIds),
            urls
        };
    };

    const serializeClipboardXmlToText = (xml, meta) => {
        if (!ScratchBlocks.Xml || !ScratchBlocks.Xml.domToText) return null;
        if (!xml) return null;

        try {
            const clone = xml.cloneNode(true);

            stripBlockPositionAttributes(clone);

            const xmlText = ScratchBlocks.Xml.domToText(clone);

            if (meta) {
                const encoded = encodeBase64Utf8(JSON.stringify(meta));
                if (encoded) {
                    return `<!--mistwarp-extensions-base64:${encoded}-->${xmlText}`;
                }
            }

            return `<!--mistwarp-->${xmlText}`;
        } catch (e) {
            return null;
        }
    };

    const guessExtensionMetaForXml = xml => {
        if (!vm || !vm.extensionManager || !xml) return null;

        const corePrefixes = new Set([
            'motion',
            'looks',
            'sound',
            'event',
            'events',
            'control',
            'sensing',
            'operator',
            'data',
            'procedures'
        ]);

        const extensionIds = new Set();
        const nodes = [xml];
        while (nodes.length) {
            const node = nodes.pop();
            if (!node || node.nodeType !== 1) continue;
            if (/^(block|shadow)$/i.test(node.tagName)) {
                const type = node.getAttribute('type');
                if (type && type.includes('_')) {
                    const prefix = type.split('_')[0];
                    if (prefix && !corePrefixes.has(prefix)) {
                        extensionIds.add(prefix);
                    }
                }
            }
            for (let child = node.firstChild; child; child = child.nextSibling) nodes.push(child);
        }

        if (extensionIds.size === 0) return null;

        return {
            v: 1,
            ids: Array.from(extensionIds),
            urls: {}
        };
    };

    const parseClipboardTextToBlockXml = text => {
        if (!ScratchBlocks.Xml || !ScratchBlocks.Xml.textToDom) return null;
        if (typeof text !== 'string') return null;
        const trimmed = text.trim();
        if (!trimmed) return null;

        if (!trimmed.startsWith('<!--mistwarp')) return null;

        try {
            const xmlDom = ScratchBlocks.Xml.textToDom(`<xml>${trimmed}</xml>`);
            let meta = null;
            for (let child = xmlDom.firstChild; child; child = child.nextSibling) {
                if (child.nodeType === 8) {
                    const value = child.nodeValue || '';
                    const prefix = 'mistwarp-extensions-base64:';
                    const idx = value.indexOf(prefix);
                    if (idx !== -1) {
                        const encoded = value.slice(idx + prefix.length).trim();
                        const decoded = decodeBase64Utf8(encoded);
                        if (decoded) {
                            try {
                                meta = JSON.parse(decoded);
                            } catch (e) {
                                // ignore
                            }
                        }
                    }
                }
            }

            for (let child = xmlDom.firstChild; child; child = child.nextSibling) {
                if (child.nodeType === 1) return {xml: child, meta};
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const ensureExtensionsLoaded = async meta => {
        if (!meta || !vm || !vm.extensionManager) return;
        const ids = Array.isArray(meta.ids) ? meta.ids : [];
        const urls = meta.urls && typeof meta.urls === 'object' ? meta.urls : {};

        for (const id of ids) {
            if (!id) continue;
            if (vm.extensionManager.isExtensionLoaded(id)) continue;

            const url = urls[id];
            if (url) {
                await vm.extensionManager.loadExtensionURL(url);
            } else {
                vm.extensionManager.loadExtensionIdSync(id);
            }
        }
    };

    const pasteFromCurrentClipboardXml = () => {
        if (!ScratchBlocks.clipboardXml_) return;
        let workspace = ScratchBlocks.clipboardSource_;
        if (!workspace) workspace = ScratchBlocks.mainWorkspace;
        if (!workspace) return;
        if (workspace.isFlyout) workspace = workspace.targetWorkspace;
        ScratchBlocks.Events.setGroup(true);
        try {
            workspace.paste(ScratchBlocks.clipboardXml_);
        } finally {
            ScratchBlocks.Events.setGroup(false);
        }
    };

    const originalCopy = ScratchBlocks.copy_;
    const originalDuplicate = ScratchBlocks.duplicate_;
    const originalOnKeyDown = ScratchBlocks.onKeyDown_;

    ScratchBlocks.duplicate_ = function (...args) {
        ScratchBlocks.__mistwarpSkipSystemBlocksClipboardWrite = true;
        try {
            return originalDuplicate.apply(this, args);
        } finally {
            ScratchBlocks.__mistwarpSkipSystemBlocksClipboardWrite = false;
        }
    };

    ScratchBlocks.copy_ = function (...args) {
        const result = originalCopy.apply(this, args);

        if (
            systemClipboardActive ||
            ScratchBlocks.__mistwarpSkipSystemBlocksClipboardWrite ||
            !canWriteText() ||
            writeAccessDenied
        ) {
            return result;
        }

        const meta = getExtensionMetaForXml(ScratchBlocks.clipboardXml_);
        ScratchBlocks.__mistwarpSystemClipboardExtensionMeta = meta;
        const text = serializeClipboardXmlToText(ScratchBlocks.clipboardXml_, meta);

        if (text) {
            navigator.clipboard.writeText(text)
                .catch(err => {
                    if (err.name === 'NotAllowedError') {
                        writeAccessDenied = true;
                    }
                });
        }

        return result;
    };


    ScratchBlocks.onKeyDown_ = function (e) {
        const isPasteShortcut = (e.ctrlKey || e.metaKey) && !e.altKey && e.keyCode === 86;
        if (!isPasteShortcut) {
            return originalOnKeyDown.call(this, e);
        }

        if (!canReadText() || readAccessDenied) {
            return pasteFromCurrentClipboardXml();
        }

        if (ScratchBlocks.mainWorkspace.options.readOnly ||
        ScratchBlocks.utils.isTargetInput(e) ||
        (ScratchBlocks.mainWorkspace.rendered && !ScratchBlocks.mainWorkspace.isVisible()) ||
        ScratchBlocks.mainWorkspace.isDragging()) {
            return;
        }

        systemClipboardActive = true;

        const pasteSystemClipboard = navigator.clipboard.readText()
            .then(async text => {
                const parsed = parseClipboardTextToBlockXml(text);
                if (!parsed || !parsed.xml) {
                    return pasteFromCurrentClipboardXml();
                }

                const {xml, meta} = parsed;

                ScratchBlocks.clipboardXml_ = xml;
                ScratchBlocks.clipboardSource_ = ScratchBlocks.mainWorkspace;
                ScratchBlocks.__mistwarpSystemClipboardExtensionMeta =
                meta || guessExtensionMetaForXml(xml);

                await ensureExtensionsLoaded(
                    ScratchBlocks.__mistwarpSystemClipboardExtensionMeta
                );

                pasteFromCurrentClipboardXml();
            }, err => {
                if (err.name === 'NotAllowedError') {
                    readAccessDenied = true;
                }
                pasteFromCurrentClipboardXml();
            });

        pasteSystemClipboard
            .catch(() => {
                if (typeof ScratchBlocks.__mistwarpSystemBlocksClipboardImportError === 'function') {
                    ScratchBlocks.__mistwarpSystemBlocksClipboardImportError();
                }
            })
            .finally(() => {
                systemClipboardActive = false;
            });
    };

};

export default installSystemClipboardForBlocks;

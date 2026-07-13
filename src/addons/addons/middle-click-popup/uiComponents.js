const assetUrlCache = new WeakMap();

const getAssetUrl = asset => {
    if (!asset) return null;
    if (!assetUrlCache.has(asset)) assetUrlCache.set(asset, asset.encodeDataURI());
    return assetUrlCache.get(asset);
};

const createPreviewItem = (name, type, detail, imageUrl) => {
    const container = document.createElement('div');
    container.classList.add('sa-mcp-asset-item');

    if (imageUrl) {
        const image = container.appendChild(document.createElement('img'));
        image.classList.add('sa-mcp-asset-image');
        image.alt = '';
        image.src = imageUrl;
    }

    const copy = container.appendChild(document.createElement('div'));
    copy.classList.add('sa-mcp-asset-copy');
    const title = copy.appendChild(document.createElement('span'));
    title.classList.add('sa-mcp-asset-name');
    title.textContent = name;
    if (detail) {
        const subtitle = copy.appendChild(document.createElement('span'));
        subtitle.classList.add('sa-mcp-asset-detail');
        subtitle.textContent = detail;
    }

    const typeLabel = container.appendChild(document.createElement('span'));
    typeLabel.classList.add('sa-mcp-asset-type');
    typeLabel.textContent = type;
    return container;
};

const createSpritePreviewItem = spriteData => createPreviewItem(
    spriteData.name,
    'Sprite',
    null,
    getAssetUrl(spriteData.costume && spriteData.costume.asset)
);

const createCostumePreviewItem = costumeData => createPreviewItem(
    costumeData.name,
    'Costume',
    null,
    getAssetUrl(costumeData.asset)
);

const createSoundPreviewItem = soundData => createPreviewItem(soundData.name, 'Sound');

const createCustomBlockPreviewItem = customBlockData => createPreviewItem(
    customBlockData.displayName,
    'Custom block',
    customBlockData.targetName
);

const createSectionHeader = headerText => {
    const container = document.createElement('div');
    container.classList.add('sa-mcp-section-header');
    container.textContent = headerText;
    return container;
};

export {
    createSpritePreviewItem,
    createCostumePreviewItem,
    createSectionHeader,
    createCustomBlockPreviewItem,
    createSoundPreviewItem
};

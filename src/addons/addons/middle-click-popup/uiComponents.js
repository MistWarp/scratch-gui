// UI component creators for preview items

/**
 * Create a sprite preview item
 * @param {any} spriteData Sprite data
 * @param {any} vm VM instance
 * @returns {HTMLDivElement} The sprite preview item
 */
const createSpritePreviewItem = (spriteData, vm) => {
    const container = document.createElement('div');
    container.classList.add('sa-mcp-sprite-item');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.padding = '8px';
    container.style.cursor = 'pointer';
    container.style.borderRadius = '4px';

    if (spriteData.costume && spriteData.costume.asset) {
        const img = document.createElement('img');
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.marginRight = '8px';
        img.style.objectFit = 'contain';
        
        const sprite = vm.runtime.getSpriteTargetByName(spriteData.name);
        const costume = sprite.getCostumes()[sprite.currentCostume];
        const imageURL = costume.asset.encodeDataURI();

        img.src = imageURL;
        
        container.appendChild(img);
    }

    const nameLabel = document.createElement('span');
    nameLabel.textContent = spriteData.name;
    nameLabel.style.fontSize = '25px';
    container.appendChild(nameLabel);

    return container;
};

/**
 * Create a costume preview item
 * @param {any} costumeData Costume data
 * @returns {HTMLDivElement} The costume preview item
 */
const createCostumePreviewItem = costumeData => {
    const container = document.createElement('div');
    container.classList.add('sa-mcp-sprite-item'); // Reuse sprite item styling
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.padding = '8px';
    container.style.cursor = 'pointer';
    container.style.borderRadius = '4px';

    if (costumeData.asset) {
        const img = document.createElement('img');
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.marginRight = '8px';
        img.style.objectFit = 'contain';
        img.src = costumeData.asset.encodeDataURI();
        container.appendChild(img);
    }

    const nameLabel = document.createElement('span');
    nameLabel.textContent = costumeData.name;
    nameLabel.style.fontSize = '25px';
    container.appendChild(nameLabel);

    return container;
};

/**
 * Create a section header item
 * @param {string} headerText Header text
 * @returns {HTMLDivElement} The section header item
 */
const createSectionHeader = headerText => {
    const container = document.createElement('div');
    container.classList.add('sa-mcp-section-header');
    container.style.padding = '12px 8px 4px 8px';
    container.style.fontSize = '20px';
    container.style.fontWeight = 'bold';
    container.style.opacity = '0.7';
    container.style.textTransform = 'uppercase';
    container.style.letterSpacing = '0.5px';
    container.textContent = headerText;
    return container;
};

/**
 * Create a custom block preview item
 * @param {any} customBlockData Custom block data
 * @returns {HTMLDivElement} The custom block preview item
 */
const createCustomBlockPreviewItem = customBlockData => {
    const container = document.createElement('div');
    container.classList.add('sa-mcp-sprite-item'); // Reuse sprite item styling
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = '8px';
    container.style.cursor = 'pointer';
    container.style.borderRadius = '4px';

    const nameLabel = document.createElement('span');
    nameLabel.textContent = customBlockData.displayName;
    nameLabel.style.fontSize = '20px';
    nameLabel.style.fontWeight = 'bold';
    container.appendChild(nameLabel);

    const targetLabel = document.createElement('span');
    targetLabel.textContent = `in ${customBlockData.targetName}`;
    targetLabel.style.fontSize = '14px';
    targetLabel.style.opacity = '0.7';
    targetLabel.style.marginTop = '4px';
    container.appendChild(targetLabel);

    return container;
};

export {
    createSpritePreviewItem,
    createCostumePreviewItem,
    createSectionHeader,
    createCustomBlockPreviewItem
};

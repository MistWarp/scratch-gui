// Search and filtering utilities

import { getAllSprites, getAllCostumes, getAllCustomBlocks, getAllSounds } from './vmHelpers.js';
import { evaluateMath, tryUnitConversion } from './mathUtils.js';

/**
 * @typedef MenuItem
 * @property {any | null} block
 * @property {(endOnly: boolean) => string} [autocompleteFactory]
 * @property {number} [score] Search relevance score
 * @property {any} [spriteData] Sprite data if this is a sprite item
 * @property {boolean} [isSprite] Whether this is a sprite item
 * @property {any} [costumeData] Costume data if this is a costume item
 * @property {boolean} [isCostume] Whether this is a costume item
 * @property {boolean} [isHeader] Whether this is a section header
 * @property {string} [headerText] Text for the section header
 * @property {boolean} [isCustomBlock] Whether this is a custom block item
 * @property {any} [customBlockData] Custom block data if this is a custom block item
 * @property {any} [soundData] Sound data if this is a sound item
 * @property {boolean} [isSound] Whether this is a sound item
 */


/**
 * Perform search and generate menu items
 * @param {string} searchValue Search value
 * @param {any} querier Querier instance
 * @param {BlockTypeInfo[]} blockTypes Block types
 * @param {any} vm VM instance
 * @param {number} PREVIEW_LIMIT Maximum number of results
 * @param {string} searchMode 'blocks' or 'everything'
 * @returns {{
 *     blockList: MenuItem[],
 *     queryIllegalResult: any,
 *     limited: boolean,
 *     mathResult: (number | null),
 *     conversionResult: any
 *   }} Search results
 */
const performSearch = (searchValue, querier, blockTypes, vm, PREVIEW_LIMIT, searchMode = 'everything') => {
    /** @type {MenuItem[]} */
    const blockList = [];
    let queryIllegalResult = null;
    let limited = false;
    let mathResult = null;
    let conversionResult = null;

    if (searchValue.trim().length === 0) {
        if (blockTypes) {
            for (const blockType of blockTypes) {
                blockList.push({
                    block: blockType.createBlock(),
                    score: 0,
                    isSprite: false
                });
            }
        }
    } else {
        const searchEverything = searchMode === 'everything';
        const queryResultObj = querier.queryWorkspace(searchValue);
        const queryResults = queryResultObj.results;
        queryIllegalResult = queryResultObj.illegalResult;
        limited = queryResultObj.limited;

        const searchTerms = searchValue.toLowerCase().split(/\s+/)
            .filter(t => t.length > 0);

        let spriteResults = [];
        if (searchEverything) {
            const sprites = getAllSprites(vm);

            for (const sprite of sprites) {
                const spriteName = sprite.name.toLowerCase();
                let score = 0;

                if (spriteName === searchValue.toLowerCase()) {
                    score += 2000;
                }

                if (spriteName.startsWith(searchValue.toLowerCase())) {
                    score += 1500;
                }

                if (spriteName.includes(searchValue.toLowerCase())) {
                    score += 1000;
                }

                const containsAll = searchTerms.every(term => spriteName.includes(term));
                if (containsAll) {
                    score += 200;
                }

                if (score > 0) {
                    spriteResults.push({
                        spriteData: sprite,
                        score: score
                    });
                }
            }
        }

        spriteResults.sort((a, b) => b.score - a.score);

        // Search costumes (only in everything mode)
        let costumeResults = [];
        if (searchEverything) {
            const costumes = getAllCostumes(vm);

            for (const costume of costumes) {
                const costumeName = costume.name.toLowerCase();
                let score = 0;

                if (costumeName === searchValue.toLowerCase()) {
                    score += 2000;
                }

                if (costumeName.startsWith(searchValue.toLowerCase())) {
                    score += 1500;
                }

                if (costumeName.includes(searchValue.toLowerCase())) {
                    score += 1000;
                }

                const containsAll = searchTerms.every(term => costumeName.includes(term));
                if (containsAll) {
                    score += 200;
                }

                if (score > 0) {
                    costumeResults.push({
                        costumeData: costume,
                        score: score
                    });
                }
            }
        }

        costumeResults.sort((a, b) => b.score - a.score);

        // Search sounds (only in everything mode)
        let soundResults = [];
        if (searchEverything) {
            const sounds = getAllSounds(vm);

            for (const sound of sounds) {
                const soundName = sound.name.toLowerCase();
                let score = 0;

                if (soundName === searchValue.toLowerCase()) {
                    score += 2000;
                }

                if (soundName.startsWith(searchValue.toLowerCase())) {
                    score += 1500;
                }

                if (soundName.includes(searchValue.toLowerCase())) {
                    score += 1000;
                }

                const containsAll = searchTerms.every(term => soundName.includes(term));
                if (containsAll) {
                    score += 200;
                }

                if (score > 0) {
                    soundResults.push({
                        soundData: sound,
                        score: score
                    });
                }
            }
        }

        soundResults.sort((a, b) => b.score - a.score);

        // Search custom blocks (only in everything mode)
        let customBlockResults = [];
        if (searchEverything) {
            const customBlocks = getAllCustomBlocks(vm);

            for (const customBlock of customBlocks) {
                const blockName = customBlock.displayName.toLowerCase();
                let score = 0;

                if (blockName === searchValue.toLowerCase()) {
                    score += 2000;
                }

                if (blockName.startsWith(searchValue.toLowerCase())) {
                    score += 1500;
                }

                if (blockName.includes(searchValue.toLowerCase())) {
                    score += 1000;
                }

                const containsAll = searchTerms.every(term => blockName.includes(term));
                if (containsAll) {
                    score += 200;
                }

                if (score > 0) {
                    customBlockResults.push({
                        customBlockData: customBlock,
                        score: score
                    });
                }
            }
        }

        customBlockResults.sort((a, b) => b.score - a.score);

        // Score regular blocks
        const scoredResults = queryResults.map(queryResult => {
            const blockText = queryResult.toText(false).toLowerCase();

            let score = 0;

            if (blockText === searchValue.toLowerCase()) {
                score += 1000;
            }

            if (blockText.startsWith(searchValue.toLowerCase())) {
                score += 500;
            }

            const containsAll = searchTerms.every(term => blockText.includes(term));
            if (containsAll) {
                score += 200;
            }

            const words = blockText.split(/\s+/);
            for (const term of searchTerms) {
                for (const word of words) {
                    if (word.startsWith(term)) {
                        score += 100;
                    }
                    if (word === term) {
                        score += 50;
                    }
                }
            }

            score -= blockText.length * 0.5;

            const inputCount = (blockText.match(/\(\)/g) || []).length;
            score -= inputCount * 10;

            return {
                queryResult,
                score,
                blockText
            };
        });

        scoredResults.sort((a, b) => b.score - a.score);

        const topResults = scoredResults.slice(0, PREVIEW_LIMIT);

        // Build the menu with sections
        if (spriteResults.length > 0) {
            blockList.push({
                block: null,
                isHeader: true,
                headerText: 'Sprites',
                score: 10000
            });
            for (const result of spriteResults) {
                blockList.push({
                    block: null,
                    spriteData: result.spriteData,
                    isSprite: true,
                    score: result.score
                });
            }
        }

        if (costumeResults.length > 0) {
            blockList.push({
                block: null,
                isHeader: true,
                headerText: 'Costumes',
                score: 9000
            });
            for (const result of costumeResults) {
                blockList.push({
                    block: null,
                    costumeData: result.costumeData,
                    isCostume: true,
                    score: result.score
                });
            }
        }

        if (soundResults.length > 0) {
            blockList.push({
                block: null,
                isHeader: true,
                headerText: 'Sounds',
                score: 9500
            });
            for (const result of soundResults) {
                blockList.push({
                    block: null,
                    soundData: result.soundData,
                    isSound: true,
                    score: result.score
                });
            }
        }

        if (customBlockResults.length > 0) {
            blockList.push({
                block: null,
                isHeader: true,
                headerText: 'Custom Blocks',
                score: 8500
            });
            for (const result of customBlockResults) {
                blockList.push({
                    block: null,
                    customBlockData: result.customBlockData,
                    isCustomBlock: true,
                    score: result.score
                });
            }
        }

        if (topResults.length > 0) {
            blockList.push({
                block: null,
                isHeader: true,
                headerText: 'Blocks',
                score: 8000
            });
            for (const result of topResults) {
                blockList.push({
                    block: result.queryResult.getBlock(),
                    autocompleteFactory: endOnly => result.queryResult.toText(endOnly),
                    score: result.score,
                    isSprite: false
                });
            }
        }

        // Calculate math/conversion results
        mathResult = evaluateMath(searchValue);
        if (!mathResult) {
            conversionResult = tryUnitConversion(searchValue);
        }
    }

    return {
        blockList,
        queryIllegalResult,
        limited,
        mathResult,
        conversionResult
    };
};

export {
    performSearch
};

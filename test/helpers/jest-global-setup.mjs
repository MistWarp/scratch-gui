// Tests import sources the Vite build writes to src/generated, and CI runs
// them before building.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeScratchBlocks} from '../../scripts/vite-blocks.mjs';
import {writeCommunityLocales} from '../../scripts/community-translations.mjs';

export default () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    writeScratchBlocks(root);
    writeCommunityLocales(root);
};

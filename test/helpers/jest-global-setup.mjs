// Tests import the Closure bundle the Vite build writes to src/generated, and
// CI runs them before building.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeScratchBlocks} from '../../scripts/vite-blocks.mjs';

export default () => {
    writeScratchBlocks(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
};

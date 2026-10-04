import fs from 'fs';
import path from 'path';

const buildDirectory = path.resolve(__dirname, '../../build');

/**
 * The built editor page that the integration tests load.
 * Site builds always emit `editor.html`. With MW_COMMUNITY=true, `index.html` is the community
 * home page instead of a copy of the editor, so prefer `editor.html` and fall back to `index.html`
 * only for builds that do not have it.
 * @type {string}
 */
const editorUri = fs.existsSync(path.join(buildDirectory, 'editor.html')) ?
    path.join(buildDirectory, 'editor.html') :
    path.join(buildDirectory, 'index.html');

export default editorUri;

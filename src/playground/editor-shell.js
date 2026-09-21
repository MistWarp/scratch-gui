import {mountEditorHost} from '../lib/editor-sandbox/host.js';

mountEditorHost().catch(error => {
    if (window.SplashEnd) window.SplashEnd();
    const target = document.getElementById('app');
    target.textContent = `Could not open the isolated editor: ${error.message}`;
});

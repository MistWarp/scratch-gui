// Do not statically import the editor: it must not execute before isolation and
// storage are established, even when this entry is opened directly.
import {isIsolatedEditor} from '../lib/editor-sandbox/protocol.js';
import {connectEditorHost} from '../lib/editor-sandbox/client.js';

const start = async () => {
    if (!isIsolatedEditor()) throw new Error('Open the editor at /editor. This runtime only runs in its sandbox.');
    const seed = await connectEditorHost();
    const {installEditorStorage} = await import('../lib/editor-sandbox/storage.js');
    await installEditorStorage(seed);
    const {installEditorNavigation} = await import('../lib/editor-sandbox/navigation.js');
    installEditorNavigation();
    await import('./editor.jsx');
};
start().catch(error => {
    document.body.replaceChildren();
    const message = document.createElement('p');
    message.textContent = error.message;
    const link = document.createElement('a');
    link.href = './editor';
    link.target = '_top';
    link.textContent = 'Open editor';
    document.body.append(message, link);
});

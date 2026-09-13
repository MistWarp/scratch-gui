import Packager from './packager/web/export';
import {downloadProject} from './packager/download-project';
import {getRememberedPlatformProjectState} from '../lib/community/publish';

const assertActive = signal => {
    if (signal.aborted) throw new DOMException('Packaging cancelled', 'AbortError');
};

// Both UI and exported runtime resolve the GUI's installed VM and renderer.
export const exportProject = async ({vm, options, signal, onProgress}) => {
    assertActive(signal);
    const packager = new Packager();
    const abort = () => packager.abort();
    signal.addEventListener('abort', abort);
    try {
        onProgress({text: 'Preparing project', value: 0});
        const buffer = await vm.saveProjectSb3('arraybuffer');
        assertActive(signal);
        packager.project = await downloadProject(buffer, () => {}, signal);
        assertActive(signal);
        const platformProject = getRememberedPlatformProjectState();
        packager.options = {...options, mistwarpProjectId: platformProject && platformProject.id || ''};
        onProgress({text: 'Preparing export', value: 0});
        packager.addEventListener('large-asset-fetch', ({detail}) => {
            onProgress({text: 'Downloading runtime', value: detail.progress});
        });
        packager.addEventListener('fetch-extensions', ({detail}) => {
            onProgress({text: 'Downloading extensions', value: detail.progress});
        });
        packager.addEventListener('zip-progress', ({detail}) => {
            onProgress({text: 'Creating archive', value: detail.progress});
        });
        const result = await packager.package();
        assertActive(signal);
        return {...result, blob: new Blob([result.data], {type: result.type})};
    } finally {
        signal.removeEventListener('abort', abort);
    }
};

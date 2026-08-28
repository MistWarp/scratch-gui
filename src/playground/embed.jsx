/* eslint-disable max-len */
import './embed-storage-shim';
import './import-first';

import React from 'react';
import {compose} from 'redux';
import AppStateHOC from '../lib/components/app-state-hoc.jsx';
import TWEmbedFullScreenHOC from '../lib/components/tw-embed-fullscreen-hoc.jsx';
import TWStateManagerHOC from '../lib/components/tw-state-manager-hoc.jsx';
import {detectTheme, applyThemeVisuals} from '../lib/themes/themePersistance';
import {customThemeManager} from '../lib/themes/custom-themes';

import GUI from './render-gui.jsx';
import render from './app-target';

const getProjectId = () => {
    // For compatibility reasons, we first look at the hash.
    // eg. https://turbowarp.org/embed.html#1
    const hashMatch = location.hash.match(/#(\d+)/);
    if (hashMatch !== null) {
        return hashMatch[1];
    }
    // Otherwise, we'll recreate what "wildcard" routing does.
    // eg. https://turbowarp.org/1/embed
    const pathMatch = location.pathname.match(/(\d+)\/embed/);
    if (pathMatch !== null) {
        return pathMatch[pathMatch.length - 1];
    }
    return '0';
};

const urlParams = new URLSearchParams(location.search);
const projectId = urlParams.get('platform_project') || getProjectId();
const sessionStartedAt = performance.now();
let playing = false;

const reportDiagnostic = diagnostic => {
    if (window.parent !== window && urlParams.get('mw_bridge') === '1') {
        window.parent.postMessage({type: 'mw:diagnostic', diagnostic}, '*');
    }
};

if (window.parent !== window && urlParams.get('mw_bridge') === '1') {
    window.parent.postMessage({type: 'mw:embed-ready'}, '*');
}

let vm;

const getProjectMetadata = () => {
    const categories = {};
    let total = 0;
    for (const target of (vm && vm.runtime && vm.runtime.targets) || []) {
        const blocks = target && target.blocks && target.blocks._blocks;
        for (const block of Object.values(blocks || {})) {
            if (!block || !block.opcode) continue;
            total += 1;
            const prefix = block.opcode.split('_')[0];
            categories[prefix] = (categories[prefix] || 0) + 1;
        }
    }
    const extensionURLs = vm && vm.extensionManager && vm.extensionManager.getExtensionURLs ?
        vm.extensionManager.getExtensionURLs() : {};
    return {
        blockStats: {total, categories},
        customExtensions: [...new Set(Object.values(extensionURLs))]
    };
};

const finishPlaytime = () => {
    if (!playing) return;
    playing = false;
    reportDiagnostic({type: 'playtime_finish'});
};

const onVmInit = _vm => {
    vm = _vm;
    vm.on('PROJECT_RUN_START', () => {
        if (!playing) {
            playing = true;
            reportDiagnostic({type: 'playtime_start'});
        }
        reportDiagnostic({type: 'start'});
    });
    vm.on('PROJECT_RUN_STOP', finishPlaytime);
};

const onProjectLoaded = () => {
    reportDiagnostic({
        type: 'load',
        loadMs: Math.round(performance.now() - sessionStartedAt),
        device: matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop'
    });
    if (window.parent !== window && vm && vm.runtime) {
        window.parent.postMessage({
            type: 'mw:stage-size',
            width: vm.runtime.stageWidth,
            height: vm.runtime.stageHeight
        }, '*');
        window.parent.postMessage({type: 'mw:project-metadata', ...getProjectMetadata()}, '*');
    }
    if (urlParams.has('autoplay')) {
        vm.start();
        vm.greenFlag();
    }
};

window.addEventListener('error', event => reportDiagnostic({type: 'crash', error: String(event.message || 'Runtime error').slice(0, 500)}));
window.addEventListener('unhandledrejection', event => reportDiagnostic({type: 'crash', error: String(event.reason || 'Unhandled error').slice(0, 500)}));
window.addEventListener('pagehide', () => {
    finishPlaytime();
    reportDiagnostic({type: 'exit', duration: Math.round(performance.now() - sessionStartedAt)});
});
setInterval(() => {
    if (playing) reportDiagnostic({type: 'playtime_ping'});
}, 30000);

const WrappedGUI = compose(
    AppStateHOC,
    TWStateManagerHOC,
    TWEmbedFullScreenHOC
)(GUI);

render(<WrappedGUI
    isEmbedded
    projectId={projectId}
    onVmInit={onVmInit}
    onProjectLoaded={onProjectLoaded}
    routingStyle="none"
    theme={detectTheme()}
/>);

window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'mw:apply-theme') return;
    // The embed runs sandboxed, so it can't read the parent's stored theme and
    // big custom themes don't survive the URL. The parent posts the theme here.
    try {
        let changed = false;
        if (event.data.theme) {
            if (window.localStorage.getItem('tw:theme') !== event.data.theme) {
                window.localStorage.setItem('tw:theme', event.data.theme);
                changed = true;
            }
        } else if (window.localStorage.getItem('tw:theme')) {
            window.localStorage.removeItem('tw:theme');
            changed = true;
        }
        if (event.data.customThemes && window.localStorage.getItem('tw:custom-themes') !== event.data.customThemes) {
            window.localStorage.setItem('tw:custom-themes', event.data.customThemes);
            changed = true;
        }
        if (changed && typeof customThemeManager.loadCustomThemes === 'function') {
            customThemeManager.loadCustomThemes();
        }
        if (changed) applyThemeVisuals(detectTheme());
    } catch (e) {
        // ignore
    }
});

window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'mw:capture-stage' || !event.source) return;
    const source = event.source;
    import('../lib/community/publish').then(({captureThumbnailDataUri}) => captureThumbnailDataUri(vm))
        .then(dataURL => {
            if (dataURL) {
                source.postMessage({type: 'mw:stage-capture', dataURL}, '*');
            } else {
                source.postMessage({type: 'mw:stage-capture', error: true}, '*');
            }
        })
        .catch(() => source.postMessage({type: 'mw:stage-capture', error: true}, '*'));
});

if (urlParams.has('addons')) {
    import('../addons/entry').then(({default: runAddons}) => runAddons()).catch(() => null);
}

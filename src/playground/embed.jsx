import './embed-storage-shim';
import './import-first';

import React from 'react';
import {compose} from 'redux';
import AppStateHOC from '../lib/components/app-state-hoc.jsx';
import TWEmbedFullScreenHOC from '../lib/components/tw-embed-fullscreen-hoc.jsx';
import TWStateManagerHOC from '../lib/components/tw-state-manager-hoc.jsx';
import runAddons from '../addons/entry';
import {detectTheme, applyThemeVisuals} from '../lib/themes/themePersistance';
import {customThemeManager} from '../lib/themes/custom-themes';
import {captureThumbnailDataUri} from '../lib/community/publish';

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

let vm;

const onVmInit = _vm => {
    vm = _vm;
};

const onProjectLoaded = () => {
    if (window.parent !== window && vm && vm.runtime) {
        window.parent.postMessage({
            type: 'mw:stage-size',
            width: vm.runtime.stageWidth,
            height: vm.runtime.stageHeight
        }, '*');
    }
    if (urlParams.has('autoplay')) {
        vm.start();
        vm.greenFlag();
    }
};

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
        if (event.data.theme) {
            window.localStorage.setItem('tw:theme', event.data.theme);
        } else {
            window.localStorage.removeItem('tw:theme');
        }
        if (event.data.customThemes) {
            window.localStorage.setItem('tw:custom-themes', event.data.customThemes);
        }
        if (typeof customThemeManager.loadCustomThemes === 'function') {
            customThemeManager.loadCustomThemes();
        }
        applyThemeVisuals(detectTheme());
    } catch (e) {
        // ignore
    }
});

window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'mw:capture-stage' || !event.source) return;
    const source = event.source;
    captureThumbnailDataUri(vm).then(dataURL => {
        if (dataURL) {
            source.postMessage({type: 'mw:stage-capture', dataURL}, '*');
        } else {
            source.postMessage({type: 'mw:stage-capture', error: true}, '*');
        }
    });
});

if (urlParams.has('addons')) {
    runAddons();
}

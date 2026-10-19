// The storage shim must run before anything else can touch storage; sandboxed
// embeds otherwise throw while the store is being created.
import './embed-storage-shim';

import * as bundledModule0 from '../lib/community/publish';
import * as bundledModule1 from '../addons/entry';

/* eslint-disable max-len */
import './import-first';

import React from 'react';
import {prepareLocale} from '../lib/editor-locales';
import {compose} from 'redux';
import AppStateHOC from '../lib/components/app-state-hoc.jsx';
import TWEmbedFullScreenHOC from '../lib/components/tw-embed-fullscreen-hoc.jsx';
import TWStateManagerHOC from '../lib/components/tw-state-manager-hoc.jsx';
import {applyEmbedThemeMessage} from '../lib/themes/embed-theme';
import {request} from '../lib/community/api.js';
import {ACCOUNT_ORIGIN, isSplitEditor} from '../lib/account/origins.js';
import initDebugger from '../lib/debugger/controller.js';

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

// Listen before locale preparation/rendering so early parent messages are retained.
window.addEventListener('message', applyEmbedThemeMessage);

const urlParams = new URLSearchParams(location.search);
const projectId = urlParams.get('platform_project') || getProjectId();
const sessionStartedAt = performance.now();
let playing = false;
const LINK_BACK_REFS = new Set(['embed', 'oembed']);
const linkBack = urlParams.get('mw_public') === '1' ? document.createElement('a') : null;
let projectRunning = false;
let projectPaused = false;

const updateLinkBack = () => {
    if (linkBack) linkBack.hidden = projectRunning && !projectPaused;
};

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
        projectRunning = true;
        updateLinkBack();
        if (!playing) {
            playing = true;
            reportDiagnostic({type: 'playtime_start'});
        }
        reportDiagnostic({type: 'start'});
    });
    vm.on('PROJECT_RUN_STOP', () => {
        projectRunning = false;
        updateLinkBack();
        finishPlaytime();
    });
    if (linkBack) {
        initDebugger(vm).events.addEventListener('pause', event => {
            projectPaused = event.paused;
            updateLinkBack();
        });
    }
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

const publicEmbedId = urlParams.get('mw');

const resolvePublicEmbed = async () => {
    try {
        const data = await request(`/projects/${encodeURIComponent(publicEmbedId)}`);
        const project = data && data.project;
        if (!project || !project.projectJsonUrl) throw new Error('unavailable');
        const params = new URLSearchParams();
        params.set('project_url', project.projectJsonUrl);
        params.set('mw_assets', project.assetsBase);
        params.set('platform_project', project.id);
        if (project.shared === true && project.visibility === 'public') params.set('mw_public', '1');
        if (LINK_BACK_REFS.has(urlParams.get('ref'))) params.set('ref', urlParams.get('ref'));
        if (urlParams.has('autoplay')) params.set('autoplay', '');
        location.replace(`${location.pathname}?${params.toString()}`);
    } catch (e) {
        document.body.textContent = 'This MistWarp project is not available.';
    }
};

const addLinkBack = () => {
    const ref = LINK_BACK_REFS.has(urlParams.get('ref')) ? urlParams.get('ref') : 'embed';
    const origin = isSplitEditor() ? ACCOUNT_ORIGIN : location.origin;
    linkBack.href = `${origin}/project/${encodeURIComponent(projectId)}?ref=${ref}`;
    linkBack.target = '_blank';
    linkBack.rel = 'noopener';
    linkBack.textContent = 'Made with MistWarp · Play more';
    Object.assign(linkBack.style, {
        position: 'fixed',
        right: '8px',
        bottom: '8px',
        zIndex: '1000',
        padding: '4px 8px',
        borderRadius: '6px',
        background: 'rgba(0, 0, 0, 0.62)',
        color: '#ffffff',
        font: '500 11px Helvetica Neue, Helvetica, Arial, sans-serif',
        textDecoration: 'none'
    });
    document.body.appendChild(linkBack);
};

if (publicEmbedId && !urlParams.get('project_url')) {
    resolvePublicEmbed();
} else {
    if (linkBack) addLinkBack();
    render(<WrappedGUI
        isEmbedded
        projectId={projectId}
        onVmInit={onVmInit}
        onProjectLoaded={onProjectLoaded}
        routingStyle="none"
    />, prepareLocale);
}

window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'mw:capture-stage' || !event.source) return;
    const source = event.source;
    Promise.resolve(bundledModule0).then(({captureThumbnailDataUri}) => captureThumbnailDataUri(vm))
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
    Promise.resolve(bundledModule1).then(({default: runAddons}) => runAddons())
        .catch(() => null);
}

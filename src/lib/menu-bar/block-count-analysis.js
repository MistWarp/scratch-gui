import React from 'react';
import ReactDOM from 'react-dom';

import blockCountStyles from '../../components/menu-bar/block-count.module.css';
import ProjectAnalysis from '../../components/menu-bar/project-analysis.jsx';
import WindowManager from '../../addons/window-system/window-manager.js';
import Utils from '../find-bar/Utils.js';
import {analyzeProject} from './project-analysis-data.js';

export {analyzeProject};

/**
 * @param {object} options Native menu bar integration.
 * @returns {object} Controller.
 */
export default function (options) {
    const {vm, display, getSetting, getBlockly, msg} = options;
    let analysisWindow = null;
    let analysisRoot = null;
    let navigation = null;
    let refreshTimer = null;

    const showScript = async script => {
        const Blockly = await getBlockly();
        if (!navigation) navigation = new Utils(vm, Blockly);
        if (!vm.editingTarget || vm.editingTarget.id !== script.targetId) vm.setEditingTarget(script.targetId);
        if (analysisWindow) analysisWindow.hide();
        window.focus();
        setTimeout(() => navigation.scrollBlockIntoView(script.id), 120);
    };

    const showAnalysis = () => {
        if (analysisWindow) {
            analysisWindow.show().bringToFront();
            return;
        }

        analysisRoot = document.createElement('div');
        analysisRoot.className = blockCountStyles['sa-block-count-mount'];
        analysisWindow = WindowManager.createWindow({
            id: 'project-complexity',
            title: msg('complexity-title'),
            width: 860,
            height: 620,
            minWidth: 640,
            minHeight: 420,
            maxWidth: 1100,
            maxHeight: 900,
            className: blockCountStyles['sa-block-count-window'],
            onClose: () => {
                if (analysisRoot) ReactDOM.unmountComponentAtNode(analysisRoot);
                analysisWindow = null;
                analysisRoot = null;
            }
        });
        analysisWindow.setContent(analysisRoot)
            .center()
            .show();
        ReactDOM.render(React.createElement(ProjectAnalysis, {
            msg,
            onShowScript: showScript,
            vm
        }), analysisRoot);
    };

    const updateDisplay = () => {
        const metrics = analyzeProject(vm.runtime);
        if (display) {
            const parts = [];
            if (getSetting('show_block_count')) parts.push(msg('blocks', {num: metrics.blockCount}));
            if (getSetting('show_costume_count')) parts.push(msg('costumes', {num: metrics.costumeCount}));
            if (getSetting('show_sound_count')) parts.push(msg('sounds', {num: metrics.soundCount}));
            if (getSetting('show_complexity_score')) {
                parts.push(msg('complexity-menu', {score: metrics.complexityScore}));
            }
            display.textContent = parts.length ? parts.join(' · ') : msg('analysis-short');
        }
    };

    const runWhenIdle = () => {
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(updateDisplay, {timeout: 2000});
        } else {
            updateDisplay();
        }
    };

    const scheduleUpdate = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(runWhenIdle, 500);
    };

    vm.on('PROJECT_CHANGED', scheduleUpdate);
    vm.runtime.on('PROJECT_LOADED', updateDisplay);
    display.type = 'button';
    display.title = msg('open-analysis');
    display.addEventListener('click', showAnalysis);
    updateDisplay();

    return {
        update: updateDisplay,
        destroy: () => {
            vm.off('PROJECT_CHANGED', scheduleUpdate);
            vm.runtime.off('PROJECT_LOADED', updateDisplay);
            display.removeEventListener('click', showAnalysis);
            clearTimeout(refreshTimer);
            if (analysisWindow) analysisWindow.close();
        }
    };
}

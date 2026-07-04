import Highlighter from './highlighter.js';
import {getSetting} from './settings.js';

const GLOW_COLOR = '#0000ff';

const setupThreadGlow = controller => {
    const {vm, engine} = controller;
    if (vm.__mwThreadGlowInstalled) {
        return;
    }
    vm.__mwThreadGlowInstalled = true;

    const highlighter = new Highlighter(0, GLOW_COLOR);
    let wasEnabled = false;

    controller.addAfterStepCallback(() => {
        if (!getSetting('thread_glow')) {
            if (wasEnabled) {
                highlighter.setGlowingThreads([]);
                wasEnabled = false;
            }
            return;
        }
        if (!window.Blockly) {
            if (!window.ScratchBlocks) {
                return;
            }
            window.Blockly = window.ScratchBlocks;
        }
        wasEnabled = true;
        const runningThread = engine.getRunningThread();
        const threads = vm.runtime.threads.filter(
            thread => thread !== runningThread && !thread.target.blocks.forceNoGlow && !thread.isCompiled
        );
        highlighter.setGlowingThreads(threads);
    });
};

export default setupThreadGlow;

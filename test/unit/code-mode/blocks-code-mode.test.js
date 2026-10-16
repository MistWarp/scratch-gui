import {Blocks} from '../../../src/containers/blocks.jsx';
import {
    dropWorkspaceWaiters,
    setWorkspaceReadyCheck,
    whenWorkspaceReady
} from '../../../src/lib/code-mode/workspace-ready.js';

describe('Blocks container in Code mode', () => {
    let blocks;
    let frame;
    let calls;

    beforeEach(() => {
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
            frame = callback;
            return 1;
        });
        jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        calls = [];
        blocks = Object.create(Blocks.prototype);
        blocks.inCodeMode = false;
        blocks.workspaceLoadSeq = 0;
        blocks.lastWorkspaceTargetId = 'sprite';
        blocks.props = {
            editorMode: 'blocks',
            isVisible: true,
            locale: 'en',
            theme: {},
            setScriptLoadProgress: jest.fn(),
            updateToolboxState: jest.fn(),
            vm: {
                blockListener: () => {},
                emitWorkspaceUpdate: jest.fn(),
                getLocale: () => 'en'
            }
        };
        blocks.workspace = {
            clear: jest.fn(() => calls.push('clear')),
            clearUndo: jest.fn(),
            addChangeListener: jest.fn(),
            removeChangeListener: jest.fn(),
            setVisible: jest.fn(),
            refreshToolboxSelection_: jest.fn(),
            resize: jest.fn(),
            cancelDeferredRender: jest.fn()
        };
        blocks.ScratchBlocks = {
            Events: {
                fireNow_: jest.fn(() => calls.push('fire')),
                disable: jest.fn(() => calls.push('disable')),
                enable: jest.fn(() => calls.push('enable'))
            },
            svgResize: jest.fn()
        };
        blocks.getToolboxXML = () => null;
        setWorkspaceReadyCheck(blocks.isWorkspaceReady.bind(blocks));
    });

    afterEach(() => {
        setWorkspaceReadyCheck(null);
        dropWorkspaceWaiters(null);
        jest.restoreAllMocks();
    });

    const enterCode = () => {
        const prev = blocks.props;
        blocks.props = {...prev, editorMode: 'code', isVisible: false};
        blocks.componentDidUpdate(prev);
    };

    test('entering Code mode flushes events, clears the hidden workspace and detaches the VM', () => {
        enterCode();
        expect(calls).toEqual(['fire', 'disable', 'clear', 'enable']);
        expect(blocks.workspace.removeChangeListener).toHaveBeenCalledWith(blocks.props.vm.blockListener);
        expect(blocks.lastWorkspaceTargetId).toBeNull();
        expect(blocks.inCodeMode).toBe(true);
    });

    test('workspace updates are ignored while in Code mode', () => {
        enterCode();
        blocks.requestToolboxStateUpdate = jest.fn();
        blocks.onWorkspaceUpdate({xml: '<xml></xml>'});
        expect(blocks.requestToolboxStateUpdate).not.toHaveBeenCalled();
        expect(blocks.workspace.clear).toHaveBeenCalledTimes(1);
    });

    test('returning to Blocks mode reattaches and asks for a fresh workspace update', () => {
        enterCode();
        const prev = blocks.props;
        blocks.props = {...prev, editorMode: 'blocks', isVisible: true};
        blocks.componentDidUpdate(prev);
        expect(blocks.workspace.addChangeListener).toHaveBeenCalledWith(blocks.props.vm.blockListener);
        expect(blocks.props.vm.emitWorkspaceUpdate).toHaveBeenCalledTimes(1);
        expect(blocks.inCodeMode).toBe(false);
    });

    test('whenWorkspaceReady waits for the resize after the workspace becomes visible', async () => {
        enterCode();
        const prev = blocks.props;
        blocks.props = {...prev, editorMode: 'blocks', isVisible: true};
        blocks.props.vm.emitWorkspaceUpdate = jest.fn(() => {
            blocks.lastWorkspaceTargetId = 'sprite';
        });
        blocks.componentDidUpdate(prev);
        let settled = false;
        const ready = whenWorkspaceReady('sprite').then(value => {
            settled = value;
        });
        await Promise.resolve();
        expect(settled).toBe(false);
        frame();
        await ready;
        expect(blocks.ScratchBlocks.svgResize).toHaveBeenCalled();
        expect(settled).toBe(true);
    });

    test('whenWorkspaceReady resolves at once in Blocks mode for the shown sprite', async () => {
        await expect(whenWorkspaceReady('sprite')).resolves.toBe(true);
    });

    test('a deferred load keeps waiters until it finishes', () => {
        blocks.deferredWorkspaceLoad = {};
        expect(blocks.isWorkspaceReady('sprite')).toBe(false);
        blocks.deferredWorkspaceLoad = null;
        expect(blocks.isWorkspaceReady('sprite')).toBe(true);
        expect(blocks.isWorkspaceReady('other')).toBe(false);
    });
});

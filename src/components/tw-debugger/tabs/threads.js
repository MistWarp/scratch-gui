import LogView from '../log-view.js';
import Highlighter from '../../../lib/debugger/highlighter.js';
import threadsIcon from '../icons/threads.svg';

const concatInPlace = (copyInto, copyFrom) => {
    for (const i of copyFrom) {
        copyInto.push(i);
    }
};

const createThreadsTab = controller => {
    const vm = controller.vm;
    const engine = controller.engine;

    if (!window.Blockly && window.ScratchBlocks) {
        window.Blockly = window.ScratchBlocks;
    }

    const logView = new LogView();
    logView.canAutoScrollToEnd = false;
    logView.outerElement.classList.add('sa-debugger-threads');
    logView.placeholderElement.textContent = 'No threads are running';

    const errorColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--error-primary') || '#ff0000';
    const highlighter = new Highlighter(10, errorColor);
    const glow = threads => {
        try {
            highlighter.setGlowingThreads(threads);
        } catch (e) {
            void e;
        }
    };

    logView.generateRow = row => {
        const root = document.createElement('div');
        root.className = 'sa-debugger-log';

        const isHeader = row.type === 'thread-header';
        const indenter = document.createElement('div');
        indenter.className = 'sa-debugger-thread-indent';
        indenter.style.setProperty('--level', isHeader ? row.depth : row.depth + 1);
        root.appendChild(indenter);

        if (isHeader) {
            root.classList.add('sa-debugger-thread-title');

            if (row.depth > 0) {
                const icon = document.createElement('div');
                icon.className = 'sa-debugger-log-icon';
                root.appendChild(icon);
            }

            const name = document.createElement('div');
            name.textContent = row.targetName;
            name.className = 'sa-debugger-thread-target-name';
            root.appendChild(name);

            const id = document.createElement('div');
            id.className = 'sa-debugger-thread-id';
            id.textContent = `Thread ${row.id}`;
            root.appendChild(id);
        }

        if (row.type === 'thread-stack') {
            const preview = controller.createBlockPreview(row.targetId, row.blockId);
            if (preview) {
                root.appendChild(preview);
            }
        }

        if (row.type === 'compiled') {
            const el = document.createElement('div');
            el.className = 'sa-debugger-thread-compiled';
            el.textContent = 'Compiled threads can\'t be stepped and have no stack information.';
            root.appendChild(el);
        }

        if (row.targetId && row.blockId) {
            root.appendChild(controller.createBlockLink(controller.getTargetInfoById(row.targetId), row.blockId));
        }

        return {root};
    };

    logView.renderRow = (elements, row) => {
        elements.root.classList.toggle('sa-debugger-thread-running', !!row.running);
    };

    const threadInfoCache = new WeakMap();
    const allThreadIds = new WeakMap();
    let nextThreadId = 1;
    const getThreadId = thread => {
        if (!allThreadIds.has(thread)) {
            allThreadIds.set(thread, nextThreadId++);
        }
        return allThreadIds.get(thread);
    };

    const updateContent = () => {
        if (!logView.visible) {
            return;
        }

        const newRows = [];
        const threads = vm.runtime.threads;
        const visitedThreads = new Set();
        const runningThread = engine.getRunningThread();

        const createThreadInfo = (thread, depth) => {
            if (visitedThreads.has(thread)) {
                return [];
            }
            visitedThreads.add(thread);

            const id = getThreadId(thread);
            const target = thread.target;

            if (!threadInfoCache.has(thread)) {
                threadInfoCache.set(thread, {
                    headerItem: {
                        type: 'thread-header',
                        depth,
                        targetName: target.getName(),
                        id
                    },
                    compiledItem: thread.isCompiled ? {
                        type: 'compiled',
                        depth: 1
                    } : null,
                    blockCache: new WeakMap()
                });
            }
            const cacheInfo = threadInfoCache.get(thread);

            const createBlockInfo = (block, stackFrameIdx) => {
                const blockId = block.id;
                if (!block) return [];

                const stackFrame = thread.stackFrames[stackFrameIdx];

                if (!cacheInfo.blockCache.has(block)) {
                    cacheInfo.blockCache.set(block, {});
                }

                const blockInfoMap = cacheInfo.blockCache.get(block);
                let blockInfo = blockInfoMap[stackFrameIdx];

                if (!blockInfo) {
                    blockInfo = blockInfoMap[stackFrameIdx] = {
                        type: 'thread-stack',
                        depth,
                        targetId: target.id,
                        blockId
                    };
                }

                blockInfo.running =
                    thread === runningThread && (
                        thread.isCompiled || (
                            blockId === runningThread.peekStack() &&
                            stackFrameIdx === runningThread.stackFrames.length - 1
                        )
                    );

                const result = [blockInfo];
                if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
                    for (const startedThread of stackFrame.executionContext.startedThreads) {
                        concatInPlace(result, createThreadInfo(startedThread, depth + 1));
                    }
                }

                return result;
            };

            const topBlock = controller.getBlock(thread.target, thread.topBlock);
            const result = [cacheInfo.headerItem];
            if (topBlock) {
                concatInPlace(result, createBlockInfo(topBlock, 0));
                for (let i = 0; i < thread.stack.length; i++) {
                    const blockId = thread.stack[i];
                    if (blockId === topBlock.id) continue;
                    const block = controller.getBlock(thread.target, blockId);
                    if (block) {
                        concatInPlace(result, createBlockInfo(block, i));
                    }
                }
            }

            if (cacheInfo.compiledItem) {
                result.push(cacheInfo.compiledItem);
            }

            return result;
        };

        for (let i = 0; i < threads.length; i++) {
            const thread = threads[i];
            if (thread.updateMonitor) {
                continue;
            }
            concatInPlace(newRows, createThreadInfo(thread, 0));
        }

        logView.rows = newRows;
        logView.queueUpdateContent();
    };

    const removeAfterStep = controller.addAfterStepCallback(() => {
        updateContent();
        const runningThread = engine.getRunningThread();
        glow(runningThread ? [runningThread] : []);
    });

    const handlePauseChanged = () => {
        updateContent();
    };
    engine.onPauseChanged(handlePauseChanged);

    engine.onSingleStep(() => {
        updateContent();
        queueMicrotask(() => {
            const runningIndex = logView.rows.findIndex(i => i.running);
            if (runningIndex !== -1 && !logView.isInView(runningIndex, logView.rowHeight)) {
                let found = false;
                const maxScrollback = Math.floor(logView.height / logView.rowHeight);
                for (let i = 1; i < maxScrollback; i++) {
                    const checkIndex = runningIndex - i;
                    if (logView.rows[checkIndex] && logView.rows[checkIndex].type === 'thread-header') {
                        logView.scrollTo(checkIndex);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    logView.scrollTo(Math.max(0, runningIndex - maxScrollback + 5));
                }
            }
        });
    });

    return {
        id: 'threads',
        label: 'Threads',
        icon: threadsIcon,
        content: logView.outerElement,
        buttons: [],
        show: () => {
            logView.show();
            updateContent();
        },
        hide: () => {
            logView.hide();
        },
        destroy: () => {
            if (removeAfterStep) removeAfterStep();
            glow([]);
        }
    };
};

export default createThreadsTab;

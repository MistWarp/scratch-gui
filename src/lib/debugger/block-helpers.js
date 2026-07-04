import Utils from '../find-bar/Utils.js';

const COLOR_CLASSES = [
    'motion',
    'looks',
    'sounds',
    'events',
    'control',
    'sensing',
    'operators',
    'data',
    'data-lists',
    'list',
    'more',
    'pen',
    'addon-custom-block'
];

const createBlockHelpers = vm => {
    const getScratchBlocks = () => window.ScratchBlocks;

    const getBlock = (target, id) =>
        target.blocks.getBlock(id) || vm.runtime.flyoutBlocks.getBlock(id);

    const getCustomBlock = procedureCode => vm.getAddonBlock(procedureCode);

    const getTargetInfoById = id => {
        const target = vm.runtime.getTargetById(id);
        if (target) {
            let name = target.getName();
            let original = target;
            if (!target.isOriginal) {
                name = `clone of ${name}`;
                original = target.sprite.clones[0];
            }
            return {
                exists: true,
                originalId: original.id,
                name
            };
        }
        return {
            exists: false,
            original: null,
            name: 'Unknown sprite'
        };
    };

    const switchToSprite = targetId => {
        if (targetId !== vm.editingTarget.id) {
            if (vm.runtime.getTargetById(targetId)) {
                vm.setEditingTarget(targetId);
            }
        }
    };

    const activateCodeTab = () => {
        const store = window.ReduxStore;
        if (!store) return;
        if (store.getState().scratchGui.editorTab.activeTabIndex !== 0) {
            store.dispatch({
                type: 'scratch-gui/navigation/ACTIVATE_TAB',
                activeTabIndex: 0
            });
        }
    };

    const goToBlock = blockId => {
        const ScratchBlocks = getScratchBlocks();
        if (!ScratchBlocks) return;
        const workspace = ScratchBlocks.getMainWorkspace();
        if (!workspace) return;
        const block = workspace.getBlockById(blockId);
        if (!block) return;
        if (block.workspace.isFlyout) return;
        new Utils(vm, ScratchBlocks).scrollBlockIntoView(blockId);
    };

    const createBlockLink = (targetInfo, blockId) => {
        const link = document.createElement('a');
        link.className = 'sa-debugger-log-link';

        const {exists, name, originalId} = targetInfo;
        link.textContent = name;
        if (exists) {
            link.addEventListener('mousedown', () => {
                switchToSprite(originalId);
                activateCodeTab();
                goToBlock(blockId);
            });
        } else {
            link.classList.add('sa-debugger-log-link-unknown');
        }

        return link;
    };

    const formatProcedureCode = procedureCode => {
        const customBlock = getCustomBlock(procedureCode);
        if (customBlock) {
            procedureCode = customBlock.displayName;
        }
        return procedureCode.replace(/%[nbs]/g, '()');
    };

    const formatBlocklyBlockData = jsonData => {
        const processSegment = index => {
            const message = jsonData[`message${index}`];
            const args = jsonData[`args${index}`];
            if (!message) {
                return null;
            }
            const parts = message.split(/%\d+/g);
            let formattedMessage = '';
            for (let i = 0; i < parts.length; i++) {
                formattedMessage += parts[i];
                const argInfo = args && args[i];
                if (argInfo) {
                    const type = argInfo.type;
                    if (type === 'field_image') {
                        const src = argInfo.src;
                        if (src.endsWith('rotate-left.svg')) {
                            formattedMessage += '↺';
                        } else if (src.endsWith('rotate-right.svg')) {
                            formattedMessage += '↻';
                        } else if (src.endsWith('green-flag.svg')) {
                            formattedMessage += '⚑';
                        }
                    } else if (type !== 'field_vertical_separator') {
                        formattedMessage += '()';
                    }
                }
            }
            return formattedMessage;
        };

        const parts = [];
        let i = 0;
        let nextSegment = processSegment(i);
        while (nextSegment) {
            parts.push(nextSegment);
            i++;
            nextSegment = processSegment(i);
        }
        return parts.join(' ');
    };

    const createBlockPreview = (targetId, blockId) => {
        const ScratchBlocks = getScratchBlocks();
        const target = vm.runtime.getTargetById(targetId);
        if (!target || !ScratchBlocks) {
            return null;
        }

        const block = getBlock(target, blockId);
        if (!block || block.opcode === 'text') {
            return null;
        }

        let text;
        let category;
        let shape;
        let color;
        if (
            block.opcode === 'data_variable' ||
            block.opcode === 'data_listcontents' ||
            block.opcode === 'argument_reporter_string_number' ||
            block.opcode === 'argument_reporter_boolean'
        ) {
            text = Object.values(block.fields)[0].value;
            if (block.opcode === 'data_variable') {
                category = 'data';
            } else if (block.opcode === 'data_listcontents') {
                category = 'list';
            } else {
                category = 'more';
            }
            shape = 'round';
        } else if (block.opcode === 'procedures_call') {
            const proccode = block.mutation.proccode;
            text = formatProcedureCode(proccode);
            const customBlock = getCustomBlock(proccode);
            category = customBlock ? 'addon-custom-block' : 'more';
        } else if (block.opcode === 'procedures_definition') {
            const prototypeBlockId = block.inputs.custom_block.block;
            const prototypeBlock = getBlock(target, prototypeBlockId);
            const proccode = prototypeBlock.mutation.proccode;
            text = ScratchBlocks.ScratchMsgs.translate('PROCEDURES_DEFINITION', 'define %1').replace(
                '%1',
                formatProcedureCode(proccode)
            );
            category = 'more';
        } else {
            let jsonData;
            const fakeBlock = {
                jsonInit (data) {
                    jsonData = data;
                }
            };
            const blockConstructor = ScratchBlocks.Blocks[block.opcode];
            if (blockConstructor) {
                try {
                    blockConstructor.init.call(fakeBlock);
                } catch (e) {
                    void e;
                }
            }
            if (!jsonData) {
                return null;
            }
            text = formatBlocklyBlockData(jsonData);
            if (!text) {
                return null;
            }
            category = jsonData.extensions && jsonData.extensions.includes('default_extension_colors') ?
                'pen' : jsonData.category;
            const isStatement =
                (jsonData.extensions &&
                    (jsonData.extensions.includes('shape_statement') ||
                        jsonData.extensions.includes('shape_hat') ||
                        jsonData.extensions.includes('shape_end'))) ||
                'previousStatement' in jsonData ||
                'nextStatement' in jsonData;
            shape = isStatement ? 'stacked' : 'round';
            color = jsonData.colour;
        }

        if (!text) {
            return null;
        }

        const element = document.createElement('span');
        element.className = 'sa-debugger-block-preview sa-block-color';
        element.textContent = text;
        element.dataset.shape = shape;

        if (COLOR_CLASSES.includes(category)) {
            element.classList.add(`sa-block-color-${category}`);
        } else if (color) {
            element.style.setProperty('--sa-block-colored-background', color);
        }

        return element;
    };

    return {
        getBlock,
        getTargetInfoById,
        createBlockLink,
        createBlockPreview,
        switchToSprite,
        activateCodeTab,
        goToBlock
    };
};

export default createBlockHelpers;

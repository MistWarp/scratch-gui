// eslint-disable-next-line require-jsdoc
export default async function ({addon}) {
    const Blockly = await addon.tab.traps.getBlockly();
    const populate = Blockly.Toolbox.prototype.populate_;

    Blockly.Toolbox.prototype.populate_ = function (tree) {
        if (addon.self.disabled) return populate.call(this, tree);
        const merged = tree.cloneNode(true);
        const operators = Array.from(merged.children).find(category => category.id === 'operators');
        const strings = Array.from(merged.children).find(category => category.id === 'mwStrings');
        if (operators && strings) {
            while (strings.firstChild) operators.appendChild(strings.firstChild);
            strings.remove();
        }
        return populate.call(this, merged);
    };

    const updateToolbox = () => {
        const workspace = Blockly.getMainWorkspace();
        if (workspace) workspace.updateToolbox(workspace.options.languageTree);
    };

    updateToolbox();
    addon.self.addEventListener('disabled', updateToolbox);
    addon.self.addEventListener('reenabled', updateToolbox);
}

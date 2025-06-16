export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  
  const injectCurrent = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace && workspace.options) {
      workspace.options.hasSounds = true;
      const pathToMedia = workspace.options.pathToMedia;
      if (pathToMedia) {
        ScratchBlocks.inject.loadSounds_(pathToMedia, workspace);
      }
    }
  };

  const removeSoundsFromCurrent = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      workspace.options.hasSounds = false;
      const audio = workspace.getAudioManager();
      if (audio && audio.SOUNDS_) {
        delete audio.SOUNDS_.click;
        delete audio.SOUNDS_.delete;
      }
    }
  };

  // Add sounds to the current workspace when addon loads
  injectCurrent();

  addon.self.addEventListener("disabled", () => {
    removeSoundsFromCurrent();
  });
  
  addon.self.addEventListener("reenabled", () => {
    injectCurrent();
  });
}

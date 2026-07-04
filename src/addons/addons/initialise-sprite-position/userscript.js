export default async function ({ addon }) {
  const vm = addon.tab.traps.vm;

  const oldAddSprite = vm.constructor.prototype.addSprite;
  vm.constructor.prototype.addSprite = function (input) {
    let spriteObj = null;
    if (typeof input === "string") {
      spriteObj = JSON.parse(input);
    } else if (input && typeof input === "object" && !(input instanceof ArrayBuffer) && !ArrayBuffer.isView(input)) {
      spriteObj = input;
    }
    const isEmpty = spriteObj?.costumes?.[0]?.baseLayerMD5 === "cd21514d0531fdffb22204e0ec5ed84a.svg";
    const shouldPositionSprite = isEmpty || !spriteObj?.tags || !addon.settings.get("library");
    return oldAddSprite.call(this, input).then((result) => {
      if (!addon.self.disabled && shouldPositionSprite) {
        this.editingTarget?.setXY(addon.settings.get("x"), addon.settings.get("y"));
      }
      return result;
    });
  };

  const registerDupPrototype = () => {
    const targetPrototype = vm.runtime.getTargetForStage().constructor.prototype;
    const oldDuplicate = targetPrototype.duplicate;
    targetPrototype.duplicate = function () {
      return oldDuplicate.call(this).then((newSprite) => {
        if (!addon.self.disabled) {
          switch (addon.settings.get("duplicate")) {
            case "custom":
              newSprite.setXY(addon.settings.get("x"), addon.settings.get("y"));
              break;
            case "keep":
              newSprite.setXY(this.x, this.y);
          }
        }
        return newSprite;
      });
    };
  };

  if (vm.runtime.getTargetForStage()) {
    registerDupPrototype();
  } else {
    vm.runtime.once("PROJECT_LOADED", registerDupPrototype);
  }
}

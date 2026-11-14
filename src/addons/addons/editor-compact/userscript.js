import EventTarget from "../../event-target.js"; /* inserted by pull.js */

export default async function ({ addon, global, console }) {
  // The workspace needs to be manually resized via a window resize event
  // whenever the addon modifies or stops modifying UI elements
  resizeWorkspace();

  let resizeObserver = new ResizeObserver(() => {
    if (resizeObserver._raf) return;
    resizeObserver._raf = requestAnimationFrame(() => {
      resizeObserver._raf = null;
      resizeWorkspace();
    });
  });
  (async () => {
    while (true) {
      let menuBar = await addon.tab.waitForElement('[class*="menu-bar_menu-bar"]', {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      });
      resizeObserver.observe(menuBar);
    }
  })();

  async function resizeWorkspace() {
    window.dispatchEvent(new Event("resize"));
  }
}

export default async function ({ addon, console, msg }) {
  let stageHidden = false;
  let bodyWrapper;
  let smallStageButton;
  let largeStageButton;
  let fullStageButton;
  let resizer;
  let originalResizerDisplay;

  function setStageWidth(width) {
    if (!bodyWrapper) return;
    stageHidden = width === "0px";

    bodyWrapper.style.width = width;
    bodyWrapper.style.flexBasis = width;
    bodyWrapper.style.flexShrink = "0";

    if (stageHidden) {
      document.body.classList.add("sa-stage-hidden-outer");
      bodyWrapper.classList.add("sa-stage-hidden");
      if (resizer) resizer.style.display = "none";
      hideStageButton.setAttribute("aria-pressed", true);
    } else {
      document.body.classList.remove("sa-stage-hidden-outer");
      bodyWrapper.classList.remove("sa-stage-hidden");
      if (resizer) resizer.style.display = originalResizerDisplay || "flex";
      hideStageButton.setAttribute("aria-pressed", false);
    }

    window.dispatchEvent(new Event("resize"));
  }

  const hideStageButton = Object.assign(document.createElement("button"), {
    type: "button",
    className: addon.tab.scratchClass("toggle-buttons_button", { others: "sa-hide-stage-button" }),
    title: msg("hide-stage"),
  });
  hideStageButton.setAttribute("aria-label", msg("hide-stage"));
  hideStageButton.setAttribute("aria-pressed", false);

  const hideStageIcon = Object.assign(addon.tab.recolorable(), {
    className: addon.tab.scratchClass("stage-header_stage-button-icon"),
    src: addon.self.getResource("/icon.svg"),
    draggable: false,
  });
  hideStageIcon.setAttribute("aria-hidden", true);
  hideStageButton.appendChild(hideStageIcon);

  addon.self.addEventListener("disabled", () => {
    hideStageButton.remove();
  });

  addon.self.addEventListener("reenabled", () => {
    const stageControls = document.querySelector(
      "[class*='stage-header_stage-size-toggle-group_'] > [class*='toggle-buttons_row_']"
    );
    if (stageControls) stageControls.insertBefore(hideStageButton, smallStageButton);
  });

  while (true) {
    const stageControls = await addon.tab.waitForElement(
      "[class*='stage-header_stage-size-toggle-group_'] > [class*='toggle-buttons_row_']",
      {
        markAsSeen: true,
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      }
    );

    bodyWrapper = document.querySelector("[class*='stage-and-target-wrapper']");
    resizer = document.querySelector("[class*='stage-pane-resizer']");
    originalResizerDisplay = resizer?.style.display || "flex";

    const stageButtons = Array.from(stageControls.querySelectorAll("button"));
    smallStageButton = stageButtons[0];
    largeStageButton = stageButtons.length === 3 ? stageButtons[1] : null;
    fullStageButton = stageButtons[stageButtons.length - 1];

    if (!addon.self.disabled) stageControls.insertBefore(hideStageButton, smallStageButton);

    hideStageButton.addEventListener("click", () => setStageWidth("0px"));
    smallStageButton?.addEventListener("click", () => setStageWidth("408px"));
    largeStageButton?.addEventListener("click", () => setStageWidth("576px"));
    fullStageButton?.addEventListener("click", () => setStageWidth("800px"));
  }
}

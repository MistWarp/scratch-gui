import {setup as setupPause} from "../../../lib/debugger/pause.js";

export {
  getRunningThread,
  isPaused,
  onPauseChanged,
  onSingleStep,
  setPaused,
  singleStep,
} from "../../../lib/debugger/pause.js";

export const setup = (addon) => setupPause(addon.tab.traps.vm);

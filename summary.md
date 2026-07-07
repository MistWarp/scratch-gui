# Context Summary - fractch rebuild & hot-patcher issues

## Session Context
- **Project**: mistwarp/scratch-gui (fork of Scratch GUI with fractch integration)
- **Related repos**: `~/origin-fractch` (fractch source), `~/fractch` (built fractch workspace)
- **Issue**: Editing `~/origin-fractch` rebuilds entire `~/fractch` workspace instead of incremental sync

## Issues Identified

### 1. Hot-patcher always re-enables ScratchBlocks Events
**File**: `src/lib/fractch-live/hot-patcher.js:308-315`
**Problem**: `withBlocklyEventsDisabled` always calls `Events.enable()` in `finally`, even if events were disabled before.
**Fix applied**: Now captures `wasEnabled = ScratchBlocks.Events.isEnabled()` before disabling, only re-enables if it was originally enabled. Matches pattern in `src/lib/collaboration/vm-applier.js:235-242`.

### 2. Full project JSON sent on every change
**Current flow**:
1. fractch CLI detects file change in `~/origin-fractch`
2. Rebuilds entire project → generates new `project.json` + `project.sb3`
3. Sends WebSocket message: `{"type":"packed","version":3,"manifestUrl":".../project.json?v=3","projectUrl":".../project.sb3?v=3"}`
4. Client (`src/lib/fractch-live/index.js`) fetches `manifestUrl` (full project.json)
5. Client computes diff locally in `hotPatchProject()` → applies granular patch

**Issue**: Even a string change triggers full project.json transfer (~100KB+). The client already does granular patching locally, but network transfer is not incremental.

### 3. Workspace rebuild on origin-fractch edit
The fractch CLI (`~/origin-fractch`) appears to do full rebuild on any source change rather than incremental compilation. This is a fractch CLI issue (in `~/origin-fractch`), not scratch-gui.

## Granular Patch Protocol (User Request)
User wants: "send a delete this hat and recreate it with these blocks kinda of packet"

**Requires protocol change** between fractch CLI (server) and scratch-gui (client):
- New message type: `patch` with operations like `{op: 'deleteBlock', blockId}`, `{op: 'insertBlock', xml, parentId}`
- Server computes diff from AST, sends minimal operations
- Client applies operations directly to Blockly workspace

**Current architecture limitation**: Client receives full project.json, diffs locally. To avoid full transfer, server must send diffs.

## Files Modified (Uncommitted)
- `src/lib/fractch-live/hot-patcher.js` - Fixed `withBlocklyEventsDisabled` (events re-enable fix)
- `src/lib/fractch-live/index.js` - New live reload client (untracked)
- `src/containers/gui.jsx` - Integrated live reload
- `src/addons/addons/sprite-folders/_manifest_entry.js` - Formatting changes

## Next Steps
1. **For granular patches**: Modify `~/origin-fractch` CLI to support diff protocol + update client to handle `patch` messages
2. **For workspace rebuild**: Investigate fractch CLI build system in `~/origin-fractch` for incremental compilation
3. **Summary**: This file created as requested
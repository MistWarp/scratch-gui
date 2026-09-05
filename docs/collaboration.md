# Collaboration editing commands

Collaboration protocol 2 requires the updated scratch-vm and GUI together. It is
not compatible with protocol 1 rooms.

The VM exposes `editingCommands`. Without a handler, its normal editing methods
retain their existing behavior. During a session, the GUI installs a handler
which sends editing requests before those methods mutate the project.

The host executes each request through native VM methods in one awaited queue.
It broadcasts the resulting mutations, including IDs generated during sprite
imports and script sharing. Clients apply these concrete mutations through the
VM, then refresh the editor from VM state. A client's own request takes the same
path as another person's request. Runtime animation events are not commands.

Requests address sprites and costume/sound entries by stable IDs. Reorders also
identify their destination. Shared asset bytes do not identify a list entry:
importing the same sound twice creates two entries.

The VM command context supplies an explicit editing target to native methods
without changing the user's selected sprite. Blockly events go through the VM's
block listener before mutation; the receiver does not need a Blockly workspace.
Workspace rendering disables synthetic events at their source. Field editing and
dragging finish before a collaboration refresh rebuilds the visible workspace.

Binary arguments travel through the asset channel. Sound commands retain the
encoded audio used by project serialization. Bitmap encoding returns a promise
so a commit cannot precede the new image asset. Asset transfers retry when
progress stops and end the connection with an error after repeated failure.

Snapshots share the host command queue. Their bytes, sequence number and editing
IDs describe the same completed state. Saves disable ID optimization, and
snapshot metadata restores IDs which the project importer otherwise regenerates.
Snapshot reception retries failures and cancels superseded loads.

Unacknowledged requests keep their request IDs when retried. The host keeps
receipts to prevent duplicate execution; old receipts discard their large
mutation bodies after the replay window expires. Session destruction invalidates
queued work, and asynchronous VM imports check the session lifetime before
installing their results.

Regression coverage lives in `test/unit/collaboration`. Session tests use an
asynchronous transport simulator; VM tests exercise native block, comment,
sprite, sharing and asset operations. `command-recovery.test.js` covers delayed
completion, retries, duplicate requests and snapshot capture boundaries.
`service-vm.test.js` connects two real VMs through the service and simulated
transport, covering snapshot onboarding, edits from both peers and binary
sprite imports. Real WebRTC connections still need a cross-device check.

# Editor isolation

The web editor uses two entry points on the existing site:

- `editor.html` is the account host. It owns credentials, trusted permission dialogs and persistent storage.
- `editor-runtime.html` runs the editor, VM, renderer and custom extensions together in an opaque sandbox.

The runtime keeps synchronous `Scratch.vm` and renderer access. This isolates the account from project code; it does not isolate extensions from the current project or from one another.

The iframe has no `allow-same-origin`, popup or top-navigation permission. Its HTML response also carries a CSP `sandbox` directive in the Vite server, preview server, static header configuration and hosting middleware. The bootstrap checks both its opaque origin and that it is framed before importing the editor. Direct entry fails closed even on a static host that ignores the header configuration. Public assets need CORS headers so the opaque runtime can load modules and fonts.

## Account operations

The host accepts a handshake only from its own iframe with origin `null`, then transfers a private MessagePort. An opaque origin alone is not an identity check. Requests use an explicit operation table and account API route policy. Upload destinations come from the outer page's project selection or a project ID returned by the server after an approved create/remix. Runtime-supplied IDs do not grant access to another project.

Only public identity fields cross the boundary. Account tokens, Git credentials and the parent DOM are not exposed. Saving to an existing project needs approval for that editor session; publishing, metadata changes and account preference changes need separate host consent. Game data uses the selected project's editor context, with capabilities kept in the host. Built-in Rotur calls use an explicit method/scope list and host consent; the runtime's `sensitive` flag is not trusted.

Account operations without an explicit bridge are rejected. In particular, raw credential access and private Git authentication are not available inside the runtime. Browser features that require a non-opaque origin, including direct camera/microphone capture, cannot be restored by granting an extension VM access. These require separate host-mediated integrations.

Network requests from the runtime have origin `null`. Public endpoints with permissive CORS work; endpoints that allow only the site's origin need an explicit integration. The host does not provide a general authenticated fetch proxy. Popup windows are also blocked by the sandbox.

## Storage

The runtime gets a scoped localStorage implementation and a private IndexedDB factory. Committed database contents, including binary assets and indexes, are persisted by the host under its selected account/workspace key and restored before the editor starts. Session storage remains temporary. Native account storage is never copied wholesale.

The editor fills the window without an extra host toolbar. Sign-in and account actions use the existing editor account menu; permission dialogs still run in the host. File → Earlier device backups opens earlier device backups without exposing the full backup database to extensions. File → Import saved backpack copies the existing device backpack only after host consent. Backups created inside the editor are accessible to code in that workspace, just like its other project data.

## Verification

Run the editor-sandbox unit tests and the existing security manager, account API, identity, project loading and Rotur host tests. The browser regression test is `test/integration/editor-sandbox.test.js`. It checks direct-entry refusal, unchanged VM extension loading, parent DOM/storage isolation and persistence after reload. Set `TEST_BASE_URL` to a running production preview and, if needed, `CHROMEDRIVER_PATH` to a driver matching the installed Chrome.

Before deployment, verify the actual hosting response for every runtime URL alias, static asset CORS and the authenticated save/publish flow. There is no unsandboxed fallback when initialization fails. Library and packaged-project consumers are separate from the web editor entry points.

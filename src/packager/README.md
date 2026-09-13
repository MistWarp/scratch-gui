# Editor packager

The packager source lives in the GUI repository and is built by Vite. It does not require a checkout, build, or deployment of the former packager website.

`src/containers/packager.jsx` owns the export settings, progress, cancellation, downloads, and preview as an editor React component. It uses the shared `WindowedModal` and the GUI's brand constants. The complete options form opens immediately. Each Package or Preview action reads a fresh SB3 from the active VM. Closing the window cancels packaging and releases download URLs.

The options UI is implemented in React under `src/components/packager`, grouped into tabs and styled with the editor's CSS variables. There is no separate website, Svelte application, message handshake, or application loading screen.

`scripts/vite-packager.mjs` emits self-contained player scripts under `packager-runtime/<build-id>/`. Each GUI build assigns a new runtime ID, uses it in runtime URLs and cache keys, and stamps the generated scripts. Packaging rejects a script from another build. The VM, renderer, audio engine, and storage resolve through the same installed dependencies and aliases as the GUI. No separate packager dependency versions are maintained.

The development server serves those scripts on demand. Both runtime variants currently include music support. Extension workers and player CSS are embedded in the scripts so exported HTML can run independently. Desktop runtime archives still come from the checksum-verified upstream asset mirrors.

Sandboxed previews use isolated, in-memory Web Storage and IndexedDB when the browser denies native storage. They never inherit the editor's account tokens or databases. Normal standalone exports keep native browser storage when available.

Players, Data, Inventory, Marketplace, and built-in Rotur extensions receive standalone account hosts. Projects using these blocks wait for a verified Rotur login before starting; other projects do not show a login screen. Permissions come from the project's Rotur blocks, with separate confirmation for sensitive operations. Published projects retain their MistWarp project ID and use the play-context API for game data. Unpublished projects keep saves locally per player. Multiplayer remains disabled, matching the editor. No publisher credentials are embedded in exports.

The source was imported from the MistWarp fork of TurboWarp Packager. Its MPL-2.0 license is preserved in `LICENSE`; the runtime retains its upstream notices. Changes to packaging behavior belong here.

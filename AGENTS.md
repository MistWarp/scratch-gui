# AGENTS.md

scratch-gui is the MistWarp editor and community site: one Vite build with React 16 and Redux, pnpm, and Jest. It is a fork of TurboWarp's GUI. The engine forks (scratch-vm, scratch-render, scratch-audio, scratch-paint, scratch-blocks) are pinned commits in `package.json`.

## Where code goes

| Path | Holds |
| --- | --- |
| `src/modules/<name>/` | New shared code, in strict TypeScript. `index.ts` is the module's only public entry. The current modules are listed in `docs/conventions.md`. |
| `src/lib/` | Older shared JavaScript. Don't add to it; write a module instead, and move code out when you touch it substantially. |
| `src/components/`, `src/containers/` | Editor UI. Components are presentational, containers connect to Redux or the VM. New components are function components with hooks. |
| `src/community/` | The community site: React Router, hooks, its own i18n and design tokens. |
| `src/reducers/`, `src/playground/` | Editor state, and the page entry points. |
| `src/addons/` | The addon runtime. `src/addons/addons` is vendored from Scratch Addons. |

Never edit `src/generated/`, `src/addons/addons/` or `src/addons/generated/` by hand. `src/packager/` is the imported TurboWarp Packager and is where packaging changes go: edit it directly, and `scripts/vite-packager.mjs` rebuilds its player scripts. It keeps its upstream style and ESLint skips it, so lint does not check changes there.

## Rules the tooling enforces

`pnpm check` runs all of these, and CI runs the same steps (`.github/workflows/node.js.yml`). Turn on the pre-commit hook with `pnpm run hooks:install`.

- **Lint and types:** `pnpm run lint`, `pnpm run typecheck`. TypeScript is strict, including `noUncheckedIndexedAccess`, and uses the typescript-eslint strict and stylistic rules.
- **Module boundaries:** modules may not import components, containers, community, playground, reducers or addons. Every module is imported through its index.
- **No code comments and no em dashes** in anything you add: `pnpm run check:conventions`. Only tool directives (`eslint-disable`, `@ts-expect-error`) are allowed. Name things so the code explains itself.
- **Web storage:** use `local` and `session` from `src/modules/storage`. Files still on raw `localStorage` are listed in `scripts/eslint-legacy-storage-files.cjs`. Remove a file from that list when you migrate it, and never add one.
- **Strings:** editor text goes through react-intl, community text through `text()` from `useCommunityIntl()`. Run `pnpm run i18n:editor:extract` or `pnpm run i18n:community:extract` and commit the result.
- **Community CSS:** `pnpm run check:community-css`.

## Rules that are not automated yet

- Editor `defaultMessage` must be a single string literal, or extraction silently skips it. Community strings must be whole sentences.
- Every `.css` import is a CSS module. A bare `import './x.css'` whose classes are never used is dropped from production builds, so check visual changes in `pnpm run build:deploy`, not only `pnpm start`.
- UI: never put a left border or accent stripe on anything with rounded corners. Use flat fills, not gradients. Use sentence-case headings, one heading per section, and no eyebrow labels.
- Community UI uses only the tokens in `src/community/styles/tokens.module.css`, separates surfaces with fills rather than outlines, uses `components/UnderlineTabs.jsx` for tabs, and builds from the primitives in `components/ui/`.
- A refactor keeps behaviour, so existing tests pass unchanged. New code comes with tests: module tests go in `test/unit/modules/<name>.test.ts` and import from `@jest/globals`.

## Working here

- The default branch is `develop`. This repo is a fork, so open PRs with `gh pr create -R MistWarp/scratch-gui --base develop`.
- PRs with a visible change include screenshots, plus a recording for motion or interaction, checked in Chromium and Firefox.
- To test unmerged engine changes, run `pnpm run link` with the forks checked out next to this repo. `pnpm run deps:sync` moves the pins.
- A fresh worktree needs `src/generated/` copied from a checkout that has run Vite once.
- Never add `Co-Authored-By` or any AI or tool attribution to commits or PRs.
- READMEs are overviews. Documentation goes in MistWarp/docs (https://mistwarp.org/docs/), and repo conventions in `docs/conventions.md`.

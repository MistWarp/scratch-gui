# Code conventions

The repository holds two React apps that grew up separately: the editor (inherited from Scratch GUI and TurboWarp) and the community site (`src/community`). They follow different conventions. Match the code around you rather than mixing them.

## Editor (`src/components`, `src/containers`, `src/lib`, `src/playground`)

- **File names are kebab-case**: `menu-bar.jsx`, `menu-bar.css`. Presentational components live in `src/components`, and components connected to Redux or the VM live in `src/containers`.
- **Plain `.css` files are CSS modules.** `vite.config.mjs` resolves `import styles from './menu-bar.css'` as a CSS module even though the name has no `.module`. Class names are camelCased on import (`.menu-bar-item` becomes `styles.menuBarItem`). Only `@fontsource` and `jsoneditor` CSS is global.
- **Text goes through react-intl.** Use `<FormattedMessage>` or `defineMessages` + `intl.formatMessage` with an `id`, `defaultMessage` and `description`. ESLint's `react/jsx-no-literals` rejects bare strings in JSX. After adding or changing a message, run `pnpm run i18n:editor:extract` and commit `src/lib/tw-translations/default-messages.json`. Other languages come from `@turbowarp/scratch-l10n` and `src/lib/tw-translations`.
- Get Scratch Blocks through `src/lib/tw-lazy-scratch-blocks.js`, which loads it on demand, rather than importing `scratch-blocks` directly.

## Community site (`src/community`)

- **File names are PascalCase** for components and pages: `src/community/components/CommentThread.jsx` with `CommentThread.module.css` next to it. Helpers and hooks are kebab-case `.js` files (`use-escape.js`, `search-rank.js`).
- **Styles use explicit `.module.css` files.** Shared design tokens are in `src/community/styles/`. `pnpm run check:community-css` enforces the community CSS rules.
- **Text goes through the community catalog**: `const {text} = useCommunityIntl()` from `src/community/i18n.jsx`, then `text('English text')`. The English text is the key. Run `pnpm run i18n:community:extract` after adding strings. Catalogs are in `src/community/translations/`.
- The community ESLint override turns off `jsx-no-literals`, `jsx-no-bind` and `prop-types`, so those are not required here.
- API calls go through `src/community/api.js`, which wraps `src/lib/community/api.js`.

## Shared code

- `src/lib` holds code used by both apps or by the editor alone: `src/lib/community` (API client, cached fetch, whether the community build is on), `src/lib/rotur` (Rotur accounts), `src/lib/utils` (small pure helpers), `src/lib/themes`, `src/lib/settings`.
- Reuse the shared helpers in `src/lib/utils` instead of writing local copies: `bytes.js` (`formatBytes`, binary units such as "1.5 MB"; pass `{decimal: true}` for limits sold in decimal units), `async.js` (`sleep`), `copy-text.js` (clipboard copy with a fallback for when the Clipboard API is missing or refused; pass `{document}` for content shown in another window) and `safe-url.js` (`safeUrl`, which keeps only absolute http(s) links). `src/community/format.js` and `src/community/copy-text.js` re-export them for community code.
- Code under `src/community` may import from `src/lib`. Some editor code imports community modules (`src/community/api.js`, `Markdown.jsx`, `ui/SelectMenu.jsx`); for new code that both apps need, prefer a module in `src/lib`.
- Configuration that differs between environments comes from `process.env.*` values that `vite.config.mjs` defines (see `.env.example`). Always give a fallback, as in `process.env.MW_API_BASE || 'https://api.mistwarp.org/v1'`, because Jest does not run the Vite `define` step.
- `src/addons/addons`, `src/packager` and `src/generated` are vendored or generated. ESLint skips them; keep changes to them minimal.

## Components and state

- Write new components as function components with hooks. Class components remain in older editor code; convert them only when you are changing them substantially anyway.
- Editor state that several components share lives in Redux (`src/reducers`). Community state lives in React context (`UserContext.jsx`) and component state.

## Tests

- Unit tests live in `test/unit` and run with Jest and jsdom. Name them after what they cover (`community-comment-thread.test.jsx`, `lib/starter-projects.test.js`).
- The test setup uses Enzyme with the React 16 adapter. React Testing Library is not installed yet, so prefer to put logic in plain functions or hooks and test those directly, and keep component tests to rendering and the main interactions.
- `test/integration` holds Selenium tests that run against a build (`pnpm run test:integration`). Plain `jest` skips them.

## Planned tooling changes

These need new packages, so they are follow-ups rather than current practice: React Testing Library in place of Enzyme, ESLint 9 with a flat config, Playwright in place of Selenium for the browser tests, a component workshop (Storybook or Ladle), and Mock Service Worker for API mocks in tests.

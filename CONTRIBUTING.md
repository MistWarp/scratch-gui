# Contributing to the MistWarp editor

Thanks for helping. This file is the short version; the [README](README.md) has the details, and the [MistWarp contributor docs](https://mistwarp.org/docs/contributing/overview/) cover the code style rules and how the MistWarp packages fit together.

## Set up

Follow [Get started](README.md#get-started): Node.js from `.nvmrc`, pnpm through `corepack enable`, then `pnpm install`, `cp .env.example .env` and `pnpm start`. `.env.example` lists every setting, including `MW_API_BASE` for running the community site against a local API.

To change the engine (`scratch-vm`, `scratch-blocks`, `scratch-render`, `scratch-paint`, `scratch-audio`), see [Work on the engine packages](README.md#work-on-the-engine-packages).

## Before you open a pull request

```sh
pnpm check
```

runs ESLint, the translation checks, the community CSS check and the unit tests, without the network. `pnpm run check:full` also checks the fork pins and runs the production build, as CI does. See [Check your changes](README.md#check-your-changes).

Optionally, `pnpm run hooks:install` adds a pre-commit hook that lints staged files and runs the translation checks.

If you added or changed user-facing text:

- Editor: `pnpm run i18n:editor:extract`, then commit `src/lib/tw-translations/default-messages.json`.
- Community site: `pnpm run i18n:community:extract`, then commit the catalog.

## Writing code

- [docs/conventions.md](docs/conventions.md) explains the editor and community conventions (file names, CSS modules, translations, tests). Follow the conventions of the area you are changing.
- Add unit tests in `test/unit` for new behaviour. Pure functions and hooks are the easiest to test.
- Keep pull requests to one change. Include screenshots for UI changes.

## Reporting bugs and ideas

Use the [issue forms](https://github.com/MistWarp/scratch-gui/issues/new/choose). For a bug, the build ID from <https://mistwarp.org/version.json> and your browser help a lot.

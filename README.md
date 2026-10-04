# MistWarp editor

This repository is the browser app behind [mistwarp.org](https://mistwarp.org/): the editor, the project player, and the community site. It is a fork of [TurboWarp](https://github.com/TurboWarp/scratch-gui), which is based on Scratch GUI.

Contributor docs, including the code style rules and how the other MistWarp packages fit together, are at [mistwarp.org/docs/contributing](https://mistwarp.org/docs/contributing/overview/). [CONTRIBUTING.md](CONTRIBUTING.md) is the short version for this repository, and [docs/conventions.md](docs/conventions.md) explains how editor and community code differ.

## Requirements

- Node.js 22, as pinned in `.nvmrc` (20.19 is the minimum)
- pnpm 10, as pinned in `package.json`. Run `corepack enable` once and Node picks the right version.
- Git, and an internet connection for the first install and first start

## Get started

```sh
git clone https://github.com/MistWarp/scratch-gui.git
cd scratch-gui
pnpm install
cp .env.example .env
pnpm start
```

With the `.env` from `.env.example`, `MW_COMMUNITY=true` turns on the community site:

- <http://localhost:8601/> is the community site. It talks to the live API at `api.mistwarp.org`, or to the server in `MW_API_BASE`.
- <http://localhost:8601/editor> is the editor.

Without `.env`, <http://localhost:8601/> is the editor and the community pages are left out.

The first start downloads the micro:bit HEX file and writes the generated sources in `src/generated/`. Later starts work offline. Changes to React components and CSS reload automatically.

## Build

```sh
pnpm run build
pnpm run preview
```

`pnpm run build` writes the site to `build/`, and `pnpm run preview` serves it on port 8601. A community build needs more memory than Node's default heap, so the build scripts run Node with `--max-old-space-size=7168`. Run them through `pnpm run`, not as `node scripts/build.mjs`, or pass that flag yourself.

- `pnpm run build:deploy` builds the site as production does, with the community site.
- `pnpm run build:editor` builds only the editor, as one bundle.
- `pnpm run build:community` builds only the community site.
- `pnpm run build:library` builds the GUI library into `dist/`, and `pnpm run build:all` builds the site and the library.
- `pnpm run build:stats` and `pnpm run build:report` report bundle sizes.

These scripts pass flags to `scripts/build.mjs` instead of setting environment variables, so they work on Windows too: `--entry=<page>`, `--community`, `--no-community`, `--stats`, `--library` and `--site-only`.

Production runs on Cloudflare Pages, which builds `develop` with `MW_COMMUNITY=true`, updates the engine forks to their latest `develop`, and adds the docs site under `/docs`. Its build command is `node scripts/cloudflare-build.mjs`. That script installs once with the forks already updated and skips their build scripts, since the site compiles the forks from source, then fetches the micro:bit HEX file with `pnpm run setup:microbit`. It downloads `/docs` from the archive that the MistWarp/docs deployment publishes, and builds the docs from source only when that archive is behind docs `master`.

## Check your changes

Before pushing, run:

```sh
pnpm check
```

`pnpm check` (also `pnpm test`) works offline and runs, in order:

- `pnpm run lint`: ESLint on every `.js`, `.jsx`, `.mjs` and `.cjs` file. `pnpm run fmt` fixes what it can, and `npx eslint <files>` checks just the files you changed.
- `pnpm run i18n:editor:check` and `pnpm run i18n:community:check`: every message is extracted and every catalog is valid.
- `pnpm run check:community-css`: the community CSS rules.
- `pnpm run test:unit:ci`: the Jest tests in `test/unit`.

`pnpm run check:full` adds what needs the network or several minutes: `pnpm run deps:check` (the fork pins are current), `pnpm run build:deploy` (the production build) and `pnpm run validate-deploy` (the built pages reference files that exist). Pull requests run all of it, split over three parallel CI jobs: `static`, `unit` and `build`.

Also run these when they apply:

- `pnpm run i18n:editor:extract` after adding or changing an editor message, then commit `src/lib/tw-translations/default-messages.json`.
- `pnpm run i18n:community:extract` after adding a community string.
- `pnpm run test:unit:watch` while working, or `npx jest <path>` for one file.
- `pnpm run test:integration` runs the Selenium tests in `test/integration` against `build/`. Build first; the tests open `build/editor.html`, so they work with and without the community site. They need Chrome and a matching `chromedriver`. Plain `jest` leaves these tests out.

### Pre-commit hook (optional)

`pnpm run hooks:install` points Git at `.githooks/`. Its pre-commit hook runs ESLint on the staged script files and, when `src/` changed, the i18n checks. It takes a few seconds and needs no extra packages. `git commit --no-verify` skips it once, and `git config --unset core.hooksPath` turns it off.

## Work on the engine packages

The editor depends on MistWarp forks of `scratch-vm`, `scratch-blocks`, `scratch-render`, `scratch-paint`, and `scratch-audio`, pinned to commits in `package.json`. To change one, clone it next to `scratch-gui` and link it:

```sh
cd ..
git clone https://github.com/MistWarp/scratch-vm.git
cd scratch-gui
pnpm run link
```

`pnpm run link` links every fork that is checked out next to `scratch-gui` and skips the rest. `pnpm run unlink` goes back to the pinned copies. `pnpm run reinstall` forces a fresh install and links again. `pnpm run deps:sync` moves the pins to each fork's latest `develop`.

Things to know about linked forks:

- Each linked fork needs its own `npm install` in its checkout (the forks use npm lockfiles), since the editor resolves the fork's dependencies from there.
- The editor reads the generated Closure files of `scratch-blocks` (`blockly_compressed_vertical.js`, `blocks_compressed*.js`, `msg/`). After changing `scratch-blocks/core` or `blocks_vertical`, run its Closure build (`npm run build:closure` in the fork, which needs Python and the fork's dev dependencies) to regenerate them.
- Any `pnpm install` or `pnpm add` in `scratch-gui` replaces the links with the pinned copies without saying so. Run `pnpm run link` again afterwards.

## Environment variables

Set these in `.env` or in the shell.

| Variable | Effect |
| --- | --- |
| `MW_COMMUNITY` | `true` adds the community site and makes it the home page. |
| `PORT` | Port for `pnpm start` and `pnpm run preview`. Defaults to 8601. |
| `ROOT` | Base URL of the site. Must end in `/`. Defaults to `/`. |
| `BUILD_DIR` | Output directory for site builds. Defaults to `build`. |
| `ONLY_ENTRY` | Builds one page: `editor`, `community`, `player`, `fullscreen`, `embed`, `addon-settings`, or `credits`. |
| `SOURCEMAP` | `true` writes source maps. |
| `MW_BUILD_DOCS` | Clones and builds MistWarp/docs into `/docs`. A built sibling `../docs/build` is copied in instead when it exists. |
| `MW_PINNED_FORKS` | On Cloudflare Pages, keeps the fork pins from `package.json` instead of updating them. |
| `MW_DOCS_ORIGIN` | Docs deployment that Cloudflare Pages builds download `/docs` from. Defaults to `https://docs.warp.mistium.com`. |
| `MW_STATUS_URL` | Status service used by the community status page and analytics. Defaults to `https://status.warp.mistium.com`. |
| `MW_API_BASE` | MistWarp API for the community site, project embeds and Rotur thumbnails. Defaults to `https://api.mistwarp.org/v1`. |
| `MW_API_WS` | Realtime socket. Defaults to `MW_API_BASE` with `http` replaced by `ws`, plus `/ws`. |
| `MW_WARPTHEME_API` | WarpTheme API for the theme gallery. Defaults to `https://warptheme.mistium.com/api`. |
| `GOOGLE_FONTS_API_KEY` | Google Fonts API key for the theme font picker. |

`ROUTING_STYLE`, `STATIC_PATH`, `EXTRA_META`, `ENABLE_SERVICE_WORKER`, `DEBUG`, `MW_BUILD_ID`, `MW_BUILD_TIME`, `MW_BUILD_STATS`, and `MW_DOCS_BUILD` are also read. `.env.example` lists every variable with its default.

CI sets `CHROMEDRIVER_SKIP_DOWNLOAD=true` so that `pnpm install` skips the chromedriver download. Set it in your shell too if you never run `pnpm run test:integration`.

## Where things live

- `src/playground` holds the page entry points, and `vite.config.mjs` maps them to URLs.
- `src/components` and `src/containers` hold the editor UI. `src/components/gui` is the main layout.
- `src/community` is the community site.
- `src/addons` holds the built-in addons.
- `test/unit` holds the Jest tests and `test/integration` the browser tests.
- `docs/` covers internals such as the [project state machine](docs/project-state.md) and [collaboration](docs/collaboration.md).

## Translations

Editor strings use react-intl. Their English defaults are extracted into `src/lib/tw-translations/default-messages.json`, and other languages come from `@turbowarp/scratch-l10n`. Community strings go through `communityText()` and live in `src/community/translations/`. `pnpm run i18n:community:add <locale>` starts a new community language and `pnpm run i18n:community:coverage` shows how complete each one is.

## License

TurboWarp's modifications to Scratch are licensed under the GNU General Public License v3.0. See LICENSE or https://www.gnu.org/licenses/ for details.

The following is the original license for scratch-gui, which we are required to retain. This is NOT the license of this project.

```
Copyright (c) 2016, Massachusetts Institute of Technology
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

src/lib/default-project/dango.svg is based on [Twemoji](https://twemoji.twitter.com/) and is licensed under CC BY 4.0 https://creativecommons.org/licenses/by/4.0/

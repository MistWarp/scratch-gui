# MistWarp editor

This repository is the browser app behind [mistwarp.org](https://mistwarp.org/): the editor, the project player, and the community site. It is a fork of [TurboWarp](https://github.com/TurboWarp/scratch-gui), which is based on Scratch GUI.

Contributor docs, including the code style rules and how the other MistWarp packages fit together, are at [mistwarp.org/docs/contributing](https://mistwarp.org/docs/contributing/overview/).

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

- <http://localhost:8601/> is the community site. It talks to the live API at `api.mistwarp.org`.
- <http://localhost:8601/editor> is the editor.

Without `.env`, <http://localhost:8601/> is the editor and the community pages are left out.

The first start downloads the micro:bit HEX file and writes the generated sources in `src/generated/`. Later starts work offline. Changes to React components and CSS reload automatically.

## Build

```sh
pnpm run build
pnpm run preview
```

`pnpm run build` writes the site to `build/`, and `pnpm run preview` serves it on port 8601. A community build (`MW_COMMUNITY=true`) needs more memory than Node's default, so set `NODE_OPTIONS=--max-old-space-size=7168` if it runs out.

- `pnpm run build:editor` builds only the editor, as one bundle.
- `pnpm run build:community` builds only the community site.
- `pnpm run build:library` builds the GUI library into `dist/`, and `pnpm run build:all` builds the site and the library.
- `pnpm run build:stats` and `pnpm run build:report` report bundle sizes.

Production runs on Cloudflare Pages, which builds `develop` with `MW_COMMUNITY=true`, updates the engine forks to their latest `develop`, and adds the docs site under `/docs`.

## Check your changes

Pull requests run these checks, so run them before pushing:

```sh
pnpm run deps:check
pnpm run i18n:community:check
pnpm run i18n:editor:check
pnpm run test:unit:ci
MW_COMMUNITY=true pnpm run build
node scripts/validate-deploy.mjs build
```

Also run these when they apply:

- `pnpm run lint` for ESLint, or `npx eslint <files>` for the files you changed. `pnpm run fmt` fixes what it can.
- `pnpm run check:community-css` after changing CSS in `src/community`.
- `pnpm run i18n:editor:extract` after adding or changing an editor message, then commit `src/lib/tw-translations/default-messages.json`.
- `pnpm run i18n:community:extract` after adding a community string.
- `pnpm run test:unit:watch` while working, or `npx jest <path>` for one file.
- `pnpm run test:integration` runs the Selenium tests in `test/integration` against `build/`. It needs Chrome and a matching `chromedriver`.

## Work on the engine packages

The editor depends on MistWarp forks of `scratch-vm`, `scratch-blocks`, `scratch-render`, `scratch-paint`, and `scratch-audio`, pinned to commits in `package.json`. To change one, clone it next to `scratch-gui` and link it:

```sh
cd ..
git clone https://github.com/MistWarp/scratch-vm.git
cd scratch-gui
pnpm run link
```

`pnpm run link` links every fork that is checked out next to `scratch-gui` and skips the rest. `pnpm run unlink`, or another `pnpm install`, goes back to the pinned copies. `pnpm run reinstall` forces a fresh install and links again. `pnpm run deps:sync` moves the pins to each fork's latest `develop`.

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
| `MW_STATUS_URL` | Status service used by the community status page and analytics. |
| `GOOGLE_FONTS_API_KEY` | Google Fonts API key for the theme font picker. |

`ROUTING_STYLE`, `STATIC_PATH`, `EXTRA_META`, `ENABLE_SERVICE_WORKER`, `DEBUG`, `MW_BUILD_ID`, and `MW_BUILD_TIME` are also read. See `vite.config.mjs` and `scripts/build.mjs`.

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

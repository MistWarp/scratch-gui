### What this changes

<!-- What the pull request does and why. Link the issue it resolves, if there is one: "Resolves #123". -->

### Area

- [ ] Editor (editor, player, addons, packager)
- [ ] Community site (`src/community`)
- [ ] Build, CI, or tooling

### Screenshots

<!-- For UI changes, before and after. Include dark mode if the change affects colours. Delete this section otherwise. -->

### Checklist

- [ ] `pnpm check` passes (lint, i18n checks, community CSS check, unit tests).
- [ ] New or changed behaviour has unit tests, or this says why it can't.
- [ ] If editor strings changed: ran `pnpm run i18n:editor:extract` and committed `src/lib/tw-translations/default-messages.json`.
- [ ] If community strings changed: ran `pnpm run i18n:community:extract` and committed the catalog.
- [ ] If this needs a new engine fork commit: the pin in `package.json` points at it.

### How it was tested

<!-- Browsers and devices you tried, and anything a reviewer should try by hand. -->

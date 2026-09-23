# Embed themes

The parent page can update a running MistWarp embed with `postMessage`:

```js
iframe.contentWindow.postMessage({
    type: 'mw:apply-theme',
    theme: JSON.stringify({gui: 'dark', accent: 'blue', blocks: 'three'})
}, '*');
```

Send the message after the iframe loads. `'*'` supports sandboxed embeds with an
opaque origin; a known embed origin can be used for unsandboxed frames. The embed
accepts theme messages only from its parent window.

`theme` accepts the serialized `tw:theme` setting or the equivalent object. Legacy
`'light'` and `'dark'` strings also work. Send `null` to return to system preferences.
Changes update both the visual styles and the running GUI state without reloading
the project.

For an exported MistWarp custom theme, use `{inlineCustomTheme: exportedTheme}` as
the theme value. For a saved custom theme referenced by UUID, also send the
`customThemes` field containing the serialized `tw:custom-themes` array (or the
array itself). Custom definitions are loaded before the selected theme is resolved.
Omitting `customThemes` retains the current definitions; `''`, `null`, or `[]`
clears them. For example, to reset both:

```js
iframe.contentWindow.postMessage({
    type: 'mw:apply-theme',
    theme: null,
    customThemes: ''
}, '*');
```

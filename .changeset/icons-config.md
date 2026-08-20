---
'mermaid': minor
---

feat: Support icon packs via `icons` config

Adds declarative icon pack registration through `MermaidConfig.icons`, so icons
(used by Architecture diagrams and any `icon:` shape) can be loaded in
environments that can't run custom JavaScript — CLI/headless renders, Live
Editor, hosted Markdown renderers, etc.

```js
mermaid.initialize({
  icons: {
    packs: {
      logos: '@iconify-json/logos@1',
    },
  },
});
```

The existing `mermaid.registerIconPacks(...)` programmatic API continues to work
unchanged. New schema fields: `icons.packs`, `icons.cdnTemplate`,
`icons.maxFileSizeMB`, `icons.timeout`, `icons.allowedHosts`. Loads are lazy,
HTTPS-only, host-allowlisted, size-capped, and require version-pinned package
specs for deterministic renders.

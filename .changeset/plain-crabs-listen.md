---
'@mermaid-js/layout-elk': patch
---

fix(build): externalize `peerDependencies` in core builds so the layout plugins no longer inline a second copy of mermaid

`getBuildConfig` only externalized `dependencies`, so a runtime (non-type) import of the peer-depended mermaid resolved through `exports` to `dist/mermaid.core.mjs` and esbuild inlined the whole bundle. `@mermaid-js/layout-elk`'s core entry had grown to 106 files / 6.6 MB, carrying its own mermaid with separate module-level singletons — so mermaid rendering fixes did not reach the ELK layout path until the plugin itself was republished. The core entry is back to 3 files / ~41 KB and now defers to the host's mermaid. The self-contained `esm` entry is unchanged.

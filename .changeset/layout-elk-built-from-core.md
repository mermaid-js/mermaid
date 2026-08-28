---
'@mermaid-js/layout-elk': minor
---

feat: this package is now built from mermaid's own ELK implementation instead of carrying its own copy, and is only needed for Mermaid builds that ship without ELK.

`mermaid` bundles ELK and registers it automatically, so most projects can drop the dependency and the `registerLayoutLoaders` call. The package remains published and fully functional for the **tiny** build (`mermaid.tiny.js`), which omits ELK to stay small and where registering this is the only way to get an ELK layout.

Because it is compiled from mermaid's ELK source rather than importing the whole `mermaid` entry point, the published bundle no longer drags in every diagram type, parser and KaTeX: the minified ESM payload drops from roughly **1.58 MB to 728 kB gzipped**. It stays self-contained, so it still loads from a CDN next to any Mermaid build with no import map.

> **Maintainers:** `peerDependencies.mermaid` still reads `^11.0.2`. It should be raised to the major that bundles ELK as part of the release.

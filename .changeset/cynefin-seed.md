---
'mermaid': patch
---

fix: add a `cynefin.seed` config option to make Cynefin diagram rendering deterministic. The boundary waviness PRNG was previously seeded from the SVG element id, which varies per render and made visual regression tests flaky. The default value `0` preserves the existing per-id randomization; setting any non-zero number produces reproducible boundaries across renders. Resolves #7727.

---
'mermaid': patch
---

fix: add `architecture.seed` config option to make architecture diagrams render deterministically. The underlying `cytoscape-fcose` layout calls `Math.random()` internally even with `randomize: false`, so visual regression tests failed on every CI run. The renderer now temporarily seeds `Math.random` with a mulberry32 seeded generator while `fcose` runs and restores it immediately after. Default seed is `1`, making architecture layouts deterministic by default — set `architecture.seed: 0` to opt out of seeding and recover the pre-fix non-deterministic behavior. Resolves #7729.

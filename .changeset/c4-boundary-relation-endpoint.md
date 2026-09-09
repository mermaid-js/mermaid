---
'mermaid': patch
---

fix(c4): allow boundaries as relationship endpoints

A `Rel` (or `BiRel`/`Rel_*`) that referenced a boundary alias threw `references an unknown
shape`, because endpoint lookup only searched shapes and not boundaries. Boundary aliases now
resolve as relationship endpoints. Fixes #4864.

---
'mermaid': patch
---

fix: self-referential class multiplicity labels no longer rendered multiple times

Fixes #7560. Resolves an issue where cardinality labels on self-referential class relationships were rendered three times due to edge splitting in the dagre layout. The fix ensures that each sub-edge only carries its relevant label positions.

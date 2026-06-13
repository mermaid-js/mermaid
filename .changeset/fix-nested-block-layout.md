---
'mermaid': patch
---

fix: correct nested block sizing and positioning in block diagrams

Fixes nested blocks with column spans not stretching to proper width (issue #7731).

- Passes actual allocated width (gridWidth) to nested composite blocks instead of per-cell width
- Caps column spans to row boundaries consistently between setBlockSizes and layoutBlocks
- Propagates stretched height constraints to nested composite blocks

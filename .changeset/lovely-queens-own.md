---
'mermaid': patch
---

fix(block): overflowing blocks no longer affect later lines

This may change the layout of block diagrams that have overflowing lines
(i.e. block diagrams that use up more columns that the `columns` specifier).

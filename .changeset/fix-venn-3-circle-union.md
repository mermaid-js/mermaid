---
'mermaid': patch
---

fix: fix 3-circle venn diagram union rendering

Venn diagrams with three sets and a triple union (without explicit pairwise unions) now render correctly. The layout engine receives enough pairwise overlap information to place the shared intersection properly.

This resolves the issue where a single 3-set union would fail to display the central intersection area correctly.

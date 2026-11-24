---
'mermaid': patch
---

Fix state diagrams hanging or crashing with `layout: elk` when a transition inside a composite references that composite or an ancestor. Preserve the ancestor's parent instead of creating a cyclic hierarchy. Placement of references across unrelated composites is unchanged.

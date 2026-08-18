---
'mermaid': patch
---

Fix sibling blocks overlapping in block diagrams when one has a label wider than 200px

Block diagrams now measure a not-yet-sized label at its true natural width
(via a new opt-in `wrappingWidth` node field) instead of inheriting the
flowchart-specific wrap default, so the column width decided up front already
accounts for the label's real size.

---
'mermaid': minor
---

feat: layout validation tells a deliberate edge bundle apart from an ambiguous one.

Two edges sharing a handle on a node, or running the same lane for a stretch, used to be a hard violation regardless of how they got there. That is right for the case the checks were written for — an edge arriving exactly where another leaves, so the handle no longer says which way anything goes — but wrong for a fan: one trunk that splits, which a reader can follow.

Sharing is now classified. When both edges play the same role at the node they meet on, and travel the shared geometry the same way, it is reported as `edge-bundled-attachment-point` or `edge-bundled-subpath` — soft issues that cost score rather than invalidating the layout, because a bundle still hides how many edges are inside it. Mixed roles and opposing travel stay hard as `edge-shared-attachment-point` and `edge-shared-subpath`.

This makes bundled layouts measurable instead of automatically invalid. Over the ELK edge-case corpus, a layout laid out with `elk.mergeEdges: true` drops from 540 hard issues to 52, and the 44 that remain are genuine ambiguity rather than bundling. Layouts that do not bundle are unaffected.

---
'mermaid': patch
---

fix(state): draw the edge between a state and its note dashed under the `neo` look. It was rendering solid.

The dashes were expressed only as CSS — `.note-edge { stroke-dasharray: 5 }` — which is enough under `classic` but not under `neo`, where `insertEdge` writes an inline `stroke-dasharray` on every edge, computed from the path length so the arrow markers keep their gaps. An inline style outranks a stylesheet rule, so the note edge took the solid pattern and the `.note-edge` rule simply lost. The note edge now declares `pattern: 'dashed'`, which is what `insertEdge` reads to choose its dash generator. `classic` is unchanged.

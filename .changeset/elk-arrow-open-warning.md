---
'mermaid': patch
---

fix: stop ELK-laid-out diagrams logging `Unknown arrow type: arrow_open` once per edge.

ELK's arrow table put the edge _type_ `arrow_open` — which means "no arrowheads" — into the arrow-type slot, where `none` is the value that marks a deliberate absence. Anything else is reported as an unknown marker name. Diagrams whose db sets `arrowTypeStart` itself, such as flowcharts, never reached that fallback; state diagrams, which leave it unset, warned on every edge.

Rendering is unchanged: both spellings produced no start marker and the same geometry, since neither has a marker offset. Only the log noise goes away.

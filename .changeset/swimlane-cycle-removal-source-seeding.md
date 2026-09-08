---
'mermaid': patch
---

fix(swimlane): seed cycle removal from source nodes so feedback edges are reversed instead of forward flow edges. A cycle like `task --> decision --> fix --> task` no longer places `fix` in the middle of the `start --> task` flow line.

---
'mermaid': patch
---

fix(c4): keep every relationship that repeats a from/to pair

A second `Rel(a, b, ...)` between the same two elements overwrote the first
instead of adding to it, so a C4Dynamic diagram showed only the last of
several interactions between a pair. `UpdateRelStyle` now applies to each
relationship between the pair it names.

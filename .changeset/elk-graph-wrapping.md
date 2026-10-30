---
'mermaid': minor
---

feat: add `elk.wrappingStrategy` and `elk.aspectRatio`, so the ELK layout can fold a long chain into
rows instead of drawing one wide strip. `wrappingStrategy: MULTI_EDGE` turns folding on and
`aspectRatio` sets the width / height ratio to aim for. Both are unset by default, which keeps the
current layout.

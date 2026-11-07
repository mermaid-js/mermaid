---
'mermaid': minor
---

feat(c4): a boundary can say which way its elements run, with a `direction` statement (`TB`, `BT`, `LR` or `RL`) between its braces, or with `c4.boundaryDirection` for every boundary at once. The statement wins over the config key, and a diagram that uses neither lays out as before

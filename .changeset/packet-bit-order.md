---
'mermaid': minor
---

feat: add a `bitOrder` option to packet diagrams. It defaults to `ascending`, which is the current
behaviour, and `descending` mirrors every row so it reads from that row's highest bit down to its
lowest. Fields are still declared lowest bit first and keep their width, so switching a diagram
between the two conventions only means changing `bitOrder`.

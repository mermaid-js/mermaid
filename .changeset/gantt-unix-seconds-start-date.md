---
'mermaid': patch
---

fix(gantt): treat integer start dates as seconds when `dateFormat` is `X`

A task like `A :a, 10, 20` started at 10 ms instead of 10 s. End dates written as timestamps were already read as seconds.

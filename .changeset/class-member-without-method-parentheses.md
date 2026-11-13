---
'mermaid': patch
---

fix: a class member that contains a `)` but is not written as `name(...)` reports an error that says so, instead of throwing a TypeError

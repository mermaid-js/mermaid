---
'mermaid': patch
---

fix: apply a class diagram `classDef` only to classes that have that exact class, instead of every class whose classes contain its name (e.g. `classDef fault` no longer styles every class through `default`)

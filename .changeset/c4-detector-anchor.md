---
'mermaid': patch
---

fix(c4): anchor all diagram keyword alternatives in detector

Prevent keywords such as `C4Container` or `C4Component` from triggering C4 diagram detection when appearing inside node labels, comments, or strings of other diagram types.

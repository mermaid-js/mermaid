---
'mermaid': patch
---

fix: Reject quadrant chart point coordinates such as `0x1` or `0,5`, and accept a `0` followed directly by a comma, as in `[0,1]`

---
'mermaid': patch
---

fix(state): prevent `No such shape: roundedWithTitle` render errors for composite states. A transition that references a nested composite state from an outer document no longer re-parents it away from where it was declared, a transition pointing back to the enclosing composite no longer makes the state its own parent, and a composite state with an empty body is rendered as a regular state instead of an empty cluster.

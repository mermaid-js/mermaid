---
'mermaid': patch
---

fix: class diagram members that look like a method but have no name, such as `(a) B`, now report an "Invalid class member" error instead of crashing with a TypeError

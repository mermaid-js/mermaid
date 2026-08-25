---
'mermaid': patch
---

fix: group runs of whitespace into a single token in the flowchart lexer, which made parsing time grow quadratically with the length of the run

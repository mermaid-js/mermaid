---
'mermaid': minor
---

feat: add box-drawing character input support for treeView diagrams

Adds an alternative input syntax for treeView-beta diagrams using box-drawing characters (├──, └──, │). The parser auto-detects box-drawing format and converts it to the standard indent-based representation before parsing. Error messages remap line numbers back to the original input. Includes 42 unit tests and 4 AST equivalence integration tests.

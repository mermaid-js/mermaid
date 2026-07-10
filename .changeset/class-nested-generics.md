---
'mermaid': patch
---

fix(class): support nested generics such as `List~List~Person~~` in class names and shorthand definitions.

Previously the class-diagram lexer's `generic` state could not handle nested `~` delimiters, so a class defined with a nested generic type (e.g. `class People List~List~Person~~`) threw `Syntax error in text`. The lexer now tracks generic nesting depth and captures the full balanced generic type, and `splitClassNameAndType` renders nested generics correctly (e.g. `List<List<Person>>`).

Fixes #7648, #7480.

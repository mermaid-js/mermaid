---
'mermaid': minor
---

feat(er): allow ER attributes without data types

ER diagrams can now define attributes as names only, including keys and comments, and may use `_` as an explicit omitted type marker. When an entity has no typed attributes, the renderer omits the type column instead of rendering an empty column.

Closes mermaid-js/mermaid#5563

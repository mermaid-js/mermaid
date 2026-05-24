---
'mermaid': minor
---

feat: add `align row|column {ids…}` directive to architecture-beta diagrams so authors can declare horizontal or vertical alignment of services explicitly, fixing same-port sibling overlap (e.g. three databases all connecting to one node) and enabling clean grid layouts when paired with column directives.

**Note:** this introduces three new reserved keywords in architecture-beta — `align`, `row`, and `column`. Any existing diagram using one of these as an exact id (e.g. `service row(database)[Row]`) will now fail to parse and must be renamed. Identifiers that merely contain these as a prefix (e.g. `rowspan`, `columnar`) keep working via langium's longer-alt tokenizer.

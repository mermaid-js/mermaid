---
'mermaid': minor
'@mermaid-js/parser': minor
---

feat(railroad): a `standard w3c` or `standard iso` line in `railroad-ebnf-beta` reads the diagram in one notation, so `? ... ?` and the postfix `?` no longer collide and constructs from the other standard are refused with their line and column; `@mermaid-js/parser` exports `parseRailroadEbnf`, which `parse('railroadEbnf', ...)` and the diagram both use, so the same text reads the same way through either

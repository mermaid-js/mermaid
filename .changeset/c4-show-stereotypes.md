---
'mermaid': minor
---

feat(c4): add `c4.showStereotypes` to hide element and boundary stereotypes

Set `c4.showStereotypes` to false to leave out the bracketed type line under
each element name (`[Software System]`, `[Container: JavaScript]`) and the type
on a boundary label. A single element can override the diagram-wide setting with
`UpdateElementStyle(alias, $showStereotype="false")`. This is the equivalent of
C4-PlantUML's `HIDE_STEREOTYPE()`.

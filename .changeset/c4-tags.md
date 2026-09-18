---
'mermaid': minor
---

feat(c4): support AddElementTag and AddRelTag

Named styles can be defined with `AddElementTag(name, $bgColor, $fontColor,
$borderColor, $shape)` and `AddRelTag(name, $textColor, $lineColor)`, and
applied through an element's or relationship's `$tags`. An explicit
`UpdateElementStyle`/`UpdateRelStyle` still wins over a tag.

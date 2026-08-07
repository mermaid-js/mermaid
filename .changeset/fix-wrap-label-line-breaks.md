---
'mermaid': patch
---

fix: keep explicit `<br/>` line breaks in every wrapped label, not just the first one.
`hasBreaks` and `wrapLabel` tested the shared, global `lineBreakRegex`, so each match
left a `lastIndex` behind that made the next check start mid-string and miss the break.
A label that came after another label containing a break was therefore re-wrapped,
dropping the line break the diagram author had written.

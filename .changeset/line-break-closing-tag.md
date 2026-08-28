---
'mermaid': patch
---

fix: treat `</br>` as a line break in labels

`lineBreakRegex` only matched `<br>`, `<br/>` and `<br />`, so the malformed-but-common
`</br>` survived as literal text wherever labels render as plain SVG text. HTML parsers
already treat `</br>` as a `<br>`, so the tag appeared to work in HTML-label mode and
failed everywhere else. It is now accepted on both paths.

Also fixes `hasBreaks()` returning alternating results for the same input: it called
`.test()` on a global regex, which advances `lastIndex` between calls. `wrapLabel()` used
the same stateful check and could therefore re-wrap labels that already contained breaks.

---
'mermaid': patch
---

fix: report the out-of-bounds error for a numeric `linkStyle` index

`linkStyle 1` on a flowchart with one edge threw `Cannot set properties of
undefined (setting 'style')` instead of the intended message naming the valid
index range. The grammar passed the index through as the raw lexer string, so
the `typeof pos === 'number'` guard in `updateLink` never matched and the
out-of-bounds branch was unreachable.

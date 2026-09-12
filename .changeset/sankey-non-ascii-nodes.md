---
'mermaid': patch
---

fix(sankey): allow non-ASCII characters in unquoted node names

The sankey `TEXTDATA` terminal only accepted printable ASCII, so a node name with
Chinese (or other non-ASCII) characters triggered a `got 'NON_ESCAPED_TEXT'`
lexer error. It now also accepts the non-ASCII BMP range, so these node names
parse correctly. Quoted names, the `,` and `"` delimiters, and previously-valid
input are unchanged.

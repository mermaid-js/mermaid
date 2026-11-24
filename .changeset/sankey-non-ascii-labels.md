---
'mermaid': patch
---

fix(sankey): allow non-ASCII characters in labels

The `TEXTDATA` lexer rule only covered U+0020-U+007E, so any label containing a non-ASCII
character (CJK, accented Latin, Cyrillic, emoji) failed to parse: quoted it reported
`Expecting 'DQUOTE', got 'ESCAPED_TEXT'`, unquoted `got 'NON_ESCAPED_TEXT'`. Both rules that
reference the macro end in `*`, so on a non-ASCII character they matched the empty string —
emitting a token without consuming any input, which left the parser waiting for the closing
quote.

The character class now extends to U+FFFF. The added range is disjoint from the existing
ones, so `"` and `,` remain excluded and CSV parsing is unchanged. Astral-plane characters
(emoji) are covered too, since a surrogate pair falls inside the new range.

Fixes #6155.

---
'mermaid': patch
---

fix(quadrant-chart): allow CJK, emoji, Latin-1 accented characters, and other non-ASCII text in unquoted axis/quadrant/point labels.

Previously the lexer only matched ASCII `[A-Za-z]+` for text tokens, even though the grammar referenced `UNICODE_TEXT`. Bare Chinese, Japanese, Korean, emoji, and accented Latin characters in labels caused a parse error. Added a `[^\x00-\x7F]+` lexer rule to emit `UNICODE_TEXT` and included it in the `alphaNumToken` grammar rule.

Fixes #7120.

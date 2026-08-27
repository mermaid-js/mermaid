---
'mermaid': patch
---

fix(c4): stop wrapping non-text named attributes that land in a text slot

A named attribute such as `$tags` or `$sprite` can arrive in the positional
slot of a text field when the argument before it is omitted. It was then
stored as `{ text: value }` rather than a string, so `$tags` given without a
description crashed rendering.

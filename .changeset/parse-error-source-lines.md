---
'mermaid': patch
---

fix: report parse errors on the line of the source as written, counting the front matter, directives, `%%` comments and blank lines removed before parsing, in the message and in jison's `hash.line` and `hash.loc`

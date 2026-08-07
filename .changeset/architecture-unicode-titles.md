---
'@mermaid-js/parser': patch
---

fix(architecture): allow non-ASCII characters and punctuation in unquoted titles

Unquoted `architecture-beta` bracket titles (e.g. `service a(server)[采集器]`) previously
only accepted `[a-zA-Z0-9_ ]`, because the `ARCH_TITLE` terminal used `\w` without the
`u` flag. Chinese, Cyrillic, accented Latin characters and common punctuation (`-`, `+`,
`,`, `:`, `/`) therefore triggered lexer errors. The unquoted alternative now accepts any
character except square brackets and line breaks, so these titles parse correctly. Quoted
titles and previously-valid labels are unchanged.

---
'mermaid': patch
---

fix(c4): sanitize a C4 `$link` before it becomes an `xlink:href`

A `$link` was stored and rendered exactly as written, so one carrying a
`javascript:` scheme reached the anchor. It now follows a flowchart
`click ... href`: it is sanitized, which also normalises the URL
(`$link="https://example.com"` renders as `https://example.com/`), unless
`securityLevel` is `loose`, where it is kept as written.

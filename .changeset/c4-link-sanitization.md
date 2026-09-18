---
'mermaid': patch
---

fix(c4): sanitize a C4 `$link` before it becomes an `xlink:href`

A `$link` was stored and rendered exactly as written, so one carrying a
`javascript:` scheme reached the anchor. It now goes through the same
sanitizer as a flowchart `click ... href`, which also normalises the URL -
`$link="https://example.com"` renders as `https://example.com/`.

---
'mermaid': minor
---

feat(i18n): add a `locale` config option with Chinese (Simplified) support

Mermaid's own built-in text can now be rendered in a language other than English.
Set `locale: 'zh-CN'` via `mermaid.initialize` or a `%%{init: {"locale": "zh-CN"}}%%`
directive to translate the syntax error diagram. Messages missing from a locale fall
back to English.

Diagram content is unaffected — labels you write are always rendered as authored — and
errors thrown as exceptions remain in English so they stay stable and searchable.

---
'mermaid': patch
---

fix: replace `.toString()` with `String()` on `DOMPurify.sanitize()` calls to avoid `@typescript-eslint/no-base-to-string` lint errors

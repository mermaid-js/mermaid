---
'mermaid': patch
---

fix: preserve encoded newlines/carriage returns (`%0A`/`%0D`) in clickable link URLs

`sanitizeUrl` (from `@braintree/sanitize-url`) decodes a link's URL to detect obfuscated
`javascript:`/`data:`/`vbscript:` schemes, and in the process it silently deleted any
percent-encoded control characters it revealed instead of leaving them encoded. A link whose
query string or fragment intentionally contained `%0A`/`%0D` -- for example a GitHub "new
issue" URL with a multi-line `body` parameter -- lost those characters entirely at any
`securityLevel` other than `loose`.

`%0A`/`%0D` sequences in the query string or fragment are now shielded before sanitizing and
restored afterwards, so they survive unchanged. Nothing before the first `?`/`#` is touched,
so protocol/scheme detection (and blocking things like `javascript:` or `java%0Ascript:`) is
unaffected.

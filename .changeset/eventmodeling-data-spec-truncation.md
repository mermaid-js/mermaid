---
'mermaid': patch
---

fix(eventmodeling): data spec labels no longer lose their final character. The `{ … }` strip logic used `substring(0, lastIndexOf('}') - 1)`, whose exclusive end index already excludes the brace — the extra `- 1` chopped the last content character (`{item, quantity}` rendered as `item, quantit`).

---
'mermaid': patch
---

fix(sequence): allow whitespace between an actor name and its `@{ ... }` config object

`participant Bob@{ "type" : "database" }` parsed fine, but adding a single space before the
config object (`participant Bob @{ "type" : "database" }`) failed with a confusing parse error,
even though the plain form without a config object tolerates trailing whitespace just fine.

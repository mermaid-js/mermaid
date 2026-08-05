---
'@mermaid-js/parser': patch
---

fix(parser): pin langium to 4.2.1 to keep chevrotain v11 and restore Node 20 support

langium 4.2.2+ switched to chevrotain v12, which requires Node >= 22 and calls
`Object.groupBy` (a Node 21+ API) during grammar validation. Since chevrotain is
bundled into the published parser, this could throw
`TypeError: Object.groupBy is not a function` for consumers running mermaid on
Node 20, and it broke `langium generate` for contributors on Node 20.

Pinning langium to 4.2.1 (the last release on chevrotain ~11.1.1) and aligning
the parser's own `chevrotain`/`@chevrotain/types` pins on ~11.1.2 keeps a single
chevrotain version in the tree and keeps the published bundle Node 20 compatible.

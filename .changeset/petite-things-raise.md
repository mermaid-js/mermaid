---
'@mermaid-js/parser': patch
---

fix(parser): bundle langium/chevrotain

This should silence warnings about lodash-es 4.17.23, which chevrotain@11.1.1 is pinned to, but is not vulnerable to.

And this avoids warnings when langium v4 is installed on Node.JS v20.0.

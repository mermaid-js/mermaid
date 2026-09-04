---
'@mermaid-js/examples': major
'mermaid': major
'@mermaid-js/layout-elk': major
'@mermaid-js/layout-tidy-tree': major
'@mermaid-js/mermaid-zenuml': major
'@mermaid-js/parser': major
'@mermaid-js/tiny': major
---

chore!: require ES2024, Safari 17.4+, Node.JS v22.12+

Mermaid is now built to target Safari 17.4+ and ES2024. If you need to support
older browsers, you may need to polyfill or transpile mermaid.

Safari 17.4+ has been chosen as the floor, as unlike Firefox/Chrome,
older iOS devices don't get major Safari updates.

Node.JS v22.12+ is also declared as requirement in our `package.json` files,
but as mermaid requires a browser, this is mainly so we can use dependencies that
also declare a Node.JS v22.12+ requirement, without causing issues for users when
running `npm install`.

---
'@mermaid-js/parser': patch
---

fix: railroad-abnf-beta no longer lexes a rule's `;` terminator as a comment when trailing whitespace, a `;` comment or another rule follows it on the same line

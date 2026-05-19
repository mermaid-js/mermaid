---
'mermaid': patch
---

fix(frontmatter): tolerate leading horizontal whitespace before YAML frontmatter delimiters

Mermaid blocks captured with surrounding indentation (for example when extracted from indented HTML or markdown) previously failed with "Syntax error in text" because `^---` had to sit at column zero. The frontmatter regex now anchors the closing delimiter to the same indent as the opening one, and the YAML body is dedented before parsing so tab-indented blocks work too.

Closes mermaid-js/mermaid#7613

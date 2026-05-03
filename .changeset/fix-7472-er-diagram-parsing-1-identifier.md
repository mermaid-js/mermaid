---
'mermaid': patch
---

fix: ER diagram parsing when using "1" as entity identifier on right side

The parser was incorrectly tokenizing the second "1" in patterns like `a many to 1 1:` because the lookahead rule only checked for alphabetic characters after whitespace, not digits. Added a new lookahead pattern `"1"(?=\s+[0-9])` to correctly identify the cardinality alias before a numeric entity name.

Fixes #7472

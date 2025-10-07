---
'@mermaid-js/parser': patch
---

Add validation for negative values in pie charts:

Prevents crashes during parsing by validating values post-parsing.

Provides clearer, user-friendly error messages for invalid negative inputs.

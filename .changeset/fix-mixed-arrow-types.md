---
'mermaid': patch
---

fix: support mixed arrow types in flowchart edges

Fixes #1665 where multi-directional arrows with mixed types (e.g., `A o---> B` or `A x---o B`) did not render correctly.

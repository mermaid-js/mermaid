---
'mermaid': minor
---

feat(agentflow): wire up v0.6.0 input-value metadata (`value` / `example`) on input and artifact nodes (`lean-right`, `doc`, `lin-doc`). Both keys are now recognised by the §13 applicability validator and survive `getSemanticModel()` per §14.1. Closes the v0.6.0 spec gap; behaviour is purely additive — diagrams that previously carried these keys as silent unknowns continue to work.

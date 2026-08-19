---
'mermaid': minor
---

feat: add the agentflow `global … end` scope block (syntax v0.8.3). Nodes referenced inside it are globally scoped and keep no parent even when referenced inside a `flow … end` block, opting out of the textual membership rule that otherwise pulls them into the flow's container. The block takes no id/title/metadata, renders nothing itself, is order-independent, and works nested inside a flow as an escape hatch. `global` becomes a reserved word, consistent with `flow`, `connector`, and `end`.

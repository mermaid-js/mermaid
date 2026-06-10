---
'mermaid': patch
---

fix(agentflow): edge to the containing flow no longer crashes the render (#70)

An edge written inside a `flow … end` block whose endpoint is the flow's own
id (`a --> myFlow` inside `flow myFlow`) made the flow a member of its own
subgraph; `getData()` then emitted the flow with `parentId === id` and
graphlib's `setParent(id, id)` threw "would create a cycle", blanking the
diagram. The container id is now stripped from its own member list when the
subgraph is built, and the parent-map build guards against self-parents, so
the flow, its tasks, and the edge all render.

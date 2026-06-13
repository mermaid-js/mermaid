---
'mermaid': patch
---

fix(flowchart): respect per-subgraph direction keyword in Dagre layout

Subgraphs with an explicit `direction` keyword (e.g. `direction LR`) now
trigger a separate cluster sub-layout, restoring the intended visual direction
for that group. Previously the cluster-extraction predicate used
`!externalConnections`, which caused subgraphs with external edges to silently
inherit the top-level `rankdir` even when the user had specified a different
direction.

**Behavior change:**

- **Old:** A separate cluster graph was created for any subgraph that had
  children and no external connections (`!externalConnections && hasChildren`).
  Subgraphs with external edges always inherited the parent direction.
- **New:** A separate cluster graph is created only when the user has
  explicitly set a `direction` keyword on the subgraph
  (`clusterData?.explicitDir && hasChildren`). Subgraphs without an explicit
  `direction` now inherit the parent `rankdir` (previously they defaulted to
  the opposite of the parent direction).

Also normalises `direction TD` to `direction TB` inside `addSubGraph` to match
the existing top-level normalisation in `setDirection`, fixing the
"`direction TD` doesn't work inside subgraphs" complaint in #4648.

Fixes #4648
See also #6785

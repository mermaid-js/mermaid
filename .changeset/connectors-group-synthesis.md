---
'mermaid': minor
---

feat(agentflow): synthesize `agentflow-connectors-group` when `connectors@{ view: ... }` is set without a user-declared `subgraph connectors`. Gives the agentflow-editor a stable id for expanding/collapsing the connectors group, parallel to `agentflow-types-group` and `agentflow-templates-group`. Default behavior is unchanged for diagrams without the opt-in metadata.

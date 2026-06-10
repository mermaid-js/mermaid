---
'mermaid': minor
---

refactor(agentflow): remove legacy `prompt` metadata vocabulary (#66)

`prompt` is not an agentflow metadata key — the canonical key is `instruction`
(renamed in v0.8.1). Since #64 the parser carries `prompt` as-is with no
behavior, leaving `METADATA_KEY_LEGACY_PROMPT` as dead vocabulary.

- Remove the unused `METADATA_KEY_LEGACY_PROMPT` id from the agentflow
  diagnostic vocabulary (`AgentflowWarning`). Nothing emitted it; downstream
  tooling importing the id must drop the reference.
- An authored `prompt` remains inert passthrough: preserved as raw metadata
  like any unknown key, never aliased to `instruction`, and surfaced by the
  semantics module as `METADATA_UNKNOWN_KEY`.
- Spec (`AGENTFLOW-SYNTAX.md` §10.1) now states this explicitly.

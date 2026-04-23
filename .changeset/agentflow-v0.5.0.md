---
'mermaid': minor
---

feat(agentflow): v0.5.0 — semantic tightening per downstream-readiness review

Wave 1 of the agentflow readiness plan. Spec text + non-breaking validators that warn on patterns that will become errors in later waves. Existing diagrams continue to render unchanged.

- Spec v0.5.0 with `tool` (§8) / `connector` (§9) reservations, §13 metadata applicability, §14 presentation-only controls, conformance appendix (#15).
- Shared frontmatter line-offset infrastructure ported from the alana branch (#16) and JISON comment-handling fix mirrored into `agentflow.jison` (#17).
- Element-mapping layer with source positions on vertices, edges, subgraphs, types, and templates (#19).
- Structured diagnostic layer (`AgentflowWarning` enum, `AgentflowDiagnostic` interface, `getDiagnostics()`) (#20).
- `HEXAGON_MULTI_BRANCH` warning when a hexagon has multiple branch-labelled outgoing edges (use `diamond` for branching) (#21).
- `getSemanticModel()` projection that strips presentation-only controls (`view`, `class`/`style`, `icon`, `img`, `w`, `h`, element mappings) so downstream consumers get a stable semantic view (#22).
- Conformance suite scaffolding (#23) and wave-1 fixture corpus covering every §19 Semantic Pattern that parses under today's grammar plus the §20 Complete Example (#24).
- Cross-diagram coverage entries so agentflow participates in the per-diagram example and ID-uniqueness assertions (#25).
- Pre-existing CI fixes unblocking the wave-1 release (#26).

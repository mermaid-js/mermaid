---
'mermaid': minor
---

feat(agentflow): v0.6.0 — shape-based tool model + instance resolution + wave-2 conformance fixtures

Wave 2 of the agentflow readiness plan. Fully additive — existing v0.5.0 diagrams continue to parse, render, and produce the same `getSemanticModel()` output. New validators emit warnings (warn-only in v0.6.0; promoted to errors in v1.0).

- First-class `edgeSemantic` field populated on every edge whose operator appears in the §5.1 mapping table (`control` / `data` / `conformance` / `delegation` / `failure` / `association` / `governance` / `bidirectional`) (#31).
- Spec pushback: tools stay shape-based (`@{ shape: subroutine }`) and connectors stay metadata-based (`@{ connectorRef: "<id>" }`) — no new keywords. Documented the conditions under which a future `connector` keyword would be justified (§9.5) (#34).
- Shape-based tool model formalised: `isToolDefinition()` / `getTools()` accessors, `vertexKind: 'tool'` surfaced on `SemanticVertex`, and `INSTANCE_KIND_MISMATCH` validator on `win-pane` → tool (#35).
- Connector reference validator: `CONNECTOR_REF_UNRESOLVED` when a bare-id `connectorRef` matches no node; `CONNECTOR_REF_NOT_A_CONNECTOR` when the target lacks the §9.2 connector configuration fields; dotted (`"github.create_issue"`) and URL-like values treated as opaque (#36).
- Full `resolveInstances()` pass per §11: `INSTANCE_KIND_MISMATCH` extended to cover all five shape→kind pairs (`tag-rect` → agent, `delay` → flow, `lin-rect` → skill, `win-pane` → tool, `curv-trap` → directive), `INSTANCE_DEF_MISSING` when `def` is absent or unresolved, `INSTANCE_DEF_CYCLE` for self-loops and multi-hop cycles, and `SemanticVertex.resolvedMetadata` exposing the §11.3 domain-metadata merge (local overrides inherited; shape / view / icon / img / w / h / class / style / def do not inherit; structure is not cloned) (#37).
- Wave-2 conformance fixtures: `pattern-tool-call`, `pattern-directive`, `pattern-connector`, `pattern-connector-ref-unresolved`, `pattern-connector-ref-not-a-connector`, `pattern-connector-dotted-form`, `pattern-instance-tool`, `pattern-instance-mismatch-warn`, plus one `edge-semantics-*` fixture per §5.1 operator. Runner extended with `semanticAssertions` for `vertexKind`, `resolvedMetadata` subset, and `edgeSemantic` per edge (#38).

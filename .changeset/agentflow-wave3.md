---
'mermaid': minor
---

feat(agentflow): wave-3 readiness validators — metadata applicability, identifier resolution, reference kinds, containment, edge-semantic contradictions, capability evaluation, container edge boundary

Wave 3 of the agentflow readiness plan. Fully additive — existing diagrams continue to parse, render, and produce the same `getSemanticModel()` output. Every new validator emits warnings only; the future v1.0 strict-flip release promotes them to errors.

- Metadata applicability validator (§13): `METADATA_KEY_MISAPPLIED` fires when a known domain key appears on an element it isn't declared for. `description` and structural/presentation controls are universal and never warn (#41).
- Identifier resolution + three namespaces (§10): `DUPLICATE_ID_NODE`, `DUPLICATE_ID_TYPE`, `DUPLICATE_ID_TEMPLATE` on collision; `RESERVED_SYNTHETIC_ID` when authors declare `typesGroup` / `templatesGroup`; new `resolveReferences()` pass emits `REFERENCE_UNRESOLVED` for `typeRef` and `templateRef` misses (#42).
- Reference-kind separation (§10.2): `REF_KIND_CONFLICT` when a `procs` node carries two or more of `typeRef` / `templateRef` / `src`; legacy `type` trichotomy emits `REF_KIND_LEGACY_DEPRECATED` plus `REF_KIND_LEGACY_AMBIGUOUS` or `REF_KIND_LEGACY_UNRESOLVED` as appropriate. `templatesGroup` auto-emission verified (#43).
- Containment matrix validator (§3.3): `CONTAINMENT_VIOLATION` when a child's kind is outside the parent's allowed set. Legacy `subgraph` / `group` remain unrestricted escape hatches (#44).
- Edge-semantic contradictions (§5.1): `EDGE_SEMANTIC_CONTRADICTION` for `-->>` (delegation) / `--x` (failure) with a non-agent source, and for `--o` (conformance) with a non-reference target (#45).
- Capability evaluation + executing-agent rule (§12): `CAPABILITY_MISSING` when `requires ⊄ permits`, `CAPABILITY_DENIED` when `requires ∩ deny ≠ ∅`, `CAPABILITY_INVOCATION_NO_AGENT` when an invocation site has no enclosing agent, `CAPABILITY_LIST_LEGACY_STRING` for comma-separated string forms. Delegation does NOT transfer capabilities (#46).
- Container edge boundary (§5.5): `CONTAINER_EDGE_NO_CONTRACT` for `==>` into a container without `params` (incoming) or `returns` (outgoing); `CONTAINER_EDGE_LABEL_REQUIRED` for multi-param containers with no label; `CONTAINER_EDGE_LABEL_UNRESOLVED` when a label doesn't match any declared param. Precedence edges (`-->`) are always valid at container boundaries (#47).
- Wave-3 conformance fixtures: 19 new fixture pairs — one per new diagnostic plus one integrated clean example (#48).

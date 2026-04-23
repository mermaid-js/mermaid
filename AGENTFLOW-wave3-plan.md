# Agentflow Readiness — Wave 3 Implementation Plan

**Agentflow syntax version:** 0.5.0 (unchanged — wave 3 adds no surface syntax)
**Mermaid package version:** minor bump at release time
**Integration branch:** `feature/agentflow-readiness-v0.5.0` (same branch wave 1 and wave 2 landed on — no new integration branch)
**Final merge target:** `agentflow`
**Status:** Draft — awaiting approval

---

## Scope

Wave 3 closes out the remaining open agentflow readiness issues by shipping the validators, config gates, and spec sections their Acceptance blocks call for. **Every validator is additive.** Config flags are introduced alongside new error-severity behaviour so authors can opt in to strict mode without a default flip — the defaults stay warn-safe so existing diagrams continue to render unchanged.

**The "v1.0.0 strict flip" called out in `AGENTFLOW-readiness-actions.md` §Wave 3 is deferred out of this plan.** That release — whenever it happens — is a single-PR default flip that lives on top of this work. Wave 3 produces everything that release needs to flip; it does not perform the flip itself.

| Action | Title                                             | Tracking issue                                              |
| ------ | ------------------------------------------------- | ----------------------------------------------------------- |
| 10     | Metadata applicability table + validator          | [#11](https://github.com/Mermaid-Chart/agentflow/issues/11) |
| 1      | Identifier resolution + three namespaces          | [#2](https://github.com/Mermaid-Chart/agentflow/issues/2)   |
| 9      | `typeRef` / `templateRef` / `src` reference kinds | [#10](https://github.com/Mermaid-Chart/agentflow/issues/10) |
| 2      | Strict portion of edge semantics                  | [#3](https://github.com/Mermaid-Chart/agentflow/issues/3)   |
| 6      | Container edge boundary semantics                 | [#7](https://github.com/Mermaid-Chart/agentflow/issues/7)   |
| 7      | Containment matrix enforcement                    | [#8](https://github.com/Mermaid-Chart/agentflow/issues/8)   |
| 8      | Capability evaluation + executing-agent rule      | [#9](https://github.com/Mermaid-Chart/agentflow/issues/9)   |

All seven issues close when their handling PR merges (per agreed closure policy: PR merge = issue close).

---

## Ground rules

- **Agentflow syntax version stays at 0.5.0.** The `AGENTFLOW-SYNTAX.md` header is not bumped. Wave 3 adds no keywords, no shapes, no edge operators. It adds validators, metadata-applicability normative text, and config flags.
- **All new error-severity behaviour is gated behind config flags**, each defaulting to the permissive setting so existing diagrams see warnings, not errors. Flags land in this wave; default flips are future work.
- **Per-PR issue closure.** Each PR scoped to one issue, closes that issue on merge. No PR closes more than one issue.
- **Fan-out workflow.** Each PR branches off the integration tip and targets `feature/agentflow-readiness-v0.5.0`.

---

## Dependency graph

```
A (#11 metadata applicability)
 ├─ D (#3 edge contradiction)
 └─ E (#7 container edge)

F (#8 containment)
 └─ G (#9 capability)

B (#2 identifier resolution)          — standalone
C (#10 reference kinds)               — standalone
```

A/B/C are independent and can land in parallel. D follows A. E follows A and D. F is standalone; G follows F. H (fixtures) and I (changeset) land last.

---

## Branching and workflow

Fan-out off the integration tip; draft PR targets `feature/agentflow-readiness-v0.5.0`.

```bash
cd /home/knsv/repos/agentflow-wt/wave1
git fetch agentflow
git checkout feature/agentflow-readiness-v0.5.0
git pull --ff-only agentflow feature/agentflow-readiness-v0.5.0
git checkout -b <branch-per-issue>            # e.g. feature/11_metadata-applicability
# ... edit, commit, push ...
gh pr create --draft --base feature/agentflow-readiness-v0.5.0 --head <branch-per-issue>
```

Branch naming: `[feature|bug|chore|docs]/<issue#>_<short-description>`.

`cypress/platform/knsv2.html` may have local dev-server tweaks — never commit them.

---

## PR decomposition

### PR A — Metadata applicability validator (closes #11)

- **Branch:** `feature/11_metadata-applicability`
- **Scope.** Publishes the metadata applicability table from the issue as normative spec text; adds a validator that emits `METADATA_KEY_MISAPPLIED` on warning severity when a known domain key appears on an element it isn't declared for. Unknown keys pass through with no warning per the spec's "unknown keys preserved" rule.
- **Config.** `agentflow.strictMetadataApplicability` flag — default `false` (warn). Under `true`, misapplied keys become errors.
- **Spec.** Add a _Metadata Applicability_ section in `AGENTFLOW-SYNTAX.md`. `description` is explicitly cross-cutting (valid on every authored element) and is listed in §13.1.
- **DB.**
  - New module-level constant: applicability table keyed by element kind (`agent`, `flow`, `task`, `skill`, `tool`, `directive`, `testCase`, artifact node, reference node).
  - Post-parse validator `validateMetadataApplicability()` iterates vertices and subgraphs, classifies kind (using `isToolDefinition()` for the `tool` row), and checks each metadata key against the allowed set for that kind.
  - Diagnostic ID: `METADATA_KEY_MISAPPLIED` (severity respects flag).
- **Tests (≥ 20).** Per-row valid placement (9 rows × 1), ≥ 5 invalid-placement cases, unknown-key preservation, `description` accepted on agent / flow / task / tool / directive / artifact, flag-gated severity switch.

### PR B — Identifier resolution + three namespaces (closes #2)

- **Branch:** `feature/2_identifier-resolution`
- **Scope.** Formalises the three namespaces (node-or-container, type, template). Tracks seen IDs per namespace as they're registered, emits `DUPLICATE_ID` on collision. Adds `resolveReferences()` pass that resolves `def`, `typeRef`, `templateRef` against their namespaces and emits `REFERENCE_UNRESOLVED` on miss. `src` and `click`/`href` remain hygiene-only (shape-checked, never existence-checked).
- **Config.** `agentflow.strictIds` flag — default `false` (warn on collisions and unresolved semantic refs). Under `true`, both become errors.
- **Spec.** Add an _Identifier Resolution_ section. Reserve synthetic IDs (`typesGroup`, `templatesGroup`, auto-numbered subgraphs).
- **DB.**
  - Maintain per-namespace `Set<string>` for seen IDs. Populate in `addVertex`, `addSubGraph`, `addTypeDeclaration`, `addTemplateDeclaration`.
  - Collision emits `DUPLICATE_ID` with namespace context (`DUPLICATE_ID_NODE`, `DUPLICATE_ID_TYPE`, `DUPLICATE_ID_TEMPLATE` — three IDs, one severity each).
  - `resolveReferences()` runs from `runPostParseValidators()` after `resolveInstances()`. For each `typeRef` / `templateRef`, resolve against the right namespace; miss → `REFERENCE_UNRESOLVED`.
- **Tests (≥ 10).** Duplicate vertex, duplicate container, same-name type + template (valid — different namespaces), type–type collision, template–template collision, reserved synthetic ID, forward reference across nested containers, unresolved `def` (already validated by wave-2 `INSTANCE_DEF_MISSING` — assert the two diagnostics don't double-fire), unresolved `typeRef`, `src` missing-but-legal (no error).

### PR C — Reference-kind separation (closes #10)

- **Branch:** `feature/10_reference-kinds`
- **Scope.** Mutual exclusion of `typeRef` / `templateRef` / `src` on a single reference node. Implements the legacy `type` trichotomy per the spec: single-namespace match → accept + deprecation warning; ambiguous → error; unresolved → error. Formalises `templatesGroup` emission whenever templates exist.
- **Spec.** §6 / §7 / §9 tightening. Deprecation note on legacy `type` on reference nodes.
- **DB.**
  - At metadata-attach time on `procs` (reference) nodes, validate that at most one of `typeRef` / `templateRef` / `src` is present. Emit `REF_KIND_CONFLICT` on multiple.
  - Legacy `type` resolver: look up in type namespace, then template namespace. Emit `REF_KIND_LEGACY_DEPRECATED` (warning) on single match; `REF_KIND_AMBIGUOUS` (error) on both-match; `REF_KIND_UNRESOLVED` (error) on neither.
  - Auto-emit `templatesGroup` synthetic subgraph when template declarations exist (mirrors existing `typesGroup` emission).
- **Tests (≥ 15).** Each ref kind resolves to correct group; mutual exclusion enforced; legacy `type` single-match with warning; legacy `type` ambiguous errors; `templatesGroup` emitted when templates exist; `templatesGroup` absent when no templates; `src` non-existence is not a semantic error; mutual exclusion across every two-way combination (3 pairs); mixed legacy-`type` + modern `typeRef` on same node (accept modern, warn on legacy).

### PR D — Edge-semantic contradiction validator (closes #3 strict)

- **Branch:** `feature/3_edge-semantic-contradictions`
- **Depends on:** PR A (uses metadata applicability for endpoint kind resolution).
- **Scope.** Adds the "edge semantic contradicts endpoint kinds" validator per §5.1's migration note. Examples: `==>` (data) into a node whose metadata declares no data contract; `-->>` (delegation) where source is not an agent; `--o` (conformance) with no `typeRef` / `templateRef` on target. Emit `EDGE_SEMANTIC_CONTRADICTION` (severity follows flag).
- **Config.** `agentflow.legacyEdgeSemantics` flag — default `true` (contradictions warn). Under `false`, they error.
- **Spec.** Tighten §5.1 migration note with the specific contradiction cases.
- **DB.** New `validateEdgeEndpointKinds()` run from `runPostParseValidators()`. For each edge with `edgeSemantic` populated, classify start and end kinds and check the pair against the allowed set per semantic.
- **Tests (≥ 20).** One per operator's happy path (8), endpoint-kind combinations (delegation from non-agent, data into no-contract target, conformance with no ref target, failure from agent to non-agent), flag-gated severity switch, legacy round-trip (a wave-1 diagram still resolves cleanly under default).

### PR E — Container edge boundary validator (closes #7)

- **Branch:** `feature/7_container-edge-boundary`
- **Depends on:** PR A, PR D.
- **Scope.** Validates the §5.5 rules. Incoming `-->` to container → entry boundary (always valid). Incoming `==>` must bind to a declared `params`; label required if multiple params, must match one of them exactly. Outgoing `==>` originates from the container's `returns`. Emit `CONTAINER_EDGE_NO_CONTRACT`, `CONTAINER_EDGE_LABEL_UNRESOLVED`, `CONTAINER_EDGE_LABEL_REQUIRED`.
- **Config.** Respects `agentflow.legacyEdgeSemantics` (PR D's flag). Under `false`, all three become errors.
- **Spec.** No change (§5.5 already present).
- **DB.** New `validateContainerEdges()` — for each edge whose start or end is a subgraph ID, classify semantic and cross-check the container's `params` / `returns` metadata (populated in PR A's table).
- **Tests (≥ 15).** Valid entry, valid exit, data edge matching single param (implicit + explicit label), multi-param with correct label, multi-param missing label, multi-param with unknown label, data edge into container with no `params`, outgoing data edge from container with no `returns`, flag-gated severity, precedence edge is always valid regardless of contract.

### PR F — Containment matrix validator (closes #8)

- **Branch:** `feature/8_containment-matrix`
- **Scope.** Publishes §3.3's containment matrix as a module-level constant and enforces it on every parent → child relationship. Legacy untyped `subgraph` is unrestricted (explicit escape hatch). Emit `CONTAINMENT_VIOLATION` with parent/child kinds in the message.
- **Config.** `agentflow.strictContainment` flag — default `false` (warn). Under `true`, violations error.
- **Spec.** No change (§3.3 already published).
- **DB.** New `validateContainment()` walks subgraphs, classifies each child (via `FlowSubGraph.type` or for vertices by `isToolDefinition()` / artifact shape / plain), and checks the parent kind's allowed-children set.
- **Tests (≥ 20).** One per allowed pair in the matrix (7 rows), representative forbidden pairs (≥ 10), legacy `subgraph` grandfathered (any child allowed), nested structural containment (grandparent matrix), flag-gated severity.

### PR G — Capability evaluation (closes #9)

- **Branch:** `feature/9_capability-evaluation`
- **Depends on:** PR F (needs containment to resolve executing-agent).
- **Scope.** Metadata-merge normalises comma-separated `permits`/`requires`/`deny`/`fallbacks`/`directives` strings to YAML arrays, emitting `CAPABILITY_LIST_LEGACY_STRING` deprecation warning. Post-parse pass enumerates invocation sites (edges into tool IDs, `win-pane` instances whose def chain resolves to a tool per wave 2's `resolvedMetadata`), finds the executing agent (nearest enclosing `agent` container), and validates `requires ⊆ permits ∧ requires ∩ deny = ∅`. Invocation with no enclosing agent → `CAPABILITY_INVOCATION_NO_AGENT`. Missing cap → `CAPABILITY_MISSING`. Denied cap → `CAPABILITY_DENIED`. Delegation (via `-->>`) does not transfer capabilities.
- **Config.** `agentflow.strictCapability` flag — default `false` (warn). Under `true`, violations error; string-form lists become errors too (per the "removed in wave 3" language).
- **Spec.** §12 already published; confirm it's still accurate after implementation.
- **DB.** New `validateCapabilities()`. Depends on the parent lookup helper from PR F for executing-agent resolution.
- **Tests (≥ 25).** Array round-trip; string normalisation + deprecation warning; missing capability error; denied capability error; invocation with no enclosing agent; delegation with larger/smaller permit set (permits do not transfer); multi-hop delegation; capability declared on definition but not on invocation site (definitions are not invocation sites — no error); win-pane instance inherits target's `requires` per wave-2 `resolvedMetadata`; flag-gated severity.

### PR H — Wave-3 conformance fixtures

- **Branch:** `feature/wave3-fixtures`
- **Depends on:** A through G.
- **Scope.** One conformance fixture per new diagnostic ID, plus one integrated `strict-mode-all-on` fixture that sets all flags to strict and renders a small diagram that conforms.
- **Runner.** No changes needed beyond what wave-2 PR 5 already landed. `semanticAssertions` supports the assertions needed; flag-gated diagnostics use the existing per-fixture `outcome` classification.
- **Tests.** Discovered automatically by `conformance.spec.ts`. Count: ≥ 14 new fixture pairs (one per new diagnostic ID, plus the integrated fixture).

### PR I — Wave-3 changeset

- **Branch:** `chore/wave3-changeset`
- **Depends on:** A through H merged.
- **Scope.** Single `.changeset/agentflow-wave3.md`, `mermaid` minor bump, body links every wave-3 PR. Agentflow syntax version is NOT bumped in the spec.

---

## Verification per PR

Every PR runs:

- `pnpm --filter mermaid test` — unit tests pass.
- `pnpm lint` — lint and prettier pass.
- `pnpm --filter mermaid build` — type-check passes.
- Wave-1 and wave-2 conformance fixtures continue to pass (post-parse validators are additive by construction; the new severities are flag-gated).

Additionally:

- **PRs A, D, E** — render a wave-1 fixture with flags at default settings and confirm the SVG and diagnostics are identical to the wave-1 baseline. The new validators must not surface any false positives on pre-existing examples.
- **PR F, G** — same check, focused on the permissive-default setting.

---

## Out of wave 3

- **v1.0.0 strict-flip release.** The `mermaid` major bump and the default flip of every flag introduced in this wave. A follow-up one-PR release that simply edits the defaults and bumps the changeset to major. Wave 3 leaves this release fully prepared; it does not perform it.
- **`src` import resolution.** Per `AGENTFLOW-readiness-actions.md` §Out of scope, external resolution of `src` references requires a separate proposal. `src` remains hygiene-only in wave 3.
- **Langium port of `agentflow.jison`.** Long-term direction, not needed to close any open issue.
- **Agentflow syntax surface changes.** No new keywords, shapes, or operators in wave 3.

---

## Open questions

1. **Default severity for reference-kind cases in PR C.** Mutual-exclusion and ambiguous legacy `type` are called out as hard errors in the issue's resolution rules. Should they be error-severity regardless of a config flag, or behind `strictIds` alongside identifier collisions? My default: errors regardless (the rules resolve the diagram, and silencing them with a flag makes the semantic model meaningless). Confirm on PR C review.
2. **Edge-semantic contradiction flag default.** `legacyEdgeSemantics` default `true` (warn) in wave 3, `false` (error) in the future v1.0.0 release. Confirmed in this plan; re-raise if any downstream tooling needs the strict interpretation earlier.
3. **PR ordering under fan-out.** A, B, C can land in parallel. Do we want to open all three as drafts at once, or serialise for review load? My default: open all three drafts simultaneously; merge in whatever order reviewers clear them.

Resolved:

- _Wave-3 target version._ Agentflow syntax stays at 0.5.0. Mermaid package gets a minor bump (validators are additive). v1.0.0 major bump deferred out of scope.
- _Integration branch._ Same `feature/agentflow-readiness-v0.5.0` branch used by waves 1 + 2.
- _Issue closure._ Per-PR — each handling PR closes exactly one issue on merge.
- _Default flips._ Out of scope. Flags ship with permissive defaults; flip happens at the v1.0.0 release, not here.

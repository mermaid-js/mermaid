# Agentflow Readiness — Wave 2 Implementation Plan

**Target version:** Agentflow 0.6.0
**Integration branch:** `feature/agentflow-readiness-v0.5.0` (wave-1 and wave-2 PRs accumulate on the same integration branch; the bump from 0.5.0 → 0.6.0 happens at release time)
**Final merge target:** `agentflow` (the integration branch fast-forwards once both waves are ready)
**Status:** Approved — execution plan for wave 2

**Scope.** Wave 2 ships **additive validators only — no new keywords, no new shapes**:

| Action | Title                                                        | Tracking issue                                                                                        | Milestone |
| ------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------- |
| 4      | Definition / instance binding + validation                   | [#5](https://github.com/Mermaid-Chart/agentflow/issues/5)                                             | 0.6.0     |
| 5      | Shape-based tool definition model + validators               | [#6](https://github.com/Mermaid-Chart/agentflow/issues/6)                                             | 0.6.0     |
| —      | Connector metadata bindings + (optional) reference validator | [#14](https://github.com/Mermaid-Chart/agentflow/issues/14)                                           | 0.6.0     |
| 2      | Conformance fixtures asserting the canonical edge semantics  | (part of [#13](https://github.com/Mermaid-Chart/agentflow/issues/13) follow-up; tracked in this plan) | 0.6.0     |

All four pieces are **fully additive**. Existing v0.5.0 diagrams continue to parse, render, and produce the same `getSemanticModel()` output.

**Pushback recorded — twice.** Earlier revisions of this plan introduced both a first-class `tool` keyword (revision 5 of `AGENTFLOW-readiness-actions.md`) and a first-class `connector` keyword (revision 6). Both were withdrawn:

- **Tools** stay shape-based (`@{ shape: subroutine }`). The language already expresses tools through this shape and `win-pane`; a keyword would create a second representation.
- **Connectors** stay metadata-based (`@{ connector: "<id>" }`), optionally grouped using existing `subgraph` constructs. The "this tool talks to X" relationship is metadata, not syntax. A future `connector` keyword would only be justified if connectors are promoted into a distinct first-class category — see `AGENTFLOW-SYNTAX.md` §9.4 for the conditions.

Net effect on the wave-2 plan: there is no keyword PR. PR 1 ships shape-based tool validators; PR 2 ships an optional connector-reference validator that warns when `@{ connector: "<id>" }` references a node that doesn't exist in the diagram.

---

## Branching and worktree workflow

**One integration branch, one worktree.** Per the "don't make it complicated" steer from the wave-1/wave-2 transition: wave-2 PRs target `feature/agentflow-readiness-v0.5.0` directly. The branch covers both waves; the version bump from 0.5.0 → 0.6.0 is a labelling decision applied at release time. The existing worktree at `../agentflow-wt/wave1` is the wave-2 worktree too.

**For each new PR:** fan-out from the integration tip, draft PR targeting the integration branch.

```bash
cd /home/knsv/repos/agentflow-wt/wave1
git fetch agentflow
git checkout feature/agentflow-readiness-v0.5.0
git pull --ff-only agentflow feature/agentflow-readiness-v0.5.0
git checkout -b <branch-per-issue>            # e.g. feature/6_tool-validators
# ... edit, commit, push ...
gh pr create --draft --base feature/agentflow-readiness-v0.5.0 --head <branch-per-issue>
```

### Conventions

- Branch names: `[feature|bug|chore|docs]/<issue#>_<short-description>`.
- All PRs draft, linked to issue with `Resolves #<n>`.
- `cypress/platform/knsv2.html` may have local dev-server tweaks — never commit them.
- Wave-1 lessons applied: fan-out beats stacking; `pnpm changeset` runs in the final PR.

---

## PR decomposition

Wave 2 lands as five PRs (plus the optional spec-doc PR 6 and the changeset PR 7). PR 0 already shipped during early planning. PR 1 ships shape-based tool validators; PR 2 ships a connector reference validator (no keyword); PR 4 is the heaviest behavioural change. PR 3 was withdrawn along with the connector keyword.

### PR 0 — `edgeSemantic` field on every edge ✅ shipped

- Branch: `feature/edge-semantic-field`.
- Status: **merged** as PR [#31](https://github.com/Mermaid-Chart/agentflow/pull/31).
- Closed the gap between spec text and code: `destructLink()` now populates `edgeSemantic` per `AGENTFLOW-SYNTAX.md` §5.1 for every edge whose operator appears in the table; off-table operators leave the field `undefined`.
- The `agentflow.legacyEdgeSemantics` config flag was deferred to wave 3 (yagni — nothing keys off it yet).

### PR 1 — Shape-based tool model + validators (closes #6)

- Branch: `feature/6_tool-validators`
- Base: `feature/agentflow-readiness-v0.5.0`.
- Implements the shape-based model formalised in `AGENTFLOW-SYNTAX.md` §8 and `AGENTFLOW-readiness-actions.md` §5.
- Changes:
  - `agentflowDb.ts` — new derived accessor `getTools()` (or `isToolDefinition(vertex)`) that returns vertices whose resolved shape is `subroutine` (canonical name + accepted aliases `subprocess`, `subproc`, `framed-rectangle`). This is a derived view; no new vertex-kind tag.
  - `getSemanticModel()` — surface a derived `vertexKind: 'tool'` (or equivalent flag) on tool definitions in the semantic export so downstream consumers don't have to recompute the shape→kind mapping.
  - `agentflowDb.ts` — extend the post-parse validator chain (introduced in wave-1 PR 2c) with `validateInstanceTargets()`: every `win-pane` instance's `def` MUST resolve to a node that is a tool definition. Non-tool target → `INSTANCE_KIND_MISMATCH` diagnostic. (This is half of action 4, scoped to the `win-pane → tool` pair; the rest of action 4 lands in PR 4.)
  - `diagnostics.ts` — reserve the warning IDs needed by PR 4 + this PR (`INSTANCE_KIND_MISMATCH` lands here so the validator in this PR has somewhere to emit).
  - **No grammar changes**, no new keyword, no deprecation warning on `shape: subroutine`. Authors who already use the canonical form need no migration.
- Tests: ≥ 12 cases — `shape: subroutine` recognised as a tool definition; each alias (`subprocess`, `subproc`, `framed-rectangle`) recognised; `win-pane` whose `def` points at a tool resolves cleanly; `win-pane` whose `def` points at a non-tool emits `INSTANCE_KIND_MISMATCH`; `getSemanticModel()` surfaces the derived tool kind; capability validation does NOT fire on a bare tool definition with no incoming edges (negative assertion); a tool nested inside agent/flow/task/skill/directive exercises the containment matrix.

### PR 2 — Connector reference validator (closes #14)

- Branch: `feature/14_connector-reference-validator`
- Base: `feature/agentflow-readiness-v0.5.0` (independent of PR 1; safe to open in parallel).
- **No grammar change, no new keyword.** Per `AGENTFLOW-SYNTAX.md` §9 (revision 6), connectors are metadata bindings; this PR adds the optional reference-resolution validator on top.
- Changes:
  - `agentflowDb.ts` — extend the post-parse validator chain with `validateConnectorReferences()`. For every node tagged `@{ connector: "<id>" }`:
    - If the value is a bare id (`"github_mcp"`), resolve it against the diagram's nodes. If unresolved AND the value also doesn't look like a dotted-operation form (`"github.create_issue"`) or URL-ish, emit `CONNECTOR_REF_UNRESOLVED`.
    - The dotted form (`"<connector>.<operation>"`) is treated as opaque — downstream tooling parses it; the validator does not require the bare connector id to exist as a node either, since the convention is downstream-defined.
    - Behaviour intentionally permissive in v0.6.0; the validator is a guard against typos in the bare-id case, not strict enforcement. The strict-flip lands in wave 3 only if `connector` graduates to a first-class category per §9.4.
  - `diagnostics.ts` — new `CONNECTOR_REF_UNRESOLVED` warning ID. Warn-only.
  - Tests: ≥ 8 cases — bare-id binding to an existing node (no warning), bare-id binding to a missing node (warn), dotted-operation form (no warning regardless of resolution), URL-ish value (no warning), connector node grouped in `subgraph connectors` resolves cleanly, dangling connector node with no bindings (no warning — connector nodes are valid standalone).

### PR 3 — _withdrawn_

PR 3 originally proposed `validateConnectorBindings()` as a strict-resolution validator that depended on the now-withdrawn `connector` keyword. Its lighter-weight successor is folded into PR 2. The PR 3 slot is left blank rather than renumbered to keep cross-references stable.

### PR 4 — Definition / instance resolution (closes #5)

- Branch: `feature/5_instance-binding`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PR 1 merges so the `INSTANCE_KIND_MISMATCH` ID and the tool-recognition helpers exist).
- Implements the rest of Action 4 — the full `resolveInstances()` pass.
- Changes:
  - `agentflowDb.ts` — new `resolveInstances()` private method called from the post-parse validator chain. Steps per Action 4:
    1. For every vertex with an instance shape (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`), look up its `def`.
    2. Validate presence (`INSTANCE_DEF_MISSING`), kind (extends the `INSTANCE_KIND_MISMATCH` validator from PR 1 to cover all five shape→kind pairs), acyclicity (`INSTANCE_DEF_CYCLE`).
    3. Merge the definition's domain metadata with local-overrides-inherited.
    4. Do not clone definition structure into the instance site.
  - The §11 instance→definition map is the source of truth for the kind validation:
    - `tag-rect` → `agent` container
    - `delay` → `flow` container
    - `lin-rect` → `skill` container
    - `win-pane` → tool definition (already wired in PR 1)
    - `curv-trap` → `directive` container
  - Inheritance is **domain metadata only** — `shape`, `view`, `icon`, `img`, `w`, `h`, style fields are excluded (the `SEMANTIC_METADATA_SKIP_KEYS` set from wave-1 PR 3 is the right filter).
  - `diagnostics.ts` — two more warning IDs land: `INSTANCE_DEF_MISSING`, `INSTANCE_DEF_CYCLE`. All instance warnings are warn-only in v0.6.0, error in v1.0.
  - `getSemanticModel()` — instances expose their resolved metadata (post-merge) in the semantic export.
  - Tests: ≥ 50 cases per Action 4 — five shapes × valid/missing/mismatch/cycle/inheritance-precedence combos, structural-non-cloning confirmation, style-non-leak confirmation.

### PR 5 — Conformance fixtures: wave-2 behaviours

- Branch: `feature/wave2-fixtures`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PRs 1, 2, 4 all merge).
- Changes (in `packages/mermaid/src/diagrams/agentflow/conformance/fixtures/`):
  - **§19.1 Tool Call** — already covered in wave-1 corpus. Verify it asserts the derived `vertexKind: 'tool'` from PR 1.
  - **§19.5 Directive** — verify present in wave-1 corpus; if not, add.
  - **§19.8 Connector** — uses the metadata-based connector form (subgraph + binding metadata). Asserts `CONNECTOR_REF_UNRESOLVED` does **not** fire on a valid binding.
  - **`pattern-connector-ref-unresolved`** — tool with `@{ connector: "missing_node" }` (bare-id form) → asserts `CONNECTOR_REF_UNRESOLVED`.
  - **`pattern-connector-dotted-form`** — tool with `@{ connector: "github.create_issue" }` (dotted-operation form) → asserts NO warning even when `github` isn't a declared node, per the spec's opaque-string treatment of the dotted form.
  - **`pattern-instance-tool`** — `win-pane` instance whose `def` points at a `shape: subroutine` node. Asserts inheritance and that structure is not cloned.
  - **`pattern-instance-mismatch-warn`** — `win-pane` whose `def` points at a non-tool node → asserts `INSTANCE_KIND_MISMATCH`.
  - **`edge-semantics-control`**, **`edge-semantics-data`**, **`edge-semantics-conformance`**, **`edge-semantics-delegation`**, **`edge-semantics-failure`**, **`edge-semantics-association`**, **`edge-semantics-governance`**, **`edge-semantics-bidirectional`** — one fixture per spec operator, asserting the `edgeSemantic` value populated by PR 0.

### PR 6 — Spec doc clarifications (if needed)

- Branch: `docs/spec-0.6.0`
- Base: `feature/agentflow-readiness-v0.5.0`.
- Likely scope:
  - Document `agentflow.legacyEdgeSemantics` config flag and the v1.0 default flip in the §13 metadata table or a new §14 config-keys section. (Deferred from PR 0; lands when wave 3 picks up the strict flip.)
  - Updated **What's New** block reflecting the shape-based tool model and the connector keyword.
- May not need its own PR. **Decision deferred** — drop or merge into PR 7 if there's nothing substantive.

### PR 7 — Changeset for the wave-2 release

- Branch: `chore/wave2-changeset`
- Base: `feature/agentflow-readiness-v0.5.0` (cut once all prior wave-2 PRs have merged).
- Single changeset file, `feat:` prefix, `mermaid` minor bump, body links every wave-2 PR.

---

## Verification per PR

Every PR runs:

- `pnpm --filter mermaid test` — unit tests pass.
- `pnpm lint` — lint and prettier pass.
- `pnpm --filter mermaid build` — type-check passes.

Additionally:

- **PR 1** — render an existing `shape: subroutine` fixture; confirm zero behavioural change at the visual layer; only the diagnostic surface changes. Run the wave-1 conformance corpus and confirm no new warnings.
- **PR 2** — confirm `CONNECTOR_REF_UNRESOLVED` surfaces on `getDiagnostics()` with `nodeId` populated for the bare-id miss case; confirm dotted-form bindings emit no warning.
- **PR 4** — high-confidence test coverage matters because instance resolution touches metadata semantics; ≥ 50 cases per Action 4.
- **PR 5** — runner output must be deterministic (run twice, diff empty).

---

## Out of wave 2

Anything that requires hard errors or breaks existing diagrams. Wave 3 picks these up:

- Strict identifier uniqueness (#2) — error from v1.0.
- Strict edge-semantic contradictions (#3 strict portion) — flip `legacyEdgeSemantics` default to `false`.
- Container-edge errors (#7) — currently warn; flip in v1.0.
- Strict containment (#8) — flip in v1.0.
- Strict capability evaluation (#9) — flip in v1.0.
- Reference-kind strict enforcement (#10) — flip in v1.0.
- Strict metadata applicability (#11) — flip in v1.0.

Per `AGENTFLOW-readiness-actions.md` §Approval, actions 2 (#3), 5 (#6), and 10 (#11) are prerequisites for actions 6 (#7) and 8 (#9). Wave 2 lands #6's validators and the additive part of #3; wave 3 closes the prereq loop with #11 then flips #7 and #9 strict.

---

## Future extensions flagged but not in scope

Two additive metadata extensions are noted in `AGENTFLOW-readiness-actions.md` §5 (Future extension) for visibility. Neither is a wave-2 prerequisite; both can land as small follow-up PRs once the rest of wave 2 is in:

- **Tool `params`** — declarative input parameter set on a tool definition.
- **Input-value semantics on data nodes** — `value` (literal) and `example` (illustrative) metadata keys on data-artifact nodes.

Both are pure metadata additions on top of the shape-based model; no new keywords or shapes.

---

## Open questions

1. **`legacyEdgeSemantics` default in wave 2.** PR 0 deferred this flag entirely; nothing keys off it yet. Wave 3 introduces it with the strict flip. Confirm during wave-3 planning whether the v0.6.0 release should still document the flag's existence even though it's a no-op.
2. **PR 6 (spec doc).** Probably not needed if §8/§9/§5.1 already cover everything. Confirm during review of PRs 1–4.

Resolved:

- _Wave-1 spillover (`edgeSemantic`)_ — handled as PR 0 of wave 2; merged.
- _Tool keyword vs shape_ — withdrew the keyword (`AGENTFLOW-readiness-actions.md` revision 5). Wave 2 PR 1 ships validators on the existing shape-based form.
- _Connector keyword vs metadata_ — withdrew the keyword (`AGENTFLOW-readiness-actions.md` revision 6). Wave 2 PR 2 ships an optional reference validator on top of the metadata-based binding form. The "connector shape registration" question is moot — there is no special connector shape; nodes used as connectors render with the default `roundedRect`.
- _Tool/connector ordering_ — independent; can land in either order. Plan keeps tool validators (PR 1) before instance binding (PR 4) because PR 4's kind validation extends PR 1's `INSTANCE_KIND_MISMATCH`.
- _Worktree naming_ — single worktree at `../agentflow-wt/wave1` covers both waves.
- _Subroutine deprecation warning_ — withdrawn along with the tool keyword. `shape: subroutine` is now the canonical form, not deprecated.
- _PR 3 (binding validation)_ — withdrawn along with the connector keyword. Lighter-weight successor folded into PR 2.

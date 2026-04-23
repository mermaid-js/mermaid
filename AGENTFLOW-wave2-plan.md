# Agentflow Readiness — Wave 2 Implementation Plan

**Target version:** Agentflow 0.6.0
**Integration branch:** `feature/agentflow-readiness-v0.6.0` (off `agentflow`, cut after wave 1 ships)
**Final merge target:** `agentflow` (entire wave-2 stack merges as one integration branch, same posture as wave 1)
**Status:** Approved — execution plan for wave 2

**Scope.** Wave 2 lands the **additive declarations** the spec reserved in v0.5.0:

| Action | Title                                                       | Tracking issue                                                                                        | Milestone |
| ------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------- |
| 4      | Definition / instance binding + validation                  | [#5](https://github.com/Mermaid-Chart/agentflow/issues/5)                                             | 0.6.0     |
| 5      | `tool` as a first-class leaf declaration                    | [#6](https://github.com/Mermaid-Chart/agentflow/issues/6)                                             | 0.6.0     |
| —      | `connector` as a first-class leaf declaration               | [#14](https://github.com/Mermaid-Chart/agentflow/issues/14)                                           | 0.6.0     |
| 2      | Conformance fixtures asserting the canonical edge semantics | (part of [#13](https://github.com/Mermaid-Chart/agentflow/issues/13) follow-up; tracked in this plan) | 0.6.0     |

All four pieces are **fully additive**. Existing v0.5.0 diagrams continue to parse, render, and produce the same `getSemanticModel()` output.

**Wave-1 spillover that lands first.** During wave-1 fixture work we found that `edgeSemantic` was specified in `AGENTFLOW-SYNTAX.md` §5.1 but **not actually wired into the code** — `destructLink()` returns `{ type, stroke, length }` only. Wave 2 must backfill this before the conformance fixtures (PR 6) can assert on it. Tracked as PR 0 of this plan.

**Isolation posture.** Same as wave 1: every wave-2 PR merges into `feature/agentflow-readiness-v0.6.0`, _not_ into `agentflow` directly. The integration branch fast-forwards / merges into `agentflow` as a single atomic v0.6.0 release once all wave-2 PRs are in.

---

## Branching and worktree workflow

**New sibling worktree.** Wave 1 used `../agentflow-wt/wave1`. Wave 2 gets its own worktree at `../agentflow-wt/wave2` so wave-1 archaeology stays accessible. The main checkout at `/home/knsv/repos/agentflow` (on `agentflow`) remains untouched throughout wave 2.

**Set-up (once, after v0.5.0 ships):**

```bash
# from the main checkout (/home/knsv/repos/agentflow)
git fetch agentflow
git checkout agentflow
git pull --ff-only agentflow agentflow            # picks up the v0.5.0 merge
git checkout -b feature/agentflow-readiness-v0.6.0
git push -u agentflow feature/agentflow-readiness-v0.6.0

git worktree add ../agentflow-wt/wave2 feature/agentflow-readiness-v0.6.0

# all wave-2 work happens here
cd ../agentflow-wt/wave2
```

**For each new PR:** identical to wave 1 (fan-out from the integration tip, draft PR targeting the integration branch).

```bash
git fetch agentflow
git checkout feature/agentflow-readiness-v0.6.0
git pull --ff-only agentflow feature/agentflow-readiness-v0.6.0
git checkout -b <branch-per-issue>            # e.g. feature/6_tool-declaration
# ... edit, commit, push ...
gh pr create --draft --base feature/agentflow-readiness-v0.6.0 --head <branch-per-issue>
```

### Conventions

- Worktree at `../agentflow-wt/wave2` (sibling to main checkout). Never nested. Main checkout's dev server is untouched.
- Branch names: `[feature|bug|chore|docs]/<issue#>_<short-description>`.
- All PRs draft, linked to issue with `Resolves #<n>`.
- `cypress/platform/knsv2.html` may have local dev-server tweaks — never commit them (carries over from wave 1).
- Wave-1 lessons applied: fan-out beats stacking; `pnpm changeset` runs in the final PR.

---

## PR decomposition

Wave 2 lands as a stack of seven PRs. Each is small and reviewable on its own. PR 0 backfills the wave-1 spillover; PRs 1 and 2 build the foundation; PR 3 layers binding on top; PR 4 is the heaviest behavioural change.

### PR 0 — `edgeSemantic` field on every edge (wave-1 spillover)

- Branch: `feature/edge-semantic-field`
- Base: `feature/agentflow-readiness-v0.6.0`.
- Closes the gap between spec and code: `AGENTFLOW-SYNTAX.md` §5.1 promises a first-class `edgeSemantic` field, but `agentflowDb.destructLink()` returns only `{ type, stroke, length }` today.
- Changes:
  - `agentflowDb.ts` — extend `destructLink()` (and the inner `destructEndLink` / `destructStartLink` if needed) to compute `edgeSemantic` per the §5.1 mapping table: `-->` → `control`, `==>` → `data`, `--o` → `bind`, `--x` → `escalate`, `-.->` → `dependency`, `-->>` → `delegation`.
  - `agentflow.jison` — pass the new field through the JISON action blocks (line 551–570 region).
  - `types.ts` — add `edgeSemantic` to the edge interface plus a corresponding union type.
  - `MermaidConfig` — add `agentflow.legacyEdgeSemantics: boolean` (default `true` in wave 2; flips to `false` in wave 3). When `true`, `edgeSemantic` is populated but the existing `type`/`stroke`-driven render decisions are preserved.
  - `getSemanticModel()` — surface `edgeSemantic` in `SemanticEdge`.
- Tests: ≥ 12 cases — every operator's `edgeSemantic`, double-arrow operators (`<-->`), the `legacyEdgeSemantics: false` path, semantic-export round-trip, no rendering change at default config.
- **Why first:** PR 6 fixtures need this field to assert against. Doing it as a separate PR also gives downstream consumers an early signal that they can start migrating.

### PR 1 — `tool` declaration (closes #6)

- Branch: `feature/6_tool-declaration`
- Base: `feature/agentflow-readiness-v0.6.0`.
- Changes:
  - `agentflow.jison` — new `"tool"` lexer token in the 94–96 region (statement-start anchored, mirroring `type`/`template`); new `toolDeclarationStatement` production parallel to `typeDeclarationStatement`.
  - `agentflowDb.ts` — `addTool(id, label)` registers a tool-kind vertex in the node/container namespace; metadata flows through the existing vertex-metadata path. New private vertex-kind tag (`'tool'`) so capability validation can identify invocation sites.
  - `transformData.ts` — tool vertices render with the `subroutine` visual (no shape change).
  - `diagnostics.ts` — new `SUBROUTINE_TOOL_DEPRECATED` warning. Emitted on any `@{ shape: subroutine }` node, per §8.2 ("deprecated from v0.6.0 in favour of the new `tool` form"). Warn-only, removable post-adoption.
  - Tests: ≥ 15 cases — bare `tool` declaration, tool with every metadata key from §13, multiple tools, `tool` as bare ID in non-declaration positions still parses, deprecation warning fires on `shape: subroutine`, deprecation does not fire on a real `tool` declaration.

### PR 2 — `connector` declaration (closes #14)

- Branch: `feature/14_connector-declaration`
- Base: `feature/agentflow-readiness-v0.6.0` (independent of PR 1; safe to open in parallel).
- Same shape as PR 1; the two share zero code but maximally similar structure for review ergonomics.
- Changes:
  - `agentflow.jison` — `"connector"` lexer token + `connectorDeclarationStatement` production.
  - `agentflowDb.ts` — `addConnector(id, label)` registers a connector-kind vertex in the node/container namespace.
  - `transformData.ts` — connector vertices render with the `connector` shape (already exists in mermaid's shared shapes registry; verify before relying on it).
  - Tests: ≥ 12 cases — bare `connector` declaration, all §9.3 metadata keys, `connector` as bare ID still parses, multiple connectors.

### PR 3 — Tool→connector binding validation

- Branch: `feature/connector-binding-validation`
- Base: `feature/agentflow-readiness-v0.6.0` (cut after PRs 1 and 2 merge).
- Changes:
  - `agentflowDb.ts` — extend the post-parse validator chain (introduced in wave-1 PR 2c) with `validateConnectorBindings()`: every `tool` vertex with a `connector` metadata key MUST resolve to a declared `connector` vertex. Unresolved → `CONNECTOR_REF_UNRESOLVED` diagnostic (warn in v0.6.0, error in v1.0 per the wave-3 strict-flip).
  - `diagnostics.ts` — new `CONNECTOR_REF_UNRESOLVED` warning ID.
  - Tests: ≥ 8 cases — valid binding, missing connector (warn), multiple tools binding the same connector, dangling connector with no tools (no warning — connectors are valid standalone).

### PR 4 — Definition / instance resolution (closes #5)

- Branch: `feature/5_instance-binding`
- Base: `feature/agentflow-readiness-v0.6.0` (cut after PR 1 merges so the `tool` kind exists for `win-pane → tool` mapping).
- Implements Action 4 from `AGENTFLOW-readiness-actions.md`: the `resolveInstances()` pass with full validation.
- Changes:
  - `agentflowDb.ts` — new `resolveInstances()` private method called from the post-parse validator chain. Steps per Action 4:
    1. For every vertex with an instance shape (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`), look up its `def`.
    2. Validate presence (`INSTANCE_DEF_MISSING`), kind (`INSTANCE_KIND_MISMATCH`), acyclicity (`INSTANCE_DEF_CYCLE`).
    3. Merge the definition's domain metadata with local-overrides-inherited.
    4. Do not clone definition structure into the instance site.
  - Inheritance is **domain metadata only** — `shape`, `view`, `icon`, `img`, `w`, `h`, style fields are excluded (the `SEMANTIC_METADATA_SKIP_KEYS` set from wave-1 PR 3 is the right filter).
  - `diagnostics.ts` — three new warning IDs: `INSTANCE_DEF_MISSING`, `INSTANCE_KIND_MISMATCH`, `INSTANCE_DEF_CYCLE`. All warn-only in v0.6.0, error in v1.0.
  - `getSemanticModel()` — instances expose their resolved metadata (post-merge) in the semantic export.
  - Tests: ≥ 50 cases per Action 4 — five shapes × valid/missing/mismatch/cycle/inheritance-precedence combos, structural-non-cloning confirmation, style-non-leak confirmation.

### PR 5 — Conformance fixtures: wave-2 behaviours

- Branch: `feature/wave2-fixtures`
- Base: `feature/agentflow-readiness-v0.6.0` (cut after PRs 0, 1, 2, 3, 4 all merge).
- Changes (in `packages/mermaid/src/diagrams/agentflow/conformance/fixtures/`):
  - **§19.1 Tool Call** — uses the new `tool` keyword. Asserts the `subroutine` visual still renders.
  - **§19.5 Directive** — already in wave 1 corpus? If not, add now with the proper visual.
  - **§19.8 Connector** — uses the new `connector` keyword + a tool binding. Asserts `CONNECTOR_REF_UNRESOLVED` does **not** fire.
  - **`pattern-tool-binding-warn`** — tool with `connector: "missing"` → asserts `CONNECTOR_REF_UNRESOLVED`.
  - **`pattern-instance-tool`** — `win-pane` instance whose `def` points at a `tool` declaration. Asserts inheritance and that structure is not cloned.
  - **`pattern-instance-mismatch-warn`** — `tag-rect` (agent-kind) whose `def` points at a `tool` → asserts `INSTANCE_KIND_MISMATCH`.
  - **`edge-semantics-control`**, **`edge-semantics-data`**, **`edge-semantics-bind`**, **`edge-semantics-escalate`**, **`edge-semantics-dependency`**, **`edge-semantics-delegation`** — one fixture per operator, asserting the `edgeSemantic` value on the resulting edge.
  - **`pattern-subroutine-deprecated`** — `@{ shape: subroutine }` → asserts `SUBROUTINE_TOOL_DEPRECATED`.

### PR 6 — Spec doc clarifications (if needed)

- Branch: `docs/spec-0.6.0`
- Base: `feature/agentflow-readiness-v0.6.0`.
- Likely scope:
  - Tighten §8/§9 grammar examples now that they're implementable (replace any "(reserved for v0.6.0)" qualifications with concrete behaviour references).
  - Document `agentflow.legacyEdgeSemantics` config flag and the v1.0 default flip in the §13 metadata table or a new §14 config-keys section.
  - Updated **What's New** block.
  - Migration note from v0.5.0: legacy `shape: subroutine` is deprecated; recommended replacement.
- May not need its own PR if the spec already covers everything from PR #15. **Decision deferred** — drop or merge into PR 7 (changeset) if there's nothing substantive.

### PR 7 — Changeset for the wave-2 release

- Branch: `chore/wave2-changeset`
- Base: `feature/agentflow-readiness-v0.6.0` (cut once all prior wave-2 PRs have merged).
- Single changeset file, `feat:` prefix, `mermaid` minor bump, body links every wave-2 PR.

---

## Verification per PR

Every PR runs:

- `pnpm --filter mermaid test` — unit tests pass.
- `pnpm lint` — lint and prettier pass.
- `pnpm --filter mermaid build` — type-check passes.

Additionally:

- **PR 0** — confirm no rendering change in default config across an agentflow corpus that uses every edge operator. Visual diff with `legacyEdgeSemantics: true` (default) → identical to v0.5.0.
- **PR 1, 2** — render the new declaration in the dev server; confirm `subroutine` and `connector` visuals appear correctly.
- **PR 3** — confirm `CONNECTOR_REF_UNRESOLVED` surfaces on `getDiagnostics()` with `nodeId` populated.
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

Per `AGENTFLOW-readiness-actions.md` §Approval, actions 2 (#3), 5 (#6), and 10 (#11) are prerequisites for actions 6 (#7) and 8 (#9). Wave 2 lands #6 and the additive part of #3; wave 3 closes the prereq loop with #11 then flips #7 and #9 strict.

---

## Open questions

1. **`legacyEdgeSemantics` default in wave 2.** Plan above says default `true` (preserve v0.5.0 behaviour). Alternative: default `false` from v0.6.0 to give downstream consumers more migration runway before v1.0. Proposed: keep `true` — wave 2 is **additive**; the field is new but the interpretation isn't.
2. **PR 6 (spec doc).** Probably not needed if the v0.5.0 spec already covers everything. Confirm during review of PRs 1–4 whether anything diverges from §8/§9/§5.1 as written.
3. **Connector shape registration.** The plan assumes the `connector` shape exists in mermaid's shared shapes registry (referenced by §9.4 / §4.3.1). Verify before PR 2 starts; add to `packages/mermaid/src/rendering-util/rendering-elements/shapes/` if missing — that would be a small wave-2 PR insert (PR 2-pre).
4. **Worktree naming.** Plan above creates `../agentflow-wt/wave2` as a sibling. Alternative: rename `wave1` → `wave2` and reuse. Sibling is cleaner for archaeology; rename saves disk. Proposed: sibling.

Resolved:

- _Wave-1 spillover (`edgeSemantic`)_ — handled as PR 0 of wave 2.
- _Tool/connector ordering_ — independent; can land in either order. Plan keeps `tool` as PR 1 because instance resolution (PR 4) needs it.
- _Subroutine deprecation_ — folded into PR 1 to keep the `tool`-related work in one place.

Raise remaining questions before PR 0 starts.

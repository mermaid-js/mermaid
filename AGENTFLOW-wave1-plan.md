# Agentflow Readiness — Wave 1 Implementation Plan

**Target version:** Agentflow 0.5.0
**Integration branch:** `feature/agentflow-readiness-v0.5.0` (off `agentflow`)
**Final merge target:** `agentflow` (entire wave-1 stack merges as one integration branch)
**Status:** Draft — execution plan for wave 1

**Scope.** Wave 1 is the non-breaking triple from `AGENTFLOW-readiness-actions.md` plus the spec v0.5.0 update and its conformance scaffolding.

**Isolation posture.** Every wave-1 PR merges into `feature/agentflow-readiness-v0.5.0`, _not_ into `agentflow` directly. This keeps the main `agentflow` branch (and anyone's dev server running against it) untouched until the full wave ships. When all nine PRs are merged into the integration branch, the integration branch is fast-forwarded / merged into `agentflow` as a single atomic release.

| Action | Title                                                         | Tracking issue                                              | Milestone |
| ------ | ------------------------------------------------------------- | ----------------------------------------------------------- | --------- |
| 3      | Canonicalise branching: `diamond` only; `hexagon` is a source | [#4](https://github.com/Mermaid-Chart/agentflow/issues/4)   | 0.5.0     |
| 11     | Presentation-only controls + `getSemanticModel()` projection  | [#12](https://github.com/Mermaid-Chart/agentflow/issues/12) | 0.5.0     |
| 12     | Conformance suite and example audit (start)                   | [#13](https://github.com/Mermaid-Chart/agentflow/issues/13) | 0.5.0     |

The spec document (`AGENTFLOW-SYNTAX.md` v0.5.0) lands first as its own PR; it carries the spec-text portions of **every** wave-1 issue plus the forward-looking text for later waves and for the connector feature ([#14](https://github.com/Mermaid-Chart/agentflow/issues/14)). Implementation PRs follow.

---

## Branching and worktree workflow

**One shared worktree, flat fan-out.** All wave-1 PRs target `feature/agentflow-readiness-v0.5.0` directly. Merge them in any order that respects content dependencies (e.g. PR 2a before PR 2b before PR 2c). No PR bases on another open PR. No rebasing after merges.

**Set-up (once):**

```bash
# from the main checkout (/home/knsv/repos/agentflow)
git fetch agentflow
git worktree add ../agentflow-wt/wave1 feature/agentflow-readiness-v0.5.0

# all wave-1 work happens here
cd ../agentflow-wt/wave1
```

**For each new PR:**

```bash
git fetch agentflow
git checkout feature/agentflow-readiness-v0.5.0
git pull agentflow feature/agentflow-readiness-v0.5.0
git checkout -b <branch-per-issue>        # e.g. feature/4_hexagon-branch-warning
# ... edit, commit, push ...
gh pr create --draft --base feature/agentflow-readiness-v0.5.0 --head <branch-per-issue>
```

Because every branch starts from the latest integration tip, the PR diff is always exactly its own change — no prior-PR noise. As long as one PR doesn't depend on another's code, they can be reviewed and merged independently.

When a PR does depend on another still-open PR's code (e.g. tests that need a method introduced in an earlier PR), the later PR is cut only **after** the earlier one merges. The stack fans out in time rather than through git bases.

### Earlier stacking attempt

The initial plan stacked PRs on each other (PR 2 → PR 1, PR 3 → PR 2, etc). That produced a clean per-PR diff but caused a subtle failure mode: merging a stacked PR puts its commits on the intermediate branch, not the integration branch. The fix was a "sync PR" from the intermediate branch up to the integration branch. Going forward, fan-out avoids the whole problem.

### Conventions

- Worktree lives at `../agentflow-wt/wave1` (sibling to the main checkout). Never nested inside the repo. The main checkout and its dev server are untouched throughout wave 1.
- Branch names follow the repo convention: `[feature|bug|chore|docs]/<issue#>_<short-description>` — e.g. `feature/4_hexagon-branch-warning`.
- Wave-1 PRs merge into `feature/agentflow-readiness-v0.5.0`, not `agentflow`. Only the final integration-branch merge goes to `agentflow`.
- Each PR is opened **draft** (CLAUDE.md policy) and linked to its tracking issue with `Resolves #<n>`.

---

## PR decomposition

Wave 1 lands as a stack of nine PRs. Each is small and reviewable on its own. PRs 1b, 1c, 2a, and 2b build the foundation so the behavioural PRs (2c, 3, 5) stay tight and focused.

### PR 1 — Spec v0.5.0 (docs)

- Branch: `docs/spec-0.5.0`
- Base: `feature/agentflow-readiness-v0.5.0` (the integration branch).
- Status: open — [#15](https://github.com/Mermaid-Chart/agentflow/pull/15).
- Changes: `AGENTFLOW-SYNTAX.md` only. Adds the _What's New_ block, introduces `tool` (§8) and `connector` (§9), renumbers §10–§20, adds §13 metadata applicability, §14 presentation-only, conformance appendix, etc.
- Links: references #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14 (spec text for each; validators land in later PRs).
- Size: +432 / -170 vs v0.4.0 (single file).
- Review focus: is the normative text correct? Code changes come later.

### PR 1b — Port shared position-capture infrastructure

- Branch: `feature/frontmatter-line-offset-shared`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PR 1 merges so the spec is already on integration).
- Ports the shared cross-diagram pieces from `alana/flowchart_jison_highlight`:
  - `packages/mermaid/src/preprocess.ts` — compute `frontmatterLineOffset` and return it on the `code` object.
  - `packages/mermaid/src/Diagram.ts` — call `db.setFrontmatterLineOffset(offset)` when the diagram def declares `supportsInlinePositions: true`.
  - `ExternalDiagramDefinition` type — add the `supportsInlinePositions?: boolean` flag.
- No agentflow-specific changes yet; those follow in PR 2a.
- **Ownership posture.** Since the alana branch's final home is undecided, this PR is the permanent home for the shared pieces in `Mermaid-Chart/agentflow`. If the alana branch also lands later, whichever merges first wins and the other rebases.

### PR 1c — Mirror JISON comment-handling fix into `agentflow.jison`

- Branch: `fix/agentflow-jison-comment-handling`
- Base: `feature/agentflow-readiness-v0.5.0` (code does not depend on PR 1b; safe to open in parallel).
- Mirrors the comment-handling fix from `alana/flowchart_jison_highlight` commit `dd77bb73b` into `agentflow.jison`:
  - Move the `COMMENT` lexer rule above `NODE_STRING` so `%%comment` without a leading space tokenises correctly.
  - Add `COMMENT` to the `separator` and `graphConfig` grammar rules.
  - Silent comment skipping inside `<text>`, `<ellipseText>`, `<trapText>` lexer states.
- Tests: adapted from the comment-parsing test suite added in flowchart commit `12a1c42`.

### PR 2a — Element-mapping infrastructure on agentflow

- Branch: `feature/agentflow-element-mappings`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PR 1b and PR 1c have merged so `DiagramCode` and the COMMENT grammar are both present).
- Mirrors the flowchart pattern — method names identical so eventual shared-lift to `diagram-api/types.ts` is rename-free.
- Changes:
  - `types.ts` — `ElementPosition`, `AgentflowElementMapping`, and the `AgentflowAST`-style sync surface (`getElementAtPosition`, `getElementById`, `getElementsOnLine`, stats).
  - `agentflowDb.ts` — optional `addVertexMapping` / `addEdgeMapping` / `addSubgraphMapping` / `addTypeMapping` / `addTemplateMapping` methods; `setFrontmatterLineOffset` to match the Diagram.ts hook from PR 1b; private `elementMappings` array.
  - `agentflow.jison` — action blocks call the mapping methods alongside the existing add methods, guarded by `if (yy.xxxMapping)`. Signatures of existing add methods are unchanged.
  - Agentflow diagram definition opts in with `supportsInlinePositions: true`.
  - Tests: positions land on vertices, edges, subgraphs, types, templates; positions adjust correctly when a frontmatter block is present.
- No warnings or diagnostics yet.

### PR 2b — Diagnostic layer

- Branch: `feature/agentflow-diagnostics`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PR 2a merges so the mapping layer is present).
- Changes:
  - New `packages/mermaid/src/diagrams/agentflow/diagnostics.ts` — `AgentflowWarning` enum + `AgentflowDiagnostic` interface (with optional `nodeId`, `edgeId`, `position: ElementPosition`).
  - `agentflowDb.ts` — `emitWarning(id, message, ctx?)` and `getDiagnostics()`; position resolves through the element-mapping layer from PR 2a.
  - Migrate the one existing `log.warn` in `transformData.ts` to `emitWarning('SHAPE_UNSUPPORTED', ...)` so there is a single warning channel from the start.
- Tests: `emitWarning` writes to both the diagnostics array and `log.warn`; `getDiagnostics()` returns structured entries; migrated `SHAPE_UNSUPPORTED` carries the vertex position.

### PR 2c — Hexagon branching warning (closes #4)

- Branch: `feature/4_hexagon-branch-warning`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PR 2b merges so `emitWarning` exists).
- Changes:
  - `agentflowDb.ts` — edge-resolution pass emits `HEXAGON_MULTI_BRANCH` when a `hexagon` has multiple branch-labelled outgoing edges. Uses `emitWarning` from PR 2b; position attached automatically.
  - `agentflow.spec.ts` — ≥ 5 cases asserting on `getDiagnostics()` (single-branch hexagon OK, multi-branch hexagon warns, diamond always OK, unlabelled outgoing OK, position fields present).

### PR 3 — `getSemanticModel()` projection (closes #12)

- Branch: `feature/12_semantic-model-projection`
- Base: `feature/agentflow-readiness-v0.5.0` (code does not depend on earlier wave-1 PRs; safe in parallel).
- Changes:
  - `agentflowDb.ts` — add `getSemanticModel()` alongside `getData()`; strip `view`, `class` / `style`, `icon`, `img`, `w`, `h`. Element mappings (positions, svgIds) are also excluded from the semantic export.
  - `types.ts` — export the semantic-model shape.
  - `agentflow.spec.ts` — ≥ 5 cases covering styled-vs-unstyled equivalence, collapsed-vs-expanded equivalence, presentation fields present in `getData()` but absent in `getSemanticModel()`.

### PR 4 — Conformance runner scaffolding (closes #13 scaffolding portion)

- Branch: `feature/13a_conformance-runner`
- Base: `feature/agentflow-readiness-v0.5.0` (scaffolding only — safe in parallel with other PRs).
- Changes:
  - New directory `packages/mermaid/src/diagrams/agentflow/conformance/` with runner code.
  - Fixture format: `<pattern>-<case>.agentflow` + `<pattern>-<case>.expected.json`. The JSON declares outcome (`valid` / `warning` / `error`), optional message ID, and optional `line` / `nodeId` / `edgeId` that the runner matches against `getDiagnostics()`.
  - Wired into the existing vitest config so `pnpm --filter mermaid test` picks up fixtures.
  - One reference fixture (`smoke-valid`) proving the runner end-to-end.

### PR 5 — Conformance fixtures: wave-1 behaviours (closes #13 fixtures portion)

- Branch: `feature/13b_wave1-fixtures`
- Base: `feature/agentflow-readiness-v0.5.0` (cut after PRs 2c, 3, and 4 merge so the runner and the behaviours fixtures exercise are all present).
- Changes:
  - Fixtures exercising the wave-1 behaviours introduced in PRs 2c and 3 (hexagon warning with position asserted; `getSemanticModel()` equivalence; existing v0.4.0 examples that continue to parse).
  - Every example in `AGENTFLOW-SYNTAX.md` §19 Semantic Patterns and §20 Complete Example ported into fixtures and verified.

### PR 6 — Changeset for the wave-1 release

- Branch: `chore/wave1-changeset`
- Base: `feature/agentflow-readiness-v0.5.0` (cut once all prior wave-1 PRs have merged).
- Changes: single changeset file per the repo convention — `feat:` prefix, minor bump on `mermaid`, summary linking each of PRs 1–5.

---

## Verification per PR

Every PR runs:

- `pnpm --filter mermaid test` — unit tests pass.
- `pnpm lint` — lint and prettier pass.
- `pnpm --filter mermaid build` — type-check passes.

Additionally:

- **PR 1** — visual check against the Complete Example in §20: render under `pnpm dev`, confirm no visual regression versus v0.4.0.
- **PR 1b** — confirm no visual or behavioural regression on every diagram type that does **not** opt into `supportsInlinePositions`. The `Diagram.ts` change is guarded by the flag, but a smoke run across flowchart / sequence / class / state is prudent.
- **PR 1c** — adapted flowchart comment tests must pass on agentflow.
- **PR 2a** — positions round-trip through a sample diagram with and without frontmatter; offsets verified.
- **PR 4 / 5** — conformance runner output is deterministic (run twice, diff should be empty).

---

## Out of wave 1

Anything that would require grammar changes, new validators with hard-error effects, or breaking behaviour. Specifically:

- `tool` declaration (#6) — wave 2.
- `connector` declaration (#14) — wave 2.
- Instance-shape validation (#5) — wave 2.
- Strict identifier uniqueness (#2) — wave 3.
- Strict containment (#8) — wave 3.
- Strict capability evaluation (#9) — wave 3.
- Canonical `==>` as authoritative data flow default (#3) — wave 3.
- Container-edge binding as errors (#7) — wave 3.
- Strict metadata applicability (#11) — wave 3.
- Reference-kind strict enforcement (#10) — wave 3.

---

## Open questions

1. **Spec enforcement-timing notation.** Current spec uses inline phrases ("warning in v0.5.0; error from v1.0"). Keep, or adopt RFC-style `MUST` / `SHOULD` / `MAY`? Proposed: keep inline notes.
2. **Alana branch trajectory.** The `flowchart_jison_highlight` branch in `Mermaid-Chart/alana-mermaid` may or may not merge upstream. PR 1b treats the ported shared pieces as the permanent home in `Mermaid-Chart/agentflow`; reconcile if alana later lands a divergent version.

Resolved during the design phase:

- _Message IDs_ — `AgentflowWarning` enum ships in PR 2b; conformance fixtures match by ID.
- _Worktree root_ — `../agentflow-wt/wave1` confirmed; PR 15 already opened from there.
- _Method names_ — identical to flowchart's (`addVertexMapping`, `addEdgeMapping`, `addSubgraphMapping`) so eventual lift to shared is rename-free.
- _Full AST surface vs minimum_ — full surface in PR 2a; positions for diagnostics come for free.

Raise remaining questions before PR 1b starts.

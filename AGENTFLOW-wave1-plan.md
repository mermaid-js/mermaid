# Agentflow Readiness — Wave 1 Implementation Plan

**Target version:** Agentflow 0.5.0
**Target merge branch:** `develop`
**Status:** Draft — execution plan for wave 1

**Scope.** Wave 1 is the non-breaking triple from `AGENTFLOW-readiness-actions.md` plus the spec v0.5.0 update and its conformance scaffolding.

| Action | Title | Tracking issue | Milestone |
|---|---|---|---|
| 3 | Canonicalise branching: `diamond` only; `hexagon` is a source | [#4](https://github.com/Mermaid-Chart/agentflow/issues/4) | 0.5.0 |
| 11 | Presentation-only controls + `getSemanticModel()` projection | [#12](https://github.com/Mermaid-Chart/agentflow/issues/12) | 0.5.0 |
| 12 | Conformance suite and example audit (start) | [#13](https://github.com/Mermaid-Chart/agentflow/issues/13) | 0.5.0 |

The spec document (`AGENTFLOW-SYNTAX.md` v0.5.0) lands first as its own PR; it carries the spec-text portions of **every** wave-1 issue plus the forward-looking text for later waves and for the connector feature ([#14](https://github.com/Mermaid-Chart/agentflow/issues/14)). Implementation PRs follow.

---

## Branching and worktree workflow

**One shared worktree for all wave-1 PRs.** Wave-1 PRs stack — each builds on the previous one — so a single worktree with branch switching is simpler than a worktree per PR.

**Set-up:**

```bash
# from the main checkout (/home/knsv/repos/agentflow)
git fetch origin
git worktree add ../agentflow-wt/wave1 -b docs/spec-0.5.0 agentflow

# all wave-1 work happens here
cd ../agentflow-wt/wave1
```

**Stacked-PR pattern.** Each PR is branched off the **previous PR's branch**, not off `agentflow`. The reviewer sees only the incremental diff per PR; the stack merges back to `agentflow` in order.

```bash
# in the worktree, once PR 1 is pushed and under review
git checkout docs/spec-0.5.0
git checkout -b feature/frontmatter-line-offset-shared   # PR 1b stacks on PR 1

# once PR 1b is pushed
git checkout -b fix/agentflow-jison-comment-handling     # PR 1c stacks on PR 1b

# ... and so on through the nine-PR stack
```

**Rebasing.** When an earlier PR merges to `agentflow`, rebase the remaining stack onto the new `agentflow` tip:

```bash
git fetch origin
git checkout <next-open-branch>
git rebase --onto agentflow <merged-branch>
git push --force-with-lease
```

- Worktree lives at `../agentflow-wt/wave1` (sibling to the main checkout). Never nested inside the repo.
- Branch names follow the repo convention: `[feature|bug|chore|docs]/<issue#>_<short-description>` — e.g. `feature/4_hexagon-branch-warning`.
- Wave-1 base branch is `agentflow` while the diagram type is stabilising; eventual PR merges still target `develop` per `CLAUDE.md`.
- Each PR is opened **draft** (CLAUDE.md policy), linked to its tracking issue with `Resolves #<n>`, and has its "base" set to the previous PR's branch on GitHub until that predecessor merges.

---

## PR decomposition

Wave 1 lands as a stack of nine PRs. Each is small and reviewable on its own. PRs 1b, 1c, 2a, and 2b build the foundation so the behavioural PRs (2c, 3, 5) stay tight and focused.

### PR 1 — Spec v0.5.0 (docs)

- Branch: `docs/spec-0.5.0`
- Base: `agentflow`
- Status: open — [#15](https://github.com/Mermaid-Chart/agentflow/pull/15).
- Changes: `AGENTFLOW-SYNTAX.md` only. Adds the *What's New* block, introduces `tool` (§8) and `connector` (§9), renumbers §10–§20, adds §13 metadata applicability, §14 presentation-only, conformance appendix, etc.
- Links: references #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14 (spec text for each; validators land in later PRs).
- Size: +432 / -170 vs v0.4.0 (single file).
- Review focus: is the normative text correct? Code changes come later.

### PR 1b — Port shared position-capture infrastructure

- Branch: `feature/frontmatter-line-offset-shared`
- Base: `docs/spec-0.5.0` (stacks on PR 1). Rebase onto `agentflow` once PR 1 merges.
- Ports the shared cross-diagram pieces from `alana/flowchart_jison_highlight`:
  - `packages/mermaid/src/preprocess.ts` — compute `frontmatterLineOffset` and return it on the `code` object.
  - `packages/mermaid/src/Diagram.ts` — call `db.setFrontmatterLineOffset(offset)` when the diagram def declares `supportsInlinePositions: true`.
  - `ExternalDiagramDefinition` type — add the `supportsInlinePositions?: boolean` flag.
- No agentflow-specific changes yet; those follow in PR 2a.
- **Ownership posture.** Since the alana branch's final home is undecided, this PR is the permanent home for the shared pieces in `Mermaid-Chart/agentflow`. If the alana branch also lands later, whichever merges first wins and the other rebases.

### PR 1c — Mirror JISON comment-handling fix into `agentflow.jison`

- Branch: `fix/agentflow-jison-comment-handling`
- Base: `feature/frontmatter-line-offset-shared` (stacks on PR 1b). Rebase onto `agentflow` once PR 1b merges.
- Mirrors the comment-handling fix from `alana/flowchart_jison_highlight` commit `dd77bb73b` into `agentflow.jison`:
  - Move the `COMMENT` lexer rule above `NODE_STRING` so `%%comment` without a leading space tokenises correctly.
  - Add `COMMENT` to the `separator` and `graphConfig` grammar rules.
  - Silent comment skipping inside `<text>`, `<ellipseText>`, `<trapText>` lexer states.
- Tests: adapted from the comment-parsing test suite added in flowchart commit `12a1c42`.

### PR 2a — Element-mapping infrastructure on agentflow

- Branch: `feature/agentflow-element-mappings`
- Base: `fix/agentflow-jison-comment-handling` (stacks on PR 1c). Rebase onto `agentflow` once PR 1c merges.
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
- Base: `feature/agentflow-element-mappings` (stacks on PR 2a). Rebase onto `agentflow` once PR 2a merges.
- Changes:
  - New `packages/mermaid/src/diagrams/agentflow/diagnostics.ts` — `AgentflowWarning` enum + `AgentflowDiagnostic` interface (with optional `nodeId`, `edgeId`, `position: ElementPosition`).
  - `agentflowDb.ts` — `emitWarning(id, message, ctx?)` and `getDiagnostics()`; position resolves through the element-mapping layer from PR 2a.
  - Migrate the one existing `log.warn` in `transformData.ts` to `emitWarning('SHAPE_UNSUPPORTED', ...)` so there is a single warning channel from the start.
- Tests: `emitWarning` writes to both the diagnostics array and `log.warn`; `getDiagnostics()` returns structured entries; migrated `SHAPE_UNSUPPORTED` carries the vertex position.

### PR 2c — Hexagon branching warning (closes #4)

- Branch: `feature/4_hexagon-branch-warning`
- Base: `feature/agentflow-diagnostics` (stacks on PR 2b). Rebase onto `agentflow` once PR 2b merges.
- Changes:
  - `agentflowDb.ts` — edge-resolution pass emits `HEXAGON_MULTI_BRANCH` when a `hexagon` has multiple branch-labelled outgoing edges. Uses `emitWarning` from PR 2b; position attached automatically.
  - `agentflow.spec.ts` — ≥ 5 cases asserting on `getDiagnostics()` (single-branch hexagon OK, multi-branch hexagon warns, diamond always OK, unlabelled outgoing OK, position fields present).

### PR 3 — `getSemanticModel()` projection (closes #12)

- Branch: `feature/12_semantic-model-projection`
- Base: `feature/4_hexagon-branch-warning` (stacks on PR 2c). Rebase onto `agentflow` once PR 2c merges.
- Changes:
  - `agentflowDb.ts` — add `getSemanticModel()` alongside `getData()`; strip `view`, `class` / `style`, `icon`, `img`, `w`, `h`. Element mappings (positions, svgIds) are also excluded from the semantic export.
  - `types.ts` — export the semantic-model shape.
  - `agentflow.spec.ts` — ≥ 5 cases covering styled-vs-unstyled equivalence, collapsed-vs-expanded equivalence, presentation fields present in `getData()` but absent in `getSemanticModel()`.

### PR 4 — Conformance runner scaffolding (closes #13 scaffolding portion)

- Branch: `feature/13a_conformance-runner`
- Base: `feature/12_semantic-model-projection` (stacks on PR 3). Rebase onto `agentflow` once PR 3 merges.
- Changes:
  - New directory `packages/mermaid/src/diagrams/agentflow/conformance/` with runner code.
  - Fixture format: `<pattern>-<case>.agentflow` + `<pattern>-<case>.expected.json`. The JSON declares outcome (`valid` / `warning` / `error`), optional message ID, and optional `line` / `nodeId` / `edgeId` that the runner matches against `getDiagnostics()`.
  - Wired into the existing vitest config so `pnpm --filter mermaid test` picks up fixtures.
  - One reference fixture (`smoke-valid`) proving the runner end-to-end.

### PR 5 — Conformance fixtures: wave-1 behaviours (closes #13 fixtures portion)

- Branch: `feature/13b_wave1-fixtures`
- Base: `feature/13a_conformance-runner` (stacks on PR 4). Rebase onto `agentflow` once PR 4 merges.
- Changes:
  - Fixtures exercising the wave-1 behaviours introduced in PRs 2c and 3 (hexagon warning with position asserted; `getSemanticModel()` equivalence; existing v0.4.0 examples that continue to parse).
  - Every example in `AGENTFLOW-SYNTAX.md` §19 Semantic Patterns and §20 Complete Example ported into fixtures and verified.

### PR 6 — Changeset for the wave-1 release

- Branch: `chore/wave1-changeset`
- Base: `feature/13b_wave1-fixtures` (stacks on PR 5). Rebase onto `agentflow` once PR 5 merges.
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

- *Message IDs* — `AgentflowWarning` enum ships in PR 2b; conformance fixtures match by ID.
- *Worktree root* — `../agentflow-wt/wave1` confirmed; PR 15 already opened from there.
- *Method names* — identical to flowchart's (`addVertexMapping`, `addEdgeMapping`, `addSubgraphMapping`) so eventual lift to shared is rename-free.
- *Full AST surface vs minimum* — full surface in PR 2a; positions for diagnostics come for free.

Raise remaining questions before PR 1b starts.

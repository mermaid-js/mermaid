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
git checkout -b feature/4_hexagon-branch-warning   # PR 2 stacks on PR 1

# once PR 2 is pushed
git checkout -b feature/12_semantic-model-projection   # PR 3 stacks on PR 2

# ... and so on
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

One PR per tracking issue. Each PR is small enough for a single-pass review.

### PR 1 — Spec v0.5.0 (docs)

- Branch: `docs/spec-0.5.0`
- Base: `agentflow`
- Changes: `AGENTFLOW-SYNTAX.md` only. Adds the *What's New* block, introduces `tool` (§8) and `connector` (§9), renumbers §10–§20, adds §13 metadata applicability, §14 presentation-only, conformance appendix, etc.
- Links: references #2, #3, #4, #5, #6, #7, #8, #9, #10, #11, #12, #13, #14 (spec text for each; validators land in later PRs).
- Size: +432 / -170 vs v0.4.0 (single file).
- Review focus: is the normative text correct? Code changes come later.

### PR 2 — Hexagon branching warning (closes #4)

- Branch: `feature/4_hexagon-branch-warning`
- Base: `docs/spec-0.5.0` (stacks on PR 1). Rebase onto `agentflow` once PR 1 merges.
- Changes:
  - `agentflowDb.ts` — edge-resolution pass emits `HEXAGON_MULTI_BRANCH` warning when a `hexagon` has multiple branch-labelled outgoing edges.
  - `agentflow.spec.ts` — ≥ 5 cases (single-branch hexagon OK, multi-branch hexagon warns, diamond always OK, unlabelled outgoing OK, multi-branch hexagon silenced behind config — if we add one).

### PR 3 — `getSemanticModel()` projection (closes #12)

- Branch: `feature/12_semantic-model-projection`
- Base: `feature/4_hexagon-branch-warning` (stacks on PR 2). Rebase onto `agentflow` once PR 2 merges.
- Changes:
  - `agentflowDb.ts` — add `getSemanticModel()` alongside `getData()`; strip `view`, `class` / `style`, `icon`, `img`, `w`, `h`.
  - `types.ts` — export the semantic-model shape (strip list documented in source comment).
  - `agentflow.spec.ts` — ≥ 5 cases covering styled-vs-unstyled equivalence, collapsed-vs-expanded equivalence, presence of presentation fields in `getData()` but absence in `getSemanticModel()`.

### PR 4 — Conformance runner scaffolding (closes #13 scaffolding portion)

- Branch: `feature/13a_conformance-runner`
- Base: `feature/12_semantic-model-projection` (stacks on PR 3). Rebase onto `agentflow` once PR 3 merges.
- Changes:
  - New directory `packages/mermaid/src/diagrams/agentflow/conformance/` with runner code.
  - Fixture format: `<pattern>-<case>.agentflow` + `<pattern>-<case>.expected.json`. The JSON declares outcome (`valid` / `warning` / `error`) and, where applicable, message ID.
  - Wired into the existing vitest config so `pnpm --filter mermaid test` picks up fixtures.
  - One reference fixture (`smoke-valid`) proving the runner end-to-end.

### PR 5 — Conformance fixtures: wave-1 behaviours (closes #13 fixtures portion)

- Branch: `feature/13b_wave1-fixtures`
- Base: `feature/13a_conformance-runner` (stacks on PR 4). Rebase onto `agentflow` once PR 4 merges.
- Changes:
  - Fixtures exercising the wave-1 behaviours introduced in PRs 2 and 3 (hexagon warning; `getSemanticModel()` equivalence; existing v0.4.0 examples that continue to parse).
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
2. **Message IDs.** Introduce a minimal `AgentflowWarning` enum so conformance fixtures can match by ID rather than string. Proposed: yes, in PR 2 when the first warning lands.
3. **Worktree root.** `../agentflow-wt/wave1` as a single shared worktree — confirm that placement is fine with the user's filesystem layout.

Raise these before PR 2 starts.

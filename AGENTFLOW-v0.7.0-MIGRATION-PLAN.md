# Agentflow v0.7.0 Migration Plan

|               |                                            |
| ------------- | ------------------------------------------ |
| **Spec**      | `AGENTFLOW-SYNTAX.md` (v0.7.0)             |
| **Migration** | `AGENTFLOW-MIGRATION-0.6-to-0.7.md`        |
| **Target**    | `packages/mermaid/src/diagrams/agentflow/` |
| **Date**      | 2026-05-13                                 |
| **Revised**   | 2026-05-18 — plan/code review, see below   |

This plan splits the v0.6.0 → v0.7.0 implementation work into self-contained tasks. Each task has a complete briefing so a fresh context can pick it up cold. Tasks marked **parallel-safe** can run in separate git worktrees simultaneously.

> **Revision 2026-05-18 (plan vs. spec + code review, no code work yet).** Three corrections were applied after verifying the plan against `AGENTFLOW-SYNTAX.md` (v0.7.0) and the current code. No spec drift since 2026-05-13; the §13 task scoping (T3/T5/T7) is accurate. Corrections: **(1)** F0 was re-scoped — `@{...}` is **not** parsed by a grammar rule in `agentflow.jison`; it is lexed as one raw `SHAPE_DATA` blob and the mapping is parsed by `yaml.load()` in `agentflowDb.ts`. A nested `agentflow: { ... }` is already valid YAML, so F0 needs **no grammar rule changes** — only a lexer/regex sanity check for the nested `}`. **(2)** Task spec files live in `parser/agentflow-*.spec.ts`, not `conformance/` (which holds only `conformance.spec.ts` + 51 fixture pairs). Paths corrected throughout. **(3)** T7 requires splitting the `artifact` applicability _kind_ into `input` + `artifact`, not just editing the table — see T7.

---

## Implementation surface

| File                                         | Size     | Role                                                                                                                             |
| -------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `parser/agentflow.jison`                     | 707 L    | Lexes `@{...}` to one raw `SHAPE_DATA` token; **does not parse the mapping**. No metadata grammar rule.                          |
| `parser/agentflowParser.ts`                  | 12 L     | Thin export; applies `/}\s*\n/g` cleanup before parse — relevant to the F0 nested-`}` check                                      |
| `agentflowDb.ts`                             | ~3.5 KL  | **Main conflict surface.** Parses `SHAPE_DATA` via `yaml.load()` (line 2 import; merged ~618/646/651/724) into `vertex.metadata` |
| `types.ts`                                   | 299 L    | Type definitions                                                                                                                 |
| `diagnostics.ts`                             | 226 L    | Diagnostic codes / formatters                                                                                                    |
| `transformData.ts`                           | ~80 L    | DB → LayoutData transform                                                                                                        |
| `renderer.ts`                                | ~140 L   | SVG renderer                                                                                                                     |
| `conformance/fixtures/*.{mmd,expected.json}` | 51 pairs | **Cleanly parallel** — per concern                                                                                               |
| `parser/agentflow-*.spec.ts`                 | 16 files | **Cleanly parallel** — per concern (NOT in `conformance/`; that dir has only `conformance.spec.ts`)                              |

The conflict surface that determines parallelism is `agentflowDb.ts` — both the `@{...}` mapping parse (via `yaml.load`) and every metadata read live there, not in the grammar. Foundation task **F0** lands the dual-read shim and applicability-table refactor so downstream tasks each own a bounded region.

---

## Phases and merge order

```
F0 (foundation, sequential, must land first)
  │
  ├─► T1, T2, T3, T4, T5, T6, T7   (parallel-safe worktrees)
  │       ↓ merge into agentflow branch one at a time
  │       ↓ recommended order: T6, T1, T2, T3, T4, T5, T7
  │
  └─► F1 (cleanup, sequential, must land last)
```

**Why this merge order:** T6 (connectors subgraph) touches the most isolated region. T1/T2 share edge-semantic code but in different switch branches. T3/T4/T5/T7 all touch the metadata-applicability table — merge sequentially so each rebases on top of the previous and resolves the table additions in one place.

**Conflict surface per task** (in `agentflowDb.ts`, by approximate line range):

| Task | Edge semantics ~1468–1479 | Applicability 235–263 | Per-shape parsing | Connector code ~2836–2851 |
| ---- | ------------------------- | --------------------- | ----------------- | ------------------------- |
| F0   | —                         | refactor              | refactor          | —                         |
| T1   | **rewrite `-.->`**        | remove `def`          | `~2245–2270`      | —                         |
| T2   | **rewrite `---`**         | remove `directives`   | `~2481`           | —                         |
| T3   | —                         | remove typeRef/tplRef | `~2287–2320`      | —                         |
| T4   | —                         | —                     | `~2659–2663`      | —                         |
| T5   | —                         | agent keys            | agent block       | —                         |
| T6   | —                         | —                     | —                 | **remove synthesis**      |
| T7   | —                         | remove example/etc.   | artifact block    | —                         |

---

## Definition of "done" (applies to every task)

1. **Spec read first.** Open the spec sections listed in the task before touching code.
2. **Conformance fixtures updated.** All `.mmd` and matching `.expected.json` fixtures relevant to the concern reflect v0.7.0 form. Old form must produce a diagnostic (see step 4), not parse silently.
3. **Tests green.** Run `pnpm vitest run packages/mermaid/src/diagrams/agentflow`. All conformance tests and per-concern unit specs pass.
4. **Diagnostic for removed form.** When v0.7.0 removes a v0.6.0 form, the parser/db must emit a diagnostic at fatal-or-error severity (see `diagnostics.ts` for existing patterns) — not silently accept it.
5. **No dead code.** Remove old code paths once the new form lands. The migration _is_ the breaking change; do not leave compat shims behind (except F0's deliberate shim, which F1 removes).
6. **No new docs.** Don't create design docs, decision logs, or summaries. The spec is the documentation. Comments only where they explain _why_.
7. **Commit message format.** `feat(agentflow): <one-line summary>` or `refactor(agentflow): …`. Reference the task ID in the body: `Migration plan: T#.`

---

## Phase 0 — Foundation

### F0 · `agentflow: { … }` sub-block infrastructure

**Must land before any T#. Sequential.**

**Goal:** Make the parser accept the nested `agentflow:` sub-block, and refactor `agentflowDb.ts` so per-shape metadata reads go through a single helper that knows whether a key belongs at the top level (Mermaid presentation) or under `agentflow:` (domain). This is the choke point — get it right and the seven follow-on tasks become local edits.

**Spec sections:** §3.2, §4.4, §13 (full applicability table).

**Files touched:**

- `parser/agentflow.jison` — **no grammar rule change expected.** `@{...}` is lexed to one raw `SHAPE_DATA` blob; the mapping is never parsed by the grammar. A nested `agentflow: { ... }` is already valid YAML. The only grammar-side risk is the `shapeData`/`shapeDataStr`/`shapeDataEndBracket` lexer states mis-balancing on the nested `}`. **Spike first** (see Briefing) — only touch the grammar if the spike proves the lexer breaks on a nested `}`.
- `parser/agentflowParser.ts` — verify the `/}\s*\n/g` pre-parse cleanup does not corrupt a sub-block whose closing `}` is followed by a newline (e.g. `agentflow: {\n …\n }\n}`). Adjust the regex only if the spike shows breakage.
- `agentflowDb.ts` — the real F0 work. Introduce `readMetadata(node, key)` that resolves a key from either the top level or the parsed `agentflow:` sub-object, per the §13 applicability table. Update the per-shape applicability structure (`METADATA_APPLICABILITY`, line **235–263**) to record each key's expected location (`mermaid` top-level vs `agentflow` domain). Route the `yaml.load()`-merged metadata (merge sites ~618/646/651/724) and the ~13 direct `.metadata.` reads through the helper incrementally — F0 only introduces the helper + table; downstream tasks migrate their own reads.
- `types.ts` — add `AgentflowMetadata` type for the sub-block.
- `conformance/fixtures/` — **do not migrate fixtures yet.** Leave them in v0.6.0 form. The dual-read shim should accept both during F0–T7. F1 removes the shim and switches fixtures.

**Tests:**

- New: `parser/agentflow-metadata-subblock.spec.ts` — parses minimal `node@{ shape: subroutine, agentflow: { description: "x" } }` and asserts the description reads through correctly.
- New: parses flat-form `node@{ shape: subroutine, description: "x" }` and asserts the same.
- No existing tests should break.

**Done when:**

- Both forms parse and read identically through `readMetadata`.
- `pnpm vitest run packages/mermaid/src/diagrams/agentflow` is green.
- The §13 applicability table in code matches the spec's table column-for-column.

**Briefing notes (cold-start):**

- **Do the lexer spike before writing F0 code.** Feed `n@{ shape: subroutine, agentflow: { description: "x", params: { q: String } } }` through `agentflowParser`. If it parses to a nested object under `metadata.agentflow`, the grammar needs no change and F0 is purely an `agentflowDb.ts`/`types.ts` job. If the lexer or the `/}\s*\n/g` regex truncates at the inner `}`, that — not a grammar rule — is the thing to fix.
- The `@{...}` body is **not** grammar-parsed. The grammar lexes it to a single `SHAPE_DATA` string; `agentflowDb.ts` runs `yaml.load()` on it (import at line 2, merged into `vertex.metadata` at ~618/646/651/724). Nesting is a pure-YAML concern, so the sub-block is structurally free once the lexer tolerates the inner `}`.
- `agentflowDb.ts` currently scatters direct metadata reads (~13 sites). Don't try to migrate every read in F0 — the goal is to introduce `readMetadata` + the location-aware applicability table. Migrate the actual reads as part of each downstream task when that task touches the corresponding shape.

---

## Phase 1 — Parallel-safe feature tasks

Each task below is self-contained. Spin up a worktree per task with `git worktree add ../agentflow-T# agentflow`, do the work, open a PR back into the `agentflow` branch.

### T1 · Instance binding via `-.->` (remove `def:`)

**Goal:** `-.->` is the instance-binding edge. `def:` metadata key is removed. Every instance shape (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`) binds to its definition through `instance -.-> definition`.

**Spec sections:** §5.1 (edge operators), §11.2 (binding).

**Files touched:**

- `parser/agentflow.jison` — confirm `-.->` already parses; if it does, no grammar change needed (the meaning changes, not the syntax).
- `agentflowDb.ts` — edge-semantic mapping (~line 1468–1479): `-.->` now produces `instanceBinding`, not `governance`. Remove `def:` parsing (~line 2245–2270). Add binding resolution: for each instance node, find its `-.->` outgoing edge target and bind.
- `types.ts` — add `'instanceBinding'` to `EdgeSemantic` enum (line 73–81).
- `diagnostics.ts` — add diagnostic `INSTANCE_BINDING_MISSING` (instance node with no `-.->` outgoing) and `INSTANCE_BINDING_INVALID_TARGET` (target is not a definition).
- `conformance/fixtures/pattern-definition-instance-*.mmd` + `.expected.json` — migrate.
- `conformance/fixtures/edge-semantics-governance-*.mmd` — this fixture now represents directive binding (T2's concern). Coordinate or just leave for T2 to handle if it merges later.

**Tests:**

- Update `parser/agentflow-instance-resolution.spec.ts` to use the new edge form.
- Add: dotted edge from non-instance node should not produce instance binding (it's a no-op edge or a parse error — pick per spec §5.1).
- Add: instance node without `-.->` emits `INSTANCE_BINDING_MISSING`.

**Done when:**

- `def:` is no longer a recognized metadata key.
- Instance-resolution spec passes against new fixtures.
- `EdgeSemantic` enum includes `instanceBinding`.

---

### T2 · Directive binding via `---` (kill `directives:`)

**Goal:** `---` carries directive attachment when one endpoint is a directive (`trapezoid` shape or directive instance via `curv-trap`). `-.->` no longer carries governance. The `directives:` metadata key on tasks/tools is removed.

**Spec sections:** §5.1, §19.5.

**Files touched:**

- `agentflowDb.ts` — edge-semantic mapping (~line 1468–1479): `---` with a directive endpoint produces `directiveBinding`. Remove the `directives:` metadata key handling (~line 2481).
- `types.ts` — add `'directiveBinding'` to `EdgeSemantic` enum if not already present (verify against T1's enum changes; expect a small merge with T1 here).
- `diagnostics.ts` — add `DIRECTIVE_TEXT_KEY_FORBIDDEN` (rename use of `text:` on directive → must be `rule:`).
- `conformance/fixtures/pattern-directive-*.mmd` + `.expected.json` — migrate to `---` form. The 0.6.0 fixture uses `-.->` for directive attachment; switch to `---`.
- `conformance/fixtures/edge-semantics-governance-*.mmd` — repurpose or rename to reflect that `---`-with-directive-endpoint is now the canonical form.

**Tests:**

- Update `parser/agentflow-edge-semantic.spec.ts` for the new mapping.
- Update `parser/agentflow-edge-semantic-contradictions.spec.ts`.
- Add: `---` between two non-directive nodes is `association` (the general meaning).
- Add: `text:` on directive shape emits the new diagnostic.

**Done when:**

- `directives:` key no longer in applicability table.
- `-.->` no longer maps to `governance` anywhere.
- All directive fixtures use `---` edges and `rule:` (never `text:`).

**Coordination with T1:** Both T1 and T2 edit the edge-semantic mapping switch and the `EdgeSemantic` enum. Whichever lands second resolves the merge conflict by including both new enum values and both new edge cases. The conflict is mechanical.

---

### T3 · `procs` narrowed to `src` only

**Goal:** `procs` shape accepts only `src:` (external-file reference). `typeRef` and `templateRef` are removed. Type and template names are now written directly in the consuming field (`params:`, `returns:`, `output:`).

**Spec sections:** §10.2.

**Files touched:**

- `agentflowDb.ts` — applicability table: `procs` reduces to `{ src }`. Remove `typeRef`/`templateRef` validation (~line 2287–2320). `returns:`, `output:`, `params:` value parsers must now accept a bare type name (e.g., `returns: "CoffeeCopy"`) — already do, since type names are strings; mostly this is removing the cross-reference-node resolution logic.
- `diagnostics.ts` — add `PROCS_DEPRECATED_KEY` (typeRef/templateRef on procs).
- `conformance/fixtures/` — any fixture using `procs` + `typeRef`/`templateRef` (search `grep -l "typeRef\|templateRef" conformance/fixtures/`). Migrate to direct naming in the typed field.

**Tests:**

- Update `parser/agentflow-reference-kinds.spec.ts`.
- Add: `typeRef` on `procs` emits diagnostic.
- Add: external-file `procs` with `src:` resolves correctly.

**Done when:**

- `procs` applicability set is `{ src }` only.
- All cross-reference fixtures use direct naming.

---

### T4 · `params` as YAML mapping

**Goal:** `params: { name: Type, … }` replaces the comma-separated string form `params: "x :: T, y :: T?"`. Applies to `task`, `flow`, `skill`, `tool`, `directive`.

**Spec sections:** §5.5, §8.4.1, §13.

**Files touched:**

- `parser/agentflow.jison` — confirm the metadata-value grammar already accepts nested mappings (after F0 it should). If `params` was parsed via a custom rule, remove that rule.
- `agentflowDb.ts` — params parsing (~line 2659–2663): remove the string-form branch. The value must now be a `Record<string, string>`.
- `types.ts` — `Params` type changes from `string` to `Record<string, string>` (or a richer typed-signature object — verify the spec).
- `diagnostics.ts` — `PARAMS_DEPRECATED_STRING_FORM` for the old `"x :: T"` syntax.
- `conformance/fixtures/` — every fixture with `params: "..."` (search `grep -l 'params: "' conformance/fixtures/`). Convert to YAML mapping.

**Tests:**

- Update `parser/agentflow-mappings.spec.ts`.
- Add: string-form `params` emits diagnostic.
- Add: YAML-mapping form parses with bare and quoted type expressions identically (`{ city: String }` and `{ city: "String" }`).

**Done when:**

- Params type is `Record<string, string>` end-to-end.
- No string-form `params` survives in fixtures or source.

---

### T5 · Agent: `memory` array, `prompt` body, `model` optional

**Goal:** Update agent definition handling.

- `memory` becomes an array of strings, not a single string.
- `prompt` is a new key carrying the system-prompt body.
- `model` becomes optional (no diagnostic on absence).

**Spec sections:** §4.4 (agent keys), §13.

**Files touched:**

- `agentflowDb.ts` — agent metadata parsing. Update the per-shape applicability entry for `agent` to include `prompt`, change `memory` value type to array. Remove the "model required" check if one exists.
- `types.ts` — `AgentMetadata` type: `memory: string[]`, `prompt?: string`, `model?: string`.
- `diagnostics.ts` — `MEMORY_DEPRECATED_STRING_FORM`. Remove `MODEL_REQUIRED` if present.
- `conformance/fixtures/` — any agent definition with `memory: "..."` or relying on `model` requirement.

**Tests:**

- New: `memory: ["episodic", "semantic"]` parses to array.
- New: agent without `model` parses without diagnostic.
- New: `prompt:` body is preserved.
- Update existing agent-related fixtures.

**Done when:**

- All three keys behave per spec.
- No remaining `memory: "..."` (string) anywhere.

---

### T6 · Required `subgraph connectors[…]`

**Goal:** Connector-designated nodes must live inside a top-level `subgraph connectors[…]` block. Auto-synthesis of `agentflow-connectors-group` is removed. Nodes carrying connector config outside that subgraph are regular nodes (with unrecognized keys → diagnostic).

**Spec sections:** §9 (connectors).

**Files touched:**

- `agentflowDb.ts` — remove the connector-group synthesis logic (~line 2836–2851). Add validation: any node carrying `protocol:`, `endpoint:`, `transport:`, `command:`, `auth:`, `token_required:` outside the `connectors` subgraph emits a diagnostic. `connectorRef` resolution must check the target is inside the subgraph.
- `diagnostics.ts` — add/repurpose `CONNECTOR_OUTSIDE_SUBGRAPH` and `CONNECTORS_SUBGRAPH_MISSING`.
- `conformance/fixtures/pattern-connector-*.mmd` — confirm each uses `subgraph connectors[...]`. Migrate any that don't. Update `expected.json` to drop the synthesized-group id.

**Tests:**

- Update `parser/agentflow-connector-validator.spec.ts`.
- Add: connector node outside subgraph emits diagnostic.
- Add: a tool with `connectorRef` to a node outside the subgraph emits `CONNECTOR_REF_NOT_A_CONNECTOR` (or equivalent).
- Add: no `subgraph connectors` at all → no synthesis, no implicit grouping.

**Done when:**

- `agentflow-connectors-group` is gone from output.
- Connector validation enforces the subgraph rule.

**Note:** This task is the most isolated — touches a code region nothing else touches. Good first parallel task to land.

---

### T7 · Remove `example`, `fallbacks`, `text` on directive; restrict `value`; add `type` on `lean-right`

**Goal:** Cleanup pass for removed keys and the new `lean-right.type` field.

**Spec sections:** §4.4 (per-shape keys), §13.

> **Scope warning — this is a type refactor, not just table edits.** Spec §13 splits `input nodes (lean-right)` (`{type, value}`) and `artifact nodes (doc, lin-doc)` (`{output}`) into **two rows with disjoint key sets**. The current code deliberately lumps both under a single `artifact` kind — see the explicit comment at `agentflowDb.ts:256–261` ("A future split into a separate `input` kind is purely additive"). T7 _is_ that split. It touches `MetadataApplicabilityKind` (the union type at lines 214–228), `ARTIFACT_SHAPES`/related shape sets, and the vertex classifier (~line 2067) that maps a shape to a kind — not only the `METADATA_APPLICABILITY` literal. Budget accordingly; this is the heaviest of the T-tasks despite reading like a cleanup.

**Files touched:**

- `agentflowDb.ts`:
  - Split the `artifact` applicability kind into `input` (`lean-right`) and `artifact` (`doc`, `lin-doc`): add `input` to `MetadataApplicabilityKind` (214–228), give `lean-right` its own shape set, and update the classifier (~2067) to route `lean-right` → `input`.
  - `input` (lean-right) key set becomes `{ type, value }` (adds `type`, drops `example`/`output`).
  - `artifact` (doc/lin-doc) key set becomes `{ output }` (drops `value`/`example`).
  - Remove `fallbacks` from `agent`/`task`/`skill` (coordinate with T5, which also edits the `agent` row).
  - `text` is already absent from directive's list per §13; verify and add a diagnostic if anyone uses it on a `directive`/`trapezoid`.
- `types.ts` — corresponding type cleanups; add `InputMetadata.type`; remove the `fallbacks`/`example` fields.
- `diagnostics.ts` — `KEY_REMOVED_IN_V0_7_0` for each deprecated key.
- `conformance/fixtures/` — search and migrate any fixture using removed keys.

**Tests:**

- Update `parser/agentflow-metadata-applicability.spec.ts` — this is the right file for these checks.
- For each removed key: presence emits the deprecated-key diagnostic.
- `value` on `doc` emits diagnostic; `value` on `lean-right` does not.
- `type` on `lean-right` is accepted and surfaces in the parsed model.

**Done when:**

- `example`, `fallbacks`, and `text` on directive produce diagnostics.
- `value` restricted; `type` added.
- Applicability matrix matches spec §13.

---

## Phase 2 — Cleanup

### F1 · Remove the dual-read shim; switch fixtures

**Sequential. Must land after all T# tasks merge.**

**Goal:** F0 left a shim that accepts both flat metadata and the `agentflow:` sub-block. v0.7.0 only accepts the sub-block (with Mermaid presentation keys at the top level). Remove the shim, migrate every conformance fixture to the v0.7.0 form, and verify.

**Spec sections:** §3.2, §13.

**Files touched:**

- `agentflowDb.ts` — `readMetadata` now reads only from the documented location (no fallback). Wrong-location keys emit `METADATA_WRONG_LOCATION` diagnostic.
- `parser/agentflow.jison` — if the grammar accepted flat-form domain keys via permissive rules, tighten.
- `diagnostics.ts` — add `METADATA_WRONG_LOCATION`.
- `conformance/fixtures/**.mmd` + `**.expected.json` — migrate every fixture not yet migrated by T1–T7. Use the spec's §20 worked example as the canonical reference.

**Tests:**

- Add: a v0.6.0-style flat-metadata input emits `METADATA_WRONG_LOCATION` for each domain key at the wrong level.
- All existing conformance specs pass.
- Add a `getSemanticModel` regression test — `getSemanticModel()` is out of scope per spec §8 in the migration doc; if the code still exports it, decide whether to drop or keep as implementation detail (matches the spec choice to remove it).

**Done when:**

- No code path accepts a domain key at the top level.
- Every `.mmd` fixture is v0.7.0 form.
- Full `pnpm vitest run packages/mermaid/src/diagrams/agentflow` is green.
- `pnpm e2e` flowchart/agentflow-related specs pass (visual regression).

---

## Coordination notes

- **Branch all tasks off the `agentflow` branch after F0 merges.** Do not branch off `develop`.
- **Merge target is `agentflow` branch**, not `develop`. The whole v0.7.0 lift stays on the integration branch until the spec is final.
- **One PR per task.** Each PR is independently reviewable.
- **If a task discovers a spec ambiguity**, stop, surface the question to the spec author, and update `AGENTFLOW-SYNTAX.md` first. Do not invent.
- **Visual smoke test after F1.** Use `agent-browser` against `cypress/platform/knsv2.html` (which is currently in a v0.6.0 form locally — it'll need its own migration but is not blocking).
- **Open items from the spec** (instance-binding cardinality, directive-instance binding details, `connectorRef` severity) are explicitly out of scope for this round. If a task hits one, raise it but don't decide it.

---

## Quick-reference task summary

| ID  | Title                                   | Phase | Parallel-safe | Conflict region (agentflowDb.ts) |
| --- | --------------------------------------- | ----- | ------------- | -------------------------------- |
| F0  | `agentflow:` sub-block + dual-read shim | 0     | No (first)    | applicability table, read helper |
| T1  | `-.->` instance binding                 | 1     | Yes           | edge semantic, def removal       |
| T2  | `---` directive binding                 | 1     | Yes           | edge semantic, directives key    |
| T3  | `procs` → `src` only                    | 1     | Yes           | typeRef/templateRef removal      |
| T4  | `params` as YAML mapping                | 1     | Yes           | params parser                    |
| T5  | agent: memory/prompt/model              | 1     | Yes           | agent metadata                   |
| T6  | required connectors subgraph            | 1     | Yes           | connector synthesis              |
| T7  | removed/restricted keys                 | 1     | Yes           | applicability cleanup            |
| F1  | drop shim, migrate all fixtures         | 2     | No (last)     | read helper, all fixtures        |

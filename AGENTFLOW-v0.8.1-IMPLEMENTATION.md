# Agentflow v0.8.1 — Implementation Plan

|            |                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------- |
| **Spec**   | `AGENTFLOW-SYNTAX.md` v0.8.1 (2026-05-26)                                                      |
| **Code**   | `packages/mermaid/src/diagrams/agentflow/` — currently v0.7.0 baseline                         |
| **Status** | Draft — for review before any code is written                                                  |
| **Gap**    | The code skipped the v0.8.0 round entirely; this plan brings it directly from v0.7.0 → v0.8.1. |

> No code changes have been made. This document is the _implementation contract_ — once
> approved it becomes the work list.

---

## 1. Scope summary

The codebase implements roughly v0.7.0. v0.8.0 and v0.8.1 together remove a great deal
of surface area: every container except `flow`, every edge operator except three,
capability evaluation, type/template declarations, all five instance shapes and the
shape-based instancing mechanism, several diagnostics, several validators, and the
synthetic `typesGroup` / `templatesGroup` containers.

The bulk of this work is **deletions, not additions**:

- 7 of 8 container keywords go.
- 5 of 8+ edge semantic mappings go (and the `==>`, `~~`, and most marker variants go with them).
- 1 new edge operator is added (`-.-`) and 1 is repurposed (`-->` → "sequence").
- 5 instance shapes + the def-resolution machinery + 3 instance diagnostics go.
- 4 type/template diagnostic codes go; the `type` and `template` declaration keywords go.
- 4 capability-evaluation diagnostics + the validator + the spec file go.
- 4 REF*KIND*\* diagnostics go (with `procs`).
- 3 CONTAINER*EDGE*\* diagnostics go (with `==>` parameter binding).
- The synthesized-connector logic goes; a real `connector` keyword arrives.

The two real additions are:

- The `connector` keyword in the grammar.
- An `instruction` cross-cutting metadata key, valid everywhere.
- Edge ids + edge metadata addressable by id (`instruction` only).
- A new diagnostic for flow-level input validation.
- A new diagnostic for removed-shape usage (hard error tier).
- Shape aliases (`task`, `tool`, `input`, `decision`, `refdoc`, `action`).

---

## 2. By concept

The next section walks through the spec changes one by one. Each entry has the same
shape: **Current → Required → Change**.

### 2.1 Container keywords

**Current.** Eight container keywords accepted by `agentflow.jison` (lines 120–127):
`agent`, `flow`, `task`, `skill`, `testCase`, `directive`, `group`, `subgraph`. Each
parses identically and gets a `type` tag on `FlowSubGraph` in the DB.

**Required.** One container keyword: `flow`. Shape id `flowGroup`.

**Change.**

- Grammar: keep the `flow` production; delete the other seven keyword productions.
- DB: collapse the `addSubGraph()` type field to a single value; drop the `agent` /
  `task` / `skill` / `testCase` / `directive` / `group` / `subgraph` branches in the
  containment matrix and applicability table.
- Rename the container shape id from `agentGroup` (or whatever the code calls it) to
  `flowGroup`.
- `direction` overrides inside containers continue to work (no behavior change beyond
  the rename).

### 2.2 Edge operators

**Current.** Three lexer rules generate edges:

| Lexer rule                | What it matches            | Examples produced                           |
| ------------------------- | -------------------------- | ------------------------------------------- |
| `[xo<]?\-\-+[-xo>]\>`     | normal-stroke arrow family | `-->`, `--x`, `--o`, `<-->`, `o--o`, `-->>` |
| `[xo<]?\=\=+[=xo>]\s*`    | thick-stroke arrow family  | `==>`                                       |
| `[xo<]?\-?\.+\-[xo>]?\s*` | dotted-stroke arrow family | `-.->`, dotted variants                     |
| `\~\~[\~]+\s*`            | invisible edge             | `~~`                                        |

Semantic mapping (`computeEdgeSemantic()`, `agentflowDb.ts:1450–1485`) has eight cases:
control / data / governance / conformance / delegation / failure / association /
bidirectional.

**Required.** Three operators, three semantics:

| Operator | Semantic  | Marker           |
| -------- | --------- | ---------------- |
| `-->`    | sequence  | single arrow     |
| `-.-`    | reference | dotted, no arrow |
| `--x`    | failure   | X endpoint       |

**Change.**

- **Lexer:** add a new rule for `-.-` (dotted, non-directional, no arrow) — distinct
  from the existing `-.->` rule. Verify Jison ordering so the longer `-.->` doesn't
  silently match `-.-` followed by `>`.
- **Lexer:** delete the thick-arrow rule (`==>`) and the invisible rule (`~~`).
- **Lexer:** narrow the dotted-arrow rule so it accepts only `-.-` (no markers, no
  arrowhead). The old `-.->` form goes.
- **Lexer/parser:** narrow the normal-arrow rule so it accepts `-->` and `--x` only.
  Reject `--o`, `o--o`, `-->>`, `<-->` and other marker variants in the grammar; if
  rejection at the lexer is awkward, produce them then emit a new
  `EDGE_OPERATOR_UNSUPPORTED` diagnostic at the DB step. (Recommend grammar-level
  rejection — cleaner.)
- **`computeEdgeSemantic()`:** rewrite to a three-way switch. The names "control",
  "governance", "conformance", "delegation", "association", "bidirectional", "data"
  are all retired. "control" → "sequence". The reference edge uses a new operator and
  carries the "reference" semantic.
- **Marker-on-`-.-`:** if an author writes `a -.- b` with an endpoint marker, that's
  an error (the operator carries no direction).

#### 2.2.1 Edge labels

- `-->` accepts labels (existing behaviour — keep).
- `-.-` does **not** accept labels. Emit a Tier-1 diagnostic and ignore the label.
  New diagnostic: `REFERENCE_EDGE_LABEL_REJECTED`.
- `--x` accepts labels (no spec text forbids them; keep existing behaviour).

#### 2.2.2 Edge ids + metadata

**New.** An edge may carry an id and accept `instruction` metadata via the standard
`id@{ … }` form.

- **Lexer/grammar:** adopt the Mermaid edge-id syntax (`e1@-->`, `e1@-.-`, `e1@--x`).
  Exact form delegated to the parser team — this is a still-open item in the spec.
- **DB:** store edge ids on the edge record; resolve `id@{ … }` declarations against
  edges as well as nodes.
- **Applicability:** the "edge" row of the metadata applicability table permits only
  `instruction`. Any other key on an edge → `METADATA_KEY_MISAPPLIED`.

### 2.3 Node shapes

**Current.** The shape catalogue (transformData.ts + agentflowDb.ts) accepts:

- Flowchart canon: `square` / `rect`, `round`, `diamond`, `circle`, `stadium`,
  `ellipse`, `subroutine`, `cylinder`, `odd`.
- Agentflow extensions: `hexagon` / `hex`, `trapezoid`, `inv_trapezoid`, `lean_right`,
  `lean_left`, `doc`, `lin-doc` / `lined-document`, `procs`, `double-circle`, `in-out`,
  `terminal`.
- Per-kind instance shapes: `tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`.
- Presentation: `typeDeclaration`, `collapsedGroup`.

No semantic aliases (`task`, `tool`, `input`, etc.).

**Required.** Shape catalogue:

| Alias (canonical) | Mermaid ID             | Role                         |
| ----------------- | ---------------------- | ---------------------------- |
| `task`            | `roundedRect` / `rect` | task (default)               |
| `tool`            | `subroutine`           | tool node                    |
| `input`           | `lean-right`           | input value                  |
| `decision`        | `diamond`              | decision gate                |
| `refdoc`          | `lin-doc`              | reference document           |
| `action`          | `hexagon`              | call to another flow via MCP |
| `connector`       | (Agentflow)            | connector keyword node       |
| —                 | `collapsedGroup`       | collapsed flow               |

Everything else is a hard error.

**Change.**

- Add the alias→canonical mapping to the shape resolver. Both `shape: tool` and
  `shape: subroutine` parse identically.
- Hard-error these shapes (new diagnostic `SHAPE_REMOVED` at Tier-1/error):
  `doc`, `stadium`, `terminal`, `circle`, `trapezoid`, `inv_trapezoid`,
  `double-circle`, `typeDeclaration`, `procs`, `tag-rect`, `delay`, `lin-rect`,
  `win-pane`, `curv-trap`, `cylinder`, `ellipse`, `odd`, `lean_left`.
- Drop `lean_left` and `in-out` from the catalogue (not in v0.8.1). Drop `square`
  (alias of `rect`).
- Repurpose `hexagon`: no longer a condition / classification source. Drop the
  `HEXAGON_MULTI_BRANCH` diagnostic.
- The `lin-doc` canonical name stays; `refdoc` is the recommended alias.
- `round` (no border-radius spec) — clarify with the team; treat as alias of `rect`
  or hard-error. Recommend: alias of `rect` to keep authoring forgiving.

### 2.4 Metadata applicability

**Current.** The applicability table (agentflowDb.ts:235–263) keys metadata by element
kind. Cross-cutting / universal keys are listed at lines 189–211 (`description`,
`shape`, `label`, `labelType`, `def`, `view`, `icon`, `img`, `w`, `h`, `class`,
`style`, `form`, `pos`, `animate`, `animation`, `curve`, `constraint`).

**Required.** Per spec §10:

| Element                  | Valid keys                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `flow`                   | `model` (optional), `memory`, `params`, `returns`                                                              |
| task (default)           | `execution`, `params`, `returns`                                                                               |
| tool (`shape: tool`)     | `params`, `returns`, `retry`, `cache`, `validate`, `handler`, `output`, `transport`, `command`, `connectorRef` |
| action (`shape: action`) | `params`, `returns`, `connectorRef`                                                                            |
| connector                | `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`                                       |
| input (`shape: input`)   | `type`, `value`                                                                                                |
| refdoc                   | (presentation only; cross-cutting keys apply)                                                                  |
| edge                     | `instruction` (only)                                                                                           |

Cross-cutting (any authored element except edges for `description`): `description`,
`instruction`.

**Change.**

- Remove rows: agent, skill, testCase, directive, artifact, reference (procs).
- Add rows: action, edge, input (replaces artifact-for-lean-right), refdoc.
- Remove keys everywhere: `permits`, `requires`, `deny`, `fallbacks`, `strategy`,
  `rule`, `severity`, `context`, `assert`, `expects`, `typeRef`, `templateRef`, `src`,
  `example`, `def`, `prompt`. Some of these may not have existed under those names —
  delete whatever did.
- Add cross-cutting `instruction`.
- Remove from the universal list: `def`, `constraint`, `form`, `pos`, `animate`,
  `animation`, `curve` (unless any of these are explicitly retained — confirm with the
  team).
- Update `METADATA_KEY_MISAPPLIED` to point at the new table.

### 2.5 Metadata wrapper

**Current.** Flat `@{ … }` (already correct since v0.7.0).

**Required.** Flat. No change.

### 2.6 Instancing

**Current.** Five per-kind instance shapes (`tag-rect`, `delay`, `lin-rect`,
`win-pane`, `curv-trap`) + a `def:` metadata key + the `resolveInstances()` method
(agentflowDb.ts:1877+) + three diagnostics (`INSTANCE_DEF_MISSING`,
`INSTANCE_DEF_CYCLE`, `INSTANCE_KIND_MISMATCH`).

**Required.** No in-diagram instancing. Reuse goes through MCP-callable `action` nodes.

**Change.**

- Remove the five instance shapes (handled in §2.3 — hard error).
- Remove the `def:` metadata key from the applicability table.
- Delete `resolveInstances()` and everything it touches in the model projection
  (`resolvedInstanceMetadata` etc.).
- Delete `INSTANCE_DEF_MISSING`, `INSTANCE_DEF_CYCLE`, `INSTANCE_KIND_MISMATCH`
  diagnostics from `diagnostics.ts`.
- Delete `agentflow-instance-resolution.spec.ts`.

### 2.7 `connector` keyword

**Current.** No keyword. Connectors are _designated_ — any node carrying connector
metadata (`protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`)
becomes one. The DB synthesises a `connectors` subgraph grouping
(agentflowDb.ts:2832–2967).

**Required.** Real keyword:

```
connector <id>["Label"]
<id>@{ protocol: "...", endpoint: "..." }
```

Top-level leaf — no `end`.

**Change.**

- **Grammar:** add a `connector` keyword production. Tracked as a still-open parser
  feasibility item in the spec — if Jison can't accept it, the fallback is a
  designated node group (we'd revisit this).
- **DB:** add a `connectors` collection on the model, separate from `nodes` and
  `subGraphs`. A `connector` declaration produces an entry there.
- **Synthesis:** remove the `connectorsMeta` synthesis path. The synthetic
  `connectors` subgraph id stops being reserved.
- **`connectorRef` resolution:** prefix-before-first-dot is the connector id; the
  remainder is opaque. The prefix must resolve to a declared connector; the operation
  is not validated.
- **Diagnostics:** `CONNECTOR_REF_UNRESOLVED` stays. `CONNECTOR_REF_NOT_A_CONNECTOR`
  is rephrased: a `connectorRef` target must be a declared connector (not a node with
  connector-shaped metadata).

### 2.8 Capability evaluation

**Current.** Implemented. `permits` / `requires` / `deny` metadata + four diagnostics
(`CAPABILITY_LIST_LEGACY_STRING`, `CAPABILITY_MISSING`, `CAPABILITY_DENIED`,
`CAPABILITY_INVOCATION_NO_AGENT`) + the validator + the spec file
`agentflow-capability-evaluation.spec.ts`.

**Required.** Gone. Access control is the runtime's job.

**Change.**

- Remove `permits`, `requires`, `deny` from the applicability table (done in §2.4).
- Delete the capability-evaluation validator.
- Delete the four `CAPABILITY_*` diagnostic codes from `diagnostics.ts`.
- Delete `agentflow-capability-evaluation.spec.ts`.

### 2.9 Shared state

**Current.** `reads` / `writes` not implemented. No `state` block.

**Required.** No `reads` / `writes` (removed in v0.8.1). No `state` block.

**Change.** None — the code is already aligned. Add prose to the model export's
top-of-file comment noting that data flow is implicit; do not introduce reads/writes.

### 2.10 Type / template declarations

**Current.** Full support:

- `type Foo` / `type Foo = Expr` / `type Foo = Record { … }` grammar productions.
- `template %Name { fieldname: Type … }` grammar production.
- `typesGroup` and `templatesGroup` synthetic containers.
- Reference keys `typeRef` / `templateRef`.
- Diagnostics: `DUPLICATE_ID_TYPE`, `DUPLICATE_ID_TEMPLATE`, `REFERENCE_UNRESOLVED`
  (for typeRef/templateRef), `REF_KIND_CONFLICT`, `REF_KIND_LEGACY_DEPRECATED`,
  `REF_KIND_LEGACY_AMBIGUOUS`, `REF_KIND_LEGACY_UNRESOLVED`.

**Required.** None of the above. Types / templates appear only as **strings** in
metadata values: `params: { city: String }`, `returns: "CoffeeCopy"`,
`output: "triage_result"`.

**Change.**

- **Grammar:** delete the `type` and `template` declaration productions and lexer
  rules. Delete the record-form grammar.
- **DB:** delete `parseTypeDeclaration()`, `parseTemplateDeclaration()`,
  `typeDeclarations`, `templateDeclarations`. Delete synthesised `typesGroup` /
  `templatesGroup` subgraphs.
- **Reference resolution:** delete the typeRef / templateRef resolution paths. The
  `connectorRef` resolution path stays.
- **Diagnostics:** delete `DUPLICATE_ID_TYPE`, `DUPLICATE_ID_TEMPLATE`, all four
  `REF_KIND_*` codes. `REFERENCE_UNRESOLVED` becomes connectorRef-only (or rename to
  `CONNECTOR_REF_UNRESOLVED` and fold the cases).
- **`RESERVED_SYNTHETIC_ID`:** removes `typesGroup` / `templatesGroup` from the
  reserved set. With `connector` becoming a real keyword, `connectors` may stay
  reserved or be released — decision needed.

### 2.11 Directives / constraints

**Current.** `directive` is a container keyword; `rule` / `severity` / `context` keys
are accepted (validated only as metadata applicability). No constraint evaluation.

**Required.** Removed from core (deferred, may return in a later draft).

**Change.**

- Grammar: delete the `directive` keyword production (covered in §2.1).
- Applicability: delete the directive row (covered in §2.4).
- No validator existed; nothing else to delete.

### 2.12 Removed-shape diagnostic

**Current.** `SHAPE_UNSUPPORTED` exists (probably as a warning).

**Required.** Removed shapes are _hard errors_ in v0.8.1, not permissive ignores.

**Change.**

- Either retier `SHAPE_UNSUPPORTED` to error, or add a new code `SHAPE_REMOVED` at
  error tier for the specific blacklist in §2.3 and keep `SHAPE_UNSUPPORTED` (warn)
  for unknown shapes. Recommend the latter — clearer signal at author time.

### 2.13 Flow-level input validation

**Current.** None.

**Required.** A flow whose tree contains no input node produces a diagnostic (warning
before v1.0, error in v1.0). At run-time, the runtime / editor prompts the user for
any missing input values before execution.

**Change.**

- New validator: walk the flow tree; if no descendant has resolved shape `input`
  (canonical `lean-right`), emit `FLOW_NO_INPUT` at warn tier.
- New diagnostic code `FLOW_NO_INPUT`.

### 2.14 Cross-cutting `instruction`

**Current.** The current applicability table does not list `instruction`. `prompt`
may or may not be informally tolerated.

**Required.** `instruction` is valid on every authored element except edges (where
it's the _only_ permitted key — see §2.2.2).

**Change.**

- Add `instruction` to the universal keys.
- If `prompt` is currently accepted: emit a soft deprecation warning
  (`METADATA_KEY_LEGACY_PROMPT`) or treat as alias of `instruction` — decision
  needed.

### 2.15 Container-edge data-flow diagnostics

**Current.** `CONTAINER_EDGE_NO_CONTRACT`, `CONTAINER_EDGE_LABEL_REQUIRED`,
`CONTAINER_EDGE_LABEL_UNRESOLVED` validate `==>` data-flow edges crossing container
boundaries with named-parameter labels.

**Required.** Data flows implicitly; `==>` is gone; parameter labels on edges are not
a thing.

**Change.** Delete all three diagnostics + the associated validator passes.

### 2.16 Top-level keyword

**Current.** `agentflow` (correct).

**Required.** `agentflow` (correct).

**Change.** None.

---

## 3. By file — change manifest

The list below maps the conceptual changes onto the files that need editing.

### `parser/agentflow.jison`

- Drop container keyword productions for: `agent`, `task`, `skill`, `testCase`,
  `directive`, `group`, `subgraph`. Keep `flow`. (§2.1)
- Drop `type` and `template` declaration productions and their lexer rules. (§2.10)
- Add `connector` keyword production (top-level leaf, no `end`). (§2.7)
- Edge operator rules: add `-.-`; remove `==>`, `~~`, `-.->`, marker variants of
  `-->` except `--x`. (§2.2)
- Add edge id syntax (Mermaid `e1@--` form). (§2.2.2)

### `agentflowDb.ts`

- Collapse container types to one: `flow`. Rename internal shape id to `flowGroup`.
- Drop the per-kind instance machinery: `INSTANCE_SHAPE_TO_KIND`,
  `resolveInstances()`, `resolvedInstanceMetadata`. (§2.6)
- Drop `parseTypeDeclaration`, `parseTemplateDeclaration`, `typeDeclarations`,
  `templateDeclarations`. (§2.10)
- Drop the synthetic `typesGroup`, `templatesGroup` insertion path. (§2.10)
- Drop the synthesised-connector path (`connectorsMeta`, agentflowDb.ts:2832–2967).
  Add a real connectors collection. (§2.7)
- Drop capability-evaluation validator. (§2.8)
- Rewrite `computeEdgeSemantic()` to the three-way switch. (§2.2)
- Rewrite the metadata applicability table to match §2.4.
- Add shape-alias resolution (alias → canonical). (§2.3)
- Add `instruction` to the universal cross-cutting keys; remove the deprecated
  cross-cutting keys per §2.4.
- Add the flow-no-input validator. (§2.13)
- Edge metadata: thread edge ids through; gate `instruction`-only applicability on
  edges. (§2.2.2)

### `diagnostics.ts`

**Delete:**

- `HEXAGON_MULTI_BRANCH`
- `INSTANCE_DEF_MISSING`, `INSTANCE_DEF_CYCLE`, `INSTANCE_KIND_MISMATCH`
- `DUPLICATE_ID_TYPE`, `DUPLICATE_ID_TEMPLATE`
- `REF_KIND_CONFLICT`, `REF_KIND_LEGACY_DEPRECATED`, `REF_KIND_LEGACY_AMBIGUOUS`,
  `REF_KIND_LEGACY_UNRESOLVED`
- `CAPABILITY_LIST_LEGACY_STRING`, `CAPABILITY_MISSING`, `CAPABILITY_DENIED`,
  `CAPABILITY_INVOCATION_NO_AGENT`
- `CONTAINER_EDGE_NO_CONTRACT`, `CONTAINER_EDGE_LABEL_REQUIRED`,
  `CONTAINER_EDGE_LABEL_UNRESOLVED`

**Add:**

- `SHAPE_REMOVED` (error tier) — used for the explicit removed-shape blacklist.
- `REFERENCE_EDGE_LABEL_REJECTED` (warn → Tier-1 in spec).
- `EDGE_OPERATOR_UNSUPPORTED` (error tier) — for `==>`, `~~`, marker variants.
- `FLOW_NO_INPUT` (warn now, error in v1.0).
- `METADATA_KEY_LEGACY_PROMPT` (warn) — only if we decide to alias `prompt` →
  `instruction` rather than silently drop.

**Modify:**

- `SHAPE_UNSUPPORTED` — narrow scope to "unknown shape name", since `SHAPE_REMOVED`
  handles the explicit blacklist.
- `CONNECTOR_REF_NOT_A_CONNECTOR` — wording updates to point at the new keyword
  rather than at config-field designation.
- `REFERENCE_UNRESOLVED` — fold to connectorRef-only path or rename.
- `RESERVED_SYNTHETIC_ID` — drop `typesGroup` / `templatesGroup` from the reserved
  list.

### `types.ts`

- Drop `permits` / `requires` / `deny` / `fallbacks` / `strategy` / `rule` /
  `severity` / `context` / `assert` / `expects` / `typeRef` / `templateRef` / `src` /
  `example` / `def` / `prompt` from `NodeMetadata` (and similar).
- Add `instruction`, `connectorRef` already exists.
- Drop `TypeDeclaration` / `TemplateDeclaration` types.
- Drop the five instance-shape literal values from any shape union.
- Add `'flow'` as the single container type.

### `transformData.ts`

- Drop the obsolete shape entries from the transform table.
- Add alias→canonical resolution.

### `renderer.ts`, `styles.ts`

- Rename `agentGroup` → `flowGroup` styling. Audit selector usage.
- Update the hexagon styling: it's now an `action`, possibly with a distinguishing
  badge.

### `parser/*.spec.ts` and `conformance/`

Delete:

- `agentflow-capability-evaluation.spec.ts`
- `agentflow-instance-resolution.spec.ts`
- `agentflow-hexagon-branching.spec.ts`
- `agentflow-reference-kinds.spec.ts`
- The portions of `agentflow-mappings.spec.ts` covering removed shapes.
- The portions of `agentflow-containment-matrix.spec.ts` covering removed containers.
- The portions of `agentflow-edge-semantic.spec.ts` covering removed operators.

Add:

- `agentflow-flow-input-validation.spec.ts` — new validator.
- `agentflow-shape-aliases.spec.ts` — alias→canonical equivalence.
- `agentflow-action-shape.spec.ts` — repurposed hexagon.
- `agentflow-reference-edge.spec.ts` — `-.-` operator, no labels, refdoc attachment.
- `agentflow-edge-metadata.spec.ts` — edge ids + `instruction` applicability.
- `agentflow-connector-keyword.spec.ts` — real keyword + connectorRef resolution.

Update:

- `agentflow-connector-validator.spec.ts` — track the keyword change.
- `agentflow-metadata-applicability.spec.ts` — full table rewrite.
- `agentflow-container-edge-boundary.spec.ts` — `==>` is gone; drop or repurpose.
- `agentflow-mappings.spec.ts` — alias mappings.

### `conformance/`

Rebuild the fixture set per the new pattern list (spec §16): one valid fixture per
pattern (tool call, refdoc, decision, failure, connector, parallel, action) and the
negative fixture set: removed shape used, removed edge operator, removed container
keyword, unresolved `connectorRef`, flow with no input, duplicate id, label on `-.-`,
non-`instruction` key on edge, label on reference edge.

---

## 4. Suggested phasing

The work falls naturally into four phases. Each phase is a small PR.

### Phase 1 — Grammar surgery (parser only)

- Drop the seven obsolete container keywords.
- Drop `==>`, `~~`, `-.->`, marker variants.
- Add `-.-`.
- Drop `type` / `template` declarations.
- Add `connector` keyword.

Tests for this phase: parser-level acceptance/rejection. The DB / diagnostics layer
will still be v0.7.0; tests in those layers will be temporarily broken — acceptable
mid-phase.

### Phase 2 — DB model + applicability

- Container collapse → `flow` only.
- Shape alias resolution + the removed-shape blacklist.
- Edge semantic rewrite.
- Metadata applicability rewrite.
- `instruction` cross-cutting + edge metadata.
- Connector model + `connectorRef` resolution off the keyword.

This is the biggest single change. Push the DB tests forward together.

### Phase 3 — Diagnostics + validators

- Delete the obsolete diagnostics and validators.
- Add `SHAPE_REMOVED`, `EDGE_OPERATOR_UNSUPPORTED`, `REFERENCE_EDGE_LABEL_REJECTED`,
  `FLOW_NO_INPUT`.
- Update wording on retained ones.

### Phase 4 — Test sweep + conformance

- Delete the obsolete spec files.
- Add the new spec files.
- Rebuild the conformance fixture set.
- Run `vitest --run` and unblock anything left.

---

## 5. Open implementation questions

These need a decision before Phase 1 starts.

1. **`connector` parser feasibility.** Spec lists this as a still-open item ("can the
   parser handle it?"). If Jison can't accept a new top-level keyword cleanly, the
   fallback is a designated node group. Recommendation: ask the parser team early.

2. **Edge-id syntax.** Spec defers to the Mermaid edge-id grammar. Confirm the exact
   form (`e1@--` prefix) and that the lexer can disambiguate from the `@{ … }` node
   metadata syntax.

3. **`prompt` → `instruction` migration.** Three options:
   - (a) Silently rename in the parser (`prompt: …` becomes `instruction: …`).
   - (b) Emit a deprecation warning (`METADATA_KEY_LEGACY_PROMPT`).
   - (c) Hard-error.
     Recommend (b) for the pre-1.0 window, (c) at v1.0.

4. **Flow-shape id naming.** `flowGroup` is the proposed shape id. Confirm no
   clash with the Mermaid flowchart diagram's internal shape ids.

5. **`round` shape.** Not mentioned in v0.8.1. Options: alias of `rect`, alias of
   `roundedRect`, or removed. Recommendation: alias of `rect` (forgiving).

6. **`connectors` synthetic id.** With `connector` becoming a real keyword, the
   synthesized `connectors` subgraph goes away. The id `connectors` is then released
   as a user-usable id (or kept reserved for forward compat). Recommendation: keep
   reserved through pre-1.0.

7. **Edge endpoint-marker variants.** `<-->`, `o--o`, `--o`, `-->>` etc. Hard-error
   at the lexer (preferred) or accept and emit `EDGE_OPERATOR_UNSUPPORTED`?
   Recommend hard-error at the lexer — cleaner for authors.

8. **`description` on edges.** Spec restricts edges to `instruction` only. Should
   `description` follow the cross-cutting rule as everywhere else? Spec says no —
   only `instruction`. Confirm.

---

## 6. What is _not_ changing

For the record, so reviewers can confirm:

- The top-level `agentflow` keyword.
- Frontmatter YAML (`---\nconfig: …\n---`).
- `direction TB/BT/LR/RL/TD` overrides (still work inside `flow`).
- The diamond inline syntax `id{Decision Text}`.
- The `&` fan-out operator.
- Flat `@{ … }` metadata (no `agentflow: { … }` sub-block).
- The frontmatter / interactivity / accessibility / styling sub-systems.
- Synthetic-id reservation behaviour (with adjusted set, §2.10).
- `description` as a cross-cutting key.
- `connectorRef` resolution mechanics (the rules update, the field itself stays).

---

## 7. Risk + sequencing notes

- **Phase 1 is the most disruptive** — once the grammar changes, the existing
  v0.7.0 test suite will not pass. Plan to gate Phase 1 behind a feature branch.
- **Capability evaluation deletion** touches the bridge / runtime contracts if those
  consumers use the diagnostic codes. Flag downstream before deleting.
- **The connector keyword** is the one new grammar production. If parser feasibility
  is a blocker, we can ship the rest first and gate `connector` on a follow-up.
- **The five instance shapes deletion** is large but quarantined — their
  resolveInstances pipeline doesn't touch the rest of the model projection.

---

## 8. Estimated effort

Rough order-of-magnitude. Each "day" = one engineer-day.

| Phase                        | Effort        |
| ---------------------------- | ------------- |
| 1 — Grammar                  | 2 days        |
| 2 — DB model                 | 4 days        |
| 3 — Diagnostics + validators | 1.5 days      |
| 4 — Tests + conformance      | 2 days        |
| **Total**                    | **~9.5 days** |

This excludes runtime / bridge work that depends on the spec.

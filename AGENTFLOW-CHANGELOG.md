# Agentflow Syntax — Changelog

> **Status:** Pre-1.0 working history. Split out of `AGENTFLOW-SYNTAX.md` in v0.8.0 so the
> main spec describes only the current language. This file is valuable while the language is
> still moving; it is scheduled for removal at v1.0 (CMT5, CMT19). Full historical detail for
> v0.7.0 and earlier is preserved in the archived `AGENTFLOW-SYNTAX_0.7.0.md` and
> `AGENTFLOW-SYNTAX_0.6.0.md`.

## Revision History

| Version | Date       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0   | 2026-03-14 | Initial syntax reference: `agent`, `flow`, `task` containers; node shapes; edge types; type declarations; templates; styling; accessibility; complete example.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0.2.0   | 2026-03-16 | Add diamond shape for decisions; document inline `{text}` syntax; add Decision / Alternate Flow pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 0.3.0   | 2026-03-25 | Add `skill`, `testCase`, `directive` containers; `trapezoid`, `inv-trapezoid`, `double-circle` shapes; template sections; extended metadata; Directive, Lesson, Fallback, MCP, Parallel patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 0.4.0   | 2026-03-25 | Add definition/instance pattern with 5 instance shapes (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`) and a `def` binding field. Formalize as a versioned spec.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 0.5.0   | 2026-04-21 | Semantic tightening: shape-based tool model (§8), connectors-as-metadata (`connectorRef`), canonical edge semantics, identifier resolution, instance inheritance, container-edge binding, capability evaluation, metadata applicability table. Split reference kinds into `typeRef` / `templateRef` / `src`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 0.6.0   | 2026-04-27 | Additive: `value` and `example` keys on data-artifact nodes (`lean-right`, `doc`, `lin-doc`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 0.7.0   | 2026-05-13 | Pre-1.0 draft: Agentflow domain metadata moves under an `agentflow: { … }` sub-block; instance binding is `-.->` only (no `def:`); `---` is general semantic association; `procs` is external-file `src` only; connectors live in a required top-level `subgraph connectors[…]`; `params` is a YAML mapping; tool metadata uniformly optional.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0.8.0   | 2026-05-25 | Aggressive simplification per the AI-authored / human-corrected review. Drop the `agentflow:` wrapper; collapse containers to `agent` only (`flow` folds in, `task` becomes a node, `skill`/`testCase`/`directive` removed); cut edges to three (`-->`, `--x`, `---`); remove data-flow edges in favour of a shared stateful object; introduce a real `connector` keyword; remove `type`/`template` declarations (now metadata); drop constraints/directives from core; unify instances under an `instance of` keyword; split diagnostics/conformance and this changelog into separate documents.                                                                                                                                                                                                                                                                                                                                                       |
| 0.8.1   | 2026-05-26 | Follow-up cuts and renames from the 2026-05-26 syntax meeting. Container renamed `agent` → `flow`. `reads`/`writes` arrays removed (data passes between steps implicitly). `instance of` keyword removed (reuse goes through MCP-callable actions). `procs` external-file shape removed. Reference edge moves from `---` to `-.-` (dotted, non-directional). Shape aliases introduced (`task`, `tool`, `input`, `decision`, `refdoc`, `action`). `hexagon` repurposed as `action`; standalone classification pattern removed. `prompt` renamed to `instruction` and promoted to a cross-cutting key. Dotted form of `connectorRef` is now canonical. Edges may be addressed by id and carry an `instruction`. Flow-level input/output validation. Removed shapes become hard syntax errors. Capability evaluation removed: `permits` / `requires` / `deny` and the Capability Evaluation section are gone — access control is delegated to the runtime. |
| 0.8.2   | 2026-06-03 | Additive + fixes; nothing removed or renamed. Inline `@{ … }` metadata may be attached on a flow header (`flow <id>@{ … }` / `flow <id>["Title"]@{ … }`), equivalent to the standalone `<id>@{ … }` form. Fixes: genuine self-loop edges (`a --> a`) now render; edge `instruction` metadata is carried into the layout IR (not just the parser DB); editor position-mappings corrected — inline `@{ … }` blocks map to their node rather than the enclosing flow, and sibling flow containers no longer report overlapping line spans.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 0.8.3   | 2026-07-02 | Additive. New `global … end` scope block (§3.5): nodes referenced inside it are globally scoped and keep no parent even when referenced inside a `flow … end` block — the explicit opt-out of textual flow membership. The block takes no id/title/metadata and renders nothing itself; edges declared inside are ordinary top-level edges; order-independent; usable inside a flow as an escape hatch. `global` becomes a reserved word (no longer usable as a bare node id). (#80)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

---

## v0.8.3 — 2026-07-02 (current)

Additive follow-up to v0.8.2. One new construct, nothing removed or renamed.

**Authoring addition**

- **The `global` scope block.** `global … end` globally scopes every node id referenced
  inside it: the node keeps no parent even when referenced inside a `flow … end` block,
  opting out of the textual membership rule that would otherwise pull it into the flow's
  container. The block takes no id, title, or metadata and emits no container of its
  own. Edges declared inside are ordinary top-level edges. The exemption is independent
  of declaration order, and a `global` block nested inside a flow anchors the listed ids
  at the root scope. `global` becomes a reserved word, consistent with `flow`,
  `connector`, and `end`. (#80)

## v0.8.2 — 2026-06-03

A small, backward-compatible follow-up to v0.8.1. No syntax is removed or renamed.

**Authoring addition**

- **Inline metadata on flow headers.** `flow <id>@{ … }` and `flow <id>["Title"]@{ … }`
  attach container metadata on the declaration line, as an alternative to the standalone
  `<id>@{ … }` form after `end`. Both resolve to the same subgraph metadata and obey the
  same §10 applicability rules; a header block and a later `<id>@{ … }` for the same flow
  merge. (#63)

**Fixes**

- Self-loop edges authored as `a --> a` are no longer dropped and now render. (#58)
- Edge `instruction` metadata (§5.3) declared via an edge id is now carried into the
  rendered/compiled layout data, not just the parser DB. (#62)
- Editor position-mapping: inline `@{ … }` blocks now map to their node rather than the
  enclosing flow (#60), and sibling flow containers no longer report overlapping line
  spans (#59). Tooling/cursor-resolution only — no authoring change.

**Parser / semantics boundary**

- The parser no longer performs property-level metadata validation or semantic checks.
  It carries all authored metadata faithfully and reacts only to `shape` (unknown-shape)
  and `view` (collapsed). Applicability (§10), connector-ref resolution (§8.1),
  containment (§3.3), edge-endpoint semantics (§5.1), flow-input (§10.2), and
  identifier-namespace diagnostics move to the semantics module. The diagnostic IDs remain
  the shared vocabulary; they are simply emitted downstream now, not by the parser. (#64)

## v0.8.1 — 2026-05-26

v0.8.1 follows up on v0.8.0 with another round of cuts and renames driven by the
2026-05-26 syntax meeting. The principle is unchanged: Agentflow is a canonical format an
LLM authors and a human corrects; verbosity is acceptable, ambiguity and redundant
concepts are not.

### Container

- **`agent` → `flow`.** The `agent` framing was judged too personality-loaded and too
  implementation-coupled. A flow is the single container kind. Tasks are still the
  default node.

### Shared state

- **`reads` / `writes` arrays removed.** Data passes between steps implicitly; if a step
  needs to assert what it requires or produces, it says so in its `instruction`. The
  shared-state _model_ survives in prose; the bookkeeping syntax is gone.

### Instancing

- **`instance of` keyword removed.** Reuse happens through MCP — a flow exposed as an
  MCP-callable tool is invoked from another flow via an action node. No
  definition/instance dual nature; no instance inheritance to settle. The matching
  open-item (v0.8.0 #2) is closed by removal.

### External-file references

- **`procs` shape removed.** Cross-flow references go through MCP for the alpha.

### Edges

- **Reference edge: `---` → `-.-`.** Dotted, non-directional. More visually distinct
  from sequence; more honest about meaning. Labels still rejected. Final edge set:
  `-->` sequence, `-.-` reference, `--x` failure.
- **Edge metadata.** An edge may be addressed by id and given an `instruction` via the
  normal `id@{ ... }` form. Only `instruction` is permitted on edges in v0.8.1.

### Shape vocabulary

- **Aliases introduced.** `task` (→ `roundedRect`), `tool` (→ `subroutine`), `input`
  (→ `lean-right`), `decision` (→ `diamond`), `refdoc` (→ `lin-doc`), `action`
  (→ `hexagon`). The aliases are the recommended authoring names; the underlying
  Mermaid shape IDs remain accepted.
- **`hexagon` repurposed as `action`.** The standalone "condition / classification
  source" role is removed; the classification/taxonomy pattern goes with it.

### Metadata

- **`prompt` → `instruction`.** Renamed across the spec, and promoted to a
  **cross-cutting** key valid on every authored element (like `description`).
- **`connectorRef` dotted form canonical.** `connectorRef: "slack.replyToThread"` is the
  expected authoring shape; the dotted prefix names the connector and implies its
  presence in the diagram. Bare-id form is still accepted.

### Validation

- **Flow-level input/output check.** A flow whose tree contains no input node produces a
  diagnostic. Inputs are collected before execution; the runtime/editor prompts the user
  for any missing values.
- **Removed shapes are syntax errors.** `doc`, `stadium`, `circle`, `trapezoid` /
  `inv-trapezoid`, `double-circle`, `typeDeclaration`, `procs`, and the five per-kind
  instance shapes raise a hard diagnostic, not a permissive ignore.

### Capabilities

- **`permits`, `requires`, `deny` and the Capability Evaluation section removed.** The
  v0.8.0 §17 Capability Evaluation section is gone; the three metadata keys with it.
  Access control is the runtime's responsibility — which connectors are wired up, which
  tools are exposed to which flow, etc. The LLM picks tools at invocation time from the
  set it is given. The concept may return in a later draft if a concrete need surfaces.

### Open questions carried forward

1. `connector` keyword parser feasibility (was v0.8.0 #3).
2. Whether constraints/directives return (was v0.8.0 #4).
3. Exact edge-id syntax (delegated to the Mermaid parser team).

### Closed since v0.8.0

- Shared-state binding syntax (closed by removal — was v0.8.0 #1).
- Instance inheritance (closed by removal of `instance of` — was v0.8.0 #2).

---

## v0.8.0 — 2026-05-25

The framing the review settled on is now the design premise: Agentflow is a **canonical
format an LLM authors and a human corrects** (CMT1, CMT2). Verbosity is acceptable;
ambiguity and redundant, near-synonymous concepts are not. v0.8.0 is **aggressive cutting**.

One notable override of the review prose: where the reviewer often said "keep," the human
comments said "cut" — most visibly the v0.7.0 `agentflow: {}` wrapper, which the review's
Critical Issue 2 wanted to keep but CMT6 removes.

### Metadata

- **Removed the `agentflow: { … }` wrapper** (CMT6). Domain keys return to the top level of
  `@{ … }`, sharing one flat level with Mermaid presentation keys. This reverses the central
  v0.7.0 change.
- **Shape is semantic, and that is accepted** (CMT3). The spec no longer frames "meaning in
  the shape" as a problem — a `subroutine` _is_ a tool, a `lean-right` _is_ an input.

### Containers — collapse to one

- **`agent` is the only container** (CMT22 "keep, delete the rest"). It can render as a
  group _or_ an instance (CMT20).
- **`flow` folds into `agent`** (CMT10, CMT22). The composable-unit role moves onto `agent`.
- **`task` is demoted from a container to a node** — the default rounded-rectangle node
  (CMT9, CMT25, CMT38).
- **`skill` removed** (CMT9, CMT11), **`testCase` removed** (CMT22), **`directive` container
  removed** (CMT22), **`subgraph` dropped from core** (legacy).
- **`type` / `template` are no longer syntax** (CMT21): the keyword declarations,
  `typesGroup` / `templatesGroup` (CMT23, CMT24), and the `typeDeclaration` shape (CMT26)
  are deleted. Type/template information lives entirely in metadata.

### Node shapes

- **Kept:** `roundedRect` / `rect` (now a task; CMT25, CMT38), `subroutine` (tool; CMT27),
  `lean-right` (input; CMT29), `lin-doc` (reference doc; CMT30), `procs` (external file;
  CMT31), `hexagon` (CMT32), `diamond` (CMT34).
- **`circle` → `connector`** (CMT33).
- **Skipped:** `doc` (CMT28; data now lives in shared state), `trapezoid` / `inv-trapezoid`
  (CMT35, CMT36), `double-circle` (CMT37), `typeDeclaration` (CMT26), `stadium` / `terminal`
  (cut), and the five per-kind instance shapes (replaced by the `instance of` keyword).

### Edges — three operators

- **`-->`** kept, reframed as **sequence** (CMT40).
- **`--x`** failure kept (CMT44).
- **`---`** association kept; primary use is reference-document attachment; **labels rejected**
  (CMT7, CMT8, CMT45).
- **`==>` data flow REMOVED** (CMT41) — data is shared via a stateful object.
- **`-.->` instance binding REMOVED** — instancing moves to the `instance of` keyword.
- **Skipped:** `--o` conformance (CMT42), `-->>` delegation (CMT43), `o--o` bidirectional
  (CMT47).

### Architectural shift — shared state

- **No data-flow edges.** Agents and tasks share data through a single **shared stateful
  object** (CMT41), declared per step with provisional `reads` / `writes` arrays. This is the
  most consequential single change; the exact binding syntax remains open.

### Instances & references — one mechanism

- **Instances unify under an `instance of` keyword** (CMT15, CMT39) — e.g.
  `agent007 instance of MI5Agent` — regardless of kind, with a visual indicator showing
  what the node is an instance of. The five per-kind instance
  shapes and the `-.->` edge are gone. Instance **inheritance is deferred** (CMT17).

### Connectors

- **Real `connector` keyword** (CMT13, CMT14), replacing the magic top-level
  `subgraph connectors[…]`. Tools still bind via `connectorRef`.

### Constraints / directives

- **Dropped from core.** With the `directive` container and the `trapezoid` shape both gone,
  the constraint concept is removed for v0.8.0. It may return in a later draft — likely as a
  metadata field on the constrained element.

### Process

- **Changelog split out** of the main syntax doc (this file), kept through pre-1.0 (CMT5,
  CMT19).
- **Diagnostics / conformance split** into a separate specification (CMT18).

### Open questions carried forward

1. Shared-state binding syntax (`reads` / `writes` provisional; possible top-level `state`
   block).
2. Instance inheritance semantics.
3. `connector` keyword parser feasibility (CMT13).
4. Whether constraints/directives return, and in what form.

---

## v0.7.0 and earlier

Full per-version detail for v0.7.0 and earlier is preserved in the archived specs:

- `AGENTFLOW-SYNTAX_0.7.0.md` — complete v0.7.0 spec, including its "What's New in v0.7.0 /
  v0.6.0 / v0.5.0" sections.
- `AGENTFLOW-SYNTAX_0.6.0.md` — complete v0.6.0 spec.

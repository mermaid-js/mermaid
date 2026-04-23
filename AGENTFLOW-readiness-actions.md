# Agentflow Readiness Actions

**Responds to:** `AGENTFLOW-downstream-readiness-review.md`
**Target spec:** `AGENTFLOW-SYNTAX.md` v0.4.0
**Status:** Proposal — revision 4 (polish: invocation-form scoping, legacy `type` fallback wording)
**Authors:** Mermaid-Chart / Agentflow Team

## Purpose

This document converts each finding of the downstream-readiness review into a concrete, approvable action. For every review point it names:

- the **spec text** to add or amend,
- the **grammar change** in `agentflow.jison`, if any,
- the **validation logic** in `agentflowDb.ts`,
- the **backward-compat posture**,
- the **test additions**.

The intent is that the original reviewer can read this top-to-bottom and say yes/no to each action without having to re-derive the rationale.

## Revision history

| Rev | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Initial point-by-point response to the readiness review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2   | Revisions from the plan review: `tool` becomes a leaf declaration; type and template namespaces split; explicit executing-agent resolution rule for capability validation; `src` treated as external/hygiene, not a semantic-resolution target; presentation-only controls stripped from the **semantic export model** rather than the internal render model; `==>` remap re-framed as a versioned semantic migration with first-class `edgeSemantic` shipped in wave 1; container-boundary label tightened to a parameter-name binding; `description` broadened beyond artifact nodes; explicit note that containment defines structural validity, not execution ownership. |
| 3   | Final tightening from the plan review: distinguish `tool` **definition** from **invocation**, with capability validation applying only at invocation sites; containment enforcement now runs in both `addSubGraph()` and `addTool()`; `tool` becomes a **context-sensitive** declaration keyword recognised only at statement start; outgoing container data edges addressed (`returns` is single-valued at the boundary); action 1 wording aligned with the `typeRef`/`templateRef` vocabulary; action 10 table simplified by cross-cutting `description`.                                                                                                                  |
| 4   | Polish: invocation-form list scoped to v0.x/1.0 rather than implied-forever; legacy `type` fallback in action 9 restated as three explicit cases (single match → warn and accept; both match → error as ambiguous; neither matches → error as unresolved).                                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## Summary of the approach

The review's conclusion is that the language is close to downstream-safe but leaves interpretation choices open in edge semantics, branching, instances, tools, containers, capabilities, references, metadata, and identifier scope. Our response follows the review's strategic recommendation: **keep the surface small, tighten the core**. We do not propose new surface syntax beyond the one missing keyword (`tool`) the review explicitly requests, and we do not propose new shapes.

Actions land in three waves so downstream teams can migrate:

| Wave | Version | Character                                                                                           | Actions                                                                                                           |
| ---- | ------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1    | 0.5.0   | spec + warnings; first-class `edgeSemantic` in the exported model (legacy interpretation preserved) | 3, 11, 12, warn-only variants of 1, 7, 9, 10; non-strict part of 2                                                |
| 2    | 0.6.0   | first-class declarations (additive)                                                                 | 5 (tool leaf declaration), 4 (instance binding + validation); conformance fixtures against the new edge semantics |
| 3    | 1.0.0   | strict mode (breaking for non-conforming diagrams)                                                  | strict part of 2 (edge semantic contradictions become errors), 6 (container boundary), flip 1/7/8/9/10 to error   |

---

## 1. Identifier scope and name resolution

**Gap.** Duplicate IDs are accepted silently. No normative scope rule. Reference keys (`def`, `typeRef`, `templateRef`, `src`, `class`, `click`) are resolved opportunistically, with no distinction between semantic and external resolution.

**Spec.** Add a new section _Identifier Resolution_:

- All node and container IDs share a single diagram-wide namespace; they must be unique.
- **Types** live in their own namespace.
- **Templates** live in their own namespace.
- Having a `type Report` and a `template Report` in the same diagram is **valid** — the explicit `typeRef` / `templateRef` keys disambiguate at the reference site.
- Forward references are permitted in every namespace.
- Duplicate IDs within a namespace are a validation error.
- Synthetic IDs emitted by the renderer (`typesGroup`, `templatesGroup`, auto-numbered subgraphs) are reserved and may not be declared by authors.

**Reference categories.** References split into two groups so the validator applies the right rule:

- **Semantic references** — resolved against the diagram model. An unresolved semantic reference is a validation error. Members: `def`, `typeRef`, `templateRef`.
- **External / hygiene references** — validated for shape and allowed usage, but not for existence of the external target unless an import resolver is explicitly enabled. Members: `src`, `click`/`href` targets, and style/class references whose shape is already well-defined.

**Grammar (`agentflow.jison`).** No change.

**DB (`agentflowDb.ts`).**

- `addVertex`, `addSubGraph`, `addTypeDeclaration`, `addTemplateDeclaration`: track seen IDs per namespace and raise a validation error on intra-namespace collision (behind a config gate in wave 1, fatal in wave 3).
- New `resolveReferences()` pass in `getData()`:
  - For each **semantic** reference, resolve the target in its namespace; unresolved → error.
  - For each **hygiene** reference, validate that the value is a well-formed string of the expected shape; log but do not error on external non-existence.

**Backward compat.** Gate intra-namespace collision errors behind `agentflow.strictIds: false` for one release; flip the default in wave 3.

**Tests.** ≥ 10 cases — duplicate vertex, duplicate container, same-name `type` and `template` (valid), type–type collision (error), template–template collision (error), reserved synthetic ID, forward reference across nested containers, unresolved `def`, unresolved `typeRef`, missing-but-legal `src`.

---

## 2. Edge semantics

**Gap.** The lexer distinguishes every operator the review names, but the DB stores them as arrow type + stroke variant without a first-class semantic field. Downstream tooling cannot tell data flow from control precedence.

The change is a real semantic migration — not merely a clarification — because `-->` and `==>` today denote the same kind of edge at different stroke weights. Downstream consumers need a clear migration story.

**Spec.** Adopt the review's canonical mapping verbatim and make it normative:

| Operator | Primary semantic              |
| -------- | ----------------------------- |
| `-->`    | precedence / control sequence |
| `==>`    | data flow / artifact transfer |
| `--o`    | contract conformance          |
| `-->>`   | delegation / spawn            |
| `--x`    | failure / cancellation        |
| `---`    | association (non-driving)     |
| `-.->`   | governance / advisory         |
| `o--o`   | bidirectional data sync       |

Stroke is a rendering property of a semantic, not an independent axis. An operator fixes the semantic; the language forbids arbitrary mix-and-match (e.g. "thick dotted" does not exist as a semantic).

**Grammar.** No token change. Every operator already parses.

**DB.**

- **Wave 1.** Extend `destructLink()` to populate an `edgeSemantic` field on every edge alongside the existing `type` and `stroke`. A `legacyEdgeSemantics: true` interpretation is preserved so rendering does not change. The new field is additive in the exported model.
- **Wave 2.** Ship conformance fixtures asserting the new mapping on every operator. Downstream consumers migrate against these fixtures.
- **Wave 3.** Make the canonical mapping the default. Once action 10 lands, edges whose semantic contradicts endpoint kinds become errors — e.g. a `==>` into a container with no declared `params`. `legacyEdgeSemantics` remains available for one more release as an escape hatch before removal.

**Backward compat.** Exported model gains a new field in wave 1 without touching existing ones. A `agentflow.legacyEdgeSemantics` flag covers wave 3 enforcement.

**Tests.** ≥ 20 cases — each operator with its semantic asserted; wave-1 legacy interpretation round-trip; endpoint-kind combinations; endpoint-mismatch warnings (wave 1–2) and errors (wave 3); a diagram that renders identically under legacy and canonical modes.

---

## 3. Branching semantics

**Gap.** Both `hexagon` and `diamond` are described in decision-like terms.

**Spec.** Add normative statements:

- `diamond` is the only branching vertex. Alternate-flow routing, approval gates, and mutually exclusive outcomes originate from a `diamond`.
- `hexagon` is a condition or classification _source_. Its outgoing edges feed a branch, they do not constitute one.

**Grammar / DB.** No change.

**Validator.** Emit a warning (not an error) when a `hexagon` has multiple outgoing edges labelled as branches.

**Backward compat.** Fully compatible — clarification only.

**Tests.** ≥ 5 cases verifying the pattern and the warning.

---

## 4. Definition / instance semantics

**Gap.** The five instance shapes ship in the renderer but have no parser/DB tests and no `def` validation. Inheritance, override precedence, cycle handling, and structural expansion rules are unspecified.

**Spec.** Add section _Definition / Instance Semantics_:

- **Target matrix:** `tag-rect` → `agent`, `delay` → `flow`, `lin-rect` → `skill`, `win-pane` → `tool`, `curv-trap` → `directive`.
- Missing `def` is invalid.
- Kind mismatch (e.g. `tag-rect` with a `def` pointing at a flow) is invalid.
- Cyclic `def` chains are invalid.
- Instances inherit **domain metadata only**. Core rendering fields (`shape`, `view`, `icon`, `img`, `w`, `h`) do not inherit.
- On key collision, local instance metadata overrides inherited metadata.
- Structure does not auto-expand into the instance site.
- Style, class membership, `click`, and link styling do not inherit.

**Grammar.** No change.

**DB.** New `resolveInstances()` pass:

1. For every vertex with an instance shape, look up its `def`.
2. Validate presence, kind, and acyclicity. Error on any violation.
3. Merge the definition's domain metadata into the instance with the override rule.
4. Do not clone definition structure into the instance site.

**Backward compat.** No current diagrams exercise the instance path in tests, so risk is low. Ship with validation active from wave 2.

**Tests.** ≥ 50 cases across the five shapes — valid binding, missing `def`, kind mismatch, 2-cycle and 3-cycle definitions, inheritance precedence, confirmation that structure is not cloned, confirmation that style does not leak.

---

## 5. Tool-definition model

**Gap.** No `tool` keyword. Tools are modelled as `shape: subroutine` nodes.

A container with `end` that is not allowed to contain anything fights its own syntax. The right shape for `tool` is a **first-class leaf declaration**, peer to `type` and `template` rather than to `agent`/`flow`/`task`.

**Spec.** Introduce `tool` as a leaf declaration:

```
tool <id>["Title"]
<id>@{ returns: "SearchResults", requires: ["net.read"], retry: 2, cache: "24h" }
```

- No `end`. `tool` declares a single executable primitive and nothing more.
- Tool metadata: `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `transport`, `command` (per action 10).
- The rendered form of a `tool` declaration uses the existing subroutine visual.
- The `win-pane` instance shape references a `tool` definition (action 4).
- `shape: subroutine` remains valid as a **legacy rendering alias** during migration. It is deprecated in wave 2 and removable after a quiet period if adoption confirms the new form is preferred.

**Definition vs invocation.** A `tool` declaration is a **definition**. It registers a reusable executable primitive in the diagram and by itself performs no work. Writing `tool search_web["Search Web"]` at the top level is valid and does not require an enclosing agent.

An **invocation** is a use of a tool from flow/execution context. The invocation forms supported in v0.x / 1.0 are:

- an edge (typically `-->` or `==>`) from a task, flow, or skill node into the tool's ID, and
- a `win-pane` **instance** (action 4) whose `def` points at the tool, placed inside an executing container.

Additional invocation forms may be introduced in a later version under the spec's additive-change rule.

Capability validation (action 8) runs **only at invocation sites**, never at the definition site.

**Grammar (`agentflow.jison`).**

- Add a `"tool"` lexer token alongside `TYPE_DECL` / `TEMPLATE_DECL` — line numbers in the 94–96 region.
- Add a `toolDeclarationStatement` production parallel to `typeDeclarationStatement`:
  - Parses `tool <idString> [SQS text SQE]`.
  - Calls `yy.addTool(id, label)`; any subsequent `@{...}` on the same id attaches metadata through the existing vertex-metadata path.
- `tool` is a **context-sensitive declaration keyword** — recognised only when it appears as the first token of a statement. In any other position (node ID, label text, edge endpoint, etc.) it continues to parse as a regular identifier. This is achieved by anchoring the lexer rule to statement-start (the same technique `type` and `template` already use in `agentflow.jison`) rather than by adding `tool` to the globally reserved keyword list. Existing diagrams that use `tool` as a bare ID in non-declaration positions continue to parse unchanged.

**DB.**

- `addTool(id, label)` creates a tool-kind vertex and registers it in the node/container namespace (action 1).
- Tool nodes render with the `subroutine` visual by default.
- No containment rules on `tool` are needed because it is a leaf — the containment matrix (action 7) simply omits it as a parent.

**Backward compat.** Fully additive. Existing `shape: subroutine` usage remains legal and continues to render the same visual.

**Tests.** ≥ 15 cases — bare `tool` declaration, tool with every metadata field, tool declared inside an agent/flow/task/skill (structural placement, not container nesting), `win-pane` instance resolving to a tool, `win-pane` with a non-tool `def` (error), legacy `shape: subroutine` node co-existing with a `tool` declaration.

---

## 6. Container boundary semantics

**Gap.** Edges can connect to containers, but the spec does not say what they bind to.

**Spec.** Add section _Container Edges_:

- An incoming precedence edge (`-->`) to a container targets the container's **entry boundary**.
- An outgoing precedence edge originates from the **completion boundary**.
- An incoming data edge (`==>`) binds to a parameter declared in `params`.
- An outgoing data edge originates from `returns`.
- Data edges on containers without a declared contract are invalid.
- **On a data edge into a container, the edge label is interpreted as a parameter name — not as decorative text.** If `params` declares one parameter, the label is optional and binds implicitly. If `params` declares multiple parameters, the label is required and must match one of them exactly. `A ==>|city| flow_x` binds `city`.
- **Outgoing data edges.** `returns` is single-valued at the container boundary: a container declares exactly one output type. Outgoing data edges therefore do not require label-based binding, and any label on such an edge is decorative. If a future version introduces multiple named return channels, outgoing edges will be subject to the same parameter-name label rule specified above for incoming edges, and that extension will require its own revision entry.

**Grammar.** No change — labels already flow through.

**DB.** Boundary validator pass after edge resolution. Classify every container-touching edge by semantic (action 2), and for data edges cross-reference `params`/`returns`, consuming the label as the parameter selector as specified above.

**Backward compat.** Warn-only in wave 1; error in wave 3. A diagram that today uses a decorative label on a data edge into a single-parameter container continues to render; one that targets a multi-parameter container gets a warning in wave 1 and an error in wave 3.

**Tests.** ≥ 15 cases — valid entry/exit, data edge matching a named param, implicit single-param binding, explicit multi-param binding via label, data edge with no contract (error), label that does not match any param (error in wave 3).

---

## 7. Containment rules

**Gap.** Any container may nest inside any other.

**Spec.** Add the containment matrix from the review verbatim (adjusted so that `tool`, now a leaf declaration, is a valid child but never a parent):

| Parent      | Allowed children                                                |
| ----------- | --------------------------------------------------------------- |
| `agent`     | `flow`, `task`, `skill`, `directive`, `testCase`, `tool`, node  |
| `flow`      | `task`, `agent`, `skill`, `directive`, `testCase`, `tool`, node |
| `task`      | `tool`, `directive`, node                                       |
| `skill`     | `tool`, `flow`, `directive`, node                               |
| `directive` | node                                                            |
| `testCase`  | `directive`, node                                               |
| `tool`      | _(leaf — cannot be a parent)_                                   |
| `subgraph`  | unrestricted (legacy; documented as the generic escape hatch)   |

Normative note: **containment defines structural validity, not execution ownership.** Execution ownership is resolved by the capability rules in action 8, and it can cross structural boundaries through delegation and instance references.

**Grammar.** No change.

**DB.** Containment is enforced at every point where the structural tree is built, not only at container creation:

- `addSubGraph()` — validates container-kind children (`agent`, `flow`, `task`, `skill`, `directive`, `testCase`) against the parent's allowed set.
- `addTool()` — validates that the tool leaf is placed inside a container whose allowed-children set includes `tool` (i.e. not inside `directive`, `testCase`, or another `tool`).
- `addVertex()` — applies the same check for plain nodes where the matrix constrains them.

A shared helper inspects the current container stack and rejects disallowed placements, so the rule stays uniform across container-creation and leaf-declaration paths.

**Backward compat.** Gate behind `agentflow.strictContainment: false` in waves 1–2; default on in wave 3.

**Tests.** ≥ 20 cases — one per allowed pair, representative forbidden pairs, legacy `subgraph` grandfathered, a structural-vs-ownership test demonstrating that a delegated agent retains its own capabilities independent of enclosing containment.

---

## 8. Capability / permission validation

**Gap.** `permits`, `requires`, `deny` are free-form strings. No validation algorithm and no rule for identifying the executing agent.

**Spec.** Add section _Capability Evaluation_:

- `permits` is the agent's effective capability set.
- `requires` is the capability set required by a tool invocation.
- `deny` is the set forbidden at that tool's execution site.
- **Invocation sites.** Capability evaluation applies to **invocation sites only**, never to `tool` _definitions_ (action 5). The invocation sites supported in v0.x / 1.0 are:
  - an edge from a task, flow, or skill node into a tool's ID, or
  - a `win-pane` instance (action 4) whose `def` points at a tool and which is placed inside an executing container.
    A bare top-level `tool` declaration is a definition and is not subject to capability evaluation. Additional invocation-site forms may be introduced in a later version.
- **Executing-agent resolution.** At every invocation site, the executing agent is the **nearest enclosing `agent`** in the structural tree. If no such agent exists, the invocation is invalid. Delegation (`-->>`) transfers _work_ ownership, not _capability_ ownership — a delegated-to agent must independently satisfy the invocation's `requires` under its own `permits`.
- An invocation is valid iff every `requires` entry is in the executing agent's `permits` and none are in `deny`.

**Representation.** `permits`, `requires`, `deny`, `fallbacks`, `directives` **must be YAML arrays**. Comma-separated strings are accepted in wave 1 with a deprecation warning, and removed in wave 3.

**Grammar.** No change — YAML arrays already parse via `@{...}`.

**DB.**

- In metadata merge, normalise string-form lists to arrays and warn.
- In `getData()`, enumerate invocation sites (incoming edges into a tool ID; `win-pane` instances inside executing containers) and for each:
  1. Walk up the structural tree to find the nearest enclosing `agent`; error if none.
  2. Compute `requires ⊆ permits` and `requires ∩ deny = ∅`.
  3. For delegation targets, repeat the resolution at the delegated site.
- Top-level `tool` definitions are skipped by this pass.

**Backward compat.** One-version deprecation window for the string form. The executing-agent rule is strict from its introduction because it removes ambiguity rather than adding constraints on already-valid diagrams.

**Tests.** ≥ 25 cases — array round-trip, string normalisation + warning, missing capability (error), denied capability (error), tool invocation with no enclosing agent (error), delegation where the delegated agent has a larger permit set (valid), delegation where the delegated agent has a smaller permit set (error), delegation across multiple hops.

---

## 9. Type / template / external reference model

**Gap.** The `type` key is overloaded for type and template references on `procs` nodes. `src` covers external files. The parser does not disambiguate.

**Spec.** Require exactly one of `typeRef`, `templateRef`, or `src` on a reference node. The generic `type` key is deprecated on reference nodes in wave 1 and removed in wave 3; it remains reserved for possible future type-system use on non-reference nodes.

Formalise both synthetic containers: `typesGroup` (already specified) and `templatesGroup` (currently only implied).

**Reference categories.** As per action 1, `typeRef` and `templateRef` are semantic references resolved against the diagram model; `src` is an external/hygiene reference — validated for shape and allowed usage, not for external existence by default.

**Grammar.** No change.

**DB.**

- Legacy `type` on a `procs` node → look up the ID in both the type namespace and the template namespace, then:
  - **exactly one match** → accept, treating it as the corresponding `typeRef` or `templateRef`, and emit a deprecation warning;
  - **both namespaces match** → error as ambiguous (the author must switch to explicit `typeRef` / `templateRef`);
  - **neither namespace matches** → error as unresolved.
- Reject nodes that set more than one of `typeRef`/`templateRef`/`src`.
- Always emit a `templatesGroup` when templates exist.

**Backward compat.** Deprecation period as above.

**Tests.** ≥ 15 cases — each ref kind resolves to the correct group, mutual exclusion enforced, legacy `type` still works with warning, `templatesGroup` rendered, `src` missing external file is not by itself a semantic error.

---

## 10. Metadata applicability and validation

**Gap.** Any YAML key is accepted on any element.

**Spec.** Add section _Metadata Applicability_ with the table below. Semantically meaningful keys are restricted to the element kinds listed.

| Element                      | Valid metadata keys                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `agent`                      | `model`, `permits`, `memory`, `fallbacks`                                                      |
| `flow`                       | `params`, `returns`                                                                            |
| `task`                       | `execution`, `params`, `returns`, `fallbacks`                                                  |
| `skill`                      | `strategy`, `params`, `returns`, `fallbacks`                                                   |
| `tool`                       | `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `transport`, `command` |
| `directive`                  | `rule`, `severity`, `context`, `params`                                                        |
| `testCase`                   | `assert`, `expects`                                                                            |
| artifact nodes (`doc`, etc.) | `output`                                                                                       |
| reference nodes (`procs`)    | `typeRef`, `templateRef`, `src`                                                                |

**Cross-cutting rule.** `description` is valid on **any authored element** and is therefore omitted from the row-by-row restrictions above. A human-readable description never creates semantic ambiguity.

Validation rules:

- Known key on allowed element → valid.
- `description` on any authored element → valid.
- Unknown key → preserved, warning emitted.
- Known key on wrong element → validation error.

**Grammar.** No change.

**DB.** Applicability validator consumes the table. Warn-only in wave 1, error in wave 3.

**Tests.** ≥ 20 cases — each row has at least one valid placement; at least five invalid-placement cases across elements; unknown-key preservation confirmed; `description` valid on a sampled variety of elements.

---

## 11. Presentation-only controls (PARTIAL → pass)

**Gap.** Styling, classes, `view`, icons, and images are implicitly presentation-only but not normatively declared so.

**Spec.** Add one normative paragraph: the following are presentation-only and MUST NOT influence semantic interpretation or validation outcomes: `view`, `classDef`/`class`/`style`/`linkStyle`, `icon`, `img`, `w`, `h`, collapsed/expanded rendering state. If collapse is ever intended to affect semantic visibility in exports, that will require a distinct, separately specified flag.

**Two models.** The library maintains two representations of a parsed diagram and the separation is now explicit:

- **Internal render model.** Retains all fields — including presentation — because rendering needs them.
- **Semantic export model.** Produced by a `getSemanticModel()` projection. Presentation-only fields listed above are stripped from this view. Downstream tooling that consumes the semantic model therefore cannot be accidentally influenced by rendering choices.

Presentation fields are not deleted from the DB. They are excluded from the exported semantic view.

**Grammar / DB.** Add the `getSemanticModel()` projection. No change to the internal model.

**Tests.** ≥ 5 cases — semantic export equivalence between styled and unstyled variants of the same diagram; presentation fields present in the internal model but absent in the semantic export.

---

## 12. Normative examples and conformance set

**Gap.** Examples mix conforming and non-conforming usages; no shipped conformance suite.

**Spec.** Audit every example in `AGENTFLOW-SYNTAX.md`:

- Delegation must use `-->>`.
- Directive must rely on `-.->`.
- Decision must use `diamond`.
- Parallel must use `&` in edges only, not in node declarations.
- Lesson must either use `doc` or give `lin-doc` its own normative meaning.
- Template references must use `templateRef`.
- Tool definitions must use the new leaf `tool` form (action 5).

Add a _Conformance Tests_ appendix naming the shipped fixture files.

**Grammar / DB.** No change.

**Test corpus.** New `agentflow-conformance/` fixture directory with:

- Minimum valid examples per semantic pattern.
- Negative examples: duplicate names, kind mismatches, cyclic `def`, invalid metadata placement, invalid capability sets, invalid containment, ambiguous reference resolution, malformed container-boundary cases.
- Edge-semantics fixtures asserting the canonical mapping on every operator (introduced in wave 2, enforced in wave 3 per action 2).

---

## Release gate

Before the `downstream-safe` label can be applied (target: v1.0), all the following must be true. This list mirrors the review's own minimum-release-gate section.

- [ ] Every edge operator has one primary semantic and a first-class `edgeSemantic` field — action 2.
- [ ] There is one canonical branching shape — action 3.
- [ ] Identifier resolution is formalised and enforced; three namespaces — action 1.
- [ ] Container edges have formal boundary semantics with explicit parameter-name binding — action 6.
- [ ] `def` has a complete validity and inheritance model — action 4.
- [ ] `tool` is a first-class leaf declaration — action 5.
- [ ] Capability validation is machine-checkable with an explicit executing-agent rule — action 8.
- [ ] Type, template, and source references are separated; `src` treated as hygiene, not semantic — action 9.
- [ ] Metadata applicability is defined and validated; `description` broadly valid — action 10.
- [ ] Presentation-only features are excluded from the semantic export model — action 11.
- [ ] Examples are conformance-clean and a conformance suite ships — action 12.

---

## Out of scope

The following were considered and deliberately excluded:

- New surface syntax beyond the `tool` keyword.
- New shape names beyond those already in v0.4.0.
- Theming / styling system changes.
- An import resolver for `src` references; this would be a separate proposal if the need arises.
- Rewriting `agentflow.jison` onto Langium (long-term direction, but not needed to close the review).
- Runtime execution semantics (memory, fallbacks as executable primitives).

---

## Approval

Reviewer sign-off is sought on each of the 12 actions and on the three-wave phasing. Any action the reviewer rejects can be dropped without affecting the others, with the exception that actions 2, 5, and 10 are prerequisites for actions 6 and 8.

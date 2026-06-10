# Agentflow v0.8 — Summary of Proposed Changes

> **Status:** Draft summary for review.
> **Source:** v0.7.0 spec (`AGENTFLOW-SYNTAX.md`) + the 47 inline review comments
> extracted from `AgentflowReviewAIAuthoredHumanCorrectedSyntax.html`.
> Comment references below (CMT*n*) map to those inline comments — the comments
> are the decisions; the surrounding review prose is the input that fed them.

## The through-line

The review's framing is **accepted**: Agentflow is an AI-authored / human-corrected
canonical format (CMT1 ✅, CMT2 "I fully agree"). Verbosity is fine; ambiguity and
redundant concepts are not. The v0.8 direction is **aggressive cutting** — collapse the
container zoo, drop most edge operators, remove the metadata wrapper, and unify
instancing into one mechanism.

One notable override of the review: where the reviewer said "keep things," the human
comments frequently said "cut." The biggest example — the review's Critical Issue 2 said
_keep_ the `agentflow: {}` wrapper; the comment says **remove it** (CMT6).

---

## 1. Metadata: drop the `agentflow:` wrapper

- **Remove `agentflow: { ... }`** (CMT6, on "Critical Issue 2: Keep agentflow").
  Domain keys go back to the top level of `@{...}`. This reverses the central v0.7.0
  change.
- **`shape` is semantic — and that's accepted.** The review listed "semantic meaning
  hidden in visual shape" as bad; the comment **disagrees** (CMT3 "Don't agree with
  this"). So Critical Issue 1 is resolved by _admitting_ shape carries Agentflow
  semantics rather than fighting it.

## 2. Remove `type` and `template` as syntax

- **`type` and `template` are no longer first-class syntax elements** — they move into
  metadata (CMT21).
- Consequently: `typesGroup` deleted (CMT23), `templatesGroup` deleted (CMT24),
  `typeDeclaration` shape deleted (CMT26).

## 3. Containers: collapse to essentially one group

The container table got the most decisive cut — on the `agent` row:
**"Keep, delete the rest"** (CMT22).

| Container   | Decision                                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`     | **Keep** — the group/container kind. Can render as a group shape _or_ an instance (CMT20).                                                                                                    |
| `flow`      | **Contested → likely folded into agent.** CMT9 "keep flow as a group shape," but CMT10 "skip flow and call it an agent instead," and CMT22 "delete the rest." ⚠️ _Needs explicit resolution._ |
| `task`      | **Demoted from a group to a node** — it becomes the default square/rounded-rect node, not a container (CMT9, CMT25 "A task", CMT38 "task").                                                   |
| `skill`     | **Removed** (CMT11 "we will also skip skills," CMT9).                                                                                                                                         |
| `testCase`  | **Removed as a container** (CMT22).                                                                                                                                                           |
| `directive` | **Container removed** (CMT22) and the `trapezoid` directive shape skipped (CMT35). ⚠️ _Constraint concept survives in the core list but its representation is unresolved — likely metadata._  |
| `subgraph`  | Dropped from the core (legacy).                                                                                                                                                               |

Net: the "too many near-synonymous containers" complaint (CMT4 "Agree") is addressed by
reducing to **agent (group)** + **task (node)**.

## 4. Node shapes: keep/skip decisions (§4.3 table)

| Shape                         | Decision                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roundedRect` / `rect`        | **Keep** — this _is_ a task now (CMT25, CMT38)                                                                                                                        |
| `subroutine` (tool)           | **Keep.** Tool = classic native function definition with a signature provided to the LLM to call on command, external to the LLM, via the reference mechanism (CMT27) |
| `lean-right` (input)          | **Keep** (CMT29)                                                                                                                                                      |
| `lin-doc` (ref doc)           | **Keep** (CMT30)                                                                                                                                                      |
| `procs` (external file)       | **Keep** (CMT31)                                                                                                                                                      |
| `hexagon`                     | **Keep** (CMT32)                                                                                                                                                      |
| `diamond`                     | **Keep** (CMT34)                                                                                                                                                      |
| `circle`                      | **Replace with `connector`** (CMT33 "connector instead")                                                                                                              |
| `doc`                         | **Skip** (CMT28)                                                                                                                                                      |
| `trapezoid` / `inv-trapezoid` | **Skip** (CMT35, CMT36)                                                                                                                                               |
| `double-circle`               | **Skip** (CMT37)                                                                                                                                                      |
| `typeDeclaration`             | **Delete** (CMT26)                                                                                                                                                    |

## 5. Edges: cut to four operators

| Operator                | Decision                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `-->`                   | **Keep** — reframed as **sequence** (CMT40)                                                                                |
| `--x` failure           | **Keep** (CMT44)                                                                                                           |
| `---` association       | **Keep**, main use = **reference of documents**; labels rejected — "the labels will not mean anything" (CMT7, CMT8, CMT45) |
| `-.->` instance binding | **Keep** (CMT46) — but see open question on ref syntax                                                                     |
| `==>` data flow         | **REMOVE** — "instead we share data via a stateful object" (CMT41)                                                         |
| `--o` conformance       | **Skip** (CMT42)                                                                                                           |
| `-->>` delegation       | **Skip** (CMT43)                                                                                                           |
| `o--o` bidirectional    | **Skip** (CMT47)                                                                                                           |

⭐ **Architectural shift:** there are no data-flow edges anymore. Agents/tasks
**share data through a shared stateful object**, not `==>` artifact-transfer edges. This
is the most consequential single change.

## 6. Instances & references: unify into one mechanism

- **Keep instances** — they're essential to avoid repeating data in complex flows (CMT15).
- **Drop per-kind instance shapes.** Instead of five dedicated shapes
  (`tag-rect`/`delay`/`lin-rect`/`win-pane`/`curv-trap`), use **one mechanism regardless
  of kind/shape**, with a visual indicator showing "instance of what" (CMT15, CMT39).
- Proposed form: `@{ ref: 'flowID' }` metadata (CMT15).
- **Instance inheritance** is likely deferred (CMT17 "I am tempted").

## 7. Connectors: a real keyword

- **Introduce a real `connector` keyword** (CMT14 "we decided on this option … the real
  connector keyword"), replacing the magic top-level `subgraph connectors[...]`:

  ```
  connector github["GitHub"]
  github@{ protocol: "http", endpoint: "https://api.github.com", token_required: true }
  ```

  (CMT13 liked it, pending parser/"Pact" feasibility.)

## 8. Document structure & process

- **Split the changelog/history out** of the main syntax doc, but **keep it through
  pre-1.0** (it's valuable now; remove at 1.0) (CMT5, CMT19).
- **Separate diagnostics/conformance spec** — endorsed (CMT18 "I like this").

---

## ⚠️ Open questions flagged in the comments

1. **`flow`'s fate** — kept as a group (CMT9) vs. merged into `agent` (CMT10, CMT22).
   Unresolved contradiction.
2. **Reference syntax** — `@{ ref: id }` metadata vs. a binding edge (`-.->` / `---`).
   Explicitly "yet to decide" (CMT16).
3. **How directives/constraints are represented** now that both the container and the
   trapezoid shape are gone.
4. **Parser feasibility** of the `connector` keyword (CMT13 "can Pact handle it?").

---

## Appendix: raw comment-to-decision map

| CMT | Anchored on                                                          | Decision                                                                               |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | "Implementations SHOULD provide autocomplete, validation… AI repair" | ✅ reaction — accept authoring model                                                   |
| 2   | "…correct it without reading the full spec"                          | "I fully agree with this statement!"                                                   |
| 3   | "semantic meaning hidden in visual shape" (a "bad" item)             | "Dont agree with this" → shape may be semantic                                         |
| 4   | "too many near-synonymous containers" (a "bad" item)                 | "Agree with this!"                                                                     |
| 5   | "historical migration clutter in the main authoring document"        | "We can remove this"                                                                   |
| 6   | "Critical Issue 2: Keep agentflow: {…}"                              | "remove agentflow" (drop the wrapper)                                                  |
| 7   | "Critical Issue 3: Reduce --- Ambiguity"                             | "we keep this, and we keep the main use for the reference of documents"                |
| 8   | "prefer labels for AI output" on `---`                               | "The Labels will not mean anything."                                                   |
| 9   | "Critical Issue 4: …Remove skill"                                    | keep flow as group; task demoted to square node; skill removed                         |
| 10  | skill distinction list                                               | "We will skip flow and call it an agent instead."                                      |
| 11  | skill distinction list                                               | "we will also skip skills"                                                             |
| 12  | "Option B: Remove skill From v1 Core"                                | "This could work but are there other options?"                                         |
| 13  | `connector github[...]` example                                      | "This makes more sense syntactically, can Pact handle it?"                             |
| 14  | "introduce a real connector declaration"                             | "we decided on this option… the real connector keyword"                                |
| 15  | "Critical Issue 6: Defer Broad Instance Binding"                     | keep instances; unify via `@{ ref: 'id' }`, not edges                                  |
| 16  | "Critical Issue 6…"                                                  | "yet to decide the final syntax for references" (ref: vs binding)                      |
| 17  | "defer agent/flow/skill/directive instance inheritance"              | "will it work? (I am tempted)"                                                         |
| 18  | "Create a separate diagnostics/conformance spec"                     | "I like this"                                                                          |
| 19  | "spec currently starts with long historical sections"                | "removed when we reach 1.0.0; for us it is valuable"                                   |
| 20  | "Actor: agent"                                                       | "group shape or an instance"                                                           |
| 21  | end of v1 core concepts                                              | "Remove types and templates… now parts of the metadata"                                |
| 22  | container table, `agent` row                                         | "Keep, delete the rest"                                                                |
| 23  | `typesGroup` (synthetic)                                             | "Delete"                                                                               |
| 24  | `templatesGroup` (synthetic)                                         | "Delete"                                                                               |
| 25  | `roundedRect`                                                        | "A task"                                                                               |
| 26  | `typeDeclaration`                                                    | "deleted"                                                                              |
| 27  | `subroutine`                                                         | keep; classic native function w/ signature, called by the LLM, via reference mechanism |
| 28  | `doc`                                                                | "skip"                                                                                 |
| 29  | `lean-right`                                                         | "keep"                                                                                 |
| 30  | `lin-doc`                                                            | "keep"                                                                                 |
| 31  | `procs`                                                              | "Keep"                                                                                 |
| 32  | `hexagon`                                                            | "keep"                                                                                 |
| 33  | `circle`                                                             | "connector instead"                                                                    |
| 34  | `diamond`                                                            | "keep"                                                                                 |
| 35  | `trapezoid`                                                          | "skip"                                                                                 |
| 36  | `inv-trapezoid`                                                      | "skip"                                                                                 |
| 37  | `double-circle`                                                      | "skip"                                                                                 |
| 38  | `rect`                                                               | "task"                                                                                 |
| 39  | "4.3.3 Instance Shapes"                                              | instances without specific shape; visual shows "instance of what"                      |
| 40  | `-->` control                                                        | "sequence"                                                                             |
| 41  | `==>` data                                                           | "skip — instead we share data via a stateful object"                                   |
| 42  | `--o` conformance                                                    | "Skip"                                                                                 |
| 43  | `-->>` delegation                                                    | "Skip"                                                                                 |
| 44  | `--x` failure                                                        | "keep"                                                                                 |
| 45  | `---` association                                                    | "keep"                                                                                 |
| 46  | `-.->` instance binding                                              | "keep"                                                                                 |
| 47  | `o--o` bidirectional                                                 | "skip"                                                                                 |

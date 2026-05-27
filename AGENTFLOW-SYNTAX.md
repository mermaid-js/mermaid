# Agentflow Syntax Specification

|             |                                |
| ----------- | ------------------------------ |
| **Version** | 0.8.1                          |
| **Status**  | Draft                          |
| **Date**    | 2026-05-26                     |
| **Authors** | Mermaid-Chart / Agentflow Team |

---

## What's New in v0.8.1

v0.8.1 is the current pre-1.0 draft. It is a follow-up to v0.8.0 driven by the
2026-05-26 syntax meeting. The design premise is unchanged: Agentflow is a **canonical
format an LLM authors and a human corrects**. Verbosity is acceptable; ambiguity and
redundant, near-synonymous concepts are not. Where v0.8.0 collapsed the container zoo
and the edge zoo, v0.8.1 cuts the explicit shared-state bookkeeping, drops the dedicated
instancing mechanism, and renames a number of authoring surfaces to be more memorable.

Full per-version history lives in `AGENTFLOW-CHANGELOG.md`. The detailed v0.7.0 text is
preserved in the archived `AGENTFLOW-SYNTAX_0.7.0.md`.

### TL;DR — what changed since v0.8.0

1. **Container renamed: `agent` → `flow`.** The "agent" framing was judged too
   personality-loaded and too implementation-coupled. A `flow` is the single container
   kind. `task` is still the default node (§3, §4.3).
2. **`reads` / `writes` arrays removed.** No more shared-state bookkeeping in the
   syntax. Data passes between steps implicitly; if a step needs to assert what it
   requires or produces, it says so in its `instruction`. The shared-state *model*
   survives in prose (§6); the bookkeeping syntax is gone.
3. **`instance of` keyword removed.** Reuse happens through MCP — a flow exposed as an
   MCP-callable tool is invoked from another flow by an action node. No
   definition/instance dual nature, no instance inheritance to settle (§7, §16.7).
4. **`procs` external-file shape removed.** Cross-flow references also go through MCP
   for the alpha (§9.3 removed).
5. **Reference edge: `---` → `-.-`.** Dotted, non-directional. More visually distinct
   from sequence; more honest about meaning. Final edge set: `-->` sequence, `-.-`
   reference, `--x` failure (§5).
6. **Edges may carry metadata.** An edge can be addressed by id and given an
   `instruction` via the normal `id@{ ... }` form (§5.3). Only `instruction` is
   permitted on edges in v0.8.1; more may be added later.
7. **Shape aliases.** `task`, `tool`, `input`, `decision`, `refdoc`, `action` are the
   recommended authoring names; the underlying Mermaid shape IDs remain accepted
   (§4.3.2).
8. **`hexagon` repurposed as `action`.** The standalone "condition / classification
   source" role is dropped (the classification pattern goes with it); a hexagon now
   means "a call to another flow exposed via MCP" (§4.3.2, §16.7).
9. **`prompt` → `instruction`, universal.** Renamed everywhere, and promoted to a
   **cross-cutting** key valid on every authored element — like `description` (§4.4,
   §10.1).
10. **`connectorRef` dotted form is canonical.** `connectorRef: "slack.replyToThread"`
    is the expected authoring shape; the dotted prefix names the connector and implies
    its presence in the diagram. Bare-id form is still accepted (§8.1).
11. **Flow-level input/output validation.** A flow whose tree contains no input node
    produces a diagnostic; inputs are collected before execution and the runtime/editor
    prompts the user for any missing values (§10.2).
12. **Removed shapes raise hard diagnostics.** `doc`, `stadium`, `circle`, `trapezoid` /
    `inv-trapezoid`, `double-circle`, `typeDeclaration`, `procs`, and the five per-kind
    instance shapes are syntax errors in v0.8.1, not permissive ignores.
13. **Capability evaluation removed.** `permits`, `requires`, and `deny` are gone, and
    the Capability Evaluation section (v0.8.0 §17) is deleted. Access control is
    governed by the runtime (connector configuration, tool exposure); the LLM picks
    tools at invocation time. The concept may return in a later draft if a real need
    surfaces.

### Canonical Authoring Form

```text
# 1. Container is `flow`. One container kind.
flow researcher["Researcher"]
  ...
end
researcher@{
  model: "claude-sonnet-4-20250514",
  instruction: "You are a careful researcher. Always cite sources.",
  memory: ["episodic", "semantic"]
}

# 2. A tool is a node with shape: tool (canonical Mermaid name: subroutine).
search_web@{
  shape: tool,
  params: { query: String, top_k: Int? },
  returns: "SearchResults"
}

# 3. Data passes between steps implicitly. No reads/writes arrays.
research --> write_copy

# 4. Reference documents attach via `-.-` (dotted, non-directional).
gen_html -.- brand_guide
brand_guide["Nordic Brand Guide"]@{ shape: refdoc }

# 5. An action node calls another flow exposed as an MCP tool.
post_to_slack["post_to_slack"]@{ shape: action, connectorRef: "mermaid.post_slack" }

# 6. Connectors are declared with the connector keyword.
connector github["GitHub"]
github@{ protocol: "http", endpoint: "https://api.github.com", token_required: true }
create_issue@{ shape: tool, connectorRef: "github.create_issue" }

# 7. Edge metadata via an edge id. Only `instruction` is permitted on edges.
check -- yes --> publish
check e1@-- no --> revise
e1@{ instruction: "If rejected, send back with reviewer comments inlined." }
```

The following forms are **not** part of the language: the `agentflow: { … }` wrapper;
the `agent` container keyword; the `flow` / `skill` / `testCase` / `directive` container
keywords from v0.7.0 (`flow` returns as the *single* container in v0.8.1); the `task` /
`tool` keywords as containers; the `type` / `template` keyword declarations; the
`instance of` keyword (removed in v0.8.1); the `reads` / `writes` metadata arrays
(removed in v0.8.1); the `==>`, `-.->`, `---`, `--o`, `-->>`, and `o--o` edge operators;
the `tag-rect` / `delay` / `lin-rect` / `win-pane` / `curv-trap` instance shapes; the
`procs`, `trapezoid` / `inv-trapezoid`, `double-circle`, `doc`, `stadium`, and `circle`
shapes; and labels on `-.-` reference edges.

### Compatibility

The spec is pre-1.0 and not yet released. Forms accepted in earlier drafts (v0.8.0 and
earlier) are not part of the current language; pre-1.0 drafts do not promise to parse
them. Implementations tracking the spec live should follow this draft as the current
target. Once v1.0 ships, the spec becomes a stable contract and the rules in
§Specification Governance apply.

### Still-open items

These items are intentionally not settled in this draft. They need another round before
they become normative.

1. **`connector` parser feasibility.** The `connector` keyword is the decided direction,
   but its grammar integration ("can the parser handle it?") is an implementation
   question tracked with the parser team. If it proves infeasible, the fallback is a
   designated node group.
2. **Edge-id syntax.** Edges may carry metadata (§5.3); the exact id syntax (`e1@--`
   prefix vs. another form) is delegated to the Mermaid edge-id grammar and tracked
   with the parser team.
3. **Whether constraints return.** Directives/constraints remain out of core. A future
   draft may reintroduce them — most likely as a metadata field on the constrained
   element rather than as a container or a dedicated shape.
4. **Final pre-1.0 governance wording** (see §Specification Governance).

Items closed since v0.8.0: shared-state binding syntax (closed by removal of
`reads`/`writes`); instance inheritance (closed by removal of `instance of`).

---

## Specification Governance

This document is a **pre-1.0 draft**. The language is not yet released; the spec is a
moving target shared with downstream consumers (parser, editor, bridge, runtime) so they
can implement against the current direction while it is still being refined.

**Rules:**

1. **Pre-1.0, semantic changes are permitted between draft iterations.** The spec may
   reclassify forms, remove keys, swap canonical operators, or narrow shape semantics
   from one draft to the next. Authors should treat each draft as the current target,
   not as a stable contract. Downstream consumers tracking the language live should
   expect breaking changes until v1.0.
2. **Each draft documents what changed.** A "What's New" summary at the top of this
   document and the version history in `AGENTFLOW-CHANGELOG.md` record the
   iteration-to-iteration deltas while the spec is still under development. These notes
   exist because internal downstream consumers depend on them; they are not a
   backward-compatibility commitment.
3. **No silent drift.** Within a single draft, the normative body describes one
   canonical form per concept. Anything not described in the normative body is
   unsupported, regardless of what previous drafts allowed.
4. **Post-v1.0 governance is stricter.** Once v1.0 ships, the spec becomes a stable
   contract: minor versions are additive only, major versions document migration paths,
   and changes to released semantics require a major-version bump. The current pre-1.0
   mode is a temporary affordance.
5. **Diagnostics and conformance are separated.** This document defines the authoring
   surface. Concrete diagnostic identifiers, per-rule severity assignments, and the
   conformance fixture suite live in a separate diagnostics/conformance specification
   (Appendix A).

---

Agentflow is a diagram type for describing multi-agent systems — what each flow does,
how work is sequenced between flows, what tools they can call, what permissions govern
the system, and what data they exchange.

---

## 1. Diagram Declaration

Every agentflow diagram begins with the `agentflow` keyword, optionally followed by a
layout direction:

```
agentflow [DIRECTION]
```

| Direction   | Meaning                 |
| ----------- | ----------------------- |
| `TB` / `TD` | Top to bottom (default) |
| `BT`        | Bottom to top           |
| `LR`        | Left to right           |
| `RL`        | Right to left           |

Symbolic shorthand: `>` (LR), `<` (RL), `^` (BT), `v` (TB).

A `direction` statement can also appear inside a `flow` container to override layout
locally:

```
flow f1["Flow"]
  direction LR
  node1 --> node2
end
```

---

## 2. Frontmatter Configuration

Optional YAML frontmatter before the `agentflow` keyword selects config options such as
the layout engine:

```
---
config:
  layout: elk
---
agentflow LR
  ...
```

---

## 3. Containers

v0.8.1 has **one** container keyword: `flow`. The v0.8.0 `agent` container is renamed;
`skill`, `testCase`, `directive`, and `subgraph` containers of earlier drafts remain
removed. `task` is not a container; it is the default node (§4.3).

A `flow` container follows the standard block form:

```
flow <id>["Title"]
  ...children...
end
```

Connectors (§8) are declared with the `connector` keyword but are leaf declarations, not
containers — they take no `end`.

### 3.1 The `flow` Container

| Keyword | Shape ID    | Visual                                                         | Semantic Meaning                                                                                                                                                |
| ------- | ----------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flow`  | `flowGroup` | Filled background, solid 1.5px border, rx=14, header separator | A **named, composable unit of work**. A flow owns the tasks it executes, may compose other flows, holds an optional model binding, and may declare a `params` / `returns` contract so it can be invoked as a unit. |

A flow can be exposed as an MCP-callable tool by the runtime; another flow calls it
through an action node (§16.7). v0.8.1 has no in-diagram instancing mechanism — reuse
goes through that MCP boundary.

### 3.2 Container Metadata

Metadata is attached with `@{ … }` after the declaration block. **There is no
`agentflow:` sub-block** — presentation keys and domain keys sit together at the top
level of `@{ … }`:

```
flow researcher["Researcher"]
  ...
end
researcher@{
  view: expanded,
  model: "claude-sonnet-4-20250514",
  instruction: "You are a careful researcher. Always cite sources.",
  memory: ["episodic", "semantic"]
}
```

Which keys are valid on which element kind is defined in §10 _Metadata Applicability_.
The presentation-vs-semantic distinction is preserved at the level of *meaning* (§11),
not through syntactic nesting: keys like `view`, `icon`, `style` are presentation;
`model`, `params`, `instruction` are semantic. The `memory` key MUST be a YAML array.

> **Bare vs quoted scalars.** YAML treats `memory: [episodic, semantic]` and `memory:
> ["episodic", "semantic"]` as the same value. The same equivalence applies inside
> `params` value positions: `params: { city: String }` and `params: { city: "String" }`
> parse identically. Authors may use either form. Identifier-like enum values
> (`shape: tool`, `view: expanded`) conventionally appear bare; free-form strings
> (descriptions, instructions) are conventionally quoted. YAML-native booleans,
> numbers, arrays, and mappings retain their native form on the wire.

### 3.3 Containment Rules

Containment defines **structural validity**, not execution ownership. With the
container set reduced to `flow`, the matrix is small:

| Parent | Allowed children                          |
| ------ | ----------------------------------------- |
| `flow` | `flow` (nested), node (task, tool, etc.)  |

> **`tool` and `task` are node categories, not keywords.** A *tool* is any node whose
> resolved shape is `tool` / `subroutine` (§7). A *task* is the default node (§4.3).
> Authors do not write a literal `tool` or `task` keyword.

Tools, tasks, and other leaf nodes cannot be parents. A `connector` declaration (§8) is
a top-level leaf, not a child of a flow. Placements outside this matrix produce a
warning before v1.0 and become validation errors in v1.0.

### 3.4 Nesting Example

```
flow dev_team["Development Team"]
  flow architect["Architect"]
    design["Design System"]
    design@{ instruction: "Produce a system design from the gathered requirements." }
  end
end
```

---

## 4. Nodes

Nodes are the leaf elements — tasks, tools, inputs, references, decisions, actions,
and connectors.

### 4.1 Declaration Syntax

```
id                                # bare node (label = id)
id["Label Text"]                  # labeled node
id["Label"]@{ key: value }        # node with metadata
id{Decision Text}                 # diamond (decision) node — inline syntax
```

Labels support HTML fragments for line breaks: `["First Line<br>Second Line"]`.

The diamond shape has dedicated inline syntax `id{text}` in addition to
`@{ shape: decision }`, making it easy to add decision points without metadata
annotations.

### 4.2 Branching

Agentflow uses `decision` (the diamond shape) as the canonical **branching vertex**.
Alternate-flow routing, approval gates, and mutually exclusive outcomes MUST originate
from a `decision`. Branch labels are carried on the outgoing `-->` edges
(`check -- yes --> approve`). For longer guidance that does not belong on a label, the
edge itself can be given an `instruction` via the edge-metadata mechanism (§5.3).

### 4.3 Node Shapes

Shapes carry semantic weight: a node's shape *is* part of its meaning. Shapes are set
automatically (the default) or explicitly via `@{ shape: … }`. v0.8.1 introduces a set
of **author-friendly aliases** alongside the canonical Mermaid shape IDs.

#### 4.3.1 The Default Shape — a Task

| Shape (alias / canonical)         | Assigned When                       | Visual                                                                | Semantic Meaning                                                                                                                  |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `task` / `roundedRect`            | Default for all user-defined nodes  | Rounded rectangle                                                     | A **task** — a discrete unit of work performed by the enclosing flow.                                                            |
| `task` / `rect`                   | `@{ shape: rect }` (alias `squareRect`) | Square rectangle                                                  | Also a **task**. Remapped to `roundedRect` at render time; semantically identical to the default.                                 |
| `collapsedGroup`                  | Flow has `@{ view: "collapsed" }`   | Title + separator + ellipsis dots; border/fill matches the flow style | A flow whose internals are hidden. Preserves the flow's visual identity while signalling elided detail (progressive disclosure). |

#### 4.3.2 Shape Aliases

The aliases below are the **recommended authoring names** in v0.8.1. The canonical
Mermaid shape IDs (right column) remain accepted equivalents — `shape: tool` and
`shape: subroutine` parse identically.

| Alias       | Canonical (Mermaid) | Visual                            | Semantic Meaning                                                                                                                                                                  |
| ----------- | ------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task`      | `roundedRect`       | Rounded rectangle (default)       | A discrete unit of work performed by the enclosing flow.                                                                                                                          |
| `tool`      | `subroutine`        | Double-bordered rectangle         | A **tool** — a native function definition, external to the LLM, whose signature is provided so it can call it on command (§7). Invoked via a `-->` sequence into the tool node.   |
| `input`     | `lean-right`        | Parallelogram (right-leaning)     | An **input value or parameter** entering the flow from outside. Slant suggests data in motion.                                                                                    |
| `decision`  | `diamond`           | Diamond / rhombus                 | A **decision gate** — the canonical branching vertex (§4.2). Inline form `id{Text}` is equivalent.                                                                                |
| `refdoc`    | `lin-doc`           | Lined document                    | A **reference document or specification** — something read but not produced (style guides, brand manuals, schemas). Attached by a `-.-` reference edge (§5.1, §16.2).             |
| `action`   | `hexagon`           | Hexagon                           | A **call to another flow exposed via MCP** (§16.7). Visually distinct from a low-level `tool` so authors and readers can tell an action call from a primitive function call.    |
| `connector` | `connector`         | Connector node (rounded badge)    | An **external integration point** — declared with the `connector` keyword (§8). Replaces the v0.7.0 `circle` shape.                                                              |

#### 4.3.3 Removed Shapes

These shapes are **not** part of v0.8.1. Using one is a syntax error, not a permissive
ignore:

- `doc` (produced artifact — data passing is implicit, §6).
- `stadium` / `terminal`.
- `circle` (replaced by `connector`).
- `trapezoid` / `inv-trapezoid` (constraint shapes — concept cut).
- `double-circle` (test shape — cut).
- `typeDeclaration` (type declarations removed, §9.1).
- `procs` (external-file references — cross-flow reuse now goes through MCP).
- The standalone `hexagon` role as "condition / classification source" is removed; the
  hexagon shape now means `action`.
- The five per-kind instance shapes (`tag-rect`, `delay`, `lin-rect`, `win-pane`,
  `curv-trap`) — the `instance of` mechanism that introduced them is itself removed.

### 4.4 Node Metadata Fields

All metadata is set via `@{ key: value, … }` at one flat level (§3.2). Which keys are
valid on which element kind is specified in §10 _Metadata Applicability_.

#### 4.4.1 Presentation Fields (affect rendering)

| Field           | Purpose                                              | Example                            |
| --------------- | ---------------------------------------------------- | ---------------------------------- |
| `shape`         | Set node shape (semantic; see §4.3 and §11)          | `tool`, `input`, `refdoc`, `action` |
| `view`          | Collapse/expand control (presentation-only; §11)     | `"collapsed"`, `"expanded"`        |
| `icon`          | Icon identifier (presentation-only; §11)             | Icon name string                   |
| `img`, `w`, `h` | Image and dimensions (presentation-only; §11)        | URL, pixel values                  |
| `class`, `style` | Styling hooks (presentation-only; §13)              | class name, CSS string             |

#### 4.4.2 Domain Fields (semantic)

These carry meaning consumed by tooling. §10 defines which keys are valid on which
element kinds. Two keys are **cross-cutting** — valid on any authored element:
`description` and `instruction` (§10.1).

| Field            | Purpose                                                                                          | Example                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `description`    | Human-readable description (cross-cutting)                                                      | `"Classify data sensitivity"`                      |
| `instruction`    | Free-form guidance compiled into the prompt that triggers this element (cross-cutting)          | `"You are a careful researcher. Always cite sources."` |
| `model`          | LLM model binding (flows; optional — runtime default if omitted)                                | `"claude-opus-4-6"`                                |
| `memory`         | Flow memory categories, YAML array (flows)                                                      | `["episodic", "semantic"]`                         |
| `params`         | Input parameters as a YAML mapping (name → type expression) (flows, tasks, tools)               | `{ city: String, top_k: Int? }`                    |
| `returns`        | Output type contract (flows, tasks, tools)                                                      | `"CoffeeCopy"`, `"String"`                         |
| `execution`      | Execution mode (tasks)                                                                          | `"sequential"`, `"parallel"`                       |
| `retry`          | Retry count on failure (tools)                                                                  | `2`                                                |
| `cache`          | Cache duration (tools)                                                                          | `"30s"`, `"24h"`                                   |
| `validate`       | Validation method for tool output (tools)                                                       | `"json-schema"`, `"strict"`                        |
| `handler`        | External HTTP endpoint for tool execution (tools)                                               | `"http POST https://api.example.com"`              |
| `output`         | Template the output conforms to (tools)                                                         | `"triage_result"`                                  |
| `connectorRef`   | Tool / action binding to a connector (§8.1; dotted form canonical)                            | `"github.create_issue"`, `"llm_api.chat"`          |
| `type`           | Type expression for an input value (input nodes only)                                           | `String`, `Int?`, `"CoffeeCopy"`                   |
| `value`          | Literal value at this point in the flow (input nodes only). Any YAML scalar, list, or mapping.  | `"src/HelloWorld.java"`, `42`, `{ city: "Sthlm" }` |
| `protocol`       | Integration protocol (connector nodes, §8)                                                      | `"mcp"`, `"http"`, `"sql"`                          |
| `endpoint`       | External endpoint (connector nodes, §8)                                                         | `"https://api.example.com"`                        |
| `transport`      | Transport for protocols that require one (connector / tool nodes)                               | `"stdio"`, `"sse"`                                  |
| `command`        | Command line for stdio-based servers (connector / tool nodes)                                   | `"npx -y @mcp/server"`                             |
| `auth`           | Authentication mode (connector nodes, §8)                                                       | `"bearer"`, `"oauth2"`, `"none"`                    |
| `token_required` | Whether a token is required (connector nodes, §8)                                               | `true`, `false`                                    |

---

## 5. Edges

Edges connect nodes and flows. v0.8.1 has **three** operators. Stroke is a rendering
property of the operator, not an independent axis.

### 5.1 Edge Operators

| Operator | Semantic      | Primary meaning                                                                          | Marker                  |
| -------- | ------------- | --------------------------------------------------------------------------------------- | ----------------------- |
| `-->`    | `sequence`    | precedence / execution order — "this happens, then that". Labels OK (branch outcomes).  | single arrow            |
| `-.-`    | `reference`   | non-directional reference — primarily **reference-document attachment** (§16.2). **No labels, no direction.** | dotted line, no arrow   |
| `--x`    | `failure`     | failure / cancellation / escalation path                                                | X endpoint              |

**Removed in v0.8.1 / kept removed:** `---` (replaced by `-.-`); `==>` (data flow —
data passes implicitly through state, §6); `-.->` (instance binding — the `instance of`
mechanism is removed); `--o` (conformance); `-->>` (delegation); `o--o`
(bidirectional).

**Operator rules.**

- `-->` carries execution order. Labels are permitted, most usefully on branches
  leaving a `decision`. Data does not travel along it — steps exchange data through the
  implicit shared state (§6).
- `-.-` carries no direction and **no label**. Its dominant use is attaching a reference
  document (`refdoc`) to the step that consults it. A label on `-.-` is a Tier-1
  diagnostic and is ignored semantically.
- `--x` marks a failure or escalation path between steps or flows (§16.4).

### 5.2 Edge Labels

`-->` edges may carry a label, most usefully on branches leaving a `decision`:

```
check{Approved?}
check -- yes --> publish
check -- no --> revise
```

Labels on `-.-` are **rejected** — a reference edge carries no parameter, channel, or
branch meaning, so a label on it would not mean anything. A label on `-.-` produces a
Tier-1 diagnostic and is ignored semantically.

### 5.3 Edge Metadata

An edge can be addressed by id and given metadata via the normal `id@{ … }` form. The
id syntax follows the Mermaid edge-id grammar (the exact form is delegated to the
parser team — see Still-open items). The only metadata key permitted on an edge in
v0.8.1 is **`instruction`**: free-form guidance the runtime compiles into the prompt
that triggers the next step.

```
check -- yes --> publish
check e1@-- no --> revise
e1@{ instruction: "On rejection, include reviewer comments inline in the revise prompt." }
```

This is rarely needed — branch labels (§5.2) cover the common case. Edge metadata
exists for branches where guidance should not appear as a label.

### 5.4 Container Edges

An edge that touches a `flow` binds at the flow boundary:

- An incoming `-->` targets the flow's **entry boundary**.
- An outgoing `-->` originates at the flow's **completion boundary**.

Because data flows implicitly (§6), there is no container-boundary parameter binding
via edge labels. A flow's `params` / `returns` describe its invocation contract; the
values are resolved at invocation time from the calling flow's context. These rules
produce warnings before v1.0 and become validation errors in v1.0.

### 5.5 Fan-out (& operator)

Send sequencing to multiple targets:

```
orchestrator --> search & analyze & validate
```

The `&` operator is used only in edge fan-out, not in node declarations.

---

## 6. Data Flow

There are no data-flow edges and no shared-state bookkeeping arrays. Steps within a
flow exchange data **implicitly**: the runtime carries the previous step's output into
the next step's prompt, and the LLM (or tool wrapper) does the rest.

In other words: `-->` orders the steps; the runtime threads the data. A step that needs
to constrain what it consumes or produces says so in its **`instruction`** (§4.4.2),
not in a separate metadata array. Tool signatures (`params` / `returns`) declare the
shape the LLM should provide and the shape the tool returns; how those values are
resolved at the call site is runtime territory, not syntax.

Inputs that originate outside the diagram are seeded by **input nodes**
(`shape: input`):

```
city["city"]@{ shape: input, type: String, value: "Stockholm" }
city --> research
```

`value` is the literal seed; `type` records its type expression. Both are semantic
(§11). Missing inputs are caught by flow-level validation (§10.2).

This is a deliberate simplification of v0.8.0's `reads` / `writes` arrays. Tools that
want the LLM to populate parameters from upstream output declare the shape in `params`;
everything else is the runtime's problem.

---

## 7. Tools

A **tool** is a node whose resolved shape is `tool` (canonical Mermaid name:
`subroutine`). A tool is a classic native function definition — external to the LLM —
whose **signature is provided to the LLM so it can call it on command**. Tools are leaf
nodes: no `end`, no children. They are introduced through the shape syntax, not a
dedicated keyword:

```
search_web["Search Web"]
search_web@{
  shape: tool,
  params: { query: String, top_k: Int? },
  returns: "SearchResults",
  retry: 2,
  cache: "24h"
}
```

All tool metadata is optional; only the node id and a resolved `tool` / `subroutine`
shape are structurally required. Tool metadata keys are listed on the `tool` row of
§10.

### 7.1 Definition vs Invocation

A tool **definition** registers a reusable executable primitive and performs no work by
itself. An **invocation** is a use of a tool from execution context: a `-->` sequence
edge from a step inside a flow into the tool's id.

A bare tool definition with no invocation is a definition only.

### 7.2 Parameters

`params` is a YAML mapping: keys are parameter names, values are type expressions
(primitives, user-named types, `T?` optional, `List<T>`, `Map<K,V>`, nested records).
Type expression values may be bare or quoted (§3.2). Source order is preserved by YAML
and is the order positional reasoning uses.

At an invocation site, parameter values are populated by the runtime from prior step
output and any matching inputs. There is no parameter-binding edge label in v0.8.1.

### 7.3 Why a Shape, Not a Keyword

The language expresses a tool through `shape: tool`. A dedicated `tool` keyword would
create a second representation for the same concept, so none is introduced. The
shape-based form is the canonical and only form.

---

## 8. Connectors

A **connector** is a logical reference to an external integration point — an MCP
server, HTTP endpoint, database, event bus, or any system outside the diagram that
tools or actions bind to.

v0.8.1 keeps the `connector` keyword introduced in v0.8.0:

```
connector github["GitHub"]
github@{ protocol: "http", endpoint: "https://api.github.com", token_required: true }
```

A `connector` declaration is a top-level leaf — it takes no `end` and has no children.
The node's own id is the connector identity.

### 8.1 Binding Metadata: `connectorRef`

A tool (§7) or an action node (§16.7) binds to a connector via the `connectorRef`
metadata key. The **dotted form is canonical**:

```
create_issue["Create Issue"]
create_issue@{ shape: tool, connectorRef: "github.create_issue" }
```

The value's interpretation:

- **Dotted form** (canonical, e.g. `"github.create_issue"`) — the substring before the
  first dot is the connector id; the remainder is an opaque operation path interpreted
  by downstream tooling. The dotted prefix names the connector and implies its presence
  in the diagram.
- **Bare connector id** (e.g. `"github"`) — accepted; references a connector by id with
  no operation path specified.

The connector prefix is resolved against declared connectors; the operation portion is
not validated by the spec.

### 8.2 Connector Metadata Keys

On a `connector` node, the following keys are recognised:

- `protocol` — `"mcp"`, `"http"`, `"grpc"`, `"sql"`, `"graphql"`, `"websocket"`, `"amqp"`, `"custom"`.
- `endpoint` — URL, connection string, or endpoint identifier.
- `transport` — transport for protocols that require one (MCP: `"stdio"`, `"sse"`).
- `command` — command line for stdio-based servers.
- `auth`, `token_required` — environment-specific configuration.
- `description`, `instruction` — cross-cutting documentation / guidance fields.

The set is open; downstream tooling may consume additional keys provided they carry no
spec-level meaning.

```
connector github_mcp["GitHub MCP"]
github_mcp@{ protocol: "mcp", transport: "stdio", command: "npx -y @modelcontextprotocol/server-github" }

create_issue@{ shape: tool, connectorRef: "github_mcp.create_issue", returns: "Issue" }
close_issue@{ shape: tool, connectorRef: "github_mcp.close_issue" }
```

> **Parser note.** The `connector` keyword's grammar integration is tracked with the
> parser team and listed in §Still-open items.

---

## 9. Identifier Resolution & External References

With `type` / `template` declarations gone (since v0.8.0) and `instance of` gone (since
v0.8.1), v0.8.1 uses a **single namespace**: nodes, flows, and connectors. Type and
template names are not declared anywhere — they appear only as **string-valued type
expressions** inside metadata (`params`, `returns`, `output`).

Rules:

- All ids in the node/flow/connector namespace MUST be unique. Duplicates are a
  validation error.
- Forward references are permitted.
- Synthetic ids emitted by the renderer (auto-numbered groups) are reserved and MUST
  NOT be declared by authors.

### 9.1 Type and Template Information Is Metadata

The `type` and `template` keyword declarations remain removed. Type and template
information lives entirely in metadata:

- A **type** is named as a string in `params`, `returns`, or `value`'s `type` key:
  `params: { city: String }`, `returns: "CoffeeCopy"`. Type expressions support
  `String`, `Int`, `Float`, `Bool`, `List<T>`, `Map<K,V>`, `T?` (optional), and named
  records.
- A **template** is named as a string in a tool's `output` key:
  `output: "triage_result"`.

There is no `typeDeclaration` shape, no `typesGroup` / `templatesGroup` container, and
no separate reference node for types or templates.

### 9.2 Reference Categories

- **Semantic references.** `connectorRef` prefixes (§8.1) and the implicit type/template
  names inside `params` / `returns` / `output` are resolved against the diagram model
  where applicable. An unresolved `connectorRef` prefix is an error.
- **Hygiene references.** `click` / `href` targets and `class` / `style` references are
  validated for shape and allowed usage, not for existence of the external target
  unless an import resolver is explicitly enabled.

---

## 10. Metadata Applicability

Metadata keys are restricted to the element kinds listed. Keys outside this table are
preserved for downstream tooling but produce a warning.

| Element                    | Valid metadata keys                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `flow`                     | `model` (optional), `memory`, `params`, `returns`                                                                              |
| task (default node)        | `execution`, `params`, `returns`                                                                                               |
| tool (`shape: tool`)       | `params`, `returns`, `retry`, `cache`, `validate`, `handler`, `output`, `transport`, `command`, `connectorRef`                 |
| action (`shape: action`) | `params`, `returns`, `connectorRef`                                                                                           |
| connector (`connector`)    | `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`                                                       |
| input (`shape: input`)     | `type`, `value`                                                                                                                |
| reference doc (`shape: refdoc`) | (presentation only; cross-cutting keys apply)                                                                              |
| edge                       | `instruction` (only)                                                                                                            |

### 10.1 Cross-Cutting

**`description`** and **`instruction`** are valid on **any authored element** (flow,
task, tool, action, input, refdoc, connector, decision) and are therefore omitted
from the per-row restrictions above.

`description` documents the element; `instruction` is the free-form guidance the
runtime compiles into the prompt that triggers the element.

Edges are the one exception: an edge accepts **`instruction` only** in v0.8.1 (see the
"edge" row in the table above). Other keys, including `description`, are not permitted
on edges in this draft.

### 10.2 Validation Rules

- Known key on allowed element → valid.
- `description` or `instruction` on any authored element → valid.
- Unknown key → preserved, warning emitted.
- Known key on wrong element → diagnostic emitted.
- **Removed shape used** → hard error (§4.3.3).
- **Flow with no input node anywhere in its tree** → diagnostic (warning before v1.0,
  error in v1.0). A flow needs at least one input to specify what the user must
  provide at run time; the runtime / editor prompts for any missing values before
  execution.

Concrete diagnostic identifiers and per-rule severity assignments are defined in the
separate diagnostics/conformance specification (Appendix A), not here.

---

## 11. Presentation vs Semantic Fields

The presentation/semantic split survives the v0.7.0 flattening — it is now a property
of each *key's meaning*, not of a syntactic wrapper.

**Presentation-only** controls MUST NOT influence semantic interpretation or
validation:

- `view` (collapsed / expanded; §12)
- `class`, `style`, `classDef`, `linkStyle` (§13)
- `icon`, `img`, `w`, `h`

**Semantic** fields define the meaning of the diagram: all domain keys (§4.4.2),
container kind (`flow`), node **shape** (a `tool` is a tool, an `input` is an input —
shape carries meaning), edge operators, and identifiers. These are the surface against
which validators and downstream tooling reason.

> **Out of scope.** Concrete export-API names, wire formats, and runtime accessors are
> not part of this specification. Implementations may expose semantic content through
> whatever API surface suits their consumers, provided the presentation/semantic
> distinction is respected.

---

## 12. View Control (Expanded / Collapsed)

> Presentation-only; see §11.

A flow can be collapsed to hide its internals:

```
my_flow@{ view: "collapsed" }
```

This renders the flow as a `collapsedGroup` node — a title + separator + ellipsis that
preserves the flow's visual identity.

---

## 13. Styling

> Presentation-only; see §11. Styling does not alter semantic interpretation.

### 13.1 Class Definition and Application

```
classDef important fill:#f9f,stroke:#333,stroke-width:2px
node1:::important
class node1,node2 important
```

### 13.2 Direct Node Styling

```
style node1 fill:#f9f,stroke-width:2px
```

### 13.3 Link Styling

```
linkStyle 0,1 stroke:red,stroke-width:3px
linkStyle default interpolate linear
```

---

## 14. Interactivity

```
click nodeId callback "tooltip"
click nodeId href "url" _blank
```

Click and `href` targets are hygiene references (§9.2) — validated for shape and
allowed usage, not for external existence by default.

---

## 15. Accessibility

```
accTitle: Diagram Title
accDescr: Short description
accDescr {
  Multi-line description
  of the diagram
}
```

---

## 16. Semantic Patterns

Common compositional patterns built only from the canonical operators and shapes above,
so the examples double as conformance cases.

### 16.1 Tool Call Pattern

A tool (`shape: tool`) invoked from inside a flow:

```
flow researcher["Researcher"]
  do_work["do_work"]@{ shape: tool, returns: "OutputType" }
end
```

The type `OutputType` is named directly in `returns`; no separate type-declaration node
is needed (§9.1).

### 16.2 Reference Document Pattern

Non-directional reference (`-.-`) to a specification or guide. No label on `-.-`:

```
gen_html["generate_html"]@{ shape: tool }
style_guide["Brand Guide"]@{ shape: refdoc }
gen_html -.- style_guide
```

### 16.3 Decision / Alternate Flow Pattern

`decision` (diamond) as the branching vertex (§4.2); branch labels ride the `-->`
edges. Longer guidance that should not appear as a label rides on edge metadata
(§5.3):

```
flow reviewer["Reviewer"]
  evaluate["Evaluate Result"]
  check{Approved?}
  publish["Publish"]
  revise["Revise"]

  evaluate --> check
  check -- yes --> publish
  check e1@-- no --> revise
  e1@{ instruction: "Pass reviewer comments through to the revise step." }
end
```

### 16.4 Failure / Escalation Pattern

Failure edges (`--x`) between flows for escalation:

```
flow primary["Primary"]
  attempt["Attempt"]
end
flow fallback["Fallback"]
  recover["Recover"]
end
primary --x fallback
```

### 16.5 Connector Pattern (MCP, HTTP, DB)

A connector declared with the `connector` keyword; tools bind via dotted
`connectorRef` (§8.1):

```
connector github_mcp["GitHub MCP"]
github_mcp@{ protocol: "mcp", transport: "stdio", command: "npx -y @modelcontextprotocol/server-github" }

create_issue["Create Issue"]@{ shape: tool, connectorRef: "github_mcp.create_issue", returns: "Issue" }
close_issue["Close Issue"]@{ shape: tool, connectorRef: "github_mcp.close_issue" }
```

HTTP and database back-ends use `protocol` and `endpoint`:

```
connector orders_api["Orders API"]
orders_api@{ protocol: "http", endpoint: "https://api.example.com/orders" }

connector orders_db["Orders DB"]
orders_db@{ protocol: "sql", endpoint: "postgres://.../orders" }
```

### 16.6 Parallel Execution Pattern

Fan-out with `&` **in edges only**:

```
orchestrator["Orchestrate"]
search["Search"]
analyze["Analyze"]
validate["Validate"]
orchestrator --> search & analyze & validate
```

### 16.7 Action Pattern

Cross-flow reuse goes through MCP: the runtime exposes a flow as an MCP-callable tool,
and another flow invokes it through a **action node** (`shape: action`). Visually
distinct from a low-level `tool`:

```
connector mermaid_mcp["Mermaid MCP"]
mermaid_mcp@{ protocol: "mcp", endpoint: "https://mcp.mermaidchart.example" }

flow status_report["Status Report"]
  gh_query["fetch_recent_activity"]@{ shape: tool }
  draw_chart["create_diagram"]@{ shape: action, connectorRef: "mermaid_mcp.create_diagram" }
  post["post_to_slack"]@{ shape: action, connectorRef: "mermaid_mcp.post_slack" }

  gh_query --> draw_chart --> post
end
```

An action node carries the same metadata as a tool (`params`, `returns`,
`connectorRef`) plus the cross-cutting `description` / `instruction`.

---

## 17. Complete Example

```
agentflow TB
  connector llm_api["LLM API"]
  llm_api@{ protocol: "http", endpoint: "https://api.example.com/chat" }

  flow coffee_team["Coffee Team"]
    city["city"]@{ shape: input, type: String, value: "Stockholm" }

    flow researcher["Researcher"]
      research_loc["research_location"]@{
        shape: tool,
        params: { city: String },
        returns: "String",
        cache: "24h"
      }
      write_copy["write_copy"]@{
        shape: tool,
        connectorRef: "llm_api.chat",
        params: { brief: String },
        returns: "CoffeeCopy",
        retry: 2
      }
      city --> research_loc --> write_copy
    end
    researcher@{
      model: "claude-sonnet-4-20250514",
      instruction: "Research the city and draft English coffee copy citing sources."
    }

    flow translator["Translator"]
      translate_sv["translate_to_swedish"]@{
        shape: tool,
        connectorRef: "llm_api.chat",
        params: { english: CoffeeCopy },
        returns: "BilingualPage"
      }
    end
    translator@{ model: "claude-sonnet-4-20250514" }

    flow designer["Designer"]
      gen_html["generate_html"]@{
        shape: tool,
        connectorRef: "llm_api.chat",
        params: { page: BilingualPage },
        returns: "String"
      }
      style_guide["Nordic Brand Guide"]@{ shape: refdoc }
      gen_html -.- style_guide
    end
    designer@{
      model: "claude-sonnet-4-20250514",
      instruction: "Render the bilingual page as semantic HTML following the brand guide."
    }

    researcher --> translator --> designer
  end
```

Notable forms in this example:

- Metadata is **flat** — presentation and domain keys share one `@{ … }` level (§3.2).
- `flow` is the only container; nested flows express composition. No `agent` keyword.
- Tools are nodes with `shape: tool` (§7), invoked from inside their flow by a `-->`
  sequence; no `tool` keyword and no `instance of`.
- Data passes implicitly between steps (§6). No `reads` / `writes` arrays, no `doc`
  artifact nodes, no `==>` edges.
- `-->` sequences steps and flows; `-.-` attaches the reference document (no label,
  dotted); the three-operator set is complete (§5).
- The LLM back-end is declared with the `connector` keyword (§8); three tools bind via
  `connectorRef: "llm_api.chat"` (dotted form canonical).
- Type names `CoffeeCopy` / `BilingualPage` appear only as strings in `params` /
  `returns` (§9.1) — no `type` declarations.
- `memory` is the one remaining list-valued domain key (`permits`/`requires`/`deny` are
  gone — access control is the runtime's job).
- `instruction` is universal — flows, tasks, tools, and even edges may carry one.

---

## Appendix A: Diagnostics & Conformance

Per the v0.8.0 process change, the **diagnostics and conformance specification is a
separate document**. This authoring spec defines the surface; the
diagnostics/conformance spec defines:

- Concrete diagnostic identifiers and per-rule severity assignments (the Info/Warn →
  Error → Fatal tiering is descriptive in this document only).
- The conformance fixture set — one valid fixture per semantic pattern (flow
  containers, the three edge operators, tool definitions, action nodes, connector
  bindings, edge metadata) and negative fixtures (duplicate ids, removed shapes,
  invalid metadata placement, invalid containment, unresolved `connectorRef`, flow
  with no input).

Each fixture declares its expected outcome (`valid`, `warning`, or `error`) and the
specific message identifier where applicable. The fixture suite is tracked in issue
[#13](https://github.com/Mermaid-Chart/agentflow/issues/13).

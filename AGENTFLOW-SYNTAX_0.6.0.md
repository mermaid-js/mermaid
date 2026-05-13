# Agentflow Syntax Specification

|             |                                |
| ----------- | ------------------------------ |
| **Version** | 0.6.0                          |
| **Status**  | Draft                          |
| **Date**    | 2026-04-27                     |
| **Authors** | Mermaid-Chart / Agentflow Team |

---

## What's New in v0.6.0

This section is for readers coming from v0.5.0. v0.6.0 is a **purely additive** release under the additive-change rule (§Specification Governance, rule 2). No keywords, shapes, or edge operators change.

### TL;DR

1. **Input-value metadata** — input and artifact nodes (`lean-right`, `doc`, `lin-doc`) accept two new metadata keys: `value` (the literal value at this point in the flow) and `example` (an illustrative value for documentation). See §4.4.2 and §8.4.2.
2. **Metadata applicability extended** — §13 lists `value` and `example` on input and artifact nodes.
3. **Semantic export coverage** — both keys are semantic, not presentation, and are retained by `getSemanticModel()` (§14.1).

### Before / after

```text
# v0.5.0 — no concrete-value field; authors had to encode values into description
file_path["file_path"]@{
  shape: lean-right,
  description: "Path to file: src/HelloWorld.java"
}

# v0.6.0 — value is data, description stays prose
file_path["file_path"]@{
  shape: lean-right,
  description: "Path to the file in the GitHub repository to visualize",
  value: "src/HelloWorld.java"
}
```

### Compatibility

A v0.5.0 implementation reading a v0.6.0 diagram preserves the new keys with an "unknown key" warning (§13.2) — no breaking change. A v0.6.0 implementation reading a v0.5.0 diagram is fully compatible.

---

## What's New in v0.5.0

This section is for readers coming from v0.4.0. It names only the **author-visible changes** — what you type differently — and points at the detailed section for each. Everything else in the document is either tighter rules, new validators, or clarifying text against unchanged syntax.

### TL;DR

1. **Tool definitions formalised** — a tool is any named node whose resolved shape is `subroutine` (§8). No new keyword; the existing shape syntax is canonical.
2. **Connectors formalised as metadata** — tools bind to external integration points via the new `connectorRef` metadata key (mirrors `typeRef`/`templateRef`); connector-designated nodes are optionally grouped in a `subgraph connectors` block (§9). No new keyword.
3. **New metadata keys: `typeRef`, `templateRef`** — replacing the overloaded `type` on `procs` reference nodes (§10.2).
4. **List-valued metadata must be YAML arrays** — `permits`, `requires`, `deny`, `fallbacks`, `directives` (§12.1).
5. **Edge operators canonicalised** — `-->` is control, `==>` is data flow; each operator carries a distinct `edgeSemantic` (§5.1).
6. **Container-edge labels are semantic** — `A ==>|city| flow_x` binds to the parameter named `city` (§5.5).

### Before / after — the concrete edits

```text
# tools — no syntax change. The shape-based form is the canonical form,
# now with normative rules around definition vs invocation, what win-pane
# can reference, and where capability validation applies (§8).
# v0.4.0 and v0.5.0:
  do_work["do_work"]
  do_work@{ shape: subroutine, returns: "OutputType", requires: ["llm.query"] }

# connectors — no syntax change. Tools bind to external integration
# points via @{ connectorRef: "<id>" } metadata; optionally group connector
# nodes in a `subgraph connectors` block when the document benefits from
# naming them as first-class elements. The connector-designated node's
# own id IS the connector identity — no self-tag needed (§9).
# v0.5.0:
  subgraph connectors["Connectors"]
    github_mcp["GitHub MCP"]
  end
  github_mcp@{ protocol: "mcp", transport: "stdio", command: "npx -y @mcp/github" }

  create_issue["Create Issue"]
  create_issue@{ shape: subroutine, connectorRef: "github_mcp", returns: "Issue", requires: ["net.write"] }

# typeRef / templateRef replace overloaded `type` on procs nodes
# v0.4.0:
  coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }
  triage_tpl_ref@{ shape: procs, type: "triage_result" }
# v0.5.0:
  coffee_copy_ref@{ shape: procs, typeRef: "CoffeeCopy" }
  triage_tpl_ref@{ shape: procs, templateRef: "triage_result" }

# list-valued metadata is now a YAML array
# v0.4.0:
  researcher@{ permits: "net.read, llm.query" }
# v0.5.0:
  researcher@{ permits: ["net.read", "llm.query"] }

# edge operators carry distinct semantics
# v0.4.0: --> and ==> were data-flow at different stroke weights
# v0.5.0: --> is control, ==> is data flow, -.-> is governance, -->> is delegation

# container-edge labels bind to params
# v0.4.0: label on a data edge into a container was decorative text
# v0.5.0: A ==>|city| flow_x binds to the param named `city`
```

### Behavioural changes against unchanged syntax

- **Branching** — `diamond` is the sole branching vertex; `hexagon` is a classification source (§4.2).
- **Identifier uniqueness** — three namespaces: node/container, type, template; each uniquely named (§10).
- **Containment rules** — each container has an allowed-children set (§3.3); tool definitions (nodes with `shape: subroutine`) are leaves. Connectors (§9) are regular nodes — typically grouped in a `subgraph` for organisation — and are subject to the same node containment rules.
- **Capability evaluation** — the executing agent for a tool invocation is the nearest enclosing `agent` (§12).
- **Metadata applicability** — keys are restricted to the element kinds listed in §13.
- **Presentation vs semantics** — `view`, styling, `icon`, `img`, `w`, `h` are stripped from the new `getSemanticModel()` projection (§14).

### Not changing

Container keywords, inline shape syntaxes (`{text}`, `(((text)))`, `[[text]]`, etc.), direction, frontmatter, accessibility, interactivity, styling surface, `type`/`template` declarations, instance shapes and `def`, and the diagram-declaration keyword are all unchanged.

### Staged rollout

Rules marked "warn before v1.0 / error in v1.0" are specified normatively now but the runtime emits warnings rather than validation errors until v1.0. See `AGENTFLOW-readiness-actions.md` for the three-wave schedule.

---

## Revision History

| Version | Date       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0   | 2026-03-14 | Initial syntax reference: `agent`, `flow`, `task` containers; node shapes; edge types; type declarations; templates; styling; accessibility; complete example.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 0.2.0   | 2026-03-16 | Add diamond shape for decisions; document inline `{text}` syntax; add Decision / Alternate Flow pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 0.3.0   | 2026-03-25 | Add `skill`, `testCase`, `directive` containers with theme support. Add `trapezoid`, `inv-trapezoid`, `double-circle` shapes. Add template sections. Extend metadata fields (strategy, assert, expects, severity, context, rule, validate, handler, directives, transport, command, memory, execution, fallbacks). Add Directive, Lesson, Fallback, MCP Connection, Parallel Execution patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 0.4.0   | 2026-03-25 | Add definition/instance pattern with 5 instance shapes (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`). Add `def` core metadata field for instance-to-definition binding. Formalize as versioned specification with revision history.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 0.5.0   | 2026-04-21 | Semantic tightening per the downstream-readiness review (`AGENTFLOW-readiness-actions.md`). Formalise the **shape-based tool definition model** (§8): a tool is any named node whose resolved shape is `subroutine`, with normative rules for definition vs invocation, what `win-pane` may reference, the canonical metadata contract, and where capability validation applies. Formalise **connectors as metadata** (§9): tools bind via the new `connectorRef` key (mirrors `typeRef`/`templateRef`); connector-designated nodes are optionally grouped in a `subgraph connectors` block — no new keyword, with a normative rationale for when one would be justified. Canonicalise edge semantics with a new first-class `edgeSemantic` field (§5). Formalise identifier resolution across three namespaces (§10). Define definition / instance inheritance (§11). Add container-edge boundary semantics with explicit parameter-name label binding (§5.5). Add capability evaluation with executing-agent resolution (§12). Add metadata applicability table (§13). Split `type` / `template` / `src` reference kinds into `typeRef`, `templateRef`, and `src`. Declare presentation-only controls explicitly non-semantic and introduce a `getSemanticModel()` export projection (§14). Audit examples and add a Conformance Tests appendix. Some rules are specified now and enforced from v1.0 onward per the three-wave rollout in `AGENTFLOW-readiness-actions.md`. |
| 0.6.0   | 2026-04-27 | Add input-value metadata: `value` and `example` keys on data-artifact nodes (`lean-right`, `doc`, `lin-doc`). `value` is the literal value at a point in the flow; `example` is an illustrative value for documentation. Both keys are semantic and retained by `getSemanticModel()`. Purely additive under the additive-change rule — no keywords, shapes, or edge operators change. §4.4.2, §8.4.2, §13 updated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Specification Governance

This document is a **contract**. Downstream teams build tooling, renderers, and diagram libraries against the semantic mappings defined here.

**Rules:**

1. **No semantic drift.** Once a shape, keyword, or edge type is assigned a meaning in a released version, that meaning is locked. It cannot be changed without a major version bump and explicit migration path.
2. **Additive changes only** in minor versions. New shapes, keywords, fields, and patterns may be added. Existing definitions must not be altered.
3. **Every change gets a revision entry.** No undocumented modifications.
4. **Reference kinds are separated.** Reference nodes (`procs` shape) use `typeRef`, `templateRef`, or `src` — exactly one. The legacy overloaded `type` key remains accepted with a deprecation warning and is scheduled for removal in v1.0. Instance references (shapes `tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`) use `def`.

---

Agentflow is a diagram type for describing multi-agent systems — who does what, what data flows where, what permissions govern the system, and what contracts bind the parts together.

---

## 1. Diagram Declaration

Every agentflow diagram begins with the `agentflow` keyword, optionally followed by a layout direction:

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

A `direction` statement can also appear inside any container to override layout locally:

```
agent a1["Agent"]
  direction LR
  node1 --> node2
end
```

---

## 2. Frontmatter Configuration

Optional YAML frontmatter before the `agentflow` keyword selects config options such as the layout engine:

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

Containers are the structural backbone of agentflow. They group nodes into semantic units and can be nested subject to the containment rules in §3.3. Every container follows the same syntax:

```
<keyword> <id>["Title"]
  ...children...
end
```

Leaf declarations `type` (§6) and `template` (§7) are **not** containers — they register standalone elements and do not use `end`. Tool definitions (§8) are likewise leaf nodes but are introduced through the existing shape syntax rather than a dedicated keyword. Connectors (§9) are not a separate construct at the grammar level; they are modelled as metadata bindings (and optionally as referenceable nodes grouped in a `subgraph`).

### 3.1 Container Types

| Keyword     | Shape ID         | Visual                                                         | Semantic Meaning                                                                                                                                              |
| ----------- | ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`     | `agentGroup`     | Filled background, solid 1.5px border, rx=14, header separator | An **autonomous actor** with an LLM identity. Agents hold a model binding and a permission set; they own the tasks they execute.                              |
| `flow`      | `flowGroup`      | Transparent, solid 0.75px border, rx=10                        | A **composable sequence** of steps that can be invoked as a unit. Flows define an input/output contract (`params`/`returns`) and may be nested inside agents. |
| `task`      | `taskGroup`      | Transparent, dashed 0.75px border, rx=10                       | A **discrete unit of work** within an agent. Tasks group related operations (tool calls, data transforms) into a named, bounded scope.                        |
| `skill`     | `skillGroup`     | Pill-shaped (rx=20), filled, solid 1px border                  | A **composed capability** with a strategy orchestrating multiple tools. Skills encapsulate reusable multi-step operations.                                    |
| `testCase`  | `testGroup`      | No fill, solid 2px border, sharp corners (rx=0)                | A **verification container** asserting expected behavior. The rigid square edges signal formal verification.                                                  |
| `directive` | `directiveGroup` | Light fill, dot-dash 1.5px border, rx=2                        | A **reusable behavioral constraint** governing agent/tool behavior. Defines guardrails, policies, or rules.                                                   |
| `subgraph`  | `rect`           | Default cluster rectangle                                      | Generic grouping container inherited from flowchart. Rarely used directly in agentflow; unrestricted containment for legacy compatibility.                    |

Synthetic (auto-generated, not authored directly):

| Shape ID         | Visual                                          | Semantic Meaning                                                                     |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `typesGroup`     | Light tertiary fill, dashed 0.75px border, rx=6 | A visual container that collects all `type` declarations defined in the diagram.     |
| `templatesGroup` | Light tertiary fill, dashed 0.75px border, rx=6 | A visual container that collects all `template` declarations defined in the diagram. |

### 3.2 Container Metadata

Containers accept metadata via `@{...}` after their declaration block:

```
agent researcher["Researcher"]
  ...
end
researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] }
```

Which metadata keys are valid on which container kind is defined in §13 _Metadata Applicability_. Values that are lists (`permits`, `requires`, `deny`, `fallbacks`, `directives`) MUST be YAML arrays; the legacy comma-separated string form is accepted with a deprecation warning and removed in v1.0.

> **When to use `skill` vs `flow`:** A `flow` is a general-purpose composable sequence — it models _what happens in what order_. A `skill` is a higher-level capability that bundles tools with a `strategy` — it models _what an agent can do_. Use `flow` when the emphasis is on the step sequence; use `skill` when the emphasis is on the composed capability and how tools coordinate (parallel, round-robin, etc.).

### 3.3 Containment Rules

Containment defines **structural validity**, not execution ownership. Execution ownership is resolved separately by the capability rules in §12 — it can cross structural boundaries through delegation and instance references.

The following matrix lists allowed children for each parent container:

| Parent      | Allowed children                                                |
| ----------- | --------------------------------------------------------------- |
| `agent`     | `flow`, `task`, `skill`, `directive`, `testCase`, `tool`, node  |
| `flow`      | `task`, `agent`, `skill`, `directive`, `testCase`, `tool`, node |
| `task`      | `tool`, `directive`, node                                       |
| `skill`     | `tool`, `flow`, `directive`, node                               |
| `directive` | node                                                            |
| `testCase`  | `directive`, node                                               |
| `subgraph`  | unrestricted (legacy escape hatch)                              |

> **`tool` in this matrix is a categorical kind, not a keyword.** It denotes any node whose resolved shape is `subroutine` (or one of its aliases — see §8). Authors do not write a literal `tool` keyword anywhere.

Tools are leaves; they cannot be parents. Connectors (§9) are regular nodes — typically grouped in a `subgraph connectors` block at top level — and fall under the `node` row of the matrix. Placements outside this matrix produce a warning before v1.0 and become validation errors in v1.0.

### 3.4 Nesting Example

```
agent dev_team["Development Team"]
  flow build_app["Build Application"]
    agent architect["Architect"]
      task design["Design System"]
        requirements["requirements"]
        design_system["design_system"]
        requirements ==> design_system
      end
    end
  end
end
```

---

## 4. Nodes

Nodes are the leaf elements — individual steps, data artifacts, tools, or references.

### 4.1 Declaration Syntax

```
id                                # bare node (label = id)
id["Label Text"]                  # labeled node
id["Label"]@{ key: value }       # node with metadata
id{Decision Text}                 # diamond (decision) node — inline syntax
```

Labels support HTML fragments for line breaks: `["First Line<br>Second Line"]`.

The diamond shape has dedicated inline syntax `id{text}` in addition to `@{ shape: diamond }`, making it easy to add decision points and alternate-flow routing without metadata annotations.

### 4.2 Branching

Agentflow uses `diamond` as the canonical **branching vertex**. Alternate-flow routing, approval gates, and mutually exclusive outcomes MUST originate from a `diamond`.

The `hexagon` shape is a **condition or classification source**. Its outgoing edges feed a branch but a `hexagon` is not itself the branching vertex. A `hexagon` with multiple branch-labelled outgoing edges produces a validation warning.

### 4.3 Node Shapes

Shapes carry semantic weight. They are set either automatically by the system or explicitly via `@{ shape: ... }`.

#### 4.3.1 System-Assigned Shapes

| Shape ID          | Assigned When                          | Visual                                                                | Semantic Meaning                                                                                                                                                                                      |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roundedRect`     | Default for all user-defined nodes     | Rounded rectangle                                                     | General-purpose step or data node. The default shape when no explicit annotation is provided.                                                                                                         |
| `collapsedGroup`  | Container has `@{ view: "collapsed" }` | Title + separator + ellipsis dots; border/fill matches container type | A container whose internals are hidden. Preserves the container's visual identity (agent/flow/task/skill/testCase/directive) while signalling that detail is elided. Used for progressive disclosure. |
| `typeDeclaration` | For each `type` declaration            | `<<kind>>` badge + bold name + separator + fields/expression          | A data contract defining the shape of information flowing between agents and tasks.                                                                                                                   |

#### 4.3.2 User-Annotated Shapes

Set explicitly via `@{ shape: <name> }`:

| Shape ID        | Aliases                                     | Visual                        | Semantic Meaning                                                                                                                                                                                         |
| --------------- | ------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subroutine`    | `subprocess`, `subproc`, `framed-rectangle` | Double-bordered rectangle     | A **callable tool or function**. The canonical form for a tool definition (§8). Any of the listed aliases marks the node as a tool.                                                                      |
| `doc`           | —                                           | Curled-corner document        | A **data artifact** — a document, report, or structured output produced or consumed by a step.                                                                                                           |
| `lean-right`    | `in-out`                                    | Parallelogram (right-leaning) | An **input value or parameter** entering the flow from outside. The slant visually suggests data in motion.                                                                                              |
| `lin-doc`       | `lined-document`                            | Lined document                | A **reference document or specification** — something read but not produced by the current flow (e.g., style guides, brand manuals, schemas).                                                            |
| `procs`         | —                                           | Stacked process               | An **external reference** to a type, template, or another diagram. Uses `typeRef`, `templateRef`, or `src` metadata — exactly one; see §10.                                                              |
| `stadium`       | `terminal`                                  | Stadium / pill shape          | A **terminal or boundary node** — an entry point, exit point, or named endpoint in the flow.                                                                                                             |
| `hexagon`       | `hex`                                       | Hexagon                       | A **condition or classification source** (not a branching vertex; see §4.2).                                                                                                                             |
| `circle`        | —                                           | Circle                        | A **join point, event, or signal** — a coordination primitive where multiple paths converge or an event is emitted.                                                                                      |
| `diamond`       | —                                           | Diamond / rhombus             | A **decision gate or approval checkpoint** — the canonical branching vertex (§4.2).                                                                                                                      |
| `trapezoid`     | —                                           | Trapezoid                     | A **behavioral directive or constraint** — a rule, policy, or guardrail that governs agent or tool behavior.                                                                                             |
| `inv-trapezoid` | —                                           | Inverted trapezoid            | An **inverted directive** — alternate orientation for constraint nodes.                                                                                                                                  |
| `double-circle` | `doublecircle`                              | Double circle                 | A **test assertion node** — signals a verification checkpoint or assertion in a test flow. Note: inline syntax `(((...)))` produces the legacy alias `doublecircle`; prefer `@{ shape: double-circle }`. |
| `rect`          | `squareRect`                                | Square rectangle              | Remapped to `roundedRect` at render time. Equivalent to the default shape.                                                                                                                               |

#### 4.3.3 Instance Shapes

Instance shapes are lightweight references to definitions. The full validity and inheritance model is specified in §11.

Set via `@{ shape: <instance-shape>, def: "<definition-id>" }`:

| Shape ID                 | Aliases     | Visual                   | Instance Of              |
| ------------------------ | ----------- | ------------------------ | ------------------------ |
| `tagged-rectangle`       | `tag-rect`  | Rectangle with a tag/tab | **Agent** definition     |
| `half-rounded-rectangle` | `delay`     | Half-rounded rectangle   | **Flow** definition      |
| `lined-rectangle`        | `lin-rect`  | Lined/shaded rectangle   | **Skill** definition     |
| `window-pane`            | `win-pane`  | Four-pane window         | **Tool** definition      |
| `curved-trapezoid`       | `curv-trap` | Curved trapezoid         | **Directive** definition |

**Usage:**

```
agent researcher["Researcher"]
  task step1["Research"]
    search["search"]
  end
end
researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] }

researcher_inst["Researcher"]
researcher_inst@{ shape: tag-rect, def: "researcher" }
```

The instance node `researcher_inst` inherits all domain metadata (model, permits) from the `researcher` definition via `def`. Rendering fields do not inherit; see §11.

### 4.4 Node Metadata Fields

All metadata is set via `@{ key: value, ... }`. Which keys are valid on which element kind is specified in §13 _Metadata Applicability_.

#### 4.4.1 Core Fields (affect rendering)

| Field           | Purpose                                              | Example                           |
| --------------- | ---------------------------------------------------- | --------------------------------- |
| `shape`         | Override node shape                                  | `subroutine`, `doc`, `lean-right` |
| `def`           | Definition reference (for instance shapes)           | `"researcher"`, `"build_site"`    |
| `view`          | Collapse/expand control (presentation-only; see §14) | `"collapsed"`, `"expanded"`       |
| `typeRef`       | Type reference (for `procs` shape)                   | `"CoffeeCopy"`                    |
| `templateRef`   | Template reference (for `procs` shape)               | `"triage_result"`                 |
| `src`           | External file reference (for `procs` shape)          | `"./permit-tree.mmd"`             |
| `icon`          | Icon identifier (presentation-only; see §14)         | Icon name string                  |
| `img`, `w`, `h` | Image and dimensions (presentation-only; see §14)    | URL, pixel values                 |

> **Legacy `type` key.** Writing `type: "..."` on a `procs` node is still accepted with a deprecation warning. See §10.2 for the resolution rule and §10 for the normative reference-kind split.

#### 4.4.2 Domain Fields (pass-through metadata)

These fields carry semantic meaning consumed by tooling but do not change how the node renders. The `@{}` mechanism accepts any valid YAML key; §13 defines which keys are valid on which kinds.

| Field            | Purpose                                                            | Example                                 |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------- |
| `description`    | Human-readable description (valid on any authored element)         | `"Classify data sensitivity"`           |
| `value`          | Literal value at a point in the flow (data-artifact nodes, §8.4.2) | `"src/HelloWorld.java"`, `42`           |
| `example`        | Illustrative value for documentation (data-artifact nodes, §8.4.2) | `"./input.csv"`                         |
| `returns`        | Output type contract                                               | `"CoffeeCopy"`, `"String"`              |
| `requires`       | Required capabilities (YAML array)                                 | `["net.read", "llm.query"]`             |
| `deny`           | Denied capabilities (YAML array)                                   | `["llm.query"]`                         |
| `connectorRef`   | Tool binding to a connector (§9.1; tool definitions only)          | `"github_mcp"`, `"github.create_issue"` |
| `source`         | External source binding                                            | `"search.duckduckgo(query)"`            |
| `params`         | Input parameters                                                   | `"city :: String"`                      |
| `retry`          | Retry count on failure                                             | `2`                                     |
| `cache`          | Cache duration                                                     | `"30s"`, `"24h"`                        |
| `output`         | Template conformance                                               | `"triage_result"`                       |
| `model`          | LLM model binding (containers)                                     | `"claude-opus-4-6"`                     |
| `permits`        | Granted capabilities, YAML array (containers)                      | `["net.read", "llm.query"]`             |
| `strategy`       | Orchestration strategy (skill containers)                          | `"parallel"`, `"round-robin"`           |
| `assert`         | Assertion expression (testCase containers)                         | `"output.length > 0"`                   |
| `expects`        | Expected behavior (testCase containers)                            | `"non-empty response"`                  |
| `severity`       | Impact level (directive / lesson nodes)                            | `"high"`, `"critical"`                  |
| `context`        | Situational context                                                | `"production outage"`                   |
| `rule`           | Behavioral rule text                                               | `"always verify backups"`               |
| `validate`       | Validation method for tool output                                  | `"json-schema"`, `"strict"`             |
| `handler`        | External HTTP endpoint for tool execution                          | `"http POST https://api.example.com"`   |
| `directives`     | Prompt directive references, YAML array                            | `["clinical_reasoning", "safety"]`      |
| `protocol`       | Integration protocol (on a connector-designated node, §9)          | `"mcp"`, `"http"`, `"sql"`              |
| `endpoint`       | External endpoint (on a connector-designated node, §9)             | `"https://api.example.com"`             |
| `transport`      | Transport for protocols that require one                           | `"stdio"`, `"sse"`                      |
| `command`        | Command line for stdio-based servers                               | `"npx -y @mcp/server"`                  |
| `auth`           | Authentication mode (on a connector-designated node, §9)           | `"bearer"`, `"oauth2"`, `"none"`        |
| `token_required` | Whether a token is required (on a connector-designated node, §9)   | `true`, `false`                         |
| `memory`         | Agent memory type                                                  | `"episodic"`, `"semantic"`              |
| `execution`      | Task execution mode                                                | `"sequential"`, `"parallel"`            |
| `fallbacks`      | Fallback strategy, YAML array                                      | `["retry-3", "escalate"]`               |

---

## 5. Edges

Edges connect nodes and containers and carry semantic weight through their operator form.

### 5.1 Edge Operators

Each operator has one **primary semantic**. Stroke is a rendering property of the semantic, not an independent axis.

| Operator | `edgeSemantic` value | Primary semantic                         | Marker                      |
| -------- | -------------------- | ---------------------------------------- | --------------------------- |
| `-->`    | `control`            | precedence / control sequence            | single arrow                |
| `==>`    | `data`               | data flow / artifact transfer            | thick single arrow          |
| `--o`    | `conformance`        | contract conformance / output binding    | circle endpoint             |
| `-->>`   | `delegation`         | delegation / spawn / authority hand-off  | double chevron              |
| `--x`    | `failure`            | failure / cancellation                   | X endpoint                  |
| `---`    | `association`        | association (non-driving)                | line, no arrow              |
| `-.->`   | `governance`         | governance / advisory / constraint apply | dotted                      |
| `o--o`   | `bidirectional`      | bidirectional data sync                  | circle endpoints both sides |

> **Migration note.** `==>` denotes **data flow**. It is no longer merely a thick rendering variant of `-->`. Downstream tooling SHOULD read the `edgeSemantic` field in the exported model as the authoritative semantic; the legacy `type` and `stroke` fields are retained for rendering continuity. A compatibility flag (`legacyEdgeSemantics`) preserves v0.4.0 interpretation during migration; the canonical mapping becomes the default in v1.0, and edges whose semantic contradicts endpoint kinds become validation errors from v1.0 onward.

### 5.2 Edge Labels

Labels are placed between pipe characters or inline:

```
A -->|"label text"| B
A -- label text --> B
sentinel --alert--> monitor
writer ==>|Article Draft| editor
input ==>|query| search_web
```

The last form — a labelled `==>` edge — is the **most semantically loaded** label form. When the target is a container boundary (§5.5) or a tool definition with declared `params` (§8.4.1), the label is the **parameter name** the edge binds to. Outside those contexts the label is decorative.

### 5.3 Edge Stroke

Stroke presentation follows the operator: thick is the rendering of `==>`, dotted is the rendering of `-.->`. An operator MUST NOT carry a non-canonical stroke combination (e.g. a "thick dotted" edge has no semantic).

### 5.4 Fan-out (& operator)

Send one output to multiple targets:

```
classifier ==>|Classification Report| processor & auditor
```

The `&` operator is used only in edge fan-out, not in node declarations.

### 5.5 Container Edges

An edge that touches a container has a defined binding at the container boundary:

- An incoming **precedence edge** (`-->`) to a container targets the container's **entry boundary**.
- An outgoing precedence edge from a container originates at its **completion boundary**.
- An incoming **data edge** (`==>`) binds to a parameter declared in the container's `params`.
- An outgoing data edge originates from the container's `returns`.

Data edges on containers without a declared `params` / `returns` are invalid.

On an incoming data edge, the edge label is interpreted as a **parameter name**, not decorative text:

- If `params` declares one parameter, the label is optional and binds implicitly.
- If `params` declares multiple parameters, the label is required and MUST match one of them exactly. `A ==>|city| flow_x` binds `city`.

`returns` is single-valued at the container boundary; outgoing data edges do not require label binding, and any label on such an edge is decorative. A future version may introduce multiple named return channels, at which point the same parameter-name label rule would apply to outgoing edges.

These rules produce warnings before v1.0 and become validation errors in v1.0.

---

## 6. Type Declarations

Types define the data contracts that flow between agents and tasks. Type names live in their own namespace (§10); a `type Name` and a `template Name` may coexist and are disambiguated by the explicit `typeRef` / `templateRef` keys at reference sites.

Three forms:

### 6.1 Opaque Type (name only, no structure)

```
type TypeName
```

### 6.2 Alias Type (reference to another type)

```
type UserId = String
type OptionalReport = Report?
type Reports = List<Report>
type Lookup = Map<String, Report>
```

### 6.3 Record Type (structured fields)

```
type CoffeeCopy = Record {
  hero_tagline: String
  hero_subtitle: String
  about: String
  menu_item: String * 6
}
```

Field multiplicity (`* N`) indicates the expected number of instances.

Type expressions support: `String`, `Int`, `Float`, `Bool`, `List<T>`, `Map<K,V>`, `T?` (optional), and nested records.

### 6.4 Rendering

Types are automatically collected into a `typesGroup` container. They render as `typeDeclaration` shapes showing: `<<kind>>` badge, bold name, separator, and fields/expression.

To expand the types container visually:

```
types@{ view: expanded }
```

---

## 7. Template Declarations

Templates define reusable structural patterns with typed fields, multiplicities, and descriptions. Template names live in their own namespace (§10), distinct from types and from nodes/containers.

```
template %triage_result {
  INCIDENT_ID: String        <<generated incident ID>>
  SEVERITY: String           <<P0 through P4 with justification>>
  TITLE: String              <<concise incident title>>
  BLAST_RADIUS: String       <<affected services and users>>
  TIMELINE: String * 3       <<Timestamp | Event | Source>>
}
```

Each field has: `name: Type [* multiplicity] <<description>>`. The `%` prefix is optional but conventional for template names.

### 7.1 Template Sections

Templates can be divided into named sections using the `section` keyword:

```
template %clinical_note {
  section DIAGNOSIS
  PRIMARY_DX: String        <<primary diagnosis>>
  SECONDARY_DX: String * 3  <<secondary diagnoses>>
  section MANAGEMENT
  MEDICATION: String * 5    <<medication orders>>
  FOLLOW_UP: String         <<follow-up plan>>
}
```

Section markers produce entries with `kind: 'section'` in the fields array, enabling renderers to visually group related fields.

### 7.2 Template References

Nodes reference templates via `templateRef` on a `procs` shape:

```
triage_alert@{ shape: subroutine, output: "triage_result" }
triage_tpl_ref["triage_result"]
triage_tpl_ref@{ shape: procs, templateRef: "triage_result" }
```

Templates are automatically collected into a `templatesGroup` container. To expand visually:

```
templates@{ view: expanded }
```

---

## 8. Tool Definitions

A **tool definition** is a named node whose resolved shape is `subroutine`. Tools are leaf nodes — no `end`, no children — and are introduced through the existing shape syntax, not through a dedicated keyword:

```
search_web["Search Web"]
search_web@{
  shape: subroutine,
  returns: "SearchResults",
  requires: ["net.read"],
  retry: 2,
  cache: "24h"
}
```

Tool metadata keys are listed in §13 _Metadata Applicability_ under the `tool` row. Tool definitions live in the node/container namespace (§10).

### 8.1 Definition vs Invocation

A tool **definition** registers a reusable executable primitive and performs no work by itself. Writing a bare tool definition at the top level (or inside any container the matrix in §3.3 permits) is valid.

An **invocation** is a use of a tool definition from execution context. The invocation forms supported in v0.x / 1.0 are:

- an edge (typically `==>` for data flow into the tool, or `-->` for control sequencing) from any node that is structurally inside a `task`, `flow`, or `skill` container — including input nodes (`lean-right`), data-artifact nodes (`doc`, etc.), and other regular nodes within those containers — into the tool definition's ID; or
- a `win-pane` instance (§11) whose `def` points at the tool definition, placed inside an executing container.

A bare tool definition at the top level — with no incoming edges from inside an executing container — is a definition only and is **not** invoked. Additional invocation forms may be added in a later version under the additive-change rule.

Capability evaluation (§12) runs **only at invocation sites**, never at the definition site.

### 8.2 Rendering and Aliases

Tool definitions render with the `subroutine` visual. The `subroutine` shape is identified by its canonical name and its accepted aliases (`subprocess`, `subproc`, `framed-rectangle`); any of these mark the node as a tool definition.

### 8.3 Why a Shape, Not a Keyword

Earlier drafts of this spec proposed a first-class `tool` keyword. That direction was withdrawn in revision 5 of `AGENTFLOW-readiness-actions.md`: the language already expresses tools through `shape: subroutine` and `win-pane`, and a keyword would create a second representation for the same concept. The shape-based form is the canonical and only form.

### 8.4 Tool `params` and Edge Binding

Tool `params` is part of v0.5.0. It is a declarative input parameter set on a tool definition, parallel to the `params` field already used on container boundaries (§5.5). It appears on the `tool` row of the §13 metadata applicability table and lets downstream tooling validate that an invocation provides the inputs the tool expects.

```
search_web["search_web"]
search_web@{
  shape: subroutine,
  params: "query :: String",
  returns: "SearchResults",
  requires: ["net.read"]
}
```

#### 8.4.1 Edge-Label Binding into a Tool

Incoming **data edges** (`==>`) into a tool definition use the same parameter-binding rule that container boundaries use (§5.5):

- If the tool declares **no `params`**, an incoming data edge is allowed but unbound. The edge label, if present, is decorative.
- If the tool declares **exactly one parameter**, the edge label is optional. When omitted, the edge binds to that parameter implicitly.
- If the tool declares **multiple parameters**, the edge label is **required** and MUST match exactly one declared parameter name. A missing or non-matching label is a validation error.

```
search_web@{
  shape: subroutine,
  params: "query :: String, top_k :: Number"
}

input_query["search term"]
top_k_node["10"]

input_query ==>|query| search_web
top_k_node ==>|top_k| search_web
```

Control edges (`-->`) into a tool sequence the invocation but do not bind parameters; their labels are decorative.

#### 8.4.2 Input-Value Metadata (v0.6.0)

> **Scope note.** These keys live on **data nodes**, not on tool definitions. They are described here because their primary use is providing concrete inputs into parameterised tools (§8.4.1). The metadata applicability is canonical in §13; the field rows are listed in §4.4.2.

Input and artifact nodes accept two metadata keys for carrying concrete or illustrative values:

| Key       | Purpose                                                          |
| --------- | ---------------------------------------------------------------- |
| `value`   | The literal value at this point in the flow.                     |
| `example` | An illustrative value used for documentation, not for execution. |

Both are valid on input nodes (`lean-right`) and artifact nodes (`doc`, `lin-doc`). Both accept any YAML scalar, list, or mapping. They are NOT valid on tool definitions, container nodes, or reference nodes.

```
file_path["file_path"]@{
  shape: lean-right,
  description: "Path to the file in the GitHub repository to visualize",
  value: "src/HelloWorld.java"
}
```

**Required vs optional.** Both keys are optional. A data node without either is fully valid. Authors SHOULD prefer `value` for inputs that have a concrete chosen value, and `example` for documentation cases where the value shown is illustrative. When both appear on the same node, `value` is authoritative for execution; `example` is documentation only.

**Edge-binding interaction.** `value` does not change parameter-binding rules (§5.5, §8.4.1). When an input node carrying a `value` flows into a parameterised tool or container, the binding still resolves by edge label (or the single-parameter implicit rule). `value` is the data being bound, not the binding mechanism.

```
file_path["file_path"]@{ shape: lean-right, value: "src/HelloWorld.java" }
read_file["read_file"]@{ shape: subroutine, params: "path :: String" }

file_path ==>|path| read_file
```

**Semantic export.** Both `value` and `example` are semantic fields, not presentation. They are retained by the `getSemanticModel()` projection (§14.1).

**Out of scope for v0.6.0.** Type-conformance of `value` against a node's declared type is not validated in v0.6.0 — the value is recorded as inert metadata. A future version may add conformance checking under the additive-change rule.

---

## 9. Connectors (Metadata-based)

A **connector** is a logical reference to an external integration point — an MCP server, HTTP endpoint, database, event bus, or any other system outside the diagram that tools and agents bind to.

Agentflow does not introduce a dedicated `connector` declaration keyword in this revision. Connectors are modelled as **`connectorRef` metadata bindings** on the tool side and, where needed, as **referenceable nodes grouped using existing constructs** (typically `subgraph`) on the connector side. A `connector` keyword would only be justified if connectors were promoted into a distinct first-class category with identity, validation, and reference semantics beyond simple binding metadata — see §9.5 below.

### 9.1 Binding Metadata: `connectorRef`

A **tool definition** (§8) binds to a connector via the **`connectorRef`** metadata key. `connectorRef` is valid only on tool definitions; widening it to other binding sites is an additive change reserved for a later version:

```
save_diagram["save_diagram"]
save_diagram@{
  shape: subroutine,
  connectorRef: "mermaid.create_document",
  description: "Save diagram to Mermaid Chart platform"
}
```

The key name mirrors `typeRef` and `templateRef` (§10.2): all three are reference keys that name something declared elsewhere in the diagram or interpreted by downstream tooling.

The string value's interpretation depends on its form (this is the weak-reference rule from §10.1):

- A **bare id** (e.g. `"github_mcp"`) is treated as a weak in-diagram reference. The validator resolves it against the node namespace:
  - **No node with that id exists** → emit `CONNECTOR_REF_UNRESOLVED` (warning before v1.0; error in v1.0). Catches typos.
  - **Node exists and is a connector-designated node** (per §9.2) → resolves cleanly, no diagnostic.
  - **Node exists but is NOT connector-designated** (it has no `protocol`/`endpoint`/`transport`/`command`/`auth`/`token_required` field) → emit `CONNECTOR_REF_NOT_A_CONNECTOR` (warning before v1.0; error in v1.0). The reference looked like an in-diagram resolution but landed on a node that isn't a connector.
- A **dotted form** (`"github.create_issue"`) or a **URL-like string** is treated as opaque and is not validated. Downstream tooling interprets it as it sees fit (operation paths, endpoints, etc.).

### 9.2 Connector-Designated Nodes (optional)

A **connector-designated node** is any node that carries one or more **connector configuration fields**: `protocol`, `endpoint`, `transport`, `command`, `auth`, or `token_required`. The presence of any one of these fields is what designates the node. The node exports its **own node id** as the connector identity — no self-tagging key is needed.

When a diagram benefits from naming connectors as first-class document elements — e.g. to attach configuration, hold a description, or visually group them — declare them using existing node and grouping constructs:

```
subgraph connectors["Connectors"]
  mermaid["Mermaid Chart"]
  github["GitHub"]
end
mermaid@{ protocol: "http", endpoint: "https://mermaid.live", token_required: true }
github@{ protocol: "http", endpoint: "https://api.github.com", token_required: true }

save_diagram["save_diagram"]
save_diagram@{
  shape: subroutine,
  connectorRef: "mermaid.create_document",
  description: "Save diagram to Mermaid Chart platform"
}

create_issue["Create Issue"]
create_issue@{
  shape: subroutine,
  connectorRef: "github.create_issue",
  requires: ["net.write"]
}
```

The grouping `subgraph` carries no special semantics — it's an organising hint to readers and to layout. The validator's `connectorRef` resolution looks up the node by id; whether it's inside a `connectors` subgraph or at the top level is a layout choice.

### 9.3 Why two keys instead of one

Earlier drafts of §9 used `connector` for both roles — declaring a connector's identity on the connector-designated node, and referencing one from a binding node. That was implicit and forced downstream tooling to disambiguate by checking whether `value === node.id`. The split into:

- the node's **own id** as the connector's identity (no self-tag), and
- **`connectorRef`** on the binding side

makes both roles explicit, mirrors `typeRef`/`templateRef`, and keeps the §10.1 weak-reference rule a single concept rather than two overlapping ones.

### 9.4 Connector-Related Metadata Keys

When a node represents a connector or binds to one, these metadata keys are available (see §13 _Metadata Applicability_ for the table):

- **`connectorRef`** — on a tool definition (§8), references a connector by id, dotted operation form, or URL-like string. See §9.1.
- `protocol` — on a connector-designated node, the integration protocol. Canonical values: `"mcp"`, `"http"`, `"grpc"`, `"sql"`, `"graphql"`, `"websocket"`, `"amqp"`, `"custom"`.
- `endpoint` — URL, connection string, or endpoint identifier.
- `transport` — transport for protocols that require one (e.g. MCP: `"stdio"`, `"sse"`).
- `command` — command line for stdio-based servers.
- `token_required`, `auth`, etc. — environment-specific configuration.
- `description` — cross-cutting documentation field.

The set is intentionally non-exhaustive. New keys can be added as additive metadata without spec churn.

### 9.5 When a Keyword Would Be Justified

A future `connector` keyword should be introduced **only** if all of the following become true:

- connectors have their own declaration lifecycle (distinct from regular nodes);
- connectors have their own namespace or distinct validation model;
- tools/nodes refer to connectors by identity rather than by opaque string metadata;
- shared auth/config/permissions live on the connector itself and propagate to bound tools;
- downstream tooling must index, export, or validate connectors as first-class semantic objects.

If any of these become a hard requirement in a later release, the keyword can land additively under the spec's additive-change rule. Until then, the metadata-based form above is canonical.

### 9.6 Toggling the Connectors Group (Editor Contract)

Tools that consume the parsed model — notably the agentflow-editor — need a stable, predictable id to expand or collapse "the connectors group" without inspecting the document for the author's chosen subgraph name. Two equivalent paths are supported, mirroring the §15 view-hint mechanism:

1. **User-declared subgraph.** When the author wraps connectors in `subgraph connectors[...]` per §9.2, the canonical id is `connectors`. Toggle the view by appending `connectors@{ view: "collapsed" }` or `connectors@{ view: "expanded" }` after the subgraph block. The standard subgraph view mechanism handles it; no synthesis occurs.

2. **Synthesized group.** When the author leaves connector-designated nodes scattered (no `subgraph connectors`) but writes `connectors@{ view: "..." }`, the parser synthesizes a group node with the stable id **`agentflow-connectors-group`** (parallel to `agentflow-types-group` and `agentflow-templates-group`). Connector-designated vertices are re-parented into it when expanded, or hidden when collapsed.

The synthesis is opt-in: a diagram with connector-designated nodes but no `connectors@{ ... }` metadata renders unchanged. This makes the feature additive — no existing diagram changes its visual output.

---

## 10. Identifier Resolution

Agentflow uses three **namespaces**:

1. **Nodes and containers** — IDs declared by user-written node statements (including tool definitions per §8 and any nodes used as connector references per §9), and container keywords (`agent`, `flow`, `task`, `skill`, `directive`, `testCase`, `subgraph`).
2. **Types** — names declared by `type` statements (§6).
3. **Templates** — names declared by `template` statements (§7).

Rules:

- Within each namespace, all IDs MUST be unique. Duplicates are a validation error.
- Across namespaces, IDs may repeat. `type Report` and `template Report` may coexist — explicit `typeRef` / `templateRef` disambiguate at the reference site.
- Forward references are permitted in every namespace.
- Synthetic IDs emitted by the renderer (`typesGroup`, `templatesGroup`, auto-numbered subgraphs) are reserved and MUST NOT be declared by authors.

These rules produce warnings before v1.0 (behind `agentflow.strictIds: false` by default) and become validation errors in v1.0.

### 10.1 Reference Categories

Reference-style keys split into two groups:

- **Semantic references** are resolved against the diagram model. Unresolved values are validation errors. Members: `def`, `typeRef`, `templateRef`.
- **Weak references by convention.** The `connectorRef` metadata key (§9) is a weak reference: when its value is a **bare id** (matches the `[A-Za-z_]\w*` identifier shape with no dot), the validator resolves it against the node namespace and emits `CONNECTOR_REF_UNRESOLVED` if no node matches, or `CONNECTOR_REF_NOT_A_CONNECTOR` if the matching node lacks connector configuration fields (§9.1). Both are warnings before v1.0 and errors in v1.0. When the value is a **dotted form** (`<connector>.<operation>`) or a **URL-like string**, it is treated as opaque and is not validated. This matches the §9.5 rationale: bare ids look like in-diagram references and are guarded; richer forms are downstream-tooling territory.
- **External / hygiene references** are validated for shape and allowed usage, but not for existence of the external target unless an import resolver is explicitly enabled. Members: `src`, `click` / `href` targets, and `class` / `style` references.

### 10.2 Legacy `type` on Reference Nodes

The generic `type` metadata key on a `procs` node is deprecated. The library resolves it by the following three-case rule until removal in v1.0:

- **Exactly one namespace matches** the value → accept (as the corresponding `typeRef` or `templateRef`) and emit a deprecation warning.
- **Both namespaces match** → validation error, ambiguous; the author must switch to explicit `typeRef` or `templateRef`.
- **Neither matches** → validation error, unresolved.

Authors SHOULD write `typeRef` or `templateRef` directly.

---

## 11. Definition / Instance Semantics

An instance shape is a reference to a definition. The definition is written once in its full form; instances are lightweight references that inherit domain metadata.

### 11.1 Target Matrix

| Instance shape                     | Instance of            |
| ---------------------------------- | ---------------------- |
| `tag-rect` (`tagged-rectangle`)    | `agent` definition     |
| `delay` (`half-rounded-rectangle`) | `flow` definition      |
| `lin-rect` (`lined-rectangle`)     | `skill` definition     |
| `win-pane` (`window-pane`)         | `tool` definition      |
| `curv-trap` (`curved-trapezoid`)   | `directive` definition |

> **Connectors.** Agentflow does not currently define an instance shape for connectors. A connector is referenced from its binding context by `connectorRef` (see §9.1 and §10.1). A future version may add a connector instance shape under the additive-change rule, but only if connectors are promoted into a first-class category per §9.5.

### 11.2 Validity

- A missing `def` is a validation error.
- A **kind mismatch** (e.g. `tag-rect` whose `def` targets a flow) is a validation error.
- A **cyclic `def` chain** is a validation error.

### 11.3 Inheritance

- Instances inherit **domain metadata only**. Core rendering fields (`shape`, `view`, `icon`, `img`, `w`, `h`) do not inherit.
- On a key collision, the instance's **local metadata overrides** the inherited value.
- Structure does not auto-expand into the instance site; the definition's children are not cloned.
- Style, class membership, `click`, and link styling do not inherit.

Enforcement is active from v0.6.0.

---

## 12. Capability Evaluation

### 12.1 Fields

- `permits` — the agent's effective capability set. Declared on `agent` containers.
- `requires` — the capability set required by a tool invocation. Declared on `tool` definitions.
- `deny` — capabilities forbidden at a tool's execution site. Declared on `tool` definitions.

`permits`, `requires`, `deny`, `fallbacks`, `directives` MUST be YAML arrays:

```
agent researcher["Researcher"]
  ...
end
researcher@{ permits: ["net.read", "llm.query"] }
```

Comma-separated string form is accepted with a deprecation warning before v1.0 and removed in v1.0.

### 12.2 Invocation Sites

Capability evaluation applies to **invocation sites only**, never to tool definitions (§8). The invocation sites supported in v0.x / 1.0 are:

- an edge from any node structurally inside a `task`, `flow`, or `skill` container — including input nodes (`lean-right`), data-artifact nodes (`doc`, etc.), and other regular nodes within those containers — into a tool definition's ID; or
- a `win-pane` instance whose `def` points at a tool definition and is placed inside an executing container.

A bare top-level tool definition with no incoming edges from inside an executing container is a definition only and is not subject to capability evaluation. Additional invocation-site forms may be introduced in a later version.

### 12.3 Executing-Agent Resolution

The **executing agent** for an invocation is the **nearest enclosing `agent`** in the structural tree of the invocation site. If no enclosing agent exists, the invocation is invalid.

Delegation (`-->>`) transfers _work_ ownership, not _capability_ ownership — a delegated-to agent must independently satisfy the invocation's `requires` under its own `permits`.

### 12.4 Validity

An invocation is valid iff:

- every member of `requires` is present in the executing agent's `permits`, and
- no member of `requires` is present in `deny`.

---

## 13. Metadata Applicability

Metadata keys are restricted to the element kinds listed. Keys outside this table are preserved for downstream tooling but produce a warning.

| Element                           | Valid metadata keys                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `agent`                           | `model`, `permits`, `memory`, `fallbacks`                                                                                |
| `flow`                            | `params`, `returns`                                                                                                      |
| `task`                            | `execution`, `params`, `returns`, `fallbacks`                                                                            |
| `skill`                           | `strategy`, `params`, `returns`, `fallbacks`                                                                             |
| `tool`                            | `params`, `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `transport`, `command`, `connectorRef` |
| connector-designated node (§9)    | `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`                                                 |
| `directive`                       | `rule`, `severity`, `context`, `params`                                                                                  |
| `testCase`                        | `assert`, `expects`                                                                                                      |
| input nodes (`lean-right`)        | `value`, `example`                                                                                                       |
| artifact nodes (`doc`, `lin-doc`) | `output`, `value`, `example`                                                                                             |
| reference nodes (`procs`)         | `typeRef`, `templateRef`, `src` (exactly one — §10)                                                                      |

### 13.1 Cross-Cutting

`description` is valid on **any authored element** and is therefore omitted from the per-row restrictions above. A human-readable description never creates semantic ambiguity.

### 13.2 Validation Rules

- Known key on allowed element → valid.
- `description` on any authored element → valid.
- Unknown key → preserved, warning emitted.
- Known key on wrong element → warning before v1.0; validation error in v1.0.

---

## 14. Presentation-Only Controls

The following controls are **presentation-only** and MUST NOT influence semantic interpretation or validation outcomes:

- `view` (collapsed / expanded rendering state; see §15)
- `classDef`, `class`, `style`, `linkStyle` (see §16)
- `icon`, `img`, `w`, `h`

If a future version introduces a flag that makes collapse affect semantic visibility in exports, that flag will be specified separately.

### 14.1 Two Representations

The library maintains two representations of a parsed diagram:

- **Internal render model** retains all fields including presentation — rendering needs them.
- **Semantic export model**, produced by the `getSemanticModel()` projection, strips the fields listed above. Downstream tooling that consumes the semantic model therefore cannot be accidentally influenced by rendering choices.

Presentation fields are not deleted from the DB; they are excluded from the exported semantic view.

---

## 15. View Control (Expanded / Collapsed)

> Presentation-only; see §14.

Containers can be collapsed to hide their internals:

```
my_agent@{ view: "collapsed" }
```

This renders the container as a `collapsedGroup` node — a title + separator + ellipsis that preserves the container's visual identity (agent/flow/task/skill/testCase/directive border and fill).

Type and template declaration groups can be expanded for visibility:

```
types@{ view: expanded }
templates@{ view: expanded }
```

---

## 16. Styling

> Presentation-only; see §14. Styling does not alter the semantic export model.

### 16.1 Class Definition and Application

```
classDef important fill:#f9f,stroke:#333,stroke-width:2px
node1:::important # inline class application
class node1,node2 important # multi-node class application
```

### 16.2 Direct Node Styling

```
style node1 fill:#f9f,stroke-width:2px
```

### 16.3 Link Styling

```
linkStyle 0,1 stroke:red,stroke-width:3px
linkStyle default interpolate linear
```

---

## 17. Interactivity

```
click nodeId callback "tooltip"
click nodeId href "url" _blank
```

Click and `href` targets are hygiene references (§10.1) — validated for shape and allowed usage, not for external existence by default.

---

## 18. Accessibility

```
accTitle: Diagram Title
accDescr: Short description
accDescr {
  Multi-line description
  of the diagram
}
```

---

## 19. Semantic Patterns

These are common compositional patterns that emerge from the syntax. Each pattern is constructed only from the canonical operators and shapes defined above so the examples double as conformance cases.

### 19.1 Tool Call Pattern

A tool definition (§8) — a node with `shape: subroutine` — invoked from a task:

```
do_work["do_work"]
do_work@{ shape: subroutine, returns: "OutputType", requires: ["llm.query"] }

task step["Do Work"]
  input["input"]
  output["Output"]
  input ==> do_work ==> output
  do_work --o type_ref
end

input@{ shape: lean-right }
output@{ shape: doc }
type_ref@{ shape: procs, typeRef: "OutputType" }
```

### 19.2 Reference Document Pattern

Non-directional association (`---`) to a specification or guide:

```
gen_html["generate_html"]
style_guide["Brand Guide"]
gen_html --- style_guide

style_guide@{ shape: lin-doc }
```

### 19.3 Capability Taxonomy Pattern

A hierarchy of capability or permission categories rooted at a top-level grouping. Hexagon categories are classification sources (per §4.2); terminal leaves are the granular permissions. Hierarchy is **classification**, not control or data flow or delegation, so the relationship uses `---` (association, §5.1):

```
all --- data
all --- llm
data --- data_read
data --- data_write

all@{ shape: hex }
data@{ shape: hex }
data_read@{ shape: terminal }
data_write@{ shape: terminal }
```

The `---` operator carries no direction at the rendering layer and no work-handoff semantic. That matches what a taxonomy actually expresses: "x belongs under y" — a structural classification, not a runtime relationship.

### 19.4 Decision / Alternate Flow Pattern

`diamond` as the branching vertex (§4.2):

```
task evaluate["Evaluate Result"]
  result["result"]
  check{Approved?}
  approved["Publish"]
  rejected["Revise"]
  result --> check
  check -- yes --> approved
  check -- no --> rejected
end

result@{ shape: lean-right }
approved@{ shape: doc }
rejected@{ shape: doc }
```

Diamonds can also be declared via metadata: `check@{ shape: diamond }`.

### 19.5 Directive Pattern

A trapezoid node bound to a tool by a governance edge (`-.->`):

```
search_tool["Search"]
search_tool@{ shape: subroutine }
no_pii["No PII in output"]
search_tool -.-> no_pii

no_pii@{ shape: trapezoid, severity: "critical", rule: "Strip all PII before returning results" }
```

Or using the `directive` container for grouped constraints:

```
tool1["Tool 1"]
tool1@{ shape: subroutine }

directive safety["Safety Constraints"]
  no_pii["No PII"]
  rate_limit["Rate Limit"]
end
tool1 -.-> safety
```

### 19.6 Lesson Pattern

A curled-corner document (`doc`) carrying a descriptive note. Lesson metadata uses cross-cutting `description` (§13.1):

```
lesson1["Backup Verification"]
lesson1@{ shape: doc, description: "Always verify backups before migration — prior production outage originated from this gap." }
```

### 19.7 Fallback Pattern

Failure edges (`--x`) between agents for escalation:

```
agent primary["Primary Agent"]
  A
end
agent fallback["Fallback Agent"]
  B
end
primary --x fallback
```

### 19.8 Connector Pattern (MCP, HTTP, DB)

A connector-designated node represents an external system; one or more tools bind to it via the `connectorRef` metadata key (§9.1). The connector node's own id IS the connector identity — no self-tag needed. Group connector nodes in a `subgraph connectors` block when the document benefits from naming them as first-class elements (§9.2):

```
subgraph connectors["Connectors"]
  github_mcp["GitHub MCP"]
end
github_mcp@{
  protocol: "mcp",
  transport: "stdio",
  command: "npx -y @modelcontextprotocol/server-github"
}

create_issue["Create Issue"]
create_issue@{ shape: subroutine, connectorRef: "github_mcp", returns: "Issue", requires: ["net.write"] }

close_issue["Close Issue"]
close_issue@{ shape: subroutine, connectorRef: "github_mcp", requires: ["net.write"] }
```

For HTTP and database back-ends the `protocol` and `endpoint` fields carry the integration details:

```
subgraph connectors["Connectors"]
  orders_api["Orders API"]
  orders_db["Orders DB"]
end
orders_api@{ protocol: "http", endpoint: "https://api.example.com/orders" }
orders_db@{ protocol: "sql", endpoint: "postgres://.../orders" }
```

The minimal form is a tool with just the binding metadata — no connector node, no subgraph:

```
save_diagram["save_diagram"]
save_diagram@{
  shape: subroutine,
  connectorRef: "mermaid.create_document",
  description: "Save diagram to Mermaid Chart platform"
}
```

### 19.9 Parallel Execution Pattern

Fan-out with `&` operator **in edges only**:

```
orchestrator["Orchestrate"]
search["Search"]
analyze["Analyze"]
validate["Validate"]
orchestrator --> search & analyze & validate
```

### 19.10 Agent Delegation Pattern

Delegation edge (`-->>`) between agents within a flow:

```
flow pipeline["Pipeline"]
  agent a1["First"]
    task t1["Step 1"] ... end
  end
  agent a2["Second"]
    task t2["Step 2"] ... end
  end
  a1 -->> a2
end
```

Delegation transfers work ownership; each agent must independently satisfy its own capability requirements (§12).

### 19.11 Definition / Instance Pattern

Define once with full metadata, then place lightweight instances that reference the definition (§11):

```
agent researcher["Researcher"]
  task research["Research Task"]
    search["search"]
    search@{ shape: subroutine, returns: "String", requires: ["net.read"] }
  end
end
researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] }

flow pipeline["Pipeline"]
  r1["Researcher"]
  r2["Researcher"]
  r1 --> r2
end
r1@{ shape: tag-rect, def: "researcher" }
r2@{ shape: tag-rect, def: "researcher" }
```

Both `r1` and `r2` inherit all domain metadata from the `researcher` definition per §11.3. The instance–definition map is:

| Definition                                           | Instance shape           | Instance aliases |
| ---------------------------------------------------- | ------------------------ | ---------------- |
| `agent ... end`                                      | `tagged-rectangle`       | `tag-rect`       |
| `flow ... end`                                       | `half-rounded-rectangle` | `delay`          |
| `skill ... end`                                      | `lined-rectangle`        | `lin-rect`       |
| Tool definition (§8 — node with `shape: subroutine`) | `window-pane`            | `win-pane`       |
| `directive ... end`                                  | `curved-trapezoid`       | `curv-trap`      |

### 19.12 Input-Value Pattern (v0.6.0)

Carry a concrete input value into a parameterised tool. The input node uses `value` for the literal data; the edge label resolves the parameter binding (§5.5, §8.4.1):

```
file_path["file_path"]
file_path@{
  shape: lean-right,
  description: "Path to the file in the GitHub repository to visualize",
  value: "src/HelloWorld.java"
}

read_file["read_file"]
read_file@{
  shape: subroutine,
  params: "path :: String",
  returns: "String",
  requires: ["fs.read"]
}

file_path ==>|path| read_file
```

`value` is the data; the edge label `path` is the binding. For documentation diagrams where the value shown is illustrative rather than authoritative, prefer `example`:

```
sample_input["sample_input"]
sample_input@{
  shape: doc,
  description: "Example payload — not used at execution time",
  example: { user_id: "u_123", region: "eu-west-1" }
}
```

Both keys are retained by `getSemanticModel()` (§14.1) — downstream tooling that simulates or validates the flow can read them as data.

---

## 20. Complete Example

```
agentflow TB
  type CoffeeCopy = Record {
    hero_tagline: String
    hero_subtitle: String
    about: String
    menu_item: String * 6
  }

  type BilingualPage = Record {
    english: String
    swedish: String
  }

  subgraph connectors["Connectors"]
    llm_api["LLM API"]
  end
  llm_api@{ protocol: "http", endpoint: "https://api.example.com/chat" }

  research_loc["research_location"]
  research_loc@{ shape: subroutine }
  write_copy["write_copy"]
  write_copy@{ shape: subroutine }
  translate_sv["translate_to_swedish"]
  translate_sv@{ shape: subroutine }
  gen_html["generate_html"]
  gen_html@{ shape: subroutine }

  agent coffee_team["Coffee Team"]
    flow build_site["Build Site"]
      agent researcher["Researcher"]
        task step1["Research Location"]
          city["city"]
          brief["Research Brief"]
          city ==> research_loc ==> brief
        end
        task step2["Write Copy"]
          english_copy["English Copy"]
          brief ==> write_copy ==> english_copy
          write_copy --o coffee_copy_ref
        end
        step1 --> step2
      end

      agent translator["Translator"]
        task step3["Translate to Swedish"]
          bilingual["Bilingual Page"]
          english_copy ==> translate_sv ==> bilingual
          translate_sv --o bilingual_page_ref
        end
      end

      agent designer["Designer"]
        task step4["Generate Website"]
          html_out["HTML Website"]
          bilingual ==> gen_html ==> html_out
        end
        nordic["nordic_design"]
        glass["glassmorphism"]
        gen_html --- nordic
        gen_html --- glass
      end
    end
  end

  coffee_copy_ref["CoffeeCopy"]
  bilingual_page_ref["BilingualPage"]
  permit_ref["Permission Tree"]

  city@{ shape: lean-right }
  brief@{ shape: doc }
  english_copy@{ shape: doc }
  bilingual@{ shape: doc }
  html_out@{ shape: doc }
  nordic@{ shape: lin-doc }
  glass@{ shape: lin-doc }
  coffee_copy_ref@{ shape: procs, typeRef: "CoffeeCopy" }
  bilingual_page_ref@{ shape: procs, typeRef: "BilingualPage" }
  permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

  research_loc@{ params: "city :: String", returns: "String", requires: ["net.read"], cache: "24h" }
  write_copy@{ connectorRef: "llm_api", params: "brief :: String", returns: "CoffeeCopy", requires: ["llm.query"], retry: 2 }
  translate_sv@{ connectorRef: "llm_api", params: "english :: CoffeeCopy", returns: "BilingualPage", requires: ["llm.query"] }
  gen_html@{ connectorRef: "llm_api", params: "page :: BilingualPage", returns: "String", requires: ["llm.query"] }

  researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] }
  translator@{ model: "claude-sonnet-4-20250514", permits: ["llm.query"] }
  designer@{ model: "claude-sonnet-4-20250514", permits: ["llm.query"] }

  build_site@{ params: "city :: String", returns: "String" }
```

Notable v0.5.0 changes in this example versus v0.4.0:

- Tools are declared at the top level as named nodes with `shape: subroutine` (§8). The shape-based form is the canonical and only form; no new keyword is introduced.
- The shared LLM back-end is declared as a node in a `subgraph connectors` block; the three LLM-using tools bind to it via `connectorRef: "llm_api"` metadata (§9). The connector node's own id IS the connector identity — no self-tag. No `connector` keyword is used.
- Each tool declares its `params` (§8.4). All four tools have a single parameter, so the incoming data edges (e.g. `brief ==> write_copy`) bind to that parameter implicitly per §8.4.1. A multi-parameter tool would require the edge label to name the target parameter (`input_query ==>|query| search_web`).
- Data flow uses `==>` (§5.1). Edges that move artifacts between nodes — input → tool → output, tool → reference binding via `--o` — are explicitly typed as data, not as the legacy thick-control form.
- Control sequencing (`step1 --> step2`) uses `-->`. Reference attachments use `---`.
- Reference nodes use `typeRef` and `src` explicitly rather than the overloaded `type` key (§10.2).
- `permits` and `requires` are YAML arrays (§12.1).

---

## Appendix A: Conformance Tests

A conformance fixture set ships alongside this specification. Implementations SHOULD use it to verify their interpretation of the rules above.

The fixture directory `agentflow-conformance/` contains:

- **Valid minimal examples** — one fixture per semantic pattern (container types, edge operators, instance shapes, tool definitions, connector bindings, type / template references, capability evaluation).
- **Negative examples** — duplicate names, kind mismatches, cyclic `def`, invalid metadata placement, invalid capability sets, invalid containment, ambiguous reference resolution, malformed container-boundary cases, unresolved `connectorRef` bindings, `connectorRef` resolving to a non-connector-designated node.
- **Edge-semantics fixtures** asserting the canonical mapping on every operator.

Each fixture declares its expected outcome: `valid`, `warning`, or `error`, plus the specific message identifier where applicable.

Fixture files are named `<pattern>-<case>.agentflow` with a companion `<pattern>-<case>.expected.json`.

The full fixture suite and how to run it are part of issue [#13](https://github.com/Mermaid-Chart/agentflow/issues/13).

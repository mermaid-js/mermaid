# Agentflow Syntax Reference

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

Containers are the structural backbone of agentflow. They group nodes into semantic units and can be nested to any depth. Every container follows the same syntax:

```
<keyword> <id>["Title"]
  ...children...
end
```

### Container Types

| Keyword     | Shape ID         | Visual                                                         | Semantic Meaning                                                                                                                                              |
| ----------- | ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`     | `agentGroup`     | Filled background, solid 1.5px border, rx=14, header separator | An **autonomous actor** with an LLM identity. Agents hold a model binding and a permission set; they own the tasks they execute.                              |
| `flow`      | `flowGroup`      | Transparent, solid 0.75px border, rx=10                        | A **composable sequence** of steps that can be invoked as a unit. Flows define an input/output contract (`params`/`returns`) and may be nested inside agents. |
| `task`      | `taskGroup`      | Transparent, dashed 0.75px border, rx=10                       | A **discrete unit of work** within an agent. Tasks group related operations (tool calls, data transforms) into a named, bounded scope.                        |
| `skill`     | `skillGroup`     | Pill-shaped (rx=20), filled, solid 1px border                  | A **composed capability** with a strategy orchestrating multiple tools. Skills encapsulate reusable multi-step operations.                                    |
| `testCase`  | `testGroup`      | No fill, solid 2px border, sharp corners (rx=0)                | A **verification container** asserting expected behavior. The rigid square edges signal formal verification.                                                  |
| `directive` | `directiveGroup` | Light fill, dot-dash 1.5px border, rx=2                        | A **reusable behavioral constraint** governing agent/tool behavior. Defines guardrails, policies, or rules.                                                   |
| `subgraph`  | `rect`           | Default cluster rectangle                                      | Generic grouping container inherited from flowchart. Rarely used directly in agentflow.                                                                       |

Synthetic (auto-generated, not authored directly):

| Shape ID     | Visual                                          | Semantic Meaning                                                                 |
| ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `typesGroup` | Light tertiary fill, dashed 0.75px border, rx=6 | A visual container that collects all `type` declarations defined in the diagram. |

### Container Metadata

Containers accept metadata via `@{...}` after their declaration block:

```
agent researcher["Researcher"]
  ...
end
researcher@{ model: "claude-sonnet-4-20250514", permits: "net.read, llm.query" }
```

**Agent-specific metadata:**

- `model` — LLM model binding (e.g., `"claude-opus-4-6"`)
- `permits` — Comma-separated capability grants (e.g., `"net.read, llm.query"`)

**Flow-specific metadata:**

- `params` — Input contract (e.g., `"city :: String"`)
- `returns` — Output type (e.g., `"String"`)

**Skill-specific metadata:**

- `strategy` — Orchestration strategy (e.g., `"parallel"`, `"round-robin"`, `"sequential"`)
- `params` — Input contract (e.g., `"query :: String"`)
- `returns` — Output type (e.g., `"Results"`)

> **When to use `skill` vs `flow`:** A `flow` is a general-purpose composable sequence — it models _what happens in what order_. A `skill` is a higher-level capability that bundles tools with a `strategy` — it models _what an agent can do_. Use `flow` when the emphasis is on the step sequence; use `skill` when the emphasis is on the composed capability and how tools coordinate (parallel, round-robin, etc.).

**Test-specific metadata:**

- `assert` — Assertion expression (e.g., `"output.length > 0"`)
- `expects` — Human-readable expected behavior (e.g., `"non-empty response"`)

**Directive-specific metadata:**

- `params` — Constraint parameters (e.g., `"max_requests :: Int"`)

### Nesting Example

```
agent dev_team["Development Team"]
  flow build_app["Build Application"]
    agent architect["Architect"]
      task design["Design System"]
        requirements["requirements"]
        design_system["design_system"]
        requirements --> design_system
      end
    end
  end
end
```

---

## 4. Nodes

Nodes are the leaf elements — individual steps, data artifacts, tools, or references.

### Declaration Syntax

```
id                                # bare node (label = id)
id["Label Text"]                  # labeled node
id["Label"]@{ key: value }       # node with metadata
id{Decision Text}                 # diamond (decision) node — inline syntax
```

Labels support HTML fragments for line breaks: `["First Line<br>Second Line"]`.

The diamond shape has dedicated inline syntax `id{text}` in addition to `@{ shape: diamond }`, making it easy to add decision points and alternate-flow routing without metadata annotations.

### Node Shapes

Shapes carry semantic weight. They are set either automatically by the system or explicitly via `@{ shape: ... }`.

#### System-Assigned Shapes

| Shape ID          | Assigned When                          | Visual                                                                | Semantic Meaning                                                                                                                                                                                      |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roundedRect`     | Default for all user-defined nodes     | Rounded rectangle                                                     | General-purpose step or data node. The default shape when no explicit annotation is provided.                                                                                                         |
| `collapsedGroup`  | Container has `@{ view: "collapsed" }` | Title + separator + ellipsis dots; border/fill matches container type | A container whose internals are hidden. Preserves the container's visual identity (agent/flow/task/skill/testCase/directive) while signalling that detail is elided. Used for progressive disclosure. |
| `typeDeclaration` | For each `type` declaration            | `<<kind>>` badge + bold name + separator + fields/expression          | A data contract defining the shape of information flowing between agents and tasks.                                                                                                                   |

#### User-Annotated Shapes

Set explicitly via `@{ shape: <name> }`:

| Shape ID        | Aliases          | Visual                        | Semantic Meaning                                                                                                                                                                                                                     |
| --------------- | ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `subroutine`    | —                | Double-bordered rectangle     | A **callable tool or function**. The double border signals that execution crosses a boundary (API call, LLM query, external service). Metadata captures the tool's contract: `returns`, `requires`, `retry`, `cache`, `description`. |
| `doc`           | —                | Curled-corner document        | A **data artifact** — a document, report, or structured output produced or consumed by a step.                                                                                                                                       |
| `lean-right`    | `in-out`         | Parallelogram (right-leaning) | An **input value or parameter** entering the flow from outside. The slant visually suggests data in motion.                                                                                                                          |
| `lin-doc`       | `lined-document` | Lined document                | A **reference document or specification** — something read but not produced by the current flow (e.g., style guides, brand manuals, schemas).                                                                                        |
| `procs`         | —                | Stacked process               | An **external reference** to a type definition or another diagram. The stacked appearance signals that the node represents something defined elsewhere. Uses `type` or `src` metadata.                                               |
| `stadium`       | `terminal`       | Stadium / pill shape          | A **terminal or boundary node** — an entry point, exit point, or named endpoint in the flow.                                                                                                                                         |
| `hexagon`       | `hex`            | Hexagon                       | A **decision or condition node**. Signals a branching point or evaluation step.                                                                                                                                                      |
| `circle`        | —                | Circle                        | A **join point, event, or signal** — a coordination primitive where multiple paths converge or an event is emitted.                                                                                                                  |
| `diamond`       | —                | Diamond / rhombus             | A **decision gate or approval checkpoint** — use for conditional branching, approval gates, or alternate-flow routing. Classic flowchart decision semantics.                                                                         |
| `trapezoid`     | —                | Trapezoid                     | A **behavioral directive or constraint** — a rule, policy, or guardrail that governs agent or tool behavior.                                                                                                                         |
| `inv-trapezoid` | —                | Inverted trapezoid            | An **inverted directive** — alternate orientation for constraint nodes.                                                                                                                                                              |
| `double-circle` | `doublecircle`   | Double circle                 | A **test assertion node** — signals a verification checkpoint or assertion in a test flow. Note: inline syntax `(((...)))` produces the legacy alias `doublecircle`; prefer `@{ shape: double-circle }`.                             |
| `rect`          | `squareRect`     | Square rectangle              | Remapped to `roundedRect` at render time. Equivalent to the default shape.                                                                                                                                                           |

### Node Metadata Fields

All metadata is set via `@{ key: value, ... }`:

```
research_loc@{
  shape: subroutine,
  returns: "String",
  requires: "net.read",
  cache: "24h",
  description: "Research a city's coffee culture"
}
```

#### Core Fields (affect rendering)

These fields are interpreted by the rendering engine:

| Field           | Purpose                                     | Example                           |
| --------------- | ------------------------------------------- | --------------------------------- |
| `shape`         | Override node shape                         | `subroutine`, `doc`, `lean-right` |
| `view`          | Collapse/expand control                     | `"collapsed"`, `"expanded"`       |
| `type`          | Type reference (for `procs` shape)          | `"CoffeeCopy"`                    |
| `src`           | External file reference (for `procs` shape) | `"./permit-tree.mmd"`             |
| `icon`          | Icon identifier                             | Icon name string                  |
| `img`, `w`, `h` | Image and dimensions                        | URL, pixel values                 |

#### Domain Fields (pass-through metadata)

These fields are stored in the node's metadata and available to tooling, but do not change how the node renders. The `@{}` mechanism accepts any valid YAML key — the fields below are the conventional names used by agentflow and PACT:

| Field         | Purpose                                          | Example                               |
| ------------- | ------------------------------------------------ | ------------------------------------- |
| `description` | Human-readable description of what the node does | `"Classify data sensitivity"`         |
| `returns`     | Output type contract                             | `"CoffeeCopy"`, `"String"`            |
| `requires`    | Required capabilities (comma-separated)          | `"net.read, llm.query"`               |
| `deny`        | Denied capabilities                              | `"llm.query"`                         |
| `source`      | External source binding                          | `"search.duckduckgo(query)"`          |
| `params`      | Input parameters                                 | `"city :: String"`                    |
| `retry`       | Retry count on failure                           | `2`                                   |
| `cache`       | Cache duration                                   | `"30s"`, `"24h"`                      |
| `output`      | Template conformance                             | `"triage_result"`                     |
| `model`       | LLM model binding (containers)                   | `"claude-opus-4-6"`                   |
| `permits`     | Granted capabilities (containers)                | `"net.read, llm.query"`               |
| `strategy`    | Orchestration strategy (skill containers)        | `"parallel"`, `"round-robin"`         |
| `assert`      | Assertion expression (testCase containers)       | `"output.length > 0"`                 |
| `expects`     | Expected behavior (testCase containers)          | `"non-empty response"`                |
| `severity`    | Impact level (lesson nodes)                      | `"high"`, `"critical"`                |
| `context`     | Situational context                              | `"production outage"`                 |
| `rule`        | Behavioral rule text                             | `"always verify backups"`             |
| `validate`    | Validation method for tool output                | `"json-schema"`, `"strict"`           |
| `handler`     | External HTTP endpoint for tool execution        | `"http POST https://api.example.com"` |
| `directives`  | Prompt directive references (comma-separated)    | `"clinical_reasoning, safety"`        |
| `transport`   | MCP connection transport                         | `"stdio"`, `"sse"`                    |
| `command`     | MCP server command                               | `"npx -y @mcp/server"`                |
| `memory`      | Agent memory type                                | `"episodic"`, `"semantic"`            |
| `execution`   | Task execution mode                              | `"sequential"`, `"parallel"`          |
| `fallbacks`   | Fallback strategy                                | `"retry-3, escalate"`                 |

---

## 5. Edges

Edges connect nodes and carry semantic weight through their arrow style.

### Edge Types

| Syntax | Marker              | Semantic Meaning                                                                                                                                           |
| ------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-->`  | Single arrowhead    | **Data flow / sequence.** The primary edge type — data or control passes from source to target.                                                            |
| `--o`  | Circle endpoint     | **Output binding.** The source produces data that conforms to the target's type contract (e.g., a tool writing to a type reference).                       |
| `--x`  | X endpoint          | **Error / cancellation.** A failure path, cancellation signal, or exception route.                                                                         |
| `-->>` | Double chevron      | **Hierarchy / delegation.** The source delegates authority or spawns the target as a child. Carries permission implications.                               |
| `---`  | No arrowhead        | **Association.** A non-directional relationship — the source and target are related but neither drives the other (e.g., a tool referencing a style guide). |
| `o--o` | Circle on both ends | **Bidirectional binding.** Both endpoints produce and consume data from each other.                                                                        |

### Edge Labels

Labels are placed between pipe characters or inline:

```
A |"label text"| B
A -- label text --> B
sentinel --alert--> monitor
writer -- Article Draft --> editor
```

### Edge Stroke Variants

| Syntax | Stroke              |
| ------ | ------------------- |
| `-->`  | Normal (thin solid) |
| `==>`  | Thick (bold solid)  |
| `-.->` | Dotted              |

### Fan-out (& operator)

Send one output to multiple targets:

```
classifier -- Classification Report --> processor & auditor
```

---

## 6. Type Declarations

Types define the data contracts that flow between agents and tasks. Three forms:

### Opaque Type (name only, no structure)

```
type TypeName
```

### Alias Type (reference to another type)

```
type UserId = String
type OptionalReport = Report?
type Reports = List<Report>
type Lookup = Map<String, Report>
```

### Record Type (structured fields)

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

### Rendering

Types are automatically collected into a `typesGroup` container. They render as `typeDeclaration` shapes showing: `<<kind>>` badge, bold name, separator, and fields/expression.

To expand the types container visually:

```
types@{ view: expanded }
```

---

## 7. Template Declarations

Templates define reusable structural patterns with typed fields, multiplicities, and descriptions:

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

### Template Sections

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

### Template References

Nodes can reference templates via `output` metadata and the `procs` shape:

```
triage_alert@{ shape: subroutine, output: "triage_result" }
triage_tpl_ref["triage_result"]
triage_tpl_ref@{ shape: procs, type: "triage_result" }

```

To expand the templates container:

```
templates@{ view: expanded }
```

---

## 8. View Control (Expanded / Collapsed)

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

## 9. Styling

### Class Definition and Application

```
classDef important fill:#f9f,stroke:#333,stroke-width:2px
node1:::important # inline class application
class node1,node2 important # multi-node class application
```

### Direct Node Styling

```
style node1 fill:#f9f,stroke-width:2px
```

### Link Styling

```
linkStyle 0,1 stroke:red,stroke-width:3px
linkStyle default interpolate linear
```

---

## 10. Interactivity

```
click nodeId callback "tooltip"
click nodeId href "url" _blank
```

---

## 11. Accessibility

```
accTitle: Diagram Title
accDescr: Short description
accDescr {
  Multi-line description
  of the diagram
}
```

---

## 12. Semantic Patterns

These are common compositional patterns that emerge from the syntax.

### Tool Call Pattern

A subroutine node taking input, producing a doc output, and optionally binding to a type reference:

```
task step["Do Work"]
  input["input"]
  do_work["do_work"]
  output["Output"]
  input --> do_work --> output
  do_work --o type_ref
end

input@{ shape: lean-right }
do_work@{ shape: subroutine, returns: "OutputType", requires: "llm.query" }
output@{ shape: doc }
type_ref@{ shape: procs, type: "OutputType" }
```

### Reference Document Pattern

Non-directional association to a specification or guide:

```
gen_html["generate_html"]
style_guide["Brand Guide"]
gen_html --- style_guide

style_guide@{ shape: lin-doc }
```

### Permission Tree Pattern

Hierarchy edges (`-->>`) with hexagon categories and terminal leaves:

```
all -->> data
all -->> llm
data -->> data_read
data -->> data_write

all@{ shape: hex }
data@{ shape: hex }
data_read@{ shape: terminal }
data_write@{ shape: terminal }
```

### Decision / Alternate Flow Pattern

Diamond nodes for conditional branching within a task:

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

### Directive Pattern

A trapezoid node with a dotted edge from a tool, expressing a behavioral constraint:

```
search_tool["Search"]
no_pii["No PII in output"]
search_tool -.-> no_pii

search_tool@{ shape: subroutine }
no_pii@{ shape: trapezoid, severity: "critical", rule: "Strip all PII before returning results" }
```

Or using the `directive` container for grouped constraints:

```
directive safety["Safety Constraints"]
  no_pii["No PII"]
  rate_limit["Rate Limit"]
end
tool1 -.-> safety
```

### Lesson Pattern

A lined-document node with severity/context/rule metadata:

```
lesson1["Backup Verification"]
lesson1@{ shape: lin-doc, severity: "high", context: "production outage", rule: "always verify backups before migration" }
```

### Fallback Pattern

Error/cancellation edges (`--x`) between agents for escalation:

```
agent primary["Primary Agent"]
  A
end
agent fallback["Fallback Agent"]
  B
end
primary --x fallback
```

### MCP Connection Pattern

A subroutine node with transport/command metadata:

```
github_mcp["GitHub MCP"]
github_mcp@{ shape: subroutine, transport: "stdio", command: "npx -y @modelcontextprotocol/server-github" }
```

### Parallel Execution Pattern

Fan-out with `&` operator for parallel tool invocation:

```
orchestrator["Orchestrate"]
search["Search"] & analyze["Analyze"] & validate["Validate"]
orchestrator --> search & analyze & validate
```

### Agent Delegation Pattern

Sequential hand-off between agents within a flow:

```
flow pipeline["Pipeline"]
  agent a1["First"]
    task t1["Step 1"] ... end
  end
  agent a2["Second"]
    task t2["Step 2"] ... end
  end
  a1 -- Result --> a2
end
```

---

## 13. Complete Example

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

  agent coffee_team["Coffee Team"]
    flow build_site["Build Site"]
      agent researcher["Researcher"]
        task step1["Research Location"]
          city["city"]
          research_loc["research_location"]
          brief["Research Brief"]
          city --> research_loc --> brief
        end
        task step2["Write Copy"]
          write_copy["write_copy"]
          english_copy["English Copy"]
          brief --> write_copy --> english_copy
          write_copy --o coffee_copy_ref
        end
        step1 --> step2
      end

      agent translator["Translator"]
        task step3["Translate to Swedish"]
          translate_sv["translate_to_swedish"]
          bilingual["Bilingual Page"]
          english_copy --> translate_sv --> bilingual
          translate_sv --o bilingual_page_ref
        end
      end

      agent designer["Designer"]
        task step4["Generate Website"]
          gen_html["generate_html"]
          html_out["HTML Website"]
          bilingual --> gen_html --> html_out
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
  coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }
  bilingual_page_ref@{ shape: procs, type: "BilingualPage" }
  permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

  research_loc@{ shape: subroutine, returns: "String", requires: "net.read", cache: "24h" }
  write_copy@{ shape: subroutine, returns: "CoffeeCopy", requires: "llm.query", retry: 2 }
  translate_sv@{ shape: subroutine, returns: "BilingualPage", requires: "llm.query" }
  gen_html@{ shape: subroutine, returns: "String", requires: "llm.query" }

  researcher@{ model: "claude-sonnet-4-20250514", permits: "net.read, llm.query" }
  translator@{ model: "claude-sonnet-4-20250514", permits: "llm.query" }
  designer@{ model: "claude-sonnet-4-20250514", permits: "llm.query" }

  build_site@{ params: "city :: String", returns: "String" }
```

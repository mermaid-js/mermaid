# Agentflow Syntax — Quick Reference (v0.8.1)

> A condensed outline of the language. The normative document is `AGENTFLOW-SYNTAX.md`;
> section references (§) point there. Version history is in `AGENTFLOW-CHANGELOG.md`.

## The model in three sentences

An Agentflow diagram describes a multi-agent system: **flows** (the only container)
own **tasks**, **tools**, **action** calls, and other flows. Steps are ordered with
`-->`; the runtime threads the previous step's output into the next step's prompt, so
data passes between steps **implicitly** — there are no `reads` / `writes` arrays and
no data-flow edges. Cross-flow reuse goes through MCP: a flow can be exposed as an
MCP-callable tool and invoked from another flow by an action node.

## Skeleton

```
---
config: { layout: elk }        # optional frontmatter
---
agentflow TB                   # TB | BT | LR | RL  (or > < ^ v)
  flow team["Team"]
    ...
  end
```

## Containers — there is only `flow` (§3)

```
flow <id>["Title"]
  ...children: nested flows, tasks, tools, actions, inputs, refdocs...
end
<id>@{ model: "claude-…", instruction: "…", memory: [...] }

# Metadata may also be attached inline on the flow header (equivalent to the
# standalone `<id>@{ ... }` form above):
flow <id>@{ model: "claude-…" }
  ...children...
end
flow <id>["Title"]@{ model: "claude-…" }
  ...children...
end
```

- A `flow` is a named, composable unit of work. It may declare a `params` / `returns`
  contract and be exposed as an MCP-callable tool by the runtime.
- Flow metadata may be attached either standalone (`<id>@{ ... }` after `end`) or
  inline on the header (`flow <id>@{ ... }` / `flow <id>["Title"]@{ ... }`); both
  resolve to the same subgraph metadata and obey the same §10 applicability rules.
- Allowed children: nested `flow`, plus nodes. `agent` / `skill` / `testCase` /
  `directive` / `subgraph` no longer exist.

## Nodes & shapes (§4)

Declaration forms:

```
id                                # bare (label = id)
id["Label"]                       # labeled  (use <br> for line breaks)
id["Label"]@{ key: value, … }     # with metadata (flat — no agentflow: wrapper)
id{Decision}                      # diamond, inline
```

Shape **is** semantic. v0.8.1 introduces **author-friendly aliases** alongside the
Mermaid canonical names — both forms parse identically.

| Alias       | Canonical (Mermaid)    | Means                                                             |
| ----------- | ---------------------- | ----------------------------------------------------------------- |
| _(default)_ | `roundedRect` / `rect` | A **task** — a unit of work                                       |
| `task`      | `roundedRect` / `rect` | Same as default; explicit                                         |
| `tool`      | `subroutine`           | A **tool** — native function the LLM may call (§7)                |
| `input`     | `lean-right`           | An **input** value entering the flow                              |
| `decision`  | `diamond`              | A **decision gate** — branching vertex (also `id{Text}`)          |
| `refdoc`    | `lin-doc`              | A **reference document** (attach with `-.-`)                      |
| `action`    | `hexagon`              | A **action** call (another flow exposed via MCP) (§16.7)          |
| `connector` | `connector`            | An **external integration point** (declared with `connector`, §8) |

Removed shapes (now hard syntax errors): `doc`, `stadium`/`terminal`, `circle`,
`trapezoid`/`inv-trapezoid`, `double-circle`, `typeDeclaration`, `procs`, the five
per-kind instance shapes, and the standalone `hexagon` role as "condition /
classification source" (hexagon now means `action`).

## Edges — three operators (§5)

| Operator | Meaning                                                                        |
| -------- | ------------------------------------------------------------------------------ |
| `-->`    | **sequence** — execution order. Labels OK (branch outcomes).                   |
| `-.-`    | **reference** — reference-doc attachment. Dotted, **no labels, no direction**. |
| `--x`    | **failure** — failure / cancellation / escalation path.                        |

```
a --> b                       # then
check -- yes --> publish      # branch label on -->
tool -.- style_guide          # attach a reference doc (no label, dotted)
primary --x fallback          # escalation
orchestrator --> a & b        # fan-out
```

Removed: `---` (replaced by `-.-`); `==>` (data flow); `-.->` (instance binding);
`--o`, `-->>`, `o--o`.

### Edge metadata (§5.3)

An edge may be given an id and an `instruction` attached separately:

```
check e1@-- no --> revise
e1@{ instruction: "Include reviewer comments inline." }
```

Only `instruction` is permitted on edges in v0.8.1. The exact edge-id grammar is
delegated to the Mermaid parser team.

## Data flow — implicit (§6)

There are no `reads` / `writes` arrays. The runtime carries each step's output into
the next step's prompt; `-->` orders the steps. A step that needs to constrain what it
consumes or produces says so in its `instruction`. Inputs that originate outside the
diagram are seeded by **input nodes**:

```
city["city"]@{ shape: input, type: String, value: "Stockholm" }
city --> research --> write_copy
```

## Tools (§7)

A tool is any node with `shape: tool` — no `tool` keyword. All metadata optional.

```
search_web["Search Web"]@{
  shape: tool,
  params: { query: String, top_k: Int? },   # YAML mapping: name → type expr
  returns: "SearchResults",
  retry: 2, cache: "24h"
}
```

Invoked by a `-->` sequence into the tool from inside a flow.

## Actions (§16.7)

Cross-flow reuse goes through MCP. An action node calls another flow exposed as an
MCP tool:

```
post_to_slack["post_to_slack"]@{
  shape: action,
  connectorRef: "mermaid.post_slack"
}
```

Visually distinct from a low-level tool. There is no `instance of` keyword in v0.8.1
— action nodes are the reuse mechanism.

## Connectors (§8)

A real keyword for external integration points; tools and actions bind via
`connectorRef`.

```
connector github["GitHub"]
github@{ protocol: "http", endpoint: "https://api.github.com", token_required: true }

create_issue@{ shape: tool, connectorRef: "github.create_issue" }
```

`connectorRef` canonical form is **dotted**: `"github.create_issue"` — the prefix is
the connector id, the suffix is the operation. Bare-id form (`"github"`) is still
accepted.

Connector keys: `protocol`, `endpoint`, `transport`, `command`, `auth`,
`token_required`.

## Types & templates — metadata only (§9)

No `type` / `template` declarations. Name them as strings in `params` / `returns` /
`output`: `returns: "CoffeeCopy"`, `params: { city: String }`. Type expressions:
`String`, `Int`, `Float`, `Bool`, `List<T>`, `Map<K,V>`, `T?`, named records.

## Metadata applicability (§10)

Flat `@{ … }` — no `agentflow:` wrapper. **`description` and `instruction` are
cross-cutting** — valid on any authored element.

| Element                  | Keys                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `flow`                   | `model`, `memory`, `params`, `returns`                                                                         |
| task (default node)      | `execution`, `params`, `returns`                                                                               |
| tool (`shape: tool`)     | `params`, `returns`, `retry`, `cache`, `validate`, `handler`, `output`, `transport`, `command`, `connectorRef` |
| action (`shape: action`) | `params`, `returns`, `connectorRef`                                                                            |
| `connector`              | `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`                                       |
| input (`shape: input`)   | `type`, `value`                                                                                                |
| refdoc (`shape: refdoc`) | (presentation only; cross-cutting keys apply)                                                                  |
| edge                     | `instruction` (only)                                                                                           |

`memory` MUST be a YAML array. Presentation keys (`shape`, `view`, `icon`, `class`,
`style`, `w`, `h`, `img`) sit at the same flat level. Bare and quoted scalars are
equivalent (`String` == `"String"`).

## Validation (§10.2)

- Removed shape used → **hard error**.
- Flow with no input node anywhere in its tree → diagnostic (warning before v1.0,
  error in v1.0). The runtime / editor prompts the user for any missing input values
  before execution.
- Unknown metadata key → preserved, warning emitted.

## Complete example

```
agentflow TB
  connector llm_api["LLM API"]
  llm_api@{ protocol: "http", endpoint: "https://api.example.com/chat" }

  flow coffee_team["Coffee Team"]
    city["city"]@{ shape: input, type: String, value: "Stockholm" }

    flow researcher["Researcher"]
      research_loc["research_location"]@{
        shape: tool, params: { city: String }, returns: "String"
      }
      write_copy["write_copy"]@{
        shape: tool, connectorRef: "llm_api.chat", params: { brief: String },
        returns: "CoffeeCopy"
      }
      city --> research_loc --> write_copy
    end
    researcher@{
      model: "claude-sonnet-4-20250514",
      instruction: "Research the city and draft English coffee copy."
    }

    flow designer["Designer"]
      gen_html["generate_html"]@{
        shape: tool, connectorRef: "llm_api.chat", returns: "String"
      }
      style_guide["Nordic Brand Guide"]@{ shape: refdoc }
      gen_html -.- style_guide
    end
    designer@{ model: "claude-sonnet-4-20250514" }

    researcher --> designer
  end
```

## Changed since v0.8.0 (one-liners)

- Container renamed `agent` → `flow`; one container kind remains.
- `reads` / `writes` removed; data passes between steps implicitly (§6).
- `instance of` keyword removed; cross-flow reuse goes through MCP-callable actions
  (`shape: action`).
- `procs` external-file shape removed.
- Reference edge `---` → `-.-` (dotted, non-directional, still no labels).
- Edges may carry an `instruction` via an edge id.
- Shape aliases (`task`, `tool`, `input`, `decision`, `refdoc`, `action`) become the
  recommended authoring names; Mermaid canonical names still accepted.
- `hexagon` repurposed as `action`; classification/taxonomy pattern removed.
- `prompt` renamed to `instruction` and promoted to a cross-cutting key.
- `connectorRef` dotted form (`"connector.operation"`) is canonical.
- Flow-level input/output validation.
- Removed shapes are hard syntax errors.
- Capability evaluation removed: `permits`, `requires`, and `deny` are gone (the
  Capability Evaluation section that v0.8.0 carried is deleted). Access control is the
  runtime's responsibility.

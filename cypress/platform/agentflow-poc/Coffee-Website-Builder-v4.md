# Coffee Website Builder — Agentflow Diagrams (v4)

Source: `Coffee-Website-Builder.pact`

## Design principles

1. **One Pact file = multiple agentflow diagrams**, linked by reference nodes (`procs` shape + `src`).
2. **Edges are data flow by default.** Specialized arrowheads distinguish other relationship types.
3. **Definitions are nodes, not metadata strings.** Templates, directives, and permissions are visible as shaped nodes.
4. **No duplication.** A node is defined once. Containment implies membership — no metadata echo.
5. **Containers are flexible.** Flows can contain agents (cross-agent orchestration). Agents can contain agents (bundles).

## Edge types

| Edge                 | Syntax     | Arrowhead      | Meaning                                                    |
| -------------------- | ---------- | -------------- | ---------------------------------------------------------- |
| Data flow            | `A --> B`  | Standard arrow | Data passes from A to B, or sequential execution           |
| Governs              | `A --oo B` | Double circle  | A directive or constraint governs a tool or step           |
| Contains (hierarchy) | `A --$ B`  | Dollar/diamond | Parent contains or grants child (used in permission trees) |

---

## Diagram 1: Pipeline (main)

The `build_site` flow orchestrates across three agents bundled as `coffee_team`.

```agentflow
agentflow TB
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
          coffee_copy["coffee_copy"]
          brief --> write_copy --> english_copy
          write_copy --> coffee_copy
        end
      end

      agent translator["Translator"]
        task step3["Translate to Swedish"]
          translate_sv["translate_to_swedish"]
          bilingual["Bilingual Page"]
          bilingual_page["bilingual_page"]
          english_copy --> translate_sv --> bilingual
          translate_sv --> bilingual_page
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
        scroll["scroll_animations"]
        toggle["bilingual_toggle"]
        gen_html --oo nordic
        gen_html --oo glass
        gen_html --oo scroll
        gen_html --oo toggle
      end
    end
  end

  permit_ref["Permission Tree"]

  city@{ shape: lean-right }
  brief@{ shape: doc }
  english_copy@{ shape: doc }
  bilingual@{ shape: doc }
  html_out@{ shape: doc }
  coffee_copy@{ shape: doc }
  bilingual_page@{ shape: doc }
  nordic@{ shape: lin-doc }
  glass@{ shape: lin-doc }
  scroll@{ shape: lin-doc }
  toggle@{ shape: lin-doc }
  permit_ref@{ shape: procs, src: "./permit-tree.agentflow" }

  researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
  translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  build_site@{ params: "city :: String", returns: "String" }

  research_loc@{ returns: "String", requires: "^net.read", cache: "24h", description: "Research a city's coffee culture: local roasters, neighborhoods, demographics, and vibe" }
  write_copy@{ returns: "String", requires: "^llm.query", retry: 2, description: "Write vivid marketing copy for a coffee shop website" }
  translate_sv@{ returns: "String", requires: "^llm.query", description: "Translate marketing copy to Swedish using du-form" }
  gen_html@{ returns: "String", requires: "^llm.query", description: "Generate a complete one-page HTML website with inline CSS and JS" }
```

## Diagram 2: Permission Tree

Referenced from the main diagram via `permit_ref@{ shape: procs, src: "./permit-tree.agentflow" }`.

```agentflow
agentflow TB
  llm["llm"]
  llm_query["llm.query"]
  net["net"]
  net_read["net.read"]
  llm --$ llm_query
  net --$ net_read

  llm@{ shape: hex }
  llm_query@{ shape: terminal }
  net@{ shape: hex }
  net_read@{ shape: terminal }
```

---

## Changes from v3

| Issue                                                          | What changed                                                                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directives were orphan nodes with no visual link to tools      | New `--oo` (governs) edge connects `gen_html` to each directive node. Visually distinct from data flow.                                                             |
| `build_site` flow had no representation                        | `flow build_site` now wraps the entire cross-agent pipeline. Flows can contain agents.                                                                              |
| `coffee_team@{ agents: "..." }` was redundant                  | Removed. Containment is the relationship.                                                                                                                           |
| Tool descriptions were silently dropped                        | Added `description` metadata field on every action node.                                                                                                            |
| `#` and `%` prefixes were Pact conventions leaking into labels | Removed from labels. Agentflow uses shapes and containers for semantics, not sigils. Pact tooling derives meaning from the diagram structure.                       |
| Permission tree edges contradicted "data flow only" rule       | New `--$` (contains/hierarchy) edge for permission trees. Visually distinct arrowhead.                                                                              |
| Templates had no existence in the diagram                      | `coffee_copy` and `bilingual_page` added as `doc`-shaped nodes inside the tasks that produce them, with data flow edges from the tool.                              |
| Permission reference was disconnected                          | Kept as-is. The `procs` shape + `src` gives it meaning — it's a portal to the permission tree diagram. Placement inside `coffee_team` is possible but not required. |
| Round-trip claim was overstated                                | Reworded as principle. Prose content (prompts, directive text, template field schemas) lives in `.pact`. Diagram captures topology and contracts.                   |

---

## Legend

### Containers

| Container | Keyword                     | Visual                                       | Meaning                                                                                    |
| --------- | --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Agent     | `agent id["Label"] ... end` | Filled, solid 1.5px, rx=14, header separator | Autonomous entity with identity, model, and permissions. Can nest other agents (= bundle). |
| Flow      | `flow id["Label"] ... end`  | Transparent, solid 0.75px, rx=10             | Pipeline or orchestration. Can contain tasks, agents, or both.                             |
| Task      | `task id["Label"] ... end`  | Transparent, dashed 0.75px, rx=10            | Concrete work unit containing action and data nodes.                                       |

Nesting rules:

- Agent can contain: flows, tasks, agents, nodes
- Flow can contain: tasks, agents, nodes
- Task can contain: nodes

### Node shapes

| Shape          | Annotation                      | Visual                         | Meaning                                                        |
| -------------- | ------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| Rounded rect   | (default)                       | Rounded rectangle              | Action node — a tool invocation or processing step.            |
| Input          | `@{ shape: lean-right }`        | Parallelogram                  | Input parameter entering the pipeline.                         |
| Document       | `@{ shape: doc }`               | Wavy-bottom rectangle          | Data artifact or template — a produced value or output schema. |
| Hexagon        | `@{ shape: hex }`               | Hexagon                        | Permission group — a category of capabilities.                 |
| Terminal       | `@{ shape: terminal }`          | Stadium/pill                   | Individual permission — a specific capability grant.           |
| Lined document | `@{ shape: lin-doc }`           | Document with horizontal lines | Directive — a block of instructions or constraints.            |
| Reference      | `@{ shape: procs, src: "..." }` | Stacked rectangles             | External reference — links to another agentflow diagram file.  |

### Edges

| Edge              | Syntax | Arrowhead visual    | Meaning                                                                                                           |
| ----------------- | ------ | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Data flow         | `-->`  | Filled triangle     | Data passes from source to target, or sequential execution. The default edge.                                     |
| Governs           | `--oo` | Double open circle  | A directive constrains or governs a tool. Source is the directive, or the tool points to its governing directive. |
| Contains / grants | `--$`  | Diamond (or custom) | Hierarchical containment. Used in permission trees: parent grants child.                                          |

### Metadata on agents

| Field     | Type                         | Meaning                           |
| --------- | ---------------------------- | --------------------------------- |
| `model`   | string                       | LLM model identifier              |
| `permits` | comma-separated string       | Permissions this agent is granted |
| `view`    | `"collapsed"` / `"expanded"` | Authored presentation default     |

### Metadata on flows

| Field     | Type                   | Meaning                                        |
| --------- | ---------------------- | ---------------------------------------------- |
| `params`  | typed signature string | Flow input parameters, e.g. `"city :: String"` |
| `returns` | string                 | Flow return type                               |

### Metadata on action nodes (tools)

| Field         | Type                   | Meaning                                  |
| ------------- | ---------------------- | ---------------------------------------- |
| `returns`     | string                 | Return type                              |
| `requires`    | comma-separated string | Permissions this tool needs              |
| `description` | string                 | What this tool does (human-readable)     |
| `cache`       | string                 | Cache duration for results, e.g. `"24h"` |
| `retry`       | number                 | Retry count on failure                   |

### Metadata on reference nodes

| Field | Type   | Meaning                                  |
| ----- | ------ | ---------------------------------------- |
| `src` | string | Path to the referenced agentflow diagram |

---

## Pact-to-Agentflow mapping

| Pact construct                                       | Agentflow representation                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `agent @name { ... }`                                | `agent` container + `@{ model, permits }` metadata                                                          |
| `agent_bundle @name { agents }`                      | Outer `agent` containing inner `agent` containers                                                           |
| `flow name(params) -> Type { ... }`                  | `flow` container (can wrap agents) + `@{ params, returns }` metadata                                        |
| `tool #name { description, requires, cache, retry }` | Action node inside task + `@{ description, returns, requires, cache, retry }` metadata                      |
| `tool #name { output: %template }`                   | Data flow edge from action node to a `doc`-shaped template node                                             |
| `template %name { fields }`                          | `doc`-shaped node, placed inside the task that produces it                                                  |
| `directive %name { <<...>> }`                        | `lin-doc` node inside the agent, linked to its tool via `--oo` governs edge                                 |
| `permit_tree { ... }`                                | Separate diagram with `hex`/`terminal` nodes linked by `--$` contains edges, referenced via `procs` + `src` |
| Variable binding `x = ...`                           | Data flow edge: output node of one step connects to input of the next                                       |

## What lives in `.pact` only

- **Prompt text** — agent system prompts (prose, not topology)
- **Template field schemas** — structured field definitions with types (the template node exists visually; its internal schema is in Pact)
- **Directive prose content** — the `<<...>>` instruction blocks (the node shows the directive exists; its content is in Pact)

## Open questions

1. **Templates as separate diagrams?** Currently templates are `doc` nodes inside tasks. For complex templates with many typed fields, they could become their own agentflow diagrams referenced via `procs` + `src`, like the permission tree.
2. **Governs edge direction:** Currently `gen_html --oo nordic` (tool points to directive). Could also be `nordic --oo gen_html` (directive points to tool it governs). Which reads better?
3. **Shared directives:** If multiple agents use the same directive, it can't live inside one agent. Options: place at flow level, place at bundle level, or reference as a separate diagram.

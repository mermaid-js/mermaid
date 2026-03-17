# Coffee Website Builder — Agentflow Diagrams (v5)

Source: `Coffee-Website-Builder.pact`

---

## Design principles

1. **One Pact file = multiple agentflow diagrams**, linked by reference nodes (`procs` shape + `src`).
2. **Edges are data flow by default.** Specialized arrowheads distinguish other relationship types (governs, hierarchy). See [Edge types](#edge-types).
3. **Definitions are nodes, not metadata strings.** Templates, directives, and permissions are visible as shaped nodes.
4. **No duplication.** A node is defined once. Containment implies membership — no metadata echo.
5. **Containers are flexible.** Flows can contain agents (cross-agent orchestration). Agents can contain agents (bundles). See [Nesting rules](#nesting-rules).
6. **Conformance by convention.** A data flow edge from an action node to a `doc`-shaped template node means "this tool's output conforms to that template." See [Template conformance convention](#template-conformance-convention).

---

## Edge types

Three edge types, each with a distinct arrowhead:

| Edge      | Syntax     | Arrowhead          | Meaning                                                                                                                                 |
| --------- | ---------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Data flow | `A --> B`  | Filled triangle    | Data passes from A to B, or sequential execution. The default edge type.                                                                |
| Governs   | `A --oo B` | Double open circle | The target directive constrains or governs the source tool. The arrow points from the governed element toward its governing constraint. |
| Hierarchy | `A --$ B`  | Diamond            | Parent scopes or categorizes child. Used in permission trees: parent is a permission category, child is a specific grant.               |

### When edges cross container boundaries

Edges are allowed to cross container boundaries. This is necessary for:

- **Data flow across tasks:** an output node in one task feeds an action node in the next task.
- **Data flow across agents:** an output node in one agent feeds an action node in another agent.
- **Governs edges:** a directive node (at agent level) connects to a tool node (inside a task).
- **Template conformance:** an action node (inside a task) connects to a template node (at top level).

Cross-container edges are a natural part of the diagram. The visual distinction between edge types (arrow, double-circle, diamond) ensures readability even when edges cross boundaries.

---

## Diagram 1: Pipeline (main)

The `build_site` flow orchestrates across three agents bundled as `coffee_team`. Templates are defined at the top level since they are file-scoped declarations in Pact — any tool in any agent can conform to them.

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
          brief --> write_copy --> english_copy
          write_copy --> coffee_copy
        end
        step1 --> step2
      end

      agent translator["Translator"]
        task step3["Translate to Swedish"]
          translate_sv["translate_to_swedish"]
          bilingual["Bilingual Page"]
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

  coffee_copy["coffee_copy"]
  bilingual_page["bilingual_page"]
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

  research_loc@{ shape: subroutine, returns: "String", requires: "^net.read", cache: "24h", description: "Research a city's coffee culture: local roasters, neighborhoods, demographics, and vibe" }
  write_copy@{ shape: subroutine, returns: "String", requires: "^llm.query", retry: 2, description: "Write vivid marketing copy for a coffee shop website" }
  translate_sv@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Translate marketing copy to Swedish using du-form" }
  gen_html@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Generate a complete one-page HTML website with inline CSS and JS" }

  researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
  translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  build_site@{ params: "city :: String", returns: "String" }
```

## Diagram 2: Permission Tree

Referenced from the main diagram via `permit_ref@{ shape: procs, src: "./permit-tree.agentflow" }`.

The hierarchy edge (`--$`) means "scopes" — the parent is a permission category, the child is a specific grant under that category. An agent with `permits: "^llm.query"` receives only the query permission, not all of `^llm`.

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

## Changes from v4

| Issue in v4                                                        | Resolution in v5                                                                                                                                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template edges used data flow for conformance — semantically wrong | Defined **template conformance convention**: a data flow edge to a `doc`-shaped template node means "output conforms to this schema." Documented as design principle 6. |
| Templates placed inside tasks — wrong scope, can't be shared       | Templates moved to **top level** (file-scoped, like in Pact). Any tool in any agent can conform to them via cross-container edges.                                      |
| Governs edge direction was ambiguous ("source or target")          | **Fixed direction**: arrow points from the governed tool toward its governing directive. `gen_html --oo nordic` reads as "gen_html is governed by nordic_design."       |
| Five nesting levels hard to read                                   | Acknowledged — `view: "collapsed"` on inner agents is the intended mechanism for managing depth.                                                                        |
| No task-to-task sequence edges                                     | **Added `step1 --> step2`** inside the researcher's flow. Task-level edges show sequence at a glance.                                                                   |
| Action nodes visually identical to unlabeled nodes                 | **Tool nodes now use `subroutine` shape** (double-bordered rectangle). Visually communicates "this calls something."                                                    |
| Permission hierarchy edge labeled "Contains / grants" — ambiguous  | **Renamed to "Hierarchy"** with meaning "scopes" — parent is a category, child is a specific grant.                                                                     |
| Cross-container edges undocumented                                 | **Explicitly documented** that edges may cross container boundaries, with examples of each case.                                                                        |

---

## Legend

### Containers

| Container | Keyword                     | Visual                                       | Meaning                                                                                    |
| --------- | --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Agent     | `agent id["Label"] ... end` | Filled, solid 1.5px, rx=14, header separator | Autonomous entity with identity, model, and permissions. Can nest other agents (= bundle). |
| Flow      | `flow id["Label"] ... end`  | Transparent, solid 0.75px, rx=10             | Pipeline or orchestration. Can contain tasks, agents, or both.                             |
| Task      | `task id["Label"] ... end`  | Transparent, dashed 0.75px, rx=10            | Concrete work unit containing action and data nodes.                                       |

#### Nesting rules

- **Agent** can contain: flows, tasks, agents, nodes
- **Flow** can contain: tasks, agents, nodes
- **Task** can contain: nodes only

A flow wrapping agents represents cross-agent orchestration (e.g., a pipeline that dispatches work to multiple agents in sequence). An agent wrapping agents represents a bundle (a deployable group of collaborating agents).

### Node shapes

| Shape          | Annotation                      | Visual                         | Semantic meaning                                               |
| -------------- | ------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| Rounded rect   | (default)                       | Rounded rectangle              | General-purpose node — a step, label, or value.                |
| Subroutine     | `@{ shape: subroutine }`        | Double-bordered rectangle      | Tool invocation — calls an external tool or function.          |
| Input          | `@{ shape: lean-right }`        | Parallelogram                  | Input parameter entering the pipeline.                         |
| Document       | `@{ shape: doc }`               | Wavy-bottom rectangle          | Data artifact or template — a produced value or output schema. |
| Hexagon        | `@{ shape: hex }`               | Hexagon                        | Permission group — a category of capabilities.                 |
| Terminal       | `@{ shape: terminal }`          | Stadium/pill                   | Individual permission — a specific capability grant.           |
| Lined document | `@{ shape: lin-doc }`           | Document with horizontal lines | Directive — a block of instructions or constraints.            |
| Reference      | `@{ shape: procs, src: "..." }` | Stacked rectangles             | External reference — links to another agentflow diagram file.  |

### Edge types

| Edge      | Syntax | Arrowhead          | Meaning                                                                                           |
| --------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------- |
| Data flow | `-->`  | Filled triangle    | Data passes from source to target, or sequential execution.                                       |
| Governs   | `--oo` | Double open circle | The target constrains the source. Arrow points from governed element to its governing constraint. |
| Hierarchy | `--$`  | Diamond            | Parent scopes child. Used in permission trees.                                                    |

#### Template conformance convention

A **data flow edge** (`-->`) from a tool node to a `doc`-shaped template node has a special meaning: **"this tool's output conforms to this template's schema."**

This is a convention, not a separate edge type. It works because:

- The edge target is a `doc`-shaped node (visually distinct wavy-bottom rectangle).
- The template node's label is a schema name (e.g., `coffee_copy`), not a data value.
- The tool's primary data output flows forward in the pipeline via a separate edge.

Example:

```
write_copy --> english_copy    %% data flow: the actual output value
write_copy --> coffee_copy     %% conformance: output conforms to this template
```

A reader can distinguish these because `english_copy` feeds forward into the next task (it has outgoing edges), while `coffee_copy` is a terminal `doc` node (no outgoing edges — it's a schema, not data in motion).

For machine consumption (e.g., Pact round-tripping), a converter identifies conformance edges by checking: the target is a `doc`-shaped node AND the target has no outgoing data flow edges (it's a leaf). This distinguishes templates from data artifacts that happen to use the `doc` shape.

### Metadata on agents

| Field     | Type                         | Meaning                           | Pact equivalent                     |
| --------- | ---------------------------- | --------------------------------- | ----------------------------------- |
| `model`   | string                       | LLM model identifier              | `model: "claude-sonnet-4-20250514"` |
| `permits` | comma-separated              | Permissions this agent is granted | `permits: [^net.read, ^llm.query]`  |
| `view`    | `"collapsed"` / `"expanded"` | Authored presentation default     | (rendering control)                 |

### Metadata on flows

| Field     | Type            | Meaning               | Pact equivalent                   |
| --------- | --------------- | --------------------- | --------------------------------- |
| `params`  | typed signature | Flow input parameters | `flow build_site(city :: String)` |
| `returns` | string          | Flow return type      | `-> String`                       |

### Metadata on action nodes (tools)

| Field         | Type            | Meaning                     | Pact equivalent         |
| ------------- | --------------- | --------------------------- | ----------------------- |
| `returns`     | string          | Return type                 | `returns :: String`     |
| `requires`    | comma-separated | Permissions this tool needs | `requires: [^net.read]` |
| `description` | string          | What this tool does         | `description: <<...>>`  |
| `cache`       | string          | Cache duration for results  | `cache: "24h"`          |
| `retry`       | number          | Retry count on failure      | `retry: 2`              |

### Metadata on reference nodes

| Field | Type   | Meaning                                  |
| ----- | ------ | ---------------------------------------- |
| `src` | string | Path to the referenced agentflow diagram |

---

## Pact-to-Agentflow mapping

| Pact construct                                       | Agentflow representation                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `agent @name { ... }`                                | `agent` container + `@{ model, permits }` metadata                                                           |
| `agent_bundle @name { agents }`                      | Outer `agent` containing inner `agent` containers                                                            |
| `flow name(params) -> Type { ... }`                  | `flow` container (can wrap agents) + `@{ params, returns }` metadata                                         |
| `tool #name { description, requires, cache, retry }` | `subroutine`-shaped node inside task + `@{ description, returns, requires, cache, retry }` metadata          |
| `tool #name { output: %template }`                   | Data flow edge (`-->`) from tool node to top-level `doc`-shaped template node (conformance convention)       |
| `template %name { fields }`                          | Top-level `doc`-shaped node. Any tool can reference it via conformance edge. Field schemas live in `.pact`.  |
| `directive %name { <<...>> }`                        | `lin-doc` node inside its agent, linked to its tool via `--oo` governs edge. Prose content lives in `.pact`. |
| `permit_tree { ... }`                                | Separate diagram with `hex`/`terminal` nodes linked by `--$` hierarchy edges, referenced via `procs` + `src` |
| Variable binding `x = ...`                           | Data flow edge (`-->`) from output node of one step to input of the next                                     |
| Task sequence                                        | Data flow edge (`-->`) between task containers (e.g., `step1 --> step2`)                                     |

---

## What lives in `.pact` only

These are not duplicated in the diagram:

| Pact element                                            | Reason                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Agent `prompt: <<...>>`                                 | System prompts are prose instructions, not topology.                                                                      |
| Template field schemas (`HERO_TAGLINE :: String`, etc.) | The template node shows the template exists; its internal structure is in Pact. May become its own diagram in the future. |
| Directive prose content (`<<...>>` blocks)              | The `lin-doc` node shows the directive exists; its instruction text is in Pact.                                           |

---

## Version history

### v1 (initial)

- Flat diagram with all concepts in one view.
- Cross-container dotted/thick edges for permissions, templates, directives.
- **Problem:** visual spaghetti from relationship edges crossing multiple container levels.

### v2

- Removed all relationship edges — metadata only.
- **Problem:** directives, templates, permissions became invisible. No pipeline overview.

### v3

- Split into multiple diagrams (pipeline + permission tree) linked by reference nodes.
- Agent bundle as nested agents. Directives restored as nodes.
- **Problem:** directives had no visual link to tools. Templates had no existence. `build_site` flow missing.

### v4

- `flow build_site` wrapping cross-agent pipeline. `--oo` governs edge for directives. `--$` hierarchy edge for permissions. Template nodes added. Tool descriptions in metadata. Pact sigils removed from labels.
- **Problem:** templates inside tasks (wrong scope). Governs direction ambiguous. Action nodes not visually distinct from other nodes. Template conformance used plain data flow without documentation.

### v5 (current)

- Templates at top level (file-scoped). Conformance convention documented. Governs direction fixed (tool → directive). `subroutine` shape for tool nodes. Task sequence edges added. Cross-container edges explicitly allowed and documented. Permission hierarchy edge renamed to "scopes."

---

## Open questions

1. **Templates as separate diagrams?** Currently templates are top-level `doc` nodes. For complex templates with many typed fields, they could become their own agentflow diagrams referenced via `procs` + `src`, like the permission tree. The conformance edge would then point to a `procs` reference node instead.
2. **Shared directives across agents:** If multiple agents use the same directive, it should live at the flow or bundle level, not inside one agent. The `--oo` governs edge crosses into each agent's tasks. This works but may need a convention for placement.
3. **`subroutine` shape in the allowed shapes list:** The `subroutine` shape needs to be added to the `ALLOWED_SHAPES` set in `transformData.ts` if not already present. (Implementation note, not a design question.)

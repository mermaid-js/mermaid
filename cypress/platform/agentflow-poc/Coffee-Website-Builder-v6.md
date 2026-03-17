# Coffee Website Builder — Agentflow Diagrams (v6)

Source: `Coffee-Website-Builder.pact`

---

## Design principles

1. **One Pact file = multiple agentflow diagrams**, linked by reference nodes (`procs` shape + `src`).
2. **Edges are data flow by default.** Specialized arrowheads distinguish other relationship types. See [Edge types](#edge-types).
3. **Definitions are nodes, not metadata strings.** Templates, directives, and permissions are visible — templates and permissions as separate diagrams, directives as shaped nodes.
4. **No duplication.** A node is defined once. Containment implies membership.
5. **Containers are flexible.** Flows can contain agents (cross-agent orchestration). Agents can contain agents (bundles). See [Nesting rules](#nesting-rules).
6. **Template conformance convention.** A data flow edge (`-->`) from a tool node to a `procs`-shaped template reference means "this tool's output conforms to that template." See [Template conformance](#template-conformance-convention).

---

## File structure

This Pact file maps to four agentflow diagrams:

```
cypress/platform/
  Coffee-Website-Builder-v6.mmd   Main pipeline diagram
  permit-tree.mmd                  Permission tree (referenced from main)
  coffee-copy.mmd                  %coffee_copy template schema (referenced from main)
  bilingual-page.mmd               %bilingual_page template schema (referenced from main)
```

---

## Diagram 1: Pipeline (main)

**File:** `Coffee-Website-Builder-v6.mmd`

The `build_site` flow orchestrates across three agents bundled as `coffee_team`. Templates and the permission tree are external diagrams linked by reference nodes.

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
          write_copy --> coffee_copy_ref
        end
        step1 --> step2
      end

      agent translator["Translator"]
        task step3["Translate to Swedish"]
          translate_sv["translate_to_swedish"]
          bilingual["Bilingual Page"]
          english_copy --> translate_sv --> bilingual
          translate_sv --> bilingual_page_ref
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

  coffee_copy_ref["coffee_copy"]
  bilingual_page_ref["bilingual_page"]
  permit_ref["Permission Tree"]

  city@{ shape: lean-right }
  brief@{ shape: doc }
  english_copy@{ shape: doc }
  bilingual@{ shape: doc }
  html_out@{ shape: doc }
  nordic@{ shape: lin-doc }
  glass@{ shape: lin-doc }
  scroll@{ shape: lin-doc }
  toggle@{ shape: lin-doc }
  coffee_copy_ref@{ shape: procs, src: "./coffee-copy.mmd" }
  bilingual_page_ref@{ shape: procs, src: "./bilingual-page.mmd" }
  permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

  research_loc@{ shape: subroutine, returns: "String", requires: "^net.read", cache: "24h", description: "Research a city's coffee culture: local roasters, neighborhoods, demographics, and vibe" }
  write_copy@{ shape: subroutine, returns: "String", requires: "^llm.query", retry: 2, description: "Write vivid marketing copy for a coffee shop website" }
  translate_sv@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Translate marketing copy to Swedish using du-form" }
  gen_html@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Generate a complete one-page HTML website with inline CSS and JS" }

  researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
  translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  build_site@{ params: "city :: String", returns: "String" }
```

### Reading this diagram

**Containers (outside in):**

- `coffee_team` — the agent bundle. A deployment unit grouping three collaborating agents.
- `build_site` — the orchestrating flow. Takes `city :: String`, returns `String`. Contains the full pipeline.
- `researcher`, `translator`, `designer` — individual agents inside the flow, each with their own model and permissions.
- `step1` through `step4` — tasks, each containing a tool invocation and its data.

**Data flow (follow the `-->` arrows):**

1. `city` (input) → `research_location` (tool) → `Research Brief` (output)
2. `Research Brief` → `write_copy` (tool) → `English Copy` (output) + conforms to `coffee_copy` template
3. `English Copy` → `translate_to_swedish` (tool) → `Bilingual Page` (output) + conforms to `bilingual_page` template
4. `Bilingual Page` → `generate_html` (tool) → `HTML Website` (final output)

**Governs edges (`--oo`):** `gen_html` is governed by four directives (nordic_design, glassmorphism, scroll_animations, bilingual_toggle) that constrain how the HTML is generated.

**Reference nodes (`procs`):** Three stacked-rectangle nodes link to external diagrams — two templates and the permission tree.

---

## Diagram 2: Permission Tree

**File:** `permit-tree.mmd`

Referenced from the main diagram via `permit_ref@{ shape: procs, src: "./permit-tree.mmd" }`.

The hierarchy edge (`--$`) means "scopes" — the parent is a permission category, the child is a specific grant. An agent with `permits: "^llm.query"` receives only the query permission, not the full `^llm` scope.

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

## Diagram 3: coffee_copy Template

**File:** `coffee-copy.mmd`

Referenced from the main diagram via `coffee_copy_ref@{ shape: procs, src: "./coffee-copy.mmd" }`.

Defines the output schema for the `write_copy` tool. Each field is a `doc`-shaped node with `type` and `description` metadata.

```agentflow
agentflow TB
  hero_tagline["HERO_TAGLINE"]
  hero_subtitle["HERO_SUBTITLE"]
  about["ABOUT"]
  menu_item["MENU_ITEM"]

  hero_tagline@{ shape: doc, type: "String", description: "One punchy headline for the hero" }
  hero_subtitle@{ shape: doc, type: "String", description: "One compelling subtitle, max 20 words" }
  about@{ shape: doc, type: "String", description: "Two paragraphs about the shop's origin and values" }
  menu_item@{ shape: doc, type: "String * 6", description: "Name | Price | Tasting Notes" }
```

---

## Diagram 4: bilingual_page Template

**File:** `bilingual-page.mmd`

Referenced from the main diagram via `bilingual_page_ref@{ shape: procs, src: "./bilingual-page.mmd" }`.

Defines the output schema for the `translate_to_swedish` tool. Two sections representing the bilingual structure.

```agentflow
agentflow TB
  english["ENGLISH"]
  swedish["SWEDISH"]

  english@{ shape: doc, type: "section", description: "Paste the original English copy exactly as received" }
  swedish@{ shape: doc, type: "section", description: "Translate every line to Swedish, keep section labels unchanged" }
```

---

## Changes from v5

| Change                                                               | Reason                                                                                                                                                                                   |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Templates are now separate diagrams referenced via `procs` + `src`   | Consistent with permission tree pattern. Templates are file-scoped definitions — their internal schema deserves its own visual. Same reference mechanism works for all definition types. |
| Template nodes changed from `doc` shape to `procs` (reference) shape | They're no longer inline data nodes — they're portals to external schema diagrams. The `procs` (stacked rectangles) shape communicates "this is defined elsewhere."                      |
| Template conformance convention updated                              | Now: `-->` from tool to `procs` reference node = "output conforms to this template." Previously was `-->` to `doc` leaf node.                                                            |
| `subroutine` shape added to ALLOWED_SHAPES in transformData.ts       | Already present at line 22. No code change needed.                                                                                                                                       |
| Open question about shared directives                                | Deferred. Not a problem yet — will address if/when it arises.                                                                                                                            |

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

A **flow wrapping agents** represents cross-agent orchestration — a pipeline that dispatches work to multiple agents in sequence. Example: `flow build_site` contains `agent researcher`, `agent translator`, `agent designer`.

An **agent wrapping agents** represents a bundle — a deployable group of collaborating agents. Example: `agent coffee_team` contains three inner agents.

These can combine: `agent coffee_team > flow build_site > agent researcher > task step1`.

### Node shapes

| Shape          | Annotation                      | Visual                         | Semantic meaning                                                                                                                 |
| -------------- | ------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Rounded rect   | (default)                       | Rounded rectangle              | General-purpose node.                                                                                                            |
| Subroutine     | `@{ shape: subroutine }`        | Double-bordered rectangle      | Tool invocation — calls an external tool or function. Visually distinct from plain nodes.                                        |
| Input          | `@{ shape: lean-right }`        | Parallelogram                  | Input parameter entering the pipeline.                                                                                           |
| Document       | `@{ shape: doc }`               | Wavy-bottom rectangle          | Data artifact — a produced or consumed value. In template diagrams, represents a typed field.                                    |
| Hexagon        | `@{ shape: hex }`               | Hexagon                        | Permission group — a category of capabilities (used in permission tree diagram).                                                 |
| Terminal       | `@{ shape: terminal }`          | Stadium/pill                   | Individual permission — a specific capability grant (used in permission tree diagram).                                           |
| Lined document | `@{ shape: lin-doc }`           | Document with horizontal lines | Directive — a block of instructions or constraints governing a tool.                                                             |
| Reference      | `@{ shape: procs, src: "..." }` | Stacked rectangles             | External reference — links to another agentflow diagram file. Used for templates, permission trees, and any reusable definition. |

### Edge types

| Edge      | Syntax | Arrowhead          | Meaning                                                                                                   |
| --------- | ------ | ------------------ | --------------------------------------------------------------------------------------------------------- |
| Data flow | `-->`  | Filled triangle    | Data passes from source to target, or sequential execution. The default edge.                             |
| Governs   | `--oo` | Double open circle | The target constrains the source. Arrow points from the governed element toward its governing constraint. |
| Hierarchy | `--$`  | Diamond            | Parent scopes child. Used in permission trees: parent is a category, child is a specific grant.           |

#### Template conformance convention

A **data flow edge** (`-->`) from a `subroutine`-shaped tool node to a `procs`-shaped reference node means: **"this tool's output conforms to the template defined in the referenced diagram."**

```
write_copy --> english_copy       %% data flow: the actual output value
write_copy --> coffee_copy_ref    %% conformance: output conforms to coffee_copy template
```

How to distinguish these two edges from the same tool:

- `english_copy` is a `doc`-shaped node (data artifact) with outgoing edges — it feeds forward in the pipeline.
- `coffee_copy_ref` is a `procs`-shaped node (reference) with `src` pointing to a template diagram — it's a schema, not data in motion.

**For machine consumption** (e.g., Pact round-tripping): a converter identifies conformance edges by checking that the target node has `shape: procs` and a `src` attribute pointing to a template diagram.

#### Governs edge convention

The `--oo` edge points **from the governed element to its governing constraint**:

```
gen_html --oo nordic    %% gen_html is governed by nordic_design
```

This reads as: "generate_html is governed by nordic_design." The directive is the target — the thing being pointed at — which visually places it as the authority.

Governs edges may cross container boundaries: a tool inside a task can point to a directive at agent level. This is expected — directives are agent-scoped definitions that constrain tools within that agent's tasks.

#### Hierarchy edge convention

The `--$` edge means **"parent scopes child"**:

```
llm --$ llm_query    %% llm.query is a specific grant under the llm category
```

An agent with `permits: "^llm.query"` receives only the query permission, not all permissions under `^llm`. The hierarchy expresses namespace/categorization, not permission inheritance.

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

| Field         | Type            | Meaning                         | Pact equivalent                   |
| ------------- | --------------- | ------------------------------- | --------------------------------- |
| `shape`       | `"subroutine"`  | Marks this as a tool invocation | (visual — structure implies tool) |
| `returns`     | string          | Return type                     | `returns :: String`               |
| `requires`    | comma-separated | Permissions this tool needs     | `requires: [^net.read]`           |
| `description` | string          | What this tool does             | `description: <<...>>`            |
| `cache`       | string          | Cache duration for results      | `cache: "24h"`                    |
| `retry`       | number          | Retry count on failure          | `retry: 2`                        |

### Metadata on template field nodes (in template diagrams)

| Field         | Type    | Meaning                         | Pact equivalent              |
| ------------- | ------- | ------------------------------- | ---------------------------- |
| `shape`       | `"doc"` | Marks this as a data/field node | (visual)                     |
| `type`        | string  | The field's data type           | `:: String`, `:: String * 6` |
| `description` | string  | What this field contains        | `<<description text>>`       |

### Metadata on reference nodes

| Field   | Type      | Meaning                                  |
| ------- | --------- | ---------------------------------------- |
| `shape` | `"procs"` | Marks this as an external reference      |
| `src`   | string    | Path to the referenced agentflow diagram |

---

## Pact-to-Agentflow mapping

| Pact construct                                       | Agentflow representation                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent @name { ... }`                                | `agent` container + `@{ model, permits }` metadata                                                                              |
| `agent_bundle @name { agents }`                      | Outer `agent` containing inner `agent` containers                                                                               |
| `flow name(params) -> Type { ... }`                  | `flow` container (can wrap agents) + `@{ params, returns }` metadata                                                            |
| `tool #name { description, requires, cache, retry }` | `subroutine`-shaped node inside task + `@{ description, returns, requires, cache, retry }` metadata                             |
| `tool #name { output: %template }`                   | Data flow edge (`-->`) from `subroutine` tool node to `procs` reference node pointing to template diagram                       |
| `template %name { fields }`                          | Separate diagram with `doc`-shaped field nodes. Referenced from main diagram via `procs` + `src`.                               |
| `directive %name { <<...>> }`                        | `lin-doc` node inside its agent. Linked to its tool via `--oo` governs edge. Prose content lives in `.pact`.                    |
| `permit_tree { ... }`                                | Separate diagram with `hex`/`terminal` nodes linked by `--$` hierarchy edges. Referenced from main diagram via `procs` + `src`. |
| Variable binding `x = ...`                           | Data flow edge (`-->`) from output node to next tool's input                                                                    |
| Task sequence                                        | Data flow edge (`-->`) between task containers (e.g., `step1 --> step2`)                                                        |

---

## What lives in `.pact` only

| Pact element                        | Why it's not in the diagram                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent `prompt: <<...>>`             | System prompts are prose instructions — not topology, not contracts.                                                                                                        |
| Directive prose content (`<<...>>`) | The `lin-doc` node marks the directive's existence and its relationship to tools. The instruction text itself is too long for a diagram and is authored/maintained in Pact. |

Note: template field schemas and permission trees — previously listed here — are now in their own diagrams.

---

## Implementation notes

The following features used in these diagrams are **not yet implemented** in the agentflow parser/renderer:

| Feature                                                               | Status          | What's needed                                                                                                 |
| --------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `--oo` governs edge                                                   | Proposed syntax | New arrowhead type in parser + renderer. Double open circle arrowhead.                                        |
| `--$` hierarchy edge                                                  | Proposed syntax | New arrowhead type in parser + renderer. Diamond arrowhead.                                                   |
| `flow` containing `agent`                                             | Not tested      | Parser may already support this (both are subgraph types). Needs verification.                                |
| `subroutine` shape                                                    | Implemented     | Already in `ALLOWED_SHAPES` set in `transformData.ts`.                                                        |
| `procs` shape                                                         | Implemented     | Already in `ALLOWED_SHAPES` set.                                                                              |
| `view: "collapsed"` metadata on subgraphs                             | Implemented     | Added in this branch — collapses container to opaque rounded rect.                                            |
| Metadata fields (`description`, `requires`, `cache`, `retry`, `type`) | Parser supports | Stored in `vertex.metadata` or `subGraph.metadata`. Not rendered visually yet — available for tooling/export. |

---

## Version history

| Version | Key change                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | Flat diagram. Cross-container relationship edges (dotted/thick) for permissions, templates, directives. Visual spaghetti.                            |
| v2      | All relationship edges removed — metadata only. Clean but invisible contracts.                                                                       |
| v3      | Multi-diagram split. Permission tree as separate diagram. Agent bundles as nested agents. Directives restored as nodes.                              |
| v4      | `flow build_site` wrapping agents. `--oo` governs edge. `--$` hierarchy edge. `subroutine` shape for tools. Tool descriptions. Template nodes added. |
| v5      | Templates at top level. Conformance convention documented. Governs direction fixed. Task sequence edges. Cross-container edges documented.           |
| v6      | Templates as separate diagrams referenced via `procs` + `src`. Complete file structure with 4 .mmd files. All Pact constructs mapped.                |

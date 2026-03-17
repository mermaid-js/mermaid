# Coffee Website Builder — Agentflow Diagrams (v7)

Source: `Coffee-Website-Builder.pact`

---

## Design principles

1. **One Pact file = one main agentflow diagram** plus optional external diagrams for non-type definitions (e.g., permission trees).
2. **Four edge types with distinct semantics.** Data flow (`-->`), uses (`--o`), governs (`---`), hierarchy (`-->>`). See [Edge types](#edge-types).
3. **Templates are types.** Record type declarations define output schemas inline. No separate diagram files needed — the schema is machine-readable and co-located with the pipeline.
4. **No duplication.** A node is defined once. Containment implies membership.
5. **Containers are flexible.** Flows can contain agents (cross-agent orchestration). Agents can contain agents (bundles). See [Nesting rules](#nesting-rules).
6. **Uses edges are explicit.** `--o` from a tool to a type reference node means "output conforms to this schema." No convention needed — it's a first-class edge type.

---

## File structure

```
cypress/platform/
  Coffee-Website-Builder-v7.mmd   Main diagram (includes type declarations)
  permit-tree.mmd                  Permission tree (referenced from main)
```

Template diagrams (`coffee-copy.mmd`, `bilingual-page.mmd`) from v6 are superseded by inline `type` declarations. The permission tree remains external because it represents a structural hierarchy, not a data schema.

---

## Diagram 1: Pipeline (main)

**File:** `Coffee-Website-Builder-v7.mmd`

```agentflow
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
        scroll["scroll_animations"]
        toggle["bilingual_toggle"]
        gen_html --- nordic
        gen_html --- glass
        gen_html --- scroll
        gen_html --- toggle
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
  scroll@{ shape: lin-doc }
  toggle@{ shape: lin-doc }
  coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }
  bilingual_page_ref@{ shape: procs, type: "BilingualPage" }
  permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

  research_loc@{ shape: subroutine, returns: "String", requires: "^net.read", cache: "24h", description: "Research a city's coffee culture: local roasters, neighborhoods, demographics, and vibe" }
  write_copy@{ shape: subroutine, returns: "CoffeeCopy", requires: "^llm.query", retry: 2, description: "Write vivid marketing copy for a coffee shop website" }
  translate_sv@{ shape: subroutine, returns: "BilingualPage", requires: "^llm.query", description: "Translate marketing copy to Swedish using du-form" }
  gen_html@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Generate a complete one-page HTML website with inline CSS and JS" }

  researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
  translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  build_site@{ params: "city :: String", returns: "String" }
```

### Reading this diagram

**Type declarations (top):**

- `CoffeeCopy` — record type with 4 fields: hero_tagline, hero_subtitle, about, menu_item. This is the output schema for the `write_copy` tool.
- `BilingualPage` — record type with 2 fields: english, swedish. This is the output schema for the `translate_to_swedish` tool.

**Containers (outside in):**

- `coffee_team` — the agent bundle. A deployment unit grouping three collaborating agents.
- `build_site` — the orchestrating flow. Takes `city :: String`, returns `String`. Contains the full pipeline.
- `researcher`, `translator`, `designer` — individual agents inside the flow, each with their own model and permissions.
- `step1` through `step4` — tasks, each containing a tool invocation and its data.

**Data flow (follow the `-->` arrows):**

1. `city` (input) --> `research_location` (tool) --> `Research Brief` (output)
2. `Research Brief` --> `write_copy` (tool) --> `English Copy` (output)
3. `English Copy` --> `translate_to_swedish` (tool) --> `Bilingual Page` (output)
4. `Bilingual Page` --> `generate_html` (tool) --> `HTML Website` (final output)

**Uses edges (`--o`):** `write_copy --o coffee_copy_ref` and `translate_sv --o bilingual_page_ref` — these tools produce output conforming to the referenced type schemas. The tool's `returns` metadata also names the type (`returns: "CoffeeCopy"`), creating a verifiable contract: the edge points to a `procs` node whose `type` metadata matches the tool's `returns`.

**Governs edges (`---`):** `gen_html` is governed by four directives (nordic_design, glassmorphism, scroll_animations, bilingual_toggle) that constrain how the HTML is generated.

**Reference nodes (`procs`):**

- `coffee_copy_ref` and `bilingual_page_ref` — stacked-rectangle nodes with `type` metadata pointing to inline type declarations. These are visual anchors for the `--o` uses edges.
- `permit_ref` — stacked-rectangle node with `src` pointing to the external permission tree diagram.

---

## Diagram 2: Permission Tree

**File:** `permit-tree.mmd`

Referenced from the main diagram via `permit_ref@{ shape: procs, src: "./permit-tree.mmd" }`.

The hierarchy edge (`-->>`) means "scopes" — the parent is a permission category, the child is a specific grant. An agent with `permits: "^llm.query"` receives only the query permission, not the full `^llm` scope.

```agentflow
agentflow TB
  llm["llm"]
  llm_query["llm.query"]
  net["net"]
  net_read["net.read"]
  llm -->> llm_query
  net -->> net_read

  llm@{ shape: hex }
  llm_query@{ shape: terminal }
  net@{ shape: hex }
  net_read@{ shape: terminal }
```

---

## Changes from v6

| Change                                                 | Reason                                                                                                                                                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--oo` governs edge replaced by `---`                  | Simpler syntax. Plain line communicates "linked by constraint" without overloading arrowhead semantics.                                                                                        |
| New `--o` uses/references edge                         | Explicit edge type for "this tool uses that template." Replaces the v6 convention of inferring conformance from a `-->` edge targeting a `procs` node.                                         |
| Template conformance edges changed from `-->` to `--o` | `write_copy --o coffee_copy_ref` is self-documenting. Data flow (`-->`) is now reserved strictly for data in motion.                                                                           |
| Inline `type` declarations replace template diagrams   | `CoffeeCopy` and `BilingualPage` are now Record types defined in the main diagram. The schema is machine-readable, co-located, and referenced by both `--o` edges and tool `returns` metadata. |
| Template `procs` nodes use `type` instead of `src`     | `coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }` — links the visual node to its type declaration rather than an external file.                                                           |
| Tool `returns` references type names                   | `write_copy@{ returns: "CoffeeCopy" }` instead of `returns: "String"` — creates a typed contract between tool output and template schema.                                                      |
| Removed `coffee-copy.mmd` and `bilingual-page.mmd`     | Superseded by inline type declarations. Two fewer files to maintain.                                                                                                                           |

---

## Legend

### Type declarations

Type declarations define data schemas at the diagram level. Three forms:

| Form   | Syntax                          | Example                                                    |
| ------ | ------------------------------- | ---------------------------------------------------------- |
| Opaque | `type Name`                     | `type Token`                                               |
| Alias  | `type Name = Expression`        | `type CopyText = String`                                   |
| Record | `type Name = Record { fields }` | `type CoffeeCopy = Record { hero: String, about: String }` |

Record fields use `name: Type` syntax, one per line. Types are free-form strings (e.g., `String`, `String * 6`).

Type declarations are **not rendered as nodes** — they're metadata. To make a type visible in the diagram, create a `procs`-shaped reference node with `type` metadata pointing to the declaration name.

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

| Shape          | Annotation               | Visual                         | Semantic meaning                                                                                         |
| -------------- | ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Rounded rect   | (default)                | Rounded rectangle              | General-purpose node.                                                                                    |
| Subroutine     | `@{ shape: subroutine }` | Double-bordered rectangle      | Tool invocation — calls an external tool or function.                                                    |
| Input          | `@{ shape: lean-right }` | Parallelogram                  | Input parameter entering the pipeline.                                                                   |
| Document       | `@{ shape: doc }`        | Wavy-bottom rectangle          | Data artifact — a produced or consumed value.                                                            |
| Hexagon        | `@{ shape: hex }`        | Hexagon                        | Permission group (used in permission tree diagram).                                                      |
| Terminal       | `@{ shape: terminal }`   | Stadium/pill                   | Individual permission (used in permission tree diagram).                                                 |
| Lined document | `@{ shape: lin-doc }`    | Document with horizontal lines | Directive — instructions or constraints governing a tool.                                                |
| Reference      | `@{ shape: procs }`      | Stacked rectangles             | External reference — links to a type declaration (`type` metadata) or external diagram (`src` metadata). |

### Edge types

| Edge      | Syntax | Arrowhead                           | Meaning                                                                               |
| --------- | ------ | ----------------------------------- | ------------------------------------------------------------------------------------- |
| Data flow | `-->`  | Filled triangle                     | Data passes from source to target, or sequential execution.                           |
| Uses      | `--o`  | Open circle                         | Source uses or references the target. Tool-to-type: "output conforms to this schema." |
| Governs   | `---`  | None (plain line)                   | The target constrains the source. A behavioral policy applied to a tool.              |
| Hierarchy | `-->>` | Stick-figure arrow (double chevron) | Parent scopes child. Permission categories to specific grants.                        |

#### Uses edge (`--o`)

A `--o` edge from a tool to a reference node means **"this tool's output conforms to the referenced type"**:

```
write_copy --o coffee_copy_ref    %% write_copy produces CoffeeCopy-shaped output
translate_sv --o bilingual_page_ref  %% translate_sv produces BilingualPage-shaped output
```

The contract is verifiable: the tool's `returns` metadata names the type (`returns: "CoffeeCopy"`), and the reference node's `type` metadata points to the same type declaration. A round-tripper or validator can check that these match.

#### Governs edge (`---`)

The `---` edge is a plain link connecting a tool to its governing constraints:

```
gen_html --- nordic    %% gen_html is governed by nordic_design
```

Directives (`lin-doc` shape) constrain how the tool operates — they are behavioral policies, not data inputs. Governs edges may cross container boundaries: a tool inside a task can link to a directive at agent level.

#### Hierarchy edge (`-->>`)

The `-->>` edge means **"parent scopes child"**:

```
llm -->> llm_query    %% llm.query is a specific grant under the llm category
```

The hierarchy expresses namespace/categorization, not permission inheritance.

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

| Field         | Type            | Meaning                                             | Pact equivalent                               |
| ------------- | --------------- | --------------------------------------------------- | --------------------------------------------- |
| `shape`       | `"subroutine"`  | Marks this as a tool invocation                     | (visual)                                      |
| `returns`     | string          | Return type — may reference a type declaration name | `returns :: String` or `returns :: %template` |
| `requires`    | comma-separated | Permissions this tool needs                         | `requires: [^net.read]`                       |
| `description` | string          | What this tool does                                 | `description: <<...>>`                        |
| `cache`       | string          | Cache duration for results                          | `cache: "24h"`                                |
| `retry`       | number          | Retry count on failure                              | `retry: 2`                                    |

### Metadata on reference nodes

| Field   | Type      | Meaning                                                                                    |
| ------- | --------- | ------------------------------------------------------------------------------------------ |
| `shape` | `"procs"` | Marks this as a reference                                                                  |
| `type`  | string    | Name of an inline type declaration this node represents                                    |
| `src`   | string    | Path to an external agentflow diagram (used for non-type references like permission trees) |

A reference node uses **either** `type` (inline type) or `src` (external diagram), not both.

---

## Pact-to-Agentflow mapping

| Pact construct                                       | Agentflow representation                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `agent @name { ... }`                                | `agent` container + `@{ model, permits }` metadata                                                             |
| `agent_bundle @name { agents }`                      | Outer `agent` containing inner `agent` containers                                                              |
| `flow name(params) -> Type { ... }`                  | `flow` container (can wrap agents) + `@{ params, returns }` metadata                                           |
| `tool #name { description, requires, cache, retry }` | `subroutine`-shaped node inside task + `@{ description, returns, requires, cache, retry }` metadata            |
| `tool #name { output: %template }`                   | `--o` uses edge from tool to `procs` reference node + tool `returns` references type name                      |
| `template %name { fields }`                          | `type Name = Record { fields }` declaration + `procs` reference node with `type` metadata                      |
| `directive %name { <<...>> }`                        | `lin-doc` node inside its agent. Linked to its tool via `---` governs edge. Prose content lives in `.pact`.    |
| `permit_tree { ... }`                                | Separate diagram with `hex`/`terminal` nodes linked by `-->>` hierarchy edges. Referenced via `procs` + `src`. |
| Variable binding `x = ...`                           | Data flow edge (`-->`) from output node to next tool's input                                                   |
| Task sequence                                        | Data flow edge (`-->`) between task containers (e.g., `step1 --> step2`)                                       |

---

## What lives in `.pact` only

| Pact element                        | Why it's not in the diagram                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent `prompt: <<...>>`             | System prompts are prose instructions — not topology, not contracts.                                                                       |
| Directive prose content (`<<...>>`) | The `lin-doc` node marks the directive's existence and its governance relationship. The instruction text itself is too long for a diagram. |

---

## Implementation notes

| Feature                          | Status             | What's needed                                                                                         |
| -------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `type` declarations              | Implemented        | Grammar parses opaque, alias, and record types. Stored in `typeDeclarations` map.                     |
| `--o` uses edge                  | Already in grammar | `o` end marker produces `arrow_circle` type. Renderer needs to draw open circle arrowhead distinctly. |
| `---` governs edge               | Already in grammar | Three dashes produce `arrow_open` with `length: 1`. Renderer draws plain line (no arrowhead).         |
| `-->>` hierarchy edge            | Already in grammar | `>>` end marker produces `double_arrow_point`. Renderer needs stick-figure arrow variant.             |
| `flow` containing `agent`        | Not tested         | Parser may already support this. Needs verification.                                                  |
| `subroutine` shape               | Implemented        | In `ALLOWED_SHAPES` set.                                                                              |
| `procs` shape                    | Implemented        | In `ALLOWED_SHAPES` set.                                                                              |
| `view: "collapsed"` on subgraphs | Implemented        | Collapses container to opaque rounded rect.                                                           |
| Reference node `type` metadata   | Parser supports    | Stored in `vertex.metadata`. Renderer/tooling should resolve against `typeDeclarations`.              |
| Type-checked `returns`           | Not implemented    | Tooling could validate that a tool's `returns` type name matches a declared type.                     |

---

## Version history

| Version | Key change                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| v1      | Flat diagram. Cross-container relationship edges for permissions, templates, directives.                                                    |
| v2      | All relationship edges removed — metadata only. Clean but invisible contracts.                                                              |
| v3      | Multi-diagram split. Permission tree as separate diagram. Agent bundles as nested agents.                                                   |
| v4      | `flow build_site` wrapping agents. `--oo` governs edge. `--$` hierarchy edge (later `-->>`). `subroutine` shape for tools.                  |
| v5      | Templates at top level. Conformance convention documented. Task sequence edges.                                                             |
| v6      | Templates as separate diagrams referenced via `procs` + `src`. Four .mmd files.                                                             |
| v7      | Templates as inline `type` declarations. `--oo` → `---` (governs). New `--o` (uses). Tool `returns` references type names. Down to 2 files. |

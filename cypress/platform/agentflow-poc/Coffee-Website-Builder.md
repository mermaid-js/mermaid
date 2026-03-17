# Coffee Website Builder — Agentflow Diagrams (v3)

Source: `Coffee-Website-Builder.pact`

## Design principles

1. **One Pact file = multiple agentflow diagrams**, linked by reference nodes (`procs` shape + `src`).
2. **Edges are data flow only.** Bindings (requires, output, directives) live in metadata.
3. **Definitions are nodes, not edges.** Templates, directives, and permissions are things — they get their own shapes.
4. **No duplication.** A node is defined once. Later references use the ID only, no repeated label.
5. **Round-trippable.** The diagrams + metadata should contain enough information to reconstruct the Pact file.

---

## Diagram 1: Pipeline (main)

The top-level orchestration. Three agents grouped in a bundle, with the data flow pipeline.

```agentflow
agentflow TB
  agent coffee_team["Coffee Team"]
    agent researcher["Researcher"]
      flow research_flow["Research & Copywriting"]
        task step1["Research Location"]
          city["city"]
          research_loc["#research_location"]
          brief["Research Brief"]
          city --> research_loc --> brief
        end
        task step2["Write Copy"]
          write_copy["#write_copy"]
          english_copy["English Copy"]
          brief --> write_copy --> english_copy
        end
      end
    end

    agent translator["Translator"]
      task step3["Translate to Swedish"]
        translate_sv["#translate_to_swedish"]
        bilingual["Bilingual Page"]
        english_copy --> translate_sv --> bilingual
      end
    end

    agent designer["Designer"]
      task step4["Generate Website"]
        gen_html["#generate_html"]
        html_out["HTML Website"]
        bilingual --> gen_html --> html_out
      end
      nordic["%nordic_design"]
      glass["%glassmorphism"]
      scroll["%scroll_animations"]
      toggle["%bilingual_toggle"]
    end
  end

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
  permit_ref@{ shape: procs, src: "./permit-tree.agentflow" }

  coffee_team@{ agents: "@researcher, @translator, @designer" }
  researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
  translator@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  designer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  research_flow@{ params: "city :: String", returns: "String" }

  research_loc@{ returns: "String", requires: "^net.read", cache: "24h" }
  write_copy@{ returns: "String", requires: "^llm.query", output: "%coffee_copy", retry: 2 }
  translate_sv@{ returns: "String", requires: "^llm.query", output: "%bilingual_page" }
  gen_html@{ returns: "String", requires: "^llm.query", directives: "%nordic_design, %glassmorphism, %scroll_animations, %bilingual_toggle" }
```

## Diagram 2: Permission Tree

Referenced from the main diagram via `permit_ref@{ shape: procs, src: "./permit-tree.agentflow" }`.

```agentflow
agentflow TB
  llm["^llm"]
  llm_query["^llm.query"]
  net["^net"]
  net_read["^net.read"]
  llm --> llm_query
  net --> net_read

  llm@{ shape: hex }
  llm_query@{ shape: terminal }
  net@{ shape: hex }
  net_read@{ shape: terminal }
```

---

## Changes from v2

| Change                                                               | Reason                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directives restored as `lin-doc` nodes inside designer agent         | Directives are definitions (things), not relationships. They belong as nodes.                                                                                       |
| Directives defined once inside their owning agent, no re-declaration | First definition sets the group. Only the ID is needed for later references.                                                                                        |
| Agent bundle represented as nested agent                             | `agent coffee_team` wraps the three agents — already supported by the syntax.                                                                                       |
| Permission tree split to its own diagram                             | Referenced via `procs` + `src`. Avoids cluttering the pipeline with permission hierarchy. Same tree reusable across multiple diagrams.                              |
| Templates kept as metadata references (for now)                      | Templates are output contracts — `output: "%coffee_copy"` on the tool. Whether they become their own diagram depends on whether we need to visualize field schemas. |

---

## Legend

### Containers

| Container | Keyword                     | Visual                                       | Meaning                                                                                          |
| --------- | --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Agent     | `agent id["Label"] ... end` | Filled, solid 1.5px, rx=14, header separator | Autonomous entity with identity, model, and permissions. Can nest other agents (= agent bundle). |
| Flow      | `flow id["Label"] ... end`  | Transparent, solid 0.75px, rx=10             | Pipeline grouping tasks into a sequence within an agent.                                         |
| Task      | `task id["Label"] ... end`  | Transparent, dashed 0.75px, rx=10            | Concrete work unit containing action and data nodes.                                             |

### Node shapes

| Shape          | Annotation                      | Visual                         | Meaning                                                                                |
| -------------- | ------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| Rounded rect   | (default)                       | Rounded rectangle              | Action node — a tool invocation or processing step.                                    |
| Input          | `@{ shape: lean-right }`        | Parallelogram                  | Input parameter entering the pipeline.                                                 |
| Document       | `@{ shape: doc }`               | Wavy-bottom rectangle          | Data artifact — a value produced or consumed.                                          |
| Hexagon        | `@{ shape: hex }`               | Hexagon                        | Permission group — a category of capabilities (used in permission tree diagram).       |
| Terminal       | `@{ shape: terminal }`          | Stadium/pill                   | Individual permission — a specific capability grant (used in permission tree diagram). |
| Lined document | `@{ shape: lin-doc }`           | Document with horizontal lines | Directive — a block of instructions or constraints attached to a tool.                 |
| Reference      | `@{ shape: procs, src: "..." }` | Stacked rectangles             | External reference — links to another agentflow diagram file.                          |

### Edges

**One semantic meaning: data flow.** Solid arrows (`-->`) only.

| Scope           | Example                           | Meaning                                                                        |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| Within a task   | `city --> research_loc --> brief` | Input feeds action, action produces output.                                    |
| Across tasks    | `brief --> write_copy`            | Output of one task feeds the next task's action.                               |
| Across agents   | `english_copy --> translate_sv`   | Data crosses an agent boundary.                                                |
| Permission tree | `llm --> llm_query`               | Parent permission contains child permission (in permission tree diagram only). |

### Metadata on agents

| Field     | Type                         | Meaning                                   | Pact equivalent                     |
| --------- | ---------------------------- | ----------------------------------------- | ----------------------------------- |
| `model`   | string                       | LLM model identifier                      | `model: "claude-sonnet-4-20250514"` |
| `permits` | comma-separated string       | Permissions this agent is granted         | `permits: [^net.read, ^llm.query]`  |
| `agents`  | comma-separated string       | Agents in this bundle (on wrapping agent) | `agent_bundle { agents: [...] }`    |
| `view`    | `"collapsed"` / `"expanded"` | Authored presentation default             | (rendering control)                 |

### Metadata on flows

| Field     | Type                   | Meaning               | Pact equivalent                   |
| --------- | ---------------------- | --------------------- | --------------------------------- |
| `params`  | typed signature string | Flow input parameters | `flow build_site(city :: String)` |
| `returns` | string                 | Flow return type      | `-> String`                       |

### Metadata on action nodes (tools)

| Field        | Type                   | Meaning                                 | Pact equivalent                     |
| ------------ | ---------------------- | --------------------------------------- | ----------------------------------- |
| `returns`    | string                 | Return type of the tool                 | `returns :: String`                 |
| `requires`   | comma-separated string | Permissions this tool needs             | `requires: [^net.read]`             |
| `output`     | string                 | Template this tool's output conforms to | `output: %coffee_copy`              |
| `directives` | comma-separated string | Directives governing this tool          | `directives: [%nordic_design, ...]` |
| `cache`      | string                 | Cache duration for results              | `cache: "24h"`                      |
| `retry`      | number                 | Retry count on failure                  | `retry: 2`                          |

### Metadata on reference nodes

| Field   | Type      | Meaning                                  | Pact equivalent                |
| ------- | --------- | ---------------------------------------- | ------------------------------ |
| `shape` | `"procs"` | Marks node as an external reference      | (visual)                       |
| `src`   | string    | Path to the referenced agentflow diagram | File path, URL, or database ID |

---

## Pact-to-Agentflow mapping

| Pact construct                      | Agentflow representation                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `agent @name { ... }`               | `agent` container + `@{ model, permits }` metadata                                |
| `agent_bundle @name { agents }`     | Outer `agent` containing inner `agent` containers                                 |
| `flow name(params) -> Type { ... }` | `flow` container + `@{ params, returns }` metadata                                |
| `tool #name { ... }`                | Action node inside task + `@{ returns, requires, output, cache, retry }` metadata |
| `template %name { fields }`         | Referenced by name in `output` metadata on tool nodes                             |
| `directive %name { <<...>> }`       | `lin-doc` node inside the agent that uses it                                      |
| `permit_tree { ... }`               | Separate diagram with `hex`/`terminal` nodes, referenced via `procs` + `src`      |
| Variable binding `x = ...`          | Data flow edge: output node of one step connects to input of the next             |

## What lives in `.pact` only

- **Prompt text** — agent system prompts (prose, not topology)
- **Template field schemas** — structured type definitions (may become their own diagrams later)
- **Directive prose content** — the `<<...>>` instruction blocks (nodes show the directive exists; content is in Pact)
- **Permission tree structure** — visualized in its own diagram, but the hierarchy semantics are Pact's

## Open questions

1. **Templates as diagrams?** Currently referenced by name in metadata. If we want to visualize field schemas (e.g. `HERO_TAGLINE :: String`), templates could become their own agentflow diagrams with structured nodes — referenced the same way as the permission tree.
2. **Custom arrowheads for semantic edges?** We chose metadata-only bindings to keep the diagram clean. But if we define distinct arrowheads (e.g. diamond for `requires`, circle for `output`), we could show bindings as edges without visual overloading. This is an option we're keeping open.
3. **Directive placement:** Currently directives sit as `lin-doc` nodes inside the agent that uses them. If multiple agents share a directive, it may need to move to a shared scope or become a referenced diagram.

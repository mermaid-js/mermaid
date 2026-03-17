# Agentflow: Context Document

## What is Agentflow?

Agentflow is a new Mermaid diagram type for authoring, visualizing, and executing agent instructions. The core insight: agents today receive instructions as unstructured prompts: walls of text with implicit structure, buried constraints, and no visual affordance. Agentflow makes agent instructions diagrammatic: structured, visual, and executable.

The diagram _is_ the source of truth: a contract that defines what an agent can do, what it must produce, and what constraints it operates under. It carries enough metadata to be compiled into an executable data structure, not just rendered as a picture.

## Why?

The current state of agent instruction is text-first: prompts, system messages, tool definitions scattered across config files. This creates problems:

- **Context overload**: agents drown in unstructured text. Humans can't audit what the agent "knows" at a glance.
- **No contract**: there's no formal boundary between what an agent is allowed to do and what it isn't. Permissions, outputs, and constraints are implicit.
- **No visual metaphor**: humans think about instructions in terms of steps, groupings, dependencies, and boundaries. Text flattens all of that.

Agentflow borrows the metaphor humans already use when giving instructions: break work into tasks, define what each task produces, specify what's allowed, and connect tasks by dependencies. Then it encodes that metaphor as a diagram with execution semantics.

## How: The Diagram as Contract

An agentflow diagram consists of **tasks** containing **typed nodes** connected by **edges**.

### The `task` Construct

A task is a bounded unit of work: it groups an action with its inputs, outputs, directives, and permissions.

**Syntax:**

```
agentflow

task write_copy_task["Write Copy"]
  write_copy
  website_copy(output)
  Template["Website copy"](template)
end

task generate_html_task["Generate HTML"]
  generate_html
  website_html(output)
  scandinavian_design(directive)
  Permissions{netRead, llmQuery}
end

write_copy_task --> generate_html_task
```

**Design decisions:**

- **Keyword: `task`**: chosen over `step` (implies strict ordering), `group` (semantically empty), `block` (too generic), `flow` (collision with diagram type). Task naturally nests, carries the right "bounded unit of work" connotation, and is familiar across domains.
- **ID form**: `task <id>["Optional Label"] ... end`. The ID is required (tasks are edge targets). Label is optional: shown top-center when provided, no chrome when omitted.
- **Global node IDs**: inner nodes are _not_ namespaced under their task. This future-proofs cross-task inner-node edges without grammar changes.
- **v1 edge model**: task-to-task edges only. The grammar does not prevent inner-node targeting later.
- **Nesting**: not blocked by grammar, even if v1 layout doesn't support it.

**Visual treatment:**

- Rounded corners
- Dashed border
- No background fill (transparent)
- Dynamic label: top-center when present, absent when omitted

### Node Types (Inner Nodes)

Each node inside a task has a type that carries semantic meaning. Types include (non-exhaustive):

| Type        | Role                                 | Visual Shape        |
| ----------- | ------------------------------------ | ------------------- |
| Action      | The operation the agent performs     | Default (rectangle) |
| Output      | What the task produces               | Flagged shape       |
| Directive   | Style/behavioral guidance            | Annotated shape     |
| Template    | Structured input/reference           | Document shape      |
| Permissions | What capabilities are granted/denied | Hexagon             |

Each node type supports metadata relevant to its semantics.

### Permissions

Permissions define the capability boundary for a task: what the agent can and cannot do. They are first-class: visible in the diagram, not buried in config.

Examples: `netRead`, `netWrite`, `llmQuery`, `fileWrite`, `humanApproval`.

Denied permissions can be shown with a cross/negation marker (as in the reference image: `netWrite` is denied).

## The Three Parts

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  1. Diagram  │ ───> │  2. Editor   │ ───> │  3. Pact     │
│  (Mermaid)   │ <─── │              │ <─── │  (language)  │
└─────────────┘      └─────────────┘      └─────────────┘
                                                  │  ^
                                          forward │  │ reverse
                                                  v  │
                                          ┌─────────────┐
                                          │  Agentic     │
                                          │  Runtime     │
                                          └─────────────┘
```

### Part 1: Agentflow Diagram (Mermaid OSS)

A new diagram type in the Mermaid library. This is the foundation: the syntax, parser, renderer, and layout engine for agentflow diagrams.

This layer defines:

- The `task` construct and inner node types (action, output, directive, template, permissions)
- The grammar and parsing rules
- The visual rendering: shapes, edges, task containers
- The data model: what the parsed diagram looks like as a structured object

This is open source, part of mermaid-js/mermaid. It stands on its own: you can write agentflow syntax in any Mermaid renderer and get a meaningful diagram, just like flowchart or sequence diagrams today.

### Part 2: Editor

A dedicated editing experience for agentflow diagrams. Built on top of Part 1, but adds:

- **Mermaid-style editing**: text-first, code available, with automatic layout. The source syntax is always accessible and authoritative.
- **Metadata editing**: an interface for editing node and task metadata: the semantic layer that the syntax alone can't comfortably express (permissions, directives, output schemas, etc.)
- **Automatic layout**: the diagram arranges itself. No manual positioning.
- **Templates**: pre-built task patterns for common agent operations
- **The context problem**: the editor helps humans structure bounded context for agents, borrowing the metaphor humans already use when giving instructions: steps, groupings, boundaries, dependencies

### Part 3: Export & Generation (via Pact)

The bridge between diagram and running agent is a new language: **Pact**. The agentflow diagram compiles to Pact, and Pact handles the import/export and generation to/from agentic systems. This gives a clean architectural boundary:

```
Agentflow (Mermaid) ←→ Pact ←→ Agentic Runtime
```

Pact is the intermediate representation: it captures the full semantics of the diagram (content, types, relationships, permissions, rules) in a form that is independent of both the visual rendering and the target runtime.

**Forward: Agentflow → Pact → Agent**

The diagram compiles to Pact, which then generates target-specific output:

- **Prompt generation**: tasks compile to system prompts, tool definitions, and behavioral constraints
- **Logic**: task dependencies define execution order and data flow
- **Dialect**: single target runtime first (e.g. Claude/MCP), with multi-dialect support (OpenAI, LangGraph, etc.) as a later phase

Dialect-specific concerns:

- Rules: how constraints map to the target runtime's safety model
- Skills: how capabilities/tools are declared
- Security: how permissions translate to actual capability boundaries
- Environment connection: adapting to what the target runtime provides

**Reverse: Agent → Pact → Agentflow**

Given an existing agentic system (a set of prompts, tool definitions, permission configs), Pact can import and represent it, then generate an agentflow diagram. This enables:

- Visualizing and auditing existing agent behavior
- Onboarding: "show me what this agent does" as a diagram
- Refactoring: import, restructure visually, export improved version
- Round-tripping: diagram → agent → iterate → diagram

## Open Questions

**Part 1: Diagram**

1. Metadata specification: in progress. Needs to be finalized per node type.
2. Validation semantics: to be defined. This can become a source of strength: a diagram that can tell you "this agent config is incomplete/inconsistent" before you deploy it.

**Part 2: Editor** 3. Template system: are templates full diagrams or task-level snippets? Both? 4. Metadata editing interface: what's the right UX for editing node metadata alongside the code view?

**Part 3: Pact** 5. Pact language design: what does the syntax/schema look like? How much of the diagram semantics does it preserve vs abstract away? 6. First dialect target: Claude/MCP? 7. Reverse loop fidelity: can every agentic system be faithfully represented in Pact, or is it lossy? How do we handle constructs that don't map cleanly? 8. Execution feedback: does runtime state flow back through Pact into the diagram (active task, success/failure)? 9. Versioning: how do diagram/Pact versions relate to deployed agent behavior?

## Decisions Made

| Decision              | Choice                                                                          | Rationale                                                      |
| --------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Subgraph keyword      | `task`                                                                          | Bounded unit of work, nests naturally, familiar across domains |
| ID form               | `task <id>["Label"]`                                                            | Required for edge targeting                                    |
| Node ID scope         | Global (not task-scoped)                                                        | Future-proofs cross-task edges                                 |
| v1 edge model         | Task-to-task only                                                               | Simple, grammar doesn't block inner-node edges later           |
| Nesting               | Not blocked in grammar                                                          | v1 layout may not support it                                   |
| Label placement       | Dynamic: top-center when present, absent when omitted                           | Clean, minimal                                                 |
| Visual treatment      | Rounded corners, dashed border, no fill                                         | Logical boundary, not hard container                           |
| Editing paradigm      | Mermaid-style: text-first, code available, automatic layout, metadata interface | Consistent with Mermaid DNA                                    |
| Intermediate language | Pact                                                                            | Clean boundary between diagram and runtime                     |
| Multi-dialect         | Single target first, multi-dialect later                                        | Focus, then expand                                             |

## First Implementation Phase (Part 1: Diagram)

The immediate work is adding the `task` keyword to the agentflow diagram type in Mermaid:

1. Grammar/parser: `task` rule in Langium, integration with existing node/edge rules
2. AST shape: parsed task node in internal representation
3. Renderer: dashed rounded container, dynamic label, transparent fill
4. Layout: task containment, task-to-task edge routing
5. Edge cases: empty tasks, single-node tasks, forward references

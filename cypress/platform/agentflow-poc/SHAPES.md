# Agentflow Shapes Reference

This document catalogues every shape available in agentflow diagrams, their metadata, and semantic meaning within the agent orchestration domain.

## Cluster Shapes (Containers)

Cluster shapes are group nodes (`isGroup: true`) that contain child nodes. They are defined by keywords in the diagram syntax and rendered via `clusters.js`.

| Keyword    | Shape ID     | Visual                                                 | Metadata                               | Semantic Meaning                                                                                                                                          |
| ---------- | ------------ | ------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`    | `agentGroup` | Filled bg, solid 1.5px border, rx=14, header separator | `model`, `permits`, user-defined keys  | An autonomous actor with an LLM identity. Agents hold a model binding and a permission set; they own the tasks they execute.                              |
| `flow`     | `flowGroup`  | Transparent, solid 0.75px border, rx=10                | `params`, `returns`, user-defined keys | A composable sequence of steps that can be invoked as a unit. Flows define an input/output contract (`params`/`returns`) and may be nested inside agents. |
| `task`     | `taskGroup`  | Transparent, dashed 0.75px border, rx=10               | User-defined keys                      | A discrete unit of work within an agent. Tasks group related operations (tool calls, data transforms) into a named, bounded scope.                        |
| `types`    | `typesGroup` | Light tertiary fill, dashed 0.75px border, rx=6        | _(synthetic)_                          | A visual container that collects all `type` declarations defined in the diagram. Automatically generated; not authored directly.                          |
| `subgraph` | `rect`       | Default cluster rectangle                              | User-defined keys                      | Generic grouping container inherited from flowchart. Rarely used directly in agentflow.                                                                   |

## Node Shapes

Node shapes are leaf or collapsed elements (`isGroup: false`). They are set either automatically by the system or explicitly via `@{ shape: ... }` annotations.

### System-Assigned Shapes

These shapes are assigned automatically based on diagram structure — they are not set by the user.

| Shape ID          | Assigned When                          | Visual                                                                        | Metadata                                                                                 | Semantic Meaning                                                                                                                                                                                 |
| ----------------- | -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `collapsedGroup`  | Container has `@{ view: "collapsed" }` | Title + separator + ellipsis dots (- - -); border/fill matches container type | `containerType` (agent/flow/task), `view: "collapsed"`, plus original container metadata | A container whose internals are hidden. Preserves the container's visual identity (agent/flow/task) while signalling that detail is elided. Used for progressive disclosure in complex diagrams. |
| `typeDeclaration` | For each `type` declaration            | `<<kind>>` badge + bold name + separator + fields/expression                  | `typeDeclaration: { name, kind, fields?, expression? }`                                  | A data contract defining the shape of information flowing between agents and tasks. Record types enumerate fields; alias types define shorthand; opaque types declare names without structure.   |
| `roundedRect`     | Default for all user-defined nodes     | Rounded rectangle                                                             | Any user `@{...}` keys                                                                   | General-purpose step or data node. The default shape when no explicit shape annotation is provided.                                                                                              |

### User-Annotated Shapes

These shapes are set explicitly via `@{ shape: <name> }` on a node.

| Shape ID     | Aliases          | Visual                                                          | Typical Metadata                                       | Semantic Meaning                                                                                                                                                         |
| ------------ | ---------------- | --------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `subroutine` | —                | Double-bordered rectangle                                       | `returns`, `requires`, `retry`, `cache`, `description` | A callable tool or function. The double border signals that execution crosses a boundary (API call, LLM query, external service). Metadata captures the tool's contract. |
| `doc`        | —                | Curled-corner document                                          | User-defined keys                                      | A data artifact — a document, report, or structured output produced or consumed by a step.                                                                               |
| `lean-right` | `in-out`         | Parall elogram (right-leaning)                                  | User-defined keys                                      | An input value or parameter entering the flow from outside. The slant visually suggests data in motion.                                                                  |
| `lin-doc`    | `lined-document` | Lined document                                                  | User-defined keys                                      | A reference document or specification — something read but not produced by the current flow (e.g., style guides, templates, schemas).                                    |
| `procs`      | —                | Stacked process                                                 | `type` (type name ref), `src` (external file ref)      | An external reference to a type definition or another diagram. The stacked appearance signals that the node represents something defined elsewhere.                      |
| `stadium`    | `terminal`       | Stadium / pill shape                                            | User-defined keys                                      | A terminal or boundary node — an entry point, exit point, or named endpoint in the flow.                                                                                 |
| `hexagon`    | `hex`            | Hexagon                                                         | User-defined keys                                      | A decision or condition node. The hexagonal shape signals a branching point or evaluation step.                                                                          |
| `circle`     | —                | Circle                                                          | User-defined keys                                      | A join point, event, or signal — a coordination primitive where multiple paths converge or an event is emitted.                                                          |
| `diamond`    | —                | Diamond / rhombus. Also available via inline syntax: `id{text}` | User-defined keys                                      | A decision gate or approval checkpoint — use for conditional branching, approval gates, or alternate-flow routing. Classic flowchart decision semantics.                 |
| `rect`       | `squareRect`     | Square rectangle                                                | User-defined keys                                      | Remapped to `roundedRect` at render time. Equivalent to the default shape.                                                                                               |

## Edge Types

Edges connect nodes and carry semantic weight through their arrow style.

| Syntax | Arrow Type            | Marker              | Semantic Meaning                                                                                                                                           |
| ------ | --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-->`  | `arrow_point`         | Single arrowhead    | **Data flow / sequence.** The primary edge type — data or control passes from source to target.                                                            |
| `--o`  | `arrow_circle`        | Circle endpoint     | **Output binding.** The source produces data that conforms to the target's type contract (e.g., a tool writing to a type reference).                       |
| `--x`  | `arrow_cross`         | X endpoint          | **Error / cancellation.** The edge represents a failure path, cancellation signal, or exception route.                                                     |
| `-->>` | `arrow_hierarchy`     | Double chevron      | **Hierarchy / delegation.** The source delegates authority or spawns the target as a child in the agent hierarchy. Carries permission implications.        |
| `---`  | `arrow_open`          | No arrowhead        | **Association.** A non-directional relationship — the source and target are related but neither drives the other (e.g., a tool referencing a style guide). |
| `o--o` | `double_arrow_circle` | Circle on both ends | **Bidirectional binding.** Both endpoints produce and consume data from each other.                                                                        |

## Metadata Annotation Syntax

All metadata is set via the `@{ key: value, ... }` syntax on a node or container ID:

```
researcher@{ model: "claude-sonnet-4-20250514", permits: "^net.read, ^llm.query" }
write_copy@{ shape: subroutine, returns: "CoffeeCopy", requires: "^llm.query", retry: 2 }
a1@{ view: "collapsed" }
```

Metadata flows through the rendering pipeline as `node.metadata: Record<string, unknown>` and is available to shapes, renderers, and downstream tooling.

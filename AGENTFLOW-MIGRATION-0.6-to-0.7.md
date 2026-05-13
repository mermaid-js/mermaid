# Agentflow v0.6.0 → v0.7.0 Migration Guide

|                        |                                                  |
| ---------------------- | ------------------------------------------------ |
| **From**               | v0.6.0 (2026-04-27)                              |
| **To**                 | v0.7.0 (2026-05-13, pre-1.0 draft)               |
| **Audience**           | Authors of v0.6.0 diagrams; downstream consumers |
| **Authoritative spec** | `AGENTFLOW-SYNTAX.md` (v0.7.0)                   |

> v0.7.0 is a pre-1.0 draft. v0.6.0 sources do **not** parse unchanged — there is no compatibility layer. This document is a checklist of what to change and why.

---

## TL;DR — the seven moves

1. **Wrap Agentflow-domain metadata in an `agentflow: { ... }` sub-block.** Mermaid presentation keys (`shape`, `view`, `icon`, `style`, …) stay at the top level of `@{...}`.
2. **Replace `def: "<id>"` with an instance-binding edge.** `r1 -.-> definition_id`. The `-.->` operator now means **instance binding only**.
3. **Replace `tool -.-> directive` with `tool --- directive`.** Directive binding moves onto the `---` (association) operator. The `-.->` operator is no longer governance / directive binding.
4. **Replace `procs + typeRef/templateRef` with direct type/template names in typed fields.** `procs` is now external-file `src` only.
5. **Convert `params` from a comma-separated string to a YAML mapping.** `params: "x :: String, y :: Int?"` → `params: { x: String, y: "Int?" }`.
6. **Move `memory` to an array** and add `prompt` to agents that have a system prompt.
7. **Move connector-designated nodes inside a required top-level `subgraph connectors[...]`** block. Connectors outside that subgraph are not connectors in v0.7.0.

---

## Quick-reference table

| Concern                             | v0.6.0 (flat)                                                                | v0.7.0 (sub-block + edges)                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Metadata layout                     | `tool@{ shape: subroutine, returns: "X", requires: ["llm.query"] }`          | `tool@{ shape: subroutine, agentflow: { returns: "X", requires: ["llm.query"] } }`             |
| Instance binding                    | `r1@{ shape: tag-rect, def: "researcher" }`                                  | `r1@{ shape: tag-rect }` + edge `r1 -.-> researcher`                                           |
| Directive binding                   | `search_tool -.-> no_pii`                                                    | `search_tool --- no_pii`                                                                       |
| Type reference                      | `ref@{ shape: procs, typeRef: "CoffeeCopy" }` + `--o ref` edge from the tool | Name the type directly in the consuming field: `agentflow: { returns: "CoffeeCopy" }`          |
| Template reference                  | `ref@{ shape: procs, templateRef: "triage_result" }`                         | Name the template in `output`: `agentflow: { output: "triage_result" }`                        |
| External-file ref                   | `permit_ref@{ shape: procs, src: "./permit-tree.mmd" }`                      | `permit_ref@{ shape: procs, agentflow: { src: "./permit-tree.mmd" } }` (only role for `procs`) |
| `params` value form                 | `params: "city :: String, top_k :: Int?"`                                    | `params: { city: String, top_k: "Int?" }`                                                      |
| `agent.memory`                      | `memory: "episodic"` (string)                                                | `memory: ["episodic", "semantic"]` (array)                                                     |
| `agent.model`                       | Implicitly required                                                          | Optional; runtime supplies a default if omitted                                                |
| `agent.prompt`                      | —                                                                            | New: system-prompt body delivered to the LLM                                                   |
| `lean-right.type`                   | —                                                                            | New: type expression for the input value                                                       |
| `value` scope                       | Valid on `lean-right`, `doc`, `lin-doc`                                      | Valid on `lean-right` only                                                                     |
| `example`                           | Optional documentation value on data nodes                                   | Removed                                                                                        |
| `fallbacks` on agent/task/skill     | Optional shape-level array                                                   | Removed                                                                                        |
| `directives` as metadata            | Optional array key on tasks/tools                                            | Removed. Bind directives via `---` edges (§19.5)                                               |
| `text` on directive                 | Sometimes seen in substrate                                                  | Explicitly disallowed; use `rule`                                                              |
| Connector placement                 | Anywhere; `subgraph connectors[...]` was optional grouping                   | Inside a **required** top-level `subgraph connectors[...]`; outside ⇒ not a connector          |
| `connectorRef` value form           | Bare id, dotted form, **or** URL-like string                                 | Bare id, **or** dotted form whose prefix is the connector id                                   |
| `getSemanticModel()` / runtime APIs | Part of the spec (§14.1)                                                     | Removed from the spec — implementation territory                                               |

---

## Migration walk-through

### 1. Metadata layout — wrap Agentflow keys in `agentflow: { ... }`

Mermaid presentation keys (`shape`, `label`, `labelType`, `view`, `icon`, `img`, `w`, `h`, `class`, `style`) stay at the top level. Everything else — descriptions, capabilities, params, returns, connector configuration, directive rules — moves under `agentflow: { ... }`.

```text
# v0.6.0
readFile["Read source"]@{
  shape: subroutine,
  description: "Read source code from GitHub",
  connectorRef: "github.readFile",
  requires: ["llm.query"]
}

# v0.7.0
readFile["Read source"]@{
  shape: subroutine,
  agentflow: {
    description: "Read source code from GitHub",
    connectorRef: "github.readFile",
    requires: ["llm.query"]
  }
}
```

The Mermaid-side keys to keep at the top level: `shape`, `label`, `labelType`, `view`, `icon`, `img`, `w`, `h`, `class`, `style` (and any other Mermaid presentation keys your renderer recognises). The Agentflow-side keys to move under `agentflow:` are all listed in §13 of the spec.

### 2. Instance binding — `def:` becomes a `-.->` edge

The `def:` metadata key is removed. Bind an instance shape to its definition by drawing a `-.->` edge from the instance node to the definition.

```text
# v0.6.0
agent researcher["Researcher"]
  ...
end
researcher@{ model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] }

r1@{ shape: tag-rect, def: "researcher" }

# v0.7.0
agent researcher["Researcher"]
  ...
end
researcher@{ agentflow: { model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] } }

r1["Researcher"]@{ shape: tag-rect }
r1 -.-> researcher
```

The same rule applies for every instance shape: `tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`. For `win-pane` the target is a tool definition (a node with `shape: subroutine`), not a container:

```text
search_web@{ shape: subroutine, agentflow: { returns: "SearchResults" } }

t1["search_web"]@{ shape: win-pane }
t1 -.-> search_web
```

### 3. Directive binding — `-.->` becomes `---`

The dashed governance edge `-.->` no longer carries directive-binding semantics. It is reserved for instance binding (item 2 above). Directive attachment moves onto `---` (general semantic association). Endpoint kind disambiguates the edge from other `---` uses.

```text
# v0.6.0
search_tool -.-> no_pii
no_pii@{ shape: trapezoid, severity: "critical", rule: "Strip all PII before returning results" }

# v0.7.0
search_tool --- no_pii
no_pii@{
  shape: trapezoid,
  agentflow: { severity: "critical", rule: "Strip all PII before returning results" }
}
```

Multiple directives may attach to the same source; each contributes an independent constraint record with no implicit precedence (§19.5).

### 4. `procs` narrows to `src` only — kill `typeRef` and `templateRef`

In v0.6.0, `procs` was an external reference to **a type, a template, or an external file**, disambiguated by `typeRef` / `templateRef` / `src` (exactly one of the three). In v0.7.0, `procs` means **only external-file reference** and `src` is its only valid metadata key. `typeRef` and `templateRef` are removed entirely.

To reference a type or template, name it directly in the typed field that consumes it — `params`, `returns`, or `output`. No separate reference node is needed.

```text
# v0.6.0 — separate reference nodes for the type and the template
write_copy@{ shape: subroutine, output: "triage_result" }
coffee_copy_ref["CoffeeCopy"]
coffee_copy_ref@{ shape: procs, typeRef: "CoffeeCopy" }
triage_tpl_ref["triage_result"]
triage_tpl_ref@{ shape: procs, templateRef: "triage_result" }
write_copy --o coffee_copy_ref
write_copy --o triage_tpl_ref

# v0.7.0 — name them in returns / output directly
write_copy@{
  shape: subroutine,
  agentflow: {
    returns: "CoffeeCopy",
    output: "triage_result"
  }
}
```

External-file references stay, with `src` and the `agentflow:` wrapper:

```text
# v0.6.0
permit_ref@{ shape: procs, src: "./permit-tree.mmd" }

# v0.7.0
permit_ref@{ shape: procs, agentflow: { src: "./permit-tree.mmd" } }
```

### 5. `params` becomes a YAML mapping

The legacy comma-separated typed-signature string is removed. Use a YAML mapping where keys are parameter names and values are type expressions.

```text
# v0.6.0
search_web@{ shape: subroutine, params: "query :: String, top_k :: Int?" }

# v0.7.0
search_web@{
  shape: subroutine,
  agentflow: { params: { query: String, top_k: "Int?" } }
}
```

The single- and multi-parameter edge-label binding rules from §5.5 / §8.4.1 are unchanged — only the value shape of the `params` key changes. Type-expression values may be bare or quoted; `{ city: String }` and `{ city: "String" }` parse identically.

### 6. `memory` becomes an array; `prompt` joins the agent

```text
# v0.6.0
researcher@{ memory: "episodic" }

# v0.7.0
researcher@{
  agentflow: {
    prompt: "You are a careful researcher. Always cite sources.",
    memory: ["episodic", "semantic"],
    permits: ["net.read", "llm.query"]
  }
}
```

`prompt` is new in v0.7.0 — the system-prompt body the LLM receives at invocation. `description` is retained as catalog / UI metadata and is **not** the prompt body.

`agent.model` is now optional. When omitted, the runtime supplies a default; the spec does not fix one.

### 7. Connectors — top-level subgraph required

In v0.6.0, a connector-designated node was any node carrying connector configuration fields (`protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`), and an enclosing `subgraph connectors[...]` was optional grouping. In v0.7.0, the subgraph is **required** and must be top-level. Nodes outside that subgraph are not connectors, even if they carry the same metadata.

```text
# v0.6.0 — connector node anywhere, subgraph optional
github_mcp["GitHub MCP"]
github_mcp@{
  protocol: "mcp",
  transport: "stdio",
  command: "npx -y @modelcontextprotocol/server-github"
}

# v0.7.0 — connector must live inside top-level subgraph connectors[...]
subgraph connectors["Connectors"]
  github_mcp["GitHub MCP"]
end
github_mcp@{
  agentflow: {
    protocol: "mcp",
    transport: "stdio",
    command: "npx -y @modelcontextprotocol/server-github"
  }
}
```

The minimal v0.6.0 form — a tool with `connectorRef` and no connector node at all — is no longer permitted. The target must be declared inside the connectors subgraph.

`connectorRef` itself takes one of two forms: a **bare connector id** (`"github_mcp"`) or a **dotted form** (`"github.create_issue"`) where the prefix is the connector id and the rest is an opaque operation path. The v0.6.0 "URL-like string" fallback is no longer canonical.

### 8. Editor / runtime contracts moved out of scope

§14.1 "Two Representations" and the `getSemanticModel()` projection are out of the syntax spec. Implementations are free to expose semantic content through whatever API they like; the spec describes the authoring surface only.

The synthesized connectors-group id (`agentflow-connectors-group`) and the editor toggle behavior that v0.6.0 §9.6 described are also gone. If your editor needed those behaviors, they live in the editor integration spec now — not in `AGENTFLOW-SYNTAX.md`.

---

## What's removed entirely

| Removed                                       | Replacement                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `def:` metadata key                           | `-.->` edge from instance to definition (§11.2)                            |
| `typeRef` on `procs`                          | Name the type in `params` / `returns` / `output` directly                  |
| `templateRef` on `procs`                      | Name the template in `output` directly                                     |
| Pre-v0.5.0 overloaded `type:` on `procs`      | Use `src` for external-file references; types are named in typed fields    |
| `example` on `lean-right` / `doc` / `lin-doc` | None — drop the key                                                        |
| `fallbacks` on agent / task / skill           | None — drop the key                                                        |
| `directives` metadata key                     | `---` edges from the source to the directive container / trapezoid (§19.5) |
| `text` on directive                           | Use `rule`                                                                 |
| `source` (vestigial in v0.6.0 §4.4.2)         | None — drop the key                                                        |
| `-.->` as governance / directive edge         | `---` for directive binding; `-.->` is now instance binding only           |
| `-*->` operator                               | Never canonical; not part of v0.7.0                                        |
| `getSemanticModel()` discussion               | Out of scope; implementation territory                                     |
| `agentflow-connectors-group` synthesis        | Out of scope; editor integration spec                                      |

---

## What's new in v0.7.0

| New                            | Purpose                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `agentflow: { ... }` sub-block | Clean separation between Mermaid presentation keys and Agentflow domain keys                 |
| `-.->` operator                | Repurposed: instance binding only                                                            |
| `prompt` on `agent`            | System-prompt body delivered to the LLM at invocation                                        |
| `type` on `lean-right`         | Type expression for the input value                                                          |
| `params` as a YAML mapping     | Replaces the comma-separated string form on `task` / `flow` / `skill` / `tool` / `directive` |
| `memory` as a YAML array       | Replaces the single-string form on `agent`                                                   |
| 3-tier diagnostic framework    | Info/Warn → Error → Fatal categories (descriptive in this draft)                             |

---

## Subtle behavior changes (gotchas)

These changes are easy to miss because the syntax surface looks similar.

- **`agent.model` is optional now.** A v0.6.0 diagram that didn't set `model` was effectively under-specified; in v0.7.0 it's explicitly fine. If your tooling assumed `model` would always be present, fix the assumption.
- **`description` on `agent` is not the prompt.** v0.7.0 introduces `prompt` for the system-prompt body. `description` is catalog / UI metadata. If your v0.6.0 diagrams put prompt-style text in `description`, move it to `prompt`.
- **`value` is no longer valid on artifacts.** v0.6.0 allowed `value` on `lean-right`, `doc`, and `lin-doc`. v0.7.0 restricts it to `lean-right`. Documentation-style values on `doc` / `lin-doc` should move to `description` or be removed.
- **`value` may be any YAML value.** Not just strings. `value: 42`, `value: ["a", "b"]`, `value: { city: "Stockholm" }` are all valid.
- **`---` is overloaded.** It now carries directive binding, reference-doc attachment, and taxonomy / classification. Endpoint kind disambiguates which interpretation applies. If you draw an arbitrary `---` between a tool and a trapezoid node, that is a directive binding in v0.7.0.
- **`-.->` is overloaded by direction now.** A v0.6.0 reader interprets `r1 -.-> researcher` as governance / directive. A v0.7.0 reader interprets it as instance binding. The source endpoint (instance shape vs anything else) determines what it means.
- **Connector-designated nodes outside the connectors subgraph are silently regular nodes.** If a v0.6.0 diagram declared `protocol: "http"` on a node sitting inside an agent, that node is no longer a connector in v0.7.0 — it's a regular node with extra metadata that the spec doesn't recognise on a non-connector. The `connectorRef` that pointed at it will be unresolved.
- **Diagnostic IDs are gone from the spec.** v0.6.0 named specific diagnostics like `CONNECTOR_REF_UNRESOLVED`. v0.7.0 describes outcomes in plain language ("emit a connector-reference-unresolved diagnostic") and leaves stable IDs to the implementation / conformance spec.
- **Governance is pre-1.0.** v0.6.0 promised "additive changes only in minor versions." v0.7.0 explicitly says the language is pre-1.0 and draft iterations may break previous forms. The v1.0 release will switch governance back to strict additive minor versions.

---

## Open items in v0.7.0

These are intentionally not settled in this draft. Downstream consumers should expect implementation judgment in these spots until a later round:

1. **Instance-binding cardinality.** Must each instance node have exactly one outgoing `-.->`? Is the reverse direction (`definition -.-> instance`) invalid?
2. **Directive-instance binding.** When a `curv-trap` instance is bound by `-.->` to a `directive` definition and is itself the target of a `---` directive-binding edge, does the constraint record carry the definition's `rule` / `severity` / `context`, or any local overrides on the instance?
3. **`connectorRef` validation severity.** Pre-1.0 vs post-1.0 severity for unresolved bare ids, dotted-form prefixes resolving to non-connectors, etc.
4. **Final wording of the pre-1.0 governance section.** Intent is captured; the precise transition wording for v1.0 is still being drafted.

The full list (and the field-naming carryovers — `agent.description` naming, `task.prompt`, `agent.model` default value) lives in the "Still-open items" section near the top of `AGENTFLOW-SYNTAX.md`.

---

## Where to look in the spec

If you only have time to read part of `AGENTFLOW-SYNTAX.md`, these are the sections that changed the most:

- **§3.2 Container Metadata** — the `agentflow:` sub-block layout
- **§4.4 Node Metadata Fields** — top-level vs sub-block keys, with the full domain-keys table
- **§5.1 Edge Operators** — the new operator table, especially `-.->` and `---`
- **§9 Connectors** — the required top-level subgraph rule
- **§10.2 The `procs` Reference Shape** — narrowed to `src`
- **§11.2 Binding** — instance binding via `-.->`
- **§13 Metadata Applicability** — the per-element key matrix
- **§19.5 Directive Pattern** — `---` for directive binding, composition rules
- **§20 Complete Example** — every change above shown in a single worked example
- **"Canonical Authoring Form"** (near the top of `AGENTFLOW-SYNTAX.md`) — a one-screen reference of all the v0.7.0 preferred forms

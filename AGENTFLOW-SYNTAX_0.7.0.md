# Agentflow Syntax Specification

|             |                                |
| ----------- | ------------------------------ |
| **Version** | 0.7.0                          |
| **Status**  | Draft                          |
| **Date**    | 2026-05-13                     |
| **Authors** | Mermaid-Chart / Agentflow Team |

---

## What's New in v0.7.0

v0.7.0 is the current pre-1.0 draft. The language is not yet released; this section records what changed since v0.6.0 so internal consumers tracking the language can follow along. Per the pre-1.0 governance rule (§Specification Governance), draft iterations may make semantic changes between releases — the spec is the current target, not a backward-compatibility contract.

### TL;DR

1. **Metadata layout uses an `agentflow:` sub-block.** Mermaid presentation keys (`shape`, `label`, `labelType`, `view`, `icon`, `img`, `w`, `h`, `class`, `style`) stay at the top level of `@{...}`. Agentflow domain keys — including `description`, `model`, `prompt`, `permits`, `memory`, `execution`, `params`, `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `connectorRef`, `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`, `strategy`, `assert`, `expects`, `rule`, `severity`, `context`, `value`, `type`, `output`, `src` — go under `agentflow: { ... }` (§3.2, §4.4). The canonical per-element key set is the §13 applicability table.
2. **Instance binding is an edge: `-.->`.** A `tag-rect` / `delay` / `lin-rect` / `win-pane` / `curv-trap` instance binds to its definition through `r1 -.-> researcher`. `-.->` is reserved for this purpose; it has no other semantic. There is no `def:` metadata key (§11).
3. **`---` is general semantic association.** Used for directive attachment, reference-document attachment, and taxonomy / classification. Endpoint kind disambiguates which interpretation applies (§5.1, §19.5).
4. **`procs` is external-file references only.** `src` is the only valid metadata key on `procs`. Type and template references are written directly in the typed field that consumes them — `params`, `returns`, `output` — without a separate reference node (§10.2).
5. **No `def`, `typeRef`, `templateRef`, `example`, `fallbacks`, `directives` metadata key, `text` on directive, or `-*->` operator.** None of these are part of the language.
6. **Connectors live inside a required top-level `subgraph connectors[...]` block.** A connector-designated node is any node declared inside that subgraph (§9.2). `connectorRef` is tool-only and takes either a bare connector id or a dotted form whose prefix is a connector id.
7. **`agent.prompt` is new.** Carries the system-prompt body delivered to the LLM at invocation. `description` is retained as catalog/UI metadata.
8. **`agent.model` is optional.** Runtime-supplied default when omitted; the spec does not fix one.
9. **`agent.memory` is an array** of memory-type tokens.
10. **`params` is a YAML mapping** across `task` / `flow` / `skill` / `tool` / `directive`: `params: { name: Type, ... }`. Type expression values may be bare or quoted.
11. **`value` is valid on `lean-right` only.** May be any YAML scalar, list, or mapping. Semantic, not presentation. Does not control parameter binding; edge labels do (§8.4.2).
12. **Tool metadata is uniformly optional.** Only the node id and a resolved `subroutine` shape are structurally required.
13. **3-tier diagnostic strategy** (Info/Warn → Error → Fatal) is descriptive only in this spec. Concrete diagnostic identifiers and per-rule severity assignments belong to the implementation / conformance spec (§13.3).
14. **Bare and quoted YAML scalars are equivalent** for identifier-like values and type expressions. Booleans, numbers, arrays, and mappings retain their native form (§3.2).
15. **Runtime / export API surface is out of scope.** The spec is an authoring contract; runtime accessors, semantic-export APIs, and editor-to-bridge contracts live in implementation specs (§14).

### Canonical Authoring Form

```text
# 1. Metadata layout — Mermaid presentation keys at top level, Agentflow keys under agentflow:
researcher@{
  view: expanded,
  agentflow: {
    model: "claude-sonnet-4-20250514",
    prompt: "You are a careful researcher. Always cite sources.",
    memory: ["episodic", "semantic"],
    permits: ["net.read", "llm.query"]
  }
}

# 2. params is a YAML mapping (name → type expression). Values may be bare or quoted.
search_web@{
  shape: subroutine,
  agentflow: {
    params: { query: String, top_k: Int? },
    returns: "SearchResults",
    requires: ["net.read"]
  }
}

# 3. Directive binding uses --- (general semantic association). Endpoint kind disambiguates.
search_tool --- no_pii
no_pii@{
  shape: trapezoid,
  agentflow: { severity: "critical", rule: "Strip all PII before returning results" }
}

# 4. Instance binding uses -.-> exclusively.
r1["Researcher"]@{ shape: tag-rect }
r1 -.-> researcher

# 5. procs is for external-file references only. src is its only valid metadata key.
permit_tree@{ shape: procs, agentflow: { src: "./permit-tree.mmd" } }

# 6. Type and template references — name them in the typed field that consumes them.
analyse@{ shape: subroutine, agentflow: { returns: "CoffeeCopy", output: "triage_result" } }

# 7. Connectors live inside a required top-level subgraph connectors[...] block.
subgraph connectors["Connectors"]
  github["GitHub"]
end
github@{ agentflow: { protocol: "http", endpoint: "https://api.github.com", token_required: true } }
create_issue@{ shape: subroutine, agentflow: { connectorRef: "github.create_issue", requires: ["net.write"] } }
```

The following forms are not part of the language: flat metadata (no `agentflow:` wrapper), string-form `params`, the `def:` / `typeRef` / `templateRef` / `example` keys, the `-*->` operator, governance/advisory framing of `-.->`, and connector-designated nodes outside a top-level `subgraph connectors[...]`.

### Compatibility

The spec is pre-1.0 and not yet released. Forms accepted in earlier drafts (v0.6.0 and earlier) are not part of the current language; pre-1.0 drafts do not promise to parse them. Implementations tracking the spec live should follow this draft as the current target. Once v1.0 ships, the spec becomes a stable contract and the rules in §Specification Governance apply.

### Still-open items

These items are intentionally not settled in this draft. They need another round before they become normative.

1. **Exact instance-binding cardinality.**
   - Must each instance node have exactly one outgoing `-.->`, or are multiple binding edges permitted?
   - Is the reverse direction (`definition -.-> instance`) invalid, or merely uncanonical?

   (The "missing binding" outcome is already settled — §11.3 treats it as an error in the semantic interpretation.)

2. **Directive-instance binding semantics.**
   - How is a directive instance (a `curv-trap` bound by `-.->` to a `directive` definition) interpreted when it is itself the target of a `---` directive-binding edge? Does the constraint record carry the definition's `rule` / `severity` / `context`, or the instance node's local overrides if any?

   (Whether multiple directives may attach to one source, and whether precedence applies, is already settled in §19.5: multiple bindings are allowed, each contributes an independent constraint record, no implicit precedence is defined, duplicates collapse semantically with a Tier-1 diagnostic.)

3. **Exact `connectorRef` validation wording.**
   - Bare id that doesn't resolve in the connector namespace — warning, error, or descriptive only?
   - Dotted form whose prefix resolves to a non-connector-designated node — same question.
   - Pre-1.0 vs post-1.0 severity may differ; the spec currently leaves all three outcomes descriptive.

4. **Final wording for the pre-1.0 governance section.**
   - The intent is captured under §Specification Governance, but the precise wording — including how the spec transitions from pre-1.0 to v1.0, and what the v1.0 release notes need to formalise — is still being drafted.

In addition, three field-naming items remain carry-overs from earlier reviews:

- **`agent.description` naming.** With `prompt` explicit, `description` risks ambiguity against the same field name on `tool` (where it is selection metadata). A future revision may rename or drop.
- **`task.prompt`.** Prompt-fields research recommends a dedicated `prompt` on `task`. Not added yet.
- **`agent.model` default.** When omitted, the default model is runtime-supplied. The spec does not fix a default.

---

## What's New in v0.6.0

> **Historical — non-normative.** This section describes the v0.6.0 draft state at the time it was written. v0.7.0 is the current target; rules described below may have been superseded. Where this section and §1–§20 disagree, §1–§20 wins.

This section is for readers coming from v0.5.0. v0.6.0 was a **purely additive** release under the additive-change framing that applied at the time. No keywords, shapes, or edge operators changed in v0.6.0 itself.

### TL;DR

1. **Input-value metadata** — input and artifact nodes (`lean-right`, `doc`, `lin-doc`) accept two new metadata keys: `value` (the literal value at this point in the flow) and `example` (an illustrative value for documentation). See §4.4.2 and §8.4.2.
2. **Metadata applicability extended** — §13 lists `value` and `example` on input and artifact nodes.
3. **Semantic export coverage** — both keys are semantic, not presentation, and are retained by `getSemanticModel()` (§14.1).

### Before / after

```text
# v0.5.0 — no concrete-value field; authors had to encode values into description
file_path["file_path"]@{
  shape: lean-right,
  description: "Path to file: src/HelloWorld.java"
}

# v0.6.0 — value is data, description stays prose
file_path["file_path"]@{
  shape: lean-right,
  description: "Path to the file in the GitHub repository to visualize",
  value: "src/HelloWorld.java"
}
```

### Compatibility

A v0.5.0 implementation reading a v0.6.0 diagram preserves the new keys with an "unknown key" warning (§13.2) — no breaking change. A v0.6.0 implementation reading a v0.5.0 diagram is fully compatible.

---

## What's New in v0.5.0

> **Historical — non-normative.** This section describes the v0.5.0 draft state at the time it was written. v0.7.0 is the current target; rules described below may have been superseded. Where this section and §1–§20 disagree, §1–§20 wins.

This section is for readers coming from v0.4.0. It names only the **author-visible changes** — what you typed differently in v0.5.0 — and points at the detailed section for each. Everything else in the document at that time was either tighter rules, new validators, or clarifying text against unchanged syntax.

### TL;DR

1. **Tool definitions formalised** — a tool is any named node whose resolved shape is `subroutine` (§8). No new keyword; the existing shape syntax is canonical.
2. **Connectors formalised as metadata** — tools bind to external integration points via the new `connectorRef` metadata key (mirrors `typeRef`/`templateRef`); connector-designated nodes are optionally grouped in a `subgraph connectors` block (§9). No new keyword.
3. **New metadata keys: `typeRef`, `templateRef`** — replacing the overloaded `type` on `procs` reference nodes (§10.2).
4. **List-valued metadata must be YAML arrays** — `permits`, `requires`, `deny`, `fallbacks`, `directives` (§12.1).
5. **Edge operators canonicalised** — `-->` is control, `==>` is data flow; each operator carries a distinct `edgeSemantic` (§5.1).
6. **Container-edge labels are semantic** — `A ==>|city| flow_x` binds to the parameter named `city` (§5.5).

### Before / after — the concrete edits

```text
# tools — no syntax change. The shape-based form is the canonical form,
# now with normative rules around definition vs invocation, what win-pane
# can reference, and where capability validation applies (§8).
# v0.4.0 and v0.5.0:
  do_work["do_work"]
  do_work@{ shape: subroutine, returns: "OutputType", requires: ["llm.query"] }

# connectors — no syntax change. Tools bind to external integration
# points via @{ connectorRef: "<id>" } metadata; optionally group connector
# nodes in a `subgraph connectors` block when the document benefits from
# naming them as first-class elements. The connector-designated node's
# own id IS the connector identity — no self-tag needed (§9).
# v0.5.0:
  subgraph connectors["Connectors"]
    github_mcp["GitHub MCP"]
  end
  github_mcp@{ protocol: "mcp", transport: "stdio", command: "npx -y @mcp/github" }

  create_issue["Create Issue"]
  create_issue@{ shape: subroutine, connectorRef: "github_mcp", returns: "Issue", requires: ["net.write"] }

# typeRef / templateRef replace overloaded `type` on procs nodes
# v0.4.0:
  coffee_copy_ref@{ shape: procs, type: "CoffeeCopy" }
  triage_tpl_ref@{ shape: procs, type: "triage_result" }
# v0.5.0:
  coffee_copy_ref@{ shape: procs, typeRef: "CoffeeCopy" }
  triage_tpl_ref@{ shape: procs, templateRef: "triage_result" }

# list-valued metadata is now a YAML array
# v0.4.0:
  researcher@{ permits: "net.read, llm.query" }
# v0.5.0:
  researcher@{ permits: ["net.read", "llm.query"] }

# edge operators carry distinct semantics
# v0.4.0: --> and ==> were data-flow at different stroke weights
# v0.5.0: --> is control, ==> is data flow, -.-> is governance, -->> is delegation

# container-edge labels bind to params
# v0.4.0: label on a data edge into a container was decorative text
# v0.5.0: A ==>|city| flow_x binds to the param named `city`
```

### Behavioural changes against unchanged syntax

- **Branching** — `diamond` is the sole branching vertex; `hexagon` is a classification source (§4.2).
- **Identifier uniqueness** — three namespaces: node/container, type, template; each uniquely named (§10).
- **Containment rules** — each container has an allowed-children set (§3.3); tool definitions (nodes with `shape: subroutine`) are leaves. Connectors (§9) are regular nodes — typically grouped in a `subgraph` for organisation — and are subject to the same node containment rules.
- **Capability evaluation** — the executing agent for a tool invocation is the nearest enclosing `agent` (§12).
- **Metadata applicability** — keys are restricted to the element kinds listed in §13.
- **Presentation vs semantics** — `view`, styling, `icon`, `img`, `w`, `h` are stripped from the new `getSemanticModel()` projection (§14).

### Not changing

Container keywords, inline shape syntaxes (`{text}`, `(((text)))`, `[[text]]`, etc.), direction, frontmatter, accessibility, interactivity, styling surface, `type`/`template` declarations, instance shapes and `def`, and the diagram-declaration keyword are all unchanged.

### Staged rollout

Rules marked "warn before v1.0 / error in v1.0" are specified normatively now but the runtime emits warnings rather than validation errors until v1.0. See `AGENTFLOW-readiness-actions.md` for the three-wave schedule.

---

## Revision History

| Version | Date       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0   | 2026-03-14 | Initial syntax reference: `agent`, `flow`, `task` containers; node shapes; edge types; type declarations; templates; styling; accessibility; complete example.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 0.2.0   | 2026-03-16 | Add diamond shape for decisions; document inline `{text}` syntax; add Decision / Alternate Flow pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 0.3.0   | 2026-03-25 | Add `skill`, `testCase`, `directive` containers with theme support. Add `trapezoid`, `inv-trapezoid`, `double-circle` shapes. Add template sections. Extend metadata fields (strategy, assert, expects, severity, context, rule, validate, handler, directives, transport, command, memory, execution, fallbacks). Add Directive, Lesson, Fallback, MCP Connection, Parallel Execution patterns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 0.4.0   | 2026-03-25 | Add definition/instance pattern with 5 instance shapes (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`). Add `def` core metadata field for instance-to-definition binding. Formalize as versioned specification with revision history.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 0.5.0   | 2026-04-21 | Semantic tightening per the downstream-readiness review (`AGENTFLOW-readiness-actions.md`). Formalise the **shape-based tool definition model** (§8): a tool is any named node whose resolved shape is `subroutine`, with normative rules for definition vs invocation, what `win-pane` may reference, the canonical metadata contract, and where capability validation applies. Formalise **connectors as metadata** (§9): tools bind via the new `connectorRef` key (mirrors `typeRef`/`templateRef`); connector-designated nodes are optionally grouped in a `subgraph connectors` block — no new keyword, with a normative rationale for when one would be justified. Canonicalise edge semantics with a new first-class `edgeSemantic` field (§5). Formalise identifier resolution across three namespaces (§10). Define definition / instance inheritance (§11). Add container-edge boundary semantics with explicit parameter-name label binding (§5.5). Add capability evaluation with executing-agent resolution (§12). Add metadata applicability table (§13). Split `type` / `template` / `src` reference kinds into `typeRef`, `templateRef`, and `src`. Declare presentation-only controls explicitly non-semantic and introduce a `getSemanticModel()` export projection (§14). Audit examples and add a Conformance Tests appendix. Some rules are specified now and enforced from v1.0 onward per the three-wave rollout in `AGENTFLOW-readiness-actions.md`. |
| 0.6.0   | 2026-04-27 | Add input-value metadata: `value` and `example` keys on data-artifact nodes (`lean-right`, `doc`, `lin-doc`). `value` is the literal value at a point in the flow; `example` is an illustrative value for documentation. Both keys are semantic and retained by `getSemanticModel()`. Purely additive under the additive-change rule — no keywords, shapes, or edge operators change. §4.4.2, §8.4.2, §13 updated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 0.7.0   | 2026-05-13 | Pre-1.0 draft. Agentflow domain metadata lives under `agentflow: { ... }`; Mermaid presentation keys (`shape`/`view`/`icon`/`style`/etc.) stay at the top level (§3.2, §4.4). Instance binding is `-.->` only — no `def:` metadata (§11). `---` is general semantic association (directive, ref-doc, taxonomy) (§5.1, §19.5). `procs` is external-file `src` references only; `typeRef` / `templateRef` are not part of the spec (§10.2). Connector-designated nodes live inside a required top-level `subgraph connectors[...]` (§9.2). `agent.model` optional, `agent.memory` an array, `agent.prompt` added. `params` is a YAML mapping. `value` valid on `lean-right` only; `example` not part of the spec. Tool metadata uniformly optional. 3-tier diagnostic strategy is descriptive only; concrete IDs and severity assignments are out of scope. Runtime/export APIs out of scope. PDF discussion artifacts non-normative; the `bundle` container, camelCase normalisation, `graphData` envelope, and spec-level `agent.model` default are not adopted. §1–§20 updated.                                                                                                                                                                                                                                                                                                                                                                                              |

## Specification Governance

This document is a **pre-1.0 draft**. The language is not yet released; the spec is a moving target shared with downstream consumers (parser, editor, bridge, runtime) so they can implement against the current direction while it is still being refined.

**Rules:**

1. **Pre-1.0, semantic changes are permitted between draft iterations.** The spec may reclassify forms, remove keys, swap canonical operators, or narrow shape semantics from one draft to the next. Authors should treat each draft as the current target, not as a stable contract. Downstream consumers tracking the language live should expect breaking changes until v1.0.
2. **Each draft documents what changed.** A "What's New" summary and a revision-history table at the top of this document record the iteration-to-iteration deltas while the spec is still under development. These notes exist because internal downstream consumers depend on them; they are not a backward-compatibility commitment.
3. **No silent drift.** Within a single draft, the normative body describes one canonical form per concept. Anything not described in the normative body is unsupported, regardless of what previous drafts allowed.
4. **Post-v1.0 governance is stricter.** Once v1.0 ships, the spec becomes a stable contract: minor versions are additive only, major versions document migration paths, and changes to released semantics require a major-version bump. The current pre-1.0 mode is a temporary affordance.
5. **Reference kinds are separated.** The canonical forms are:
   - **External-file reference** — a `procs`-shaped node carries `src` (§10.2). This is the only role of `procs`.
   - **Instance reference** — instance shapes (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`) bind to a definition through an **instance-binding edge** (`-.->`, §11.2).
   - **Type / template reference** — types and templates are referenced directly from the typed field that consumes them (`params`, `returns`, `output`); there is no separate reference key.

---

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

Containers are the structural backbone of agentflow. They group nodes into semantic units and can be nested subject to the containment rules in §3.3. Every container follows the same syntax:

```
<keyword> <id>["Title"]
  ...children...
end
```

Leaf declarations `type` (§6) and `template` (§7) are **not** containers — they register standalone elements and do not use `end`. Tool definitions (§8) are likewise leaf nodes but are introduced through the existing shape syntax rather than a dedicated keyword. Connectors (§9) are not a separate construct at the grammar level; they are modelled as metadata bindings (and optionally as referenceable nodes grouped in a `subgraph`).

### 3.1 Container Types

| Keyword     | Shape ID         | Visual                                                         | Semantic Meaning                                                                                                                                              |
| ----------- | ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`     | `agentGroup`     | Filled background, solid 1.5px border, rx=14, header separator | An **autonomous actor** with an LLM identity. Agents hold a model binding and a permission set; they own the tasks they execute.                              |
| `flow`      | `flowGroup`      | Transparent, solid 0.75px border, rx=10                        | A **composable sequence** of steps that can be invoked as a unit. Flows define an input/output contract (`params`/`returns`) and may be nested inside agents. |
| `task`      | `taskGroup`      | Transparent, dashed 0.75px border, rx=10                       | A **discrete unit of work** within an agent. Tasks group related operations (tool calls, data transforms) into a named, bounded scope.                        |
| `skill`     | `skillGroup`     | Pill-shaped (rx=20), filled, solid 1px border                  | A **composed capability** with a strategy orchestrating multiple tools. Skills encapsulate reusable multi-step operations.                                    |
| `testCase`  | `testGroup`      | No fill, solid 2px border, sharp corners (rx=0)                | A **verification container** asserting expected behavior. The rigid square edges signal formal verification.                                                  |
| `directive` | `directiveGroup` | Light fill, dot-dash 1.5px border, rx=2                        | A **reusable behavioral constraint** governing agent/tool behavior. Defines guardrails, policies, or rules.                                                   |
| `subgraph`  | `rect`           | Default cluster rectangle                                      | Generic grouping container inherited from flowchart. Rarely used directly in agentflow; unrestricted containment for legacy compatibility.                    |

Synthetic (auto-generated, not authored directly):

| Shape ID         | Visual                                          | Semantic Meaning                                                                     |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `typesGroup`     | Light tertiary fill, dashed 0.75px border, rx=6 | A visual container that collects all `type` declarations defined in the diagram.     |
| `templatesGroup` | Light tertiary fill, dashed 0.75px border, rx=6 | A visual container that collects all `template` declarations defined in the diagram. |

### 3.2 Container Metadata

Containers accept metadata via `@{...}` after their declaration block. v0.7.0 splits the inside of `@{...}` into two layers: Mermaid presentation keys stay at the top level, and every Agentflow domain key sits under an `agentflow: { ... }` sub-block:

```
agent researcher["Researcher"]
  ...
end
researcher@{
  view: expanded,
  agentflow: {
    model: "claude-sonnet-4-20250514",
    permits: ["net.read", "llm.query"]
  }
}
```

**Top-level (Mermaid presentation) keys.** `shape`, `label`, `labelType`, `view`, `icon`, `img`, `w`, `h`, `class`, `style`, plus any other presentation keys Mermaid recognises (`form`, `pos`, `animate`, `animation`, `curve`, `constraint`). These never carry Agentflow semantics and are consumed by the renderer untouched.

**`agentflow:` sub-block (Agentflow domain) keys.** The full list lives in §4.4.2 and the per-element applicability matrix in §13. It includes `description`, `model`, `prompt`, `permits`, `memory`, `execution`, `params`, `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `connectorRef`, `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`, `strategy`, `assert`, `expects`, `rule`, `severity`, `context`, `value`, `type`, `output`, and `src`.

Which metadata keys are valid on which container kind is defined in §13 _Metadata Applicability_. Values that are lists (`permits`, `requires`, `deny`, `memory`) MUST be YAML arrays.

> **Bare vs quoted scalars — where equivalence applies.** YAML treats `permits: [llm.query]` and `permits: ["llm.query"]` as the same value: the string `llm.query` in both cases. The same equivalence applies inside `params` value positions: `params: { city: String }` and `params: { city: "String" }` parse identically. Authors may use either form throughout; identifier-like enum values (e.g. `shape: subroutine`, `view: expanded`) conventionally appear bare, while free-form strings (descriptions, prompts) are conventionally quoted.
>
> The equivalence covers **string-like identifiers and type expressions** — places where this spec expects an identifier, a shape name, a protocol or transport token, a capability key, a memory-category token, or a type expression. YAML-native **booleans** (`token_required: true`), **numbers** (`value: 42`, `retry: 2`), **arrays** (`permits: ["net.read"]`), and **mappings** (`params: { city: String }`, `value: { user_id: "u_123" }`) retain their native semantic form on the wire and in any downstream model that consumes them. The spec does not normalise those into strings.

> **When to use `skill` vs `flow`:** A `flow` is a general-purpose composable sequence — it models _what happens in what order_. A `skill` is a higher-level capability that bundles tools with a `strategy` — it models _what an agent can do_. Use `flow` when the emphasis is on the step sequence; use `skill` when the emphasis is on the composed capability and how tools coordinate (parallel, round-robin, etc.).

### 3.3 Containment Rules

Containment defines **structural validity**, not execution ownership. Execution ownership is resolved separately by the capability rules in §12 — it can cross structural boundaries through delegation and instance references.

The following matrix lists allowed children for each parent container:

| Parent      | Allowed children                                                |
| ----------- | --------------------------------------------------------------- |
| `agent`     | `flow`, `task`, `skill`, `directive`, `testCase`, `tool`, node  |
| `flow`      | `task`, `agent`, `skill`, `directive`, `testCase`, `tool`, node |
| `task`      | `tool`, `directive`, node                                       |
| `skill`     | `tool`, `flow`, `directive`, node                               |
| `directive` | node                                                            |
| `testCase`  | `directive`, node                                               |
| `subgraph`  | unrestricted (legacy escape hatch)                              |

> **`tool` in this matrix is a categorical kind, not a keyword.** It denotes any node whose resolved shape is `subroutine` (or one of its aliases — see §8). Authors do not write a literal `tool` keyword anywhere.

Tools are leaves; they cannot be parents. Connectors (§9) are regular nodes that live inside a top-level `subgraph connectors[...]` block; that subgraph is itself a top-level container. Placements outside this matrix produce a warning before v1.0 and become validation errors in v1.0.

### 3.4 Nesting Example

```
agent dev_team["Development Team"]
  flow build_app["Build Application"]
    agent architect["Architect"]
      task design["Design System"]
        requirements["requirements"]
        design_system["design_system"]
        requirements ==> design_system
      end
    end
  end
end
```

---

## 4. Nodes

Nodes are the leaf elements — individual steps, data artifacts, tools, or references.

### 4.1 Declaration Syntax

```
id                                # bare node (label = id)
id["Label Text"]                  # labeled node
id["Label"]@{ key: value }       # node with metadata
id{Decision Text}                 # diamond (decision) node — inline syntax
```

Labels support HTML fragments for line breaks: `["First Line<br>Second Line"]`.

The diamond shape has dedicated inline syntax `id{text}` in addition to `@{ shape: diamond }`, making it easy to add decision points and alternate-flow routing without metadata annotations.

### 4.2 Branching

Agentflow uses `diamond` as the canonical **branching vertex**. Alternate-flow routing, approval gates, and mutually exclusive outcomes MUST originate from a `diamond`.

The `hexagon` shape is a **condition or classification source**. Its outgoing edges feed a branch but a `hexagon` is not itself the branching vertex. A `hexagon` with multiple branch-labelled outgoing edges produces a validation warning.

### 4.3 Node Shapes

Shapes carry semantic weight. They are set either automatically by the system or explicitly via `@{ shape: ... }`.

#### 4.3.1 System-Assigned Shapes

| Shape ID          | Assigned When                          | Visual                                                                | Semantic Meaning                                                                                                                                                                                      |
| ----------------- | -------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roundedRect`     | Default for all user-defined nodes     | Rounded rectangle                                                     | General-purpose step or data node. The default shape when no explicit annotation is provided.                                                                                                         |
| `collapsedGroup`  | Container has `@{ view: "collapsed" }` | Title + separator + ellipsis dots; border/fill matches container type | A container whose internals are hidden. Preserves the container's visual identity (agent/flow/task/skill/testCase/directive) while signalling that detail is elided. Used for progressive disclosure. |
| `typeDeclaration` | For each `type` declaration            | `<<kind>>` badge + bold name + separator + fields/expression          | A data contract defining the shape of information flowing between agents and tasks.                                                                                                                   |

#### 4.3.2 User-Annotated Shapes

Set explicitly via `@{ shape: <name> }`:

| Shape ID        | Aliases                                     | Visual                        | Semantic Meaning                                                                                                                                                                                         |
| --------------- | ------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subroutine`    | `subprocess`, `subproc`, `framed-rectangle` | Double-bordered rectangle     | A **callable tool or function**. The canonical form for a tool definition (§8). Any of the listed aliases marks the node as a tool.                                                                      |
| `doc`           | —                                           | Curled-corner document        | A **data artifact** — a document, report, or structured output produced or consumed by a step.                                                                                                           |
| `lean-right`    | `in-out`                                    | Parallelogram (right-leaning) | An **input value or parameter** entering the flow from outside. The slant visually suggests data in motion.                                                                                              |
| `lin-doc`       | `lined-document`                            | Lined document                | A **reference document or specification** — something read but not produced by the current flow (e.g., style guides, brand manuals, schemas).                                                            |
| `procs`         | —                                           | Stacked process               | An **external-file reference**: `@{ shape: procs, agentflow: { src: "./file.mmd" } }` (§10.2). `src` is the only metadata key valid on `procs`.                                                          |
| `stadium`       | `terminal`                                  | Stadium / pill shape          | A **terminal or boundary node** — an entry point, exit point, or named endpoint in the flow.                                                                                                             |
| `hexagon`       | `hex`                                       | Hexagon                       | A **condition or classification source** (not a branching vertex; see §4.2).                                                                                                                             |
| `circle`        | —                                           | Circle                        | A **join point, event, or signal** — a coordination primitive where multiple paths converge or an event is emitted.                                                                                      |
| `diamond`       | —                                           | Diamond / rhombus             | A **decision gate or approval checkpoint** — the canonical branching vertex (§4.2).                                                                                                                      |
| `trapezoid`     | —                                           | Trapezoid                     | A **behavioral directive or constraint** — a rule, policy, or guardrail that governs agent or tool behavior.                                                                                             |
| `inv-trapezoid` | —                                           | Inverted trapezoid            | An **inverted directive** — alternate orientation for constraint nodes.                                                                                                                                  |
| `double-circle` | `doublecircle`                              | Double circle                 | A **test assertion node** — signals a verification checkpoint or assertion in a test flow. Note: inline syntax `(((...)))` produces the legacy alias `doublecircle`; prefer `@{ shape: double-circle }`. |
| `rect`          | `squareRect`                                | Square rectangle              | Remapped to `roundedRect` at render time. Equivalent to the default shape.                                                                                                                               |

#### 4.3.3 Instance Shapes

Instance shapes are lightweight references to definitions. The full validity and inheritance model is specified in §11.

Declare an instance shape with `@{ shape: <instance-shape> }` and bind it to its definition with a `-.->` edge (§11.2).

| Shape ID                 | Aliases     | Visual                   | Instance Of              |
| ------------------------ | ----------- | ------------------------ | ------------------------ |
| `tagged-rectangle`       | `tag-rect`  | Rectangle with a tag/tab | **Agent** definition     |
| `half-rounded-rectangle` | `delay`     | Half-rounded rectangle   | **Flow** definition      |
| `lined-rectangle`        | `lin-rect`  | Lined/shaded rectangle   | **Skill** definition     |
| `window-pane`            | `win-pane`  | Four-pane window         | **Tool** definition      |
| `curved-trapezoid`       | `curv-trap` | Curved trapezoid         | **Directive** definition |

**Usage:**

```
agent researcher["Researcher"]
  task step1["Research"]
    search["search"]
  end
end
researcher@{ agentflow: { model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] } }

researcher_inst["Researcher"]
researcher_inst@{ shape: tag-rect }
researcher_inst -.-> researcher
```

The instance node `researcher_inst` inherits all domain metadata (model, permits) from the `researcher` definition through the `-.->` binding edge. Rendering fields do not inherit; see §11.

### 4.4 Node Metadata Fields

All metadata is set via `@{ key: value, ... }`. v0.7.0 uses the two-layer layout introduced in §3.2:

- **Top level of `@{...}`:** Mermaid presentation keys (§4.4.1) — `shape`, `view`, `icon`, `img`, `w`, `h`, `class`, `style`, and similar.
- **Inside `agentflow: { ... }`:** Agentflow domain keys (§4.4.2) — `description`, `value`, `type`, `returns`, `requires`, and the rest of the table below.

Which keys are valid on which element kind is specified in §13 _Metadata Applicability_.

#### 4.4.1 Core Fields (top-level, affect rendering)

| Field           | Purpose                                              | Example                           |
| --------------- | ---------------------------------------------------- | --------------------------------- |
| `shape`         | Override node shape                                  | `subroutine`, `doc`, `lean-right` |
| `view`          | Collapse/expand control (presentation-only; see §14) | `"collapsed"`, `"expanded"`       |
| `icon`          | Icon identifier (presentation-only; see §14)         | Icon name string                  |
| `img`, `w`, `h` | Image and dimensions (presentation-only; see §14)    | URL, pixel values                 |

#### 4.4.2 Domain Fields (inside `agentflow: { ... }`)

These fields carry semantic meaning consumed by tooling but do not change how the node renders. They are the contents of the `agentflow: { ... }` sub-block; §13 defines which keys are valid on which element kinds.

| Field            | Purpose                                                                                                                                | Example                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `description`    | Human-readable description (valid on any authored element)                                                                             | `"Classify data sensitivity"`                                        |
| `value`          | Literal value at a point in the flow (input nodes only, §8.4.2). May be any YAML scalar, list, or mapping. Semantic, not presentation. | `"src/HelloWorld.java"`, `42`, `["a", "b"]`, `{ city: "Stockholm" }` |
| `type`           | Type expression for an input value (input nodes only)                                                                                  | `String`, `Int?`, `"CoffeeCopy"`                                     |
| `returns`        | Output type contract                                                                                                                   | `"CoffeeCopy"`, `"String"`                                           |
| `requires`       | Required capabilities (YAML array)                                                                                                     | `["net.read", "llm.query"]`                                          |
| `deny`           | Denied capabilities (YAML array)                                                                                                       | `["llm.query"]`                                                      |
| `connectorRef`   | Tool binding to a connector (§9.1; tool definitions only)                                                                              | `"github_mcp"`, `"github.create_issue"`                              |
| `params`         | Input parameters as a YAML mapping (name → type expression)                                                                            | `{ city: String, top_k: Int? }`                                      |
| `retry`          | Retry count on failure                                                                                                                 | `2`                                                                  |
| `cache`          | Cache duration                                                                                                                         | `"30s"`, `"24h"`                                                     |
| `output`         | Template conformance                                                                                                                   | `"triage_result"`                                                    |
| `model`          | LLM model binding (agent containers; optional — runtime default if omitted)                                                            | `"claude-opus-4-6"`                                                  |
| `prompt`         | System-prompt body delivered to the LLM at invocation time (agent containers)                                                          | `"You are a careful researcher..."`                                  |
| `permits`        | Granted capabilities, YAML array (containers)                                                                                          | `["net.read", "llm.query"]`                                          |
| `strategy`       | Orchestration strategy (skill containers)                                                                                              | `"parallel"`, `"round-robin"`                                        |
| `assert`         | Assertion expression (testCase containers)                                                                                             | `"output.length > 0"`                                                |
| `expects`        | Expected behavior (testCase containers)                                                                                                | `"non-empty response"`                                               |
| `severity`       | Impact level (directive / lesson nodes)                                                                                                | `"high"`, `"critical"`                                               |
| `context`        | Situational context                                                                                                                    | `"production outage"`                                                |
| `rule`           | Behavioral rule text (canonical key on `directive`; `text` is not accepted)                                                            | `"always verify backups"`                                            |
| `validate`       | Validation method for tool output                                                                                                      | `"json-schema"`, `"strict"`                                          |
| `handler`        | External HTTP endpoint for tool execution                                                                                              | `"http POST https://api.example.com"`                                |
| `protocol`       | Integration protocol (on a connector-designated node, §9)                                                                              | `"mcp"`, `"http"`, `"sql"`                                           |
| `endpoint`       | External endpoint (on a connector-designated node, §9)                                                                                 | `"https://api.example.com"`                                          |
| `transport`      | Transport for protocols that require one                                                                                               | `"stdio"`, `"sse"`                                                   |
| `command`        | Command line for stdio-based servers                                                                                                   | `"npx -y @mcp/server"`                                               |
| `auth`           | Authentication mode (on a connector-designated node, §9)                                                                               | `"bearer"`, `"oauth2"`, `"none"`                                     |
| `token_required` | Whether a token is required (on a connector-designated node, §9)                                                                       | `true`, `false`                                                      |
| `memory`         | Agent memory categories, YAML array (containers)                                                                                       | `["episodic", "semantic"]`                                           |
| `execution`      | Task execution mode                                                                                                                    | `"sequential"`, `"parallel"`                                         |
| `src`            | External-file reference (canonical on `procs` shape; §10.2)                                                                            | `"./permit-tree.mmd"`                                                |

---

## 5. Edges

Edges connect nodes and containers and carry semantic weight through their operator form.

### 5.1 Edge Operators

Each operator has one **primary semantic**. Stroke is a rendering property of the semantic, not an independent axis.

| Operator | `edgeSemantic` value | Primary semantic                                                                                                      | Marker                      |
| -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `-->`    | `control`            | precedence / control sequence                                                                                         | single arrow                |
| `==>`    | `data`               | data flow / artifact transfer                                                                                         | thick single arrow          |
| `--o`    | `conformance`        | contract conformance / output binding                                                                                 | circle endpoint             |
| `-->>`   | `delegation`         | delegation / spawn / authority hand-off                                                                               | double chevron              |
| `--x`    | `failure`            | failure / cancellation                                                                                                | X endpoint                  |
| `---`    | `association`        | general semantic association — directive attachment (§19.5), reference-document attachment, taxonomy / classification | line, no arrow              |
| `-.->`   | `instanceBinding`    | instance binding — connects an instance shape to its definition (§11.2)                                               | dotted, single arrow        |
| `o--o`   | `bidirectional`      | bidirectional data sync                                                                                               | circle endpoints both sides |

**Operator pairing rules.**

- `-.->` is reserved for instance binding only. The source endpoint MUST be one of the five instance shapes (`tag-rect`, `delay`, `lin-rect`, `win-pane`, `curv-trap`); the target endpoint MUST be a definition of the matching kind (§11.2). Using `-.->` between any other endpoint kinds is unsupported.
- `---` carries every other non-driving relationship: directive attachment, reference-doc attachment, taxonomy / classification. Endpoint kind disambiguates which interpretation applies (§19.5, §19.2, §19.3).
- The `-*->` operator is not part of the language.

### 5.2 Edge Labels

Labels are placed between pipe characters or inline:

```
A -->|"label text"| B
A -- label text --> B
sentinel --alert--> monitor
writer ==>|Article Draft| editor
input ==>|query| search_web
```

The last form — a labelled `==>` edge — is the **most semantically loaded** label form. When the target is a container boundary (§5.5) or a tool definition with declared `params` (§8.4.1), the label is the **parameter name** the edge binds to. Outside those contexts the label is decorative.

### 5.3 Edge Stroke

Stroke presentation follows the operator: thick is the rendering of `==>`, dotted is the rendering of `-.->`. An operator MUST NOT carry a non-canonical stroke combination (e.g. a "thick dotted" edge has no semantic).

### 5.4 Fan-out (& operator)

Send one output to multiple targets:

```
classifier ==>|Classification Report| processor & auditor
```

The `&` operator is used only in edge fan-out, not in node declarations.

### 5.5 Container Edges

An edge that touches a container has a defined binding at the container boundary:

- An incoming **precedence edge** (`-->`) to a container targets the container's **entry boundary**.
- An outgoing precedence edge from a container originates at its **completion boundary**.
- An incoming **data edge** (`==>`) binds to a parameter declared in the container's `params`.
- An outgoing data edge originates from the container's `returns`.

Data edges on containers without a declared `params` / `returns` are invalid.

On an incoming data edge, the edge label is interpreted as a **parameter name**, not decorative text:

- If `params` declares one parameter, the label is optional and binds implicitly.
- If `params` declares multiple parameters, the label is required and MUST match one of them exactly. `A ==>|city| flow_x` binds `city`.

`returns` is single-valued at the container boundary; outgoing data edges do not require label binding, and any label on such an edge is decorative. A future version may introduce multiple named return channels, at which point the same parameter-name label rule would apply to outgoing edges.

These rules produce warnings before v1.0 and become validation errors in v1.0.

---

## 6. Type Declarations

Types define the data contracts that flow between agents and tasks. Type names live in their own namespace (§10) and are referenced from the typed fields that consume them (`params`, `returns`, `output`).

Three forms:

### 6.1 Opaque Type (name only, no structure)

```
type TypeName
```

### 6.2 Alias Type (reference to another type)

```
type UserId = String
type OptionalReport = Report?
type Reports = List<Report>
type Lookup = Map<String, Report>
```

### 6.3 Record Type (structured fields)

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

### 6.4 Rendering

Types are automatically collected into a `typesGroup` container. They render as `typeDeclaration` shapes showing: `<<kind>>` badge, bold name, separator, and fields/expression.

To expand the types container visually:

```
types@{ view: expanded }
```

---

## 7. Template Declarations

Templates define reusable structural patterns with typed fields, multiplicities, and descriptions. Template names live in their own namespace (§10), distinct from types and from nodes/containers.

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

### 7.1 Template Sections

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

### 7.2 Template References

To reference a template from execution context, name it directly in the typed field that consumes it — most commonly the `output` field on a tool definition:

```
triage_alert@{ shape: subroutine, agentflow: { output: "triage_result" } }
```

The template `triage_result` is registered in the template namespace (§7) and recognised by tooling without a separate reference node.

Templates are automatically collected into a `templatesGroup` container. To expand visually:

```
templates@{ view: expanded }
```

---

## 8. Tool Definitions

A **tool definition** is a named node whose resolved shape is `subroutine`. Tools are leaf nodes — no `end`, no children — and are introduced through the existing shape syntax, not through a dedicated keyword:

```
search_web["Search Web"]
search_web@{
  shape: subroutine,
  agentflow: {
    returns: "SearchResults",
    requires: ["net.read"],
    retry: 2,
    cache: "24h"
  }
}
```

Tool metadata keys are listed in §13 _Metadata Applicability_ under the `tool` row. All Agentflow domain keys live inside the `agentflow: { ... }` sub-block (§3.2, §4.4); only `shape` and other Mermaid presentation keys sit at the top level. Tool definitions live in the node/container namespace (§10).

### 8.1 Definition vs Invocation

A tool **definition** registers a reusable executable primitive and performs no work by itself. Writing a bare tool definition at the top level (or inside any container the matrix in §3.3 permits) is valid.

An **invocation** is a use of a tool definition from execution context. The invocation forms supported in v0.x / 1.0 are:

- an edge (typically `==>` for data flow into the tool, or `-->` for control sequencing) from any node that is structurally inside a `task`, `flow`, or `skill` container — including input nodes (`lean-right`), data-artifact nodes (`doc`, etc.), and other regular nodes within those containers — into the tool definition's ID; or
- a `win-pane` instance (§11) bound to the tool definition by an instance-binding edge (`-.->`, §11.2), placed inside an executing container.

A bare tool definition at the top level — with no incoming edges from inside an executing container — is a definition only and is **not** invoked. Additional invocation forms may be added in a later version under the additive-change rule.

Capability evaluation (§12) runs **only at invocation sites**, never at the definition site.

### 8.2 Rendering and Aliases

Tool definitions render with the `subroutine` visual. The `subroutine` shape is identified by its canonical name and its accepted aliases (`subprocess`, `subproc`, `framed-rectangle`); any of these mark the node as a tool definition.

### 8.3 Why a Shape, Not a Keyword

Earlier drafts of this spec proposed a first-class `tool` keyword. That direction was withdrawn in revision 5 of `AGENTFLOW-readiness-actions.md`: the language already expresses tools through `shape: subroutine` and `win-pane`, and a keyword would create a second representation for the same concept. The shape-based form is the canonical and only form.

### 8.4 Tool `params` and Edge Binding

Tool `params` is part of v0.5.0. It is a declarative input parameter set on a tool definition, parallel to the `params` field already used on container boundaries (§5.5). It appears on the `tool` row of the §13 metadata applicability table and lets downstream tooling validate that an invocation provides the inputs the tool expects.

```
search_web["search_web"]
search_web@{
  shape: subroutine,
  agentflow: {
    params: { query: String },
    returns: "SearchResults",
    requires: ["net.read"]
  }
}
```

> **`params` value shape (v0.7.0).** `params` is a YAML mapping: keys are parameter names, values are type expressions drawn from §6 (primitives, user-defined types, `T?` optional, `List<T>`, `Map<K,V>`, nested records). Type expression values may be bare or quoted — `params: { city: String }` and `params: { city: "String" }` are equivalent (§3.2). Source order is preserved by YAML and is the order in which positional reasoning (e.g., signature display) treats the parameters. The legacy comma-separated string form (`params: "query :: String, top_k :: Int?"`) is accepted with a Tier-1 deprecation warning and removed in v1.0.

#### 8.4.1 Edge-Label Binding into a Tool

Incoming **data edges** (`==>`) into a tool definition use the same parameter-binding rule that container boundaries use (§5.5):

- If the tool declares **no `params`**, an incoming data edge is allowed but unbound. The edge label, if present, is decorative.
- If the tool declares **exactly one parameter**, the edge label is optional. When omitted, the edge binds to that parameter implicitly.
- If the tool declares **multiple parameters**, the edge label is **required** and MUST match exactly one declared parameter name. A missing or non-matching label is a validation error.

```
search_web@{
  shape: subroutine,
  agentflow: { params: { query: String, top_k: Number } }
}

input_query["search term"]
top_k_node["10"]

input_query ==>|query| search_web
top_k_node ==>|top_k| search_web
```

Control edges (`-->`) into a tool sequence the invocation but do not bind parameters; their labels are decorative.

#### 8.4.2 Input-Value Metadata

> **Scope note.** `value` lives on **input nodes** (`lean-right`), not on tool definitions. It is described here because its primary use is providing concrete inputs into parameterised tools (§8.4.1). The metadata applicability is canonical in §13; the field row is listed in §4.4.2.

An input node accepts a `value` metadata key for the literal value at this point in the flow:

| Key     | Purpose                                                                              |
| ------- | ------------------------------------------------------------------------------------ |
| `value` | The literal value flowing from this input. May be any YAML scalar, list, or mapping. |

`value` is valid on `lean-right` nodes only. It is **not** valid on tool definitions, container nodes, artifact nodes (`doc`, `lin-doc`), or reference nodes.

```
file_path["file_path"]@{
  shape: lean-right,
  agentflow: {
    description: "Path to the file in the GitHub repository to visualize",
    type: String,
    value: "src/HelloWorld.java"
  }
}
```

Input nodes also accept the `type` key, which records the type expression for the input value (§4.4.2).

**Required vs optional.** `value` is optional. An input node without it is fully valid.

**`value` is semantic, not presentation.** It is part of the authored semantic interpretation of the diagram and is preserved by tooling that consumes the semantic model. The presentation-only stripping rules of §14 do not apply to it.

**Edge-binding is independent of `value`.** When an input node flows into a parameterised tool or container, the parameter binding still resolves by edge label (or by the single-parameter implicit rule per §5.5 / §8.4.1). `value` is the data; the edge label is the binding mechanism. The two are orthogonal.

```
file_path["file_path"]@{ shape: lean-right, agentflow: { type: String, value: "src/HelloWorld.java" } }
read_file["read_file"]@{ shape: subroutine, agentflow: { params: { path: String } } }

file_path ==>|path| read_file
```

**Type conformance.** Type-conformance of `value` against the declared `type` is not validated by the spec — the value is recorded as authored. Conformance checking is implementation territory.

---

## 9. Connectors (Metadata-based)

A **connector** is a logical reference to an external integration point — an MCP server, HTTP endpoint, database, event bus, or any other system outside the diagram that tools and agents bind to.

Agentflow does not introduce a dedicated `connector` declaration keyword. Connectors are modelled as **regular nodes declared inside a required top-level `subgraph connectors[...]` block** (§9.2), and tools reference them via the **`connectorRef`** metadata key (§9.1).

### 9.1 Binding Metadata: `connectorRef`

A **tool definition** (§8) binds to a connector via the **`connectorRef`** metadata key. `connectorRef` is valid only on tool definitions:

```
save_diagram["save_diagram"]
save_diagram@{
  shape: subroutine,
  agentflow: {
    connectorRef: "mermaid.create_document",
    description: "Save diagram to Mermaid Chart platform"
  }
}
```

The string value takes one of two forms:

- A **bare connector id** (e.g. `"github_mcp"`) — references a connector-designated node by id. The validator resolves it against the connector namespace (the contents of the top-level `connectors` subgraph per §9.2).
- A **dotted form** (e.g. `"github.create_issue"`) — the substring before the first dot is the connector id; the remainder is an opaque operation path interpreted by downstream tooling. The prefix is resolved against the connector namespace; the operation portion is not validated by the spec.

The exact diagnostic outcomes for an unresolved bare id, a bare id that lands on a non-connector-designated node, and a dotted form whose prefix is unresolved, are part of the still-open items list at the top of this document.

### 9.2 Connector-Designated Nodes

A **connector-designated node** is a node declared **inside a top-level `subgraph connectors["Connectors"]` block**. The subgraph must be at the top level of the diagram (not nested inside an `agent`, `flow`, or other container). Any node declared inside that subgraph is a connector-designated node; nodes declared elsewhere — even if they carry `protocol` / `endpoint` / `transport` / `command` / `auth` / `token_required` metadata — are not connectors and are not part of the connector namespace.

The node exports its **own node id** as the connector identity — no self-tagging key is needed. Connector-side metadata (`protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`) lives in the node's `agentflow:` sub-block.

Example:

```
subgraph connectors["Connectors"]
  mermaid["Mermaid Chart"]
  github["GitHub"]
end
mermaid@{ agentflow: { protocol: "http", endpoint: "https://mermaid.live", token_required: true } }
github@{ agentflow: { protocol: "http", endpoint: "https://api.github.com", token_required: true } }

save_diagram["save_diagram"]
save_diagram@{
  shape: subroutine,
  agentflow: {
    connectorRef: "mermaid.create_document",
    description: "Save diagram to Mermaid Chart platform"
  }
}

create_issue["Create Issue"]
create_issue@{
  shape: subroutine,
  agentflow: {
    connectorRef: "github.create_issue",
    requires: ["net.write"]
  }
}
```

### 9.3 Connector-Related Metadata Keys

When a node is connector-designated (§9.2), the following metadata keys are recognised under its `agentflow:` sub-block:

- `protocol` — the integration protocol. Common values: `"mcp"`, `"http"`, `"grpc"`, `"sql"`, `"graphql"`, `"websocket"`, `"amqp"`, `"custom"`.
- `endpoint` — URL, connection string, or endpoint identifier.
- `transport` — transport for protocols that require one (e.g. MCP: `"stdio"`, `"sse"`).
- `command` — command line for stdio-based servers.
- `token_required`, `auth` — environment-specific configuration.
- `description` — cross-cutting documentation field.

The set is open; downstream tooling may consume additional keys provided they carry no spec-level meaning.

### 9.4 Collapsing the Connectors Subgraph

The `subgraph connectors[...]` block is a regular container; the standard view-control mechanism from §15 applies:

```
subgraph connectors["Connectors"]
  github_mcp["GitHub MCP"]
  mermaid["Mermaid Chart"]
end
connectors@{ view: "collapsed" }
```

`view: "collapsed"` and `view: "expanded"` are presentation-only (§14).

---

## 10. Identifier Resolution

Agentflow uses three **namespaces**:

1. **Nodes and containers** — IDs declared by user-written node statements (including tool definitions per §8 and any nodes used as connector references per §9), and container keywords (`agent`, `flow`, `task`, `skill`, `directive`, `testCase`, `subgraph`).
2. **Types** — names declared by `type` statements (§6).
3. **Templates** — names declared by `template` statements (§7).

Rules:

- Within each namespace, all IDs MUST be unique. Duplicates are a validation error.
- Across namespaces, IDs may repeat. `type Report` and `template Report` may coexist; tooling resolves a reference against the field it appears in (`returns: "Report"` resolves in the type namespace; `output: "Report"` in the template namespace).
- Forward references are permitted in every namespace.
- Synthetic IDs emitted by the renderer (`typesGroup`, `templatesGroup`, auto-numbered subgraphs) are reserved and MUST NOT be declared by authors.

These rules produce warnings before v1.0 (behind `agentflow.strictIds: false` by default) and become validation errors in v1.0.

### 10.1 Reference Categories

Reference-style keys split into two groups:

- **Semantic references.** Instance binding edges (`-.->`, §11.2) and the implicit type/template references inside `params` / `returns` / `output` are resolved against the diagram model. Unresolved targets are errors in the semantic interpretation.
- **Weak references by convention.** The `connectorRef` metadata key (§9) is a weak reference. Its value is either a **bare id** (matching the `[A-Za-z_]\w*` identifier shape with no dot) or a **dotted form** where the prefix before the first dot is a connector id and the remainder is a downstream-interpreted operation path. The validator resolves a bare id, or the prefix of a dotted form, against connector-designated nodes (§9.2). Unresolved bare ids and bare ids that land on nodes that aren't connector-designated produce diagnostics; the precise warning-vs-error split is part of the still-open items list.
- **External / hygiene references** are validated for shape and allowed usage, but not for existence of the external target unless an import resolver is explicitly enabled. Members: `src`, `click` / `href` targets, and `class` / `style` references.

### 10.2 The `procs` Reference Shape

The `procs` shape in v0.7.0 names a **single canonical role**: an external-file reference identified by `src`. Used to point at a Mermaid or Agentflow file that lives outside the current document and is loaded by tooling separately.

```
permit_tree@{ shape: procs, agentflow: { src: "./permit-tree.mmd" } }
algorithm_expert_src@{ shape: procs, agentflow: { src: "./algorithm-expert.mmd" } }
```

`src` resolution is external / hygiene per §10.1 — the spec validates the value's shape (a path-like string) but does not require the file to exist unless an import resolver is explicitly enabled.

`src` is the only metadata key valid on a `procs` node. In-diagram type and template references are made by naming the type or template directly in the typed field that consumes them (`params`, `returns`, `output`); no separate reference node is needed.

---

## 11. Definition / Instance Semantics

An instance shape is a reference to a definition. The definition is written once in its full form; instances are lightweight references that inherit domain metadata.

### 11.1 Target Matrix

| Instance shape                     | Instance of            |
| ---------------------------------- | ---------------------- |
| `tag-rect` (`tagged-rectangle`)    | `agent` definition     |
| `delay` (`half-rounded-rectangle`) | `flow` definition      |
| `lin-rect` (`lined-rectangle`)     | `skill` definition     |
| `win-pane` (`window-pane`)         | `tool` definition      |
| `curv-trap` (`curved-trapezoid`)   | `directive` definition |

> **Connectors.** Agentflow does not define an instance shape for connectors. A connector is referenced from its binding context by `connectorRef` (see §9.1 and §10.1). Adding a connector instance shape would require connectors to be promoted into a first-class category with distinct identity and validation; no such promotion is currently planned.

### 11.2 Binding

An instance shape is bound to its definition by an **instance-binding edge** (`-.->`, §5.1) from the instance node to a **definition of the matching kind**:

- For `tag-rect`, `delay`, `lin-rect`, and `curv-trap`, the target is a matching container declaration (`agent`, `flow`, `skill`, `directive`).
- For `win-pane`, the target is a **tool definition** — a node whose resolved shape is `subroutine` (§8). Tools are leaf nodes, not containers, so the target endpoint in this case is a node, not a container.

```
agent researcher["Researcher"]
  ...
end

r1["Researcher"]@{ shape: tag-rect }
r1 -.-> researcher

search_web["search_web"]@{ shape: subroutine, agentflow: { returns: "SearchResults" } }

t1["search_web"]@{ shape: win-pane }
t1 -.-> search_web
```

The `-.->` operator is reserved for this binding role: any `-.->` edge in a diagram is interpreted as an instance binding, and any instance-shape node binds to its definition through `-.->` exclusively. There is no metadata-side binding key.

### 11.3 Validity

- A missing binding (no `-.->` edge leaving the instance node) is an error in the semantic interpretation.
- A **kind mismatch** — the target is a definition of a different kind than the instance shape expects (e.g. `tag-rect` pointing at a `flow` definition, or `win-pane` pointing at a container instead of a `subroutine` node) — is an error.
- A **cyclic binding chain** is an error.
- A `-.->` edge whose target is not a declared definition of the expected kind is unresolved (§10.1) and is an error.

The exact validation surface — whether each instance must have **exactly one** outgoing `-.->`, whether multiple binding edges from one instance are permitted, and whether the reverse direction (`def -.-> instance`) is invalid — is part of the still-open items list at the top of this document.

### 11.4 Inheritance

- Instances inherit **domain metadata only**. Core rendering fields (`shape`, `view`, `icon`, `img`, `w`, `h`) do not inherit.
- On a key collision, the instance's **local metadata overrides** the inherited value.
- Structure does not auto-expand into the instance site; the definition's children are not cloned.
- Style, class membership, `click`, and link styling do not inherit.

---

## 12. Capability Evaluation

### 12.1 Fields

- `permits` — the agent's effective capability set. Declared on `agent` containers.
- `requires` — the capability set required by a tool invocation. Declared on `tool` definitions.
- `deny` — capabilities forbidden at a tool's execution site. Declared on `tool` definitions.

`permits`, `requires`, `deny`, `memory` MUST be YAML arrays:

```
agent researcher["Researcher"]
  ...
end
researcher@{ agentflow: { permits: ["net.read", "llm.query"] } }
```

Comma-separated string form is accepted with a deprecation warning before v1.0 and removed in v1.0.

### 12.2 Invocation Sites

Capability evaluation applies to **invocation sites only**, never to tool definitions (§8). The invocation sites supported in v0.x / 1.0 are:

- an edge from any node structurally inside a `task`, `flow`, or `skill` container — including input nodes (`lean-right`), data-artifact nodes (`doc`, etc.), and other regular nodes within those containers — into a tool definition's ID; or
- a `win-pane` instance whose `-.->` binding resolves to a tool definition and which is placed inside an executing container.

A bare top-level tool definition with no incoming edges from inside an executing container is a definition only and is not subject to capability evaluation. Additional invocation-site forms may be introduced in a later version.

### 12.3 Executing-Agent Resolution

The **executing agent** for an invocation is the **nearest enclosing `agent`** in the structural tree of the invocation site. If no enclosing agent exists, the invocation is invalid.

Delegation (`-->>`) transfers _work_ ownership, not _capability_ ownership — a delegated-to agent must independently satisfy the invocation's `requires` under its own `permits`.

### 12.4 Validity

An invocation is valid iff:

- every member of `requires` is present in the executing agent's `permits`, and
- no member of `requires` is present in `deny`.

---

## 13. Metadata Applicability

Metadata keys are restricted to the element kinds listed. Keys outside this table are preserved for downstream tooling but produce a warning.

| Element                           | Valid metadata keys                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `agent`                           | `model` (optional), `prompt`, `permits`, `memory`                                                                        |
| `flow`                            | `params`, `returns`                                                                                                      |
| `task`                            | `execution`, `params`, `returns`                                                                                         |
| `skill`                           | `strategy`, `params`, `returns`                                                                                          |
| `tool`                            | `params`, `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `transport`, `command`, `connectorRef` |
| connector-designated node (§9)    | `protocol`, `endpoint`, `transport`, `command`, `auth`, `token_required`                                                 |
| `directive`                       | `rule`, `severity`, `context`, `params`                                                                                  |
| `testCase`                        | `assert`, `expects`                                                                                                      |
| input nodes (`lean-right`)        | `type`, `value`                                                                                                          |
| artifact nodes (`doc`, `lin-doc`) | `output`                                                                                                                 |
| reference nodes (`procs`)         | `src`                                                                                                                    |

> **Notes.**
>
> - `agent.model` is optional; when omitted, the runtime supplies a default. The spec does not fix a default value.
> - All keys on `tool` are optional. No metadata key is structurally required on a tool definition — only the node id and a resolved `subroutine` shape (§8).
> - Directives are bound to their targets via association edges (`---`, §19.5). There is no `directives` metadata key.
> - `text` is **not** a valid key on `directive` containers or trapezoid nodes. Use `rule`.
> - There is no shape-level `fallbacks` field on any element.
> - `tools` is **not** a metadata key on `skill`. Tools available to a skill are its child nodes (any descendant whose resolved shape is `subroutine`); tooling extracts the set from the AST.
> - On a connector-designated node, the connector's identity is the node's own id; there is no separate metadata level wrapping connector keys.
> - `def`, `typeRef`, `templateRef`, and `example` are not part of the spec. Instance binding uses `-.->` (§11.2); types and templates are referenced through the typed fields that consume them (§6, §7.2).

### 13.1 Cross-Cutting

`description` is valid on **any authored element** and is therefore omitted from the per-row restrictions above. A human-readable description never creates semantic ambiguity.

### 13.2 Validation Rules

- Known key on allowed element → valid.
- `description` on any authored element → valid.
- Unknown key → preserved, warning emitted (Tier 1; see §13.3).
- Known key on wrong element → diagnostic emitted (tier TBD per §13.3 still-open boundary).

### 13.3 Diagnostic Tiers

Validation messages organise into three tiers. The framework is descriptive; concrete diagnostic identifiers and the exact severity assignment per rule are out of scope for this authoring spec and belong to the implementation / conformance spec.

| Tier | Severity    | Behaviour                                                                                                                   | Representative cases                                                                                                                                                                                 |
| ---- | ----------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Info / Warn | Reported; parse and downstream compilation proceed. Field value preserved.                                                  | Unknown metadata key on a known element; known key on the wrong element; unused declaration; redundant binding.                                                                                      |
| 2    | Error       | Reported; the offending element is rejected from the validated semantic interpretation, but the rest of the diagram parses. | Type-shape mismatch (e.g. `permits` not an array); duplicate id within a namespace (§10); missing or cyclic instance binding (§11.3); instance-binding kind mismatch; unresolved required reference. |
| 3    | Fatal       | Reported; parse cannot complete. No semantic model is produced for the diagram.                                             | Malformed `@{...}` metadata block; unmatched container `end`; missing or malformed `agentflow` declaration; unrecognised top-level statement at the diagram root.                                    |

> **Open.** Several rules currently described as "warning before v1.0; validation error in v1.0" need explicit Tier-1-vs-Tier-2 placement. These settle with the implementation pass and may need a normative reassignment when v1.0 lands.

---

## 14. Presentation vs Semantic Fields

The following controls are **presentation-only** and MUST NOT influence semantic interpretation or validation outcomes:

- `view` (collapsed / expanded rendering state; see §15)
- `classDef`, `class`, `style`, `linkStyle` (see §16)
- `icon`, `img`, `w`, `h`
- The Mermaid presentation keys at the top level of `@{...}` per §4.4.1

If a future version introduces a flag that makes collapse affect semantic visibility, that flag will be specified separately.

All other authored fields — the contents of the `agentflow: { ... }` sub-block on every element, container kinds, edge operators, and identifiers — are **semantic**. They define the meaning of the diagram and are the surface against which validators, downstream tooling, and conformance tests reason.

> **Out of scope.** Concrete export-API names, wire formats, and runtime accessors used by implementations (parser libraries, editors, bridges, compilers) are not part of this specification. Implementations are free to expose semantic content through whatever API surface is appropriate to their consumers, provided the presentation / semantic distinction above is respected.

---

## 15. View Control (Expanded / Collapsed)

> Presentation-only; see §14.

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

## 16. Styling

> Presentation-only; see §14. Styling does not alter the semantic interpretation of the diagram.

### 16.1 Class Definition and Application

```
classDef important fill:#f9f,stroke:#333,stroke-width:2px
node1:::important # inline class application
class node1,node2 important # multi-node class application
```

### 16.2 Direct Node Styling

```
style node1 fill:#f9f,stroke-width:2px
```

### 16.3 Link Styling

```
linkStyle 0,1 stroke:red,stroke-width:3px
linkStyle default interpolate linear
```

---

## 17. Interactivity

```
click nodeId callback "tooltip"
click nodeId href "url" _blank
```

Click and `href` targets are hygiene references (§10.1) — validated for shape and allowed usage, not for external existence by default.

---

## 18. Accessibility

```
accTitle: Diagram Title
accDescr: Short description
accDescr {
  Multi-line description
  of the diagram
}
```

---

## 19. Semantic Patterns

These are common compositional patterns that emerge from the syntax. Each pattern is constructed only from the canonical operators and shapes defined above so the examples double as conformance cases.

### 19.1 Tool Call Pattern

A tool definition (§8) — a node with `shape: subroutine` — invoked from a task:

```
do_work["do_work"]
do_work@{ shape: subroutine, agentflow: { returns: "OutputType", requires: ["llm.query"] } }

task step["Do Work"]
  input["input"]
  output["Output"]
  input ==> do_work ==> output
end

input@{ shape: lean-right }
output@{ shape: doc }
```

The type `OutputType` is named directly in the tool's `returns` field; no separate reference node is needed.

### 19.2 Reference Document Pattern

Non-directional association (`---`) to a specification or guide:

```
gen_html["generate_html"]
style_guide["Brand Guide"]
gen_html --- style_guide

style_guide@{ shape: lin-doc }
```

### 19.3 Capability Taxonomy Pattern

A hierarchy of capability or permission categories rooted at a top-level grouping. Hexagon categories are classification sources (per §4.2); terminal leaves are the granular permissions. Hierarchy is **classification**, not control or data flow or delegation, so the relationship uses `---` (association, §5.1):

```
all --- data
all --- llm
data --- data_read
data --- data_write

all@{ shape: hex }
data@{ shape: hex }
data_read@{ shape: terminal }
data_write@{ shape: terminal }
```

The `---` operator carries no direction at the rendering layer and no work-handoff semantic. That matches what a taxonomy actually expresses: "x belongs under y" — a structural classification, not a runtime relationship.

### 19.4 Decision / Alternate Flow Pattern

`diamond` as the branching vertex (§4.2):

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

### 19.5 Directive Pattern

A trapezoid node bound to a tool by an **association edge** (`---`):

```
search_tool["Search"]
search_tool@{ shape: subroutine }
no_pii["No PII in output"]
search_tool --- no_pii

no_pii@{
  shape: trapezoid,
  agentflow: {
    severity: "critical",
    rule: "Strip all PII before returning results"
  }
}
```

Or using the `directive` container for grouped constraints:

```
tool1["Tool 1"]
tool1@{ shape: subroutine }

directive safety["Safety Constraints"]
  no_pii["No PII"]
  rate_limit["Rate Limit"]
end
tool1 --- safety
```

**Endpoint-kind disambiguation.** An association edge whose endpoint is a `directive` container or a `trapezoid` / `inv-trapezoid` node is interpreted as a directive binding in the semantic model — the rule, severity, and context attached to the directive apply to the source endpoint. Other association edges (taxonomy classification, reference-document attachment) remain free-form. No dedicated governance edge operator is needed.

**Composition.** Multiple directive bindings to the same source are allowed. Each binding contributes an **independent constraint record**; no implicit precedence, merge order, or override semantics are defined by the syntax. Tooling MAY aggregate, sort, or summarise the directives downstream, but the semantic interpretation of the diagram MUST preserve every attached directive distinctly. The same rule applies to `severity` and `context`: they are properties of the directive node, not of the binding, and remain attached to their own directive when multiple directives share a source.

**Binding to a directive instance.** When the target is a `curv-trap` instance bound to a `directive` definition (§11.2), the directive applied to the source is the underlying definition. The instance node merely projects the definition at this location; the constraint record carries the definition's `rule`, `severity`, and `context`.

**Duplicates.** Two directive bindings from the same source to the same target produce a single constraint record in the semantic interpretation; duplicate-bindings raise a Tier-1 informational diagnostic (§13.3) for redundancy detection but are not an error.

> **`-.->` is not directive binding.** The `-.->` operator is reserved for instance binding (§11.2). It does not carry directive-binding semantics in any form; sources that attempted to use it for that purpose in earlier drafts must migrate to `---`.

### 19.6 Lesson Pattern

A curled-corner document (`doc`) carrying a descriptive note. Lesson metadata uses cross-cutting `description` (§13.1):

```
lesson1["Backup Verification"]
lesson1@{
  shape: doc,
  agentflow: { description: "Always verify backups before migration — prior production outage originated from this gap." }
}
```

### 19.7 Fallback Pattern

Failure edges (`--x`) between agents for escalation:

```
agent primary["Primary Agent"]
  A
end
agent fallback["Fallback Agent"]
  B
end
primary --x fallback
```

### 19.8 Connector Pattern (MCP, HTTP, DB)

A connector-designated node represents an external system; one or more tools bind to it via the `connectorRef` metadata key (§9.1). The connector node's own id IS the connector identity — no self-tag needed. Connector-designated nodes live inside a **required top-level `subgraph connectors[...]` block** (§9.2); nodes declared elsewhere are not connectors, even if they carry `protocol` / `endpoint` / `transport` / `command` / `auth` / `token_required` metadata:

```
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

create_issue["Create Issue"]
create_issue@{
  shape: subroutine,
  agentflow: { connectorRef: "github_mcp", returns: "Issue", requires: ["net.write"] }
}

close_issue["Close Issue"]
close_issue@{
  shape: subroutine,
  agentflow: { connectorRef: "github_mcp", requires: ["net.write"] }
}
```

For HTTP and database back-ends the `protocol` and `endpoint` fields carry the integration details. The connectors still live inside the required top-level `subgraph connectors[...]` block:

```
subgraph connectors["Connectors"]
  orders_api["Orders API"]
  orders_db["Orders DB"]
end
orders_api@{ agentflow: { protocol: "http", endpoint: "https://api.example.com/orders" } }
orders_db@{ agentflow: { protocol: "sql", endpoint: "postgres://.../orders" } }
```

A minimal `connectorRef` binding from a tool still requires the target connector to be declared in the `connectors` subgraph:

```
subgraph connectors["Connectors"]
  mermaid["Mermaid Chart"]
end
mermaid@{ agentflow: { protocol: "http", endpoint: "https://mermaid.live" } }

save_diagram["save_diagram"]
save_diagram@{
  shape: subroutine,
  agentflow: {
    connectorRef: "mermaid.create_document",
    description: "Save diagram to Mermaid Chart platform"
  }
}
```

### 19.9 Parallel Execution Pattern

Fan-out with `&` operator **in edges only**:

```
orchestrator["Orchestrate"]
search["Search"]
analyze["Analyze"]
validate["Validate"]
orchestrator --> search & analyze & validate
```

### 19.10 Agent Delegation Pattern

Delegation edge (`-->>`) between agents within a flow:

```
flow pipeline["Pipeline"]
  agent a1["First"]
    task t1["Step 1"] ... end
  end
  agent a2["Second"]
    task t2["Step 2"] ... end
  end
  a1 -->> a2
end
```

Delegation transfers work ownership; each agent must independently satisfy its own capability requirements (§12).

### 19.11 Definition / Instance Pattern

Define once with full metadata, then place lightweight instances bound to the definition via the instance-binding edge `-.->` (§11.2):

```
agent researcher["Researcher"]
  task research["Research Task"]
    search["search"]
    search@{ shape: subroutine, agentflow: { returns: "String", requires: ["net.read"] } }
  end
end
researcher@{ agentflow: { model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] } }

flow pipeline["Pipeline"]
  r1["Researcher"]
  r2["Researcher"]
  r1 --> r2
end
r1@{ shape: tag-rect }
r2@{ shape: tag-rect }
r1 -.-> researcher
r2 -.-> researcher
```

Both `r1` and `r2` inherit all domain metadata from the `researcher` definition per §11.4. The instance–definition map is:

| Definition                                           | Instance shape           | Instance aliases |
| ---------------------------------------------------- | ------------------------ | ---------------- |
| `agent ... end`                                      | `tagged-rectangle`       | `tag-rect`       |
| `flow ... end`                                       | `half-rounded-rectangle` | `delay`          |
| `skill ... end`                                      | `lined-rectangle`        | `lin-rect`       |
| Tool definition (§8 — node with `shape: subroutine`) | `window-pane`            | `win-pane`       |
| `directive ... end`                                  | `curved-trapezoid`       | `curv-trap`      |

### 19.12 Input-Value Pattern

Carry a concrete input value into a parameterised tool. The input node uses `value` for the literal data; the edge label resolves the parameter binding (§5.5, §8.4.1). `value` may be any YAML scalar, list, or mapping:

```
file_path["file_path"]
file_path@{
  shape: lean-right,
  agentflow: {
    description: "Path to the file in the GitHub repository to visualize",
    type: String,
    value: "src/HelloWorld.java"
  }
}

read_file["read_file"]
read_file@{
  shape: subroutine,
  agentflow: {
    params: { path: String },
    returns: "String",
    requires: ["fs.read"]
  }
}

file_path ==>|path| read_file
```

`value` is the data; the edge label `path` is the binding. The two are orthogonal — `value` records what flows; the edge label resolves where it flows to. `value` is semantic (§14): downstream tooling that simulates or validates the flow reads it directly.

---

## 20. Complete Example

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

  subgraph connectors["Connectors"]
    llm_api["LLM API"]
  end
  llm_api@{ agentflow: { protocol: "http", endpoint: "https://api.example.com/chat" } }

  research_loc["research_location"]
  research_loc@{ shape: subroutine }
  write_copy["write_copy"]
  write_copy@{ shape: subroutine }
  translate_sv["translate_to_swedish"]
  translate_sv@{ shape: subroutine }
  gen_html["generate_html"]
  gen_html@{ shape: subroutine }

  agent coffee_team["Coffee Team"]
    flow build_site["Build Site"]
      agent researcher["Researcher"]
        task step1["Research Location"]
          city["city"]
          brief["Research Brief"]
          city ==> research_loc ==> brief
        end
        task step2["Write Copy"]
          english_copy["English Copy"]
          brief ==> write_copy ==> english_copy
        end
        step1 --> step2
      end

      agent translator["Translator"]
        task step3["Translate to Swedish"]
          bilingual["Bilingual Page"]
          english_copy ==> translate_sv ==> bilingual
        end
      end

      agent designer["Designer"]
        task step4["Generate Website"]
          html_out["HTML Website"]
          bilingual ==> gen_html ==> html_out
        end
        nordic["nordic_design"]
        glass["glassmorphism"]
        gen_html --- nordic
        gen_html --- glass
      end
    end
  end

  city@{ shape: lean-right }
  brief@{ shape: doc }
  english_copy@{ shape: doc }
  bilingual@{ shape: doc }
  html_out@{ shape: doc }
  nordic@{ shape: lin-doc }
  glass@{ shape: lin-doc }

  # `procs` in v0.7.0 means external-file reference. The CoffeeCopy / BilingualPage types are referenced
  # directly through `returns` on each tool — no separate reference node is needed (§10.2).
  permit_ref["Permission Tree"]
  permit_ref@{ shape: procs, agentflow: { src: "./permit-tree.mmd" } }

  research_loc@{
    agentflow: {
      params: { city: String },
      returns: "String",
      requires: ["net.read"],
      cache: "24h"
    }
  }
  write_copy@{
    agentflow: {
      connectorRef: "llm_api",
      params: { brief: String },
      returns: "CoffeeCopy",
      requires: ["llm.query"],
      retry: 2
    }
  }
  translate_sv@{
    agentflow: {
      connectorRef: "llm_api",
      params: { english: CoffeeCopy },
      returns: "BilingualPage",
      requires: ["llm.query"]
    }
  }
  gen_html@{
    agentflow: {
      connectorRef: "llm_api",
      params: { page: BilingualPage },
      returns: "String",
      requires: ["llm.query"]
    }
  }

  researcher@{ agentflow: { model: "claude-sonnet-4-20250514", permits: ["net.read", "llm.query"] } }
  translator@{ agentflow: { model: "claude-sonnet-4-20250514", permits: ["llm.query"] } }
  designer@{ agentflow: { model: "claude-sonnet-4-20250514", permits: ["llm.query"] } }

  build_site@{ agentflow: { params: { city: String }, returns: "String" } }
```

Notable forms in this example:

- Every Agentflow domain key sits inside the `agentflow: { ... }` sub-block on its node; `shape` and other Mermaid presentation keys stay at the top level (§3.2, §4.4).
- Tools are declared at the top level as named nodes with `shape: subroutine` (§8). No `tool` keyword is introduced.
- The shared LLM back-end is declared as a node inside a top-level `subgraph connectors` block (§9.2); the three LLM-using tools bind to it via `connectorRef: "llm_api"` inside their `agentflow:` blocks. The connector node's own id IS the connector identity.
- Each tool declares its `params` as a YAML mapping (§8.4). All four tools have a single parameter, so the incoming data edges (e.g. `brief ==> write_copy`) bind to that parameter implicitly per §8.4.1. A multi-parameter tool would require the edge label to name the target parameter (`input_query ==>|query| search_web`).
- The `procs` shape names the external-file reference `permit_ref`. The type references `CoffeeCopy` and `BilingualPage` are named directly in the `returns` field of each tool — no separate reference node is required (§10.2).
- Edge semantics: `==>` is data flow (§5.1); `-->` is control sequencing; `---` is general association (reference attachments, directive bindings, taxonomy); `-.->` is reserved for instance binding (§11.2).
- `permits`, `requires`, and `memory` are YAML arrays (§12.1).

---

## Appendix A: Conformance Tests

A conformance fixture set ships alongside this specification. Implementations SHOULD use it to verify their interpretation of the rules above.

The fixture directory `agentflow-conformance/` contains:

- **Valid minimal examples** — one fixture per semantic pattern (container types, edge operators, instance shapes, tool definitions, connector bindings, type/template use via typed fields (`params` / `returns` / `output`), capability evaluation).
- **Negative examples** — duplicate names, instance-binding kind mismatches, cyclic instance-binding chains, missing instance bindings, invalid metadata placement (e.g. an Agentflow domain key at the top level of `@{...}`), invalid capability sets, invalid containment, malformed container-boundary cases, unresolved `connectorRef` bindings, `connectorRef` resolving to a node outside the top-level `connectors` subgraph.
- **Edge-semantics fixtures** asserting the canonical mapping on every operator.

Each fixture declares its expected outcome: `valid`, `warning`, or `error`, plus the specific message identifier where applicable.

Fixture files are named `<pattern>-<case>.agentflow` with a companion `<pattern>-<case>.expected.json`.

The full fixture suite and how to run it are part of issue [#13](https://github.com/Mermaid-Chart/agentflow/issues/13).

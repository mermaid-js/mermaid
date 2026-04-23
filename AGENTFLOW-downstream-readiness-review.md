# Agentflow Downstream Readiness Review

## Semantic Consistency, Unambiguity, and Required Language Changes

**Source reviewed:** `AGENTFLOW-SYNTAX.md`  
**Reviewed version:** 0.4.0  
**Reviewed status:** Draft  
**Purpose of this review:** Assess whether Agentflow can be implemented consistently by downstream teams without guesswork, and specify the language changes required to make that possible.

---

## Executive summary

Agentflow 0.4.0 is already expressive and visually coherent enough to model many multi-agent scenarios. It is **not yet sufficiently unambiguous for independent downstream implementation**.

The core issue is not lack of capability. The core issue is that several important meanings are still inferred from examples, conventions, or surrounding shapes rather than determined by explicit language rules.

That matters because the spec explicitly positions itself as a **contract** for downstream tooling. Under that bar, a downstream-safe language must let independent teams build parsers, validators, renderers, editors, and execution-aware tooling that all interpret the same diagram in the same way.

Today, Agentflow still leaves multiple interpretation choices open in several high-impact areas:

- edge semantics
- branching semantics
- identifier scope
- container boundary semantics
- definition / instance inheritance
- tool-definition semantics
- capability validation
- type / template / external reference resolution
- metadata applicability
- containment rules

The conclusion of this review is:

> **Agentflow should not yet be treated as downstream-safe for unambiguous modeling.**  
> It is close enough that this can be fixed with a focused semantic-tightening release, but those fixes need to happen in the language itself, not just in examples or guidance text.

---

## Review standard

This review uses a stricter standard than “can people understand the diagram.”

A downstream-safe language must support all of the following:

1. **Deterministic parsing**  
   The same source diagram produces the same structural model across implementations.

2. **Deterministic semantic interpretation**  
   The same graph means the same thing across validators, renderers, and execution-aware tooling.

3. **Deterministic validation**  
   Invalid models fail for the same reasons everywhere.

4. **Stable extensibility**  
   Unknown metadata can be preserved without weakening the meaning of known constructs.

5. **Conformance-grade examples**  
   Examples reinforce the rules rather than quietly overriding them.

---

## Overall verdict

### Current status: **Not downstream-safe yet**

The current draft is already a strong visual DSL. It is not yet a fully closed contract language.

A single aligned team can use the current draft productively. Multiple independent downstream teams would still have to guess in several places, and those guesses are likely to diverge.

---

## Readiness checklist

Each area below is assessed against the standard of downstream-safe, unambiguous modeling.

### 1. Identifier scope and name resolution — **FAIL**

A downstream-safe language must define:

- whether ids are global or lexically scoped
- whether forward references are allowed
- whether duplicate ids are invalid
- how `def`, `type`, `src`, `click`, `class`, and `style` resolve references
- whether synthetic ids are reserved

#### Current state

The complete example implies diagram-wide resolution because nodes are referenced across nested container boundaries. However, the spec does not state that rule normatively.

#### Why this is a blocker

A parser or validator cannot safely resolve references unless scope and uniqueness are explicit.

#### Required change

Add a normative identifier-resolution section with:

- diagram-wide uniqueness for node and container ids
- separate namespaces for types and templates, or a fully specified shared namespace
- forward references allowed
- duplicate ids invalid
- synthetic ids reserved

---

### 2. Edge semantics — **FAIL**

A downstream-safe language must assign one primary semantic to each edge operator.

#### Current state

`-->` currently means both:

- data flow
- sequence / control precedence

The spec also uses dotted edges semantically in patterns while documenting them as stroke variants elsewhere.

#### Why this is a blocker

A validator or execution-aware tool cannot know whether an edge means “value/artifact moved” or “step B happens after step A” unless it guesses from endpoint shapes.

#### Required change

Split the edge algebra so each operator has one primary meaning.

**Recommended canonical mapping:**

- `-->` = precedence / control sequence
- `==>` = data flow / artifact transfer
- `--o` = contract conformance / output binding
- `-->>` = delegation / spawn / authority hand-off
- `--x` = error / cancellation / failure path
- `---` = association / non-driving relation
- `-.->` = governance / advisory / constraint application
- `o--o` = bidirectional data binding / sync

This is the single most important change for downstream unambiguity.

---

### 3. Branching semantics — **FAIL**

A downstream-safe language needs one canonical branching vertex.

#### Current state

Both `hexagon` and `diamond` are described in decision-like terms, but examples use them differently.

#### Why this is a blocker

The same alternate-flow scenario can be encoded in two semantically different-looking ways.

#### Required change

Make the rule explicit:

- `diamond` is the only branching vertex for alternate-flow routing, approval routing, and mutually exclusive outcomes.
- `hexagon` is a condition source, category, or evaluable classification node, but not the branching vertex itself.

This preserves both shapes while removing ambiguity.

---

### 4. Definition / instance semantics — **FAIL**

A downstream-safe instance system must define:

- valid `def` targets
- kind matching rules
- inheritance scope
- override precedence
- cyclic-definition handling
- whether style and interactivity inherit
- whether structure inherits or only metadata

#### Current state

The spec says instances inherit “all metadata” from the definition via `def`, but does not define the details above.

#### Why this is a blocker

Two downstreams can implement inheritance differently and both believe they are compliant.

#### Required change

Add a normative instance semantics section with all of the following:

- missing `def` is invalid
- kind mismatch is invalid
- cyclic `def` chains are invalid
- instances inherit **domain metadata only**
- core rendering fields do not inherit unless explicitly stated
- local instance metadata overrides inherited metadata on collision
- structure does not auto-expand into the instance site
- style, class membership, click behavior, and link styling do not inherit automatically

Also add a valid target matrix:

- `tag-rect` -> `agent`
- `delay` -> `flow`
- `lin-rect` -> `skill`
- `win-pane` -> `tool`
- `curv-trap` -> `directive`

---

### 5. Tool-definition model — **FAIL**

A downstream-safe language must define what a **tool definition** is.

#### Current state

The instance system refers to “Tool definition,” but the language has no `tool` declaration keyword. Tools are only represented as nodes with `shape: subroutine`.

#### Why this is a blocker

The semantic model contains an entity that the grammar does not define directly.

#### Required change

Introduce a first-class `tool` declaration.

**Recommended syntax:**

```agentflow
tool search_web["Search Web"]
search_web@{
  returns: "SearchResults",
  requires: ["net.read"],
  retry: 2,
  cache: "24h"
}
```

Backward compatibility can preserve `subroutine` as a rendering alias or legacy synonym.

This is cleaner than continuing to treat “tool” as an inferred subtype of generic node.

---

### 6. Container boundary semantics — **FAIL**

A downstream-safe language must define what it means for edges to connect to containers.

#### Current state

The spec uses containers as graph endpoints and lets containers have params/returns, but it does not define what an incoming or outgoing edge to a container means.

#### Why this is a blocker

A downstream cannot know whether a container edge targets:

- an entry point
- a completion boundary
- the container's params
- the container's returns
- the container as a mere visual group

#### Required change

Add explicit boundary semantics:

- an incoming precedence edge to a container targets the container entry boundary
- an outgoing precedence edge from a container originates at the completion boundary
- an incoming data edge to a container binds to declared `params`
- an outgoing data edge from a container binds to declared `returns`
- if no `params` or `returns` are declared, container-level data edges are invalid

This makes container edges machine-checkable.

---

### 7. Containment rules — **FAIL**

A downstream-safe language must define what may be nested inside what.

#### Current state

The draft says containers can be nested to any depth.

#### Why this is a blocker

That is too permissive for a contract language. It leaves ownership, execution scope, and structural validity underspecified.

#### Required change

Add a containment matrix.

**Recommended model:**

- `agent` may contain: `flow`, `task`, `skill`, `directive`, `testCase`, `tool`, node
- `flow` may contain: `task`, `agent`, `skill`, `directive`, `testCase`, `tool`, node
- `task` may contain: `tool`, node, `directive`
- `skill` may contain: `tool`, `flow`, `directive`, node
- `directive` may contain: node
- `testCase` may contain: node, `directive`
- `tool` may contain: no child elements

If `tool` is not introduced, the same rule needs to be expressed in terms of named executable nodes with resolved shape `subroutine`, but that is less clear.

---

### 8. Capability / permission validation — **FAIL**

A downstream-safe language must define how permissions are evaluated.

#### Current state

The draft includes `permits`, `requires`, `deny`, delegation semantics, and a permission-tree pattern, but does not define the validation algorithm.

#### Why this is a blocker

Permission-aware tooling cannot reliably decide whether a diagram is valid.

#### Required change

Add a capability evaluation section:

- `permits` defines the effective capability set granted to an agent
- `requires` defines the capability set required by a tool
- `deny` defines capabilities forbidden for that tool execution
- a tool invocation is valid iff:
  - all required capabilities are present in the executing agent’s effective permit set
  - none of the required capabilities are denied
- delegation transfers work responsibility, not capabilities
- the delegated-to agent must satisfy its own requirements

Also replace comma-separated capability strings with YAML arrays.

**Required form:**

```agentflow
researcher@{ permits: ["net.read", "llm.query"] }
search_web@{ requires: ["net.read"], deny: ["llm.query"] }
```

This removes parsing ambiguity from list-like metadata.

---

### 9. Type / template / external reference model — **FAIL**

A downstream-safe language must separate contract reference kinds or define a strict resolution algorithm.

#### Current state

The draft uses `type` for references that may target types or templates, and `src` for external diagrams/files. It defines `typesGroup` explicitly but only implies a `templatesGroup`.

#### Why this is a blocker

A downstream implementation cannot reliably distinguish:

- type references
- template references
- external references

#### Required change

Require exactly one of the following on a reference node:

- `typeRef`
- `templateRef`
- `src`

**Recommended examples:**

```agentflow
coffee_copy_ref["CoffeeCopy"]
coffee_copy_ref@{ shape: procs, typeRef: "CoffeeCopy" }

triage_tpl_ref["triage_result"]
triage_tpl_ref@{ shape: procs, templateRef: "triage_result" }

permit_ref["Permission Tree"]
permit_ref@{ shape: procs, src: "./permit-tree.mmd" }
```

Also define both synthetic groups explicitly:

- `typesGroup`
- `templatesGroup`

---

### 10. Metadata applicability and validation — **FAIL**

A downstream-safe language must define where metadata keys are valid.

#### Current state

The draft lists conventional metadata fields and says `@{}` accepts any valid YAML key, but does not define which keys are valid on which element kinds or what validators should do when they are misplaced.

#### Why this is a blocker

Tooling will disagree on whether unexpected metadata is:

- valid
- ignored
- warned
- preserved
- rejected

#### Required change

Add a normative applicability table.

**Recommended mapping:**

- `agent`: `model`, `permits`, `memory`, `fallbacks`
- `flow`: `params`, `returns`
- `task`: `execution`, `params`, `returns`, `fallbacks`
- `skill`: `strategy`, `params`, `returns`, `fallbacks`
- `tool`: `returns`, `requires`, `deny`, `retry`, `cache`, `validate`, `handler`, `transport`, `command`
- `directive`: `rule`, `severity`, `context`, `params`
- `testCase`: `assert`, `expects`
- `doc` / artifact nodes: `description`, `output`
- reference nodes: `typeRef`, `templateRef`, `src`

And define validation behavior:

- allowed field on allowed kind -> valid
- unknown field -> preserved + warning
- forbidden field on wrong kind -> validation error

---

### 11. Presentation-only controls — **PARTIAL**

A downstream-safe language should say explicitly which features do **not** change semantics.

#### Current state

Some controls are clearly presentational, but `view` and collapsed rendering affect the visible object model enough that downstream implementations need a formal boundary.

#### Required change

Add a normative statement that the following are presentation-only and must not alter semantic interpretation:

- `view`
- `classDef`, `class`, `style`, `linkStyle`
- `icon`, `img`, `w`, `h`
- collapsed / expanded rendering state

If collapse is ever intended to affect semantic visibility or export behavior, that must be specified separately.

---

### 12. Normative examples and conformance set — **FAIL**

A downstream-safe spec needs examples that reinforce the rules and a conformance set that tests them.

#### Current state

Some current patterns are not fully aligned with the semantics they appear to illustrate.

#### Required change

Repair the patterns so they are semantically conformant:

- Delegation pattern must use `-->>`
- Directive pattern must explicitly rely on `-.->` as governance
- Decision pattern must use `diamond` as the branching vertex
- Parallel pattern must use `&` only in edge fan-out, not in node declaration
- Lesson pattern must either use `doc` or redefine `lin-doc`
- Template references must use `templateRef`, not overloaded `type`

Also add a conformance suite with:

- valid minimal examples
- invalid examples
- name-resolution failures
- wrong-kind `def`
- cyclic `def`
- invalid metadata placement
- invalid capability sets
- invalid container nesting
- ambiguous edge failures
- container-boundary edge cases

---

## Required language changes: compact proposal

This section restates the required changes as a concrete language-tightening proposal.

### A. Introduce first-class `tool`

Add:

```agentflow
tool <id>["Title"]
```

Use `tool` as the canonical executable primitive.

### B. Replace overloaded edge algebra

Adopt:

- `-->` precedence / control sequence
- `==>` data flow / artifact transfer
- `--o` contract conformance
- `-->>` delegation
- `--x` failure path
- `---` association
- `-.->` governance
- `o--o` bidirectional sync

### C. Canonicalize branching

Adopt:

- `diamond` = branching vertex
- `hexagon` = condition/category/evaluable classification

### D. Add identifier-resolution rules

Adopt diagram-wide uniqueness and explicit forward-reference support.

### E. Add containment matrix

Define what each container kind may contain.

### F. Add container-edge boundary rules

Define entry, completion, `params`, and `returns` binding.

### G. Add definition / instance semantics

Define inheritance, precedence, invalid cases, and valid target matrix.

### H. Replace list-like strings with arrays

Use YAML arrays for:

- `permits`
- `requires`
- `deny`
- `fallbacks`
- `directives`

### I. Separate reference kinds

Require one of:

- `typeRef`
- `templateRef`
- `src`

### J. Add metadata applicability table

Define allowed, warned, and invalid placements.

### K. Mark presentation-only features as non-semantic

Make `view`, styling, and collapsed state explicitly non-semantic.

### L. Add conformance tests

Ship valid and invalid examples as part of the spec.

---

## Minimal release gate

Agentflow should not be described as downstream-ready until all of the following are true:

1. every edge operator has one primary semantic
2. there is one canonical branching shape
3. identifier resolution is formalized
4. container edges have formal boundary semantics
5. `def` has a complete validity and inheritance model
6. tools are first-class or equivalently formalized
7. capability validation is machine-checkable
8. type, template, and source references are separated
9. metadata applicability is defined
10. examples are conformance-clean

Until then, Agentflow is suitable for aligned internal use, but not yet for reliable independent downstream implementation.

---

## Strategic recommendation

The right next move is **not** to add more surface syntax.

The right next move is to make the language core smaller and stricter:

- fewer overloaded operators
- fewer overlapping shapes
- stricter containment
- explicit boundary semantics
- first-class executable tools
- typed metadata for list-like values
- formal validation rules
- conformance-grade examples

That will make Agentflow a much stronger contract language for downstream teams building renderers, validators, editors, linters, and execution-aware tooling.

---

## Closing assessment

Agentflow 0.4.0 is close enough that this is fixable without reinventing the language. The main work now is semantic tightening.

If the changes above are made, Agentflow can move from “visually expressive and internally understandable” to “unambiguous enough for downstream implementation.”

That is the threshold that matters for a language intended to model agent systems as a contract, not just as a diagram.

---

## One-line conclusion

**Agentflow is promising, but it needs a stricter semantic core before it can reliably model scenarios unambiguously across downstream implementations.**

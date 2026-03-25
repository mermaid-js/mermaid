# PACT Features Not Currently Supported in Agentflow Spec

This document maps PACT language features that have no representation (or only partial representation) in the current agentflow syntax spec. Each section includes the PACT source syntax, what we currently emit (if anything), and a proposed agentflow extension.

---

## 1. Directives (Composable Prompt Blocks)

Directives are reusable, parameterized prompt fragments that tools reference to enforce behavioral constraints. They are the "system instructions" governing agent behavior — critical for safety, compliance, and consistency.

**PACT syntax:**

```pact
directive %clinical_reasoning {
    <<CLINICAL STANDARD: Apply evidence-based medicine principles.
    Use validated clinical decision rules ({decision_tool}) where applicable.
    Document reasoning transparently.>>
    params {
        decision_tool :: String = "Ottawa Ankle Rules, HEART Score, Wells Criteria"
    }
}

tool #assess_vitals {
    description: <<Analyze patient vital signs...>>
    requires: [^llm.query]
    directives: [%clinical_reasoning]
    params { vitals :: String }
    returns :: String
}
```

**Current agentflow output:** Omitted entirely (reference edges caused layout crashes).

**Proposed agentflow syntax:**

```
directive clinical_reasoning["Clinical Reasoning"]
  <<CLINICAL STANDARD: Apply evidence-based medicine principles...>>
end
clinical_reasoning@{
    shape: trapezoid,
    params: "decision_tool: String = Ottawa Ankle Rules"
}

assess_vitals -.-> clinical_reasoning
```

A `directive` container (or `trapezoid` shape) with `text` content and `params` metadata. Tools reference directives via dotted edges (`-.->`).

---

## 2. Lessons (Operational Knowledge)

Lessons are formalized rules learned from past incidents — they feed into agent prompts as guardrails. Each has a context (what happened), a rule (what to do), and a severity.

**PACT syntax:**

```pact
lesson "anchoring_bias" {
    context: <<System anchored on initial diagnosis, missed subtle PE presentation>>
    rule: <<Always generate at least 5 differentials including one life-threatening diagnosis>>
    severity: error
}

lesson "vital_sign_trends" {
    context: <<Single normal reading masked a patient trending toward sepsis>>
    rule: <<Always request vital sign trends for patients with infection concerns>>
    severity: warning
}
```

**Current agentflow output:** Omitted entirely.

**Proposed agentflow syntax:**

```
lesson anchoring_bias["Anchoring Bias"]
  <<Always generate at least 5 differentials including one life-threatening diagnosis>>
end
anchoring_bias@{
    shape: lin-doc,
    severity: "error",
    context: "System anchored on initial diagnosis, missed subtle PE"
}
```

A `lesson` node with `lin-doc` shape, `severity` metadata (error/warning), and `context` field. Agents could reference lessons via `---` association edges.

---

## 3. Skills (Tool Compositions)

Skills are named compositions of multiple tools with a strategy prompt — higher-level capabilities built from tool primitives.

**PACT syntax:**

```pact
skill $rapid_assessment {
    description: <<Rapid clinical assessment: vitals through differential in an accelerated workflow.>>
    tools: [#assess_vitals, #generate_differential]
    strategy: <<Assess vitals first — if ESI 1 or 2, immediately generate differential with urgency flag>>
    params { patient_data :: String }
    returns :: String
}
```

**Current agentflow output:** Bare node with `stadium` shape inside the agent container. Strategy and tool composition are lost.

**Proposed agentflow syntax:**

```
skill rapid_assessment["Rapid Assessment"]
    assess_vitals
    generate_differential
end
rapid_assessment@{
    shape: stadium,
    strategy: "Assess vitals first — if ESI 1 or 2, immediately generate differential",
    tools: "assess_vitals, generate_differential"
}
```

A `skill` container (or `stadium`-shaped node) with `strategy` and `tools` metadata fields.

---

## 4. Agent Bundles (Team Grouping with Fallbacks)

Agent bundles group agents into teams and define fallback chains — if one agent fails, which agent takes over.

**PACT syntax:**

```pact
agent_bundle @ed_team {
    agents: [@triage_nurse, @diagnostician, @attending, @records_agent]
    fallbacks: @diagnostician ?> @triage_nurse
}
```

**Current agentflow output:** Emitted as a nested `agent` container wrapping child agents. The `fallbacks` chain is lost.

**Proposed agentflow syntax:**

```
agent ed_team["ED Team"]
    agent triage_nurse["Triage Nurse"] ... end
    agent diagnostician["Diagnostician"] ... end
    diagnostician --x triage_nurse
end
ed_team@{
    fallbacks: "diagnostician ?> triage_nurse"
}
```

Use `--x` (error/fallback) edges between agents within the bundle, plus a `fallbacks` metadata field on the parent container.

---

## 5. Permission Trees (Hierarchical Capability Model)

Permission trees define the complete capability hierarchy that agents draw from. They are central to PACT's safety model — an agent cannot use a tool unless it holds the required permission.

**PACT syntax:**

```pact
permit_tree {
    ^llm {
        ^llm.query
        ^llm.embed
    }
    ^db {
        ^db.read
        ^db.write
    }
    ^net {
        ^net.read
    }
}
```

**Current agentflow output:** Omitted. Permissions appear as `permits` metadata on agent containers.

**Proposed agentflow syntax:**

The spec documents a "Permission Tree Pattern" using `-->>` edges:

```
permit_tree["Permissions"]
    all -->> llm
    all -->> db
    all -->> net
    llm -->> llm_query
    llm -->> llm_embed
    db -->> db_read
    db -->> db_write
    net -->> net_read
end

all@{ shape: hex }
llm@{ shape: hex }
db@{ shape: hex }
net@{ shape: hex }
llm_query@{ shape: terminal }
llm_embed@{ shape: terminal }
db_read@{ shape: terminal }
db_write@{ shape: terminal }
net_read@{ shape: terminal }
```

**Request:** Formalize `permit_tree` as a first-class container keyword (analogous to `typesGroup`) so it renders with a distinct visual identity and can be collapsed/expanded.

---

## 6. MCP Connections (External Service Bindings)

PACT's `connect` block declares named MCP server bindings — external tool servers that agents can invoke at runtime.

**PACT syntax:**

```pact
connect {
    brave_search   "stdio npx @anthropic/mcp-server-brave"
    postgres       "stdio npx @anthropic/mcp-server-postgres"
}
```

**Current agentflow output:** Omitted entirely.

**Proposed agentflow syntax:**

```
connect brave_search["Brave Search"]
end
brave_search@{
    transport: "stdio",
    command: "npx @anthropic/mcp-server-brave"
}

connect postgres["PostgreSQL"]
end
postgres@{
    transport: "stdio",
    command: "npx @anthropic/mcp-server-postgres"
}
```

A `connect` container or node with `transport` and `command` metadata. Agents that use MCP servers could reference them via `---` association edges.

---

## 7. Template Sections

PACT templates support `section` headers to visually group fields — important for structured output templates with distinct parts (e.g., Diagnosis / Management / Safety).

**PACT syntax:**

```pact
template %clinical_guideline {
    section DIAGNOSIS
    CRITERIA :: String * 3      <<Criterion | Met/Unmet | Evidence>>
    SCORING :: String            <<clinical decision rule score>>
    section MANAGEMENT
    INTERVENTION :: String * 4   <<Priority | Intervention | Timing>>
    MEDICATION :: String * 3     <<Drug | Dose | Route | Frequency>>
    section SAFETY
    RED_FLAG :: String * 3       <<Warning sign | Action | Urgency>>
    CONTRAINDICATION :: String * 2
}
```

**Current agentflow output:** Sections stripped (parser rejects them).

**Proposed:** Support `section NAME` inside template declarations as a visual separator/grouping for fields, rendered as a horizontal divider with a label.

---

## 8. Flow Control Constructs

PACT flows support several control constructs that have no direct agentflow equivalent:

### Parallel Execution

```pact
flow analyze(data :: String) -> String {
    parallel {
        @researcher -> #search(data),
        @analyst -> #classify(data)
    }
    return @synthesizer -> #combine(search_result, classification)
}
```

**Proposed:** A parallel task container or `&` fan-out from a split node:

```
task parallel_step["Parallel"]
    search_node["search"]
    classify_node["classify"]
end
split_node --> search_node & classify_node
search_node --> combine
classify_node --> combine
```

### Match (Conditional Routing)

```pact
flow route_by_acuity(complaint :: String, vitals :: String, age :: Int) -> String {
    acuity = @triage_nurse -> #assess_vitals(vitals, complaint, age)
    result = match acuity {
        "ESI-1" => @diagnostician -> #generate_differential(complaint, "critical")
        "ESI-2" => @diagnostician -> #generate_differential(complaint, "emergent")
        _ => @diagnostician -> #recommend_workup(complaint, "none")
    }
    return result
}
```

**Proposed:** Diamond decision nodes with labeled branches (partially supported by the spec):

```
acuity_check{Acuity Level?}
acuity_check -- ESI-1 --> critical_path
acuity_check -- ESI-2 --> emergent_path
acuity_check -- default --> routine_path
```

### Fallback Expressions

```pact
flow safe_search(query :: String) -> String {
    result = @primary -> #search(query) ?> @backup -> #cached_search(query)
    return result
}
```

**Proposed:** `--x` error edge to a fallback node:

```
primary_search --x backup_search
```

### On Error Handling

```pact
flow save_data(data :: String) -> String {
    saved = @db_agent -> #write(data) on_error <<Write deferred — will retry>>
    return saved
}
```

**Proposed:** `--x` error edge with a label to an error-handling node:

```
write_node --x error_handler
error_handler@{ shape: doc, label: "Write deferred — will retry" }
```

### Pipeline Operator

```pact
flow process(input :: String) -> String {
    result = @agent -> #step1(input) |> @agent -> #step2(result)
    return result
}
```

**Proposed:** `==>` thick edges (already in the spec) to denote pipeline chaining:

```
step1 ==> step2
```

---

## 9. Tests

PACT has inline test declarations for verifying agent behavior. These are part of the source file and run via `pact test`.

**PACT syntax:**

```pact
test "vitals assessment assigns ESI level" {
    acuity = @triage_nurse -> #assess_vitals("HR 110, BP 90/60", "chest pain", 55)
    assert acuity
}

test "treatment checks allergies" {
    plan = @attending -> #suggest_treatment("pneumonia", "Allergies: penicillin")
    assert plan
}
```

**Current agentflow output:** Omitted entirely.

**Proposed:** A `test` container with `double-circle` shape to represent test coverage:

```
test vitals_test["Vitals Assessment"]
    triage_nurse --> assess_vitals --> assertion
end
assertion@{ shape: double-circle }
```

---

## 10. Imports (Multi-File Projects)

PACT supports importing declarations from other files.

**PACT syntax:**

```pact
import "shared/schemas.pact"
import "shared/directives.pact"
```

**Current agentflow output:** Omitted.

**Proposed:** An `import` statement at diagram level, or `src` metadata on a `procs`-shaped node:

```
shared_schemas["shared/schemas.pact"]
shared_schemas@{ shape: procs, src: "./shared/schemas.pact" }
```

---

## 11. Tool-Specific Metadata Fields

PACT tools have several fields not currently mappable to agentflow node metadata:

| PACT Field | Purpose | Example | Agentflow Status |
|------------|---------|---------|-----------------|
| `validate: strict` | Output validation mode | `validate: strict` | Not in spec |
| `handler: "http POST ..."` | External HTTP endpoint | `handler: "http POST https://api.example.com"` | Could use `source` metadata |
| `directives: [%name]` | Prompt directive references | `directives: [%clinical_reasoning]` | Not in spec |
| `output: %template` | Template conformance | `output: %triage_note` | Supported via `output` metadata |

**Proposed:** Add `validate`, `handler`, and `directives` to the node metadata field table.

---

## 12. Agent `memory` Field

PACT agents can reference persistent memory stores — knowledge that persists across conversations.

**PACT syntax:**

```pact
agent @diagnostician {
    permits: [^llm.query, ^net.read]
    tools: [#generate_differential]
    model: "claude-sonnet-4-20250514"
    prompt: <<You are a board-certified emergency physician...>>
    memory: [~case_archive, ~guideline_updates]
}
```

**Current agentflow output:** `memory` field is not emitted.

**Proposed:** Add `memory` as an agent container metadata field:

```
diagnostician@{
    model: "claude-sonnet-4-20250514",
    permits: "llm.query, net.read",
    memory: "case_archive, guideline_updates"
}
```

---

## Summary Table

| PACT Feature | Agentflow Status | Priority |
|-------------|-----------------|----------|
| Directives | Not supported | High — safety-critical |
| Lessons | Not supported | Medium |
| Skills | Partial (shape only) | Medium |
| Agent Bundles / Fallbacks | Partial (no fallback chain) | Medium |
| Permission Trees | Pattern only, no first-class keyword | Medium |
| MCP Connections | Not supported | Low |
| Template Sections | Parser rejects them | High — currently breaking |
| Parallel Execution | Not supported | High |
| Match / Conditional | Partial (diamond nodes) | Medium |
| Fallback Expressions | Not supported | Medium |
| On Error | Not supported | Medium |
| Pipeline Operator | Partial (`==>` edges) | Low |
| Tests | Not supported | Low |
| Imports | Not supported | Low |
| Tool metadata (`validate`, `handler`, `directives`) | Partial | Medium |
| Agent `memory` field | Not supported | Low |

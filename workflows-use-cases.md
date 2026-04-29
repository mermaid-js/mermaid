# Mermaid Workflows: Use Cases

**Mermaid Chart — Series A Supporting Material**

---

Mermaid Workflows introduces **agentflow** — a diagram type purpose-built for specifying, visualizing, and executing AI agent systems. Unlike generic flowcharts, agentflow has first-class semantics for agents, tools, data contracts, permissions, and multi-agent orchestration. Below are five high-value use cases grounded in what the language can express today.

---

## The Agentflow Language

Agentflow extends Mermaid with a semantic model designed for AI agent specifications. Every visual element carries meaning:

**Containers** define organizational boundaries:

- **`agent`** — an autonomous entity bound to an LLM model with a permission set
- **`flow`** — a composable pipeline with typed input/output contracts
- **`task`** — a discrete unit of work grouping tool calls and data transforms

**Node shapes** encode what things _are_:

- **`subroutine`** (double-bordered) — a tool invocation: API call, LLM query, external service
- **`doc`** (wavy bottom) — a data artifact produced or consumed by a step
- **`lean-right`** (parallelogram) — an input parameter entering from outside
- **`lin-doc`** (lined document) — a reference directive or style guide that governs behavior
- **`procs`** (stacked rectangles) — a cross-reference to a type definition or external diagram

**Edge types** encode relationships:

- **`-->`** data flow — information passes from A to B
- **`---`** governs — a directive constrains or guides a tool
- **`--o`** output binding — a tool's output conforms to a template schema
- **`-->>`** hierarchy — permission scoping (parent delegates to child)

**Typed metadata** (`@{ key: value }`) attaches machine-readable properties to any element:

- Agents carry `model`, `permits`
- Flows carry `params`, `returns`
- Tools carry `returns`, `requires`, `retry`, `cache`, `description`

**Data contracts** via `type` and `template` declarations define the shape of information flowing through the system — record types, enums, and structured output templates with field-level descriptions.

This is not a flowchart with annotations. It's a specification language where the diagram topology, node shapes, edge types, and metadata together form a complete, parseable agent instruction set.

---

## 1. AI-Powered Software Development

**The problem:** Tools like Lovable, Cursor, and Bolt let anyone build software with AI — but they all suffer from the same failure mode: context loss. Users spend hours re-prompting, correcting drift, and fighting hallucinations. There is no structured way to tell an AI agent _exactly_ what to build, in what order, with what constraints.

**How agentflow solves it:** The developer specifies a multi-agent build pipeline as a diagram. Each agent has an explicit model binding and permission set. Tools are typed subroutines with defined inputs, outputs, and retry policies. Data contracts (type declarations) ensure agents produce structured, validated output — not free-form text. The diagram _is_ the specification; an executor consumes it directly.

**Example — a full-stack app generator with three specialized agents:**

```mermaid
agentflow TB
  type AppSpec = Record {
    schema: String
    endpoints: String
    auth_flow: String
    validation_rules: String
  }

  type TestReport = Record {
    passed: Int
    failed: Int
    coverage: Float
  }

  agent dev_team["Development Team"]
    flow build_app["Build Application"]
      agent architect["Architect"]
        task design["Design System"]
          requirements["requirements"]
          design_system["design_system"]
          app_spec["App Specification"]
          requirements --> design_system --> app_spec
        end
      end

      agent coder["Coder"]
        task implement["Implement"]
          generate_code["generate_code"]
          codebase["Codebase"]
          app_spec --> generate_code --> codebase
        end
        task test["Write Tests"]
          write_tests["write_tests"]
          test_report["Test Report"]
          codebase --> write_tests --> test_report
          write_tests --o test_report_ref
        end
        implement --> test
      end

      agent reviewer["Reviewer"]
        task review["Security Review"]
          scan_vulnerabilities["scan_vulnerabilities"]
          review_result["Review Result"]
          codebase --> scan_vulnerabilities --> review_result
        end
      end
    end
  end

  test_report_ref["TestReport"]

  requirements@{ shape: lean-right }
  app_spec@{ shape: doc }
  codebase@{ shape: doc }
  test_report@{ shape: doc }
  review_result@{ shape: doc }
  test_report_ref@{ shape: procs, type: "TestReport" }

  design_system@{ shape: subroutine, returns: "AppSpec", requires: "^llm.query", description: "Produce structured app specification from requirements" }
  generate_code@{ shape: subroutine, returns: "String", requires: "^llm.query, ^fs.write", retry: 2, description: "Generate full-stack application code" }
  write_tests@{ shape: subroutine, returns: "TestReport", requires: "^llm.query, ^exec.run", description: "Generate and execute integration tests" }
  scan_vulnerabilities@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "OWASP top-10 and dependency vulnerability scan" }

  architect@{ model: "claude-opus-4-6", permits: "^llm.query" }
  coder@{ model: "claude-sonnet-4-20250514", permits: "^llm.query, ^fs.write, ^exec.run" }
  reviewer@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  build_app@{ params: "requirements :: String", returns: "String" }
```

**What agentflow adds beyond a flowchart:** Every tool declares what permissions it needs (`requires: "^llm.query, ^fs.write"`). Every agent declares what it's allowed to do (`permits: "^llm.query"`). The type system (`AppSpec`, `TestReport`) ensures agents produce structured output, not free-form text. The `--o` edge from `write_tests` to `TestReport` means "this tool's output conforms to this schema." An executor can validate all of this before any code runs.

**Why it matters to investors:** This positions Mermaid Chart not as a diagramming tool competing with Lucidchart, but as the **specification layer** for AI-assisted development — a market projected to exceed $22B by 2028. Users who don't care about diagrams become paying customers because structured specifications eliminate re-prompting. New buyer persona, new TAM.

---

## 2. Enterprise Compliance & Security Validation

**The problem:** Regulated industries want to adopt AI agents but can't — because chat-based AI tools produce un-auditable, un-traceable outputs. There is no way to prove an AI agent followed the right process, had only the permissions it needed, or escalated correctly. "Trust me, the AI did it right" doesn't pass SOC 2.

**How agentflow solves it:** Permissions are first-class. Every agent declares its model and permission set. Every tool declares what permissions it requires. A **permission tree** — a separate diagram linked via reference — defines the hierarchy of capabilities. The topology itself is the audit artifact: which agents ran, what tools they called, what permissions they held, what data flowed where.

**Example — a permission tree governing an AI data processing pipeline:**

```mermaid
agentflow TB
  all["^all"]
  data["^data"]
  data_read["^data.read"]
  data_write["^data.write"]
  data_classify["^data.classify"]
  data_pii["^data.pii"]
  llm["^llm"]
  llm_query["^llm.query"]
  notify["^notify"]
  notify_email["^notify.email"]
  notify_escalate["^notify.escalate"]

  all -->> data
  all -->> llm
  all -->> notify
  data -->> data_read
  data -->> data_write
  data -->> data_classify
  data -->> data_pii
  llm -->> llm_query
  notify -->> notify_email
  notify -->> notify_escalate

  all@{ shape: hex }
  data@{ shape: hex }
  llm@{ shape: hex }
  notify@{ shape: hex }
  data_read@{ shape: terminal }
  data_write@{ shape: terminal }
  data_classify@{ shape: terminal }
  data_pii@{ shape: terminal }
  llm_query@{ shape: terminal }
  notify_email@{ shape: terminal }
  notify_escalate@{ shape: terminal }
```

**Example — an agent pipeline where each agent has only the permissions it needs:**

```mermaid
agentflow TB
  type DataRequest = Record {
    source: String
    classification: String
    contains_pii: Bool
    gdpr_status: String
  }

  agent compliance_pipeline["Compliance Pipeline"]
    flow process_request["Process Data Request"]
      agent classifier["Classifier"]
        task classify["Classify Sensitivity"]
          request["request"]
          classify_data["classify_data"]
          classification["Classification Report"]
          request --> classify_data --> classification
        end
      end

      agent processor["Processor"]
        task process["Apply Rules & Process"]
          apply_gdpr["apply_gdpr_rules"]
          result["Processed Result"]
          classification --> apply_gdpr --> result
        end
      end

      agent auditor["Auditor"]
        task audit["Archive Audit Trail"]
          archive_audit["archive_audit"]
          audit_trail["Audit Trail"]
          result --> archive_audit --> audit_trail
          classification --> archive_audit
        end
      end
    end
  end

  permit_ref["Permission Tree"]

  request@{ shape: lean-right }
  classification@{ shape: doc }
  result@{ shape: doc }
  audit_trail@{ shape: doc }
  permit_ref@{ shape: procs, src: "./compliance-permits.mmd" }

  classify_data@{ shape: subroutine, returns: "DataRequest", requires: "^data.read, ^data.classify", description: "Classify data sensitivity and detect PII" }
  apply_gdpr@{ shape: subroutine, returns: "String", requires: "^data.read, ^data.pii, ^llm.query", description: "Apply GDPR rules based on classification" }
  archive_audit@{ shape: subroutine, returns: "String", requires: "^data.write", description: "Create immutable audit trail entry" }

  classifier@{ model: "claude-haiku-4-5-20251001", permits: "^data.read, ^data.classify" }
  processor@{ model: "claude-sonnet-4-20250514", permits: "^data.read, ^data.pii, ^llm.query" }
  auditor@{ model: "claude-haiku-4-5-20251001", permits: "^data.write" }

  process_request@{ params: "request :: DataRequest", returns: "String" }
```

**What agentflow adds beyond a flowchart:** The classifier agent _cannot_ write data — it only has `^data.read` and `^data.classify`. The processor _can_ access PII but _cannot_ send notifications. The auditor _can_ write but _cannot_ read PII. These constraints are visible in the diagram, machine-parseable, and enforceable at runtime. The permission tree defines the full hierarchy; each agent's `permits` field is a subset. An auditor reading the diagram can verify least-privilege without reading code.

**Why it matters to investors:** Enterprise AI governance is an unsolved problem at scale. Agentflow offers "compliance by design" — the diagram topology _enforces_ the rules. This is how Mermaid Chart breaks into regulated enterprise segments with 6-figure ACVs.

---

## 3. Multi-Agent Orchestration

**The problem:** Organizations need to coordinate specialized agents — but today this coordination is custom scripts, fragile prompt chains, and tribal knowledge. There's no standard way to define which agent runs when, what data flows between them, what constraints govern their behavior, or how to present the system at different levels of detail.

**How agentflow solves it:** Agents nest inside flows. Flows nest inside agents. Data flows cross container boundaries. Directives (style guides, policies) attach to tools via governs edges. And the collapsed/expanded view mechanism lets stakeholders see the right level of detail — executives see the top-level agent team; engineers expand into tasks and tools.

**Example — a content pipeline with three agents, shared directives, and progressive disclosure:**

```mermaid
agentflow TB
  agent content_team["Content Team"]
    flow publish["Publish Article"]
      agent writer["Writer"]
        task draft["Draft Article"]
          topic["topic"]
          write_draft["write_draft"]
          article["Article Draft"]
          topic --> write_draft --> article
        end
        tone_guide["Brand Tone Guide"]
        write_draft --- tone_guide
      end

      agent editor["Editor"]
        task review["Review & Edit"]
          edit_article["edit_article"]
          edited["Edited Article"]
          article --> edit_article --> edited
        end
        style_manual["AP Style Manual"]
        edit_article --- style_manual
      end

      agent publisher["Publisher"]
        task deploy["Publish"]
          format_html["format_and_publish"]
          published["Published Page"]
          edited --> format_html --> published
        end
      end
    end
  end

  topic@{ shape: lean-right }
  article@{ shape: doc }
  edited@{ shape: doc }
  published@{ shape: doc }
  tone_guide@{ shape: lin-doc }
  style_manual@{ shape: lin-doc }

  write_draft@{ shape: subroutine, returns: "String", requires: "^llm.query", retry: 2, description: "Write article draft following brand tone" }
  edit_article@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Edit for clarity, accuracy, and AP style" }
  format_html@{ shape: subroutine, returns: "String", requires: "^llm.query, ^cms.publish", description: "Format as HTML and publish to CMS" }

  writer@{ model: "claude-opus-4-6", permits: "^llm.query" }
  editor@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  publisher@{ model: "claude-haiku-4-5-20251001", permits: "^llm.query, ^cms.publish" }

  publish@{ params: "topic :: String", returns: "String" }
```

**What agentflow adds beyond a flowchart:** The `lin-doc` nodes (Brand Tone Guide, AP Style Manual) aren't just labels — they're directive references connected via governs edges (`---`), telling the executor "this tool must follow this guide." Cross-agent data flow (`article --> edit_article` crosses from Writer to Editor) is explicit in the topology. The collapsed view (`content_team@{ view: "collapsed" }`) reduces the entire pipeline to a single labeled box for executive dashboards.

**Why it matters to investors:** The agentic AI market is exploding, but orchestration is the missing infrastructure layer. Agentflow is uniquely positioned because LLMs already understand Mermaid natively. The orchestration diagram is portable across agent frameworks (Claude, GPT, Gemini, open-source). This is the "operating system" layer for AI agents.

---

## 4. DevOps & Incident Response Automation

**The problem:** DevOps teams manage incident response with Markdown runbooks that go stale immediately. When an incident hits at 3 AM, the on-call engineer is reading a six-month-old document and guessing which steps still apply. There's no structured way to encode an incident response pipeline with typed data, structured outputs, and multiple specialist agents.

**How agentflow solves it:** The incident response system is a multi-agent pipeline where each agent owns a phase: detection, triage, investigation, mitigation, reporting. Tools are typed subroutines with declared capabilities. Templates define the exact output structure for triage results, investigation reports, and runbooks — ensuring machine-readable, consistent incident artifacts every time.

**Example — a five-agent incident response pipeline with typed templates:**

```mermaid
agentflow TB
  type Incident = Record {
    id: String
    severity: String
    title: String
    services: String
    region: String
  }

  template triage_result {
    INCIDENT_ID: String        <<generated incident ID>>
    SEVERITY: String           <<P0 through P4 with justification>>
    TITLE: String              <<concise incident title>>
    BLAST_RADIUS: String       <<affected services and users>>
    TIMELINE: String * 3       <<Timestamp | Event | Source>>
  }

  template runbook_format {
    OBJECTIVE: String          <<what this runbook achieves>>
    STEP: String * 8           <<Step # | Action | Command | Rollback>>
    VERIFICATION: String       <<how to confirm mitigation>>
  }

  agent incident_team["Incident Team"]
    flow detect_and_respond["Detect & Respond"]
      agent sentinel["Sentinel"]
        task detect["Detect Anomaly"]
          region["region"]
          poll_health["poll_health"]
          health_data["Health Data"]
          detect_anomaly["detect_anomaly"]
          alert["Alert"]
          region --> poll_health --> health_data --> detect_anomaly --> alert
        end
      end

      agent monitor["Monitor"]
        task triage["Triage"]
          triage_alert["triage_alert"]
          triage_result["Triage Result"]
          alert --> triage_alert --> triage_result
          triage_alert --o triage_tpl_ref
        end
      end

      agent investigator["Investigator"]
        task investigate["Investigate"]
          analyze["analyze_incident"]
          report["Investigation Report"]
          triage_result --> analyze --> report
        end
      end

      agent responder["Responder"]
        task mitigate["Generate Runbook"]
          generate_runbook["generate_runbook"]
          runbook["Runbook"]
          report --> generate_runbook --> runbook
          generate_runbook --o runbook_tpl_ref
        end
      end

      agent reporter["Reporter"]
        task summarize["Create Dashboard"]
          create_report["create_report"]
          dashboard["Incident Dashboard"]
          runbook --> create_report --> dashboard
          triage_result --> create_report
          report --> create_report
        end
      end
    end
  end

  triage_tpl_ref["triage_result"]
  runbook_tpl_ref["runbook_format"]

  region@{ shape: lean-right }
  health_data@{ shape: doc }
  alert@{ shape: doc }
  triage_result@{ shape: doc }
  report@{ shape: doc }
  runbook@{ shape: doc }
  dashboard@{ shape: doc }

  triage_tpl_ref@{ shape: procs, type: "triage_result" }
  runbook_tpl_ref@{ shape: procs, type: "runbook_format" }

  poll_health@{ shape: subroutine, returns: "String", requires: "^net.read", cache: "30s", description: "Poll service health endpoints for a region" }
  detect_anomaly@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Analyze health data for anomalies against baselines" }
  triage_alert@{ shape: subroutine, returns: "String", requires: "^llm.query", output: "triage_result", description: "Assess severity, blast radius, and form initial hypothesis" }
  analyze@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Deep-dive into metrics, dependencies, and failure cascades" }
  generate_runbook@{ shape: subroutine, returns: "String", requires: "^llm.query", output: "runbook_format", description: "Generate step-by-step mitigation with rollback procedures" }
  create_report@{ shape: subroutine, returns: "String", requires: "^llm.query", description: "Build incident dashboard as single-file HTML" }

  sentinel@{ model: "claude-haiku-4-5-20251001", permits: "^net.read, ^llm.query" }
  monitor@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  investigator@{ model: "claude-opus-4-6", permits: "^llm.query" }
  responder@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }
  reporter@{ model: "claude-sonnet-4-20250514", permits: "^llm.query" }

  detect_and_respond@{ params: "region :: String", returns: "String" }
```

**What agentflow adds beyond a flowchart:** The `template` declarations define _exactly_ what a triage result and runbook must contain — field names, types, multiplicity (`* 3` = at least 3 entries), and human-readable descriptions (`<<Timestamp | Event | Source>>`). The `--o` edges bind tool outputs to these templates. An executor validates that `triage_alert`'s output actually conforms to `triage_result` before passing it downstream. The sentinel agent has `^net.read` (can poll endpoints) while the monitor has only `^llm.query` (can reason but can't access the network). This is enforceable, not advisory.

**Why it matters to investors:** DevOps teams already use Mermaid for documentation. Making runbooks executable — with typed outputs, template validation, and permission-scoped agents — is a natural upgrade path. Every SaaS tool with an API becomes a callable `subroutine` node. The diagram is the runbook, the specification, and the audit trail in one artifact.

---

## 5. Business Process Automation for Non-Technical Teams

**The problem:** Strategy consultants and operations teams think in flowcharts. They draw process diagrams for customer journeys, approval workflows, and onboarding sequences. But those diagrams are dead artifacts. The gap between "here's the process" and "here's the process running" requires an engineering team and months of development.

**How agentflow solves it:** The process diagram becomes the automation — but with structure. Type declarations define the data contracts between steps. Templates with field-level descriptions (`<<...>>`) let business users specify _exactly_ what each step should produce. Collapsed views hide agent internals, showing stakeholders a clean process map; engineers expand to see tools and data flow.

**Example — a customer onboarding flow with typed data contracts:**

```mermaid
agentflow TB
  type Customer = Record {
    name: String
    email: String
    company: String
    plan: String
    verified: Bool
  }

  template welcome_package {
    GREETING: String              <<personalized welcome message>>
    ONBOARDING_STEPS: String * 5  <<Step # | Action | Link | Due Date>>
    ACCOUNT_MANAGER: String       <<assigned AM name and contact>>
    KICKOFF_DATE: String          <<scheduled kickoff meeting date>>
  }

  agent onboarding_team["Onboarding Team"]
    flow onboard_customer["Onboard Customer"]
      agent verifier["Verifier"]
        task verify["Verify Identity"]
          customer_data["customer_data"]
          verify_identity["verify_identity"]
          verified_customer["Verified Customer"]
          customer_data --> verify_identity --> verified_customer
        end
      end

      agent coordinator["Coordinator"]
        task setup["Setup Account"]
          create_crm["create_crm_record"]
          assign_am["assign_account_manager"]
          crm_record["CRM Record"]
          verified_customer --> create_crm --> crm_record --> assign_am
        end
        task welcome["Send Welcome"]
          send_welcome["send_welcome_package"]
          welcome_sent["Welcome Sent"]
          assign_am --> send_welcome --> welcome_sent
          send_welcome --o welcome_ref
        end
        setup --> welcome
      end

      agent scheduler["Scheduler"]
        task kickoff["Schedule Kickoff"]
          schedule_meeting["schedule_kickoff"]
          meeting["Kickoff Scheduled"]
          welcome_sent --> schedule_meeting --> meeting
        end
      end
    end
  end

  welcome_ref["welcome_package"]

  customer_data@{ shape: lean-right }
  verified_customer@{ shape: doc }
  crm_record@{ shape: doc }
  welcome_sent@{ shape: doc }
  meeting@{ shape: doc }
  welcome_ref@{ shape: procs, type: "welcome_package" }

  verify_identity@{ shape: subroutine, returns: "Customer", requires: "^identity.verify", description: "Verify customer identity via KYC provider" }
  create_crm@{ shape: subroutine, returns: "String", requires: "^crm.write", description: "Create customer record in CRM" }
  assign_am@{ shape: subroutine, returns: "String", requires: "^crm.read", description: "Match and assign account manager based on plan tier" }
  send_welcome@{ shape: subroutine, returns: "String", requires: "^email.send, ^llm.query", output: "welcome_package", description: "Generate and send personalized welcome package" }
  schedule_meeting@{ shape: subroutine, returns: "String", requires: "^calendar.create", description: "Schedule kickoff meeting with customer and AM" }

  verifier@{ model: "claude-haiku-4-5-20251001", permits: "^identity.verify" }
  coordinator@{ model: "claude-sonnet-4-20250514", permits: "^crm.read, ^crm.write, ^email.send, ^llm.query" }
  scheduler@{ model: "claude-haiku-4-5-20251001", permits: "^calendar.create" }

  onboard_customer@{ params: "customer_data :: Customer", returns: "String" }
```

**What agentflow adds beyond a flowchart:** A product manager reads the diagram and understands the flow. An engineer reads the `@{}` metadata and understands the tool contracts. The `template welcome_package` with `<<...>>` descriptions specifies _exactly_ what the welcome email must contain — in business language, not code. The collapsed view (`onboarding_team@{ view: "collapsed" }`) shows executives a single "Onboarding Team" box; expanding it reveals the full three-agent pipeline.

**Why it matters to investors:** This is the BPMN replacement story. BPMN has a 500-page specification and requires specialist tools. Agentflow is simple enough that any LLM can generate it, any developer can read it, and any business user can understand the collapsed view. By making process diagrams executable with typed data contracts, we collapse the gap between "process design" and "process automation" — a $15B+ TAM dominated by ServiceNow, Zapier, and Power Automate. Unlike those tools, agentflow specifications are version-controlled, diffable, and AI-native from day one.

---

## The Common Thread

Every use case shares the same structural advantages — rooted in agentflow's semantic model:

| Property                   | Agentflow                                                              | Chat-based alternatives                  |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| **Agent identity**         | Named agents with model binding and permission sets                    | Anonymous, unbounded AI with full access |
| **Tool contracts**         | Typed subroutines with `returns`, `requires`, `retry`, `cache`         | Free-form function calls, no validation  |
| **Data contracts**         | `type` declarations and `template` schemas with `<<descriptions>>`     | Unstructured text, hope for the best     |
| **Permission model**       | Hierarchical permission tree, per-agent least-privilege                | No permission concept; all or nothing    |
| **Audit trail**            | Diagram topology _is_ the execution trace — every edge, every node     | Buried in chat history                   |
| **Progressive disclosure** | Collapsed/expanded views for different audiences                       | Single-level, all-or-nothing             |
| **Cross-agent data flow**  | Typed edges crossing container boundaries                              | Manual data passing between prompts      |
| **Portability**            | Works with any LLM / agent framework; LLMs understand Mermaid natively | Vendor-locked prompt formats             |
| **Version control**        | Text-based, diffable, mergeable                                        | Binary exports or opaque configs         |

The diagram is the specification. The shapes carry semantics. The metadata is machine-parseable. The type system is enforceable. Every use case expands the addressable market beyond diagramming into **structured agent orchestration** — where the real enterprise value lives.

---

_Mermaid Chart — mermaidchart.com_

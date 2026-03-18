-- Created: 2026-03-18
-- Incident Response Pipeline
-- Orchestrates 5 specialized AI agents through a 6-step incident response workflow.
-- Demonstrates: schemas, type aliases, templates, directives, multi-agent orchestration,
-- mock health-check polling, anomaly detection, and end-to-end incident lifecycle.
--
-- Usage (auto-detect from mock health data):
--   pact run examples/incident_response.pact \
--     --flow detect_and_respond \
--     --args "us-east-1" \
--     --dispatch claude
--
-- Usage (manual alert):
--   pact run examples/incident_response.pact \
--     --flow respond \
--     --args "CRITICAL: API gateway p99 latency spike to 12s. 5xx error rate at 34%." \
--     --dispatch claude

permit_tree {
    ^llm {
        ^llm.query
    }
}

-- ── Schemas ─────────────────────────────────────────────────────

schema Incident {
    id :: String
    severity :: String
    title :: String
    services :: List<String>
    region :: String
    start_time :: String
    status :: String
}

schema Finding {
    category :: String
    evidence :: String
    confidence :: String
    recommendation :: String
}

schema HealthCheck {
    service :: String
    status :: String
    latency_p99_ms :: Int
    error_rate_pct :: Float
    region :: String
}

-- ── Type Aliases ────────────────────────────────────────────────

type Severity = P0 | P1 | P2 | P3 | P4
type IncidentStatus = Detected | Triaged | Investigating | Mitigating | Resolved | PostMortem

-- ── Templates ───────────────────────────────────────────────────

template %triage_result {
    INCIDENT_ID :: String           <<generated incident ID, e.g. INC-2026-0318-001>>
    SEVERITY :: String              <<P0 through P4 with justification>>
    TITLE :: String                 <<concise incident title>>
    AFFECTED_SERVICES :: String     <<comma-separated list of impacted services>>
    BLAST_RADIUS :: String          <<user-facing impact assessment>>
    INITIAL_HYPOTHESIS :: String    <<most likely failure mode based on alert signals>>
    ESCALATION :: String            <<who to page and why>>
    TIMELINE :: String * 3          <<Timestamp | Event | Source>>
}

template %investigation_report {
    SUMMARY :: String               <<one paragraph executive summary>>
    METRICS_ANALYSIS :: String      <<what the metrics tell us — latency, error rates, throughput>>
    DEPENDENCY_MAP :: String        <<upstream and downstream service dependencies>>
    ANOMALY :: String * 5           <<Timestamp | Service | Metric | Expected | Actual>>
    CORRELATION :: String           <<cross-service correlation analysis>>
    EVIDENCE :: String * 3          <<Finding category | Evidence | Confidence>>
}

template %runbook_format {
    OBJECTIVE :: String             <<what this runbook achieves>>
    PREREQUISITES :: String         <<required access and tools>>
    STEP :: String * 8              <<Step # | Action | Command/Procedure | Rollback>>
    VERIFICATION :: String          <<how to confirm mitigation is working>>
    COMMUNICATION :: String         <<stakeholder update template>>
    ESCALATION_PATH :: String       <<when and how to escalate further>>
}

-- ── Directives ──────────────────────────────────────────────────

directive %incident_dashboard_style {
    <<DESIGN SYSTEM: Dark-mode incident dashboard.
    Background: #0d1117 (GitHub dark). Cards: #161b22 with 1px #30363d borders.
    Accent colors: Critical #f85149, Warning #d29922, Info #58a6ff, Success #3fb950.
    Typography: 'JetBrains Mono' for metrics, 'Inter' for body text via Google Fonts.
    Layout: CSS Grid — severity banner at top, two-column layout below.
    Left column (60%): timeline + investigation. Right column (40%): metrics + runbook.
    SVG status indicators: pulsing red dot for active incident, green for resolved.
    Cards should have subtle box-shadow: 0 1px 3px rgba(0,0,0,0.3).
    Responsive: stack to single column below 768px.
    Include a dark-mode scrollbar style. No images — all visual elements via CSS and inline SVG.
    The page should feel like a real SRE war room dashboard — data-dense, scannable, professional.>>
    params {
        heading_font :: String = "Inter"
        mono_font :: String = "JetBrains Mono"
    }
}

-- ── Tools ───────────────────────────────────────────────────────

tool #poll_health {
    description: <<Poll service health endpoints for a given region. Returns a JSON array of health check results for all monitored services. MOCK DATA — return this exact JSON for any region query:
[
  {"service": "api-gateway", "status": "DEGRADED", "latency_p99_ms": 12000, "error_rate_pct": 34.2, "region": "us-east-1", "timestamp": "2026-03-18T14:23:00Z"},
  {"service": "payment-service", "status": "DEGRADED", "latency_p99_ms": 8500, "error_rate_pct": 28.7, "region": "us-east-1", "timestamp": "2026-03-18T14:23:05Z"},
  {"service": "user-service", "status": "DEGRADED", "latency_p99_ms": 6200, "error_rate_pct": 19.1, "region": "us-east-1", "timestamp": "2026-03-18T14:23:03Z"},
  {"service": "order-service", "status": "HEALTHY", "latency_p99_ms": 120, "error_rate_pct": 0.3, "region": "us-east-1", "timestamp": "2026-03-18T14:23:00Z"},
  {"service": "inventory-service", "status": "HEALTHY", "latency_p99_ms": 85, "error_rate_pct": 0.1, "region": "us-east-1", "timestamp": "2026-03-18T14:23:00Z"}
]
Return this JSON exactly — do not modify or summarize it.>>
    requires: [^llm.query]
    params {
        region :: String
    }
    returns :: String
}

tool #detect_anomaly {
    description: <<You are an observability engineer analyzing raw health check data. Given JSON health-check results from multiple services, determine if there is an active incident. Compare each metric against normal baselines: p99 latency should be under 500ms, error rates should be under 2%, all services should report HEALTHY. If you detect anomalies, produce a single CRITICAL/WARNING/INFO alert string that summarizes ALL anomalies found — include specific service names, metric values, affected region, and timestamp. If everything looks normal, respond with just the word HEALTHY. Be precise and quantitative.>>
    requires: [^llm.query]
    params {
        health_data :: String
    }
    returns :: String
}

tool #triage_alert {
    description: <<You are an SRE triage specialist. Analyze a raw production alert and produce a structured triage assessment. Assign a severity level (P0-P4) based on user impact, blast radius, and revenue exposure. Identify affected services, generate a timeline from the alert signals, form an initial hypothesis, and recommend an escalation path. Be specific — reference actual service names, error codes, and metrics from the alert. Output must follow the triage_result template exactly.>>
    requires: [^llm.query]
    output: %triage_result
    params {
        alert :: String
    }
    returns :: String
}

tool #analyze_incident {
    description: <<You are a senior site reliability engineer performing deep incident investigation. Given a triage assessment, conduct a thorough analysis: examine the metrics patterns (latency percentiles, error rate curves, throughput drops), map service dependencies to identify cascade paths, find anomalies across the timeline, and correlate signals across services. Look for the failure propagation path — which service failed first and how it cascaded. Be quantitative: cite specific numbers, percentages, and timestamps. Output must follow the investigation_report template exactly.>>
    requires: [^llm.query]
    output: %investigation_report
    params {
        triage :: String
    }
    returns :: String
}

tool #root_cause_analysis {
    description: <<You are a principal engineer specializing in distributed systems failure analysis. Given the investigation report, determine the root cause with high confidence. Consider: recent deployments, configuration changes, infrastructure failures, capacity limits, dependency outages, and data corruption. Produce a clear causal chain from trigger to user impact. Distinguish between the root cause (why it happened), the trigger (what started it), and contributing factors (what made it worse). Cite specific evidence from the investigation for each conclusion. Format as a structured analysis with sections: Root Cause, Trigger Event, Contributing Factors, Causal Chain, and Confidence Assessment.>>
    requires: [^llm.query]
    params {
        investigation :: String
    }
    returns :: String
}

tool #generate_runbook {
    description: <<You are an incident commander generating an actionable response runbook. Given the root cause analysis, produce step-by-step mitigation procedures. Each step must include: the specific action, exact commands or procedures (using realistic kubectl, AWS CLI, or service-specific commands), expected outcome, and rollback procedure if the step makes things worse. Include verification checks after each major step. Add a stakeholder communication template and escalation criteria. Be concrete — no vague instructions like 'investigate further'. Every step should be copy-pasteable by an on-call engineer at 3 AM. IMPORTANT: Never include long numeric strings (13+ digits) in your output — use short placeholder IDs like 'abc-1234' instead of realistic account numbers or resource IDs. Output must follow the runbook_format template exactly.>>
    requires: [^llm.query]
    output: %runbook_format
    params {
        root_cause :: String
    }
    returns :: String
}

tool #create_report {
    description: <<You are a frontend engineer building an incident dashboard. Generate a complete, single-file HTML page that serves as a real-time incident report dashboard. Combine ALL previous pipeline outputs (triage, investigation, root cause, runbook) into a cohesive, data-dense dark-mode dashboard. Include: severity banner with pulsing SVG indicator, incident timeline with timestamps, metrics visualization using CSS bar charts, dependency graph using inline SVG, root cause causal chain, runbook steps with expandable sections, and a status footer. IMPORTANT: Never include long numeric strings (13+ digits) anywhere — use short IDs like 'INC-0318-001'. Return ONLY raw HTML starting with DOCTYPE. No markdown fences. No explanations. The dashboard should look like it belongs in a real SRE war room.>>
    requires: [^llm.query]
    directives: [%incident_dashboard_style]
    params {
        triage :: String
        investigation :: String
        root_cause :: String
        runbook :: String
    }
    returns :: String
}

-- ── Agents ──────────────────────────────────────────────────────

agent @sentinel {
    permits: [^llm.query]
    tools: [#poll_health, #detect_anomaly]
    prompt: <<You are an automated monitoring sentinel that continuously watches production infrastructure. When asked to check a region, first poll the health endpoints, then analyze the results for anomalies. If you detect an incident, produce a clear, actionable alert string. If everything is healthy, say HEALTHY. You are the first line of defense — false negatives are worse than false positives. Never claim you have saved, stored, sent, or emailed anything. You produce analysis text only.>>
}

agent @monitor {
    permits: [^llm.query]
    tools: [#triage_alert]
    prompt: <<You are the on-call monitoring engineer. Your job is to rapidly assess incoming alerts, determine severity, and produce a structured triage assessment that enables the investigation team to begin work immediately. Be decisive — assign a clear severity level and don't hedge. Never claim you have saved, stored, sent, or emailed anything. You produce analysis text only.>>
}

agent @investigator {
    permits: [^llm.query]
    tools: [#analyze_incident, #root_cause_analysis]
    prompt: <<You are a senior SRE and distributed systems expert. You investigate incidents with the rigor of a forensic analyst. You think in terms of dependency graphs, failure domains, and cascade patterns. Your analysis is quantitative — you cite specific metrics, percentages, and timestamps. You distinguish correlation from causation. Never claim you have saved, stored, sent, or emailed anything. You produce analysis text only.>>
}

agent @responder {
    permits: [^llm.query]
    tools: [#generate_runbook]
    prompt: <<You are an incident commander with 10 years of SRE experience. You write runbooks that on-call engineers can execute at 3 AM without thinking. Every step is concrete, every command is copy-pasteable, every action has a rollback. You think about what can go wrong at each step. Never claim you have saved, stored, sent, or emailed anything. You produce analysis text only.>>
}

agent @reporter {
    permits: [^llm.query]
    tools: [#create_report]
    prompt: <<You are a frontend engineer who specializes in operational dashboards. You build data-dense, scannable interfaces that SRE teams rely on during incidents. Your HTML/CSS is production-quality — proper semantic markup, CSS Grid layouts, responsive design, smooth animations. You use inline SVG for status indicators and data visualization. Every pixel serves a purpose. Never output markdown — only raw HTML starting with DOCTYPE.>>
}

agent_bundle @incident_team {
    agents: [@sentinel, @monitor, @investigator, @responder, @reporter]
}

-- ── Flow ────────────────────────────────────────────────────────

flow respond(alert :: String) -> String {
    -- Step 1: Triage — assess severity and blast radius
    triage = @monitor -> #triage_alert(alert)

    -- Step 2: Investigate — deep-dive into metrics and dependencies
    investigation = @investigator -> #analyze_incident(triage)

    -- Step 3: Root cause — determine why this happened
    root_cause = @investigator -> #root_cause_analysis(investigation)

    -- Step 4: Runbook — actionable mitigation steps
    runbook = @responder -> #generate_runbook(root_cause)

    -- Step 5: Report — compile everything into an incident dashboard
    dashboard = @reporter -> #create_report(triage, investigation, root_cause, runbook)

    return dashboard
}

-- Full pipeline: detect anomaly from health checks, then respond
flow detect_and_respond(region :: String) -> String {
    -- Step 0: Poll health endpoints and detect anomalies
    health_data = @sentinel -> #poll_health(region)
    alert = @sentinel -> #detect_anomaly(health_data)

    -- Steps 1-5: Full incident response pipeline
    dashboard = run respond(alert)

    return dashboard
}

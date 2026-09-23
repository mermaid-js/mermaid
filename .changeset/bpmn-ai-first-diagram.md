---
'mermaid': minor
---

feat: add a native BPMN process diagram (`bpmn`). An AI-first, keyword-position
DSL for BPMN Level 1 Descriptive plus intermediate message/timer events: start/end
events, user/service/script tasks, exclusive/parallel/inclusive gateways with
conditions and default flows, pools, lanes, and cross-pool message flows. The
parser is tolerant (case-insensitive keywords and synonyms) and produces
deterministic output, and every semantic error is a prescriptive, self-correcting
message (unreachable nodes, gateway arity, message-flows-across-pools, and more).
Rendering reuses the swimlane layout engine for lanes; a plain flow lays out with
dagre.

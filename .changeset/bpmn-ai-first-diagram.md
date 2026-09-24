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
Pools and lanes render as titled containers; a plain flow lays out with dagre. It
also ships a one-way BPMN 2.0 XML export (`toBpmnXml(dsl)`) with a BPMNDI section,
so a diagram opens laid-out in bpmn.io / Camunda Modeler.

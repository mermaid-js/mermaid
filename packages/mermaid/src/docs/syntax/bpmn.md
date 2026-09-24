# BPMN diagrams

BPMN (Business Process Model and Notation) diagrams describe a business process as a
flow of events, tasks, and decisions, optionally organized into pools and lanes that
show which participant or role does the work. Mermaid's `bpmn` diagram targets **BPMN
2.0 Level 1 Descriptive Conformance** plus intermediate events: start/end events with
message and timer triggers, intermediate (catch) events, the four core gateway types,
the common task subtypes, data objects, pools/lanes, and both sequence and message
flows.

Start a diagram with the `bpmn` keyword, optionally followed by a layout direction.

```mermaid-example
bpmn LR
  start s1 "Start"
  task:user t1 "Review order"
  task:service t2 "Charge card"
  end e1 "Done"
  s1 --> t1 --> t2 --> e1
```

Use `LR`, `RL`, `TB`, or `TD` after `bpmn` to choose the layout direction. `LR`
(left to right) is the BPMN convention and is used when no direction is given.

## Elements

### Events

An event is written as `<position> [<trigger>] <id> ["<label>"]`.

- **Positions**: `start`, `intermediate` (a catching/throwing event mid-process), `end`.
- **Triggers**: no trigger (the default, a plain circle), `message` (envelope), or
  `timer` (clock). Catching triggers (`start`, `intermediate`) render unfilled;
  throwing triggers (`end`) render filled, per BPMN notation.

```mermaid-example
bpmn LR
  start message s1 "Request received"
  task:user t1 "Assess request"
  intermediate timer i1 "Wait 2 days"
  and g1
  task:service t2 "Notify"
  task:script t3 "Archive"
  end e1 "Closed"
  s1 --> t1 --> i1 --> g1
  g1 --> t2 --> e1
  g1 --> t3 --> e1
```

### Tasks

A task is written as `task[:<subtype>] <id> ["<label>"]`. Plain `task` is an abstract
task; the supported subtypes are `task:user` (a human performs it), `task:service`
(a system/API performs it), and `task:script` (an automated script performs it).

```mermaid-example
bpmn LR
  start s1 "Start"
  task:user t1 "Review order"
  task:service t2 "Charge card"
  end e1 "Done"
  s1 --> t1 --> t2 --> e1
```

### Gateways

A gateway is written as `<kind> <id> ["<label>"]`.

- `xor` — exclusive gateway: exactly one outgoing branch is taken. Conditions live on
  the outgoing flows, and a diverging `xor` needs at least two outgoing flows.
- `and` — parallel gateway: every outgoing branch is taken (fork/join). Outgoing
  flows on an `and` gateway cannot carry conditions.
- `or` — inclusive gateway: one or more outgoing branches are taken, based on their
  conditions.
- `event` — event-based gateway: the next step is decided by whichever event fires
  first.

```mermaid-example
bpmn LR
  start s1 "Order received"
  task:user t1 "Review order"
  xor g1 "Approved?"
  task:service t2 "Charge card"
  end e1 "Shipped"
  end e2 "Rejected"
  s1 --> t1 --> g1
  g1 -- "approved" --> t2 --> e1
  g1 -->|default| e2
```

### Data objects

Write `data <id> ["<label>"]` for a data object. Connect it to a task or event with
an association (`-.-`) rather than a sequence flow — see [Flows](#flows).

## Containers: pools and lanes

`pool "Name"` groups everything indented beneath it into one participant. `lane
"Name"`, indented under a pool, further groups its own indented members into a role
inside that pool. Indentation expresses containment: every element indented under a
`pool` or `lane` belongs to it, until a line returns to a shallower indentation.

```mermaid-example
bpmn LR
  pool "Customer"
    task:user c1 "Place order"
  pool "Supplier"
    lane "Sales"
      start message s1 "Order received"
      xor g1 "In stock?"
    lane "Warehouse"
      task:service t1 "Pick items"
      end e1 "Shipped"
      end e2 "Backordered"
  s1 --> g1
  g1 -- "yes" --> t1 --> e1
  g1 -->|default| e2
  c1 ==> s1
```

## Flows

| Syntax | Meaning |
| --- | --- |
| `a --> b` | Sequence flow — the default arrow, valid only within one pool. |
| `a -- "label" --> b` | Labeled/conditional sequence flow. A condition is only valid on a flow leaving an `xor` or `or` gateway. |
| `a -->\|default\| b` | The default branch out of a gateway. A gateway may have at most one default flow. |
| `a ==> b` | Message flow — dashed, open arrowhead. Valid only **between** two different pools; it cannot connect two nodes in the same pool. |
| `a -.- b` | Association — a dotted, markerless line, typically linking a task or event to a data object. |

Flows can be chained on one line: `a --> b --> c`.

## AI-first: tolerant syntax

The `bpmn` grammar is written to absorb an LLM's near-misses without failing the
parse, so generated diagrams have a high first-pass success rate.

- **Every keyword is case-insensitive.** `START`, `Start`, and `start` are the same
  token.
- **Common synonyms normalize to the canonical keyword** before parsing:

  | Canonical | Accepted synonyms |
  | --- | --- |
  | `start` | `startEvent`, `begin` |
  | `end` | `endEvent`, `stop` |
  | `task` | `activity`, `step` |
  | `task:user` | `usertask`, `task:human` |
  | `task:service` | `servicetask`, `task:auto` |
  | `xor` | `exclusive`, `exclusivegateway`, `x-gateway`, `decision` |
  | `and` | `parallel`, `parallelgateway` |
  | `or` | `inclusive`, `inclusivegateway` |
  | `event` | `eventgateway`, `event-based` |
  | `message` | `msg` |
  | `timer` | `time`, `clock` |
  | `pool` | `participant` |
  | `lane` | `swimlane` |

- **Whitespace between tokens is insignificant**, blank lines and trailing
  whitespace are ignored, and `%%` line comments are allowed anywhere.
- **Declaration order and flow order are independent** — a flow may reference an id
  that is declared later in the source.
- **Deterministic output**: the same source always renders to the same output. Nodes
  are emitted to the layout engine in canonical order (declaration order, then
  pool → lane → node containment order), so re-generating a diagram from an LLM does
  not churn the rendered SVG for unrelated reasons.

## Validation & error messages

Beyond parsing, `bpmn` checks that the diagram describes a coherent process, and
reports violations as `bpmn: <what is wrong>, naming the id/line. <the rule>. <the
exact fix>.` so the message doubles as a repair instruction. The checked rules:

1. Every flow node must reach an end event.
2. Every flow node must be reachable from a start event.
3. Start events cannot have an incoming flow; end events cannot have an outgoing flow.
4. A diverging `xor`/`or` gateway needs two or more outgoing flows; an `and` gateway's
   outgoing flows cannot carry a condition.
5. A condition on a flow is only valid leaving an `xor` or `or` gateway.
6. A gateway may have at most one default flow.
7. Message flows (`==>`) may only cross pool boundaries; sequence flows (`-->`) may
   only stay within one pool.
8. A node belongs to exactly one lane, and every lane must sit inside a pool.
9. Every id referenced by a flow must be declared, and every id must be unique.

## Prompt-ready spec

The block below is the condensed BPMN reference meant to be pasted directly into an
LLM system prompt so the model can emit valid `bpmn` diagrams without further
context.

```text
You write Mermaid BPMN diagrams. Output ONLY a ```mermaid code block, no prose.

Start with: bpmn LR      (or TB for top-down)

ELEMENTS (one per line, form: TYPE id "Label"):
  start id "..."                 start event
  start message id "..."         message start (waits for a message)
  start timer id "..."           timer start
  end id "..."                   end event
  task id "..."                  task           task:user / task:service / task:script
  xor id "..."                   exclusive gateway (a decision; needs >=2 branches)
  and id                         parallel gateway (fork/join; NO conditions)
  or id "..."                    inclusive gateway
  data id "..."                  data object

CONTAINERS (indent members under them):
  pool "Name"                    a participant/organization
    lane "Name"                  a role inside the pool
      <elements...>

FLOWS:
  a --> b                        sequence flow (same pool only)
  a -- "yes" --> b               conditional flow (ONLY from xor/or gateways)
  a -->|default| b               default branch of a gateway
  a ==> b                        message flow (ONLY between different pools)
  a -.- d1                       association to a data object
  chains ok: a --> b --> c

RULES (violating these is an error):
  1. Every node must reach an end event, and be reachable from a start.
  2. start = no incoming; end = no outgoing.
  3. A diverging xor/or needs >=2 outgoing flows; put the condition on the FLOW.
  4. Parallel (and) gateways take NO conditions.
  5. Conditions/labels-as-conditions come only from xor/or gateways.
  6. Message flow (==>) ONLY between pools; sequence flow (-->) ONLY within a pool.
  7. Every id is unique; every flow references a declared id.

EXAMPLE:
bpmn LR
  pool "Shop"
    start message s1 "Order received"
    task:user     t1 "Review order"
    xor           g1 "Approved?"
    task:service  t2 "Charge card"
    end           e1 "Shipped"
    end           e2 "Rejected"
  s1 --> t1 --> g1
  g1 -- "approved" --> t2 --> e1
  g1 -->|default| e2
```

## Export to BPMN 2.0 XML

A BPMN diagram can be exported one-way to BPMN 2.0 XML (with a `BPMNDI` section
carrying real layout coordinates), so it opens laid-out in bpmn.io or Camunda
Modeler. Pools become a `collaboration` of `participant`s, lanes become a
`laneSet`, and message flows become `messageFlow`s.

```js
import { toBpmnXml } from 'mermaid/dist/diagrams/bpmn/export/index.js';

const xml = await toBpmnXml(`bpmn LR
  start s1 "Start"
  task:user t1 "Review"
  end e1 "Done"
  s1 --> t1 --> e1`);
// -> a BPMN 2.0 XML string; write it to an .bpmn file and open it in bpmn.io
```

XML import (XML back to DSL) is intentionally out of scope.

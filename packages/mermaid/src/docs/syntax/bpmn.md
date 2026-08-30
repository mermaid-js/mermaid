# BPMN (v<MERMAID_RELEASE_VERSION>+)

> A BPMN diagram describes a business process in the notation standardised by the OMG: the pools and lanes that say who does the work, the events that start and end it, the activities that carry it out, and the gateways that branch it.
>
> **Warning**
> BPMN is in **beta**. The diagram type is selected with the `bpmn-beta` keyword, and the syntax may still change in a backwards-incompatible way before it is declared stable.

## Introduction

BPMN 2.0 is the notation most organisations already use to draw a process, and its symbols are precise: a circle with a thin border starts a process, a circle with a thick border ends it, a diamond branches it, and a rounded rectangle is work being done. `bpmn-beta` renders that vocabulary from text.

A diagram is written line by line, and **indentation expresses containment** — a lane indented under a pool belongs to it, and an activity indented under a lane sits in that lane. This is the same rule mindmaps and treeViews use.

## Basic example

```mermaid-example
bpmn-beta LR
  lane "Order handling"
    start message s1 "Order received"
    user task t1 "Check stock"
    xor gw "In stock?"
    end e1 "Order shipped"
  s1 --> t1 --> gw --> e1
```

## Declaring a diagram

Every diagram starts with the `bpmn-beta` keyword, optionally followed by a direction — `LR`, `RL`, `TB`, `TD`, or `BT`. The default is `LR`, which is how BPMN is conventionally drawn.

```txt
bpmn-beta LR
```

Comments start with `%%` and run to the end of the line.

## Titling a diagram

A diagram may carry a title, and the text that describes it to a screen reader. Each takes the rest of its line.

```mermaid-example
bpmn-beta LR
title Order handling
accTitle: How an order is handled
accDescr: An order is received, checked by sales and then filed.
  lane "Sales"
    start s1 "Order received"
    user task t1 "Check the order"
    end e1 "Filed"
  s1 --> t1 --> e1
```

`accDescr` also has a braced form for a description that runs over several lines:

```
accDescr {
  An order is received.
  It is then checked and filed.
}
```

## Naming elements

Every element takes an optional id and an optional quoted label:

```txt
task t1 "Check stock"     %% id t1, label "Check stock"
task t1                   %% id t1, label "t1"
task "Check stock"        %% generated id, label "Check stock"
```

An id is only needed when a flow refers to the element.

## Pools and lanes

A `pool` is a participant in the process; a `lane` divides a pool into roles. Both are containers, so their contents are indented under them. A diagram may use lanes without a pool.

```mermaid-example
bpmn-beta LR
  pool "Order handling"
    lane "Sales"
      start s1 "Order received"
      task t1 "Approve order"
    lane "Warehouse"
      task t2 "Pick items"
      end e1 "Shipped"
  s1 --> t1 --> t2 --> e1
```

## Events

An event is written as its position, an optional trigger, then the name and label.

| Position       | Meaning                                                   |
| -------------- | --------------------------------------------------------- |
| `start`        | Starts the process — a thin circle                        |
| `intermediate` | Something caught part-way through — a double circle       |
| `throw`        | A throwing intermediate event, drawn with a filled marker |
| `boundary`     | Attached to an activity's border, see below               |
| `end`          | Ends the process — a thick circle                         |

The thirteen triggers of BPMN 2.0.2 Table 10.93 are accepted: `none`, `message`, `timer`, `error`, `escalation`, `cancel`, `compensation`, `conditional`, `link`, `signal`, `terminate`, `multiple`, and `parallel-multiple`. Omitting the trigger gives a plain (`none`) event.

A trigger that _catches_ is drawn as an outline and one that _throws_ is filled, which is why the same keyword produces a different marker on an `intermediate` than on an `end`.

```mermaid-example
bpmn-beta LR
  lane "Escalation"
    start timer s1 "Every night"
    intermediate message i1 "Await reply"
    throw escalation x1 "Escalate"
    end terminate e1 "Stop"
  s1 --> i1 --> x1 --> e1
```

## Gateways

| Keyword         | Gateway                        |
| --------------- | ------------------------------ |
| `xor`           | Exclusive — one path is taken  |
| `and`           | Parallel — all paths are taken |
| `or`            | Inclusive                      |
| `event-gateway` | Event-based                    |
| `complex`       | Complex                        |

```mermaid-example
bpmn-beta LR
  lane "Review"
    start s1 "Submitted"
    xor gw1 "Approved?"
    and gw2 "Fan out"
    end e1 "Done"
  s1 --> gw1
  gw1 -- yes --> gw2 --> e1
```

## Activities

An activity is `task`, `subprocess`, or `call`, optionally preceded by a task type that selects its corner glyph: `user`, `service`, `receive`, `send`, `manual`, `script`, or `rule`.

A `call` activity invokes a process defined elsewhere and is drawn with a thick border.

```mermaid-example
bpmn-beta LR
  lane "Fulfilment"
    user task t1 "Review order"
    service task t2 "Charge card"
    script task t3 "Generate label"
    subprocess sp1 "Pack goods"
    call c1 "Ship via carrier"
  t1 --> t2 --> t3 --> sp1 --> c1
```

## Boundary events

A boundary event is attached to an activity by indenting it under that activity. It is drawn on the activity's border, and a flow out of it is the exception path.

```mermaid-example
bpmn-beta LR
  lane "Support"
    start s1 "Ticket raised"
    task t1 "Await customer"
      boundary timer b1 "3 days"
    end e1 "Resolved"
    end e2 "Timed out"
  s1 --> t1 --> e1
  b1 --> e2
```

## Flows

| Syntax             | Flow                          |
| ------------------ | ----------------------------- |
| `a --> b`          | Sequence flow                 |
| `a -- label --> b` | Sequence flow with a label    |
| `a -.-> b`         | Message flow, between pools   |
| `a ..> b`          | Association, pointing at `b`  |
| `a ... b`          | Association, pointing nowhere |

Flows chain, so `a --> b --> c` declares two of them.

A message flow is drawn as a dashed line with an open arrowhead and a hollow circle at its source, which is how BPMN distinguishes a message between participants from a sequence flow inside one.

An association is dotted rather than dashed, which is how the notation separates the two. It joins an artifact to what it belongs to and carries no order, so an element that is only associated does not take a place in the sequence.

```mermaid-example
bpmn-beta LR
  pool "Customer"
    lane "Buyer"
      start s1 "Needs goods"
      task t1 "Place order"
  pool "Supplier"
    lane "Sales"
      task t2 "Receive order"
      end e1 "Fulfilled"
  s1 --> t1
  t1 -.-> t2
  t2 --> e1
```

## Artifacts

Artifacts carry information without taking part in the flow.

| Keyword           | Artifact                                     |
| ----------------- | -------------------------------------------- |
| `data`            | A data object                                |
| `data-input`      | A data object an activity reads              |
| `data-output`     | A data object an activity writes             |
| `data-collection` | A data object standing for a set of items    |
| `data-store`      | A data store                                 |
| `note`            | A text annotation                            |
| `group`           | A dash-dot box drawn around what it contains |

A `group` is a container, so its members are indented under it. It has no execution semantics.

An artifact is placed beside the element it is associated with rather than in the flow, so where it is written among the elements does not decide where it is drawn.

```mermaid-example
bpmn-beta LR
  lane "Fulfilment"
    start s1 "Begin"
    group "Warehouse work"
      task t1 "Pick items"
      task t2 "Pack"
    data d1 "Pick list"
    data-store ds1 "Inventory"
    note n1 "Stock checked nightly"
    end e1 "Done"
  s1 --> t1 --> t2 --> e1
  d1 ..> t1
  n1 ... t2
```

A data object drawn with an input, output or collection marker:

```mermaid-example
bpmn-beta LR
  lane "Sales"
    start s1 "Order received"
    data-input in1 "Order form"
    user task t1 "Check the order"
    data-output out1 "Approval"
    data-collection many "Line items"
    end e1 "Filed"
  s1 --> t1 --> e1
  in1 ..> t1
  t1 ..> out1
  many ..> t1
```

## Configuration

The `bpmn` config namespace controls spacing:

| Key              | Default | Meaning                                        |
| ---------------- | ------- | ---------------------------------------------- |
| `nodeSpacing`    | `50`    | Distance between two elements in the same rank |
| `rankSpacing`    | `60`    | Distance between two ranks                     |
| `diagramPadding` | `12`    | Padding around the whole diagram               |
| `titleTopMargin` | `25`    | Margin above the diagram title                 |

```mermaid-example
---
config:
  bpmn:
    nodeSpacing: 80
    rankSpacing: 100
---
bpmn-beta LR
  lane "Wide"
    start s1 "Begin"
    task t1 "Work"
    end e1 "Done"
  s1 --> t1 --> e1
```

## Theming

Every colour a BPMN element is painted with is a theme variable under `themeVariables.bpmn`, so the whole notation can be retuned without styling individual elements: `eventFill`, `eventStroke`, `eventStrokeWidth`, `endEventStroke`, `endEventStrokeWidth`, `gatewayFill`, `gatewayStroke`, `gatewayStrokeWidth`, `activityFill`, `activityStroke`, `activityStrokeWidth`, `glyphColor`, `dataFill`, `dataStroke`, `annotationStroke`, `laneFill`, `laneStroke`, `laneLabelColor`, `labelColor`, `edgeStroke`, and `messageStroke`.

```mermaid-example
---
config:
  themeVariables:
    bpmn:
      activityFill: '#eef6ff'
      activityStroke: '#2563eb'
      gatewayFill: '#fff7ed'
      gatewayStroke: '#ea580c'
---
bpmn-beta LR
  lane "Themed"
    start s1 "Begin"
    task t1 "Work"
    xor gw "Done?"
    end e1 "End"
  s1 --> t1 --> gw --> e1
```

## Current limitations

- The parser accepts any position and trigger combination. BPMN 2.0.2 Table 10.93 permits only a subset — `terminate` on an end event, `link` on an intermediate one — and the rest are not yet rejected.
- Activity markers (loop, parallel and sequential multi-instance, ad-hoc, compensation) have no syntax yet.
- A group is contained by one lane, so it cannot yet stretch across pools the way BPMN 2.0.2 Figure 8.14 shows.
- An artifact is drawn beside the element it is associated with, so one associated across a lane boundary is drawn in that element's lane rather than the lane it was written in.
- Choreography and conversation diagrams are separate BPMN diagram types with their own shapes, and neither has syntax here.

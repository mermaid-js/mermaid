---
'mermaid': minor
---

feat: add the `bpmn-beta` diagram type for modelling a business process in BPMN 2.0 notation — the pools and lanes that say who does the work, the events that start and end it, the activities that carry it out, and the gateways that branch it.

```mermaid
bpmn-beta LR
  pool "Order handling"
    lane "Sales"
      start message s1 "Order received"
      user task t1 "Approve order"
        boundary timer b1 "2 days"
      xor gw "Approved?"
    lane "Warehouse"
      service task t2 "Pick items"
      end e1 "Shipped"
  s1 --> t1 --> gw
  gw -- yes --> t2 --> e1
  b1 --> t2
```

- Pools and lanes, with containment written as indentation.
- Events across five positions and the thirteen triggers of BPMN 2.0.2, drawn unfilled when they catch and filled when they throw; boundary events pin to their host activity's border.
- The five gateways, the seven task types, sub-processes and call activities.
- Sequence, labelled and message flows, the last with its own edge markers.
- Data objects, data stores, text annotations and groups.
- A note stands beside, and a line lands on, the gateway or event a reader sees, not the larger box reserved around its caption.
- A `bpmn` config namespace for spacing, and a `themeVariables.bpmn` block covering every colour the notation paints with. Unset colours follow the active theme and its `themeVariables`, so `forest`, `neutral` and a `base` theme with its own `primaryColor` each look different.
- Mistakes are refused with the line and column they sit at: a syntax error, an id declared twice, an element indented under one that cannot hold it, a boundary event with no host, and a flow to an element that was never declared.

The diagram is beta: the syntax may still change before it is declared stable.

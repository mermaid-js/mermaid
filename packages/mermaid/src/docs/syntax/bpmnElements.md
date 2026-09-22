# BPMN element reference (v<MERMAID_RELEASE_VERSION>+)

> Every BPMN 2.0.2 element, what to write for it, and what happens when there is nothing to write.
>
> **Warning**
> BPMN is in **beta**. The diagram type is selected with the `bpmn-beta` keyword, and the syntax may still change in a backwards-incompatible way before it is declared stable.

## Introduction

[BPMN syntax](./bpmn.md) is the tour: it introduces the notation in the order you would draw it.
This page is the lookup. It answers two questions the tour does not:

- I know the BPMN element I want - what do I write for it, and is it supported at all?
- The parser refused my diagram - what exactly did it refuse, and why?

Everything here is generated from, or checked against, the grammar it describes.

## Writing an element

Every element follows one shape: an optional modifier, the keyword, an optional id, and an
optional quoted label.

```txt
user task approve "Approve the order"
^^^^ ^^^^ ^^^^^^^  ^^^^^^^^^^^^^^^^^
 |    |      |     label, in double quotes
 |    |      id
 |    keyword
 modifier
```

Both the id and the label are optional, and their order is fixed. An element with only a
label gets an id of its own - `task-1`, `xor-2` - which nothing else can refer to, so give an
id to anything a flow names.

An id starts with a letter or `_`, continues with word characters, and may carry internal
hyphens: `order`, `check_stock`, `step-2`. A keyword cannot be used as an id, so `start`,
`end`, `data` and `message` are unavailable, while `starter`, `database` and `titles` are fine.

A label is always double-quoted, on one line, and cannot itself contain a double quote.

### Indentation is containment

A line indented under another belongs to it. The indent of the first content line sets the
baseline, so the diagram as a whole can sit at any margin, and each element's parent is the
nearest earlier line indented less than it.

Indentation is counted in characters, and a tab counts as one. **Mixing tabs and spaces at the
same depth nests the diagram wrongly**, because a line indented with one tab is shallower than
a line indented with two spaces.

Nothing checks that a parent is a sensible container, so a `task` indented under another
`task` parses. The one containment that carries meaning is a `boundary` event under an
activity, which is how it is attached.

## Containers

| Written | Element              | Notes                                                                               |
| ------- | -------------------- | ----------------------------------------------------------------------------------- |
| `pool`  | Pool, or participant | A pool with no lanes is drawn as one; with no contents at all it is a black box     |
| `lane`  | Lane                 | Divides one participant, so lanes share their borders                               |
| `group` | Group                | Drawn around its members, carries no execution semantics, and cannot yet span pools |

A participant with nothing inside it is legal and useful: a collaboration often shows who a
message goes to without saying what they do with it. A message flow may name the pools
themselves as its ends.

```mermaid-example
bpmn-beta LR
  pool buyer "Buyer"
  pool seller "Seller"
  buyer -.-> seller
```

## Events

An event is a position, an optional trigger, then the id and label - **in that order**.
`start message s1 "Order received"`, never `message start s1 "..."`.

| Position       | Drawn as                                  |
| -------------- | ----------------------------------------- |
| `start`        | One thin ring                             |
| `intermediate` | Two rings, marker unfilled - it catches   |
| `throw`        | Two rings, marker filled - it throws      |
| `boundary`     | Two rings, pinned to an activity's border |
| `end`          | One thick ring, marker filled             |

A marker that catches is drawn as an outline and one that throws is filled, which is why the
same trigger looks different on an `intermediate` than on an `end`.

### Which trigger belongs where

<!--@include: virtual:bpmnEventMatrix -->

`intermediate` and `boundary` are the two positions that do not accept `none`: an event that
waits is defined by what it waits for, so it must name a trigger.

Two rows are wider here than in the notation. `error`, `escalation` and `compensation` start
an _event sub-process_, and `cancel` belongs to a _transaction_; neither containment can be
written yet, so both are accepted wherever the enclosing element would otherwise decide.

### Boundary events

A boundary event is attached by indenting it under the activity it interrupts. It is drawn on
that activity's border, which is the one place two shapes are meant to share space.

```mermaid-example
bpmn-beta LR
  lane "Orders"
    user task t1 "Await approval"
      boundary timer b1 "2 days"
    end e1 "Filed"
  t1 --> e1
  b1 --> e1
```

## Gateways

| Written         | Gateway     |
| --------------- | ----------- |
| `xor`           | Exclusive   |
| `and`           | Parallel    |
| `or`            | Inclusive   |
| `event-gateway` | Event-based |
| `complex`       | Complex     |

These five words are the only spellings accepted. `exclusive`, `parallel`, `inclusive` and
`gateway` are not keywords and will be read as ids.

A gateway's branches are told apart by the labels on the flows leaving it, not by any syntax
on the gateway itself.

## Activities

| Written      | Element                                  |
| ------------ | ---------------------------------------- |
| `task`       | Task, untyped                            |
| `subprocess` | Sub-process                              |
| `call`       | Call activity, drawn with a thick border |

A task takes an optional type in front of it, which selects the glyph in its corner.

<!--@include: virtual:bpmnTaskTypes -->

Note the spelling of the last one: it is `rule task`, not `business-rule task`.

```mermaid-example
bpmn-beta LR
  lane "Fulfilment"
    receive task t1 "Receive the order"
    rule task t2 "Apply the price list"
    send task t3 "Confirm"
  t1 --> t2 --> t3
```

## Artifacts

| Written           | Element                 |
| ----------------- | ----------------------- |
| `data`            | Data object             |
| `data-collection` | Data object, collection |
| `data-input`      | Data input              |
| `data-output`     | Data output             |
| `data-store`      | Data store              |
| `note`            | Text annotation         |

An artifact joined by an association to something that is not an artifact is drawn beside it.
The **first** association wins, so an artifact joined to two elements stands beside whichever
one it was joined to first.

## Flows

| Written          | Flow                    | Drawn as                                     |
| ---------------- | ----------------------- | -------------------------------------------- |
| `a --> b`        | Sequence flow           | Solid, filled head                           |
| `a -- yes --> b` | Sequence flow, labelled | Solid, filled head                           |
| `a -.-> b`       | Message flow            | Dashed, open head, hollow ring at the source |
| `a ..> b`        | Association, directed   | Dotted, open head                            |
| `a ... b`        | Association             | Dotted, no head                              |

Only the sequence flow takes a label, and only in the `-- text -->` form. There is no `|text|`
form, and no labelled form of `-.->`, `..>` or `...`.

Flows chain, and a chain may mix kinds: `a --> b --> c`. Both ends must be bare ids - an
element cannot be declared inside a flow.

```mermaid-example
bpmn-beta LR
  lane "Review"
    xor gw "Approved?"
    user task ship "Ship it"
    user task refund "Refund it"
  gw -- yes --> ship
  gw -- no --> refund
```

## Configuration

<!--@include: virtual:bpmnConfig -->

Colours come from `themeVariables.bpmn`, which is described on the [syntax page](./bpmn.md).

## Every BPMN 2.0 element, and what to write

**Supported** means the notation draws it and there is syntax for it. **Workaround** means the
shape is reachable, but not the thing BPMN means by it. **None** means there is nothing to
write yet.

### Events

| Element                          | Status    | Written                                                                               |
| -------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| Start event, plain               | Supported | `start s "..."`                                                                       |
| Start event, typed               | Supported | `start <trigger> s "..."`                                                             |
| Intermediate catch event         | Supported | `intermediate <trigger> i "..."`                                                      |
| Intermediate throw event         | Supported | `throw <trigger> i "..."`                                                             |
| End event                        | Supported | `end e "..."`                                                                         |
| Boundary event, interrupting     | Supported | `boundary <trigger> b "..."`, indented under an activity                              |
| Boundary event, non-interrupting | None      | The notation draws a dashed ring; every boundary event here is drawn solid            |
| Event sub-process                | None      | Its start triggers are accepted on any `start`, but the containment cannot be written |

### Activities

| Element                                                          | Status     | Written                                                                 |
| ---------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| Task, untyped                                                    | Supported  | `task t "..."`                                                          |
| User, service, script, manual, send, receive, business rule task | Supported  | `<type> task t "..."`                                                   |
| Sub-process, collapsed                                           | Supported  | `subprocess sp "..."`                                                   |
| Sub-process, expanded                                            | Workaround | Draw its steps in a `group`                                             |
| Call activity                                                    | Supported  | `call c "..."`                                                          |
| Transaction                                                      | None       | No syntax; `cancel` is accepted on any `boundary` or `end` in its place |
| Ad-hoc sub-process                                               | None       | -                                                                       |
| Loop marker                                                      | None       | The glyph exists but nothing can ask for it                             |
| Multi-instance marker, parallel or sequential                    | None       | As above                                                                |
| Compensation marker                                              | None       | As above                                                                |

### Gateways

| Element                                 | Status    | Written                        |
| --------------------------------------- | --------- | ------------------------------ |
| Exclusive gateway                       | Supported | `xor g "..."`                  |
| Parallel gateway                        | Supported | `and g "..."`                  |
| Inclusive gateway                       | Supported | `or g "..."`                   |
| Event-based gateway                     | Supported | `event-gateway g "..."`        |
| Complex gateway                         | Supported | `complex g "..."`              |
| Exclusive gateway without its marker    | None      | Both are drawn with the marker |
| Parallel or exclusive event-based start | None      | -                              |

### Flows and data

| Element                     | Status     | Written                                               |
| --------------------------- | ---------- | ----------------------------------------------------- |
| Sequence flow               | Supported  | `a --> b`                                             |
| Conditional flow            | Workaround | Label the flow out of a gateway: `g -- yes --> b`     |
| Default flow                | None       | The notation marks it with a tick; there is no syntax |
| Message flow                | Supported  | `a -.-> b`                                            |
| Association                 | Supported  | `a ..> b`, `a ... b`                                  |
| Data association            | Supported  | An association to or from a data artifact             |
| Data object, and collection | Supported  | `data`, `data-collection`                             |
| Data input, and output      | Supported  | `data-input`, `data-output`                           |
| Data store                  | Supported  | `data-store`                                          |

### Swimlanes and artifacts

| Element              | Status    | Written                            |
| -------------------- | --------- | ---------------------------------- |
| Pool, participant    | Supported | `pool p "..."`                     |
| Pool, black box      | Supported | `pool p "..."` with nothing inside |
| Lane                 | Supported | `lane l "..."`                     |
| Text annotation      | Supported | `note n "..."`                     |
| Group                | Supported | `group g "..."`, within one lane   |
| Group spanning pools | None      | A group is held by one lane        |

### Other diagram types

Choreography and conversation are separate BPMN diagram types with their own shapes. Neither
has syntax here.

## What the parser refuses

Reading stops at the first error, and the diagram is replaced by the error diagram. There are
four kinds.

**A word it cannot read.** `BPMN lexing error at line N: ...`

**A line it cannot parse.** `BPMN parse error at line N: ...`

**An event that does not say what it waits for.** Only `intermediate` and `boundary`:

```txt
BPMN error at line 3: a intermediate event must name what triggers it.
```

**A trigger at a position the notation does not draw it at**, which names where it does belong:

```txt
BPMN error at line 3: a start event cannot carry the terminate trigger.
The notation draws terminate on end events.
```

## What it does not check

These pass the parser and reach the drawing, where they show up as something looking wrong
rather than as a message:

- **A flow naming an element that does not exist.** It is passed to the layout as written.
- **Two elements sharing an id.** The later one is not reported.
- **Nesting that makes no sense**, such as a lane inside an event, or a boundary event whose
  parent is not an activity.

## Not drawn yet

Worth knowing before you reach for them:

- **Activity markers** - loop, multi-instance, ad-hoc and compensation. The glyphs are drawn
  and the renderer will place them, but nothing in the grammar can ask for one.
- **Non-interrupting boundary events**, which the notation draws with a dashed ring.
- **Event sub-processes and transactions**, whose absence is why two rows of the trigger
  matrix are wider than the notation.
- **A group spanning pools**, as in BPMN 2.0.2 figure 8.14.
- **Choreography and conversation diagrams.**

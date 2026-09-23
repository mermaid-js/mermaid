# Native BPMN Diagram for Mermaid — Design (Foundation Phase)

Status: design proposal / not yet implemented
Branch: `feat/bpmn-diagram`
Target: upstream PR to `mermaid-js/mermaid` (`develop`)
Author: rwspatin
Last updated: 2026-09-23

---

## 0. Executive summary

This document specifies an **AI-first** native BPMN diagram type for Mermaid: a
DSL that LLMs can generate reliably, a **forgiving parser**, and **actionable,
self-correcting error messages**. It is a design only — no diagram code is
written yet.

"AI-first" is our differentiator. Four independent BPMN efforts already exist
upstream (see §1.2), all readable text DSLs, but none makes *LLM
generation-and-repair* the primary design constraint. Our wedge is:

1. A **tiered grammar** where the easy case is flowchart-simple, and BPMN
   precision is opt-in — proven in an academic study to be the strongest
   predictor of LLM process-modeling quality (Brissard, Cuppens, Zouaq,
   *"What is the Best Process Model Representation?"*, arXiv:2507.11356, 2025 —
   Mermaid-style representations scored highest across six process-modeling
   criteria).
2. A **tolerant lexer** (synonyms, case-insensitive keywords, whitespace- and
   order-insensitive containment) so small LLM mistakes still parse.
3. **Semantic validation with exact, prescriptive error text** — every error
   names the offending line/id, states the rule, and gives a copy-pasteable fix,
   so an LLM (or human) can self-correct in one pass.
4. A **prompt-ready condensed spec** (§4) meant to be pasted into a system
   prompt so any model emits valid diagrams.

---

## 1. Landscape & what we do better

### 1.1 The upstream state (issues #2623, #7699, #8160)

- **#2623** — the canonical, 152-upvote demand issue. Maintainer `knsv` scoped
  the realistic first target as **BPMN 2.0 Level 1 (Descriptive Conformance)**
  and named the `swimlane-beta` layout engine as the precursor BPMN needs.
- **#7699** — `andreas-emrich`'s design proposal (`Status: Approved`,
  `Required Grooming`). Introduced the **tiered syntax** idea (simple
  flowchart-like layer → compact BPMN shorthand → verbose canonical). Maintainer
  `nabila401` pushed hard for progressive disclosure and a tight MVP.
- **#8160** — `filipsajdak`'s **`bpmn-beta` PR series (9 PRs)**: the most complete
  effort. Chevrotain parser, indentation-based containment, its own `swimlane`
  layout engine, all 13 event triggers, 5 gateways, 7 task types, pools/lanes,
  message flows, artifacts. Measured against the OMG example corpus: **1002 of
  1151 elements expressible, all 25 files render.** **No maintainer has reviewed
  any of it.**

**The real blocker is not code — it is three unanswered maintainer decisions**
(restated verbatim on #8160):

1. **Core diagram type or external plugin?** (`registerExternalDiagrams()` vs
   built-in). Several maintainers have said this is decided per-diagram; nobody
   has decided for BPMN.
2. **Which syntax wins?** Four candidates, none reviewed.
3. **How much scope?** Level 1 Descriptive vs the larger inventory #8160 already
   ships.

### 1.2 Prior art

| Effort | By | Form | Parser | Layout | Distribution |
|---|---|---|---|---|---|
| #7699 proposal | andreas-emrich | tiered (design only) | — | — | — |
| `@okhp3/mermaid-diagram-bpmn` | OKHP3 | concise keyword-position | hand-written line parser | direct SVG, no engine named | published npm external plugin |
| `mermaid-bpmn` editor | derari | — | — | — | GitHub Pages demo |
| **#8160 `bpmn-beta`** | filipsajdak | indentation containment | **Chevrotain** | own `swimlane` engine | 9 PRs vs `develop` |

Note: **the `bpmn-beta` keyword is already claimed** by both OKHP3 (npm) and
filipsajdak (PR). OKHP3 and filipsajdak *independently converged* on the same
keyword, keyword-position element type, and quoted-label form — a strong signal
that this surface shape is the natural one.

### 1.3 What we do better (and where we defer)

- **We adopt the converged surface** (keyword-position element types, quoted
  labels, indentation for containment) rather than inventing a fifth dialect —
  interop with the community's emerging consensus is more valuable than novelty.
- **We add the AI-first layer nobody else has committed to**: tolerant lexer,
  the self-correcting error catalogue (§3.3), and the prompt-ready spec (§4).
- **We scope the MVP to Level 1 Descriptive** (§2.9) — the target `knsv` named —
  and stage everything else, to be reviewable.
- **We do not fork the renderer/layout debate.** BPMN needs the same
  lane/pool layout `swimlane-beta` pioneered; we reuse that engine concept
  rather than build a third one (§5.4).

**Honest positioning:** if maintainers pick #8160, the right move may be to
**contribute the AI-first layer (tolerant lexer + error catalogue + prompt spec)
on top of that PR** instead of shipping a competing diagram. This is an open
question for the user (§8).

---

## 2. Language specification

### 2.1 Design principles

- **Keyword-position element type**: the type is its own token, not a
  bracket-encoded `type:` attribute. `task:user t1 "Review order"`, not
  `t1[type:task,subtype:user,label:Review order]`.
- **Tiered / progressive disclosure**: three authoring tiers that all
  normalize to **one internal BPMN model** before rendering.
- **Indentation expresses containment** (as mindmap / kanban / treeView do),
  but is *optional* — explicit `pool "x" { ... }` braces and flat `in pool`
  attributes are also accepted and normalize identically.
- **Advanced per-element config via `@{ ... }`**, matching flowchart, kanban,
  and usecase.

### 2.2 The three tiers

**Tier 0 — flowchart-simple (zero BPMN vocabulary).** Lowest barrier; maps to a
core subset by shape convention.

```mermaid
bpmn
  start --> review[Review Request] --> approved{Approved?}
  approved -- Yes --> accepted([Approved])
  approved -- No  --> rejected([Rejected])
```

Shape → BPMN mapping in Tier 0: `start`/`end` keywords → start/end events;
`id[Label]` → task; `id{Label}` → exclusive gateway; `id([Label])` → end event;
`-->` → sequence flow; `-- text -->` → labeled/conditional sequence flow.

**Tier 1 — BPMN-aware keyword-position (recommended default).** Precise BPMN
semantics, still concise.

```mermaid
bpmn
  start        s1 "Order received"
  task:user    t1 "Review order"
  xor          g1 "Approved?"
  task:service t2 "Charge card"
  end          e1 "Fulfilled"
  end          e2 "Rejected"

  s1 --> t1 --> g1
  g1 -- yes --> t2 --> e1
  g1 -- no  --> e2
```

**Tier 2 — containers (pools, lanes) via indentation.**

```mermaid
bpmn LR
  pool "Order handling"
    lane "Sales"
      start message s1 "Order received"
      task:user     t1 "Approve order"
      xor           g1 "Approved?"
    lane "Warehouse"
      task:service  t2 "Pick items"
      end           e1 "Shipped"
      end           e2 "Rejected"

  s1 --> t1 --> g1
  g1 -- yes --> t2 --> e1
  g1 -- no  --> e2
```

All three tiers may be **freely mixed** within a diagram.

### 2.3 Header & direction

```
bpmn [LR|RL|TB|BT]
```

- Keyword `bpmn` (see §5.2 for the `bpmn`/`bpmn-beta` keyword question).
- Direction default **`LR`** (BPMN convention: left→right process flow).
  Accepts `TB`/`TD` for top-down.
- Frontmatter (`---\nconfig:\n  bpmn: { ... }\n---`) and `%%{init}%%` supported
  as for every diagram.

### 2.4 Events  *(MVP: start/end + message & timer; scope table §2.9)*

Grammar: `<position> [<trigger>] <id> ["<label>"]`

- Positions: `start`, `intermediate` (throw/catch), `end`, `boundary` (later).
- Triggers (MVP): `none` (default), `message`, `timer`. Later: `signal`,
  `error`, `escalation`, `conditional`, `link`, `terminate`, etc.
- Catching triggers render **unfilled**, throwing triggers **filled**
  (BPMN 2.0.2 Table 10.93). `start`/`intermediate-catch` are catching;
  `end`/`intermediate-throw` are throwing.

```
start                 s1 "Start"
start message         s2 "Order received"
intermediate timer    i1 "Wait 2 days"
end                   e1 "Done"
end terminate         e2 "Abort"      %% later phase
```

### 2.5 Activities (tasks & subprocesses)

`task[:<subtype>] <id> ["<label>"]`

- Subtypes (MVP): `user`, `service`, `script`. Later: `manual`, `send`,
  `receive`, `businessRule`, `call`.
- Plain `task` with no subtype is an abstract task.
- **Subprocess (v2 / later)**: `subprocess <id> "<label>" { ... }` — an
  expanded container holding its own flow nodes; collapsed form
  `subprocess:collapsed`. Marked **later** in §2.9.

```
task         a1 "Do the thing"
task:user    a2 "Review"
task:service a3 "Call API"
task:script  a4 "Transform"
```

### 2.6 Gateways

`<kind> <id> ["<label>"]`

- `xor` (exclusive), `and` (parallel), `or` (inclusive), `event` (event-based).
  Synonyms in §3.1. `complex` — later.
- Conditions live **on the flow**, not the gateway: `g1 -- "amount > 100" --> t2`.
- A gateway may be marked **default** on one outgoing flow: `g1 -->|default| t3`
  or `g1 -- default --> t3`.

```
xor   g1 "Approved?"
and   g2            %% fork/join, usually unlabeled
event g3 "Wait for..."
```

### 2.7 Flows

| Syntax | Meaning |
|---|---|
| `a --> b` | sequence flow |
| `a -- "label" --> b` | labeled sequence flow / gateway condition |
| `a -->|default| b` | default flow (from xor/or gateway) |
| `a ==> b` | **message flow** (across pools only, dashed open-arrow) |
| `a -.- b` / `a -. "assoc" .- b` | association (to/from artifacts) |
| `a --> b --> c` | flow chains allowed |

### 2.8 Data objects, pools, lanes, message flows

```mermaid
bpmn LR
  pool "Customer"
    task:user c1 "Place order"
  pool "Supplier"
    start message s1 "Order received"
    task:service  t1 "Ship"
    end           e1 "Done"
    data          d1 "Invoice"          %% data object (MVP)
    datastore     ds1 "Orders DB"        %% data store (later)

  s1 --> t1 --> e1
  c1 ==> s1           %% message flow, crosses pools  (valid)
  t1 -.- d1           %% association to a data object
```

### 2.9 Scope: MVP vs later

| Element group | MVP (PR-1..PR-4) | Later phase |
|---|---|---|
| Containers | pool, lane (single level) | nested lanes, black-box participant, group |
| Events | start/end; triggers none/message/timer | intermediate throw/catch, boundary, all 13 triggers, event subprocess |
| Gateways | xor, and, or | event-based, complex |
| Activities | task, task:user/service/script | subprocess (expanded/collapsed), call activity, remaining task subtypes, markers (loop, multi-instance) |
| Flows | sequence, labeled/conditional, default, message flow | conditional-expression objects, association directions |
| Data/artifacts | data object | data store, data input/output, text annotation |
| Validation | §3.3 rules 1–9 | rule 10 (event-gateway targets), trigger/position matrix |
| Export | — | BPMN 2.0 XML (§6) |

MVP == **BPMN Level 1 Descriptive**, the target `knsv` named on #2623.

---

## 3. AI-first properties

### 3.1 Tolerant grammar (synonyms & normalization)

The lexer normalizes before the parser sees tokens, so LLM near-misses still
parse. All keywords are **case-insensitive**. Accepted synonyms
(canonical → accepted):

| Canonical | Accepted synonyms |
|---|---|
| `start` | `startEvent`, `begin` |
| `end` | `endEvent`, `stop`, `terminateEnd`(→`end terminate`) |
| `task` | `activity`, `step` |
| `task:user` | `usertask`, `task:human` |
| `task:service` | `servicetask`, `task:auto` |
| `xor` | `exclusive`, `exclusivegateway`, `x-gateway`, `decision` |
| `and` | `parallel`, `parallelgateway`, `fork`/`join` |
| `or` | `inclusive`, `inclusivegateway` |
| `event` | `eventgateway`, `event-based` |
| `message` | `msg` |
| `timer` | `time`, `clock` |
| `pool` | `participant` |
| `lane` | `swimlane` |
| `-->` seq flow | `->`, `→` |
| `==>` msg flow | `=>`, `~~>` |

Whitespace is insignificant between tokens; blank lines and trailing whitespace
are ignored; `%%` line comments allowed anywhere. Labels may be quoted
(`"..."`) or, in Tier 0 bracket forms, unquoted. Element declaration order and
flow-statement order are independent (a flow may reference an id declared later).

### 3.2 Deterministic output

Same source → byte-identical SVG (a requirement for LLM eval loops and
version-controlled docs):

- Nodes are emitted to the layout engine in a **stable canonical order**:
  declaration order, then pool → lane → node containment order.
- **Auto-generated ids** (for anonymous Tier 0 nodes) are deterministic:
  `__bpmn_<kind>_<n>` where `n` is the 1-based declaration index of that kind.
- Layout is seeded deterministically; ELK options are fixed constants
  (no time-, random-, or Map-iteration-order-dependent values).
- Theme color assignment for lanes is index-based (`lane-1..lane-n`), never
  hash-of-label.

### 3.3 Semantic validation — the self-correcting error catalogue

Every semantic error follows the shape:
`bpmn: <what is wrong>, naming the id/line. <the rule>. <the exact fix>.`
Errors are collected and reported **per element while the line is read** (never
a single opaque throw), carry line/column, and are phrased so an LLM can repair
in one pass. Canonical text below is the string the parser emits.

**Rule 1 — every flow node reaches an end event.**
> `bpmn: node 't3' has no path to an end event. In BPMN every flow node must reach at least one end event. Add an outgoing sequence flow from 't3', e.g. 't3 --> e1', or connect it to an existing node that already reaches an end.`

**Rule 2 — every flow node is reachable from a start event.**
> `bpmn: node 't3' is unreachable — no start event leads to it. Add an incoming sequence flow, e.g. 's1 --> t3', or remove 't3'.`

**Rule 3 — start events have no incoming, end events have no outgoing flow.**
> `bpmn: start event 's1' has an incoming sequence flow from 't2'. Start events begin a process and cannot be a flow target. Use an 'intermediate' event here, or make 's1' a task.`
> `bpmn: end event 'e1' has an outgoing sequence flow to 't2'. End events terminate a path and cannot have outgoing flows. Use an 'intermediate' event, or move the flow to start from an earlier node.`

**Rule 4 — gateway arity.**
> `bpmn: exclusive gateway 'g1' has 1 outgoing flow. A diverging gateway needs 2 or more outgoing sequence flows. Add another branch, e.g. 'g1 -- no --> e2', or replace 'g1' with a task if no decision is made here.`
> `bpmn: parallel gateway 'g2' has a condition 'amount > 100' on the flow to 't2'. Parallel gateways activate all branches unconditionally — conditions are not allowed. Remove the condition, or change 'g2' to 'xor' or 'or'.`

**Rule 5 — conditions only on flows leaving exclusive/inclusive gateways (or a default).**
> `bpmn: the flow 't1 -- "yes" --> t2' has a condition but 't1' is a task. Conditions belong on flows leaving an exclusive (xor) or inclusive (or) gateway. Insert a gateway, e.g. 't1 --> g1' then 'g1 -- yes --> t2'.`

**Rule 6 — at most one default flow per gateway.**
> `bpmn: exclusive gateway 'g1' has 2 default flows (to 'e1' and to 'e2'). A gateway may have at most one default flow. Keep 'default' on exactly one branch and give the other a condition.`

**Rule 7 — message flows cross pools; sequence flows stay within a pool.**
> `bpmn: message flow 'c1 ==> s2' connects two nodes in the same pool 'Customer'. Message flows may only cross pool boundaries. Use a sequence flow '-->' within a pool, or move one endpoint to another pool.`
> `bpmn: sequence flow 't1 --> t2' crosses from pool 'Supplier' to pool 'Customer'. Sequence flows stay inside one pool. Use a message flow '==>' between pools.`

**Rule 8 — lane/pool membership.**
> `bpmn: node 't1' is assigned to lanes 'Sales' and 'Warehouse'. A node belongs to exactly one lane. Declare 't1' under a single lane.`
> `bpmn: lane 'Sales' is declared outside any pool. Lanes must sit inside a pool. Wrap it, e.g. 'pool "Order handling"' then indent 'lane "Sales"'.`

**Rule 9 — referenced ids exist; ids are unique.**
> `bpmn: flow references unknown node 't9'. Declare it, e.g. 'task t9 "..."', or fix the id — did you mean 't1'?`
> `bpmn: duplicate id 't1' (first declared on line 4). Ids must be unique. Rename one, e.g. 't1b'.`

**Rule 10 (later) — event-based gateway targets.**
> `bpmn: event gateway 'g3' has an outgoing flow to task 't2'. An event-based gateway must be followed only by catching intermediate events or receive tasks. Change 't2' to 'task:receive' or an 'intermediate message' event.`

**Warnings (non-fatal, still render):** disconnected node not referenced by any
flow; pool with no start event; label longer than N chars (wrapping notice).

### 3.4 Why this is LLM-friendly (summary)

- Small vocabulary, positional types, no attribute dictionaries → fewer degrees
  of freedom to get wrong.
- Synonyms + case-insensitivity + order-independence → higher first-pass parse
  rate.
- Prescriptive errors with the exact fix string → single-pass self-repair in an
  agent loop; the error *is* the correction prompt.

---

## 4. Prompt-ready condensed spec (paste into a system prompt)

```
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

---

## 5. Rendering plan

### 5.1 Parser choice — Chevrotain, co-located (this is what the repo now requires)

Read directly from
`packages/mermaid/src/docs/community/new-diagram.md`:
> "New diagram grammars should use **Chevrotain**, co-located with the diagram
> itself under `packages/mermaid/src/diagrams/<diagram>/parser/` … Several
> existing diagrams (architecture, gitGraph, info, packet, pie, radar, treemap)
> instead use Langium grammars in `packages/parser`, and older diagrams use
> JISON. Both remain supported … but **neither is the target for new work**."

- **JISON** — `new-diagram-jison.md`: *"New diagrams with JISON grammars will
  not be accepted."* (One recorded exception: `agentflow`, argued in-code
  because it reuses flowchart's JISON lexer states verbatim. Not our situation.)
- **Langium** (`@mermaid-js/parser`) — still supported (eventmodeling uses it),
  but explicitly *not the target for new work*.
- **Decision: Chevrotain, co-located**, modeled on the **`usecase` diagram**
  (`packages/mermaid/src/diagrams/usecase/`), the one repo reference for the
  current guidance. This also matches #8160's independent choice, easing any
  future convergence with that effort.
- Shared runner: `diagrams/common/parser/runChevrotainParse.ts`. Errors must
  carry line/column (feeds §3.3).

The tolerant lexer (§3.1) is implemented as a Chevrotain **custom token
pattern / lexer mode**: synonyms map to canonical token types at lex time;
semantic validation (§3.3) runs as a post-parse pass over the internal model in
`bpmnDb`, not in the grammar, so error text stays prescriptive.

### 5.2 Keyword

- Preferred identity: **`bpmn`**. Mermaid convention during stabilization is a
  `-beta` suffix (`swimlane-beta`, `usecase-beta`, `agentflow-beta`), so the
  detector would ship as **`bpmn-beta`** and graduate to `bpmn` when stable.
- **Collision:** `bpmn-beta` is already used by OKHP3's npm plugin and
  filipsajdak's PR. **Open question (§8):** coordinate/adopt vs pick a distinct
  keyword (e.g. `bpmn-ai`) for parallel development. Resolve before any detector
  lands.

### 5.3 Files to create / modify

**Create — `packages/mermaid/src/diagrams/bpmn/`** (self-contained; never import
another diagram's internals — reviewers block on this):

| File | Purpose |
|---|---|
| `bpmnDetector.ts` | regex `^\s*bpmn(-beta)?` + lazy loader; exports `ExternalDiagramDefinition` `{ id, detector, loader }` |
| `bpmnDiagram.ts` | assembles `DiagramDefinition { db, renderer, parser, styles }` |
| `parser/bpmn.chevrotain.ts` | Chevrotain lexer + parser (tolerant tokens) |
| `parser/bpmnAst.ts` | AST → internal-model types |
| `bpmnParser.ts` | `parse()` wrapper: run Chevrotain → build model → run §3.3 validation → populate db |
| `bpmnDb.ts` | internal model + accessors; `get db()`/`clear()` full reset; re-export acc/title setters from `../common/commonDb.js`; `getConfig()` merges `bpmn` config |
| `bpmnTypes.ts` | `BpmnDB extends DiagramDBBase<BpmnDiagramConfig>`, element/flow/lane/pool types |
| `bpmnRenderer.ts` | build rendering-util `LayoutData` (nodes/edges/clusters) → `render()` → post-draw BPMN glyphs; `setupViewPortForSVG(...)`; handle/`look==='handDrawn'` |
| `bpmnShapes.ts` | BPMN SVG shapes (see §5.5) registered into the shapes map |
| `styles.ts` | `getStyles(options)` — all colors from theme `options`, none hardcoded |
| `*.spec.ts` | unit + parser + validation tests (§7) |

**Modify — registration & config:**

| File | Change |
|---|---|
| `packages/mermaid/src/diagram-api/diagram-orchestration.ts` | `import { bpmn } from '../diagrams/bpmn/bpmnDetector.js'`; add `bpmn` to `registerLazyLoadedDiagrams(...)` (order matters — first match wins) |
| `packages/mermaid/src/schemas/config.schema.yaml` | add `bpmn` to diagram-type enum, `bpmn: { $ref: '#/$defs/BpmnDiagramConfig' }`, and a `BpmnDiagramConfig` `$defs` block; then run `pnpm --filter mermaid run types:build-config` to regenerate `config.type.ts` (never hand-edit) |
| `packages/mermaid/src/defaultConfig.ts` | add `bpmn: { ...defaultConfigJson.bpmn }` |
| `packages/mermaid/src/themes/*` | add any new BPMN theme vars to **every** theme file |
| `.cspell/mermaid-terms.txt` | add BPMN keywords (pre-commit CSpell blocks otherwise) |
| `packages/mermaid/src/docs/syntax/bpmn.md` + `.vitepress/config.ts` | syntax docs + sidebar |
| `demos/bpmn.html` + `demos/index.html` | demo page + link |
| `packages/examples/src/...` | example entry |
| `e2e/diagrams/bpmn/*.mmd` + `e2e/sheet-order.json` | visual-regression fixtures |
| `.changeset/<slug>.md` | `'mermaid': minor` + `feat:` description |

Registration flow (confirmed): `diagram-orchestration.ts` →
`registerLazyLoadedDiagrams` → `addDetector` (in `detectType.ts`) populates the
detector map; on match the `loader()` runs and the loaded module calls
`registerDiagram(id, diagram, detector)` (in `diagramAPI.ts`), which stores the
`DiagramDefinition` and calls `addStylesForDiagram`.

`DiagramDefinition` shape (from `diagram-api/types.ts`):
`{ db, renderer, parser, styles?, init?, injectUtils? }`, where
`parser: { parse(text): void|Promise<void> }`,
`renderer: { draw, getClasses? }`, and the db extends `DiagramDBBase<Config>`.

### 5.4 Layout — the `swimlane` engine (primary), ELK layered (fallback)

BPMN needs **layered left-to-right flow inside horizontal lane/pool bands** — a
partitioned layered layout. This repo already ships two relevant layout engines;
after inspecting both, the **`swimlane` engine is the better primary target** (it
was purpose-built for lanes; `knsv` called it *"the precursor for BPMN"*), with
ELK as the nesting fallback.

**Path A (preferred): the existing `swimlane` layout engine.**
`packages/mermaid/src/rendering-util/layout-algorithms/swimlanes/` is a full
custom Sugiyama pipeline (phase1 cycle-break → phase2 layering/placement/
crossing-optimization → phase3 ordering → phase4 coordinates/lanes →
post-processing) with a dedicated **orthogonal edge router** and a `direction/`
module that handles **LR/RL/TB/BT** (rotating lane title bands, port swap,
terminal stubs) — exactly BPMN's needs. It is registered by default
(`registerDefaultLayoutLoaders()` always registers `'dagre'` and `'swimlane'`;
`'elk'` only when `includeLargeFeatures`). The `swimlane-beta` diagram consumes
it today via `createFlowDiagram({ styles })`, setting `layout: 'swimlane'`.
- A ready **`swimlane` cluster shape**
  (`rendering-util/rendering-elements/clusters/swimlane.js`) already paints a
  pool/lane visual: a rotated (-90° in LR) title band + body rect, hand-drawn
  support, per-lane color slots (`stampColorSlot`) — i.e. BPMN lane/pool bands
  come nearly for free.
- Lane-aware config knobs map straight onto BPMN: `ignoreCrossLaneEdges` (better
  ranks for cross-lane/pool message flows), `optimizeRanksByCrossings`,
  `automaticLaneOrdering` (default **false** — "source order can carry semantic
  meaning", which is exactly right for BPMN pools/lanes whose order is
  organizationally meaningful → deterministic, author-controlled band order).

**Known limitation (the main layout task): the swimlane engine is a _flat_ lane
model.** Today it only promotes **top-level** subgraphs (`isGroup && !parentId`)
to lanes — it does not support two-level **pool ⊃ lane ⊃ node** nesting. BPMN
needs that second level. Options:
1. Extend the swimlane engine's lane-detection (`helpers.ts` / `phase0`) to a
   second containment level (pools as bands-of-bands). Preferred — most of the
   machinery (title bands, LR transform, orthogonal router) is reused.
2. Treat a pool as one band and draw lane dividers inside it via the existing
   `divider` cluster shape (cheaper, less faithful).
This flat→nested extension is **the main layout risk/effort (§8, open Q5)** and
gets a dedicated spike in Milestone 2.

**Path B (fallback): ELK layered with container nesting.**
ELK (`rendering-util/layout-algorithms/elk/`) *does* support real arbitrary-depth
nesting: containers are nodes with `isGroup: true` + `parentId` + a `children[]`
tree, folded from the flat `nodes[]`; `elk.hierarchyHandling: 'INCLUDE_CHILDREN'`
lays out the whole nested tree in one pass; direction via `elk.direction: RIGHT`
(LR) / `DOWN` (TB); default algorithm `elk.layered`. So pool ⊃ lane ⊃ node works
directly. **But** ELK's container frames are generic rects (would need a new
lane-band cluster shape modeled on `swimlane.js`), and ELK has **no first-class
fixed-swimlane-order / partition** primitive (no Graphviz-style `rank=same`
clusters) — band order can only be *approximated* via
`crossingMinimization.strategy: NONE|INTERACTIVE` and per-node `layerConstraint`.
Use ELK only if extending the swimlane engine to two levels proves too costly.

**Milestone-2 spike decides A-extended vs B**, recorded in the PR. Default
assumption: **Path A extended to two levels.**

`LayoutData` node/edge model we populate (from `rendering-util/types.ts`):
nodes carry `{ id, label?, parentId?, isGroup?, dir?, shape?, width?, height?,
layer?, order?, metadata? }` (discriminated `ClusterNode | NonClusterNode` on
`isGroup`); edges carry `{ id, start?, end?, label?, arrowTypeStart?,
arrowTypeEnd?, parentId?, labelNodeId?, isLayoutOnly? }`. Renderers resolve the
engine via `getRegisteredLayoutAlgorithm(getConfig().layout)` and set
`data4Layout.direction = db.getDirection()` before `await render(...)`.

### 5.5 BPMN shapes (SVG)

Custom shapes register into the shapes map at
`rendering-util/rendering-elements/shapes.ts` (`shapesDefs` array →
`generateShapeMap()`). Several BPMN primitives already have shapes we can reuse
or adapt: `circle`, `doubleCircle`, `filledCircle`, `crossedCircle`, `hexagon`,
`forkJoin`, `datastore`, `document`, `dividedRect`. New BPMN glyphs to add in
`bpmnShapes.ts`:

| BPMN element | Shape |
|---|---|
| Event (start/end/intermediate) | circle; thin ring (start), thick ring (end), double ring (intermediate); trigger glyph inside, unfilled=catch / filled=throw |
| Task | rounded rectangle; small type icon top-left (user=person, service=gear, script=page) |
| Gateway | diamond; marker inside (xor=×, and=+, or=○, event=pentagon) |
| Pool | large labeled band; rotated title on the leading edge |
| Lane | sub-band inside a pool; rotated title |
| Data object | page with folded corner |
| Data store | cylinder (`datastore`/`cylinder`) |

**Container shapes register separately** from node shapes: pools/lanes are
*cluster* shapes in `rendering-util/rendering-elements/clusters.js` (map keys
`rect`, `roundedWithTitle`, `divider`, `kanbanSection`, `flowGroup`,
`usecaseSystemBoundary`, **`swimlane`**). The existing **`swimlane`** cluster
shape already draws a rotated title band + body and is the one to reuse/extend
for BPMN pools and lanes; node shapes above go in `shapes.ts`'s `shapesDefs`.

Edge markers: message flow needs an **open arrowhead + hollow source ring**, and
associations need a fine dashed line — #8160 added exactly these as additive
edge markers in `rendering-util`; we add equivalents.

### 5.6 Theming hooks

- `styles.ts` exports `getStyles(options)`; **every** color derives from theme
  `options` (e.g. `nodeBorder`, `mainBkg`, `lineColor`, plus new BPMN vars).
- New theme vars (e.g. `bpmnLaneBkg`, `bpmnPoolBorder`, `bpmnMessageFlow`) added
  to **all** files in `src/themes/`.
- Lane background colors index-based for determinism (§3.2).
- CSS class hooks: `.bpmn-event`, `.bpmn-task`, `.bpmn-gateway`, `.bpmn-pool`,
  `.bpmn-lane`, `.bpmn-messageflow`, per-lane `.lane-<n>`.

---

## 6. Optional: BPMN 2.0 XML export (later phase)

Round-tripping to BPMN 2.0 XML (with DI so a diagram opens in bpmn.io / Camunda
Modeler) is **out of MVP scope** and arguably out of Mermaid conventions
(Mermaid renders; it is not an interchange tool — the OKHP3 prototype explicitly
scopes XML round-trip *out*). filipsajdak stages it as phase "C" and raises
"where should it live — this repo or a separate package?" as an open question.

**Recommendation:** ship export as a **separate opt-in package/utility**
(`@mermaid-js/bpmn-export` or a `toBpmnXml(db)` function), not in the core render
path. It consumes the same internal model `bpmnDb` produces, emitting
`<bpmn:process>` + `<bpmndi:BPMNDiagram>` from post-layout coordinates. Deferred
until MVP + Level 2 land and only if there is demand.

---

## 7. Implementation plan (PR-sized milestones)

Each milestone is independently reviewable, green on CI, with a changeset.
Target branch `develop`. Open a **draft PR / discussion early** (maintainers
asked for this on #7699/#8160) to settle the §8 decisions **before** heavy work.

**Milestone 0 — alignment (no code).** Post on #2623/#8160 stating the AI-first
angle; ask maintainers to decide core-vs-plugin, keyword, and scope. Do not
build a competing diagram if #8160 is chosen — offer the AI-first layer on top.

**Milestone 1 — grammar + db + validation (headless).**
Chevrotain parser (Tier 0 + Tier 1: start/end, task subtypes, xor/and/or,
sequence + conditional flows), internal model, tolerant lexer (§3.1),
validation rules 1–6, 9 (§3.3). *No rendering yet.*
Tests: vitest parser specs (valid + every error string), determinism test
(same input → same model), synonym/whitespace table (`it.each`).

**Milestone 2 — rendering (single pool) + layout spike.**
ELK layered LR, event/task/gateway shapes, sequence/conditional/default flows.
Spike ELK partitioning vs `swimlane` engine (§5.4) and record the decision.
Tests: `e2e/diagrams/bpmn/*.mmd` fixtures (Argos/Playwright), renderer unit
spec, docs-example spec.

**Milestone 3 — pools, lanes, message flows, data objects.**
Tier 2 containers, `parentId` nesting, lane bands, `==>` message flow with
open-arrow/hollow-ring markers, associations, data object shape.
Validation rules 7, 8. Full multi-pool fixtures.

**Milestone 4 — docs, demo, examples, polish, prompt-spec.**
`syntax/bpmn.md` (with the §4 prompt-ready block), `demos/bpmn.html`, examples
entry, cspell terms, theming across all theme files, handDrawn look, changeset.

**Later phases (separate PRs):** intermediate/boundary events + full trigger
matrix + position/trigger validation (rule 10) · subprocess/call activity ·
event-based & complex gateways · activity markers · BPMN XML export (§6).

### 7.1 Test strategy (repo's actual patterns)

- **Unit (vitest):** `*.spec.ts` beside the code; drive via `mermaidAPI.parse` /
  the db. Assert the internal model and **the exact §3.3 error strings**.
- **Parser tests:** `it.each([...])` over whitespace/synonym/mutation variants
  of valid syntax (radar/eventmodeling pattern); a table of invalid inputs →
  expected error text.
- **Visual regression — Playwright + Argos (NOT Cypress).** The repo has
  **migrated off Cypress**; there is no `cypress/` dir. Fixtures are
  `e2e/diagrams/bpmn/*.mmd`, globbed by `e2e/rendering/mmd-snapshots.spec.ts`
  (`imgSnapshotTest` from `e2e/helpers/util.ts`); flattened fixture names must be
  unique tree-wide. Custom assertions (e.g. lane/pool counts, marker presence)
  go in `e2e/rendering/bpmn/bpmn.spec.ts` (eventmodeling/swimlanes pattern:
  `imgSnapshotTest` + a callback checking `svg.locator('.bpmn-pool').count()`).
  Ordering via `e2e/sheet-order.json`. Run: `pnpm e2e`.
- **Docs-example spec:** `bpmn.docs.spec.ts` parses every `mermaid-example`
  block in `syntax/bpmn.md` so docs cannot drift from the grammar.
- **Determinism test:** render twice, assert byte-identical SVG (minus random
  ids); this is our AI-first eval guarantee.
- Lint/format: `eslint` + `prettier` + CSpell via Husky pre-commit; changeset
  required (`'mermaid': minor`, `feat:`). No CLA/DCO found. PRs → `develop`.

---

## 8. Open questions (need the user's decision)

1. **Compete or collaborate with #8160?** filipsajdak's `bpmn-beta` series is far
   along (9 PRs, Chevrotain, own swimlane engine, 1002/1151 OMG elements) but
   **unreviewed**. Options: (a) build our own diagram with the AI-first layer as
   the differentiator; (b) contribute the AI-first layer (tolerant lexer + error
   catalogue + prompt spec + determinism tests) **on top of #8160**; (c) publish
   an external plugin first (like OKHP3) to iterate fast, then upstream.
   **My recommendation: (b) if maintainers signal #8160 is the base; otherwise
   (a).** Which do you want?
2. **Keyword collision.** `bpmn-beta` is taken (OKHP3 npm + #8160). Adopt/coord,
   or pick a distinct keyword (`bpmn-ai`?) for parallel work until upstream
   decides? 
3. **Core diagram vs external plugin.** This is the maintainers' unanswered
   architectural call. Do we wait for their answer (risking stall), ship an
   external plugin now (fast, no gatekeeping), or open a draft core PR to force
   the decision?
4. **Scope for the first PR.** Confirm MVP = **Level 1 Descriptive** (§2.9). Ship
   any intermediate/boundary events in v1, or strictly start/end?
5. **Layout engine.** Accept the plan in §5.4 — **primary = the existing
   `swimlane` engine extended to a second (pool ⊃ lane) nesting level**, ELK as
   fallback for deep nesting? The flat→nested extension is the single biggest
   layout task; the alternative is ELK's real nesting at the cost of building a
   lane-band cluster shape and approximating fixed band order. Confirm the
   default (extend swimlane) before Milestone 2.
6. **BPMN XML export.** Worth pursuing at all, and if so, separate package
   (§6)? Or explicitly out of scope forever?
7. **Effort ceiling.** How much of your time/budget for this — MVP-and-stop, or
   drive to a merged upstream PR including the (contentious, unreviewed)
   maintainer negotiation?
```

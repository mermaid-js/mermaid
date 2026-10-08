---
title: Mermaid Grid Layout Label-Aware Spacing
document_type: implementation-plan
status: implemented
owners:
  - Mermaid layout maintainers
target_branch: timmy/grid-layout-rendering
implementation_scope: packages/mermaid/src/rendering-util/layout-algorithms/grid
---

# Mermaid Grid Layout Label-Aware Spacing

## 1. Executive Summary

Grid layout already measured edge-label helper nodes before core layout, but previously excluded
those helpers from placement and track sizing. A simple labelled edge between adjacent cells could
therefore receive only the configured 50 px gap even when its measured label needed more than
100 px. Routing finished before label placement, so `positionGridEdgeLabels` could recover only by
replacing a short direct route with a generic detour. The same recovery path turned a compact
self-loop into a much longer, multi-bend route.

The implementation adds two narrowly scoped, deterministic geometry inputs:

1. **Per-boundary minimum gaps** for labelled edges whose endpoints are direct children of the same
   container and occupy adjacent tracks in the same row or column.
2. **Label-aware self-loop candidates** whose U-shaped outer leg is sized for the measured label
   before generic label detouring is considered.

The configured `rowGap` and `columnGap` remain global defaults. Label requirements only raise the
specific occupied-track boundary that needs space. Existing post-routing label placement remains
the correctness fallback for non-adjacent edges, hierarchy routes, competing labels, obstacles, and
any case not proven safe by the pre-layout analysis.

No iterative layout convergence loop is required. Measurements, resolved placements, and boundary
requirements are all available before geometry is materialized, so sizing and routing each still
run once. The existing bounded two-pass label-placement transaction remains in place.

## 2. Problem Statement and Evidence

### 2.1 Current pipeline

The relevant pipeline is:

1. `prepareGridLayout` creates an edge-label helper node and the renderer measures it.
2. `runGridLayoutCoreInPlace` builds the forest and resolves placements.
3. `layoutContainer` filters `isEdgeLabelNode` children and sizes tracks using only placed items.
4. `materializeAbsoluteGeometry` finalizes node and container coordinates.
5. `routeGridEdges` routes against final geometry.
6. `positionGridEdgeLabels` places labels, reroutes foreign edges, and finally detours owner edges.

Before this change, label helpers did not contribute to step 3, so step 6 could not increase node
separation.

### 2.2 Reproduction

Two automatic 80×40 nodes use compact square, row-major placement and occupy adjacent columns,
including for a `flowchart TB` input. With the default 50 px `columnGap`, a 90×20 label and the
current conservative 12 px terminal reservations need:

```text
90 label width + 12 px start reservation + 12 px end reservation + 2 px span margin = 116 px
```

The explicit margin is required because label-center interval construction rejects touching blocked
intervals; sizing to exactly 114 px leaves no feasible center. The current 50 px segment instead
falls through to generic extended detouring:

```text
(80,20) → (92,20) → (92,-27) → (54,-27) → (54,-11)
→ (156,-11) → (156,-27) → (118,-27) → (118,20) → (130,20)
```

A self-loop begins as a compact U. When its outer segment does not fit the measured label, generic
detouring splices extra geometry into a short terminal-adjacent segment, producing roughly nine
segments instead of expanding the loop as a unit.

### 2.3 Safety baseline

Implementation must build on, and must not weaken or revert:

- `d8b8a3db2` — terminal-axis outline clipping;
- `208450a30` — unrelated-edge corridor occupancy avoidance;
- `ed9ac2d10` — 24 px clearance for unrelated parallel runs while allowing perpendicular point
  crossings;
- `86b01fc0c` — self-loop candidate conflict rejection and distinct lanes.

## 3. Goals

| ID   | Goal                                                                   | Measure                                                                                                    |
| ---- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| G-01 | Keep a simple labelled edge between adjacent horizontal tracks direct. | The two-node 80×40 / 90×20 fixture routes without a generic owner-edge detour and the label validates.     |
| G-02 | Support the equivalent vertical adjacency case.                        | The effective row boundary fits the measured label height and the route remains direct.                    |
| G-03 | Simplify labelled self-loops holistically.                             | A fitting label is placed on an expanded outer U leg; no generic extended detour is used.                  |
| G-04 | Preserve geometry safety.                                              | Node, group, group-title, label, own-route, foreign-edge, and marker-clearance validation remains green.   |
| G-05 | Limit layout expansion.                                                | Only boundaries with an eligible label requirement grow; unrelated boundaries retain configured gaps.      |
| G-06 | Preserve deterministic output.                                         | Repeated equivalent inputs produce byte-equivalent node and edge geometry.                                 |
| G-07 | Preserve bounded execution.                                            | One placement-analysis pass, one sizing pass, one routing pass, and at most the existing two label passes. |
| G-08 | Preserve graceful fallback.                                            | Ineligible or obstructed routes continue through existing routing and label-detour behavior.               |

## 4. Non-Goals

- Changing compact row-major auto-placement or making it depend on flowchart direction.
- Treating label helper nodes as ordinary grid items or assigning them cells.
- Guaranteeing a detour-free route for non-adjacent, diagonal, cross-container, or hierarchy edges.
- Packing every parallel/reverse label into one boundary without post-routing conflict handling.
- Replacing the sparse router, compatibility router, or existing two-pass label transaction.
- Changing user-facing grid syntax or adding a label-spacing configuration option.
- Reverting terminal clipping, self-conflict rejection, lane separation, or route validation.
- Performing a general rewrite of the large `edgeLabels.ts` fallback pipeline.

## 5. Assumptions and Alternative Interpretations

| ID     | Type        | Statement                                                                                                  | Resolution                                                                                                                                                                            |
| ------ | ----------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASM-01 | Assumption  | Label helper width and height are final, finite, positive measurements when core layout starts.            | Use only helpers passing `isFinitePositiveNumber`; otherwise preserve current no-preallocation behavior and let existing label handling decide the outcome.                           |
| ASM-02 | Assumption  | Only occupied rows and columns are physical tracks; authored index gaps do not create empty geometry.      | “Adjacent” means consecutive entries in the container's sorted occupied-track list, not numeric indices differing by one.                                                             |
| ASM-03 | Assumption  | A boundary minimum may override an explicitly configured zero or small gap for an eligible measured label. | Treat authored gaps as defaults, not hard maxima. Document and test this intentional behavior.                                                                                        |
| ASM-04 | Assumption  | Existing route and label validators are the final safety authority.                                        | Preallocation is an optimization and geometry input, not permission to bypass validation.                                                                                             |
| ASM-05 | Assumption  | Edge source order plus UTF-16 edge-ID comparison is the stable ordering contract.                          | Use that order for requirement aggregation and equal-score self-loop candidates.                                                                                                      |
| ALT-01 | Alternative | Raise global `rowGap`/`columnGap` to the largest label.                                                    | Rejected: one wide label would expand every boundary and nested container, causing a large compatibility blast radius.                                                                |
| ALT-02 | Alternative | Add label helper nodes to grid placement.                                                                  | Rejected: helpers would consume cells, change auto-placement, and conflate label reservations with authored content.                                                                  |
| ALT-03 | Alternative | Run layout, route, detect failed labels, then resize and rerun until stable.                               | Rejected: duplicates expensive work, complicates rollback/instrumentation, and risks convergence and determinism defects.                                                             |
| ALT-04 | Alternative | Always rely on generic label detours.                                                                      | Rejected: this is the current source of excessive segments and cannot move finalized nodes.                                                                                           |
| ALT-05 | Alternative | Sum all label widths/heights on a shared boundary.                                                         | Rejected: parallel routes do not necessarily place labels end-to-end. Summing causes unbounded whitespace; use the maximum individual requirement and retain conflict-aware fallback. |

## 6. Functional Requirements

### 6.1 Pre-geometry spacing analysis

| ID    | Requirement                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-01 | Resolve direct-item placements exactly once inside each `layoutContainer` call, then derive that container's boundary requirements from those resolved cells before calculating dimensions and origins.                                    |
| FR-02 | Build a labelled-edge/helper index once before children-first container sizing; each container consumes only edges whose endpoints are direct children in its resolved cells.                                                              |
| FR-03 | Match a labelled edge to its measured helper through `edge.labelNodeId`; do not infer labels from text after preparation has cleared `edge.label`.                                                                                         |
| FR-04 | Consider a non-self edge eligible only when both endpoints exist, are direct placed children of the same container, and have finite measured label dimensions.                                                                             |
| FR-05 | A horizontal requirement exists when endpoints share a resolved row and their columns are consecutive occupied columns. A vertical requirement exists when endpoints share a resolved column and their rows are consecutive occupied rows. |
| FR-06 | Shared-cell, diagonal, non-adjacent, and cross-container edges create no boundary requirement. Existing routing and label fallback continue unchanged for them.                                                                            |
| FR-07 | Keep requirements in per-container maps keyed by the lower occupied track of a consecutive pair (`rowGapAfter`/`columnGapAfter`). Per-container ownership supplies container and axis identity without a second global key.                |

### 6.2 Required span and marker clearance

The implementation must move label/terminal reservation constants or calculations into one shared
grid-label geometry helper so sizing and placement cannot silently diverge.

For a candidate segment with along-axis label size `L`:

```text
startInset = max(LABEL_CLEARANCE, start terminal reservation)
endInset   = max(LABEL_CLEARANCE, end terminal reservation)
requiredAlongSpan = L + startInset + endInset + LABEL_SPAN_MARGIN
effectiveBoundaryGap = max(configuredGap, maximum requiredAlongSpan for boundary)
```

Requirements:

| ID     | Requirement                                                                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-08  | Use label width for a horizontal edge/column boundary and label height for a vertical edge/row boundary.                                                                                       |
| FR-08A | Add one shared `LABEL_SPAN_MARGIN` (initially 2 px) after terminal insets. The resulting boundary must produce a non-empty center-candidate interval, not merely make blocked intervals touch. |
| FR-09  | Derive terminal reservations from the same policy used by label placement and validation; do not create an independent “magic” marker allowance in track sizing.                               |
| FR-10  | A terminal reservation subsumes ordinary label clearance at that terminal via `max`, rather than double-counting both.                                                                         |
| FR-11  | Aggregate multiple eligible edges on one boundary with deterministic `max`, not sum. Reverse edge direction must map to the same canonical boundary key.                                       |
| FR-12  | Reject non-finite arithmetic from preallocation. Do not publish `Infinity`/`NaN` coordinates; preserve the existing transactional failure/fallback behavior.                                   |

Under the currently conservative 12 px terminal reservation at both route ends and a 2 px span
margin, the 90 px example reserves 116 px. If marker policy is made terminal-type-aware during
implementation, the shared helper must be used by both sizing and label placement and covered by
matching tests.

### 6.3 Per-boundary sizing

| ID    | Requirement                                                                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-13 | Keep `config.rowGap` and `config.columnGap` unchanged as normalized user defaults.                                                                                                                                                                                                               |
| FR-14 | Store effective gaps in an internal per-container plan as `gap between current occupied track and next occupied track`; do not add a public configuration surface.                                                                                                                               |
| FR-15 | Use effective per-boundary gaps in content width/height reduction and track-origin cursor increments. Existing midpoint corridor calculations then inherit the moved origins; do not duplicate gap adjustments in corridor code.                                                                 |
| FR-16 | Do not change outer-corridor margin or route-occupancy calculations unless an eligible self-loop explicitly requires a larger outer route. Internal boundary expansion must naturally move downstream tracks and their corridors; occupancy must continue to index the final routed coordinates. |
| FR-17 | Group sizing remains children-first. A requirement between direct children inside a group expands that group; ancestors then measure the expanded group normally.                                                                                                                                |
| FR-18 | Requirements do not cross a containment boundary. An edge between descendants of different groups or between different hierarchy levels remains a routing/label fallback case.                                                                                                                   |

### 6.4 Multiple, parallel, and reverse edges

| ID    | Requirement                                                                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-19 | Parallel and reverse labels sharing a boundary contribute their maximum individual span.                                                                                                                                         |
| FR-20 | Existing bundle ports, distinct lanes, placed-label reservations, foreign-edge rerouting, and individual-label fallback remain responsible for label-to-label conflicts.                                                         |
| FR-21 | A shared boundary may still produce a detour when labels cannot coexist, a lane is obstructed, or the route chosen by the router is not the anticipated direct segment. This is a valid genuine-detour case, not sizing failure. |

### 6.5 Label-aware self-loops

Self-loops do not enlarge an internal row/column boundary. Their measured requirement must instead
be supplied to self-loop candidate generation.

| ID    | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-22 | For left/right loop sides, synthesize an explicit expanded-U candidate whose outer vertical leg fits label height plus clearances and whose depth puts the label's horizontal extent outside the owner.                                                                                                                                                                                                                                                                      |
| FR-23 | For top/bottom loop sides, synthesize an explicit expanded-U candidate whose outer horizontal leg fits label width plus clearances and whose depth puts the label's vertical extent outside the owner.                                                                                                                                                                                                                                                                       |
| FR-24 | Preserve the existing index-based approach depth, port offset, track gap, and lane separation as minima. Label-aware dimensions may increase them, never shrink them.                                                                                                                                                                                                                                                                                                        |
| FR-25 | Prefer a side where the expanded outer leg can be produced with legal, distinct ports. Preserve fixed side ordering and existing side-load ordering for ties.                                                                                                                                                                                                                                                                                                                |
| FR-26 | If the expanded U cannot use legal owner-side ports, evaluate one bounded symmetric shoulder candidate per side. This is expected to be common for wide labels on short node sides, not an exceptional unbounded fallback.                                                                                                                                                                                                                                                   |
| FR-27 | Use one shared candidate-synthesis helper for sparse and compatibility paths. The sparse path must validate the synthesized U/shoulder with existing same-container, pair-route, obstacle, marker, and applicable route-occupancy checks before falling back to overlay search; changing sparse attachment coordinates alone is insufficient because A\* owns depth.                                                                                                         |
| FR-28 | Run every expanded loop through existing obstacle, pair-route, self-crossing, near-parallel conflict, and marker-clearance checks introduced or strengthened by the safety baseline in Section 2.3.                                                                                                                                                                                                                                                                          |
| FR-29 | If no expanded loop candidate validates, preserve generic label detouring and ultimately `GRID_ROUTE_NOT_FOUND` rollback behavior. Do not commit an unsafe simple loop.                                                                                                                                                                                                                                                                                                      |
| FR-30 | Preserve the corridor-occupancy policy from `208450a30` and `ed9ac2d10`: routes that currently participate must still avoid overlapping or less-than-24 px parallel runs with unrelated edges when possible, while perpendicular point crossings remain legal. Keep the same bounded fast-path behavior for large layouts, register only committed final coordinates, and restore occupancy on bundle rollback. Label spacing must not introduce a parallel occupancy model. |

The common fitting case should remain a normalized U with three segments. The bounded shoulder form
may use additional symmetric bends, but remains a whole-loop candidate and must be evaluated before
generic extended detours.

## 7. Architecture and Design

### 7.1 New internal data model

Add internal types, names subject to repository conventions:

```ts
interface GridContainerLabelGaps {
  rowGapAfter: Map<number, number>;
  columnGapAfter: Map<number, number>;
}

interface GridLabelSpanRequirement {
  along: number;
  cross: number;
  startInset: number;
  endInset: number;
}
```

The gap maps are local to one `layoutContainer` invocation unless tests demonstrate a concrete
second consumer. Do not add placement-plan state to `GridLayoutResult` merely for this feature.

### 7.2 Analysis algorithm

```text
build forest/config/source order and one labelled-edge/helper index
for each container during children-first sizing:
  resolve direct non-label items once
  initialize every occupied boundary to its configured gap
  inspect indexed labelled edges whose endpoints are direct children
  if endpoints share a row and consecutive occupied columns:
    columnGapAfter[leftColumn] = max(existing, required horizontal span)
  else if endpoints share a column and consecutive occupied rows:
    rowGapAfter[topRow] = max(existing, required vertical span)
  skip preallocation when the label's cross-axis extent collides with another occupied track

for groups in post-order, then root:
  size using resolved cells and boundary gaps
materialize absolute geometry once
route once, consuming self-loop requirements from the labelled-edge/helper index
place labels with existing bounded transaction
```

### 7.3 Pipeline ordering

The target sequence is:

1. Build forest and normalized configuration.
2. Resolve and cache placements.
3. Derive label boundary and self-loop requirements.
4. Size groups children-first and root last.
5. Materialize absolute geometry.
6. Route edges, including label-aware self-loop candidates.
7. Position labels and perform existing bounded recovery.
8. Commit cloned working geometry only after all phases succeed.

**No second sizing or whole-graph routing pass is used.** A bounded second pass would add cost
without new information: label sizes and endpoint placements are known before sizing. The only
bounded retries remain candidate evaluation inside routing and the existing maximum of two label
passes.

### 7.4 Determinism

- Resolved placements and labelled-edge analysis use existing source-order/ID comparators.
- Occupied tracks are numeric ascending.
- Boundary keys canonicalize low/high tracks and ignore edge direction.
- `max` aggregation is order-independent; instrumentation records are emitted in stable edge order.
- Route occupancy remains container-scoped and route-order-sensitive by design. Expanded geometry
  changes coordinates, not the existing ordering, pair-key, registration, or rollback contract.
- Self-loop side order, load counts, edge route order, and candidate tie-breaks remain unchanged
  except that an invalid too-small candidate is replaced by its deterministic expanded equivalent.
- No object iteration order may decide between equal candidates.

### 7.5 Error and rollback behavior

- Continue cloning before core layout and committing only a completed run.
- Missing/unmeasured helpers do not affect track spacing and retain existing downstream behavior.
- Invalid endpoint references retain existing grid errors.
- Expanded self-loop candidate rejection is non-destructive; counts, route state, and transactional
  metrics are updated only when a candidate commits.
- Resource-cap fallback receives the same label requirement and validates the result.
- Exhausted safe candidates end in the existing `GRID_ROUTE_NOT_FOUND`; no partially expanded node,
  route, label, or instrumentation state leaks to caller-owned data.

## 8. Instrumentation and Performance Budgets

Extend existing grid routing instrumentation rather than introduce a second top-level metrics
object. Add counters with explicit cumulative/transactional disposition:

| Counter                          | Disposition   | Contract                                                                                      |
| -------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `labelSpacingEdgesExamined`      | cumulative    | At most the number of labelled edges.                                                         |
| `labelSpacingEligibleEdges`      | cumulative    | At most `labelSpacingEdgesExamined`.                                                          |
| `labelSpacingBoundariesExpanded` | cumulative    | Number of boundaries whose effective gap exceeds config during the successful sizing attempt. |
| `labelSpacingPixelsAdded`        | cumulative    | Sum of effective-gap deltas during sizing, for diagnostics only.                              |
| `labelAwareSelfLoopCandidates`   | cumulative    | Bounded by sides × fixed candidate forms per labelled self-loop.                              |
| `labelAwareSelfLoopsCommitted`   | transactional | At most the number of labelled self-loops.                                                    |
| `labelAwareSelfLoopFallbacks`    | cumulative    | Counts loops for which expanded candidates did not validate.                                  |

Budgets and invariants:

- Placement resolution: exactly once per container.
- Preallocation time: `O(V + E + B)`, where `B` is occupied boundaries.
- Additional memory: `O(V + B + Ls)`, where `Ls` is labelled self-loops.
- No pixel/span-sized allocation and no coordinate-magnitude-dependent loop.
- At most four primary side candidates plus one bounded shoulder form per side for each self-loop.
- No new whole-graph topology build, A\* invocation, route pass, or label pass.
- Existing 1,000-node/500-edge structural caps remain unchanged.
- Add a large labelled-adjacency fixture proving boundary analysis is linear by counters. Its
  preprocessing counters must be bounded by edges/boundaries, with zero full node/edge rescans.
- The existing local, non-CI 1-second large-layout wall-clock budget must continue to pass. Add a
  comparable labelled fixture only if it is stable in the current harness; structural counters are
  the CI gate.

## 9. Validation Invariants

Every implementation item must preserve:

| ID     | Invariant                                                                                                                                                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INV-01 | Every published coordinate and dimension is finite.                                                                                                                                                                                                       |
| INV-02 | Effective internal gaps are never below normalized configured gaps.                                                                                                                                                                                       |
| INV-03 | An ineligible edge cannot change any node position or container dimension.                                                                                                                                                                                |
| INV-04 | A boundary changes only from eligible edges mapped to that exact container/axis/track pair.                                                                                                                                                               |
| INV-05 | Label rectangles do not overlap protected node interiors, group titles, prohibited group borders, or their own marker reservations.                                                                                                                       |
| INV-06 | Routes remain orthogonal and pass existing route validation.                                                                                                                                                                                              |
| INV-07 | Expanded self-loops have no non-adjacent crossing, collinear overlap, or forbidden near-parallel conflict.                                                                                                                                                |
| INV-08 | Parallel/reverse/self-loop endpoint lanes remain distinct where current routing guarantees them.                                                                                                                                                          |
| INV-09 | Terminal points remain on legal owner outlines and retain terminal-axis clipping behavior.                                                                                                                                                                |
| INV-10 | Failed attempts restore route points, label positions, lane counts, and transactional metrics.                                                                                                                                                            |
| INV-11 | The same normalized input produces byte-equivalent geometry across repeated runs.                                                                                                                                                                         |
| INV-12 | Routes covered by the unrelated-edge occupancy policy do not newly overlap or run parallel within 24 px in layouts where the policy requires separation. Perpendicular point crossings and the existing bounded large-layout relaxation remain unchanged. |

## 10. Test Plan

### 10.1 Core and integration tests

| ID   | Fixture                                                                                                          | Assertions                                                                                                                                                                                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01 | Two automatic 80×40 nodes, default 50 px gap, 90×20 label.                                                       | Only their column boundary grows; route is direct/minimal, label is finite and valid, no extended owner detour, unrelated defaults unchanged.                                                                                                                                                      |
| T-02 | Explicit vertical adjacency with a label taller than `rowGap` and no cross-axis collision.                       | Only the row boundary grows by the required height/insets; vertical route remains direct and valid. Add a sibling-track collision case that deliberately skips preallocation and uses existing fallback.                                                                                           |
| T-03 | Two or more labels, including reverse edges, on one boundary.                                                    | Boundary uses canonical key and maximum requirement, not sum; routes/labels remain valid or use deterministic existing conflict fallback.                                                                                                                                                          |
| T-04 | Explicit `rowGap: 0` and `columnGap: 0`, then small positive gaps.                                               | Eligible labelled boundary grows to its minimum; unlabelled boundaries preserve the authored zero/small value.                                                                                                                                                                                     |
| T-05 | Labelled siblings inside a group plus an unrelated root boundary.                                                | Child boundary expands, group resizes children-first, title/padding/corridors remain valid, unrelated root gap does not grow.                                                                                                                                                                      |
| T-06 | Cross-group or parent/descendant labelled edge.                                                                  | No preallocation is applied; existing hierarchy routing/label behavior remains valid.                                                                                                                                                                                                              |
| T-07 | Non-adjacent same-row edge with a genuine obstacle.                                                              | No boundary requirement is inferred across intermediate tracks; existing obstacle-aware route and generic label fallback remain active and safe.                                                                                                                                                   |
| T-08 | Labelled self-loop whose measured label fits an expanded U.                                                      | Outer leg/depth satisfy label geometry, label lands on outer leg, route avoids generic extended detour, and segment count remains the normalized U target.                                                                                                                                         |
| T-09 | Oversized labelled self-loop requiring shoulders or blocked on preferred side.                                   | Bounded alternate side/shoulder candidates are tried deterministically; result passes conflict/obstacle checks or falls back transactionally.                                                                                                                                                      |
| T-10 | Multiple labelled self-loops and ordinary incident edges.                                                        | Existing load-based sides, distinct ports/lanes, self-conflict rejection, and stable ordering remain intact.                                                                                                                                                                                       |
| T-11 | Missing or zero-sized helper measurement.                                                                        | No non-finite spacing is created; behavior matches current downstream handling.                                                                                                                                                                                                                    |
| T-12 | Forced topology/search resource fallback for a labelled self-loop.                                               | Compatibility route consumes the same requirement and passes validation; unsafe fallback is rejected.                                                                                                                                                                                              |
| T-13 | Eligible labelled adjacency plus unrelated edges that prefer overlapping or nearby parallel container corridors. | The expanded origins are used by routing, committed routes obey the existing 24 px occupancy clearance, required crossings remain perpendicular, and no stale pre-expansion coordinate is indexed. Existing large-layout coverage continues to verify the bounded fast-path relaxation separately. |

Use `validateLayout` in integration fixtures, plus direct assertions on route point count/signature,
effective endpoint separation, label location, and metrics. A finite label position alone is not a
sufficient assertion.

### 10.2 Determinism

- Clone each representative horizontal, vertical, grouped, parallel/reverse, and self-loop fixture
  for 100 runs.
- Compare serialized node coordinates/dimensions, group title rectangles, edge point arrays, label
  positions, and committed instrumentation.
- Add a reversed input edge-order fixture where route-order semantics permit comparison; verify the
  boundary maximum is unchanged even if route lanes differ according to documented source order.

### 10.3 Performance

- Extend `performance.spec.ts` with many adjacent labelled edges distributed across boundaries.
- Assert:
  - examined edges do not exceed labelled edges;
  - expanded boundaries do not exceed occupied boundaries;
  - no full node-obstacle or full edge scans are introduced;
  - existing label passes remain at most two;
  - routing topology/search/memory caps remain unchanged;
  - no second routing pass occurs.
- Keep wall-clock assertions skipped in CI, matching current repository practice.

### 10.4 Regression gates

Run at minimum:

```bash
pnpm exec vitest run packages/mermaid/src/rendering-util/layout-algorithms/grid
pnpm lint
pnpm test:check:tsc
```

If repository scripts use narrower package commands at implementation time, record the exact
equivalents in the PR and retain the same coverage.

### 10.5 Implementation validation

The implementation includes focused unit and integration coverage for shared geometry,
per-boundary aggregation, horizontal and vertical spacing, whole-route self-loops, compatibility
fallback, post-expansion route occupancy, instrumentation, structural budgets, and repeated-run
determinism. The complete grid-layout Vitest suite, focused ESLint checks, Prettier, and
`git diff --check` pass.

`pnpm test:check:tsc` passed earlier in development. A later rerun was blocked in the temporary
consumer project because the published `@mermaid-js/parser/dist/src/index.d.ts` references missing
Langium names. Those diagnostics are outside the changed grid-layout files; this document does not
treat that rerun as a successful type-check.

## 11. Implementation Epics and Items

Items are ordered for autonomous execution. Each item must leave the listed tests green before the
next dependent item begins.

### EPIC-1 — Shared label geometry contract

#### ITEM-1.1 — Centralize label span and terminal reservation calculations

- **Depends on:** none
- **Files:** `edgeLabels.ts`, new `labelGeometry.ts` (preferred), shared layout helper tests
- **Work:**
  - Move/export label clearance and terminal-reservation calculations used by spacing, label
    placement, and self-loop routing.
  - Encode `requiredAlongSpan` and actual orientation mapping.
  - Keep validator-compatible marker semantics; if marker presence policy is shared, extract rather
    than duplicate it.
- **Acceptance:**
  - Horizontal/vertical and marker/no-marker table tests pass.
  - Existing label placement geometry is unchanged before boundary sizing is enabled.
  - No duplicate clearance constants remain in grid sizing/self-loop code.

### EPIC-2 — Per-boundary label gaps

#### ITEM-2.1 — Derive deterministic boundary requirements during container sizing

- **Depends on:** ITEM-1.1
- **Files:** new `labelSpacing.ts` and `labelSpacing.spec.ts` (preferred), `layoutCore.ts`
- **Work:**
  - Build one labelled-edge/helper index before sizing.
  - Resolve each container's existing cells once, then derive requirements from those cells.
  - Identify sibling horizontal/vertical adjacency against sorted occupied tracks.
  - Skip preallocation when cross-axis occupied-track geometry makes the direct label infeasible.
  - Aggregate canonical per-boundary maxima and cache self-loop requirements by edge ID.
- **Acceptance:**
  - Covers automatic and explicit placement, sparse authored indices, reverse edges, multiple
    labels, shared cells, non-adjacent tracks, missing helpers, and cross-container exclusions.
  - Output is stable under requirement evaluation order.

#### ITEM-2.2 — Apply per-boundary gaps to sizing

- **Depends on:** ITEM-2.1
- **Files:** `layoutCore.ts`, `layoutCore.spec.ts`, `edgeLabels.spec.ts`
- **Work:**
  - Replace constant internal gap additions/cursor increments with effective boundary gaps.
  - Let existing corridor midpoint calculations inherit the expanded track origins.
  - Leave `RouteOccupancyIndex` coordinate derivation unchanged; it must observe only the final
    post-expansion routes.
- **Acceptance:**
  - T-01 through T-07 and T-13 pass.
  - Unlabelled and ineligible labelled fixtures retain prior geometry.
  - Zero/small explicit gaps grow only where eligible.

### EPIC-3 — Holistic labelled self-loops

#### ITEM-3.1 — Thread measured loop requirements through routing

- **Depends on:** ITEM-2.2
- **Files:** `routerSession.ts`, `routerSparse.ts`, `routerCompatibility.ts`, `types.ts`
- **Work:**
  - Pass edge-specific label geometry into shared self-loop candidate synthesis and compatibility fallback.
  - Preserve checkpoint and resource-fallback semantics.
- **Acceptance:**
  - Label requirement reaches every production self-loop route path.
  - Unlabelled self-loop signatures remain unchanged.

#### ITEM-3.2 — Generate and validate expanded U and bounded shoulder candidates

- **Depends on:** ITEM-3.1
- **Files:** `routerCompatibility.ts`, `routerSparse.ts`, `routerConstraint.ts` only if an existing
  validator needs a reusable public seam
- **Work:**
  - Create one shared deterministic U/shoulder polyline synthesizer used before sparse A\* and by compatibility fallback.
  - Expand outer-leg span and depth by orientation.
  - Preserve index lane minima, legal ports, fixed tie-breaks, and side load.
  - Add at most one symmetric shoulder form per side when the direct expanded U cannot use legal
    ports.
  - Validate synthesized sparse candidates through existing same-container route, obstacle,
    pair-route, own-conflict, near-parallel, marker, and applicable occupancy checks; use overlay
    search only after rejection.
- **Acceptance:**
  - T-08 through T-12 pass.
  - The 90×20 self-loop fixture uses the expanded whole-loop route, not extended label detouring.
  - Tests from `208450a30`, `ed9ac2d10`, and `86b01fc0c` remain green without weakened clearance,
    thresholds, or increased routing caps.

### EPIC-4 — Observability, budgets, and regression coverage

#### ITEM-4.1 — Add spacing/self-loop instrumentation

- **Depends on:** ITEM-2.2, ITEM-3.2
- **Files:** `routerInstrumentation.ts`, `routerInstrumentation.spec.ts`,
  `layoutCore.ts`, `routerSession.ts`
- **Work:**
  - Add the counters in Section 8.
  - Declare every counter cumulative or transactional.
  - Include committed counters in checkpoint restore where required.
- **Acceptance:**
  - Exhaustive metric-disposition typing passes.
  - Forced rollback/resource-limit tests prove transactional counters restore and work counters do
    not.

#### ITEM-4.2 — Add deterministic and performance regression suites

- **Depends on:** ITEM-4.1
- **Files:** `performance.spec.ts`, `edgeLabels.spec.ts`, `layoutCore.spec.ts`,
  `routerCompatibility.spec.ts`, `router.spec.ts`
- **Work:**
  - Add repeated-run signatures, shared-boundary stress, labelled self-loop stress, and structural
    budget assertions.
  - Run targeted and repository-required quality gates.
- **Acceptance:**
  - All Section 10 tests pass.
  - Existing large-layout structural/resource caps do not increase without a separately justified
    review decision.

### EPIC-5 — Documentation and rollout

#### ITEM-5.1 — Update grid routing documentation

- **Depends on:** ITEM-4.2
- **Files:** `edge-routing.md`; user syntax documentation only if behavior needs user-facing notice
- **Work:**
  - Explain that measured labels can raise only an eligible adjacent boundary.
  - Document exclusions and continued obstacle fallback.
  - State that explicit gaps are minima when measured labels require safety space.
- **Acceptance:**
  - Documentation matches implemented eligibility and does not promise detour-free general routes.

## 12. Files Affected

| File                                                                                     | Implemented change                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/layoutCore.ts`               | Index measured labels, derive per-container requirements during sizing, consume per-boundary gaps, preserve the single-pass pipeline. |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/types.ts`                    | Add only the internal boundary requirement and self-loop label geometry types that require cross-module sharing.                      |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/labelGeometry.ts`            | Shared label clearance, terminal inset, and oriented span calculations.                                                               |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/labelSpacing.ts`             | Pure eligibility, adjacency, canonical boundary, and max-aggregation analysis.                                                        |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/edgeLabels.ts`               | Consume shared geometry policy; retain existing two-pass fallback and transactions.                                                   |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSession.ts`            | Supply per-edge measured requirement to self-loop routing and metrics.                                                                |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/routerSparse.ts`             | Produce label-aware sparse loop attachments/candidates while preserving applicable occupied-corridor avoidance.                       |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/routerCompatibility.ts`      | Expand U/outer-leg geometry and resource fallback consistently without changing bounded occupancy demotion.                           |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/routerOccupancy.ts`          | No behavior change; the existing container-scoped index continues to consume final post-expansion routes.                             |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/routerInstrumentation.ts`    | Add bounded-work and committed-output counters with disposition.                                                                      |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/labelGeometry.spec.ts`       | Unit-test shared orientation, reservation, and span calculations.                                                                     |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/labelSpacing.spec.ts`        | Unit-test pure eligibility and aggregation matrix.                                                                                    |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/layoutCore.spec.ts`          | Test effective gaps, groups, explicit gaps, exclusions, and pipeline geometry.                                                        |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/edgeLabels.spec.ts`          | Test direct labelled paths, fallback preservation, and complete label validation.                                                     |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/routerCompatibility.spec.ts` | Test oriented self-loop expansion and deterministic side/lane behavior.                                                               |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/router.spec.ts`              | Test sparse/resource fallback and route-level integration.                                                                            |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/performance.spec.ts`         | Add linear preprocessing, deterministic repetition, and performance caps.                                                             |
| `packages/mermaid/src/rendering-util/layout-algorithms/grid/edge-routing.md`             | Document label-aware adjacent spacing and fallback boundaries.                                                                        |

`routerConstraint.ts` should change only if an existing validation primitive must be exported for
reuse. Avoid modifying generic rendering/clipping files unless a test demonstrates a real contract
mismatch; the terminal-axis fix is a dependency, not part of this implementation.

## 13. Rollout and Compatibility

1. Land shared calculations and pure boundary analysis with no geometry change.
2. Enable per-boundary spacing with focused snapshots and validation.
3. Enable self-loop expansion with all corridor-occupancy regressions from `208450a30` and
   `ed9ac2d10`, plus self-conflict regressions from `86b01fc0c`.
4. Add instrumentation/performance gates before broad documentation.

No feature flag is required because this corrects pathological automatic geometry and preserves
existing fallback. The rollback unit is the per-boundary/self-loop behavior, not the safety fixes:
if regressions emerge, disable requirement consumption while retaining shared measurements,
terminal clipping, conflict rejection, and validation.

Expected compatibility change: diagrams with eligible adjacent labelled edges may become wider or
taller, including diagrams that explicitly configured a gap below the measured safe minimum. A
column or row boundary is shared across its container, so expanding it also separates unrelated
cells on opposite sides of that boundary. Unlabelled diagrams and labelled edges outside the narrow
eligibility rules should retain existing geometry.

## 14. Simplicity Rationale

The selected design is the smallest change that can solve the root cause before geometry becomes
immutable:

- It does not place synthetic labels in authored cells.
- It does not inflate global gaps.
- It adds only sparse per-boundary overrides and per-self-loop measurements.
- It computes requirements once from already available measurements and placements.
- It keeps routing and label fallback as the final safety mechanisms.
- It avoids a second layout/routing pass and any convergence protocol.
- It reuses existing deterministic ordering, cloning/commit boundaries, validators, resource caps,
  and instrumentation patterns.

The two small pure modules isolate calculation from the already large routing and label
files, making eligibility and geometry formulas directly testable. If maintainers prefer fewer
files, their functions may remain internal to existing modules, but the shared geometry contract
and pure-analysis boundaries must remain explicit.

## 15. Definition of Done

- All goals G-01 through G-08 are demonstrated by tests.
- Functional requirements FR-01 through FR-30 are implemented or explicitly superseded by a
  reviewed PRD amendment.
- Invariants INV-01 through INV-12 pass.
- The required test matrix, determinism runs, structural performance gates, lint, and type checks
  pass, or an unrelated infrastructure blocker is recorded with its diagnostics.
- No production safety fix from `d8b8a3db2`, `208450a30`, `ed9ac2d10`, or `86b01fc0c` is reverted
  or bypassed.
- Documentation describes eligibility, explicit-gap behavior, and fallback without overpromising.
- No unbounded retry, convergence loop, coordinate-span allocation, or global-gap inflation is
  introduced.

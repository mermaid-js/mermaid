# The Layout Maker's Guide 🗺️

A layout algorithm decides where nodes sit and how edges get from one to the next. Shapes, themes, markers, and labels are already handled by the shared rendering code. Your job is coordinates.

This guide covers layouts that live inside the Mermaid package, next to `dagre` and the others. The last section explains how to ship the same code as a standalone npm package instead.

Two layouts in the tree are worth reading alongside it. `dagre` is the default and the oldest. `swimlanes` is the newest, and it is the one that follows the conventions described here, so most of the examples point at it.

## What a layout receives and what it must produce

Every layout is handed the same structure, `LayoutData`, regardless of which diagram type produced it:

```ts
interface LayoutData {
  nodes: Node[];
  edges: Edge[];
  config: MermaidConfig;
  diagramId?: string;
}
```

You must fill in these fields and nothing else:

| Field                       | On   | Meaning                                                             |
| --------------------------- | ---- | ------------------------------------------------------------------- |
| `node.x`, `node.y`          | Node | Center of the node, not its top-left corner                         |
| `node.width`, `node.height` | Node | Already measured for leaf nodes; you set them for groups            |
| `edge.points`               | Edge | Polyline from source boundary to target boundary, at least 2 points |
| `edge.x`, `edge.y`          | Edge | Anchor for the edge label, when the edge has one                    |

`Node` and `Edge` carry a good deal more than this, all of it defined in `rendering-util/types.ts`. Read the types there rather than working from what a debugger happens to show you: shape, label geometry, styling, and port information all travel on the same objects, and most of it belongs to the renderer rather than to you.

Two structural fields are your input, not your output. `node.isGroup` marks a subgraph container, and `node.parentId` names the group a node belongs to. Read them, never rewrite them.

Sizes arrive already measured. The renderer inserts every node into the SVG, calls `getBBox()`, and writes the result back before your algorithm runs. That measurement is the only step that touches the DOM, which is what makes the rest testable.

## The five stages

Layouts are built by calling `createCommonLayoutRenderer` from `rendering-util/layout-algorithms/common/index.ts`. It gives you five hooks, runs them in order, and handles painting:

```ts
export const render = createCommonLayoutRenderer({
  prepareLayout, // reshape LayoutData before measuring
  measureLayout, // DOM: insert elements, read sizes (has a default)
  runLayoutCore, // your algorithm, no DOM allowed
  paintLayout, // escape hatch: take over painting entirely
  afterPaint, // touch up after paths exist
  paintOptions, // tweak the standard painter
});
```

Only `runLayoutCore` is required. The swimlanes layout is a complete example in twenty lines:

```ts
import { createCommonLayoutRenderer } from '../common/index.js';
import { applySwimlaneLineJumps } from './adjustLayout.js';
import { prepareLayoutForSwimlanes } from './helpers.js';
import { createEdgeLabelNodes } from './edgeLabelNodes.js';
import { runSwimlaneLayoutCore } from './layoutCore.js';

function prepareSwimlaneLayout(data4Layout: LayoutData): void {
  prepareLayoutForSwimlanes(data4Layout);

  const transformedData = createEdgeLabelNodes(data4Layout);
  data4Layout.nodes = transformedData.nodes;
  data4Layout.edges = transformedData.edges;
}

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareSwimlaneLayout,
  runLayoutCore: runSwimlaneLayoutCore,
  afterPaint: applySwimlaneLineJumps,
});
```

### Keep the core free of the DOM

`runLayoutCore` must be a pure function of `LayoutData`. No `document`, no `getBBox`, no d3 selections.

The reason is testing. Node sizes get measured in a browser once and saved to a file. A test then loads those sizes, hands them to `runLayoutCore`, and gets back the same coordinates the browser would have produced, without opening a browser at all. That only holds while the core stays free of the DOM. The moment it reaches for `document`, it can only run inside a real page, and any test around it is exercising a different code path than the one your users hit.

So write the core as one exported function, and have both the browser and your tests call that same function.

## A minimal layout

The examples from here on build a layout called `grid`. No such layout ships with Mermaid. It stands in for whatever you are writing, and the code below is what you would write to create it.

Put the algorithm in `packages/mermaid/src/rendering-util/layout-algorithms/<name>/`. This one arranges leaf nodes in a grid and connects them with straight lines:

```ts
// layout-algorithms/grid/layoutCore.ts
import type { LayoutData } from '../../types.js';

const GAP = 60;

/** DOM-free: positions come from measured sizes only. */
export function runGridLayoutCore(data4Layout: LayoutData): void {
  const leaves = data4Layout.nodes.filter((node) => !node.isGroup);
  const columns = Math.ceil(Math.sqrt(leaves.length));
  const cell = Math.max(...leaves.map((n) => Math.max(n.width ?? 0, n.height ?? 0))) + GAP;

  leaves.forEach((node, i) => {
    node.x = (i % columns) * cell;
    node.y = Math.floor(i / columns) * cell;
  });

  const byId = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  for (const edge of data4Layout.edges) {
    const from = byId.get(edge.start ?? '');
    const to = byId.get(edge.end ?? '');
    if (!from || !to) {
      continue;
    }
    edge.points = [
      { x: from.x ?? 0, y: from.y ?? 0 },
      { x: to.x ?? 0, y: to.y ?? 0 },
    ];
  }
}
```

```ts
// layout-algorithms/grid/index.ts
import { createCommonLayoutRenderer } from '../common/index.js';
import { runGridLayoutCore } from './layoutCore.js';

export const render = createCommonLayoutRenderer({ runLayoutCore: runGridLayoutCore });
```

That renders. It is also wrong in most of the ways a layout can be wrong.

## Registering the layout

The layouts that ship with Mermaid are listed in `registerDefaultLayoutLoaders()` in `packages/mermaid/src/rendering-util/render.ts`. Add one entry for yours:

```ts
registerLayoutLoaders([
  { name: 'dagre', loader: async () => await import('./layout-algorithms/dagre/index.js') },
  { name: 'swimlane', loader: async () => await import('./layout-algorithms/swimlanes/index.js') },
  // your new layout
  { name: 'grid', loader: async () => await import('./layout-algorithms/grid/index.js') },
]);
```

The loader is lazy, so the code only downloads when a diagram asks for it. `cose-bilkent` is registered the same way but wrapped in a check on `includeLargeFeatures`, which is how a layout stays out of the tiny build. Users then select the layout by the name you registered:

```text
---
config:
  layout: grid
---
flowchart TB
  A --> B
```

## Groups, labels, and edges

### Groups

A group node carries `isGroup: true`, and its members carry `parentId` pointing at it. Groups nest. Your algorithm owns the group's `x`, `y`, `width`, and `height`, and the frame must enclose every descendant with room for the title. Groups also have an optional `groupTitleRect` describing the header band. Edges routed through that band collide with the title text.

The standard painter draws a group as a cluster and everything else as a node. Override that with `paintOptions.isCluster` when your layout has its own idea of which nodes are containers.

### Edge labels

Labels need space reserved before positions are decided, otherwise they land on top of edges and nodes. The approach that works is to split each labelled edge into `start → label → end` around a temporary node, let the algorithm place that node like any other, then fold it back into an overlay label. Swimlanes does this in `createEdgeLabelNodes`, called from its `prepareLayout` hook so the dummy node is measured as real text along with everything else.

Invent a third mechanism and your labels will not be checked by the validator, because the validator reads the label geometry this pattern produces.

### Edge endpoints and markers

Edge paths must start and end on the boundary of their nodes, not at the center and not floating in space. By default the painter recomputes the endpoint by intersecting the path with the node shape, which will quietly bend the last segment of a carefully routed edge. Layouts that route to exact ports should turn that off with `paintOptions.skipIntersect`.

Arrowheads occupy roughly the last ten pixels of the final segment. A bend inside that stretch puts a corner underneath the arrowhead, and the validator calls it: the constant is `EPS_FINAL_APPROACH`, and it is 10.

### Self-loops and parallel edges

An edge with `start === end` has no direction to follow and needs its own route, usually a small rectangle off one side of the node. Parallel edges between the same pair need to be separated by hand, or they render as one line. Fixtures for both live in `e2e/platform/dev-diagrams/layout-tests/` as `self-loop.mmd`, `self-loop-2.mmd`, `self-loop-multi.mmd`, and `identical-edges.mmd`.

## Validating the result

`validateLayout` in `layout-algorithms/layout-utils/validateLayout.ts` is the shared judge of layout quality. It takes finished `LayoutData` and returns a verdict plus a score:

```ts
import { validateLayout } from '../layout-utils/validateLayout.js';

const result = validateLayout(layout);
// result.ok        → boolean, false when any hard constraint is broken
// result.issues    → what broke, with node/edge ids and details
// result.score     → 0 to 1000; exactly 0 whenever ok is false
// result.breakdown → crossings, per-edge bend penalties, point histogram
```

### Hard constraints

`ok` is false if any issue is present, and the score drops to zero. These are the failures worth knowing about before you write your router:

| Issue                                                           | What it means                                         |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `node-overlap`                                                  | Two nodes occupy the same space                       |
| `edge-intersects-node`, `edge-intersects-obstacle`              | A path crosses a node it does not connect to          |
| `edge-intersects-group-title`                                   | A path runs through a subgraph's title band           |
| `edge-endpoint-detached-from-node`, `edge-endpoint-inside-node` | An endpoint misses the boundary                       |
| `edge-non-orthogonal`                                           | A segment is neither horizontal nor vertical          |
| `edge-missing-points`                                           | Fewer than two points on an edge                      |
| `edge-shared-subpath`, `edge-parallel-segment-too-close`        | Two edges overlap or run too close to tell apart      |
| `edge-shared-attachment-point`, `edge-same-port-departure`      | Two edges leave a node from the same spot             |
| `edge-bend-near-endpoint`, `edge-bend-overlaps-arrowhead`       | A corner sits under the arrowhead or against the node |
| `edge-border-hugging`, `node-border-hugging`                    | Geometry runs along a border instead of clear of it   |
| `edge-label-overlaps-node`, `edge-label-overlaps-foreign-edge`  | A label lands on top of something else                |
| `edge-label-off-edge`                                           | A label sits away from the edge it belongs to         |

The tolerances are named constants at the top of `validateLayout.ts`, and two of them explain most first-time surprises: `EPS_FINAL_APPROACH` is 10, the stretch near an endpoint where a bend is not allowed, and `EPS_SHARED_ATTACH` is 3, how close two edges may attach to the same node before they count as sharing a point. The tests assert relative ordering rather than exact magnitudes, so treat the numbers as current rather than fixed.

Some checks assume orthogonal routing. A layout with curved or diagonal edges will trip `edge-non-orthogonal` on every edge, so either route orthogonally or work out which subset of the validator applies to you before treating its score as a target.

### The score

When `ok` is true the score starts at 1000 and comes down. Bends are counted per edge from the polyline point count, and crossings are counted once globally:

| Polyline points | Bends | Penalty             |
| --------------- | ----- | ------------------- |
| 2               | 0     | 0                   |
| 3               | 1     | 0                   |
| 4               | 2     | 5                   |
| 5               | 3     | 12                  |
| 6               | 4     | 30                  |
| 7 or more       | 5+    | 30 × 2^(points − 6) |

Each crossing costs 3. The curve is deliberately steep at the top end: one seven-bend edge costs more than twenty crossings, because a path nobody can follow is worse than a tidy diagram with intersections.

The score does not scale with diagram size. A small graph reaches 1000; a large one rarely will, so compare a fixture against its own history rather than against another fixture.

`result.breakdown.edges` is sorted worst-first, which makes it the fastest way to find what is dragging a layout down.

### One thing that looks useful and is not

`layout-utils` also holds `scoreLayout`, which computes softer metrics: aspect ratio, average bends per edge, rank faithfulness, neighborhood preservation, straight-edge ratio. Sitting next to `validateLayout`, it looks like the quality half of a matched pair.

It is not wired into anything. Nothing in the layout pipeline calls it, no fixture spec calls it, and its only caller is its own unit test. Its `symmetryScore` is an unfinished placeholder that always returns `NaN`. Treat `validateLayout` as the only judge, and leave `scoreLayout` alone unless you are deliberately picking up that unfinished work.

A third level is planned and not built. `compareLayoutSnapshot()` would diff a layout's structure against a stored baseline to catch regressions that stay inside the validator's tolerances. There is no such function today, so nothing depends on it.

## Testing with DDLT

DOM-Decoupled Layout Testing runs your algorithm in Node against sizes captured once from a real browser. Tests come back in seconds and give the same answer every time, and because the browser and the tests call the same core function, a fix in one is a fix in the other.

### Tests must run the browser's code path

The model is `parse → measure → run layout → paint`, and the third step has to be a single function. Tests swap out the measuring; the browser does it for real. What runs in between must be identical.

That sounds obvious, and it is where this gets broken most often. A test-only layout entry point sitting alongside the browser's is a bug even when the two look like they do the same thing. This has bitten this repo more than once, and the shape is always the same. The browser entry wrapped the edge pipeline in a degeneracy check and a direction-violation check, with a fallback and a reroute branch hanging off them. The test backend called the pipeline directly and skipped all of that. Fixtures came back valid, the browser took the fallback, and the fallback drew a polyline straight through the interior of a node. The validator would have caught it. The test harness never saw it.

So when you wire up a test backend, find the function the browser actually calls and trace it end to end. If it needs the DOM, lift its DOM-free body into a helper and call that helper from both sides rather than reimplementing the sequence. Never point the test at a primitive that the browser wraps in checks, fallbacks, mirror branches, or second passes: the test has to include all of it.

There is a cheap way to prove the seam is real. Change the browser orchestration, add a fallback or switch a default, and the test result for the same fixture should move. If it does not, the test is running around your change. Fix the seam rather than relaxing the test.

When a fixture passes in Node but looks broken on screen, run `validateLayout` on both, on the same fixture, and compare the issues. Different issues mean different pipelines. Put the two call chains side by side, look for pre-passes, the main call, and post-passes, and the first place they diverge is the seam.

### Fixtures

A fixture is a pair of files under `e2e/platform/dev-diagrams/layout-tests/`:

```
layout-tests/
  simple-graph.mmd          ← real Mermaid source, parsed by the real parser
  simple-graph.sizes.json   ← node dimensions captured from a browser render
  ddlt-manifest.json        ← per-fixture overrides
```

The `.mmd` file goes through the actual parser, so fixtures exercise the same `LayoutData` a user's diagram produces. The `.sizes.json` file holds one entry per leaf node and one per edge label, plus freshness metadata:

```json
{
  "metadata": {
    "captureVersion": 1,
    "sourceSha256": "…",
    "capturedAt": "2026-02-09T10:00:00Z",
    "capturedFrom": "theme=default&look=classic"
  },
  "nodes": [{ "id": "A", "width": 62, "height": 39 }]
}
```

`sourceSha256` is a hash of the `.mmd` file. Edit the diagram without recapturing and the test fails with a stale-fixture error instead of silently laying out with wrong sizes.

`ddlt-manifest.json` gives a fixture a profile, which decides the backend it runs through, and can mark it `allowLevel1Failure` when a known failure is tracked in its own dedicated spec.

### Capturing sizes

There is a button for this. Start the dev server with `pnpm dev`, open the explorer at `/dev/`, and pick your diagram out of the file tree, which is rooted at the same `dev-diagrams` folder the fixtures live in. Switch to the Code tab and click **Save sizes**, sitting next to Save.

It does the whole job. Unsaved edits to the diagram are written first, the diagram re-renders with size capture switched on, and the measurements go to `<name>.sizes.json` beside the `.mmd`. The hash and the capture version are filled in for you, so the fixture passes the freshness check the moment it lands.

The button is only enabled for layouts that can produce capture data, and it explains itself through a tooltip when it is greyed out.

If you need to capture from somewhere other than the explorer, the same machinery is reachable from the console:

```js
window.mermaidCaptureSizes = true;
// render the diagram, then:
copy(JSON.stringify(window.mermaidLastCapturedSizes.sizes, null, 2));
```

Written by hand this way, the metadata block is yours to fill in. The capture module is dynamically imported only when that flag is set, so it never reaches a production bundle either way.

Recapture when the diagram source changes or when a shape's real dimensions change. Do not recapture to make a failing test pass. The fixture is the before-picture, and rewriting it erases the regression you were trying to catch.

### Parse the diagram, do not hand-build the graph

It is tempting to skip the parser and write the `LayoutData` for a test by hand. Resist it. Hand-built graphs drift from what the parser emits, usually in the identifiers, and once the ids differ the test is scoring a graph the browser never lays out.

The ids follow rules worth knowing, because fixture entries are matched against them:

| Entity            | Id                                                                 |
| ----------------- | ------------------------------------------------------------------ |
| Content node      | The unquoted name from the diagram source, such as `A` or `E`      |
| Unquoted subgraph | The subgraph text, kept as written                                 |
| Quoted subgraph   | `subGraph<N>`, numbered by a counter that ticks on every subgraph  |
| Edge              | `L_<start>_<end>_<counter>`, the counter separating parallel edges |
| Edge label node   | `edge-label-<start>-<end>-<edgeId>`                                |

The harness does the parsing for you. `parseMmdFileToLayoutData` strips frontmatter and directives, runs the real detector and parser, and stamps the direction the way the flowchart renderer does. `parseApplySizesAndLayout` goes further and applies the captured sizes and runs a backend. Reach for those before writing your own.

If you do drive the parser yourself, two calls come first: `addDiagrams()` to register the diagram types, and `preprocessDiagram()` to handle frontmatter before `Diagram.fromText()` sees it. Skipping either produces failures that look like parser bugs and are not.

Whichever route you take, fail loudly when a fixture entry has no matching parser-produced node. A silent miss leaves a node at its default size, and the layout you then measure is not the layout anyone will see.

### Writing a spec

Load the fixture, run your backend, assert on the result:

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { loadDdltFixture } from '../ddlt/index.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

describe('swimlanes, 1-simple', () => {
  let layout: LayoutData;
  beforeAll(async () => {
    layout = await loadDdltFixture('swimlanes/1-simple', { backendId: 'swimlanes' });
  });

  it('produces a valid layout', () => {
    const result = validateLayout(layout);
    expect(result.issues.map((i) => i.type)).toEqual([]);
    expect(result.score).toBeGreaterThan(900);
  });
});
```

Pass `backendId` explicitly. The default is a backend that is not present on `develop`, so a call without it throws rather than silently doing something reasonable. Your own layout needs an entry in `ddlt/backends.ts` before a fixture can run through it.

`ddlt/index.ts` also exports `baselineDdltSpec(name)`, a one-liner that asserts the universal invariants: finite coordinates, at least two points per edge, no segment through an unrelated node, endpoints on boundaries. It hardcodes the same absent default backend and has no callers, so read it for the invariants it checks rather than calling it as it stands.

Three shapes of test cover most needs. A tiny inline geometry test, where you build a handful of nodes by hand and check one routing rule, is right for a unit of the algorithm. A fixture-backed test on realistic sizes is right for a regression you can point at. A full source-to-layout run through the parser is right for anything a user reported. Match the surrounding folder: `swimlanes/query-process.ddlt.spec.ts` is the fullest worked example in the tree, and `layout-utils/validateLayout.spec.ts` and `ddlt/aggregateValidate.spec.ts` show the smaller shapes.

### The sweep

`ddlt/layout-fixtures.ddlt.spec.ts` discovers fixture pairs, runs them, and asserts validity across the board. It also emits an aggregate report, the number that tells you whether a change helped overall rather than on the one diagram you were staring at:

```bash
# The sweep, with the aggregate report
pnpm exec vitest run \
  packages/mermaid/src/rendering-util/layout-algorithms/ddlt/layout-fixtures.ddlt.spec.ts

# Just the aggregate line
pnpm exec vitest run \
  packages/mermaid/src/rendering-util/layout-algorithms/ddlt/layout-fixtures.ddlt.spec.ts \
  2>&1 | grep 'DDLT-AGG'

# One fixture while iterating
pnpm exec vitest run -t "1-simple" \
  packages/mermaid/src/rendering-util/layout-algorithms/ddlt/
```

The report gives `total`, `avg`, `min`, and `invalid`, then one row per fixture with its score and issue types. Read it as a work queue: the lowest row is where the next improvement is. `ORTHO_TEST_DEBUG=1` in front of the command turns the layout logger from `fatal` up to `debug`, which helps when a row fails for reasons the report does not explain.

The sweep as written filters to the `swimlanes` profile and holds that profile's total against a floor. Adding a layout means adding its profile to the manifest and its own aggregate assertion, not assuming the existing one will pick your fixtures up.

## The cases that break layouts

A layout that handles a chain of boxes tells you almost nothing. The cases below are where engines actually fail, roughly in the order yours will fail them. Every one has a diagram in `layout-tests` already, so there is nothing to write before you can find out.

Most of them are source only. The folder holds around 45 diagrams and about 15 have captured sizes, and the sweep discovers fixtures by looking for `.sizes.json` files and pairing each with its sibling `.mmd`. A diagram with no sizes file is not being tested by anything, however tricky it looks. Check before assuming a case is covered, and if the sizes are missing, open the diagram in the explorer and press Save sizes. That one click is the difference between a diagram sitting in a folder and a case the sweep will defend.

### Self-loops

An edge whose source and target are the same node has no direction to travel in, and code that computes a route from two distinct positions tends to produce a zero-length path, a division by zero, or a dot. The route has to be manufactured: a small loop off one side, clear of the node and of anything the node's other edges are doing.

`self-loop.mmd` is the single-node case, and the only one of the three with sizes captured. `self-loop-2.mmd` and `self-loop-multi.mmd` are harsher, putting a self-loop on all four nodes of a cycle, so every loop competes for space with real edges already using those sides.

### Subgraphs

This is the long tail, and it is where most of the work is. A subgraph is a node that contains other nodes, so every edge endpoint now has two possible meanings and every frame is an obstacle that also has to move as its contents move.

| Case                                  | Fixture                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| A subgraph standing on its own        | `decoupled-subgraph.mmd`                                  |
| Edge into a subgraph                  | `edge-to-subgraph.mmd`                                    |
| Edge into a node inside a subgraph    | `edge-to-node-in-subgraph.mmd`                            |
| Edge out of a subgraph                | `edge-from-subgraph.mmd`                                  |
| Edge from inside out to a plain node  | `subgraph-variation.mmd`, `subgraph-variation-2.mmd`      |
| Between two sibling subgraphs         | `nested-sg-outgoing-2.mmd`, `nested-incoming.mmd`         |
| Inside one subgraph to inside another | `nested-sg-outgoing-2.mmd`, `nested-subgraphs-2.mmd`      |
| Nested subgraphs                      | `nested-subgraphs.mmd`, `nested-subgraphs-3.mmd`          |
| Edges crossing several nesting levels | `nested-sb-edges-in-out.mmd`, `nested-outgoing-edges.mmd` |
| Subgraph titles competing for space   | `subgraph-labels.mmd` and its two variants                |

Work down that list in order. Each row assumes the ones above it. Only the first two rows have captured sizes today, so everything below them is a diagram you can open in the browser rather than a test that will tell you when you break it.

Two failures recur. An edge that ends on a subgraph should stop at the frame rather than diving through to a member, and an edge that ends on a member has to cross the frame without clipping the title band. The other is sizing: a frame has to enclose everything inside it including the labels, and it has to keep doing so after a later pass nudges a member.

### Parallel edges

Two edges between the same pair of nodes are one edge as far as most routing code is concerned, because both get the same endpoints and the same optimal path, so they land exactly on top of each other and the diagram silently loses information. They have to be separated deliberately.

`identical-edges.mmd` is the minimal case. `multiple-edges.mmd` adds a reverse edge to the bundle, so the fix cannot just fan edges out by index and ignore direction. `identical-edges-in-subgraph.mmd` puts a bundle in each direction inside a frame, where the room to fan out is bounded.

### Busy nodes

A node with more than four edges cannot give each one its own side. Ports have to share sides, share sides in an order that does not cross, and stay far enough apart to be told apart. Engines that assign one edge per side degrade sharply here, usually into a knot right against the node.

`edge-types.mmd` piles several edges onto a single node with a different arrow type on each. `Company.mmd` and `Company-simp.mmd` are the realistic version of the same problem, and both have sizes captured.

### Combinations, and both directions

These interact, and the combinations are worse than the parts. A self-loop on a busy node inside a nested subgraph exercises all four at once, which is why the larger fixtures are worth keeping even though a failure in one is harder to diagnose. `deploy-pipeline.mmd`, `life-choices.mmd`, and `project-sox2.mmd` are the closest thing here to diagrams a user would actually write.

Run the ones that matter in `TB` and `LR` both. Layout code tends to grow an implicit assumption about which way the graph flows, and the second direction is where that assumption surfaces.

## Before you invent something

Graph drawing has a long research record, and most of what a layout engine needs has been studied for decades. Orthogonal routing, compaction, port and side constraints, layered pipelines, crossing minimisation: none of these are new problems, and reading up on one is usually faster than deriving a heuristic and discovering its failure modes one fixture at a time.

The vocabulary gap is worth knowing about, because it makes searching harder than it needs to be. What this codebase calls a jog, the literature calls a bend. A port window is a pin or a side constraint. A rail is a track or a channel. A group is a compound vertex.

When you knowingly diverge from what the established approach recommends, write down why in the pull request, along with how you checked that the divergence works.

## Watching it in the browser while the tests run

The sweep tells you a score dropped. It does not tell you the diagram now looks like a plate of spaghetti. Keep a browser open next to the test run.

```bash
pnpm dev
```

Do not assume the address. The port is derived from the path of the checkout, so every worktree and every clone gets its own and you can run several dev servers side by side without them fighting over 9000. The server prints its URL as it starts, before the build output scrolls past. `MERMAID_DEV_PORT` pins it if you want a fixed one.

Open `/dev/` and you get the explorer: the fixture tree on one side, the diagram on the other, a code tab for editing the source, and a layout picker for comparing your algorithm against the others on the same input. It reloads when you change the source, so an edit to your algorithm redraws the diagram without you touching the browser.

For a diagram that is not in the fixture tree, copy the standalone page template instead:

```bash
cp demos/dev/example.html demos/dev/grid.html
```

That lands at `/dev/grid.html` on the same server. Put the diagram in the page and name your layout in the frontmatter:

```html
<pre class="mermaid">
---
config:
  layout: grid
---
flowchart TB
  A --> B
  B --> C
</pre>
```

A workflow that holds up over a long session:

1. Run the sweep in one terminal, filtered to the fixture you are working on.
2. Keep that same fixture open in the browser.
3. Make one change and watch both. The score says whether it helped, and the picture says whether the score was measuring the right thing.
4. Before committing, run the full sweep and confirm the aggregate did not drop.

The two disagree more often than you would expect, and the disagreement is informative. A score that improves while the diagram gets worse means the validator is blind to something, and that gap is worth writing down.

Use the browser to check what the tests cannot see: text that overflows its shape, arrowheads pointing the wrong way, subgraph frames cutting through labels.

## Shipping as a separate package

An external layout uses the same `render` signature and the same `createCommonLayoutRenderer`. Instead of editing the built-in registry, export a loader array and let the consumer register it:

```ts
import type { LayoutLoaderDefinition } from 'mermaid';

const loader = async () => await import('./render.js');

const layouts: LayoutLoaderDefinition[] = [{ name: 'grid', loader, algorithm: 'grid.compact' }];

export default layouts;
```

```js
import mermaid from 'mermaid';
import layouts from 'my-mermaid-layout';

mermaid.registerLayoutLoaders(layouts);
```

The `algorithm` field is passed back to your renderer through `options`, which lets one package register several named variants that share an implementation. `packages/mermaid-layout-elk` does exactly this.

Package it separately when the layout pulls in a large dependency. Everything else belongs in the main package, where it gets covered by the fixture sweep.

## Checklist

- [ ] `runLayoutCore` is one exported function with no DOM access
- [ ] The browser and the tests call that same function
- [ ] Group frames enclose their members and leave the title band clear
- [ ] Edge labels reserve space before positions are decided
- [ ] Edge endpoints land on node boundaries
- [ ] Self-loops and parallel edges have routes
- [ ] `validateLayout` returns `ok: true` on your fixtures
- [ ] Fixtures exist, with captured sizes, for the cases the algorithm was written to handle
- [ ] Your backend is registered in `ddlt/backends.ts` and your profile in `ddlt-manifest.json`
- [ ] The sweep passes and the aggregate score has not dropped
- [ ] `.mmd` fixtures under `e2e/diagrams/` cover the layout visually, since layout changes are rendering changes

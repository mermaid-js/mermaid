# Faithful HOLA — fidelity record

Implementation of `mermaid-hola-faithful-implementation-guide.md`, which is
normative for pipeline, ordering, objectives and invariants, with the HOLA
paper (Kieffer, Dwyer, Marriott & Wybrow, 2015) behind it.

This file records, per stage, **what was implemented**, **where the source is a
port vs. an implemented-equivalent**, and **every deliberate deviation**. Guide
§2 requires that: a faithful implementation may substitute a procedure only if
it is demonstrably equivalent and the substitution is declared.

Enable with `layout: 'hola-faithful'`. The existing experimental `hola` layout is
untouched and still registered under `layout: 'hola'` (guide §1, §21 PR 9).

---

## 1. Non-negotiable invariants (guide §4)

| #   | Invariant                                                            | Where                                                                                                       |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | No cycle-edge removal                                                | `decomposition/peelCoreAndTrees.ts` — undirected leaf peeling only; `cycleUtils` is never imported          |
| 2   | No label nodes in topology                                           | `adapter/flattenFlowchart.ts` keeps labels on the edge; `adapter/labels.ts` places them after routing       |
| 3   | Split into components before HOLA                                    | `components/components.ts`, called from `layoutCore.ts` before any stage                                    |
| 4   | Overlap removal follows the initial core stress layout               | `connected/layoutConnectedHola.ts`, `enforceNoOverlaps` immediately after the first `gradientProjectStress` |
| 5   | Alignment/separation are hard constraints that survive               | one `ConstraintSystem` per component, shared by every stage                                                 |
| 6   | Node configuration maximises cardinality first, then minimises angle | `orthogonalization/nodeConfiguration.ts`, `findBestConfiguration`                                           |
| 7   | Chain configuration can bend inside an edge                          | `orthogonalization/chainConfiguration.ts`, edge sites → bend dummies                                        |
| 8   | Remaining core edges routed before planarisation                     | `routing/coreRouting.ts` runs before `planarization/planarise.ts`                                           |
| 9   | Every core node uses ≥ 2 connector sides                             | `enforceTwoSideInvariant` in `routing/coreRouting.ts`                                                       |
| 10  | Manning–Atallah symmetric tree layout                                | `trees/symmetricTreeLayout.ts` (implemented-equivalent, see §3)                                             |
| 11  | Tree edges routed during tree layout                                 | `routeRankEdge`, called from `layoutTree`                                                                   |
| 12  | Planarisation on axis-aligned routes, distinct inner/outer faces     | `planariseCore` throws on a diagonal; `dcel.ts` traces half-edges                                           |
| 13  | Trees in descending bounding-box perimeter                           | `placement/placeTrees.ts`, `placeTrees`                                                                     |
| 14  | Lexicographic placement: cardinal → external → stress                | `compareCandidates`                                                                                         |
| 15  | Face expansion via separation constraints, projection, backtracking  | `tryExpansionPlan`                                                                                          |
| 16  | No actual tree nodes inserted while evaluating                       | only a placeholder rectangle enters `state.entities`                                                        |
| 17  | Coordinate changes go through the constraint system                  | `ConstraintSystem.tryAdd`; `gradientProjectStress` rejects infeasible iterates                              |
| 18  | Final routing passes through every mandatory bend                    | `routing/finalRouting.ts` → `routeWithSides` legs + `simplifyCollinear(points, waypoints)`                  |
| 19  | Subgraph containers never enter the layout graph                     | `flattenFlowchart` skips `isGroup` nodes; `layoutCore.ts` drops them from the output                        |
| 20  | Components do not influence one another                              | per-component `ConstraintSystem`, stress model, router obstacle set and face set                            |

---

## 2. Ports vs. implemented-equivalents

Guide §2 ranks: (1) port the original implementation, (2) port from the cited
paper, (3) implement a demonstrably equivalent procedure and validate it.

The Adaptagrams sources are not vendorable into this repository, so nothing is a
literal port. Everything below is **level 2** — implemented from the published
algorithm — except where marked level 3.

### 2.1 VPSC — level 2

`constraints/vpsc.ts` implements the block-based active-set solver of Dwyer,
Marriott & Stuckey, _Fast Node Overlap Removal_ (GD 2006), the same algorithm
`libvpsc` implements: blocks of variables joined by tight constraints, merged on
violation and split when a block's internal Lagrange multiplier goes negative,
with cycle detection marking genuinely unsatisfiable constraints.

Validated by `constraints/solver.spec.ts`: optimality for equal and unequal
weights, propagation along chains, exact equality constraints, block re-opening,
and cycle rejection.

### 2.2 Overlap removal — level 2

`stress/overlapRemoval.ts` uses the scanline constraint generation from the same
paper: sweep one axis, keep the other ordered, and constrain only scanline
neighbours.

**Deviation (declared):** the paper's `removeOverlaps` runs a full x-pass then a
full y-pass. Guide §7.5 instead asks for "horizontal _or_ vertical" constraints
added to the persistent system and iterated. This implementation follows the
guide: per round it generates both axes, projects each on a scratch copy, and
commits the cheaper one, keeping only the constraints that were violated at
generation time. Same fixed point, less displacement, and the result is
persistent rather than a one-shot move.

### 2.3 Stress and gradient projection — level 2

`stress/stressModel.ts` is the standard graph-stress objective the guide states
in §7.4. `stress/gradientProjection.ts` is the projected-gradient loop of guide
§7.3, with the first trial step taken from the exact minimiser of the
second-order model along the descent direction and backtracking after that, so
every accepted iterate is both feasible and strictly lower-stress.

**Deviation (declared):** the reference implementation uses stress majorisation
(SMACOF) inside gradient projection. A monotone projected-gradient loop with an
exact line search on the same objective reaches the same stationary points; it
is slower per unit of stress reduction, not different in kind. The objective,
its gradient and its curvature all derive from one `pairs` list, which is what
guide §7.4 asks for ("do not retain an unverified mixture").

### 2.4 Orthogonal routing — level 2

`routing/orthogonalRouter.ts` builds an orthogonal visibility grid — obstacle
boundaries expanded by the clearance, plus port and waypoint coordinates — and
runs A\* with bend and crossing penalties, in the style of `libavoid`. It
satisfies the guide §14.1 contract and the §19 request/result shape, including
locked sides, ordered mandatory waypoints routed leg-by-leg, and ranked
alternatives with cost.

Mermaid's existing `hola` router is **not** reused: guide §19 permits reuse only
behind the stricter contract, and adapting it would have meant rewriting its
side-assignment and grid layers anyway.

### 2.5 Manning–Atallah symmetric tree layout — level 3

`trees/symmetricTreeLayout.ts` implements the _mechanism_ Manning & Atallah rely
on — canonical form (AHU codes) to detect interchangeable subtrees — and uses it
for c-tree pairing and for laying right-hand siblings out as reflections.

**Equivalence argument** (guide §2 item 3): the layout of a subtree is a pure
function of its structure and node sizes, which is exactly what the canonical
code captures, so isomorphic siblings receive identical geometry. Reserved
extents therefore form a palindromic sequence, and a palindromic sequence packed
with a uniform gap and centred on its parent is symmetric about the parent's
axis. A symmetric rooted tree comes out exactly mirror-symmetric — asserted at
machine precision in `trees/symmetricTreeLayout.spec.ts`, including per-rank
multiset symmetry.

No similarity thresholds and no weighted pairing scores are used, as guide §15.1
requires.

### 2.6 Chain bend-site cost — level 3

The paper defines the criterion but not the function; guide §13.5 says to port
it. Not portable here, so:

- an **edge site** is measured by its own slope;
- a **node site** is measured by the slope of the base of the isosceles triangle
  HOLA builds at the node (unit steps along both incident chain segments);
- the cost is the angular distance from that slope to the _natural_ slope of the
  required turn — the bisector of the incoming and outgoing travel directions,
  which is a ±45° diagonal whose sign is fixed by the turn direction.

This is an increasing function of deviation from a ±1 slope, signed by the turn,
which is precisely the property the paper states. It is bounded, scale-free and
deterministic. It is **not** claimed to be numerically identical to the original.

### 2.7 Anchorless degree-2 cycles — level 2

Guide §13.1 forbids inventing a spiral and points at the ACA path.
`orthogonalization/acaAlignment.ts` implements Adaptive Constrained Alignment:
greedily add the single edge alignment with the lowest measured stress penalty,
rejecting any that the solver cannot satisfy or that would create an overlap.

---

## 3. Deviations beyond the two above

1. **Placeholder attachment: a weld when it fits, a hinge when it must.**
   Guide §17.3 lists "root anchor" among the placeholder's data without fixing the
   constraint form. Both forms are built (`anchorConstraints`) and both compete:
   - _rigid_ — aligned with the root on both axes, at exactly the natural rank
     distance. The tree cannot move, so making room means moving core nodes.
   - _hinged_ — aligned across the growth axis, separated by _at least_ the
     natural distance along it. The tree can slide outwards, which keeps a very
     tight core feasible; it then travels with its placeholder (`restoreTrees`).

   A slide is nearly free in core stress, because the placeholder is not a core
   node, so ranking on stress alone always chose it — producing a tree far outside
   the core with a long empty connector to its first rank. Two things fix that:
   `slideCost` adds back the stress term the root-to-tree pair would contribute
   (`w·(d−D)²`, `w = 1/D²`, the convention of guide §7.4 — and §17.5 says the tree
   does take part in the stress evaluation), and `preferRigid` gives a rigid
   placement of the same cardinal/external class a small preference band, because
   a few hundredths of stress is not worth a visible dead stub.

2. **Placeholders reserve their space.** Guide §17.3 says a placeholder carries
   "occupied-space constraints"; `reservePlaceholderSpace` makes that concrete,
   adding one separation per nearby entity on whichever axis has the most room.
   Without it the post-placement stress recovery walks core nodes into the tree.

3. **Rotation swaps a placeholder's extents.** Guide §18.3 item 3 says node
   width and height must not swap. A placeholder is a _region_, not a node, so
   it does turn with the drawing; `RotationTargets.regionIds` marks the
   difference.

4. **Node configuration is exhaustive up to degree 16.** Beyond that
   (`nodeConfigurationExhaustiveDegreeLimit`) the neighbour set is pre-filtered
   to the candidates nearest a cardinal direction and
   `HOLA_NODE_CONFIG_TRUNCATED` is reported. The enumeration is otherwise
   complete over order-valid assignments.

5. **Graceful degradation, always reported** (guide §25). An unplaced tree is
   attached with HOLA's provisional SOUTH growth; a placement whose constraints
   cannot coexist with non-overlap has those constraints withdrawn; a chain with
   no feasible bend sequence falls back to ACA. Each path emits a diagnostic.
   Nothing silently falls back to a different algorithm.

6. **Tree layout is computed for the growth axis it will be drawn on.**
   `layoutTree` takes a `growthAxis`, and `placement/placeTrees.ts` keeps two
   layouts per tree (`layout`, `layoutForHorizontalGrowth`), selected by
   `layoutForGrowth`. Rank spacing must come from the extent _along_ growth and
   sibling spacing from the extent _across_ it; a single south-grown layout
   turned 90° spaces ranks by node height where node width is what separates
   them, which makes east/west trees self-overlap. This is a correction, not a
   liberty: guide §15.2 specifies rank/sibling gaps in terms of the growth
   direction, and only the placement stage knows that direction.

7. **Node configuration rejects a configuration that forces coincidence.**
   `acceptsConfiguration` provisionally commits the alignments, projects, and
   withdraws them again unless the result is both feasible and overlap-free.
   A high-cardinality assignment on a dense hub (K3,3 and friends) can be
   perfectly feasible as a constraint set and still stack two neighbours on the
   same point, which invariant 4 forbids downstream. Cardinality is still
   maximised — over the _acceptable_ configurations.

8. **Relaxation order when overlaps survive.** `relaxUntilOverlapFree` withdraws
   constraint groups in the order `opportunistic-alignment` → `face-expansion` →
   `tree-placement` → `overlap-removal`, re-projecting after each. Guide §25
   requires that a soft aesthetic never wins over a structural invariant but
   does not fix the order; this one gives up the cheapest aesthetic first.

9. **Route direction is restored per original edge.** Parallel and anti-parallel
   edges are folded into one topological edge, so the router produces one
   polyline in _that_ edge's direction. `orientRoute` in `layoutCore.ts`
   reverses it for any original edge declared the other way round, so the tail
   sits on `edge.start` and the arrowhead on `edge.end`.

10. **Face expansion asks for as little as it can, then as much as it must.**
    Guide §17.4 lists "horizontal then vertical" and "vertical then horizontal" as
    two _plans_. They are implemented as four (`EXPANSION_PLANS`): each axis order
    at two scopes.
    - `needed` — a boundary block is only constrained on this axis if it is not
      already clear of the placeholder on the _other_ axis (two rectangles are
      apart as soon as one axis separates them), and the second axis is only used
      if the first did not make enough room.
    - `boundary` — the whole boundary on both axes, unconditionally. This is the
      blunt version: it always makes room, but it makes it by driving the
      placeholder into a corner outside everything. Kept as the last rung so a
      very tight core still gets a drawing.

    Constraining a block on an axis that has nothing to do buys nothing and costs
    a lot: asking a tree to clear every core node horizontally pushes it past the
    entire width of the core, and asking the boundary to part on both axes at once
    inflates the core itself — a four-node cycle in this corpus was stretched to
    350px edges by it.

11. **Slides are retracted once the core has settled.** `retractSlidTrees` (step
    3d) pins each slid tree back onto its natural rank distance with an equality,
    accepting the result only if the projection is feasible _and_ the drawing stays
    overlap-free. The non-overlap separations in force were derived while the tree
    was out there, and the face expansion was what put it there, so they are
    withdrawn in two rungs (`overlap-removal`, then also `face-expansion`) and
    non-overlap is regenerated from the retracted positions. With the tree pinned
    the only remaining way to resolve a collision is to move core nodes — the room
    comes from the core spreading, which is the point. A tree that genuinely
    cannot be brought back keeps its slide and reports
    `HOLA_TREE_SLID_FROM_ROOT` with the residual distance.

12. **Trees on the same side of the core share one line per rank.**
    `improvement/treeRankAlignment.ts`, applied in `restoreTrees` on the real tree
    nodes, after the constraint work and before final routing.

    Each tree is laid out and placed against its own root, so nothing makes two
    trees on one side agree about where a rank sits: one tree's second rank comes
    out level with another's third, and a side that is a hierarchy reads as a
    jumble. Trees growing east or west get one x per rank (each level vertically
    aligned), trees growing north or south one y per rank.

    Two candidate line sets are tried, tightest first:
    - `tightRankLines` is derived from geometry alone — each root's own extent, the
      rank gap, and the largest node of each rank across the group. It is the
      closest the ranks can legally sit to the core, and because it ignores where
      the trees currently are, it also _undoes_ any slide a tree was carrying.
    - `outermostRankLines` keeps every tree at least where it already was. Always
      fits, but hands every tree in the group the largest slide in it.

    A group is only formed from trees growing the same way, and only from trees
    standing side by side _across_ the growth axis — trees stacked along it are at
    different distances from the core deliberately, and sharing lines would drive
    one into the other. If the chosen lines overlap anything the group is put back
    as it was. This is opportunistic in the sense of guide §18.1: the paper's own
    alignment pass improves a drawing where it can and leaves it alone otherwise.

    On `4 nodes loop + trees` this both aligns and tightens: the two east trees
    went from ranks at 227/396/573 and 493/662/839 to a shared 191/360/537.

---

## 4. Why the core is not pre-expanded for the trees

A natural-looking alternative is to measure every tree first, sum the space they
need, and blow the core up by that much before any tree is attached. The
algorithm deliberately does not do this, and guide §17.4 rules it out in as many
words: _"Do not replace the operation with one translation vector derived from
the difference of bounding-box deficits."_

The reasons are structural, not stylistic:

- **Trees are placed into _faces_, not into the drawing at large.** A tree
  occupies a wedge of one specific face at one specific core node (guide §17.2,
  `faceWedgeAt`). Room made anywhere else in the drawing does not help it. A
  global scale-up enlarges every face, including the ones nothing will ever be
  placed in, and still fails to guarantee that the wedge a given tree needs is
  clear — the obstruction is usually a _particular_ boundary node, at a
  particular corner.
- **The space required is not known until the candidate is chosen.** A tree's
  footprint depends on its growth direction and flip: the same tree is tall and
  narrow growing south and short and wide growing east (see deviation 6 above).
  There is no single "space this tree needs" to pre-reserve; there is only "space
  this tree needs _in this candidate_".
- **Expansion must preserve the planar embedding.** Faces are only meaningful
  while the embedding holds. A uniform blow-up is safe but wasteful; anything
  targeted enough to be useful has to be expressed as separation constraints on
  identified boundary blocks, projected through the one solver, so that the
  embedding and all earlier alignments survive (guide §17.4, invariant 15).
- **Cost has to stay comparable across candidates.** Selection is lexicographic
  on cardinal placement, then external face, then stress increase (guide §17.6).
  Pre-expansion would spend the displacement budget before any candidate is
  scored, so the stress increase that distinguishes candidates would no longer reflect what each placement actually
  costs.

So the answer is: expand, yes — but **per candidate, on demand, and only against
the boundary that is actually in the way**. That is `expansionConstraintsFor` in
`placement/placeTrees.ts`: it identifies the obstructing entities (the face's own
boundary nodes, the placeholders committed by earlier trees, and for the external
face every sized entity), emits separation constraints that push exactly those
out of the placeholder's wedge, tries horizontal-then-vertical and
vertical-then-horizontal orders, projects through the shared
`ConstraintSystem`, and backtracks by withdrawing the plan if it cannot coexist
with non-overlap. Trees are processed in descending bounding-box perimeter
(invariant 13) so the tree with the largest demand gets first claim on the space,
and each committed placeholder then reserves its area against the ones that
follow (deviation 2).

The overlaps reported in this repository's fixtures came from three of these
pieces being wrong rather than from a missing pre-expansion: expansion was not
actually measured against the face boundary, tree layout used the wrong axis for
rank spacing, and node configuration could stack two neighbours on one point.
With those fixed, all 25 fixtures come out overlap-free.

The related symptom — a tree not overlapping anything but sitting far outside the
core, with a long empty connector to its first rank — was a second failure of the
same stage, and is addressed by deviations 1, 10 and 11: expansion no longer
constrains what it does not need to, a rigid attachment competes fairly with a
slid one, and a slide that the settled core no longer requires is retracted.

**Known limitation.** A tree hanging off a core node whose every cardinal
direction is already taken by a core neighbour has only ordinal wedges to sit in,
and no rigid attachment in such a wedge is feasible: the neighbours forming the
wedge are welded to the node's own axes by node configuration, so the wedge cannot
be opened without breaking the orthogonal structure that node configuration
exists to produce. Those trees stay slid, and say so
(`HOLA_TREE_SLID_FROM_ROOT`). `GRAPH - hola paper graph 5` is the case in this
corpus: `E` has four core neighbours and its tree sits ~300px further out than its
natural rank distance. Closing this needs the wedge itself to open — face
expansion that may re-route a core edge — which is beyond what the constraint
system alone can express.

---

## 5. Not yet done

Relative to guide §26, these remain open:

- **Golden/differential validation against Adaptagrams (§24).** Requires running
  the original implementation; the stage-level structure is in place (each stage
  is a pure function over the model) but no corpus is checked in.
- **Subgraph containers (§3.2).** Deliberately out of scope for v1: containers
  are dropped and children flattened, exactly as the guide specifies.
- **PR 9 (§21).** The legacy `hola` path is still registered; this
  implementation is additive.
- **Port distribution along a node side.** Every edge attaching to the same side
  of a node currently shares one port (its centre, offset only for _parallel_
  edges of the same pair). Structural correctness does not depend on it, but the
  `validateLayout` aesthetics that do — `edge-same-port-departure`,
  `edge-shared-attachment-point`, `edge-shared-projected-port`,
  `edge-corner-connection`, `edge-border-hugging`, `edge-bend-near-endpoint` —
  still fire. This is the largest remaining connector-quality gap and is why
  `holaFaithfulDdlt.spec.ts` asserts the structural subset only.

---

## 6. Test map

| Guide section                                     | Spec                                          |
| ------------------------------------------------- | --------------------------------------------- |
| §7.1–§7.3 constraint system, projection, rotation | `constraints/solver.spec.ts` (14)             |
| §10 decomposition                                 | `decomposition/peelCoreAndTrees.spec.ts` (14) |
| §14, §19 router contract                          | `routing/orthogonalRouter.spec.ts` (13)       |
| §15 symmetric trees                               | `trees/symmetricTreeLayout.spec.ts` (12)      |
| §16 planarisation, sweep, DCEL                    | `planarization/planarise.spec.ts` (12)        |
| §3, §9, §22, §23 end-to-end invariants            | `holaFaithful.spec.ts` (48)                   |
| §23 structural invariants over the DDLT corpus    | `holaFaithfulDdlt.spec.ts` (28)               |

Fixtures for the §22 corpus live in `testFixtures.ts`; the DDLT corpus is
`cypress/platform/dev-diagrams/layout-tests/hola-faithful/`.

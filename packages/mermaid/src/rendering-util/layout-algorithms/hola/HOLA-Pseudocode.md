# HOLA — Implemented Pipeline (Pseudocode)

A description of the HOLA layout as it is actually implemented in this folder, written as a
self-contained layout algorithm (no Mermaid-specific framing). Every procedure that runs is
described; procedures that exist but are never invoked are listed in the first appendix.

---

## 0. Data model & notation

```
Node   = { id, x, y, width, height, padding,
           isGroup, parentId, isDummy, isLabelNode, isEdgeLabel, shape, order }
Edge   = { id, start, end, label, points[], startSide, endSide, classes, isLabelEdge }
Graph G= { nodes: Node[], edges: Edge[], config }

x,y are CENTRE coordinates. Node rectangles are [x±w/2, y±h/2].
"degree" always means |unique undirected neighbours| unless stated.
Sizes (width/height) are given as INPUT — the algorithm never measures.
Output: node.x/node.y for every node, group frames (x,y,w,h), edge.points[] polylines.
```

Global constants (`Constants.ts`):

```
NODE_SPACING=100  LEVEL_SPACING=120  MIN_VERTICAL_PADDING=90  MIN_LEVEL_SPACING=150
MIN_HORIZONTAL_GAP=90  DISCONNECTED_NODE_SPACING=300  DEFAULT_TREE_PADDING=100
GROUP_PADDING=15  GROUP_OVERLAP_MARGIN=20  GROUP_SIBLING_SPACING=80
STRESS_LR=0.1  GRADIENT_FACTOR=2  MIN_EDGE_LEN=50
ALIGN_THRESHOLD=30  NEIGHBOR_STRESS_ITERS=50  NEIGHBOR_STRESS_TOL=1e-4
MAX_EDGES_PER_SIDE=5  ASTAR_RADIUS=48  ASTAR_ENDPOINT_CLEARANCE=24
ASTAR_BEND_PENALTY=10  ASTAR_CROSSING_PENALTY=1000  EDGE_OBSTACLE_PENALTY=200
L_OFFSETS = [0,50,-50,40,-40,60,-60,30,-30,70,-70,20,-20,10,-10]   (percent)
Z_OFFSETS = [0,10,-10,...,80,-80]                                   (percent)
```

---

## 1. MASTER ALGORITHM

```
ALGORITHM Hola(G):

  // ---- Phase 0: pre-measurement rewrite (runs before sizes are known) ----
  A0_InjectEdgeLabelNodes(G)                       // §2

  // ---- from here on all node sizes are known ----

  L ← A1_BaseEdgeLength(G.nodes, G.edges)          // §3   (a single scalar "ideal edge length")

  A2_LayoutTrueSubgraphs(G, L)                     // §4   recursive inner layouts, sizes group frames
  A3_ConnectOrphansInSubgraphs(G)                  // §5   temporary invisible edges

  cycleEdges ← ∅
  if config.removeCycles (default true):
      cycleEdges ← A4_RemoveCycleEdges(G)          // §6

  (core, trees) ← A5_TopologicalDecomposition(G)   // §7
  trees ← A6_SortTrees(trees, G)                   // §8

  coreXY  ← A7_LayoutCoreGraph(core, L)            // §9   STEP 2 of HOLA
  layout  ← A8_LayoutAndPlaceTrees(coreXY, trees, L)  // §13 STEP 3 of HOLA
  layout  ← A9_TweakAlignment(layout)              // §18  STEP 4 of HOLA

  A10_DetectAndResolveOverlaps(layout)             // §23
  A11_WriteBackCoordinates(G, layout)              // copy x,y,w,h onto original nodes by id

  if config.removeCycles: G.edges ← G.edges ++ cycleEdges

  A12_FinalizeGroupsAndRoute(G)                    // §24 + §25..§33
  return G
```

`A12` is the whole group/route epilogue:

```
PROCEDURE A12_FinalizeGroupsAndRoute(G):
  A3'_CleanupOrphanConnections(G)                  // drop the temp dummies/edges
  A24_DragIntoSubgraphs(G)                         // recentre true-subgraph children in their frames
  A25_CompressDisconnectedComponents(G)            // squeeze empty gaps between components
  A26_CheckAllChildrenInGroup(G)                   // evict foreign nodes out of group rectangles

  nodeMap ← index(G.nodes)
  A27_LayoutGroups(G, GROUP_PADDING, nodeMap)      // size/centre every group bottom-up
  A28_ResolveGroupOverlaps(G, GROUP_OVERLAP_MARGIN, nodeMap)
  A26_CheckAllChildrenInGroup(G)

  G.nodes ← SortGroupNodesToEnd(G.nodes)           // groups last, biggest first → paint order
  G.edges ← A29_Routing(G)                         // §25: side assignment + orthogonal paths

  A27_LayoutGroups(G, GROUP_PADDING, nodeMap)      // re-fit frames around routed edge points
  A28_ResolveGroupOverlaps(G, GROUP_OVERLAP_MARGIN, nodeMap)
```

---

## 2. A0 — Edge-label node injection

Labels are made _first-class nodes_ so they reserve real space.

```
PROCEDURE A0_InjectEdgeLabelNodes(G):
  if any node.isLabelNode or any edge.isLabelEdge: return    // idempotent

  for each edge e in G.edges:
      if e.label is empty or e.start/e.end missing: keep e; continue

      p ← LowestCommonAncestorGroup(e.start, e.end)   // walk parentId chains, first shared group
      labelNode ← { id: "edge-label-<start>-<end>-<eid>",
                    label: e.label, shape:'labelRect', w:0, h:0,
                    isLabelNode: true, parentId: p }
      G.nodes.push(labelNode)

      replace e by two edges:
          e1 = e with { id: eid+"-to-label",   end: labelNode.id,  arrows: none, isLabelEdge }
          e2 = e with { id: eid+"-from-label", start: labelNode.id, isLabelEdge }
```

Consequence: from now on the graph contains degree-2 "label" nodes on every labelled edge.

---

## 3. A1 — Ideal edge length

```
FUNCTION A1_BaseEdgeLength(nodes, edges) -> number:
  if nodes empty: return 60
  maxDim ← max over nodes of max(width, height)
  maxDim ← maxDim * 1.1
  return max(60, maxDim)
```

(A second variant `UniformEdgeLength(nodes)` exists — `max(MIN_EDGE_LEN, maxDim × (1.2 if n>20 else 1))` — but the pipeline uses `A1`.)

---

## 4. A2 — Pre-layout of "true" subgraphs

A **true subgraph** = a group whose children have _no_ edges leaving the group.

```
PREDICATE IsTrueSubgraph(G, s):
  children ← {n : n.parentId = s}
  if children = ∅: return false
  for each child c, for each edge e touching c:
      if parent(e.start) ≠ s or parent(e.end) ≠ s: return false
  return true

PROCEDURE A2_LayoutTrueSubgraphs(G, L):
  if no true subgraphs: return
  for s in SortTrueSubgraphsBottomUp(G):            // leaves of the group tree first
      C  ← children(s)
      Ec ← edges with both endpoints in C
      sub ← { nodes: C ∪ {s}, edges: Ec, config }

      A13_ReRender(sub, L)                          // full mini-HOLA (no groups, no tweaking)
      sub.edges ← A29_Routing(sub)                  // orthogonal routing inside the frame

      for each group node g in G with unset width/height that appears in sub:
          b ← A30_CalculateGroupBounds(g, sub, GROUP_PADDING)
          g.width  ← (b.maxX-b.minX) + 2*GROUP_PADDING
          g.height ← (b.maxY-b.minY) + 2*GROUP_PADDING

FUNCTION SortTrueSubgraphsBottomUp(G):
  build child/parent relation restricted to true subgraphs
  BFS from leaf subgraphs upward, emitting a parent only after all its children
```

### A13 — ReRender (the inner, reduced pipeline)

```
PROCEDURE A13_ReRender(g, L):
  A3_ConnectOrphansInSubgraphs(g)
  cyc ← A4_RemoveCycleEdges(g)  (if enabled)
  (core, trees) ← A5_TopologicalDecomposition(g)
  core  ← SortCoreNodesByConnectivity(core)         // desc out-degree, then asc in-degree;
                                                    // edges re-sorted to match node order
  trees ← A6_SortTrees(trees, g)
  coreXY ← A7_LayoutCoreGraph(core, L)
  out    ← A8_LayoutAndPlaceTrees(coreXY, trees, L)
  A10_DetectAndResolveOverlaps(out)
  A11_WriteBackCoordinates(g, out)
  restore cyc
  A3'_CleanupOrphanConnections(g)
```

Note: `A13` deliberately skips Step 4 (alignment tweaking) and the group epilogue.

---

## 5. A3 / A3' — Orphan handling inside groups

Isolated children of a group would be invisible to a connectivity-driven layout, so they are
temporarily wired up.

```
PROCEDURE A3_ConnectOrphansInSubgraphs(G):
  adj ← undirected adjacency from G.edges (self-loops ignored)
  for each group s:
      orphans ← {c : c.parentId = s and deg_adj(c) = 0}
      if |orphans| = 0: continue
      if |orphans| = 1:
          d ← DummyNode(1×1, parentId=s, class 'orphan-handler-dummy-node')
          push d ; push invisible edge orphan→d (class 'orphan-handler-edge')
      else:
          chain them: for i in 0..|orphans|-2: push invisible edge orphans[i]→orphans[i+1]

PROCEDURE A3'_CleanupOrphanConnections(G):
  remove nodes with class 'orphan-handler-dummy-node'
  remove edges with class 'orphan-handler-edge'
```

---

## 6. A4 — Cycle-edge removal (temporary)

```
FUNCTION A4_RemoveCycleEdges(G) -> Edge[]:
  build directed graphlib graph
  colour[v] ← white ∀v ; stack ← []

  PROCEDURE DFS(v):
     colour[v] ← gray ; push v on stack
     for each out-edge (v,w):
         if w = v: continue                                  // self-loops are never cycle edges
         if colour[w] = gray:
             cycleLen ← |stack| - index_of(w in stack)
             if cycleLen ≥ 3: record (v,w) as a back edge    // 2-cycles are KEPT
         else if colour[w] = white: DFS(w)
     pop v ; colour[v] ← black

  for each v with colour white: DFS(v)
  G.edges ← G.edges \ backEdges
  return backEdges
```

They are re-appended verbatim after the core/tree layout, before routing.

---

## 7. A5 — Topological decomposition (core vs. trees)

This is HOLA Step 1: peel the tree-like fringe until only the cyclic "core" remains.

```
FUNCTION A5_TopologicalDecomposition(G) -> (core, trees: Map<rootId, Graph>):

  Gorig ← directed graph of G          (immutable reference copy)
  Gw    ← directed graph of G          (working copy, destroyed by peeling)
  L     ← []            // peel order
  rho   ← {}            // peeled node -> the neighbour it hung off

  // ---------- STEP 1: iterative peeling ----------
  loop:
      leaves ← { v ∈ Gw : deg(v)=1 and not InTwoNodeCycle(v) }
      labels ← { v ∈ Gw : v.isEdgeLabel and deg(v)>0 }     // labels always peel
      R ← leaves ∪ labels
      if R = ∅:
          iso ← { v : deg(v)=0 }
          if iso ≠ ∅: append iso to L, remove them, continue
          break
      for each v in R:
          nbrs ← neighbours(v)
          if nbrs ≠ ∅:
              rho[v] ← first non-edge-label neighbour, else nbrs[0]
          append v to L ; remove v from Gw

  coreNodes ← TopoSortWithCycles(Gw, {v ∈ Gw : not v.isEdgeLabel})
       // Kahn's algorithm restricted to the set; remaining (cyclic) nodes appended
       // lexicographically → deterministic order independent of input edge order
  any edge-label nodes still in Gw are moved to L (with rho set the same way)

  // ---------- STEP 1.5: path compression ----------
  for each v in L: rho[v] ← FollowRhoUntilCoreNode(v)     // memoised, cycle-guarded

  // ---------- STEP 2: pure-tree graph ----------
  if coreNodes = ∅:
      roots ← { v ∈ L : inDegree_orig(v) = 0 }
      if |roots| > 1:
          for each root r (BFS over L only) → component Cr
              build treeGraph with r renamed to "r_copy" (isCopy), all of Cr, internal edges
              trees[r] ← treeGraph
          return (emptyCore, trees)
      if |roots| = 1:
          trees[roots[0]] ← whole graph ; return (emptyCore, trees)
      // |roots| = 0 → fall through with an empty core

  // ---------- STEP 3: root set ----------
  Rset ← { rho[v] : v ∈ L } ∩ coreNodes

  trueSubs      ← { c ∈ coreNodes : IsTrueSubgraph(c) }
  subChildren   ← { v ∈ L : parent(v) ∈ trueSubs }        // handled separately in Step 4.5

  // ---------- STEP 4: one tree per root ----------
  for each root r ∈ Rset:
      dummy ← "r_copy"  (a copy of r's data, isCopy=true)
      seed  ← { v ∈ L : rho[v] = r } \ subChildren
      treeNodes ← BFS-closure of seed inside L, skipping subChildren,
                  and skipping edge-label nodes whose rho ≠ r
      edges: internal edges of treeNodes; edges touching r are rewired to `dummy`
      trees[r] ← treeGraph

  // ---------- STEP 4.5: trees for true-subgraph children ----------
  for each trueSubgraph s with peeled children Cs:
      repeat until all of Cs consumed:
          pick an unprocessed in-degree-0 child (else any unprocessed one)
          BFS its connected component inside Cs → its own tree, keyed by that start node

  // ---------- STEP 5: core graph ----------
  core ← coreNodes + edges between core nodes, EXCLUDING edges classed
         'implicit-parent-child-edge'

  (core, trees) ← MergeTreesByHierarchy(G, core, trees)
  (core, trees) ← HandleMissingHierarchicalNodes(G, core, trees)
  return (core, trees)
```

Two post-passes:

```
PROCEDURE MergeTreesByHierarchy(G, core, trees):
  for each tree t: predominantParent(t) ← most frequent parentId among non-"_copy" nodes
  for each parent p with ≥2 trees:
      primary ← the tree keyed p if p is a core node, else the first
      merge the other trees' nodes/edges into primary (dedup by id) and delete them

PROCEDURE HandleMissingHierarchicalNodes(G, core, trees):
  missing ← G.nodes not present in core nor in any tree
  for each missing node m:
      if parent(m) is already placed:
           attach m to the parent's tree (creating a "<parent>_copy" tree if the parent is a
           bare core node), plus an invisible 'implicit-parent-child-edge' parent→m
      else: trees[m.id] ← single-node tree
```

---

## 8. A6 — Tree ordering

Deterministic processing order; hierarchy-aware.

```
FUNCTION A6_SortTrees(trees, G):
  classify each tree:
     - contains a TRUE subgraph node        → bucket "trueSub"
     - contains some subgraph node          → that subgraph's "parentTree"
     - has a node whose parentId is a subgraph → that subgraph's "childTree"
     - otherwise                            → "orphan"
  order ← trueSub
        ++ for each subgraphId in lexicographic order: childTrees ++ parentTree
        ++ orphanTrees
  // degenerate trees last (a lone group node, or group + a single 'orphan' node)
  return remaining ++ degenerate
```

---

## 9. A7 — Core layout (HOLA Step 2)

```
FUNCTION A7_LayoutCoreGraph(core, L) -> core:
  if core.nodes = ∅: return core
  if |core.nodes| = 1: place it at (0,0); return

  comps ← ConnectedComponents(core)                       // DFS on undirected adjacency
  if |comps| > 1:
      offsetX ← 0
      for each component c:
          c' ← A7_LayoutCoreGraph(c, L)                   // recurse
          translate c' by (offsetX, 0)
          offsetX ← max_x(c') + DISCONNECTED_NODE_SPACING (300)
      return union of components

  P ← A14_StressMinimize(core, L)                         // Step 2a
  A15_Orthogonalize(P, core.edges, L)                     // Step 2b  (mutates P in place)
  write P back into core.nodes
  return core
```

(`StressMinimizer.removeOverlaps()` exists but the call site is commented out.)

---

## 10. A14 — Stress minimisation (Step 2a)

```
PROCEDURE A14_StressMinimize(G, L):

  // ---- seeding: BFS rings around the highest-degree node ----
  adj ← undirected adjacency
  seed ← argmax_v deg(v)                           (ties → first)
  layer ← BFS levels from seed
  unreachable nodes each get their own layer beyond maxLayer

  minSpacing ← max(maxNodeWidth + 2*maxPadding, maxNodeHeight + 2*maxPadding, L)
  jitter     ← 0.15 * minSpacing
  rnd        ← LCG(seed=0xdeadbeef, a=1664525, c=1013904223, m=256)   // deterministic

  place layer 0 at (±jitter/2, ±jitter/2)
  for each layer l ≥ 1 with k members:
      radius ← max( l*L , k*minSpacing / 2π )       // enlarge the ring if it is crowded
      member i → ( radius·cos(2πi/k), radius·sin(2πi/k) ) + jitter

  // ---- graph-theoretic distances ----
  d ← FloydWarshall(unit-weight undirected adjacency)      // O(n³)

  // ---- gradient descent ----
  PerformStressMinimization(P, d, L,
        maxIter = 50·n, learningRate = 0.1, tolerance = 1e-6)
```

with

```
FUNCTION BoundaryDistance(a,b):     // rectangle-to-rectangle gap, 0 when they overlap on an axis
   dx ← gap between [a.left,a.right] and [b.left,b.right]  (0 if they overlap)
   dy ← gap between [a.top,a.bottom] and [b.top,b.bottom]  (0 if they overlap)
   return sqrt(dx²+dy²)

FUNCTION Stress(P):
   Σ_{i<j, d_ij finite}  (1/d_ij²) · ( BoundaryDistance(i,j) − L·d_ij )²

FUNCTION Gradient(i):
   g ← (0,0)
   for each j ≠ i with finite d_ij:
       (dx,dy) ← centre(i) − centre(j) ; c ← |(dx,dy)| ; if c < 1e-6: skip
       f ← 2 · (1/d_ij²) · ( BoundaryDistance(i,j) − L·d_ij ) / c
       g += f·(dx,dy)
   return g

PROCEDURE PerformStressMinimization(P, d, L, maxIter, lr, tol):
   prev ← Stress(P)
   repeat maxIter times:
       compute all gradients from the CURRENT positions (Jacobi, not Gauss–Seidel)
       apply p_i ← p_i − lr · g_i simultaneously
       cur ← Stress(P) ; if |cur − prev| < tol: return converged
       prev ← cur
```

---

## 11. A15 — Greedy orthogonalisation (Step 2b)

```
PROCEDURE A15_Orthogonalize(P, E, L):
  BuildAdjacency()
  BFS all-pairs distances (unit weights)
  chains ← A16_IdentifyChains()

  A17_ConfigureNodes()                    // hubs: assign N/S/E/W to neighbours
  A19_PostAlignmentStressRelaxation()     // relax only UNconstrained nodes
  A20_PrePositionAnchorNeighbours()
  A21_ConfigureChains()                   // degree-2 runs and pure cycles
  A18_ApplyGridAlignmentConstraints()
  A22_AlignUncoveredEdges()
  A19_PostAlignmentStressRelaxation()
```

Constraint model:

```
AlignmentConstraint = { nodeId, direction ∈ {north,south,east,west}, alignTo, axisOnly? }
  anchorConstraints : Map nodeId -> constraint     (at most one per node; hub-driven)
  chainConstraints  : list                          (axisOnly, chain-driven)
```

### A16 — Chain identification

```
FUNCTION A16_IdentifyChains():
  for each unvisited node v with deg(v) = 2:
      walk backwards through degree-2 neighbours to find the chain start
      walk forwards collecting the maximal run `chain` of degree-2 nodes
      if the run closes on itself and no member touches a non-degree-2 node:
           emit Chain{nodes: chain, isCycle: true}
      else:
           startNode ← first non-degree-2 neighbour of chain[0]      (anchor)
           endNode   ← first non-degree-2 neighbour of chain[last]   (anchor)
           emit Chain{nodes: chain, startNode, endNode, isCycle:false}
```

### A17 — Node configuration (compass assignment for hubs)

```
PROCEDURE A17_ConfigureNodes():
  hubs ← { v : deg(v) ≥ 3 } sorted by descending degree
  for each hub v: ConfigureNode(v)
  A18_ApplyGridAlignmentConstraints()

PROCEDURE ConfigureNode(v):
  for each neighbour u: angle(u) ← atan2(u.y−v.y, u.x−v.x) normalised to [0,2π)
  sort neighbours by angle (clockwise order)

  A ← BuildProposedAssignment(v, sortedNeighbours)
  if not ValidateCompleteAssignment(v, A): A ← FindMaximalValidAssignment(v, sortedNeighbours)

  for each (u → dir) in A:
      if deg(u) = 2:
          chainNodeDirections[v][u] ← dir      // recorded, NOT constrained here
      else if u has no anchor constraint yet:
          anchorConstraints[u] ← {u, dir, alignTo: v}
      else if deg(v) > deg(existing.alignTo):
          anchorConstraints[u] ← {u, dir, alignTo: v}    // higher-degree anchor wins
      // else keep the existing constraint

FUNCTION BuildProposedAssignment(v, N):        // globally-greedy min angular displacement
  cardinalAngle = { east:0, south:π/2, west:π, north:3π/2 }
  candidates ← all (u,dir) pairs with cost = shortest-arc |angle(u) − cardinalAngle[dir]|
  sort candidates by cost ascending
  greedily accept a pair if neither u nor dir is used yet
  return the assignment (≤4 neighbours get a direction; extras stay free)

PREDICATE ValidateCompleteAssignment(v, A):
  SIGN CONSTRAINT: for every (u→dir), the move must not flip u across v:
      east ⇒ u.x ≥ v.x ; west ⇒ u.x ≤ v.x ; north ⇒ u.y ≤ v.y ; south ⇒ u.y ≥ v.y
  CYCLIC-ORDER CONSTRAINT: walking the assigned neighbours in their source angular order,
      the target cardinal angles must be non-decreasing modulo 2π
      (forwardDist ≤ backwardDist for every consecutive pair; wrap-around pair included
       only when the assignment covers ALL neighbours)

FUNCTION FindMaximalValidAssignment(v, N):     // fallback: per-neighbour greedy
  for each neighbour u in angular order:
      for each direction, cheapest first:
          skip if direction taken, or sign constraint fails
          tentatively add; keep it only if cyclic order still holds
      (a neighbour that finds nothing is simply left unconstrained)
```

### A18 — Applying constraints to coordinates

```
PROCEDURE A18_ApplyGridAlignmentConstraints():
  spacing ← L
  for each constraint {u, dir, a=alignTo, axisOnly}:
      if deg(u) ≥ 3: skip                       // never move a hub
      if axisOnly:
          dir ∈ {north,south} ⇒ u.x ← a.x
          dir ∈ {east,west}   ⇒ u.y ← a.y
      else:
          north: u.x ← a.x ; u.y ← min(u.y, a.y − spacing)
          south: u.x ← a.x ; u.y ← max(u.y, a.y + spacing)
          east : u.y ← a.y ; u.x ← max(u.x, a.x + spacing)
          west : u.y ← a.y ; u.x ← min(u.x, a.x − spacing)
```

### A19 — Constrained stress relaxation

```
PROCEDURE A19_PostAlignmentStressRelaxation():
  maxIter ← 50·n ; lr ← 1e-8 ; tol ← 1e-6
  repeat:
      for every node NOT mentioned by any constraint (neither as nodeId nor as alignTo):
          p ← p − lr · Gradient(p)              // same gradient as §10
      stop when |Δstress| < tol
```

(The learning rate is 1e-8, so in practice this pass barely moves anything.)

### A20 — Pre-positioning degree-2 anchor neighbours

```
PROCEDURE A20_PrePositionAnchorNeighbours():
  for each recorded chainNodeDirections[a][u] = dir:
      skip u if it is claimed by more than one anchor  (configureChain resolves it)
      skip u if it is a chain interior node            (applyBendSequence places it)
      place u exactly one `L` away from a in direction dir; mark u prePositioned
```

### A21 — Chain configuration

```
PROCEDURE A21_ConfigureChains():
  for each chain: if isCycle → ConfigureCycle else ConfigureChain

PROCEDURE ConfigureChain(chain):
  s ← chain.startNode, t ← chain.endNode
  if chain has no interior nodes: RouteDirectEdge(s,t); return

  startDir ← existing constraint / recorded chain direction for (s, first interior), else undefined
  endDir   ← same for (t, last interior)
  startCandidates ← [startDir] if constrained else the two geometric options
                    (horizontal = east/west by sign(dx), vertical = north/south by sign(dy))
  endCandidates   ← likewise
  if both constrained AND both are the same axis:
      widen endCandidates with the geometric options (otherwise no bend sequence exists)

  best ← argmin over (sd, ed) of Cost( FindOptimalBendSequence(chain, s, t, sd, ed) )
  ApplyBendSequence(chain, best)

PROCEDURE RouteDirectEdge(s, t):               // chain with zero interior nodes
  if |dx| ≥ |dy|: t.y ← s.y ; dir ← east/west
  else:           t.x ← s.x ; dir ← north/south
  anchorConstraints[t] ← {t, dir, alignTo: s}
```

**Bend-sequence enumeration**

```
FUNCTION GenerateMinimalBendSequences(s, t, sd, ed):
  if s and t already share an axis: return [ [] ]          // no bends needed

  if sd and ed are given:
      startExit ← s + L·unit(sd) ; endEntry ← t + L·unit(ed)
      if startExit and endEntry share an axis: return [ [] ]
      else: return [ [ (endEntry.x, startExit.y) ],        // one-bend, H-first
                     [ (startExit.x, endEntry.y) ],        // one-bend, V-first
                     if sd = ed: a two-bend "staple" through the midpoint of the free axis ]
  else:
      L-shapes: [ (t.x, s.y) ] and [ (s.x, t.y) ]
      plus, when |dx| > L and |dy| > L, six canonical 2- and 3-bend staircases at the
      ⅓ / ½ / ⅔ split points of dx and dy

FUNCTION Cost(chain, seq, s, t):
  path ← [s] ++ seq ++ [t]
  Σ over segments: SegmentCost   where SegmentCost = 0 if axis-aligned,
        else 4·(1 − |1−|slope|| / (1+|slope|))            // diagonals penalised, worst at 45°
  + 0.5 · |seq|                                            // bend count penalty
  + Σ over interior chain nodes: min over segments of
        dist(node, point at ratio (i+1)/(k+1) along that segment) / 100
```

**Applying a bend sequence**

```
PROCEDURE ApplyBendSequence(chain, bends):
  if chain has no interior nodes or no bends: return
  for i, node in chain.nodes:
      if i < |bends|:  node ← bends[i]                      // one chain node per bend corner
      else:            distribute the remainder evenly along the final segment
                       (snapping to the dominant axis of that segment)

  // derive constraints along [start, ...interior..., end]
  for each consecutive pair (a,b):
      dir ← east/west if |dx| ≥ |dy| else south/north
      if b is a chain interior node or was pre-positioned:
          chainConstraints += {b, dir, alignTo: a, axisOnly: true}
      else:
          anchorConstraints[b] = {b, dir, alignTo: a}
```

**Pure degree-2 cycles**

```
PROCEDURE ConfigureCycle(chain):
  n ← |chain.nodes| ; g ← L
  if n < 3: return
  if n = 3: L-shape — n1 ← n0 + (g,0) ; n2 ← n0 + (0,g)
  if n = 4: if the 4 nodes form a genuine rectangle (each adjacent to exactly its two
            neighbours, diagonals not adjacent) → place them on a 2×2 grid of side g
            anchored at the detected corner; else fall through to the large-cycle case
  else    : cols ← max(2, ⌈√n⌉), rows ← max(2, ⌈n/cols⌉)
            walk the rectangle PERIMETER in spiral order (top row → right col → bottom row
            → left col, then inset) producing n grid coordinates; scale by g and anchor at node0
```

### A22 — Aligning edges nothing else covered

```
PROCEDURE A22_AlignUncoveredEdges():
  for each edge (a,b):
      skip if both endpoints are hubs (deg ≥ 3)
      skip if either endpoint is a chain interior node
      skip if already axis-aligned within 1px
      if a is a hub: snap b onto a's nearer axis (|dx| ≤ |dy| ⇒ b.x←a.x else b.y←a.y)
      else if b is a hub: snap a onto b's nearer axis
```

_Dead code in this class (never invoked): `ensureEdgeBasedAlignment`, `gentleGridSnap`._

---

## 12. Connected components / packing helpers

```
FUNCTION ConnectedComponents(G): DFS over undirected adjacency → list of sub-Graphs
FUNCTION LayoutDisconnectedComponents(G, comps, layoutFn):
  offsetX ← 0
  for each comp: laid ← layoutFn(comp); shift x by offsetX; offsetX ← maxX(laid) + 300
```

---

## 13. A8 — Tree layout & placement (HOLA Step 3)

```
FUNCTION A8_LayoutAndPlaceTrees(coreXY, trees, L) -> Graph:

  // Step 3a — lay every tree out on its own
  for each (rootId, treeData) in trees:
      dummyRoot ← the node whose id contains "_copy", else derived from a "_copy" edge,
                  else rootId
      treeLayouts[rootId] ← A31_SymmetricTreeLayout(treeData, dummyRoot)

  // degenerate cases: no core
  if coreXY.nodes = ∅ and |treeLayouts| = 1:
      emit the tree's nodes, dropping every "_copy" node except "<root>_copy",
      which is renamed back to root; edges are dropped (routing recreates them)
      return

  if coreXY.nodes = ∅ and |treeLayouts| > 1:
      pack the trees left-to-right: shift each tree so its minX = runningOffset,
      runningOffset += treeWidth + DEFAULT_TREE_PADDING (100)
      return

  if coreXY.nodes ≠ ∅:
      pc ← A32_PlanarizeCore(coreXY)                 // Step 3b
      if trees exist:
          A33_PlaceTreesInFaces(pc, treeLayouts, L)  // Step 3c
          A34_GlobalStressMinimization(pc)           // Step 3d
          return ConvertPlanarizedToLayoutData(pc)   // drops bend_*/cross_* nodes and edges
  return coreXY
```

---

## 14. A31 — Symmetric tree layout (Step 3a)

Manning–Atallah-flavoured, always grows SOUTH.

```
FUNCTION A31_SymmetricTreeLayout(treeData, rootId) -> TreeLayout:
  nodes ← copy of treeData.nodes with (x,y,level,subtreeWidth) = (0,0,0,0)
  materialise any "<x>_copy" node referenced only by edges, cloning "<x>"

  tree ← BuildTreeStructure(rootId)
  ComputeLevelHeights() ; ComputeSubtreeWidths(tree) ; PositionSymmetrically(tree)
  return { nodes, edges (points unchanged), boundingBox, rootPosition }

FUNCTION BuildTreeStructure(rootId):
  // if the given root is a bare subgraph container (no incident edges, no size),
  // re-root at any node of in-degree 0, else at the min in-degree node
  BFS from root treating edges as UNDIRECTED; the first time a node is reached it
  becomes a child of the current node; assign levels = BFS depth
  return {root, children, parent, levels}

PROCEDURE ComputeLevelHeights():
  levelHeight[l] ← max height of any node at level l   (default 40)

FUNCTION YOfLevel(l):
  y ← 0
  for i in 0..l-1:
      boundary ← levelHeight[i]/2 + MIN_VERTICAL_PADDING(90) + levelHeight[i+1]/2
      y += max(MIN_LEVEL_SPACING(150), boundary)
  return y

FUNCTION ComputeSubtreeWidths(tree):     // bottom-up, boundary-to-boundary
  leaf:  subtreeWidth ← node.width (default 60)
  inner: subtreeWidth ← Σ child.subtreeWidth + (childCount−1)·MIN_HORIZONTAL_GAP(90)

PROCEDURE PositionSymmetrically(tree):
  PositionSubtree(root, centreX = 0)

PROCEDURE PositionSubtree(v, centreX):
  v.x ← centreX ; v.y ← YOfLevel(v.level)
  if v has 0 children: return
  if v has 1 child   : PositionSubtree(child, centreX)          // straight line down
  else               : pairs ← CreateCTreePairs(children)
                       PositionPairedSubtrees(pairs, centreX)

FUNCTION CreateCTreePairs(children):
  // pair up structurally similar siblings so the drawing is mirror-symmetric
  for each child compute: depth, nodeCount, subtreeWidth
  sort children (by the uniform max-width key → effectively stable)
  greedily, for each unused child c:
      partner ← argmin over later unused children p of
          0.6·StructuralSimilarity(c,p) + 0.2·relSizeDiff + 0.1·depthDiff + 0.1·nodeCountDiff
      if best score < 0.5: emit pair {c, partner, size = w(c)+GAP+w(p)}
      else:               emit singleton {c, size = w(c)}

FUNCTION StructuralSimilarity(a,b):
  hash(v) = 'L' for a leaf, else 'N(' + sorted child hashes + ')'
  if hash(a) = hash(b): return 0.0                       // isomorphic
  return 0.3·relSizeDiff + 0.4·relDepthDiff + 0.3·relBranchingDiff

PROCEDURE PositionPairedSubtrees(pairs, centreX):
  total ← Σ pair.size + (|pairs|−1)·GAP
  cursor ← centreX − total/2
  for each pair:
      paired    → place left subtree centred at cursor + wL/2,
                  right subtree at cursor + wL + GAP + wR/2   (recursing into each)
      singleton → place it centred at cursor + w/2
      cursor += pair.size (+ GAP between pairs)
```

_Dead code here: `adjustMergeNodePositions` (re-centring join nodes) and
`routeTreeEdgesOrthogonally` are both commented out of `layoutTree`._

---

## 15. A32 — Core planarisation (Step 3b)

```
FUNCTION A32_PlanarizeCore(core) -> PlanarizedCore:
  nodes ← copy of core nodes
  edges ← core edges as PlanarEdge{ id, start, end, isHorizontal, isVertical, points }
          (points default to the two node centres)

  // Pass 1a: remove parallel edges
  group edges by unordered endpoint pair; from each group keep the representative with the
  FEWEST polyline points; discard the rest

  // Pass 1b: bend dummies
  for each edge with >2 points:
      for each interior point: create node "bend_k" there, split the edge at it
      (segments inherit orientation from their actual geometry)

  // Pass 2: crossing dummies
  intersections ← for every pair of edges NOT sharing an endpoint, the H×V intersection
                  (only axis-aligned H/V pairs are considered)
  for each edge with intersections:
      sort them by Manhattan distance from the edge start
      split the edge at each, inserting "cross_k" nodes

  // faces
  adjacency ← for each node, its neighbours SORTED BY atan2 angle (a planar embedding)
  faces ← ∅ ; used ← ∅
  for each edge, for each of its two half-edges (u→v):
      if (u→v) unused: f ← TraceFace(u, v); if |f.boundary| ≥ 2:
                          faces += f ; mark all its half-edges used
  faces ← dedupe by canonical cyclic key (min over all rotations of the boundary and of its
          reverse, joined by '_')
  the face with the LARGEST polygon area is flagged isExternal
  return { nodes, edges, faces, dummyNodes, embedding }

FUNCTION TraceFace(start, firstNext):
  boundary ← [] ; current ← start ; prev ← null ; next ← firstNext
  repeat (max 20 steps):
      boundary.push(current)
      if prev = null: prev ← current ; current ← next
      else: i ← index of prev in adjacency[current]
            next ← adjacency[current][(i+1) mod deg]      // "next neighbour clockwise"
            prev ← current ; current ← next
  until current = start
  return face with: boundary, bounding box over boundary node positions,
         shoelace area, adjacentCoreNodes = boundary nodes that are not bend_/cross_
```

---

## 16. A33 — Tree placement into faces (Step 3c)

```
PROCEDURE A33_PlaceTreesInFaces(pc, treeLayouts, L):
  DIRECTIONS = cardinal { N(180°, (0,-1)), S(0°, (0,1)), E(-90°, (1,0)), W(90°, (-1,0)) }
             ∪ ordinal  { NE(-135°), NW(135°), SE(-45°), SW(45°) }
             // angle = the rotation applied to a SOUTH-growing tree to make it grow that way

  usedFaces ← ∅
  for each (treeId, treeLayout) in SortTreesBySize(treeLayouts):     // ASCENDING perimeter
      p ← PlaceSingleTree(treeId, treeLayout, usedFaces)
      if p ≠ null:
          placedTrees[treeId] ← p ; ApplyTreePlacement(p)
          usedFaces += p.face.id
          LocalStressRelaxation(treeId)

FUNCTION PlaceSingleTree(treeId, tl, usedFaces):
  coreNodeId ← treeId with "_copy" stripped ; must exist in pc, else fail
  faces ← { f ∈ pc.faces : coreNodeId ∈ f.adjacentCoreNodes }

  sortedFaces ← faces sorted by (unused first, then NON-external first, then larger area)
  candidates ← ∅
  for each face f, for each direction d with positive dot product toward the face
        (for the external face: toward "away from the graph centroid"; if none, default N):
      if d is cardinal: for isFlipped in flipOrder(d):
                            candidates += {f, placementDir: d, growthDir: d, isFlipped}
      else            : for each of the 2 cardinal components g of d:
                            for isFlipped in flipOrder(g):
                                candidates += {f, placementDir: d, growthDir: g, isFlipped}
      // flipOrder(g) = [true,false] if ShouldFlip(g) else [false,true]
      // ShouldFlip(g) = true iff |g.angle − 270| < 45 or |g.angle + 90| < 45  (i.e. EAST)

  score each candidate (below), keep those that fit, pick the minimum, break ties by
      cardinal > ordinal, then external > internal, then larger face area
  return placement or null

FUNCTION ScoreCandidate(c, tl, coreNodeId, usedFaces):
  fits ← FitsInFace(c, tl)                       // see below
  if not fits: score ← ∞ ; return

  stressCost ← GraphStress(after temporarily placing the tree)
             − GraphStress(current core + already-placed trees)      , clamped at ≥ 0
      where GraphStress = Σ_edges (|p_a − p_b| − L)²

  if c.placementDir is cardinal: category ← 1_000_000 ; score ← 0.1·stressCost
  else                         : category ← 2_000_000 ; score ← stressCost
  score ×= (c.face.isExternal ? 0.3 : 1.5)
  score ×= (c.face unused ? 0.8 : 1.0)
  score ×= 1 + 0.1 · (#trees already placed at this same core node)
  return category + score

FUNCTION FitsInFace(c, tl):
  if c.face.isExternal: return true (zero expansion)
  treeBB   ← bounding box of the tree's node CENTRES
  required ← axis-aligned bounding box of treeBB rotated by c.placementDir.angle
  available← the face bounding box
  deficits ← max(0, required.w − available.w), max(0, required.h − available.h)
  distribute deficits into expandN/S/E/W according to the direction
      (cardinal: full deficit along the direction, half the other deficit to each side;
       ordinal: half of each deficit to each named side)
  affected ← face boundary nodes lying within 5px of the corresponding face edge
  cost ← (ΣexpandXYZ)·|affected| + 2·(|expandN−expandS| + |expandE−expandW|)
  return cost ≤ TREE_PLACEMENT_MAX_ACCEPTABLE_STRESS (5000)

PROCEDURE ApplyTreePlacement(p):
  if the expansion has affected nodes: move each affected node by
      ( (expandE−expandW)/2 , (expandS−expandN)/2 )  and recompute all face bounding boxes

  transformed ← for each tree node:
        (x,y) ← node − treeLayout.rootPosition
        if p.isFlipped: x ← −x
        rotate (x,y) by p.growthDirection.angle
  translate so the level-0 node lands exactly on the core node position
  insert every non-"_copy" node into pc.nodes
  insert every tree edge into pc.edges, rewriting "_copy" endpoints to the real core node
  (self-referential edges after rewriting are dropped)

PROCEDURE LocalStressRelaxation(treeId):
  spring relaxation over core + placed-tree nodes with ideal length L,
  force = (|Δ| − L)·0.1 along the unit vector, damping 0.1, ≤20 iterations,
  CORE NODES ARE PINNED (only tree nodes move),
  stop when relative stress improvement < 0.01, or displacement < 1.0, or stress worsens by >10%
```

_Dead code here: `evaluateCandidates`, `selectBestCandidate` (superseded by the "distributed" variants)._

---

## 17. A34 — Post-placement global stress (Step 3d)

```
PROCEDURE A34_GlobalStressMinimization(pc):
  V ← real nodes of pc (dummies excluded) ; E ← all planar edges
  if |V| < 2 or E = ∅: return
  ideal ← A1_BaseEdgeLength(V, E without bend_/cross_ endpoints)

  constraints[v] ← { preservePosition: v.id has no '_' and no '-'   (heuristic "core node")
                                        OR v.id contains '_copy',
                     maintainOrthogonalAlignment: true,
                     constrainHorizontal/Vertical: false }

  repeat ≤30 times:
      forces ← 0
      for each edge (a,b): f ← (|Δ| − ideal)·0.1 along unit(Δ); a += f, b −= f
      for each node: disp ← force · 0.05 ; if preservePosition: disp ×= 0.1
                     apply disp
      stop when |Δstress|/initialStress < 0.1, or Σ|disp| < 0.5,
           or stress got worse by more than 5% of the initial value
```

---

## 18. A9 — Opportunistic improvement (HOLA Step 4)

```
FUNCTION A9_TweakAlignment(layout, opts):
  layout ← A35_AlignmentTweaking(layout, threshold = 30)          // 4a
  layout ← A36_EvenDistribution(layout, iters = 50, tol = 1e-4)   // 4b
  if opts.enableRotation:      layout ← A37_OrientationAdjustment(layout)   // 4c
  if opts.enableFinalCleanup:  layout ← A38_FinalCleanupAndRouting(layout)  // 4d
  return layout
```

### 19. A35 — Near-alignment tightening (4a)

```
FUNCTION A35_AlignmentTweaking(layout, τ):
  H ← FindHorizontalAlignments(nodes, τ)    // sort by y; from each unprocessed node scan
                                            // forward while |Δy| ≤ τ; a run of ≥2 becomes a
                                            // candidate with averagePosition = mean y;
                                            // all its members are marked processed
  V ← FindVerticalAlignments(nodes, τ)      // symmetric, over x
  EnforceAlignments(H) ; EnforceAlignments(V)

PROCEDURE EnforceAlignments(candidates):
  for each candidate c:
      connected ← ∃ an edge between any two members of c
      allowance ← (dimension + 10) × (connected ? 2.0 : 0.5)
                   where dimension = height for horizontal, width for vertical
      if any member must shift more than its allowance: SKIP the candidate
      (WouldViolateConstraints is a stub returning false)
      else: snap every member's y (or x) to round(averagePosition)
```

### 20. A36 — Neighbour-only stress (4b)

```
FUNCTION A36_EvenDistribution(layout, maxIter, tol):
  if <2 nodes or no edges: return unchanged
  ideal ← A1_BaseEdgeLength(nodes, edges)
  adjacency ← direct neighbours only

  NeighbourStress = ½ Σ_v Σ_{u∈adj(v)} (BoundaryDistance(v,u) − ideal)²

  learningRate ← 1e-7
  repeat maxIter times:
      for each node v: g ← Σ_{u∈adj(v)} 3·(centre(v) − centre(u))
      apply v ← v − learningRate·g   (Jacobi)
      every 5 iterations: stop if |Δ NeighbourStress| < tol
  return nodes with x,y ROUNDED to integers
```

(The gradient is a plain neighbour-attraction term, not the derivative of the stated stress;
combined with lr = 1e-7 the practical effect of this pass is the integer rounding.)

### 21. A37 — Orientation adjustment (4c)

```
FUNCTION A37_OrientationAdjustment(layout):
  bbox ← over all nodes; group nodes contribute their full child-derived bounds
  if bbox.width ≥ bbox.height: return unchanged      // already landscape → no rotation

  clockwise ← DetermineBestRotation()
  RotateAll(clockwise) ; NormaliseToOrigin()
  return rotated layout

FUNCTION DetermineBestRotation():
  roots ← nodes with outDegree > 0 and inDegree = 0
  if none: return clockwise
  for each root: dir ← dominant direction of Σ(child − root) over its BFS descendants
                        (SOUTH/NORTH if |Σdy| > |Σdx| else EAST/WEST)
  count how many roots end up SOUTH after CW vs after CCW
  return CW if southCountCW ≥ southCountCCW

PROCEDURE RotateAll(cw):
  node (x,y) → cw ? (y, −x) : (−y, x)
  group nodes additionally swap width ↔ height
  every edge point is rotated the same way

PROCEDURE NormaliseToOrigin():
  translate all nodes and edge points by (−bbox.minX, −bbox.minY)
```

### 22. A38 — Final cleanup + naive re-route (4d)

```
FUNCTION A38_FinalCleanupAndRouting(layout):
  dummies ← { n : n.isDummy }
  nodes   ← nodes \ dummies

  // merge chains that ran through dummies
  for each edge e:
      if neither endpoint is a dummy: keep as is
      else: walk backwards from e.start through predecessor dummies, collecting their
            positions as leading bend points; walk forwards from e.end through successor
            dummies, collecting trailing bend points; emit one edge realStart→realEnd
            whose points are the collected bends (or the original points if none)

  // Manhattan re-route for edges that still have no geometry
  for each edge with no points:
      if |dx| < 1 or |dy| < 1: points ← [start, end]
      else:                    points ← [start, (end.x, start.y), end]     // single bend

  // simplify: drop any interior point collinear with its neighbours (same x or same y)
  return { nodes, edges }
```

---

## 23. A10 — Node overlap removal

```
PROCEDURE A10_DetectAndResolveOverlaps(layout):
  if DetectOverlaps(layout.nodes) ≠ ∅:
      RemoveOverlaps(layout.nodes,
                     {maxIterations:100, convergenceThreshold:0.05,
                      dampingFactor:0.7, preserveStress:true},
                     edge endpoint pairs)

FUNCTION NodeBounds(n): centre ± (width + 2·padding)/2, (height + 2·padding)/2

FUNCTION DetectOverlaps(nodes):
  if n > 20: build a uniform SPATIAL GRID (bucket = 100px, 50px padding); each node is
             inserted into every bucket its bounds touch; only same-bucket pairs are tested
  else     : all O(n²) pairs
  for each pair with overlapX>0 and overlapY>0 emit
       separationVector = push apart along the axis of MINIMUM penetration, magnitude
       overlap+1, signed by the centre difference

PROCEDURE RemoveOverlaps(nodes, opts, edges):
  // 1. discover alignment groups to protect
  horizontal groups: nodes sharing an EXACT y, all-distinct x, x-spread > 0.5·avgWidth
  vertical groups  : symmetric over x
  MAX_DISPLACEMENT ← 400 (from the original position)
  initialStress ← Σ_edges (|Δ| − idealEdgeLength)²

  repeat ≤ maxIterations:
      overlaps ← DetectOverlaps(nodes) ; stop if none
      snapshot positions
      forces ← 0
      for each overlap (a,b):
          sep ← separationVector · dampingFactor
          if a,b in the SAME horizontal group: sep.y ← 0 ; sep.x ← 2.5×(x-direction push)
          if a,b in the SAME vertical group  : sep.x ← 0 ; sep.y ← 2.5×(y-direction push)
          if exactly one of them is a "core" node: push only the other one (full force)
          else: split the force half/half
      apply forces
      re-snap every alignment group to its mean y (resp. mean x)
      clamp each node to within MAX_DISPLACEMENT of its original position
      if preserveStress and stress rose by >20% of the initial value:
          roll back to the snapshot and re-apply the forces with HALF damping
      stop when Σ|force| < convergenceThreshold
```

---

## 24. Group finalisation procedures

```
PROCEDURE A24_DragIntoSubgraphs(G):
  for each true subgraph s with children C:
      translate C so its centroid box coincides with s's box centre
      then push C back inside if it pokes out beyond s's box minus 10px padding
  invalidate (edge.points ← undefined) for every edge internal to a true subgraph

PROCEDURE A25_CompressDisconnectedComponents(G):
  adjacency = edges ∪ parent↔child links ; components = DFS closure (incl. all descendants)
  if ≤1 component: return
  sort components by minX; for each consecutive pair with gap > 100 and NO third-party node
      lying in the gap: shift this component and all later ones left by (gap − 100)
  repeat the same sweep on the Y axis
  finally clear every edge.points (positions changed)

PROCEDURE A26_CheckAllChildrenInGroup(G):
  // (a) orphaned parent references
  for each node whose parentId names a non-existent group:
      clear parentId and push it outside that former parent's box
  // (b) foreign nodes sitting inside a group rectangle
  for each non-group, non-label node n and each group g that is a SIBLING of n
      (same parentId) and whose rectangle overlaps n's rectangle within 5px tolerance:
          pick the nearest side of g, and move n outside it by
              nodeSize/2 + (80 if n connects directly to a child of g else 60)
          break after the first eviction

PROCEDURE A27_LayoutGroups(G, padding, nodeMap):
  build the group tree; process DEPTH-FIRST (deepest groups first)
  for each group g:
      if g has no children: g.width = g.height = 4·padding
      else: b ← A30_CalculateGroupBounds(g, G, nodeMap, padding)
            g.x,g.y ← centre of b ; g.width,g.height ← size of b + 2·padding

FUNCTION A30_CalculateGroupBounds(g, G, nodeMap, padding):
  b ← union of child rectangles (defaults 100×100 for groups, 30×30 otherwise)
  ∪ rectangles of edge-label nodes whose BOTH endpoints are children of g
  ∪ points of edges internal to g that lie within 50px of b
  inflate b by padding on every side; enforce a minimum size of 2·padding
  SIDE EFFECT: writes g.x, g.y, g.width, g.height
  (the `getGroupBounds` variant additionally widens b when >1 sibling subgroups sit on the
   same horizontal line and their packed widths exceed the current bounds)

PROCEDURE A28_ResolveGroupOverlaps(G, padding, nodeMap):   // hierarchical, deepest first
  depth(g) ← distance to a parentless group
  for depth = maxDepth down to 0:
      for each set of SIBLING groups at that depth (same parentId, ≥2 members):
          repeat ≤20 times:
              recompute every sibling's bounds (incl. edge points) and write them back
              for each pair (g1,g2) with overlapping rectangles:
                  direction ← 'horizontal' if |Δcentre.y| < 50
                              'vertical'   if |Δcentre.x| < 50
                              else 'diagonal'
                  mover ← the smaller-area group (tie → the less connected one)
                  horizontal: keep the mover's y aligned to the other's centre, push it
                              along x by overlapX + padding
                  vertical  : mirror of the above
                  diagonal  : push along both axes
                  MOVE THE GROUP TOGETHER WITH ALL ITS DESCENDANTS
                  recompute both bounds
              stop when a full sweep finds no overlap
      after finishing a depth level, re-fit each affected PARENT group's bounds
```

_(`applyHola.resolveGroupOverlaps` — a force-based variant with symmetry snapping and
equal-spacing redistribution — is present but not wired into the pipeline.)_

---

## 25. A29 — Routing (two stages)

```
FUNCTION A29_Routing(G) -> Edge[]:
  if no nodes or no edges: return edges
  G ← A39_AssignSidesAndConnectionPoints(G)     // §26–§29
  G ← A40_OrthogonalEdgeRouting(G)              // §30–§33
  return G.edges
```

---

## 26. A39 — Side assignment (stage 1)

```
PROCEDURE A39_AssignSidesAndConnectionPoints(G):
  SortEdgesByDistance(G)          // §27
  sideUsage[node][side] ← 0                  // counts
  sideSlots[node][side] ← []                 // ordered edge ids
  grid ← RoutingGrid(G.nodes, {cellSize:8, nodeMargin:0})    // no clearance here
  quadrants ← NodeQuadrants(G)               // §28

  for each edge e (in the sorted order):
      if e is a self-loop: skip (handled later)
      top2 ← CalculateOptimalSides(e)                     // §29 — best two (start,end) pairs
      r1 ← ValidateSideSelection(top2[0]) ; r2 ← ValidateSideSelection(top2[1])
           // each runs the real pattern router on a temporary grid; result carries
           // a type ∈ {straight, lshape, zshape, astar}

      priority = {straight:4, lshape:3, zshape:2, astar:1}
      if both valid and same priority : tie-break by QUADRANT SPREAD (below)
      elif both valid                 : take the higher-priority type
      elif exactly one valid          : take it
      else                            : take top2[0]

      e.startSide, e.endSide ← selected

      // label nodes want their two edges on OPPOSITE sides so the label reads through
      if start node is a label node and it already has a first edge:
          if the current route is not straight/aligned, or the opposite side is free:
              try to move the start side to the opposite of the label's first side
      if end node is a label node and it already has a first edge:
          try the opposite side, accept if the resulting path type is no worse

      record alignment info (see NodesAligned, §29) for this edge
      sideUsage[...]++ ; sideSlots[...].push(e.id)

  CalculateEdgePoints(G, sideSlots, connectionSides)       // §29
  ResolveEdgeOverlaps(G.edges)                             // §29
```

**Quadrant tie-break** (only when both candidate side-pairs route equally well):

```
for the start node, count how many of its edge partners fall in each of its four
quadrants (topLeft/topRight/bottomLeft/bottomRight, computed from BOUNDARY-to-BOUNDARY
angles, ignoring axis-aligned pairs);
if the start node has exactly one outgoing partner, fold its incoming partners in too;
dominantQuadrant ← the busiest quadrant OTHER than the one containing this edge's target
                   (with a preference for a quadrant on the same left/right half as the
                    target but the opposite top/bottom half)
if dominantQuadrant and target quadrant are on the same left/right half
     → prefer start sides {top, bottom}
else → prefer start sides {left, right}
pick whichever of the two candidates matches; default to the first
```

---

## 27. Edge ordering for routing

```
PROCEDURE SortEdgesByDistance(G):
  self-loops sort last
  other edges sort ascending by EdgeToEdgeDistance(start, end)
      = |intersect₁ − intersect₂| using the nodes' own shape intersect functions when
        available; otherwise centreDistance − (w₁+h₁)/4 − (w₂+h₂)/4, clamped at ≥0
  label edges use plain centre-to-centre distance
```

Short edges are routed first, so they claim the good, uncontested corridors.

---

## 28. Node quadrants

```
FUNCTION NodeQuadrants(G) -> Map<nodeId, {topLeft,topRight,bottomLeft,bottomRight}: Set<id>>:
  for each non-self edge (a,b) whose endpoints are NOT axis-aligned within 1px:
      quadrant of b as seen from a ← from GeometricAngle(a,b)
      quadrant of a as seen from b ← from GeometricAngle(b,a)

FUNCTION GeometricAngle(a,b):
  boundary points via a.intersect(b.centre) / b.intersect(a.centre), else the rectangle
  boundary point along the centre line
  dx ← b.bx − a.bx ; dy ← −(b.by − a.by)          // math convention, Y up
  quadrant from sign(dx),sign(dy); angle = atan2(|dy|,|dx|) ∈ [0°,90°]
```

---

## 29. Side scoring, connection points, overlap resolution

```
FUNCTION CalculateOptimalSides(n1, n2, sideUsage, obstacles, allEdges, edgeId):
  reverseSides ← the side pair chosen by an already-routed edge n2→n1, if any
  evaluate all 16 (startSide, endSide) combinations with SideScore, keep the best TWO

FUNCTION SideScore(n1, n2, s, t, sideUsage, obstacles, reverseSides):
  pathInfo ← EvaluatePathComplexity(n1,n2,s,t,obstacles)
      // tries a straight path, then a single-bend path (both must respect the exit
      // direction signs); reports bendCount, obstacleHits and the path type; if neither
      // clean option exists, bendCount = 2 (same axis) or 3 (different axis)

  score ← 0
  if NodesAligned(n1,n2,s,t,obstacles).aligned:  score −= 1000
  score += obstacleHits · EDGE_OBSTACLE_PENALTY(200)
  bend penalty: 0 bends → −450 ; 1 → −260 ; 2 → +400 ; ≥3 → +600
  path type bonus: single-bend −140 ; straight −200
  if sideUsage[n1][s] ≥ 5: +1000        (same for the end side)
  score += 20·sideUsage[n1][s] + 20·sideUsage[n2][t]
  direction sanity: if |dy|·w1 > |dx|·h1, reward a vertical exit that matches sign(dy)
                    (−50) else penalise (+30); mirror for the horizontal case
  opposite side pair (right↔left, top↔bottom): −50
  if the nodes are within 10px on an axis and both sides lie on that axis: −100
  if a reverse edge exists: complementary sides −300, otherwise +100
  return score

FUNCTION NodesAligned(n1, n2, s, t, obstacles):
  only defined for opposite side pairs
  overlap ← the shared span on the perpendicular axis (y-span for left/right, x for top/bottom)
  aligned ← overlap > 0 AND (overlap/height₁ > 40% OR overlap/height₂ > 40%)
  blocked ← some non-group obstacle overlaps that span AND lies strictly between the two nodes
  return { aligned, nodeWhichCovered = the node with the larger coverage,
           overlapCenter, coveragePercent = max of the two }

PROCEDURE CalculateEdgePoints(G, sideSlots, connectionSides):
  // pass 1: naive slot positions
  for each edge: points ← [ConnectionPoint(start,startSide,slot,total),
                           ConnectionPoint(end,endSide,slot,total)]
  // pass 2: reduce crossings by swapping slot order on each side
  for each (node, side) with ≥2 edges: MinimizeCrossingsBySwapping
  // pass 3: recompute points, plus straight-through snapping
  for each edge: recompute the two endpoints; then if the pair is ALIGNED, not a parallel
      edge, and both nodes are rectangle-like:
          right↔left  → force both endpoint y's to
                        (coverage>50% ? coveringNode.y : overlapCentre.y : midpoint)
          top↔bottom  → same on x
  edge.points ← [start, end]

FUNCTION ConnectionPoint(node, side, slotIndex, totalSlots):
  dimension ← height for left/right, width for top/bottom
  if rectangle-like and totalSlots > 1:
      spacing ← dimension/(totalSlots+1) ; offset ← (slotIndex+1)·spacing − dimension/2
  elif totalSlots > 1: offset ← (slotIndex − (totalSlots−1)/2) · 10
  else: offset ← 0
  return the side midpoint displaced by `offset` along the side

PROCEDURE MinimizeCrossingsBySwapping(edgeIds, edges, node, side, maxIter = 10):
  crossings ← count of pairwise segment intersections among these edges' first segments
  repeat until no improvement (≤maxIter passes):
      for i in 0..len−2:
          swap slots i and i+1 ; recompute each affected endpoint
          if the crossing count dropped: keep ; else: swap back and restore

PROCEDURE ResolveEdgeOverlaps(edges):
  for each edge not yet processed:
      if another edge is exactly collinear (same y for horizontal / same x for vertical)
         with an overlapping span:
             offset ← 5·(processedCount+1) on y for horizontal overlaps,
                      20·(processedCount+1) on x for vertical overlaps
             shift this edge's endpoints and all of its points by that offset
             mark it processed
```

---

## 30. A40 — Orthogonal edge routing (stage 2)

```
FUNCTION A40_OrthogonalEdgeRouting(G):
  config = { cellSize: 8, nodeMargin: 0, nodeClearance: 10,
             subgraphBoundaryClearance: 15, crossingCurves: {...enabled but never applied} }
  grid ← RoutingGrid(G.nodes, config)                          // §31
  parallelIndex[e] ← position/count among edges sharing the same unordered endpoint pair

  routed ← [] ; failed ← [] ; selfLoops ← [] ; registered ← []

  // ---- PASS 1: cheap pattern routing ----
  for each edge e:
      mark e.hasIntersectionPoints ← true    (tells the painter not to re-clip endpoints)
      if e is a self-loop: defer to selfLoops
      if e has <2 points: defer to failed
      r ← FindOrthogonalPath(e.points.first, e.points.last, grid, tolerance = 10,
                             ctx{source,target,parallelIndex,parallelCount},
                             G, e.startSide, e.endSide)          // §32
      if r.valid: e.points ← r.points ; routed += e
                  grid.MarkPathOccupied(r.points)
                  grid.RegisterRoutedEdge(e)                     // enables crossing queries
      else: failed += e

  // ---- PASS 2: A* for the failures ----
  for each edge e in failed:
      r ← FindAStarPath(startNode, endNode, grid, ctx, registered,
                        {maxConnectionPointCombinations:32, connectionPointSpacing:8,
                         endpointBufferDistance:8, maxSearchIterations:6000,
                         bendPenalty:1000, crossingPenalty:1000})     // §33
      if r.valid: as above (occupy + register)
      else: fall back to the existing two endpoints, or to the two node centres

  // ---- PASS 3: self-loops ----
  for each self-loop e: e.points ← SelfLoopPath(e)                    // §34
                        register it too

  // ---- PASS 4: subgraph boundary nudging ----
  NudgePathsAwayFromSubgraphBoundaries(G.nodes, routed, clearance = 15)   // §35

  // ---- PASS 5: endpoint re-clipping onto the real node shapes ----
  for each routed edge with both nodes having an `intersect` function:
      points[0]    ← startNode.intersect(points[0])
      points[last] ← endNode.intersect(points[last])
  return G with routed edges
```

---

## 31. The routing grid

```
CLASS RoutingGrid(nodes, config):
  bounds ← union of node rectangles, inflated by 10·cellSize on each side
  rows,cols ← ⌈size / cellSize⌉ ; cells ← FREE

  buildSubgraphHierarchy: nodeSubgraphMap[child] = parentId ; subgraphBounds[group] = rect
  markNodesAsBlocked:
      regular node → every cell in its rectangle becomes BLOCKED
      GROUP node   → only its PERIMETER ring of cells becomes BLOCKED, and those cells are
                     recorded in subgraphPerimeterCells[group]     (the interior stays free)
  buildNodeClearanceBounds:
      for every non-group node: an inflated rectangle (+ nodeMargin + nodeClearance)

  worldToGrid(p) = ( ⌊(p.y−top)/cell⌋ , ⌊(p.x−left)/cell⌋ )
  gridToWorld(c) = centre of that cell

  isCellFreeForRouting(cell, ctx):
      FREE or OCCUPIED_BY_EDGE  → free unless it violates another node's clearance box
                                   (the edge's own source/target are exempt)
      BLOCKED on a subgraph perimeter → allowed only if the edge's source or target IS that
                                   subgraph, or is a DESCENDANT of it (any depth)
      otherwise → blocked

  isSegmentClear(a, b, ctx):
      reject non-orthogonal segments outright
      rasterise the segment into cells (pure row/col walk when axis-aligned, Bresenham
      otherwise), skip the first and last cell, and for each interior cell:
          free cell → reject if it violates a foreign node's clearance box
          any cell overlapping the source or target node body → reject
          BLOCKED cell on a subgraph perimeter → allowed iff CanCrossBoundaryAtCell:
                (source inside XOR target inside that subgraph), or the subgraph itself is
                an endpoint AND the cell is within 2 cells of either path end
          else → reject

  markSegmentOccupied / markPathOccupied: FREE cells along the path become OCCUPIED_BY_EDGE
  registerRoutedEdge(info): store it, and index each of its segments by every cell it
                            rasterises into (plus a canonical segment→owner map)

  getSegmentCrossings(seg, excludeId): look up cells of seg in the segment index, test each
        candidate with doSegmentsIntersect (cellSize-tolerant H/H, V/V and H×V tests)
  countPathCrossings / countPathSegmentOverlaps (colinear + overlapping) / countEndpointReuses
        (endpoints within cellSize of an existing edge endpoint)
  doesPathCrossNodes(points, src, tgt): any interior segment whose cells overlap a
        non-group node other than src/tgt

  generateConnectionPoints(node, towardPoint, spacing, bufferZones, {sides, maxPerSide}):
      for each side: if the side midpoint is not buffered, use just the midpoint;
                     otherwise sample offsets ±k·spacing outward from the centre
                     (biased first toward the target), skipping buffered ones
                     priority = distance to target, +10000 if the side faces AWAY
      return the best `maxPerSide` per side, globally sorted by priority
  buildEndpointBufferZones(edges, d): a disc of cell-quantised keys of radius d around
      every existing edge endpoint
```

---

## 32. Pattern router

```
FUNCTION FindOrthogonalPath(a, b, grid, tol, ctx, G, sSide, eSide):
  r ← TryStraightPath(...) ; if valid → type 'straight'
  r ← TryLShapePath(...)   ; if valid → type 'lshape'
  r ← TryZShapePath(...)   ; if valid → type 'zshape'
  return { valid:false, points:[a,b], reason:'all strategies failed' }

FUNCTION TryStraightPath(a, b, grid, tol, ctx, G, sSide, eSide):
  reject if sSide = eSide
  DirectionConflict(p,q): a horizontal run must not head right when the start side is
      'left' or the end side is 'right' (and mirrored cases); same for vertical runs

  parallel offset: for parallel edge k of n, desiredOffset = (k − (n−1)/2)·max(2·cell, 10)

  // (a) OVERLAP BAND: when the nodes are opposite-side connected and their perpendicular
  //     spans overlap by ≥50% of either node, sweep candidate axis values inside the
  //     overlap band (preferring, in order: the target centre, the source centre, the
  //     more-covered node's centre, the band centre, then a ±k·cell scan), each shifted by
  //     the parallel offset, and return the first whose segment is clear.
  // (b) EXACT: if dx = 0 or dy = 0 → clear check → return [a,b]
  // (c) NEAR-STRAIGHT: if dx ≤ tol or dy ≤ tol, snap the non-label endpoint onto the
  //     label endpoint's axis (or the end onto the start when neither is a label), then
  //     for parallel edges retry inside the shared node band with the offsets applied;
  //     finally clear-check the snapped segment.
  return failure otherwise

FUNCTION TryLShapePath(a, b, grid, ctx):
  for offsetPercent in L_OFFSETS (0, ±50, ±40, ±60, ±30, ±70, ±20, ±10):
      m1 ← (b.x, a.y + dy·pct)          // horizontal-first corner
      if both segments clear and m1 sits in a FREE cell: return [a, m1, b]
      m2 ← (a.x + dx·pct, b.y)          // vertical-first corner
      if both segments clear and m2 sits in a FREE cell: return [a, m2, b]

FUNCTION TryZShapePath(a, b, grid, ctx):
  for offsetPercent in Z_OFFSETS (0, ±10 … ±80):
      for ratio in [0.5,0.6,0.7,0.8,0.9,0.1,0.2,0.3,0.4]:
          vertical split : m1=(a.x+dx·r+xoff, a.y), m2=(a.x+dx·r+xoff, b.y)
          horizontal split: m1=(a.x, a.y+dy·r+yoff), m2=(b.x, a.y+dy·r+yoff)
          accept the first variant where all three segments are clear, both midpoints sit in
          FREE cells, and the final approach leg is longer than 20px
```

---

## 33. A\* fallback router

```
FUNCTION FindAStarPath(src, tgt, grid, ctx, existingEdges, opts, excludeEdgeId):
  bufferZones ← grid.buildEndpointBufferZones(existingEdges, opts.endpointBufferDistance)

  // COARSE PASS: sample connection points on all four sides of both nodes at
  //              spacing = fine·3 (default 8·3 = 24), at most 5 per side
  results ← RunSearch(coarse source candidates, coarse target candidates)
  if results empty: retry with the fine spacing over all sides
  if still empty: fail

  best ← results[0]
  // REFINEMENT: if the best path still has crossings / >1 bend / crosses a node,
  //             re-sample finely but ONLY on the two sides the best path already used
  if refine needed: best ← min(best, RunSearch(fine, restricted to best.startSide/endSide))

  if best.metrics.nodeCrossings > 0: fail ("all paths would cross node bodies")
  return best.points, type 'astar'

FUNCTION RunSearch(srcCandidates, tgtCandidates):
  pairs ← cross product, minus same-side pairs that are geometrically impossible
          (equal y with left/left or right/right; equal x with top/top or bottom/bottom)
  sort by combined connection priority, keep the first `maxConnectionPointCombinations` (32)
  for each pair: run RunAStarSearch; collect the successful PathCandidates
  sort with ComparePathCandidates and return

FUNCTION RunAStarSearch(startPoint, startSide, endPoint, endSide, grid, opts, ctx, prio):
  // step off the node boundary: walk outward from each endpoint along its side up to
  // ASTAR_RADIUS (48) cells, stopping at the FIRST blocked cell, and keep only the cells
  // at least `minimumEndpointClearance` (24) away → freeStartCells / freeEndCells
  if either list is empty: return null

  open ← binary MinHeap ordered by (f, crossingCount, bendCount)
  seed one node per freeStartCell with g = 1, h = Manhattan(cell, endCell)

  while open non-empty and iterations < maxSearchIterations (6000):
      cur ← pop
      skip if stale (g worse than the best known) or already closed
      if cur.cell ∈ freeEndCells:
          cells ← reconstruct via parents, prepend startCell, append endCell
          points ← SimplifyPath(cells, grid, startPoint, endPoint, clearance)
          metrics ← Measure(points)
          return the candidate
      close cur
      for each of the 4 neighbours:
          skip if closed or not isCellFreeForRouting(neighbour, ctx)
          crossings ← grid.getSegmentCrossings(cur→neighbour, excludeEdgeId)
          cost ← 1 + (direction changed ? bendPenalty : 0) + |crossings|·crossingPenalty
          relax the neighbour if this g is better

FUNCTION SimplifyPath(cells, grid, start, end, clearance):
  points ← [start]
  for every interior cell where the movement direction changes:
      bend ← (cellWorld.x, lastPoint.y) if the incoming leg was horizontal
             (lastPoint.x, cellWorld.y) if it was vertical         // enforces orthogonality
      keep it (clearance points, first/last bends and, in practice, all bends are kept)
  snap the FINAL bend's free axis exactly onto `end`'s coordinate, so the last segment is
      perfectly axis-aligned rather than grid-quantised
  points.push(end)

FUNCTION Measure(points): { edgeCrossings, nodeCrossings, endpointReuses, segmentOverlaps,
                            bends = |points|−2, totalDistance (Manhattan), connectionPriority }

FUNCTION ComparePathCandidates(p, q):   // strict lexicographic order
  nodeCrossings, then edgeCrossings, then endpointReuses, then segmentOverlaps,
  then bends, then totalDistance, then connectionPriority
```

---

## 34. Self-loops

```
FUNCTION SelfLoopPath(e, node, allEdges):
  usage ← counts of how many already-routed edges attach to each side of `node`
          (each edge's endpoint is assigned to the nearest of the four node borders;
           other self-loops are classified by the angle of their first control point)
  (dir, k) ← the least-used side, with k = its current count
  width ← (node.height)/4 for left/right, (node.width)/4 for top/bottom

  emit a 4-point cubic: [start, cp1, cp2, end] where
      start/end straddle the chosen side, `width` apart, shifted by 0.3·width·k
      cp1/cp2 bulge outward by 0.6·node.height·(1 + 0.25·k)
  (the k terms fan out multiple self-loops on the same side)
```

---

## 35. Subgraph boundary nudge

```
PROCEDURE NudgePathsAwayFromSubgraphBoundaries(nodes, edges, clearance):
  subgraphBounds ← rectangle of every group
  ancestors[n]   ← every group up n's parent chain
  for each edge, for each segment (p_i, p_{i+1}):
      relevant ← ancestors(edge.start) ∪ ancestors(edge.end)     // only the edge's own groups
      for each relevant subgraph bounds B:
          horizontal segment overlapping B's x-range and running in the band
              [B.top − clearance, B.top) or (B.bottom, B.bottom + clearance]
                  → move both y's out to B.top − clearance / B.bottom + clearance
          vertical segment: mirrored over x
      NEVER move the first or the last segment (endpoints stay pinned to the node borders)
```

---

## Appendix A — implemented but not on the execution path

| Procedure                                                                        | Status                                                                                                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `StressMinimizer.removeOverlaps`                                                 | call site in `coreLayout/index.ts` is commented out                                                                                                          |
| `OrthogonalLayouter.ensureEdgeBasedAlignment`, `gentleGridSnap`                  | never called                                                                                                                                                 |
| `SymmetricTreeLayouter.adjustMergeNodePositions`, `routeTreeEdgesOrthogonally`   | commented out of `layoutTree`; tree edges therefore carry no points from Step 3a                                                                             |
| `TreePlacer.evaluateCandidates`, `selectBestCandidate`                           | superseded by the "distributed" variants                                                                                                                     |
| `nodeOrdering.orderNodesInLayers` (barycentre)                                   | no caller                                                                                                                                                    |
| `applyHola.resolveGroupOverlaps` (+ `adjustGroupSymmetry`, `ensureEqualSpacing`) | the pipeline uses `resolveGroupOverlapsWithAlignment` instead                                                                                                |
| `crossingCurves.applyCrossingCurves`                                             | fully implemented (arc/offset curve insertion at crossings, angle filter, priority selection) but never invoked — only its default config object is imported |
| `AlignmentEnforcer.wouldViolateConstraints`                                      | stub returning `false`                                                                                                                                       |

## Appendix B — behaviours worth knowing when reasoning about output

1. **`A9_TweakAlignment` runs only on the outer pass.** The inner subgraph pipeline (`A13_ReRender`) skips Step 4 entirely, so subgraph interiors are never rotated or re-aligned.
2. **Two effectively-inert relaxations.** `A19` uses lr = 1e-8 and `A36` uses lr = 1e-7; both terminate essentially where they started. `A36`'s only durable effect is rounding coordinates to integers.
3. **`A36`'s gradient** is `3·(p_v − p_u)` summed over neighbours — a pure attraction term, not the derivative of the neighbour stress it measures.
4. **Tree placement scoring uses untransformed tree coordinates.** `getPlacedTreeNodes` reads `treeLayout.nodes` (local tree space), so the stress baseline for later trees is computed against pre-placement geometry.
5. **`sortTreesBySize` sorts ascending** by perimeter (smallest tree gets first pick of faces); the comment above it says "largest first" and the descending version is commented out.
6. **Face sorting** puts non-external faces before external ones, while the scorer multiplies external-face scores by 0.3 (i.e. strongly prefers them) — the two preferences point in opposite directions.
7. **Groups block only their perimeter** in the routing grid; the interior is routable, and crossing the perimeter is permitted only for edges whose source or target is that group or a descendant of it.
8. **Routing runs three times** on a graph with true subgraphs: once per subgraph during `A2`, then once for the whole graph in `A12`, then group frames are re-fitted around the resulting edge points.

---

## Appendix C — file map

| Concern                                                          | File                                                                                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Master pipeline                                                  | `layoutCore.ts`                                                                                                                                        |
| Renderer wiring, label injection                                 | `index.ts`, `injectEdgeLabelNodes.ts`                                                                                                                  |
| Inner pipeline, sorting, component compression, drag-into-groups | `reRenderUtil.ts`                                                                                                                                      |
| Cycle removal                                                    | `cycleUtils.ts`                                                                                                                                        |
| Decomposition (core/trees)                                       | `topologicalDecomposition.ts`                                                                                                                          |
| Orphan handling                                                  | `subgraphOrphanHandler.ts`                                                                                                                             |
| Step 2 (core layout)                                             | `coreLayout/index.ts`, `stressMinimizer.ts`, `stressMinimizationUtils.ts`, `orthogonalLayouter.ts`, `graphUtils.ts`                                    |
| Step 3 (trees)                                                   | `treeLayout/index.ts`, `symmetricTreeLayouter.ts`, `corePlanarizer.ts`, `treePlacer.ts`, `stressMinimization.ts`, `utils.ts`                           |
| Step 4 (tweaking)                                                | `alignmentTweaking/index.ts`, `alignmentDetector.ts`, `alignmentEnforcer.ts`, `neighborStressOptimizer.ts`, `layoutRotation.ts`, `finalCleanup.ts`     |
| Node/group overlap removal                                       | `overlapUtils.ts`, `applyHola.ts`, `utils.ts`                                                                                                          |
| Routing stage 1 (sides)                                          | `edgeRouting.ts`                                                                                                                                       |
| Routing stage 2 (paths)                                          | `orthogonal-routing/orthogonalEdgeRouting.ts`, `grid.ts`, `pathfinding.ts`, `Astar.ts`, `selfloop.ts`, `subgraphBoundaryNudge.ts`, `crossingCurves.ts` |
| Constants                                                        | `Constants.ts`                                                                                                                                         |

# Grid-like layout — implementation-agnostic pseudocode

Source: _Incremental Grid-like Layout Using Soft and Hard Constraints_ — Steve Kieffer, Tim
Dwyer, Kim Marriott, Michael Wybrow (2013). The pseudocode below is the reconstruction this
implementation was written against; it is derived only from algorithmic content the paper states
explicitly. Where the paper defers to an external procedure — most importantly constrained
force-directed layout (CFDL) and non-overlap handling — the procedure stays a black box here
rather than being silently reinvented (see §30).

In this implementation CFDL **is** the sibling IPSEP-COLA layout: `../ipsep-cola/solver` provides
the constrained stress-majorisation solver and `../ipsep-cola/adapter` the Mermaid graph, initial
layout, separation constraints and write-back. Only the grid-like phase-2 machinery of this paper
is new.

## Where each section lives

| §     | Pseudocode                                    | Implementation                                       |
| ----- | --------------------------------------------- | ---------------------------------------------------- |
| 2, 26 | `GRID_LIKE_LAYOUT` / `PAPER_GRID_LAYOUT`      | `layoutCore.ts`                                      |
| 3     | `P_STRESS`                                    | `snap/penalties.ts` (`accumulatePStress`)            |
| 4     | `q_sigma`                                     | `snap/penalties.ts` (`qSigma`, `qSigmaDerivative`)   |
| 5     | `NS_STRESS`                                   | `snap/penalties.ts` (`accumulateNodeSnap`)           |
| 5     | `NODE_SNAP_LAYOUT`                            | `layoutCore.ts` (mode `node-snap`)                   |
| 6.1   | `CLOSEST_GRID_POINT`                          | `snap/penalties.ts` (`closestGridPoint`)             |
| 6.2   | `GS_STRESS`                                   | `snap/penalties.ts` (`accumulateGridSnap`)           |
| 6.3   | Grid-aware non-overlap                        | `gridConstraints.ts` (`requiredSeparation`)          |
| 6.4   | `GRID_SNAP_LAYOUT`                            | `layoutCore.ts` (mode `grid-snap`)                   |
| 7     | `NODE_AND_GRID_SNAP_LAYOUT`                   | `layoutCore.ts` (mode `node-and-grid-snap`)          |
| 8     | `EN_SEP`                                      | `snap/penalties.ts` (`accumulateEdgeNodeSeparation`) |
| 10    | `MAKE_SEPARATED_ALIGNMENT`                    | `aca/separatedAlignment.ts`                          |
| 11    | `ADAPTIVE_CONSTRAINED_ALIGNMENT`              | `aca/aca.ts`                                         |
| 12    | `CHOOSE_SA`                                   | `aca/chooseSa.ts`                                    |
| 13    | Alignment-choice heuristics                   | `aca/chooseSa.ts` (`alignmentCost`)                  |
| 14    | Degree-2 bend penalty                         | `aca/chooseSa.ts` (`bendPenalty`)                    |
| 16    | Alignment / adjacency flags                   | `aca/alignmentFlags.ts`                              |
| 17–18 | `CREATES_COINCIDENCE`                         | `aca/alignmentFlags.ts` (`createsCoincidence`)       |
| 19–22 | Definite vs tentative constraints, `ACA_FULL` | `aca/aca.ts`                                         |
| 23    | `ACA_PLUS_GRID_SNAP`                          | `layoutCore.ts` (mode `aca-grid-snap`, the default)  |
| 24    | Interactive Node-Snap radius                  | `snap/penalties.ts` (`nodeSnapRadius: 'node-size'`)  |
| 25    | Interactive drag behaviour                    | not implemented — Mermaid layout is once-off         |
| 30.3  | `MINIMIZE_WITH_CONSTRAINTS`                   | `snap/snapLayout.ts` (projected gradient descent)    |

## Mermaid-specific deviations

Each is documented at its call site; collected here for review.

1. **`C_user` is the diagram's declared direction.** Mermaid has no user-drawn constraints, so the
   "definite" constraint set (§19) is the flow constraints IPSEP-COLA derives from `TB`/`LR`/… plus
   the non-overlap constraints. They take precedence over every ACA alignment, exactly as §19
   requires of user constraints.
2. **Feasible directions are filtered by the flow (§12).** With a flow constraint on the y axis, an
   alignment that equalises y is infeasible by construction, so `CHOOSE_SA` never proposes it. For
   `TB`/`BT` that leaves the two vertical alignments, for `LR`/`RL` the two horizontal ones.
3. **Rejection uses residual violation, not `|λ|` (§21).** The paper's projection surfaces Lagrange
   multipliers for conflicting constraints. The IPSEP-COLA projection this implementation reuses
   parks constraints it cannot repair instead, so a tentative alignment is judged by how far the
   finished layout leaves it violated, and the worst offender is rejected.
4. **Screen coordinates.** Mermaid's y axis grows downward, so this implementation names directions
   by where `v` sits relative to `u` on screen: `ours(u,v,'south') == paper's SA(u,v,N)`, and
   `east`/`west` match the paper exactly. See `aca/separatedAlignment.ts`.
5. **Numeric optimiser (§30.3).** The paper does not specify how the soft-constraint objective is
   minimised. `snap/snapLayout.ts` uses projected gradient descent with a backtracking line search,
   projecting onto the separation constraints with the IPSEP-COLA block solver (§4 `PROJECT`).
6. **Obliqueness score (§13.2, §30.4).** Neither the obliqueness score nor the stress-change
   estimate `K_dS` is defined in the source. `aca/chooseSa.ts` implements both costs concretely and
   says so: obliqueness as the perpendicular displacement the alignment forces, stress-change as the
   exact P-stress delta of that displacement.

---

## 1. Problem definition

```text
G = (V, E, w, h)
```

`w[v]`, `h[v]` are node dimensions; the layout assigns each `v` a centre `(x[v], y[v])`. Optional
inputs: user constraints `C_user`, ideal edge length `dL`, grid spacing `σ`, snap distance `τ`,
weights `k_ns`, `k_gs`, `k_en`, and a heuristic for choosing adaptive alignments.

Desired properties: nodes on or near a coarse grid; many edges horizontal or vertical. Also: no
node-node overlap, no edge-node overlap, no coincident edges, preservation of the initial
force-directed shape, preservation of user constraints.

---

## 2. High-level framework

Three mechanisms: **Node-Snap** and **Grid-Snap** (soft constraints) and **Adaptive Constrained
Alignment** / ACA (hard constraints). They may be combined.

```text
PROCEDURE GRID_LIKE_LAYOUT(G, C_user, mode, parameters):

    # Phase 1: an untangled initial layout
    (x, y) ← FORCE_DIRECTED_LAYOUT(G, constraints = C_user,
                                   extra_snap_terms = none,
                                   non_overlap = disabled)

    # Phase 2: the selected grid-like beautification
    IF mode = NODE_SNAP:
        RETURN NODE_SNAP_LAYOUT(G, C_user, x, y, parameters)
    ELSE IF mode = GRID_SNAP:
        RETURN GRID_SNAP_LAYOUT(G, C_user, x, y, parameters)
    ELSE IF mode = NODE_SNAP_PLUS_GRID_SNAP:
        RETURN NODE_AND_GRID_SNAP_LAYOUT(G, C_user, x, y, parameters)
    ELSE IF mode = ACA:
        RETURN ADAPTIVE_CONSTRAINED_ALIGNMENT(G, C_user, parameters.heuristic)
    ELSE IF mode = ACA_PLUS_GRID_SNAP:
        (x, y, C) ← ADAPTIVE_CONSTRAINED_ALIGNMENT(G, C_user, parameters.heuristic)
        RETURN GRID_SNAP_LAYOUT(G, C, x, y, parameters)
```

---

## 3. Base objective: P-stress

```text
d(u,v) = Euclidean distance between u and v
d_uv   = ideal graph-theoretic distance between u and v
dL     = ideal edge length
w_uv   = 1 / d_uv²
w_p    = 1 / dL
positive(z) = max(z, 0)
```

```text
FUNCTION P_STRESS(G, x, y, dL):

    total ← 0

    FOR every unordered pair {u,v}, u < v:
        total ← total + w_uv · positive(d_uv - d(u,v))²

    FOR every edge (u,v) ∈ E:
        total ← total + w_p · positive(d(u,v) - dL)²

    RETURN total
```

Unlike ordinary stress, P-stress does not penalise unconnected nodes for being farther apart than
their desired distance.

---

## 4. Snap penalty

```text
FUNCTION q_sigma(z, τ):
    IF |z| ≤ τ: RETURN z² / τ²
    ELSE:       RETURN 0
```

Outside the snap radius the term has no effect; inside it, the node is attracted to exact
alignment.

---

## 5. Node-Snap

```text
FUNCTION NS_STRESS(G, x, y, τ):
    total ← 0
    FOR each edge (u,v) ∈ E:
        total ← total + q_sigma(x[u] - x[v], τ) + q_sigma(y[u] - y[v], τ)
    RETURN total
```

Objective: `P-stress + k_ns · NS-stress + k_en · EN-sep`, Grid-Snap disabled.

```text
PROCEDURE NODE_SNAP_LAYOUT(G, C_user, initial_x, initial_y, parameters):

    τ    ← parameters.snap_distance
    k_ns ← parameters.node_snap_weight
    k_en ← parameters.edge_node_separation_weight
    dL   ← parameters.ideal_edge_length

    objective(x,y) ← P_STRESS(G, x, y, dL)
                   + k_ns · NS_STRESS(G, x, y, τ)
                   + k_en · EN_SEP(G, x, y, τ)

    constraints ← C_user ∪ NODE_NON_OVERLAP_CONSTRAINTS(G)

    RETURN MINIMIZE_WITH_CONSTRAINTS(objective, initial_x, initial_y, constraints)
```

Non-overlap constraints are essential: the snap terms can otherwise stack nodes on top of one
another.

---

## 6. Grid-Snap

The grid is `{ (nσ, mσ) | n,m ∈ ℤ }`. For node `u`, `(a[u], b[u])` is the nearest grid point; ties
break in favour of the point closer to the origin.

### 6.1 Nearest grid point

```text
FUNCTION CLOSEST_GRID_POINT(x, y, σ):

    candidates ← Cartesian product of the nearest multiples of σ to x and to y

    best ← NULL; best_distance ← +∞; best_origin_distance ← +∞

    FOR each point p in candidates:
        d        ← EuclideanDistance((x,y), p)
        d_origin ← EuclideanDistance((0,0), p)

        IF d < best_distance:
            best ← p; best_distance ← d; best_origin_distance ← d_origin
        ELSE IF d = best_distance AND d_origin < best_origin_distance:
            best ← p; best_origin_distance ← d_origin

    RETURN best
```

### 6.2 Grid-Snap stress

```text
FUNCTION GS_STRESS(G, x, y, σ, τ):
    total ← 0
    FOR each node u ∈ V:
        (a,b) ← CLOSEST_GRID_POINT(x[u], y[u], σ)
        total ← total + q_sigma(x[u] - a, τ) + q_sigma(y[u] - b, τ)
    RETURN total
```

The paper sets `τ = σ / 2`.

### 6.3 Grid-aware non-overlap

With Grid-Snap active, separation constraints are strengthened so no more than one node centre can
occupy the vicinity of a grid point: `minimum separation = σ`.

### 6.4 Procedure

```text
PROCEDURE GRID_SNAP_LAYOUT(G, C_user, initial_x, initial_y, parameters):

    σ    ← parameters.grid_spacing
    τ    ← σ / 2
    k_gs ← parameters.grid_snap_weight
    k_en ← parameters.edge_node_separation_weight
    dL   ← σ        # the paper recommends dL = σ for the initial FD layout

    objective(x,y) ← P_STRESS(G, x, y, dL)
                   + k_gs · GS_STRESS(G, x, y, σ, τ)
                   + k_en · EN_SEP(G, x, y, τ)

    constraints ← C_user ∪ GRID_AWARE_NON_OVERLAP_CONSTRAINTS(G, minimum_separation = σ)

    RETURN MINIMIZE_WITH_CONSTRAINTS(objective, initial_x, initial_y, constraints)
```

---

## 7. Combined Node-Snap + Grid-Snap

Objective: `P-stress + k_ns · NS-stress + k_gs · GS-stress + k_en · EN-sep`, over the grid-aware
non-overlap constraints of §6.3.

---

## 8. Edge-node separation

`E_V` / `E_H` are the vertically / horizontally aligned edges. `d(u,e)` is the length of the
perpendicular from `u` to `e` when that perpendicular meets the segment, and `+∞` otherwise.

```text
FUNCTION EN_SEP(G, x, y, τ):

    total  ← 0
    E_axis ← HORIZONTALLY_ALIGNED_EDGES(G,x,y) ∪ VERTICALLY_ALIGNED_EDGES(G,x,y)

    FOR each edge e ∈ E_axis:
        FOR each node u ∈ V:
            d ← NORMAL_DISTANCE_IF_EXISTS(u, e)      # +∞ if no normal hits e
            z ← max(τ - d, 0)
            total ← total + q_sigma(z, τ)

    RETURN total
```

It discourages nodes lying close to axis-aligned edges, edge-node intersections, and coincident
axis-aligned edges.

---

## 9. Adaptive Constrained Alignment (ACA)

> Repeatedly select an edge and permanently make it horizontal or vertical, provided the new
> alignment is compatible with the existing constraint system and does not create undesirable
> coincident edges.

The process is greedy and each edge is aligned at most once, so there are at most `|E|` iterations.

---

## 10. Separated alignments

ACA adds an alignment equality **and** an ordering inequality, which stops adjacent aligned edges
collapsing onto one another.

```text
α(u,v) = (w[u] + w[v]) / 2
β(u,v) = (h[u] + h[v]) / 2
```

```text
FUNCTION MAKE_SEPARATED_ALIGNMENT(u, v, D):

    IF D = NORTH: RETURN { x[u] = x[v],  y[v] + β(u,v) ≤ y[u] }
    IF D = SOUTH: RETURN MAKE_SEPARATED_ALIGNMENT(v, u, NORTH)
    IF D = WEST:  RETURN { y[u] = y[v],  x[v] + α(u,v) ≤ x[u] }
    IF D = EAST:  RETURN MAKE_SEPARATED_ALIGNMENT(v, u, WEST)
```

---

## 11. Main ACA procedure (Figure 2)

```text
PROCEDURE ADAPTIVE_CONSTRAINED_ALIGNMENT(G, C, H):

    (x,y) ← CFDL(G, C)          # layout satisfying the current constraints
    SA    ← H(G, C, x, y)       # best next separated alignment

    WHILE SA ≠ NULL:
        C.append(SA)
        (x,y) ← CFDL(G, C)
        SA    ← H(G, C, x, y)

    RETURN (x, y, C)
```

`CFDL` is the constrained force-directed layout procedure the paper assumes rather than redefines.

---

## 12. Generic alignment selection

```text
PROCEDURE CHOOSE_SA(G, C, x, y, K):

    best_alignment ← NULL
    best_cost      ← +∞

    FOR each edge (u,v) ∈ E:
        FOR each direction D ∈ {NORTH, SOUTH, WEST, EAST}:

            IF NOT CREATES_COINCIDENCE(C, x, y, u, v, D):
                cost ← K(u,v,D)
                IF cost < best_cost:
                    best_alignment ← MAKE_SEPARATED_ALIGNMENT(u,v,D)
                    best_cost      ← cost

    RETURN best_alignment
```

A cost of `+∞` means the candidate must never be selected. When every remaining candidate is
invalid or infinite, `CHOOSE_SA` returns `NULL` and ACA terminates.

---

## 13. Alignment-choice heuristics

All heuristics follow two principles: preserve the shape of the initial force-directed layout, and
avoid obscuring structure through overlaps. They differ only in `K(u,v,D)`.

### 13.1 Stress change

```text
FUNCTION K_STRESS_CHANGE(u, v, D):
    RETURN estimated change in stress caused by imposing SA(u,v,D)
```

Denoted `K_dS`; smaller is preferred. The paper does not give the estimate.

### 13.2 Edge obliqueness

```text
FUNCTION K_OBLIQUENESS(u, v, D):
    RETURN -EDGE_OBLIQUENESS(u,v)
```

The practical intent is to constrain first the edges whose current geometry already makes an
axis-aligned interpretation natural.

---

## 14. Degree-2 bend penalty

If an alignment would turn a degree-2 node into a bend point — one incident edge horizontal, the
other vertical — the candidate takes a large but finite penalty:

```text
FUNCTION DEGREE_TWO_ADJUSTED_COST(G, C, x, y, u, v, D, base_cost):

    cost ← base_cost(u,v,D)

    IF SA(u,v,D) would make a degree-2 node have one horizontal
       and one vertical incident edge:
        cost ← cost + 1000

    RETURN cost
```

The penalty postpones such alignments rather than prohibiting them, which encourages long chains of
degree-2 nodes to become straight and cycles of them to become rectangular.

---

## 15. Convention-based heuristics

Domain-specific costs are permitted; the paper's SBGN variant replaces degree with **non-leaf
degree** (the number of neighbours that are not leaves). No general formal specification is given.

---

## 16. Preventing edge coincidence

The implementation keeps a `|V| × |V|` array of flags recording, per node pair, whether they are
horizontally aligned, vertically aligned, and whether an edge connects them.

```text
initialisation:                O(|V|² + |E| + |C|)
update after a new alignment:  O(|V|)
coincidence test per candidate O(|V|)
```

---

## 17. Coincidence test for eastward alignment

Theorem 1: `SA(u,v,E)` creates a coincident edge iff there is a node `w` horizontally aligned with
`u` or `v` such that either

```text
(i)  edge (u,w) exists AND (x[u] < x[w] OR x[v] < x[w])
(ii) edge (w,v) exists AND (x[w] < x[v] OR x[w] < x[u])
```

```text
FUNCTION CREATES_COINCIDENCE_EAST(G, alignment_flags, x, u, v):

    FOR each node w ∈ V:
        IF HORIZONTALLY_ALIGNED(w,u) OR HORIZONTALLY_ALIGNED(w,v):

            IF edge(u,w) exists AND (x[u] < x[w] OR x[v] < x[w]):
                RETURN TRUE
            IF edge(w,v) exists AND (x[w] < x[v] OR x[w] < x[u]):
                RETURN TRUE

    RETURN FALSE
```

The vertical case is analogous and the remaining compass directions are symmetric. The theorem
assumes `SA(u,v,D)` is proposed only for `(u,v) ∈ E`.

---

## 19. Respecting user-defined constraints

```text
DEFINITE  constraints = user-defined
TENTATIVE constraints = alignments introduced by ACA
```

User-defined constraints always take precedence: on conflict, an ACA alignment is rejected rather
than a user constraint invalidated.

---

## 20. Modified constraint projection

```text
PROCEDURE ACA_PROJECT_CONSTRAINTS(C, positions):

    active_set ← ∅

    REPEAT
        c ← most violated constraint
        TRY to satisfy c with minimum disturbance

        IF conflict occurs:
            IF conflict contains tentative constraints:
                reject one or more tentative constraints
            ELSE:
                handle according to the base projection method
        ELSE:
            add c to active_set
    UNTIL projection is complete
```

---

## 21. Choosing which tentative constraint to reject

Alignment constraints are equalities, so the sign of the multiplier does not matter; the paper
rejects the tentative constraint with maximum `|λ[c]|`, which should permit the greatest reduction
in the stress objective.

```text
FUNCTION CHOOSE_TENTATIVE_TO_REJECT(conflicting_constraints):

    candidates ← tentative constraints among conflicting_constraints
    IF candidates is empty: RETURN NULL
    RETURN argmax over c ∈ candidates of |λ[c]|
```

---

## 22. ACA with constraint priority

```text
PROCEDURE ACA_FULL(G, C_user, cost_function):

    C_definite  ← C_user
    C_tentative ← ∅

    INITIALIZE_ALIGNMENT_FLAGS(G, C_definite)

    (x,y) ← CFDL(G, C_definite, projection = ACA_PROJECT_CONSTRAINTS)

    LOOP:
        SA ← CHOOSE_SA(G, C_definite ∪ C_tentative, x, y, cost_function)
        IF SA = NULL: BREAK

        mark SA as TENTATIVE
        C_tentative ← C_tentative ∪ {SA}
        UPDATE_ALIGNMENT_FLAGS(SA)

        (x,y) ← CFDL(G, C_definite ∪ C_tentative,
                     projection = ACA_PROJECT_CONSTRAINTS)

        IF one or more tentative constraints were rejected during projection:
            remove them from C_tentative
            update alignment flags accordingly

    RETURN (x, y, C_definite ∪ C_tentative)
```

---

## 23. ACA + Grid-Snap

ACA produces exact horizontal and vertical alignments but does not place nodes on grid points, so
Grid-Snap may run afterwards:

```text
PROCEDURE ACA_PLUS_GRID_SNAP(G, C_user, heuristic, grid_parameters):

    (x,y,C) ← ADAPTIVE_CONSTRAINED_ALIGNMENT(G, C_user, heuristic)
    (x,y)   ← GRID_SNAP_LAYOUT(G, C, x, y, grid_parameters)
    RETURN (x, y, C)
```

This combination produced the strongest edge-obliqueness result in the paper's evaluation.

---

## 24. Interactive Node-Snap variant

A single common `τ` made nodes clump when the snap distance exceeded typical node dimensions, so the
interactive version scales the radius with the nodes involved:

```text
FUNCTION INTERACTIVE_NS_STRESS(G, x, y):
    total ← 0
    FOR each edge (u,v) ∈ E:
        total ← total + q_sigma(x[u] - x[v], α(u,v))
                      + q_sigma(y[u] - y[v], β(u,v))
    RETURN total
```

---

## 26. Complete once-off pipeline

```text
PROCEDURE PAPER_GRID_LAYOUT(G, C_user, method, parameters):

    # STEP 1 — initial untangled force-directed layout
    IF method uses Grid-Snap: initial_dL ← parameters.grid_spacing
    ELSE:                     initial_dL ← parameters.ideal_edge_length

    (x,y) ← MINIMIZE(P_STRESS(G, x, y, initial_dL),
                     constraints = C_user, non_overlap = disabled)

    # STEP 2 — grid-like beautification, dispatched on `method` exactly as §2
```

---

## 27. Algorithmic properties

Each accepted separated alignment consumes an edge, and each edge is aligned at most once, so
`maximum ACA iterations ≤ |E|`; ACA also stops early when `CHOOSE_SA` returns `NULL`. Overall
runtime is dominated by the repeated CFDL calls.

---

## 28. Distinction between the three methods

```text
NODE-SNAP   soft attraction; connected nodes tend to align; exact alignment not guaranteed
GRID-SNAP   soft attraction; nodes tend toward grid points; exact placement not guaranteed
ACA         hard constraints; accepted alignments are exact; nodes not placed on grid points
```

`ACA + Grid-Snap` combines exact axis alignment with attraction toward a regular grid.

---

## 30. What the paper leaves external or underspecified

Not to be invented when implementing from this source alone:

1. the constrained force-directed layout solver `CFDL`;
2. the non-overlap constraint generation algorithm;
3. the numerical optimisation implementation;
4. the formula for the stress-change estimate `K_dS`;
5. the domain-specific SBGN heuristic variants;
6. numeric thresholds for interactive "tear-away" behaviour;
7. a complete orthogonal edge-routing algorithm.

This implementation supplies 1 and 2 from IPSEP-COLA, and states its own choices for 3, 4 and 6 at
the call sites (see the deviations list above). 5 and 7 are out of scope: edges are drawn straight,
as they are for IPSEP-COLA.

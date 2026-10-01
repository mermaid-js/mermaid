# Grid edge routing

Grid layout calculates edge paths automatically after it measures and positions the diagram. Users control item placement and spacing; they do not provide absolute edge coordinates or waypoints.

For grid syntax and configuration, see the [grid layout documentation](../../../docs/syntax/grid-layout.md).

## Routing behavior

The calculated route is an orthogonal polyline made from horizontal and vertical segments. The router:

- avoids measured nodes, unrelated groups, and group titles
- may use unused space within a grid cell
- crosses group boundaries when connecting nodes in different groups
- chooses attachment sides and coordinates automatically
- produces the same route for the same diagram and configuration

Grid cells are placement regions, not obstacles. An edge can cross an unused part of a cell as long as it does not cross protected node or group geometry.

## Routing algorithms and migration status

Grid routing currently combines a deterministic corridor router with a sparse visibility router.
Both are production paths.

For an ordinary unbundled edge whose endpoints share a container, Mermaid first considers the
corridor route. It uses that route only when:

- the selected endpoint ports are legal
- the complete route passes measured-geometry validation
- the route length equals the Manhattan lower bound between those ports

In that case, sparse search cannot produce a shorter route, so Mermaid avoids building a visibility
topology and running A\*. If any condition fails, the edge uses sparse visibility routing instead.
Self-loops and parallel or reverse bundles also use sparse routing.

Hierarchy routing is partially migrated. Bundles, hierarchy edges whose endpoints have no unrelated
incident edges, and plans whose corridor route fails validation use sparse routing through every
group-boundary segment. A single hierarchy edge can still use validated corridor segments when at
least one endpoint is shared with another edge. For an edge between a group and one of its
descendants, the segment in the lowest common ancestor uses sparse routing even when an ascent or
descent segment still uses corridor routing.

The corridor router also remains the fallback for defined sparse topology and search resource
limits. Mermaid commits that fallback only when it passes route validation; an unchecked route is
never returned.

Test-only topology caps, search caps, and dual-route comparison disable the ordinary fast path so
those tests exercise sparse topology, search, and fallback behavior. Normal routing and performance
tests exercise the production fast path separately.

Removing the corridor router requires more than replacing its call sites. Sparse routing must first:

- route the remaining shared-endpoint hierarchy cases without introducing shared route segments or
  crossings
- meet the large-diagram performance target without the ordinary-edge fast path
- pass generated nested-hierarchy, label, self-loop, bundle, and fallback coverage
- complete release-level route and performance validation

After those gates hold, the corridor router, corridor metadata, resource fallback, compatibility
instrumentation, and obsolete tests can be removed together.

## Search budgets

Sparse routing has two deterministic search-state limits:

- a per-search cap that prevents one endpoint or portal search from consuming unbounded work
- an invocation cap shared by all sparse searches in one grid render

The shared cap bounds total routing CPU work across all edges and containers. Edges are processed in
a deterministic order, so the allocation and resulting geometry are reproducible. If an edge has
already found a valid candidate before a later candidate reaches the cap, Mermaid keeps that valid
candidate. After the invocation budget is exhausted, later routes that still require sparse search
use the validated corridor fallback. Edges accepted by the corridor fast path do not consume the
sparse-search budget.

This is a safety bound, not a fairness guarantee. A complex edge early in the route order can leave
less search capacity for unrelated later edges. When the shared invocation budget is first
exhausted, Mermaid emits one warning with the first affected edge and container. Individual
fallbacks remain available through routing instrumentation and debug logging.

## Nested groups

For an edge that crosses a group boundary, the router selects a legal crossing point that avoids the group title and corners. An edge that crosses several nested groups is assembled from routes within each group.

If the router cannot find a valid path around node or group geometry, Mermaid reports `GRID_ROUTE_NOT_FOUND` instead of returning an unchecked route.

## Parallel, reverse, and self-loop edges

Parallel and reverse edges use separate endpoint ports and lanes when the available geometry permits it. Self-loops use separate ports on the same node.

Dense nested diagrams can require a hierarchy edge to share part of an internal corridor with a parallel or reverse edge. Endpoint ports remain distinct, but part of the rendered paths can overlap.

## Edge labels

Edge labels are placed after the initial routes are calculated. Mermaid attempts to move affected routes around the complete set of label reservations. If that is not possible, it retries individual labels.

As a final fallback, an edge can pass through another edge's label rather than failing the whole diagram. Node, group, title, marker-clearance, and own-label-anchor checks still apply.

## Edge curves

The orthogonal points are the calculated route. `grid.curve` controls how the shared renderer draws those points:

- `rounded` preserves the route with rounded corners and is the default
- `linear` preserves the route with square corners
- other supported curves interpolate between the points and can move outside the calculated corridor

Interpolated curves other than `linear` and `rounded` are not revalidated against obstacles. Use `linear` or `rounded` when preserving the obstacle-aware route is important.

`grid.edgeCornerRadius` applies only to `rounded` edges. Each corner radius is limited by the lengths of its adjacent segments.

## Improve crowded routes

If a diagram cannot be routed or has too many overlapping paths:

- increase `rowGap`, `columnGap`, or `cellGap`
- move crowded nodes to different rows or columns
- split a crowded cell into a nested subgraph
- use `linear` or `rounded` instead of an interpolating curve

Grid routing is bounded to prevent a difficult diagram from consuming unbounded time or memory. Increasing spacing or simplifying the placement usually gives the router more legal corridors.

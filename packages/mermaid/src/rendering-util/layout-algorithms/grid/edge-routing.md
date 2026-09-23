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

## IPSEPCOLA Documentation :

IPSep-CoLa: An Incremental Procedure for Separation Constraint Layout of Graphs

## How IPSep-CoLa built :

IPSep-CoLa follows a multi-stage process to compute a well-structured layout:

1. Layer Assignment :
   The layer assignment algorithm organizes nodes into hierarchical layers to create a structured layout for directed graphs. It begins by detecting and temporarily removing cyclic edges using a depth-first search (DFS) approach, ensuring the graph becomes a Directed Acyclic Graph (DAG) for proper layering. The algorithm then performs a topological sort using Kahn's method, calculating node ranks (layers) based on in-degree counts. Each node's layer is determined by its position in the topological order, with parent nodes always appearing in higher layers than their children to maintain proper flow direction.

   The implementation handles special cases like nested nodes by considering parent-child relationships when calculating layers. Nodes without dependencies are placed in layer 0, while subsequent nodes are assigned to layers one level below their nearest parent. The algorithm efficiently processes nodes using a queue system, decrementing in-degrees as it progresses, and ultimately stores the layer information directly in the node objects. Though cyclic edges are removed during processing, they could potentially be reintroduced after layer assignment if needed for visualization purposes.

2. Node ordering:
   After assigning layers to nodes, this step organizes nodes horizontally within each layer to minimize edge crossings and create a clean, readable layout. It uses the barycenter method—a technique that positions each node based on the average position of its connected neighbors (either incoming or outgoing). Nodes with no connections are pushed to the end of their layer.

   The algorithm works in multiple passes (iterations) to refine the order: first adjusting nodes based on their incoming connections (from the layer above), then outgoing connections (to the layer below). Group nodes (like containers) are handled separately—their position is determined by averaging the positions of their children, ensuring they stay properly aligned with their contents. This approach keeps the layout structured while reducing visual clutter.

3. AssignInitial positions to node :
   This step calculates the starting (x, y) positions for each node based on its assigned layer (vertical level) and order (horizontal position). Nodes are spaced evenly—horizontally using nodeSpacing and vertically using layerHeight. For example, a node in layer 2 with order 3 will be placed at (3 _ nodeSpacing, 2 _ layerHeight). This creates a grid-like structure where nodes align neatly in rows (layers) and columns (orders).

   The initial positioning is simple but crucial—it provides a structured starting point before more advanced adjustments (like reducing edge crossings or compacting the layout) are applied. Group nodes follow the same logic, ensuring they align with their children. This method ensures a readable, organized foundation for further refinement.

4. Force-Directed Simulation with Constraints :

   - Spring Forces: Attracts connected nodes to maintain desired edge lengths.
   - Repulsion Forces: Pushes nodes apart to prevent overlaps.
   - Group Constraints: Ensures child nodes stay near their parent groups.
   - Cooling Factor: Gradually reduces movement to stabilize the layout.

5. Incremental Refinement :

   - Overlap Resolution: Iteratively adjusts node positions to eliminate overlaps.
   - Edge Routing: Computes smooth paths for edges, including curved paths for parallel edges and self-loops.
   - Group Boundary Adjustment: Dynamically resizes group containers to fit nested elements.

6. Adjusting the Final Layout :
   This step takes the calculated node positions and applies them to the visual elements of the graph. Nodes are placed at their assigned (x, y) coordinates—regular nodes are positioned directly, while group nodes (clusters) are rendered as containers that may include other nodes. Edges (connections between nodes) are drawn based on their start and end points, ensuring they follow the structured layout.

   The adjustment phase bridges the mathematical layout with the actual rendering, updating the SVG or canvas elements to reflect the computed positions. This ensures that the graph is not only logically organized but also visually coherent, with proper spacing, alignment, and connections. The result is a clean, readable diagram ready for display.

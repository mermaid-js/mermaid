/**
 * Grid system for orthogonal edge routing
 */

import { log } from '../../../../logger.js';
import type { Node } from '../../../types.js';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../Constants.js';
import {
  type Point,
  type GridCell,
  type Bounds,
  type GridConfig,
  type PathSegment,
  type EdgeContext,
  type RoutedEdgeInfo,
  type CrossingInfo,
  type ConnectionPointCandidate,
  type Side,
  CellState,
} from './types.js';

/**
 * Routing grid for pathfinding
 */
export class RoutingGrid {
  private cells: CellState[][];
  private bounds: Bounds;
  private cellSize: number;
  private nodeMargin: number;
  private nodeClearance: number;
  private nodeClearanceBounds: Map<string, Bounds>;
  private rows: number;
  private cols: number;
  private nodeMap: Map<string, Node>;
  private nodeSubgraphMap: Map<string, string>;
  private subgraphBounds: Map<string, Bounds>;
  private subgraphPerimeterCells: Map<string, Set<string>>;

  private routedEdges: RoutedEdgeInfo[] = [];
  private edgeSegmentIndex = new Map<string, PathSegment[]>();
  private edgeSegmentOwnerIndex = new Map<string, RoutedEdgeInfo>();

  /**
   * Return all registered segments. Placeholder for a future spatial query.
   * Currently returns all segments from the entire grid, but could be optimized
   * to return only segments near the specified segment.
   *
   * @param _segment - The segment to find nearby segments for (currently unused)
   * @returns Array of all path segments in the grid
   */
  private getSegmentsNearSegment(segment: PathSegment): PathSegment[] {
    const segments: PathSegment[] = [];
    const seen = new Set<string>();
    const cells = this.getSegmentCells(segment.start, segment.end);

    for (const cell of cells) {
      const key = this.cellKey(cell);
      const list = this.edgeSegmentIndex.get(key);
      if (!list) {
        continue;
      }
      for (const candidate of list) {
        const segKey = this.segmentKey(candidate);
        if (seen.has(segKey)) {
          continue;
        }
        seen.add(segKey);
        segments.push(candidate);
      }
    }

    return segments;
  }

  /**
   * Get the number of rows in the routing grid.
   *
   * @returns The total number of rows in the grid
   */
  public getRows(): number {
    return this.rows;
  }

  /**
   * Get the number of columns in the routing grid.
   *
   * @returns The total number of columns in the grid
   */
  public getCols(): number {
    return this.cols;
  }

  /**
   * Initialize a new routing grid for orthogonal edge pathfinding.
   * Creates a cell-based grid system that tracks obstacles, subgraph boundaries,
   * and provides routing capabilities with configurable node clearance.
   *
   * @param nodes - Array of layout nodes to build the grid around
   * @param config - Grid configuration including cell size, margins, and clearances
   */
  constructor(nodes: Node[], config: GridConfig) {
    this.cellSize = config.cellSize;
    this.nodeMargin = config.nodeMargin;
    this.nodeClearance = Math.max(0, config.nodeClearance ?? 0);
    this.nodeClearanceBounds = new Map();
    this.nodeMap = new Map();
    this.nodeSubgraphMap = new Map();
    this.subgraphBounds = new Map();
    this.subgraphPerimeterCells = new Map();

    for (const node of nodes) {
      this.nodeMap.set(node.id, node);
    }

    this.buildSubgraphHierarchy(nodes);

    this.bounds = this.calculateBounds(nodes);

    const padding = this.cellSize * 10;
    this.bounds.left -= padding;
    this.bounds.right += padding;
    this.bounds.top -= padding;
    this.bounds.bottom += padding;

    const width = this.bounds.right - this.bounds.left;
    const height = this.bounds.bottom - this.bounds.top;
    this.cols = Math.ceil(width / this.cellSize);
    this.rows = Math.ceil(height / this.cellSize);

    this.cells = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(CellState.FREE));

    this.markNodesAsBlocked(nodes);
    this.buildNodeClearanceBounds(nodes);
  }

  /**
   * Build clearance bounds around nodes to maintain minimum distances.
   * Creates expanded boundaries around regular nodes (excluding groups) to ensure
   * routed paths maintain proper clearance from node bodies.
   *
   * @param nodes - Array of nodes to build clearance bounds for
   */
  private buildNodeClearanceBounds(nodes: Node[]): void {
    this.nodeClearanceBounds.clear();
    if (this.nodeClearance <= 0) {
      return;
    }
    for (const node of nodes) {
      if (node.isGroup) {
        continue;
      }
      if (
        node.x === undefined ||
        node.y === undefined ||
        node.width === undefined ||
        node.height === undefined
      ) {
        continue;
      }
      const bounds: Bounds = {
        left: node.x - node.width / 2 - this.nodeMargin - this.nodeClearance,
        right: node.x + node.width / 2 + this.nodeMargin + this.nodeClearance,
        top: node.y - node.height / 2 - this.nodeMargin - this.nodeClearance,
        bottom: node.y + node.height / 2 + this.nodeMargin + this.nodeClearance,
      };
      this.nodeClearanceBounds.set(node.id, bounds);
    }
  }

  /**
   * Build subgraph hierarchy mapping and calculate subgraph bounds.
   * Creates parent-child relationships and computes rectangular boundaries
   * for all group nodes in the layout.
   *
   * @param nodes - Array of all nodes including subgraph nodes
   */
  private buildSubgraphHierarchy(nodes: Node[]): void {
    // First pass: map all nodes to their direct parent
    for (const node of nodes) {
      if (node.parentId) {
        this.nodeSubgraphMap.set(node.id, node.parentId);
      }
    }

    // Second pass: calculate bounds for all subgraphs
    for (const node of nodes) {
      if (
        node.isGroup &&
        node.x !== undefined &&
        node.y !== undefined &&
        node.width !== undefined &&
        node.height !== undefined
      ) {
        const bounds: Bounds = {
          left: node.x - node.width / 2 - this.nodeMargin,
          right: node.x + node.width / 2 + this.nodeMargin,
          top: node.y - node.height / 2 - this.nodeMargin,
          bottom: node.y + node.height / 2 + this.nodeMargin,
        };
        this.subgraphBounds.set(node.id, bounds);
        this.subgraphPerimeterCells.set(node.id, new Set());
      }
    }
  }

  /**
   * Calculate overall bounds from all nodes to determine grid coverage area.
   * Finds the minimum rectangular area that encompasses all node boundaries
   * with their dimensions and margins.
   *
   * @param nodes - Array of nodes to calculate bounds for
   * @returns Bounds object containing left, right, top, bottom coordinates
   */
  private calculateBounds(nodes: Node[]): Bounds {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) {
        continue;
      }
      if (node.width === undefined || node.height === undefined) {
        continue;
      }

      const left = node.x - node.width / 2;
      const right = node.x + node.width / 2;
      const top = node.y - node.height / 2;
      const bottom = node.y + node.height / 2;

      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      minY = Math.min(minY, top);
      maxY = Math.max(maxY, bottom);
    }

    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
    };
  }

  /**
   * Mark all nodes as blocked in the grid to prevent routing through them.
   * Regular nodes are marked as completely blocked, while subgraphs have their
   * perimeter cells marked for boundary crossing validation.
   *
   * @param nodes - Array of nodes to mark as blocked in the grid
   */
  private markNodesAsBlocked(nodes: Node[]): void {
    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) {
        continue;
      }
      if (node.width === undefined || node.height === undefined) {
        continue;
      }

      const nodeBounds = {
        left: node.x - node.width / 2 - this.nodeMargin,
        right: node.x + node.width / 2 + this.nodeMargin,
        top: node.y - node.height / 2 - this.nodeMargin,
        bottom: node.y + node.height / 2 + this.nodeMargin,
      };

      const topLeftCell = this.worldToGrid({ x: nodeBounds.left, y: nodeBounds.top });
      const bottomRightCell = this.worldToGrid({
        x: nodeBounds.right,
        y: nodeBounds.bottom,
      });

      if (node.isGroup) {
        const perimeterCells = this.subgraphPerimeterCells.get(node.id);
        if (!perimeterCells) {
          continue;
        }

        for (let col = topLeftCell.col; col <= bottomRightCell.col; col++) {
          if (this.isValidCell({ row: topLeftCell.row, col })) {
            this.cells[topLeftCell.row][col] = CellState.BLOCKED;
            perimeterCells.add(`${topLeftCell.row},${col}`);
          }
          if (this.isValidCell({ row: bottomRightCell.row, col })) {
            this.cells[bottomRightCell.row][col] = CellState.BLOCKED;
            perimeterCells.add(`${bottomRightCell.row},${col}`);
          }
        }

        for (let row = topLeftCell.row; row <= bottomRightCell.row; row++) {
          if (this.isValidCell({ row, col: topLeftCell.col })) {
            this.cells[row][topLeftCell.col] = CellState.BLOCKED;
            perimeterCells.add(`${row},${topLeftCell.col}`);
          }
          if (this.isValidCell({ row, col: bottomRightCell.col })) {
            this.cells[row][bottomRightCell.col] = CellState.BLOCKED;
            perimeterCells.add(`${row},${bottomRightCell.col}`);
          }
        }
      } else {
        for (let row = topLeftCell.row; row <= bottomRightCell.row; row++) {
          for (let col = topLeftCell.col; col <= bottomRightCell.col; col++) {
            if (this.isValidCell({ row, col })) {
              this.cells[row][col] = CellState.BLOCKED;
            }
          }
        }
      }
    }
  }

  /**
   * Check if a point overlaps with a node's actual shape geometry.
   * Unlike simple rectangular bounds checking, this considers the actual shape.
   *
   * @param point - Point in world coordinates to test
   * @param node - Node to test overlap with
   * @returns True if the point is inside the node's actual shape
   */
  private doesPointOverlapNodeShape(point: Point, node: Node, overlaps?: boolean): boolean {
    if (
      node.x === undefined ||
      node.y === undefined ||
      node.width === undefined ||
      node.height === undefined
    ) {
      return false;
    }

    const centerX = node.x;
    const centerY = node.y;
    const halfWidth = node.width / 2 + this.nodeMargin;
    const halfHeight = node.height / 2 + this.nodeMargin;

    // Get relative position from node center
    const dx = point.x - centerX;
    const dy = point.y - centerY;

    // Get node shape (with fallback to rectangle)
    const shape = (node as any).shape || 'rectangle';

    switch (shape) {
      case 'diamond': {
        // Add a small tolerance for edge cases // Diamond shape: |x|/halfWidth + |y|/halfHeight <= 1
        const diamondValue = Math.abs(dx) / halfWidth + Math.abs(dy) / halfHeight;
        return diamondValue <= 1.01;
      } // Small tolerance for numerical precision

      case 'circle':
      case 'ellipse':
        // Ellipse shape: (x/halfWidth)² + (y/halfHeight)² <= 1
        return (dx * dx) / (halfWidth * halfWidth) + (dy * dy) / (halfHeight * halfHeight) <= 1;

      // case 'hexagon':
      //   // Hexagon: simplified as rectangle for now (can be improved later)
      //   return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;

      case 'squareRect':
      case 'rect':
      case 'rectangle':
      case 'roundedRect':
      case 'rounded-rect':
      case 'labelRect':
      case 'stadium':
      case 'hexagon':
      default:
        // Rectangle and other shapes: standard rectangular bounds
        return overlaps ?? false;
    }
  }

  /**
   * Get the parent subgraph ID for a node (if any).
   * Returns the immediate parent subgraph ID from the hierarchy mapping.
   *
   * @param nodeId - The ID of the node to check
   * @returns Parent subgraph ID or undefined if no parent exists
   */
  private getNodeParentSubgraph(nodeId: string): string | undefined {
    return this.nodeSubgraphMap.get(nodeId);
  }

  /**
   * Check if a node is a descendant of a subgraph (child, grandchild, great-grandchild, etc.)
   * @param nodeId - ID of the node to check
   * @param subgraphId - ID of the potential ancestor subgraph
   * @returns true if nodeId is a descendant of subgraphId
   */
  private isNodeDescendantOfSubgraph(nodeId: string, subgraphId: string): boolean {
    let currentId: string | undefined = nodeId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) {
        break;
      }
      visited.add(currentId);

      const parentId = this.nodeSubgraphMap.get(currentId);
      if (!parentId) {
        break;
      }

      if (parentId === subgraphId) {
        return true;
      }

      currentId = parentId;
    }

    return false;
  }

  /**
   * Public accessor for node's parent subgraph (for pathfinding).
   * Provides external access to the parent subgraph relationship for routing decisions.
   *
   * @param nodeId - The ID of the node to get parent subgraph for
   * @returns Parent subgraph ID or undefined if no parent exists
   */
  public getNodeSubgraph(nodeId: string): string | undefined {
    return this.nodeSubgraphMap.get(nodeId);
  }

  /**
   * Determine edge type based on source and target nodes.
   * Classifies edges as internal (within same subgraph) or exit (crossing boundaries).
   *
   * @param edgeContext - Context containing source and target node IDs
   * @returns Edge type classification: 'internal', 'exit', or 'external'
   */
  private getEdgeType(edgeContext: EdgeContext): 'internal' | 'exit' | 'external' {
    const sourceParent = this.getNodeParentSubgraph(edgeContext.sourceNodeId);
    const targetParent = this.getNodeParentSubgraph(edgeContext.targetNodeId);

    if (sourceParent === targetParent) {
      return 'internal';
    }

    return 'exit';
  }

  /**
   * Check if a cell belongs to a specific subgraph's perimeter.
   * Tests whether the given cell coordinates are part of the boundary
   * of the specified subgraph.
   *
   * @param cell - Grid cell coordinates to check
   * @param subgraphId - ID of the subgraph to test against
   * @returns True if the cell is on the subgraph's perimeter
   */
  private isCellOnSubgraphPerimeter(cell: GridCell, subgraphId: string): boolean {
    const perimeterCells = this.subgraphPerimeterCells.get(subgraphId);
    if (!perimeterCells) {
      return false;
    }
    const cellKey = `${cell.row},${cell.col}`;
    return perimeterCells.has(cellKey);
  }

  /**
   * Get all subgraphs that a cell belongs to (perimeter).
   * Returns an array of subgraph IDs whose perimeter includes this cell.
   *
   * @param cell - Grid cell coordinates to check
   * @returns Array of subgraph IDs whose perimeter contains this cell
   */
  private getSubgraphsForCell(cell: GridCell): string[] {
    const subgraphs: string[] = [];
    for (const [subgraphId, perimeterCells] of this.subgraphPerimeterCells.entries()) {
      const cellKey = `${cell.row},${cell.col}`;
      if (perimeterCells.has(cellKey)) {
        subgraphs.push(subgraphId);
      }
    }
    return subgraphs;
  }

  /**
   * Check if a cell is inside any subgraph interior (not on perimeter)
   * Returns array of subgraph IDs that contain this cell
   */
  public getSubgraphsContainingCell(cell: GridCell): string[] {
    const cellWorld = this.gridToWorld(cell);
    const containingSubgraphs: string[] = [];

    for (const [subgraphId, bounds] of this.subgraphBounds.entries()) {
      if (
        cellWorld.x >= bounds.left &&
        cellWorld.x <= bounds.right &&
        cellWorld.y >= bounds.top &&
        cellWorld.y <= bounds.bottom &&
        !this.isCellOnSubgraphPerimeter(cell, subgraphId)
      ) {
        containingSubgraphs.push(subgraphId);
      }
    }

    return containingSubgraphs;
  }

  /**
   * Check if a blocked cell belongs to a specific regular node (not subgraph).
   * Tests if the given cell coordinates overlap with a regular node's boundary,
   * excluding subgraph nodes from consideration.
   *
   * @param cell - Grid cell coordinates to check
   * @param nodeId - ID of the node to test overlap with
   * @returns True if the cell overlaps with the specified node
   */
  private doesCellOverlapNode(cell: GridCell, nodeId: string): boolean {
    const node = this.nodeMap.get(nodeId);
    if (!node || node.isGroup) {
      return false;
    }

    if (
      node.x === undefined ||
      node.y === undefined ||
      node.width === undefined ||
      node.height === undefined
    ) {
      return false;
    }

    const nodeBounds = {
      left: node.x - node.width / 2 - this.nodeMargin,
      right: node.x + node.width / 2 + this.nodeMargin,
      top: node.y - node.height / 2 - this.nodeMargin,
      bottom: node.y + node.height / 2 + this.nodeMargin,
    };

    const cellWorld = this.gridToWorld(cell);

    const overlaps =
      cellWorld.x >= nodeBounds.left &&
      cellWorld.x <= nodeBounds.right &&
      cellWorld.y >= nodeBounds.top &&
      cellWorld.y <= nodeBounds.bottom;

    return overlaps;
  }

  /**
   * Check if an edge is allowed to cross a subgraph boundary at this cell.
   * Validates whether the specified edge can legally cross the subgraph boundary
   * based on the relationship between source/target nodes and the subgraph.
   *
   * @param cell - Grid cell coordinates where boundary crossing would occur
   * @param subgraphId - ID of the subgraph whose boundary is being crossed
   * @param edgeContext - Context with source and target node information
   * @param isNearConnectionPoint - Whether the cell is near a connection point
   * @returns True if the edge is allowed to cross the boundary at this location
   */
  private canCrossBoundaryAtCell(
    cell: GridCell,
    subgraphId: string,
    edgeContext: EdgeContext,
    isNearConnectionPoint: boolean
  ): boolean {
    const sourceParent = this.getNodeParentSubgraph(edgeContext.sourceNodeId);
    const targetParent = this.getNodeParentSubgraph(edgeContext.targetNodeId);

    const sourceIsSubgraphItself = edgeContext.sourceNodeId === subgraphId;
    const targetIsSubgraphItself = edgeContext.targetNodeId === subgraphId;

    const sourceInsideSubgraph = sourceParent === subgraphId;
    const targetInsideSubgraph = targetParent === subgraphId;

    let canCross = false;

    // Case 1: Exit edge from inside subgraph to outside (or vice versa)
    if (
      (sourceInsideSubgraph && !targetInsideSubgraph) ||
      (!sourceInsideSubgraph && targetInsideSubgraph)
    ) {
      canCross = true;
    }

    // Case 2: Connecting TO or FROM the subgraph node itself
    if ((sourceIsSubgraphItself || targetIsSubgraphItself) && isNearConnectionPoint) {
      canCross = true;
    }

    return canCross;
  }

  /**
   * Convert world coordinates to grid cell coordinates.
   * Transforms continuous world space coordinates into discrete grid cell indices
   * based on the grid's origin and cell size.
   *
   * @param point - World coordinates to convert
   * @returns Grid cell coordinates (row, col)
   */
  worldToGrid(point: Point): GridCell {
    const col = Math.floor((point.x - this.bounds.left) / this.cellSize);
    const row = Math.floor((point.y - this.bounds.top) / this.cellSize);
    return { row, col };
  }

  /**
   * Convert grid cell to world coordinates (center of cell).
   * Transforms discrete grid cell indices into continuous world coordinates,
   * returning the center point of the specified cell.
   *
   * @param cell - Grid cell coordinates to convert
   * @returns World coordinates at the center of the cell
   */
  gridToWorld(cell: GridCell): Point {
    const x = this.bounds.left + (cell.col + 0.5) * this.cellSize;
    const y = this.bounds.top + (cell.row + 0.5) * this.cellSize;
    return { x, y };
  }

  /**
   * Check if a cell is within grid bounds.
   * Validates that the cell coordinates are within the valid range
   * of the routing grid dimensions.
   *
   * @param cell - Grid cell coordinates to validate
   * @returns True if the cell is within bounds, false otherwise
   */
  isValidCell(cell: GridCell): boolean {
    return cell.row >= 0 && cell.row < this.rows && cell.col >= 0 && cell.col < this.cols;
  }

  /**
   * Check if a cell is free (not blocked or occupied).
   * Tests whether a cell is available for routing by checking if it's
   * in the FREE state (not blocked by nodes or occupied by other edges).
   *
   * @param cell - Grid cell coordinates to check
   * @returns True if the cell is free for use
   */
  isCellFree(cell: GridCell): boolean {
    if (!this.isValidCell(cell)) {
      return false;
    }
    return this.cells[cell.row][cell.col] === CellState.FREE;
  }

  /**
   * Check if a cell is free for routing purposes with edge context.
   * This allows subgraph boundaries but blocks regular node bodies.
   * Incorporates node clearance checking and subgraph boundary crossing rules.
   *
   * @param cell - Grid cell to check availability
   * @param edgeContext - Optional edge context to check subgraph relationships
   * @returns True if the cell can be used for routing the specified edge
   */
  isCellFreeForRouting(cell: GridCell, edgeContext?: EdgeContext): boolean {
    if (!this.isValidCell(cell)) {
      return false;
    }

    const cellState = this.cells[cell.row][cell.col];

    if (cellState === CellState.FREE) {
      if (this.isCellTooCloseToAnyNode(cell, edgeContext)) {
        return false;
      }
      return true;
    }

    if (cellState === CellState.OCCUPIED_BY_EDGE) {
      if (this.isCellTooCloseToAnyNode(cell, edgeContext)) {
        return false;
      }
      return true;
    }

    if (cellState === CellState.BLOCKED) {
      const subgraphs = this.getSubgraphsForCell(cell);
      if (subgraphs.length > 0) {
        if (edgeContext) {
          for (const subgraphId of subgraphs) {
            const sourceIsSubgraph = edgeContext.sourceNodeId === subgraphId;
            const targetIsSubgraph = edgeContext.targetNodeId === subgraphId;

            if (sourceIsSubgraph || targetIsSubgraph) {
              return true;
            }

            const sourceIsDescendant = this.isNodeDescendantOfSubgraph(
              edgeContext.sourceNodeId,
              subgraphId
            );
            const targetIsDescendant = this.isNodeDescendantOfSubgraph(
              edgeContext.targetNodeId,
              subgraphId
            );

            if (sourceIsDescendant || targetIsDescendant) {
              return true;
            }
          }
        }

        return false;
      }

      return false;
    }

    return false;
  }

  /**
   * Get the state of a cell in the routing grid.
   * Returns the current state (FREE, BLOCKED, or OCCUPIED_BY_EDGE)
   * of the specified grid cell.
   *
   * @param cell - Grid cell coordinates to query
   * @returns Current state of the cell
   */
  getCellState(cell: GridCell): CellState {
    if (!this.isValidCell(cell)) {
      return CellState.BLOCKED;
    }
    return this.cells[cell.row][cell.col];
  }

  /**
   * Check if a point in world coordinates is in free space.
   * Used to validate waypoints/bend points are not on node/subgraph boundaries.
   * Converts world coordinates to grid cell and checks if it's available.
   *
   * @param point - World coordinates to check
   * @returns True if the point is in free space
   */
  isPointInFreeSpace(point: Point): boolean {
    const cell = this.worldToGrid(point);
    const isFree = this.isCellFree(cell);
    return isFree;
  }

  /**
   * Check if a line segment between two points is clear for routing.
   * Validates that all cells along an orthogonal segment are available,
   * considering subgraph boundary crossing rules and node clearances.
   *
   * @param start - Starting point of the segment
   * @param end - Ending point of the segment
   * @param edgeContext - Optional edge context for boundary crossing validation
   * @returns True if the entire segment is clear for routing
   */
  isSegmentClear(start: Point, end: Point, edgeContext?: EdgeContext): boolean {
    if (start.x !== end.x && start.y !== end.y) {
      return false;
    }

    const cells = this.getSegmentCells(start, end);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const isStartCell = i === 0;
      const isEndCell = i === cells.length - 1;
      const isNearConnectionPoint = isStartCell || isEndCell || i === 1 || i === cells.length - 2;

      if (isStartCell || isEndCell) {
        continue;
      }

      const cellState = this.getCellState(cell);

      if (this.isCellFree(cell)) {
        if (this.isCellTooCloseToAnyNode(cell, edgeContext)) {
          return false;
        }
        continue;
      }

      if (!isStartCell && !isEndCell && edgeContext) {
        const overlapsSource = this.doesCellOverlapNode(cell, edgeContext.sourceNodeId);
        const overlapsTarget = this.doesCellOverlapNode(cell, edgeContext.targetNodeId);

        if (overlapsSource || overlapsTarget) {
          return false;
        }
      }

      if (cellState === CellState.BLOCKED && edgeContext) {
        const subgraphs = this.getSubgraphsForCell(cell);

        if (subgraphs.length > 0) {
          let canCrossAnyBoundary = false;
          for (const subgraphId of subgraphs) {
            if (this.canCrossBoundaryAtCell(cell, subgraphId, edgeContext, isNearConnectionPoint)) {
              canCrossAnyBoundary = true;
              break;
            }
          }

          if (canCrossAnyBoundary) {
            continue;
          }
        }
      }

      return false;
    }

    return true;
  }

  /**
   * Returns true if a cell is within the configured clearance around any regular node,
   * excluding the edge's own source/target nodes (to allow connecting).
   * Used to maintain minimum distances between routed paths and node bodies.
   *
   * @param cell - Grid cell to check for clearance violations
   * @param edgeContext - Optional edge context to exclude source/target nodes
   * @returns True if the cell violates node clearance requirements
   */
  private isCellTooCloseToAnyNode(cell: GridCell, edgeContext?: EdgeContext): boolean {
    if (this.nodeClearance <= 0) {
      return false;
    }
    const p = this.gridToWorld(cell);
    for (const [nodeId, bounds] of this.nodeClearanceBounds.entries()) {
      if (
        edgeContext &&
        (nodeId === edgeContext.sourceNodeId || nodeId === edgeContext.targetNodeId)
      ) {
        continue;
      }
      if (p.x >= bounds.left && p.x <= bounds.right && p.y >= bounds.top && p.y <= bounds.bottom) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all grid cells that a segment passes through.
   * Uses line rasterization algorithms to determine which cells are crossed
   * by a straight line segment between two points.
   *
   * @param start - Starting point of the segment
   * @param end - Ending point of the segment
   * @returns Array of grid cells that the segment passes through
   */
  private getSegmentCells(start: Point, end: Point): GridCell[] {
    const cells: GridCell[] = [];
    const startCell = this.worldToGrid(start);
    const endCell = this.worldToGrid(end);

    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    const threshold = this.cellSize;

    if (dx < threshold) {
      const minRow = Math.min(startCell.row, endCell.row);
      const maxRow = Math.max(startCell.row, endCell.row);
      for (let row = minRow; row <= maxRow; row++) {
        cells.push({ row, col: startCell.col });
      }
    } else if (dy < threshold) {
      const minCol = Math.min(startCell.col, endCell.col);
      const maxCol = Math.max(startCell.col, endCell.col);
      for (let col = minCol; col <= maxCol; col++) {
        cells.push({ row: startCell.row, col });
      }
    } else {
      const x0 = startCell.col;
      const y0 = startCell.row;
      const x1 = endCell.col;
      const y1 = endCell.row;

      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      let x = x0;
      let y = y0;

      while (true) {
        cells.push({ row: y, col: x });

        if (x === x1 && y === y1) {
          break;
        }

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    }

    return cells;
  }

  /**
   * Mark a path segment as occupied by an edge.
   * Updates the grid state to indicate that the cells along this segment
   * are now occupied, preventing other edges from using the same space.
   *
   * @param start - Starting point of the segment
   * @param end - Ending point of the segment
   */
  markSegmentOccupied(start: Point, end: Point): void {
    const cells = this.getSegmentCells(start, end);
    for (const cell of cells) {
      if (this.isValidCell(cell) && this.cells[cell.row][cell.col] === CellState.FREE) {
        this.cells[cell.row][cell.col] = CellState.OCCUPIED_BY_EDGE;
      }
    }
  }

  /**
   * Mark an entire path as occupied by an edge.
   * Iterates through all segments in the path and marks each segment
   * as occupied to prevent overlap with future routing.
   *
   * @param points - Array of points defining the complete path
   */
  markPathOccupied(points: Point[]): void {
    for (let i = 0; i < points.length - 1; i++) {
      this.markSegmentOccupied(points[i], points[i + 1]);
    }
  }

  /**
   * Get neighboring cells (4-directional: up, down, left, right).
   * Returns all valid adjacent cells in the cardinal directions,
   * used for pathfinding algorithms like A*.
   *
   * @param cell - Grid cell to get neighbors for
   * @returns Array of valid neighboring cells
   */
  getNeighbors(cell: GridCell): GridCell[] {
    const neighbors: GridCell[] = [];
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ];

    for (const dir of directions) {
      const neighbor = {
        row: cell.row + dir.row,
        col: cell.col + dir.col,
      };
      if (this.isValidCell(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * Check if two segments intersect at any point.
   * Tests for intersections between orthogonal line segments,
   * handling horizontal-horizontal, vertical-vertical, and cross intersections.
   *
   * @param seg1 - First path segment to test
   * @param seg2 - Second path segment to test
   * @returns True if the segments intersect
   */
  doSegmentsIntersect(seg1: PathSegment, seg2: PathSegment): boolean {
    const dx1 = Math.abs(seg1.end.x - seg1.start.x);
    const dy1 = Math.abs(seg1.end.y - seg1.start.y);
    const dx2 = Math.abs(seg2.end.x - seg2.start.x);
    const dy2 = Math.abs(seg2.end.y - seg2.start.y);

    const threshold = this.cellSize;

    const seg1IsHorizontal = dy1 < threshold;
    const seg1IsVertical = dx1 < threshold;
    const seg2IsHorizontal = dy2 < threshold;
    const seg2IsVertical = dx2 < threshold;

    if (seg1IsHorizontal && seg2IsHorizontal) {
      const y1 = (seg1.start.y + seg1.end.y) / 2;
      const y2 = (seg2.start.y + seg2.end.y) / 2;
      if (Math.abs(y1 - y2) > threshold) {
        return false;
      }
      const min1 = Math.min(seg1.start.x, seg1.end.x);
      const max1 = Math.max(seg1.start.x, seg1.end.x);
      const min2 = Math.min(seg2.start.x, seg2.end.x);
      const max2 = Math.max(seg2.start.x, seg2.end.x);
      return !(max1 < min2 || max2 < min1);
    }

    if (seg1IsVertical && seg2IsVertical) {
      const x1 = (seg1.start.x + seg1.end.x) / 2;
      const x2 = (seg2.start.x + seg2.end.x) / 2;
      if (Math.abs(x1 - x2) > threshold) {
        return false;
      }
      const min1 = Math.min(seg1.start.y, seg1.end.y);
      const max1 = Math.max(seg1.start.y, seg1.end.y);
      const min2 = Math.min(seg2.start.y, seg2.end.y);
      const max2 = Math.max(seg2.start.y, seg2.end.y);
      return !(max1 < min2 || max2 < min1);
    }

    let hSeg: PathSegment, vSeg: PathSegment;
    if (seg1IsHorizontal && seg2IsVertical) {
      hSeg = seg1;
      vSeg = seg2;
    } else if (seg2IsHorizontal && seg1IsVertical) {
      hSeg = seg2;
      vSeg = seg1;
    } else {
      return false;
    }

    const hY = (hSeg.start.y + hSeg.end.y) / 2;
    const vX = (vSeg.start.x + vSeg.end.x) / 2;

    const hMinX = Math.min(hSeg.start.x, hSeg.end.x);
    const hMaxX = Math.max(hSeg.start.x, hSeg.end.x);
    const vMinY = Math.min(vSeg.start.y, vSeg.end.y);
    const vMaxY = Math.max(vSeg.start.y, vSeg.end.y);

    return vX >= hMinX && vX <= hMaxX && hY >= vMinY && hY <= vMaxY;
  }

  /**
   * Check if two segments are colinear and overlapping (same orientation, near same line).
   * Tests whether two segments lie on the same line and have overlapping ranges,
   * used to detect when edges share the same path sections.
   *
   * @param seg1 - First path segment to compare
   * @param seg2 - Second path segment to compare
   * @returns True if segments are colinear and overlap
   */
  private areColinearAndOverlapping(seg1: PathSegment, seg2: PathSegment): boolean {
    const threshold = this.cellSize;

    const dx1 = Math.abs(seg1.end.x - seg1.start.x);
    const dy1 = Math.abs(seg1.end.y - seg1.start.y);
    const dx2 = Math.abs(seg2.end.x - seg2.start.x);
    const dy2 = Math.abs(seg2.end.y - seg2.start.y);

    const seg1Horizontal = dy1 < threshold;
    const seg1Vertical = dx1 < threshold;
    const seg2Horizontal = dy2 < threshold;
    const seg2Vertical = dx2 < threshold;

    if (seg1Horizontal && seg2Horizontal) {
      const y1 = (seg1.start.y + seg1.end.y) / 2;
      const y2 = (seg2.start.y + seg2.end.y) / 2;
      if (Math.abs(y1 - y2) > threshold) {
        return false;
      }
      const min1 = Math.min(seg1.start.x, seg1.end.x);
      const max1 = Math.max(seg1.start.x, seg1.end.x);
      const min2 = Math.min(seg2.start.x, seg2.end.x);
      const max2 = Math.max(seg2.start.x, seg2.end.x);
      return !(max1 < min2 || max2 < min1);
    }

    if (seg1Vertical && seg2Vertical) {
      const x1 = (seg1.start.x + seg1.end.x) / 2;
      const x2 = (seg2.start.x + seg2.end.x) / 2;
      if (Math.abs(x1 - x2) > threshold) {
        return false;
      }
      const min1 = Math.min(seg1.start.y, seg1.end.y);
      const max1 = Math.max(seg1.start.y, seg1.end.y);
      const min2 = Math.min(seg2.start.y, seg2.end.y);
      const max2 = Math.max(seg2.start.y, seg2.end.y);
      return !(max1 < min2 || max2 < min1);
    }

    return false;
  }

  /**
   * Get grid dimensions as a structured object.
   * Returns the number of rows and columns in the routing grid
   * for external queries and validation.
   *
   * @returns Object containing rows and cols properties
   */
  getDimensions(): { rows: number; cols: number } {
    return { rows: this.rows, cols: this.cols };
  }

  /**
   * Get grid bounds in world coordinates.
   * Returns a copy of the bounding rectangle that defines the grid coverage area
   * in the original world coordinate system.
   *
   * @returns Bounds object with left, right, top, bottom coordinates
   */
  getBounds(): Bounds {
    return { ...this.bounds };
  }

  // ========== Edge Tracking and Crossing Detection Methods ==========

  /**
   * Helper function to generate cell key for indexing.
   * Creates a string key from grid cell coordinates for use in maps and sets.
   *
   * @param cell - Grid cell coordinates to convert to key
   * @returns String key in format "row,col"
   */
  private cellKey(cell: GridCell): string {
    return `${cell.row},${cell.col}`;
  }

  /**
   * Helper function to generate a stable segment key.
   * Normalizes segment direction so reverse endpoints map to the same key.
   *
   * @param segment - Path segment to convert to key
   * @returns String key in format "x1,y1-x2,y2"
   */
  private segmentKey(segment: PathSegment): string {
    const { start, end } = segment;
    if (start.x < end.x || (start.x === end.x && start.y <= end.y)) {
      return `${start.x},${start.y}-${end.x},${end.y}`;
    }
    return `${end.x},${end.y}-${start.x},${start.y}`;
  }

  /**
   * Register a successfully routed edge for crossing detection.
   * Stores the edge information and indexes its segments by grid cells
   * for efficient intersection queries during subsequent routing.
   *
   * @param edgeInfo - Complete information about the routed edge including points
   */
  public registerRoutedEdge(edgeInfo: RoutedEdgeInfo): void {
    log.info(`  [REGISTER] ${edgeInfo.edgeId}: ${edgeInfo.sourceNodeId}→${edgeInfo.targetNodeId}`);
    log.info(
      `  [REGISTER]   Points: ${JSON.stringify(edgeInfo.points.map((p) => `(${p.x.toFixed(1)},${p.y.toFixed(1)})`))}`
    );
    this.routedEdges.push(edgeInfo);

    for (let i = 0; i < edgeInfo.points.length - 1; i++) {
      const segment: PathSegment = {
        start: edgeInfo.points[i],
        end: edgeInfo.points[i + 1],
      };

      log.info(
        `  [REGISTER]   Segment ${i}: (${segment.start.x.toFixed(1)},${segment.start.y.toFixed(1)}) -> (${segment.end.x.toFixed(1)},${segment.end.y.toFixed(1)})`
      );

      const segmentKey = this.segmentKey(segment);
      if (!this.edgeSegmentOwnerIndex.has(segmentKey)) {
        this.edgeSegmentOwnerIndex.set(segmentKey, edgeInfo);
      }

      const cells = this.getSegmentCells(segment.start, segment.end);
      for (const cell of cells) {
        const key = this.cellKey(cell);
        if (!this.edgeSegmentIndex.has(key)) {
          this.edgeSegmentIndex.set(key, []);
        }
        this.edgeSegmentIndex.get(key)!.push(segment);
      }
    }
  }

  /**
   * Clear all routing data (for testing/reset).
   * Removes all registered edge information and segment indices,
   * returning the grid to its initial state.
   */
  public clearRoutedEdges(): void {
    this.routedEdges = [];
    this.edgeSegmentIndex = new Map();
    this.edgeSegmentOwnerIndex = new Map();
  }

  /**
   * Get intersection point of two orthogonal segments.
   * Calculates the exact world coordinates where two perpendicular
   * line segments cross each other.
   *
   * @param seg1 - First segment (assumed orthogonal to seg2)
   * @param seg2 - Second segment (assumed orthogonal to seg1)
   * @returns Point coordinates of the intersection
   */
  private getIntersectionPoint(seg1: PathSegment, seg2: PathSegment): Point {
    if (seg1.start.y === seg1.end.y) {
      return { x: seg2.start.x, y: seg1.start.y };
    } else {
      return { x: seg1.start.x, y: seg2.start.y };
    }
  }

  /**
   * Find which edge contains a given segment.
   * Searches through registered edges to find the one that includes
   * the specified segment as part of its path.
   *
   * @param segment - Path segment to search for
   * @returns Edge information if found, undefined otherwise
   */
  private findEdgeForSegment(segment: PathSegment): RoutedEdgeInfo | undefined {
    return this.edgeSegmentOwnerIndex.get(this.segmentKey(segment));
  }

  /**
   * Check if a path segment crosses any existing edges.
   * Tests for intersections with previously routed edges and returns
   * detailed information about each crossing point found.
   *
   * @param segment - Path segment to test for crossings
   * @param excludeEdgeId - Optional edge ID to exclude from crossing detection
   * @returns Array of intersection points (empty if no crossings)
   */
  public getSegmentCrossings(segment: PathSegment, excludeEdgeId?: string): CrossingInfo[] {
    const crossings: CrossingInfo[] = [];
    const cells = this.getSegmentCells(segment.start, segment.end);
    const checkedSegments = new Set<string>();

    for (const cell of cells) {
      const key = this.cellKey(cell);
      const nearbySegments = this.edgeSegmentIndex.get(key) ?? [];

      for (const existingSegment of nearbySegments) {
        const segKey = this.segmentKey(existingSegment);
        if (checkedSegments.has(segKey)) {
          continue;
        }
        checkedSegments.add(segKey);

        const edgeInfo = this.findEdgeForSegment(existingSegment);

        if (edgeInfo?.edgeId === excludeEdgeId) {
          continue;
        }

        const intersects = this.doSegmentsIntersect(segment, existingSegment);

        if (intersects) {
          crossings.push({
            point: this.getIntersectionPoint(segment, existingSegment),
            existingEdgeId: edgeInfo?.edgeId,
            segment: existingSegment,
          });
        }
      }
    }

    return crossings;
  }

  /**
   * Count total edge-to-edge crossings for a complete path.
   * Calculates the number of times a proposed path would intersect
   * with existing routed edges, used for path quality assessment.
   *
   * @param points - Array of points defining the complete path
   * @param excludeEdgeId - Optional edge ID to exclude from crossing counts
   * @returns Total number of crossing points
   */
  public countPathCrossings(points: Point[], excludeEdgeId?: string): number {
    let crossingCount = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const segment: PathSegment = {
        start: points[i],
        end: points[i + 1],
      };

      const crossings = this.getSegmentCrossings(segment, excludeEdgeId);

      crossingCount += crossings.length;
    }

    log.info(`    [COUNT] Total crossings: ${crossingCount}`);
    return crossingCount;
  }

  /**
   * Count how many segments in the path overlap (colinear + overlapping) with existing routed edges.
   * Calculates the number of path segments that share the same line space
   * as previously routed edges, indicating potential visual overlap.
   *
   * @param points - Array of points defining the complete path
   * @param excludeEdgeId - Optional edge ID to exclude from overlap detection
   * @returns Number of overlapping segments
   */
  public countPathSegmentOverlaps(points: Point[], excludeEdgeId?: string): number {
    let overlapCount = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const segment: PathSegment = { start: points[i], end: points[i + 1] };
      const existingSegments = this.getSegmentsNearSegment(segment);

      for (const existingSegment of existingSegments) {
        const edgeInfo = this.findEdgeForSegment(existingSegment);
        if (edgeInfo?.edgeId === excludeEdgeId) {
          continue;
        }

        if (this.areColinearAndOverlapping(segment, existingSegment)) {
          overlapCount++;
        }
      }
    }

    return overlapCount;
  }

  /**
   * Count how many endpoints in the path reuse existing edge endpoints (within a small tolerance).
   * Calculates how many of the path's start/end points are close to existing
   * edge endpoints, indicating good connection point sharing.
   *
   * @param points - Array of points defining the complete path
   * @param excludeEdgeId - Optional edge ID to exclude from endpoint reuse detection
   * @returns Number of endpoints that reuse existing connection points
   */
  public countEndpointReuses(points: Point[], excludeEdgeId?: string): number {
    if (!points.length) {
      return 0;
    }

    const tolerance = this.cellSize;
    const endpointsToCheck = [points[0], points[points.length - 1]];
    let reuseCount = 0;

    for (const edge of this.routedEdges) {
      if (edge.edgeId === excludeEdgeId) {
        continue;
      }

      const existingEndpoints = [edge.startPoint, edge.endPoint];

      for (const ep of endpointsToCheck) {
        for (const existing of existingEndpoints) {
          const dist = Math.abs(ep.x - existing.x) + Math.abs(ep.y - existing.y);
          if (dist <= tolerance) {
            reuseCount++;
          }
        }
      }
    }

    return reuseCount;
  }

  /**
   * Check if a path passes through any node bodies (excluding source/target).
   * Tests whether intermediate segments of the path cross through the interior
   * of any nodes other than the source and target nodes.
   *
   * @param points - Array of points defining the complete path
   * @param sourceNodeId - ID of the source node to exclude from collision detection
   * @param targetNodeId - ID of the target node to exclude from collision detection
   * @returns True if the path illegally crosses through node bodies
   */
  public doesPathCrossNodes(points: Point[], sourceNodeId: string, targetNodeId: string): boolean {
    for (let i = 0; i < points.length - 1; i++) {
      if (i === 0 || i === points.length - 2) {
        continue;
      }

      const segment: PathSegment = {
        start: points[i],
        end: points[i + 1],
      };

      const cells = this.getSegmentCells(segment.start, segment.end);

      for (const cell of cells) {
        for (const [nodeId, node] of this.nodeMap.entries()) {
          if (nodeId === sourceNodeId || nodeId === targetNodeId) {
            continue;
          }
          if (node.isGroup) {
            continue;
          }

          if (this.doesCellOverlapNode(cell, nodeId)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // ========== Connection Point Generation Methods ==========

  private buildSideOffsets(halfSpan: number, spacing: number, dir: number): number[] {
    if (spacing <= 0 || halfSpan <= 0) {
      return [0];
    }

    const offsets: number[] = [0];
    const maxSteps = Math.floor(halfSpan / spacing);

    for (let step = 1; step <= maxSteps; step++) {
      const primary = dir * step * spacing;
      const secondary = -dir * step * spacing;
      if (Math.abs(primary) <= halfSpan) {
        offsets.push(primary);
      }
      if (Math.abs(secondary) <= halfSpan) {
        offsets.push(secondary);
      }
    }
    return offsets;
  }

  /**
   * Generate alternative connection points on different sides of a node.
   * Ordered by geometric optimality toward target. Provides multiple connection
   * options on each side of the node, avoiding buffer zones from existing edges.
   *
   * @param node - Node to generate connection points for
   * @param towardPoint - Target point to optimize connection direction toward
   * @param spacing - Spacing between alternative connection points
   * @param bufferZones - Set of coordinate keys marking occupied areas to avoid
   * @param options - Optional controls for sampling density and sides
   * @returns Array of connection point candidates sorted by quality
   */
  public generateConnectionPoints(
    node: Node,
    towardPoint: Point,
    spacing: number,
    bufferZones: Set<string>,
    options?: { sides?: Side[]; maxPerSide?: number }
  ): ConnectionPointCandidate[] {
    const candidates: ConnectionPointCandidate[] = [];
    const sides: Side[] = options?.sides ?? ['top', 'bottom', 'left', 'right'];
    const maxPerSide = Math.max(1, options?.maxPerSide ?? 5);

    const nodeX = node.x ?? 0;
    const nodeY = node.y ?? 0;
    const width = node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.height ?? DEFAULT_NODE_HEIGHT;

    for (const side of sides) {
      const isHorizontal = side === 'top' || side === 'bottom';
      const halfSpan = isHorizontal ? width / 2 : height / 2;
      const dir = isHorizontal
        ? Math.sign(towardPoint.x - nodeX) || 1
        : Math.sign(towardPoint.y - nodeY) || 1;
      const centerPoint: Point =
        side === 'top'
          ? { x: nodeX, y: nodeY - height / 2 }
          : side === 'bottom'
            ? { x: nodeX, y: nodeY + height / 2 }
            : side === 'left'
              ? { x: nodeX - width / 2, y: nodeY }
              : { x: nodeX + width / 2, y: nodeY };

      const centerKey = `${Math.round(centerPoint.x)},${Math.round(centerPoint.y)}`;
      const centerIsAvailable = !bufferZones.has(centerKey);

      const sideCandidates: ConnectionPointCandidate[] = [];
      const offsets = centerIsAvailable
        ? [0]
        : this.buildSideOffsets(halfSpan, spacing, dir).filter((o) => o !== 0);

      for (const offset of offsets) {
        const point: Point =
          side === 'top'
            ? { x: nodeX + offset, y: nodeY - height / 2 }
            : side === 'bottom'
              ? { x: nodeX + offset, y: nodeY + height / 2 }
              : side === 'left'
                ? { x: nodeX - width / 2, y: nodeY + offset }
                : { x: nodeX + width / 2, y: nodeY + offset };

        const key = `${Math.round(point.x)},${Math.round(point.y)}`;
        if (bufferZones.has(key)) {
          continue;
        }

        const dx = towardPoint.x - point.x;
        const dy = towardPoint.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let facing = 0;
        switch (side) {
          case 'top':
            facing = dy < 0 ? 1 : -1;
            break;
          case 'bottom':
            facing = dy > 0 ? 1 : -1;
            break;
          case 'left':
            facing = dx < 0 ? 1 : -1;
            break;
          case 'right':
            facing = dx > 0 ? 1 : -1;
            break;
        }

        const priority = facing > 0 ? distance : distance + 10000;

        sideCandidates.push({
          point,
          side,
          nodeId: node.id,
          priority,
        });

        if (sideCandidates.length >= maxPerSide * 3) {
          // Safety stop if buffer zones are sparse and spans are huge.
          // We'll sort + slice to `maxPerSide` below.
          break;
        }
      }

      sideCandidates.sort((a, b) => a.priority - b.priority);
      candidates.push(...sideCandidates.slice(0, maxPerSide));
    }

    candidates.sort((a, b) => a.priority - b.priority);

    return candidates;
  }

  /**
   * Add a point and its surrounding area to buffer zone.
   * Marks cells around the specified point as unavailable for connection
   * points to maintain spacing between edge endpoints.
   *
   * @param point - Center point to create buffer zone around
   * @param bufferDistance - Radius of the buffer zone in world coordinates
   * @param bufferZones - Set to add buffer zone coordinates to
   */
  private addPointToBufferZone(
    point: Point,
    bufferDistance: number,
    bufferZones: Set<string>
  ): void {
    const steps = Math.ceil(bufferDistance / this.cellSize);

    for (let dx = -steps; dx <= steps; dx++) {
      for (let dy = -steps; dy <= steps; dy++) {
        const bufferedPoint = {
          x: point.x + dx * this.cellSize,
          y: point.y + dy * this.cellSize,
        };

        const distance = Math.sqrt(
          Math.pow(bufferedPoint.x - point.x, 2) + Math.pow(bufferedPoint.y - point.y, 2)
        );

        if (distance <= bufferDistance) {
          const key = `${Math.round(bufferedPoint.x)},${Math.round(bufferedPoint.y)}`;
          bufferZones.add(key);
        }
      }
    }
  }

  /**
   * Build buffer zones around existing edge endpoints.
   * Creates exclusion areas around connection points from previously routed
   * edges to encourage spacing and avoid visual clustering.
   *
   * @param edges - Array of existing routed edge information
   * @param bufferDistance - Radius of buffer zones in world coordinates
   * @returns Set of coordinate keys marking buffered areas
   */
  public buildEndpointBufferZones(edges: RoutedEdgeInfo[], bufferDistance: number): Set<string> {
    const bufferZones = new Set<string>();

    for (const edge of edges) {
      this.addPointToBufferZone(edge.startPoint, bufferDistance, bufferZones);

      this.addPointToBufferZone(edge.endPoint, bufferDistance, bufferZones);
    }

    return bufferZones;
  }
}

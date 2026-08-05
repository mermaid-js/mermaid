/* eslint-disable tsdoc/syntax */

import type { Node, Edge, LayoutData } from '../../../types.js';
import { getGroupBounds } from '../applyHola.js';

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

export class LayoutRotation {
  private nodes: Node[];
  private edges: Edge[];
  private data4Layout: LayoutData;

  constructor(nodes: Node[], edges: Edge[], data4Layout: LayoutData) {
    this.nodes = nodes;
    this.edges = edges;
    this.data4Layout = data4Layout;
  }

  /**
   * Calculate the bounding box of the current layout
   */
  public getBoundingBox(): BoundingBox {
    if (this.nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }
    const nodeMap = new Map(this.data4Layout.nodes.map((node) => [node.id, node]));

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.nodes.forEach((node) => {
      if (node.isGroup) {
        const children = this.data4Layout.nodes.filter((n) => n.parentId === node.id);
        const bounds = getGroupBounds(node, children, this.edges, nodeMap, this.data4Layout, 15);
        minX = Math.min(minX, bounds.minX);
        maxX = Math.max(maxX, bounds.maxX);
        minY = Math.min(minY, bounds.minY);
        maxY = Math.max(maxY, bounds.maxY);
      } else {
        const x = node.x ?? 0;
        const y = node.y ?? 0;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });

    const width = maxX - minX;
    const height = maxY - minY;

    return { minX, maxX, minY, maxY, width, height };
  }

  /**
   * Detect the primary growth direction of a tree based on parent-child positions
   * Trees typically grow in one primary direction (NORTH, SOUTH, EAST, WEST)
   */
  private detectTreeDirection(rootId: string, edges: Edge[]): Direction {
    const children = new Set<string>();
    const edgeMap = new Map<string, string[]>();

    edges.forEach((edge) => {
      if (edge.start && edge.end) {
        if (!edgeMap.has(edge.start)) {
          edgeMap.set(edge.start, []);
        }
        edgeMap.get(edge.start)?.push(edge.end);
      }
    });

    const queue = [rootId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const childNodes = edgeMap.get(current) || [];
      childNodes.forEach((child) => {
        children.add(child);
        queue.push(child);
      });
    }

    if (children.size === 0) {
      return 'SOUTH';
    }

    const root = this.nodes.find((n) => n.id === rootId);
    if (!root) {
      return 'SOUTH';
    }

    const rootX = root.x ?? 0;
    const rootY = root.y ?? 0;

    let deltaX = 0;
    let deltaY = 0;

    children.forEach((childId) => {
      const child = this.nodes.find((n) => n.id === childId);
      if (child) {
        deltaX += (child.x ?? 0) - rootX;
        deltaY += (child.y ?? 0) - rootY;
      }
    });

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absY > absX) {
      return deltaY > 0 ? 'SOUTH' : 'NORTH';
    } else {
      return deltaX > 0 ? 'EAST' : 'WEST';
    }
  }

  /**
   * After rotation, determine the new direction
   * Clockwise 90°: NORTH -> EAST, EAST -> SOUTH, SOUTH -> WEST, WEST -> NORTH
   * Counter-clockwise 90°: NORTH -> WEST, WEST -> SOUTH, SOUTH -> EAST, EAST -> NORTH
   */
  private rotateDirection(direction: Direction, clockwise: boolean): Direction {
    if (clockwise) {
      const clockwiseMap: Record<Direction, Direction> = {
        NORTH: 'EAST',
        EAST: 'SOUTH',
        SOUTH: 'WEST',
        WEST: 'NORTH',
      };
      return clockwiseMap[direction];
    } else {
      const counterClockwiseMap: Record<Direction, Direction> = {
        NORTH: 'WEST',
        WEST: 'SOUTH',
        SOUTH: 'EAST',
        EAST: 'NORTH',
      };
      return counterClockwiseMap[direction];
    }
  }

  /**
   * Identify tree roots (nodes with no incoming edges or minimal incoming edges)
   * This is a heuristic to identify potential tree structures
   */
  private findTreeRoots(): string[] {
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();

    this.nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      outDegree.set(node.id, 0);
    });

    this.edges.forEach((edge) => {
      if (edge.start && edge.end) {
        outDegree.set(edge.start, (outDegree.get(edge.start) ?? 0) + 1);
        inDegree.set(edge.end, (inDegree.get(edge.end) ?? 0) + 1);
      }
    });

    const roots: string[] = [];
    this.nodes.forEach((node) => {
      const inD = inDegree.get(node.id) ?? 0;
      const outD = outDegree.get(node.id) ?? 0;

      if (outD > 0 && inD === 0) {
        roots.push(node.id);
      }
    });

    return roots;
  }

  /**
   * Determine the best rotation direction to maximize trees growing south (downward)
   * Returns true for clockwise, false for counter-clockwise
   */
  private determineBestRotation(): boolean {
    const roots = this.findTreeRoots();

    if (roots.length === 0) {
      return true;
    }

    const directions: Direction[] = [];
    roots.forEach((rootId) => {
      const direction = this.detectTreeDirection(rootId, this.edges);
      directions.push(direction);
    });

    let southCountClockwise = 0;
    let southCountCounterClockwise = 0;

    directions.forEach((dir) => {
      const afterClockwise = this.rotateDirection(dir, true);
      const afterCounterClockwise = this.rotateDirection(dir, false);

      if (afterClockwise === 'SOUTH') {
        southCountClockwise++;
      }
      if (afterCounterClockwise === 'SOUTH') {
        southCountCounterClockwise++;
      }
    });

    const useClockwise = southCountClockwise >= southCountCounterClockwise;

    return useClockwise;
  }

  /**
   * Rotate a point 90 degrees around the origin
   * Clockwise: (x, y) -> (y, -x)
   * Counter-clockwise: (x, y) -> (-y, x)
   */
  private rotatePoint(x: number, y: number, clockwise: boolean): { x: number; y: number } {
    if (clockwise) {
      return { x: y, y: -x };
    } else {
      return { x: -y, y: x };
    }
  }

  /**
   * Apply 90-degree rotation to all nodes and edge points
   */
  private applyRotation(clockwise: boolean): void {
    this.nodes.forEach((node) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const rotated = this.rotatePoint(x, y, clockwise);
      node.x = rotated.x;
      node.y = rotated.y;

      if (node.isGroup && typeof node.width === 'number' && typeof node.height === 'number') {
        const temp = node.width;
        node.width = node.height;
        node.height = temp;
      }
    });

    this.edges.forEach((edge) => {
      if (edge.points && edge.points.length > 0) {
        edge.points = edge.points.map((point) => {
          const rotated = this.rotatePoint(point.x, point.y, clockwise);
          return { x: rotated.x, y: rotated.y };
        });
      }
    });
  }

  /**
   * Normalize coordinates to ensure all are positive (shift to origin)
   */
  private normalizeCoordinates(): void {
    const bbox = this.getBoundingBox();

    const offsetX = -bbox.minX;
    const offsetY = -bbox.minY;

    if (offsetX !== 0 || offsetY !== 0) {
      this.nodes.forEach((node) => {
        node.x = (node.x ?? 0) + offsetX;
        node.y = (node.y ?? 0) + offsetY;
      });

      this.edges.forEach((edge) => {
        if (edge.points && edge.points.length > 0) {
          edge.points = edge.points.map((point) => ({
            x: point.x + offsetX,
            y: point.y + offsetY,
          }));
        }
      });
    }
  }

  /**
   * Main rotation logic
   * Checks if layout needs rotation and applies it if beneficial
   *
   * @returns true if rotation was applied, false otherwise
   */
  rotate(): boolean {
    const bbox = this.getBoundingBox();

    if (bbox.width >= bbox.height) {
      return false;
    }

    const clockwise = this.determineBestRotation();

    this.applyRotation(clockwise);

    this.normalizeCoordinates();

    const _newBbox = this.getBoundingBox();

    return true;
  }
}

import type { Node } from '../../../types.js';

export interface AlignmentCandidate {
  nodes: Node[];
  type: 'horizontal' | 'vertical';
  averagePosition: number;
}

export class AlignmentDetector {
  private nodes: Node[];
  private readonly alignmentThreshold;

  constructor(nodes: Node[], alignmentThreshold = 5) {
    this.nodes = nodes;
    this.alignmentThreshold = alignmentThreshold;
  }

  /**
   * Find all groups of nodes that are nearly aligned horizontally
   * Nodes are considered horizontally aligned if their y-coordinates differ by less than threshold
   */
  findHorizontalAlignments(): AlignmentCandidate[] {
    const candidates: AlignmentCandidate[] = [];
    const processed = new Set<string>();

    const sortedByY = [...this.nodes].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

    for (let i = 0; i < sortedByY.length; i++) {
      const nodeA = sortedByY[i];
      if (processed.has(nodeA.id)) {
        continue;
      }

      const alignedGroup: Node[] = [nodeA];
      const yPos = nodeA.y ?? 0;

      for (let j = i + 1; j < sortedByY.length; j++) {
        const nodeB = sortedByY[j];
        const yDiff = Math.abs((nodeB.y ?? 0) - yPos);

        if (yDiff > this.alignmentThreshold) {
          break;
        }

        if (!processed.has(nodeB.id)) {
          alignedGroup.push(nodeB);
        }
      }

      if (alignedGroup.length >= 2) {
        const averageY =
          alignedGroup.reduce((sum, node) => sum + (node.y ?? 0), 0) / alignedGroup.length;

        candidates.push({
          nodes: alignedGroup,
          type: 'horizontal',
          averagePosition: averageY,
        });

        alignedGroup.forEach((node) => processed.add(node.id));
      }
    }

    return candidates;
  }

  /**
   * Find all groups of nodes that are nearly aligned vertically
   * Nodes are considered vertically aligned if their x-coordinates differ by less than threshold
   */
  findVerticalAlignments(): AlignmentCandidate[] {
    const candidates: AlignmentCandidate[] = [];
    const processed = new Set<string>();

    const sortedByX = [...this.nodes].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

    for (let i = 0; i < sortedByX.length; i++) {
      const nodeA = sortedByX[i];
      if (processed.has(nodeA.id)) {
        continue;
      }

      const alignedGroup: Node[] = [nodeA];
      const xPos = nodeA.x ?? 0;

      for (let j = i + 1; j < sortedByX.length; j++) {
        const nodeB = sortedByX[j];
        const xDiff = Math.abs((nodeB.x ?? 0) - xPos);

        if (xDiff > this.alignmentThreshold) {
          break;
        }

        if (!processed.has(nodeB.id)) {
          alignedGroup.push(nodeB);
        }
      }

      if (alignedGroup.length >= 2) {
        const averageX =
          alignedGroup.reduce((sum, node) => sum + (node.x ?? 0), 0) / alignedGroup.length;

        candidates.push({
          nodes: alignedGroup,
          type: 'vertical',
          averagePosition: averageX,
        });

        alignedGroup.forEach((node) => processed.add(node.id));
      }
    }

    return candidates;
  }

  /**
   * Find all nearly aligned groups (both horizontal and vertical)
   */
  findAllAlignments(): AlignmentCandidate[] {
    const horizontal = this.findHorizontalAlignments();
    const vertical = this.findVerticalAlignments();

    return [...horizontal, ...vertical];
  }
}

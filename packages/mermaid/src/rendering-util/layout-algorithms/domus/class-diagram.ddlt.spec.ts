import { describe, it, expect } from 'vitest';
import type { LayoutData, Node, Edge } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { runDomusRouting } from './domus/runner.js';
import { setLogLevel, log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';

/**
 * DDLT test for class diagram overlap detection.
 *
 * This test simulates a class diagram with:
 * - 1 parent class (Animal) with 4 properties/methods
 * - 3 child classes (Duck, Fish, Zebra) each with 2-3 properties/methods
 *
 * Class diagram nodes are typically tall (contain multiple fields/methods)
 * and can overlap when the layout algorithm doesn't properly account for
 * variable node heights.
 */
function mkNode(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  isGroup = false
): Node {
  return { id, x, y, width, height, isGroup, label: id } as Node;
}

function mkEdge(id: string, start: string, end: string): Edge {
  return { id, start, end, type: 'arrow' } as Edge;
}

describe('DDLT: Class diagram node overlap detection', () => {
  it('detects overlaps when class diagram nodes are placed too close together', () => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');

    // Simulate typical class diagram node sizes:
    // - Animal: parent class with 4 members (taller)
    // - Duck, Fish, Zebra: child classes with 2-3 members each
    const animal = mkNode('Animal', 200, 100, 120, 140); // Tall parent class
    const duck = mkNode('Duck', 100, 300, 100, 100); // Child class
    const fish = mkNode('Fish', 200, 300, 100, 80); // Child class
    const zebra = mkNode('Zebra', 300, 300, 100, 90); // Child class

    // Create edges: all children inherit from Animal
    const edges: Edge[] = [
      mkEdge('Animal-Duck', 'Animal', 'Duck'),
      mkEdge('Animal-Fish', 'Animal', 'Fish'),
      mkEdge('Animal-Zebra', 'Animal', 'Zebra'),
    ];

    const data: LayoutData = {
      nodes: [animal, duck, fish, zebra],
      edges,
      config: {} as any,
    };

    // Validate layout - should have no overlaps with this spacing
    const validation = validateLayout(data);
    log.debug(ORTHO_DEBUG, 'CLASS_DIAGRAM_TEST_VALIDATION', validation);

    // Note: validation.ok may be false due to missing edge points, but we only care about overlaps
    expect(validation.issues.filter((i) => i.type === 'node-overlap')).toHaveLength(0);
  });

  it('detects overlaps when sibling classes are positioned too close', () => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');

    // Create overlapping sibling classes (Duck and Fish overlap)
    const animal = mkNode('Animal', 200, 100, 120, 140);
    const duck = mkNode('Duck', 150, 300, 100, 100);
    const fish = mkNode('Fish', 190, 300, 100, 80); // Overlaps with Duck
    const zebra = mkNode('Zebra', 330, 300, 100, 90);

    const edges: Edge[] = [
      mkEdge('Animal-Duck', 'Animal', 'Duck'),
      mkEdge('Animal-Fish', 'Animal', 'Fish'),
      mkEdge('Animal-Zebra', 'Animal', 'Zebra'),
    ];

    const data: LayoutData = {
      nodes: [animal, duck, fish, zebra],
      edges,
      config: {} as any,
    };

    const validation = validateLayout(data);
    log.debug(ORTHO_DEBUG, 'CLASS_DIAGRAM_OVERLAP_TEST', validation);

    // Should detect the overlap between Duck and Fish
    expect(validation.ok).toBe(false);
    const overlapIssues = validation.issues.filter((i) => i.type === 'node-overlap');
    expect(overlapIssues.length).toBeGreaterThan(0);
    expect(overlapIssues[0].nodeIds).toContain('Duck');
    expect(overlapIssues[0].nodeIds).toContain('Fish');
  });

  it('DOMUS placement produces non-overlapping layout for class-like graph', () => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');

    // Create nodes without initial positions - let DOMUS place them
    // Using realistic sizes from actual class diagram rendering
    const animal = mkNode('Animal', 0, 0, 164, 225);
    const duck = mkNode('Duck', 0, 0, 178, 204);
    const fish = mkNode('Fish', 0, 0, 150, 183);
    const zebra = mkNode('Zebra', 0, 0, 148, 183);

    const edges: Edge[] = [
      mkEdge('Animal-Duck', 'Animal', 'Duck'),
      mkEdge('Animal-Fish', 'Animal', 'Fish'),
      mkEdge('Animal-Zebra', 'Animal', 'Zebra'),
    ];

    const data: LayoutData = {
      nodes: [animal, duck, fish, zebra],
      edges,
      config: {} as any,
    };

    // Run DOMUS with useExistingPositions=false to compute placement
    const result = runDomusRouting(data, {
      useExistingPositions: false,
      gridSpacing: 100,
    });

    expect(result.success).toBe(true);

    // Log the computed positions for debugging
    const positions = data.nodes?.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
    }));
    log.debug(ORTHO_DEBUG, 'CLASS_DIAGRAM_DOMUS_POSITIONS', positions);

    // Validate that DOMUS produced a non-overlapping layout
    const validation = validateLayout(data);
    log.debug(ORTHO_DEBUG, 'CLASS_DIAGRAM_DOMUS_VALIDATION', validation);

    // This is the key assertion - DOMUS should produce non-overlapping layouts
    const overlapIssues = validation.issues.filter((i) => i.type === 'node-overlap');
    if (overlapIssues.length > 0) {
      log.debug(ORTHO_DEBUG, 'CLASS_DIAGRAM_OVERLAPS_FOUND', {
        count: overlapIssues.length,
        issues: overlapIssues,
      });
    }
    expect(overlapIssues).toHaveLength(0);
  });
});

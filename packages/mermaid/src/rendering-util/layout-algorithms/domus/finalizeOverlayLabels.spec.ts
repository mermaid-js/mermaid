import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { finalizeDummyLabelNodesToOverlayLabels } from './finalizeOverlayLabels.js';

describe('finalizeDummyLabelNodesToOverlayLabels', () => {
  it('does not collapse four-point self-loop routes during final dogleg polish', () => {
    const points = [
      { x: 35, y: -12.5 },
      { x: 75, y: -12.5 },
      { x: 75, y: 12.5 },
      { x: 35, y: 12.5 },
    ];
    const layout: LayoutData = {
      config: {} as any,
      nodes: [{ id: 'A', x: 0, y: 0, width: 70, height: 50, isGroup: false } as any],
      edges: [
        {
          id: 'A-A',
          start: 'A',
          end: 'A',
          isLabelEdge: false,
          points: points.map((point) => ({ ...point })),
        } as any,
      ],
    } as any;

    finalizeDummyLabelNodesToOverlayLabels(layout);

    expect((layout.edges as any[])[0].points).toEqual(points);
  });

  it('merges label-node split edges into one edge with overlay label and removes dummy label node', () => {
    const layout: LayoutData = {
      config: {} as any,
      nodes: [
        { id: 'A', x: 0, y: 0, width: 10, height: 10, isGroup: false } as any,
        { id: 'B', x: 100, y: 0, width: 10, height: 10, isGroup: false } as any,
        {
          id: 'edge-label-A-B-e1',
          isEdgeLabel: true,
          isDummy: true,
          label: 'hello',
          x: 50,
          y: 20,
          width: 30,
          height: 12,
          isGroup: false,
        } as any,
      ],
      edges: [
        {
          id: 'e1-to-label',
          start: 'A',
          end: 'edge-label-A-B-e1',
          isLabelEdge: true,
          arrowTypeStart: 'none',
          arrowTypeEnd: 'none',
          points: [
            { x: 5, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 20 },
          ],
        } as any,
        {
          id: 'e1-from-label',
          start: 'edge-label-A-B-e1',
          end: 'B',
          isLabelEdge: true,
          arrowTypeStart: 'none',
          arrowTypeEnd: 'arrow_point',
          points: [
            { x: 50, y: 20 },
            { x: 100, y: 20 },
            { x: 100, y: 0 },
          ],
        } as any,
      ],
    } as any;

    finalizeDummyLabelNodesToOverlayLabels(layout);

    expect((layout.config as any).isLabelNode).toBe(false);
    expect((layout.nodes as any[]).some((n) => n.id === 'edge-label-A-B-e1')).toBe(false);

    const merged = (layout.edges as any[]).find((e) => e.id === 'e1');
    expect(merged).toBeTruthy();
    expect(merged.label).toBe('hello');
    expect(merged.width).toBe(30);
    expect(merged.height).toBe(12);
    expect(merged.x).toBe(50);
    expect(merged.y).toBe(20);
    expect(merged.start).toBe('A');
    expect(merged.end).toBe('B');
    expect(merged.arrowTypeEnd).toBe('arrow_point');
    expect(merged.arrowTypeStart).toBe('none');

    // Final polish may simplify an obstacle-free joined route, but it should
    // keep a valid edge from the original start side to the original end side.
    expect(merged.points).toEqual([
      { x: 5, y: 0 },
      { x: 95, y: 0 },
    ]);
  });
});

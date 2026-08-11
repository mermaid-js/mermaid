import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../types.js';
import { finalizeDummyLabelNodesToOverlayLabels } from './finalizeOverlayLabels.js';

describe('finalizeDummyLabelNodesToOverlayLabels', () => {
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

    // Joined polyline should not duplicate the join point.
    expect(merged.points).toEqual([
      { x: 5, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 20 },
      { x: 100, y: 20 },
      { x: 100, y: 0 },
    ]);
  });

  it('compresses a long labelled dogleg while preserving the label anchor', () => {
    const layout: LayoutData = {
      config: {} as any,
      nodes: [
        {
          id: 'F',
          x: 930.6015625,
          y: 819.5,
          width: 232,
          height: 150,
          isGroup: false,
        } as any,
        {
          id: 'K',
          x: 1186.6015625,
          y: 50,
          width: 91.65625,
          height: 45,
          isGroup: false,
        } as any,
        {
          id: 'edge-label-F-K-L_F_K_0',
          isEdgeLabel: true,
          isDummy: true,
          label: 'Transwell/Wound Healing Assay',
          x: 1186.6015625,
          y: 819.5,
          width: 200,
          height: 21,
          isGroup: false,
        } as any,
      ],
      edges: [
        {
          id: 'L_F_K_0-to-label',
          start: 'F',
          end: 'edge-label-F-K-L_F_K_0',
          isLabelEdge: true,
          points: [
            { x: 1046.6015625, y: 819.5 },
            { x: 1086.6015625, y: 819.5 },
          ],
        } as any,
        {
          id: 'L_F_K_0-from-label',
          start: 'edge-label-F-K-L_F_K_0',
          end: 'K',
          isLabelEdge: true,
          points: [
            { x: 1186.6015625, y: 809 },
            { x: 1186.6015625, y: 789 },
            { x: 1076.6015625, y: 789 },
            { x: 1076.6015625, y: 92.5 },
            { x: 1186.6015625, y: 92.5 },
            { x: 1186.6015625, y: 72.5 },
          ],
        } as any,
      ],
    } as any;

    finalizeDummyLabelNodesToOverlayLabels(layout);

    const merged = (layout.edges as any[]).find((e) => e.id === 'L_F_K_0');
    expect(merged.points.length).toBeLessThan(9);
    expect(merged.points).toContainEqual({ x: 1186.6015625, y: 819.5 });
    expect(merged.points[0]).toEqual({ x: 1046.6015625, y: 819.5 });
    expect(merged.points.at(-1)).toEqual({ x: 1186.6015625, y: 72.5 });
  });
});

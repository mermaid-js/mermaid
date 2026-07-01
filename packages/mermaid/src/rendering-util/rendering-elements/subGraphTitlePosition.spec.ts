import { describe, it, expect } from 'vitest';
import {
  resolveSubGraphTitlePlacement,
  AUTO_POSITION_ORDER,
  type CollisionEdge,
} from './subGraphTitlePosition.js';

// Box centered at (100, 100), 200 wide x 100 tall.
//   left = 0, right = 200, top = 50, bottom = 150
const box = { x: 100, y: 100, width: 200, height: 100 };
const labelSize = { width: 40, height: 16 };

/** A single vertical edge segment at the given x, spanning above/through the box top. */
const verticalEdgeAt = (x: number): CollisionEdge => ({
  points: [
    { x, y: 0 },
    { x, y: 120 },
  ],
});

/** A single vertical edge segment at the given x, spanning through the box bottom. */
const verticalEdgeThroughBottom = (x: number): CollisionEdge => ({
  points: [
    { x, y: 80 },
    { x, y: 200 },
  ],
});

describe('resolveSubGraphTitlePlacement', () => {
  it('places a top-center title identically to the legacy transform', () => {
    const result = resolveSubGraphTitlePlacement({ position: 'top', box, labelSize });
    // legacy: translate(node.x - bbox.width/2, node.y - node.height/2 + topMargin)
    expect(result.position).toBe('top');
    expect(result.x).toBe(100 - 40 / 2); // 80
    expect(result.y).toBe(100 - 100 / 2); // 50
  });

  it('honors the top margin for top positions', () => {
    const result = resolveSubGraphTitlePlacement({
      position: 'top',
      box,
      labelSize,
      margins: { top: 8 },
    });
    expect(result.y).toBe(50 + 8);
  });

  it('places explicit corner positions at the box corners', () => {
    const tl = resolveSubGraphTitlePlacement({ position: 'top-left', box, labelSize });
    expect(tl).toMatchObject({ position: 'top-left', x: 0, y: 50 });

    const tr = resolveSubGraphTitlePlacement({ position: 'top-right', box, labelSize });
    expect(tr).toMatchObject({ position: 'top-right', x: 200 - 40, y: 50 });

    const bl = resolveSubGraphTitlePlacement({ position: 'bottom-left', box, labelSize });
    expect(bl).toMatchObject({ position: 'bottom-left', x: 0, y: 150 - 16 });

    const br = resolveSubGraphTitlePlacement({ position: 'bottom-right', box, labelSize });
    expect(br).toMatchObject({ position: 'bottom-right', x: 200 - 40, y: 150 - 16 });

    const b = resolveSubGraphTitlePlacement({ position: 'bottom', box, labelSize });
    expect(b).toMatchObject({ position: 'bottom', x: 80, y: 150 - 16 });
  });

  it('honors the bottom margin for bottom positions', () => {
    const result = resolveSubGraphTitlePlacement({
      position: 'bottom',
      box,
      labelSize,
      margins: { bottom: 10 },
    });
    expect(result.y).toBe(150 - 16 - 10);
  });

  it('falls back to top for an unknown position (e.g. a malformed config value)', () => {
    const result = resolveSubGraphTitlePlacement({
      position: 'middle' as never,
      box,
      labelSize,
    });
    expect(result).toMatchObject({ position: 'top', x: 80, y: 50 });
  });

  it('explicit positions ignore edge collisions', () => {
    const result = resolveSubGraphTitlePlacement({
      position: 'top',
      box,
      labelSize,
      // An edge straight through the top-center label — but the user asked for `top` explicitly.
      edges: [verticalEdgeAt(100)],
    });
    expect(result.position).toBe('top');
  });

  describe('auto', () => {
    it('resolves to top when there are no edges', () => {
      const result = resolveSubGraphTitlePlacement({ position: 'auto', box, labelSize, edges: [] });
      expect(result.position).toBe('top');
      expect(result).toMatchObject({ x: 80, y: 50 });
    });

    it('resolves to top when no edge collides with the top-center label', () => {
      // Edge enters far to the left, nowhere near the centered top label ([80,50]-[120,66]).
      const result = resolveSubGraphTitlePlacement({
        position: 'auto',
        box,
        labelSize,
        edges: [verticalEdgeAt(10)],
      });
      expect(result.position).toBe('top');
    });

    it('moves to top-left when an edge crosses the top-center label', () => {
      const result = resolveSubGraphTitlePlacement({
        position: 'auto',
        box,
        labelSize,
        edges: [verticalEdgeAt(100)],
      });
      expect(result.position).toBe('top-left');
    });

    it('skips to bottom when top and top-left are both blocked', () => {
      const result = resolveSubGraphTitlePlacement({
        position: 'auto',
        box,
        labelSize,
        edges: [verticalEdgeAt(100), verticalEdgeAt(15)],
      });
      expect(result.position).toBe('bottom');
    });

    it('follows the documented fallback order', () => {
      expect(AUTO_POSITION_ORDER).toEqual([
        'top',
        'top-left',
        'bottom',
        'bottom-left',
        'top-right',
        'bottom-right',
      ]);
    });

    it('falls back to top when every candidate position is blocked', () => {
      // Block top / top-left / top-right along the top edge and the three bottom anchors.
      const edges = [
        verticalEdgeAt(100), // top center
        verticalEdgeAt(15), // top-left
        verticalEdgeAt(185), // top-right
        verticalEdgeThroughBottom(100), // bottom center
        verticalEdgeThroughBottom(15), // bottom-left
        verticalEdgeThroughBottom(185), // bottom-right
      ];
      const result = resolveSubGraphTitlePlacement({ position: 'auto', box, labelSize, edges });
      expect(result.position).toBe('top');
    });

    it('ignores edges with fewer than two points', () => {
      const result = resolveSubGraphTitlePlacement({
        position: 'auto',
        box,
        labelSize,
        edges: [{ points: [{ x: 100, y: 55 }] }, { points: [] }, {}],
      });
      expect(result.position).toBe('top');
    });
  });
});

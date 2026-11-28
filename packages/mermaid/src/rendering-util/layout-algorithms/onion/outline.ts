import type { Node } from '../../types.js';
import { hexagonPointFactor, hexagonPoints } from '../../rendering-elements/shapes/hexagon.js';
import { leanLeftPoints } from '../../rendering-elements/shapes/leanLeft.js';
import { leanRightPoints } from '../../rendering-elements/shapes/leanRight.js';
import type { Vec } from './geometry.js';

/** Corners used to approximate a round outline. */
const ROUND_STEPS = 24;

const ROUND_SHAPES = new Set(['circle', 'doublecircle', 'sm-circ', 'fr-circ', 'dbl-circ']);
const DIAMOND_SHAPES = new Set(['diamond', 'question', 'decision', 'diam']);

/** A shape's own points, drawn in a `w` by `h` box from the bottom-left, moved to centre on 0. */
function centred(points: readonly Vec[], w: number, h: number): Vec[] {
  return points.map((p) => ({ x: p.x - w / 2, y: p.y + h / 2 }));
}

/**
 * Convex outline a leaf node is drawn with, relative to its centre, for a measured box of
 * `width` by `height`. Slanted and pointed shapes reuse the points their painters draw, so an
 * edge clipped to this outline ends where the painter's own `intersect` would end it. Shapes
 * without a polygon of their own fall back to their box, or an ellipse for round ones.
 */
export function nodeOutline(
  node: Pick<Node, 'shape' | 'look'>,
  width: number,
  height: number
): Vec[] {
  const shape = node.shape ?? 'rect';
  if (shape === 'lean_right' || shape === 'lean-r' || shape === 'lean-right') {
    // The painter's band is `w` wide and the slant adds `h / 2` per side: the box is `w + h`.
    const w = Math.max(0, width - height);
    return centred(leanRightPoints(w, height), w, height);
  }
  if (shape === 'lean_left' || shape === 'lean-l' || shape === 'lean-left') {
    const w = Math.max(0, width - height);
    return centred(leanLeftPoints(w, height), w, height);
  }
  if (shape === 'hexagon' || shape === 'hex') {
    const m = height / hexagonPointFactor(node.look);
    return centred(hexagonPoints(width, height, m), width, height);
  }
  if (DIAMOND_SHAPES.has(shape)) {
    return [
      { x: 0, y: -height / 2 },
      { x: width / 2, y: 0 },
      { x: 0, y: height / 2 },
      { x: -width / 2, y: 0 },
    ];
  }
  if (ROUND_SHAPES.has(shape)) {
    return Array.from({ length: ROUND_STEPS }, (_, i) => {
      const a = (2 * Math.PI * i) / ROUND_STEPS;
      return { x: (Math.cos(a) * width) / 2, y: (Math.sin(a) * height) / 2 };
    });
  }
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 },
  ];
}

export const ON_BOUNDARY_TOLERANCE = 1;

export type Axis = 'horizontal' | 'vertical';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: string;
}

const isDiamond = (node: Box) => node.shape === 'diamond' || node.shape === 'question';

/** The axis an edge must travel along to meet the face at `p` head-on; undefined off the boundary. */
export function faceAxis(node: Box, p: { x: number; y: number }): Axis | undefined {
  const dx = Math.abs(p.x - node.x);
  const dy = Math.abs(p.y - node.y);
  const halfW = node.width / 2;
  const halfH = node.height / 2;
  const near = (a: number, b: number) => Math.abs(a - b) <= ON_BOUNDARY_TOLERANCE;
  if (isDiamond(node)) {
    // Each face of a diamond is one vertex; the faces slant, so only the vertices count.
    if (near(dx, halfW) && near(dy, 0)) {
      return 'horizontal';
    }
    return near(dx, 0) && near(dy, halfH) ? 'vertical' : undefined;
  }
  if (near(dx, halfW) && dy <= halfH + ON_BOUNDARY_TOLERANCE) {
    return 'horizontal';
  }
  return near(dy, halfH) && dx <= halfW + ON_BOUNDARY_TOLERANCE ? 'vertical' : undefined;
}

export function lastSegmentAxis(points: { x: number; y: number }[]): Axis {
  const end = points.at(-1)!;
  const before = points.findLast((p) => Math.hypot(p.x - end.x, p.y - end.y) > 1e-6)!;
  return Math.abs(end.y - before.y) < Math.abs(end.x - before.x) ? 'horizontal' : 'vertical';
}

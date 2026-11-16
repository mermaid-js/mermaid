// Keep corner geometry consistent between the initial renderer and any later path rewrite.
export const DEFAULT_EDGE_CORNER_RADIUS = 5;

export function resolveEdgeCornerRadius(value: unknown): number {
  // A useful maximum depends on each corner's angle and adjacent segment lengths, so both rounded
  // path generators clamp the effective radius locally instead of imposing an arbitrary global cap.
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_EDGE_CORNER_RADIUS;
}

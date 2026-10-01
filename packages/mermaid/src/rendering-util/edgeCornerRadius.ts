export const DEFAULT_EDGE_CORNER_RADIUS = 5;

export function resolveEdgeCornerRadius(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_EDGE_CORNER_RADIUS;
}

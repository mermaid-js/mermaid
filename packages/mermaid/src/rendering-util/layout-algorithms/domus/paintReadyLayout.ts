import type { LayoutData } from '../../types.js';

export interface PaintReadyGeometryIssue {
  id: string;
  x: unknown;
  y: unknown;
  width: unknown;
  height: unknown;
}

/**
 * DOMUS repair passes historically read missing coordinates as the origin
 * (`node.x ?? 0`, `node.y ?? 0`). The browser cannot paint that convention:
 * SVG transforms require real finite numbers. This function is the single
 * boundary adapter from "implicit origin" to paint-ready LayoutData.
 */
export function materializeImplicitOriginCoordinates(data: LayoutData): void {
  for (const node of data.nodes ?? []) {
    if (node?.isGroup) {
      continue;
    }
    node.x ??= 0;
    node.y ??= 0;
  }
}

export function findNonFiniteNodeGeometry(data: LayoutData): PaintReadyGeometryIssue[] {
  return (data.nodes ?? [])
    .filter((node) => !node?.isGroup)
    .filter(
      (node) =>
        !Number.isFinite(node.x) ||
        !Number.isFinite(node.y) ||
        !Number.isFinite(node.width) ||
        !Number.isFinite(node.height)
    )
    .map((node) => ({
      id: String(node.id ?? ''),
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    }));
}

export function assertPaintReadyNodeGeometry(data: LayoutData, stage: string): void {
  const issues = findNonFiniteNodeGeometry(data);
  if (issues.length > 0) {
    throw new Error(
      `DOMUS ${stage}: non-finite node geometry before paint: ${JSON.stringify(issues)}`
    );
  }
}

export function preparePaintReadyNodeGeometry(data: LayoutData, stage: string): void {
  materializeImplicitOriginCoordinates(data);
  assertPaintReadyNodeGeometry(data, stage);
}

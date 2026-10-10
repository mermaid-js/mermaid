import type { GridHorizontalAlign, GridVerticalAlign } from '../types.js';
import { log } from '../logger.js';

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const GRID_HORIZONTAL_ALIGNMENTS = [
  'left',
  'center',
  'right',
] as const satisfies readonly GridHorizontalAlign[];

export const GRID_VERTICAL_ALIGNMENTS = [
  'top',
  'center',
  'bottom',
] as const satisfies readonly GridVerticalAlign[];

/** Grid coordinates are one-based author input, not zero-based internal cell indexes. */
export function isValidGridCoordinate(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value) && value > 0
  );
}

export function isGridHorizontalAlign(value: unknown): value is GridHorizontalAlign {
  return (
    typeof value === 'string' && (GRID_HORIZONTAL_ALIGNMENTS as readonly string[]).includes(value)
  );
}

export function isGridVerticalAlign(value: unknown): value is GridVerticalAlign {
  return (
    typeof value === 'string' && (GRID_VERTICAL_ALIGNMENTS as readonly string[]).includes(value)
  );
}

export function validateGridCoordinate(
  placementId: string,
  field: 'row' | 'column',
  value: unknown,
  nodeId = placementId
): asserts value is number | undefined {
  if (value === undefined) {
    return;
  }
  if (!isValidGridCoordinate(value)) {
    const generatedNodeContext = nodeId === placementId ? '' : ` (node "${nodeId}")`;
    const error = new Error(
      `GRID_INVALID_COORDINATE: Invalid ${field} for placement "${placementId}"${generatedNodeContext}`
    ) as Error & {
      code: 'GRID_INVALID_COORDINATE';
      details: Record<string, unknown>;
    };
    error.code = 'GRID_INVALID_COORDINATE';
    error.details = {
      nodeId,
      placementId,
      field,
      value,
    };
    throw error;
  }
}

export function validateGridPlacementCoordinates(
  placements: unknown,
  items: Iterable<{ id: string; metadata?: unknown }>
): void {
  if (typeof placements === 'object' && placements !== null && !Array.isArray(placements)) {
    for (const [placementId, value] of Object.entries(placements)) {
      const placementValues = Array.isArray(value) ? value : [value];
      for (const [index, placementValue] of placementValues.entries()) {
        if (
          typeof placementValue !== 'object' ||
          placementValue === null ||
          Array.isArray(placementValue)
        ) {
          continue;
        }
        const placement = placementValue as Record<string, unknown>;
        const indexedPlacementId = Array.isArray(value) ? `${placementId}[${index}]` : placementId;
        if (Object.hasOwn(placement, 'row')) {
          validateGridCoordinate(indexedPlacementId, 'row', placement.row);
        }
        if (Object.hasOwn(placement, 'column')) {
          validateGridCoordinate(indexedPlacementId, 'column', placement.column);
        }
      }
    }
  }

  for (const item of items) {
    if (
      typeof item.metadata !== 'object' ||
      item.metadata === null ||
      Array.isArray(item.metadata)
    ) {
      continue;
    }
    const metadata = item.metadata as Record<string, unknown>;
    if (Object.hasOwn(metadata, 'row')) {
      validateGridCoordinate(item.id, 'row', metadata.row);
    }
    if (Object.hasOwn(metadata, 'column')) {
      validateGridCoordinate(item.id, 'column', metadata.column);
    }
  }
}

/**
 * Sanitizes the user-keyed placement dictionary without treating authored node IDs as config keys.
 * Only the fixed placement shape crosses the directive trust boundary.
 */
export function sanitizeGridPlacements(dict: Record<string, unknown>): void {
  for (const key of Object.keys(dict)) {
    const value = dict[key];
    if (UNSAFE_OBJECT_KEYS.has(key) || typeof value !== 'object' || value === null) {
      log.debug('sanitize deleting object dictionary entry:', key, value);
      delete dict[key];
      continue;
    }

    const placements = Array.isArray(value) ? value : [value];
    if (
      placements.length === 0 ||
      Object.keys(placements).length !== placements.length ||
      placements.some(
        (placement) =>
          typeof placement !== 'object' || placement === null || Array.isArray(placement)
      )
    ) {
      log.debug('sanitize deleting invalid grid placement sequence:', key, value);
      delete dict[key];
      continue;
    }

    for (const [index, placementValue] of placements.entries()) {
      const placement = placementValue as Record<string, unknown>;
      const placementId = Array.isArray(value) ? `${key}[${index}]` : key;
      for (const placementKey of Object.keys(placement)) {
        if (placementKey === 'row' || placementKey === 'column') {
          validateGridCoordinate(placementId, placementKey, placement[placementKey]);
          continue;
        }
        if (!isValidGridPlacementProperty(placementKey, placement[placementKey])) {
          log.debug('sanitize deleting grid placement property:', placementKey);
          delete placement[placementKey];
        }
      }
    }
  }
}

function isValidGridPlacementProperty(key: string, value: unknown): boolean {
  switch (key) {
    case 'horizontalAlign':
      return isGridHorizontalAlign(value);
    case 'verticalAlign':
      return isGridVerticalAlign(value);
    default:
      return false;
  }
}

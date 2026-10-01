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

export function sanitizeGridPlacements(dict: Record<string, unknown>): void {
  for (const key of Object.keys(dict)) {
    const value = dict[key];
    if (
      UNSAFE_OBJECT_KEYS.has(key) ||
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value)
    ) {
      log.debug('sanitize deleting object dictionary entry:', key, value);
      delete dict[key];
      continue;
    }
    const placement = value as Record<string, unknown>;
    for (const placementKey of Object.keys(placement)) {
      if (!isValidGridPlacementProperty(placementKey, placement[placementKey])) {
        log.debug('sanitize deleting grid placement property:', placementKey);
        delete placement[placementKey];
      }
    }
  }
}

function isValidGridPlacementProperty(key: string, value: unknown): boolean {
  switch (key) {
    case 'row':
    case 'column':
      return isValidGridCoordinate(value);
    case 'horizontalAlign':
      return isGridHorizontalAlign(value);
    case 'verticalAlign':
      return isGridVerticalAlign(value);
    default:
      return false;
  }
}

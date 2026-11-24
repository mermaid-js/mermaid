import type { Edge, LayoutData, Node } from '../../types.js';
import { gridLabelSpanRequirement, type GridLabelSpanRequirement } from './labelGeometry.js';
import type { GridRoutingInstrumentation } from './routerInstrumentation.js';
import type {
  GridCellStack,
  GridContainerId,
  GridForest,
  GridOrientation,
  GridResolvedPlacement,
} from './types.js';
import { ROOT_CONTAINER_ID } from './types.js';

interface GridLabelledEdge {
  edge: Edge;
  labelNode: Node;
}

export interface GridLabelRequirements {
  byContainer: Map<GridContainerId, GridLabelledEdge[]>;
  selfLoops: Map<string, GridLabelSpanRequirement>;
}

export interface GridContainerLabelGaps {
  rowGapAfter: Map<number, number>;
  columnGapAfter: Map<number, number>;
}

export function buildGridLabelRequirements(
  data: LayoutData,
  forest: GridForest,
  metrics?: GridRoutingInstrumentation
): GridLabelRequirements {
  const byContainer = new Map<GridContainerId, GridLabelledEdge[]>();
  const selfLoops = new Map<string, GridLabelSpanRequirement>();

  for (const edge of data.edges) {
    if (!edge.start || !edge.end || !edge.labelNodeId) {
      continue;
    }
    if (metrics) {
      metrics.labelSpacingEdgesExamined++;
    }
    const labelNode = forest.nodeById.get(edge.labelNodeId);
    const source = forest.nodeById.get(edge.start);
    const target = forest.nodeById.get(edge.end);
    if (!labelNode || !source || !target) {
      continue;
    }
    if (edge.start === edge.end) {
      const horizontal = gridLabelSpanRequirement(labelNode, 'H');
      if (horizontal) {
        selfLoops.set(edge.id, horizontal);
      }
      continue;
    }
    const sourceContainer = source.parentId ?? ROOT_CONTAINER_ID;
    const targetContainer = target.parentId ?? ROOT_CONTAINER_ID;
    if (sourceContainer !== targetContainer) {
      continue;
    }
    const entries = byContainer.get(sourceContainer);
    if (entries) {
      entries.push({ edge, labelNode });
    } else {
      byContainer.set(sourceContainer, [{ edge, labelNode }]);
    }
  }

  return { byContainer, selfLoops };
}

function trackOrigins(
  tracks: readonly number[],
  sizes: ReadonlyMap<number, number>,
  gap: number
): Map<number, number> {
  const origins = new Map<number, number>();
  let cursor = 0;
  for (const track of tracks) {
    origins.set(track, cursor);
    cursor += (sizes.get(track) ?? 0) + gap;
  }
  return origins;
}

function crossAxisFits(
  track: number,
  crossSize: number,
  tracks: readonly number[],
  sizes: ReadonlyMap<number, number>,
  gap: number
): boolean {
  const origins = trackOrigins(tracks, sizes, gap);
  const origin = origins.get(track);
  const size = sizes.get(track);
  if (origin === undefined || size === undefined) {
    return false;
  }
  const center = origin + size / 2;
  const low = center - crossSize / 2;
  const high = center + crossSize / 2;
  return tracks.every((other) => {
    if (other === track) {
      return true;
    }
    const otherOrigin = origins.get(other)!;
    const otherEnd = otherOrigin + (sizes.get(other) ?? 0);
    return high <= otherOrigin || low >= otherEnd;
  });
}

function placementByNodeId(cells: ReadonlyMap<string, GridCellStack>) {
  const placements = new Map<string, GridResolvedPlacement>();
  for (const cell of cells.values()) {
    for (const placement of cell.items) {
      placements.set(placement.item.id, placement);
    }
  }
  return placements;
}

function areConsecutive(first: number, second: number, tracks: readonly number[]): boolean {
  const low = Math.min(first, second);
  const high = Math.max(first, second);
  const index = tracks.indexOf(low);
  return index >= 0 && tracks[index + 1] === high;
}

function addGapRequirement(gaps: Map<number, number>, track: number, required: number): void {
  gaps.set(track, Math.max(gaps.get(track) ?? 0, required));
}

export function deriveGridContainerLabelGaps(
  entries: readonly GridLabelledEdge[],
  cells: ReadonlyMap<string, GridCellStack>,
  rowHeights: ReadonlyMap<number, number>,
  columnWidths: ReadonlyMap<number, number>,
  sortedRows: readonly number[],
  sortedColumns: readonly number[],
  configuredRowGap: number,
  configuredColumnGap: number,
  metrics?: GridRoutingInstrumentation
): GridContainerLabelGaps {
  const rowGapAfter = new Map<number, number>();
  const columnGapAfter = new Map<number, number>();
  const placements = placementByNodeId(cells);

  const requirementFor = (
    entry: GridLabelledEdge,
    orientation: GridOrientation
  ): GridLabelSpanRequirement | null => gridLabelSpanRequirement(entry.labelNode, orientation);

  for (const entry of entries) {
    const source = entry.edge.start ? placements.get(entry.edge.start) : undefined;
    const target = entry.edge.end ? placements.get(entry.edge.end) : undefined;
    if (!source || !target) {
      continue;
    }
    if (source.row === target.row && areConsecutive(source.column, target.column, sortedColumns)) {
      const requirement = requirementFor(entry, 'H');
      if (
        requirement &&
        crossAxisFits(source.row, requirement.cross, sortedRows, rowHeights, configuredRowGap)
      ) {
        if (metrics) {
          metrics.labelSpacingEligibleEdges++;
        }
        addGapRequirement(
          columnGapAfter,
          Math.min(source.column, target.column),
          requirement.requiredAlongSpan
        );
      }
      continue;
    }
    if (source.column === target.column && areConsecutive(source.row, target.row, sortedRows)) {
      const requirement = requirementFor(entry, 'V');
      if (
        requirement &&
        crossAxisFits(
          source.column,
          requirement.cross,
          sortedColumns,
          columnWidths,
          configuredColumnGap
        )
      ) {
        if (metrics) {
          metrics.labelSpacingEligibleEdges++;
        }
        addGapRequirement(
          rowGapAfter,
          Math.min(source.row, target.row),
          requirement.requiredAlongSpan
        );
      }
    }
  }

  return { rowGapAfter, columnGapAfter };
}

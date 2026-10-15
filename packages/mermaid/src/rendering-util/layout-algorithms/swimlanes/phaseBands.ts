import type { D3Selection } from '../../../types.js';
import type { LayoutData } from '../../types.js';
import { readPhaseAssignment } from './phases.js';

/** The title strip is as thick as a lane title band plus the room a rotated label needs. */
export const PHASE_TITLE_THICKNESS = 28;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PhaseBand {
  /** The phase id; empty for the band of nodes that name no phase. */
  id: string;
  label: string;
  /** The cell that holds the title, outside the lanes. */
  title: Rect;
  /** Whether the title reads upward, as in the strip left of the lanes. */
  titleReadsUpward: boolean;
  /** The line between this band and the next; the last band has none. */
  separator?: Segment;
}

const hasBox = (node: LayoutData['nodes'][number]): node is Required<typeof node> =>
  [node.x, node.y, node.width, node.height].every(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );

/**
 * Bands in flow order, measured from where the nodes finally are. Measuring the final
 * boxes, not the layering, makes one rule cover TB, BT, LR and RL: the flow axis is X for
 * LR and RL and Y otherwise, and a band runs from the middle of the gap before it to the
 * middle of the gap after it.
 */
export function computePhaseBands(layout: LayoutData): PhaseBand[] {
  const assignment = readPhaseAssignment(layout);
  const nodes = layout.nodes ?? [];
  const lanes = nodes.filter((node) => node.isGroup && !node.parentId && hasBox(node));
  if (!assignment || lanes.length === 0) {
    return [];
  }

  const alongX = layout.direction === 'LR' || layout.direction === 'RL';
  const left = Math.min(...lanes.map((lane) => lane.x! - lane.width! / 2));
  const right = Math.max(...lanes.map((lane) => lane.x! + lane.width! / 2));
  const top = Math.min(...lanes.map((lane) => lane.y! - lane.height! / 2));
  const bottom = Math.max(...lanes.map((lane) => lane.y! + lane.height! / 2));
  const flowStart = alongX ? left : top;
  const flowEnd = alongX ? right : bottom;

  const spans = new Map<number, { start: number; end: number }>();
  for (const node of nodes) {
    if (node.isGroup || !hasBox(node)) {
      continue;
    }
    const start = alongX ? node.x - node.width / 2 : node.y - node.height / 2;
    const end = start + (alongX ? node.width : node.height);
    const band = assignment.bandOf(node.id);
    const span = spans.get(band);
    spans.set(band, {
      start: Math.min(span?.start ?? start, start),
      end: Math.max(span?.end ?? end, end),
    });
  }
  const ordered = [...spans.entries()].sort(([, a], [, b]) => a.start - b.start);

  return ordered.map(([band, span], index) => {
    const previous = ordered[index - 1]?.[1];
    const next = ordered[index + 1]?.[1];
    const start = previous ? (previous.end + span.start) / 2 : flowStart;
    const end = next ? (span.end + next.start) / 2 : flowEnd;
    const phase = assignment.phases[band];
    const title: Rect = alongX
      ? {
          x: start,
          y: top - PHASE_TITLE_THICKNESS,
          width: end - start,
          height: PHASE_TITLE_THICKNESS,
        }
      : {
          x: left - PHASE_TITLE_THICKNESS,
          y: start,
          width: PHASE_TITLE_THICKNESS,
          height: end - start,
        };
    const separator: Segment | undefined = !next
      ? undefined
      : alongX
        ? { x1: end, y1: top - PHASE_TITLE_THICKNESS, x2: end, y2: bottom }
        : { x1: left - PHASE_TITLE_THICKNESS, y1: end, x2: right, y2: end };
    return {
      id: phase?.id ?? '',
      label: phase?.label ?? '',
      title,
      titleReadsUpward: !alongX,
      separator,
    };
  });
}

/** Draws the phase bands: a title strip per band and a line between bands. */
export function paintPhaseBands<T extends SVGElement>(
  layout: LayoutData,
  { element }: { element: D3Selection<T> }
): void {
  const bands = computePhaseBands(layout);
  if (bands.length === 0) {
    return;
  }
  const group = element.append('g').attr('class', 'swimlane-phases');
  // Above the lane backgrounds, so the separators show across the lanes, and under the edges
  // and nodes. The edge group is not necessarily a child of `element`, so move by the node.
  const edgePaths = element.select<SVGGElement>('.edgePaths').node();
  const groupNode = group.node();
  if (edgePaths && groupNode) {
    edgePaths.before(groupNode);
  } else {
    group.lower();
  }
  for (const band of bands) {
    const cell = group.append('g').attr('class', 'swimlane-phase').attr('data-phase', band.id);
    cell
      .append('rect')
      .attr('class', 'swimlane-phase-title')
      .attr('x', band.title.x)
      .attr('y', band.title.y)
      .attr('width', band.title.width)
      .attr('height', band.title.height);
    if (band.label) {
      const centreX = band.title.x + band.title.width / 2;
      const centreY = band.title.y + band.title.height / 2;
      const text = cell
        .append('text')
        .attr('class', 'swimlane-phase-label')
        .attr('x', centreX)
        .attr('y', centreY)
        .text(band.label);
      if (band.titleReadsUpward) {
        text.attr('transform', `rotate(-90 ${centreX} ${centreY})`);
      }
    }
    if (band.separator) {
      group
        .append('line')
        .attr('class', 'swimlane-phase-separator')
        .attr('x1', band.separator.x1)
        .attr('y1', band.separator.y1)
        .attr('x2', band.separator.x2)
        .attr('y2', band.separator.y2);
    }
  }
}

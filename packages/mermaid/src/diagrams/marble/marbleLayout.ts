import type { MarbleDiagramConfig } from '../../config.type.js';
import type {
  MarbleItem,
  MarbleLabel,
  MarbleLane,
  MarbleSpanItem,
  MarbleTimeline,
} from './marbleTypes.js';

/** Font sizes the stylesheet sets, in px. The layout estimates text widths from them. */
export const FONT_SIZE = {
  title: 18,
  lane: 14,
  tick: 12,
  symbol: 12,
  label: 12,
} as const;

/** Labelled symbols take the theme's `cScale` colours in turn, and the themes define twelve. */
export const PALETTE_SIZE = 12;

/** Height of one row of event labels. */
const LABEL_ROW = 18;
/** Room between the axis ticks and the first lane. */
const AXIS_GAP = 14;
const TITLE_GAP = 16;

/** A rough width for a run of text, so labels can be kept apart without measuring the DOM. */
export const estimateTextWidth = (text: string, fontSize: number): number =>
  text.length * fontSize * 0.6;

/**
 * Where a label sits relative to its lane: row 0 directly below, row 1 above, rows 2 and up
 * further below, joined to their marble by a leader line.
 */
export interface PlacedLabel {
  text: string;
  x: number;
  /** The marble the label belongs to, where a leader line starts. */
  anchorX: number;
  row: number;
  colorIndex?: number;
}

export interface LaidOutLane {
  lane: MarbleLane;
  y: number;
  /** How far marbles reach above and below the line; see `laneExtent`. */
  extent: number;
  labels: PlacedLabel[];
  /** Spans whose label fits inside them; the others get a placed label instead. */
  innerSpanLabels: Set<MarbleSpanItem>;
}

export interface MarbleLayout {
  x: (col: number) => number;
  /** y of the axis tick labels, or undefined when there is no axis. */
  axisY?: number;
  /** y of the title, or undefined when there is none. */
  titleY?: number;
  lanes: LaidOutLane[];
  /** Left and right ends of the time scale. */
  left: number;
  right: number;
  /** Lower edge of the last lane, where grid lines stop. */
  bottom: number;
  /** Top of the first lane, where grid lines start. */
  top: number;
}

const labelFor = (item: MarbleItem, labels: Map<string, MarbleLabel>): MarbleLabel | undefined => {
  switch (item.kind) {
    case 'event':
    case 'span':
      return labels.get(item.symbol);
    case 'cancel':
      return labels.get('!');
    case 'error':
      return labels.get('#');
    case 'complete':
      return labels.get('|');
    case 'subscribe':
      return labels.get('^');
    default:
      return undefined;
  }
};

/** The y offset of a label row from its lane's line, clear of marbles reaching `extent`. */
export const labelRowOffset = (row: number, extent: number): number => {
  if (row === 1) {
    return -(extent + 8);
  }
  return extent + 16 + Math.max(0, row - 1) * LABEL_ROW;
};

/** How far right of its column a completion or error inside a `( )` group is drawn, past the stack. */
export const groupedTerminalShift = (radius: number): number => radius + 9;

/** Vertical distance between the centres of two stacked marbles in a `( )` group. */
export const stackPitch = (radius: number): number => 2 * radius + 2;

/** The y offset from the lane's line of marble `index` in a stack of `size`. */
export const stackOffset = (index: number, size: number, radius: number): number =>
  (index - (size - 1) / 2) * stackPitch(radius);

/** How far the lane's marbles reach above and below its line: a radius, or half a stack. */
export const laneExtent = (lane: MarbleLane, radius: number): number =>
  lane.items.reduce(
    (most, item) =>
      item.kind === 'group' && item.size > 1
        ? Math.max(most, ((item.size - 1) * stackPitch(radius)) / 2 + radius)
        : most,
    radius
  );

/**
 * Places a lane's labels left to right, putting each in the first row where it does not
 * overlap the previous label in that row.
 */
const placeLabels = (
  lane: MarbleLane,
  labels: Map<string, MarbleLabel>,
  x: (col: number) => number,
  config: Required<MarbleDiagramConfig>
): Pick<LaidOutLane, 'labels' | 'innerSpanLabels'> => {
  const innerSpanLabels = new Set<MarbleSpanItem>();
  const candidates: { text: string; anchorX: number; colorIndex?: number }[] = [];
  for (const item of lane.items) {
    if (item.kind === 'time') {
      candidates.push({ text: item.text, anchorX: x(item.col) });
      continue;
    }
    const label = labelFor(item, labels);
    if (!label?.text) {
      continue;
    }
    if (item.kind === 'span') {
      const width = x(item.to) - x(item.from);
      if (estimateTextWidth(label.text, FONT_SIZE.label) + 16 < width) {
        innerSpanLabels.add(item);
        continue;
      }
      if (!config.showEventLabels) {
        continue;
      }
      candidates.push({
        text: label.text,
        anchorX: (x(item.from) + x(item.to)) / 2,
        colorIndex: label.colorIndex,
      });
      continue;
    }
    if (config.showEventLabels && 'col' in item) {
      const shift =
        'grouped' in item && item.grouped ? groupedTerminalShift(config.marbleRadius) : 0;
      candidates.push({
        text: label.text,
        anchorX: x(item.col) + shift,
        colorIndex: label.colorIndex,
      });
    }
  }
  candidates.sort((a, b) => a.anchorX - b.anchorX);

  const rowEnds: number[] = [];
  const placed: PlacedLabel[] = candidates.map((candidate) => {
    const half = estimateTextWidth(candidate.text, FONT_SIZE.label) / 2;
    let row = 0;
    while (rowEnds[row] !== undefined && rowEnds[row] > candidate.anchorX - half - 8) {
      row++;
    }
    rowEnds[row] = candidate.anchorX + half;
    return { ...candidate, x: candidate.anchorX, row };
  });
  return { labels: placed, innerSpanLabels };
};

/**
 * Computes where everything goes. Pure, so it can be tested without a DOM: x grows by
 * `columnWidth` per column from 0, lanes stack downwards from the axis.
 */
export const layoutMarble = (
  timeline: MarbleTimeline,
  labelList: MarbleLabel[],
  config: Required<MarbleDiagramConfig>,
  title = ''
): MarbleLayout => {
  const labels = new Map(labelList.map((label) => [label.symbol, label]));
  const x = (col: number) => col * config.columnWidth;
  const radius = config.marbleRadius;
  let y = 0;
  let titleY: number | undefined;
  let axisY: number | undefined;
  if (title) {
    titleY = y;
    y += FONT_SIZE.title + TITLE_GAP;
  }
  if (timeline.ticks.length > 0) {
    axisY = y;
    y += FONT_SIZE.tick + AXIS_GAP;
  }
  const top = y;

  // Every lane gets the same band, tall enough for the lane with the most label rows, so the
  // lane lines stay evenly spaced whichever lanes carry labels.
  const placedLanes = timeline.lanes.map((lane) => ({
    lane,
    extent: laneExtent(lane, radius),
    ...placeLabels(lane, labels, x, config),
  }));
  let above = radius + 6;
  let below = radius + 6;
  for (const { labels: placed, extent } of placedLanes) {
    const rows = placed.reduce((most, label) => Math.max(most, label.row + 1), 0);
    const belowRows = rows === 0 ? 0 : rows === 1 ? 1 : rows - 1;
    above = Math.max(above, extent + 6 + (rows > 1 ? LABEL_ROW : 0));
    below = Math.max(below, extent + 6 + belowRows * LABEL_ROW);
  }
  const pitch = Math.max(config.laneHeight, above + below);
  const offset = (pitch - above - below) / 2 + above;

  const lanes = placedLanes.map(
    ({ lane, extent, labels: placed, innerSpanLabels }): LaidOutLane => {
      const laneY = y + offset;
      y += pitch;
      return { lane, y: laneY, extent, labels: placed, innerSpanLabels };
    }
  );

  return {
    x,
    axisY,
    titleY,
    lanes,
    left: x(0),
    right: x(Math.max(0, timeline.columns - 1)),
    top,
    bottom: y,
  };
};

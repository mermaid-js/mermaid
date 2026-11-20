import type { MarbleDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

/** A position in the diagram source. Lines and columns are 1-based, as Chevrotain reports them. */
export interface SourcePosition {
  line: number;
  column: number;
}

/**
 * A lane's marble string as the parser found it, before the shared time origin is known.
 * `column` is the source column of the first character after the `:` delimiter, so that
 * lanes the author has aligned in the source stay aligned in the diagram.
 */
export interface RawMarbleLine {
  name: string;
  body: string;
  line: number;
  column: number;
}

/** A tick label on the time axis, placed at the column of its first character. */
export interface MarbleTick {
  col: number;
  text: string;
}

/** How a span ends: closed by `]` or an event, cancelled by `x`, or still running (`>`). */
export type MarbleSpanEnd = 'close' | 'cancel' | 'open';

export interface MarbleEventItem {
  kind: 'event';
  symbol: string;
  col: number;
}

export interface MarbleSpanItem {
  kind: 'span';
  /** The fill character (`=` or `~`), which is also the symbol a `label` can name. */
  symbol: string;
  from: number;
  to: number;
  end: MarbleSpanEnd;
}

export interface MarbleTerminalItem {
  /** `complete` is `|`, `error` is `#`, `cancel` is `x`. */
  kind: 'complete' | 'error' | 'cancel';
  col: number;
}

export type MarbleItem = MarbleEventItem | MarbleSpanItem | MarbleTerminalItem;

/** A stretch of columns in which the lane is active, drawn as the lane's line. */
export interface MarbleSegment {
  from: number;
  to: number;
}

export interface MarbleLane {
  name: string;
  items: MarbleItem[];
  segments: MarbleSegment[];
}

/** The diagram after the marble strings have been interpreted. */
export interface MarbleTimeline {
  ticks: MarbleTick[];
  lanes: MarbleLane[];
  /** Columns holding a `/`: the axis is cut there, so time on either side is not continuous. */
  breaks: number[];
  /** Number of columns from the shared origin to the end of the longest lane. */
  columns: number;
}

export interface MarbleLabel {
  symbol: string;
  text: string;
  /** Palette slot, in the order labels were declared. */
  colorIndex: number;
}

export interface MarbleDB extends DiagramDBBase<MarbleDiagramConfig> {
  addLane: (lane: RawMarbleLine) => void;
  setAxis: (axis: RawMarbleLine) => void;
  addLabel: (symbol: string, text: string, position: SourcePosition) => void;
  getLabel: (symbol: string) => MarbleLabel | undefined;
  getLabels: () => MarbleLabel[];
  getTimeline: () => MarbleTimeline;
  getConfig: () => Required<MarbleDiagramConfig>;
  setFrontmatterLineOffset: (offset: number) => void;
  /** Interprets the collected lanes. Called once by the parser after the last statement. */
  build: () => void;
}

/** The subset of theme variables the marble stylesheet reads. */
export interface MarbleStyleOptions {
  fontFamily?: string;
  marbleTitleColor?: string;
  marbleLaneColor?: string;
  marbleLaneLabelColor?: string;
  marbleAxisTextColor?: string;
  marbleGridColor?: string;
  marbleEventFill?: string;
  marbleEventStroke?: string;
  marbleEventTextColor?: string;
  marbleLabelColor?: string;
  marbleSpanFill?: string;
  marbleSpanStroke?: string;
  marbleSpanTextColor?: string;
  marbleCompleteColor?: string;
  marbleErrorColor?: string;
  marbleCancelColor?: string;
  marbleBreakColor?: string;
  marbleBreakBkg?: string;
  [key: string]: unknown;
}

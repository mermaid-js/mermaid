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

/** How a span ends: closed by `]` or an event, cancelled by `!`, or still running (`>`). */
export type MarbleSpanEnd = 'close' | 'cancel' | 'open';

/** Where a value sits in a synchronous group such as `(abc)`: its place and the group's size. */
export interface MarbleStack {
  index: number;
  size: number;
}

export interface MarbleEventItem {
  kind: 'event';
  symbol: string;
  col: number;
  /** Set when the event is one of several emitted together in a `( )` group. */
  stack?: MarbleStack;
}

export interface MarbleSpanItem {
  kind: 'span';
  /** The fill character (`=` or `~`), which is also the symbol a `label` can name. */
  symbol: string;
  from: number;
  to: number;
  end: MarbleSpanEnd;
  /** A subscription lane (`--^---!`) drawn as one span from `^` to `!`; its symbol is `^`. */
  subscription?: boolean;
}

export interface MarbleTerminalItem {
  /** `complete` is `|`, `error` is `#`, `cancel` is `!` (unsubscription). */
  kind: 'complete' | 'error' | 'cancel';
  col: number;
  /** Set when the terminal is part of a `( )` group, in the same frame as its values. */
  grouped?: boolean;
}

/** `^`: the point where the lane is subscribed to. */
export interface MarbleSubscribeItem {
  kind: 'subscribe';
  col: number;
}

/** A synchronous group `( )`: its values share the column of `(`, stacked. */
export interface MarbleGroupItem {
  kind: 'group';
  col: number;
  /** Column of the closing `)`: the group takes as many frames as it has characters. */
  to: number;
  /** Number of values (events) in the group. */
  size: number;
}

/** RxJS time progression such as `9ms` or `1.4s`, drawn as a labelled break in one column. */
export interface MarbleTimeItem {
  kind: 'time';
  col: number;
  text: string;
}

export type MarbleItem =
  | MarbleEventItem
  | MarbleSpanItem
  | MarbleTerminalItem
  | MarbleSubscribeItem
  | MarbleGroupItem
  | MarbleTimeItem;

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

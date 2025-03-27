import type { EventModelingDiagramConfig } from '../../config.type.js';
import type { DiagramDBBase } from '../../diagram-api/types.js';

import type { EmFrame, EventModeling } from '@mermaid-js/parser';

export interface EventModelingDB extends DiagramDBBase<EventModelingDiagramConfig> {
  setOptions: (rawOptString: string) => void;
  getOptions: () => any;

  getAst: () => EventModeling | undefined;
  setAst: (ast: EventModeling) => void;
}

/**
 * Visual
 */

export interface Dimension {
  width: number;
  height: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export type Color = string;

export interface VisualProps {
  fill: Color;
  stroke: Color;
}

export interface TextProps {
  content: string;
  width: number;
  height: number;
}

export interface Box {
  r: number;
  x: number;
  y: number;
  dimension: Dimension;
  leftSibling: boolean;
  swimlane: number;
  visual: VisualProps;
  text: string;
  frame: EmFrame;
  /** Line index */
  index: number;
}

export interface SwimlaneProps {
  index: number;
  label: string;
}

export type Swimlane = {
  r: number;
  y: number;
  height: number;
} & SwimlaneProps;

export interface Relation {
  visual: VisualProps;
  source: Coordinate;
  target: Coordinate;
  sourceBox: Box;
  targetBox: Box;
}

export interface Context {
  boxes: Box[];
  swimlanes: Record<string, Swimlane>;
  relations: Relation[];
  previousFrame?: EmFrame;
  previousSwimlaneNumber?: number;
  maxR: number;
}

/**
 * Commands & Events
 */

export const PositionFrameKind = 'position frame';
export type PositionFrame = {
  index: number;
  frame: EmFrame;
  textProps: TextProps;
} & CommandBase;

export const FramePositionedKind = 'frame positioned';
export type FramePositioned = {
  index: number;
  frame: EmFrame;
  visual: VisualProps;
  swimlaneIndex: number;
  swimlaneLabel: string;
  dimension: Dimension;
  textProps: TextProps;
} & EventBase;

export const PositionRelationKind = 'position relation';
export type PositionRelation = {
  index: number;
  frame: EmFrame;
  sourceFrame?: EmFrame;
} & CommandBase;

export const RelationPositionedKind = 'relation positioned';
export type RelationPositioned = {
  index: number;
  frame: EmFrame;
  sourceBox: Box;
  targetBox: Box;
} & EventBase;

/**
 * Decider & Event Sourcing support
 */

export type Command = PositionFrame | PositionRelation;
export type Event = FramePositioned | RelationPositioned;
export interface CommandBase {
  $kind: string;
}
export interface EventBase {
  $kind: string;
}

export type DecideFn = (state: Context, command: Command) => Event[];
export type EvolveFn = (state: Context, event: Event) => Context;

export type Deciders = Record<string, DecideFn>;
export type Evolvers = Record<string, EvolveFn>;

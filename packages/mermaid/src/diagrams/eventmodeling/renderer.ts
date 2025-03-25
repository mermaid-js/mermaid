import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
// import utils from '../../utils.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
// import type d3 from 'd3';
import type { EventModelingDB } from './types.js';
// import { commitType } from './types.js';

interface BranchPosition {
  pos: number;
  index: number;
}

interface CommitPosition {
  x: number;
  y: number;
}

// interface CommitPositionOffset extends CommitPosition {
//   posWithOffset: number;
// }

const DEFAULT_CONFIG = getConfig();
const DEFAULT_GITGRAPH_CONFIG = DEFAULT_CONFIG?.gitGraph;

const branchPos = new Map<string, BranchPosition>();
const commitPos = new Map<string, CommitPosition>();

const allCommitsDict = new Map();

const clear = () => {
  branchPos.clear();
  commitPos.clear();
  allCommitsDict.clear();
  // maxPos = 0;
  // lanes = [];
  // dir = 'LR';
};

import type {
  EmFrame,
  // DataType,
  // ModelEntityType
} from '@mermaid-js/parser';
// import { isModelEntityType } from '@mermaid-js/parser';

/**
 * so far no magic, just fixed dimensions. We improve later
 */
function calculateFixedDimension(): Dimension {
  return {
    width: 150,
    height: 80,
  };
}

export interface Dimension {
  width: number;
  height: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export type Color = string;

export interface Box {
  r: number;
  x: number;
  y: number;
  dimension: Dimension;
  leftSibling: boolean;
  swimlane: number;
  color: string;
  text: string;
  frame: EmFrame;
  /** Line index */
  index: number;
}

export interface Swimlane {
  index: number;
  r: number;
  y: number;
}

export interface Relation {
  color: string;
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
}

export const PositionFrameKind = 'position frame';
export type PositionFrame = {
  index: number;
  frame: EmFrame;
} & CommandBase;

export const FramePositionedKind = 'frame positioned';
export type FramePositioned = {
  index: number;
  frame: EmFrame;
  color: string;
  swimlane: number;
  dimension: Dimension;
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

export const draw: DrawDefinition = function (txt, id, ver, diagObj) {
  clear();

  log.debug('in eventmodeling renderer', txt + '\n', 'id:', id, ver);
  if (!DEFAULT_GITGRAPH_CONFIG) {
    throw new Error('EventModeling config not found');
  }
  // const rotateCommitLabel = DEFAULT_GITGRAPH_CONFIG.rotateCommitLabel ?? false;
  const db = diagObj.db as EventModelingDB;
  const ast = db.getAst();

  if (!ast) {
    throw new Error('No data for EventModeling');
  }
  // allCommitsDict = db.getCommits();
  // const branches = db.getBranchesAsObjArray();
  // dir = db.getDirection();
  const diagram = select(`[id="${id}"]`);

  const SWIMLANE_DISTANCE = 150;

  const initial: Context = {
    boxes: [],
    swimlanes: {},
    relations: [],
  };

  let state = initial;

  function calculateSwimlanePosition(frame: EmFrame) {
    switch (frame.modelEntityType) {
      case 'scn':
      case 'job':
        return 0;
      case 'rmo':
      case 'cmd':
        return 1;
      case 'evt':
      default:
        return 2;
    }
  }

  function calculateEntityColor(frame: EmFrame): Color {
    switch (frame.modelEntityType) {
      case 'scn':
        return '#adacae';
      case 'job':
        return '#ab71f4';
      case 'rmo':
        return '#d9f79e';
      case 'cmd':
        return '#a7ccf5';
      case 'evt':
        return '#f79948';
      default:
        return 'red';
    }
  }

  function decidePositionFrame(state: Context, _command: Command): Event[] {
    const command = _command as PositionFrame;

    const color = calculateEntityColor(command.frame);
    const swimlane = calculateSwimlanePosition(command.frame);
    const dimension = calculateFixedDimension();

    const event: FramePositioned = {
      $kind: FramePositionedKind,
      frame: command.frame,
      index: command.index,
      color,
      swimlane,
      dimension,
    };
    return [event];
  }

  const BOX_PADDING = 20;
  const BOX_OVERLAP = 50;
  // const SWIMLANE_PADDING = 30;
  const DEFAULT_Y = 0;

  function calculateX(
    swimlane: Partial<Swimlane>,
    previousSwimlane: Swimlane | undefined,
    lastBox: Box | undefined,
    event: FramePositioned
  ): number {
    // log.debug(`calculateX`, { previousSwimlane,swimlane:event.swimlane,r: swimlane.r,lbr:lastBox?.r});
    if (previousSwimlane === undefined) {
      return 0;
    }
    if (previousSwimlane.index === event.swimlane && swimlane.r) {
      return swimlane.r + BOX_PADDING;
    }

    if (lastBox === undefined) {
      return 0;
    }

    return lastBox.r - BOX_OVERLAP + BOX_PADDING;
  }

  function evolveFramePositioned(state: Context, _event: Event): Context {
    const event: FramePositioned = _event as FramePositioned;

    // const { frame } = event;
    let swimlane: Swimlane;
    if (state.swimlanes.hasOwnProperty(event.swimlane)) {
      swimlane = state.swimlanes[event.swimlane];
    } else {
      swimlane = {
        index: event.swimlane,
        r: 0,
        y: event.swimlane * SWIMLANE_DISTANCE,
      };
    }

    const lastBox = state.boxes.length > 0 ? state.boxes[state.boxes.length - 1] : undefined;
    const previousSwimlane =
      state.previousSwimlaneNumber !== undefined
        ? state.swimlanes[state.previousSwimlaneNumber]
        : undefined;
    const x = calculateX(swimlane, previousSwimlane, lastBox, event);
    const r = x + event.dimension.width;

    const box: Box = {
      x,
      y: swimlane.y || DEFAULT_Y,
      r,
      dimension: event.dimension,
      leftSibling: false,
      swimlane: event.swimlane,
      color: event.color,
      text: event.frame.entityIdentifier,
      frame: event.frame,
      index: event.index,
    };

    swimlane.r = x + event.dimension.width;

    const newState = {
      ...state,
      boxes: [...state.boxes, box],
      swimlanes: {
        ...state.swimlanes,
        [`${swimlane.index}`]: swimlane,
      },
      previousSwimlaneNumber: event.swimlane,
      previousFrame: event.frame,
    };
    return newState;
  }

  function isFirstFrame(index: number, frame: EmFrame): boolean {
    if (index === 0 && frame.sourceFrame === undefined) {
      return true;
    }
    return false;
  }

  function hasSourceFrame(frame: EmFrame): boolean {
    return frame.sourceFrame !== undefined && frame.sourceFrame !== null;
  }

  function findBoxByFrame(boxes: Box[], frame: EmFrame | undefined): Box | undefined {
    if (frame === undefined || frame === null) {
      return undefined;
    }
    return boxes.find((box) => box.frame.name === frame.name);
  }

  function findBoxByLineIndex(
    boxes: Box[],
    targetSwimlane: number,
    lineIndex: number
  ): Box | undefined {
    if (lineIndex < 0) {
      return undefined;
    }

    // boxes.find((box) => box.index === lineIndex);
    for (let i = lineIndex; i >= 0; i--) {
      const box = boxes[i];
      if (box.swimlane !== targetSwimlane) {
        return box;
      }
    }
    return undefined;
  }

  function decidePositionRelation(state: Context, _command: Command): Event[] {
    const command = _command as PositionRelation;

    if (isFirstFrame(command.index, command.frame)) {
      return [];
    }

    const targetBox = findBoxByFrame(state.boxes, command.frame);

    if (targetBox === undefined) {
      throw new Error(`Target box not found for frame ${command.frame.name}`);
    }

    let sourceBox;
    if (command.sourceFrame) {
      sourceBox = findBoxByFrame(state.boxes, command.sourceFrame);
    } else {
      sourceBox = findBoxByLineIndex(state.boxes, targetBox.swimlane, command.index - 1);
    }

    if (sourceBox === undefined) {
      throw new Error(`Source box not found for frame ${command.frame.name}`);
    }
    const event: RelationPositioned = {
      $kind: RelationPositionedKind,
      frame: command.frame,
      index: command.index,
      sourceBox,
      targetBox,
    };
    return [event];
  }

  function evolveRelationPositioned(state: Context, _event: Event): Context {
    const event = _event as RelationPositioned;

    const relation: Relation = {
      color: '#000',
      source: {
        x: event.sourceBox.x,
        y: event.sourceBox.y,
      },
      target: {
        x: event.targetBox.x,
        y: event.targetBox.y,
      },
      sourceBox: event.sourceBox,
      targetBox: event.targetBox,
    };

    const newState = {
      ...state,
      relations: [...state.relations, relation],
    };
    return newState;
  }

  const deciders: Deciders = {
    [PositionFrameKind]: decidePositionFrame,
    [PositionRelationKind]: decidePositionRelation,
  };

  const evolvers: Evolvers = {
    [FramePositionedKind]: evolveFramePositioned,
    [RelationPositionedKind]: evolveRelationPositioned,
  };

  function decide(state: Context, command: Command): Event[] {
    const fn = deciders[command.$kind];
    if (fn === undefined || fn === null) {
      return [];
    }

    const events = fn(state, command);
    log.debug(`decided events`, events);
    return events;
  }

  function evolve(state: Context, events: Event[]): Context {
    const newState = events.reduce((previousState, event) => {
      const fn = evolvers[event.$kind];
      if (fn === undefined || fn === null) {
        return previousState;
      }
      return fn(previousState, event);
    }, state);
    log.debug(`evolve events`, { state, newState, events });
    return newState;
  }

  function dispatch(state: Context, command: Command): Context {
    const events = decide(state, command);
    const newState = evolve(state, events);
    return newState;
  }

  ast.frames.forEach((frame: EmFrame, index: number) => {
    state = dispatch(state, {
      $kind: PositionFrameKind,
      index,
      frame,
    });

    let sourceFrame = undefined;
    if (hasSourceFrame(frame)) {
      sourceFrame = ast.frames.find(
        (currentFrame: EmFrame) => currentFrame.name === frame.sourceFrame?.$refText
      );
    }

    state = dispatch(state, {
      $kind: PositionRelationKind,
      index,
      frame,
      sourceFrame,
    });
  });

  function renderD3Box(box: Box) {
    const g = diagram.append('g');

    g.append('rect')
      .attr('x', box.x)
      .attr('y', box.y)
      .attr('width', box.dimension.width)
      .attr('height', box.dimension.height)
      .attr('fill', box.color);
    // .attr('stroke', '#000');

    g.append('text')
      .attr('font-weight', 'bold')
      .attr('x', box.x + 10)
      .attr('y', box.y + 20)
      .text(box.text);
  }

  function dirUpwards(sourceY: number, targetY: number): boolean {
    return sourceY > targetY;
  }

  function renderD3Relation(relation: Relation) {
    const upwards = dirUpwards(relation.sourceBox.y, relation.targetBox.y);

    const sourceX = relation.sourceBox.x + (relation.sourceBox.dimension.width * 2) / 3;
    const targetX = relation.targetBox.x + relation.targetBox.dimension.width / 3;

    let sourceY;
    let targetY;

    log.debug(`rendering relation up=${upwards} for `, {
      sourceBox: relation.sourceBox,
      targetBox: relation.targetBox,
    });
    if (upwards) {
      sourceY = relation.sourceBox.y;
      targetY = relation.targetBox.y + relation.targetBox.dimension.height;
    } else {
      sourceY = relation.sourceBox.y + relation.sourceBox.dimension.height;
      targetY = relation.targetBox.y;
    }

    diagram
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', relation.color)
      .attr('stroke-width', '1')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('d', `M${sourceX} ${sourceY} L${targetX} ${targetY}`);
  }

  state.boxes.forEach(renderD3Box);
  state.relations.forEach(renderD3Relation);

  const marker = diagram
    .append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('markerWidth', '10')
    .attr('markerHeight', '7')
    .attr('refX', '10')
    .attr('refY', '3.5')
    .attr('orient', 'auto');

  marker.append('polygon').attr('points', '0 0, 10 3.5, 0 7').attr('fill', '#000');

  // utils.insertTitle(
  //   diagram,
  //   'gitTitleText',
  //   DEFAULT_GITGRAPH_CONFIG.titleTopMargin ?? 0,
  //   db.getDiagramTitle()
  // );
  //
  // Setup the view box and size of the svg element
  setupGraphViewbox(
    undefined,
    diagram,
    DEFAULT_GITGRAPH_CONFIG.diagramPadding,
    DEFAULT_GITGRAPH_CONFIG.useMaxWidth
  );
};

export default {
  draw,
};

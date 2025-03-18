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
  Frame,
  // DataType,
  // ModelEntityType
} from '@mermaid-js/parser';
// import { isModelEntityType } from '@mermaid-js/parser';

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

  type Color = string;

  function calculateSwimlanePosition(frame: Frame) {
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

  function calculateEntityColor(frame: Frame): Color {
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

  interface Dimension {
    width: number;
    height: number;
  }
  /**
   * so far no magic, just fixed dimensions. We improve later
   */
  function calculateFixedDimension(): Dimension {
    return {
      width: 150,
      height: 80,
    };
  }

  interface Box {
    r: number;
    x: number;
    y: number;
    dimension: Dimension;
    leftSibling: boolean;
    swimlane: number;
    color: string;
    text: string;
  }

  interface Swimlane {
    index: number;
    r: number;
    y: number;
  }

  interface Context {
    boxes: Box[];
    swimlanes: Record<string, Swimlane>;
    previousFrame?: Frame;
    previousSwimlaneNumber?: number;
  }
  const initial: Context = {
    boxes: [],
    swimlanes: {},
  };

  let state = initial;

  const PositionFrameKind = 'position frame';
  interface PositionFrame {
    $kind: string;
    index: number;
    frame: Frame;
  }

  const FramePositionedKind = 'frame positioned';
  interface FramePositioned {
    $kind: string;
    index: number;
    frame: Frame;
    color: string;
    swimlane: number;
    dimension: Dimension;
  }
  type Command = PositionFrame;
  type Event = FramePositioned;

  function decidePositionFrame(state: Context, command: PositionFrame): Event[] {
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
    // console.debug(`calculateX`, { previousSwimlane,swimlane:event.swimlane,r: swimlane.r,lbr:lastBox?.r});
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

  function evolveFramePositioned(state: Context, event: FramePositioned): Context {
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
    };

    swimlane.r = x + event.dimension.width;

    const newState = {
      boxes: [...state.boxes, box],
      swimlanes: {
        ...state.swimlanes,
        [`${swimlane.index}`]: swimlane,
      },
      previousSwimlaneNumber: event.swimlane,
    };
    return newState;
  }

  type DecideFn = (state: Context, command: Command) => Event[];
  type EvolveFn = (state: Context, event: Event) => Context;

  type Deciders = Record<string, DecideFn>;
  type Evolvers = Record<string, EvolveFn>;

  const deciders: Deciders = {
    [PositionFrameKind]: decidePositionFrame,
  };

  const evolvers: Evolvers = {
    [FramePositionedKind]: evolveFramePositioned,
  };

  function decide(state: Context, command: Command): Event[] {
    const fn = deciders[command.$kind];
    if (fn === undefined || fn === null) {
      return [];
    }

    const events = fn(state, command);
    // console.debug(`decided events`, events);
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
    // console.debug(`evolve events`, { state,newState,events});
    return newState;
  }

  ast.frames.forEach((frame: Frame, index: number) => {
    const events = decide(state, {
      $kind: PositionFrameKind,
      index,
      frame,
    });

    state = evolve(state, events);
  });

  function renderD3Box(box: Box) {
    const g = diagram.append('g');

    g.append('rect')
      .attr('x', box.x)
      .attr('y', box.y)
      .attr('width', box.dimension.width)
      .attr('height', box.dimension.height)
      .attr('fill', box.color)
      .attr('stroke', '#000');

    g.append('text')
      .attr('font-weight', 'bold')
      .attr('x', box.x + 10)
      .attr('y', box.y + 20)
      .text(box.text);
  }

  state.boxes.forEach(renderD3Box);

  // let pos = 0;
  //
  // branches.forEach((branch, index) => {
  //   const labelElement = drawText(branch.name);
  //   const g = diagram.append('g');
  //   const branchLabel = g.insert('g').attr('class', 'branchLabel');
  //   const label = branchLabel.insert('g').attr('class', 'label branch-label');
  //   label.node()?.appendChild(labelElement);
  //   const bbox = labelElement.getBBox();
  //
  //   pos = setBranchPosition(branch.name, pos, index, bbox, rotateCommitLabel);
  //   label.remove();
  //   branchLabel.remove();
  //   g.remove();
  // });
  //
  // drawCommits(diagram, allCommitsDict, false);
  // if (DEFAULT_GITGRAPH_CONFIG.showBranches) {
  //   drawBranches(diagram, branches);
  // }
  // drawArrows(diagram, allCommitsDict);
  // drawCommits(diagram, allCommitsDict, true);
  //
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

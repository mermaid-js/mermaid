import type { BaseType, Selection } from 'd3';
import { select } from 'd3';
import { getConfig, setupGraphViewbox } from '../../diagram-api/diagramAPI.js';
import { log } from '../../logger.js';
import { wrapLabel, calculateTextDimensions } from '../../utils.js';
import type { DrawDefinition } from '../../diagram-api/types.js';
// import type d3 from 'd3';

import type { EmFrame, EmDataEntity } from '@mermaid-js/parser';

import type {
  EventModelingDB,
  Box,
  Relation,
  Swimlane,
  SwimlaneProps,
  TextProps,
  VisualProps,
  Command,
  Event,
  Deciders,
  Evolvers,
  Context,
  PositionFrame,
  PositionRelation,
  FramePositioned,
  RelationPositioned,
} from './types.js';
import {
  PositionFrameKind,
  PositionRelationKind,
  FramePositionedKind,
  RelationPositionedKind,
} from './types.js';
import type { TextDimensionConfig } from '../../types.js';

const DEFAULT_CONFIG = getConfig();
const DEFAULT_GITGRAPH_CONFIG = DEFAULT_CONFIG?.gitGraph;

const clear = () => {
  // maxPos = 0;
  // lanes = [];
  // dir = 'LR';
};

const diagramProps = {
  swimlaneMinHeight: 150,
  swimlanePadding: 30,
  swimlaneGap: 30,
  boxPadding: 10,
  boxOverlap: 90,
  boxDefaultY: 0,
  boxMinWidth: 80,
  boxMaxWidth: 450,
  boxMinHeight: 40,
  boxMaxHeight: 450,
  contentStartX: 250,
  textMaxWidth: 450 - 2 * 10,
  boxTextFontWeight: 'bold',
  boxTextPadding: 10,
  swimlaneTextFontWeight: 'bold',
};

const initial: Context = {
  boxes: [],
  swimlanes: {},
  relations: [],
  maxR: 0,
};

function calculateSwimlaneProps(frame: EmFrame): SwimlaneProps {
  switch (frame.modelEntityType) {
    case 'scn':
    case 'job':
      return { index: 0, label: 'UI/Automation' };
    case 'rmo':
    case 'cmd':
      return { index: 1, label: 'Command/Read Model' };
    case 'evt':
    default:
      return { index: 2, label: 'Events' };
  }
}

function calculateEntityVisualProps(frame: EmFrame): VisualProps {
  switch (frame.modelEntityType) {
    case 'scn':
      return {
        fill: 'white',
        stroke: '#dbdada',
      };
    case 'job':
      return {
        fill: '#edb3f6',
        stroke: '#b88cbf',
      };
    case 'rmo':
      return {
        fill: '#cee741',
        stroke: '#a3b732',
      };
    case 'cmd':
      return {
        fill: '#83c6fb',
        stroke: '#679ac3',
      };
    case 'evt':
      return {
        fill: '#fac710',
        stroke: '#c19a0f',
      };
    default:
      return {
        fill: 'red',
        stroke: 'black',
      };
  }
}

function decidePositionFrame(state: Context, _command: Command): Event[] {
  const command = _command as PositionFrame;

  const visual = calculateEntityVisualProps(command.frame);
  const swimlaneProps = calculateSwimlaneProps(command.frame);
  const dimension = {
    width: command.textProps.width + 2 * diagramProps.boxTextPadding,
    height: command.textProps.height + 2 * diagramProps.boxTextPadding,
  };

  const event: FramePositioned = {
    $kind: FramePositionedKind,
    frame: command.frame,
    index: command.index,
    visual: visual,
    swimlaneIndex: swimlaneProps.index,
    swimlaneLabel: swimlaneProps.label,
    dimension,
    textProps: command.textProps,
  };
  return [event];
}

function calculateX(
  swimlane: Partial<Swimlane>,
  previousSwimlane: Swimlane | undefined,
  lastBox: Box | undefined,
  event: FramePositioned
): number {
  // log.debug(`calculateX`, { previousSwimlane,swimlane:event.swimlane,r: swimlane.r,lbr:lastBox?.r});
  if (previousSwimlane === undefined) {
    return diagramProps.contentStartX;
  }
  if (previousSwimlane.index === event.swimlaneIndex && swimlane.r) {
    return swimlane.r + diagramProps.boxPadding;
  }

  if (lastBox === undefined) {
    return diagramProps.contentStartX;
  }

  return lastBox.r - diagramProps.boxOverlap + diagramProps.boxPadding;
}

function calculateMaxRight(swimlanes: Swimlane[], swimlaneR: number): number {
  const rs = [...swimlanes.map((s) => s.r), swimlaneR];
  return Math.max(...rs);
}

function evolveFramePositioned(state: Context, _event: Event): Context {
  const event: FramePositioned = _event as FramePositioned;

  // const { frame } = event;
  let swimlane: Swimlane;
  if (state.swimlanes.hasOwnProperty(event.swimlaneIndex)) {
    swimlane = state.swimlanes[event.swimlaneIndex];
  } else {
    swimlane = {
      index: event.swimlaneIndex,
      label: event.swimlaneLabel,
      r: 0,
      y: event.swimlaneIndex * diagramProps.swimlaneMinHeight + diagramProps.swimlaneGap,
      height: diagramProps.swimlaneMinHeight,
    };
  }
  // let previousSwimlane: Swimlane;
  // const previousSwimlaneIndex = event.swimlaneIndex - 1;
  // if (state.swimlanes.hasOwnProperty(previousSwimlaneIndex)) {
  //   previousSwimlane = state.swimlanes[previousSwimlaneIndex];
  // }

  const lastBox = state.boxes.length > 0 ? state.boxes[state.boxes.length - 1] : undefined;
  const previousSwimlane =
    state.previousSwimlaneNumber !== undefined
      ? state.swimlanes[state.previousSwimlaneNumber]
      : undefined;

  const aboveSwimlane =
    event.swimlaneIndex - 1 >= 0 ? state.swimlanes[event.swimlaneIndex - 1] : undefined;

  const dimension = {
    width:
      Math.max(
        diagramProps.boxMinWidth,
        Math.min(diagramProps.boxMaxWidth, event.dimension.width)
      ) +
      2 * diagramProps.boxPadding,
    height:
      Math.max(
        diagramProps.boxMinHeight,
        Math.min(diagramProps.boxMaxHeight, event.dimension.height)
      ) +
      2 * diagramProps.boxPadding,
  };

  const x = calculateX(swimlane, previousSwimlane, lastBox, event);
  const r = x + dimension.width + diagramProps.boxPadding;
  const maxR = calculateMaxRight(Object.values(state.swimlanes), r);

  swimlane.r = x + dimension.width;
  if (aboveSwimlane) {
    swimlane.height =
      Math.max(diagramProps.swimlaneMinHeight, dimension.height) + 2 * diagramProps.swimlanePadding;
    swimlane.y = aboveSwimlane.y + aboveSwimlane.height + diagramProps.swimlaneGap;
  }

  const box: Box = {
    x,
    y: diagramProps.swimlanePadding + swimlane.y,
    // y: diagramProps.swimlanePadding + (swimlane.y || diagramProps.boxDefaultY),
    r,
    dimension,
    leftSibling: false,
    swimlane: event.swimlaneIndex,
    visual: event.visual,
    text: event.textProps.content,
    frame: event.frame,
    index: event.index,
  };

  const newState = {
    ...state,
    boxes: [...state.boxes, box],
    swimlanes: {
      ...state.swimlanes,
      [`${swimlane.index}`]: swimlane,
    },
    previousSwimlaneNumber: event.swimlaneIndex,
    previousFrame: event.frame,
    maxR,
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
    visual: {
      fill: 'none',
      stroke: '#000',
    },
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

function dirUpwards(sourceY: number, targetY: number): boolean {
  return sourceY > targetY;
}

function renderD3Box(diagram: Selection<BaseType, unknown, HTMLElement, any>) {
  return (box: Box) => {
    const g = diagram.append('g');

    g.append('rect')
      .attr('x', box.x)
      .attr('y', box.y)
      .attr('rx', '3')
      .attr('width', box.dimension.width)
      .attr('height', box.dimension.height)
      .attr('stroke', box.visual.stroke)
      .attr('fill', box.visual.fill);
    // .attr('stroke', '#000');

    // g.append('text')
    //   .attr('font-weight', diagramProps.boxTextFontWeight)
    //   .attr('x', box.x + 10)
    //   .attr('y', box.y + 20)
    //   .text(box.text);

    const f = g
      .append('foreignObject')
      .attr('x', box.x + diagramProps.boxPadding)
      .attr('y', box.y + 10)
      .attr('width', box.dimension.width - 2 * diagramProps.boxPadding)
      .attr('height', box.dimension.height - 2 * diagramProps.boxPadding);

    const text = f
      .append('xhtml:div')
      .style('display', 'table')
      .style('height', '100%')
      .style('width', '100%');

    text
      .append('div')
      .style('display', 'table-cell')
      .style('text-align', 'left')
      .style('vertical-align', 'middle')
      .html(box.text);
  };
}

function renderD3Relation(diagram: Selection<BaseType, unknown, HTMLElement, any>) {
  return (relation: Relation) => {
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
      .attr('fill', relation.visual.fill)
      .attr('stroke', relation.visual.stroke)
      .attr('stroke-width', '1')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('d', `M${sourceX} ${sourceY} L${targetX} ${targetY}`);
  };
}

function renderD3Swimlane(diagram: Selection<BaseType, unknown, HTMLElement, any>, maxR: number) {
  return (swimlane: Swimlane) => {
    const g = diagram.append('g');

    g.append('rect')
      .attr('x', 0)
      .attr('y', swimlane.y)
      .attr('rx', '3')
      .attr('width', maxR + diagramProps.swimlanePadding)
      .attr('height', swimlane.height)
      // .attr('stroke', box.visual.stroke)
      .attr('fill', 'rgb(250,250,250)')
      .attr('stroke', 'rgb(240,240,240)');

    g.append('text')
      .attr('font-weight', diagramProps.swimlaneTextFontWeight)
      .attr('x', 30)
      .attr('y', swimlane.y + 30)
      .text(swimlane.label);
  };
}

function calculateTextProps(frame: EmFrame, dataEntities: EmDataEntity[]): TextProps {
  let content = `<b>${frame.entityIdentifier}</b>`;
  if (frame.dataInlineValue) {
    content += `<br/>${frame.dataInlineValue}`;
  }
  if (frame.dataReference) {
    const dataEntity = dataEntities.find(
      (dataEntity) => dataEntity.name === frame.dataReference?.$refText
    );

    if (dataEntity) {
      let toHtml = dataEntity.dataBlockValue.replaceAll('\n', '<br/>');
      toHtml = toHtml.replaceAll(' ', '&nbsp;');
      content += `<br/>${toHtml}`;
    }
  }

  const wrapLabelConfig = {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
    joinWith: '<br/>',
  };

  content = wrapLabel(content, diagramProps.textMaxWidth, wrapLabelConfig);

  const textDimensionConfig: TextDimensionConfig = {
    fontSize: wrapLabelConfig.fontSize,
    fontWeight: wrapLabelConfig.fontWeight,
    fontFamily: wrapLabelConfig.fontFamily,
  };
  const dimensions = calculateTextDimensions(content, textDimensionConfig);
  const props = {
    content,
    width: dimensions.width,
    height: dimensions.height,
  };
  log.debug(`[${frame.name}] ${frame.entityIdentifier} text`, props);
  return props;
}

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
  const diagram: Selection<BaseType, unknown, HTMLElement, any> = select(`[id="${id}"]`);

  let state = initial;

  ast.frames.forEach((frame: EmFrame, index: number) => {
    const textProps = calculateTextProps(frame, ast.dataEntities);

    state = dispatch(state, {
      $kind: PositionFrameKind,
      index,
      frame,
      textProps,
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

  Object.values(state.swimlanes)
    .sort((a, b) => a.index - b.index)
    .forEach(renderD3Swimlane(diagram, state.maxR));
  state.boxes.forEach(renderD3Box(diagram));
  state.relations.forEach(renderD3Relation(diagram));

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

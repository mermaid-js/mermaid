import { log } from '../../logger.js';
import { cleanAndMerge } from '../../utils.js';
import { wrapLabel, calculateTextDimensions } from '../../utils.js';
import { getConfig as commonGetConfig } from '../../config.js';
import type { TextDimensionConfig } from '../../types.js';
import {
  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  clear as commonClear,
  setDiagramTitle,
  getDiagramTitle,
} from '../common/commonDb.js';
import { sanitizeText } from '../common/common.js';

import DEFAULT_CONFIG from '../../defaultConfig.js';

import type { EventModelingDiagramConfig } from '../../config.type.js';
import type { EventModel } from '@mermaid-js/parser';
import type { EmFrame, EmDataEntity } from '@mermaid-js/parser';
import { isEmResetFrame } from '@mermaid-js/parser';

import type {
  EventModelingDB,
  Box,
  Relation,
  Swimlane,
  SwimlaneProps,
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
  TextProps,
  DiagramProps,
} from './types.js';
import {
  PositionFrameKind,
  PositionRelationKind,
  FramePositionedKind,
  RelationPositionedKind,
} from './types.js';

export const setOptions = function (_rawOptString: string) {
  log.debug('options str', _rawOptString);
};

export const getOptions = function () {
  return {};
};

export const clear = function () {
  reset();
  commonClear();
};

function reset(): void {
  store = {};
}

export const getDirection = function () {
  return 'LR';
};

const DEFAULT_EVENTMODELING_CONFIG: Required<EventModelingDiagramConfig> =
  DEFAULT_CONFIG.eventmodeling;
const getConfig = (): Required<EventModelingDiagramConfig> => {
  const config = cleanAndMerge({
    ...DEFAULT_EVENTMODELING_CONFIG,
    ...commonGetConfig().eventmodeling,
  });
  return config;
};

interface EmStore {
  ast?: EventModel;
}

let store: EmStore = {};

function getState(): Context {
  let state = initial;
  const { ast } = store;
  const diagramProps = getDiagramProps();

  if (!ast) {
    throw new Error('No data for EventModel');
  }

  ast.frames.forEach((frame: EmFrame, index: number) => {
    const textProps = calculateTextProps(frame, ast.dataEntities, diagramProps);

    state = dispatch(state, {
      $kind: PositionFrameKind,
      index,
      frame,
      textProps,
    });

    let sourceFrames = undefined;
    if (hasSourceFrame(frame)) {
      log.debug(`source frame`, frame.sourceFrames);
      sourceFrames = ast.frames.filter((currentFrame: EmFrame) => {
        //@ts-ignore: sf is Reference<EmFrame> but Reference is present in 'langium' package not available in `mermaid` package directly. We might want to re-export it from `parser`.
        return frame.sourceFrames.some((sf) => sf.$refText === currentFrame.name);
      });

      sourceFrames.forEach((sourceFrame: EmFrame) => {
        state = dispatch(state, {
          $kind: PositionRelationKind,
          index,
          frame,
          sourceFrame,
        });
      });
    } else {
      state = dispatch(state, {
        $kind: PositionRelationKind,
        index,
        frame,
      });
    }
  });

  state = {
    ...state,
    sortedSwimlanesArray: sortedSwimlanesArray(state.swimlanes),
  };

  return state;
}

function setAst(ast: EventModel) {
  store.ast = ast;
}

const diagramProps = {
  swimlaneMinHeight: 70,
  swimlanePadding: 15,
  swimlaneGap: 10,
  boxPadding: 10,
  boxOverlap: 90,
  boxDefaultY: 0,
  boxMinWidth: 80,
  boxMaxWidth: 450,
  boxMinHeight: 80,
  boxMaxHeight: 750,
  contentStartX: 250,
  textMaxWidth: 450 - 2 * 10,
  boxTextFontWeight: 'bold',
  boxTextPadding: 10,
  swimlaneTextFontWeight: 'bold',
  labelUiAutomation: 'UI/Automation',
  labelUiAutomationPrefix: 'UI/A: ',
  labelCommandReadModel: 'Command/Read Model',
  labelCommandReadModelPrefix: 'C/RM: ',
  labelEvents: 'Events',
  labelEventsPrefix: 'Stream: ',
};

function getDiagramProps(): DiagramProps {
  return diagramProps;
}

const initial: Context = {
  boxes: [],
  swimlanes: {},
  relations: [],
  maxR: 0,
  sortedSwimlanesArray: [],
};

function extractNamespace(entityIdentifier: string): string | undefined {
  const spl = entityIdentifier.split('.');
  if (spl.length === 2) {
    return spl[0];
  }
  return undefined;
}

function extractName(entityIdentifier: string): string | undefined {
  const spl = entityIdentifier.split('.');
  if (spl.length === 2) {
    return spl[1];
  }
  return entityIdentifier;
}

function findSwimlaneByNamespace(
  swimlanes: Record<string, Swimlane>,
  namespace: string | undefined
): Swimlane | undefined {
  if (!namespace || namespace.length === 0) {
    return undefined;
  }
  return Object.values(swimlanes).find((swimlane) => swimlane.namespace === namespace);
}

function findNextAvailableIndex(
  swimlanes: Record<string, Swimlane>,
  boundaryMin: number,
  boundaryMax: number
): number {
  return (
    Math.max(
      boundaryMin,
      ...Object.keys(swimlanes)
        .filter((key) => {
          const index = Number.parseInt(key);
          return index > boundaryMin && index < boundaryMax;
        })
        .map((key) => Number.parseInt(key))
    ) + 1
  );
}

function calculateSwimlaneProps(
  frame: EmFrame,
  swimlanes: Record<string, Swimlane>
): SwimlaneProps {
  const namespace = extractNamespace(frame.entityIdentifier);
  const sw = findSwimlaneByNamespace(swimlanes, namespace);

  switch (frame.modelEntityType) {
    case 'ui':
    case 'pcr':
    case 'processor':
      if (sw) {
        return {
          index: sw.index,
          label: sw.namespace || diagramProps.labelUiAutomation,
        };
      } else if (namespace) {
        return {
          index: findNextAvailableIndex(swimlanes, 0, 100),
          label: diagramProps.labelUiAutomationPrefix + namespace,
        };
      }
      return { index: 0, label: diagramProps.labelUiAutomation };
    case 'rmo':
    case 'readmodel':
    case 'cmd':
    case 'command':
      if (sw) {
        return {
          index: sw.index,
          label: sw.namespace || diagramProps.labelCommandReadModel,
        };
      } else if (namespace) {
        return {
          index: findNextAvailableIndex(swimlanes, 100, 200),
          label: diagramProps.labelCommandReadModelPrefix + namespace,
        };
      }
      return { index: 100, label: diagramProps.labelCommandReadModel };
    case 'evt':
    case 'event':
    default:
      if (sw) {
        return {
          index: sw.index,
          label: sw.namespace || diagramProps.labelEvents,
        };
      } else if (namespace) {
        return {
          index: findNextAvailableIndex(swimlanes, 200, 300),
          label: diagramProps.labelEventsPrefix + namespace,
        };
      }
      return { index: 200, label: diagramProps.labelEvents };
  }
}

function calculateEntityVisualProps(frame: EmFrame): VisualProps {
  const { themeVariables } = commonGetConfig();
  switch (frame.modelEntityType) {
    case 'ui':
      return {
        fill: themeVariables.emUiFill ?? 'white',
        stroke: themeVariables.emUiStroke ?? '#dbdada',
      };
    case 'pcr':
    case 'processor':
      return {
        fill: themeVariables.emProcessorFill ?? '#edb3f6',
        stroke: themeVariables.emProcessorStroke ?? '#b88cbf',
      };
    case 'rmo':
    case 'readmodel':
      return {
        fill: themeVariables.emReadModelFill ?? '#d3f1a2',
        stroke: themeVariables.emReadModelStroke ?? '#a3b732',
      };
    case 'cmd':
    case 'command':
      return {
        fill: themeVariables.emCommandFill ?? '#bcd6fe',
        stroke: themeVariables.emCommandStroke ?? '#679ac3',
      };
    case 'evt':
    case 'event':
      return {
        fill: themeVariables.emEventFill ?? '#ffb778',
        stroke: themeVariables.emEventStroke ?? '#c19a0f',
      };
    default:
      return {
        fill: 'red',
        stroke: 'black',
      };
  }
}

function calculateTextProps(
  frame: EmFrame,
  dataEntities: EmDataEntity[],
  diagramProps: DiagramProps
): TextProps {
  const config = commonGetConfig();
  const name = sanitizeText(extractName(frame.entityIdentifier) ?? '', config);
  let toHtml: string | undefined;

  const wrapLabelConfig = {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
    joinWith: '<br/>',
  };

  const wrappedName = wrapLabel(name, diagramProps.textMaxWidth, wrapLabelConfig);
  let content = `<b>${wrappedName}</b>`;

  if (frame.dataInlineValue) {
    toHtml = frame.dataInlineValue;
    toHtml = toHtml.substring(toHtml.indexOf('{') + 1);
    toHtml = toHtml.substring(0, toHtml.lastIndexOf('}') - 1);
    toHtml = sanitizeText(toHtml, config);
    toHtml = wrapLabel(toHtml, diagramProps.textMaxWidth, wrapLabelConfig);
    toHtml = toHtml.replaceAll(' ', '&nbsp;');
  }

  if (frame.dataReference) {
    const dataEntity = dataEntities.find(
      (dataEntity) => dataEntity.name === frame.dataReference?.$refText
    );

    if (dataEntity) {
      toHtml = dataEntity.dataBlockValue;
      toHtml = toHtml.substring(toHtml.indexOf('{\n') + 2);
      toHtml = toHtml.substring(0, toHtml.lastIndexOf('}') - 1);
      toHtml = sanitizeText(toHtml, config);
      toHtml = wrapLabel(toHtml, diagramProps.textMaxWidth, wrapLabelConfig);
      toHtml = toHtml.replaceAll(' ', '&nbsp;');
      toHtml += `<br/>`;
    }
  }

  const hasRenderedData = toHtml !== undefined;

  if (hasRenderedData) {
    content += `<br/><br/><code style="text-align: left; display: block;max-width:${diagramProps.textMaxWidth}px">${toHtml}</code>`;
  }

  const textDimensionConfig: TextDimensionConfig = {
    fontSize: wrapLabelConfig.fontSize,
    fontWeight: wrapLabelConfig.fontWeight,
    fontFamily: wrapLabelConfig.fontFamily,
  };
  const dimensions = calculateTextDimensions(content, textDimensionConfig);

  /** this is a temporal workaround until a more complex dimension calculation is in place */
  const calculatedWidthFix = hasRenderedData ? dimensions.width / 3 : dimensions.width;

  const props = {
    content,
    width: calculatedWidthFix,
    height: dimensions.height,
  };
  log.debug(`[${frame.name}] ${frame.entityIdentifier} text`, props);
  return props;
}

function decidePositionFrame(state: Context, _command: Command): Event[] {
  const command = _command as PositionFrame;

  const visual = calculateEntityVisualProps(command.frame);
  const dimension = {
    width: command.textProps.width + 2 * diagramProps.boxTextPadding,
    height: command.textProps.height + 2 * diagramProps.boxTextPadding,
  };

  const event: FramePositioned = {
    $kind: FramePositionedKind,
    frame: command.frame,
    index: command.index,
    visual: visual,
    dimension,
    textProps: command.textProps,
  };
  return [event];
}

function calculateX(
  swimlane: Partial<Swimlane>,
  previousSwimlane: Swimlane | undefined,
  lastBox: Box | undefined
): number {
  // log.debug(`calculateX`, { previousSwimlane,swimlane:event.swimlane,r: swimlane.r,lbr:lastBox?.r});
  if (previousSwimlane === undefined) {
    return diagramProps.contentStartX;
  }
  if (previousSwimlane.index === swimlane.index && swimlane.r) {
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

function sortedSwimlanesArray(swimlanes: Record<string, Swimlane>): Swimlane[] {
  return Object.values(swimlanes).sort((a, b) => a.index - b.index);
}

function evolveFramePositioned(state: Context, _event: Event): Context {
  const event: FramePositioned = _event as FramePositioned;

  const swimlaneProps = calculateSwimlaneProps(event.frame, state.swimlanes);

  let swimlane: Swimlane;
  if (swimlaneProps.index in state.swimlanes) {
    swimlane = state.swimlanes[swimlaneProps.index];
  } else {
    swimlane = {
      index: swimlaneProps.index,
      label: swimlaneProps.label,
      r: 0,
      y: swimlaneProps.index * diagramProps.swimlaneMinHeight + diagramProps.swimlaneGap,
      height: diagramProps.swimlaneMinHeight,
      maxHeight: diagramProps.swimlaneMinHeight,
    };
  }

  const lastBox = state.boxes.length > 0 ? state.boxes[state.boxes.length - 1] : undefined;
  const previousSwimlane =
    state.previousSwimlaneNumber !== undefined
      ? state.swimlanes[state.previousSwimlaneNumber]
      : undefined;

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

  const x = calculateX(swimlane, previousSwimlane, lastBox);
  const r = x + dimension.width + diagramProps.boxPadding;
  const maxR = calculateMaxRight(Object.values(state.swimlanes), r);

  swimlane.r = x + dimension.width;
  swimlane.maxHeight = Math.max(swimlane.maxHeight, dimension.height);
  swimlane.height =
    Math.max(diagramProps.swimlaneMinHeight, swimlane.maxHeight) + 2 * diagramProps.swimlanePadding;

  const box: Box = {
    x,
    y: diagramProps.swimlanePadding + swimlane.y,
    // y: diagramProps.swimlanePadding + (swimlane.y || diagramProps.boxDefaultY),
    r,
    dimension,
    leftSibling: false,
    swimlane: swimlane,
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
    previousSwimlaneNumber: swimlaneProps.index,
    previousFrame: event.frame,
    maxR,
  };

  /** the following swimlane.y recalculation is suboptimal. Additionally
   * the value of Box.y is not taken into account in rendering time.
   * This is fine for the time being, but maybe needs improvement later on.
   */
  const swimlanes = sortedSwimlanesArray(newState.swimlanes);
  if (swimlanes.length > 0) {
    swimlanes[0].y = 0;
  }
  for (let i = 1; i < swimlanes.length; i++) {
    const sw = swimlanes[i];
    const prevSw = swimlanes[i - 1];

    sw.y = prevSw.y + prevSw.height + diagramProps.swimlaneGap;
  }

  return newState;
}

function isFirstFrame(index: number, frame: EmFrame): boolean {
  if (index === 0 && frame.sourceFrames.length === 0) {
    return true;
  }
  return false;
}

function hasSourceFrame(frame: EmFrame): boolean {
  return (
    frame.sourceFrames !== undefined && frame.sourceFrames !== null && frame.sourceFrames.length > 0
  );
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
    if (box.swimlane.index !== targetSwimlane) {
      return box;
    }
  }
  return undefined;
}

function decidePositionRelation(state: Context, _command: Command): Event[] {
  const command = _command as PositionRelation;

  if (isEmResetFrame(command.frame) || isFirstFrame(command.index, command.frame)) {
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
    sourceBox = findBoxByLineIndex(state.boxes, targetBox.swimlane.index, command.index - 1);
  }

  if (sourceBox === undefined) {
    // Source box not found for frame ${command.frame.name}
    return [];
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

export const db: EventModelingDB = {
  getConfig,

  setOptions,
  getOptions,
  clear,

  setAccTitle,
  getAccTitle,
  getAccDescription,
  setAccDescription,
  setDiagramTitle,
  getDiagramTitle,

  setAst,

  getDiagramProps,
  getState,
};

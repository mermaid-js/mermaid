import { getConfig as getGlobalConfig } from '../../diagram-api/diagramAPI.js';
import { sanitizeText } from '../common/common.js';
import {
  clear as commonClear,
  getAccDescription,
  getAccTitle,
  getDiagramTitle,
  setAccDescription,
  setAccTitle,
  setDiagramTitle,
} from '../common/commonDb.js';
import type { WardleyAttitudeKind, WardleyAxesConfig } from './wardleyBuilder.js';
import { WardleyBuilder } from './wardleyBuilder.js';

const builder = new WardleyBuilder();

function textSanitizer(text: string) {
  const config = getGlobalConfig();
  return sanitizeText(text.trim(), config);
}

function getConfig() {
  return getGlobalConfig()['wardley-beta'];
}

function addNode(
  id: string,
  label: string,
  x: number,
  y: number,
  className?: string,
  labelOffsetX?: number,
  labelOffsetY?: number,
  inertia?: boolean,
  sourceStrategy?: 'build' | 'buy' | 'outsource' | 'market' | 'ecosystem'
) {
  builder.addNode({
    id,
    label: textSanitizer(label),
    x,
    y,
    className,
    labelOffsetX,
    labelOffsetY,
    inertia,
    sourceStrategy,
  });
}

function addLink(
  sourceId: string,
  targetId: string,
  dashed = false,
  label?: string,
  flow?: 'forward' | 'backward' | 'bidirectional'
) {
  builder.addLink({
    source: sourceId,
    target: targetId,
    dashed,
    label: label ? textSanitizer(label) : undefined,
    flow,
  });
}

function addTrend(nodeId: string, targetX: number, targetY: number) {
  builder.addTrend({ nodeId, targetX, targetY });
}

function addAnnotation(number: number, coordinates: { x: number; y: number }[], text?: string) {
  builder.addAnnotation({
    number,
    coordinates,
    text: text ? textSanitizer(text) : undefined,
  });
}

function addNote(text: string, x: number, y: number) {
  builder.addNote({
    text: textSanitizer(text),
    x,
    y,
  });
}

function addAccelerator(name: string, x: number, y: number) {
  builder.addAccelerator({
    name: textSanitizer(name),
    x,
    y,
  });
}

function addDeaccelerator(name: string, x: number, y: number) {
  builder.addDeaccelerator({
    name: textSanitizer(name),
    x,
    y,
  });
}

function addAttitude(kind: WardleyAttitudeKind, x1: number, y1: number, x2: number, y2: number) {
  builder.addAttitude({ kind, x1, y1, x2, y2 });
}

function setAnnotationsBox(x: number, y: number) {
  builder.setAnnotationsBox(x, y);
}

function setSize(width: number, height: number) {
  builder.setSize(width, height);
}

function startPipeline(nodeId: string) {
  builder.startPipeline(nodeId);
}

function addPipelineComponent(pipelineNodeId: string, componentId: string) {
  builder.addPipelineComponent(pipelineNodeId, componentId);
}

function updateAxes(partial: WardleyAxesConfig) {
  const sanitized: WardleyAxesConfig = {};
  if (partial.xLabel) {
    sanitized.xLabel = textSanitizer(partial.xLabel);
  }
  if (partial.yLabel) {
    sanitized.yLabel = textSanitizer(partial.yLabel);
  }
  if (partial.stages) {
    sanitized.stages = partial.stages.map((stage) => textSanitizer(stage));
  }
  if (partial.stageBoundaries) {
    sanitized.stageBoundaries = partial.stageBoundaries;
  }
  builder.setAxes(sanitized);
}

function getNode(id: string) {
  return builder.getNode(id);
}

function resolveNodeId(name: string) {
  return builder.resolveNodeId(name);
}

function getWardleyData() {
  return builder.build();
}

function clear() {
  builder.clear();
  commonClear();
}

export default {
  getConfig,
  addNode,
  addLink,
  addTrend,
  addAnnotation,
  addNote,
  addAccelerator,
  addDeaccelerator,
  addAttitude,
  setAnnotationsBox,
  setSize,
  startPipeline,
  addPipelineComponent,
  updateAxes,
  getNode,
  resolveNodeId,
  getWardleyData,
  clear,
  setAccTitle,
  getAccTitle,
  setDiagramTitle,
  getDiagramTitle,
  getAccDescription,
  setAccDescription,
};
